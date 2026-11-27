"""TC multi-level NOC workflow: manager NOCs → PRM → MD/Admin final."""

import os

os.environ["DATABASE_URL"] = "sqlite+pysqlite:///:memory:"
os.environ["OTP_DEBUG"] = "true"
os.environ["JWT_SECRET"] = "test-secret-qmis-erp-tc-noc"
os.environ["ENVIRONMENT"] = "development"

from uuid import UUID

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import select

from app.core.config import settings
from app.core.database import SessionLocal
from app.main import app
from app.models import OpsRecord, Student
from tests.conftest import reset_sqlite_memory_schema

ADMIN = (settings.admin_seed_email, settings.admin_seed_password)
TM = ("transportmanager@qmis.edu", "transport123")
LIBRARIAN = ("librarian@qmis.edu", "librarian123")
STORE = ("stationerystoremanager@qmis.edu", "stationery123")
ACCOUNT_HEAD = ("accounthead@qmis.edu", "accounts123")
TEACHER = (settings.teacher_seed_email, settings.teacher_seed_password)


@pytest.fixture()
def client():
    reset_sqlite_memory_schema()
    with TestClient(app) as test_client:
        yield test_client


def _login(client, email, password):
    from auth_test_helpers import login_headers

    return login_headers(client, email, password)


def _student(client, admin_headers, *, tag: str):
    created = client.post(
        "/api/v1/admissions",
        headers=admin_headers,
        json={
            "first_name": f"TcNoc{tag}",
            "last_name": "Student",
            "mobile_number": "9000011111",
            "class_name": "Grade 5",
            "father_name": "Parent Noc",
            "parent_account_email": f"parent.tcnoc.{tag.lower()}@example.com",
            "fees_group": "RegFeeStatus:Paid",
            "registration_fees": "0",
        },
    )
    assert created.status_code in (200, 201), created.text
    admission_id = created.json()["id"]
    enrolled = client.post(
        f"/api/v1/admissions/{admission_id}/enroll",
        headers=admin_headers,
        json={
            "parent_account_email": f"parent.tcnoc.{tag.lower()}@example.com",
            "parent_account_password": "Parent-Test-2026",
        },
    )
    assert enrolled.status_code == 200, enrolled.text
    payload = enrolled.json()
    return str(payload["student_id"]), payload.get("student_code") or payload.get("admission_number")


def _assign_school_transport(student_id: str, _admission_number: str | None):
    with SessionLocal() as db:
        student = db.get(Student, UUID(str(student_id)))
        assert student is not None
        db.add(
            OpsRecord(
                campus_id=student.campus_id,
                collection="transport-student-assignments",
                public_id=f"TSA-{student.admission_number}",
                body={
                    "id": f"TSA-{student.admission_number}",
                    "studentId": str(student.id),
                    "admissionNumber": student.admission_number,
                    "usesSchoolTransport": True,
                    "route": "R1",
                },
            )
        )
        db.commit()


def _approve_pending_nocs(client, ref: str, except_roles: set[str] | None = None):
    """Approve every pending NOC using the matching seeded manager login."""
    except_roles = except_roles or set()
    body = client.get(f"/api/v1/tc-requests/{ref}", headers=_login(client, ADMIN[0], ADMIN[1])).json()
    role_logins = {
        "transportmanager": TM,
        "librarian": LIBRARIAN,
        "stationerystoremanager": STORE,
        "accounthead": ACCOUNT_HEAD,
    }
    for noc in body.get("nocs") or []:
        if noc.get("status") != "Pending":
            continue
        role = noc.get("roleCode")
        if role in except_roles:
            continue
        login = role_logins.get(role)
        assert login, f"No seeded login for NOC role {role}"
        headers = _login(client, login[0], login[1])
        res = client.post(
            f"/api/v1/tc-requests/{ref}/noc",
            headers=headers,
            json={"decision": "approve", "remarks": f"{role} cleared"},
        )
        assert res.status_code == 200, res.text


def test_without_transport_still_requires_dues_manager_nocs(client):
    admin = _login(client, ADMIN[0], ADMIN[1])
    student_id, _ = _student(client, admin, tag="A")
    created = client.post(
        "/api/v1/tc-requests",
        headers=admin,
        json={"studentRef": student_id, "reason": "Relocation.", "transferTo": "DPS"},
    )
    assert created.status_code == 201, created.text
    body = created.json()
    assert body["status"] == "Pending Manager NOCs"
    roles = {n["roleCode"] for n in body["nocs"]}
    assert "transportmanager" not in roles
    assert "librarian" in roles
    assert "stationerystoremanager" in roles
    # Approve dues managers then forward.
    _approve_pending_nocs(client, body["id"])
    current = client.get(f"/api/v1/tc-requests/{body['id']}", headers=admin).json()
    assert [n for n in current["nocs"] if n["status"] == "Pending"] == []
    assert current["status"] == "Pending PRM Review"
    forwarded = client.post(f"/api/v1/tc-requests/{body['id']}/forward", headers=admin, json={"remarks": "ok"})
    assert forwarded.status_code == 200, forwarded.text
    assert forwarded.json()["status"] == "Pending Super Admin Approval"
    approved = client.post(
        f"/api/v1/tc-requests/{body['id']}/decide",
        headers=admin,
        json={"decision": "approve", "remarks": "Issue"},
    )
    assert approved.status_code == 200
    assert approved.json()["status"] == "Approved"
    assert approved.json()["tcNumber"].startswith("TC/")


def test_transport_student_routes_to_transport_manager_noc(client):
    admin = _login(client, ADMIN[0], ADMIN[1])
    tm = _login(client, TM[0], TM[1])
    teacher = _login(client, TEACHER[0], TEACHER[1])
    student_id, admission = _student(client, admin, tag="B")
    _assign_school_transport(student_id, admission)

    created = client.post(
        "/api/v1/tc-requests",
        headers=admin,
        json={"studentRef": student_id, "reason": "Moving city.", "transferTo": "NPS"},
    )
    assert created.status_code == 201, created.text
    body = created.json()
    assert body["status"] == "Pending Manager NOCs"
    roles = {n["roleCode"] for n in body["nocs"]}
    assert "transportmanager" in roles
    assert len(body["nocs"]) >= 2

    assert client.post(
        f"/api/v1/tc-requests/{body['id']}/noc",
        headers=teacher,
        json={"decision": "approve"},
    ).status_code == 403
    assert client.post(
        f"/api/v1/tc-requests/{body['id']}/decide",
        headers=admin,
        json={"decision": "approve"},
    ).status_code == 409
    assert client.post(
        f"/api/v1/tc-requests/{body['id']}/forward",
        headers=admin,
        json={"remarks": "early"},
    ).status_code == 409

    listed = client.get("/api/v1/tc-requests", headers=tm)
    assert listed.status_code == 200
    assert any(row["id"] == body["id"] for row in listed.json())

    # Approve other dues managers first; leave transport for TM API assert.
    _approve_pending_nocs(client, body["id"], except_roles={"transportmanager"})

    noc = client.post(
        f"/api/v1/tc-requests/{body['id']}/noc",
        headers=tm,
        json={"decision": "approve", "remarks": "Bus dues cleared."},
    )
    assert noc.status_code == 200, noc.text
    assert noc.json()["status"] == "Pending PRM Review"
    tm_noc = next(n for n in noc.json()["nocs"] if n["roleCode"] == "transportmanager")
    assert tm_noc["status"] == "Approved"
    assert tm_noc["remarks"] == "Bus dues cleared."

    assert client.post(
        f"/api/v1/tc-requests/{body['id']}/noc",
        headers=tm,
        json={"decision": "approve"},
    ).status_code == 409

    forwarded = client.post(
        f"/api/v1/tc-requests/{body['id']}/forward",
        headers=admin,
        json={"remarks": "All clearances done."},
    )
    assert forwarded.status_code == 200
    assert forwarded.json()["status"] == "Pending Super Admin Approval"

    assert client.post(
        f"/api/v1/tc-requests/{body['id']}/decide",
        headers=tm,
        json={"decision": "approve"},
    ).status_code == 403
    assert client.post(
        f"/api/v1/tc-requests/{body['id']}/decide",
        headers=teacher,
        json={"decision": "approve"},
    ).status_code == 403

    approved = client.post(
        f"/api/v1/tc-requests/{body['id']}/decide",
        headers=admin,
        json={"decision": "approve", "remarks": "Final issue TC."},
    )
    assert approved.status_code == 200
    assert approved.json()["status"] == "Approved"
    assert approved.json()["tcNumber"].startswith("TC/")
    assert approved.json()["superAdminRemarks"] == "Final issue TC."


def test_manager_noc_rejection_closes_request(client):
    admin = _login(client, ADMIN[0], ADMIN[1])
    tm = _login(client, TM[0], TM[1])
    student_id, admission = _student(client, admin, tag="C")
    _assign_school_transport(student_id, admission)
    created = client.post(
        "/api/v1/tc-requests",
        headers=admin,
        json={"studentRef": student_id, "reason": "Leave.", "transferTo": "Other"},
    )
    assert created.status_code == 201
    ref = created.json()["id"]
    refused = client.post(
        f"/api/v1/tc-requests/{ref}/noc",
        headers=tm,
        json={"decision": "reject"},
    )
    assert refused.status_code == 422
    rejected = client.post(
        f"/api/v1/tc-requests/{ref}/noc",
        headers=tm,
        json={"decision": "reject", "remarks": "Transport dues outstanding."},
    )
    assert rejected.status_code == 200
    assert rejected.json()["status"] == "Rejected"
    assert rejected.json()["tcNumber"] == ""
