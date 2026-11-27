"""Ops portal roles: designation map, login role, FE homes, authz, password recovery."""

from __future__ import annotations

import os
from pathlib import Path

os.environ["DATABASE_URL"] = "sqlite+pysqlite:///:memory:"
os.environ["OTP_DEBUG"] = "true"
os.environ["JWT_SECRET"] = "test-secret-qmis-erp-ops-role-login-portals"
os.environ["ENVIRONMENT"] = "development"

import pytest
from fastapi.testclient import TestClient

from app.core.config import settings
from app.main import app
from app.permissions.matrix import ROLE_PERMISSIONS
from app.services.admin_users import creatable_roles_for
from app.services.staff_designation_map import map_role_from_designation

SRC = Path(__file__).resolve().parents[2] / "src"
AUTH = (SRC / "context" / "AuthContext.jsx").read_text(encoding="utf-8")
ROLES_JS = (SRC / "constants" / "roles.js").read_text(encoding="utf-8")

# Sheet designations → required portal roles.
SHEET_MAP = [
    ("Public Relations Officer", "pro"),
    ("Assistant PRO", "pro"),
    ("Control Room - Officer", "cctv"),
    ("CCTV Operator", "cctv"),
    ("File Room Officer", "fileroom"),
    ("File Room & Stores - In-charge", "fileroom"),
    ("Transport Manager", "transportmanager"),
    ("Maintenance Officer", "maintenancemanager"),
    ("Housekeeping Manager", "housekeepingmanager"),
]

SEED_LOGINS = [
    ("pro", settings.pro_seed_email, settings.pro_seed_password, "/pro/dashboard"),
    ("cctv", settings.cctv_seed_email, settings.cctv_seed_password, "/cctv-room/dashboard"),
    ("fileroom", settings.fileroom_seed_email, settings.fileroom_seed_password, "/file-room/dashboard"),
    ("transportmanager", "transportmanager@qmis.edu", "transport123", "/transport-manager/dashboard"),
    ("housekeepingmanager", "housekeepingmanager@qmis.edu", "housekeeping123", "/housekeeping-manager/dashboard"),
    ("maintenancemanager", "maintenancemanager@qmis.edu", "maintenance123", "/maintenance-manager/dashboard"),
]


@pytest.fixture()
def client():
    with TestClient(app) as test_client:
        yield test_client


def _login(client, email, password):
    r = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    assert r.status_code == 200, r.text
    body = r.json()
    assert "access_token" in body
    assert "role" in body
    return body


def test_sheet_designations_map_to_required_roles():
    for designation, want in SHEET_MAP:
        assert map_role_from_designation(designation) == want, designation


def test_frontend_role_constants_and_home_paths():
    for code in ("pro", "cctv", "fileroom", "transportmanager", "housekeepingmanager", "maintenancemanager"):
        assert f"'{code}'" in ROLES_JS or f'"{code}"' in ROLES_JS
    assert "[ROLES.PRO]: '/pro/dashboard'" in AUTH
    assert "[ROLES.CCTV]: '/cctv-room/dashboard'" in AUTH
    assert "[ROLES.FILE_ROOM]: '/file-room/dashboard'" in AUTH
    assert "[ROLES.TRANSPORT_MANAGER]: '/transport-manager/dashboard'" in AUTH
    assert "[ROLES.HOUSEKEEPING_MANAGER]: '/housekeeping-manager/dashboard'" in AUTH
    assert "[ROLES.MAINTENANCE_MANAGER]: '/maintenance-manager/dashboard'" in AUTH


@pytest.mark.parametrize("role,email,password,home", SEED_LOGINS)
def test_login_api_returns_expected_role_and_me(client, role, email, password, home):
    body = _login(client, email, password)
    assert body["role"] == role
    me = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {body['access_token']}"})
    assert me.status_code == 200, me.text
    payload = me.json()
    assert payload["role"] == role
    assert payload["email"] == email.lower()
    assert payload["is_active"] is True
    assert isinstance(payload.get("permissions"), (list, dict))
    perms = payload["permissions"] if isinstance(payload["permissions"], list) else list(payload["permissions"])
    assert len(perms) >= 1
    # Home path is FE config; assert it exists for this role.
    assert home in AUTH


def test_role_permission_matrices_are_non_empty_and_scoped():
    for role, _, _, _ in SEED_LOGINS:
        perms = set(ROLE_PERMISSIONS[role])
        assert perms, role
        # Ops portals must not mint campus administrators.
        assert "users.write" not in perms


def test_cross_role_admin_users_denied_for_ops_portals(client):
    for role, email, password, _ in SEED_LOGINS:
        body = _login(client, email, password)
        headers = {"Authorization": f"Bearer {body['access_token']}"}
        denied = client.get("/api/v1/admin/users", headers=headers)
        assert denied.status_code == 403, f"{role} must not list admin users"


def test_fileroom_and_cctv_are_superadmin_creatable_only():
    admin = set(creatable_roles_for("admin"))
    hr = set(creatable_roles_for("hr"))
    sa = set(creatable_roles_for("superadmin"))
    for code in ("fileroom", "cctv"):
        assert code not in admin
        assert code not in hr
        assert code in sa
    for code in ("pro", "transportmanager", "housekeepingmanager"):
        assert code in admin
        assert code in sa


def test_password_reset_and_change_workflow_for_fileroom(client):
    sa = _login(client, settings.superadmin_seed_email, settings.superadmin_seed_password)
    sa_headers = {"Authorization": f"Bearer {sa['access_token']}"}

    created = client.post(
        "/api/v1/admin/users",
        headers=sa_headers,
        json={
            "role": "fileroom",
            "firstName": "File",
            "lastName": "Recovery",
            "email": "fileroom.recovery@qmis.edu",
            "gender": "Female",
            "status": "Active",
        },
    )
    assert created.status_code == 201, created.text
    body = created.json()
    user_id = body["id"]
    temporary = body.get("temporaryPassword")
    assert temporary

    reset = client.post(f"/api/v1/admin/users/{user_id}/reset-password", headers=sa_headers)
    assert reset.status_code == 200, reset.text
    temporary = reset.json().get("temporaryPassword")
    assert temporary

    first = _login(client, "fileroom.recovery@qmis.edu", temporary)
    assert first["role"] == "fileroom"
    assert first["must_change_password"] is True
    headers = {"Authorization": f"Bearer {first['access_token']}"}

    changed = client.post(
        "/api/v1/auth/change-password",
        headers=headers,
        json={"current_password": temporary, "new_password": "FileRoom!Change99"},
    )
    assert changed.status_code == 200, changed.text
    assert changed.json().get("must_change_password") is False

    again = _login(client, "fileroom.recovery@qmis.edu", "FileRoom!Change99")
    assert again["role"] == "fileroom"
    assert again["must_change_password"] is False
