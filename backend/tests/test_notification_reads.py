import os
from uuid import UUID

os.environ["DATABASE_URL"] = "sqlite+pysqlite:///:memory:"
os.environ["OTP_DEBUG"] = "true"
os.environ["JWT_SECRET"] = "test-secret-qmis-erp-notification-reads"

import pytest
from fastapi.testclient import TestClient

from app.core.database import SessionLocal
from app.main import app
from app.models import Notification, User
from auth_test_helpers import login_headers
from tests.conftest import reset_sqlite_memory_schema

SECOND = ("second.coordinator@example.com", "Coordinator-Test-2026")


@pytest.fixture()
def world():
    reset_sqlite_memory_schema()
    with TestClient(app) as c:
        admin = login_headers(c, "admin@qmis.edu", "admin123")
        created = c.post("/api/v1/admin/users", headers=admin, json={
            "role": "coordinator", "firstName": "Second", "lastName": "Coordinator", "email": SECOND[0],
            "gender": "Female", "mobileNumber": "9876500011", "city": "Madurai", "qualification": "M.Ed",
            "password": SECOND[1]})
        assert created.status_code == 201, created.text
        first = login_headers(c, "coordinator@qmis.edu", "coord123")
        second = login_headers(c, *SECOND)
        with SessionLocal() as db:
            campus_id = db.query(User).filter(User.email == "coordinator@qmis.edu").one().campus_id
            role_wide = Notification(campus_id=campus_id, role_code="coordinator", title="Band meeting at 3 pm",
                                     entity_type="test", entity_id="role-wide")
            db.add(role_wide)
            db.commit()
            notice_id = str(role_wide.id)
        yield c, first, second, notice_id


def _mine(client, headers, notice_id):
    rows = client.get("/api/v1/notifications", headers=headers).json()
    return next(row for row in rows if row["id"] == notice_id)


def test_reading_a_role_wide_notice_marks_it_read_only_for_that_person(world):
    client, first, second, notice_id = world
    assert _mine(client, first, notice_id)["read"] is False
    assert _mine(client, second, notice_id)["read"] is False

    marked = client.post(f"/api/v1/notifications/{notice_id}/read", headers=first)
    assert marked.status_code == 200 and marked.json()["read"] is True
    assert _mine(client, first, notice_id)["read"] is True
    assert _mine(client, second, notice_id)["read"] is False

    # marking again is harmless
    assert client.post(f"/api/v1/notifications/{notice_id}/read", headers=first).status_code == 200
    assert client.post(f"/api/v1/notifications/{notice_id}/read", headers=second).json()["read"] is True
    assert _mine(client, second, notice_id)["read"] is True

    with SessionLocal() as db:
        assert db.get(Notification, UUID(notice_id)).read_at is None


def test_other_roles_cannot_read_or_mark_a_role_wide_notice(world):
    client, _, _, notice_id = world
    teacher = login_headers(client, "teacher@qmis.edu", "teacher123")
    assert all(row["id"] != notice_id for row in client.get("/api/v1/notifications", headers=teacher).json())
    assert client.post(f"/api/v1/notifications/{notice_id}/read", headers=teacher).status_code == 404
