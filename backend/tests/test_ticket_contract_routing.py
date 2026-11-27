"""Ticket contract + routing: canonical fields, server ids, department queues, multi-member assignment."""

import os
import re
import uuid

os.environ["DATABASE_URL"] = "sqlite+pysqlite:///:memory:"
os.environ["OTP_DEBUG"] = "true"
os.environ["JWT_SECRET"] = "test-secret-qmis-erp-ticket-contract-routing"

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import select

from app.core.config import settings
from app.core.database import SessionLocal
from app.main import app
from app.models import Notification
from app.services import ops_collections as svc
from tests.conftest import reset_sqlite_memory_schema

TEACHER = (settings.teacher_seed_email, settings.teacher_seed_password)
PRINCIPAL = (settings.principal_seed_email, settings.principal_seed_password)
HR = (settings.hr_seed_email, settings.hr_seed_password)
HK = ("housekeepingmanager@qmis.edu", "housekeeping123")
MAINT = ("maintenancemanager@qmis.edu", "maintenance123")
TRANSPORT = ("transportmanager@qmis.edu", "transport123")
CANTEEN = ("canteenmanager@qmis.edu", "canteen123")
IT = ("itsupportmanager@qmis.edu", "itsupport123")
BASE = "/api/v1/ops/it-support-tickets"
RAISE = f"{BASE}/raise"
ITEM = f"{BASE}/items"


@pytest.fixture(scope="module")
def client():
    reset_sqlite_memory_schema()
    with TestClient(app) as test_client:
        yield test_client


def _h(client, who):
    response = client.post("/api/v1/auth/login", json={"email": who[0], "password": who[1]})
    assert response.status_code == 200, response.text
    return {"Authorization": f"Bearer {response.json()['access_token']}"}


@pytest.fixture(scope="module")
def hk_staff(client):
    """A second Housekeeping member (same department role, different user)."""
    email = f"hk.staff.{uuid.uuid4().hex[:6]}@example.com"
    created = client.post(
        "/api/v1/hr/staff",
        headers=_h(client, HR),
        json={"id": f"EMP-HK-{uuid.uuid4().hex[:5].upper()}", "name": "Hk Staff Two", "email": email,
              "role": "housekeepingmanager", "department": "Housekeeping"},
    )
    assert created.status_code == 201, created.text
    temporary = created.json()["temporaryPassword"]
    first = _h(client, (email, temporary))
    changed = client.post("/api/v1/auth/change-password", headers=first,
                          json={"current_password": temporary, "new_password": "Secure-Pass-99"})
    assert changed.status_code == 200, changed.text
    headers = _h(client, (email, "Secure-Pass-99"))
    me = client.get("/api/v1/auth/me", headers=headers)
    assert me.status_code == 200, me.text
    return {"email": email, "id": str(me.json()["id"]), "headers": headers}


def _raise(client, headers, department="Housekeeping", **extra):
    body = {"subject": f"Issue {uuid.uuid4().hex[:6]}", "description": "Needs attention.",
            "issueType": "Other", "priority": "High", "department": department, **extra}
    response = client.post(RAISE, json=body, headers=headers)
    assert response.status_code == 201, response.text
    return response.json()


def _list(client, headers):
    response = client.get(BASE, headers=headers)
    assert response.status_code == 200, response.text
    return {row["ticketId"]: row for row in response.json()}


def _assign(client, headers, ticket_id, assignees, **extra):
    return client.post(f"{BASE}/{ticket_id}/assign", json={"assignees": assignees, **extra}, headers=headers)


def _status(client, headers, ticket_id, status, **extra):
    return client.post(f"{BASE}/{ticket_id}/status", json={"status": status, **extra}, headers=headers)


def test_legacy_alias_payload_is_saved_with_canonical_title_and_server_id(client):
    teacher = _h(client, TEACHER)
    response = client.post(
        RAISE,
        json={"title": "Leaking tap in block B", "ticketNumber": "CLIENT-42", "ticketId": "TKT-1999-0001",
              "id": "forged", "category": "Housekeeping", "description": "Water on the floor.",
              "priority": "Medium", "department": "housekeeping"},
        headers=teacher,
    )
    assert response.status_code == 201, response.text
    ticket = response.json()
    assert ticket["subject"] == "Leaking tap in block B"
    assert ticket["issueType"] == "Housekeeping"
    assert ticket["department"] == "Housekeeping" and ticket["assignedTo"] == "Housekeeping Queue"
    assert re.fullmatch(r"TKT-\d{4}-\d{4}", ticket["ticketId"]) and ticket["id"] == ticket["ticketId"]
    assert ticket["ticketId"] not in {"CLIENT-42", "TKT-1999-0001", "forged"}
    for legacy in ("title", "ticketTitle", "ticketNumber", "category"):
        assert legacy not in ticket
    assert ticket["assignees"] == [] and ticket["assigneeUserIds"] == []
    listed = _list(client, _h(client, HK))[ticket["ticketId"]]
    assert listed["subject"] == "Leaking tap in block B" and "title" not in listed


def test_title_alias_counts_as_the_required_subject_and_unknown_department_is_refused(client):
    teacher = _h(client, TEACHER)
    missing = client.post(RAISE, json={"description": "x", "department": "Housekeeping"}, headers=teacher)
    assert missing.status_code == 422
    bad = client.post(RAISE, json={"subject": "x", "description": "y", "department": "Space Station"}, headers=teacher)
    assert bad.status_code == 422


def test_stored_legacy_rows_are_returned_with_canonical_fields(client):
    it = _h(client, IT)
    rows = list(_list(client, it).values())
    legacy = {"ticketNumber": "TKT-LEGACY-0001", "title": "Old printer", "department": "IT Support", "status": "Open"}
    saved = client.put(BASE, json=[*rows, legacy], headers=it)
    assert saved.status_code == 200, saved.text
    listed = _list(client, it)["TKT-LEGACY-0001"]
    assert listed["subject"] == "Old printer" and listed["id"] == "TKT-LEGACY-0001"
    assert "title" not in listed and "ticketNumber" not in listed


def test_server_ids_are_unique_under_repeated_creates(client):
    teacher = _h(client, TEACHER)
    ids = [_raise(client, teacher, department="Transport")["ticketId"] for _ in range(12)]
    assert len(set(ids)) == len(ids)
    serials = [int(value.rsplit("-", 1)[1]) for value in ids]
    assert serials == sorted(serials)


def test_a_number_collision_is_retried_with_the_next_number(client, monkeypatch):
    teacher = _h(client, TEACHER)
    existing = _raise(client, teacher)["ticketId"]
    real_rows = svc._rows
    calls = {"n": 0}

    def stale_rows(db, actor, collection):
        calls["n"] += 1
        if collection == svc.IT_TICKETS and calls["n"] == 1:
            # Simulate a concurrent raiser: this request computes a number that was just taken.
            return [row for row in real_rows(db, actor, collection) if row["ticketId"] != existing]
        return real_rows(db, actor, collection)

    monkeypatch.setattr(svc, "_rows", stale_rows)
    fresh = _raise(client, teacher)["ticketId"]
    assert calls["n"] >= 2
    assert fresh != existing
    assert int(fresh.rsplit("-", 1)[1]) == int(existing.rsplit("-", 1)[1]) + 1


def test_department_queues_are_isolated_and_it_sees_all(client):
    teacher = _h(client, TEACHER)
    hk = _raise(client, teacher, department="Housekeeping")["ticketId"]
    transport = _raise(client, teacher, department="Transport")["ticketId"]
    canteen = _raise(client, teacher, department="Canteen")["ticketId"]

    for who, mine, dept in ((HK, hk, "Housekeeping"), (TRANSPORT, transport, "Transport"), (CANTEEN, canteen, "Canteen")):
        listed = _list(client, _h(client, who))
        assert mine in listed
        assert {row["department"] for row in listed.values()} == {dept}
    assert {hk, transport, canteen} <= set(_list(client, _h(client, IT)))
    assert not ({hk, transport, canteen} & set(_list(client, _h(client, MAINT))))
    assert client.get(BASE, headers=teacher).status_code == 403


def test_notification_recipients_are_the_owning_department_and_it(client):
    ticket = _raise(client, _h(client, TEACHER), department="Canteen")["ticketId"]
    with SessionLocal() as db:
        notes = db.scalars(select(Notification).where(Notification.entity_id == ticket)).all()
    assert {note.role_code for note in notes} == {"canteenmanager", "itsupportmanager"}
    assert all(note.user_id is None for note in notes)


def test_department_head_assigns_multiple_members_with_history(client, hk_staff):
    teacher = _h(client, TEACHER)
    ticket = _raise(client, teacher)
    hk = _h(client, HK)
    members = client.get(f"{BASE}/{ticket['ticketId']}/assignable", headers=hk)
    assert members.status_code == 200, members.text
    member_emails = {row["email"] for row in members.json()}
    assert {HK[0], hk_staff["email"]} <= member_emails
    assert MAINT[0] not in member_emails

    response = _assign(client, hk, ticket["ticketId"], [HK[0], hk_staff["id"]], note="Two people needed")
    assert response.status_code == 200, response.text
    saved = response.json()
    assert len(saved["assignees"]) == 2
    assert hk_staff["id"] in saved["assigneeUserIds"]
    assert {row["email"] for row in saved["assignees"]} == {HK[0], hk_staff["email"]}
    assert saved["status"] == "Assigned"
    assert saved["history"][: len(ticket["history"])] == ticket["history"]
    assert saved["history"][-1]["event"] == "Assigned" and "Two people needed" in saved["history"][-1]["note"]
    assert "Hk Staff Two" in saved["assignedTo"]

    with SessionLocal() as db:
        direct = db.scalars(select(Notification).where(Notification.entity_id == ticket["ticketId"],
                                                       Notification.user_id.is_not(None))).all()
    assert {str(note.user_id) for note in direct} >= {hk_staff["id"]}

    assigned = client.get(f"{BASE}/assigned", headers=hk_staff["headers"])
    assert assigned.status_code == 200
    assert ticket["ticketId"] in {row["ticketId"] for row in assigned.json()}

    it_reassign = _assign(client, _h(client, IT), ticket["ticketId"], [hk_staff["email"]])
    assert it_reassign.status_code == 200, it_reassign.text
    assert it_reassign.json()["assigneeUserIds"] == [hk_staff["id"]]
    assert [entry["event"] for entry in it_reassign.json()["history"]].count("Assigned") == 2

    cleared = _assign(client, hk, ticket["ticketId"], [])
    assert cleared.status_code == 200
    assert cleared.json()["assignees"] == [] and cleared.json()["assignedTo"] == "Housekeeping Queue"
    assert cleared.json()["history"][-1]["event"] == "Unassigned"


def test_only_it_admins_or_the_department_head_may_assign(client, hk_staff):
    ticket = _raise(client, _h(client, TEACHER))["ticketId"]
    for who in (MAINT, TRANSPORT, TEACHER, PRINCIPAL):
        headers = _h(client, who)
        assert _assign(client, headers, ticket, [HK[0]]).status_code == 403
        assert client.get(f"{BASE}/{ticket}/assignable", headers=headers).status_code == 403
    outsider = _assign(client, _h(client, HK), ticket, [MAINT[0]])
    assert outsider.status_code == 422
    assert _assign(client, _h(client, HK), ticket, "not-a-list").status_code == 422
    assert _list(client, _h(client, IT))[ticket]["assignees"] == []


def test_assignee_can_update_status_and_requester_is_told(client, hk_staff):
    ticket = _raise(client, _h(client, TEACHER))["ticketId"]
    assert _assign(client, _h(client, HK), ticket, [hk_staff["id"]]).status_code == 200

    response = _status(client, hk_staff["headers"], ticket, "In Progress", remarks="On my way")
    assert response.status_code == 200, response.text
    saved = response.json()
    assert saved["status"] == "In Progress" and saved["remarks"] == "On my way"
    assert [entry["event"] for entry in saved["history"][-2:]] == ["Status Change", "Remarks"]
    assert saved["history"][-1]["byUserId"] == hk_staff["id"]

    notes = client.get("/api/v1/notifications", headers=_h(client, TEACHER)).json()
    assert [n for n in notes if n.get("entityId") == ticket and "In Progress" in n.get("title", "")]
    assert _status(client, hk_staff["headers"], ticket, "Exploded").status_code == 422


def test_non_assignee_from_another_department_is_denied(client, hk_staff):
    teacher = _h(client, TEACHER)
    ticket = _raise(client, teacher)["ticketId"]
    assert _assign(client, _h(client, HK), ticket, [hk_staff["id"]]).status_code == 200
    assert _status(client, _h(client, MAINT), ticket, "Closed").status_code == 403
    assert _status(client, teacher, ticket, "Closed").status_code == 403
    maint_put = client.put(f"{ITEM}/{ticket}", json={"status": "Closed"}, headers=_h(client, MAINT))
    assert maint_put.status_code == 403
    assert _list(client, _h(client, IT))[ticket]["status"] == "Assigned"


def test_history_and_assignees_cannot_be_rewritten_by_saves(client, hk_staff):
    ticket = _raise(client, _h(client, TEACHER))
    hk = _h(client, HK)
    assigned = _assign(client, hk, ticket["ticketId"], [hk_staff["id"]]).json()
    history = assigned["history"]

    forged = client.put(
        f"{ITEM}/{ticket['ticketId']}",
        json={**assigned, "history": [], "assignees": [{"userId": "x", "email": MAINT[0]}],
              "assigneeUserIds": ["x"], "assignedTo": "Someone Else"},
        headers=hk,
    )
    assert forged.status_code == 200, forged.text
    body = forged.json()
    assert body["history"][: len(history)] == history
    assert body["assigneeUserIds"] == [hk_staff["id"]] and body["assignedTo"] == assigned["assignedTo"]

    it = _h(client, IT)
    rows = [
        {**row, "history": [], "assignees": [], "assigneeUserIds": []} if row["ticketId"] == ticket["ticketId"] else row
        for row in _list(client, it).values()
    ]
    assert client.put(BASE, json=rows, headers=it).status_code == 200
    after = _list(client, it)[ticket["ticketId"]]
    assert after["history"][: len(history)] == history
    assert after["assigneeUserIds"] == [hk_staff["id"]]
