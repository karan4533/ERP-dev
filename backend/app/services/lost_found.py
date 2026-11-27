"""Lost & Found register (collection ``hk-lost-found``) with a server-owned status workflow.

Status flow:
    Found -> Claimed -> Handed Over
    Found -> Disposal Requested -> Disposed   (or back to Found when the disposal is refused)

Roles (checked here, not through ops.read/ops.write, because Front Office has no ops permissions):
- Desk (Housekeeping Manager, Front Office / PRM, admins): record found items, record claims,
  hand items over, request disposal of unclaimed items.
- Principal / Director (and admins): read the register and approve or refuse disposal.
- Joint Director: read only.

IDs (LF-<year>-<serial>), identities, timestamps and the append-only history are written by the server.
"""

from __future__ import annotations

import uuid
from datetime import date, datetime, timezone
from zoneinfo import ZoneInfo

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.config import settings
from app.deps import role_code_for
from app.models import FileAsset, OpsRecord, User
from app.services.errors import fail

COLLECTION = "hk-lost-found"

_ADMINS = {"admin", "superadmin", "managing_director"}
DESK_ROLES = {"housekeepingmanager", "prm"} | _ADMINS
DISPOSAL_APPROVERS = {"principal", "director"} | _ADMINS
READER_ROLES = DESK_ROLES | DISPOSAL_APPROVERS | {"jointdirector"}

FOUND = "Found"
CLAIMED = "Claimed"
HANDED_OVER = "Handed Over"
DISPOSAL_REQUESTED = "Disposal Requested"
DISPOSED = "Disposed"
STATUSES = (FOUND, CLAIMED, HANDED_OVER, DISPOSAL_REQUESTED, DISPOSED)
CLAIMANT_TYPES = {"Student", "Parent", "Staff", "Visitor", "Other"}


def _code(db: Session, actor: User) -> str:
    return role_code_for(db, actor)


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _campus_today() -> date:
    return datetime.now(ZoneInfo(settings.campus_timezone)).date()


def _text(body: dict, key: str, *, limit: int, required: bool = False, label: str | None = None) -> str:
    value = str(body.get(key) or "").strip()
    if required and not value:
        fail(422, "invalid_body", f"{label or key} is required.")
    if len(value) > limit:
        fail(422, "invalid_body", f"{label or key} can be at most {limit} characters.")
    return value


def _actor_name(db: Session, actor: User) -> str:
    from app.services.ops_collections import _requester_name

    return _requester_name(db, actor)


def _stamp(db: Session, actor: User, now: datetime) -> dict:
    return {
        "at": now.isoformat(),
        "byUserId": str(actor.id),
        "byEmail": actor.email or "",
        "byName": _actor_name(db, actor),
        "byRole": _code(db, actor),
    }


def _as_item(row: OpsRecord) -> dict:
    body = dict(row.body or {})
    body["id"] = row.public_id
    body.setdefault("history", [])
    body["_updatedAt"] = row.updated_at.isoformat() if row.updated_at else None
    body["_createdAt"] = row.created_at.isoformat() if row.created_at else None
    return body


def permissions_for(code: str) -> dict:
    return {
        "canRead": code in READER_ROLES,
        "canRecord": code in DESK_ROLES,
        "canClaim": code in DESK_ROLES,
        "canHandover": code in DESK_ROLES,
        "canRequestDisposal": code in DESK_ROLES,
        "canDecideDisposal": code in DISPOSAL_APPROVERS,
    }


def _require(db: Session, actor: User, roles: set[str], message: str) -> str:
    code = _code(db, actor)
    if code not in roles:
        fail(403, "forbidden", message)
    return code


def list_items(db: Session, actor: User) -> dict:
    code = _require(db, actor, READER_ROLES, "You are not allowed to view the Lost & Found register.")
    rows = db.scalars(
        select(OpsRecord)
        .where(OpsRecord.campus_id == actor.campus_id, OpsRecord.collection == COLLECTION)
        .order_by(OpsRecord.created_at.desc())
    ).all()
    return {"items": [_as_item(row) for row in rows], "permissions": permissions_for(code)}


def _locked(db: Session, actor: User, item_id: str) -> OpsRecord:
    row = db.scalar(
        select(OpsRecord)
        .where(
            OpsRecord.campus_id == actor.campus_id,
            OpsRecord.collection == COLLECTION,
            OpsRecord.public_id == str(item_id or "").strip(),
        )
        .with_for_update()
    )
    if row is None:
        fail(404, "not_found", "Lost & Found item not found.")
    return row


def _found_date(value: str) -> str:
    try:
        parsed = date.fromisoformat(value)
    except ValueError:
        fail(422, "invalid_body", "Found date must be a date (YYYY-MM-DD).")
    if parsed > _campus_today():
        fail(422, "invalid_body", "Found date cannot be in the future.")
    return parsed.isoformat()


def _photo_file_id(db: Session, actor: User, value: str) -> str | None:
    if not value:
        return None
    try:
        file_id = uuid.UUID(value)
    except ValueError:
        fail(422, "invalid_body", "photoFileId must be an uploaded file id.")
    asset = db.get(FileAsset, file_id)
    if asset is None or asset.campus_id != actor.campus_id:
        fail(422, "invalid_body", "The photo file was not found.")
    return str(file_id)


def _audit(db: Session, actor: User, action: str, item_id: str, details: str) -> None:
    from app.services.audit import write_audit

    write_audit(
        db,
        action=action,
        entity_type="lost_found",
        entity_id=item_id,
        actor_id=actor.id,
        campus_id=actor.campus_id,
        details=details[:250],
    )


def _transition(db: Session, actor: User, row: OpsRecord, *, expected: set[str], to_status: str,
                event: str, note: str, updates: dict) -> dict:
    item = dict(row.body or {})
    current = str(item.get("status") or FOUND)
    if current not in expected:
        fail(409, "invalid_state", f"This item is {current}; it cannot be {event.lower()} now.")
    now = _now()
    stamp = _stamp(db, actor, now)
    item.update(updates(stamp) if callable(updates) else updates)
    item["status"] = to_status
    item["history"] = [
        *[entry for entry in (item.get("history") or []) if isinstance(entry, dict)],
        {**stamp, "event": event, "fromStatus": current, "toStatus": to_status, "note": note},
    ]
    row.body = item
    row.updated_at = now
    return item


def create_item(db: Session, actor: User, body: dict) -> dict:
    _require(db, actor, DESK_ROLES, "Only Housekeeping, Front Office or admins can record found items.")
    if not isinstance(body, dict):
        fail(422, "invalid_body", "Body must be a JSON object.")
    description = _text(body, "description", limit=1000, required=True, label="Description")
    location = _text(body, "foundLocation", limit=200, required=True, label="Found location")
    found_by = _text(body, "foundBy", limit=120, required=True, label="Found by")
    found_date = _found_date(_text(body, "foundDate", limit=10, required=True, label="Found date"))
    item_name = _text(body, "item", limit=120) or description[:60]
    photo = _photo_file_id(db, actor, _text(body, "photoFileId", limit=64))

    now = _now()
    stamp = _stamp(db, actor, now)
    payload = {
        "item": item_name,
        "description": description,
        "foundLocation": location,
        "foundDate": found_date,
        "foundBy": found_by,
        "photoFileId": photo,
        "status": FOUND,
        "recordedByUserId": stamp["byUserId"],
        "recordedByEmail": stamp["byEmail"],
        "recordedByName": stamp["byName"],
        "recordedByRole": stamp["byRole"],
        "recordedAt": stamp["at"],
        "history": [{**stamp, "event": "Recorded", "fromStatus": None, "toStatus": FOUND, "note": item_name}],
    }
    prefix = f"LF-{now.year}-"
    row = None
    for _attempt in range(10):
        taken = db.scalars(
            select(OpsRecord.public_id).where(
                OpsRecord.campus_id == actor.campus_id,
                OpsRecord.collection == COLLECTION,
                OpsRecord.public_id.like(f"{prefix}%"),
            )
        ).all()
        serial = max(
            (int(code[len(prefix):]) for code in taken if code[len(prefix):].isdigit()),
            default=0,
        ) + 1
        public_id = f"{prefix}{serial:04d}"
        candidate = OpsRecord(
            id=uuid.uuid4(),
            campus_id=actor.campus_id,
            collection=COLLECTION,
            public_id=public_id,
            body={**payload, "id": public_id},
            created_by=actor.id,
            updated_at=now,
        )
        try:
            with db.begin_nested():
                db.add(candidate)
                db.flush()
            row = candidate
            break
        except IntegrityError:
            continue
    if row is None:
        fail(409, "code_conflict", "Could not number the item. Please try again.")
    _audit(db, actor, "LOST_FOUND_RECORDED", row.public_id, f"{item_name} @ {location}")
    db.commit()
    db.refresh(row)
    return _as_item(row)


def claim_item(db: Session, actor: User, item_id: str, body: dict) -> dict:
    _require(db, actor, DESK_ROLES, "Only Housekeeping, Front Office or admins can record a claim.")
    if not isinstance(body, dict):
        fail(422, "invalid_body", "Body must be a JSON object.")
    name = _text(body, "claimantName", limit=120, required=True, label="Claimant name")
    contact = _text(body, "claimantContact", limit=120, required=True, label="Claimant contact")
    proof = _text(body, "proofNote", limit=1000, required=True, label="Proof of ownership")
    claimant_type = _text(body, "claimantType", limit=20) or "Other"
    if claimant_type not in CLAIMANT_TYPES:
        fail(422, "invalid_body", f"Claimant type must be one of: {', '.join(sorted(CLAIMANT_TYPES))}.")
    identity = _text(body, "claimantIdentity", limit=120)

    row = _locked(db, actor, item_id)
    _transition(
        db, actor, row,
        expected={FOUND},
        to_status=CLAIMED,
        event="Claimed",
        note=f"Claimed by {name} ({claimant_type})",
        updates=lambda stamp: {
            "claimantName": name,
            "claimantType": claimant_type,
            "claimantIdentity": identity,
            "claimantContact": contact,
            "proofNote": proof,
            "claimRecordedByUserId": stamp["byUserId"],
            "claimRecordedByName": stamp["byName"],
            "claimRecordedAt": stamp["at"],
        },
    )
    _audit(db, actor, "LOST_FOUND_CLAIMED", row.public_id, name)
    db.commit()
    db.refresh(row)
    return _as_item(row)


def handover_item(db: Session, actor: User, item_id: str, body: dict) -> dict:
    _require(db, actor, DESK_ROLES, "Only Housekeeping, Front Office or admins can hand items over.")
    if not isinstance(body, dict):
        fail(422, "invalid_body", "Body must be a JSON object.")
    handed_to = _text(body, "handedTo", limit=120, required=True, label="Handed to")
    note = _text(body, "handoverNote", limit=500)

    row = _locked(db, actor, item_id)
    _transition(
        db, actor, row,
        expected={CLAIMED},
        to_status=HANDED_OVER,
        event="Handed Over",
        note=f"Handed to {handed_to}" + (f" - {note}" if note else ""),
        updates=lambda stamp: {
            "handedTo": handed_to,
            "handoverNote": note,
            "handedOverByUserId": stamp["byUserId"],
            "handedOverByEmail": stamp["byEmail"],
            "handedOverByName": stamp["byName"],
            "handedOverAt": stamp["at"],
        },
    )
    _audit(db, actor, "LOST_FOUND_HANDED_OVER", row.public_id, handed_to)
    db.commit()
    db.refresh(row)
    return _as_item(row)


def request_disposal(db: Session, actor: User, item_id: str, body: dict) -> dict:
    from app.services.approvals import _notify

    _require(db, actor, DESK_ROLES, "Only Housekeeping, Front Office or admins can request disposal.")
    if not isinstance(body, dict):
        fail(422, "invalid_body", "Body must be a JSON object.")
    reason = _text(body, "reason", limit=500, required=True, label="Reason")

    row = _locked(db, actor, item_id)
    item = _transition(
        db, actor, row,
        expected={FOUND},
        to_status=DISPOSAL_REQUESTED,
        event="Disposal Requested",
        note=reason,
        updates=lambda stamp: {
            "disposalReason": reason,
            "disposalRequestedByUserId": stamp["byUserId"],
            "disposalRequestedByName": stamp["byName"],
            "disposalRequestedAt": stamp["at"],
        },
    )
    _notify(
        db,
        campus_id=actor.campus_id,
        title=f"Lost & Found disposal awaiting approval: {row.public_id}",
        body=f"{item.get('item') or ''}: {reason}"[:250],
        entity_type="lost_found",
        entity_id=row.public_id,
        role_code="principal",
    )
    _audit(db, actor, "LOST_FOUND_DISPOSAL_REQUESTED", row.public_id, reason)
    db.commit()
    db.refresh(row)
    return _as_item(row)


def decide_disposal(db: Session, actor: User, item_id: str, body: dict) -> dict:
    from app.services.approvals import _notify

    _require(db, actor, DISPOSAL_APPROVERS, "Only the Principal, Director or admins can decide disposal.")
    if not isinstance(body, dict):
        fail(422, "invalid_body", "Body must be a JSON object.")
    decision = str(body.get("decision") or "").strip().lower()
    if decision not in {"approve", "reject"}:
        fail(422, "invalid_body", "decision must be approve or reject.")
    remark = _text(body, "remark", limit=500, required=decision == "reject", label="Remark")

    row = _locked(db, actor, item_id)
    requester = str((row.body or {}).get("disposalRequestedByUserId") or "")
    if requester and requester == str(actor.id):
        fail(403, "self_approval", "You requested this disposal, so someone else must decide it.")
    approved = decision == "approve"
    _transition(
        db, actor, row,
        expected={DISPOSAL_REQUESTED},
        to_status=DISPOSED if approved else FOUND,
        event="Disposal Approved" if approved else "Disposal Refused",
        note=remark,
        updates=lambda stamp: {
            "disposalDecision": "Approved" if approved else "Refused",
            "disposalDecisionRemark": remark,
            "disposalDecidedByUserId": stamp["byUserId"],
            "disposalDecidedByName": stamp["byName"],
            "disposalDecidedAt": stamp["at"],
            **({"disposedAt": stamp["at"]} if approved else {}),
        },
    )
    if requester:
        try:
            requester_id = uuid.UUID(requester)
        except ValueError:
            requester_id = None
        if requester_id is not None:
            _notify(
                db,
                campus_id=actor.campus_id,
                title=f"Lost & Found {row.public_id}: disposal {'approved' if approved else 'refused'}",
                body=remark[:250] or None,
                entity_type="lost_found",
                entity_id=row.public_id,
                user_id=requester_id,
            )
    _audit(db, actor, "LOST_FOUND_DISPOSAL_DECIDED", row.public_id, decision)
    db.commit()
    db.refresh(row)
    return _as_item(row)


def guard_generic_write(collection: str) -> None:
    """The register (and its history) changes only through the Lost & Found endpoints."""
    if collection == COLLECTION:
        fail(400, "use_lost_found_endpoint", "Lost & Found items are changed through the Lost & Found actions.")
