"""Attendance changes are audited with previous and new values, in the same transaction as the change."""

import json
import os
import uuid
from datetime import date, datetime, time

os.environ["DATABASE_URL"] = "sqlite+pysqlite:///:memory:"
os.environ["OTP_DEBUG"] = "true"
os.environ["JWT_SECRET"] = "test-secret-qmis-erp-attendance-audit"

from zoneinfo import ZoneInfo

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError

from app.core.database import SessionLocal
from app.main import app
from app.models import AuditLog, StudentAttendance
from app.services import attendance as attendance_svc
from app.services import substitute_duties as subs
from auth_test_helpers import login_headers
from tests.conftest import reset_sqlite_memory_schema

STAFF = {
    "admin": ("admin@qmis.edu", "admin123"),
    "principal": ("principal@qmis.edu", "principal123"),
    "teacher": ("teacher@qmis.edu", "teacher123"),
    "accounthead": ("accounthead@qmis.edu", "accounts123"),
}
PW = "Portal-Audit-2026"
DUTY_DAY = date(2031, 2, 3)
TZ = ZoneInfo("Asia/Kolkata")
ATTENDANCE_ACTIONS = ("ATTENDANCE_CREATED", "ATTENDANCE_UPDATED")


def _ok(response, status=200):
    assert response.status_code == status, response.text
    return response.json()


@pytest.fixture(scope="module")
def w():
    reset_sqlite_memory_schema()
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
                "first_name": first, "last_name": "Audit", "mobile_number": "9000088888",
                "class_name": "Grade 6", "parent_account_email": parent}), 201)
            sid = str(_ok(c.post(f"/api/v1/admissions/{adm['id']}/enroll", headers=h["admin"],
                                 json={"parent_account_email": parent, "parent_account_password": PW}))["student_id"])
            _ok(c.post(f"/api/v1/students/{sid}/place", json={"sectionId": sec[section]}, headers=h["principal"]))
            return sid

        s = {"x": enroll("Xavier", "A", "aud.parent.x@example.com"),
             "y": enroll("Yamini", "A", "aud.parent.y@example.com"),
             "z": enroll("Zoya", "B", "aud.parent.z@example.com")}
        h["parent_x"] = login_headers(c, "aud.parent.x@example.com", PW)
        yield {"c": c, "h": h, "s": s, "uid": uid, "cls": cls["id"], "sec": sec}


def _mark(w, who: str, sid: str, status: str, day: date, section: str | None = "A"):
    body = {"date": day.isoformat(), "className": "Grade 6", "marks": [{"studentId": sid, "status": status}]}
    if section is not None:
        body["section"] = section
    return w["c"].post("/api/v1/attendance", json=body, headers=w["h"][who])


def _events(student_id: str, day: date) -> list[dict]:
    with SessionLocal() as db:
        rows = db.scalars(
            select(AuditLog).where(AuditLog.action.in_(ATTENDANCE_ACTIONS)).order_by(AuditLog.created_at)
        ).all()
        out = []
        for r in rows:
            d = json.loads(r.details)
            if d["studentId"] == student_id and d["date"] == day.isoformat():
                out.append({"action": r.action, "entity_id": r.entity_id, "actor_id": str(r.actor_id),
                            "created_at": r.created_at, **d})
        return out


def _row(student_id: str, day: date) -> StudentAttendance | None:
    with SessionLocal() as db:
        return db.scalar(select(StudentAttendance).where(
            StudentAttendance.student_id == uuid.UUID(student_id), StudentAttendance.attendance_date == day))


def test_create_logs_initial_values(w):
    day = date(2026, 9, 1)
    created = _ok(_mark(w, "teacher", w["s"]["x"], "Present", day))[0]
    events = _events(w["s"]["x"], day)
    assert len(events) == 1
    e = events[0]
    assert e["action"] == "ATTENDANCE_CREATED" and e["entity_id"] == created["id"]
    assert e["actor_id"] == w["uid"]["teacher@qmis.edu"] and e["created_at"] is not None
    assert e["previous"] is None
    assert e["new"] == {
        "status": "Present",
        "inOutStatus": None,
        "className": "Grade 6",
        "section": "A",
        "markedBy": w["uid"]["teacher@qmis.edu"],
        "session": "FN",
        "checkInTime": None,
        "checkOutTime": None,
    }
    assert e["changed"] == [
        "checkInTime", "checkOutTime", "className", "inOutStatus", "markedBy", "section", "session", "status",
    ]
    assert e["accessBasis"] == "assignment"
    assert "Xavier" not in json.dumps(e, default=str)


def test_update_records_previous_and_new_status_and_marker(w):
    day = date(2026, 9, 2)
    first = _ok(_mark(w, "teacher", w["s"]["x"], "Present", day))[0]
    _ok(_mark(w, "principal", w["s"]["x"], "Absent", day))
    update = _events(w["s"]["x"], day)[-1]
    assert update["action"] == "ATTENDANCE_UPDATED" and update["entity_id"] == first["id"]
    assert update["previous"]["status"] == "Present" and update["new"]["status"] == "Absent"
    assert update["previous"]["markedBy"] == w["uid"]["teacher@qmis.edu"]
    assert update["new"]["markedBy"] == update["actor_id"] != w["uid"]["teacher@qmis.edu"]
    assert update["changed"] == ["markedBy", "status"] and update["accessBasis"] == "role"


def test_section_change_is_recorded(w):
    day = date(2026, 9, 3)
    _ok(_mark(w, "teacher", w["s"]["y"], "Present", day))
    _ok(_mark(w, "admin", w["s"]["y"], "Present", day, section=None))  # unscoped role, no section label
    update = _events(w["s"]["y"], day)[-1]
    assert update["previous"]["section"] == "A" and update["new"]["section"] is None
    assert set(update["changed"]) == {"markedBy", "section"}
    assert _row(w["s"]["y"], day).section is None


def test_substitute_updates_carry_the_same_detail_plus_the_duty(w, monkeypatch):
    c, h, s = w["c"], w["h"], w["s"]
    duty = _ok(c.post("/api/v1/substitute-duties", headers=h["principal"], json={
        "teacherUserId": w["uid"]["teacher@qmis.edu"], "classId": w["cls"], "sectionId": w["sec"]["B"],
        "date": DUTY_DAY.isoformat(), "period": "P2", "startTime": "09:00", "endTime": "09:45"}), 201)
    monkeypatch.setattr(subs, "local_now", lambda: datetime.combine(DUTY_DAY, time(9, 10), tzinfo=TZ))
    created = _ok(_mark(w, "teacher", s["z"], "Present", DUTY_DAY, section="B"))[0]
    _ok(_mark(w, "teacher", s["z"], "Late", DUTY_DAY, section="B"))
    create_event, update_event = _events(s["z"], DUTY_DAY)
    for e in (create_event, update_event):
        assert e["entity_id"] == created["id"] and e["accessBasis"] == "substitute_duty"
        assert e["substituteDutyId"] == duty["id"] and e["actor_id"] == w["uid"]["teacher@qmis.edu"]
    assert create_event["new"]["status"] == "Present" and create_event["new"]["section"] == "B"
    assert update_event["previous"]["status"] == "Present" and update_event["new"]["status"] == "Late"
    assert update_event["changed"] == ["status"]
    _ok(c.post(f"/api/v1/substitute-duties/{duty['id']}/revoke", json={}, headers=h["principal"]))


def test_rejected_writes_leave_no_change_events(w):
    day = date(2026, 9, 4)
    s = w["s"]
    _ok(_mark(w, "teacher", s["x"], "Present", day))
    before = _events(s["x"], day)
    assert _mark(w, "teacher", s["z"], "Absent", day, section="B").status_code == 403  # no duty for 6B today
    assert _mark(w, "teacher", s["x"], "Sleeping", day).status_code == 400
    mixed = w["c"].post("/api/v1/attendance", headers=w["h"]["teacher"], json={
        "date": day.isoformat(), "className": "Grade 6", "section": "A",
        "marks": [{"studentId": s["x"], "status": "Absent"}, {"studentId": s["z"], "status": "Absent"}]})
    assert mixed.status_code == 403
    assert _events(s["x"], day) == before and _events(s["z"], day) == []
    assert _row(s["x"], day).status == "Present" and _row(s["z"], day) is None


def test_audit_failure_rolls_back_the_attendance_change(w, monkeypatch):
    day = date(2026, 9, 5)
    s = w["s"]
    _ok(_mark(w, "teacher", s["x"], "Present", day))
    before_events = _events(s["x"], day)
    real = attendance_svc.write_audit

    def broken_write_audit(db, **kwargs):
        if kwargs.get("action") in ATTENDANCE_ACTIONS:
            kwargs["action"] = None  # NOT NULL column: the audit insert fails at commit
        real(db, **kwargs)

    monkeypatch.setattr(attendance_svc, "write_audit", broken_write_audit)
    with pytest.raises(IntegrityError):
        _mark(w, "principal", s["x"], "Absent", day)
    with pytest.raises(IntegrityError):
        _mark(w, "principal", s["y"], "Absent", day)  # a new record is not created unaudited either
    monkeypatch.setattr(attendance_svc, "write_audit", real)

    row = _row(s["x"], day)
    assert row.status == "Present" and str(row.marked_by_user_id) == w["uid"]["teacher@qmis.edu"]
    assert _row(s["y"], day) is None
    assert _events(s["x"], day) == before_events and _events(s["y"], day) == []


def test_unauthorized_users_cannot_write_or_read_attendance_audit_details(w):
    c, h = w["c"], w["h"]
    day = date(2026, 9, 6)
    assert _mark(w, "parent_x", w["s"]["x"], "Absent", day).status_code == 403
    assert _row(w["s"]["x"], day) is None
    assert c.get("/api/v1/audit-logs", headers=h["teacher"]).status_code == 403
    assert c.get("/api/v1/audit-logs", headers=h["parent_x"]).status_code == 403

    _ok(_mark(w, "teacher", w["s"]["x"], "Present", day))
    finance = [r for r in _ok(c.get("/api/v1/audit-logs", headers=h["accounthead"]))
               if r["entity_type"] == "student_attendance"]
    assert finance and all(r["details"] is None for r in finance)  # audit.read without attendance.read
    admin = [r for r in _ok(c.get("/api/v1/audit-logs", headers=h["admin"]))
             if r["action"] == "ATTENDANCE_CREATED"]
    assert admin and all(json.loads(r["details"])["studentId"] for r in admin)
    other = [r for r in _ok(c.get("/api/v1/audit-logs", headers=h["accounthead"])) if r["entity_type"] != "student_attendance"]
    assert any(r["details"] for r in other)  # unrelated audit details unchanged for the finance head


def test_repeated_updates_chain_before_and_after_values(w):
    day = date(2026, 9, 7)
    sid = w["s"]["x"]
    for who, status in (("teacher", "Present"), ("teacher", "Absent"), ("principal", "Late"), ("principal", "Late"),
                        ("teacher", "Present")):
        _ok(_mark(w, who, sid, status, day))
    events = _events(sid, day)
    # The identical re-save (principal, Late) changed nothing, so it adds no change event.
    assert [e["action"] for e in events] == ["ATTENDANCE_CREATED"] + ["ATTENDANCE_UPDATED"] * 3
    assert [e["new"]["status"] for e in events] == ["Present", "Absent", "Late", "Present"]
    for earlier, later in zip(events, events[1:]):
        assert later["previous"] == earlier["new"]
    assert len({e["entity_id"] for e in events}) == 1
    assert _row(sid, day).status == "Present"
