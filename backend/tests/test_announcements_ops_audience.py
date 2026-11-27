"""Client review R58 / R68: operations department heads receive school announcements and can respond."""

import os
import uuid

os.environ["DATABASE_URL"] = "sqlite+pysqlite:///:memory:"
os.environ["OTP_DEBUG"] = "true"
os.environ["JWT_SECRET"] = "test-secret-qmis-erp-ops-audience"

import pytest
from fastapi.testclient import TestClient

from app.core.config import settings
from app.main import app
from app.services.announcements import DEFAULT_AUDIENCE

ADMIN = (settings.admin_seed_email, settings.admin_seed_password)
HR = (settings.hr_seed_email, settings.hr_seed_password)
ACCOUNT_HEAD = (settings.accounthead_seed_email, settings.accounthead_seed_password)
OPS_ROLES = ["housekeepingmanager", "stationerystoremanager", "canteenmanager", "itsupportmanager", "transportmanager"]


@pytest.fixture(scope="module")
def client():
    with TestClient(app) as test_client:
        yield test_client


def _login(client, email, password):
    response = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    assert response.status_code == 200, response.text
    return {"Authorization": f"Bearer {response.json()['access_token']}"}


def _hire(client, role: str) -> dict:
    hr = _login(client, *HR)
    email = f"{role}.{uuid.uuid4().hex[:6]}@example.com"
    created = client.post(
        "/api/v1/hr/staff",
        headers=hr,
        json={"id": f"EMP-{uuid.uuid4().hex[:6].upper()}", "name": role, "email": email, "role": role, "department": "Operations"},
    )
    assert created.status_code == 201, created.text
    first = _login(client, email, created.json()["temporaryPassword"])
    changed = client.post(
        "/api/v1/auth/change-password",
        headers=first,
        json={"current_password": created.json()["temporaryPassword"], "new_password": "Secure-Pass-99"},
    )
    assert changed.status_code == 200, changed.text
    return _login(client, email, "Secure-Pass-99")


def _send(client, headers) -> dict:
    response = client.post(
        "/api/v1/announcements",
        data={"title": f"Ops notice {uuid.uuid4().hex[:6]}", "category": "Staff Notice", "message": "Read and confirm."},
        headers=headers,
    )
    assert response.status_code == 201, response.text
    return response.json()


def test_operations_department_heads_are_in_the_default_audience():
    for role in OPS_ROLES:
        assert role in DEFAULT_AUDIENCE
    assert "accounthead" not in DEFAULT_AUDIENCE and "hr" not in DEFAULT_AUDIENCE


@pytest.mark.parametrize("role", ["housekeepingmanager", "stationerystoremanager"])
def test_ops_head_receives_acknowledges_and_replies(client, role):
    made = _send(client, _login(client, *ADMIN))
    me = _hire(client, role)

    listed = client.get("/api/v1/announcements", headers=me)
    assert listed.status_code == 200, listed.text
    assert made["id"] in [row["id"] for row in listed.json()]
    notes = client.get("/api/v1/notifications", headers=me).json()
    assert [n for n in notes if n["entityType"] == "announcement" and n["entityId"] == made["id"]]

    acked = client.post(f"/api/v1/announcements/{made['id']}/acknowledge", headers=me)
    assert acked.status_code == 200 and acked.json()["acknowledged"] is True
    replied = client.post(f"/api/v1/announcements/{made['id']}/replies", json={"text": "Noted."}, headers=me)
    assert replied.status_code == 201, replied.text
    assert [r for r in replied.json()["replies"] if r["mine"] and r["text"] == "Noted."]

    sender_view = client.get(f"/api/v1/announcements/{made['id']}", headers=_login(client, *ADMIN)).json()
    assert [r for r in sender_view["replies"] if r["by"] == role and r["text"] == "Noted."]


def test_housekeeping_notice_reaches_stationery(client):
    made = _send(client, _hire(client, "housekeepingmanager"))
    stationery = _hire(client, "stationerystoremanager")
    assert made["id"] in [row["id"] for row in client.get("/api/v1/announcements", headers=stationery).json()]


def test_roles_outside_the_audience_still_cannot_see_it(client):
    made = _send(client, _login(client, *ADMIN))
    outsider = _login(client, *ACCOUNT_HEAD)
    assert made["id"] not in [row["id"] for row in client.get("/api/v1/announcements", headers=outsider).json()]
    assert client.get(f"/api/v1/announcements/{made['id']}", headers=outsider).status_code == 404
