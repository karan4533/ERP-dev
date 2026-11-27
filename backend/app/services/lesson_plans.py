"""Monthly lesson plans (Y-2, Academics doc 4.5).

Rules from the doc:
- Teacher creates a monthly plan; chain Coordinator -> Principal -> DA (Director) via the approval engine.
- Last submission date is the 25th of every month (for the next month); reminder 7 days before.
- Teachers can see approval status at each level.
- Once submitted the plan is locked (no edit / no delete); after denial a new version is created.
"""

from __future__ import annotations

import json
import re
from datetime import date
from types import SimpleNamespace
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.deps import role_code_for
from app.models import ApprovalRequest, LessonPlan, Notification, Role, User
from app.models.base import utcnow
from app.services import approvals
from app.services.audit import write_audit
from app.services.errors import fail
from app.services.students import staff_student_filter

MONTH_RE = re.compile(r"^\d{4}-(0[1-9]|1[0-2])$")
SUBMIT_DAY = 25
REMINDER_DAYS = 7
VIEW_ALL_ROLES = {"coordinator", "principal", "director", "jointdirector", "admin", "superadmin", "managing_director"}


def deadline_for(month: str) -> date:
    """Submission deadline: 25th of the month before the target month."""
    year, mon = int(month[:4]), int(month[5:])
    year, mon = (year - 1, 12) if mon == 1 else (year, mon - 1)
    return date(year, mon, SUBMIT_DAY)


def _approval(db: Session, plan: LessonPlan) -> ApprovalRequest | None:
    return db.get(ApprovalRequest, plan.approval_id) if plan.approval_id else None


def _status(approval: ApprovalRequest | None) -> str:
    if approval is None:
        return "draft"
    return {"pending": "submitted", "approved": "approved", "denied": "denied"}[approval.status]


def _out(db: Session, plan: LessonPlan, *, with_events: bool = False) -> dict:
    approval = _approval(db, plan)
    teacher = db.get(User, plan.teacher_id)
    data = {
        "id": str(plan.id),
        "teacherId": str(plan.teacher_id),
        "teacherEmail": teacher.email if teacher else "",
        "className": plan.class_name,
        "section": plan.section or "",
        "subject": plan.subject,
        "month": plan.month,
        "title": plan.title or "",
        "content": json.loads(plan.content_json or "{}"),
        "fileId": str(plan.file_id) if plan.file_id else None,
        "version": plan.version,
        "status": _status(approval),
        "late": plan.late,
        "deadline": deadline_for(plan.month).isoformat(),
        "approvalId": str(approval.id) if approval else None,
        "awaitingRole": None,
        "awaitingEligibleApprover": approvals.awaiting_eligible_approver(db, approval),
        "createdAt": plan.created_at.isoformat(),
    }
    if approval:
        detail = approvals.detail(db, _actor_for_campus(db, plan), approval.id)
        data["awaitingRole"] = detail["awaitingRole"]
        data["chain"] = detail["chain"]
        if with_events:
            data["approvalEvents"] = detail["events"]
    return data


def _actor_for_campus(db: Session, plan: LessonPlan) -> User:
    # approvals.detail only needs campus scoping; the teacher is always in the plan's campus.
    return db.get(User, plan.teacher_id)  # type: ignore[return-value]


def plan_visible(db: Session, actor: User, plan: LessonPlan, role: str | None = None) -> bool:
    """Owner, campus-wide leadership, or a coordinator whose grade band / allocations cover the plan."""
    if plan.campus_id != actor.campus_id:
        return False
    if plan.teacher_id == actor.id:
        return True
    role = role or role_code_for(db, actor)
    if role not in VIEW_ALL_ROLES:
        return False
    allowed = staff_student_filter(db, actor, role)
    return allowed is None or allowed(SimpleNamespace(class_name=plan.class_name, section=plan.section or ""))


def plan_visible_by_id(db: Session, actor: User, plan_id: str, role: str | None = None) -> bool:
    try:
        plan = db.get(LessonPlan, UUID(str(plan_id)))
    except ValueError:
        return False
    return plan is not None and plan_visible(db, actor, plan, role)


def _load(db: Session, actor: User, plan_id: UUID) -> LessonPlan:
    plan = db.get(LessonPlan, plan_id)
    if not plan or not plan_visible(db, actor, plan):
        fail(404, "not_found", "Lesson plan not found.")
    return plan


def _validate_month(month: str) -> None:
    if not MONTH_RE.match(month or ""):
        fail(400, "validation_error", "month must be YYYY-MM.")


def create(
    db: Session,
    actor: User,
    *,
    class_name: str,
    section: str | None,
    subject: str,
    month: str,
    title: str | None,
    content: dict,
    file_id: UUID | None,
) -> dict:
    _validate_month(month)
    class_name, subject = class_name.strip(), subject.strip()
    if not class_name or not subject:
        fail(400, "validation_error", "className and subject are required.")
    existing = db.scalars(
        select(LessonPlan).where(
            LessonPlan.campus_id == actor.campus_id,
            LessonPlan.teacher_id == actor.id,
            LessonPlan.class_name == class_name,
            LessonPlan.section == (section or None),
            LessonPlan.subject == subject,
            LessonPlan.month == month,
        )
    ).all()
    for p in existing:
        if _status(_approval(db, p)) != "denied":
            fail(409, "conflict", "A lesson plan already exists for this class, subject and month.")
    plan = LessonPlan(
        campus_id=actor.campus_id,
        teacher_id=actor.id,
        class_name=class_name,
        section=section or None,
        subject=subject,
        month=month,
        title=title,
        content_json=json.dumps(content or {}),
        file_id=file_id,
        version=len(existing) + 1,
    )
    db.add(plan)
    db.flush()
    write_audit(
        db,
        action="LESSON_PLAN_CREATED",
        entity_type="lesson_plan",
        entity_id=str(plan.id),
        actor_id=actor.id,
        campus_id=actor.campus_id,
        details=f"{class_name}/{subject}/{month} v{plan.version}",
    )
    db.commit()
    return _out(db, plan)


def update(db: Session, actor: User, plan_id: UUID, *, title, content, file_id) -> dict:
    plan = _load(db, actor, plan_id)
    if plan.teacher_id != actor.id:
        fail(403, "forbidden", "Only the owning teacher can edit.")
    if plan.approval_id:
        fail(409, "locked", "Submitted plans are locked. Revise a denied plan to create a new version.")
    if title is not None:
        plan.title = title
    if content is not None:
        plan.content_json = json.dumps(content)
    if file_id is not None:
        plan.file_id = file_id
    plan.updated_at = utcnow()
    write_audit(
        db,
        action="LESSON_PLAN_UPDATED",
        entity_type="lesson_plan",
        entity_id=str(plan.id),
        actor_id=actor.id,
        campus_id=actor.campus_id,
    )
    db.commit()
    return _out(db, plan)


_LEADERSHIP_SUBMIT_ROLES = {
    "coordinator",
    "principal",
    "director",
    "jointdirector",
    "admin",
    "superadmin",
}


def submit(db: Session, actor: User, plan_id: UUID, *, today: date | None = None) -> dict:
    plan = _load(db, actor, plan_id)
    role = role_code_for(db, actor)
    # Owner may always submit; campus leadership may submit a stuck draft for review.
    if plan.teacher_id != actor.id and role not in _LEADERSHIP_SUBMIT_ROLES:
        fail(403, "forbidden", "Only the owning teacher or campus leadership can submit.")
    if plan.approval_id:
        fail(409, "conflict", "Already submitted.")
    today = today or date.today()
    plan.late = today > deadline_for(plan.month)
    approval = approvals.submit(
        db,
        actor,
        entity_type="lesson_plan",
        entity_id=str(plan.id),
        title=f"Lesson plan {plan.class_name} {plan.subject} {plan.month}",
        chain=None,
        internal=True,
    )
    plan.approval_id = UUID(approval["id"])
    plan.updated_at = utcnow()
    db.commit()
    return _out(db, plan)


def mark_complete(
    db: Session,
    actor: User,
    plan_id: UUID,
    *,
    remarks: str = "",
) -> dict:
    """Owner marks an approved (or submitted) plan as taught/done.

    Allowed after submit: content edits stay locked via PATCH, but completion
    flags live in content_json and must be writable without unlocking the plan.
    """
    plan = _load(db, actor, plan_id)
    if plan.teacher_id != actor.id:
        fail(403, "forbidden", "Only the owning teacher can mark a lesson plan as done.")
    content = json.loads(plan.content_json or "{}")
    if not isinstance(content, dict):
        content = {}
    content["markAsDone"] = True
    content["trackStatus"] = "Completed"
    content["completionRemarks"] = (remarks or "").strip()
    plan.content_json = json.dumps(content)
    plan.updated_at = utcnow()
    write_audit(
        db,
        action="LESSON_PLAN_MARKED_DONE",
        entity_type="lesson_plan",
        entity_id=str(plan.id),
        actor_id=actor.id,
        campus_id=actor.campus_id,
    )
    db.commit()
    return _out(db, plan)


def revise(db: Session, actor: User, plan_id: UUID) -> dict:
    """Create the next version (draft) from a denied plan."""
    plan = _load(db, actor, plan_id)
    if plan.teacher_id != actor.id:
        fail(403, "forbidden", "Only the owning teacher can revise.")
    if _status(_approval(db, plan)) != "denied":
        fail(409, "conflict", "Only a denied plan can be revised.")
    latest = db.scalar(
        select(LessonPlan)
        .where(
            LessonPlan.campus_id == plan.campus_id,
            LessonPlan.teacher_id == plan.teacher_id,
            LessonPlan.class_name == plan.class_name,
            LessonPlan.section == plan.section,
            LessonPlan.subject == plan.subject,
            LessonPlan.month == plan.month,
            LessonPlan.version > plan.version,
        )
    )
    if latest:
        fail(409, "conflict", "A newer version already exists.")
    new = LessonPlan(
        campus_id=plan.campus_id,
        teacher_id=plan.teacher_id,
        class_name=plan.class_name,
        section=plan.section,
        subject=plan.subject,
        month=plan.month,
        title=plan.title,
        content_json=plan.content_json,
        file_id=plan.file_id,
        version=plan.version + 1,
    )
    db.add(new)
    db.flush()
    write_audit(
        db,
        action="LESSON_PLAN_REVISED",
        entity_type="lesson_plan",
        entity_id=str(new.id),
        actor_id=actor.id,
        campus_id=actor.campus_id,
        details=f"from v{plan.version}",
    )
    db.commit()
    return _out(db, new)


def get(db: Session, actor: User, plan_id: UUID) -> dict:
    return _out(db, _load(db, actor, plan_id), with_events=True)


def list_plans(
    db: Session,
    actor: User,
    *,
    month: str | None,
    class_name: str | None,
    status: str | None,
    mine: bool,
) -> list[dict]:
    role = role_code_for(db, actor)
    stmt = select(LessonPlan).where(LessonPlan.campus_id == actor.campus_id)
    if mine or role not in VIEW_ALL_ROLES:
        stmt = stmt.where(LessonPlan.teacher_id == actor.id)
    if month:
        _validate_month(month)
        stmt = stmt.where(LessonPlan.month == month)
    if class_name:
        stmt = stmt.where(LessonPlan.class_name == class_name)
    rows = db.scalars(stmt.order_by(LessonPlan.month.desc(), LessonPlan.class_name, LessonPlan.version.desc())).all()
    out = [_out(db, p) for p in rows if plan_visible(db, actor, p, role)]
    if status:
        out = [o for o in out if o["status"] == status]
    return out


def run_reminders(db: Session, campus_id, *, today: date) -> int:
    """Remind teachers who have no submitted plan for next month, from 7 days before the 25th.

    Idempotent per teacher and month. Returns the number of reminders created.
    """
    if not (SUBMIT_DAY - REMINDER_DAYS <= today.day <= SUBMIT_DAY):
        return 0
    nxt = f"{today.year + 1}-01" if today.month == 12 else f"{today.year}-{today.month + 1:02d}"
    teacher_role = db.scalar(select(Role).where(Role.code == "teacher"))
    if not teacher_role:
        return 0
    teachers = db.scalars(
        select(User).where(User.campus_id == campus_id, User.role_id == teacher_role.id, User.is_active.is_(True))
    ).all()
    created = 0
    for t in teachers:
        plans = db.scalars(
            select(LessonPlan).where(
                LessonPlan.campus_id == campus_id, LessonPlan.teacher_id == t.id, LessonPlan.month == nxt
            )
        ).all()
        if any(p.approval_id for p in plans):
            continue
        already = db.scalar(
            select(Notification).where(
                Notification.campus_id == campus_id,
                Notification.user_id == t.id,
                Notification.entity_type == "lesson_plan_reminder",
                Notification.entity_id == nxt,
            )
        )
        if already:
            continue
        db.add(
            Notification(
                campus_id=campus_id,
                user_id=t.id,
                title=f"Submit lesson plan for {nxt}",
                body=f"Last submission date is {deadline_for(nxt).isoformat()}.",
                entity_type="lesson_plan_reminder",
                entity_id=nxt,
            )
        )
        created += 1
    if created:
        write_audit(
            db,
            action="LESSON_PLAN_REMINDERS",
            entity_type="lesson_plan",
            campus_id=campus_id,
            details=f"{nxt}: {created} reminders",
        )
    db.commit()
    return created
