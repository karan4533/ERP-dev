"""Central Admin + Super Admin: provision, auth, isolation, authorization."""

from __future__ import annotations

import os
from pathlib import Path

os.environ["DATABASE_URL"] = "sqlite+pysqlite:///:memory:"
os.environ["OTP_DEBUG"] = "true"
os.environ["JWT_SECRET"] = "test-secret-qmis-erp-central-admin-accounts"
os.environ["ENVIRONMENT"] = "development"

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import select

from app.core.config import settings
from app.core.database import SessionLocal
from app.core.security import verify_password
from app.main import app
from app.models import Campus, Role, User, UserProfile
from app.services.admin_users import creatable_roles_for
from app.services.central_admin_provision import (
    central_account_targets,
    provision_central_admins,
)
from app.services.staff_login_provision import write_credential_handoff

USERS = "/api/v1/admin/users"
AUTH = (Path(__file__).resolve().parents[2] / "src" / "context" / "AuthContext.jsx").read_text(
    encoding="utf-8"
)


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
    return body, {"Authorization": f"Bearer {body['access_token']}"}


def _complete_first_login(client, email, temporary, new_password):
    body, headers = _login(client, email, temporary)
    assert body["must_change_password"] is True
    changed = client.post(
        "/api/v1/auth/change-password",
        headers=headers,
        json={"current_password": temporary, "new_password": new_password},
    )
    assert changed.status_code == 200, changed.text
    return _login(client, email, new_password)


@pytest.fixture()
def unique_central_emails(monkeypatch):
    """Avoid StaticPool collisions across tests without deleting FK-linked users."""
    suffix = os.urandom(4).hex()
    admin_email = f"adminerp.{suffix}@example.com"
    sa_email = f"superadminerp.{suffix}@example.com"
    monkeypatch.setattr(settings, "central_admin_email", admin_email)
    monkeypatch.setattr(settings, "central_superadmin_email", sa_email)
    return admin_email, sa_email


def _provision_pair(db):
    campus = db.scalar(select(Campus).where(Campus.code == "QMIS-MDU"))
    assert campus is not None
    report = provision_central_admins(db, campus=campus, dry_run=False, commit=True)
    return report


def test_config_targets_central_emails_and_roles():
    targets = {t["email"]: t["role"] for t in central_account_targets()}
    assert targets[settings.central_admin_email.lower()] == "admin"
    assert targets[settings.central_superadmin_email.lower()] == "superadmin"
    assert settings.central_admin_email.lower() == "adminerp@gmail.com"
    assert settings.central_superadmin_email.lower() == "superadminerp@gmail.com"


def test_frontend_homes_for_admin_and_superadmin():
    assert "[ROLES.SUPER_ADMIN]: '/super-admin/dashboard'" in AUTH
    assert "[ROLES.ADMIN]: '/admin/front-office/admission-list'" in AUTH
    assert "superadminerp@gmail.com" in AUTH


def test_provision_create_missing_only_idempotent_and_no_plaintext(
    client, unique_central_emails, tmp_path
):
    admin_email, sa_email = unique_central_emails
    with SessionLocal() as db:
        first = _provision_pair(db)
        assert first.new_accounts_created == 2
        assert first.existing_accounts_preserved == 0
        assert {c.role for c in first.created} == {"admin", "superadmin"}
        assert all(c.must_change_password for c in first.created)
        assert all(c.temporary_password and not c.temporary_password.startswith("(dry") for c in first.created)

        for cred in first.created:
            user = db.scalar(select(User).where(User.email == cred.login_username))
            assert user is not None
            assert user.must_change_password is True
            assert cred.temporary_password not in (user.password_hash or "")
            assert verify_password(cred.temporary_password, user.password_hash)
            profile = db.scalar(select(UserProfile).where(UserProfile.user_id == user.id))
            assert profile is not None

        second = _provision_pair(db)
        assert second.new_accounts_created == 0
        assert second.existing_accounts_preserved == 2

        handoff = tmp_path / "central-handoff.json"
        write_credential_handoff(handoff, first.created, note="test")
        text = handoff.read_text(encoding="utf-8")
        assert "temporaryPassword" in text
        assert admin_email in text
        assert sa_email in text


def test_dry_run_does_not_persist_users(client, unique_central_emails):
    admin_email, sa_email = unique_central_emails
    with SessionLocal() as db:
        campus = db.scalar(select(Campus).where(Campus.code == "QMIS-MDU"))
        assert db.scalar(select(User).where(User.email == admin_email)) is None
        report = provision_central_admins(db, campus=campus, dry_run=True, commit=False)
        assert report.new_accounts_created == 2
        assert db.scalar(select(User).where(User.email == admin_email)) is None
        assert db.scalar(select(User).where(User.email == sa_email)) is None


def test_central_login_roles_and_must_change_password(client, unique_central_emails):
    with SessionLocal() as db:
        report = _provision_pair(db)
        by_role = {c.role: c for c in report.created}

    admin_body, _ = _login(client, by_role["admin"].login_username, by_role["admin"].temporary_password)
    assert admin_body["role"] == "admin"
    assert admin_body.get("must_change_password") is True

    sa_body, _ = _login(
        client, by_role["superadmin"].login_username, by_role["superadmin"].temporary_password
    )
    assert sa_body["role"] == "superadmin"
    assert sa_body.get("must_change_password") is True


def test_central_admin_and_superadmin_creatable_roles_and_isolation(client, unique_central_emails):
    with SessionLocal() as db:
        report = _provision_pair(db)
        by_role = {c.role: c for c in report.created}

    _, admin_headers = _complete_first_login(
        client,
        by_role["admin"].login_username,
        by_role["admin"].temporary_password,
        "Central-Admin-Login-2026!",
    )
    _, sa_headers = _complete_first_login(
        client,
        by_role["superadmin"].login_username,
        by_role["superadmin"].temporary_password,
        "Central-SuperAdmin-Login-2026!",
    )

    admin_roles = set(creatable_roles_for("admin"))
    sa_roles = set(creatable_roles_for("superadmin"))
    assert "pro" in admin_roles
    assert "transportmanager" in admin_roles
    assert "housekeepingmanager" in admin_roles
    assert "maintenancemanager" in admin_roles
    assert "teacher" in admin_roles
    assert "accounthead" in admin_roles
    assert "fileroom" not in admin_roles
    assert "cctv" not in admin_roles
    assert "admin" not in admin_roles
    assert "superadmin" not in admin_roles
    assert "superadmin" not in sa_roles
    assert {"admin", "fileroom", "cctv", "pro", "transportmanager"} <= sa_roles

    # Admin may create PRO; cannot create File Room / Super Admin.
    ok = client.post(
        USERS,
        json={
            "role": "pro",
            "firstName": "Portal",
            "lastName": "Pro",
            "email": "central.pro.create@qmis.edu",
            "gender": "Female",
            "mobileNumber": "9000000001",
        },
        headers=admin_headers,
    )
    assert ok.status_code == 201, ok.text
    assert ok.json()["role"] == "pro"
    assert ok.json().get("temporaryPassword")
    assert ok.json()["mustChangePassword"] is True

    denied_fr = client.post(
        USERS,
        json={
            "role": "fileroom",
            "firstName": "File",
            "lastName": "Room",
            "email": "central.fileroom.denied@qmis.edu",
            "gender": "Female",
            "mobileNumber": "9000000002",
        },
        headers=admin_headers,
    )
    assert denied_fr.status_code == 403

    denied_sa = client.post(
        USERS,
        json={
            "role": "superadmin",
            "firstName": "Escalation",
            "lastName": "Attempt",
            "email": "central.escalation@qmis.edu",
            "gender": "Male",
            "mobileNumber": "9000000003",
        },
        headers=admin_headers,
    )
    assert denied_sa.status_code == 403

    # Super Admin may create File Room + Admin; still cannot create Super Admin.
    fr = client.post(
        USERS,
        json={
            "role": "fileroom",
            "firstName": "File",
            "lastName": "Officer",
            "email": "central.fileroom.ok@qmis.edu",
            "gender": "Female",
            "mobileNumber": "9000000004",
        },
        headers=sa_headers,
    )
    assert fr.status_code == 201, fr.text
    assert fr.json()["role"] == "fileroom"

    adm = client.post(
        USERS,
        json={
            "role": "admin",
            "firstName": "Campus",
            "lastName": "Admin",
            "email": "central.campus.admin@qmis.edu",
            "gender": "Male",
            "mobileNumber": "9000000005",
        },
        headers=sa_headers,
    )
    assert adm.status_code == 201, adm.text
    assert adm.json()["role"] == "admin"

    sa_denied = client.post(
        USERS,
        json={
            "role": "superadmin",
            "firstName": "Peer",
            "lastName": "Sa",
            "email": "central.peer.sa@qmis.edu",
            "gender": "Male",
            "mobileNumber": "9000000006",
        },
        headers=sa_headers,
    )
    assert sa_denied.status_code == 403


def test_ops_staff_cannot_access_admin_user_management(client):
    """Ordinary seeded roles stay isolated from Admin Users API."""
    teacher = client.post(
        "/api/v1/auth/login",
        json={"email": settings.teacher_seed_email, "password": settings.teacher_seed_password},
    )
    assert teacher.status_code == 200
    headers = {"Authorization": f"Bearer {teacher.json()['access_token']}"}
    r = client.get(USERS, headers=headers)
    assert r.status_code in (401, 403)


def test_existing_central_email_preserved_without_password_reset(client, unique_central_emails):
    admin_email, _ = unique_central_emails
    with SessionLocal() as db:
        campus = db.scalar(select(Campus).where(Campus.code == "QMIS-MDU"))
        role = db.scalar(select(Role).where(Role.code == "admin"))
        first = _provision_pair(db)
        admin_cred = next(c for c in first.created if c.role == "admin")
        user = db.scalar(select(User).where(User.email == admin_email))
        old_hash = user.password_hash
        again = provision_central_admins(db, campus=campus, dry_run=False, commit=True)
        assert again.new_accounts_created == 0
        assert again.existing_accounts_preserved == 2
        db.refresh(user)
        assert user.password_hash == old_hash
        assert verify_password(admin_cred.temporary_password, user.password_hash)
        assert role is not None
