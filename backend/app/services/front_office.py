"""Front Office (PRM) campus records: gate passes, student transfer, re-enrollment."""

from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy import String, cast, or_, select
from sqlalchemy.orm import Session

from app.deps import role_code_for
from app.models import FrontOfficeRecord, Student, User
from app.services.errors import fail

COLLECTIONS: dict[str, str] = {
    "student-gate-passes": "SGP",
    "hostel-gate-passes": "HGP",
    "material-gate-passes": "MGP",
    "goods-received-passes": "GRP",
    "student-transfers": "STR",
    "student-re-enrollments": "SRE",
}

_WRITERS = {"prm", "pro", "admin", "superadmin", "managing_director"}
_READERS = _WRITERS | {"principal", "director"}
_GATE_PASS_COLLECTIONS = frozenset({"student-gate-passes", "hostel-gate-passes", "material-gate-passes"})
_GATE_PASS_READERS = {"gatekeeper", "gatekeepermanager"}
# Gate staff check goods in at the gate as well as people / material going out.
_GATE_STAFF_COLLECTIONS = _GATE_PASS_COLLECTIONS | {"goods-received-passes"}
# Joint Director Assistant: read-only view of gate passes.
_GATE_PASS_VIEW_ONLY = {"jointdirectorassistant"}
# Store Officer owns material out/in passes and goods received into the store (Non-Academics 12–13).
_STORE_ROLE = "stationerystoremanager"
_STORE_COLLECTIONS = frozenset({"material-gate-passes", "goods-received-passes"})
# Roles that are not in frontoffice.read but may still reach the read routes (service ACL decides).
SUPPLEMENTARY_READ_ROLES = frozenset(_GATE_PASS_VIEW_ONLY)

# Passes that need a Parent / Principal decision before they are cleared.
_APPROVAL_COLLECTIONS = frozenset({"student-gate-passes", "hostel-gate-passes"})
_DECISIONS = {"Approved", "Rejected"}
# Server-owned approval fields: only the decision path may set them.
_DECISION_FIELDS = frozenset(
    {
        "approvalStatus",
        "parentApproval",
        "principalApproval",
        "parentDecision",
        "principalDecision",
        "parentApprovalDecidedAt",
        "principalApprovalDecidedAt",
        "wardenApproval",
        "approvalHistory",
        "decidedBy",
        "decidedById",
        "decidedByEmail",
        "decidedByRole",
        "decidedAt",
        "decisionRemark",
    }
)
# Gate staff may verify an existing pass without creating/editing the whole FO record.
_GATE_VERIFY_FIELDS = frozenset(
    {
        "gateKeeperStatus",
        "gateKeeperRemark",
        "gateKeeperVerifiedAt",
        "verifiedBy",
        "verifiedAt",
        "outTime",
        "gateVerified",
    }
)


def _code(db: Session, actor: User) -> str:
    return role_code_for(db, actor)


def _ensure_collection(collection: str) -> None:
    if collection not in COLLECTIONS:
        fail(404, "not_found", "That front-office collection does not exist.")


def _can_read(db: Session, actor: User, collection: str | None = None) -> bool:
    code = _code(db, actor)
    if code in _READERS:
        return True
    if code == _STORE_ROLE:
        return collection in _STORE_COLLECTIONS
    if code in _GATE_PASS_READERS:
        return collection in _GATE_STAFF_COLLECTIONS
    if code in _GATE_PASS_VIEW_ONLY:
        return collection in _GATE_PASS_COLLECTIONS
    return False


def _can_write(db: Session, actor: User, collection: str | None = None) -> bool:
    code = _code(db, actor)
    if code in _WRITERS:
        return True
    return bool(code == _STORE_ROLE and collection in _STORE_COLLECTIONS)


def _can_verify_gate_pass(db: Session, actor: User, collection: str) -> bool:
    return bool(collection in _GATE_STAFF_COLLECTIONS and _code(db, actor) in _GATE_PASS_READERS)


def is_supplementary_reader(db: Session, actor: User) -> bool:
    return _code(db, actor) in SUPPLEMENTARY_READ_ROLES


def _derive_approval_status(collection: str, body: dict) -> str:
    if collection == "student-gate-passes":
        status = body.get("status")
        return status if status in _DECISIONS else "Pending"
    for field in ("parentApproval", "principalApproval", "wardenApproval"):
        if body.get(field) in _DECISIONS:
            return body[field]
    return "Pending"


def _as_item(row: FrontOfficeRecord) -> dict:
    body = dict(row.body or {})
    body.setdefault("id", row.public_id)
    body["id"] = row.public_id
    if row.collection in _APPROVAL_COLLECTIONS and body.get("approvalStatus") not in _DECISIONS | {"Pending"}:
        body["approvalStatus"] = _derive_approval_status(row.collection, body)
    body["_collection"] = row.collection
    body["_updatedAt"] = row.updated_at.isoformat() if row.updated_at else None
    body["_createdAt"] = row.created_at.isoformat() if row.created_at else None
    return body


def _strip_decision_fields(collection: str, body: dict) -> dict:
    if collection not in _APPROVAL_COLLECTIONS:
        return body
    blocked = _DECISION_FIELDS | ({"status"} if collection == "student-gate-passes" else set())
    return {key: value for key, value in body.items() if key not in blocked}


def _pending_approval_defaults(collection: str) -> dict:
    if collection == "student-gate-passes":
        return {"status": "Pending", "principalApproval": "Pending", "approvalStatus": "Pending"}
    if collection == "hostel-gate-passes":
        return {"parentApproval": "Pending", "principalApproval": "Pending", "approvalStatus": "Pending"}
    return {}


def _next_public_id(db: Session, actor: User, collection: str) -> str:
    prefix = COLLECTIONS[collection]
    rows = db.scalars(
        select(FrontOfficeRecord.public_id).where(
            FrontOfficeRecord.campus_id == actor.campus_id,
            FrontOfficeRecord.collection == collection,
        )
    ).all()
    numbers = []
    for public_id in rows:
        tail = str(public_id).split("-")[-1]
        if tail.isdigit():
            numbers.append(int(tail))
    return f"{prefix}-{max(numbers, default=0) + 1:04d}"


def list_records(db: Session, actor: User, collection: str) -> list[dict]:
    _ensure_collection(collection)
    if not _can_read(db, actor, collection):
        fail(403, "forbidden", "You are not allowed to view front-office records.")
    rows = db.scalars(
        select(FrontOfficeRecord)
        .where(
            FrontOfficeRecord.campus_id == actor.campus_id,
            FrontOfficeRecord.collection == collection,
        )
        .order_by(FrontOfficeRecord.created_at.desc())
    ).all()
    return [_as_item(row) for row in rows]


def get_record(db: Session, actor: User, collection: str, public_id: str) -> dict:
    _ensure_collection(collection)
    if not _can_read(db, actor, collection):
        fail(403, "forbidden", "You are not allowed to view front-office records.")
    row = db.scalar(
        select(FrontOfficeRecord).where(
            FrontOfficeRecord.campus_id == actor.campus_id,
            FrontOfficeRecord.collection == collection,
            FrontOfficeRecord.public_id == public_id,
        )
    )
    if row is None:
        fail(404, "not_found", "That record was not found.")
    return _as_item(row)


def create_record(db: Session, actor: User, collection: str, body: dict) -> dict:
    _ensure_collection(collection)
    if not _can_write(db, actor, collection):
        fail(403, "forbidden", "You are not allowed to create front-office records.")
    if not isinstance(body, dict):
        fail(422, "invalid_body", "Body must be an object.")
    public_id = str(body.get("id") or body.get("gatePassId") or "").strip() or _next_public_id(
        db, actor, collection
    )
    existing = db.scalar(
        select(FrontOfficeRecord).where(
            FrontOfficeRecord.campus_id == actor.campus_id,
            FrontOfficeRecord.collection == collection,
            FrontOfficeRecord.public_id == public_id,
        )
    )
    if existing is not None:
        fail(409, "duplicate", "A record with that id already exists.")
    payload = {**_strip_decision_fields(collection, body), **_pending_approval_defaults(collection), "id": public_id}
    if collection.endswith("gate-passes") or collection.endswith("passes"):
        payload.setdefault("gatePassId", public_id)
    row = FrontOfficeRecord(
        id=uuid.uuid4(),
        campus_id=actor.campus_id,
        collection=collection,
        public_id=public_id,
        body=payload,
        created_by=actor.id,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return _as_item(row)


def update_record(db: Session, actor: User, collection: str, public_id: str, body: dict) -> dict:
    _ensure_collection(collection)
    if not isinstance(body, dict):
        fail(422, "invalid_body", "Body must be an object.")
    row = db.scalar(
        select(FrontOfficeRecord).where(
            FrontOfficeRecord.campus_id == actor.campus_id,
            FrontOfficeRecord.collection == collection,
            FrontOfficeRecord.public_id == public_id,
        )
    )
    if row is None:
        fail(404, "not_found", "That record was not found.")

    if _can_write(db, actor, collection):
        patch = _strip_decision_fields(collection, body)
    elif _can_verify_gate_pass(db, actor, collection):
        patch = {key: value for key, value in body.items() if key in _GATE_VERIFY_FIELDS}
        if not patch:
            fail(403, "forbidden", "Gate staff may only update verification fields on a gate pass.")
    else:
        fail(403, "forbidden", "You are not allowed to change front-office records.")

    merged = {**(row.body or {}), **patch, "id": public_id}
    if collection.endswith("gate-passes") or collection.endswith("passes"):
        merged.setdefault("gatePassId", public_id)
    row.body = merged
    row.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(row)
    return _as_item(row)


def delete_record(db: Session, actor: User, collection: str, public_id: str) -> None:
    _ensure_collection(collection)
    code = _code(db, actor)
    store_owner_only = code == _STORE_ROLE and collection in _STORE_COLLECTIONS
    if code not in _WRITERS and not store_owner_only:
        fail(403, "forbidden", "You are not allowed to delete front-office records.")
    row = db.scalar(
        select(FrontOfficeRecord).where(
            FrontOfficeRecord.campus_id == actor.campus_id,
            FrontOfficeRecord.collection == collection,
            FrontOfficeRecord.public_id == public_id,
        )
    )
    if row is None:
        fail(404, "not_found", "That record was not found.")
    if store_owner_only and row.created_by != actor.id:
        fail(403, "forbidden", "Store may only delete passes it created.")
    db.delete(row)
    db.commit()


def _parent_child_keys(db: Session, actor: User) -> set[str]:
    rows = db.scalars(
        select(Student).where(
            Student.campus_id == actor.campus_id,
            or_(
                Student.parent_user_id == actor.id,
                cast(Student.parent_user_id, String) == str(actor.id),
            ),
        )
    ).all()
    keys: set[str] = set()
    for student in rows:
        keys.add(str(student.id).lower())
        if student.admission_number:
            keys.add(student.admission_number.strip().lower())
    return keys


def _record_student_keys(body: dict) -> set[str]:
    values = (body.get("studentId"), body.get("admissionNumber"), body.get("admissionNo"))
    return {str(value).strip().lower() for value in values if str(value or "").strip()}


def list_parent_hostel_passes(db: Session, actor: User) -> list[dict]:
    """Hostel outing passes for the signed-in parent's linked children only."""
    if _code(db, actor) != "parent":
        fail(403, "forbidden", "Only parents can use this list.")
    child_keys = _parent_child_keys(db, actor)
    if not child_keys:
        return []
    rows = db.scalars(
        select(FrontOfficeRecord)
        .where(
            FrontOfficeRecord.campus_id == actor.campus_id,
            FrontOfficeRecord.collection == "hostel-gate-passes",
        )
        .order_by(FrontOfficeRecord.created_at.desc())
    ).all()
    return [_as_item(row) for row in rows if _record_student_keys(row.body or {}) & child_keys]


def decide_record(db: Session, actor: User, collection: str, public_id: str, body: dict) -> dict:
    """Parent / Principal approval decision. Only approval fields change; the pass itself is untouched."""
    _ensure_collection(collection)
    if collection not in _APPROVAL_COLLECTIONS:
        fail(404, "not_found", "That pass type has no approval decision.")
    if not isinstance(body, dict):
        fail(422, "invalid_body", "Body must be an object.")
    decision = str(body.get("decision") or body.get("status") or "").strip().capitalize()
    if decision not in _DECISIONS:
        fail(422, "invalid_decision", "Decision must be Approved or Rejected.")
    remark = str(body.get("remark") or "").strip()[:500]

    code = _code(db, actor)
    if code == "principal":
        field = "principalApproval"
    elif code == "parent" and collection == "hostel-gate-passes":
        field = "parentApproval"
    else:
        fail(403, "forbidden", "You are not allowed to decide this gate pass.")

    row = db.scalar(
        select(FrontOfficeRecord)
        .where(
            FrontOfficeRecord.campus_id == actor.campus_id,
            FrontOfficeRecord.collection == collection,
            FrontOfficeRecord.public_id == public_id,
        )
        .with_for_update()
    )
    if row is None:
        fail(404, "not_found", "That record was not found.")
    current = dict(row.body or {})
    if field == "parentApproval" and not (_record_student_keys(current) & _parent_child_keys(db, actor)):
        fail(403, "forbidden", "You can only decide outings for your own child.")
    if _derive_approval_status(collection, current) != "Pending":
        fail(409, "already_decided", "This gate pass already has a final decision.")

    decided_at = datetime.now(timezone.utc).isoformat()
    who = {
        "decision": decision,
        "remark": remark,
        "userId": str(actor.id),
        "email": actor.email,
        "role": code,
        "decidedAt": decided_at,
    }
    history = list(current.get("approvalHistory") or [])
    history.append({**who, "field": field})
    patch = {
        field: decision,
        f"{field}DecidedAt": decided_at,
        f"{'parent' if field == 'parentApproval' else 'principal'}Decision": who,
        "approvalStatus": decision,
        "approvalHistory": history,
        "decidedById": str(actor.id),
        "decidedByEmail": actor.email,
        "decidedByRole": code,
        "decidedAt": decided_at,
        "decisionRemark": remark,
    }
    if collection == "student-gate-passes":
        patch["status"] = decision
    row.body = {**current, **patch, "id": public_id}
    row.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(row)
    return _as_item(row)
