"""Parent portal TC requests: create/list scoped to linked children; cannot forward."""

import os

os.environ["DATABASE_URL"] = "sqlite+pysqlite:///:memory:"
os.environ["OTP_DEBUG"] = "true"
os.environ["JWT_SECRET"] = "test-secret-qmis-erp-phase0-local"
os.environ["ENVIRONMENT"] = "development"

import pytest
from fastapi.testclient import TestClient

from app.core.config import settings
from app.main import app

ADMIN = (settings.admin_seed_email, settings.admin_seed_password)
PARENT_EMAIL = "parent.tc.demo@example.com"
PARENT_PASSWORD = "Parent-Test-2026"


@pytest.fixture()
def client():
    with TestClient(app) as test_client:
        yield test_client


def _login(client, email, password):
    from auth_test_helpers import login_headers

    return login_headers(client, email, password)


def _enroll_child(client, admin_headers, *, tag: str):
    created = client.post(
        "/api/v1/admissions",
        headers=admin_headers,
        json={
            "first_name": f"Child{tag}",
            "last_name": "ParentTc",
            "mobile_number": "9000099999",
            "class_name": "Grade 4",
            "father_name": "Parent Tc",
            "parent_account_email": PARENT_EMAIL,
        },
    )
    assert created.status_code in (200, 201), created.text
    admission_id = created.json()["id"]
    enrolled = client.post(
        f"/api/v1/admissions/{admission_id}/enroll",
        headers=admin_headers,
        json={
            "parent_account_email": PARENT_EMAIL,
            "parent_account_password": PARENT_PASSWORD,
        },
    )
    assert enrolled.status_code == 200, enrolled.text
    return enrolled.json()["student_id"]


def test_parent_can_create_and_list_own_child_tc_but_cannot_forward(client):
    admin = _login(client, ADMIN[0], ADMIN[1])
    student_id = _enroll_child(client, admin, tag="A")
    parent = _login(client, PARENT_EMAIL, PARENT_PASSWORD)

    created = client.post(
        "/api/v1/tc-requests",
        headers=parent,
        json={
            "studentRef": student_id,
            "reason": "Family relocation for parent portal test.",
            "transferTo": "Demo CBSE School",
            "lastDateOfAttendance": "2026-10-14",
            "requestedBy": "Parent",
        },
    )
    assert created.status_code == 201, created.text
    body = created.json()
    assert body["id"].startswith("TC-REQ-")
    assert body["status"] == "Pending Manager NOCs"
    assert body["studentId"] == student_id

    listed = client.get("/api/v1/tc-requests", headers=parent)
    assert listed.status_code == 200
    assert any(row["id"] == body["id"] for row in listed.json())

    forwarded = client.post(
        f"/api/v1/tc-requests/{body['id']}/forward",
        headers=parent,
        json={"remarks": "should fail"},
    )
    assert forwarded.status_code == 403


def test_parent_cannot_file_tc_for_unlinked_student(client):
    admin = _login(client, ADMIN[0], ADMIN[1])
    _enroll_child(client, admin, tag="B")
    other = client.post(
        "/api/v1/admissions",
        headers=admin,
        json={
            "first_name": "Other",
            "last_name": "Kid",
            "mobile_number": "9000088888",
            "class_name": "Grade 3",
            "father_name": "Someone Else",
            "parent_account_email": "other.parent.tc@example.com",
        },
    )
    assert other.status_code in (200, 201), other.text
    other_id = other.json()["id"]
    enrolled_other = client.post(
        f"/api/v1/admissions/{other_id}/enroll",
        headers=admin,
        json={
            "parent_account_email": "other.parent.tc@example.com",
            "parent_account_password": PARENT_PASSWORD,
        },
    )
    assert enrolled_other.status_code == 200, enrolled_other.text
    other_student = enrolled_other.json()["student_id"]

    parent = _login(client, PARENT_EMAIL, PARENT_PASSWORD)
    denied = client.post(
        "/api/v1/tc-requests",
        headers=parent,
        json={
            "studentRef": other_student,
            "reason": "Should be blocked.",
            "transferTo": "Somewhere",
        },
    )
    assert denied.status_code == 403
