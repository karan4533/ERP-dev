"""Principal academics collections: class timetables + teacher allocations."""

import os

os.environ["DATABASE_URL"] = "sqlite+pysqlite:///:memory:"
os.environ["OTP_DEBUG"] = "true"
os.environ["JWT_SECRET"] = "test-secret-qmis-erp-phase0-local"
os.environ["ENVIRONMENT"] = "development"

import pytest
from fastapi.testclient import TestClient

from app.core.config import settings
from app.main import app
from tests.conftest import reset_sqlite_memory_schema

TEACHER = (settings.teacher_seed_email, settings.teacher_seed_password)


@pytest.fixture()
def client():
    reset_sqlite_memory_schema()
    with TestClient(app) as test_client:
        yield test_client


def _login(client, email: str, password: str):
    response = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    assert response.status_code == 200, response.text
    return {"Authorization": f"Bearer {response.json()['access_token']}"}


def _principal_headers(client):
    return _login(client, settings.principal_seed_email, settings.principal_seed_password)


def _ensure_class_section(client, class_name: str, section: str = "A") -> None:
    admin = _login(client, settings.admin_seed_email, settings.admin_seed_password)
    classes = client.get("/api/v1/masters/classes", headers=admin).json()
    row = next((c for c in classes if c.get("name") == class_name), None)
    if row is None:
        created = client.post("/api/v1/masters/classes", json={"name": class_name}, headers=admin)
        assert created.status_code == 201, created.text
        row = created.json()
    sections = client.get("/api/v1/masters/sections", headers=admin).json()
    if not any(
        s.get("classId") == row["id"] and str(s.get("name") or "").upper() == section.upper()
        for s in sections
    ):
        made = client.post(
            "/api/v1/masters/sections",
            json={"class_id": row["id"], "name": section},
            headers=admin,
        )
        # Concurrent/enroll paths may create the same section first.
        assert made.status_code in (201, 409), made.text


def test_class_timetables_replace_and_list(client):
    headers = _principal_headers(client)
    _ensure_class_section(client, "Grade 9", "A")
    _ensure_campus_subject(client, name="English", code="ENG")
    payload = [
        {
            "id": "CTT100",
            "className": "Grade 9",
            "section": "A",
            "academicYear": "2026-2027",
            "term": "Term 1",
            "submittedDate": "17-10-2026",
            "approvalStatus": "Pending",
            "timelines": [
                {
                    "id": "TL-1",
                    "periodNumber": "1",
                    "day": "Monday",
                    "subject": "English",
                    "teacher": "Ms. Anitha Verma",
                    "startTime": "09:00",
                    "endTime": "09:45",
                }
            ],
        }
    ]
    put = client.put("/api/v1/academics/class-timetables", json=payload, headers=headers)
    assert put.status_code == 200, put.text
    assert put.json()[0]["id"] == "CTT100"

    get = client.get("/api/v1/academics/class-timetables", headers=headers)
    assert get.status_code == 200
    assert get.json()[0]["className"] == "Grade 9"


def test_teacher_allocations_replace(client):
    headers = _principal_headers(client)
    _ensure_class_section(client, "Grade 10", "A")
    _ensure_campus_subject(client, name="Mathematics", code="MAT")
    payload = [
        {
            "employeeId": "TEA-1001",
            "status": "Active",
            "classTeacher": {"academicYear": "2026–2027", "className": "Grade 10", "section": "A"},
            "teachingClasses": ["Grade 10"],
            "subjects": ["Mathematics"],
            "mappings": [
                {"id": "MAP-001", "className": "Grade 10", "section": "A", "subject": "Mathematics"}
            ],
        }
    ]
    put = client.put("/api/v1/academics/teacher-allocations", json=payload, headers=headers)
    assert put.status_code == 200, put.text
    assert put.json()[0]["employeeId"] == "TEA-1001"


def test_admin_cannot_write_teacher_allocations(client):
    """Client review: Teacher Allocation is Principal-owned (Admin may still manage class timetables)."""
    admin = _login(client, settings.admin_seed_email, settings.admin_seed_password)
    put = client.put(
        "/api/v1/academics/teacher-allocations",
        json=[{"employeeId": "TEA-ADMIN-BLOCK", "status": "Active", "mappings": []}],
        headers=admin,
    )
    assert put.status_code == 403


def _ensure_campus_subject(client, *, name: str, code: str) -> None:
    admin = _login(client, settings.admin_seed_email, settings.admin_seed_password)
    existing = client.get("/api/v1/masters/subjects", headers=admin)
    assert existing.status_code == 200, existing.text
    names = {str(row.get("name") or "").strip().lower() for row in existing.json()}
    if name.strip().lower() in names:
        return
    created = client.post(
        "/api/v1/masters/subjects",
        json={"name": name, "code": code},
        headers=admin,
    )
    assert created.status_code in (200, 201), created.text


def test_teacher_allocations_accept_known_subject(client):
    """CA-04: campus-wide subject catalogue — known names are accepted."""
    _ensure_campus_subject(client, name="Mathematics", code="MAT")
    headers = _principal_headers(client)
    put = client.put(
        "/api/v1/academics/teacher-allocations",
        json=[
            {
                "employeeId": "TEA-KNOWN-SUBJ",
                "status": "Active",
                "classTeacher": None,
                "teachingClasses": ["Grade 10"],
                "subjects": ["Mathematics"],
                "mappings": [
                    {
                        "id": "MAP-OK",
                        "className": "Grade 10",
                        "section": "A",
                        "subject": "Mathematics",
                    }
                ],
            }
        ],
        headers=headers,
    )
    assert put.status_code == 200, put.text
    assert put.json()[0]["subjects"] == ["Mathematics"]


def test_teacher_allocations_reject_unknown_subject(client):
    """CA-04: once a campus subject catalogue exists, unknown mapping subjects are rejected."""
    _ensure_campus_subject(client, name="Mathematics", code="MAT")
    headers = _principal_headers(client)
    before = client.get("/api/v1/academics/teacher-allocations", headers=headers)
    assert before.status_code == 200, before.text
    prior = before.json()

    put = client.put(
        "/api/v1/academics/teacher-allocations",
        json=[
            {
                "employeeId": "TEA-UNKNOWN-SUBJ",
                "status": "Active",
                "classTeacher": None,
                "teachingClasses": ["Grade 10"],
                "subjects": ["Not A Real Subject XYZ"],
                "mappings": [
                    {
                        "id": "MAP-BAD",
                        "className": "Grade 10",
                        "section": "A",
                        "subject": "Not A Real Subject XYZ",
                    }
                ],
            }
        ],
        headers=headers,
    )
    assert put.status_code == 422, put.text

    after = client.get("/api/v1/academics/teacher-allocations", headers=headers)
    assert after.status_code == 200, after.text
    assert after.json() == prior


def test_teacher_allocation_syncs_section_class_teacher(client):
    """CA-02: Active classTeacher on allocation updates sections.class_teacher_user_id."""
    from sqlalchemy import select

    from app.core.database import SessionLocal
    from app.models import User

    _ensure_campus_subject(client, name="Mathematics", code="MAT")
    admin = _login(client, settings.admin_seed_email, settings.admin_seed_password)
    principal = _principal_headers(client)

    with SessionLocal() as db:
        teacher = db.scalar(select(User).where(User.email == settings.teacher_seed_email.lower()))
        coordinator = db.scalar(
            select(User).where(User.email == settings.coordinator_seed_email.lower())
        )
        assert teacher is not None
        assert coordinator is not None
        teacher_id = str(teacher.id)
        coordinator_id = str(coordinator.id)

    class_name = f"AllocSync-{os.urandom(2).hex()}"
    created = client.post(
        "/api/v1/masters/classes",
        json={"name": class_name, "section": "A"},
        headers=admin,
    )
    assert created.status_code == 201, created.text
    class_id = created.json()["id"]
    sections = client.get("/api/v1/masters/sections", params={"class_id": class_id}, headers=admin)
    assert sections.status_code == 200, sections.text
    section_id = sections.json()[0]["id"]

    put = client.put(
        "/api/v1/academics/teacher-allocations",
        json=[
            {
                "employeeId": settings.teacher_seed_email,
                "email": settings.teacher_seed_email,
                "status": "Active",
                "classTeacher": {
                    "academicYear": "2026-27",
                    "className": class_name,
                    "section": "A",
                },
                "teachingClasses": [class_name],
                "subjects": ["Mathematics"],
                "mappings": [
                    {
                        "id": "MAP-SYNC-1",
                        "className": class_name,
                        "section": "A",
                        "subject": "Mathematics",
                    }
                ],
            }
        ],
        headers=principal,
    )
    assert put.status_code == 200, put.text

    again = client.get(f"/api/v1/masters/sections/{section_id}", headers=admin)
    assert again.status_code == 200, again.text
    assert again.json()["class_teacher_user_id"] == teacher_id

    # Reassignment: another resolved user becomes class teacher for the same section.
    reassign = client.put(
        "/api/v1/academics/teacher-allocations",
        json=[
            {
                "employeeId": settings.coordinator_seed_email,
                "email": settings.coordinator_seed_email,
                "status": "Active",
                "classTeacher": {
                    "academicYear": "2026-27",
                    "className": class_name,
                    "section": "A",
                },
                "teachingClasses": [class_name],
                "subjects": ["Mathematics"],
                "mappings": [
                    {
                        "id": "MAP-SYNC-2",
                        "className": class_name,
                        "section": "A",
                        "subject": "Mathematics",
                    }
                ],
            }
        ],
        headers=principal,
    )
    assert reassign.status_code == 200, reassign.text
    reassigned = client.get(f"/api/v1/masters/sections/{section_id}", headers=admin)
    assert reassigned.status_code == 200, reassigned.text
    assert reassigned.json()["class_teacher_user_id"] == coordinator_id

    clear = client.put(
        "/api/v1/academics/teacher-allocations",
        json=[
            {
                "employeeId": settings.coordinator_seed_email,
                "email": settings.coordinator_seed_email,
                "status": "Not Allocated",
                "classTeacher": None,
                "teachingClasses": [],
                "subjects": [],
                "mappings": [],
            }
        ],
        headers=principal,
    )
    assert clear.status_code == 200, clear.text
    cleared = client.get(f"/api/v1/masters/sections/{section_id}", headers=admin)
    assert cleared.status_code == 200, cleared.text
    assert cleared.json()["class_teacher_user_id"] is None


def test_failed_allocation_load_gate_is_enforced_in_frontend_module():
    """CA-05: static regression — failed hydrate must not present as confirmed empty for save."""
    from pathlib import Path

    src = (
        Path(__file__).resolve().parents[2]
        / "src"
        / "Pages"
        / "Principal"
        / "TeacherAllocation"
        / "teacherAllocationData.js"
    ).read_text(encoding="utf-8")
    assert "canSaveTeacherAllocations" in src
    assert "allocationHydrateStatus === 'ready'" in src
    assert "CA-05" in src
    # On hydrate failure memory is null (not []), so replace cannot run with a fake empty set.
    assert "apiMemoryAllocations = null" in src
    assert "lastConfirmedServerAllocations" in src


def test_teacher_cannot_replace_timetables(client):
    headers = _login(client, TEACHER[0], TEACHER[1])
    put = client.put(
        "/api/v1/academics/class-timetables",
        json=[{"id": "CTT999", "className": "Grade 1", "section": "A", "timelines": []}],
        headers=headers,
    )
    assert put.status_code == 403


def test_coordinator_can_replace_timetables(client):
    """Coordinator may create within grade band; approval is forced to Pending (TT-05)."""
    admin = _login(client, settings.admin_seed_email, settings.admin_seed_password)
    principal = _principal_headers(client)
    options = client.get("/api/v1/masters/class-teacher-options", headers=admin)
    assert options.status_code == 200, options.text
    uid = {row["email"]: row["user_id"] for row in options.json()}
    band = client.put(
        "/api/v1/students/coordinator-grade-bands",
        headers=principal,
        json={"userId": uid[settings.coordinator_seed_email], "gradeFrom": 1, "gradeTo": 6},
    )
    assert band.status_code == 200, band.text

    headers = _login(client, settings.coordinator_seed_email, settings.coordinator_seed_password)

    # No grade band / out of band → blocked.
    denied = client.put(
        "/api/v1/academics/class-timetables",
        json=[
            {
                "id": "CTT-COORD-OUT",
                "className": "Grade 8",
                "section": "A",
                "approvalStatus": "Pending",
                "timelines": [],
            }
        ],
        headers=headers,
    )
    assert denied.status_code == 403, denied.text

    put = client.put(
        "/api/v1/academics/class-timetables",
        json=[
            {
                "id": "CTT-COORD-1",
                "className": "Grade 1",
                "section": "A",
                "approvalStatus": "Approved",
                "timelines": [],
            }
        ],
        headers=headers,
    )
    assert put.status_code == 200, put.text
    assert put.json()[0]["id"] == "CTT-COORD-1"
    # TT-05: coordinators may create/edit but cannot publish via PUT.
    assert put.json()[0].get("approvalStatus") == "Pending"


def test_class_timetable_rejects_period_clash(client):
    """TT-04: overlapping periods for the same class/section on the same day → 422."""
    _ensure_campus_subject(client, name="Mathematics", code="MAT")
    admin = _login(client, settings.admin_seed_email, settings.admin_seed_password)
    headers = _principal_headers(client)
    class_name = f"ClashClass-{os.urandom(2).hex()}"
    created = client.post(
        "/api/v1/masters/classes",
        json={"name": class_name, "section": "A"},
        headers=admin,
    )
    assert created.status_code == 201, created.text

    before = client.get("/api/v1/academics/class-timetables", headers=headers)
    assert before.status_code == 200
    prior = before.json()

    # No ownerTeacherId: skip allocation eligibility; still enforce class/teacher overlaps.
    put = client.put(
        "/api/v1/academics/class-timetables",
        json=[
            {
                "id": "CTT-CLASH-1",
                "className": class_name,
                "section": "A",
                "ownerTeacherName": "Clash Teacher",
                "approvalStatus": "Pending",
                "timelines": [
                    {
                        "id": "TL-C1",
                        "day": "Monday",
                        "className": class_name,
                        "section": "A",
                        "subject": "Mathematics",
                        "teacher": "Clash Teacher",
                        "startTime": "09:00",
                        "endTime": "09:45",
                    },
                    {
                        "id": "TL-C2",
                        "day": "Monday",
                        "className": class_name,
                        "section": "A",
                        "subject": "Mathematics",
                        "teacher": "Clash Teacher",
                        "startTime": "09:30",
                        "endTime": "10:15",
                    },
                ],
            }
        ],
        headers=headers,
    )
    assert put.status_code == 422, put.text
    after = client.get("/api/v1/academics/class-timetables", headers=headers)
    assert after.status_code == 200
    assert after.json() == prior


def test_class_timetable_allocation_and_subject_rules(client):
    """TT-03: campus subject + Module 1 allocation coverage when allocations exist."""
    from sqlalchemy import select

    from app.core.database import SessionLocal
    from app.models import User

    _ensure_campus_subject(client, name="Mathematics", code="MAT")
    admin = _login(client, settings.admin_seed_email, settings.admin_seed_password)
    principal = _principal_headers(client)

    with SessionLocal() as db:
        teacher = db.scalar(select(User).where(User.email == settings.teacher_seed_email.lower()))
        assert teacher is not None

    class_name = f"TTClass-{os.urandom(2).hex()}"
    created = client.post(
        "/api/v1/masters/classes",
        json={"name": class_name, "section": "A"},
        headers=admin,
    )
    assert created.status_code == 201, created.text

    alloc = client.put(
        "/api/v1/academics/teacher-allocations",
        json=[
            {
                "employeeId": settings.teacher_seed_email,
                "email": settings.teacher_seed_email,
                "status": "Active",
                "classTeacher": None,
                "teachingClasses": [class_name],
                "subjects": ["Mathematics"],
                "mappings": [
                    {
                        "id": "MAP-TT-1",
                        "className": class_name,
                        "section": "A",
                        "subject": "Mathematics",
                    }
                ],
            }
        ],
        headers=principal,
    )
    assert alloc.status_code == 200, alloc.text

    ok = client.put(
        "/api/v1/academics/class-timetables",
        json=[
            {
                "id": "CTT-ALLOC-OK",
                "className": class_name,
                "section": "A",
                "ownerTeacherId": settings.teacher_seed_email,
                "ownerTeacherEmail": settings.teacher_seed_email,
                "ownerTeacherName": "Seed Teacher",
                "approvalStatus": "Pending",
                "timelines": [
                    {
                        "id": "TL-OK",
                        "day": "Tuesday",
                        "className": class_name,
                        "section": "A",
                        "subject": "Mathematics",
                        "teacher": "Seed Teacher",
                        "startTime": "10:00",
                        "endTime": "10:45",
                    }
                ],
            }
        ],
        headers=principal,
    )
    assert ok.status_code == 200, ok.text

    bad = client.put(
        "/api/v1/academics/class-timetables",
        json=[
            {
                "id": "CTT-ALLOC-BAD",
                "className": class_name,
                "section": "A",
                "ownerTeacherId": settings.teacher_seed_email,
                "ownerTeacherEmail": settings.teacher_seed_email,
                "approvalStatus": "Pending",
                "timelines": [
                    {
                        "id": "TL-BAD",
                        "day": "Tuesday",
                        "className": class_name,
                        "section": "A",
                        "subject": "Not A Real Subject XYZ",
                        "teacher": "Seed Teacher",
                        "startTime": "11:00",
                        "endTime": "11:45",
                    }
                ],
            }
        ],
        headers=principal,
    )
    assert bad.status_code == 422, bad.text


def test_unit_tests_and_deliverables_collections(client):
    admin = _login(client, settings.admin_seed_email, settings.admin_seed_password)
    principal = _principal_headers(client)
    _ensure_class_section(client, "Grade 5", "A")
    _ensure_campus_subject(client, name="Mathematics", code="MAT")
    options = client.get("/api/v1/masters/class-teacher-options", headers=admin).json()
    teacher_id = next(o["user_id"] for o in options if o["email"] == TEACHER[0])
    alloc = client.put(
        "/api/v1/academics/teacher-allocations",
        headers=principal,
        json=[
            {
                "employeeId": "TEA-UT-1",
                "email": TEACHER[0],
                "status": "Active",
                "mappings": [
                    {
                        "id": "MAP-UT-1",
                        "className": "Grade 5",
                        "section": "A",
                        "subject": "Mathematics",
                        "teacherUserId": teacher_id,
                    }
                ],
            }
        ],
    )
    assert alloc.status_code == 200, alloc.text
    headers = _login(client, TEACHER[0], TEACHER[1])
    for collection, item_id in (
        ("unit-tests", "UT-2001"),
        ("sample-questions", "SQ-2001"),
        ("home-fun", "HF-2001"),
        ("study-materials", "SM-2001"),
    ):
        put = client.put(
            f"/api/v1/academics/{collection}",
            json=[
                {
                    "id": item_id,
                    "title": "Demo",
                    "subject": "Mathematics",
                    "className": "Grade 5",
                    "section": "A",
                }
            ],
            headers=headers,
        )
        assert put.status_code == 200, put.text
        get = client.get(f"/api/v1/academics/{collection}", headers=headers)
        assert get.status_code == 200
        assert get.json()[0]["id"] == item_id


def test_online_classes_replace_and_list(client):
    headers = _principal_headers(client)
    payload = [
        {
            "id": "OC-2001",
            "onlineClassId": "OC-2001",
            "subject": "Mathematics",
            "className": "Grade 10",
            "section": "A",
            "topic": "Live revision",
            "date": "21-10-2026",
            "startTime": "09:00 AM",
            "endTime": "10:00 AM",
            "meetingPlatform": "Google Meet",
            "meetingLink": "https://meet.google.com/demo",
            "status": "Scheduled",
        }
    ]
    put = client.put("/api/v1/academics/online-classes", json=payload, headers=headers)
    assert put.status_code == 200, put.text
    assert put.json()[0]["id"] == "OC-2001"

    get = client.get("/api/v1/academics/online-classes", headers=headers)
    assert get.status_code == 200
    assert get.json()[0]["meetingPlatform"] == "Google Meet"


def test_extra_classes_replace_and_list(client):
    headers = _principal_headers(client)
    payload = [
        {
            "id": "EC-2001",
            "extraClassId": "EC-2001",
            "subject": "Science",
            "className": "9",
            "section": "A",
            "classSection": "9-A",
            "topic": "Forces",
            "date": "20-10-2026",
            "startTime": "03:00 PM",
            "endTime": "04:00 PM",
            "venue": "Lab 1",
            "reason": "Catch-up",
        }
    ]
    put = client.put("/api/v1/academics/extra-classes", json=payload, headers=headers)
    assert put.status_code == 200, put.text
    assert put.json()[0]["id"] == "EC-2001"

    get = client.get("/api/v1/academics/extra-classes", headers=headers)
    assert get.status_code == 200
    assert get.json()[0]["subject"] == "Science"


def test_teacher_can_file_change_request(client):
    headers = _login(client, TEACHER[0], TEACHER[1])
    put = client.put(
        "/api/v1/academics/class-timetable-change-requests",
        json=[
            {
                "id": "TCR-1",
                "className": "Grade 9",
                "section": "A",
                "day": "Monday",
                "requestedSubject": "Science",
                "reason": "Swap",
                "status": "Pending",
            }
        ],
        headers=headers,
    )
    assert put.status_code == 200, put.text
    assert put.json()[0]["id"] == "TCR-1"
