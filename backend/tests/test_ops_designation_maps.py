"""Regression: Housekeeping / Maintenance / Transport designation → RBAC role."""

from app.services.admin_users import creatable_roles_for
from app.services.staff_designation_map import map_role_from_designation


def test_housekeeping_maps_to_housekeepingmanager():
    assert map_role_from_designation("Housekeeping Manager") == "housekeepingmanager"
    assert map_role_from_designation("HK Supervisor") == "housekeepingmanager"


def test_maintenance_maps_to_maintenancemanager():
    assert map_role_from_designation("Maintenance Officer") == "maintenancemanager"
    assert map_role_from_designation("Maintenance Manager") == "maintenancemanager"
    assert map_role_from_designation("maintenance") == "maintenancemanager"


def test_transport_manager_and_driver_map():
    assert map_role_from_designation("Transport Manager") == "transportmanager"
    assert map_role_from_designation("transport manager") == "transportmanager"
    assert map_role_from_designation("Driver") == "driver"
    assert map_role_from_designation("Bus Driver") == "driver"


def test_unrelated_designations_unchanged():
    assert map_role_from_designation("Public Relations Officer") == "pro"
    assert map_role_from_designation("Assistant PRO") == "pro"
    assert map_role_from_designation("Parent Relationship Manager") == "prm"
    assert map_role_from_designation("System Administrator") == "itsupportmanager"
    assert map_role_from_designation("File Room Officer") == "fileroom"
    assert map_role_from_designation("Control Room - Officer") == "cctv"
    assert map_role_from_designation("EA to MD") == ""


def test_admin_can_create_housekeeping_maintenance_and_transport_manager():
    admin = set(creatable_roles_for("admin"))
    assert "housekeepingmanager" in admin
    assert "maintenancemanager" in admin
    assert "transportmanager" in admin
    assert "driver" in admin
    assert "pro" in admin
    assert "hr" in admin
    assert "director" in admin
    # Elevated portals stay Super-Admin-only.
    assert "superadmin" not in admin
    assert "admin" not in admin
    assert "fileroom" not in admin
    assert "cctv" not in admin
    assert "managing_director" not in admin


def test_superadmin_can_create_fileroom_cctv_admin():
    sa = set(creatable_roles_for("superadmin"))
    assert "fileroom" in sa
    assert "cctv" in sa
    assert "admin" in sa
    assert "managing_director" in sa
    assert "housekeepingmanager" in sa
    assert "maintenancemanager" in sa
    assert "pro" in sa
