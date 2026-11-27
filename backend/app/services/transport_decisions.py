"""Transport approval decisions (driver fuel / maintenance -> Transport Manager -> Principal).

The decision is saved on ``transport-approval-requests`` and mirrored onto the driver's own request
(``transport-driver-fuel`` / ``transport-driver-maintenance``) by the server in the same transaction, so
neither the Principal page nor the driver page has to write the driver's collection.
"""

from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.deps import role_code_for
from app.models import OpsRecord, User
from app.services.errors import fail

APPROVALS = "transport-approval-requests"
DRIVER_FUEL = "transport-driver-fuel"
DRIVER_MAINTENANCE = "transport-driver-maintenance"

_ADMINS = {"admin", "superadmin", "managing_director"}
FIRST_DECIDERS = {"transportmanager"} | _ADMINS
FINAL_DECIDERS = {"principal", "director"} | _ADMINS

AWAITING_PRINCIPAL = "Awaiting Principal"
OPEN_STATUSES = {"", "Pending", "In-Process", "In Process"}
DECIDED_STATUSES = {AWAITING_PRINCIPAL, "Approved", "Rejected", "Completed"}

# Server-owned decision fields on the driver's own request rows.
_DRIVER_DECISION_FIELDS = (
    "approvalStatus",
    "requestStatus",
    "workflowStatus",
    "decidedBy",
    "decidedByUserId",
    "decidedByRole",
    "decidedAt",
    "decisionRemark",
    "decisionHistory",
)
# Server-owned decision fields on approval rows (a driver re-save must not reset them).
_APPROVAL_DECISION_FIELDS = (
    "status",
    "tmApprovedAt",
    "tmRejectedAt",
    "tmDecidedBy",
    "tmDecidedByUserId",
    "principalApprovedAt",
    "principalRejectedAt",
    "principalDecidedBy",
    "principalDecidedByUserId",
    "decidedBy",
    "decidedByUserId",
    "decidedByRole",
    "decidedAt",
    "decisionRemark",
    "decisionHistory",
)
# Who decided is only ever written by decide(); list saves by any role keep the stored values.
_SERVER_IDENTITY_FIELDS = ("decisionHistory", "decidedByUserId", "tmDecidedByUserId", "principalDecidedByUserId")


def _code(db: Session, actor: User) -> str:
    return role_code_for(db, actor)


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _norm(value) -> str:
    return str(value or "").strip()


def driver_fuel_status(status: str) -> str:
    value = _norm(status).lower()
    if value == "rejected":
        return "Rejected"
    if value in {"approved", "completed"}:
        return "Approved"
    return "Pending"


def driver_maintenance_status(status: str) -> str:
    value = _norm(status).lower()
    if value == "rejected":
        return "Rejected"
    if value in {"approved", "completed"}:
        return "Completed"
    if value in {"awaiting principal", "in-process", "in process"}:
        return "In Progress"
    return "Pending"


def _campus_rows(db: Session, campus_id, collection: str) -> list[OpsRecord]:
    return db.scalars(
        select(OpsRecord).where(OpsRecord.campus_id == campus_id, OpsRecord.collection == collection)
    ).all()


def _linked_driver_row(db: Session, campus_id, approval: dict) -> tuple[OpsRecord | None, str]:
    request_id = _norm(approval.get("requestId") or approval.get("id"))
    if request_id.startswith("FR-"):
        for row in _campus_rows(db, campus_id, DRIVER_FUEL):
            body = row.body or {}
            if request_id in {row.public_id, _norm(body.get("fuelRequestId")), _norm(body.get("id"))}:
                return row, DRIVER_FUEL
    if request_id.startswith("MR-") and (approval.get("source") == "driver-panel" or not approval.get("linkedServiceId")):
        for row in _campus_rows(db, campus_id, DRIVER_MAINTENANCE):
            body = row.body or {}
            if request_id in {row.public_id, _norm(body.get("requestId")), _norm(body.get("id"))}:
                return row, DRIVER_MAINTENANCE
    return None, ""


def _driver_user(db: Session, campus_id, body: dict) -> User | None:
    email = _norm(body.get("driverEmail") or body.get("email")).lower()
    if not email:
        return None
    return db.scalar(select(User).where(User.campus_id == campus_id, User.email == email))


def sync_driver_request(db: Session, actor: User, approval: dict, *, remark: str = "", now: datetime | None = None) -> str | None:
    """Mirror the approval status onto the linked driver request. Returns the driver row id, if any."""
    from app.services.approvals import _notify

    row, collection = _linked_driver_row(db, actor.campus_id, approval)
    if row is None:
        return None
    status = _norm(approval.get("status")) or "Pending"
    body = dict(row.body or {})
    previous = _norm(body.get("workflowStatus"))
    if previous == status:
        return row.public_id
    now = now or _now()
    code = _code(db, actor)
    if collection == DRIVER_FUEL:
        body["approvalStatus"] = driver_fuel_status(status)
    else:
        body["requestStatus"] = driver_maintenance_status(status)
    body["workflowStatus"] = status
    body["decidedBy"] = actor.email or ""
    body["decidedByUserId"] = str(actor.id)
    body["decidedByRole"] = code
    body["decidedAt"] = now.isoformat()
    body["decisionRemark"] = remark
    body["decisionHistory"] = [
        *[entry for entry in (body.get("decisionHistory") or []) if isinstance(entry, dict)],
        {
            "fromStatus": previous or None,
            "toStatus": status,
            "remark": remark,
            "decidedByUserId": str(actor.id),
            "decidedByEmail": actor.email or "",
            "decidedByRole": code,
            "decidedAt": now.isoformat(),
        },
    ]
    row.body = body
    row.updated_at = now
    driver = _driver_user(db, actor.campus_id, body)
    if driver is not None:
        _notify(
            db,
            campus_id=actor.campus_id,
            title=f"Your request {row.public_id} is {status}",
            body=remark[:250] or None,
            entity_type="transport_request",
            entity_id=row.public_id,
            user_id=driver.id,
        )
    return row.public_id


def decide(db: Session, actor: User, request_id: str, body: dict) -> dict:
    """Transport Manager (first) or Principal/Director (final) decision on one approval request."""
    from app.services.approvals import _notify
    from app.services.audit import write_audit

    if not isinstance(body, dict):
        fail(422, "invalid_body", "Body must be a JSON object.")
    decision = _norm(body.get("decision")).lower()
    if decision not in {"approve", "reject"}:
        fail(422, "invalid_body", "decision must be approve or reject.")
    remark = _norm(body.get("remark") or body.get("comment"))
    if len(remark) > 500:
        fail(422, "invalid_body", "Remark can be at most 500 characters.")
    if decision == "reject" and not remark:
        fail(422, "invalid_body", "A remark is required when rejecting.")

    code = _code(db, actor)
    if code not in FIRST_DECIDERS | FINAL_DECIDERS:
        fail(403, "forbidden", "Only the Transport Manager or the Principal can decide transport requests.")
    row = db.scalar(
        select(OpsRecord)
        .where(
            OpsRecord.campus_id == actor.campus_id,
            OpsRecord.collection == APPROVALS,
            OpsRecord.public_id == _norm(request_id),
        )
        .with_for_update()
    )
    if row is None:
        fail(404, "not_found", "Transport approval request not found.")
    item = dict(row.body or {})
    current = _norm(item.get("status"))
    now = _now()
    stamp = now.isoformat()

    if current in OPEN_STATUSES:
        if code not in FIRST_DECIDERS:
            fail(403, "forbidden", "The Transport Manager decides this request first.")
        stage = "transport-manager"
        next_status = AWAITING_PRINCIPAL if decision == "approve" else "Rejected"
        item["tmApprovedAt" if decision == "approve" else "tmRejectedAt"] = stamp
        item["tmDecidedBy"] = actor.email or ""
        item["tmDecidedByUserId"] = str(actor.id)
    elif current == AWAITING_PRINCIPAL:
        if code not in FINAL_DECIDERS:
            fail(403, "forbidden", "Only the Principal or Director gives the final decision.")
        if _norm(item.get("tmDecidedByUserId")) == str(actor.id):
            fail(403, "self_approval", "The final decision must be made by someone other than the first approver.")
        stage = "principal"
        next_status = "Approved" if decision == "approve" else "Rejected"
        item["principalApprovedAt" if decision == "approve" else "principalRejectedAt"] = stamp
        item["principalDecidedBy"] = actor.email or ""
        item["principalDecidedByUserId"] = str(actor.id)
    else:
        fail(409, "invalid_state", f"This request is already {current or 'decided'}.")

    item["status"] = next_status
    item["decidedBy"] = actor.email or ""
    item["decidedByUserId"] = str(actor.id)
    item["decidedByRole"] = code
    item["decidedAt"] = stamp
    item["decisionRemark"] = remark
    item["decisionHistory"] = [
        *[entry for entry in (item.get("decisionHistory") or []) if isinstance(entry, dict)],
        {
            "stage": stage,
            "decision": decision,
            "fromStatus": current or "Pending",
            "toStatus": next_status,
            "remark": remark,
            "decidedByUserId": str(actor.id),
            "decidedByEmail": actor.email or "",
            "decidedByRole": code,
            "decidedAt": stamp,
        },
    ]
    row.body = item
    row.updated_at = now
    driver_row = sync_driver_request(db, actor, item, remark=remark, now=now)
    if next_status == AWAITING_PRINCIPAL:
        _notify(db, campus_id=actor.campus_id, title=f"Transport request {row.public_id} awaits your decision",
                body=_norm(item.get("issueType") or item.get("description"))[:200] or None,
                entity_type="transport_request", entity_id=row.public_id, role_code="principal")
    elif stage == "principal":
        _notify(db, campus_id=actor.campus_id, title=f"Transport request {row.public_id} is {next_status}",
                body=remark[:250] or None, entity_type="transport_request", entity_id=row.public_id,
                role_code="transportmanager")
    write_audit(
        db,
        action="TRANSPORT_REQUEST_DECIDE",
        entity_type="transport_request",
        entity_id=row.public_id,
        actor_id=actor.id,
        campus_id=actor.campus_id,
        details=f"{current or 'Pending'}->{next_status}" + (f" driver:{driver_row}" if driver_row else ""),
    )
    db.commit()
    db.refresh(row)
    result = dict(row.body or {})
    result["id"] = row.public_id
    result["linkedDriverRequestId"] = driver_row
    return result


def guard_list_save(db: Session, actor: User, collection: str, previous: list[dict], items: list) -> list:
    """Whole-list saves cannot overwrite server decisions.

    - A driver never changes the decision fields of an approval row or of their own request rows;
      their new rows always start Pending.
    - Moving an approval row out of "Awaiting Principal" is the Principal's/Director's (or admin's) call.
    """
    if collection not in {APPROVALS, DRIVER_FUEL, DRIVER_MAINTENANCE}:
        return items
    from app.services.ops_collections import _public_id_for

    code = _code(db, actor)
    by_id = {str(row.get("id")): row for row in previous if isinstance(row, dict)}
    guarded = []
    for raw in items:
        if not isinstance(raw, dict):
            guarded.append(raw)
            continue
        public_id = _public_id_for(collection, raw, "")
        origin = by_id.get(public_id)
        row = dict(raw)
        if code == "driver":
            fields = _APPROVAL_DECISION_FIELDS if collection == APPROVALS else _DRIVER_DECISION_FIELDS
            for field in fields:
                if origin is not None and field in origin:
                    row[field] = origin[field]
                else:
                    row.pop(field, None)
            if origin is None:
                initial = {APPROVALS: "status", DRIVER_FUEL: "approvalStatus"}.get(collection, "requestStatus")
                row[initial] = "Pending"
        elif collection == APPROVALS and origin is not None:
            before = _norm(origin.get("status"))
            after = _norm(row.get("status"))
            for field in _SERVER_IDENTITY_FIELDS:
                if field in origin:
                    row[field] = origin[field]
                else:
                    row.pop(field, None)
            if after != before:
                if before in {AWAITING_PRINCIPAL, "Approved", "Rejected"}:
                    legacy_final = before == AWAITING_PRINCIPAL and code in FINAL_DECIDERS
                    work_done = before == "Approved" and after == "Completed"
                    if not (legacy_final or work_done):
                        # A stale list (or a non-final role) cannot undo a recorded decision.
                        for field in _APPROVAL_DECISION_FIELDS:
                            if field in origin:
                                row[field] = origin[field]
                elif after == "Approved" and code not in FINAL_DECIDERS:
                    fail(403, "forbidden", "Only the Principal or Director gives the final approval.")
        guarded.append(row)
    return guarded


def sync_after_list_save(db: Session, actor: User, previous: list[dict], saved: list[dict]) -> None:
    """Status changes saved through the whole-list path are mirrored to the driver's request too."""
    if _code(db, actor) == "driver":
        return
    before = {str(row.get("id")): _norm(row.get("status")) for row in previous if isinstance(row, dict)}
    now = _now()
    changed = False
    for item in saved:
        if not isinstance(item, dict):
            continue
        status = _norm(item.get("status"))
        old = before.get(str(item.get("id")))
        if old == status or (old is None and status in OPEN_STATUSES):
            continue
        if sync_driver_request(db, actor, item, remark=_norm(item.get("decisionRemark")), now=now):
            changed = True
    if changed:
        db.commit()
