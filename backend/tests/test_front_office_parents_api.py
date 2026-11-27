"""PRM / Admin Front Office parents list uses GET /api/v1/parents (students.read)."""

import os

os.environ["DATABASE_URL"] = "sqlite+pysqlite:///:memory:"
os.environ["OTP_DEBUG"] = "true"
os.environ["JWT_SECRET"] = "test-secret-qmis-erp-fo-parents"

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.permissions.matrix import ROLE_PERMISSIONS


@pytest.fixture()
def client():
    with TestClient(app) as test_client:
        yield test_client


def _h(client, email, password):
    r = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    assert r.status_code == 200, r.text
    return {"Authorization": f"Bearer {r.json()['access_token']}"}


def test_prm_has_students_read_for_parents_endpoint():
    assert "students.read" in ROLE_PERMISSIONS["prm"]


def test_prm_can_list_parents_after_enroll(client):
    admin = _h(client, "admin@qmis.edu", "admin123")
    enquiry = client.post(
        "/api/v1/admissions/enquiries",
        headers=admin,
        json={
            "name": "FO Parent Sync",
            "mobile_number": "9000011122",
            "class_name": "Grade 3",
            "email": "fo.parent.sync@example.com",
            "city": "Madurai",
        },
    )
    assert enquiry.status_code == 201, enquiry.text
    converted = client.post(
        f"/api/v1/admissions/enquiries/{enquiry.json()['id']}/convert",
        headers=admin,
    )
    assert converted.status_code == 200, converted.text
    admission_id = converted.json()["id"]
    client.patch(
        f"/api/v1/admissions/{admission_id}",
        headers=admin,
        json={
            "first_name": "Asha",
            "last_name": "Kumar",
            "father_name": "Ravi Kumar",
            "parent_email": "fo.parent.sync@example.com",
            "parent_mobile_number": "9000011122",
            "class_name": "Grade 3",
            "status": "Active",
        },
    )
    enrolled = client.post(
        f"/api/v1/admissions/{admission_id}/enroll",
        headers=admin,
        json={
            "parent_account_email": "fo.parent.sync@example.com",
            "parent_account_password": "ParentPass1!",
        },
    )
    assert enrolled.status_code == 200, enrolled.text
    student_id = enrolled.json().get("student_id")
    assert student_id

    prm = _h(client, "prm@qmis.edu", "prm12345")
    listed = client.get("/api/v1/parents", headers=prm)
    assert listed.status_code == 200, listed.text
    rows = listed.json()
    assert any(str(row.get("studentId")) == str(student_id) for row in rows)
    match = next(row for row in rows if str(row.get("studentId")) == str(student_id))
    assert "Ravi" in str(match.get("parentName") or "") or "fo.parent.sync@example.com" in str(
        match.get("parentEmail") or ""
    )


def test_teacher_without_scope_still_authorized_shape(client):
    """Smoke: endpoint remains students.read for staff; teacher login succeeds (may be empty)."""
    teacher = _h(client, "teacher@qmis.edu", "teacher123")
    listed = client.get("/api/v1/parents", headers=teacher)
    assert listed.status_code == 200, listed.text
    assert isinstance(listed.json(), list)


def test_parent_role_cannot_list_campus_parents(client):
    parent = _h(client, "parent@qmis.edu", "parent123")
    denied = client.get("/api/v1/parents", headers=parent)
    assert denied.status_code == 403


def test_sibling_enrollments_yield_one_parents_row_each(client):
    """API SoT is one guardian-contact row per student (siblings = separate rows)."""
    admin = _h(client, "admin@qmis.edu", "admin123")
    student_ids = []
    for idx, first in enumerate(("SiblingA", "SiblingB"), start=1):
        enquiry = client.post(
            "/api/v1/admissions/enquiries",
            headers=admin,
            json={
                "name": first,
                "mobile_number": f"90000112{idx:02d}",
                "class_name": "Grade 3",
                "email": f"fo.sibling.{idx}@example.com",
                "city": "Madurai",
            },
        )
        assert enquiry.status_code == 201, enquiry.text
        converted = client.post(
            f"/api/v1/admissions/enquiries/{enquiry.json()['id']}/convert",
            headers=admin,
        )
        assert converted.status_code == 200, converted.text
        admission_id = converted.json()["id"]
        client.patch(
            f"/api/v1/admissions/{admission_id}",
            headers=admin,
            json={
                "first_name": first,
                "last_name": "Shared",
                "father_name": "Shared Father",
                "parent_email": f"shared.guardian.{idx}@example.com",
                "parent_mobile_number": "9000099999",
                "class_name": "Grade 3",
                "status": "Active",
            },
        )
        enrolled = client.post(
            f"/api/v1/admissions/{admission_id}/enroll",
            headers=admin,
            json={
                "parent_account_email": f"shared.guardian.{idx}@example.com",
                "parent_account_password": "ParentPass1!",
            },
        )
        assert enrolled.status_code == 200, enrolled.text
        student_ids.append(enrolled.json()["student_id"])

    prm = _h(client, "prm@qmis.edu", "prm12345")
    listed = client.get("/api/v1/parents", headers=prm)
    assert listed.status_code == 200, listed.text
    rows = listed.json()
    matched = [row for row in rows if str(row.get("studentId")) in {str(s) for s in student_ids}]
    assert len(matched) == 2
    assert {str(row["studentId"]) for row in matched} == {str(s) for s in student_ids}
    for row in matched:
        assert row.get("studentName")
        assert "Shared Father" in str(row.get("parentName") or "") or row.get("parentEmail")

