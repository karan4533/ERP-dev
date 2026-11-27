import os
from datetime import date

os.environ["DATABASE_URL"] = "sqlite+pysqlite:///:memory:"
os.environ["OTP_DEBUG"] = "true"
os.environ["JWT_SECRET"] = "test-secret-qmis-erp-attendance"

import pytest
from fastapi.testclient import TestClient

from app.main import app
from tests.conftest import reset_sqlite_memory_schema


@pytest.fixture()
def client():
    reset_sqlite_memory_schema()
    with TestClient(app) as test_client:
        yield test_client


def _login(client: TestClient, email="admin@qmis.edu", password="admin123") -> dict:
    response = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    assert response.status_code == 200, response.text
    return {"Authorization": f"Bearer {response.json()['access_token']}"}


def _enroll(client: TestClient, headers: dict, name="Neha Rao", cls="Grade 3") -> str:
    enquiry = client.post(
        "/api/v1/admissions/enquiries",
        json={
            "name": name,
            "mobile_number": "9777766666",
            "class_name": cls,
            "email": "parent.neha@example.com",
        },
        headers=headers,
    )
    assert enquiry.status_code == 201, enquiry.text
    converted = client.post(
        f"/api/v1/admissions/enquiries/{enquiry.json()['id']}/convert", headers=headers
    )
    assert converted.status_code == 200, converted.text
    admission_id = converted.json()["id"]
    client.patch(
        f"/api/v1/admissions/{admission_id}",
        json={
            "first_name": name.split()[0],
            "last_name": name.split()[-1],
            "mobile_number": "9777766666",
            "class_name": cls,
            "parent_account_email": "parent.neha@example.com",
        },
        headers=headers,
    )
    enrolled = client.post(
        f"/api/v1/admissions/{admission_id}/enroll",
        json={
            "parent_account_email": "parent.neha@example.com",
            "parent_account_password": "Parent-Test-2026",
        },
        headers=headers,
    )
    assert enrolled.status_code == 200, enrolled.text
    return str(enrolled.json()["student_id"])


def test_upsert_list_and_calendar(client):
    headers = _login(client)
    student_id = _enroll(client, headers)
    day = date(2026, 10, 12).isoformat()

    posted = client.post(
        "/api/v1/attendance",
        json={
            "date": day,
            "className": "Grade 3",
            "section": "A",
            "marks": [
                {"studentId": student_id, "status": "Present", "inOutStatus": "On Time"},
            ],
        },
        headers=headers,
    )
    assert posted.status_code == 200, posted.text
    body = posted.json()
    assert len(body) == 1
    assert body[0]["attendanceStatus"] == "Present"
    assert body[0]["studentName"] == "Neha Rao"

    listed = client.get(
        "/api/v1/attendance",
        params={"date": day, "className": "Grade 3"},
        headers=headers,
    )
    assert listed.status_code == 200
    assert any(r["studentId"] == student_id for r in listed.json())

    roster = client.get(
        "/api/v1/attendance",
        params={"date": day, "className": "Grade 3", "roster": True},
        headers=headers,
    )
    assert roster.status_code == 200
    assert any(r["studentId"] == student_id and r["attendanceStatus"] == "Present" for r in roster.json())

    cal = client.get(
        f"/api/v1/attendance/students/{student_id}/calendar",
        params={"year": 2026, "month": 10},
        headers=headers,
    )
    assert cal.status_code == 200
    assert cal.json().get(day) == "P"

    # Upsert to Absent
    again = client.post(
        "/api/v1/attendance",
        json={
            "date": day,
            "className": "Grade 3",
            "marks": [{"studentId": student_id, "status": "Absent"}],
        },
        headers=headers,
    )
    assert again.status_code == 200
    assert again.json()[0]["attendanceStatus"] == "Absent"


def test_teacher_can_mark_attendance_only_for_assigned_class(client):
    admin = _login(client)
    student_id = _enroll(client, admin)
    teacher = _login(client, "teacher@qmis.edu", "teacher123")
    day = "2026-10-13"
    body = {"date": day, "className": "Grade 3", "marks": [{"studentId": student_id, "status": "Present"}]}

    # Policy: no class-teacher section, allocation or substitute duty -> no attendance access.
    refused = client.post("/api/v1/attendance", json=body, headers=teacher)
    assert refused.status_code == 403, refused.text
    assert client.get("/api/v1/attendance", params={"date": day, "className": "Grade 3"}, headers=admin).json() == []

    classes = client.get("/api/v1/masters/classes", headers=admin).json()
    grade3 = next((c for c in classes if c["name"] == "Grade 3"), None) or client.post(
        "/api/v1/masters/classes", json={"name": "Grade 3"}, headers=admin
    ).json()
    options = client.get("/api/v1/masters/class-teacher-options", headers=admin).json()
    teacher_id = next(o["user_id"] for o in options if o["email"] == "teacher@qmis.edu")
    section = client.post(
        "/api/v1/masters/sections",
        json={"class_id": grade3["id"], "name": "T", "class_teacher_user_id": teacher_id},
        headers=admin,
    )
    assert section.status_code == 201, section.text

    posted = client.post("/api/v1/attendance", json=body, headers=teacher)
    assert posted.status_code == 200, posted.text
    assert posted.json()[0]["studentId"] == student_id and posted.json()[0]["attendanceStatus"] == "Present"
