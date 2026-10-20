"""Administrator user management: Admin > RBAC > User Creation and Roles.

Seeded logins come from settings; no credential is hard-coded here.
"""

import os

os.environ["DATABASE_URL"] = "sqlite+pysqlite:///:memory:"
os.environ["OTP_DEBUG"] = "true"
os.environ["JWT_SECRET"] = "test-secret-qmis-erp-phase0-local"

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import select

from app.core.config import settings
from app.core.database import SessionLocal
from app.core.security import hash_password
from app.main import app
from app.models import AuditLog, Role, User, UserProfile

ADMIN = (settings.admin_seed_email, settings.admin_seed_password)
HR = (settings.hr_seed_email, settings.hr_seed_password)
TEACHER = (settings.teacher_seed_email, settings.teacher_seed_password)
STRONG = "Staff-Login-2026-z"
SUPER_EMAIL = "superadmin.test@qmis.edu"
SUPER_PASSWORD = "Super-Admin-Test-2026"

USERS = "/api/v1/admin/users"


@pytest.fixture()
def client():
    with TestClient(app) as test_client:
        yield test_client


def _login(client, email, password):
    response = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    assert response.status_code == 200, response.text
    return {"Authorization": f"Bearer {response.json()['access_token']}"}


def _admin(client):
    return _login(client, *ADMIN)


def _payload(**overrides):
    body = {
        "role": "teacher",
        "firstName": "Asha",
        "middleName": "K",
        "lastName": "Verma",
        "email": "asha.verma@qmis.edu",
        "gender": "Female",
        "mobileNumber": "9876543210",
        "city": "Pune",
        "qualification": "M.Sc",
    }
    body.update(overrides)
    return body


def _create(client, headers, **overrides):
    return client.post(USERS, json=_payload(**overrides), headers=headers)


def _ensure_superadmin():
    with SessionLocal() as db:
        if db.scalar(select(User).where(User.email == SUPER_EMAIL)) is None:
            admin = db.scalar(select(User).where(User.email == settings.admin_seed_email))
            role = db.scalar(select(Role).where(Role.code == "superadmin"))
            db.add(
                User(
                    campus_id=admin.campus_id,
                    role_id=role.id,
                    email=SUPER_EMAIL,
                    password_hash=hash_password(SUPER_PASSWORD),
                    is_active=True,
                )
            )
            db.commit()


# --- create ---------------------------------------------------------------------------


def test_admin_creates_teacher_with_temporary_password_that_must_be_changed(client):
    headers = _admin(client)
    response = _create(client, headers)
    assert response.status_code == 201, response.text
    body = response.json()
    assert response.headers["cache-control"] == "no-store"
    assert body["role"] == "teacher" and body["roleLabel"] == "Teacher"
    assert body["staffCode"].startswith("TEA-")
    assert body["name"] == "Asha K Verma"
    assert body["status"] == "Active"
    assert body["mustChangePassword"] is True
    assert body["details"] == {"city": "Pune", "qualification": "M.Sc"}
    temporary = body["temporaryPassword"]
    assert temporary and len(temporary) >= 10

    login = client.post("/api/v1/auth/login", json={"email": "asha.verma@qmis.edu", "password": temporary})
    assert login.status_code == 200, login.text
    assert login.json()["must_change_password"] is True


def test_admin_can_set_a_password_that_meets_policy_and_it_is_not_echoed(client):
    headers = _admin(client)
    response = _create(client, headers, email="chosen.pw@qmis.edu", password=STRONG)
    assert response.status_code == 201, response.text
    assert response.json()["temporaryPassword"] is None
    assert STRONG not in response.text
    login = client.post("/api/v1/auth/login", json={"email": "chosen.pw@qmis.edu", "password": STRONG})
    assert login.status_code == 200
    assert login.json()["must_change_password"] is True


def test_weak_admin_chosen_password_is_rejected_and_nothing_is_created(client):
    headers = _admin(client)
    response = _create(client, headers, email="weak.pw@qmis.edu", password="short1")
    assert response.status_code == 400
    assert response.json()["detail"]["code"] == "weak_password"
    with SessionLocal() as db:
        assert db.scalar(select(User).where(User.email == "weak.pw@qmis.edu")) is None


def test_staff_codes_increment_per_role(client):
    headers = _admin(client)
    first = _create(client, headers, email="t.one@qmis.edu").json()["staffCode"]
    second = _create(client, headers, email="t.two@qmis.edu").json()["staffCode"]
    gate = _create(client, headers, email="g.one@qmis.edu", role="gatekeeper").json()["staffCode"]
    assert first.startswith("TEA-") and second.startswith("TEA-")
    assert int(second.split("-")[1]) == int(first.split("-")[1]) + 1
    assert gate.startswith("GKP-")


def test_duplicate_email_is_409_case_insensitive(client):
    headers = _admin(client)
    assert _create(client, headers, email="dupe@qmis.edu").status_code == 201
    again = _create(client, headers, email="DUPE@qmis.edu")
    assert again.status_code == 409
    assert again.json()["detail"]["code"] == "email_exists"
    # an existing seeded login is also protected
    assert _create(client, headers, email=settings.hr_seed_email).status_code == 409


@pytest.mark.parametrize(
    "overrides,code",
    [
        ({"firstName": "  "}, "first_name_required"),
        ({"lastName": "  "}, "last_name_required"),
        ({"gender": "  "}, "gender_required"),
    ],
)
def test_required_profile_fields(client, overrides, code):
    response = _create(client, _admin(client), email="req@qmis.edu", **overrides)
    assert response.status_code == 400
    assert response.json()["detail"]["code"] == code


def test_invalid_email_is_rejected(client):
    assert _create(client, _admin(client), email="not-an-email").status_code == 422


def test_unknown_and_password_like_fields_never_reach_the_profile(client):
    headers = _admin(client)
    response = _create(client, headers, email="extra@qmis.edu", hacked="yes", is_active=False, roleId="x")
    assert response.status_code == 201
    assert "hacked" not in response.json()["details"]
    with SessionLocal() as db:
        profile = db.scalar(select(UserProfile).where(UserProfile.staff_code == response.json()["staffCode"]))
        assert "hacked" not in profile.extra and "password" not in profile.extra


# --- privilege rules ------------------------------------------------------------------


@pytest.mark.parametrize("role", ["admin", "superadmin", "hr", "accounthead", "student", "parent", "director", "nonsense"])
def test_admin_cannot_create_privileged_or_unlisted_roles(client, role):
    response = _create(client, _admin(client), email=f"{role}.try@qmis.edu", role=role)
    assert response.status_code == 403
    assert response.json()["detail"]["code"] == "role_not_allowed"
    with SessionLocal() as db:
        assert db.scalar(select(User).where(User.email == f"{role}.try@qmis.edu")) is None


def test_superadmin_can_create_an_admin_but_not_a_superadmin(client):
    _ensure_superadmin()
    headers = _login(client, SUPER_EMAIL, SUPER_PASSWORD)
    created = _create(client, headers, email="new.admin@qmis.edu", role="admin")
    assert created.status_code == 201, created.text
    assert created.json()["staffCode"].startswith("ADM-")
    assert _create(client, headers, email="new.super@qmis.edu", role="superadmin").status_code == 403


def test_non_admin_roles_are_forbidden_everywhere(client):
    admin = _admin(client)
    victim = _create(client, admin, email="victim@qmis.edu").json()["id"]
    for creds in (TEACHER, HR):
        headers = _login(client, *creds)
        assert client.get(USERS, headers=headers).status_code == 403
        assert client.get(f"{USERS}/creatable-roles", headers=headers).status_code == 403
        assert _create(client, headers, email=f"x{creds[0]}").status_code == 403
        assert client.patch(f"{USERS}/{victim}", json={"status": "Inactive"}, headers=headers).status_code == 403
        assert client.post(f"{USERS}/{victim}/reset-password", headers=headers).status_code == 403
        assert client.get("/api/v1/admin/roles", headers=headers).status_code == 403


def test_unauthenticated_requests_are_401(client):
    assert client.get(USERS).status_code == 401
    assert client.post(USERS, json=_payload()).status_code == 401
    assert client.get("/api/v1/admin/roles").status_code == 401


def test_admin_cannot_manage_accounts_outside_the_creatable_roles(client):
    headers = _admin(client)
    with SessionLocal() as db:
        hr_user = db.scalar(select(User).where(User.email == settings.hr_seed_email))
        db.add(
            UserProfile(
                user_id=hr_user.id, campus_id=hr_user.campus_id, staff_code="HRX-0001",
                first_name="H", last_name="R", extra={},
            )
        )
        db.commit()
        hr_id = str(hr_user.id)
    assert client.patch(f"{USERS}/{hr_id}", json={"status": "Inactive"}, headers=headers).status_code == 403
    assert client.post(f"{USERS}/{hr_id}/reset-password", headers=headers).status_code == 403
    assert client.get(f"{USERS}/{hr_id}", headers=headers).status_code == 403
    # and the HR login still works
    _login(client, *HR)


def test_unknown_or_malformed_user_id_is_404(client):
    headers = _admin(client)
    assert client.get(f"{USERS}/not-a-uuid", headers=headers).status_code == 404
    assert client.get(f"{USERS}/00000000-0000-0000-0000-000000000000", headers=headers).status_code == 404


# --- list / get / update --------------------------------------------------------------


def test_list_filters_and_search(client):
    headers = _admin(client)
    _create(client, headers, email="list.teacher@qmis.edu", firstName="Zed", lastName="Quokka")
    _create(client, headers, email="list.gate@qmis.edu", role="gatekeeper", firstName="Gary", lastName="Gate")
    everyone = client.get(USERS, headers=headers).json()
    assert {"list.teacher@qmis.edu", "list.gate@qmis.edu"} <= {u["email"] for u in everyone}
    assert all("temporaryPassword" not in u for u in everyone)
    assert all("password_hash" not in str(u) and "passwordHash" not in str(u) for u in everyone)
    only_gate = client.get(USERS, params={"role": "gatekeeper"}, headers=headers).json()
    assert only_gate and all(u["role"] == "gatekeeper" for u in only_gate)
    found = client.get(USERS, params={"q": "quokka"}, headers=headers).json()
    assert [u["email"] for u in found] == ["list.teacher@qmis.edu"]
    assert client.get(USERS, params={"limit": 0}, headers=headers).status_code == 422


def test_update_profile_and_deactivate_blocks_login_and_existing_token(client):
    headers = _admin(client)
    created = _create(client, headers, email="lifecycle@qmis.edu").json()
    temp = created["temporaryPassword"]
    staff_headers = _login(client, "lifecycle@qmis.edu", temp)
    assert client.get("/api/v1/auth/me", headers=staff_headers).status_code == 200

    patched = client.patch(
        f"{USERS}/{created['id']}",
        json={"mobileNumber": "9000000000", "city": "", "state": "MH", "status": "Inactive"},
        headers=headers,
    )
    assert patched.status_code == 200, patched.text
    body = patched.json()
    assert body["status"] == "Inactive" and body["mobileNumber"] == "9000000000"
    assert body["details"] == {"state": "MH", "qualification": "M.Sc"}  # blank clears city, others kept

    assert client.get("/api/v1/auth/me", headers=staff_headers).status_code == 401
    refused = client.post("/api/v1/auth/login", json={"email": "lifecycle@qmis.edu", "password": temp})
    assert refused.status_code in (400, 401, 403)

    back = client.patch(f"{USERS}/{created['id']}", json={"status": "Active"}, headers=headers)
    assert back.json()["status"] == "Active"
    _login(client, "lifecycle@qmis.edu", temp)


def test_update_can_change_email_and_creatable_role(client):
    headers = _admin(client)
    created = _create(client, headers, email="editable@qmis.edu").json()

    # Admin role is not creatable by campus Admin — must be refused.
    forbidden = client.patch(
        f"{USERS}/{created['id']}",
        json={"role": "admin"},
        headers=headers,
    )
    assert forbidden.status_code == 403, forbidden.text

    patched = client.patch(
        f"{USERS}/{created['id']}",
        json={"role": "librarian", "email": "editable.renamed@qmis.edu", "firstName": "Asha"},
        headers=headers,
    )
    assert patched.status_code == 200, patched.text
    body = patched.json()
    assert body["role"] == "librarian"
    assert body["email"] == "editable.renamed@qmis.edu"
    assert body["firstName"] == "Asha"


def test_null_on_required_fields_means_no_change(client):
    headers = _admin(client)
    created = _create(client, headers, email="nulls@qmis.edu").json()
    patched = client.patch(
        f"{USERS}/{created['id']}", json={"firstName": None, "status": None, "gender": None}, headers=headers
    )
    assert patched.status_code == 200
    assert patched.json()["firstName"] == "Asha" and patched.json()["status"] == "Active"


def test_empty_required_name_on_update_is_rejected(client):
    headers = _admin(client)
    created = _create(client, headers, email="blankname@qmis.edu").json()
    response = client.patch(f"{USERS}/{created['id']}", json={"firstName": "   "}, headers=headers)
    assert response.status_code == 400


# --- reset password -------------------------------------------------------------------


def test_reset_password_replaces_old_one_and_forces_change(client):
    headers = _admin(client)
    created = _create(client, headers, email="reset@qmis.edu").json()
    old = created["temporaryPassword"]
    reset = client.post(f"{USERS}/{created['id']}/reset-password", headers=headers)
    assert reset.status_code == 200, reset.text
    assert reset.headers["cache-control"] == "no-store"
    fresh = reset.json()["temporaryPassword"]
    assert fresh and fresh != old
    assert client.post("/api/v1/auth/login", json={"email": "reset@qmis.edu", "password": old}).status_code == 401
    login = client.post("/api/v1/auth/login", json={"email": "reset@qmis.edu", "password": fresh})
    assert login.status_code == 200 and login.json()["must_change_password"] is True


# --- audit ----------------------------------------------------------------------------


def test_actions_are_audited_without_passwords(client):
    headers = _admin(client)
    created = _create(client, headers, email="audited@qmis.edu", password=STRONG).json()
    client.patch(f"{USERS}/{created['id']}", json={"status": "Inactive"}, headers=headers)
    reset = client.post(f"{USERS}/{created['id']}/reset-password", headers=headers).json()
    with SessionLocal() as db:
        rows = db.scalars(select(AuditLog).where(AuditLog.entity_id == created["id"])).all()
    actions = {row.action for row in rows}
    assert {"admin.user.create", "admin.user.deactivate", "admin.user.reset_password"} <= actions
    blob = " ".join((row.details or "") for row in rows)
    assert STRONG not in blob and reset["temporaryPassword"] not in blob
    assert all(row.actor_id is not None for row in rows)


# --- roles (read-only) ----------------------------------------------------------------


def test_roles_list_and_permissions_are_read_only(client):
    headers = _admin(client)
    roles = client.get("/api/v1/admin/roles", headers=headers)
    assert roles.status_code == 200
    by_id = {role["id"]: role for role in roles.json()}
    assert by_id["teacher"]["creatable"] is True and by_id["admin"]["creatable"] is False
    assert by_id["admin"]["permissionCount"] > by_id["teacher"]["permissionCount"]
    perms = client.get("/api/v1/admin/roles/teacher/permissions", headers=headers).json()
    granted = {p["code"] for p in perms["permissions"] if p["granted"]}
    assert "lessonplans.write" in granted and "users.write" not in granted
    assert client.get("/api/v1/admin/roles/nope/permissions", headers=headers).status_code == 404
    # no write verb exists for role permissions
    assert client.patch("/api/v1/admin/roles/teacher/permissions", json={"x": 1}, headers=headers).status_code == 405


def test_creatable_roles_for_admin(client):
    options = client.get(f"{USERS}/creatable-roles", headers=_admin(client)).json()
    assert {o["role"] for o in options} == {
        "principal",
        "prm",
        "teacher",
        "coordinator",
        "librarian",
        "gatekeepermanager",
        "gatekeeper",
        "transportmanager",
        "driver",
        "canteenmanager",
        "itsupportmanager",
        "stationerystoremanager",
        "housekeepingmanager",
    }
