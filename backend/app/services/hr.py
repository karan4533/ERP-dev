from sqlalchemy import delete, func, select
from sqlalchemy.orm import Session
from sqlalchemy.orm.attributes import flag_modified

from app.models import HrEmployee, HrRecord, User
from app.services.audit import write_audit
from app.services.errors import fail

LIST_COLLECTIONS: dict[str, str] = {
    "documents": "DOC",
    "jobs": "JOB",
    "candidates": "CAN",
    "interviews": "INT",
    "offers": "OFR",
    "onboarding": "ONB",
    "observations": "OBS",
    "shadow": "SHD",
    "training": "TRN",
    "attendance": "ATT",
    "leave-policies": "POL",
    "leave-requests": "LVE",
    "payroll-months": "PAY",
    "payroll-revisions": "REV",
    "payslips": "PSL",
    "advances": "ADV",
    "referrals": "REF",
    "concessions": "CON",
    "disciplinary": "DSC",
    "exits": "EXT",
    "performance": "PRF",
    "notifications": "NTF",
    "comms": "COM",
    "meta": "MET",
}

_PORTAL_FIELDS = {
    "gender": "gender",
    "dateOfBirth": "date_of_birth",
    "contact": "phone",
    "address": "address",
    "department": "department",
    "designation": "designation",
    "joiningDate": "joining_date",
    "status": "status",
    "reportingManager": "reporting_manager",
    "role": "role_title",
    "qualification": "qualification",
    "experience": "experience",
    "emergencyContact": "emergency_contact",
    "employmentType": "employment_type",
    "category": "category",
    "grossSalary": "gross_salary",
    "otherAllowance": "other_allowance",
    "specialDeduction": "special_deduction",
    "otherEmployerBenefits": "other_employer_benefits",
}
_MONEY = {"gross_salary", "other_allowance", "special_deduction", "other_employer_benefits"}
_SKIP_EXTRA = set(_PORTAL_FIELDS) | {"id", "name", "email", "first_name", "last_name"}


def create_employee(db: Session, actor: User, payload) -> HrEmployee:
    email = payload.email.lower().strip()
    taken = db.scalar(select(HrEmployee).where(HrEmployee.email == email))
    if taken is not None:
        fail(409, "email_taken", "An employee with this email already exists.")
    row = HrEmployee(
        campus_id=actor.campus_id,
        employee_code=_next_employee_code(db),
        first_name=payload.first_name.strip(),
        last_name=payload.last_name.strip(),
        email=email,
        phone=payload.phone,
        department=payload.department,
        designation=payload.designation,
        joining_date=payload.joining_date,
        status=payload.status or "Active",
        employment_type=payload.employment_type,
        category=payload.category,
        gross_salary=payload.gross_salary or 0,
    )
    db.add(row)
    db.flush()
    write_audit(
        db,
        action="HR_EMPLOYEE_CREATED",
        entity_type="hr_employee",
        entity_id=str(row.id),
        actor_id=actor.id,
        campus_id=actor.campus_id,
        details=row.employee_code,
    )
    db.commit()
    db.refresh(row)
    return row


def list_employees(db: Session, actor: User) -> list[HrEmployee]:
    return list(
        db.scalars(
            select(HrEmployee).where(HrEmployee.campus_id == actor.campus_id).order_by(HrEmployee.employee_code)
        ).all()
    )


def get_employee(db: Session, actor: User, employee_code: str) -> HrEmployee:
    row = db.scalar(
        select(HrEmployee).where(
            HrEmployee.campus_id == actor.campus_id,
            HrEmployee.employee_code == employee_code,
        )
    )
    if row is None:
        fail(404, "not_found", "Employee was not found.")
    return row


def portal_employees(db: Session, actor: User) -> list[dict]:
    return [_to_portal(row) for row in list_employees(db, actor)]


def replace_portal_employees(db: Session, actor: User, items: list[dict]) -> list[dict]:
    db.execute(delete(HrEmployee).where(HrEmployee.campus_id == actor.campus_id))
    db.flush()
    seen: set[str] = set()
    codes: set[str] = set()
    for item in items:
        email = str(item.get("email") or "").lower().strip()
        if not email:
            fail(422, "email_required", "Each employee needs an email.")
        if email in seen:
            fail(409, "email_taken", "Two employees cannot share an email.")
        seen.add(email)
        code = str(item.get("id") or _next_employee_code(db))
        if code in codes:
            fail(409, "already_exists", "Two employees cannot share an id.")
        codes.add(code)
        row = HrEmployee(
            campus_id=actor.campus_id,
            employee_code=code,
            first_name="Staff",
            last_name="-",
            email=email,
        )
        _apply_portal(row, item)
        db.add(row)
        db.flush()
    write_audit(
        db,
        action="HR_EMPLOYEES_SAVED",
        entity_type="hr_employee",
        actor_id=actor.id,
        campus_id=actor.campus_id,
        details=str(len(items)),
    )
    db.commit()
    return portal_employees(db, actor)


def list_items(db: Session, actor: User, collection: str) -> list[dict]:
    _check_collection(collection)
    rows = db.scalars(
        select(HrRecord)
        .where(HrRecord.campus_id == actor.campus_id, HrRecord.collection == collection)
        .order_by(HrRecord.public_id)
    ).all()
    return [dict(row.body) for row in rows]


def create_item(db: Session, actor: User, collection: str, body: dict) -> dict:
    _check_collection(collection)
    public_id = str(body.get("id") or _next_public_id(db, actor, collection))
    existing = _find_record(db, actor, collection, public_id)
    if existing is not None:
        fail(409, "already_exists", "That record id already exists.")
    saved = {**body, "id": public_id}
    db.add(
        HrRecord(
            campus_id=actor.campus_id,
            collection=collection,
            public_id=public_id,
            body=saved,
        )
    )
    _audit_collection(db, actor, "HR_RECORD_CREATED", collection, public_id)
    db.commit()
    return saved


def replace_items(db: Session, actor: User, collection: str, items: list[dict]) -> list[dict]:
    _check_collection(collection)
    db.execute(
        delete(HrRecord).where(HrRecord.campus_id == actor.campus_id, HrRecord.collection == collection)
    )
    saved: list[dict] = []
    seen: set[str] = set()
    for item in items:
        public_id = str(item.get("id") or _next_public_id(db, actor, collection, reserved=seen))
        if public_id in seen:
            fail(409, "already_exists", "That record id is repeated.")
        seen.add(public_id)
        body = {**item, "id": public_id}
        db.add(
            HrRecord(
                campus_id=actor.campus_id,
                collection=collection,
                public_id=public_id,
                body=body,
            )
        )
        saved.append(body)
    _audit_collection(db, actor, "HR_COLLECTION_SAVED", collection, str(len(saved)))
    db.commit()
    return saved


def patch_item(db: Session, actor: User, collection: str, public_id: str, body: dict) -> dict:
    _check_collection(collection)
    row = _find_record(db, actor, collection, public_id)
    if row is None:
        fail(404, "not_found", "Record was not found.")
    merged = {**dict(row.body), **body, "id": public_id}
    row.body = merged
    flag_modified(row, "body")
    _audit_collection(db, actor, "HR_RECORD_UPDATED", collection, public_id)
    db.commit()
    return merged


def leave_bundle(db: Session, actor: User) -> dict:
    return {
        "policies": list_items(db, actor, "leave-policies"),
        "requests": list_items(db, actor, "leave-requests"),
    }


def save_leave_bundle(db: Session, actor: User, body: dict) -> dict:
    replace_items(db, actor, "leave-policies", list(body.get("policies") or []))
    replace_items(db, actor, "leave-requests", list(body.get("requests") or []))
    return leave_bundle(db, actor)


def payroll_bundle(db: Session, actor: User) -> dict:
    return {
        "months": list_items(db, actor, "payroll-months"),
        "revisions": list_items(db, actor, "payroll-revisions"),
    }


def save_payroll_bundle(db: Session, actor: User, body: dict) -> dict:
    replace_items(db, actor, "payroll-months", list(body.get("months") or []))
    replace_items(db, actor, "payroll-revisions", list(body.get("revisions") or []))
    return payroll_bundle(db, actor)


def documents_for_employee(db: Session, actor: User, employee_code: str) -> list[dict]:
    get_employee(db, actor, employee_code)
    return [item for item in list_items(db, actor, "documents") if item.get("employeeId") == employee_code]


def _check_collection(collection: str) -> None:
    if collection not in LIST_COLLECTIONS:
        fail(404, "not_found", "That HR collection does not exist.")


def _find_record(db: Session, actor: User, collection: str, public_id: str) -> HrRecord | None:
    return db.scalar(
        select(HrRecord).where(
            HrRecord.campus_id == actor.campus_id,
            HrRecord.collection == collection,
            HrRecord.public_id == public_id,
        )
    )


def _next_public_id(db: Session, actor: User, collection: str, reserved: set[str] | None = None) -> str:
    prefix = LIST_COLLECTIONS[collection]
    rows = db.scalars(
        select(HrRecord.public_id).where(HrRecord.campus_id == actor.campus_id, HrRecord.collection == collection)
    ).all()
    numbers = []
    for public_id in list(rows) + list(reserved or []):
        tail = str(public_id).split("-")[-1]
        if tail.isdigit():
            numbers.append(int(tail))
    return f"{prefix}-{max(numbers, default=0) + 1:03d}"


def _next_employee_code(db: Session) -> str:
    count = db.scalar(select(func.count()).select_from(HrEmployee)) or 0
    return f"EMP-{count + 1:04d}"


def _audit_collection(db: Session, actor: User, action: str, collection: str, details: str) -> None:
    write_audit(
        db,
        action=action,
        entity_type=collection,
        actor_id=actor.id,
        campus_id=actor.campus_id,
        details=details,
    )


def _to_portal(row: HrEmployee) -> dict:
    last = "" if row.last_name in (None, "-") else row.last_name
    name = f"{row.first_name} {last}".strip()
    portal = {
        "id": row.employee_code,
        "name": name,
        "email": row.email,
        "gender": row.gender or "",
        "dateOfBirth": row.date_of_birth or "",
        "contact": row.phone or "",
        "address": row.address or "",
        "department": row.department or "",
        "designation": row.designation or "",
        "joiningDate": row.joining_date or "",
        "status": row.status or "Active",
        "reportingManager": row.reporting_manager or "",
        "role": row.role_title or "",
        "qualification": row.qualification or "",
        "experience": row.experience or "",
        "emergencyContact": row.emergency_contact or "",
        "employmentType": row.employment_type or "",
        "category": row.category or "",
        "grossSalary": row.gross_salary or 0,
        "otherAllowance": row.other_allowance or 0,
        "specialDeduction": row.special_deduction or 0,
        "otherEmployerBenefits": row.other_employer_benefits or 0,
    }
    return {**(row.extra or {}), **portal}


def _apply_portal(row: HrEmployee, item: dict) -> None:
    if item.get("first_name"):
        row.first_name = str(item["first_name"]).strip() or "Staff"
        row.last_name = str(item.get("last_name") or "-").strip() or "-"
    else:
        parts = str(item.get("name") or "Staff").strip().split(" ", 1)
        row.first_name = parts[0] or "Staff"
        row.last_name = parts[1] if len(parts) > 1 else "-"
    row.email = str(item.get("email") or "").lower().strip()
    for key, attr in _PORTAL_FIELDS.items():
        if key not in item or item[key] is None:
            continue
        value = item[key]
        if attr in _MONEY:
            value = int(value or 0)
        else:
            value = str(value)
        setattr(row, attr, value)
    if not row.status:
        row.status = "Active"
    row.extra = {key: value for key, value in item.items() if key not in _SKIP_EXTRA}
