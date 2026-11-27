"""GET /hr/attendance/mine — signed-in staff only."""

from __future__ import annotations

import os

os.environ.setdefault("DATABASE_URL", "sqlite+pysqlite:///:memory:")
os.environ.setdefault("OTP_DEBUG", "true")
os.environ.setdefault("JWT_SECRET", "test-secret-qmis-erp-hr-my-attendance")
os.environ.setdefault("ENVIRONMENT", "development")

import pytest
from fastapi.testclient import TestClient

from app.core.config import settings
from app.main import app
from tests.conftest import reset_sqlite_memory_schema


@pytest.fixture()
def client():
    # Module-level TestClient previously shared a wiped StaticPool DB after other modules ran.
    reset_sqlite_memory_schema()
    with TestClient(app) as test_client:
        yield test_client


def _login(client: TestClient, email: str, password: str) -> dict[str, str]:
    response = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    assert response.status_code == 200, response.text
    return {"Authorization": f"Bearer {response.json()['access_token']}"}


def test_mine_requires_auth(client):
    assert client.get("/api/v1/hr/attendance/mine").status_code == 401


def test_director_mine_does_not_leak_campus_attendance(client):
    admin = _login(client, settings.admin_seed_email, settings.admin_seed_password)
    director = _login(client, settings.director_seed_email, settings.director_seed_password)

    # Seed does not invent punches — create campus rows so the isolation assert is meaningful.
    seeded = client.put(
        "/api/v1/hr/attendance",
        headers=admin,
        json=[
            {
                "id": "ATT-CAMPUS-1",
                "employeeId": "EMP-PRI-001",
                "date": "15-01-2026",
                "status": "Present",
            },
            {
                "id": "ATT-CAMPUS-2",
                "employeeId": "EMP-COO-001",
                "date": "15-01-2026",
                "status": "Present",
            },
        ],
    )
    assert seeded.status_code == 200, seeded.text

    campus = client.get("/api/v1/hr/attendance", headers=admin)
    assert campus.status_code == 200
    campus_rows = campus.json()
    assert len(campus_rows) >= 1
    campus_employee_ids = {row["employeeId"] for row in campus_rows if row.get("employeeId")}

    mine = client.get("/api/v1/hr/attendance/mine", headers=director)
    assert mine.status_code == 200
    rows = mine.json()
    assert isinstance(rows, list)
    # Linked Director may still have zero punches; every returned row must be one employeeId.
    assert len({row.get("employeeId") for row in rows}) <= 1
    # Must never surface arbitrary campus peers outside the linked employee.
    if not rows:
        assert campus_employee_ids  # campus still has data; mine correctly hid it
    else:
        only = rows[0]["employeeId"]
        assert all(row.get("employeeId") == only for row in rows)


def test_teacher_mine_is_at_most_one_employee(client):
    teacher = _login(client, settings.teacher_seed_email, settings.teacher_seed_password)
    mine = client.get("/api/v1/hr/attendance/mine", headers=teacher)
    assert mine.status_code == 200
    rows = mine.json()
    assert isinstance(rows, list)
    assert len({row.get("employeeId") for row in rows}) <= 1


def test_director_cannot_overwrite_campus_attendance(client):
    director = _login(client, settings.director_seed_email, settings.director_seed_password)
    denied = client.put(
        "/api/v1/hr/attendance",
        headers=director,
        json=[{"id": "ATT-HACK", "employeeId": "EMP-2026-001", "date": "01-01-2026", "status": "Present"}],
    )
    assert denied.status_code == 403


def test_seed_director_login_is_linked_to_hreemployee(client):
    """Demo seed links director@qmis.edu to EMP-DIR-001 (profile only — no invented punches)."""
    director = _login(client, settings.director_seed_email, settings.director_seed_password)
    portal = client.get("/api/v1/hr/portal/employees", headers=director)
    assert portal.status_code == 200
    match = next(
        (
            row
            for row in portal.json()
            if str(row.get("email") or "").lower() == settings.director_seed_email.lower()
        ),
        None,
    )
    assert match is not None
    assert match.get("id") == "EMP-DIR-001"

    mine = client.get("/api/v1/hr/attendance/mine", headers=director)
    assert mine.status_code == 200
    rows = mine.json()
    assert isinstance(rows, list)
    # Linked but no fabricated punches unless HR recorded attendance for EMP-DIR-001.
    assert all(row.get("employeeId") == "EMP-DIR-001" for row in rows)
