"""Stationery store workflows with server-side stock and approval guards.

Authoritative collections:
- stationery-inventory
- stationery-issue-returns
- stationery-requests
- stationery-procurement

Client whole-list arithmetic is not trusted for stock deduction, GRN, or JD/Finance decisions.
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from sqlalchemy.orm.attributes import flag_modified

from app.deps import role_code_for
from app.models import OpsRecord, User
from app.services.audit import write_audit
from app.services.errors import fail

INV = "stationery-inventory"
MOVEMENTS = "stationery-issue-returns"
REQUESTS = "stationery-requests"
# Internal counter row for request numbers (not an API collection).
REQUEST_SEQUENCE = "stationery-request-sequence"
PROCUREMENT = "stationery-procurement"
STOCK_ISSUES = "stationery-stock-issues"

_STORE = {"stationerystoremanager", "admin", "superadmin", "managing_director"}
_JD = {"jointdirector", "jointdirectorassistant", "admin", "superadmin", "managing_director"}
_FINANCE = {
    "financemanager",
    "accounthead",
    "finance_assistant",
    "accountassistant",
    "admin",
    "superadmin",
    "managing_director",
}
_REQUEST_DECIDERS = _STORE | {"principal", "director"}

# Department managers who may raise "Request Product from Store"; the department is server-assigned.
REQUESTOR_DEPARTMENTS = {
    "housekeepingmanager": "Housekeeping",
    "maintenancemanager": "Maintenance",
    "transportmanager": "Transport",
    "itsupportmanager": "IT Support",
    "canteenmanager": "Canteen",
}
_REQUEST_CREATORS = _STORE | set(REQUESTOR_DEPARTMENTS)
REQUEST_ID_PREFIX = "REQ-ST-"
_ISSUABLE_REQUEST_STATUSES = {"Approved", "Ready to Issue", "Partially Issued"}
# Fields only the server (create / decide / issue) may set; client edits never overwrite them.
_REQUEST_SERVER_FIELDS = (
    "requestId",
    "department",
    "requestedByEmail",
    "requestedByUserId",
    "requestedByRole",
    "clientRequestId",
    "createdAt",
    "createdByEmail",
    "createdByUserId",
    "decisionHistory",
    "decidedBy",
    "decidedAt",
    "decisionComment",
    "quantityIssued",
)

# Doc §4.3-oriented statuses (aligned with existing FE labels).
# PO_RAISED -> PO_APPROVED is a JD / Finance decision (mark_po_approved), never a store advance.
STORE_ADVANCE = {
    "DRAFT": "QUOTATION_PENDING",
    "QUOTATION_PENDING": "DEPARTMENT_REVIEW",
    "PO_REQUIRED": "PO_RAISED",
}
_PROCUREMENT_START_STATUSES = {"DRAFT", "QUOTATION_PENDING"}
# Set only by decide_procurement / receive_goods; whole-list saves keep the stored values.
_PROCUREMENT_SERVER_FIELDS = (
    "status",
    "decisionHistory",
    "budgetApproved",
    "budgetApprovedBy",
    "budgetApprovedAt",
    "poNumber",
    "poDate",
    "poRaisedBy",
    "poRaisedByUserId",
    "grnId",
    "grnReceived",
    "grnReceivedAt",
    "grnReceivedBy",
    "financePaymentRef",
    "createdByUserId",
    "createdByEmail",
)
JD_DECISIONS = {
    "approve": "MINOR_APPROVED",
    "escalate": "ESCALATED",
    "reject": "REJECTED",
}
FINANCE_DECISIONS = {
    "approve_budget": "PO_REQUIRED",
    "reject": "REJECTED",
}


def _code(db: Session, actor: User) -> str:
    return role_code_for(db, actor)


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _as_item(row: OpsRecord) -> dict:
    body = dict(row.body or {})
    body["id"] = row.public_id
    body["_collection"] = row.collection
    body["_updatedAt"] = row.updated_at.isoformat() if row.updated_at else None
    body["_createdAt"] = row.created_at.isoformat() if row.created_at else None
    return body


def _get_row(db: Session, campus_id, collection: str, public_id: str) -> OpsRecord | None:
    return db.scalar(
        select(OpsRecord).where(
            OpsRecord.campus_id == campus_id,
            OpsRecord.collection == collection,
            OpsRecord.public_id == str(public_id),
        )
    )


def _find_inventory(db: Session, campus_id, *, item_id: str = "", item_name: str = "") -> OpsRecord | None:
    rows = db.scalars(
        select(OpsRecord).where(
            OpsRecord.campus_id == campus_id,
            OpsRecord.collection == INV,
        )
    ).all()
    want_id = str(item_id or "").strip()
    want_name = str(item_name or "").strip().lower()
    for row in rows:
        body = row.body or {}
        if want_id and str(body.get("itemId") or body.get("id") or row.public_id) == want_id:
            return row
        if want_name and str(body.get("itemName") or body.get("item") or "").strip().lower() == want_name:
            return row
    return None


def _derive_status(qty: float, reorder) -> str:
    if qty <= 0:
        return "Out of Stock"
    try:
        level = float(reorder)
    except (TypeError, ValueError):
        level = None
    if level is not None and qty <= level:
        return "Low Stock"
    return "Available"


def _put_body(db: Session, actor: User, collection: str, public_id: str, body: dict, *, commit: bool = False) -> OpsRecord:
    payload = {key: value for key, value in body.items() if not str(key).startswith("_")}
    payload["id"] = public_id
    if collection == INV:
        payload.setdefault("itemId", public_id)
    now = _now()
    row = _get_row(db, actor.campus_id, collection, public_id)
    if row is None:
        row = OpsRecord(
            id=uuid.uuid4(),
            campus_id=actor.campus_id,
            collection=collection,
            public_id=public_id,
            body=payload,
            created_by=actor.id,
            updated_at=now,
        )
        db.add(row)
    else:
        row.body = payload
        row.updated_at = now
    if commit:
        db.commit()
        db.refresh(row)
    return row


def _require_store(db: Session, actor: User) -> str:
    code = _code(db, actor)
    if code not in _STORE:
        fail(403, "forbidden", "Only Stationery Store staff may perform this stock action.")
    return code


def _movement_rows(db: Session, campus_id) -> list[OpsRecord]:
    return db.scalars(
        select(OpsRecord).where(OpsRecord.campus_id == campus_id, OpsRecord.collection == MOVEMENTS)
    ).all()


def _issue_lines(db: Session, campus_id, ref: str) -> dict[str, int]:
    """Quantities given per item on an issue (movement id, or batch id for multi-line issues)."""
    lines: dict[str, int] = {}
    for row in _movement_rows(db, campus_id):
        body = row.body or {}
        if body.get("activityType") != "Issue":
            continue
        if row.public_id != ref and str(body.get("batchId") or "") != ref:
            continue
        key = str(body.get("itemId") or "")
        lines[key] = lines.get(key, 0) + int(body.get("quantity") or 0)
    return lines


def _received_against(db: Session, campus_id, ref: str, item_id: str) -> int:
    total = 0
    for row in _movement_rows(db, campus_id):
        body = row.body or {}
        if body.get("activityType") in {"Return", "Receiving"} and str(body.get("originalIssueRef") or "") == ref \
                and str(body.get("itemId") or "") == item_id:
            total += int(body.get("quantity") or 0)
    return total


def guard_movement_write(collection: str) -> None:
    """The issue/return ledger is append-only: Given and Received entries are written only by record_issue_return."""
    if collection == MOVEMENTS:
        fail(403, "forbidden", "Issue and return entries are recorded through Issue / Return and cannot be edited or deleted.")


def guard_procurement_save(db: Session, actor: User, previous: list[dict], items: list) -> list:
    """Whole-list saves of stationery-procurement edit details only.

    Status, approvals, PO and GRN fields are kept from the stored row (they change through
    decide_procurement / receive_goods); new requests start at DRAFT or QUOTATION_PENDING and record
    who raised them; a request that already has decisions or a GRN cannot be dropped.
    """
    by_id = {str(row.get("id")): row for row in previous if isinstance(row, dict)}
    incoming: set[str] = set()
    guarded = []
    for raw in items:
        if not isinstance(raw, dict):
            guarded.append(raw)
            continue
        row = dict(raw)
        public_id = str(row.get("id") or row.get("requestId") or "").strip()
        incoming.add(public_id)
        origin = by_id.get(public_id)
        if origin is None:
            status = str(row.get("status") or "QUOTATION_PENDING").strip().upper()
            if status not in _PROCUREMENT_START_STATUSES:
                fail(422, "invalid_body", "New purchase requests start at DRAFT or QUOTATION_PENDING.")
            for field in _PROCUREMENT_SERVER_FIELDS:
                row.pop(field, None)
            row["status"] = status
            row["createdByUserId"] = str(actor.id)
            row["createdByEmail"] = actor.email or ""
        else:
            for field in _PROCUREMENT_SERVER_FIELDS:
                if field in origin:
                    row[field] = origin[field]
                else:
                    row.pop(field, None)
        guarded.append(row)
    kept = [
        {key: value for key, value in row.items() if not str(key).startswith("_")}
        for public_id, row in by_id.items()
        if public_id not in incoming and (row.get("decisionHistory") or row.get("grnReceived"))
    ]
    return [*guarded, *kept]


def record_issue_return(db: Session, actor: User, body: dict) -> dict:
    """Atomic issue/return: validate stock, write movement, update inventory once."""
    _require_store(db, actor)
    if not isinstance(body, dict):
        fail(422, "invalid_body", "Body must be a JSON object.")

    activity = str(body.get("activityType") or "Issue").strip()
    # Receiving = inbound stock (audit/dept return-to-store); Issue = Given outbound.
    if activity not in {"Issue", "Return", "Receiving", "Given"}:
        fail(422, "invalid_body", "activityType must be Issue, Given, Return, or Receiving.")
    if activity == "Given":
        activity = "Issue"

    client_key = str(body.get("clientRequestId") or body.get("idempotencyKey") or "").strip()
    if client_key:
        existing = _get_row(db, actor.campus_id, MOVEMENTS, client_key)
        if existing is not None:
            return {"success": True, "idempotent": True, "movement": _as_item(existing)}

    lines = body.get("lines")
    if not isinstance(lines, list) or not lines:
        # Single-line shorthand
        lines = [
            {
                "itemId": body.get("itemId"),
                "itemName": body.get("itemName") or body.get("item"),
                "quantity": body.get("quantity"),
            }
        ]

    department = str(body.get("department") or "").strip()
    requested_by = str(body.get("requestedBy") or body.get("employeeName") or "").strip()
    if not department or not requested_by:
        fail(422, "invalid_body", "department and requestedBy are required.")

    condition = str(body.get("condition") or "Good").strip() or "Good"
    original_ref = str(body.get("originalIssueRef") or "").strip()
    if activity == "Return" and not original_ref:
        fail(422, "invalid_body", "originalIssueRef is required for returns.")
    # Receiving may stand alone (inbound stock); when it cites an issue it is reconciled against it.
    original_issue = _issue_lines(db, actor.campus_id, original_ref) if original_ref else {}
    if original_ref and not original_issue:
        fail(404, "not_found", f"Original issue {original_ref} was not found.")

    request_id = str(body.get("requestId") or "").strip()
    if request_id and activity == "Issue":
        linked = _get_row(db, actor.campus_id, REQUESTS, request_id)
        if linked is None:
            fail(404, "not_found", f"Store request {request_id} was not found.")
        linked_status = str((linked.body or {}).get("status") or "Pending")
        if linked_status not in _ISSUABLE_REQUEST_STATUSES:
            fail(409, "not_approved", f"Store request {request_id} is {linked_status}; it must be approved before stock is issued.")
    material_pass_id = str(body.get("materialGatePassId") or "").strip()
    batch_id = client_key or f"IR-{uuid.uuid4().hex[:12]}"
    movements: list[dict] = []
    inventory_out: list[dict] = []

    for index, raw in enumerate(lines):
        if not isinstance(raw, dict):
            fail(422, "invalid_body", "Each line must be an object.")
        qty = raw.get("quantity")
        try:
            quantity = float(qty)
        except (TypeError, ValueError):
            fail(422, "invalid_body", "quantity must be a number.")
        if quantity <= 0 or int(quantity) != quantity:
            fail(422, "invalid_body", "quantity must be a positive whole number.")
        quantity = int(quantity)

        inv = _find_inventory(
            db,
            actor.campus_id,
            item_id=str(raw.get("itemId") or ""),
            item_name=str(raw.get("itemName") or raw.get("item") or ""),
        )
        if inv is None:
            fail(404, "not_found", f"Inventory item not found: {raw.get('itemName') or raw.get('itemId')}")

        inv_body = dict(inv.body or {})
        available = inv_body.get("availableQuantity")
        try:
            available_qty = int(float(available))
        except (TypeError, ValueError):
            available_qty = 0

        reconciliation = None
        if original_issue and activity in {"Return", "Receiving"}:
            item_key = str(inv_body.get("itemId") or inv.public_id)
            issued_qty = original_issue.get(item_key)
            if issued_qty is None:
                fail(422, "invalid_body", f"{inv_body.get('itemName')} was not part of issue {original_ref}.")
            already = _received_against(db, actor.campus_id, original_ref, item_key)
            if already + quantity > issued_qty:
                fail(
                    409,
                    "exceeds_issued",
                    f"Only {issued_qty - already} of {inv_body.get('itemName')} from {original_ref} is still outstanding.",
                )
            balance = issued_qty - already - quantity
            reconciliation = {
                "issuedQuantity": issued_qty,
                "receivedBefore": already,
                "receivedToDate": already + quantity,
                "balanceQuantity": balance,
                "reconciliationStatus": "Fully Received" if balance == 0 else "Partially Received",
            }

        if activity == "Issue":
            if quantity > available_qty:
                fail(
                    409,
                    "insufficient_stock",
                    f"Cannot issue {quantity} of {inv_body.get('itemName')}; only {available_qty} available. Raise a purchase requirement instead.",
                )
            next_qty = available_qty - quantity
        else:
            # Lost/Damaged returns do not restock.
            if condition in {"Lost", "Damaged"}:
                next_qty = available_qty
            else:
                next_qty = available_qty + quantity

        inv_body["availableQuantity"] = next_qty
        inv_body["status"] = _derive_status(next_qty, inv_body.get("reorderLevel"))
        unit_raw = str(inv_body.get("unitCost") or "").replace("₹", "").replace(",", "").strip()
        try:
            unit = float(unit_raw) if unit_raw else 0.0
        except ValueError:
            unit = 0.0
        inv_body["stockValue"] = f"₹{int(next_qty * unit):,}"
        _put_body(db, actor, INV, inv.public_id, inv_body)
        inventory_out.append(_as_item(inv))

        movement_id = batch_id if len(lines) == 1 else f"{batch_id}-{index + 1}"
        movement = {
            "id": movement_id,
            "batchId": batch_id,
            "activityType": activity,
            "requestedBy": requested_by,
            "employeeId": str(body.get("employeeId") or ""),
            "department": department,
            "itemName": inv_body.get("itemName"),
            "itemId": inv_body.get("itemId") or inv.public_id,
            "quantity": quantity,
            "remarks": str(body.get("remarks") or ""),
            "purpose": str(body.get("purpose") or ""),
            "status": (
                "Returned" if activity == "Return"
                else "Received" if activity == "Receiving"
                else "Issued"
            ),
            "issueDate": body.get("issueDate") or (_now().date().isoformat() if activity == "Issue" else "—"),
            "returnDate": body.get("returnDate") or (
                _now().date().isoformat() if activity in {"Return", "Receiving"} else "—"
            ),
            "availableStock": next_qty,
            "originalIssueRef": original_ref if activity in {"Return", "Receiving"} and original_ref else None,
            **(reconciliation or {}),
            "condition": condition if activity in {"Return", "Receiving"} else None,
            "returnable": bool(body.get("returnable")),
            "expectedReturnDate": body.get("expectedReturnDate") or "",
            "requestId": request_id or None,
            "materialGatePassId": material_pass_id or None,
            "recordedByUserId": str(actor.id),
            "recordedByEmail": actor.email or "",
            "recordedAt": _now().isoformat(),
            "clientRequestId": client_key or movement_id,
        }
        _put_body(db, actor, MOVEMENTS, movement_id, movement)
        movements.append(movement)

        # Keep Stock Issue mirror in sync when issuing (single authoritative path).
        if activity == "Issue":
            issue_id = f"SSI-{movement_id}"
            _put_body(
                db,
                actor,
                STOCK_ISSUES,
                issue_id,
                {
                    "id": issue_id,
                    "item": inv_body.get("itemName"),
                    "itemId": inv_body.get("itemId") or inv.public_id,
                    "quantity": quantity,
                    "from": "Stores",
                    "to": department,
                    "issuedBy": actor.email or "Stores",
                    "receivedBy": requested_by,
                    "date": _now().date().isoformat(),
                    "status": "Issued",
                    "movementId": movement_id,
                    "requestId": request_id or None,
                    "materialGatePassId": material_pass_id or None,
                },
            )

    if request_id:
        req = _get_row(db, actor.campus_id, REQUESTS, request_id)
        if req is not None:
            req_body = dict(req.body or {})
            status = str(req_body.get("status") or "")
            if status in _ISSUABLE_REQUEST_STATUSES:
                issued_qty = int(req_body.get("quantityIssued") or 0) + sum(
                    int(m["quantity"]) for m in movements if m["activityType"] == "Issue"
                )
                requested_qty = int(req_body.get("quantityRequested") or req_body.get("quantity") or issued_qty)
                req_body["quantityIssued"] = issued_qty
                if issued_qty >= requested_qty and requested_qty > 0:
                    req_body["status"] = "Issued"
                    req_body["currentStage"] = "Issued"
                else:
                    req_body["status"] = "Partially Issued"
                    req_body["currentStage"] = "Partially Issued"
                _put_body(db, actor, REQUESTS, request_id, req_body)

    write_audit(
        db,
        action="STATIONERY_ISSUE_RETURN",
        entity_type="stationery_movement",
        entity_id=batch_id,
        actor_id=actor.id,
        campus_id=actor.campus_id,
        details=f"{activity} x{len(movements)}",
    )
    db.commit()
    return {
        "success": True,
        "batchId": batch_id,
        "movements": movements,
        "inventory": inventory_out,
    }


def decide_request(db: Session, actor: User, request_id: str, body: dict) -> dict:
    code = _code(db, actor)
    if code not in _REQUEST_DECIDERS:
        fail(403, "forbidden", "You are not allowed to approve or reject store requests.")
    if not isinstance(body, dict):
        fail(422, "invalid_body", "Body must be a JSON object.")
    decision = str(body.get("decision") or "").strip().lower()
    if decision not in {"approve", "reject"}:
        fail(422, "invalid_body", "decision must be approve or reject.")
    comment = str(body.get("comment") or "").strip()

    row = _get_row(db, actor.campus_id, REQUESTS, request_id)
    if row is None:
        fail(404, "not_found", "Store request not found.")
    payload = dict(row.body or {})
    status = str(payload.get("status") or "Pending").strip()
    if status not in {"Pending", "Submitted", "Pending Approval", "Draft"}:
        fail(409, "invalid_state", f"Request is already {status}.")

    requester = str(payload.get("requestedByEmail") or payload.get("requesterEmail") or "").strip().lower()
    if requester and requester == (actor.email or "").strip().lower() and code not in {
        "admin",
        "superadmin",
        "managing_director",
    }:
        fail(403, "forbidden", "Self-approval is not allowed for store requests.")

    now = _now().isoformat()
    if decision == "approve":
        payload["status"] = "Approved"
        payload["currentStage"] = "Ready to Issue"
    else:
        payload["status"] = "Rejected"
        payload["currentStage"] = "Rejected"
    history = list(payload.get("decisionHistory") or [])
    history.append(
        {
            "decision": decision,
            "comment": comment,
            "decidedByUserId": str(actor.id),
            "decidedByEmail": actor.email or "",
            "decidedByRole": code,
            "decidedAt": now,
        }
    )
    payload["decisionHistory"] = history
    payload["decidedBy"] = actor.email or ""
    payload["decidedAt"] = now
    payload["decisionComment"] = comment
    _put_body(db, actor, REQUESTS, request_id, payload)
    write_audit(
        db,
        action="STATIONERY_REQUEST_DECIDE",
        entity_type="stationery_request",
        entity_id=request_id,
        actor_id=actor.id,
        campus_id=actor.campus_id,
        details=decision,
    )
    db.commit()
    db.refresh(row)
    return _as_item(row)


def _owns_request(actor: User, row: OpsRecord) -> bool:
    if row.created_by is not None and row.created_by == actor.id:
        return True
    body = row.body or {}
    if str(body.get("requestedByUserId") or "") == str(actor.id):
        return True
    email = (actor.email or "").strip().lower()
    return bool(email) and str(body.get("requestedByEmail") or "").strip().lower() == email


def _highest_request_number(db: Session, campus_id) -> int:
    ids = db.scalars(
        select(OpsRecord.public_id).where(
            OpsRecord.campus_id == campus_id,
            OpsRecord.collection == REQUESTS,
            OpsRecord.public_id.like(f"{REQUEST_ID_PREFIX}%"),
        )
    ).all()
    highest = 0
    for public_id in ids:
        suffix = str(public_id)[len(REQUEST_ID_PREFIX):]
        if suffix.isdigit():
            highest = max(highest, int(suffix))
    return highest


def _lock_request_sequence(db: Session, campus_id) -> OpsRecord:
    """Row-lock the campus request counter (SELECT ... FOR UPDATE) until the request is committed.

    Every create takes this lock, so numbering and the clientRequestId check run one at a time per campus.
    """
    query = (
        select(OpsRecord)
        .where(
            OpsRecord.campus_id == campus_id,
            OpsRecord.collection == REQUEST_SEQUENCE,
            OpsRecord.public_id == REQUEST_ID_PREFIX,
        )
        .with_for_update()
    )
    counter = db.scalar(query)
    if counter is None:
        db.add(
            OpsRecord(
                id=uuid.uuid4(),
                campus_id=campus_id,
                collection=REQUEST_SEQUENCE,
                public_id=REQUEST_ID_PREFIX,
                body={"last": _highest_request_number(db, campus_id)},
                updated_at=_now(),
            )
        )
        try:
            db.commit()
        except IntegrityError:
            # Another request created the counter first; use theirs.
            db.rollback()
        counter = db.scalar(query)
    return counter


def _existing_for_client_key(db: Session, actor: User, client_key: str) -> OpsRecord | None:
    if not client_key:
        return None
    mine = db.scalars(
        select(OpsRecord).where(
            OpsRecord.campus_id == actor.campus_id,
            OpsRecord.collection == REQUESTS,
            OpsRecord.created_by == actor.id,
        )
    ).all()
    return next((row for row in mine if str((row.body or {}).get("clientRequestId") or "") == client_key), None)


def create_request(db: Session, actor: User, body: dict) -> dict:
    """Create a store product request with a server-assigned number; resubmits with the same clientRequestId are idempotent."""
    code = _code(db, actor)
    if code not in _REQUEST_CREATORS:
        fail(403, "forbidden", "You are not allowed to raise store product requests.")
    if not isinstance(body, dict):
        fail(422, "invalid_body", "Body must be a JSON object.")
    item = str(body.get("item") or body.get("title") or "").strip()
    if not item:
        fail(422, "invalid_body", "Item is required.")
    try:
        quantity = float(body.get("quantity"))
    except (TypeError, ValueError):
        fail(422, "invalid_body", "Quantity must be a number.")
    if quantity <= 0 or int(quantity) != quantity:
        fail(422, "invalid_body", "Quantity must be a positive whole number.")
    quantity = int(quantity)

    client_key = str(body.get("clientRequestId") or "").strip()[:80]
    existing = _existing_for_client_key(db, actor, client_key)
    if existing is not None:
        return {**_as_item(existing), "idempotent": True}

    record = {
        key: value
        for key, value in body.items()
        if not str(key).startswith("_") and key not in _REQUEST_SERVER_FIELDS and key not in {"id", "status"}
    }
    is_store = code in _STORE
    record.update(
        {
            "item": item,
            "title": str(body.get("title") or item).strip(),
            "quantity": quantity,
            "quantityRequested": quantity,
            "department": REQUESTOR_DEPARTMENTS.get(code) or str(body.get("department") or "Stationery Store").strip(),
            "requestedBy": str(body.get("requestedBy") or actor.email or "").strip(),
            "requestedByRole": code,
            "createdByEmail": actor.email or "",
            "createdByUserId": str(actor.id),
            "status": "Pending",
            "currentStage": str(body.get("currentStage") or "Store Officer").strip() if is_store else "Store Officer",
            "clientRequestId": client_key or None,
            "createdAt": _now().isoformat(),
        }
    )
    if not is_store:
        # Department requests carry the requester identity so decide_request blocks self-approval.
        record["requestedByEmail"] = actor.email or ""
        record["requestedByUserId"] = str(actor.id)

    for _attempt in range(5):
        counter = _lock_request_sequence(db, actor.campus_id)
        # Re-check under the lock: a simultaneous double submit committed while this one waited.
        existing = _existing_for_client_key(db, actor, client_key)
        if existing is not None:
            db.rollback()
            return {**_as_item(existing), "idempotent": True}
        number = max(int((counter.body or {}).get("last") or 0), _highest_request_number(db, actor.campus_id)) + 1
        counter.body = {**(counter.body or {}), "last": number}
        flag_modified(counter, "body")
        counter.updated_at = _now()
        public_id = f"{REQUEST_ID_PREFIX}{number:04d}"
        record["id"] = public_id
        record["requestId"] = public_id
        row = OpsRecord(
            id=uuid.uuid4(),
            campus_id=actor.campus_id,
            collection=REQUESTS,
            public_id=public_id,
            body=dict(record),
            created_by=actor.id,
            updated_at=_now(),
        )
        db.add(row)
        write_audit(
            db,
            action="STATIONERY_REQUEST_CREATE",
            entity_type="stationery_request",
            entity_id=public_id,
            actor_id=actor.id,
            campus_id=actor.campus_id,
            details=f"{record['department']}: {item} x{quantity}",
        )
        try:
            db.commit()
        except IntegrityError:
            # Another request took this number concurrently (uq_ops_record); allocate the next one.
            db.rollback()
            continue
        db.refresh(row)
        return _as_item(row)
    fail(409, "conflict", "Could not allocate a request number. Please try again.")


def guard_request_upsert(db: Session, actor: User, row: OpsRecord | None, payload: dict) -> dict:
    """Ownership and status rules for PUT /ops/stationery-requests/items/{id}."""
    code = _code(db, actor)
    if row is None:
        if code not in _STORE:
            fail(400, "use_create_endpoint", "Raise new store requests with POST /ops/stationery/requests.")
        if str(payload.get("status") or "Pending") != "Pending":
            fail(422, "invalid_body", "New store requests start as Pending.")
        payload["status"] = "Pending"
        payload["requestedByRole"] = code
        payload["createdByEmail"] = actor.email or ""
        payload["createdByUserId"] = str(actor.id)
        return payload

    existing = dict(row.body or {})
    old_status = str(existing.get("status") or "Pending")
    new_status = str(payload.get("status") or old_status)
    if code in _STORE:
        if new_status != old_status:
            fail(409, "use_decision_endpoint", "Change a request's status with the approve/reject or issue actions.")
    else:
        if not _owns_request(actor, row):
            fail(403, "forbidden", "You can only change your own department's requests.")
        if old_status != "Pending":
            fail(409, "locked", f"This request is already {old_status} and can no longer be edited.")
        if new_status not in {old_status, "Cancelled"}:
            fail(403, "forbidden", "Only Store can approve, reject, or issue store requests.")
    for field in _REQUEST_SERVER_FIELDS:
        if field in existing:
            payload[field] = existing[field]
        else:
            payload.pop(field, None)
    payload["status"] = new_status
    return payload


def guard_request_delete(db: Session, actor: User, row: OpsRecord) -> None:
    code = _code(db, actor)
    if code in _STORE:
        return
    if not _owns_request(actor, row):
        fail(403, "forbidden", "You can only remove your own department's requests.")
    status = str((row.body or {}).get("status") or "Pending")
    if status != "Pending":
        fail(409, "locked", f"This request is already {status} and cannot be removed.")


def filter_requests_for_reader(db: Session, actor: User, items: list[dict]) -> list[dict]:
    """Requesting departments see only their own department's requests; Store and oversight roles see all."""
    department = REQUESTOR_DEPARTMENTS.get(_code(db, actor))
    if department is None:
        return items
    email = (actor.email or "").strip().lower()
    uid = str(actor.id)
    return [
        item for item in items
        if item.get("department") == department
        or str(item.get("requestedByUserId") or "") == uid
        or (email and str(item.get("requestedByEmail") or "").strip().lower() == email)
    ]


def decide_procurement(db: Session, actor: User, procurement_id: str, body: dict) -> dict:
    """Role-gated stage transitions for purchase workflow (§4.3)."""
    if not isinstance(body, dict):
        fail(422, "invalid_body", "Body must be a JSON object.")
    action = str(body.get("action") or body.get("decision") or "").strip().lower()
    comment = str(body.get("comment") or "").strip()
    code = _code(db, actor)

    row = _get_row(db, actor.campus_id, PROCUREMENT, procurement_id)
    if row is None:
        fail(404, "not_found", "Procurement request not found.")
    payload = dict(row.body or {})
    status = str(payload.get("status") or "DRAFT").strip().upper()
    if status in {"REJECTED", "COMPLETED", "PAID"}:
        fail(409, "invalid_state", f"Procurement is already {status}.")

    now = _now().isoformat()
    next_status = None
    actor_id = str(actor.id)
    raiser_id = str(payload.get("createdByUserId") or payload.get("requestedByUserId") or "")
    history_before = [entry for entry in (payload.get("decisionHistory") or []) if isinstance(entry, dict)]
    jd_decider_ids = {
        str(entry.get("decidedByUserId") or "")
        for entry in history_before
        if entry.get("action") in JD_DECISIONS
    }

    def _no_self_approval(*others: str) -> None:
        if actor_id in {raiser_id, *others} - {""}:
            fail(403, "self_approval", "You raised or already approved this purchase, so someone else must decide.")

    if action in {"advance", "submit_quotation", "ready_for_jd"}:
        if code not in _STORE:
            fail(403, "forbidden", "Only store staff may prepare purchase stages.")
        next_status = STORE_ADVANCE.get(status)
        if not next_status:
            fail(409, "invalid_state", f"Store cannot advance from {status}.")
        if next_status == "PO_RAISED" and not payload.get("poNumber"):
            payload["poNumber"] = f"PO-ST-{uuid.uuid4().hex[:8].upper()}"
            payload["poDate"] = _now().date().isoformat()
            payload["poRaisedBy"] = actor.email or ""
            payload["poRaisedByUserId"] = actor_id
    elif action in JD_DECISIONS:
        if code not in _JD:
            fail(403, "forbidden", "Only Joint Director roles may decide at this stage.")
        if status != "DEPARTMENT_REVIEW":
            fail(409, "invalid_state", "JD decisions require DEPARTMENT_REVIEW status.")
        _no_self_approval()
        next_status = JD_DECISIONS[action]
        if action == "approve" and not payload.get("minorPurchase", True):
            next_status = "ESCALATED"
    elif action in FINANCE_DECISIONS or action == "approve":
        # Finance budget gate before PO.
        if code not in _FINANCE:
            fail(403, "forbidden", "Only Finance may approve budget / reject at this stage.")
        if status not in {"ESCALATED", "QUOTATION_APPROVED", "MINOR_APPROVED"}:
            fail(409, "invalid_state", "Finance decisions require a JD-approved / escalated request.")
        _no_self_approval(*jd_decider_ids)
        mapped = FINANCE_DECISIONS.get(action if action in FINANCE_DECISIONS else "approve_budget")
        next_status = mapped
        if action in {"approve", "approve_budget"}:
            next_status = "PO_REQUIRED"
            payload["budgetApproved"] = True
            payload["budgetApprovedBy"] = actor.email or ""
            payload["budgetApprovedAt"] = now
    elif action == "mark_po_approved":
        # Store raises the PO; JD or Finance approves it (store cannot approve its own PO).
        if code not in _JD | _FINANCE:
            fail(403, "forbidden", "Only Joint Director or Finance may approve a purchase order.")
        if status != "PO_RAISED":
            fail(409, "invalid_state", "PO must be raised before approval.")
        _no_self_approval(str(payload.get("poRaisedByUserId") or ""))
        next_status = "PO_APPROVED"
    elif action == "complete":
        if code not in _STORE:
            fail(403, "forbidden", "Only store staff may complete after goods receipt.")
        if not payload.get("grnReceived"):
            fail(409, "invalid_state", "Record the goods receipt (GRN) before completing.")
        next_status = "COMPLETED"
    elif action == "mark_paid":
        fail(
            400,
            "not_supported",
            "Payment must be recorded by Finance against a payment reference; store cannot mark paid from this screen.",
        )
    else:
        fail(422, "invalid_body", f"Unknown action: {action}")

    payload["status"] = next_status
    history = list(payload.get("decisionHistory") or [])
    history.append(
        {
            "action": action,
            "fromStatus": status,
            "toStatus": next_status,
            "comment": comment,
            "decidedByUserId": str(actor.id),
            "decidedByEmail": actor.email or "",
            "decidedByRole": code,
            "decidedAt": now,
        }
    )
    payload["decisionHistory"] = history
    _put_body(db, actor, PROCUREMENT, procurement_id, payload)
    write_audit(
        db,
        action="STATIONERY_PROCUREMENT_DECIDE",
        entity_type="stationery_procurement",
        entity_id=procurement_id,
        actor_id=actor.id,
        campus_id=actor.campus_id,
        details=f"{status}->{next_status}",
    )
    db.commit()
    db.refresh(row)
    return _as_item(row)


def receive_goods(db: Session, actor: User, procurement_id: str, body: dict) -> dict:
    """GRN: idempotent stock increase linked to a PO-approved procurement."""
    _require_store(db, actor)
    if not isinstance(body, dict):
        fail(422, "invalid_body", "Body must be a JSON object.")

    row = _get_row(db, actor.campus_id, PROCUREMENT, procurement_id)
    if row is None:
        fail(404, "not_found", "Procurement request not found.")
    payload = dict(row.body or {})
    status = str(payload.get("status") or "").upper()
    if status not in {"PO_APPROVED", "COMPLETED"}:
        fail(409, "invalid_state", "Goods receipt requires an approved purchase order.")

    grn_id = str(body.get("grnId") or payload.get("grnId") or f"GRN-{procurement_id}").strip()
    if payload.get("grnId") == grn_id and payload.get("grnReceived"):
        return {"success": True, "idempotent": True, "procurement": _as_item(row)}

    lines = body.get("lines")
    if not isinstance(lines, list) or not lines:
        # Fallback: single quantity against title item if provided
        lines = [
            {
                "itemId": body.get("itemId"),
                "itemName": body.get("itemName") or payload.get("title"),
                "quantity": body.get("quantity") or payload.get("quantity") or 0,
            }
        ]

    received = []
    for raw in lines:
        if not isinstance(raw, dict):
            fail(422, "invalid_body", "Each GRN line must be an object.")
        try:
            quantity = int(float(raw.get("quantity")))
        except (TypeError, ValueError):
            fail(422, "invalid_body", "GRN quantity must be a number.")
        if quantity <= 0:
            fail(422, "invalid_body", "GRN quantity must be positive.")
        inv = _find_inventory(
            db,
            actor.campus_id,
            item_id=str(raw.get("itemId") or ""),
            item_name=str(raw.get("itemName") or raw.get("item") or ""),
        )
        if inv is None:
            fail(404, "not_found", f"Inventory item not found for GRN line: {raw.get('itemName') or raw.get('itemId')}")
        inv_body = dict(inv.body or {})
        try:
            available = int(float(inv_body.get("availableQuantity") or 0))
        except (TypeError, ValueError):
            available = 0
        next_qty = available + quantity
        inv_body["availableQuantity"] = next_qty
        inv_body["status"] = _derive_status(next_qty, inv_body.get("reorderLevel"))
        _put_body(db, actor, INV, inv.public_id, inv_body)
        movement_id = f"{grn_id}-{inv.public_id}"
        _put_body(
            db,
            actor,
            MOVEMENTS,
            movement_id,
            {
                "id": movement_id,
                "activityType": "GRN",
                "status": "Received",
                "itemName": inv_body.get("itemName"),
                "itemId": inv_body.get("itemId") or inv.public_id,
                "quantity": quantity,
                "procurementId": procurement_id,
                "grnId": grn_id,
                "poNumber": payload.get("poNumber") or "",
                "department": "Stores",
                "requestedBy": actor.email or "Stores",
                "recordedByUserId": str(actor.id),
                "recordedAt": _now().isoformat(),
            },
        )
        received.append({"itemId": inv.public_id, "quantity": quantity, "availableQuantity": next_qty})

    payload["grnId"] = grn_id
    payload["grnReceived"] = True
    payload["grnReceivedAt"] = _now().isoformat()
    payload["grnReceivedBy"] = actor.email or ""
    payload["financePaymentRef"] = str(body.get("financePaymentRef") or payload.get("financePaymentRef") or "")
    if status != "COMPLETED":
        payload["status"] = "COMPLETED"
    _put_body(db, actor, PROCUREMENT, procurement_id, payload)
    write_audit(
        db,
        action="STATIONERY_GRN",
        entity_type="stationery_procurement",
        entity_id=procurement_id,
        actor_id=actor.id,
        campus_id=actor.campus_id,
        details=grn_id,
    )
    db.commit()
    db.refresh(row)
    return {"success": True, "grnId": grn_id, "received": received, "procurement": _as_item(row)}
