"""Business-event notifications.

A saved record is notified only when its tracked fields change, and only to a
role that is allowed to see that work. The message names the record id and
status. It does not copy student, finance, or audit detail. Delivery never
raises and never changes the saved record.
"""

from __future__ import annotations

import logging

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Role, User
from app.services.integrations.notify import notify_event

log = logging.getLogger(__name__)

# collection → (recipient roles, fields that count as a new notification)
OPS_ROLE_EVENTS: dict[str, tuple[tuple[str, ...], tuple[str, ...]]] = {
    "gate-visitors": (("gatekeeper", "gatekeepermanager"), ("status",)),
    "it-support-tickets": (("itsupportmanager",), ("status",)),
    "it-requests": (("itsupportmanager",), ("status",)),
    "canteen-orders": (("canteenmanager",), ("status",)),
    "canteen-requests": (("canteenmanager",), ("status",)),
    "stationery-requests": (("stationerystoremanager",), ("status",)),
    "stationery-stock-issues": (("stationerystoremanager",), ("status",)),
    "hk-schedules": (("housekeepingmanager",), ("status",)),
    "hk-tasks": (("housekeepingmanager",), ("status",)),
    "hk-checklists": (("housekeepingmanager",), ("status",)),
    "hk-duty-allotments": (("housekeepingmanager",), ("status",)),
    "maint-requests": (("maintenancemanager",), ("status",)),
    "maint-duty-allotments": (("maintenancemanager",), ("status",)),
    "maint-schedules": (("maintenancemanager",), ("status",)),
    "maint-checklists": (("maintenancemanager",), ("status",)),
    "maint-inventory": (("maintenancemanager",), ("status", "quantity")),
    "maint-inventory-requirements": (("maintenancemanager",), ("status",)),
    "maint-procurement": (("maintenancemanager",), ("status",)),
    "transport-duties": (("transportmanager",), ("status", "vehicleNumber")),
    "transport-driver-my-duties": (("transportmanager",), ("status",)),
    "transport-approval-requests": (("transportmanager",), ("status",)),
    "transport-student-assignments": (("transportmanager",), ("studentId", "routeId", "vehicleNumber")),
    "stationery-inventory": (("stationerystoremanager",), ("status", "availableQuantity")),
    "hk-inventory": (("housekeepingmanager",), ("status", "availableQuantity")),
    "canteen-inventory": (("canteenmanager",), ("status", "availableQuantity")),
    "it-assets": (("itsupportmanager",), ("status",)),
    "hk-requests": (("housekeepingmanager",), ("status",)),
}

AUDIT_ASSIGNMENT_ROLES = {
    "jointdirectoraudit",
    "processauditor",
    "qualityauditor",
    "jointdirector",
}

_SUBJECTS = {
    "gate-visitors": "QMIS ERP gate record updated",
    "it-support-tickets": "QMIS ERP ticket updated",
    "it-requests": "QMIS ERP IT request updated",
    "canteen-orders": "QMIS ERP canteen order updated",
    "canteen-requests": "QMIS ERP canteen request updated",
    "stationery-requests": "QMIS ERP stationery request updated",
    "stationery-stock-issues": "QMIS ERP stationery stock updated",
    "hk-schedules": "QMIS ERP housekeeping schedule updated",
    "hk-tasks": "QMIS ERP housekeeping task updated",
    "hk-checklists": "QMIS ERP housekeeping checklist updated",
    "hk-duty-allotments": "QMIS ERP housekeeping duty updated",
    "transport-duties": "QMIS ERP transport duty updated",
    "transport-driver-my-duties": "QMIS ERP driver duty updated",
    "transport-approval-requests": "QMIS ERP transport approval updated",
    "transport-student-assignments": "QMIS ERP transport assignment updated",
    "stationery-inventory": "QMIS ERP stationery stock updated",
    "hk-inventory": "QMIS ERP housekeeping stock updated",
    "canteen-inventory": "QMIS ERP canteen stock updated",
    "it-assets": "QMIS ERP IT asset updated",
    "hk-requests": "QMIS ERP housekeeping request updated",
    "maint-requests": "QMIS ERP maintenance request updated",
    "maint-duty-allotments": "QMIS ERP maintenance duty updated",
    "maint-schedules": "QMIS ERP maintenance schedule updated",
    "maint-checklists": "QMIS ERP maintenance checklist updated",
    "maint-inventory": "QMIS ERP maintenance materials updated",
    "maint-inventory-requirements": "QMIS ERP maintenance inventory requirement updated",
    "maint-procurement": "QMIS ERP maintenance purchase workflow updated",
    "library-issues": "QMIS ERP library loan updated",
    "audit-assignments": "QMIS ERP audit assignment updated",
}


def changed_public_ids(previous: list, current: list, fields: tuple[str, ...]) -> list[str]:
    before = {}
    for item in previous or []:
        if isinstance(item, dict) and item.get("id"):
            before[str(item["id"])] = _fingerprint(item, fields)
    changed: list[str] = []
    for item in current or []:
        if not isinstance(item, dict) or not item.get("id"):
            continue
        public_id = str(item["id"])
        if before.get(public_id) != _fingerprint(item, fields):
            changed.append(public_id)
    return changed


def emails_for_roles(db: Session, campus_id, role_codes: list[str] | tuple[str, ...]) -> list[str]:
    codes = [code for code in role_codes if code]
    if not codes or campus_id is None:
        return []
    rows = db.execute(
        select(User.email)
        .join(Role, User.role_id == Role.id)
        .where(
            User.campus_id == campus_id,
            User.is_active.is_(True),
            Role.code.in_(codes),
        )
    ).all()
    found: list[str] = []
    for (email,) in rows:
        cleaned = str(email or "").strip().lower()
        if "@" not in cleaned or cleaned in found:
            continue
        found.append(cleaned)
    return found


def notify_roles(
    db: Session,
    *,
    campus_id,
    role_codes: list[str] | tuple[str, ...],
    event_key: str,
    subject: str,
    body: str,
) -> None:
    for email in emails_for_roles(db, campus_id, role_codes):
        notify_event(
            event_key=f"{event_key}:{email}",
            email=email,
            subject=subject,
            body=body,
        )


def notify_saved_ops(db: Session, actor, collection: str, previous: list, current: list) -> None:
    try:
        if collection == "library-issues":
            _notify_library(db, actor, previous, current)
            return
        spec = OPS_ROLE_EVENTS.get(collection)
        if spec is None:
            return
        roles, fields = spec
        _notify_ids(
            db,
            actor,
            collection=collection,
            previous=previous,
            current=current,
            fields=fields,
            role_codes=roles,
        )
    except Exception:
        log.warning("ops_notification_failed", extra={"collection": collection})


def notify_saved_audit(db: Session, actor, collection: str, previous: list, current: list) -> None:
    if collection != "audit-assignments":
        return
    try:
        changed = changed_public_ids(previous, current, ("status", "auditorRole", "owner"))
        by_id = {str(item.get("id")): item for item in current if isinstance(item, dict)}
        for public_id in changed:
            item = by_id.get(public_id) or {}
            role = str(item.get("auditorRole") or "").strip().lower()
            roles = [role] if role in AUDIT_ASSIGNMENT_ROLES else ["jointdirectoraudit"]
            notify_roles(
                db,
                campus_id=actor.campus_id,
                role_codes=roles,
                event_key=f"audit-assignments:{actor.campus_id}:{public_id}:{_fingerprint(item, ('status', 'auditorRole'))}",
                subject=_SUBJECTS["audit-assignments"],
                body=(
                    f"Audit assignment {public_id} was saved. "
                    "Open QMIS ERP to review it. Evidence is not included in this message."
                ),
            )
    except Exception:
        log.warning("audit_notification_failed")


def _notify_ids(db, actor, *, collection, previous, current, fields, role_codes) -> None:
    for public_id in changed_public_ids(previous, current, fields):
        item = next((row for row in current if isinstance(row, dict) and str(row.get("id")) == public_id), {})
        status = str(item.get("status") or "updated")
        notify_roles(
            db,
            campus_id=actor.campus_id,
            role_codes=role_codes,
            event_key=f"{collection}:{actor.campus_id}:{public_id}:{_fingerprint(item, fields)}",
            subject=_SUBJECTS.get(collection, "QMIS ERP record updated"),
            body=(
                f"Record {public_id} is {status}. Open QMIS ERP to review it. "
                "Personal and financial details are not included in this message."
            ),
        )


def _notify_library(db, actor, previous, current) -> None:
    """Email the borrower only when the member record stores an email address."""
    changed = changed_public_ids(previous, current, ("status", "dueDate", "memberId"))
    if not changed:
        return
    members = _member_emails(db, actor)
    by_id = {str(item.get("id")): item for item in current if isinstance(item, dict)}
    for public_id in changed:
        item = by_id.get(public_id) or {}
        email = _borrower_email(item, members)
        if not email:
            continue
        status = str(item.get("status") or "updated")
        notify_event(
            event_key=f"library-issues:{actor.campus_id}:{public_id}:{email}:{status}",
            email=email,
            subject=_SUBJECTS["library-issues"],
            body=(
                f"Your library record {public_id} is {status}. "
                "Open QMIS ERP for the due date. Other borrowers are not listed."
            ),
        )


def _member_emails(db, actor) -> dict[str, str]:
    from app.models import OpsRecord

    rows = db.scalars(
        select(OpsRecord).where(
            OpsRecord.campus_id == actor.campus_id,
            OpsRecord.collection == "library-members",
        )
    ).all()
    found: dict[str, str] = {}
    for row in rows:
        body = row.body if isinstance(row.body, dict) else {}
        email = str(body.get("email") or body.get("memberEmail") or "").strip().lower()
        if "@" not in email:
            continue
        if body.get("id"):
            found[str(body["id"])] = email
        if body.get("name"):
            found[str(body["name"]).strip().lower()] = email
    return found


def _borrower_email(item: dict, members: dict[str, str]) -> str:
    direct = str(item.get("email") or item.get("memberEmail") or "").strip().lower()
    if "@" in direct:
        return direct
    member_id = str(item.get("memberId") or "")
    if member_id and member_id in members:
        return members[member_id]
    name = str(item.get("memberName") or "").strip().lower()
    return members.get(name, "")


def _fingerprint(item: dict, fields: tuple[str, ...]) -> str:
    return "|".join(str(item.get(field) or "") for field in fields)
