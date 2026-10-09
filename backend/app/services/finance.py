"""Campus-scoped Finance state matching Account Head FinanceContext collections."""

from datetime import datetime, timezone

from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.models import Admission, FinanceRecord, FinancialYear, Student, User
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


def _looks_uuid(value: str) -> bool:
    parts = value.split("-")
    return len(parts) == 5 and len(value) >= 32


def _as_non_negative(value, *, field: str) -> float:
    try:
        amount = float(value)
    except (TypeError, ValueError):
        fail(400, "validation_error", f"{field} must be a number.")
    if amount < 0:
        fail(400, "validation_error", f"{field} cannot be negative.")
    return amount


def _validate_fee_categories(rows) -> list:
    if not isinstance(rows, list):
        fail(400, "validation_error", "feeCategories must be a list.")
    seen: set[str] = set()
    cleaned: list = []
    for index, row in enumerate(rows):
        if not isinstance(row, dict):
            fail(400, "validation_error", f"feeCategories[{index}] must be an object.")
        cid = str(row.get("id") or "").strip()
        name = str(row.get("name") or row.get("label") or "").strip()
        if not cid or not name:
            fail(400, "validation_error", f"feeCategories[{index}] requires id and name.")
        if cid in seen:
            fail(400, "validation_error", f"Duplicate fee category id: {cid}")
        seen.add(cid)
        cleaned.append(row)
    return cleaned


def _validate_fee_structures(rows) -> list:
    if not isinstance(rows, list):
        fail(400, "validation_error", "feeStructures must be a list.")
    seen: set[str] = set()
    cleaned: list = []
    for index, row in enumerate(rows):
        if not isinstance(row, dict):
            fail(400, "validation_error", f"feeStructures[{index}] must be an object.")
        sid = str(row.get("id") or "").strip()
        academic_year = str(row.get("academicYear") or row.get("academic_year") or "").strip()
        class_name = str(row.get("className") or row.get("class") or row.get("classId") or "").strip()
        if not sid:
            fail(400, "validation_error", f"feeStructures[{index}] requires id.")
        if not academic_year:
            fail(400, "validation_error", f"feeStructures[{index}] requires academicYear.")
        if not class_name:
            fail(400, "validation_error", f"feeStructures[{index}] requires className or classId.")
        if sid in seen:
            fail(400, "validation_error", f"Duplicate fee structure id: {sid}")
        seen.add(sid)
        if row.get("amount") is not None:
            _as_non_negative(row.get("amount"), field=f"feeStructures[{index}].amount")
        if row.get("totalAmount") is not None:
            _as_non_negative(row.get("totalAmount"), field=f"feeStructures[{index}].totalAmount")
        heads = row.get("heads") or row.get("feeHeads") or []
        if heads and not isinstance(heads, list):
            fail(400, "validation_error", f"feeStructures[{index}].heads must be a list.")
        for h_index, head in enumerate(heads or []):
            if isinstance(head, dict) and head.get("amount") is not None:
                _as_non_negative(head.get("amount"), field=f"feeStructures[{index}].heads[{h_index}].amount")
        cleaned.append(row)
    return cleaned


def _validate_fine_rules(rows) -> list:
    if not isinstance(rows, list):
        fail(400, "validation_error", "fineRules must be a list.")
    seen: set[str] = set()
    for index, row in enumerate(rows):
        if not isinstance(row, dict):
            fail(400, "validation_error", f"fineRules[{index}] must be an object.")
        rid = str(row.get("id") or "").strip()
        if not rid:
            fail(400, "validation_error", f"fineRules[{index}] requires id.")
        if rid in seen:
            fail(400, "validation_error", f"Duplicate fine rule id: {rid}")
        seen.add(rid)
        if row.get("amount") is not None:
            _as_non_negative(row.get("amount"), field=f"fineRules[{index}].amount")
        if row.get("percent") is not None:
            _as_non_negative(row.get("percent"), field=f"fineRules[{index}].percent")
        if row.get("graceDays") is not None:
            days = _as_non_negative(row.get("graceDays"), field=f"fineRules[{index}].graceDays")
            if days != int(days):
                fail(400, "validation_error", f"fineRules[{index}].graceDays must be a whole number.")
    return rows


def _validate_finance_config(data: dict) -> None:
    if "feeCategories" in data:
        data["feeCategories"] = _validate_fee_categories(data["feeCategories"])
    if "feeStructures" in data:
        data["feeStructures"] = _validate_fee_structures(data["feeStructures"])
    if "fineRules" in data:
        data["fineRules"] = _validate_fine_rules(data["fineRules"])


def _current_financial_year(db: Session, campus_id) -> FinancialYear | None:
    return db.scalar(
        select(FinancialYear).where(
            FinancialYear.campus_id == campus_id,
            FinancialYear.is_current.is_(True),
            FinancialYear.is_active.is_(True),
        )
    )


def _attach_financial_year_meta(db: Session, actor: User, data: dict) -> dict:
    meta = dict(data.get("meta") or {})
    year = _current_financial_year(db, actor.campus_id)
    if year is not None:
        meta["financialYearId"] = str(year.id)
        meta["financialYearName"] = year.name
        meta["financialYearStart"] = year.start_date.isoformat()
        meta["financialYearEnd"] = year.end_date.isoformat()
        meta["financialYearStartMonth"] = "April"
    data["meta"] = meta
    return data


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
        data = _attach_financial_year_meta(db, actor, data)
        return {"data": data, "savedAt": None, "seeded": False}

    raw = dict(row.body or {})
    saved_at = raw.pop("_savedAt", None)
    data = raw
    enrolled = _enrolled_students(db, actor.campus_id)
    if enrolled:
        existing = [s for s in (data.get("students") or []) if not _looks_uuid(str(s.get("id", "")))]
        data["students"] = existing + enrolled
    data = _attach_financial_year_meta(db, actor, data)
    meta = data.get("meta") or {}
    return {
        "data": data,
        "savedAt": saved_at,
        "seeded": bool(meta.get("seeded")),
    }


def save_state(db: Session, actor: User, payload: dict) -> dict:
    data = payload.get("data")
    if not isinstance(data, dict):
        fail(400, "validation_error", "Finance state data object is required.")

    cleaned = _empty_state()
    for key in STATE_COLLECTIONS:
        if key in data:
            cleaned[key] = data[key]
    cleaned["meta"] = {**(cleaned.get("meta") or {}), **(data.get("meta") or {}), "seeded": True}
    _validate_finance_config(cleaned)
    cleaned = _attach_financial_year_meta(db, actor, cleaned)
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
