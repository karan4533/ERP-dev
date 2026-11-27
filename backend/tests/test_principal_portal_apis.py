"""Principal portal shared APIs: staff academic + exams.write, calendar.write, announcements.write, leave.decide."""

import os

os.environ["DATABASE_URL"] = "sqlite+pysqlite:///:memory:"
os.environ["OTP_DEBUG"] = "true"
os.environ["JWT_SECRET"] = "test-secret-qmis-erp-phase0-local"
os.environ["ENVIRONMENT"] = "development"

import pytest
from fastapi.testclient import TestClient

from app.core.config import settings
from app.main import app

PRINCIPAL = (settings.principal_seed_email, settings.principal_seed_password)


@pytest.fixture()
def client():
    with TestClient(app) as test_client:
        yield test_client


def _login(client, email, password):
    response = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    assert response.status_code == 200, response.text
    return {"Authorization": f"Bearer {response.json()['access_token']}"}


def test_principal_shared_reads_and_exams_write(client):
    headers = _login(client, PRINCIPAL[0], PRINCIPAL[1])

    me = client.get("/api/v1/auth/me", headers=headers)
    assert me.status_code == 200
    perms = set(me.json().get("permissions") or [])
    assert "exams.write" in perms
    assert "announcements.write" in perms
    assert "calendar.write" in perms
    assert "leave.decide" in perms
    assert "hr.employees.read" in perms
    assert "hr.write" not in perms
    assert "users.write" not in perms
    assert "users.read" not in perms

    assert client.get("/api/v1/students", headers=headers).status_code == 200
    assert client.get("/api/v1/announcements", headers=headers).status_code == 200
    assert client.get("/api/v1/calendar", headers=headers).status_code == 200
    assert client.get("/api/v1/notifications", headers=headers).status_code == 200
    assert client.get("/api/v1/communication/conversations", headers=headers).status_code == 200
    assert client.get("/api/v1/exams", headers=headers).status_code == 200
    assert client.get("/api/v1/attendance?date=2026-10-15", headers=headers).status_code == 200
    assert client.get("/api/v1/admin/users", headers=headers).status_code == 403

    admin = _login(client, settings.admin_seed_email, settings.admin_seed_password)
    classes = client.get("/api/v1/masters/classes", headers=admin).json()
    if not any(c.get("name") == "Grade 8" for c in classes):
        made = client.post("/api/v1/masters/classes", json={"name": "Grade 8"}, headers=admin)
        assert made.status_code == 201, made.text
    created = client.post(
        "/api/v1/exams",
        headers=headers,
        json={
            "name": "Principal Midterm",
            "examType": "MIDTERM",
            "className": "Grade 8",
            "startDate": "2026-11-10",
            "endDate": "2026-11-14",
        },
    )
    assert created.status_code == 201, created.text
    exam_id = created.json()["id"]
    submitted = client.post(f"/api/v1/exams/{exam_id}/submit", headers=headers)
    assert submitted.status_code == 200, submitted.text

    cal = client.post(
        "/api/v1/calendar",
        headers=headers,
        json={
            "type": "event",
            "title": "Principal Assembly",
            "startDate": "2026-10-20",
            "endDate": "2026-10-20",
            "description": "All-hands assembly for Grades 6–12.",
        },
    )
    assert cal.status_code == 201, cal.text
    assert cal.json()["title"] == "Principal Assembly"

    assert client.get("/api/v1/leave-requests", params={"box": "mine"}, headers=headers).status_code == 200
    assert client.get("/api/v1/leave-requests", params={"box": "received"}, headers=headers).status_code == 200
    assert client.get("/api/v1/hr/portal/employees", headers=headers).status_code == 200
    # leave.decide already asserted via permissions on /auth/me above
