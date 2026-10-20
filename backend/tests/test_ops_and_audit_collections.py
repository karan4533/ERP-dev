"""Ops + campus-audit JSON collections replace/list + role gates."""

import os

os.environ["DATABASE_URL"] = "sqlite+pysqlite:///:memory:"
os.environ["OTP_DEBUG"] = "true"
os.environ["JWT_SECRET"] = "test-secret-qmis-erp-phase0-local"
os.environ["ENVIRONMENT"] = "development"

import pytest
from fastapi.testclient import TestClient

from app.core.config import settings
from app.main import app

TEACHER = (settings.teacher_seed_email, settings.teacher_seed_password)


@pytest.fixture()
def client():
    with TestClient(app) as test_client:
        yield test_client


def _login(client, email: str, password: str):
    response = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    assert response.status_code == 200, response.text
    return {"Authorization": f"Bearer {response.json()['access_token']}"}


def _admin_headers(client):
    return _login(client, settings.admin_seed_email, settings.admin_seed_password)


def test_ops_library_replace_and_list(client):
    headers = _admin_headers(client)
    payload = [
        {
            "id": "LBK-1001",
            "title": "NCERT Physics XI",
            "author": "NCERT",
            "isbn": "978-81-7450-567-5",
            "status": "Available",
        }
    ]
    put = client.put("/api/v1/ops/library-books", json=payload, headers=headers)
    assert put.status_code == 200, put.text
    assert put.json()[0]["id"] == "LBK-1001"

    get = client.get("/api/v1/ops/library-books", headers=headers)
    assert get.status_code == 200
    assert get.json()[0]["title"] == "NCERT Physics XI"


def test_teacher_denied_library_write(client):
    headers = _login(client, TEACHER[0], TEACHER[1])
    put = client.put(
        "/api/v1/ops/library-books",
        json=[{"id": "LBK-9999", "title": "Nope"}],
        headers=headers,
    )
    assert put.status_code == 403


def test_biometric_teacher_can_write(client):
    headers = _login(client, TEACHER[0], TEACHER[1])
    put = client.put(
        "/api/v1/ops/biometric-attendance",
        json=[
            {
                "id": "BIO-1001",
                "person": "Aarav Sharma",
                "biometricStatus": "Present",
                "finalStatus": "Present",
                "source": "ESSL",
            }
        ],
        headers=headers,
    )
    assert put.status_code == 200, put.text
    get = client.get("/api/v1/ops/biometric-attendance", headers=headers)
    assert get.status_code == 200
    assert get.json()[0]["id"] == "BIO-1001"


def test_campus_audit_replace_and_list(client):
    headers = _admin_headers(client)
    payload = [{"id": "ATM-1", "name": "Safety Walkthrough", "status": "Published"}]
    put = client.put("/api/v1/campus-audit/audit-templates", json=payload, headers=headers)
    assert put.status_code == 200, put.text
    get = client.get("/api/v1/campus-audit/audit-templates", headers=headers)
    assert get.status_code == 200
    assert get.json()[0]["name"] == "Safety Walkthrough"


def test_teacher_denied_campus_audit(client):
    headers = _login(client, TEACHER[0], TEACHER[1])
    put = client.put(
        "/api/v1/campus-audit/audit-templates",
        json=[{"id": "ATM-X", "name": "Nope"}],
        headers=headers,
    )
    assert put.status_code == 403


def test_accounthead_can_read_transport_masters(client):
    admin = _admin_headers(client)
    put = client.put(
        "/api/v1/ops/transport-routes",
        json=[{"id": "RT-AH-1", "routeName": "Route North — Live"}],
        headers=admin,
    )
    assert put.status_code == 200, put.text

    ah = _login(client, settings.accounthead_seed_email, settings.accounthead_seed_password)
    get = client.get("/api/v1/ops/transport-routes", headers=ah)
    assert get.status_code == 200, get.text
    assert get.json()[0]["routeName"] == "Route North — Live"

    # Read-only: Account Head must not overwrite transport ops masters.
    denied = client.put(
        "/api/v1/ops/transport-routes",
        json=[{"id": "RT-AH-X", "routeName": "Nope"}],
        headers=ah,
    )
    assert denied.status_code == 403
