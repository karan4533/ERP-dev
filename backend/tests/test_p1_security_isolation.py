"""P1 security: timetable scoping, audit stream isolation, delete gates, CA ownership."""

import os

os.environ["DATABASE_URL"] = "sqlite+pysqlite:///:memory:"
os.environ["OTP_DEBUG"] = "true"
os.environ["JWT_SECRET"] = "test-secret-qmis-erp-p1-security"
os.environ["ENVIRONMENT"] = "development"

import pytest
from fastapi.testclient import TestClient

from app.core.config import settings
from app.main import app
from auth_test_helpers import login_headers
from tests.conftest import reset_sqlite_memory_schema


@pytest.fixture()
def client():
    reset_sqlite_memory_schema()
    with TestClient(app) as test_client:
        yield test_client


def _login(client, email, password):
    return login_headers(client, email, password)


def _admin(client):
    return _login(client, settings.admin_seed_email, settings.admin_seed_password)


def _teacher(client):
    return _login(client, settings.teacher_seed_email, settings.teacher_seed_password)


def _coordinator(client):
    return _login(client, settings.coordinator_seed_email, settings.coordinator_seed_password)


def _principal(client):
    return _login(client, settings.principal_seed_email, settings.principal_seed_password)


def _process(client):
    return _login(client, "processauditor@qmis.edu", "process123")


def _quality(client):
    return _login(client, "qualityauditor@qmis.edu", "quality123")


def _seed_classes_and_teacher(client):
    admin = _admin(client)
    principal = _principal(client)
    options = client.get("/api/v1/masters/class-teacher-options", headers=admin).json()
    uid = {o["email"]: o["user_id"] for o in options}
    g5 = client.post("/api/v1/masters/classes", json={"name": "Grade 5"}, headers=admin).json()
    g8 = client.post("/api/v1/masters/classes", json={"name": "Grade 8"}, headers=admin).json()
    client.post(
        "/api/v1/masters/sections",
        json={"class_id": g5["id"], "name": "A", "class_teacher_user_id": uid["teacher@qmis.edu"]},
        headers=admin,
    )
    client.post("/api/v1/masters/sections", json={"class_id": g8["id"], "name": "A"}, headers=admin)
    client.put(
        "/api/v1/students/coordinator-grade-bands",
        headers=principal,
        json={"userId": uid["coordinator@qmis.edu"], "gradeFrom": 1, "gradeTo": 6},
    )
    return admin, principal


# ---------- #55 timetable server-side scoping ----------


def test_teacher_timetable_api_scoped_to_allocation(client):
    admin, principal = _seed_classes_and_teacher(client)
    items = [
        {"id": "TT-5A", "className": "Grade 5", "section": "A", "approvalStatus": "Approved", "timelines": []},
        {"id": "TT-8A", "className": "Grade 8", "section": "A", "approvalStatus": "Approved", "timelines": []},
    ]
    assert client.put("/api/v1/academics/class-timetables", json=items, headers=principal).status_code == 200

    teacher = _teacher(client)
    got = client.get("/api/v1/academics/class-timetables", headers=teacher)
    assert got.status_code == 200, got.text
    assert {row["id"] for row in got.json()} == {"TT-5A"}

    # Negative: teacher must not receive Grade 8 even when requesting the same collection.
    assert "TT-8A" not in {row["id"] for row in got.json()}


def test_coordinator_timetable_api_scoped_to_grade_band(client):
    _admin_h, principal = _seed_classes_and_teacher(client)
    items = [
        {"id": "TT-5A", "className": "Grade 5", "section": "A", "approvalStatus": "Approved", "timelines": []},
        {"id": "TT-8A", "className": "Grade 8", "section": "A", "approvalStatus": "Approved", "timelines": []},
    ]
    assert client.put("/api/v1/academics/class-timetables", json=items, headers=principal).status_code == 200
    coord = _coordinator(client)
    got = client.get("/api/v1/academics/class-timetables", headers=coord)
    assert got.status_code == 200
    assert {row["id"] for row in got.json()} == {"TT-5A"}


def test_leadership_still_sees_full_timetable_set(client):
    _admin_h, principal = _seed_classes_and_teacher(client)
    items = [
        {"id": "TT-5A", "className": "Grade 5", "section": "A", "approvalStatus": "Approved", "timelines": []},
        {"id": "TT-8A", "className": "Grade 8", "section": "A", "approvalStatus": "Approved", "timelines": []},
    ]
    assert client.put("/api/v1/academics/class-timetables", json=items, headers=principal).status_code == 200
    for headers in (_admin(client), principal, _login(client, settings.director_seed_email, settings.director_seed_password)):
        assert {row["id"] for row in client.get("/api/v1/academics/class-timetables", headers=headers).json()} == {
            "TT-5A",
            "TT-8A",
        }


# ---------- #31 process vs quality audit isolation ----------


def test_process_auditor_cannot_read_quality_stream(client):
    quality = _quality(client)
    payload = [
        {
            "id": "OBS-QA-ISO-1",
            "observationId": "OBS-QA-ISO-1",
            "auditReference": "AUD-QA-ISO-1",
            "title": "Quality only",
        }
    ]
    put = client.put("/api/v1/campus-audit/quality-observations", json=payload, headers=quality)
    assert put.status_code == 200, put.text

    process = _process(client)
    denied = client.get("/api/v1/campus-audit/quality-observations", headers=process)
    assert denied.status_code == 403, denied.text

    write_denied = client.put(
        "/api/v1/campus-audit/quality-observations",
        json=[{"id": "OBS-QA-HACK", "observationId": "OBS-QA-HACK"}],
        headers=process,
    )
    assert write_denied.status_code == 403


def test_quality_auditor_cannot_read_process_stream(client):
    process = _process(client)
    payload = [
        {
            "id": "OBS-PA-ISO-1",
            "observationId": "OBS-PA-ISO-1",
            "auditReference": "AUD-PA-ISO-1",
            "title": "Process only",
        }
    ]
    put = client.put("/api/v1/campus-audit/process-observations", json=payload, headers=process)
    assert put.status_code == 200, put.text

    quality = _quality(client)
    denied = client.get("/api/v1/campus-audit/process-observations", headers=quality)
    assert denied.status_code == 403, denied.text


def test_quality_stream_rejects_process_ids_on_write(client):
    quality = _quality(client)
    bad = client.put(
        "/api/v1/campus-audit/quality-observations",
        json=[{"id": "OBS-PA-BLEED", "observationId": "OBS-PA-BLEED", "auditReference": "AUD-PA-1"}],
        headers=quality,
    )
    assert bad.status_code == 422, bad.text


def test_teacher_denied_audit_rca_collections(client):
    teacher = _teacher(client)
    for collection in ("process-rca", "quality-rca", "process-atr", "quality-atr"):
        assert client.get(f"/api/v1/campus-audit/{collection}", headers=teacher).status_code == 403
        assert client.put(
            f"/api/v1/campus-audit/{collection}",
            json=[{"id": "X-1"}],
            headers=teacher,
        ).status_code == 403


# ---------- #34 delete authorization ----------


def test_teacher_cannot_delete_or_wipe_ops_library(client):
    admin = _admin(client)
    assert (
        client.put(
            "/api/v1/ops/library-books",
            json=[{"id": "LBK-DEL-1", "title": "Keep", "author": "A", "isbn": "1", "status": "Available"}],
            headers=admin,
        ).status_code
        == 200
    )
    teacher = _teacher(client)
    # Whole-list wipe and item delete both require ops write; teacher must be rejected.
    wipe = client.put("/api/v1/ops/library-books", json=[], headers=teacher)
    assert wipe.status_code == 403, wipe.text
    denied = client.delete("/api/v1/ops/library-books/items/LBK-DEL-1", headers=teacher)
    assert denied.status_code == 403, denied.text
    still_there = client.get("/api/v1/ops/library-books", headers=admin).json()
    assert any(row["id"] == "LBK-DEL-1" for row in still_there)


# ---------- #58a CA / unit-tests ownership ----------


def test_teacher_unit_tests_scoped_and_cannot_overwrite_other_class(client):
    _admin_h, principal = _seed_classes_and_teacher(client)
    seed = [
        {
            "id": "UT-5A",
            "entryId": "UT-5A",
            "className": "Grade 5",
            "section": "A",
            "title": "Mine",
            "subject": "Maths",
        },
        {
            "id": "UT-8A",
            "entryId": "UT-8A",
            "className": "Grade 8",
            "section": "A",
            "title": "Other",
            "subject": "Science",
        },
    ]
    assert client.put("/api/v1/academics/unit-tests", json=seed, headers=principal).status_code == 200

    teacher = _teacher(client)
    listed = client.get("/api/v1/academics/unit-tests", headers=teacher)
    assert listed.status_code == 200
    assert {row["id"] for row in listed.json()} == {"UT-5A"}

    # Negative: teacher cannot plant / overwrite Grade 8 CA via PUT.
    hack = client.put(
        "/api/v1/academics/unit-tests",
        json=[
            {
                "id": "UT-8A",
                "entryId": "UT-8A",
                "className": "Grade 8",
                "section": "A",
                "title": "Hijacked",
                "subject": "Science",
            }
        ],
        headers=teacher,
    )
    assert hack.status_code == 403, hack.text

    # Leadership still holds the Grade 8 row.
    principal_rows = client.get("/api/v1/academics/unit-tests", headers=principal).json()
    assert {row["id"]: row["title"] for row in principal_rows}["UT-8A"] == "Other"
