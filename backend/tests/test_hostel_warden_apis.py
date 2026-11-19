"""Hostel Warden ops collections: assignments + payments."""

import os

os.environ["DATABASE_URL"] = "sqlite+pysqlite:///:memory:"
os.environ["OTP_DEBUG"] = "true"
os.environ["JWT_SECRET"] = "test-secret-qmis-erp-phase0-local"
os.environ["ENVIRONMENT"] = "development"

import pytest
from fastapi.testclient import TestClient

from app.main import app

WARDEN = ("hostelwarden@qmis.edu", "hostelwarden123")
TEACHER = ("teacher@qmis.edu", "teacher123")


@pytest.fixture()
def client():
    with TestClient(app) as test_client:
        yield test_client


def _login(client, who):
    response = client.post("/api/v1/auth/login", json={"email": who[0], "password": who[1]})
    assert response.status_code == 200, response.text
    return {"Authorization": f"Bearer {response.json()['access_token']}"}


def test_hostel_warden_can_replace_and_list_assignments(client):
    headers = _login(client, WARDEN)
    payload = [
        {
            "id": "HAS-1001",
            "studentId": "STU-HW-1",
            "studentName": "Hostel UAT Student",
            "blockName": "Block A",
            "roomNumber": "A-101",
            "bedNumber": "B1",
            "status": "Active",
        }
    ]
    put = client.put("/api/v1/ops/hostel-assignments", json=payload, headers=headers)
    assert put.status_code == 200, put.text
    assert put.json()[0]["id"] == "HAS-1001"

    get = client.get("/api/v1/ops/hostel-assignments", headers=headers)
    assert get.status_code == 200
    assert any(row["studentName"] == "Hostel UAT Student" for row in get.json())


def test_teacher_denied_hostel_assignments_write(client):
    headers = _login(client, TEACHER)
    put = client.put(
        "/api/v1/ops/hostel-assignments",
        json=[{"id": "HAS-9999", "studentName": "Nope"}],
        headers=headers,
    )
    assert put.status_code == 403


def test_hostel_warden_denied_finance_and_admin_users(client):
    headers = _login(client, WARDEN)
    finance = client.get("/api/v1/finance/state", headers=headers)
    assert finance.status_code == 403
    users = client.get("/api/v1/admin/users", headers=headers)
    assert users.status_code == 403
