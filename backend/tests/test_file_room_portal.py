"""File Room portal — role, library perms, documents ACL, Super Admin provisioning."""

import io
import os
import uuid

os.environ["DATABASE_URL"] = "sqlite+pysqlite:///:memory:"
os.environ["OTP_DEBUG"] = "true"
os.environ["JWT_SECRET"] = "test-secret-qmis-erp-file-room-portal"

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.permissions.matrix import ROLE_PERMISSIONS
from app.services.admin_users import creatable_roles_for
from app.services.staff_designation_map import map_role_from_designation

PDF = b"%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF"


@pytest.fixture()
def client():
    with TestClient(app) as test_client:
        yield test_client


def _h(client, email, password):
    r = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    assert r.status_code == 200, r.text
    return {"Authorization": f"Bearer {r.json()['access_token']}"}


def test_fileroom_role_matrix_has_library_and_document_perms_not_users_write():
    perms = set(ROLE_PERMISSIONS["fileroom"])
    assert {
        "documents.students.read",
        "documents.students.write",
        "documents.employees.read",
        "documents.employees.write",
        "documents.library.read",
        "documents.library.write",
        "students.read",
        "ops.read",
        "ops.write",
    } <= perms
    assert "users.write" not in perms
    assert "users.read" not in perms
    assert "admissions.write" not in perms


def test_fileroom_can_write_register_and_issue_collections(client):
    headers = _h(client, "fileroom@qmis.edu", "fileroom123")
    # Whole-list collections (not item-upsert like security-cameras).
    reg = client.put(
        "/api/v1/ops/fileroom-register",
        headers=headers,
        json=[
            {
                "id": "FRG-1",
                "title": "Staff file sample",
                "ownerDepartment": "HR",
                "sensitivity": "Confidential",
                "accessApprover": "Admin Head",
                "status": "In File Room",
            }
        ],
    )
    assert reg.status_code == 200, reg.text
    issue = client.put(
        "/api/v1/ops/fileroom-issues",
        headers=headers,
        json=[
            {
                "id": "FIS-1",
                "requestType": "Issue",
                "fileId": "FRG-1",
                "requester": "Coordinator",
                "reason": "Review",
                "status": "Pending Dept Head",
            }
        ],
    )
    assert issue.status_code == 200, issue.text
    assert client.get("/api/v1/ops/fileroom-register", headers=headers).json()[0]["title"] == "Staff file sample"


def test_designation_map_file_room_officer():
    assert map_role_from_designation("File Room Officer") == "fileroom"
    assert map_role_from_designation("File Room & Stores - In-charge") == "fileroom"


def test_only_superadmin_can_create_fileroom_role():
    assert "fileroom" not in creatable_roles_for("admin")
    assert "fileroom" in creatable_roles_for("superadmin")
    assert "fileroom" not in creatable_roles_for("hr")


def test_fileroom_login_me_and_home_permissions(client):
    headers = _h(client, "fileroom@qmis.edu", "fileroom123")
    me = client.get("/api/v1/auth/me", headers=headers)
    assert me.status_code == 200, me.text
    body = me.json()
    assert body["role"] == "fileroom"
    perms = set(body.get("permissions") or [])
    assert "documents.library.write" in perms
    assert "users.write" not in perms


def test_fileroom_library_upload_list_download_delete(client):
    headers = _h(client, "fileroom@qmis.edu", "fileroom123")
    up = client.post(
        "/api/v1/files/library",
        headers=headers,
        files={"file": ("room-circular.pdf", io.BytesIO(PDF), "application/pdf")},
    )
    assert up.status_code == 201, up.text
    file_id = up.json()["id"]

    listed = client.get("/api/v1/files", params={"kind": "library"}, headers=headers)
    assert listed.status_code == 200, listed.text
    assert any(row["id"] == file_id for row in listed.json())

    dl = client.get(f"/api/v1/files/{file_id}/download", headers=headers)
    assert dl.status_code == 200
    assert dl.content == PDF

    assert client.delete(f"/api/v1/files/{file_id}", headers=headers).json()["deleted"] is True


def test_fileroom_denied_user_management(client):
    headers = _h(client, "fileroom@qmis.edu", "fileroom123")
    assert client.get("/api/v1/admin/users", headers=headers).status_code == 403
    assert client.get("/api/v1/admin/users/creatable-roles", headers=headers).status_code == 403
    assert client.post(
        "/api/v1/admin/users",
        headers=headers,
        json={
            "role": "teacher",
            "firstName": "X",
            "lastName": "Y",
            "email": "fileroom.cannot.create@qmis.edu",
            "gender": "Female",
            "mobileNumber": "9000000000",
            "status": "Active",
        },
    ).status_code == 403


def test_teacher_still_denied_library_and_campus_admin_cannot_create_fileroom(client):
    teacher = _h(client, "teacher@qmis.edu", "teacher123")
    assert client.get("/api/v1/files", headers=teacher).status_code == 403
    assert client.post(
        "/api/v1/files/library",
        headers=teacher,
        files={"file": ("a.pdf", io.BytesIO(PDF), "application/pdf")},
    ).status_code == 403

    admin = _h(client, "admin@qmis.edu", "admin123")
    roles = {row["role"] for row in client.get("/api/v1/admin/users/creatable-roles", headers=admin).json()}
    assert "fileroom" not in roles
    denied = client.post(
        "/api/v1/admin/users",
        headers=admin,
        json={
            "role": "fileroom",
            "firstName": "File",
            "lastName": "Clerk",
            "email": "admin.cannot.create.fileroom@qmis.edu",
            "gender": "Female",
            "mobileNumber": "9000000001",
            "status": "Active",
        },
    )
    assert denied.status_code == 403


def test_superadmin_can_provision_fileroom_account(client):
    # Ensure superadmin seed exists in the in-memory app.
    login = client.post(
        "/api/v1/auth/login",
        json={"email": "superadmin@qmis.edu", "password": "superadmin123"},
    )
    assert login.status_code == 200, login.text
    headers = {"Authorization": f"Bearer {login.json()['access_token']}"}
    roles = {row["role"] for row in client.get("/api/v1/admin/users/creatable-roles", headers=headers).json()}
    assert "fileroom" in roles
    assert "admin" in roles

    email = f"new.fileroom.{uuid.uuid4().hex[:10]}@qmis.edu"
    created = client.post(
        "/api/v1/admin/users",
        headers=headers,
        json={
            "role": "fileroom",
            "firstName": "Portal",
            "lastName": "Filer",
            "email": email,
            "gender": "Male",
            "mobileNumber": "9000000002",
            "status": "Active",
        },
    )
    assert created.status_code == 201, created.text
    body = created.json()
    assert body["role"] == "fileroom"
    assert body["staffCode"].startswith("FLR-")
    temp = body["temporaryPassword"]
    assert client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": temp},
    ).status_code == 200


def test_fileroom_can_list_student_and_employee_document_folders(client):
    headers = _h(client, "fileroom@qmis.edu", "fileroom123")
    students = client.get("/api/v1/documents/students", headers=headers)
    employees = client.get("/api/v1/documents/employees", headers=headers)
    assert students.status_code == 200, students.text
    assert employees.status_code == 200, employees.text


def test_admin_library_access_unchanged(client):
    admin = _h(client, "admin@qmis.edu", "admin123")
    up = client.post(
        "/api/v1/files/library",
        headers=admin,
        files={"file": ("admin-lib.pdf", io.BytesIO(PDF), "application/pdf")},
    )
    assert up.status_code == 201, up.text
    assert client.get("/api/v1/files", headers=admin).status_code == 200


def test_hr_employee_docs_remain_and_hr_cannot_use_library(client):
    hr = _h(client, "hr@qmis.edu", "hr12345")
    assert client.get("/api/v1/documents/employees", headers=hr).status_code == 200
    assert client.get("/api/v1/documents/students", headers=hr).status_code == 403
    assert client.get("/api/v1/files", headers=hr).status_code == 403
