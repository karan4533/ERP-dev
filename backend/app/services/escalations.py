"""Escalations with the 24h clock, and tasks (Y-5).

Escalation rules (mirror src/Common/EscalationManagement/escalationRoleConfig.js):
- Every role escalates to exactly one level up (student -> teacher -> coordinator -> principal -> director -> admin -> superadmin).
- The receiving level has 24h (RESOLUTION_SLA_HOURS) to move it to Resolved / Rejected. Past that the clock
  auto-escalates it one more level up (once per elapsed 24h), notifies the old owner, the new owner and the raiser.
  At the top level nothing is above, so only a single "overdue at top level" notification is sent.
- Settled items (Resolved / Rejected) can be closed by the person who raised them. Closed is final.
- Content is immutable; only status/resolution move, and every move is kept in the trail.

Task rules:
- Any staff user assigns a task to another active staff user. Content cannot be edited or deleted.
- Only the assignee moves the status: Incomplete -> In Progress -> Completed (no reopening).
- A task past its due date and not Completed is overdue; the clock notifies assignee and assigner once.
"""

from __future__ import annotations

import json
from datetime import date, datetime, timedelta, timezone
from uuid import UUID

from sqlalchemy import func, select, update
from sqlalchemy.orm import Session

from app.deps import role_code_for
from app.models import Escalation, Role, Task, TaskEvent, User
from app.services.approvals import _notify
from app.services.attachments import task_attachments
from app.services.audit import write_audit
from app.services.errors import fail

RESOLUTION_SLA_HOURS = 24
ESCALATES_TO = {
    "gatekeeper": "gatekeepermanager",
    "gatekeepermanager": "prm",
    "prm": "director",
    "pro": "director",
    "student": "teacher",
    "teacher": "coordinator",
    "coordinator": "principal",
    "librarian": "principal",
    "principal": "director",
    "director": "admin",
    "admin": "superadmin",
}
OPEN_STATUSES = ("Pending", "In Review")
RECEIVER_STATUSES = ("In Review", "Resolved", "Rejected")
VIEW_ALL_ROLES = {"admin", "superadmin", "managing_director"}
NON_STAFF = {"student", "parent"}

# Who may assign tasks to whom (direct reports only). Mirrors ASSIGNMENT_HIERARCHY in
# src/Common/TaskManagement/taskManagementConfig.js - change both together. Roles not listed cannot assign tasks.
TASK_HIERARCHY = {
    "superadmin": ("admin",),
    "admin": ("director",),
    "director": ("principal", "prm", "pro"),
    "principal": ("coordinator", "teacher", "librarian"),
    "prm": ("gatekeepermanager",),
    "pro": ("gatekeepermanager",),
    "gatekeepermanager": ("gatekeeper",),
    # Ops / audit managers with Task Management create/assign (#51)
    "housekeepingmanager": ("gatekeeper",),
    "maintenancemanager": ("gatekeeper",),
    "transportmanager": ("driver",),
    "stationerystoremanager": ("prm",),
    "processauditor": ("teacher",),
    "qualityauditor": ("teacher",),
}
TASK_PRIORITIES = ["High", "Medium", "Low"]
TASK_STATUSES = ["Incomplete", "In Progress", "Completed"]
TASK_FLOW = {"Incomplete": ("In Progress", "Completed"), "In Progress": ("Completed",), "Completed": ()}


def _aware(value: datetime) -> datetime:
    return value if value.tzinfo else value.replace(tzinfo=timezone.utc)


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _trail(row: Escalation) -> list[dict]:
    return json.loads(row.trail_json or "[]")


def _add_trail(row: Escalation, *, action: str, at: datetime, **extra) -> None:
    trail = _trail(row)
    trail.append({"at": at.isoformat(), "action": action, **extra})
    row.trail_json = json.dumps(trail)


# ---------------------------------------------------------------- escalations


def _out_esc(db: Session, row: Escalation, *, now: datetime | None = None, trail: bool = False) -> dict:
    now = now or _now()
    raiser = db.get(User, row.raised_by_id)
    recipient = db.get(User, row.to_user_id) if row.to_user_id else None
    data = {
        "id": str(row.id),
        "escalationId": f"ESC-{row.created_at.year}-{row.esc_no:03d}",
        "escalatedBy": raiser.email if raiser else "",
        "escalatedByRoleKey": row.raised_by_role,
        "escalatedToRoleKey": row.to_role,
        "escalatedToUserId": str(row.to_user_id) if row.to_user_id else None,
        "escalatedToUserEmail": recipient.email if recipient else "",
        "description": row.description,
        "fullDescription": row.full_description,
        "remarks": row.remarks or "",
        "status": row.status,
        "resolutionNote": row.resolution_note or "",
        "level": row.level,
        "escalatedAt": _aware(row.created_at).isoformat(),
        "resolveBy": _aware(row.resolve_by).isoformat(),
        "overdue": row.status in OPEN_STATUSES and _aware(row.resolve_by) <= now,
        "resolvedAt": _aware(row.resolved_at).isoformat() if row.resolved_at else None,
    }
    if trail:
        data["trail"] = _trail(row)
    return data


def _is_recipient(row: Escalation, user: User, role: str) -> bool:
    return row.to_role == role and (row.to_user_id is None or row.to_user_id == user.id)


def _can_view(row: Escalation, user: User, role: str) -> bool:
    if row.raised_by_id == user.id or role in VIEW_ALL_ROLES or _is_recipient(row, user, role):
        return True
    return any(step.get("toRole") == role for step in _trail(row))  # earlier owners keep read access


def _load_esc(db: Session, user: User, escalation_id: UUID) -> Escalation:
    row = db.get(Escalation, escalation_id)
    if not row or row.campus_id != user.campus_id:
        fail(404, "not_found", "Escalation not found.")
    if not _can_view(row, user, role_code_for(db, user)):
        fail(404, "not_found", "Escalation not found.")
    return row


def raise_escalation(
    db: Session,
    actor: User,
    *,
    description: str,
    full_description: str | None,
    remarks: str | None,
    to_user_id: UUID | None,
) -> dict:
    role = role_code_for(db, actor)
    to_role = ESCALATES_TO.get(role)
    if not to_role:
        fail(403, "forbidden", "This role cannot raise escalations.")
    if not description or not description.strip():
        fail(400, "validation_error", "A description is required.")
    if to_user_id is not None:
        target = db.get(User, to_user_id)
        if not target or target.campus_id != actor.campus_id or not target.is_active or role_code_for(db, target) != to_role:
            fail(400, "validation_error", f"Recipient must be an active {to_role} user.")
    now = _now()
    next_no = (db.scalar(select(func.max(Escalation.esc_no)).where(Escalation.campus_id == actor.campus_id)) or 0) + 1
    row = Escalation(
        campus_id=actor.campus_id,
        esc_no=next_no,
        raised_by_id=actor.id,
        raised_by_role=role,
        to_role=to_role,
        to_user_id=to_user_id,
        description=description.strip()[:300],
        full_description=(full_description or description).strip(),
        remarks=(remarks or "").strip() or None,
        status="Pending",
        level=0,
        resolve_by=now + timedelta(hours=RESOLUTION_SLA_HOURS),
        created_at=now,
    )
    _add_trail(row, action="raised", at=now, byRole=role, toRole=to_role)
    db.add(row)
    db.flush()
    _notify(
        db,
        campus_id=actor.campus_id,
        title=f"Escalation ESC-{now.year}-{next_no:03d}: {row.description[:80]}",
        body=f"Raised by {actor.email}. Resolve within {RESOLUTION_SLA_HOURS}h.",
        entity_type="escalation",
        entity_id=str(row.id),
        user_id=to_user_id,
        role_code=None if to_user_id else to_role,
    )
    write_audit(db, action="ESCALATION_RAISED", entity_type="escalation", entity_id=str(row.id),
                actor_id=actor.id, campus_id=actor.campus_id, details=f"to {to_role}")
    db.commit()
    return _out_esc(db, row, trail=True)


def recipients(db: Session, actor: User) -> list[dict]:
    """Active users at the level this actor escalates to (for the optional 'send to a specific person' choice)."""
    to_role = ESCALATES_TO.get(role_code_for(db, actor))
    if not to_role:
        fail(403, "forbidden", "This role cannot raise escalations.")
    rows = db.execute(
        select(User)
        .join(Role, Role.id == User.role_id)
        .where(User.campus_id == actor.campus_id, User.is_active.is_(True), Role.code == to_role)
        .order_by(User.email)
    ).scalars()
    return [{"id": str(u.id), "email": u.email, "role": to_role} for u in rows]


def get_escalation(db: Session, actor: User, escalation_id: UUID) -> dict:
    return _out_esc(db, _load_esc(db, actor, escalation_id), trail=True)


def list_escalations(db: Session, actor: User, *, box: str, status: str | None) -> list[dict]:
    run_clock(db, actor.campus_id)  # evaluate the 24h clock before anyone reads the list
    role = role_code_for(db, actor)
    rows = db.scalars(
        select(Escalation).where(Escalation.campus_id == actor.campus_id).order_by(Escalation.esc_no.desc())
    ).all()
    if box == "mine":
        rows = [r for r in rows if r.raised_by_id == actor.id]
    elif box == "received":
        rows = [r for r in rows if _is_recipient(r, actor, role)]
    elif box == "all":
        if role not in VIEW_ALL_ROLES:
            fail(403, "forbidden", "Not allowed to list all escalations.")
    else:
        fail(400, "validation_error", "box must be mine, received or all.")
    out = [_out_esc(db, r) for r in rows]
    return [o for o in out if o["status"] == status] if status else out


def mark_not_satisfied(db: Session, actor: User, escalation_id: UUID, *, note: str | None) -> dict:
    """Client rule: raiser can manually escalate with 'Not Satisfied' (in addition to 24h auto)."""
    row = _load_esc(db, actor, escalation_id)
    if row.raised_by_id != actor.id:
        fail(403, "forbidden", "Only the person who raised it can mark Not Satisfied.")
    if row.status == "Closed":
        fail(409, "conflict", "A closed escalation cannot change.")
    now = _now()
    nxt = ESCALATES_TO.get(row.to_role)
    if not nxt:
        fail(409, "conflict", "Already at the top escalation level (MD/Admin).")
    previous_role = row.to_role
    row.to_role, row.to_user_id = nxt, None
    row.level += 1
    row.status = "Pending"
    row.resolve_by = now + timedelta(hours=RESOLUTION_SLA_HOURS)
    note_text = (note or "Not Satisfied — escalated to next level.").strip()
    _add_trail(
        row,
        action="not_satisfied",
        at=now,
        byRole=role_code_for(db, actor),
        fromRole=previous_role,
        toRole=nxt,
        note=note_text,
    )
    _notify(
        db,
        campus_id=row.campus_id,
        title=f"Not Satisfied — escalated: {row.description[:80]}",
        body=f"Moved from {previous_role} to {nxt}. {note_text}",
        entity_type="escalation",
        entity_id=str(row.id),
        role_code=nxt,
    )
    write_audit(
        db,
        action="ESCALATION_NOT_SATISFIED",
        entity_type="escalation",
        entity_id=str(row.id),
        actor_id=actor.id,
        campus_id=actor.campus_id,
    )
    db.commit()
    return _out_esc(db, row, trail=True)


def update_status(db: Session, actor: User, escalation_id: UUID, *, status: str, note: str | None) -> dict:
    row = _load_esc(db, actor, escalation_id)
    role = role_code_for(db, actor)
    now = _now()
    if row.status == "Closed":
        fail(409, "conflict", "A closed escalation cannot change.")
    if status == "Closed":
        if row.raised_by_id != actor.id:
            fail(403, "forbidden", "Only the person who raised it can close an escalation.")
        if row.status not in ("Resolved", "Rejected"):
            fail(409, "conflict", "Only a resolved or rejected escalation can be closed.")
        row.status = "Closed"
        action = "closed"
    else:
        if status not in RECEIVER_STATUSES:
            fail(400, "validation_error", f"status must be one of: {', '.join((*RECEIVER_STATUSES, 'Closed'))}.")
        if not _is_recipient(row, actor, role):
            fail(403, "forbidden", "Only the current receiver can update this escalation.")
        if row.status in ("Resolved", "Rejected"):
            fail(409, "conflict", f"Already {row.status.lower()}.")
        if status in ("Resolved", "Rejected") and not (note and note.strip()):
            fail(400, "validation_error", "A resolution note is required to resolve or reject.")
        if status == "In Review" and row.status == "In Review":
            fail(409, "conflict", "Already in review.")
        row.status = status
        if status in ("Resolved", "Rejected"):
            row.resolution_note = note.strip()  # type: ignore[union-attr]
            row.resolved_at = now
        action = status.lower().replace(" ", "_")
    _add_trail(row, action=action, at=now, byRole=role, note=(note or "").strip() or None)
    _notify(
        db,
        campus_id=row.campus_id,
        title=f"Escalation {row.status}: {row.description[:80]}",
        body=(note or "").strip() or None,
        entity_type="escalation",
        entity_id=str(row.id),
        user_id=row.raised_by_id if actor.id != row.raised_by_id else None,
        role_code=row.to_role if actor.id == row.raised_by_id else None,
    )
    write_audit(db, action=f"ESCALATION_{row.status.upper().replace(' ', '_')}", entity_type="escalation",
                entity_id=str(row.id), actor_id=actor.id, campus_id=actor.campus_id)
    db.commit()
    return _out_esc(db, row, trail=True)


def run_clock(db: Session, campus_id, *, now: datetime | None = None) -> dict:
    """The 24h clock: auto-escalate overdue escalations one level per elapsed 24h; flag overdue tasks.

    Idempotent - calling it again without time passing changes nothing.
    """
    now = _aware(now) if now else _now()
    escalated = 0
    top_level = 0
    rows = db.scalars(
        select(Escalation).where(Escalation.campus_id == campus_id, Escalation.status.in_(OPEN_STATUSES))
    ).all()
    for row in rows:
        while _aware(row.resolve_by) <= now:
            nxt = ESCALATES_TO.get(row.to_role)
            if not nxt:
                trail = _trail(row)
                if not trail or trail[-1]["action"] != "overdue_top_level":
                    _add_trail(row, action="overdue_top_level", at=now, toRole=row.to_role)
                    _notify(
                        db, campus_id=campus_id, title=f"Overdue at top level: {row.description[:80]}",
                        body="No higher level exists; resolve it now.", entity_type="escalation",
                        entity_id=str(row.id), role_code=row.to_role,
                    )
                    top_level += 1
                break
            overdue_at = _aware(row.resolve_by)
            previous_role = row.to_role
            row.to_role, row.to_user_id = nxt, None
            row.level += 1
            row.status = "Pending"
            row.resolve_by = overdue_at + timedelta(hours=RESOLUTION_SLA_HOURS)
            _add_trail(row, action="auto_escalated", at=overdue_at, fromRole=previous_role, toRole=nxt)
            title = f"Escalation not resolved in {RESOLUTION_SLA_HOURS}h: {row.description[:80]}"
            _notify(db, campus_id=campus_id, title=title, body=f"Moved from {previous_role} to {nxt}.",
                    entity_type="escalation", entity_id=str(row.id), role_code=previous_role)
            _notify(db, campus_id=campus_id, title=f"Escalated to you: {row.description[:80]}",
                    body=f"Not resolved by {previous_role} within {RESOLUTION_SLA_HOURS}h.",
                    entity_type="escalation", entity_id=str(row.id), role_code=nxt)
            _notify(db, campus_id=campus_id, title=title, body=f"Now with {nxt}.",
                    entity_type="escalation", entity_id=str(row.id), user_id=row.raised_by_id)
            escalated += 1

    overdue_tasks = 0
    for task in db.scalars(
        select(Task).where(
            Task.campus_id == campus_id, Task.status != "Completed", Task.overdue_notified.is_(False),
            Task.due_date < now.date(),
        )
    ).all():
        # Claim the task atomically: two requests running the clock at once (e.g. the "mine" and "assigned" lists
        # loaded in parallel) must not both notify. Only the request whose UPDATE flips the flag may send.
        claimed = db.execute(
            update(Task).where(Task.id == task.id, Task.overdue_notified.is_(False)).values(overdue_notified=True)
        ).rowcount
        if not claimed:
            continue
        for uid in {task.assignee_id, task.assigned_by_id}:
            _notify(db, campus_id=campus_id, title=f"Task overdue: {task.title[:80]}",
                    body=f"Due {task.due_date.isoformat()}.", entity_type="task",
                    entity_id=str(task.id), user_id=uid)
        overdue_tasks += 1

    if escalated or top_level or overdue_tasks:
        db.commit()
    return {"autoEscalated": escalated, "overdueAtTopLevel": top_level, "overdueTasks": overdue_tasks}


# ---------------------------------------------------------------------- tasks


def _task_events(db: Session, task_ids: list[UUID]) -> dict[UUID, list[TaskEvent]]:
    """Task history grouped by task, oldest first (one query for any number of tasks)."""
    grouped: dict[UUID, list[TaskEvent]] = {}
    if not task_ids:
        return grouped
    for ev in db.scalars(
        select(TaskEvent).where(TaskEvent.task_id.in_(task_ids)).order_by(TaskEvent.created_at, TaskEvent.id)
    ).all():
        grouped.setdefault(ev.task_id, []).append(ev)
    return grouped


def _out_event(db: Session, ev: TaskEvent) -> dict:
    actor = db.get(User, ev.actor_id)
    return {
        "at": _aware(ev.created_at).isoformat(),
        "action": ev.action,
        "fromStatus": ev.from_status,
        "toStatus": ev.to_status,
        "actor": actor.email if actor else "",
        "actorRole": ev.actor_role,
        "remark": ev.remark or "",
    }


def _out_task(
    db: Session,
    row: Task,
    *,
    today: date | None = None,
    events: list[TaskEvent] | None = None,
    attachments: list[dict] | None = None,
    detail: bool = False,
) -> dict:
    today = today or date.today()
    by = db.get(User, row.assigned_by_id)
    to = db.get(User, row.assignee_id)
    if events is None:
        events = _task_events(db, [row.id]).get(row.id, [])
    if attachments is None:
        attachments = task_attachments(db, row.campus_id, [row.id]).get(str(row.id), [])
    last_remark = next((e.remark for e in reversed(events) if e.remark), "")
    data = {
        "id": str(row.id),
        "taskId": f"TASK-{row.task_no:04d}",
        "title": row.title,
        "description": row.description or "",
        "priority": row.priority,
        "dueDate": row.due_date.isoformat(),
        "status": row.status,
        "overdue": row.status != "Completed" and row.due_date < today,
        "assignedBy": by.email if by else "",
        "assignedByRole": row.assigned_by_role,
        "assigneeId": str(row.assignee_id),
        "assignee": to.email if to else "",
        "assigneeRole": row.assignee_role,
        "assignedAt": _aware(row.created_at).isoformat(),
        "completedAt": _aware(row.completed_at).isoformat() if row.completed_at else None,
        "remark": last_remark or "",
        "attachments": attachments,
    }
    if detail:
        data["history"] = [_out_event(db, e) for e in events]
    return data


def _load_task(db: Session, actor: User, task_id: UUID) -> Task:
    row = db.get(Task, task_id)
    if not row or row.campus_id != actor.campus_id:
        fail(404, "not_found", "Task not found.")
    role = role_code_for(db, actor)
    if actor.id not in (row.assignee_id, row.assigned_by_id) and role not in VIEW_ALL_ROLES:
        fail(404, "not_found", "Task not found.")
    return row


def assignees(db: Session, actor: User, *, role: str | None) -> list[dict]:
    """Active staff the caller may assign tasks to: only the roles directly below the caller's own role."""
    allowed = TASK_HIERARCHY.get(role_code_for(db, actor), ())
    if not allowed:
        fail(403, "forbidden", "Your role cannot assign tasks.")
    if role and role not in allowed:
        fail(403, "forbidden", f"Your role cannot assign tasks to {role}.")
    stmt = (
        select(User, Role.code)
        .join(Role, Role.id == User.role_id)
        .where(User.campus_id == actor.campus_id, User.is_active.is_(True), User.id != actor.id,
               Role.code.in_(allowed))
        .order_by(Role.code, User.email)
    )
    if role:
        stmt = stmt.where(Role.code == role)
    return [{"id": str(u.id), "email": u.email, "role": code} for u, code in db.execute(stmt).all()
            if code not in NON_STAFF]


def create_task(
    db: Session,
    actor: User,
    *,
    assignee_id: UUID,
    title: str,
    description: str | None,
    priority: str,
    due_date: date,
    client_ref: str | None = None,
) -> dict:
    role = role_code_for(db, actor)
    if role in NON_STAFF:
        fail(403, "forbidden", "Only staff can assign tasks.")
    if role not in TASK_HIERARCHY:
        fail(403, "forbidden", "Your role cannot assign tasks.")
    if client_ref:
        # A retried request (same actor + same key) returns the task already created instead of a duplicate.
        prior = db.scalar(
            select(TaskEvent).where(
                TaskEvent.actor_id == actor.id, TaskEvent.client_ref == client_ref, TaskEvent.action == "assigned"
            )
        )
        if prior:
            existing = db.get(Task, prior.task_id)
            if not existing or existing.assignee_id != assignee_id:
                fail(409, "conflict", "This request reference was already used for a different task.")
            replay = _out_task(db, existing)
            replay["idempotentReplay"] = True
            return replay
    if not title or not title.strip():
        fail(400, "validation_error", "A title is required.")
    if priority not in TASK_PRIORITIES:
        fail(400, "validation_error", f"priority must be one of: {', '.join(TASK_PRIORITIES)}.")
    if due_date < date.today():
        fail(400, "validation_error", "dueDate cannot be in the past.")
    if assignee_id == actor.id:
        fail(400, "validation_error", "You cannot assign a task to yourself.")
    target = db.get(User, assignee_id)
    if not target or target.campus_id != actor.campus_id or not target.is_active:
        fail(400, "validation_error", "Assignee must be an active user of this campus.")
    target_role = role_code_for(db, target)
    if target_role in NON_STAFF:
        fail(400, "validation_error", "Tasks can only be assigned to staff.")
    if target_role not in TASK_HIERARCHY[role]:
        fail(403, "forbidden", f"A {role} cannot assign tasks to a {target_role}.")
    next_no = (db.scalar(select(func.max(Task.task_no)).where(Task.campus_id == actor.campus_id)) or 0) + 1
    row = Task(
        campus_id=actor.campus_id,
        task_no=next_no,
        assigned_by_id=actor.id,
        assigned_by_role=role,
        assignee_id=target.id,
        assignee_role=target_role,
        title=title.strip()[:200],
        description=(description or "").strip() or None,
        priority=priority,
        due_date=due_date,
        status="Incomplete",
    )
    db.add(row)
    db.flush()
    db.add(TaskEvent(task_id=row.id, campus_id=row.campus_id, action="assigned", from_status=None,
                     to_status="Incomplete", actor_id=actor.id, actor_role=role, client_ref=client_ref))
    _notify(db, campus_id=actor.campus_id, title=f"New task: {row.title[:80]}",
            body=f"{priority} priority, due {due_date.isoformat()}.", entity_type="task",
            entity_id=str(row.id), user_id=target.id)
    write_audit(db, action="TASK_ASSIGNED", entity_type="task", entity_id=str(row.id),
                actor_id=actor.id, campus_id=actor.campus_id, details=f"to {target_role}")
    db.commit()
    return _out_task(db, row)


def get_task(db: Session, actor: User, task_id: UUID) -> dict:
    return _out_task(db, _load_task(db, actor, task_id), detail=True)


def list_tasks(db: Session, actor: User, *, box: str, status: str | None) -> list[dict]:
    run_clock(db, actor.campus_id)
    role = role_code_for(db, actor)
    rows = db.scalars(select(Task).where(Task.campus_id == actor.campus_id).order_by(Task.task_no.desc())).all()
    if box == "mine":
        rows = [r for r in rows if r.assignee_id == actor.id]
    elif box == "assigned":
        rows = [r for r in rows if r.assigned_by_id == actor.id]
    elif box == "all":
        if role not in VIEW_ALL_ROLES:
            fail(403, "forbidden", "Not allowed to list all tasks.")
    else:
        fail(400, "validation_error", "box must be mine, assigned or all.")
    events = _task_events(db, [r.id for r in rows])
    files = task_attachments(db, actor.campus_id, [r.id for r in rows])
    out = [_out_task(db, r, events=events.get(r.id, []), attachments=files.get(str(r.id), [])) for r in rows]
    return [o for o in out if o["status"] == status] if status else out


def set_task_status(db: Session, actor: User, task_id: UUID, *, status: str, remark: str | None = None) -> dict:
    row = _load_task(db, actor, task_id)
    if row.assignee_id != actor.id:
        fail(403, "forbidden", "Only the assignee can update a task's status.")
    if status not in TASK_STATUSES:
        fail(400, "validation_error", f"status must be one of: {', '.join(TASK_STATUSES)}.")
    remark = (remark or "").strip() or None
    if remark and len(remark) > 2000:
        fail(400, "validation_error", "remark is too long (max 2000 characters).")
    if status not in TASK_FLOW[row.status]:
        fail(409, "conflict", f"Cannot move a task from {row.status} to {status}.")
    previous = row.status
    row.status = status
    db.add(TaskEvent(task_id=row.id, campus_id=row.campus_id, action="status", from_status=previous,
                     to_status=status, actor_id=actor.id, actor_role=role_code_for(db, actor), remark=remark))
    if status == "Completed":
        row.completed_at = _now()
        body = f"By {actor.email}." + (f" Remark: {remark[:200]}" if remark else "")
        _notify(db, campus_id=row.campus_id, title=f"Task completed: {row.title[:80]}",
                body=body, entity_type="task", entity_id=str(row.id), user_id=row.assigned_by_id)
    write_audit(db, action=f"TASK_{status.upper().replace(' ', '_')}", entity_type="task",
                entity_id=str(row.id), actor_id=actor.id, campus_id=actor.campus_id,
                details="with remark" if remark else None)
    db.commit()
    return _out_task(db, row, detail=True)
