"""Driver-scoped transport ops: profile link, fuel write, attendance, outsider deny."""

import os

os.environ["DATABASE_URL"] = "sqlite+pysqlite:///:memory:"
os.environ["OTP_DEBUG"] = "true"
os.environ["JWT_SECRET"] = "test-secret-qmis-erp-phase0-local"
os.environ["ENVIRONMENT"] = "development"

import pytest
from fastapi.testclient import TestClient

from app.main import app

TM = ("transportmanager@qmis.edu", "transport123")
DRIVER = ("driver@qmis.edu", "driver123")
TEACHER = ("teacher@qmis.edu", "teacher123")


@pytest.fixture()
def client():
    with TestClient(app) as test_client:
        yield test_client


def _login(client, who):
    response = client.post("/api/v1/auth/login", json={"email": who[0], "password": who[1]})
    assert response.status_code == 200, response.text
    return {"Authorization": f"Bearer {response.json()['access_token']}"}


def _seed_driver_scope(client):
    tm = _login(client, TM)
    drivers = client.put(
        "/api/v1/ops/transport-drivers",
        json=[
            {
                "id": "TDR-DRV-1",
                "firstName": "Seed",
                "lastName": "Driver",
                "name": "Seed Driver",
                "email": "driver@qmis.edu",
                "vehicleNumber": "TN33DRV001",
                "routeAssigned": "Driver Loop",
                "status": "Active",
            }
        ],
        headers=tm,
    )
    assert drivers.status_code == 200, drivers.text
    vehicles = client.put(
        "/api/v1/ops/transport-vehicles",
        json=[
            {
                "id": "TVH-DRV-1",
                "vehicleNumber": "TN33DRV001",
                "vehicleType": "Bus",
                "capacity": 40,
                "driverName": "Seed Driver",
                "status": "Active",
            }
        ],
        headers=tm,
    )
    assert vehicles.status_code == 200, vehicles.text
    routes = client.put(
        "/api/v1/ops/transport-routes",
        json=[
            {
                "id": "TRT-DRV-1",
                "routeName": "Driver Loop",
                "startLocation": "Depot",
                "endLocation": "Campus",
                "vehicleNumber": "TN33DRV001",
                "status": "Active",
            }
        ],
        headers=tm,
    )
    assert routes.status_code == 200, routes.text
    stops = client.put(
        "/api/v1/ops/transport-route-stops",
        json=[
            {
                "id": "TRS-DRV-1",
                "stopNo": 1,
                "pickupPoint": "Central Stop",
                "routeName": "Driver Loop",
                "vehicleNumber": "TN33DRV001",
                "arrivalTime": "06:40",
                "departureTime": "06:43",
                "studentsBoarding": 5,
            }
        ],
        headers=tm,
    )
    assert stops.status_code == 200, stops.text
    assignments = client.put(
        "/api/v1/ops/transport-student-assignments",
        json=[
            {
                "id": "TSA-DRV-1",
                "studentId": "STU-DRV-1",
                "studentName": "Boarder One",
                "classSection": "9-A",
                "routeName": "Driver Loop",
                "vehicleNumber": "TN33DRV001",
                "stopName": "Central Stop",
                "status": "Active",
            }
        ],
        headers=tm,
    )
    assert assignments.status_code == 200, assignments.text
    return tm


def test_driver_sees_scoped_vehicle_route_stops_and_can_mark_attendance(client):
    _seed_driver_scope(client)
    headers = _login(client, DRIVER)

    vehicles = client.get("/api/v1/ops/transport-vehicles", headers=headers)
    assert vehicles.status_code == 200
    assert any(row.get("vehicleNumber") == "TN33DRV001" for row in vehicles.json())

    routes = client.get("/api/v1/ops/transport-routes", headers=headers)
    assert routes.status_code == 200
    assert any(row.get("routeName") == "Driver Loop" for row in routes.json())

    stops = client.get("/api/v1/ops/transport-route-stops", headers=headers)
    assert stops.status_code == 200
    assert any(row.get("pickupPoint") == "Central Stop" for row in stops.json())

    assignments = client.get("/api/v1/ops/transport-student-assignments", headers=headers)
    assert assignments.status_code == 200
    assert any(row.get("studentId") == "STU-DRV-1" for row in assignments.json())

    put = client.put(
        "/api/v1/ops/transport-student-attendance",
        json=[
            {
                "id": "TST-DRV-1",
                "attendanceDate": "2026-11-20",
                "studentId": "STU-DRV-1",
                "studentName": "Boarder One",
                "classSection": "9-A",
                "busStop": "Central Stop",
                "vehicleNumber": "TN33DRV001",
                "routeName": "Driver Loop",
                "morning": {"pickup": "Present", "drop": "Pending"},
                "evening": {"pickup": "Pending", "drop": "Pending"},
            }
        ],
        headers=headers,
    )
    assert put.status_code == 200, put.text
    listed = client.get("/api/v1/ops/transport-student-attendance", headers=headers)
    assert listed.status_code == 200
    assert any(row.get("morning", {}).get("pickup") == "Present" for row in listed.json())


def test_driver_can_create_fuel_in_scope_and_denied_other_vehicle(client):
    _seed_driver_scope(client)
    headers = _login(client, DRIVER)

    ok = client.put(
        "/api/v1/ops/transport-driver-fuel",
        json=[
            {
                "id": "TDF-DRV-1",
                "vehicleNumber": "TN33DRV001",
                "fuelType": "Diesel",
                "quantityLitres": "40",
                "approvalStatus": "Pending",
            }
        ],
        headers=headers,
    )
    assert ok.status_code == 200, ok.text

    denied = client.put(
        "/api/v1/ops/transport-driver-fuel",
        json=[
            {
                "id": "TDF-DRV-X",
                "vehicleNumber": "TN99OUTSIDE",
                "fuelType": "Diesel",
                "quantityLitres": "10",
                "approvalStatus": "Pending",
            }
        ],
        headers=headers,
    )
    assert denied.status_code == 403


def test_teacher_denied_driver_fuel(client):
    headers = _login(client, TEACHER)
    put = client.put(
        "/api/v1/ops/transport-driver-fuel",
        json=[{"id": "TDF-NOPE", "vehicleNumber": "X", "fuelType": "Diesel"}],
        headers=headers,
    )
    assert put.status_code == 403
