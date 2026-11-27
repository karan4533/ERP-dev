"""Ticket inbox isolation: departments read and update only their own tickets; IT runs the helpdesk."""

import os

os.environ["DATABASE_URL"] = "sqlite+pysqlite:///:memory:"
os.environ["OTP_DEBUG"] = "true"
os.environ["JWT_SECRET"] = "test-secret-qmis-erp-ticket-access-control"

import pytest
from fastapi.testclient import TestClient

from app.core.config import settings
from app.main import app
from tests.conftest import reset_sqlite_memory_schema

TEACHER = (settings.teacher_seed_email, settings.teacher_seed_password)
HK = ("housekeepingmanager@qmis.edu", "housekeeping123")
MAINT = ("maintenancemanager@qmis.edu", "maintenance123")
IT = ("itsupportmanager@qmis.edu", "itsupport123")
RAISE = "/api/v1/ops/it-support-tickets/raise"
LIST = "/api/v1/ops/it-support-tickets"
ITEM = "/api/v1/ops/it-support-tickets/items"


@pytest.fixture()
def client():
    reset_sqlite_memory_schema()
    with TestClient(app) as test_client:
        yield test_client


def _h(client, who):
    response = client.post("/api/v1/auth/login", json={"email": who[0], "password": who[1]})
    assert response.status_code == 200, response.text
    return {"Authorization": f"Bearer {response.json()['access_token']}"}


def _raise(client, headers, department, subject):
    response = client.post(
        RAISE,
        json={"subject": subject, "description": "Needs attention.", "issueType": "Other", "priority": "High", "department": department},
        headers=headers,
    )
    assert response.status_code == 201, response.text
    return response.json()


def _ids(client, headers):
    response = client.get(LIST, headers=headers)
    assert response.status_code == 200, response.text
    return {row["ticketId"]: row for row in response.json()}


@pytest.fixture()
def tickets(client):
    teacher = _h(client, TEACHER)
    return {
        "hk": _raise(client, teacher, "Housekeeping", "Spill in corridor"),
        "facilities": _raise(client, teacher, "Facilities", "Fan not working"),
        "academics": _raise(client, teacher, "Academics", "Projector"),
    }


def test_departments_only_list_their_own_tickets_and_it_sees_all(client, tickets):
    assert set(_ids(client, _h(client, HK))) == {tickets["hk"]["ticketId"]}
    assert set(_ids(client, _h(client, MAINT))) == {tickets["facilities"]["ticketId"]}
    assert set(_ids(client, _h(client, IT))) == {t["ticketId"] for t in tickets.values()}


def test_department_can_update_its_own_ticket_without_rewriting_identity_or_history(client, tickets):
    hk = _h(client, HK)
    ticket = tickets["hk"]
    original_history = ticket["history"]
    response = client.put(
        f"{ITEM}/{ticket['ticketId']}",
        json={
            **ticket,
            "status": "In Progress",
            "assignedTo": "HK Staff A",
            "requesterEmail": "forged@example.com",
            "department": "Facilities",
            "history": [{"at": "now", "event": "Status Change", "note": "Open -> In Progress"}],
        },
        headers=hk,
    )
    assert response.status_code == 200, response.text
    saved = response.json()
    assert saved["status"] == "In Progress" and saved["assignedTo"] == "HK Staff A"
    assert saved["requesterEmail"] == ticket["requesterEmail"]
    assert saved["department"] == "Housekeeping"
    assert saved["history"][: len(original_history)] == original_history
    assert saved["history"][-1]["event"] == "Status Change"


def test_department_cannot_touch_another_departments_ticket(client, tickets):
    hk = _h(client, HK)
    other = tickets["facilities"]
    response = client.put(f"{ITEM}/{other['ticketId']}", json={**other, "status": "Closed"}, headers=hk)
    assert response.status_code == 403
    assert _ids(client, _h(client, IT))[other["ticketId"]]["status"] == "Open"


def test_department_cannot_bulk_replace_or_delete_or_create_tickets(client, tickets):
    hk = _h(client, HK)
    assert client.put(LIST, json=[], headers=hk).status_code == 403
    assert client.delete(f"{ITEM}/{tickets['hk']['ticketId']}", headers=hk).status_code == 403
    created = client.put(f"{ITEM}/TKT-FAKE-1", json={"subject": "x", "department": "Housekeeping"}, headers=hk)
    assert created.status_code == 400
    assert len(_ids(client, _h(client, IT))) == 3


def test_it_whole_list_save_still_works(client, tickets):
    it = _h(client, IT)
    rows = list(_ids(client, it).values())
    rows[0] = {**rows[0], "status": "Closed"}
    saved = client.put(LIST, json=rows, headers=it)
    assert saved.status_code == 200, saved.text
    assert len(saved.json()) == 3


def test_owning_department_is_notified(client, tickets):
    def ticket_notes(headers):
        notes = client.get("/api/v1/notifications", headers=headers).json()
        return {n["entityId"] for n in notes if n.get("entityType") == "it_ticket"}

    assert tickets["hk"]["ticketId"] in ticket_notes(_h(client, HK))
    assert tickets["hk"]["ticketId"] not in ticket_notes(_h(client, MAINT))
    assert tickets["hk"]["ticketId"] in ticket_notes(_h(client, IT))
