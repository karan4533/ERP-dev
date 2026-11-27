import io
import os

os.environ["DATABASE_URL"] = "sqlite+pysqlite:///:memory:"
os.environ["OTP_DEBUG"] = "true"
os.environ["JWT_SECRET"] = "test-secret-qmis-erp-file-management"

import pytest
from fastapi.testclient import TestClient

from app.main import app

PDF = b"%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF"


@pytest.fixture()
def client():
    with TestClient(app) as test_client:
        yield test_client


def _h(client, email, password):
    r = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    assert r.status_code == 200, r.text
    return {"Authorization": f"Bearer {r.json()['access_token']}"}


def test_admin_uploads_lists_downloads_and_deletes_a_library_file(client):
    admin = _h(client, "admin@qmis.edu", "admin123")
    up = client.post("/api/v1/files/library", headers=admin,
                     files={"file": ("circular.pdf", io.BytesIO(PDF), "application/pdf")})
    assert up.status_code == 201, up.text
    file_id = up.json()["id"]

    listed = client.get("/api/v1/files", params={"kind": "library"}, headers=admin).json()
    row = next(item for item in listed if item["id"] == file_id)
    assert row["deletable"] is True and row["uploaded_by"] == "admin@qmis.edu"
    assert client.get(f"/api/v1/files/{file_id}/download", headers=admin).content == PDF

    assert client.delete(f"/api/v1/files/{file_id}", headers=admin).json()["deleted"] is True
    assert all(item["id"] != file_id for item in client.get("/api/v1/files", headers=admin).json())


def test_files_from_other_modules_are_listed_but_cannot_be_deleted(client):
    admin = _h(client, "admin@qmis.edu", "admin123")
    other = client.post("/api/v1/files", headers=admin, data={"resource_type": "profile"},
                        files={"file": ("photo.pdf", io.BytesIO(PDF), "application/pdf")})
    assert other.status_code == 201, other.text
    row = next(item for item in client.get("/api/v1/files", headers=admin).json() if item["id"] == other.json()["id"])
    assert row["deletable"] is False
    assert client.delete(f"/api/v1/files/{row['id']}", headers=admin).status_code == 409


def test_library_upload_rejects_non_documents_and_non_admins(client):
    admin = _h(client, "admin@qmis.edu", "admin123")
    bad = client.post("/api/v1/files/library", headers=admin,
                      files={"file": ("script.exe", io.BytesIO(b"MZ\x90\x00"), "application/octet-stream")})
    assert bad.status_code == 415
    teacher = _h(client, "teacher@qmis.edu", "teacher123")
    assert client.get("/api/v1/files", headers=teacher).status_code == 403
    assert client.post("/api/v1/files/library", headers=teacher,
                       files={"file": ("a.pdf", io.BytesIO(PDF), "application/pdf")}).status_code == 403


def test_camera_register_rules(client):
    admin = _h(client, "admin@qmis.edu", "admin123")
    camera = {"name": "Main gate", "location": "Gate 1", "status": "Active", "streamUrl": "rtsp://10.0.0.5:554/stream1"}
    saved = client.put("/api/v1/ops/security-cameras/items/CAM-0001", json=camera, headers=admin)
    assert saved.status_code == 200, saved.text

    with_password = {**camera, "streamUrl": "rtsp://admin:secret@10.0.0.5/stream1"}
    rejected = client.put("/api/v1/ops/security-cameras/items/CAM-0002", json=with_password, headers=admin)
    assert rejected.status_code == 422 and "password" in rejected.text
    assert client.put("/api/v1/ops/security-cameras/items/CAM-0003", json={**camera, "status": "Broken"},
                      headers=admin).status_code == 422
    assert client.put("/api/v1/ops/security-cameras/items/CAM-0004", json={**camera, "streamUrl": "ftp://x/y"},
                      headers=admin).status_code == 422
    # whole-list saves are refused so the register cannot be wiped by accident
    assert client.put("/api/v1/ops/security-cameras", json=[], headers=admin).status_code == 400

    gkm = _h(client, "gatekeepermanager@qmis.edu", "gkm1234567")
    assert client.put("/api/v1/ops/security-cameras/items/CAM-0005", json={**camera, "name": "Back gate"},
                      headers=gkm).status_code == 200
    principal = _h(client, "principal@qmis.edu", "principal123")
    names = {row["name"] for row in client.get("/api/v1/ops/security-cameras", headers=principal).json()}
    # Shared in-memory DB may retain cameras from other tests; require these two at minimum.
    assert {"Main gate", "Back gate"} <= names
    assert client.put("/api/v1/ops/security-cameras/items/CAM-0006", json=camera, headers=principal).status_code == 403
    teacher = _h(client, "teacher@qmis.edu", "teacher123")
    assert client.get("/api/v1/ops/security-cameras", headers=teacher).status_code == 403

    assert client.delete("/api/v1/ops/security-cameras/items/CAM-0005", headers=admin).json()["deleted"] is True
    assert client.delete("/api/v1/ops/security-cameras/items/CAM-0005", headers=admin).status_code == 404
