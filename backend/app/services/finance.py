"""Campus-scoped Finance state matching Account Head FinanceContext collections."""

from datetime import datetime, timezone

from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.models import Admission, FinanceRecord, Student, User
from app.services.audit import write_audit
from app.services.errors import fail

STATE_COLLECTIONS = (
    "students",
    "feeCategories",
    "feeStructures",
    "fineRules",
    "bankAccounts",
    "posTerminals",
    "concessions",
    "installments",
    "annualBudget",
    "transactions",
    "receipts",
    "cheques",
    "paymentLinks",
    "auditLog",
    "glEntries",
    "dayBookEntries",
    "cashBookEntries",
    "bankBookEntries",
    "onlineBookEntries",
    "reconciliationItems",
    "activityFees",
    "wallets",
    "walletRecharges",
    "transportFleet",
    "approvals",
    "sequence",
    "meta",
)

_SNAPSHOT = "snapshot"
_SNAPSHOT_ID = "current"


def _utcnow() -> str:
    return datetime.now(timezone.utc).isoformat()


def _empty_state() -> dict:
    return {key: ([] if key != "sequence" else {}) for key in STATE_COLLECTIONS if key != "meta"} | {
        "sequence": {"pay": 1, "rec": 1, "txn": 1, "voucher": 1, "link": 1},
        "meta": {"seeded": False},
    }


def _enrolled_students(db: Session, campus_id) -> list[dict]:
    students = db.scalars(select(Student).where(Student.campus_id == campus_id)).all()
    rows: list[dict] = []
    for student in students:
        admission = None
        if student.admission_id:
            admission = db.get(Admission, student.admission_id)
        name = student.full_name
        parts = name.split()
        initials = "".join(part[0] for part in parts[:2]).upper() if parts else "ST"
        rows.append(
            {
                "id": str(student.id),
                "name": name,
                "shortName": parts[0] if parts else name,
                "initials": initials,
                "admissionNo": student.admission_number,
                "rollNo": "",
                "applicationNo": "",
                "registerNo": "",
                "className": student.class_name,
                "section": "",
                "academicYear": "2026-2027",
                "dateOfBirth": admission.date_of_birth.isoformat() if admission and admission.date_of_birth else "",
                "bloodGroup": (admission.blood_group if admission else "") or "",
                "fatherName": (admission.father_name if admission else "") or "",
                "motherName": (admission.mother_name if admission else "") or "",
                "phone": (admission.mobile_number if admission else "") or "",
                "email": (admission.email if admission else "") or "",
                "familyId": str(student.parent_user_id or student.id),
                "status": "Active",
            }
        )
    return rows


def get_state(db: Session, actor: User) -> dict:
    row = db.scalar(
        select(FinanceRecord).where(
            FinanceRecord.campus_id == actor.campus_id,
            FinanceRecord.collection == _SNAPSHOT,
            FinanceRecord.public_id == _SNAPSHOT_ID,
        )
    )
    if row is None:
        data = _empty_state()
        enrolled = _enrolled_students(db, actor.campus_id)
        if enrolled:
            data["students"] = enrolled
        return {"data": data, "savedAt": None, "seeded": False}

    raw = dict(row.body or {})
    saved_at = raw.pop("_savedAt", None)
    data = raw
    # Always refresh enrolled students from SIS when present
    enrolled = _enrolled_students(db, actor.campus_id)
    if enrolled:
        # Keep demo students that are not UUIDs, append enrolled
        existing = [s for s in (data.get("students") or []) if not _looks_uuid(str(s.get("id", "")))]
        data["students"] = existing + enrolled
    meta = data.get("meta") or {}
    return {
        "data": data,
        "savedAt": saved_at,
        "seeded": bool(meta.get("seeded")),
    }


def _looks_uuid(value: str) -> bool:
    parts = value.split("-")
    return len(parts) == 5 and len(value) >= 32


def save_state(db: Session, actor: User, payload: dict) -> dict:
    data = payload.get("data")
    if not isinstance(data, dict):
        fail(400, "validation_error", "Finance state data object is required.")

    cleaned = _empty_state()
    for key in STATE_COLLECTIONS:
        if key in data:
            cleaned[key] = data[key]
    cleaned["meta"] = {**(cleaned.get("meta") or {}), **(data.get("meta") or {}), "seeded": True}
    cleaned["_savedAt"] = _utcnow()

    row = db.scalar(
        select(FinanceRecord).where(
            FinanceRecord.campus_id == actor.campus_id,
            FinanceRecord.collection == _SNAPSHOT,
            FinanceRecord.public_id == _SNAPSHOT_ID,
        )
    )
    if row is None:
        row = FinanceRecord(
            campus_id=actor.campus_id,
            collection=_SNAPSHOT,
            public_id=_SNAPSHOT_ID,
            body=cleaned,
        )
        db.add(row)
    else:
        row.body = cleaned

    write_audit(
        db,
        action="FINANCE_STATE_SAVED",
        entity_type="finance_snapshot",
        entity_id=_SNAPSHOT_ID,
        actor_id=actor.id,
        campus_id=actor.campus_id,
    )
    db.commit()
    db.refresh(row)
    return {
        "data": {k: v for k, v in cleaned.items() if k != "_savedAt"},
        "savedAt": cleaned["_savedAt"],
        "seeded": True,
    }


def list_collection(db: Session, actor: User, collection: str) -> list:
    if collection not in STATE_COLLECTIONS or collection in {"sequence", "meta"}:
        fail(404, "not_found", "Unknown finance collection.")
    state = get_state(db, actor)
    value = state["data"].get(collection) or []
    return value if isinstance(value, list) else []


def replace_collection(db: Session, actor: User, collection: str, items: list) -> list:
    if collection not in STATE_COLLECTIONS or collection in {"sequence", "meta"}:
        fail(404, "not_found", "Unknown finance collection.")
    if not isinstance(items, list):
        fail(400, "validation_error", "Expected a list of records.")
    state = get_state(db, actor)
    data = dict(state["data"])
    data[collection] = items
    data["meta"] = {**(data.get("meta") or {}), "seeded": True}
    save_state(db, actor, {"data": data})
    return items


def reset_state(db: Session, actor: User) -> dict:
    db.execute(
        delete(FinanceRecord).where(
            FinanceRecord.campus_id == actor.campus_id,
            FinanceRecord.collection == _SNAPSHOT,
        )
    )
    write_audit(
        db,
        action="FINANCE_STATE_RESET",
        entity_type="finance_snapshot",
        entity_id=_SNAPSHOT_ID,
        actor_id=actor.id,
        campus_id=actor.campus_id,
    )
    db.commit()
    return get_state(db, actor)
