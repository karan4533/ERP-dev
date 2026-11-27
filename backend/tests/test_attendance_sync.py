"""Manual attendance persistence + biometric auto-sync (idempotent, manual wins) + run-now / scheduler."""

import os
import uuid
from datetime import date

os.environ["DATABASE_URL"] = "sqlite+pysqlite:///:memory:"
os.environ["OTP_DEBUG"] = "true"
os.environ["JWT_SECRET"] = "test-secret-qmis-erp-attendance-sync"

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError

from app.core.config import settings
from app.core.database import SessionLocal
from app.main import app
from app.models import AuditLog, HrEmployee, HrRecord, Student, StudentAttendance
from app.services import attendance_scheduler, attendance_sync
from auth_test_helpers import login_headers
from tests.conftest import reset_sqlite_memory_schema

STAFF = {
    "admin": ("admin@qmis.edu", "admin123"),
    "principal": ("principal@qmis.edu", "principal123"),
    "teacher": ("teacher@qmis.edu", "teacher123"),
    "hr": ("hr@qmis.edu", "hr12345"),
}
PW = "Portal-Sync-2026"
EMP = "EMP-SYNC-001"


def _ok(response, status=200):
    assert response.status_code == status, response.text
    return response.json()


@pytest.fixture(scope="module")
def w():
    reset_sqlite_memory_schema()
    attendance_sync.register_device_adapter(None)
    with TestClient(app) as c:
        h = {who: login_headers(c, *creds) for who, creds in STAFF.items()}
        uid = {o["email"]: o["user_id"] for o in _ok(c.get("/api/v1/masters/class-teacher-options", headers=h["admin"]))}
        cls = _ok(c.post("/api/v1/masters/classes", json={"name": "Grade 6"}, headers=h["admin"]), 201)
        sec = {
            "A": _ok(c.post("/api/v1/masters/sections", headers=h["admin"],
                            json={"class_id": cls["id"], "name": "A", "class_teacher_user_id": uid["teacher@qmis.edu"]}), 201)["id"],
            "B": _ok(c.post("/api/v1/masters/sections", headers=h["admin"], json={"class_id": cls["id"], "name": "B"}), 201)["id"],
        }

        def enroll(first: str, section: str, parent: str) -> str:
            adm = _ok(c.post("/api/v1/admissions", headers=h["admin"], json={
                "first_name": first, "last_name": "Sync", "mobile_number": "9000077777",
                "class_name": "Grade 6", "parent_account_email": parent}), 201)
            sid = str(_ok(c.post(f"/api/v1/admissions/{adm['id']}/enroll", headers=h["admin"],
                                 json={"parent_account_email": parent, "parent_account_password": PW}))["student_id"])
            _ok(c.post(f"/api/v1/students/{sid}/place", json={"sectionId": sec[section]}, headers=h["principal"]))
            return sid

        s = {"x": enroll("Xena", "A", "sync.parent.x@example.com"),
             "y": enroll("Yash", "A", "sync.parent.y@example.com"),
             "z": enroll("Zara", "B", "sync.parent.z@example.com")}
        h["parent_x"] = login_headers(c, "sync.parent.x@example.com", PW)
        with SessionLocal() as db:
            admission_y = db.get(Student, uuid.UUID(s["y"])).admission_number
            campus_id = db.get(Student, uuid.UUID(s["x"])).campus_id
            db.add(HrEmployee(campus_id=campus_id, employee_code=EMP, first_name="Sam", last_name="Staff",
                              email="sam.staff.sync@example.com", status="Active"))
            db.commit()
        yield {"c": c, "h": h, "s": s, "uid": uid, "admission_y": admission_y, "campus_id": campus_id}
    attendance_sync.register_device_adapter(None)


@pytest.fixture(autouse=True)
def _fixed_campus_today(monkeypatch):
    """Sync treats days before 'today' as finished; pin it so the September fixtures are past days."""
    monkeypatch.setattr(attendance_sync, "_campus_today", lambda: date(2026, 10, 31))


def _mark(w, who, sid, status, day, section="A", session="FN"):
    body = {"date": day.isoformat(), "className": "Grade 6", "session": session,
            "marks": [{"studentId": sid, "status": status, "session": session}]}
    if section is not None:
        body["section"] = section
    return w["c"].post("/api/v1/attendance", json=body, headers=w["h"][who])


def _roster(w, who, day, section="A", session="FN"):
    params = {"date": day.isoformat(), "className": "Grade 6", "roster": True, "session": session}
    if section:
        params["section"] = section
    return {r["studentId"]: r for r in _ok(w["c"].get("/api/v1/attendance", params=params, headers=w["h"][who]))}


def _rows(sid, day):
    with SessionLocal() as db:
        return db.scalars(select(StudentAttendance).where(
            StudentAttendance.student_id == uuid.UUID(sid), StudentAttendance.attendance_date == day)).all()


def _put_punches(w, rows):
    _ok(w["c"].put("/api/v1/ops/biometric-attendance", json=rows, headers=w["h"]["admin"]))


def _sync(w, day, who="admin"):
    return w["c"].post("/api/v1/attendance/sync", json={"date": day.isoformat()}, headers=w["h"][who])


def _punch(pid, day, **fields):
    return {"id": pid, "date": day.isoformat(), "source": "ESSL", **fields}


# --- manual attendance persistence -------------------------------------------------------------

def test_manual_create_and_update_persist_and_reload(w):
    day = date(2026, 9, 1)
    sid = w["s"]["x"]
    created = _ok(_mark(w, "teacher", sid, "Present", day))[0]
    assert created["attendanceStatus"] == "Present" and created["source"] == "manual"
    reloaded = _roster(w, "teacher", day)[sid]
    assert reloaded["attendanceStatus"] == "Present" and reloaded["fn"]["source"] == "manual"

    _ok(_mark(w, "teacher", sid, "Absent", day))
    assert _roster(w, "teacher", day)[sid]["attendanceStatus"] == "Absent"
    rows = _rows(sid, day)
    assert len(rows) == 1 and rows[0].status == "Absent" and rows[0].source == "manual"
    assert str(rows[0].marked_by_user_id) == w["uid"]["teacher@qmis.edu"]

    # Afternoon half is a separate row; day status combines both.
    _ok(_mark(w, "teacher", sid, "Present", day, session="AN"))
    an = _roster(w, "teacher", day, session="AN")[sid]
    assert an["attendanceStatus"] == "Present" and an["dayStatus"] == "Half Day"


def test_mark_saved_without_section_reloads_under_section_filter(w):
    day = date(2026, 9, 2)
    sid = w["s"]["y"]
    _ok(_mark(w, "admin", sid, "Present", day, section=None))
    assert _rows(sid, day)[0].section is None
    assert _roster(w, "admin", day, section="A")[sid]["attendanceStatus"] == "Present"
    listed = _ok(w["c"].get("/api/v1/attendance", params={"date": day.isoformat(), "className": "Grade 6",
                                                          "section": "A"}, headers=w["h"]["admin"]))
    assert [r["studentId"] for r in listed] == [sid]


def test_same_person_date_session_twice_keeps_one_record(w):
    day = date(2026, 9, 3)
    sid = w["s"]["x"]
    _ok(_mark(w, "teacher", sid, "Present", day))
    _ok(_mark(w, "teacher", sid, "Present", day))
    # One payload listing the same student/session twice is rejected (ambiguous), nothing written.
    both = w["c"].post("/api/v1/attendance", headers=w["h"]["teacher"], json={
        "date": day.isoformat(), "className": "Grade 6", "section": "A",
        "marks": [{"studentId": sid, "status": "Late"}, {"studentId": sid, "status": "Absent"}]})
    assert both.status_code == 400, both.text
    rows = _rows(sid, day)
    assert len(rows) == 1 and rows[0].status == "Present"
    # The database itself refuses a second row for the same person/date/session.
    with SessionLocal() as db:
        db.add(StudentAttendance(campus_id=rows[0].campus_id, student_id=rows[0].student_id, attendance_date=day,
                                 session="FN", class_name="Grade 6", status="Present"))
        with pytest.raises(IntegrityError):
            db.commit()


# --- scope ----------------------------------------------------------------------------------------

def test_teacher_cannot_mark_or_load_another_class(w):
    day = date(2026, 9, 4)
    assert _mark(w, "teacher", w["s"]["z"], "Present", day, section="B").status_code == 403
    assert _rows(w["s"]["z"], day) == []
    roster = w["c"].get("/api/v1/attendance", headers=w["h"]["teacher"],
                        params={"date": day.isoformat(), "className": "Grade 6", "section": "B", "roster": True})
    assert roster.status_code == 403


def test_parent_reads_own_child_only_and_cannot_mark(w):
    day = date(2026, 9, 5)
    _ok(_mark(w, "teacher", w["s"]["x"], "Present", day))
    c, parent = w["c"], w["h"]["parent_x"]
    cal = _ok(c.get(f"/api/v1/attendance/students/{w['s']['x']}/calendar", params={"year": 2026, "month": 9},
                    headers=parent))
    assert cal.get(day.isoformat()) in {"P", "HD"}
    assert c.get(f"/api/v1/attendance/students/{w['s']['y']}/calendar", params={"year": 2026, "month": 9},
                 headers=parent).status_code == 404
    assert c.get("/api/v1/attendance", params={"date": day.isoformat()}, headers=parent).status_code == 403
    assert _mark(w, "parent_x", w["s"]["x"], "Absent", day).status_code == 403


# --- auto sync ----------------------------------------------------------------------------------

def test_sync_endpoint_is_admin_or_hr_only(w):
    day = date(2026, 9, 6)
    for who in ("teacher", "principal", "parent_x"):
        assert _sync(w, day, who).status_code == 403, who
        assert w["c"].get("/api/v1/attendance/sync/status", headers=w["h"][who]).status_code == 403, who
    assert w["c"].post("/api/v1/attendance/sync", json={}).status_code == 401
    _ok(_sync(w, day, "admin"))
    _ok(_sync(w, day, "hr"))
    status = _ok(w["c"].get("/api/v1/attendance/sync/status", headers=w["h"]["admin"]))
    assert status["schedulerEnabled"] is False and status["deviceImportEnabled"] is False
    assert status["lastRun"]["fromDate"] == day.isoformat()


def test_sync_converts_punches_and_rerun_is_idempotent(w):
    day = date(2026, 9, 8)
    x, y = w["s"]["x"], w["s"]["y"]
    _put_punches(w, [
        _punch("BIO-S-0908-X", day, role="Student", studentId=x, morningCheckIn="08:05", morningCheckOut="12:05",
               afternoonCheckIn="12:45", afternoonCheckOut="16:10"),
        _punch("BIO-S-0908-Y", day, role="Student", admissionNumber=w["admission_y"], morningCheckIn="08:12",
               morningCheckOut="12:02"),
        _punch("BIO-S-0908-NOBODY", day, role="Student", admissionNumber="NO-SUCH-ADM", morningCheckIn="08:00"),
    ])
    first = _ok(_sync(w, day))
    assert first["students"] == {"created": 4, "updated": 0, "unchanged": 0, "manualKept": 0}
    assert first["skippedCount"] == 1 and first["skipped"][0]["reason"] == "student_not_matched"

    fn_x = next(r for r in _rows(x, day) if r.session == "FN")
    assert fn_x.source == "auto" and fn_x.marked_by_user_id is None and fn_x.source_ref == "BIO-S-0908-X"
    assert fn_x.status == "Present" and fn_x.check_in_time == "08:05" and fn_x.section == "A"
    roster = _roster(w, "teacher", day)
    assert roster[x]["source"] == "auto" and roster[x]["dayStatus"] == "Present"
    # Past day with no afternoon punch: AN is Absent, so the day is Half Day.
    assert roster[y]["dayStatus"] == "Half Day"
    assert {r.session: r.status for r in _rows(y, day)} == {"FN": "Present", "AN": "Absent"}

    with SessionLocal() as db:
        audits = db.scalar(select(func.count()).select_from(AuditLog).where(AuditLog.action == "ATTENDANCE_CREATED"))
    second = _ok(_sync(w, day))
    assert second["students"] == {"created": 0, "updated": 0, "unchanged": 4, "manualKept": 0}
    assert len(_rows(x, day)) == 2 and len(_rows(y, day)) == 2
    with SessionLocal() as db:
        assert db.scalar(select(func.count()).select_from(AuditLog).where(AuditLog.action == "ATTENDANCE_CREATED")) == audits

    # A changed punch refreshes the auto row in place (still one row per session).
    _put_punches(w, [
        _punch("BIO-S-0908-Y", day, role="Student", admissionNumber=w["admission_y"], morningCheckIn="08:12",
               morningCheckOut="12:02", afternoonCheckIn="12:50", afternoonCheckOut="16:00"),
    ])
    third = _ok(_sync(w, day))
    assert third["students"]["updated"] == 1
    assert {r.session: r.status for r in _rows(y, day)} == {"FN": "Present", "AN": "Present"}


def test_manual_marks_are_not_clobbered_by_sync(w):
    day = date(2026, 9, 9)
    x, y = w["s"]["x"], w["s"]["y"]
    # Teacher marked before the sync ran.
    _ok(_mark(w, "teacher", x, "Absent", day))
    _put_punches(w, [
        _punch("BIO-S-0909-X", day, role="Student", studentId=x, morningCheckIn="08:01", afternoonCheckIn="12:40"),
        _punch("BIO-S-0909-Y", day, role="Student", studentId=y, morningCheckIn="08:03", afternoonCheckIn="12:41"),
    ])
    first = _ok(_sync(w, day))
    assert first["students"]["manualKept"] == 1 and first["students"]["created"] == 3
    fn_x = next(r for r in _rows(x, day) if r.session == "FN")
    assert fn_x.status == "Absent" and fn_x.source == "manual"

    # Teacher overrides an auto mark: it becomes manual and later syncs leave it alone.
    _ok(_mark(w, "teacher", y, "Late", day))
    fn_y = next(r for r in _rows(y, day) if r.session == "FN")
    assert fn_y.source == "manual" and fn_y.status == "Late" and fn_y.source_ref is None
    assert str(fn_y.marked_by_user_id) == w["uid"]["teacher@qmis.edu"]
    second = _ok(_sync(w, day))
    assert second["students"]["manualKept"] == 2 and second["students"]["created"] == 0
    assert next(r for r in _rows(y, day) if r.session == "FN").status == "Late"
    assert len(_rows(x, day)) == 2 and len(_rows(y, day)) == 2


def test_today_missing_half_is_not_marked_absent_yet(w, monkeypatch):
    day = date(2026, 9, 10)
    monkeypatch.setattr(attendance_sync, "_campus_today", lambda: day)
    sid = w["s"]["x"]
    _put_punches(w, [_punch("BIO-S-0910-X", day, role="Student", studentId=sid, morningCheckIn="08:00")])
    _ok(_sync(w, day))
    assert {r.session: r.status for r in _rows(sid, day)} == {"FN": "Present"}


def test_staff_punches_become_hr_attendance_and_hr_edits_win(w):
    day = date(2026, 9, 11)
    other = date(2026, 9, 12)
    c, hr = w["c"], w["h"]["hr"]
    _ok(c.post("/api/v1/hr/attendance", headers=hr, json={
        "id": "ATT-MANUAL-SYNC", "employeeId": EMP, "date": "12-09-2026", "status": "Leave", "source": "HR"}), 201)
    _put_punches(w, [
        _punch("BIO-E-0911", day, role="Teacher", employeeId=EMP, morningCheckIn="07:55", afternoonCheckOut="16:05"),
        _punch("BIO-E-0912", other, role="Teacher", employeeId=EMP, morningCheckIn="07:58"),
        _punch("BIO-E-UNKNOWN", day, role="Teacher", employeeId="EMP-NOPE", morningCheckIn="08:00"),
    ])
    first = _ok(c.post("/api/v1/attendance/sync", headers=hr,
                       json={"fromDate": day.isoformat(), "toDate": other.isoformat()}))
    assert first["staff"] == {"created": 1, "updated": 0, "unchanged": 0, "manualKept": 1}
    assert any(s["reason"] == "employee_not_matched" for s in first["skipped"])
    listed = {r["id"]: r for r in _ok(c.get("/api/v1/hr/attendance", headers=hr))}
    synced = listed[f"BIO-{EMP}-{day.isoformat()}"]
    assert synced["status"] == "Present" and synced["source"] == "Biometric sync" and synced["punchIn"] == "07:55"
    assert listed["ATT-MANUAL-SYNC"]["status"] == "Leave"
    assert not any(r.get("employeeId") == EMP and r.get("date") == other.isoformat() for r in listed.values())

    again = _ok(c.post("/api/v1/attendance/sync", headers=hr,
                       json={"fromDate": day.isoformat(), "toDate": other.isoformat()}))
    assert again["staff"] == {"created": 0, "updated": 0, "unchanged": 1, "manualKept": 1}

    # HR corrects the synced record; the next sync keeps HR's value.
    _ok(c.patch(f"/api/v1/hr/attendance/BIO-{EMP}-{day.isoformat()}", headers=hr, json={"status": "OD"}))
    third = _ok(c.post("/api/v1/attendance/sync", headers=hr, json={"date": day.isoformat()}))
    assert third["staff"]["manualKept"] == 1
    with SessionLocal() as db:
        rows = db.scalars(select(HrRecord).where(HrRecord.collection == "attendance",
                                                 HrRecord.public_id == f"BIO-{EMP}-{day.isoformat()}")).all()
        assert len(rows) == 1 and rows[0].body["status"] == "OD"


def test_teacher_saved_punches_only_convert_inside_the_teachers_classes(w):
    day = date(2026, 9, 13)
    x, z = w["s"]["x"], w["s"]["z"]
    # The register is writable by teachers; a teacher-saved row must not mark another class or staff.
    _ok(w["c"].put("/api/v1/ops/biometric-attendance", headers=w["h"]["teacher"], json=[
        _punch("BIO-T-0913-X", day, role="Student", studentId=x, morningCheckIn="08:00", afternoonCheckIn="12:40"),
        _punch("BIO-T-0913-Z", day, role="Student", studentId=z, morningCheckIn="08:00", afternoonCheckIn="12:40"),
        _punch("BIO-T-0913-E", day, role="Teacher", employeeId=EMP, morningCheckIn="08:00"),
    ]))
    result = _ok(_sync(w, day))
    reasons = {s["punchId"]: s["reason"] for s in result["skipped"]}
    assert reasons == {"BIO-T-0913-Z": "author_out_of_scope", "BIO-T-0913-E": "untrusted_author"}
    assert result["students"]["created"] == 2 and result["staff"]["created"] == 0
    assert {r.session for r in _rows(x, day)} == {"FN", "AN"} and _rows(z, day) == []


def test_overlapping_runs_are_refused(w):
    assert attendance_sync._run_lock.acquire(blocking=False)
    try:
        busy = _sync(w, date(2026, 9, 14))
        assert busy.status_code == 409 and busy.json()["detail"]["code"] == "sync_in_progress"
    finally:
        attendance_sync._run_lock.release()
    _ok(_sync(w, date(2026, 9, 14)))


def test_sync_range_is_validated(w):
    c, admin = w["c"], w["h"]["admin"]
    assert c.post("/api/v1/attendance/sync", headers=admin,
                  json={"fromDate": "2026-09-10", "toDate": "2026-09-01"}).status_code == 400
    assert c.post("/api/v1/attendance/sync", headers=admin,
                  json={"fromDate": "2026-01-01", "toDate": "2026-06-30"}).status_code == 400


# --- device adapter + scheduler ------------------------------------------------------------------

def test_device_pull_is_a_no_op_unless_enabled_and_adapter_registered(w, monkeypatch):
    day = date(2026, 9, 15)
    calls = []

    def fake_device(campus_id):
        calls.append(campus_id)
        return [_punch("BIO-DEV-0915-Z", day, role="Student", studentId=w["s"]["z"], morningCheckIn="08:09",
                       afternoonCheckIn="12:44")]

    attendance_sync.register_device_adapter(fake_device)
    try:
        off = _ok(_sync(w, day))  # RFID_IMPORT_ENABLED is false in tests
        assert off["device"] == {"enabled": False, "fetched": 0} and calls == []
        assert _rows(w["s"]["z"], day) == []

        monkeypatch.setattr(settings, "rfid_import_enabled", True)
        on = _ok(_sync(w, day))
        assert on["device"] == {"enabled": True, "fetched": 1} and len(calls) == 1
        assert {r.session for r in _rows(w["s"]["z"], day)} == {"FN", "AN"}
        assert all(r.source == "auto" for r in _rows(w["s"]["z"], day))
    finally:
        attendance_sync.register_device_adapter(None)


def test_scheduled_job_function_converts_punches(w, monkeypatch):
    day = date(2026, 9, 16)
    monkeypatch.setattr(attendance_sync, "_campus_today", lambda: day)
    sid = w["s"]["y"]
    _put_punches(w, [_punch("BIO-S-0916-Y", day, role="Student", studentId=sid, morningCheckIn="08:10",
                            afternoonCheckIn="12:42")])
    results = attendance_sync.run_scheduled_sync_once()
    mine = next(r for r in results if r["campusId"] == str(w["campus_id"]))
    assert mine["trigger"] == "scheduler" and mine["students"]["created"] == 2
    rows = _rows(sid, day)
    assert {r.session for r in rows} == {"FN", "AN"} and all(r.source == "auto" for r in rows)
    with SessionLocal() as db:
        log = db.scalars(select(AuditLog).where(AuditLog.action == "ATTENDANCE_AUTO_SYNC")
                         .order_by(AuditLog.created_at.desc())).first()
        assert log.actor_id is None and '"trigger": "scheduler"' in log.details
    rerun = attendance_sync.run_scheduled_sync_once()
    assert next(r for r in rerun if r["campusId"] == str(w["campus_id"]))["students"]["created"] == 0


def test_frontend_class_attendance_uses_server_data_and_saves_only_changes():
    from pathlib import Path

    src = Path(__file__).resolve().parents[2] / "src"
    page = (src / "Pages/Teacher/Attendance/ClassAttendance.jsx").read_text(encoding="utf-8")
    assert "useState(() => (api ? [] : ATTENDANCE_LIST))" in page  # no demo rows shown in API mode
    assert "savedStatus[String(row.studentId)]" in page  # untouched auto marks are not re-saved as manual
    assert "localStorage" not in page
    api = (src / "services/attendanceApi.js").read_text(encoding="utf-8")
    assert "'/attendance/sync'" in api
    admin = (src / "Pages/Admin/Attendance/Students/StudentsList.jsx").read_text(encoding="utf-8")
    assert "runAttendanceSyncApi" in admin and "query.reload()" in admin


def test_background_loop_is_off_by_default_and_runs_the_job_when_enabled(w, monkeypatch):
    assert settings.attendance_auto_sync_enabled is False
    assert attendance_scheduler.start_attendance_auto_sync() is None

    import threading

    ran = threading.Event()
    monkeypatch.setattr(attendance_sync, "run_scheduled_sync_once", lambda: ran.set() or [])
    monkeypatch.setattr(settings, "attendance_auto_sync_enabled", True)
    with TestClient(app):
        assert ran.wait(timeout=10), "startup loop did not run the sync job"
