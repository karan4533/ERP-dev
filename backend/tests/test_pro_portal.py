"""Dedicated PRO portal — role, home permissions, authorized APIs, denials."""

import os

os.environ["DATABASE_URL"] = "sqlite+pysqlite:///:memory:"
os.environ["OTP_DEBUG"] = "true"
os.environ["JWT_SECRET"] = "test-secret-qmis-erp-pro-portal"

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


def test_pro_role_matrix_keeps_admissions_not_announcement_write():
    perms = set(ROLE_PERMISSIONS["pro"])
    assert {
        "admissions.write",
        "frontoffice.read",
        "frontoffice.write",
        "announcements.read",
        "activities.read",
        "communication.read",
        "communication.write",
        "ops.read",
        "ops.write",
    } <= perms
    assert "announcements.write" not in perms
    assert "activities.write" not in perms
    assert "users.write" not in perms
    assert "activities.approve" not in perms


def test_pro_login_me_and_home_permissions(client):
    headers = _h(client, "pro@qmis.edu", "pro12345")
    me = client.get("/api/v1/auth/me", headers=headers)
    assert me.status_code == 200, me.text
    body = me.json()
    assert body["role"] == "pro"
    perms = set(body.get("permissions") or [])
    assert "announcements.read" in perms
    assert "announcements.write" not in perms
    assert "activities.read" in perms
    assert "activities.write" not in perms
    assert "admissions.write" in perms


def test_pro_can_read_announcements_enquiries_activities_communication(client):
    headers = _h(client, "pro@qmis.edu", "pro12345")
    assert client.get("/api/v1/announcements", headers=headers).status_code == 200
    assert client.get("/api/v1/admissions/enquiries", headers=headers).status_code == 200
    assert client.get("/api/v1/activities", headers=headers).status_code == 200
    assert client.get("/api/v1/communication/conversations", headers=headers).status_code == 200


def test_pro_can_write_government_liaison_cases(client):
    headers = _h(client, "pro@qmis.edu", "pro12345")
    saved = client.put(
        "/api/v1/ops/pro-gov-cases",
        headers=headers,
        json=[
            {
                "id": "PGC-1",
                "authority": "Education Dept",
                "subject": "Recognition renewal",
                "status": "Open",
                "deadline": "2026-12-15",
                "owner": "PRO",
            }
        ],
    )
    assert saved.status_code == 200, saved.text
    rows = client.get("/api/v1/ops/pro-gov-cases", headers=headers)
    assert rows.status_code == 200, rows.text
    assert rows.json()[0]["authority"] == "Education Dept"


def test_pro_denied_announcement_write_activity_write_and_admin_users(client):
    headers = _h(client, "pro@qmis.edu", "pro12345")
    assert client.post(
        "/api/v1/announcements",
        headers=headers,
        data={
            "title": "PRO should not create",
            "category": "Staff Notice",
            "message": "denied",
        },
    ).status_code == 403
    assert client.post(
        "/api/v1/activities",
        headers=headers,
        json={
            "type": "cultural",
            "eventName": "PRO cannot create",
            "className": "All Students",
            "eventDate": "2026-12-01",
            "coordinator": "N/A",
        },
    ).status_code == 403
    assert client.get("/api/v1/admin/users", headers=headers).status_code == 403


def test_prm_login_still_works_and_keeps_front_office_perms(client):
    headers = _h(client, "prm@qmis.edu", "prm12345")
    me = client.get("/api/v1/auth/me", headers=headers)
    assert me.status_code == 200, me.text
    assert me.json()["role"] == "prm"
    perms = set(me.json().get("permissions") or [])
    assert "admissions.write" in perms
    assert "frontoffice.write" in perms
    assert client.get("/api/v1/admissions/enquiries", headers=headers).status_code == 200
