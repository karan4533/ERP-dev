"""Administrator-assigned substitute duty (attendance access for one section, date and period window).

Rules:
- Principal, Director and the admin-tier roles assign and revoke (the same roles that write Teacher
  Allocations). Teachers and coordinators can only see their own duties.
- A duty grants attendance access only: roster, class list and marking for that section, when the
  attendance date is the duty date, today (campus time) is that date, and now is inside the window.
- Duties are never deleted; revocation is recorded on the row and in the audit log.
"""

from __future__ import annotations

from datetime import date, datetime, time
from uuid import UUID
from zoneinfo import ZoneInfo

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.deps import role_code_for
from app.models import HrEmployee, Role, SchoolClass, Section, SubstituteDuty, User
from app.models.base import utcnow
from app.services.audit import write_audit
from app.services.errors import fail

ASSIGNER_ROLES = {"principal", "director", "admin", "superadmin", "managing_director"}
DUTY_ROLES = {"teacher", "coordinator"}


def local_now() -> datetime:
    """Current campus wall-clock time (patched in tests)."""
    return datetime.now(ZoneInfo(settings.campus_timezone))


def _require_assigner(db: Session, actor: User) -> None:
    if role_code_for(db, actor) not in ASSIGNER_ROLES:
        fail(403, "forbidden", "Only the Principal, Director or an administrator can manage substitute duty.")


def _parse_time(value: str, field: str) -> time:
    try:
        return time.fromisoformat(str(value).strip())
    except ValueError:
        fail(400, "validation_error", f"{field} must be HH:MM.")


def _is_valid_now(duty: SubstituteDuty, now: datetime | None = None) -> bool:
    now = now or local_now()
    return (
        duty.status == "active"
        and duty.duty_date == now.date()
        and duty.start_time <= now.time().replace(tzinfo=None) <= duty.end_time
    )


def _teacher_label(db: Session, user: User | None) -> str:
    if user is None:
        return ""
    hr = db.scalar(select(HrEmployee).where(HrEmployee.user_id == user.id))
    name = " ".join(p for p in (getattr(hr, "first_name", None), getattr(hr, "last_name", None)) if p) if hr else ""
    return name or user.email


def _out(db: Session, duty: SubstituteDuty) -> dict:
    teacher = db.get(User, duty.teacher_user_id)
    section = db.get(Section, duty.section_id)
    cls = db.get(SchoolClass, duty.class_id)
    assigner = db.get(User, duty.assigned_by)
    revoker = db.get(User, duty.revoked_by) if duty.revoked_by else None
    return {
        "id": str(duty.id),
        "teacherUserId": str(duty.teacher_user_id),
        "teacherEmail": teacher.email if teacher else "",
        "teacherName": _teacher_label(db, teacher),
        "classId": str(duty.class_id),
        "className": cls.name if cls else "",
        "sectionId": str(duty.section_id),
        "section": section.name if section else "",
        "date": duty.duty_date.isoformat(),
        "period": duty.period,
        "startTime": duty.start_time.strftime("%H:%M"),
        "endTime": duty.end_time.strftime("%H:%M"),
        "status": duty.status,
        "validNow": _is_valid_now(duty),
        "note": duty.note or "",
        "assignedBy": assigner.email if assigner else "",
        "assignedAt": duty.created_at.isoformat(),
        "revokedBy": revoker.email if revoker else None,
        "revokedAt": duty.revoked_at.isoformat() if duty.revoked_at else None,
        "revokeReason": duty.revoke_reason or None,
    }


def options(db: Session, actor: User) -> dict:
    """Teachers and current-year sections an assigner can pick from."""
    from app.services.placement import current_academic_year

    _require_assigner(db, actor)
    teachers = db.scalars(
        select(User)
        .join(Role, Role.id == User.role_id)
        .where(User.campus_id == actor.campus_id, User.is_active.is_(True), Role.code.in_(DUTY_ROLES))
        .order_by(User.email)
    ).all()
    stmt = select(SchoolClass).where(SchoolClass.campus_id == actor.campus_id, SchoolClass.is_active.is_(True))
    year = current_academic_year(db, actor.campus_id)
    if year is not None:
        stmt = stmt.where(SchoolClass.academic_year_id == year.id)
    classes = []
    for cls in db.scalars(stmt.order_by(SchoolClass.name)).all():
        sections = db.scalars(
            select(Section).where(Section.class_id == cls.id, Section.is_active.is_(True)).order_by(Section.name)
        ).all()
        if sections:
            classes.append({
                "classId": str(cls.id),
                "className": cls.name,
                "sections": [{"sectionId": str(s.id), "name": s.name} for s in sections],
            })
    return {
        "teachers": [{"userId": str(t.id), "email": t.email, "name": _teacher_label(db, t)} for t in teachers],
        "classes": classes,
        "today": local_now().date().isoformat(),
    }


def create(
    db: Session,
    actor: User,
    *,
    teacher_user_id: UUID,
    class_id: UUID,
    section_id: UUID,
    duty_date: date,
    period: str,
    start_time: str,
    end_time: str,
    note: str | None,
) -> dict:
    _require_assigner(db, actor)
    teacher = db.get(User, teacher_user_id)
    if teacher is None or teacher.campus_id != actor.campus_id or not teacher.is_active:
        fail(400, "validation_error", "Choose an active teacher on this campus.")
    if role_code_for(db, teacher) not in DUTY_ROLES:
        fail(400, "validation_error", "Substitute duty can only be given to a teacher or coordinator login.")
    section = db.get(Section, section_id)
    if section is None or section.campus_id != actor.campus_id or not section.is_active:
        fail(400, "validation_error", "Choose an active section on this campus.")
    if section.class_id != class_id:
        fail(400, "validation_error", "That section does not belong to the chosen class.")
    period = (period or "").strip()
    if not period or len(period) > 20:
        fail(400, "validation_error", "Period is required (up to 20 characters).")
    start, end = _parse_time(start_time, "startTime"), _parse_time(end_time, "endTime")
    if start >= end:
        fail(400, "validation_error", "The period must end after it starts.")
    if duty_date < local_now().date():
        fail(400, "validation_error", "Substitute duty cannot be assigned for a past date.")
    clashes = db.scalars(
        select(SubstituteDuty).where(
            SubstituteDuty.campus_id == actor.campus_id,
            SubstituteDuty.teacher_user_id == teacher.id,
            SubstituteDuty.section_id == section.id,
            SubstituteDuty.duty_date == duty_date,
            SubstituteDuty.status == "active",
        )
    ).all()
    if any(d.start_time < end and start < d.end_time for d in clashes):
        fail(409, "conflict", "An active duty already overlaps this period for this teacher and section.")

    duty = SubstituteDuty(
        campus_id=actor.campus_id,
        teacher_user_id=teacher.id,
        class_id=class_id,
        section_id=section.id,
        duty_date=duty_date,
        period=period,
        start_time=start,
        end_time=end,
        note=(note or "").strip() or None,
        assigned_by=actor.id,
    )
    db.add(duty)
    db.flush()
    write_audit(
        db,
        action="SUBSTITUTE_DUTY_ASSIGNED",
        entity_type="substitute_duty",
        entity_id=str(duty.id),
        actor_id=actor.id,
        campus_id=actor.campus_id,
        details=f"teacher={teacher.id} section={section.id} {duty_date.isoformat()} {period} "
        f"{start.strftime('%H:%M')}-{end.strftime('%H:%M')}",
    )
    db.commit()
    return _out(db, duty)


def list_duties(db: Session, actor: User, *, on_date: date | None, include_revoked: bool) -> list[dict]:
    role = role_code_for(db, actor)
    stmt = select(SubstituteDuty).where(SubstituteDuty.campus_id == actor.campus_id)
    if role in DUTY_ROLES:
        stmt = stmt.where(SubstituteDuty.teacher_user_id == actor.id)
    elif role not in ASSIGNER_ROLES:
        fail(403, "forbidden", "You are not allowed to view substitute duty.")
    if on_date:
        stmt = stmt.where(SubstituteDuty.duty_date == on_date)
    if not include_revoked:
        stmt = stmt.where(SubstituteDuty.status == "active")
    rows = db.scalars(stmt.order_by(SubstituteDuty.duty_date.desc(), SubstituteDuty.start_time)).all()
    return [_out(db, d) for d in rows]


def revoke(db: Session, actor: User, duty_id: UUID, *, reason: str | None) -> dict:
    _require_assigner(db, actor)
    duty = db.get(SubstituteDuty, duty_id)
    if duty is None or duty.campus_id != actor.campus_id:
        fail(404, "not_found", "Substitute duty not found.")
    if duty.status != "active":
        fail(409, "conflict", "This duty is already revoked.")
    duty.status = "revoked"
    duty.revoked_by = actor.id
    duty.revoked_at = utcnow()
    duty.revoke_reason = (reason or "").strip() or None
    write_audit(
        db,
        action="SUBSTITUTE_DUTY_REVOKED",
        entity_type="substitute_duty",
        entity_id=str(duty.id),
        actor_id=actor.id,
        campus_id=actor.campus_id,
        details=duty.revoke_reason or "",
    )
    db.commit()
    return _out(db, duty)


def valid_duties(db: Session, actor: User, attendance_date: date) -> list[SubstituteDuty]:
    """The actor's own duties that grant attendance access right now for ``attendance_date``."""
    now = local_now()
    if attendance_date != now.date():
        return []
    rows = db.scalars(
        select(SubstituteDuty).where(
            SubstituteDuty.campus_id == actor.campus_id,
            SubstituteDuty.teacher_user_id == actor.id,
            SubstituteDuty.duty_date == attendance_date,
            SubstituteDuty.status == "active",
        )
    ).all()
    return [d for d in rows if _is_valid_now(d, now)]
