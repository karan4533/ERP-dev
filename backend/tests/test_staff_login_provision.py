"""Isolated tests for Queen Mira staff login provisioning (create-missing-only)."""

from __future__ import annotations

import os
from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, select
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

os.environ["DATABASE_URL"] = "sqlite+pysqlite:///:memory:"
os.environ["OTP_DEBUG"] = "true"
os.environ["JWT_SECRET"] = "test-secret-qmis-erp-phase0-local"
os.environ["ENVIRONMENT"] = "development"
os.environ["SMTP_HOST"] = ""
os.environ["WHATSAPP_API_URL"] = ""
os.environ["WHATSAPP_API_TOKEN"] = ""
os.environ["INTEGRATIONS_MODE"] = ""

from app.core.config import settings
from app.core.security import verify_password
from app.models import HrEmployee, User
from app.models.base import Base
from app.services.seed import seed_reference_data
from app.services.staff_login_provision import (
    RosterEmployee,
    campus_by_code,
    is_valid_login_email,
    load_roster_from_hr_seed,
    provision_missing_staff_logins,
    write_credential_handoff,
)

REPO_ROOT = Path(__file__).resolve().parents[2]
HR_SEED = REPO_ROOT / "src" / "Pages" / "HR" / "domain" / "hrSeed.js"


@pytest.fixture()
def db_session():
    engine = create_engine(
        "sqlite+pysqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)
    with SessionLocal() as session:
        seed_reference_data(session)
        yield session


@pytest.fixture()
def client():
    from app.main import app

    with TestClient(app) as test_client:
        yield test_client


def _mini_roster() -> list[RosterEmployee]:
    return [
        RosterEmployee(
            employee_code="EMP-QMIS-901",
            name="Uat Teacher One",
            email="uat.teacher.one@queenmira.com",
            role="teacher",
            department="Academics",
            designation="TGT - Maths",
            category="Academics",
        ),
        RosterEmployee(
            employee_code="EMP-QMIS-902",
            name="Uat Directory Only",
            email="uat.directory@queenmira.com",
            role="",
            department="Admin",
            designation="File Room Officer",
        ),
        RosterEmployee(
            employee_code="EMP-QMIS-903",
            name="Uat Bad Email",
            email="not-an-email",
            role="teacher",
            department="Academics",
            designation="PRT",
            category="Academics",
        ),
    ]


def test_roster_loader_counts_and_eligibility():
    assert HR_SEED.is_file()
    roster = load_roster_from_hr_seed(HR_SEED)
    assert len(roster) == 120
    with_role = [row for row in roster if row.role]
    without_role = [row for row in roster if not row.role]
    assert len(with_role) == 107
    assert len(without_role) == 13
    assert all(row.employee_code.startswith("EMP-QMIS-") for row in roster)
    assert all(is_valid_login_email(row.email) for row in with_role)
    # Target ops portals carry explicit role codes in hrSeed.
    by_code = {row.employee_code: row for row in roster}
    assert by_code["EMP-QMIS-082"].role == "pro"
    assert by_code["EMP-QMIS-088"].role == "transportmanager"
    assert by_code["EMP-QMIS-092"].role == "cctv"
    assert by_code["EMP-QMIS-099"].role == "cctv"
    assert by_code["EMP-QMIS-105"].role == "fileroom"
    assert by_code["EMP-QMIS-107"].role == "housekeepingmanager"
    assert by_code["EMP-QMIS-107"].department == "Housekeeping"
    assert by_code["EMP-QMIS-120"].role == "maintenancemanager"
    assert by_code["EMP-QMIS-120"].department == "Maintenance"
    assert by_code["EMP-QMIS-110"].role == "pro"
    assert by_code["EMP-QMIS-117"].role == "fileroom"
    assert by_code["EMP-QMIS-117"].email == "emp-qmis-117@queenmira.com"


def test_provision_creates_missing_only_and_is_idempotent(db_session, monkeypatch):
    notify_calls = []

    def _fake_notify(**kwargs):
        notify_calls.append(kwargs)
        return {"email": {"status": "NOT_CONFIGURED", "delivered": False}}

    monkeypatch.setattr(
        "app.services.integrations.notify.notify_event",
        _fake_notify,
        raising=False,
    )

    campus = campus_by_code(db_session)
    assert campus is not None

    director = db_session.scalar(select(User).where(User.email == settings.director_seed_email.lower()))
    assert director is not None
    director_hash_before = director.password_hash

    first = provision_missing_staff_logins(
        db_session, campus=campus, roster=_mini_roster(), dry_run=False, commit=True
    )
    # Teacher (explicit role) + File Room Officer (designation→fileroom fallback).
    assert first.new_accounts_created == 2
    assert first.directory_only_skipped == 0
    assert first.invalid_identity_skipped == 1
    assert first.existing_accounts_preserved == 0
    assert len(first.created) == 2
    roles_created = {cred.role for cred in first.created}
    assert roles_created == {"teacher", "fileroom"}
    assert all(cred.must_change_password is True for cred in first.created)
    assert notify_calls == []

    teacher_cred = next(c for c in first.created if c.role == "teacher")
    temp = teacher_cred.temporary_password
    user = db_session.scalar(select(User).where(User.email == "uat.teacher.one@queenmira.com"))
    assert user is not None
    assert user.must_change_password is True
    assert temp not in (user.password_hash or "")
    assert verify_password(temp, user.password_hash)
    fileroom_user = db_session.scalar(select(User).where(User.email == "uat.directory@queenmira.com"))
    assert fileroom_user is not None
    assert fileroom_user.must_change_password is True

    emp = db_session.scalar(select(HrEmployee).where(HrEmployee.employee_code == "EMP-QMIS-901"))
    assert emp is not None
    assert emp.user_id == user.id

    # Invalid email still skipped; designation-mapped File Room login is created.
    assert db_session.scalar(select(User).where(User.email == "not-an-email")) is None

    second = provision_missing_staff_logins(
        db_session, campus=campus, roster=_mini_roster(), dry_run=False, commit=True
    )
    assert second.new_accounts_created == 0
    assert second.existing_accounts_preserved == 2

    director_after = db_session.scalar(select(User).where(User.email == settings.director_seed_email.lower()))
    assert director_after.password_hash == director_hash_before
    assert verify_password(settings.director_seed_password, director_after.password_hash)


def test_existing_account_password_and_role_preserved(db_session):
    campus = campus_by_code(db_session)
    # Pre-create a user with a known password and role, then roster wants teacher.
    from app.core.security import hash_password
    from app.models import Role

    role = db_session.scalar(select(Role).where(Role.code == "coordinator"))
    assert role is not None
    existing = User(
        campus_id=campus.id,
        role_id=role.id,
        email="preexisting.staff@queenmira.com",
        password_hash=hash_password("KeepMyPass1!"),
        is_active=True,
        must_change_password=False,
    )
    db_session.add(existing)
    db_session.commit()

    roster = [
        RosterEmployee(
            employee_code="EMP-QMIS-910",
            name="Pre Existing",
            email="preexisting.staff@queenmira.com",
            role="teacher",
            department="Academics",
            designation="TGT",
            category="Academics",
        )
    ]
    report = provision_missing_staff_logins(
        db_session, campus=campus, roster=roster, dry_run=False, commit=True
    )
    assert report.new_accounts_created == 0
    assert report.existing_accounts_preserved == 1

    user = db_session.scalar(select(User).where(User.email == "preexisting.staff@queenmira.com"))
    assert verify_password("KeepMyPass1!", user.password_hash)
    assert user.must_change_password is False
    assert user.role_id == role.id  # coordinator preserved, not overwritten to teacher

    emp = db_session.scalar(select(HrEmployee).where(HrEmployee.employee_code == "EMP-QMIS-910"))
    assert emp is not None
    assert emp.user_id == user.id


def test_full_roster_provision_on_isolated_db_and_demo_logins(db_session, tmp_path, monkeypatch):
    """Full 120-row roster on an isolated session DB (fast hash stub for volume; bcrypt covered elsewhere)."""
    notify_calls = []
    monkeypatch.setattr(
        "app.services.integrations.notify.notify_event",
        lambda **kwargs: notify_calls.append(kwargs) or {"email": {"status": "NOT_CONFIGURED"}},
        raising=False,
    )

    # Volume path: avoid 100× bcrypt cost; uniqueness + must_change still asserted.
    monkeypatch.setattr(
        "app.services.staff_login_provision.hash_password",
        lambda password: f"fast-hash:{password}",
    )

    campus = campus_by_code(db_session)
    roster = load_roster_from_hr_seed(HR_SEED)

    demo_hashes = {}
    for email in (
        settings.admin_seed_email,
        settings.director_seed_email,
        settings.teacher_seed_email,
        settings.prm_seed_email,
        settings.principal_seed_email,
        settings.coordinator_seed_email,
        settings.hr_seed_email,
    ):
        user = db_session.scalar(select(User).where(User.email == email.lower()))
        assert user is not None
        demo_hashes[email.lower()] = user.password_hash

    report = provision_missing_staff_logins(
        db_session, campus=campus, roster=roster, dry_run=False, commit=True
    )
    assert report.inspected == 120
    assert report.directory_only_skipped == 11
    assert report.invalid_identity_skipped == 0
    assert report.new_accounts_created == 109
    assert report.existing_accounts_preserved == 0
    assert len(report.ambiguous) == 0
    assert notify_calls == []

    temps = [row.temporary_password for row in report.created]
    assert len(temps) == len(set(temps))

    from app.models import Role
    from app.deps import permission_codes_for

    roles = {role.code: role.id for role in db_session.scalars(select(Role)).all()}
    for cred in report.created:
        user = db_session.scalar(select(User).where(User.email == cred.login_username))
        assert user is not None
        assert user.must_change_password is True
        assert user.password_hash == f"fast-hash:{cred.temporary_password}"
        assert user.role_id == roles[cred.role]
        emp = db_session.scalar(select(HrEmployee).where(HrEmployee.employee_code == cred.employee_id))
        assert emp is not None and emp.user_id == user.id

    for email, previous in demo_hashes.items():
        user = db_session.scalar(select(User).where(User.email == email))
        assert user.password_hash == previous

    assert verify_password(
        settings.director_seed_password,
        db_session.scalar(select(User).where(User.email == settings.director_seed_email.lower())).password_hash,
    )

    from app.services.hr import _role_code
    from app.services.staff_designation_map import map_role_from_designation

    for row in roster:
        role_code = _role_code(row.role) if (row.role or "").strip() else None
        if role_code is None and (row.designation or "").strip():
            role_code = map_role_from_designation(row.designation) or None
        if role_code is None:
            assert db_session.scalar(select(User).where(User.email == row.email.lower())) is None

    teacher_cred = next(row for row in report.created if row.role == "teacher")
    teacher_user = db_session.scalar(select(User).where(User.email == teacher_cred.login_username))
    codes = permission_codes_for(db_session, teacher_user)
    assert "hr.write" not in codes

    again = provision_missing_staff_logins(
        db_session, campus=campus, roster=roster, dry_run=False, commit=True
    )
    assert again.new_accounts_created == 0
    assert again.existing_accounts_preserved == 109

    handoff = tmp_path / "handoff.json"
    write_credential_handoff(handoff, report.created, note="test")
    text = handoff.read_text(encoding="utf-8")
    assert "temporaryPassword" in text
    assert teacher_cred.login_username in text
    assert settings.director_seed_email.lower() not in text


def test_demo_seed_logins_still_work_via_api(client):
    """Regression: well-known development demo accounts remain usable."""
    for email, password in (
        (settings.prm_seed_email, settings.prm_seed_password),
        (settings.admin_seed_email, settings.admin_seed_password),
        (settings.coordinator_seed_email, settings.coordinator_seed_password),
        (settings.principal_seed_email, settings.principal_seed_password),
        (settings.director_seed_email, settings.director_seed_password),
        (settings.teacher_seed_email, settings.teacher_seed_password),
    ):
        response = client.post("/api/v1/auth/login", json={"email": email, "password": password})
        assert response.status_code == 200, response.text
        assert "access_token" in response.json()
