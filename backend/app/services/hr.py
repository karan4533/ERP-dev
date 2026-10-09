import secrets
from datetime import date

from sqlalchemy import delete, func, select
from sqlalchemy.orm import Session
from sqlalchemy.orm.attributes import flag_modified

from app.core.config import settings
from app.core.security import hash_password
from app.models import HrEmployee, HrRecord, Role, User
from app.deps import role_code_for
from app.permissions.matrix import ALL_ROLES
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
    "claims": "CLM",
    "incentives": "INC",
    "assignments": "ASG",
    "announcements": "ANN",
}
_KNOWN_ROLES = {code for code, _ in ALL_ROLES}
_ROLE_ALIASES = {
    "teacher": "teacher",
    "accounts": "accounthead",
    "accountant": "accounthead",
    "hr": "hr",
    "driver": "driver",
    "principal": "principal",
    "librarian": "librarian",
    "coordinator": "coordinator",
    "director": "director",
    "security": "gatekeeper",
}
_INACTIVE = {"Inactive", "Relieved", "Terminated"}

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
_SKIP_EXTRA = set(_PORTAL_FIELDS) | {"id", "name", "email", "first_name", "last_name", "temporaryPassword", "userId"}


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
    rows = list(
        db.scalars(
            select(HrEmployee).where(HrEmployee.campus_id == actor.campus_id).order_by(HrEmployee.employee_code)
        ).all()
    )
    if _sees_all(db, actor):
        return rows
    own = _own_employee(db, actor)
    if own is None:
        return []
    if _is_department_head(db, actor):
        return [row for row in rows if (row.department or "") == (own.department or "")]
    return [row for row in rows if row.id == own.id]


def get_employee(db: Session, actor: User, employee_code: str) -> HrEmployee:
    row = next((item for item in list_employees(db, actor) if item.employee_code == employee_code), None)
    if row is None:
        fail(404, "not_found", "Employee was not found.")
    return row


def portal_employees(db: Session, actor: User) -> list[dict]:
    return [_to_portal(row) for row in list_employees(db, actor)]


def create_staff(db: Session, actor: User, item: dict) -> dict:
    role_title = str(item.get("role") or "").strip()
    if _role_code(role_title) is None:
        fail(422, "role_required", "Pick a role from the fixed list.")
    email = str(item.get("email") or "").lower().strip()
    if not email:
        fail(422, "email_required", "Each employee needs an email.")
    code = str(item.get("id") or _next_employee_code(db))
    if db.scalar(select(HrEmployee).where(HrEmployee.employee_code == code)) is not None:
        fail(409, "already_exists", "That employee id already exists.")
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
    temporary = _provision_user(db, actor, row)
    _remember_assignment(db, actor, row, None)
    _sync_login_active(db, row)
    write_audit(
        db,
        action="HR_STAFF_USER_CREATED",
        entity_type="hr_employee",
        entity_id=str(row.id),
        actor_id=actor.id,
        campus_id=actor.campus_id,
        details=row.employee_code,
    )
    db.commit()
    db.refresh(row)
    portal = _to_portal(row)
    if temporary and settings.otp_debug:
        portal["temporaryPassword"] = temporary
    return portal


def replace_portal_employees(db: Session, actor: User, items: list[dict]) -> list[dict]:
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
        row = db.scalar(
            select(HrEmployee).where(
                HrEmployee.campus_id == actor.campus_id,
                HrEmployee.employee_code == code,
            )
        )
        previous = None
        if row is None:
            row = HrEmployee(
                campus_id=actor.campus_id,
                employee_code=code,
                first_name="Staff",
                last_name="-",
                email=email,
            )
            db.add(row)
        else:
            previous = {"department": row.department or "", "role": row.role_title or ""}
        _apply_portal(row, item, existing=previous is not None)
        db.flush()
        _provision_user(db, actor, row)
        _sync_user_role(db, row)
        _remember_assignment(db, actor, row, previous)
        _sync_login_active(db, row)
    for existing in list_employees(db, actor):
        if existing.employee_code not in codes:
            existing.status = "Inactive"
            _sync_login_active(db, existing)
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
    return _visible_records(db, actor, collection, [dict(row.body) for row in rows])


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
    if collection == "leave-requests":
        _sync_leave_attendance(db, actor, [saved])
    if collection == "exits":
        _apply_exits(db, actor, [saved])
    _audit_collection(db, actor, "HR_RECORD_CREATED", collection, public_id)
    db.commit()
    return saved


def replace_items(db: Session, actor: User, collection: str, items: list[dict]) -> list[dict]:
    _check_collection(collection)
    existing = {
        row.public_id: dict(row.body)
        for row in db.scalars(
            select(HrRecord).where(HrRecord.campus_id == actor.campus_id, HrRecord.collection == collection)
        ).all()
    }
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
        old = existing.get(public_id)
        if old and _is_locked(collection, old):
            body = old
        db.add(
            HrRecord(
                campus_id=actor.campus_id,
                collection=collection,
                public_id=public_id,
                body=body,
            )
        )
        saved.append(body)
    if collection == "leave-requests":
        _sync_leave_attendance(db, actor, saved)
    if collection == "exits":
        _apply_exits(db, actor, saved)
    if collection == "payroll-revisions":
        _apply_increments(db, actor, saved)
    _audit_collection(db, actor, "HR_COLLECTION_SAVED", collection, str(len(saved)))
    db.commit()
    return saved


def patch_item(db: Session, actor: User, collection: str, public_id: str, body: dict) -> dict:
    _check_collection(collection)
    row = _find_record(db, actor, collection, public_id)
    if row is None:
        fail(404, "not_found", "Record was not found.")
    if _is_locked(collection, dict(row.body)):
        fail(409, "locked", "This record is permanent and cannot be edited.")
    merged = {**dict(row.body), **body, "id": public_id}
    row.body = merged
    flag_modified(row, "body")
    if collection == "leave-requests":
        _sync_leave_attendance(db, actor, [merged])
    if collection == "exits":
        _apply_exits(db, actor, [merged])
    _audit_collection(db, actor, "HR_RECORD_UPDATED", collection, public_id)
    db.commit()
    return merged


def leave_bundle(db: Session, actor: User) -> dict:
    policies = list_items(db, actor, "leave-policies")
    requests = list_items(db, actor, "leave-requests")
    balances = []
    for policy in policies:
        leave_type = policy.get("leaveType")
        entitlement = int(policy.get("entitlement") or 0)
        used = sum(
            int(item.get("days") or 0)
            for item in requests
            if item.get("leaveType") == leave_type and str(item.get("status") or "").lower() == "approved"
        )
        balances.append({"leaveType": leave_type, "entitlement": entitlement, "used": used, "balance": entitlement - used})
    return {"policies": policies, "requests": requests, "balances": balances}


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


def _apply_portal(row: HrEmployee, item: dict, *, existing: bool = False) -> None:
    if existing:
        if item.get("department") is not None:
            row.department = str(item.get("department") or "")
        if item.get("role") is not None:
            row.role_title = str(item.get("role") or "")
        if item.get("reportingManager") is not None:
            row.reporting_manager = str(item.get("reportingManager") or "")
        if item.get("status"):
            row.status = str(item["status"])
        return
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


_FULL_ACCESS = {"hr", "admin", "superadmin", "managing_director"}
_DEPARTMENT_HEADS = {
    "principal",
    "director",
    "coordinator",
    "jointdirector",
    "jointdirectorassistant",
    "accounthead",
    "transportmanager",
    "housekeepingmanager",
    "canteenmanager",
    "itsupportmanager",
    "librarian",
    "gatekeepermanager",
}


def _sees_all(db: Session, actor: User) -> bool:
    return role_code_for(db, actor) in _FULL_ACCESS


def _is_department_head(db: Session, actor: User) -> bool:
    return role_code_for(db, actor) in _DEPARTMENT_HEADS


def _own_employee(db: Session, actor: User) -> HrEmployee | None:
    by_user = db.scalar(select(HrEmployee).where(HrEmployee.user_id == actor.id))
    if by_user is not None:
        return by_user
    return db.scalar(select(HrEmployee).where(HrEmployee.email == actor.email))


def _visible_records(db: Session, actor: User, collection: str, bodies: list[dict]) -> list[dict]:
    if _sees_all(db, actor) or collection == "leave-policies":
        return bodies
    own = _own_employee(db, actor)
    if own is None:
        return []
    code = own.employee_code
    department = own.department or ""
    head = _is_department_head(db, actor)
    visible = []
    for body in bodies:
        participants = body.get("participantIds") or []
        if body.get("employeeId") == code or code in participants or body.get("email") == actor.email:
            visible.append(body)
        elif head and department and body.get("department") == department:
            visible.append(body)
    return visible


def _apply_increments(db: Session, actor: User, items: list[dict]) -> None:
    for item in items:
        if str(item.get("status") or "").lower() != "applied":
            continue
        code = str(item.get("employeeId") or "")
        employee = db.scalar(
            select(HrEmployee).where(HrEmployee.campus_id == actor.campus_id, HrEmployee.employee_code == code)
        )
        if employee is None:
            continue
        if item.get("newDesignation"):
            employee.designation = str(item["newDesignation"])
        if item.get("revisedGross") not in (None, ""):
            employee.gross_salary = int(item["revisedGross"])


def _role_code(title: str) -> str | None:
    compact = "".join(ch for ch in (title or "").lower() if ch.isalnum())
    if compact in _KNOWN_ROLES:
        return compact
    return _ROLE_ALIASES.get(compact)


def _is_locked(collection: str, body: dict) -> bool:
    status = str(body.get("status") or body.get("paymentStatus") or "")
    if collection == "payroll-months" and status.lower() in {"paid", "finalized"}:
        return True
    if collection == "payroll-revisions" and status.lower() == "applied":
        return True
    if collection == "disciplinary" and status.upper() == "APPROVED":
        return True
    return False


def _provision_user(db: Session, actor: User, row: HrEmployee) -> str | None:
    code = _role_code(row.role_title or "")
    if code is None:
        return None
    role = db.scalar(select(Role).where(Role.code == code))
    if role is None:
        return None
    existing = db.scalar(select(User).where(User.email == row.email))
    if existing is not None:
        row.user_id = existing.id
        return None
    temporary = f"Qmis@{secrets.randbelow(1_000_000):06d}"
    user = User(
        campus_id=actor.campus_id,
        role_id=role.id,
        email=row.email,
        password_hash=hash_password(temporary),
        is_active=True,
        must_change_password=True,
    )
    db.add(user)
    db.flush()
    row.user_id = user.id
    notice_id = f"COM-{row.employee_code}"
    if _find_record(db, actor, "comms", notice_id) is None:
        db.add(
            HrRecord(
                campus_id=actor.campus_id,
                collection="comms",
                public_id=notice_id,
                body={
                    "id": notice_id,
                    "channel": "Email",
                    "subject": "Temporary password",
                    "audience": row.email,
                    "status": "DEMO_SENT",
                    "at": date.today().isoformat(),
                },
            )
        )
    return temporary


def _sync_user_role(db: Session, row: HrEmployee) -> None:
    if row.user_id is None:
        return
    code = _role_code(row.role_title or "")
    role = db.scalar(select(Role).where(Role.code == code)) if code else None
    user = db.get(User, row.user_id)
    if role is None or user is None or user.email in {settings.admin_seed_email, settings.hr_seed_email}:
        return
    user.role_id = role.id


def _sync_login_active(db: Session, row: HrEmployee) -> None:
    if row.user_id is None:
        return
    user = db.get(User, row.user_id)
    if user is None or user.email in {settings.admin_seed_email, settings.hr_seed_email}:
        return
    user.is_active = (row.status or "Active") not in _INACTIVE


def _remember_assignment(db: Session, actor: User, row: HrEmployee, previous: dict | None) -> None:
    current = {"department": row.department or "", "role": row.role_title or ""}
    if previous == current:
        return
    public_id = f"ASG-{row.employee_code}-{date.today().isoformat()}"
    body = {
        "id": public_id,
        "employeeId": row.employee_code,
        "department": current["department"],
        "role": current["role"],
        "previousDepartment": "" if previous is None else previous["department"],
        "previousRole": "" if previous is None else previous["role"],
        "approver": "HR",
        "date": date.today().isoformat(),
    }
    found = _find_record(db, actor, "assignments", public_id)
    if found is None:
        db.add(
            HrRecord(
                campus_id=actor.campus_id,
                collection="assignments",
                public_id=public_id,
                body=body,
            )
        )
    else:
        found.body = body
        flag_modified(found, "body")


def _sync_leave_attendance(db: Session, actor: User, requests: list[dict]) -> None:
    for request in requests:
        if str(request.get("status") or "").lower() != "approved":
            continue
        public_id = f"LVE-{request['id']}"
        leave_type = str(request.get("leaveType") or "").lower()
        body = {
            "id": public_id,
            "employeeId": request.get("employeeId"),
            "date": request.get("fromDate") or "",
            "status": "Permission" if "permission" in leave_type else "Leave",
            "source": "Leave approval",
            "checkIn": "—",
            "checkOut": "—",
            "punchIn": "",
            "punchOut": "",
        }
        found = _find_record(db, actor, "attendance", public_id)
        if found is None:
            db.add(
                HrRecord(
                    campus_id=actor.campus_id,
                    collection="attendance",
                    public_id=public_id,
                    body=body,
                )
            )
        else:
            found.body = body
            flag_modified(found, "body")


def _apply_exits(db: Session, actor: User, items: list[dict]) -> None:
    for item in items:
        if str(item.get("status") or "").lower() not in {"completed", "relieved"}:
            continue
        code = str(item.get("employeeId") or "")
        if not code:
            continue
        employee = db.scalar(
            select(HrEmployee).where(
                HrEmployee.campus_id == actor.campus_id,
                HrEmployee.employee_code == code,
            )
        )
        if employee is None:
            continue
        employee.status = "Inactive"
        _sync_login_active(db, employee)
