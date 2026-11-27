"""TC manager clearance (#46): only the assigned role clears its NOC; admin override with reason."""

import json
import os

os.environ["DATABASE_URL"] = "sqlite+pysqlite:///:memory:"
os.environ["OTP_DEBUG"] = "true"
os.environ["JWT_SECRET"] = "test-secret-qmis-erp-tc-override"
os.environ["ENVIRONMENT"] = "development"

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import select

from app.core.config import settings
from app.core.database import SessionLocal
from app.main import app
from app.models import AuditLog, User
from tests.conftest import reset_sqlite_memory_schema

ADMIN = (settings.admin_seed_email, settings.admin_seed_password)
SUPERADMIN = (settings.superadmin_seed_email, settings.superadmin_seed_password)
LIBRARIAN = ("librarian@qmis.edu", "librarian123")
STORE = ("stationerystoremanager@qmis.edu", "stationery123")
ACCOUNT_HEAD = ("accounthead@qmis.edu", "accounts123")
PRM = (settings.prm_seed_email, settings.prm_seed_password)
TEACHER = (settings.teacher_seed_email, settings.teacher_seed_password)

REASON = "No active Librarian account on this campus; dues verified manually."


@pytest.fixture()
def client():
    reset_sqlite_memory_schema()
    with TestClient(app) as test_client:
        yield test_client


def _login(client, email, password):
    from auth_test_helpers import login_headers

    return login_headers(client, email, password)


def _new_request(client, admin, *, tag: str) -> dict:
    created = client.post(
        "/api/v1/admissions",
        headers=admin,
        json={
            "first_name": f"TcOvr{tag}",
            "last_name": "Student",
            "mobile_number": "9000022222",
            "class_name": "Grade 6",
            "father_name": "Parent Override",
            "parent_account_email": f"parent.tcovr.{tag.lower()}@example.com",
            "fees_group": "RegFeeStatus:Paid",
            "registration_fees": "0",
        },
    )
    assert created.status_code in (200, 201), created.text
    enrolled = client.post(
        f"/api/v1/admissions/{created.json()['id']}/enroll",
        headers=admin,
        json={
            "parent_account_email": f"parent.tcovr.{tag.lower()}@example.com",
            "parent_account_password": "Parent-Test-2026",
        },
    )
    assert enrolled.status_code == 200, enrolled.text
    res = client.post(
        "/api/v1/tc-requests",
        headers=admin,
        json={"studentRef": str(enrolled.json()["student_id"]), "reason": "Relocation.", "transferTo": "KV"},
    )
    assert res.status_code == 201, res.text
    body = res.json()
    assert body["status"] == "Pending Manager NOCs"
    return body


def _override(client, headers, ref, role_code, reason=REASON):
    return client.post(
        f"/api/v1/tc-requests/{ref}/noc/{role_code}/override",
        headers=headers,
        json={"reason": reason} if reason is not None else {},
    )


def _override_audits(ref_uuid: str) -> list[AuditLog]:
    with SessionLocal() as db:
        return list(
            db.scalars(
                select(AuditLog).where(
                    AuditLog.entity_type == "tc_request",
                    AuditLog.entity_id == ref_uuid,
                    AuditLog.action == "TC_NOC_OVERRIDDEN",
                )
            ).all()
        )


def test_wrong_role_cannot_clear_another_roles_noc(client):
    admin = _login(client, ADMIN[0], ADMIN[1])
    body = _new_request(client, admin, tag="A")
    roles = {n["roleCode"] for n in body["nocs"]}
    assert {"librarian", "stationerystoremanager"} <= roles

    # Librarian has tc.noc but must not clear the Store NOC: it only ever touches its own row.
    store_before = next(n for n in body["nocs"] if n["roleCode"] == "stationerystoremanager")
    librarian = _login(client, LIBRARIAN[0], LIBRARIAN[1])
    ok = client.post(
        f"/api/v1/tc-requests/{body['id']}/noc",
        headers=librarian,
        json={"decision": "approve", "remarks": "Library clear"},
    )
    assert ok.status_code == 200, ok.text
    after = {n["roleCode"]: n for n in ok.json()["nocs"]}
    assert after["librarian"]["status"] == "Approved"
    assert after["stationerystoremanager"]["status"] == store_before["status"] == "Pending"

    # A role with no NOC row on this request (Super Admin holds tc.noc) cannot clear anything.
    superadmin = _login(client, SUPERADMIN[0], SUPERADMIN[1])
    assert client.post(
        f"/api/v1/tc-requests/{body['id']}/noc",
        headers=superadmin,
        json={"decision": "approve"},
    ).status_code == 403
    # Roles without tc.noc are refused outright.
    for login in (ADMIN, PRM, TEACHER):
        assert client.post(
            f"/api/v1/tc-requests/{body['id']}/noc",
            headers=_login(client, login[0], login[1]),
            json={"decision": "approve"},
        ).status_code == 403


def test_forward_and_final_decide_blocked_while_nocs_pending(client):
    admin = _login(client, ADMIN[0], ADMIN[1])
    body = _new_request(client, admin, tag="B")
    assert client.post(
        f"/api/v1/tc-requests/{body['id']}/forward", headers=admin, json={"remarks": "early"}
    ).status_code == 409
    assert client.post(
        f"/api/v1/tc-requests/{body['id']}/decide", headers=admin, json={"decision": "approve"}
    ).status_code == 409
    current = client.get(f"/api/v1/tc-requests/{body['id']}", headers=admin).json()
    assert current["status"] == "Pending Manager NOCs"
    assert current["tcNumber"] == ""


def test_override_requires_reason(client):
    admin = _login(client, ADMIN[0], ADMIN[1])
    body = _new_request(client, admin, tag="C")
    assert _override(client, admin, body["id"], "librarian", reason=None).status_code == 422
    assert _override(client, admin, body["id"], "librarian", reason="").status_code == 422
    assert _override(client, admin, body["id"], "librarian", reason="   short  ").status_code == 422
    current = client.get(f"/api/v1/tc-requests/{body['id']}", headers=admin).json()
    lib = next(n for n in current["nocs"] if n["roleCode"] == "librarian")
    assert lib["status"] == "Pending"
    assert lib["overridden"] is False
    assert _override_audits(body["uuid"]) == []


def test_override_records_identity_timestamp_reason_and_audit(client):
    admin = _login(client, ADMIN[0], ADMIN[1])
    body = _new_request(client, admin, tag="D")

    res = _override(client, admin, body["id"], "librarian")
    assert res.status_code == 200, res.text
    out = res.json()
    lib = next(n for n in out["nocs"] if n["roleCode"] == "librarian")
    assert lib["status"] == "Approved"
    assert lib["overridden"] is True
    assert lib["decidedByEmail"] == ADMIN[0]
    assert lib["decidedAt"]
    assert lib["remarks"].endswith(REASON)
    ovr = lib["override"]
    assert ovr["reason"] == REASON
    assert ovr["overriddenByEmail"] == ADMIN[0]
    assert ovr["overriddenByRole"] == "admin"
    assert ovr["overriddenBy"]
    assert ovr["overriddenAt"]
    # Seeded campus has an active librarian, and that fact is recorded.
    assert ovr["activeClearingUserExisted"] is True
    assert out["overriddenNocCount"] == 1
    # Other NOCs are untouched.
    assert next(n for n in out["nocs"] if n["roleCode"] == "stationerystoremanager")["status"] == "Pending"
    assert out["status"] == "Pending Manager NOCs"

    history = [h for h in out["history"] if h["action"] == "TC_NOC_OVERRIDDEN"]
    assert len(history) == 1
    assert history[0]["actorEmail"] == ADMIN[0]
    assert history[0]["actorRole"] == "admin"
    assert history[0]["override"]["reason"] == REASON

    audits = _override_audits(body["uuid"])
    assert len(audits) == 1
    details = json.loads(audits[0].details)
    with SessionLocal() as db:
        admin_user = db.scalar(select(User).where(User.email == ADMIN[0]))
        assert str(audits[0].actor_id) == str(admin_user.id)
    assert details["roleCode"] == "librarian"
    assert details["reason"] == REASON
    assert details["overriddenByEmail"] == ADMIN[0]
    assert details["overriddenByRole"] == "admin"
    assert details["overriddenAt"]
    assert details["activeClearingUserExisted"] is True


def test_override_records_missing_clearing_user(client):
    admin = _login(client, ADMIN[0], ADMIN[1])
    body = _new_request(client, admin, tag="E")
    with SessionLocal() as db:
        store_user = db.scalar(select(User).where(User.email == STORE[0]))
        store_user.is_active = False
        db.commit()
    current = client.get(f"/api/v1/tc-requests/{body['id']}", headers=admin).json()
    store = next(n for n in current["nocs"] if n["roleCode"] == "stationerystoremanager")
    assert store["clearingUserActive"] is False

    superadmin = _login(client, SUPERADMIN[0], SUPERADMIN[1])
    res = _override(client, superadmin, body["id"], "stationerystoremanager", reason="Store Manager post vacant; stock returned.")
    assert res.status_code == 200, res.text
    store = next(n for n in res.json()["nocs"] if n["roleCode"] == "stationerystoremanager")
    assert store["override"]["overriddenByRole"] == "superadmin"
    assert store["override"]["activeClearingUserExisted"] is False


def test_non_admin_override_forbidden(client):
    admin = _login(client, ADMIN[0], ADMIN[1])
    body = _new_request(client, admin, tag="F")
    for login in (LIBRARIAN, STORE, ACCOUNT_HEAD, PRM, TEACHER):
        res = _override(client, _login(client, login[0], login[1]), body["id"], "librarian")
        assert res.status_code == 403, (login[0], res.text)
    current = client.get(f"/api/v1/tc-requests/{body['id']}", headers=admin).json()
    assert next(n for n in current["nocs"] if n["roleCode"] == "librarian")["status"] == "Pending"
    assert _override_audits(body["uuid"]) == []


def test_override_cannot_apply_to_cleared_noc_or_unknown_role(client):
    admin = _login(client, ADMIN[0], ADMIN[1])
    body = _new_request(client, admin, tag="G")
    librarian = _login(client, LIBRARIAN[0], LIBRARIAN[1])
    assert client.post(
        f"/api/v1/tc-requests/{body['id']}/noc",
        headers=librarian,
        json={"decision": "approve", "remarks": "Clear"},
    ).status_code == 200
    res = _override(client, admin, body["id"], "librarian")
    assert res.status_code == 409, res.text
    current = client.get(f"/api/v1/tc-requests/{body['id']}", headers=admin).json()
    lib = next(n for n in current["nocs"] if n["roleCode"] == "librarian")
    assert lib["overridden"] is False
    assert lib["decidedByEmail"] == LIBRARIAN[0]
    assert _override(client, admin, body["id"], "transportmanager").status_code == 404
    assert _override(client, admin, body["id"], "teacher").status_code == 404
    assert _override_audits(body["uuid"]) == []


def test_after_overrides_final_approval_works(client):
    admin = _login(client, ADMIN[0], ADMIN[1])
    body = _new_request(client, admin, tag="H")
    pending = [n["roleCode"] for n in body["nocs"] if n["status"] == "Pending"]
    assert pending
    last = None
    for role_code in pending:
        last = _override(client, admin, body["id"], role_code, reason=f"Override for {role_code}: clearing role vacant.")
        assert last.status_code == 200, last.text
    assert last.json()["status"] == "Pending PRM Review"
    assert last.json()["pendingNocCount"] == 0
    assert last.json()["allNocsComplete"] is True
    assert last.json()["overriddenNocCount"] == len(pending)

    # Override is only possible while NOCs are pending.
    assert _override(client, admin, body["id"], pending[0]).status_code == 409

    forwarded = client.post(f"/api/v1/tc-requests/{body['id']}/forward", headers=admin, json={"remarks": "ok"})
    assert forwarded.status_code == 200, forwarded.text
    approved = client.post(
        f"/api/v1/tc-requests/{body['id']}/decide",
        headers=admin,
        json={"decision": "approve", "remarks": "Issue with overrides on record."},
    )
    assert approved.status_code == 200, approved.text
    out = approved.json()
    assert out["status"] == "Approved"
    assert out["tcNumber"].startswith("TC/")
    actions = [h["action"] for h in out["history"]]
    assert actions.count("TC_NOC_OVERRIDDEN") == len(pending)
    assert "TC_NOCS_COMPLETE" in actions
    assert "TC_APPROVED" in actions
