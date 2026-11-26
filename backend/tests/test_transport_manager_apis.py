"""Transport Manager ops collections: drivers, vehicles, routes, assignments, duties."""

import os

os.environ["DATABASE_URL"] = "sqlite+pysqlite:///:memory:"
os.environ["OTP_DEBUG"] = "true"
os.environ["JWT_SECRET"] = "test-secret-qmis-erp-phase0-local"
os.environ["ENVIRONMENT"] = "development"

import pytest
from fastapi.testclient import TestClient

from app.main import app

TM = ("transportmanager@qmis.edu", "transport123")
TEACHER = ("teacher@qmis.edu", "teacher123")


@pytest.fixture()
def client():
    with TestClient(app) as test_client:
        yield test_client


def _login(client, who):
    response = client.post("/api/v1/auth/login", json={"email": who[0], "password": who[1]})
    assert response.status_code == 200, response.text
    return {"Authorization": f"Bearer {response.json()['access_token']}"}


def test_transport_manager_can_replace_and_list_drivers(client):
    headers = _login(client, TM)
    payload = [
        {
            "id": "TDR-1001",
            "firstName": "UAT",
            "lastName": "Driver",
            "name": "UAT Driver",
            "mobileNumber": "9000000001",
            "licenseNumber": "TN-LIC-001",
            "status": "Active",
        }
    ]
    put = client.put("/api/v1/ops/transport-drivers", json=payload, headers=headers)
    assert put.status_code == 200, put.text
    get = client.get("/api/v1/ops/transport-drivers", headers=headers)
    assert get.status_code == 200
    assert any(row.get("licenseNumber") == "TN-LIC-001" for row in get.json())


def test_transport_manager_student_assignments_and_routes(client):
    headers = _login(client, TM)
    routes = client.put(
        "/api/v1/ops/transport-routes",
        json=[{"id": "TRT-1001", "routeName": "North Loop", "startLocation": "Campus", "endLocation": "Depot"}],
        headers=headers,
    )
    assert routes.status_code == 200, routes.text
    assignments = client.put(
        "/api/v1/ops/transport-student-assignments",
        json=[
            {
                "id": "TSA-1001",
                "studentId": "STU-1",
                "studentName": "Transport UAT Student",
                "routeId": "TRT-1001",
                "routeName": "North Loop",
                "status": "Active",
            }
        ],
        headers=headers,
    )
    assert assignments.status_code == 200, assignments.text
    listed = client.get("/api/v1/ops/transport-student-assignments", headers=headers)
    assert any(row.get("studentName") == "Transport UAT Student" for row in listed.json())


def test_teacher_denied_transport_drivers_write(client):
    headers = _login(client, TEACHER)
    put = client.put(
        "/api/v1/ops/transport-drivers",
        json=[{"id": "TDR-9999", "name": "Nope"}],
        headers=headers,
    )
    assert put.status_code == 403


def test_transport_manager_denied_admin_users(client):
    headers = _login(client, TM)
    users = client.get("/api/v1/admin/users", headers=headers)
    assert users.status_code == 403
