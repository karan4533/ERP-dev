"""Maintenance Manager vs Housekeeping Manager — role split and ops isolation."""

from __future__ import annotations

import os

os.environ["DATABASE_URL"] = "sqlite+pysqlite:///:memory:"
os.environ["OTP_DEBUG"] = "true"
os.environ["JWT_SECRET"] = "test-secret-qmis-maint-hk-isolation"
os.environ["ENVIRONMENT"] = "development"

from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.permissions.matrix import ROLE_PERMISSIONS
from app.services.admin_users import creatable_roles_for
from app.services.ops_collections import _readers_for, _writers_for
from app.services.staff_designation_map import map_role_from_designation

SRC = Path(__file__).resolve().parents[2] / "src"
AUTH = (SRC / "context" / "AuthContext.jsx").read_text(encoding="utf-8")
ROLES_JS = (SRC / "constants" / "roles.js").read_text(encoding="utf-8")


@pytest.fixture()
def client():
    with TestClient(app) as test_client:
        yield test_client


def _login(client, email, password):
    r = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    assert r.status_code == 200, r.text
    return r.json()


def _hire(client, hr_headers, role, email, code):
    created = client.post(
        "/api/v1/admin/users",
        headers=hr_headers,
        json={
            "email": email,
            "full_name": f"Test {role}",
            "role": role,
            "employee_code": code,
            "password": "Secure-Pass-99",
            "must_change_password": False,
        },
    )
    # Admin create may be HR-blocked for some roles; fall back to seeded demo accounts when available.
    if created.status_code in (200, 201):
        body = _login(client, email, "Secure-Pass-99")
        return {"Authorization": f"Bearer {body['access_token']}"}
    assert created.status_code in (403, 422), created.text
    return None


def test_designation_maps_split_maintenance_and_housekeeping():
    assert map_role_from_designation("Housekeeping Manager") == "housekeepingmanager"
    assert map_role_from_designation("HK Supervisor") == "housekeepingmanager"
    assert map_role_from_designation("housekeeping") == "housekeepingmanager"
    assert map_role_from_designation("Maintenance Officer") == "maintenancemanager"
    assert map_role_from_designation("Maintenance Manager") == "maintenancemanager"
    assert map_role_from_designation("maintenance") == "maintenancemanager"


def test_frontend_maintenance_home_path_and_role_constant():
    assert "MAINTENANCE_MANAGER: 'maintenancemanager'" in ROLES_JS or 'MAINTENANCE_MANAGER: "maintenancemanager"' in ROLES_JS
    assert "[ROLES.MAINTENANCE_MANAGER]: '/maintenance-manager/dashboard'" in AUTH
    assert "[ROLES.HOUSEKEEPING_MANAGER]: '/housekeeping-manager/dashboard'" in AUTH


def test_permission_matrix_includes_ops_for_both_roles():
    for role in ("housekeepingmanager", "maintenancemanager"):
        perms = set(ROLE_PERMISSIONS[role])
        assert "ops.read" in perms
        assert "ops.write" in perms
        assert "users.write" not in perms


def test_ops_acl_writers_are_department_isolated():
    assert "housekeepingmanager" in _writers_for("hk-schedules")
    assert "housekeepingmanager" in _writers_for("hk-duty-allotments")
    assert "housekeepingmanager" in _writers_for("hk-checklists")
    assert "maintenancemanager" not in _writers_for("hk-schedules")
    assert "maintenancemanager" not in _writers_for("hk-duty-allotments")
    assert "maintenancemanager" not in _writers_for("hk-checklists")
    for collection in (
        "maint-requests",
        "maint-duty-allotments",
        "maint-schedules",
        "maint-checklists",
        "maint-inventory",
        "maint-inventory-requirements",
        "maint-procurement",
    ):
        assert "maintenancemanager" in _writers_for(collection)
        assert "housekeepingmanager" not in _writers_for(collection)
        assert "admin" in _writers_for(collection)
        assert "housekeepingmanager" not in _readers_for(collection)
    assert "admin" in _writers_for("hk-schedules")
    assert "maintenancemanager" in _writers_for("it-support-tickets")
    assert "housekeepingmanager" in _writers_for("it-support-tickets")
    assert "maintenancemanager" not in _readers_for("hk-schedules")
    assert "maintenancemanager" not in _readers_for("hk-duty-allotments")
    # Shared Store collections include Maintenance for issue/receive participation (PDF §4.4).
    assert "maintenancemanager" in _writers_for("shared-inventory-movements")
    assert "housekeepingmanager" in _writers_for("shared-inventory-movements")


def test_admin_can_create_maintenance_manager():
    admin = set(creatable_roles_for("admin"))
    sa = set(creatable_roles_for("superadmin"))
    assert "maintenancemanager" in admin
    assert "housekeepingmanager" in admin
    assert "maintenancemanager" in sa


def test_seed_logins_and_cross_collection_isolation(client):
    hk = _login(client, "housekeepingmanager@qmis.edu", "housekeeping123")
    mt = _login(client, "maintenancemanager@qmis.edu", "maintenance123")
    assert hk["role"] == "housekeepingmanager"
    assert mt["role"] == "maintenancemanager"
    hk_headers = {"Authorization": f"Bearer {hk['access_token']}"}
    mt_headers = {"Authorization": f"Bearer {mt['access_token']}"}

    hk_ok = client.put(
        "/api/v1/ops/hk-schedules",
        headers=hk_headers,
        json=[{"id": "SCH-ISO-1", "area": "Block A", "status": "Active"}],
    )
    assert hk_ok.status_code == 200, hk_ok.text

    mt_denied_hk = client.put(
        "/api/v1/ops/hk-schedules",
        headers=mt_headers,
        json=[{"id": "SCH-ISO-2", "area": "Block B", "status": "Active"}],
    )
    assert mt_denied_hk.status_code == 403, mt_denied_hk.text

    mt_ok = client.put(
        "/api/v1/ops/maint-requests",
        headers=mt_headers,
        json=[{"id": "MRQ-ISO-1", "title": "Fix fan", "status": "Open"}],
    )
    assert mt_ok.status_code == 200, mt_ok.text

    hk_denied_mt = client.put(
        "/api/v1/ops/maint-requests",
        headers=hk_headers,
        json=[{"id": "MRQ-ISO-2", "title": "Leak", "status": "Open"}],
    )
    assert hk_denied_mt.status_code == 403, hk_denied_mt.text

    # Both may access shared ticket collection (department filter is UI / raise payload).
    hk_tickets = client.get("/api/v1/ops/it-support-tickets", headers=hk_headers)
    mt_tickets = client.get("/api/v1/ops/it-support-tickets", headers=mt_headers)
    assert hk_tickets.status_code == 200, hk_tickets.text
    assert mt_tickets.status_code == 200, mt_tickets.text


def test_maintenance_duty_schedule_checklist_persist_and_stay_isolated(client):
    hk = _login(client, "housekeepingmanager@qmis.edu", "housekeeping123")
    mt = _login(client, "maintenancemanager@qmis.edu", "maintenance123")
    teacher = _login(client, "teacher@qmis.edu", "teacher123")
    hk_headers = {"Authorization": f"Bearer {hk['access_token']}"}
    mt_headers = {"Authorization": f"Bearer {mt['access_token']}"}
    teacher_headers = {"Authorization": f"Bearer {teacher['access_token']}"}

    duty = {
        "id": "MDUTY-ISO-1",
        "staff": "Pradeep",
        "area": "Panel B",
        "dutyType": "Corrective Repair",
        "status": "Assigned",
    }
    schedule = {
        "id": "MSCH-ISO-1",
        "name": "Electrical inspection",
        "frequency": "MONTHLY",
        "area": "All blocks",
        "staff": "Pradeep",
        "status": "Active",
    }
    checklist = {
        "id": "MCL-ISO-1",
        "title": "Panel checklist",
        "frequency": "MONTHLY",
        "area": "Panel B",
        "staff": "Pradeep",
        "checklistItems": "Doors locked\nBreakers labelled",
        "status": "Pending",
    }

    for path, row in (
        ("/api/v1/ops/maint-duty-allotments", duty),
        ("/api/v1/ops/maint-schedules", schedule),
        ("/api/v1/ops/maint-checklists", checklist),
    ):
        saved = client.put(path, headers=mt_headers, json=[row])
        assert saved.status_code == 200, (path, saved.text)
        listed = client.get(path, headers=mt_headers)
        assert listed.status_code == 200, listed.text
        assert listed.json()[0]["id"] == row["id"]

        denied_hk = client.put(path, headers=hk_headers, json=[row])
        assert denied_hk.status_code == 403, (path, denied_hk.text)
        denied_teacher = client.put(path, headers=teacher_headers, json=[row])
        assert denied_teacher.status_code == 403, (path, denied_teacher.text)

    # Housekeeping duty/schedule remain writable by HK and forbidden for Maintenance.
    hk_duty = client.put(
        "/api/v1/ops/hk-duty-allotments",
        headers=hk_headers,
        json=[{"id": "DUTY-ISO-HK-1", "staff": "Lakshmi", "area": "Block A", "status": "Assigned"}],
    )
    assert hk_duty.status_code == 200, hk_duty.text
    mt_on_hk_duty = client.put(
        "/api/v1/ops/hk-duty-allotments",
        headers=mt_headers,
        json=[{"id": "DUTY-ISO-MT-1", "staff": "X", "area": "Y", "status": "Assigned"}],
    )
    assert mt_on_hk_duty.status_code == 403, mt_on_hk_duty.text


def test_frontend_registry_maps_maintenance_storage_keys():
    registry = (SRC / "services" / "campusCollectionRegistry.js").read_text(encoding="utf-8")
    assert "schoolerp-maintenance-duty-v1" in registry
    assert "maint-duty-allotments" in registry
    assert "schoolerp-maintenance-schedules-v1" in registry
    assert "maint-schedules" in registry
    assert "schoolerp-maintenance-checklists-v1" in registry
    assert "maint-checklists" in registry
    assert "schoolerp-housekeeping-checklists-v1" in registry
    assert "hk-checklists" in registry
    assert "schoolerp-housekeeping-tasks-v1" in registry
    assert "hk-tasks" in registry
    # Tasks must not share the schedules storage key (overwrite collision).
    task_data = (SRC / "Pages" / "HousekeepingManager" / "TaskManagement" / "taskData.js").read_text(encoding="utf-8")
    assert "schoolerp-housekeeping-tasks-v1" in task_data
    assert "TASKS_STORAGE_KEY = 'schoolerp-housekeeping-schedules-v1'" not in task_data
    assert 'TASKS_STORAGE_KEY = "schoolerp-housekeeping-schedules-v1"' not in task_data
    assert "schoolerp-maintenance-inventory-v1" in registry
    assert "maint-inventory" in registry
    assert "schoolerp-maintenance-requests-v1" in registry
    assert "maint-requests" in registry
    routes = (SRC / "Routes" / "MaintenanceManagerRoutes.jsx").read_text(encoding="utf-8")
    assert "/maintenance-manager/duty-allotment" in routes
    assert "/maintenance-manager/schedules" in routes
    assert "/maintenance-manager/checklists" in routes
    assert "/maintenance-manager/tickets" in routes
    assert "/maintenance-manager/materials" in routes
    assert "/maintenance-manager/store-requests" in routes
    assert "/maintenance-manager/inventory-requirement" in routes
    assert "/maintenance-manager/purchase-workflow" in routes
    assert "/maintenance-manager/broadcast" in routes
    hk_routes = (SRC / "Routes" / "HousekeepingManagerRoutes.jsx").read_text(encoding="utf-8")
    assert "/housekeeping-manager/checklists" in hk_routes


def test_maintenance_store_and_hk_checklist_collections_persist_isolated(client):
    hk = _login(client, "housekeepingmanager@qmis.edu", "housekeeping123")
    mt = _login(client, "maintenancemanager@qmis.edu", "maintenance123")
    hk_headers = {"Authorization": f"Bearer {hk['access_token']}"}
    mt_headers = {"Authorization": f"Bearer {mt['access_token']}"}

    hk_cl = client.put(
        "/api/v1/ops/hk-checklists",
        headers=hk_headers,
        json=[{"id": "HCL-ISO-1", "title": "Washroom", "status": "Pending"}],
    )
    assert hk_cl.status_code == 200, hk_cl.text
    assert client.put(
        "/api/v1/ops/hk-checklists",
        headers=mt_headers,
        json=[{"id": "HCL-ISO-2", "title": "x", "status": "Pending"}],
    ).status_code == 403

    for path, row in (
        ("/api/v1/ops/maint-inventory", {"id": "MINV-ISO-1", "item": "MCB", "quantity": 2, "status": "Available"}),
        ("/api/v1/ops/maint-inventory-requirements", {"id": "MIR-ISO-1", "item": "Wrench", "quantity": 1, "status": "Pending"}),
        ("/api/v1/ops/maint-procurement", {"id": "MPC-ISO-1", "title": "Battery", "status": "QUOTATION_PENDING"}),
    ):
        saved = client.put(path, headers=mt_headers, json=[row])
        assert saved.status_code == 200, (path, saved.text)
        denied = client.put(path, headers=hk_headers, json=[row])
        assert denied.status_code == 403, (path, denied.text)
