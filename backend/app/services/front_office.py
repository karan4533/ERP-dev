"""Front Office (PRM) campus records: gate passes, student transfer, re-enrollment."""

from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.deps import role_code_for
from app.models import FrontOfficeRecord, User
from app.services.errors import fail

COLLECTIONS: dict[str, str] = {
    "student-gate-passes": "SGP",
    "hostel-gate-passes": "HGP",
    "material-gate-passes": "MGP",
    "goods-received-passes": "GRP",
    "student-transfers": "STR",
    "student-re-enrollments": "SRE",
    # W1 compatibility alias — authoritative SoT is /api/v1/ops/gate-visitors
    "visitors": "VIS",
}

_VISITORS_OPS_COLLECTION = "gate-visitors"

_WRITERS = {"prm", "admin", "superadmin", "managing_director"}
_READERS = _WRITERS | {"principal", "director"}
_GATE_PASS_READERS = {"gatekeeper", "gatekeepermanager"}


def _code(db: Session, actor: User) -> str:
    return role_code_for(db, actor)


def _ensure_collection(collection: str) -> None:
    if collection not in COLLECTIONS:
        fail(404, "not_found", "That front-office collection does not exist.")


def _can_read(db: Session, actor: User, collection: str | None = None) -> bool:
    code = _code(db, actor)
    if code in _READERS:
        return True
    return bool(collection and collection.endswith("gate-passes") and code in _GATE_PASS_READERS)


def _can_write(db: Session, actor: User) -> bool:
    return _code(db, actor) in _WRITERS


def _as_item(row: FrontOfficeRecord) -> dict:
    body = dict(row.body or {})
    body.setdefault("id", row.public_id)
    body["id"] = row.public_id
    body["_collection"] = row.collection
    body["_updatedAt"] = row.updated_at.isoformat() if row.updated_at else None
    body["_createdAt"] = row.created_at.isoformat() if row.created_at else None
    return body


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
    if collection == "visitors":
        from app.services import ops_collections as ops

        return ops.list_records(db, actor, _VISITORS_OPS_COLLECTION)
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
    if collection == "visitors":
        from app.services import ops_collections as ops

        rows = ops.list_records(db, actor, _VISITORS_OPS_COLLECTION)
        match = next((row for row in rows if str(row.get("id")) == str(public_id)), None)
        if match is None:
            fail(404, "not_found", "That record was not found.")
        return match
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
    if collection == "visitors":
        from app.services import ops_collections as ops

        if not isinstance(body, dict):
            fail(422, "invalid_body", "Body must be an object.")
        existing = ops.list_records(db, actor, _VISITORS_OPS_COLLECTION)
        public_id = str(body.get("id") or "").strip() or f"GVS-{len(existing) + 1:04d}"
        payload = {**body, "id": public_id, "status": body.get("status") or "Checked In"}
        rows = [payload, *existing]
        saved = ops.replace_records(db, actor, _VISITORS_OPS_COLLECTION, rows)
        return next((row for row in saved if str(row.get("id")) == public_id), payload)
    if not _can_write(db, actor):
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
    payload = {**body, "id": public_id}
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
    if collection == "visitors":
        from app.services import ops_collections as ops

        if not isinstance(body, dict):
            fail(422, "invalid_body", "Body must be an object.")
        existing = ops.list_records(db, actor, _VISITORS_OPS_COLLECTION)
        idx = next((i for i, row in enumerate(existing) if str(row.get("id")) == str(public_id)), -1)
        if idx < 0:
            fail(404, "not_found", "That record was not found.")
        merged = {**existing[idx], **body, "id": public_id}
        existing[idx] = merged
        saved = ops.replace_records(db, actor, _VISITORS_OPS_COLLECTION, existing)
        return next((row for row in saved if str(row.get("id")) == str(public_id)), merged)
    if not _can_write(db, actor):
        fail(403, "forbidden", "You are not allowed to change front-office records.")
    row = db.scalar(
        select(FrontOfficeRecord).where(
            FrontOfficeRecord.campus_id == actor.campus_id,
            FrontOfficeRecord.collection == collection,
            FrontOfficeRecord.public_id == public_id,
        )
    )
    if row is None:
        fail(404, "not_found", "That record was not found.")
    if not isinstance(body, dict):
        fail(422, "invalid_body", "Body must be an object.")
    merged = {**(row.body or {}), **body, "id": public_id}
    if collection.endswith("gate-passes") or collection.endswith("passes"):
        merged.setdefault("gatePassId", public_id)
    row.body = merged
    row.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(row)
    return _as_item(row)


def delete_record(db: Session, actor: User, collection: str, public_id: str) -> None:
    _ensure_collection(collection)
    if not _can_write(db, actor):
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
    db.delete(row)
    db.commit()
