"""Joint Director inbox for department requests (Housekeeping, IT, Canteen).

Department managers raise requests in their own collections (``hk-requests``, ``it-requests``,
``canteen-requests``). The Joint Director (and admins) receive them here and approve or reject with a
remark; the server stamps who decided and when, appends to the decision history and notifies the raiser.
Department whole-list saves cannot set or overwrite that decision.
"""

from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.deps import role_code_for
from app.models import OpsRecord, User
from app.services.errors import fail

# collection -> (department label, raising role)
DEPARTMENT_COLLECTIONS: dict[str, tuple[str, str]] = {
    "hk-requests": ("Housekeeping", "housekeepingmanager"),
    "it-requests": ("IT Support", "itsupportmanager"),
    "canteen-requests": ("Canteen", "canteenmanager"),
}
_ADMINS = {"admin", "superadmin", "managing_director"}
DECIDERS = {"jointdirector"} | _ADMINS
READERS = DECIDERS | {"jointdirectorassistant"}
OPEN_STATUSES = {"Pending", "Submitted"}
# Written only by decide(); a department save keeps the stored values.
DECISION_FIELDS = (
    "status",
    "approvalStatus",
    "currentStage",
    "approvalDate",
    "jdDecision",
    "decidedBy",
    "decidedByName",
    "decidedByUserId",
    "decidedByRole",
    "decidedAt",
    "decisionRemark",
    "decisionHistory",
)


def _code(db: Session, actor: User) -> str:
    return role_code_for(db, actor)


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _as_item(row: OpsRecord, department: str) -> dict:
    body = dict(row.body or {})
    body["id"] = row.public_id
    body["collection"] = row.collection
    body.setdefault("department", department)
    body["decidable"] = str(body.get("status") or "Pending") in OPEN_STATUSES
    body["_updatedAt"] = row.updated_at.isoformat() if row.updated_at else None
    body["_createdAt"] = row.created_at.isoformat() if row.created_at else None
    return body


def list_inbox(db: Session, actor: User) -> dict:
    code = _code(db, actor)
    if code not in READERS:
        fail(403, "forbidden", "Only the Joint Director can view the department request inbox.")
    rows = db.scalars(
        select(OpsRecord)
        .where(
            OpsRecord.campus_id == actor.campus_id,
            OpsRecord.collection.in_(sorted(DEPARTMENT_COLLECTIONS)),
        )
        .order_by(OpsRecord.created_at.desc())
    ).all()
    items = [_as_item(row, DEPARTMENT_COLLECTIONS[row.collection][0]) for row in rows]
    return {"items": items, "canDecide": code in DECIDERS}


def _raiser_ids(body: dict) -> set[str]:
    ids = {str(body.get(key) or "").strip() for key in ("raisedByUserId", "requestedByUserId", "createdByUserId")}
    return {value for value in ids if value}


def _raiser_emails(body: dict) -> set[str]:
    emails = {
        str(body.get(key) or "").strip().lower()
        for key in ("raisedByEmail", "requestedByEmail", "createdByEmail")
    }
    return {value for value in emails if "@" in value}


def decide(db: Session, actor: User, collection: str, request_id: str, body: dict) -> dict:
    from app.services.approvals import _notify
    from app.services.audit import write_audit
    from app.services.ops_collections import _requester_name

    if collection not in DEPARTMENT_COLLECTIONS:
        fail(404, "not_found", "That department request collection does not exist.")
    code = _code(db, actor)
    if code not in DECIDERS:
        fail(403, "forbidden", "Only the Joint Director can approve or reject department requests.")
    if not isinstance(body, dict):
        fail(422, "invalid_body", "Body must be a JSON object.")
    decision = str(body.get("decision") or "").strip().lower()
    if decision not in {"approve", "reject"}:
        fail(422, "invalid_body", "decision must be approve or reject.")
    remark = str(body.get("remark") or body.get("comment") or "").strip()
    if len(remark) > 1000:
        fail(422, "invalid_body", "Remark can be at most 1000 characters.")
    if decision == "reject" and not remark:
        fail(422, "invalid_body", "A remark is required when rejecting.")

    row = db.scalar(
        select(OpsRecord)
        .where(
            OpsRecord.campus_id == actor.campus_id,
            OpsRecord.collection == collection,
            OpsRecord.public_id == str(request_id or "").strip(),
        )
        .with_for_update()
    )
    if row is None:
        fail(404, "not_found", "Department request not found.")
    item = dict(row.body or {})
    current = str(item.get("status") or "Pending")
    if current not in OPEN_STATUSES:
        fail(409, "invalid_state", f"This request is already {current}.")
    if str(actor.id) in _raiser_ids(item) or (actor.email or "").strip().lower() in _raiser_emails(item):
        fail(403, "self_approval", "You raised this request, so someone else must decide it.")

    department, raiser_role = DEPARTMENT_COLLECTIONS[collection]
    now = _now()
    status = "Approved" if decision == "approve" else "Rejected"
    name = _requester_name(db, actor)
    item.update(
        {
            "status": status,
            "approvalStatus": status,
            "currentStage": "Approved / Rejected",
            "approvalDate": now.strftime("%d-%m-%Y"),
            "jdDecision": status,
            "decidedBy": actor.email or "",
            "decidedByName": name,
            "decidedByUserId": str(actor.id),
            "decidedByRole": code,
            "decidedAt": now.isoformat(),
            "decisionRemark": remark,
        }
    )
    item["decisionHistory"] = [
        *[entry for entry in (item.get("decisionHistory") or []) if isinstance(entry, dict)],
        {
            "decision": decision,
            "fromStatus": current,
            "toStatus": status,
            "remark": remark,
            "decidedByUserId": str(actor.id),
            "decidedByEmail": actor.email or "",
            "decidedByName": name,
            "decidedByRole": code,
            "decidedAt": now.isoformat(),
        },
    ]
    row.body = item
    row.updated_at = now

    title = f"{department} request {row.public_id} {status.lower()} by Joint Director"
    message = (remark or str(item.get("title") or item.get("purpose") or ""))[:250] or None
    raiser_users = []
    emails = _raiser_emails(item)
    if emails:
        raiser_users = db.scalars(
            select(User).where(User.campus_id == actor.campus_id, User.email.in_(sorted(emails)))
        ).all()
    if raiser_users:
        for user in raiser_users:
            _notify(db, campus_id=actor.campus_id, title=title, body=message,
                    entity_type="department_request", entity_id=row.public_id, user_id=user.id)
    else:
        _notify(db, campus_id=actor.campus_id, title=title, body=message,
                entity_type="department_request", entity_id=row.public_id, role_code=raiser_role)
    write_audit(
        db,
        action="DEPARTMENT_REQUEST_DECIDE",
        entity_type=collection,
        entity_id=row.public_id,
        actor_id=actor.id,
        campus_id=actor.campus_id,
        details=f"{current}->{status}",
    )
    db.commit()
    db.refresh(row)
    return _as_item(row, department)


def guard_list_save(db: Session, actor: User, collection: str, previous: list[dict], items: list) -> list:
    """Department saves keep the JD decision, start new requests as Pending, stamp the raiser, and never
    drop a request the JD has already decided."""
    if collection not in DEPARTMENT_COLLECTIONS:
        return items
    from app.services.ops_collections import _public_id_for

    by_id = {str(row.get("id")): row for row in previous if isinstance(row, dict)}
    now = _now().isoformat()
    incoming: set[str] = set()
    guarded = []
    for raw in items:
        if not isinstance(raw, dict):
            guarded.append(raw)
            continue
        row = dict(raw)
        public_id = _public_id_for(collection, row, "")
        incoming.add(public_id)
        origin = by_id.get(public_id)
        if origin is None:
            for field in DECISION_FIELDS:
                row.pop(field, None)
            row["status"] = "Pending"
            row["raisedByUserId"] = str(actor.id)
            row["raisedByEmail"] = actor.email or ""
            row.setdefault("raisedAt", now)
        else:
            for field in DECISION_FIELDS:
                if field in origin:
                    row[field] = origin[field]
                else:
                    row.pop(field, None)
            for field in ("raisedByUserId", "raisedByEmail", "raisedAt"):
                if field in origin:
                    row[field] = origin[field]
        guarded.append(row)
    kept = [
        {key: value for key, value in row.items() if not str(key).startswith("_")}
        for public_id, row in by_id.items()
        if public_id not in incoming and row.get("decisionHistory")
    ]
    return [*guarded, *kept]
