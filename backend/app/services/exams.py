"""Exams, marks and results (Y-3, Academics doc 4.6 / 4.18 / decisions 2, 4, 8 and weightage).

Doc rules implemented:
- Exam schedule: Principal creates -> DA (director) approves (approval type ``exam_timetable``).
- Teacher enters marks per exam/subject/class (single entry or bulk list) as a DRAFT (preview), then submits.
- Marks chain Coordinator -> Principal -> DA, then PUBLISHED. Nothing is visible to students/parents before.
- No edit/delete once submitted. A denied batch is revised as a new version.
- Evaluation categories are configurable exam types (CA, RCT, Midterm, Final ... defaults seeded).
- Weightage per class + exam type is set by the DA and locks once an exam cycle starts.
- Ranks are auto-calculated per exam within the class.
"""

from __future__ import annotations

from datetime import date
from types import SimpleNamespace
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.deps import role_code_for
from app.models import (
    ApprovalRequest,
    Exam,
    ExamType,
    ExamWeightage,
    HrEmployee,
    MarkEntry,
    MarksBatch,
    Student,
    User,
)
from app.models.base import utcnow
from app.services import approvals
from app.services.audit import write_audit
from app.services.errors import fail
from app.services.students import (
    PORTAL_ROLES,
    class_key,
    ensure_staff_can_view_student,
    portal_students,
    staff_student_filter,
)

VIEW_ALL_ROLES = {"coordinator", "principal", "director", "jointdirector", "admin", "superadmin", "managing_director"}
# Doc weightage pattern types first, then the exact list the frontend already offers
# (src/Common/demoDomain/examTypes.js) so both sides use the same evaluation categories.
DEFAULT_TYPES = (
    [
        ("CA", "CA / RCT"),
        ("MIDTERM", "MIDTERM"),
        ("QUARTERLY", "Quarterly"),
        ("HALF_YEARLY", "Half Yearly"),
        ("ANNUAL", "Annual"),
        ("FINAL", "Final / Annual"),
    ]
    + [(f"MPT{i}", f"Monthly Progress Tracker {i}") for i in range(1, 7)]
    + [(f"SPLIT{i}", f"Split Test {i}") for i in range(1, 5)]
    + [("TERM1_PT", "Term 1 Progress Tracker"), ("TERM2_PT", "Term 2 Progress Tracker")]
    + [(f"HALF{i}", f"Half Portion {i}") for i in range(1, 4)]
    + [("FULL_PORTION", "Full Portion"), ("PRE_BOARD", "Pre Board")]
    + [(f"REVISION{i}", f"Revision Test {i}") for i in range(1, 7)]
)


# ------------------------------------------------------------------ helpers


def _approval(db: Session, approval_id) -> ApprovalRequest | None:
    return db.get(ApprovalRequest, approval_id) if approval_id else None


def _status(approval: ApprovalRequest | None, *, final: str) -> str:
    if approval is None:
        return "draft"
    return {"pending": "submitted", "approved": final, "denied": "denied"}[approval.status]


# ------------------------------------------------------------------ exam types


def _ensure_types(db: Session, campus_id) -> None:
    have = set(db.scalars(select(ExamType.code).where(ExamType.campus_id == campus_id)).all())
    missing = [(c, n) for c, n in DEFAULT_TYPES if c not in have]
    if not missing:
        return
    for code, name in missing:
        db.add(ExamType(campus_id=campus_id, code=code, name=name))
    db.commit()


def _type_out(t: ExamType) -> dict:
    return {"id": str(t.id), "code": t.code, "name": t.name, "active": t.active}


def list_types(db: Session, actor: User) -> list[dict]:
    _ensure_types(db, actor.campus_id)
    rows = db.scalars(select(ExamType).where(ExamType.campus_id == actor.campus_id).order_by(ExamType.created_at)).all()
    return [_type_out(t) for t in rows]


def create_type(db: Session, actor: User, *, code: str, name: str) -> dict:
    _ensure_types(db, actor.campus_id)
    code = code.strip().upper()
    if not code or not name.strip():
        fail(400, "validation_error", "code and name are required.")
    if db.scalar(select(ExamType).where(ExamType.campus_id == actor.campus_id, ExamType.code == code)):
        fail(409, "conflict", "Exam type code already exists.")
    t = ExamType(campus_id=actor.campus_id, code=code, name=name.strip())
    db.add(t)
    db.flush()
    write_audit(db, action="EXAM_TYPE_CREATED", entity_type="exam_type", entity_id=str(t.id),
                actor_id=actor.id, campus_id=actor.campus_id, details=code)
    db.commit()
    return _type_out(t)


def _get_type(db: Session, actor: User, type_id: UUID | None = None, code: str | None = None) -> ExamType:
    _ensure_types(db, actor.campus_id)
    stmt = select(ExamType).where(ExamType.campus_id == actor.campus_id)
    stmt = stmt.where(ExamType.id == type_id) if type_id else stmt.where(ExamType.code == (code or "").upper())
    t = db.scalar(stmt)
    if not t:
        fail(404, "not_found", "Exam type not found.")
    return t


# ------------------------------------------------------------------ exams


def _normalize_schedule(
    *,
    timelines: list | None = None,
    section: str | None = None,
    teacher_name: str | None = None,
) -> dict | None:
    """Store subject day/time rows for the examination timetable UI."""
    rows = []
    for item in timelines or []:
        if not isinstance(item, dict):
            continue
        subject = str(item.get("subject") or "").strip()
        day = str(item.get("day") or "").strip()
        start = str(item.get("startTime") or item.get("start_time") or "").strip()
        end = str(item.get("endTime") or item.get("end_time") or "").strip()
        if not (subject and day and start and end):
            continue
        rows.append(
            {
                "id": str(item.get("id") or ""),
                "day": day,
                "subject": subject,
                "examDate": str(item.get("examDate") or item.get("exam_date") or "").strip(),
                "startTime": start,
                "endTime": end,
            }
        )
    section_label = (section or "").strip() or None
    teacher = (teacher_name or "").strip() or None
    if not rows and not section_label and not teacher:
        return None
    return {"section": section_label or "", "teacherName": teacher or "", "timelines": rows}


def _exam_out(db: Session, exam: Exam) -> dict:
    appr = _approval(db, exam.approval_id)
    etype = db.get(ExamType, exam.exam_type_id)
    appr_out = approvals._out(appr) if appr else None
    schedule = exam.schedule if isinstance(exam.schedule, dict) else {}
    timelines = schedule.get("timelines") if isinstance(schedule.get("timelines"), list) else []
    return {
        "id": str(exam.id),
        "name": exam.name,
        "examType": etype.code if etype else "",
        "examTypeName": etype.name if etype else "",
        "className": exam.class_name,
        "academicYear": exam.academic_year or "",
        "section": schedule.get("section") or "",
        "teacherName": schedule.get("teacherName") or "",
        "timelines": timelines,
        "startDate": exam.start_date.isoformat(),
        "endDate": exam.end_date.isoformat(),
        "status": _status(appr, final="approved"),
        "approvalId": str(appr.id) if appr else None,
        # ApprovalRequest.created_at is set when Principal submits; decide must not rewrite it.
        "submittedAt": appr.created_at.isoformat() if appr else None,
        "awaitingRole": appr_out["awaitingRole"] if appr_out else None,
        "awaitingRoles": appr_out.get("awaitingRoles") if appr_out else [],
    }


def create_exam(
    db: Session,
    actor: User,
    *,
    name,
    exam_type,
    class_name,
    start_date,
    end_date,
    academic_year: str | None = None,
    timelines: list | None = None,
    section: str | None = None,
    teacher_name: str | None = None,
) -> dict:
    if end_date < start_date:
        fail(400, "validation_error", "endDate cannot be before startDate.")
    _require_class_in_band(db, actor, class_name)
    etype = _get_type(db, actor, code=exam_type)
    if not etype.active:
        fail(400, "validation_error", "Exam type is disabled.")
    from app.services.class_section_catalog import require_active_class_section

    require_active_class_section(db, actor.campus_id, class_name, section)
    # Older DBs missing exams.schedule crash with UndefinedColumn → opaque 500.
    from app.services.exams_migrate import ensure_exams_schema

    ensure_exams_schema()
    year_label = (academic_year or "").strip() or None
    schedule = _normalize_schedule(timelines=timelines, section=section, teacher_name=teacher_name)
    exam = Exam(
        campus_id=actor.campus_id,
        exam_type_id=etype.id,
        name=name.strip(),
        class_name=class_name.strip(),
        academic_year=year_label,
        start_date=start_date,
        end_date=end_date,
        schedule=schedule,
        created_by=actor.id,
    )
    try:
        db.add(exam)
        db.flush()
        write_audit(
            db,
            action="EXAM_CREATED",
            entity_type="exam",
            entity_id=str(exam.id),
            actor_id=actor.id,
            campus_id=actor.campus_id,
            details=f"{exam.class_name}/{etype.code}",
        )
        db.commit()
    except Exception as exc:
        db.rollback()
        msg = str(getattr(exc, "orig", None) or exc)
        if "schedule" in msg.lower() or "undefinedcolumn" in msg.lower().replace(" ", ""):
            fail(
                503,
                "schema_outdated",
                "Database is missing exams.schedule. Run alembic upgrade head (revision 0022) after backup.",
            )
        raise
    return _exam_out(db, exam)


def _load_exam(db: Session, actor: User, exam_id: UUID) -> Exam:
    exam = db.get(Exam, exam_id)
    if not exam or exam.campus_id != actor.campus_id:
        fail(404, "not_found", "Exam not found.")
    return exam


_EXAM_EDIT_ROLES = {
    "principal",
    "director",
    "jointdirector",
    "admin",
    "superadmin",
    "managing_director",
}


def _can_edit_exam(db: Session, actor: User, exam: Exam) -> bool:
    role = role_code_for(db, actor)
    if role in _EXAM_EDIT_ROLES:
        return True
    return exam.created_by == actor.id and _class_in_actor_band(db, actor, exam.class_name)


def _class_in_actor_band(db: Session, actor: User, class_name: str) -> bool:
    """Coordinators schedule exams only for grades in their band; other exams.write roles are campus-wide."""
    if role_code_for(db, actor) != "coordinator":
        return True
    from app.services.placement import actor_can_manage_grade, parse_grade

    return actor_can_manage_grade(db, actor, parse_grade(class_name))


def _require_class_in_band(db: Session, actor: User, class_name: str) -> None:
    if not _class_in_actor_band(db, actor, class_name):
        fail(403, "forbidden", "This class is outside your coordinator grade band.")


def _require_no_marks(db: Session, exam: Exam) -> None:
    if db.scalar(select(MarksBatch.id).where(MarksBatch.exam_id == exam.id).limit(1)):
        fail(409, "locked", "Marks have already been entered for this exam; its timetable can no longer be edited.")


def _submit_exam_approval(db: Session, actor: User, exam: Exam) -> dict:
    appr = approvals.submit(
        db,
        actor,
        entity_type="exam_timetable",
        entity_id=str(exam.id),
        title=f"Exam {exam.name} {exam.class_name}",
        chain=None,
        internal=True,
    )
    exam.approval_id = UUID(appr["id"])
    db.commit()
    return _exam_out(db, exam)


def submit_exam(db: Session, actor: User, exam_id: UUID) -> dict:
    exam = _load_exam(db, actor, exam_id)
    if not _can_edit_exam(db, actor, exam):
        fail(403, "forbidden", "You are not allowed to submit this exam.")
    if exam.approval_id:
        existing = db.get(ApprovalRequest, exam.approval_id)
        if existing is not None and existing.status == "pending":
            fail(409, "conflict", "Already submitted.")
        if existing is not None and existing.status == "approved":
            fail(409, "conflict", "Already approved by the Director. Edit the timetable to change it.")
        # Prior denial — clear so a fresh chain can open.
        exam.approval_id = None
        db.flush()
    return _submit_exam_approval(db, actor, exam)


def update_exam(
    db: Session,
    actor: User,
    exam_id: UUID,
    *,
    name,
    exam_type,
    class_name,
    start_date,
    end_date,
    academic_year: str | None = None,
    timelines: list | None = None,
    section: str | None = None,
    teacher_name: str | None = None,
) -> dict:
    """Update campus exam fields and reopen Principal/Director approval."""
    if end_date < start_date:
        fail(400, "validation_error", "endDate cannot be before startDate.")
    exam = _load_exam(db, actor, exam_id)
    if not _can_edit_exam(db, actor, exam):
        fail(403, "forbidden", "You are not allowed to edit this exam.")
    _require_class_in_band(db, actor, class_name)
    _require_no_marks(db, exam)
    etype = _get_type(db, actor, code=exam_type)
    if not etype.active:
        fail(400, "validation_error", "Exam type is disabled.")

    prior_section = (
        (exam.schedule or {}).get("section") if isinstance(exam.schedule, dict) else None
    )
    next_section = section if section is not None else prior_section
    from app.services.class_section_catalog import require_active_class_section

    require_active_class_section(db, actor.campus_id, class_name, next_section)

    exam.exam_type_id = etype.id
    exam.name = name.strip()
    exam.class_name = class_name.strip()
    exam.academic_year = (academic_year or "").strip() or None
    exam.start_date = start_date
    exam.end_date = end_date
    if timelines is not None or section is not None or teacher_name is not None:
        exam.schedule = _normalize_schedule(
            timelines=timelines if timelines is not None else ((exam.schedule or {}).get("timelines") if isinstance(exam.schedule, dict) else []),
            section=section if section is not None else ((exam.schedule or {}).get("section") if isinstance(exam.schedule, dict) else None),
            teacher_name=teacher_name if teacher_name is not None else ((exam.schedule or {}).get("teacherName") if isinstance(exam.schedule, dict) else None),
        )
    # Drop prior approval so save returns the timetable to Pending.
    exam.approval_id = None
    db.flush()
    write_audit(
        db,
        action="EXAM_UPDATED",
        entity_type="exam",
        entity_id=str(exam.id),
        actor_id=actor.id,
        campus_id=actor.campus_id,
        details=f"{exam.class_name}/{etype.code}",
    )
    return _submit_exam_approval(db, actor, exam)


def _portal_exam_filter(db: Session, actor: User):
    """Parents/students see only Director-approved schedules for their own (or their child's) class."""
    role = role_code_for(db, actor)
    if role not in PORTAL_ROLES:
        return None
    classes = {class_key(s.class_name) for s in portal_students(db, actor, role)}
    return lambda exam: class_key(exam.class_name) in classes and (
        _status(_approval(db, exam.approval_id), final="approved") == "approved"
    )


def list_exams(db: Session, actor: User, *, class_name: str | None, status: str | None) -> list[dict]:
    stmt = select(Exam).where(Exam.campus_id == actor.campus_id)
    if class_name:
        stmt = stmt.where(Exam.class_name == class_name)
    rows = db.scalars(stmt.order_by(Exam.start_date.desc())).all()
    visible = _portal_exam_filter(db, actor)
    if visible is not None:
        rows = [e for e in rows if visible(e)]
    out = [_exam_out(db, e) for e in rows]
    return [o for o in out if o["status"] == status] if status else out


def get_exam(db: Session, actor: User, exam_id: UUID) -> dict:
    exam = _load_exam(db, actor, exam_id)
    visible = _portal_exam_filter(db, actor)
    if visible is not None and not visible(exam):
        fail(404, "not_found", "Exam not found.")
    return _exam_out(db, exam)


# ------------------------------------------------------------------ weightage


def _weights_out(db: Session, actor: User, class_name: str) -> dict:
    rows = db.scalars(
        select(ExamWeightage).where(ExamWeightage.campus_id == actor.campus_id, ExamWeightage.class_name == class_name)
    ).all()
    started = db.scalar(
        select(Exam).where(
            Exam.campus_id == actor.campus_id, Exam.class_name == class_name, Exam.start_date <= date.today()
        )
    )
    return {
        "className": class_name,
        "weights": [
            {"examType": db.get(ExamType, w.exam_type_id).code, "weight": w.weight} for w in rows
        ],
        "locked": started is not None,
    }


def get_weightage(db: Session, actor: User, class_name: str) -> dict:
    return _weights_out(db, actor, class_name)


def set_weightage(db: Session, actor: User, class_name: str, weights: list[dict]) -> dict:
    if _weights_out(db, actor, class_name)["locked"]:
        fail(409, "locked", "An exam cycle has started for this class; weightage is locked.")
    if not weights:
        fail(400, "validation_error", "weights are required.")
    seen = set()
    total = 0.0
    resolved = []
    for w in weights:
        etype = _get_type(db, actor, code=w["examType"])
        if etype.id in seen:
            fail(400, "validation_error", f"Duplicate exam type {etype.code}.")
        seen.add(etype.id)
        value = float(w["weight"])
        if value < 0 or value > 100:
            fail(400, "validation_error", "weight must be between 0 and 100.")
        total += value
        resolved.append((etype, value))
    if abs(total - 100.0) > 0.001:
        fail(400, "validation_error", f"Weights must add up to 100 (got {total:g}).")
    for old in db.scalars(
        select(ExamWeightage).where(ExamWeightage.campus_id == actor.campus_id, ExamWeightage.class_name == class_name)
    ).all():
        db.delete(old)
    db.flush()
    for etype, value in resolved:
        db.add(ExamWeightage(campus_id=actor.campus_id, class_name=class_name, exam_type_id=etype.id,
                             weight=value, updated_by=actor.id))
    write_audit(db, action="EXAM_WEIGHTAGE_SET", entity_type="exam_weightage", actor_id=actor.id,
                campus_id=actor.campus_id, details=f"{class_name}: " + ", ".join(f"{t.code}={v:g}" for t, v in resolved))
    db.commit()
    return _weights_out(db, actor, class_name)


# ------------------------------------------------------------------ marks batches


def _teacher_display_name(db: Session, teacher: User | None) -> str:
    if teacher is None:
        return ""
    employee = db.scalar(select(HrEmployee).where(HrEmployee.user_id == teacher.id))
    if employee is not None:
        label = f"{employee.first_name or ''} {employee.last_name or ''}".strip()
        if label:
            return label
    if teacher.email:
        return teacher.email.split("@")[0].replace(".", " ").title()
    return ""


def _denial_reason(db: Session, appr: ApprovalRequest | None) -> str:
    if appr is None or appr.status != "denied":
        return ""
    from app.models import ApprovalEvent

    event = db.scalar(
        select(ApprovalEvent)
        .where(ApprovalEvent.approval_id == appr.id, ApprovalEvent.action == "deny")
        .order_by(ApprovalEvent.created_at.desc())
    )
    return (event.comment or "") if event else ""


def _batch_out(db: Session, batch: MarksBatch, *, entries: bool = False) -> dict:
    appr = _approval(db, batch.approval_id)
    exam = db.get(Exam, batch.exam_id)
    teacher = db.get(User, batch.teacher_id)
    appr_out = approvals._out(appr) if appr else None
    data = {
        "id": str(batch.id),
        "examId": str(batch.exam_id),
        "examName": exam.name if exam else "",
        "className": exam.class_name if exam else "",
        "subject": batch.subject,
        "section": batch.section or "",
        "maxMarks": batch.max_marks,
        "version": batch.version,
        "teacherEmail": teacher.email if teacher else "",
        "teacherName": _teacher_display_name(db, teacher),
        "status": _status(appr, final="published"),
        "approvalId": str(appr.id) if appr else None,
        "awaitingRole": appr_out["awaitingRole"] if appr_out else None,
        "awaitingRoles": appr_out.get("awaitingRoles") if appr_out else [],
        "awaitingEligibleApprover": approvals.awaiting_eligible_approver(db, appr),
        "academicYear": (exam.academic_year or "") if exam else "",
        "submittedAt": appr.created_at.isoformat() if appr else None,
        "rejectionReason": _denial_reason(db, appr),
    }
    if entries:
        rows = db.scalars(select(MarkEntry).where(MarkEntry.batch_id == batch.id)).all()
        names = {s.id: s for s in db.scalars(select(Student).where(Student.id.in_([r.student_id for r in rows]))).all()}
        data["entries"] = sorted(
            (
                {
                    "studentId": str(r.student_id),
                    "studentName": names[r.student_id].full_name,
                    "admissionNumber": names[r.student_id].admission_number,
                    "marks": r.marks,
                    "absent": r.absent,
                    "remarks": r.remarks or "",
                }
                for r in rows
            ),
            key=lambda e: e["studentName"],
        )
    return data


def _batch_in_scope(db: Session, batch: MarksBatch, allowed) -> bool:
    """A batch is in a scoped role's reach only if its class/section and every student in it are."""
    exam = db.get(Exam, batch.exam_id)
    if exam is None or not allowed(SimpleNamespace(class_name=exam.class_name, section=batch.section or "")):
        return False
    ids = db.scalars(select(MarkEntry.student_id).where(MarkEntry.batch_id == batch.id)).all()
    students = db.scalars(select(Student).where(Student.id.in_(ids))).all() if ids else []
    return len(students) == len(ids) and all(allowed(s) for s in students)


def batch_visible(db: Session, actor: User, batch: MarksBatch, role: str | None = None) -> bool:
    """Owner, campus-wide leadership, or a coordinator whose grade band / allocations cover the batch."""
    if batch.campus_id != actor.campus_id:
        return False
    if batch.teacher_id == actor.id:
        return True
    role = role or role_code_for(db, actor)
    if role not in VIEW_ALL_ROLES:
        return False
    allowed = staff_student_filter(db, actor, role)
    return allowed is None or _batch_in_scope(db, batch, allowed)


def marks_batch_visible_by_id(db: Session, actor: User, batch_id: str, role: str | None = None) -> bool:
    try:
        batch = db.get(MarksBatch, UUID(str(batch_id)))
    except ValueError:
        return False
    return batch is not None and batch_visible(db, actor, batch, role)


def _load_batch(db: Session, actor: User, batch_id: UUID) -> MarksBatch:
    batch = db.get(MarksBatch, batch_id)
    if not batch or not batch_visible(db, actor, batch):
        fail(404, "not_found", "Marks batch not found.")
    return batch


def _apply_entries(db: Session, actor: User, batch: MarksBatch, exam: Exam, entries: list[dict]) -> None:
    """Bind marks only to campus student UUIDs that match the exam class / batch section.

    Requires section placement so pending enrollments cannot receive marks. Class and section
    comparisons use normalized keys (same helpers as placement). Existing published rows are
    never rewritten here — callers only replace entries on draft / correction drafts.
    """
    from app.models.academics import AcademicYear
    from app.services.academic_year_labels import academic_years_equivalent
    from app.services.students import class_key, section_key

    if not entries:
        fail(400, "validation_error", "At least one entry is required.")
    ids = []
    for e in entries:
        try:
            ids.append(UUID(str(e["studentId"])))
        except (ValueError, KeyError, TypeError):
            fail(400, "validation_error", "Invalid studentId.")
    if len(set(ids)) != len(ids):
        fail(400, "validation_error", "Duplicate student in entries.")
    students = {
        s.id: s
        for s in db.scalars(
            select(Student).where(Student.campus_id == actor.campus_id, Student.id.in_(ids))
        ).all()
    }
    if len(students) != len(set(ids)):
        missing = [str(sid) for sid in ids if sid not in students]
        fail(400, "validation_error", f"Unknown student id(s) on this campus: {', '.join(missing[:5])}.")

    exam_class = class_key(exam.class_name)
    batch_section = section_key(batch.section) if batch.section else ""
    exam_year_label = (exam.academic_year or "").strip()
    year_by_id: dict = {}
    if exam_year_label:
        year_ids = {s.academic_year_id for s in students.values() if s.academic_year_id}
        if year_ids:
            year_by_id = {
                y.id: y
                for y in db.scalars(select(AcademicYear).where(AcademicYear.id.in_(year_ids))).all()
            }

    for e, sid in zip(entries, ids):
        stu = students[sid]
        if (stu.placement_status or "") != "placed":
            fail(
                400,
                "validation_error",
                f"{stu.full_name} must be section-placed before marks can be entered.",
            )
        if class_key(stu.class_name) != exam_class:
            fail(400, "validation_error", f"{stu.full_name} is not enrolled in {exam.class_name}.")
        if batch_section and section_key(stu.section) != batch_section:
            fail(
                400,
                "validation_error",
                f"{stu.full_name} is in section {stu.section or '—'}, not {batch.section}.",
            )
        if exam_year_label and stu.academic_year_id:
            ay = year_by_id.get(stu.academic_year_id)
            if ay is not None:
                same = academic_years_equivalent(exam_year_label, ay.name)
                # None => unsupported / ambiguous label — do not invent a rejection.
                if same is False:
                    fail(
                        400,
                        "validation_error",
                        f"{stu.full_name} is in academic year {ay.name}, not {exam_year_label}.",
                    )
        absent = bool(e.get("absent"))
        marks = e.get("marks")
        if absent:
            e["marks"] = None
        else:
            if marks is None:
                fail(400, "validation_error", f"Marks required for {stu.full_name} (or mark absent).")
            if not (0 <= float(marks) <= batch.max_marks):
                fail(400, "validation_error", f"Marks for {stu.full_name} must be 0..{batch.max_marks:g}.")
    for old in db.scalars(select(MarkEntry).where(MarkEntry.batch_id == batch.id)).all():
        db.delete(old)
    db.flush()
    for e, sid in zip(entries, ids):
        db.add(
            MarkEntry(
                batch_id=batch.id,
                student_id=sid,
                marks=None if e.get("absent") else float(e["marks"]),
                absent=bool(e.get("absent")),
                remarks=e.get("remarks"),
            )
        )


def create_batch(db: Session, actor: User, *, exam_id: UUID, subject: str, section, max_marks: float, entries) -> dict:
    exam = _load_exam(db, actor, exam_id)
    if _status(_approval(db, exam.approval_id), final="approved") != "approved":
        fail(409, "conflict", "The exam schedule must be approved by the DA before marks can be entered.")
    if max_marks <= 0:
        fail(400, "validation_error", "maxMarks must be positive.")
    subject = subject.strip()
    existing = db.scalars(
        select(MarksBatch).where(
            MarksBatch.campus_id == actor.campus_id,
            MarksBatch.exam_id == exam.id,
            MarksBatch.teacher_id == actor.id,
            MarksBatch.subject == subject,
            MarksBatch.section == (section or None),
        )
    ).all()
    for b in existing:
        if _status(_approval(db, b.approval_id), final="published") != "denied":
            fail(409, "conflict", "A marks batch already exists for this exam, subject and section.")
    batch = MarksBatch(
        campus_id=actor.campus_id,
        exam_id=exam.id,
        teacher_id=actor.id,
        subject=subject,
        section=section or None,
        max_marks=max_marks,
        version=len(existing) + 1,
    )
    db.add(batch)
    db.flush()
    _apply_entries(db, actor, batch, exam, entries)
    write_audit(db, action="MARKS_BATCH_CREATED", entity_type="marks_batch", entity_id=str(batch.id),
                actor_id=actor.id, campus_id=actor.campus_id, details=f"{exam.name}/{subject} v{batch.version}")
    db.commit()
    return _batch_out(db, batch, entries=True)


def replace_entries(db: Session, actor: User, batch_id: UUID, entries: list[dict]) -> dict:
    batch = _load_batch(db, actor, batch_id)
    if batch.teacher_id != actor.id:
        fail(403, "forbidden", "Only the owning teacher can edit.")
    if batch.approval_id:
        fail(409, "locked", "Submitted marks are locked. Revise a denied batch to create a new version.")
    _apply_entries(db, actor, batch, db.get(Exam, batch.exam_id), entries)
    batch.updated_at = utcnow()
    write_audit(db, action="MARKS_BATCH_UPDATED", entity_type="marks_batch", entity_id=str(batch.id),
                actor_id=actor.id, campus_id=actor.campus_id)
    db.commit()
    return _batch_out(db, batch, entries=True)


def submit_batch(db: Session, actor: User, batch_id: UUID) -> dict:
    batch = _load_batch(db, actor, batch_id)
    if batch.teacher_id != actor.id:
        fail(403, "forbidden", "Only the owning teacher can submit.")
    if batch.approval_id:
        fail(409, "conflict", "Already submitted.")
    if not db.scalar(select(MarkEntry).where(MarkEntry.batch_id == batch.id)):
        fail(400, "validation_error", "Enter marks before submitting.")
    exam = db.get(Exam, batch.exam_id)
    appr = approvals.submit(
        db, actor, entity_type="marks_batch", entity_id=str(batch.id),
        title=f"Marks {exam.name} {batch.subject} {exam.class_name}", chain=None, internal=True,
    )
    batch.approval_id = UUID(appr["id"])
    batch.updated_at = utcnow()
    db.commit()
    return _batch_out(db, batch, entries=True)


def revise_batch(db: Session, actor: User, batch_id: UUID) -> dict:
    batch = _load_batch(db, actor, batch_id)
    if batch.teacher_id != actor.id:
        fail(403, "forbidden", "Only the owning teacher can revise.")
    if _status(_approval(db, batch.approval_id), final="published") != "denied":
        fail(409, "conflict", "Only a denied batch can be revised.")
    if db.scalar(
        select(MarksBatch).where(
            MarksBatch.exam_id == batch.exam_id,
            MarksBatch.teacher_id == batch.teacher_id,
            MarksBatch.subject == batch.subject,
            MarksBatch.section == batch.section,
            MarksBatch.version > batch.version,
        )
    ):
        fail(409, "conflict", "A newer version already exists.")
    new = MarksBatch(
        campus_id=batch.campus_id, exam_id=batch.exam_id, teacher_id=batch.teacher_id, subject=batch.subject,
        section=batch.section, max_marks=batch.max_marks, version=batch.version + 1,
    )
    db.add(new)
    db.flush()
    for e in db.scalars(select(MarkEntry).where(MarkEntry.batch_id == batch.id)).all():
        db.add(MarkEntry(batch_id=new.id, student_id=e.student_id, marks=e.marks, absent=e.absent, remarks=e.remarks))
    write_audit(db, action="MARKS_BATCH_REVISED", entity_type="marks_batch", entity_id=str(new.id),
                actor_id=actor.id, campus_id=actor.campus_id, details=f"from v{batch.version}")
    db.commit()
    return _batch_out(db, new, entries=True)


def request_correction(db: Session, actor: User, batch_id: UUID, *, reason: str, entries: list[dict]) -> dict:
    """Teacher proposes new marks for a published batch; Principal then Director must approve.

    The original published version is left unchanged. Parents keep seeing it until the correction
    is approved; ``_published_batches`` then prefers the newer approved version.
    """
    reason = (reason or "").strip()
    if not reason:
        fail(400, "validation_error", "A reason is required to request a marks correction.")
    batch = _load_batch(db, actor, batch_id)
    if batch.teacher_id != actor.id:
        fail(403, "forbidden", "Only the owning teacher can request a correction.")
    if _status(_approval(db, batch.approval_id), final="published") != "published":
        fail(409, "conflict", "Only a published marks batch can be corrected.")
    siblings = list(
        db.scalars(
            select(MarksBatch).where(
                MarksBatch.exam_id == batch.exam_id,
                MarksBatch.teacher_id == batch.teacher_id,
                MarksBatch.subject == batch.subject,
                MarksBatch.section == batch.section,
            )
        ).all()
    )
    for sibling in siblings:
        if _status(_approval(db, sibling.approval_id), final="published") == "submitted":
            fail(409, "conflict", "A correction or marks submission is already awaiting approval.")
    if not entries:
        fail(400, "validation_error", "Enter the corrected marks before requesting.")

    exam = db.get(Exam, batch.exam_id)
    next_version = max((s.version for s in siblings), default=batch.version) + 1
    new = MarksBatch(
        campus_id=batch.campus_id,
        exam_id=batch.exam_id,
        teacher_id=batch.teacher_id,
        subject=batch.subject,
        section=batch.section,
        max_marks=batch.max_marks,
        version=next_version,
    )
    db.add(new)
    db.flush()
    _apply_entries(db, actor, new, exam, entries)
    write_audit(
        db,
        action="MARKS_CORRECTION_REQUESTED",
        entity_type="marks_batch",
        entity_id=str(new.id),
        actor_id=actor.id,
        campus_id=actor.campus_id,
        details=f"from v{batch.version} reason={reason}",
    )
    # Commit the draft version first so approvals.submit (which commits) can attach to it.
    db.commit()
    appr = approvals.submit(
        db,
        actor,
        entity_type="marks_correction",
        entity_id=str(new.id),
        title=f"Correction {exam.name} {batch.subject} {exam.class_name}",
        chain=None,
        internal=True,
        comment=reason,
    )
    new = db.get(MarksBatch, new.id)
    new.approval_id = UUID(appr["id"])
    new.updated_at = utcnow()
    db.commit()
    return _batch_out(db, new, entries=True)


def notify_parents_result_published(db: Session, batch_id: str | UUID) -> None:
    """In-app (and optional email/WhatsApp) notice when marks publish. Never raises to callers.

    External channels use ``notify_event`` (mocked or live per settings). Missing provider
    credentials stay unconfigured and are reported in the delivery result — they must not
    alter publication state (caller commits publication before invoking this helper).
    """
    from app.models import Guardian, Notification
    from app.services.integrations.notify import notify_event

    try:
        bid = UUID(str(batch_id))
    except ValueError:
        return
    batch = db.get(MarksBatch, bid)
    if batch is None:
        return
    exam = db.get(Exam, batch.exam_id)
    if exam is None:
        return
    entries = list(db.scalars(select(MarkEntry).where(MarkEntry.batch_id == batch.id)).all())
    if not entries:
        return
    students = {
        s.id: s
        for s in db.scalars(select(Student).where(Student.id.in_([e.student_id for e in entries]))).all()
    }
    parent_ids = {s.parent_user_id for s in students.values() if s.parent_user_id}
    parents = {
        u.id: u for u in db.scalars(select(User).where(User.id.in_(parent_ids))).all()
    } if parent_ids else {}
    phones: dict = {}
    if students:
        for g in db.scalars(
            select(Guardian).where(Guardian.student_id.in_(list(students.keys())))
        ).all():
            if g.phone and g.student_id not in phones:
                phones[g.student_id] = g.phone

    for entry in entries:
        student = students.get(entry.student_id)
        if student is None or student.parent_user_id is None:
            continue
        entity_id = f"{batch.id}:{student.id}"
        title = "Result published"
        body = f"{student.full_name}'s {exam.name} ({batch.subject}) result is now available."
        exists = db.scalar(
            select(Notification).where(
                Notification.campus_id == batch.campus_id,
                Notification.user_id == student.parent_user_id,
                Notification.entity_type == "result_published",
                Notification.entity_id == entity_id,
            )
        )
        if exists is None:
            db.add(
                Notification(
                    campus_id=batch.campus_id,
                    user_id=student.parent_user_id,
                    title=title,
                    body=body,
                    entity_type="result_published",
                    entity_id=entity_id,
                )
            )
        parent = parents.get(student.parent_user_id)
        # Best-effort external channels; notify_event never raises and never retries duplicates.
        from app.services.integrations import whatsapp_events as wa

        wa_text, wa_params = wa.result_message(
            student_name=student.full_name or "",
            exam_name=exam.name or "",
            subject=batch.subject or "",
        )
        notify_event(
            event_key=f"result_published:{entity_id}",
            subject=title,
            body=wa_text or body,
            email=(parent.email if parent else None),
            phone=phones.get(student.id),
            event=wa.EVENT_RESULT,
            template_params=wa_params,
        )


def get_batch(db: Session, actor: User, batch_id: UUID) -> dict:
    return _batch_out(db, _load_batch(db, actor, batch_id), entries=True)


def list_batches(db: Session, actor: User, *, exam_id: UUID | None, status: str | None, mine: bool) -> list[dict]:
    role = role_code_for(db, actor)
    stmt = select(MarksBatch).where(MarksBatch.campus_id == actor.campus_id)
    if mine or role not in VIEW_ALL_ROLES:
        stmt = stmt.where(MarksBatch.teacher_id == actor.id)
    if exam_id:
        stmt = stmt.where(MarksBatch.exam_id == exam_id)
    rows = db.scalars(stmt.order_by(MarksBatch.created_at.desc())).all()
    rows = [b for b in rows if batch_visible(db, actor, b, role)]
    out = [_batch_out(db, b) for b in rows]
    return [o for o in out if o["status"] == status] if status else out


# ------------------------------------------------------------------ results (published only)


def _published_batches(db: Session, exam: Exam) -> list[MarksBatch]:
    """Approved batches of the exam; when one teacher/subject/section has several approved versions
    (a published batch plus an applied correction), only the newest counts."""
    latest: dict[tuple, MarksBatch] = {}
    for b in db.scalars(select(MarksBatch).where(MarksBatch.exam_id == exam.id)).all():
        appr = _approval(db, b.approval_id)
        if appr is None or appr.status != "approved":
            continue
        key = (b.teacher_id, b.subject, b.section)
        if key not in latest or b.version > latest[key].version:
            latest[key] = b
    return list(latest.values())


def _exam_table(db: Session, exam: Exam) -> dict[UUID, dict]:
    """student_id -> {subjects, total, maxTotal, percentage}; ranks added by caller.

    Students are found through their published marks, not their current class, so an exam stays in a
    student's history after promotion. ``_section`` is the section the marks were entered for.
    """
    table: dict[UUID, dict] = {}
    batches = _published_batches(db, exam)
    entries = [
        (batch, e)
        for batch in batches
        for e in db.scalars(select(MarkEntry).where(MarkEntry.batch_id == batch.id)).all()
    ]
    ids = {e.student_id for _, e in entries}
    names = {
        s.id: s
        for s in db.scalars(select(Student).where(Student.campus_id == exam.campus_id, Student.id.in_(ids))).all()
    } if ids else {}
    for batch, e in entries:
        stu = names.get(e.student_id)
        if not stu:
            continue
        section = batch.section or (stu.section if stu.class_name == exam.class_name else "") or ""
        row = table.setdefault(
            e.student_id,
            {"studentId": str(e.student_id), "studentName": stu.full_name,
             "admissionNumber": stu.admission_number, "subjects": [], "total": 0.0, "maxTotal": 0.0,
             "_section": section},
        )
        row["subjects"].append(
            {"subject": batch.subject, "marks": e.marks, "maxMarks": batch.max_marks, "absent": e.absent}
        )
        if not e.absent:
            row["total"] += e.marks or 0.0
            row["maxTotal"] += batch.max_marks
    for row in table.values():
        row["percentage"] = round(row["total"] / row["maxTotal"] * 100, 2) if row["maxTotal"] else 0.0
        row["subjects"].sort(key=lambda s: s["subject"])
    ordered = sorted(table.values(), key=lambda r: -r["percentage"])
    rank, prev = 0, None
    for i, row in enumerate(ordered, start=1):
        if row["percentage"] != prev:
            rank, prev = i, row["percentage"]
        row["rank"] = rank
    return table


def exam_results(db: Session, actor: User, exam_id: UUID) -> dict:
    role = role_code_for(db, actor)
    if role in PORTAL_ROLES:
        fail(403, "forbidden", "The class result table is for staff. Open the student's own results instead.")
    if role not in VIEW_ALL_ROLES and role != "teacher":
        fail(403, "forbidden", "Not allowed to view results.")
    exam = _load_exam(db, actor, exam_id)
    table = _exam_table(db, exam)
    # Ranks and class highs stay class-wide; only the rows a scoped role may see are returned.
    highs: dict[str, float] = {}
    for r in table.values():
        for s in r["subjects"]:
            if not s["absent"] and s["marks"] is not None:
                highs[s["subject"]] = max(highs.get(s["subject"], 0.0), s["marks"])
    allowed = staff_student_filter(db, actor, role)
    if allowed is not None:
        class_students = db.scalars(
            select(Student).where(Student.campus_id == exam.campus_id, Student.class_name == exam.class_name)
        ).all()
        visible = {s.id for s in class_students if allowed(s)}
        if class_students and not visible:
            fail(403, "forbidden", "This exam's class is outside your assigned classes.")
        # A promoted student's row is judged by the class and section the marks were entered for.
        table = {
            sid: row for sid, row in table.items()
            if sid in visible or allowed(SimpleNamespace(class_name=exam.class_name, section=row["_section"]))
        }
    rows = [
        {k: v for k, v in row.items() if not k.startswith("_")}
        for row in sorted(table.values(), key=lambda r: (r["rank"], r["studentName"]))
    ]
    return {
        "exam": _exam_out(db, exam),
        "publishedSubjects": sorted({b.subject for b in _published_batches(db, exam)}),
        "classHigh": highs,
        "results": rows,
    }


def _parent_owns_student(actor: User, student: Student) -> bool:
    if student.parent_user_id is None:
        return False
    return str(student.parent_user_id) == str(actor.id)


def _student_owns_self(actor: User, student: Student) -> bool:
    if student.student_user_id is None:
        return False
    return str(student.student_user_id) == str(actor.id)


def load_student_for_results(db: Session, actor: User, student_id: UUID) -> Student:
    """One student's private results: own child (parent), self (student), or scoped staff."""
    student = db.get(Student, student_id)
    if not student or student.campus_id != actor.campus_id:
        fail(404, "not_found", "Student not found.")
    role = role_code_for(db, actor)
    if role == "parent":
        if not _parent_owns_student(actor, student):
            fail(404, "not_found", "Student not found.")
    elif role == "student":
        if not _student_owns_self(actor, student):
            fail(404, "not_found", "Student not found.")
    elif role not in VIEW_ALL_ROLES and role != "teacher":
        fail(403, "forbidden", "Not allowed to view results.")
    else:
        ensure_staff_can_view_student(db, actor, student, role)
    return student


def student_exams(db: Session, actor: User, student: Student) -> list[Exam]:
    """Exams the student has marks in, so earlier classes' results survive promotion."""
    exam_ids = set(
        db.scalars(
            select(MarksBatch.exam_id)
            .join(MarkEntry, MarkEntry.batch_id == MarksBatch.id)
            .where(MarksBatch.campus_id == actor.campus_id, MarkEntry.student_id == student.id)
        ).all()
    )
    return list(db.scalars(
        select(Exam).where(Exam.campus_id == actor.campus_id, Exam.id.in_(exam_ids)).order_by(Exam.start_date)
    ).all()) if exam_ids else []


def student_results(db: Session, actor: User, student_id: UUID) -> dict:
    student = load_student_for_results(db, actor, student_id)
    exams = student_exams(db, actor, student)
    out_exams = []
    by_type: dict[UUID, list[float]] = {}
    for exam in exams:
        row = _exam_table(db, exam).get(student.id)
        if not row:
            continue
        etype = db.get(ExamType, exam.exam_type_id)
        out_exams.append({"examId": str(exam.id), "examName": exam.name, "examType": etype.code,
                          "className": exam.class_name, "section": row["_section"],
                          "academicYear": exam.academic_year or "", **{
            k: row[k] for k in ("subjects", "total", "maxTotal", "percentage", "rank")}})
        # The weighted final stays a current-class figure, as before promotion history was kept.
        if exam.class_name == student.class_name:
            by_type.setdefault(exam.exam_type_id, []).append(row["percentage"])

    weights = {
        w.exam_type_id: w.weight
        for w in db.scalars(
            select(ExamWeightage).where(
                ExamWeightage.campus_id == actor.campus_id, ExamWeightage.class_name == student.class_name
            )
        ).all()
    }
    components = []
    for type_id, pcts in by_type.items():
        if type_id in weights:
            components.append(
                {"examType": db.get(ExamType, type_id).code, "weight": weights[type_id],
                 "percentage": round(sum(pcts) / len(pcts), 2)}
            )
    weighted = None
    if components:
        wsum = sum(c["weight"] for c in components)
        weighted = {
            "finalPercentage": round(sum(c["weight"] * c["percentage"] for c in components) / wsum, 2),
            "components": components,
            "complete": len(components) == len(weights),
        }
    return {
        "studentId": str(student.id),
        "studentName": student.full_name,
        "className": student.class_name,
        "exams": out_exams,
        "weighted": weighted,
    }
