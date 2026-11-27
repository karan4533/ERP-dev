"""Campus audit trail for Super Admin / finance readers (`audit.read`).

Actor identity is resolved from `actor_id` when present. Rows with no actor
are returned as System (genuine unattended / bootstrap events only).
"""

from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.deps import permission_codes_for, require_permission
from app.models import AuditLog, HrEmployee, Role, User, UserProfile
from app.services.errors import fail

router = APIRouter(prefix="/api/v1/audit-logs", tags=["audit"])

# Entity types whose audit details carry per-student data: a reader also needs this permission.
DETAIL_PERMISSION = {"student_attendance": "attendance.read"}


def _join_name(*parts: str | None) -> str:
    return " ".join(part for part in parts if part).strip()


def _actor_maps(db: Session, rows: list[AuditLog]) -> dict[UUID, dict]:
    ids = {row.actor_id for row in rows if row.actor_id}
    if not ids:
        return {}
    users = {
        user.id: user
        for user in db.scalars(select(User).where(User.id.in_(ids))).all()
    }
    profiles = {
        profile.user_id: profile
        for profile in db.scalars(select(UserProfile).where(UserProfile.user_id.in_(ids))).all()
    }
    hr_by_user = {
        row.user_id: row
        for row in db.scalars(select(HrEmployee).where(HrEmployee.user_id.in_(ids))).all()
        if row.user_id
    }
    emails = {user.email.lower() for user in users.values() if user.email}
    hr_by_email = {
        row.email.lower(): row
        for row in db.scalars(select(HrEmployee).where(HrEmployee.email.in_(emails))).all()
    } if emails else {}
    role_ids = {user.role_id for user in users.values()}
    roles = {
        role.id: role
        for role in db.scalars(select(Role).where(Role.id.in_(role_ids))).all()
    } if role_ids else {}
    out: dict[UUID, dict] = {}
    for actor_id, user in users.items():
        role = roles.get(user.role_id)
        profile = profiles.get(actor_id)
        hr = hr_by_user.get(actor_id) or hr_by_email.get((user.email or "").lower())
        name = ""
        if profile is not None:
            name = _join_name(profile.first_name, profile.middle_name, profile.last_name)
        if not name and hr is not None:
            name = _join_name(hr.first_name, hr.last_name)
        out[actor_id] = {
            "actor_id": str(actor_id),
            "actor_email": user.email or "",
            "actor_name": name or (user.email or "User"),
            "actor_role": role.code if role else "",
            "actor_role_label": role.name if role else "",
        }
    return out


def _serialize(row: AuditLog, actors: dict[UUID, dict], granted: set[str]) -> dict:
    actor = actors.get(row.actor_id) if row.actor_id else None
    detail_perm = DETAIL_PERMISSION.get(row.entity_type, "audit.read")
    details = row.details if detail_perm in granted else None
    return {
        "id": str(row.id),
        "action": row.action,
        "entity_type": row.entity_type,
        "entity_id": row.entity_id,
        "details": details,
        "created_at": row.created_at.isoformat() if row.created_at else None,
        "actor_id": actor["actor_id"] if actor else (str(row.actor_id) if row.actor_id else None),
        "actor_email": actor["actor_email"] if actor else None,
        "actor_name": actor["actor_name"] if actor else ("System" if row.actor_id is None else "Unknown user"),
        "actor_role": actor["actor_role"] if actor else ("system" if row.actor_id is None else ""),
        "actor_role_label": actor["actor_role_label"] if actor else ("System" if row.actor_id is None else ""),
        # IP is not stored on audit_logs today — surface null rather than inventing values.
        "ip_address": None,
    }


@router.get("")
def list_audit_logs(
    db: Session = Depends(get_db),
    user: User = Depends(require_permission("audit.read")),
) -> list[dict]:
    granted = set(permission_codes_for(db, user))
    # Campus-scoped rows plus campus-less auth/system events (LOGIN_FAILED, locks, etc.).
    rows = db.scalars(
        select(AuditLog)
        .where(or_(AuditLog.campus_id == user.campus_id, AuditLog.campus_id.is_(None)))
        .order_by(AuditLog.created_at.desc())
    ).all()
    actors = _actor_maps(db, rows)
    return [_serialize(row, actors, granted) for row in rows]


@router.get("/{log_id}")
def get_audit_log(
    log_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(require_permission("audit.read")),
) -> dict:
    try:
        uid = UUID(str(log_id))
    except ValueError:
        fail(404, "not_found", "Audit log not found.")
    row = db.scalar(
        select(AuditLog).where(
            AuditLog.id == uid,
            or_(AuditLog.campus_id == user.campus_id, AuditLog.campus_id.is_(None)),
        )
    )
    if row is None:
        fail(404, "not_found", "Audit log not found.")
    granted = set(permission_codes_for(db, user))
    actors = _actor_maps(db, [row])
    return _serialize(row, actors, granted)
