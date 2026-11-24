"""W1: role normalization + Front Office / ops visitors persistence and RBAC."""

import os

os.environ["DATABASE_URL"] = "sqlite+pysqlite:///:memory:"
os.environ["OTP_DEBUG"] = "true"
os.environ["JWT_SECRET"] = "test-secret-qmis-erp-phase0-local"
os.environ["ENVIRONMENT"] = "development"

import pytest
from fastapi.testclient import TestClient

from app.core.config import settings
from app.main import app
from app.permissions.matrix import (
    ALL_ROLES,
    ROLE_ALIASES,
    ROLE_PERMISSIONS,
    normalize_role_code,
)

ADMIN = (settings.admin_seed_email, settings.admin_seed_password)
PRM = (settings.prm_seed_email, settings.prm_seed_password)
TEACHER = (settings.teacher_seed_email, settings.teacher_seed_password)


@pytest.fixture()
def client():
    with TestClient(app) as test_client:
        yield test_client


def _login(client, who):
    response = client.post("/api/v1/auth/login", json={"email": who[0], "password": who[1]})
    assert response.status_code == 200, response.text
    return {"Authorization": f"Bearer {response.json()['access_token']}"}


def test_normalize_role_code_aliases():
    assert normalize_role_code("front_office") == "prm"
    assert normalize_role_code("FrontOffice") == "prm"
    assert normalize_role_code("van_driver") == "driver"
    assert normalize_role_code("md") == "managing_director"
    assert normalize_role_code("financeassistant") == "finance_assistant"
    assert normalize_role_code("account_head") == "accounthead"
    assert normalize_role_code("prm") == "prm"
    assert normalize_role_code("") == ""


def test_w1_frontend_portal_roles_registered_in_matrix():
    codes = {code for code, _ in ALL_ROLES}
    for role in ("maintenancemanager", "pro", "fileroom", "cctv", "managing_director", "finance_assistant"):
        assert role in codes
        assert role in ROLE_PERMISSIONS
    for alias in ("front_office", "vandriver", "md", "account_head"):
        assert alias in ROLE_ALIASES


def test_unauthenticated_visitors_return_401(client):
    response = client.get("/api/v1/ops/gate-visitors")
    assert response.status_code == 401
    fo = client.get("/api/v1/front-office/visitors")
    assert fo.status_code == 401


def test_teacher_denied_gate_visitors_write(client):
    headers = _login(client, TEACHER)
    put = client.put(
        "/api/v1/ops/gate-visitors",
        headers=headers,
        json=[{"id": "GVS-NOPE", "visitorName": "Nope", "status": "Checked In"}],
    )
    assert put.status_code == 403


def test_prm_ops_gate_visitors_create_list_checkout_persist(client):
    headers = _login(client, PRM)
    visitor_id = "GVS-W1-0001"
    payload = [
        {
            "id": visitor_id,
            "visitorName": "W1 Test Visitor",
            "phone": "9999900001",
            "personToMeet": "Front Desk",
            "purpose": "UAT check-in",
            "status": "Checked In",
            "checkInAt": "2026-11-22T10:00:00+00:00",
        }
    ]
    created = client.put("/api/v1/ops/gate-visitors", headers=headers, json=payload)
    assert created.status_code == 200, created.text
    assert any(row.get("id") == visitor_id for row in created.json())

    listed = client.get("/api/v1/ops/gate-visitors", headers=headers)
    assert listed.status_code == 200, listed.text
    match = next(row for row in listed.json() if row.get("id") == visitor_id)
    assert match["visitorName"] == "W1 Test Visitor"
    assert match["status"] == "Checked In"

    updated = [{**match, "status": "Checked Out", "checkOutAt": "2026-11-22T12:00:00+00:00"}]
    checked_out = client.put("/api/v1/ops/gate-visitors", headers=headers, json=updated)
    assert checked_out.status_code == 200, checked_out.text
    again = client.get("/api/v1/ops/gate-visitors", headers=headers)
    assert again.status_code == 200
    final = next(row for row in again.json() if row.get("id") == visitor_id)
    assert final["status"] == "Checked Out"
    assert final.get("checkOutAt")


def test_front_office_visitors_alias_delegates_to_ops(client):
    headers = _login(client, ADMIN)
    visitor_id = "GVS-W1-ALIAS"
    created = client.post(
        "/api/v1/front-office/visitors",
        headers=headers,
        json={
            "id": visitor_id,
            "visitorName": "Alias Visitor",
            "purpose": "FO alias",
            "status": "Checked In",
        },
    )
    assert created.status_code == 201, created.text
    assert created.json().get("id") == visitor_id

    fo_list = client.get("/api/v1/front-office/visitors", headers=headers)
    assert fo_list.status_code == 200, fo_list.text
    assert any(row.get("id") == visitor_id for row in fo_list.json())

    ops_list = client.get("/api/v1/ops/gate-visitors", headers=headers)
    assert ops_list.status_code == 200, ops_list.text
    assert any(row.get("id") == visitor_id for row in ops_list.json())


def test_unknown_front_office_collection_still_404(client):
    headers = _login(client, ADMIN)
    response = client.get("/api/v1/front-office/not-a-real-collection", headers=headers)
    assert response.status_code == 404
