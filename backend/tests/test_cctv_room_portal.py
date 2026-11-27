"""CCTV Room portal — role, read-only camera register, provisioning gates."""

import os
import uuid

os.environ["DATABASE_URL"] = "sqlite+pysqlite:///:memory:"
os.environ["OTP_DEBUG"] = "true"
os.environ["JWT_SECRET"] = "test-secret-qmis-erp-cctv-room-portal"

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.permissions.matrix import ROLE_PERMISSIONS
from app.services.admin_users import creatable_roles_for
from app.services.staff_designation_map import map_role_from_designation

CAMERA = {
    "name": "Main gate",
    "location": "Gate 1",
    "status": "Active",
    "streamUrl": "rtsp://10.0.0.5:554/stream1",
}


@pytest.fixture()
def client():
    with TestClient(app) as test_client:
        yield test_client


def _h(client, email, password):
    r = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    assert r.status_code == 200, r.text
    return {"Authorization": f"Bearer {r.json()['access_token']}"}


def test_cctv_role_matrix_has_ops_read_write_for_non_academics():
    # Non-Academics §4.14 needs write for daily status + footage-request collections.
    perms = set(ROLE_PERMISSIONS["cctv"])
    assert "ops.read" in perms
    assert "ops.write" in perms
    assert "users.write" not in perms
    assert "users.read" not in perms
    assert "documents.library.write" not in perms


def test_designation_map_control_room_and_cctv():
    assert map_role_from_designation("Control Room - Officer") == "cctv"
    assert map_role_from_designation("CCTV Operator") == "cctv"
    assert map_role_from_designation("Camera Room Staff") == "cctv"


def test_only_superadmin_can_create_cctv_role():
    assert "cctv" not in creatable_roles_for("admin")
    assert "cctv" in creatable_roles_for("superadmin")
    assert "cctv" not in creatable_roles_for("hr")


def test_cctv_login_and_permissions(client):
    headers = _h(client, "cctv@qmis.edu", "cctv12345")
    me = client.get("/api/v1/auth/me", headers=headers)
    assert me.status_code == 200, me.text
    body = me.json()
    assert body["role"] == "cctv"
    perms = set(body.get("permissions") or [])
    assert "ops.read" in perms
    assert "ops.write" in perms


def test_cctv_can_read_and_update_camera_register_and_footage_requests(client):
    admin = _h(client, "admin@qmis.edu", "admin123")
    saved = client.put(
        "/api/v1/ops/security-cameras/items/CAM-CCTV-1",
        json=CAMERA,
        headers=admin,
    )
    assert saved.status_code == 200, saved.text

    cctv = _h(client, "cctv@qmis.edu", "cctv12345")
    listed = client.get("/api/v1/ops/security-cameras", headers=cctv)
    assert listed.status_code == 200, listed.text
    names = {row["name"] for row in listed.json()}
    assert "Main gate" in names

    # Camera Room may update register / status (Non-Academics daily check).
    assert client.put(
        "/api/v1/ops/security-cameras/items/CAM-CCTV-2",
        json={**CAMERA, "name": "Side gate", "status": "Offline"},
        headers=cctv,
    ).status_code == 200

    # Footage / camera-status collections are whole-list saves.
    footage = client.put(
        "/api/v1/ops/cctv-footage-requests",
        json=[
            {
                "id": "CFR-1",
                "requester": "Principal Office",
                "reason": "Incident review",
                "area": "Gate 1",
                "dateNeeded": "2026-11-01",
                "status": "Pending Dept Head",
                "sensitive": "No",
            }
        ],
        headers=cctv,
    )
    assert footage.status_code == 200, footage.text
    assert client.get("/api/v1/ops/cctv-footage-requests", headers=cctv).json()[0]["area"] == "Gate 1"
    status_put = client.put(
        "/api/v1/ops/cctv-camera-status",
        json=[{"id": "CCS-1", "cameraId": "CAM-CCTV-1", "working": "Working", "checkedAt": "2026-11-02"}],
        headers=cctv,
    )
    assert status_put.status_code == 200, status_put.text


def test_cctv_denied_user_management_and_file_library(client):
    headers = _h(client, "cctv@qmis.edu", "cctv12345")
    assert client.get("/api/v1/admin/users", headers=headers).status_code == 403
    assert client.get("/api/v1/files", headers=headers).status_code == 403
    assert client.get("/api/v1/documents/students", headers=headers).status_code == 403


def test_admin_and_gkm_camera_write_unchanged(client):
    admin = _h(client, "admin@qmis.edu", "admin123")
    gkm = _h(client, "gatekeepermanager@qmis.edu", "gkm1234567")
    assert client.put(
        "/api/v1/ops/security-cameras/items/CAM-ADM-1",
        json={**CAMERA, "name": "Admin cam", "location": "Office"},
        headers=admin,
    ).status_code == 200
    assert client.put(
        "/api/v1/ops/security-cameras/items/CAM-GKM-1",
        json={**CAMERA, "name": "GKM cam", "location": "Lobby"},
        headers=gkm,
    ).status_code == 200
    # credentials still rejected
    bad = client.put(
        "/api/v1/ops/security-cameras/items/CAM-BAD-1",
        json={**CAMERA, "streamUrl": "rtsp://admin:secret@10.0.0.5/stream"},
        headers=admin,
    )
    assert bad.status_code == 422
    assert "password" in bad.text


def test_teacher_still_denied_cameras(client):
    teacher = _h(client, "teacher@qmis.edu", "teacher123")
    assert client.get("/api/v1/ops/security-cameras", headers=teacher).status_code == 403


def test_campus_admin_cannot_create_cctv_superadmin_can(client):
    admin = _h(client, "admin@qmis.edu", "admin123")
    roles = {row["role"] for row in client.get("/api/v1/admin/users/creatable-roles", headers=admin).json()}
    assert "cctv" not in roles
    assert client.post(
        "/api/v1/admin/users",
        headers=admin,
        json={
            "role": "cctv",
            "firstName": "Cam",
            "lastName": "Op",
            "email": "admin.cannot.create.cctv@qmis.edu",
            "gender": "Male",
            "mobileNumber": "9000000011",
            "status": "Active",
        },
    ).status_code == 403

    login = client.post(
        "/api/v1/auth/login",
        json={"email": "superadmin@qmis.edu", "password": "superadmin123"},
    )
    assert login.status_code == 200, login.text
    headers = {"Authorization": f"Bearer {login.json()['access_token']}"}
    roles = {row["role"] for row in client.get("/api/v1/admin/users/creatable-roles", headers=headers).json()}
    assert "cctv" in roles
    email = f"new.cctv.{uuid.uuid4().hex[:10]}@qmis.edu"
    created = client.post(
        "/api/v1/admin/users",
        headers=headers,
        json={
            "role": "cctv",
            "firstName": "Portal",
            "lastName": "Watcher",
            "email": email,
            "gender": "Female",
            "mobileNumber": "9000000012",
            "status": "Active",
        },
    )
    assert created.status_code == 201, created.text
    assert created.json()["role"] == "cctv"
    assert created.json()["staffCode"].startswith("CCTV-")
