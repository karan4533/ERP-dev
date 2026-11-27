"""Coordinator portal shared APIs (same staff academic bundle as teacher + exams.write)."""

import os

os.environ["DATABASE_URL"] = "sqlite+pysqlite:///:memory:"
os.environ["OTP_DEBUG"] = "true"
os.environ["JWT_SECRET"] = "test-secret-qmis-erp-phase0-local"
os.environ["ENVIRONMENT"] = "development"

import pytest
from fastapi.testclient import TestClient

from app.core.config import settings
from app.main import app

COORDINATOR = (settings.coordinator_seed_email, settings.coordinator_seed_password)


@pytest.fixture()
def client():
    with TestClient(app) as test_client:
        yield test_client


def _login(client, email, password):
    response = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    assert response.status_code == 200, response.text
    return {"Authorization": f"Bearer {response.json()['access_token']}"}


def test_coordinator_shared_reads_and_exams_write(client):
    headers = _login(client, COORDINATOR[0], COORDINATOR[1])

    assert client.get("/api/v1/students", headers=headers).status_code == 200
    assert client.get("/api/v1/announcements", headers=headers).status_code == 200
    assert client.get("/api/v1/calendar", headers=headers).status_code == 200
    assert client.get("/api/v1/notifications", headers=headers).status_code == 200
    assert client.get("/api/v1/communication/conversations", headers=headers).status_code == 200
    assert client.get("/api/v1/lesson-plans", headers=headers).status_code == 200
    assert client.get("/api/v1/exams", headers=headers).status_code == 200
    assert client.get("/api/v1/attendance?date=2026-10-15", headers=headers).status_code == 200

    admin = _login(client, settings.admin_seed_email, settings.admin_seed_password)
    classes = client.get("/api/v1/masters/classes", headers=admin).json()
    if not any(c.get("name") == "Grade 6" for c in classes):
        made = client.post("/api/v1/masters/classes", json={"name": "Grade 6"}, headers=admin)
        assert made.status_code == 201, made.text
    # Coordinators schedule exams only inside their grade band (#59), so give this one Grades 1–8.
    options = client.get("/api/v1/masters/class-teacher-options", headers=admin).json()
    coordinator_id = next(o["user_id"] for o in options if o["email"] == COORDINATOR[0])
    principal = _login(client, settings.principal_seed_email, settings.principal_seed_password)
    band = client.put(
        "/api/v1/students/coordinator-grade-bands",
        json={"userId": coordinator_id, "gradeFrom": 1, "gradeTo": 8},
        headers=principal,
    )
    assert band.status_code == 200, band.text
    created = client.post(
        "/api/v1/exams",
        headers=headers,
        json={
            "name": "Coordinator Midterm",
            "examType": "MIDTERM",
            "className": "Grade 6",
            "startDate": "2026-11-01",
            "endDate": "2026-11-05",
        },
    )
    assert created.status_code == 201, created.text
