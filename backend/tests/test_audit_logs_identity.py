"""Super Admin Activity Logs: actor identity, detail GET, and append-only access."""

import os

os.environ["DATABASE_URL"] = "sqlite+pysqlite:///:memory:"
os.environ["OTP_DEBUG"] = "true"
os.environ["JWT_SECRET"] = "test-secret-qmis-erp-audit-logs"

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import select

from app.core.database import SessionLocal
from app.main import app
from app.models import AuditLog, User, UserProfile
from app.services.audit import write_audit
from tests.conftest import reset_sqlite_memory_schema


@pytest.fixture()
def client():
    reset_sqlite_memory_schema()
    with TestClient(app) as test_client:
        yield test_client


def _login(client: TestClient, email: str, password: str) -> str:
    response = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    assert response.status_code == 200, response.text
    return response.json()["access_token"]


def _headers(client: TestClient, email: str, password: str) -> dict:
    return {"Authorization": f"Bearer {_login(client, email, password)}"}


def test_audit_logs_return_actor_identity_not_system_for_login(client):
    headers = _headers(client, "admin@qmis.edu", "admin123")
    rows = client.get("/api/v1/audit-logs", headers=headers)
    assert rows.status_code == 200, rows.text
    body = rows.json()
    assert isinstance(body, list) and body
    login_rows = [row for row in body if row["action"] == "LOGIN"]
    assert login_rows
    for row in login_rows:
        assert row["actor_id"]
        assert row["actor_name"] != "System"
        assert row["actor_email"] == "admin@qmis.edu"
        assert row["actor_role"] == "admin"
        assert row["created_at"]
        assert "ip_address" in row


def test_audit_logs_system_only_when_actor_missing(client):
    headers = _headers(client, "admin@qmis.edu", "admin123")
    with SessionLocal() as db:
        admin = db.scalar(select(User).where(User.email == "admin@qmis.edu"))
        assert admin is not None
        write_audit(
            db,
            action="BOOTSTRAP_MAINTENANCE",
            entity_type="system",
            entity_id="job-1",
            campus_id=admin.campus_id,
            actor_id=None,
            details="nightly cleanup",
        )
        db.commit()

    rows = client.get("/api/v1/audit-logs", headers=headers).json()
    system_rows = [row for row in rows if row["action"] == "BOOTSTRAP_MAINTENANCE"]
    assert system_rows
    assert system_rows[0]["actor_name"] == "System"
    assert system_rows[0]["actor_id"] is None
    assert system_rows[0]["actor_role"] == "system"


def test_audit_log_get_by_id_and_profile_name(client):
    headers = _headers(client, "admin@qmis.edu", "admin123")
    with SessionLocal() as db:
        admin = db.scalar(select(User).where(User.email == "admin@qmis.edu"))
        assert admin is not None
        existing = db.scalar(select(UserProfile).where(UserProfile.user_id == admin.id))
        if existing is None:
            db.add(
                UserProfile(
                    user_id=admin.id,
                    campus_id=admin.campus_id,
                    staff_code="ADM-TEST-001",
                    first_name="Campus",
                    middle_name="",
                    last_name="Administrator",
                )
            )
        else:
            existing.first_name = "Campus"
            existing.last_name = "Administrator"
        write_audit(
            db,
            action="PROFILE_TOUCH",
            entity_type="user",
            entity_id=str(admin.id),
            actor_id=admin.id,
            campus_id=admin.campus_id,
            details='{"before":{"x":1},"after":{"x":2}}',
        )
        db.commit()
        log_id = db.scalar(
            select(AuditLog.id)
            .where(AuditLog.action == "PROFILE_TOUCH", AuditLog.actor_id == admin.id)
            .order_by(AuditLog.created_at.desc())
        )

    detail = client.get(f"/api/v1/audit-logs/{log_id}", headers=headers)
    assert detail.status_code == 200, detail.text
    body = detail.json()
    assert body["id"] == str(log_id)
    assert body["actor_name"] == "Campus Administrator"
    assert body["actor_email"] == "admin@qmis.edu"
    assert body["action"] == "PROFILE_TOUCH"
    assert body["details"]


def test_audit_logs_forbidden_without_permission_and_no_mutation_routes(client):
    teacher = _headers(client, "teacher@qmis.edu", "teacher123")
    assert client.get("/api/v1/audit-logs", headers=teacher).status_code == 403
    admin = _headers(client, "admin@qmis.edu", "admin123")
    rows = client.get("/api/v1/audit-logs", headers=admin).json()
    assert rows
    target = rows[0]["id"]
    assert client.delete(f"/api/v1/audit-logs/{target}", headers=admin).status_code in {404, 405}
    assert client.patch(f"/api/v1/audit-logs/{target}", headers=admin, json={"action": "X"}).status_code in {
        404,
        405,
    }
    assert client.get("/api/v1/audit-logs/not-a-uuid", headers=admin).status_code == 404
