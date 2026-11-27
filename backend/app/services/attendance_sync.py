"""Biometric punches -> attendance records (automatic attendance sync).

Source of punches: the campus ``biometric-attendance`` ops collection (rows saved by the
Biometric screen, or pulled from a device adapter when one is registered and
``RFID_IMPORT_ENABLED`` is on). No device is contacted unless both are true.

Rules
-----
* Students: one ``student_attendance`` row per (campus, student, date, session FN/AN), enforced by
  ``uq_student_attendance_day_session``. Auto rows have ``source='auto'``, ``marked_by_user_id``
  NULL and ``source_ref`` = punch record id.
* Staff: one HR ``attendance`` record per (employee, date) with public id ``BIO-<code>-<date>``
  (unique per campus/collection), ``source='Biometric sync'``.
* Precedence: a manual mark always wins. Sync never overwrites a student row with
  ``source='manual'``, an HR attendance record for the same employee/day that sync did not write
  (manual entry or leave approval), or a sync-written HR record whose status HR has since edited.
  Auto rows are refreshed when the punches change; an identical rerun writes nothing.
* A half with no punch is marked Absent only once the day is over (date before campus today), so a
  run at 11:00 does not mark the afternoon absent.
"""

from __future__ import annotations

import json
import logging
import threading
import uuid
from collections.abc import Callable
from datetime import date, datetime, timedelta
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from sqlalchemy.orm.attributes import flag_modified

from app.core.config import settings
from app.deps import role_code_for
from app.models import HrEmployee, HrRecord, OpsRecord, Student, StudentAttendance, User
from app.models.base import utcnow
from app.services.audit import write_audit
from app.services.errors import fail

log = logging.getLogger("uvicorn.error")

PUNCH_COLLECTION = "biometric-attendance"
STAFF_COLLECTION = "attendance"
STAFF_SOURCE = "Biometric sync"
SOURCE_AUTO = "auto"
SOURCE_MANUAL = "manual"
# Run-now endpoint: school admins and HR (staff attendance owner). Teachers mark manually only.
SYNC_ROLES = {"admin", "superadmin", "managing_director", "hr"}
MAX_RANGE_DAYS = 62
_SKIP_SAMPLE = 50
_STUDENT_ROLES = {"student", "pupil"}
_PRESENT_HALF = {"checked in", "checked out", "present", "late"}

_run_lock = threading.Lock()
_last_runs: dict[str, dict] = {}

# Device adapter hook: ``fn(campus_id) -> list[dict]`` of punch rows. None = no device (default).
DeviceAdapter = Callable[[UUID], list[dict]]
_device_adapter: DeviceAdapter | None = None


def register_device_adapter(adapter: DeviceAdapter | None) -> None:
    """Install (or clear with None) the punch source used when RFID_IMPORT_ENABLED is on."""
    global _device_adapter
    _device_adapter = adapter


def device_import_enabled() -> bool:
    return bool(settings.rfid_import_enabled) and _device_adapter is not None


def ensure_can_run_sync(db: Session, actor: User) -> None:
    if role_code_for(db, actor) not in SYNC_ROLES:
        fail(403, "forbidden", "Only an administrator or HR can run the attendance sync.")


def _campus_today() -> date:
    from app.services.substitute_duties import local_now

    return local_now().date()


def resolve_range(
    on_date: date | None, date_from: date | None, date_to: date | None
) -> tuple[date, date]:
    if on_date is not None:
        return on_date, on_date
    if date_from is None and date_to is None:
        today = _campus_today()
        return today, today
    start = date_from or date_to
    end = date_to or date_from
    if end < start:
        fail(400, "validation_error", "toDate must be on or after fromDate.")
    if (end - start).days + 1 > MAX_RANGE_DAYS:
        fail(400, "validation_error", f"Sync at most {MAX_RANGE_DAYS} days at a time.")
    return start, end


def _parse_day(value) -> date | None:
    text = str(value or "").strip()
    if not text:
        return None
    try:
        return date.fromisoformat(text[:10])
    except ValueError:
        pass
    for fmt in ("%d-%m-%Y", "%d/%m/%Y"):
        try:
            return datetime.strptime(text, fmt).date()
        except ValueError:
            continue
    return None


def _clock(value) -> str:
    text = str(value or "").strip()
    return text if any(ch.isdigit() for ch in text) else ""


def _half(check_in, check_out, status) -> dict | None:
    """Evidence for one half-day: present / absent-by-status / no data (None)."""
    cin, cout = _clock(check_in), _clock(check_out)
    if cin or cout:
        return {"present": True, "in": cin, "out": cout}
    label = str(status or "").strip().lower()
    if label in _PRESENT_HALF:
        return {"present": True, "in": "", "out": ""}
    if label == "absent":
        return {"present": False, "in": "", "out": ""}
    return None


def _punch_halves(body: dict) -> dict[str, dict | None]:
    return {
        "FN": _half(body.get("morningCheckIn") or body.get("punchTime"), body.get("morningCheckOut"), body.get("morningStatus")),
        "AN": _half(body.get("afternoonCheckIn"), body.get("afternoonCheckOut"), body.get("afternoonStatus")),
    }


def _session_status(half: dict | None, *, day_over: bool) -> str | None:
    if half is None:
        return "Absent" if day_over else None
    return "Present" if half["present"] else "Absent"


def _store_device_punches(db: Session, campus_id: UUID) -> int:
    """Pull punches from the registered adapter into the punch collection (upsert by id)."""
    if not device_import_enabled():
        return 0
    rows = _device_adapter(campus_id) or []  # type: ignore[misc]
    stored = 0
    for raw in rows:
        body = dict(raw or {})
        public_id = str(body.get("id") or "").strip()
        if not public_id:
            continue
        body["id"] = public_id
        body.setdefault("source", "ESSL")
        found = db.scalar(
            select(OpsRecord).where(
                OpsRecord.campus_id == campus_id,
                OpsRecord.collection == PUNCH_COLLECTION,
                OpsRecord.public_id == public_id,
            )
        )
        if found is None:
            db.add(OpsRecord(campus_id=campus_id, collection=PUNCH_COLLECTION, public_id=public_id, body=body))
        elif dict(found.body or {}) != body:
            found.body = body
            found.updated_at = utcnow()
            flag_modified(found, "body")
        stored += 1
    db.flush()
    return stored


def _punch_kind(body: dict) -> str:
    role = str(body.get("role") or "").strip().lower()
    if body.get("studentId") or body.get("admissionNumber") or body.get("admissionNo") or role in _STUDENT_ROLES:
        return "student"
    return "staff"


def _find_student(db: Session, campus_id: UUID, body: dict) -> Student | None:
    raw_id = str(body.get("studentId") or "").strip()
    if raw_id:
        try:
            student = db.get(Student, UUID(raw_id))
        except ValueError:
            student = None
        if student is not None and student.campus_id == campus_id:
            return student
    admission = str(body.get("admissionNumber") or body.get("admissionNo") or "").strip()
    if admission:
        return db.scalar(
            select(Student).where(Student.campus_id == campus_id, Student.admission_number == admission)
        )
    return None


class _AuthorTrust:
    """Who last saved a punch row decides whether it may become attendance.

    The punch collection is writable by teaching staff (Biometric screen overrides), so a row saved
    by a teacher must not mark students that teacher could not mark manually. Device-imported rows
    (no author) and rows saved by admin/HR are trusted; staff punches need device/admin/HR.
    """

    def __init__(self, db: Session):
        self.db = db
        self._cache: dict[UUID, tuple[str, object]] = {}

    def _author(self, user_id: UUID) -> tuple[str, object]:
        if user_id not in self._cache:
            from app.services.students import PORTAL_ROLES, staff_student_filter

            user = self.db.get(User, user_id)
            role = role_code_for(self.db, user) if user is not None and user.is_active else ""
            if role in SYNC_ROLES:
                self._cache[user_id] = (role, None)
            elif not role or role in PORTAL_ROLES:
                self._cache[user_id] = (role, False)
            else:
                self._cache[user_id] = (role, staff_student_filter(self.db, user, role))
        return self._cache[user_id]

    def student_reason(self, created_by: UUID | None, student: Student) -> str | None:
        if created_by is None:
            return None
        _, scope = self._author(created_by)
        if scope is None:
            return None
        if scope is False or not scope(student):
            return "author_out_of_scope"
        return None

    def staff_reason(self, created_by: UUID | None) -> str | None:
        if created_by is None or self._author(created_by)[0] in SYNC_ROLES:
            return None
        return "untrusted_author"


def _student_values(student: Student, status: str, half: dict | None, punch_id: str) -> dict:
    return {
        "status": status,
        "class_name": student.class_name,
        "section": student.section,
        "in_out_status": "Biometric",
        "check_in_time": (half or {}).get("in") or None,
        "check_out_time": (half or {}).get("out") or None,
        "source_ref": punch_id[:80],
    }


def _audit_values(row: StudentAttendance) -> dict:
    return {
        "status": row.status,
        "session": row.session,
        "inOutStatus": row.in_out_status,
        "checkInTime": row.check_in_time,
        "checkOutTime": row.check_out_time,
        "className": row.class_name,
        "section": row.section,
        "markedBy": None,
    }


def _audit_auto_mark(db, actor_id, campus_id, row, previous, punch_id, trigger) -> None:
    new = _audit_values(row)
    write_audit(
        db,
        action="ATTENDANCE_CREATED" if previous is None else "ATTENDANCE_UPDATED",
        entity_type="student_attendance",
        entity_id=str(row.id),
        actor_id=actor_id,
        campus_id=campus_id,
        details=json.dumps(
            {
                "studentId": str(row.student_id),
                "date": row.attendance_date.isoformat(),
                "previous": previous,
                "new": new,
                "changed": sorted(k for k in new if previous is None or previous.get(k) != new[k]),
                "accessBasis": "auto_sync",
                "source": SOURCE_AUTO,
                "punchId": punch_id,
                "trigger": trigger,
            },
            sort_keys=True,
        ),
    )


def _sync_student(db, campus_id, student, day, halves, punch_id, *, day_over, actor_id, trigger, tally) -> None:
    for session in ("FN", "AN"):
        status = _session_status(halves[session], day_over=day_over)
        if status is None:
            continue
        values = _student_values(student, status, halves[session], punch_id)
        row = db.scalar(
            select(StudentAttendance).where(
                StudentAttendance.campus_id == campus_id,
                StudentAttendance.student_id == student.id,
                StudentAttendance.attendance_date == day,
                StudentAttendance.session == session,
            )
        )
        if row is None:
            row = StudentAttendance(
                id=uuid.uuid4(),
                campus_id=campus_id,
                student_id=student.id,
                attendance_date=day,
                session=session,
                marked_by_user_id=None,
                source=SOURCE_AUTO,
                **values,
            )
            db.add(row)
            db.flush()  # the unique (campus, student, date, session) key is checked here
            _audit_auto_mark(db, actor_id, campus_id, row, None, punch_id, trigger)
            tally["created"] += 1
            continue
        if (row.source or SOURCE_MANUAL) != SOURCE_AUTO:
            tally["manualKept"] += 1
            continue
        if all(getattr(row, key) == value for key, value in values.items()):
            tally["unchanged"] += 1
            continue
        previous = _audit_values(row)
        for key, value in values.items():
            setattr(row, key, value)
        row.updated_at = utcnow()
        _audit_auto_mark(db, actor_id, campus_id, row, previous, punch_id, trigger)
        tally["updated"] += 1


def _staff_index(db: Session, campus_id: UUID) -> dict[tuple[str, date], list[HrRecord]]:
    index: dict[tuple[str, date], list[HrRecord]] = {}
    for rec in db.scalars(
        select(HrRecord).where(HrRecord.campus_id == campus_id, HrRecord.collection == STAFF_COLLECTION)
    ).all():
        body = dict(rec.body or {})
        day = _parse_day(body.get("date"))
        code = str(body.get("employeeId") or "").strip()
        if day and code:
            index.setdefault((code, day), []).append(rec)
    return index


def _sync_staff(db, campus_id, employee, day, halves, punch_id, *, day_over, actor_id, trigger, index, tally) -> None:
    from app.services.attendance import derive_day_status

    fn = _session_status(halves["FN"], day_over=day_over)
    an = _session_status(halves["AN"], day_over=day_over)
    status = derive_day_status(fn, an)
    if not status:
        return
    code = employee.employee_code
    public_id = f"BIO-{code}-{day.isoformat()}"
    records = index.get((code, day), [])
    mine = next((r for r in records if r.public_id == public_id), None)
    if any(r.public_id != public_id for r in records):
        tally["manualKept"] += 1  # HR manual entry or leave approval for that day wins
        return
    fn_half, an_half = halves["FN"] or {}, halves["AN"] or {}
    punch_in = fn_half.get("in") or an_half.get("in") or ""
    punch_out = an_half.get("out") or fn_half.get("out") or ""
    body = {
        "id": public_id,
        "employeeId": code,
        "date": day.isoformat(),
        "status": status,
        "punchIn": punch_in,
        "punchOut": punch_out,
        "checkIn": punch_in or "—",
        "checkOut": punch_out or "—",
        "source": STAFF_SOURCE,
        "autoStatus": status,
        "punchId": punch_id,
    }
    if mine is None:
        rec = HrRecord(campus_id=campus_id, collection=STAFF_COLLECTION, public_id=public_id, body=body)
        db.add(rec)
        db.flush()
        index.setdefault((code, day), []).append(rec)
        action = "created"
    else:
        current = dict(mine.body or {})
        if current.get("source") != STAFF_SOURCE or current.get("status") != current.get("autoStatus"):
            tally["manualKept"] += 1  # HR edited the synced record: their value stands
            return
        if all(current.get(k) == v for k, v in body.items()):
            tally["unchanged"] += 1
            return
        mine.body = {**current, **body}
        flag_modified(mine, "body")
        action = "updated"
    write_audit(
        db,
        action="HR_ATTENDANCE_AUTO_SYNCED",
        entity_type="hr_record",
        entity_id=public_id,
        actor_id=actor_id,
        campus_id=campus_id,
        details=json.dumps({"employeeId": code, "date": day.isoformat(), "status": status,
                            "punchId": punch_id, "trigger": trigger, "result": action}, sort_keys=True),
    )
    tally[action] += 1


def _new_tally() -> dict:
    return {"created": 0, "updated": 0, "unchanged": 0, "manualKept": 0}


def run_attendance_sync(
    db: Session,
    *,
    campus_id: UUID,
    date_from: date,
    date_to: date,
    actor: User | None = None,
    trigger: str = "manual",
) -> dict:
    """Convert stored punches for ``campus_id`` between the dates (inclusive). One commit per run."""
    if not _run_lock.acquire(blocking=False):
        fail(409, "sync_in_progress", "An attendance sync is already running. Try again shortly.")
    try:
        return _run_locked(db, campus_id=campus_id, date_from=date_from, date_to=date_to, actor=actor, trigger=trigger)
    except IntegrityError:
        # Another process wrote the same (person, date, session) first; the unique key held.
        db.rollback()
        fail(409, "sync_conflict", "Attendance changed while syncing. Run the sync again.")
    finally:
        _run_lock.release()


def _run_locked(db, *, campus_id, date_from, date_to, actor, trigger) -> dict:
    from app.services.attendance_migrate import ensure_attendance_schema

    ensure_attendance_schema()
    actor_id = actor.id if actor else None
    today = _campus_today()
    fetched = _store_device_punches(db, campus_id)
    students, staff = _new_tally(), _new_tally()
    skipped: list[dict] = []
    skipped_count = 0
    read = 0
    staff_index = _staff_index(db, campus_id)
    trust = _AuthorTrust(db)
    punches = db.scalars(
        select(OpsRecord)
        .where(OpsRecord.campus_id == campus_id, OpsRecord.collection == PUNCH_COLLECTION)
        .order_by(OpsRecord.public_id)
    ).all()

    def skip(punch_id: str, reason: str) -> None:
        nonlocal skipped_count
        skipped_count += 1
        if len(skipped) < _SKIP_SAMPLE:
            skipped.append({"punchId": punch_id, "reason": reason})

    for punch in punches:
        body = dict(punch.body or {})
        day = _parse_day(body.get("date"))
        if day is None:
            skip(punch.public_id, "invalid_date")
            continue
        if day < date_from or day > date_to:
            continue
        read += 1
        if day > today:
            skip(punch.public_id, "future_date")
            continue
        halves = _punch_halves(body)
        if halves["FN"] is None and halves["AN"] is None:
            skip(punch.public_id, "no_punch_data")
            continue
        common = {"day_over": day < today, "actor_id": actor_id, "trigger": trigger}
        if _punch_kind(body) == "student":
            student = _find_student(db, campus_id, body)
            if student is None:
                skip(punch.public_id, "student_not_matched")
                continue
            reason = trust.student_reason(punch.created_by, student)
            if reason:
                skip(punch.public_id, reason)
                continue
            _sync_student(db, campus_id, student, day, halves, punch.public_id, tally=students, **common)
        else:
            code = str(body.get("employeeId") or body.get("employeeCode") or "").strip()
            employee = db.scalar(
                select(HrEmployee).where(HrEmployee.campus_id == campus_id, HrEmployee.employee_code == code)
            ) if code else None
            if employee is None:
                skip(punch.public_id, "employee_not_matched")
                continue
            reason = trust.staff_reason(punch.created_by)
            if reason:
                skip(punch.public_id, reason)
                continue
            _sync_staff(db, campus_id, employee, day, halves, punch.public_id,
                        index=staff_index, tally=staff, **common)

    result = {
        "ranAt": utcnow().isoformat(),
        "trigger": trigger,
        "campusId": str(campus_id),
        "fromDate": date_from.isoformat(),
        "toDate": date_to.isoformat(),
        "punchesRead": read,
        "students": students,
        "staff": staff,
        "skippedCount": skipped_count,
        "skipped": skipped,
        "device": {"enabled": device_import_enabled(), "fetched": fetched},
    }
    write_audit(
        db,
        action="ATTENDANCE_AUTO_SYNC",
        entity_type="attendance_sync",
        entity_id=f"{date_from.isoformat()}:{date_to.isoformat()}",
        actor_id=actor_id,
        campus_id=campus_id,
        details=json.dumps({k: result[k] for k in ("trigger", "punchesRead", "students", "staff", "skippedCount")},
                           sort_keys=True),
    )
    db.commit()
    _last_runs[str(campus_id)] = result
    return result


def last_run(campus_id: UUID) -> dict | None:
    return _last_runs.get(str(campus_id))


def sync_status(campus_id: UUID) -> dict:
    return {
        "schedulerEnabled": bool(settings.attendance_auto_sync_enabled),
        "intervalMinutes": int(settings.attendance_auto_sync_interval_minutes),
        "deviceImportEnabled": device_import_enabled(),
        "lastRun": last_run(campus_id),
    }


def run_scheduled_sync_once() -> list[dict]:
    """One scheduler tick: sync yesterday + today for every campus. Never raises."""
    from app.core.database import SessionLocal
    from app.models import Campus

    today = _campus_today()
    results: list[dict] = []
    db = SessionLocal()
    try:
        for campus_id in db.scalars(select(Campus.id)).all():
            try:
                results.append(
                    run_attendance_sync(db, campus_id=campus_id, date_from=today - timedelta(days=1),
                                        date_to=today, trigger="scheduler")
                )
            except Exception:  # one campus failing must not stop the others or the loop
                db.rollback()
                log.exception("Attendance auto-sync failed for campus %s", campus_id)
    finally:
        db.close()
    return results
