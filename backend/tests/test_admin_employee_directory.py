"""Administrator Employee Database: reads the existing HR employee API.

No employee API or store was added. These tests pin what the screen relies on: what Admin and
other roles can read, that no credential travels in the payloads, and that an administrator's
activate/deactivate in User Creation stays consistent with the linked HR employee record.
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
from app.main import app
from app.models import AuditLog, HrEmployee, Role, User

ADMIN = (settings.admin_seed_email, settings.admin_seed_password)
HR = (settings.hr_seed_email, settings.hr_seed_password)
TEACHER = (settings.teacher_seed_email, settings.teacher_seed_password)

PORTAL = "/api/v1/hr/portal/employees"
USERS = "/api/v1/admin/users"


@pytest.fixture()
def client():
    with TestClient(app) as test_client:
        yield test_client


def _login(client, email, password):
    response = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    assert response.status_code == 200, response.text
    return {"Authorization": f"Bearer {response.json()['access_token']}"}


def _rbac_user(client, admin, email, **overrides):
    body = {"role": "teacher", "firstName": "Dir", "lastName": "Test", "email": email, "gender": "Female"}
    body.update(overrides)
    response = client.post(USERS, json=body, headers=admin)
    assert response.status_code == 201, response.text
    return response.json()


def _hr_staff(client, hr, email, **overrides):
    body = {
        "role": "Teacher", "email": email, "name": "Hr Person", "department": "Academic",
        "designation": "Teacher", "status": "Active",
    }
    body.update(overrides)
    response = client.post("/api/v1/hr/staff", json=body, headers=hr)
    assert response.status_code == 201, response.text
    return response.json()


def _portal(client, headers):
    response = client.get(PORTAL, headers=headers)
    assert response.status_code == 200, response.text
    return response.json()


def _login_refused(client, email, password):
    return client.post("/api/v1/auth/login", json={"email": email, "password": password}).status_code in (400, 401, 403)


# --- what the Administrator can read ---------------------------------------------------


def test_admin_reads_every_hr_employee_including_ones_hr_just_created(client):
    admin, hr = _login(client, *ADMIN), _login(client, *HR)
    created = _hr_staff(client, hr, "dir.visible@qmis.edu")
    rows = _portal(client, admin)
    assert created["id"] in {row["id"] for row in rows}
    assert "dir.visible@qmis.edu" in {row["email"] for row in rows}
    assert len(rows) == len(_portal(client, hr))  # same set HR sees


def test_portal_rows_have_the_fields_the_screen_maps(client):
    rows = _portal(client, _login(client, *ADMIN))
    assert rows
    needed = {"id", "name", "email", "department", "role", "status", "contact", "address"}
    assert needed <= set(rows[0])


def test_no_credential_appears_in_directory_payloads(client):
    admin, hr = _login(client, *ADMIN), _login(client, *HR)
    issued = [_rbac_user(client, admin, "dir.cred@qmis.edu")["temporaryPassword"]]
    staff = _hr_staff(client, hr, "dir.cred2@qmis.edu")
    if staff.get("temporaryPassword"):  # only returned when OTP_DEBUG is on (it is in tests)
        issued.append(staff["temporaryPassword"])
    assert all(issued)

    def keys(value):
        if isinstance(value, dict):
            for key, inner in value.items():
                yield key.lower()
                yield from keys(inner)
        elif isinstance(value, list):
            for inner in value:
                yield from keys(inner)

    for path in (PORTAL, "/api/v1/hr/employees", USERS):
        response = client.get(path, headers=admin)
        found = {k for k in keys(response.json()) if any(w in k for w in ("password", "hash", "secret", "token"))}
        assert found <= {"mustchangepassword"}, f"credential-like keys in {path}: {found}"
        for temporary in issued:
            assert temporary not in response.text, f"a temporary password leaked through {path}"


# --- who else can read it --------------------------------------------------------------


def test_a_teacher_sees_only_their_own_record_never_other_employees(client):
    admin, hr = _login(client, *ADMIN), _login(client, *HR)
    _hr_staff(client, hr, "dir.other@qmis.edu")
    teacher = _login(client, *TEACHER)
    rows = _portal(client, teacher)
    assert all(row["email"] == settings.teacher_seed_email for row in rows)
    assert "dir.other@qmis.edu" not in {row["email"] for row in rows}
    # and a teacher cannot read the administrator's user list at all
    assert client.get(USERS, headers=teacher).status_code == 403
    assert admin  # silence unused


def test_unauthenticated_requests_are_refused(client):
    assert client.get(PORTAL).status_code == 401
    assert client.get("/api/v1/hr/employees").status_code == 401


def test_admin_directory_is_read_only_through_the_api_the_screen_uses(client):
    admin = _login(client, *ADMIN)
    # the screen never writes; confirm the single-record routes it could use do not exist as writes
    assert client.patch(f"{PORTAL}/EMP-0001", json={"status": "Inactive"}, headers=admin).status_code in (404, 405)
    assert client.delete(f"{PORTAL}/EMP-0001", headers=admin).status_code in (404, 405)


# --- consistency between RBAC logins and HR records ------------------------------------


def test_deactivating_a_login_marks_the_linked_hr_record_inactive_and_back(client):
    admin, hr = _login(client, *ADMIN), _login(client, *HR)
    email = "dir.sync@qmis.edu"
    user = _rbac_user(client, admin, email)
    hr_item = _hr_staff(client, hr, email)  # same email: HR links to the existing login

    def hr_status():
        return next(row["status"] for row in _portal(client, admin) if row["id"] == hr_item["id"])

    assert hr_status() == "Active"
    off = client.patch(f"{USERS}/{user['id']}", json={"status": "Inactive"}, headers=admin)
    assert off.status_code == 200
    assert hr_status() == "Inactive"
    on = client.patch(f"{USERS}/{user['id']}", json={"status": "Active"}, headers=admin)
    assert on.status_code == 200
    assert hr_status() == "Active"
    with SessionLocal() as db:
        actions = {row.action for row in db.scalars(select(AuditLog)).all()}
    assert "HR_EMPLOYEE_STATUS_SYNCED" in actions


def test_hr_bulk_save_cannot_silently_reactivate_a_login_an_admin_turned_off(client):
    admin, hr = _login(client, *ADMIN), _login(client, *HR)
    email = "dir.nobounce@qmis.edu"
    user = _rbac_user(client, admin, email)
    temp = user["temporaryPassword"]
    _hr_staff(client, hr, email)
    client.patch(f"{USERS}/{user['id']}", json={"status": "Inactive"}, headers=admin)
    assert _login_refused(client, email, temp)

    # HR's screen saves the whole list it loaded; this used to flip the login back on
    saved = client.put(PORTAL, json=_portal(client, hr), headers=hr)
    assert saved.status_code == 200, saved.text
    assert _login_refused(client, email, temp)
    again = client.get(USERS, headers=admin).json()
    assert next(u for u in again if u["email"] == email)["status"] == "Inactive"


def test_control_without_the_sync_the_hr_bulk_save_does_reactivate_the_login(client, monkeypatch):
    """Negative control: proves the scenario above is real and that the sync is what prevents it."""
    from app.services import admin_users

    monkeypatch.setattr(admin_users, "_sync_hr_status", lambda *args, **kwargs: False)
    admin, hr = _login(client, *ADMIN), _login(client, *HR)
    email = "dir.control@qmis.edu"
    user = _rbac_user(client, admin, email)
    temp = user["temporaryPassword"]
    _hr_staff(client, hr, email)
    client.patch(f"{USERS}/{user['id']}", json={"status": "Inactive"}, headers=admin)
    assert _login_refused(client, email, temp)
    assert client.put(PORTAL, json=_portal(client, hr), headers=hr).status_code == 200
    assert not _login_refused(client, email, temp)  # the old behaviour: HR's save switched it back on


def test_hr_decisions_relieved_and_terminated_are_never_overwritten(client):
    admin, hr = _login(client, *ADMIN), _login(client, *HR)
    email = "dir.relieved@qmis.edu"
    user = _rbac_user(client, admin, email)
    item = _hr_staff(client, hr, email)
    with SessionLocal() as db:
        row = db.scalar(select(HrEmployee).where(HrEmployee.employee_code == item["id"]))
        row.status = "Relieved"
        db.commit()
    client.patch(f"{USERS}/{user['id']}", json={"status": "Inactive"}, headers=admin)
    client.patch(f"{USERS}/{user['id']}", json={"status": "Active"}, headers=admin)
    status = next(r["status"] for r in _portal(client, admin) if r["id"] == item["id"])
    assert status == "Relieved"


def test_login_without_an_hr_record_is_unaffected_by_the_sync(client):
    admin = _login(client, *ADMIN)
    user = _rbac_user(client, admin, "dir.nohr@qmis.edu")
    before = len(_portal(client, admin))
    assert client.patch(f"{USERS}/{user['id']}", json={"status": "Inactive"}, headers=admin).status_code == 200
    assert len(_portal(client, admin)) == before  # no HR record was created or removed


def test_rbac_created_user_gets_no_hr_record_and_is_reachable_through_admin_users(client):
    """The two stores stay separate: the screen merges them by email, the server does not copy."""
    admin = _login(client, *ADMIN)
    user = _rbac_user(client, admin, "dir.separate@qmis.edu")
    assert "dir.separate@qmis.edu" not in {row["email"] for row in _portal(client, admin)}
    assert user["id"] in {u["id"] for u in client.get(USERS, headers=admin).json()}


# --- ASA-01: HR must not mint privileged portal roles ---------------------------------


@pytest.mark.parametrize("privileged_role", ["Admin", "Super Admin", "HR", "Account Head", "Director", "Parent"])
def test_admin_cannot_mint_privileged_logins_via_hr_staff(client, privileged_role):
    """Campus Admin has hr.write but must not bypass creatable_roles_for through HR staffing."""
    admin = _login(client, *ADMIN)
    email = f"esc.{privileged_role.replace(' ', '').lower()}@qmis.edu"
    response = client.post(
        "/api/v1/hr/staff",
        headers=admin,
        json={
            "role": privileged_role,
            "email": email,
            "name": "Escalation Attempt",
            "department": "Office",
            "designation": privileged_role,
            "status": "Active",
        },
    )
    assert response.status_code == 403, response.text
    assert response.json()["detail"]["code"] == "forbidden"
    with SessionLocal() as db:
        assert db.scalar(select(User).where(User.email == email)) is None


def test_hr_cannot_mint_admin_via_portal_employees_put(client):
    hr = _login(client, *HR)
    email = "esc.hr.admin@qmis.edu"
    response = client.put(
        PORTAL,
        headers=hr,
        json=[
            {
                "id": "EMP-ESC-ADMIN",
                "name": "Fake Admin",
                "email": email,
                "department": "Office",
                "designation": "Administrator",
                "role": "Admin",
                "status": "Active",
            }
        ],
    )
    assert response.status_code == 403, response.text
    with SessionLocal() as db:
        assert db.scalar(select(User).where(User.email == email)) is None


def test_hr_can_still_provision_teacher_logins(client):
    """Regression: operational staff roles remain provisionable from HR."""
    hr = _login(client, *HR)
    created = _hr_staff(client, hr, "esc.teacher.ok@qmis.edu")
    assert created["id"]
    with SessionLocal() as db:
        user = db.scalar(select(User).where(User.email == "esc.teacher.ok@qmis.edu"))
        assert user is not None
        role = db.get(Role, user.role_id)
        assert role is not None and role.code == "teacher"
