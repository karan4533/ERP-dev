"""Timetable isolation (#55), class timetable CRUD (#3a/#3b), role hierarchy (#4),
teacher allocation ownership + duplicates (#5) and Extended Class Save Changes (#56)."""

import os
import uuid
from pathlib import Path

os.environ["DATABASE_URL"] = "sqlite+pysqlite:///:memory:"
os.environ["OTP_DEBUG"] = "true"
os.environ["JWT_SECRET"] = "test-secret-qmis-erp-timetable-alloc"
os.environ["ENVIRONMENT"] = "development"

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import select

from app.core.config import settings
from app.core.database import SessionLocal
from app.core.security import hash_password
from app.main import app
from app.models import AcademicsRecord, AuditLog, Campus, Role, User
from auth_test_helpers import login_headers
from tests.conftest import reset_sqlite_memory_schema

TT = "/api/v1/academics/class-timetables"
TCR = "/api/v1/academics/class-timetable-change-requests"
ALLOC = "/api/v1/academics/teacher-allocations"
EC = "/api/v1/academics/extra-classes"
SRC = Path(__file__).resolve().parents[2] / "src"
OTHER_PW = "Other-Staff-2026!"


@pytest.fixture()
def client():
    reset_sqlite_memory_schema()
    with TestClient(app) as test_client:
        yield test_client


def _h(client, who: str):
    creds = {
        "admin": (settings.admin_seed_email, settings.admin_seed_password),
        "principal": (settings.principal_seed_email, settings.principal_seed_password),
        "director": (settings.director_seed_email, settings.director_seed_password),
        "coordinator": (settings.coordinator_seed_email, settings.coordinator_seed_password),
        "teacher": (settings.teacher_seed_email, settings.teacher_seed_password),
    }[who]
    return login_headers(client, *creds)


def _ok(response, status=200):
    assert response.status_code == status, response.text
    return response.json()


def _campus_id():
    with SessionLocal() as db:
        return db.scalar(select(User.campus_id).where(User.email == settings.admin_seed_email))


def _make_user(role_code: str, *, campus_id=None) -> tuple[str, str]:
    email = f"{role_code}.{uuid.uuid4().hex[:8]}@qmis.edu"
    with SessionLocal() as db:
        if campus_id is None:
            campus_id = db.scalar(select(User.campus_id).where(User.email == settings.admin_seed_email))
        role = db.scalar(select(Role).where(Role.code == role_code))
        user = User(
            campus_id=campus_id,
            role_id=role.id,
            email=email,
            password_hash=hash_password(OTHER_PW),
            is_active=True,
        )
        db.add(user)
        db.commit()
        return email, str(user.id)


def _uid(email: str) -> str:
    with SessionLocal() as db:
        return str(db.scalar(select(User.id).where(User.email == email)))


def _world(client, *, band: bool = True) -> dict:
    """Grade 5 A (teacher is class teacher), Grade 5 B, Grade 8 A; coordinator band 1-6."""
    admin = _h(client, "admin")
    principal = _h(client, "principal")
    options = _ok(client.get("/api/v1/masters/class-teacher-options", headers=admin))
    uid = {o["email"]: o["user_id"] for o in options}
    g5 = _ok(client.post("/api/v1/masters/classes", json={"name": "Grade 5"}, headers=admin), 201)
    g8 = _ok(client.post("/api/v1/masters/classes", json={"name": "Grade 8"}, headers=admin), 201)
    for body in (
        {"class_id": g5["id"], "name": "A", "class_teacher_user_id": uid[settings.teacher_seed_email]},
        {"class_id": g5["id"], "name": "B"},
        {"class_id": g8["id"], "name": "A"},
    ):
        assert client.post("/api/v1/masters/sections", json=body, headers=admin).status_code in (201, 409)
    existing = {str(s.get("name") or "").lower() for s in _ok(client.get("/api/v1/masters/subjects", headers=admin))}
    for name, code in (("Mathematics", "MAT"), ("English", "ENG")):
        if name.lower() not in existing:
            assert client.post("/api/v1/masters/subjects", json={"name": name, "code": code}, headers=admin).status_code in (200, 201)
    if band:
        _ok(client.put(
            "/api/v1/students/coordinator-grade-bands",
            headers=principal,
            json={"userId": uid[settings.coordinator_seed_email], "gradeFrom": 1, "gradeTo": 6},
        ))
    return {"admin": admin, "principal": principal, "uid": uid}


def _tt(tid: str, cls: str, section: str, **extra) -> dict:
    return {"id": tid, "className": cls, "section": section, "approvalStatus": "Approved", "timelines": [], **extra}


def _ids(client, path: str, headers) -> set[str]:
    return {row["id"] for row in _ok(client.get(path, headers=headers))}


def _audit_actions(entity_id: str) -> list[AuditLog]:
    with SessionLocal() as db:
        return list(db.scalars(select(AuditLog).where(AuditLog.entity_id == entity_id)).all())


# ============================================================ #55 timetable data isolation


def test_teacher_sees_class_teacher_section_and_own_timetables_only(client):
    w = _world(client)
    _ok(client.put(TT, headers=w["principal"], json=[
        _tt("TT-5A", "Grade 5", "A"),
        _tt("TT-5B", "Grade 5", "B"),
        _tt("TT-8A", "Grade 8", "A"),
        _tt("TT-OWN", "Grade 8", "A", ownerTeacherEmail=settings.teacher_seed_email),
    ]))
    teacher = _h(client, "teacher")
    assert _ids(client, TT, teacher) == {"TT-5A", "TT-OWN"}


def test_allocated_teacher_sees_only_allocated_classes(client):
    w = _world(client)
    email, _ = _make_user("teacher")
    _ok(client.put(ALLOC, headers=w["principal"], json=[{
        "employeeId": "T2", "email": email, "status": "Active",
        "mappings": [{"className": "Grade 8", "section": "A", "subject": "Mathematics"}],
    }]))
    _ok(client.put(TT, headers=w["principal"], json=[_tt("TT-5A", "Grade 5", "A"), _tt("TT-8A", "Grade 8", "A")]))
    other = login_headers(client, email, OTHER_PW)
    assert _ids(client, TT, other) == {"TT-8A"}


def test_coordinator_without_band_sees_nothing_then_only_band(client):
    w = _world(client, band=False)
    _ok(client.put(TT, headers=w["principal"], json=[_tt("TT-5A", "Grade 5", "A"), _tt("TT-8A", "Grade 8", "A")]))
    coord = _h(client, "coordinator")
    assert _ids(client, TT, coord) == set()
    _ok(client.put(
        "/api/v1/students/coordinator-grade-bands",
        headers=w["principal"],
        json={"userId": w["uid"][settings.coordinator_seed_email], "gradeFrom": 1, "gradeTo": 6},
    ))
    assert _ids(client, TT, coord) == {"TT-5A"}


def test_teacher_does_not_receive_other_peoples_change_requests(client):
    w = _world(client)
    _ok(client.put(TCR, headers=w["principal"], json=[
        {"id": "TCR-OTHER", "className": "Grade 8", "section": "A", "requestedByEmail": "someone@qmis.edu"},
        {"id": "TCR-LEGACY-8A", "className": "Grade 8", "section": "A", "reason": "no requester"},
        {"id": "TCR-LEGACY-5A", "className": "Grade 5", "section": "A", "reason": "no requester"},
    ]))
    teacher = _h(client, "teacher")
    # Previously a teacher with no own request received the whole campus list.
    assert _ids(client, TCR, teacher) == {"TCR-LEGACY-5A"}


def test_portal_and_teacher_cannot_write_or_delete_timetables(client):
    w = _world(client)
    _ok(client.put(TT, headers=w["principal"], json=[_tt("TT-5A", "Grade 5", "A")]))
    teacher = _h(client, "teacher")
    assert client.put(TT, headers=teacher, json=[]).status_code == 403
    assert client.delete(f"{TT}/TT-5A", headers=teacher).status_code == 403
    assert _ids(client, TT, w["principal"]) == {"TT-5A"}


# ============================================================ #4 role hierarchy


def test_leadership_sees_own_campus_only(client):
    w = _world(client)
    _ok(client.put(TT, headers=w["principal"], json=[_tt("TT-5A", "Grade 5", "A"), _tt("TT-8A", "Grade 8", "A")]))
    for who in ("principal", "director", "admin"):
        assert _ids(client, TT, _h(client, who)) == {"TT-5A", "TT-8A"}, who

    with SessionLocal() as db:
        other = Campus(code=f"OC{uuid.uuid4().hex[:6]}", name="Other campus", city="Elsewhere")
        db.add(other)
        db.commit()
        other_id = other.id
    email, _ = _make_user("principal", campus_id=other_id)
    foreign = login_headers(client, email, OTHER_PW)
    assert _ids(client, TT, foreign) == set()
    assert client.delete(f"{TT}/TT-5A", headers=foreign).status_code == 404
    assert client.patch(f"{EC}/EC-NOPE", json={"topic": "x"}, headers=foreign).status_code == 404
    assert _ids(client, TT, w["principal"]) == {"TT-5A", "TT-8A"}


# ============================================================ #3a class timetable CRUD


def test_principal_create_edit_delete_persist_with_audit(client):
    w = _world(client)
    period = {"id": "TL-1", "day": "Monday", "className": "Grade 5", "section": "A",
              "subject": "Mathematics", "teacher": "T", "startTime": "09:00", "endTime": "09:45"}
    _ok(client.put(TT, headers=w["principal"], json=[_tt("CTT001", "Grade 5", "A", term="Term 1", timelines=[period])]))
    row = next(r for r in _ok(client.get(TT, headers=w["principal"])) if r["id"] == "CTT001")
    assert row["term"] == "Term 1" and row["timelines"][0]["subject"] == "Mathematics"

    edited = {**row, "term": "Term 2"}
    for meta in ("_collection", "_updatedAt", "_createdAt"):
        edited.pop(meta, None)
    _ok(client.put(TT, headers=w["principal"], json=[edited]))
    assert next(r for r in _ok(client.get(TT, headers=w["principal"])) if r["id"] == "CTT001")["term"] == "Term 2"

    assert _ok(client.delete(f"{TT}/CTT001", headers=w["principal"])) == {"id": "CTT001", "deleted": True}
    assert "CTT001" not in _ids(client, TT, w["principal"])
    audits = [a for a in _audit_actions("CTT001") if a.action == "CLASS_TIMETABLE_DELETED"]
    assert audits and "Term 2" in (audits[0].details or "")
    assert client.delete(f"{TT}/CTT001", headers=w["principal"]).status_code == 404


def test_admin_and_director_may_delete_coordinator_may_not(client):
    w = _world(client)
    _ok(client.put(TT, headers=w["principal"], json=[
        _tt("TT-5A", "Grade 5", "A"), _tt("TT-5B", "Grade 5", "B"), _tt("TT-8A", "Grade 8", "A"),
    ]))
    coord = _h(client, "coordinator")
    assert client.delete(f"{TT}/TT-5A", headers=coord).status_code == 403
    # Dropping an in-band row through whole-list PUT is also a delete → refused.
    assert client.put(TT, headers=coord, json=[_tt("TT-5A", "Grade 5", "A")]).status_code == 403
    assert _ids(client, TT, w["principal"]) == {"TT-5A", "TT-5B", "TT-8A"}
    # Coordinator may still edit in-band rows when keeping them all.
    _ok(client.put(TT, headers=coord, json=[_tt("TT-5A", "Grade 5", "A", term="Term 3"), _tt("TT-5B", "Grade 5", "B")]))
    assert _ids(client, TT, w["principal"]) == {"TT-5A", "TT-5B", "TT-8A"}

    _ok(client.delete(f"{TT}/TT-5B", headers=w["admin"]))
    _ok(client.delete(f"{TT}/TT-8A", headers=_h(client, "director")))
    assert _ids(client, TT, w["principal"]) == {"TT-5A"}


def test_leadership_put_removal_is_audited(client):
    w = _world(client)
    _ok(client.put(TT, headers=w["principal"], json=[_tt("TT-5A", "Grade 5", "A"), _tt("TT-8A", "Grade 8", "A")]))
    _ok(client.put(TT, headers=w["principal"], json=[_tt("TT-5A", "Grade 5", "A")]))
    assert any(a.action == "CLASS_TIMETABLE_DELETED" for a in _audit_actions("TT-8A"))


def test_single_delete_not_offered_for_allocations(client):
    w = _world(client)
    assert client.delete(f"{ALLOC}/TEA-1", headers=w["principal"]).status_code == 405


# ============================================================ #5 teacher allocation


def test_allocation_owner_is_principal_only(client):
    w = _world(client)
    body = [{"employeeId": "TEA-OWN", "status": "Active",
             "mappings": [{"className": "Grade 5", "section": "A", "subject": "Mathematics"}]}]
    for who in ("admin", "director", "coordinator", "teacher"):
        assert client.put(ALLOC, json=body, headers=_h(client, who)).status_code == 403, who
    _ok(client.put(ALLOC, json=body, headers=w["principal"]))
    assert _ids(client, ALLOC, w["principal"]) == {"TEA-OWN"}


def test_duplicate_allocation_rejected_with_409_and_nothing_persisted(client):
    w = _world(client)
    good = [{"employeeId": "TEA-D1", "email": settings.teacher_seed_email, "status": "Active",
             "classTeacher": {"academicYear": "2026-2027"},
             "mappings": [{"className": "Grade 5", "section": "A", "subject": "Mathematics"}]}]
    _ok(client.put(ALLOC, json=good, headers=w["principal"]))

    same_row = [{**good[0], "mappings": good[0]["mappings"] * 2}]
    resp = client.put(ALLOC, json=same_row, headers=w["principal"])
    assert resp.status_code == 409, resp.text
    assert resp.json()["detail"]["code"] == "duplicate_allocation"

    # Same teacher (by email) filed twice under different employee ids, same year spelt with an en dash.
    second = {"employeeId": "TEA-D2", "email": settings.teacher_seed_email, "status": "Active",
              "classTeacher": {"academicYear": "2026–2027"},
              "mappings": [{"className": "grade 5", "section": "a", "subject": "mathematics"}]}
    assert client.put(ALLOC, json=good + [second], headers=w["principal"]).status_code == 409

    stored = _ok(client.get(ALLOC, headers=w["principal"]))
    assert [r["id"] for r in stored] == ["TEA-D1"]
    assert len(stored[0]["mappings"]) == 1


def test_non_duplicate_allocations_are_allowed(client):
    w = _world(client)
    rows = [{"employeeId": "TEA-N1", "email": settings.teacher_seed_email, "status": "Active", "mappings": [
        {"className": "Grade 5", "section": "A", "subject": "Mathematics"},
        {"className": "Grade 5", "section": "B", "subject": "Mathematics"},
        {"className": "Grade 5", "section": "A", "subject": "English"},
        {"className": "Grade 5", "section": "A", "subject": "Mathematics", "academicYear": "2027-2028"},
    ]}, {"employeeId": "TEA-OLD", "email": settings.teacher_seed_email, "status": "Inactive", "mappings": [
        {"className": "Grade 5", "section": "A", "subject": "Mathematics"},
    ]}]
    _ok(client.put(ALLOC, json=rows, headers=w["principal"]))
    assert _ids(client, ALLOC, w["principal"]) == {"TEA-N1", "TEA-OLD"}


# ============================================================ #56 Extended Class Save Changes


def _extra(eid: str, cls="Grade 5", section="A", **extra) -> dict:
    return {"id": eid, "extraClassId": eid, "subject": "Mathematics", "className": cls, "section": section,
            "topic": "Fractions", "date": "20-11-2026", "startTime": "03:00 PM", "endTime": "04:00 PM",
            "venue": "Classroom", "reason": "Catch-up", **extra}


def _allocate_second_teacher(client, w) -> dict:
    email, user_id = _make_user("teacher")
    _ok(client.put(ALLOC, headers=w["principal"], json=[{
        "employeeId": "T2", "email": email, "status": "Active",
        "mappings": [{"className": "Grade 5", "section": "A", "subject": "Mathematics"}],
    }]))
    return {"headers": login_headers(client, email, OTHER_PW), "id": user_id}


def _stored_extra(eid: str) -> dict:
    with SessionLocal() as db:
        row = db.scalar(select(AcademicsRecord).where(
            AcademicsRecord.collection == "extra-classes", AcademicsRecord.public_id == eid))
        return dict(row.body or {})


def test_owner_teacher_update_persists_and_is_audited(client):
    w = _world(client)
    teacher = _h(client, "teacher")
    _ok(client.put(EC, headers=teacher, json=[_extra("EC-1", createdByUserId="forged")]))
    assert _stored_extra("EC-1")["createdByUserId"] == _uid(settings.teacher_seed_email)

    saved = _ok(client.patch(f"{EC}/EC-1", headers=teacher, json={
        "topic": "Decimals", "venue": "Online Class", "startTime": "02:00 PM", "endTime": "03:00 PM",
        "createdByUserId": "someone-else", "id": "EC-HACK",
    }))
    assert saved["id"] == "EC-1" and saved["topic"] == "Decimals"
    row = next(r for r in _ok(client.get(EC, headers=teacher)) if r["id"] == "EC-1")
    assert (row["topic"], row["venue"], row["startTime"]) == ("Decimals", "Online Class", "02:00 PM")
    assert _stored_extra("EC-1")["createdByUserId"] == _uid(settings.teacher_seed_email)
    assert any(a.action == "EXTRA_CLASS_UPDATED" and "topic" in (a.details or "") for a in _audit_actions("EC-1"))


def test_update_validation_errors(client):
    w = _world(client)
    _ok(client.put(EC, headers=w["principal"], json=[_extra("EC-V")]))
    p = w["principal"]
    assert client.patch(f"{EC}/EC-V", headers=p, json={"endTime": "02:00 PM"}).status_code == 422
    assert client.patch(f"{EC}/EC-V", headers=p, json={"topic": "  "}).status_code == 422
    assert client.patch(f"{EC}/EC-V", headers=p, json={"date": "31-02-2026"}).status_code == 422
    assert client.patch(f"{EC}/EC-V", headers=p, json={"subject": "Astrology"}).status_code == 422
    assert client.patch(f"{EC}/EC-V", headers=p, json={"section": "Z"}).status_code == 422
    assert client.patch(f"{EC}/EC-V", headers=p, json={"topic": ["list"]}).status_code == 422
    assert client.patch(f"{EC}/EC-MISSING", headers=p, json={"topic": "x"}).status_code == 404
    assert _stored_extra("EC-V")["topic"] == "Fractions"
    # PUT path also rejects an inverted time range on new rows.
    assert client.put(EC, headers=p, json=[_extra("EC-V"), _extra("EC-BAD", startTime="05:00 PM")]).status_code == 422


def test_other_teacher_cannot_update_but_can_save_own_list(client):
    w = _world(client)
    teacher = _h(client, "teacher")
    _ok(client.put(EC, headers=teacher, json=[_extra("EC-T1")]))
    t2 = _allocate_second_teacher(client, w)

    assert "EC-T1" in _ids(client, EC, t2["headers"])
    assert client.patch(f"{EC}/EC-T1", headers=t2["headers"], json={"topic": "Hijack"}).status_code == 403
    assert client.delete(f"{EC}/EC-T1", headers=t2["headers"]).status_code == 403
    # Modifying teacher 1's row through PUT is refused as well.
    refused = client.put(EC, headers=t2["headers"], json=[_extra("EC-T1", topic="Hijack")])
    assert refused.status_code == 403
    # Re-sending it untouched while adding an own row is fine (list screens PUT the visible list).
    _ok(client.put(EC, headers=t2["headers"], json=[_extra("EC-T1"), _extra("EC-T2")]))
    assert _stored_extra("EC-T1")["topic"] == "Fractions"
    assert _stored_extra("EC-T2")["createdByUserId"] == t2["id"]


def test_teacher_cannot_move_extra_class_out_of_scope(client):
    w = _world(client)
    teacher = _h(client, "teacher")
    _ok(client.put(EC, headers=teacher, json=[_extra("EC-M")]))
    assert client.patch(f"{EC}/EC-M", headers=teacher, json={"className": "Grade 8"}).status_code == 403
    assert _stored_extra("EC-M")["className"] == "Grade 5"


def test_coordinator_and_principal_update_within_scope(client):
    w = _world(client)
    _ok(client.put(EC, headers=_h(client, "teacher"), json=[_extra("EC-C")]))
    _ok(client.put(EC, headers=w["principal"], json=[_extra("EC-C"), _extra("EC-8", cls="Grade 8")]))
    coord = _h(client, "coordinator")
    assert _ok(client.patch(f"{EC}/EC-C", headers=coord, json={"topic": "Coord edit"}))["topic"] == "Coord edit"
    assert client.patch(f"{EC}/EC-8", headers=coord, json={"topic": "Out of band"}).status_code == 403
    assert _ok(client.patch(f"{EC}/EC-8", headers=w["principal"], json={"topic": "Principal edit"}))["topic"] == "Principal edit"
    assert _stored_extra("EC-C")["topic"] == "Coord edit"


def test_owner_can_delete_extra_class(client):
    _world(client)
    teacher = _h(client, "teacher")
    _ok(client.put(EC, headers=teacher, json=[_extra("EC-DEL")]))
    _ok(client.delete(f"{EC}/EC-DEL", headers=teacher))
    assert "EC-DEL" not in _ids(client, EC, teacher)
    assert any(a.action == "EXTRA_CLASS_DELETED" for a in _audit_actions("EC-DEL"))


# ============================================================ frontend wiring (static)


def _src(rel: str) -> str:
    return (SRC / rel).read_text(encoding="utf-8")


def test_frontend_timetable_delete_and_server_scope_wired():
    data = _src("Pages/Principal/ClassTimetable/classTimetableData.js")
    assert "export const deleteClassTimetable" in data
    assert "deleteAcademicsRecordApi('class-timetables'" in data
    lst = _src("Pages/Principal/ClassTimetable/ClassTimetableList.jsx")
    assert "deleteClassTimetable(" in lst
    assert "onConfirm={confirmDelete}" in lst
    # API mode relies on server scoping instead of a client name filter.
    assert "if (canUseAcademicsApi()) return records" in lst


def test_frontend_extended_class_save_uses_update_api():
    data = _src("Pages/Teacher/ExtraClass/extraClassData.js")
    assert "updateAcademicsRecordApi('extra-classes'" in data
    assert "deleteAcademicsRecordApi('extra-classes'" in data
    assert "REPLACE_BLOCKED_MESSAGE" in data
    coordinator = _src("Pages/Coordinator/ExtraClass/AddExtraClass.jsx")
    assert "Teacher/ExtraClass/AddExtraClass" in coordinator
    assert "listPath='/coordinator/class/extra-class'" in coordinator
    add = _src("Pages/Teacher/ExtraClass/AddExtraClass.jsx")
    assert "hydrateExtraClassesFromApi" in add


def test_orphan_demo_timetable_and_extended_class_pages_reuse_live_components():
    for rel, target in (
        ("Pages/Admin/Class/Timetable/TimeTable.jsx", "Principal/ClassTimetable/ClassTimetableList"),
        ("Pages/Admin/Class/Timetable/AddTimeTable.jsx", "Principal/ClassTimetable/CreateClassTimetable"),
        ("Pages/Admin/Class/ExtendedClass/ExtendedClass.jsx", "Teacher/ExtraClass/ExtraClass"),
        ("Pages/Admin/Class/ExtendedClass/AddExtendedClass.jsx", "Teacher/ExtraClass/AddExtraClass"),
        ("Pages/Coordinator/ClassRoutine/Components/TeacherWeeklyTimetable.jsx", "Teacher/ClassRoutine/Components/TeacherWeeklyTimetable"),
    ):
        code = _src(rel)
        assert target in code, rel
        assert "Sandy Selva" not in code and "WEEKLY_SCHEDULE" not in code, rel
