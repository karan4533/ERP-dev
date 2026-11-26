"""Gate Keeper + Gate Keeper Manager ops collections: visitors, duties, incidents."""

import os

os.environ["DATABASE_URL"] = "sqlite+pysqlite:///:memory:"
os.environ["OTP_DEBUG"] = "true"
os.environ["JWT_SECRET"] = "test-secret-qmis-erp-phase0-local"
os.environ["ENVIRONMENT"] = "development"

import pytest
from fastapi.testclient import TestClient

from app.main import app

GATEKEEPER = ("gatekeeper@qmis.edu", "gatekeeper123")
GKM = ("gatekeepermanager@qmis.edu", "gkm1234567")
TEACHER = ("teacher@qmis.edu", "teacher123")


@pytest.fixture()
def client():
    with TestClient(app) as test_client:
        yield test_client


def _login(client, who):
    response = client.post("/api/v1/auth/login", json={"email": who[0], "password": who[1]})
    assert response.status_code == 200, response.text
    return {"Authorization": f"Bearer {response.json()['access_token']}"}


def test_gatekeeper_can_replace_and_list_visitors(client):
    headers = _login(client, GATEKEEPER)
    payload = [
        {
            "id": "GVS-P2-0001",
            "visitorName": "Phase2 Gate Visitor",
            "phone": "9000000001",
            "purpose": "UAT",
            "status": "Checked In",
        }
    ]
    put = client.put("/api/v1/ops/gate-visitors", json=payload, headers=headers)
    assert put.status_code == 200, put.text
    assert put.json()[0]["id"] == "GVS-P2-0001"

    get = client.get("/api/v1/ops/gate-visitors", headers=headers)
    assert get.status_code == 200
    assert any(row["visitorName"] == "Phase2 Gate Visitor" for row in get.json())


def test_gkm_can_assign_duty_and_gatekeeper_reads_it(client):
    gkm = _login(client, GKM)
    gk = _login(client, GATEKEEPER)
    payload = [
        {
            "id": "GDU-P2-0001",
            "dutyId": "GDU-P2-0001",
            "gateKeeperName": "Gate Keeper",
            "assigneeEmail": "gatekeeper@qmis.edu",
            "gateLocation": "Main Gate",
            "shift": "Morning",
            "status": "Pending",
        }
    ]
    put = client.put("/api/v1/ops/gate-duties", json=payload, headers=gkm)
    assert put.status_code == 200, put.text

    listed = client.get("/api/v1/ops/gate-duties", headers=gk)
    assert listed.status_code == 200
    assert any(row["id"] == "GDU-P2-0001" for row in listed.json())


def test_gatekeeper_can_upsert_incidents(client):
    headers = _login(client, GATEKEEPER)
    payload = [
        {
            "id": "GIN-P2-0001",
            "incidentType": "Unauthorized Entry Attempt",
            "location": "Main Gate",
            "description": "Phase 2 UAT",
            "status": "Open",
            "priority": "High",
        }
    ]
    put = client.put("/api/v1/ops/gate-incidents", json=payload, headers=headers)
    assert put.status_code == 200, put.text
    get = client.get("/api/v1/ops/gate-incidents", headers=headers)
    assert get.status_code == 200
    assert any(row["id"] == "GIN-P2-0001" for row in get.json())


def test_teacher_denied_gate_ops_write(client):
    headers = _login(client, TEACHER)
    for collection in ("gate-visitors", "gate-duties", "gate-incidents"):
        put = client.put(
            f"/api/v1/ops/{collection}",
            json=[{"id": "NOPE-1", "status": "Open"}],
            headers=headers,
        )
        assert put.status_code == 403, collection


def test_gatekeeper_fo_gate_pass_read_ok_write_blocked(client):
    headers = _login(client, GATEKEEPER)
    listed = client.get("/api/v1/front-office/student-gate-passes", headers=headers)
    assert listed.status_code == 200, listed.text
    created = client.post(
        "/api/v1/front-office/student-gate-passes",
        json={"studentName": "Nope", "status": "Pending"},
        headers=headers,
    )
    assert created.status_code == 403


def test_gatekeeper_denied_finance_and_admin_users(client):
    headers = _login(client, GATEKEEPER)
    finance = client.get("/api/v1/finance/state", headers=headers)
    assert finance.status_code == 403
    users = client.get("/api/v1/admin/users", headers=headers)
    assert users.status_code == 403


def test_gatekeeper_live_registers_handover_vendors_and_team_attendance(client):
    headers = _login(client, GATEKEEPER)
    cases = [
        ("gate-registers", {"id": "GRG-P2-1", "title": "Night register", "status": "Open"}),
        ("gate-handover", {"id": "GHO-P2-1", "title": "Morning handover", "status": "Open"}),
        ("gate-vendors", {"id": "GVD-P2-1", "title": "AC Vendor", "status": "Checked In"}),
        (
            "gate-team-attendance",
            {
                "id": "GTA-P2-1",
                "name": "Gate Keeper",
                "employeeId": "GKP-1",
                "gate": "Main Gate",
                "date": "2026-11-24",
                "attendanceStatus": "Present",
            },
        ),
    ]
    for collection, row in cases:
        put = client.put(f"/api/v1/ops/{collection}", json=[row], headers=headers)
        assert put.status_code == 200, f"{collection}: {put.text}"
        listed = client.get(f"/api/v1/ops/{collection}", headers=headers)
        assert listed.status_code == 200, collection
        assert any(item.get("id") == row["id"] for item in listed.json()), collection
