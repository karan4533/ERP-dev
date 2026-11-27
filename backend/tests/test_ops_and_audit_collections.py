"""Ops + campus-audit JSON collections replace/list + role gates."""

import os

os.environ["DATABASE_URL"] = "sqlite+pysqlite:///:memory:"
os.environ["OTP_DEBUG"] = "true"
os.environ["JWT_SECRET"] = "test-secret-qmis-erp-phase0-local"
os.environ["ENVIRONMENT"] = "development"

import pytest
from fastapi.testclient import TestClient

from app.core.config import settings
from app.main import app

TEACHER = (settings.teacher_seed_email, settings.teacher_seed_password)


@pytest.fixture()
def client():
    with TestClient(app) as test_client:
        yield test_client


def _login(client, email: str, password: str):
    response = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    assert response.status_code == 200, response.text
    return {"Authorization": f"Bearer {response.json()['access_token']}"}


def _admin_headers(client):
    return _login(client, settings.admin_seed_email, settings.admin_seed_password)


def test_ops_library_replace_and_list(client):
    headers = _admin_headers(client)
    payload = [
        {
            "id": "LBK-1001",
            "title": "NCERT Physics XI",
            "author": "NCERT",
            "isbn": "978-81-7450-567-5",
            "status": "Available",
        }
    ]
    put = client.put("/api/v1/ops/library-books", json=payload, headers=headers)
    assert put.status_code == 200, put.text
    assert put.json()[0]["id"] == "LBK-1001"

    get = client.get("/api/v1/ops/library-books", headers=headers)
    assert get.status_code == 200
    assert get.json()[0]["title"] == "NCERT Physics XI"


def test_teacher_denied_library_write(client):
    headers = _login(client, TEACHER[0], TEACHER[1])
    put = client.put(
        "/api/v1/ops/library-books",
        json=[{"id": "LBK-9999", "title": "Nope"}],
        headers=headers,
    )
    assert put.status_code == 403


def test_biometric_teacher_can_write(client):
    headers = _login(client, TEACHER[0], TEACHER[1])
    put = client.put(
        "/api/v1/ops/biometric-attendance",
        json=[
            {
                "id": "BIO-1001",
                "person": "Aarav Sharma",
                "biometricStatus": "Present",
                "finalStatus": "Present",
                "source": "ESSL",
            }
        ],
        headers=headers,
    )
    assert put.status_code == 200, put.text
    get = client.get("/api/v1/ops/biometric-attendance", headers=headers)
    assert get.status_code == 200
    assert get.json()[0]["id"] == "BIO-1001"


def test_star_of_month_matrix_records_are_saved_one_class_at_a_time(client):
    teacher = _login(client, TEACHER[0], TEACHER[1])
    coordinator = _login(client, "coordinator@qmis.edu", "coord123")
    grade7 = {"context": {"month": "October", "year": "2026", "grade": "Grade 7", "section": "A"},
              "ratings": [{"studentId": "S1", "subId": "sub-attendance", "rating": "3"}]}
    grade8 = {"context": {"month": "October", "year": "2026", "grade": "Grade 8", "section": "B"},
              "ratings": [{"studentId": "S9", "subId": "sub-homework", "rating": "2"}]}
    first = client.put("/api/v1/ops/som-matrix/items/2026|October|Grade 7|A", json=grade7, headers=teacher)
    assert first.status_code == 200, first.text
    second = client.put("/api/v1/ops/som-matrix/items/2026|October|Grade 8|B", json=grade8, headers=coordinator)
    assert second.status_code == 200, second.text

    # saving one class again replaces only that class
    updated = {**grade7, "ratings": [{"studentId": "S1", "subId": "sub-attendance", "rating": "2"}]}
    assert client.put("/api/v1/ops/som-matrix/items/2026|October|Grade 7|A", json=updated,
                      headers=teacher).status_code == 200
    rows = {row["id"]: row for row in client.get("/api/v1/ops/som-matrix", headers=teacher).json()}
    assert rows["2026|October|Grade 7|A"]["ratings"][0]["rating"] == "2"
    assert rows["2026|October|Grade 8|B"]["ratings"][0]["rating"] == "2"

    assert client.put("/api/v1/ops/som-config/items/checklist", json={"categories": [{"id": "c1"}]},
                      headers=coordinator).status_code == 200
    # whole-list collections cannot be saved item by item
    assert client.put("/api/v1/ops/library-books/items/LBK-1", json={"title": "x"},
                      headers=_admin_headers(client)).status_code == 400
    # parents/students neither read nor write matrix ratings
    parent = _login(client, "parent@qmis.edu", "parent123")
    assert client.get("/api/v1/ops/som-matrix", headers=parent).status_code == 403
    assert client.put("/api/v1/ops/som-matrix/items/x", json=grade7, headers=parent).status_code == 403


def test_star_of_month_rejects_half_star_and_duplicate_cells(client):
    teacher = _login(client, TEACHER[0], TEACHER[1])
    bad_rating = {
        "context": {"month": "October", "year": "2026", "grade": "Grade 7", "section": "A"},
        "ratings": [{"studentId": "S1", "subId": "sub-attendance", "rating": "2.5"}],
    }
    rejected = client.put(
        "/api/v1/ops/som-matrix/items/2026|October|Grade 7|A",
        json=bad_rating,
        headers=teacher,
    )
    assert rejected.status_code == 422, rejected.text
    assert "invalid_rating" in rejected.text or "2.5" in rejected.text

    dup = {
        "context": {"month": "October", "year": "2026", "grade": "Grade 7", "section": "A"},
        "ratings": [
            {"studentId": "S1", "subId": "sub-attendance", "rating": "3"},
            {"studentId": "S1", "subId": "sub-attendance", "rating": "2"},
        ],
    }
    dup_resp = client.put(
        "/api/v1/ops/som-matrix/items/2026|October|Grade 7|A",
        json=dup,
        headers=teacher,
    )
    assert dup_resp.status_code == 422, dup_resp.text

    ok = {
        "context": {"month": "October", "year": "2026", "grade": "Grade 7", "section": "A"},
        "ratings": [{"studentId": "S1", "subId": "sub-attendance", "rating": "1"}],
        "meta": {
            "documents": [
                {"fileId": "11111111-1111-1111-1111-111111111111", "name": "evidence.pdf"},
            ],
        },
    }
    saved = client.put(
        "/api/v1/ops/som-matrix/items/2026|October|Grade 7|A",
        json=ok,
        headers=teacher,
    )
    assert saved.status_code == 200, saved.text
    assert saved.json()["ratings"][0]["rating"] == "1"
    assert saved.json()["meta"]["documents"][0]["name"] == "evidence.pdf"


def test_star_of_month_individual_ratings_reject_half_stars(client):
    teacher = _login(client, TEACHER[0], TEACHER[1])
    bad = client.put(
        "/api/v1/academics/student-star-ratings",
        headers=teacher,
        json=[{"id": "SSR-BAD", "studentId": "S1", "month": "October 2026", "rating": 2.5}],
    )
    assert bad.status_code == 422, bad.text
    assert "invalid_rating" in bad.text

    ok = client.put(
        "/api/v1/academics/student-star-ratings",
        headers=teacher,
        json=[{"id": "SSR-OK", "studentId": "S1", "month": "October 2026", "rating": 3}],
    )
    assert ok.status_code == 200, ok.text
    assert ok.json()[0]["rating"] == 3


def test_teacher_can_upload_and_download_som_attachment(client):
    teacher = _login(client, TEACHER[0], TEACHER[1])
    denied = client.post(
        "/api/v1/files",
        headers=teacher,
        data={"resource_type": "attachment"},
        files={"file": ("note.pdf", b"%PDF-1.4 test", "application/pdf")},
    )
    assert denied.status_code == 403, denied.text

    uploaded = client.post(
        "/api/v1/files",
        headers=teacher,
        data={"resource_type": "som-matrix-doc", "resource_id": "2026|October|Grade 7|A"},
        files={"file": ("evidence.pdf", b"%PDF-1.4 som-evidence", "application/pdf")},
    )
    assert uploaded.status_code == 201, uploaded.text
    file_id = uploaded.json()["id"]
    download = client.get(f"/api/v1/files/{file_id}/download", headers=teacher)
    assert download.status_code == 200, download.text
    assert download.content.startswith(b"%PDF-1.4")


def test_campus_audit_replace_and_list(client):
    headers = _admin_headers(client)
    payload = [{"id": "ATM-1", "name": "Safety Walkthrough", "status": "Published"}]
    put = client.put("/api/v1/campus-audit/audit-templates", json=payload, headers=headers)
    assert put.status_code == 200, put.text
    get = client.get("/api/v1/campus-audit/audit-templates", headers=headers)
    assert get.status_code == 200
    assert get.json()[0]["name"] == "Safety Walkthrough"


def test_teacher_denied_campus_audit(client):
    headers = _login(client, TEACHER[0], TEACHER[1])
    put = client.put(
        "/api/v1/campus-audit/audit-templates",
        json=[{"id": "ATM-X", "name": "Nope"}],
        headers=headers,
    )
    assert put.status_code == 403


def test_accounthead_can_read_transport_masters(client):
    admin = _admin_headers(client)
    put = client.put(
        "/api/v1/ops/transport-routes",
        json=[{"id": "RT-AH-1", "routeName": "Route North — Live"}],
        headers=admin,
    )
    assert put.status_code == 200, put.text

    ah = _login(client, settings.accounthead_seed_email, settings.accounthead_seed_password)
    get = client.get("/api/v1/ops/transport-routes", headers=ah)
    assert get.status_code == 200, get.text
    assert get.json()[0]["routeName"] == "Route North — Live"

    # Read-only: Account Head must not overwrite transport ops masters.
    denied = client.put(
        "/api/v1/ops/transport-routes",
        json=[{"id": "RT-AH-X", "routeName": "Nope"}],
        headers=ah,
    )
    assert denied.status_code == 403
