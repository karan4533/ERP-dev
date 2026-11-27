from datetime import date, datetime, timezone
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.passwords import password_policy_message
from app.core.security import hash_password
from app.deps import role_code_for
from app.models import Admission, AdmissionEnquiry, AdmissionReferral, FinanceRecord, Guardian, Role, Student, User
from app.schemas.admissions import AdmissionCreate, EnrollAdmissionIn, EnquiryCreate
from app.services.audit import write_audit
from app.services.errors import fail
from app.services.finance import RECEIPT_LEDGER_COLLECTION
_REJECTED_RECEIPT_STATUSES = {
    "held",
    "cancelled",
    "canceled",
    "void",
    "failed",
    "pending",
    "pending_clearance",
    "rejected",
}
# Only settled receipts count; anything else (held cheque, pending gateway, unknown) does not.
_SETTLED_RECEIPT_STATUSES = {"issued", "paid", "cleared", "success", "successful", "completed", "generated", "verified"}
# Waiving the registration fee is a Finance decision, checked by role code (Admin holds every permission).
FEE_WAIVER_ROLES = {"accounthead", "financemanager", "superadmin", "managing_director"}
_FEE_WAIVER_COLLECTION = "admission-fee-waiver"


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def _whatsapp_parent(
    phone: str | None,
    text: str,
    *,
    event_key: str,
    event: str,
    template_params: list[str] | None = None,
) -> None:
    """Best-effort AskEva/WhatsApp notify. Never raises into the admission flow."""
    try:
        from app.services.integrations.notify import notify_event

        notify_event(
            event_key=event_key,
            subject="",
            body=text,
            phone=phone,
            event=event,
            template_params=template_params,
        )
    except Exception:
        pass


def _file_url(file_id: UUID | None) -> str | None:
    if file_id is None:
        return None
    return f"/api/v1/files/{file_id}/download"


def enquiry_to_out(row: AdmissionEnquiry) -> dict:
    code = (row.enquiry_code or "").strip() or f"AE-{str(row.id).split('-')[0]}"
    return {
        "id": row.id,
        "enquiry_code": code,
        "name": row.name or row.student_name or "",
        "mobile_number": row.mobile_number or row.guardian_phone or "",
        "email": row.email,
        "gender": row.gender,
        "address": row.address,
        "description": row.description,
        "note": row.note,
        "enquiry_date": row.enquiry_date,
        "next_follow_up_date": row.next_follow_up_date,
        "assigned_to": row.assigned_to,
        "reference": row.reference,
        "source": row.source,
        "class_name": row.class_name,
        "number_of_child": row.number_of_child,
        "city": row.city,
        "state": row.state,
        "profile_image_file_id": row.profile_image_file_id,
        "profile_image_url": _file_url(row.profile_image_file_id),
        "status": row.status,
        "converted_admission_id": row.converted_admission_id,
        "created_at": row.created_at,
    }


def admission_to_out(row: Admission) -> dict:
    return {
        "id": row.id,
        "admission_code": row.admission_code,
        "enquiry_id": row.enquiry_id,
        "admission_date": row.admission_date,
        "class_name": row.class_name,
        "registration_fees": row.registration_fees,
        "batch_start_year": row.batch_start_year,
        "batch_end_year": row.batch_end_year,
        "first_name": row.first_name,
        "middle_name": row.middle_name,
        "last_name": row.last_name,
        "gender": row.gender,
        "religion": row.religion,
        "caste": row.caste,
        "address": row.address,
        "date_of_birth": row.date_of_birth,
        "country": row.country,
        "state": row.state,
        "city": row.city,
        "zip_code": row.zip_code,
        "mobile_number": row.mobile_number,
        "alt_mobile_number": row.alt_mobile_number,
        "email": row.email,
        "previous_school": row.previous_school,
        "blood_group": row.blood_group,
        "height": row.height,
        "weight": row.weight,
        "medical_history": row.medical_history,
        "profile_image_file_id": row.profile_image_file_id,
        "profile_image_url": _file_url(row.profile_image_file_id),
        "mode_of_transport": row.mode_of_transport,
        "route": row.route,
        "bus_stop": row.bus_stop,
        "father_name": row.father_name,
        "mother_name": row.mother_name,
        "father_occupation": row.father_occupation,
        "mother_occupation": row.mother_occupation,
        "father_income": row.father_income,
        "mother_income": row.mother_income,
        "siblings": row.siblings,
        "parent_address": row.parent_address,
        "parent_country": row.parent_country,
        "parent_state": row.parent_state,
        "parent_city": row.parent_city,
        "parent_zip_code": row.parent_zip_code,
        "parent_mobile_number": row.parent_mobile_number,
        "parent_alt_mobile_number": row.parent_alt_mobile_number,
        "parent_email": row.parent_email,
        "parent_account_email": row.parent_account_email,
        "student_account_email": row.student_account_email,
        "has_parent_account_password": bool(row.parent_pending_password_hash),
        "has_student_account_password": bool(row.student_pending_password_hash),
        "fees_group": row.fees_group,
        **_referral_out(row.referral),
        "status": row.status,
        "enrolled_student_id": row.enrolled_student_id,
        "enrolled_at": row.enrolled_at,
        "created_at": row.created_at,
    }


def _referral_out(ref: AdmissionReferral | None) -> dict:
    return {
        "referral_type": ref.referrer_type if ref else None,
        "referral_name": ref.referrer_name if ref else None,
        "referral_contact": ref.referrer_contact if ref else None,
        "referral_student_admission_no": ref.referrer_student_admission_no if ref else None,
        "referral_notes": ref.notes if ref else None,
    }


def _apply_referral(row: Admission, payload: AdmissionCreate) -> None:
    # Clients that do not send referral fields leave any saved referral untouched.
    if "referral_name" not in payload.model_fields_set:
        return
    name = (payload.referral_name or "").strip()
    if not name:
        row.referral = None
        return
    clean = lambda value: (value or "").strip() or None  # noqa: E731
    ref = row.referral or AdmissionReferral(campus_id=row.campus_id)
    ref.referrer_type = payload.referral_type or "Other"
    ref.referrer_name = name
    ref.referrer_contact = clean(payload.referral_contact)
    ref.referrer_student_admission_no = clean(payload.referral_student_admission_no)
    ref.notes = clean(payload.referral_notes)
    ref.updated_at = _utcnow()
    row.referral = ref


def list_referrals(db: Session, actor: User) -> list[dict]:
    """Referred admissions for the Account Head to apply any bonus manually."""
    rows = db.scalars(
        select(AdmissionReferral)
        .join(Admission, Admission.id == AdmissionReferral.admission_id)
        .where(AdmissionReferral.campus_id == actor.campus_id)
        .order_by(AdmissionReferral.created_at.desc())
    ).all()
    return [
        {
            "id": str(ref.id),
            "admissionId": str(ref.admission_id),
            "admissionCode": ref.admission.admission_code,
            "studentName": _full_name(ref.admission),
            "className": ref.admission.class_name,
            "admissionStatus": ref.admission.status,
            "referrerType": ref.referrer_type,
            "referrerName": ref.referrer_name,
            "referrerContact": ref.referrer_contact,
            "referrerStudentAdmissionNo": ref.referrer_student_admission_no,
            "notes": ref.notes,
            "createdAt": ref.created_at.isoformat(),
        }
        for ref in rows
    ]


def _code_max_suffix(codes: list[str | None], prefix: str) -> int:
    max_n = 0
    needle = f"{prefix}-"
    for raw in codes:
        text = str(raw or "").strip().upper()
        if not text.startswith(needle):
            continue
        suffix = text[len(needle) :]
        if suffix.isdigit():
            max_n = max(max_n, int(suffix))
    return max_n


def _next_code(db: Session, model, prefix: str, campus_id: UUID) -> str:
    """Allocate AE-/ADM- codes without colliding with legacy student admission numbers."""
    if model is AdmissionEnquiry:
        column = AdmissionEnquiry.enquiry_code
    elif model is Admission:
        column = Admission.admission_code
    else:
        count = db.scalar(select(func.count()).select_from(model).where(model.campus_id == campus_id)) or 0
        return f"{prefix}-{int(count) + 1:04d}"

    codes = list(db.scalars(select(column).where(model.campus_id == campus_id)).all())
    max_n = _code_max_suffix(codes, prefix)
    if prefix == "ADM":
        student_codes = list(
            db.scalars(select(Student.admission_number).where(Student.campus_id == campus_id)).all()
        )
        max_n = max(max_n, _code_max_suffix(student_codes, prefix))
    return f"{prefix}-{max_n + 1:04d}"


def _get_enquiry(db: Session, actor: User, enquiry_id: UUID) -> AdmissionEnquiry:
    row = db.get(AdmissionEnquiry, enquiry_id)
    if row is None or row.campus_id != actor.campus_id:
        fail(404, "not_found", "Enquiry was not found.")
    return row


def _get_admission(db: Session, actor: User, admission_id: UUID) -> Admission:
    row = db.get(Admission, admission_id)
    if row is None or row.campus_id != actor.campus_id:
        fail(404, "not_found", "Admission was not found.")
    return row


def list_enquiries(db: Session, actor: User, status: str | None = None) -> list[dict]:
    stmt = select(AdmissionEnquiry).where(AdmissionEnquiry.campus_id == actor.campus_id)
    if status:
        stmt = stmt.where(AdmissionEnquiry.status == status)
    stmt = stmt.order_by(AdmissionEnquiry.created_at.desc())
    return [enquiry_to_out(row) for row in db.scalars(stmt).all()]


def get_enquiry(db: Session, actor: User, enquiry_id: UUID) -> dict:
    return enquiry_to_out(_get_enquiry(db, actor, enquiry_id))


def create_enquiry(db: Session, actor: User, payload: EnquiryCreate) -> dict:
    name = (payload.name or payload.student_name or "").strip()
    mobile = (payload.mobile_number or payload.guardian_phone or "").strip()
    class_name = (payload.class_name or "").strip()
    if not name:
        fail(400, "validation_error", "Name is required.")
    if not mobile:
        fail(400, "validation_error", "Mobile number is required.")
    if not class_name:
        fail(400, "validation_error", "Class is required.")

    row = AdmissionEnquiry(
        campus_id=actor.campus_id,
        enquiry_code=_next_code(db, AdmissionEnquiry, "AE", actor.campus_id),
        name=name,
        mobile_number=mobile,
        email=(payload.email or None),
        gender=payload.gender,
        address=payload.address,
        description=payload.description,
        note=payload.note,
        enquiry_date=payload.enquiry_date or date.today(),
        next_follow_up_date=payload.next_follow_up_date,
        assigned_to=payload.assigned_to,
        reference=payload.reference,
        source=payload.source,
        class_name=class_name,
        number_of_child=payload.number_of_child,
        city=payload.city,
        state=payload.state,
        profile_image_file_id=payload.profile_image_file_id,
        status=payload.status or "Active",
        student_name=name,
        # Legacy Phase-0 columns may still be NOT NULL on older Postgres schemas.
        guardian_name=(payload.guardian_name or payload.assigned_to or "Parent"),
        guardian_phone=mobile,
    )
    db.add(row)
    db.flush()
    write_audit(
        db,
        action="ENQUIRY_CREATED",
        entity_type="admission_enquiry",
        entity_id=str(row.id),
        actor_id=actor.id,
        campus_id=actor.campus_id,
    )
    db.commit()
    db.refresh(row)
    try:
        from app.services.integrations import whatsapp_events as wa

        text, params = wa.enquiry_message(
            student_name=name,
            class_name=class_name,
            enquiry_code=row.enquiry_code or "",
        )
        _whatsapp_parent(
            mobile,
            text,
            event_key=f"enquiry-created:{row.id}",
            event=wa.EVENT_ENQUIRY,
            template_params=params,
        )
    except Exception:
        pass
    return enquiry_to_out(row)


def update_enquiry(db: Session, actor: User, enquiry_id: UUID, payload: EnquiryCreate) -> dict:
    row = _get_enquiry(db, actor, enquiry_id)
    name = (payload.name or payload.student_name or row.name or "").strip()
    mobile = (payload.mobile_number or payload.guardian_phone or row.mobile_number or "").strip()
    class_name = (payload.class_name or row.class_name or "").strip()
    if not name or not mobile or not class_name:
        fail(400, "validation_error", "Name, mobile number, and class are required.")

    row.name = name
    row.mobile_number = mobile
    row.class_name = class_name
    row.email = payload.email
    row.gender = payload.gender
    row.address = payload.address
    row.description = payload.description
    row.note = payload.note
    row.enquiry_date = payload.enquiry_date or row.enquiry_date
    row.next_follow_up_date = payload.next_follow_up_date
    row.assigned_to = payload.assigned_to
    row.reference = payload.reference
    row.source = payload.source
    row.number_of_child = payload.number_of_child
    row.city = payload.city
    row.state = payload.state
    row.profile_image_file_id = payload.profile_image_file_id
    if payload.status:
        row.status = payload.status
    row.student_name = name
    row.guardian_phone = mobile
    row.updated_at = _utcnow()

    write_audit(
        db,
        action="ENQUIRY_UPDATED",
        entity_type="admission_enquiry",
        entity_id=str(row.id),
        actor_id=actor.id,
        campus_id=actor.campus_id,
    )
    db.commit()
    db.refresh(row)
    return enquiry_to_out(row)


def convert_enquiry(db: Session, actor: User, enquiry_id: UUID) -> dict:
    enquiry = _get_enquiry(db, actor, enquiry_id)
    if enquiry.converted_admission_id:
        existing = db.get(Admission, enquiry.converted_admission_id)
        if existing is not None:
            return admission_to_out(existing)

    parts = enquiry.name.strip().split(None, 1)
    first = parts[0] if parts else enquiry.name
    last = parts[1] if len(parts) > 1 else None

    admission = Admission(
        campus_id=actor.campus_id,
        enquiry_id=enquiry.id,
        admission_code=_next_code(db, Admission, "ADM", actor.campus_id),
        admission_date=date.today(),
        class_name=enquiry.class_name,
        first_name=first,
        last_name=last,
        gender=enquiry.gender,
        address=enquiry.address,
        mobile_number=enquiry.mobile_number,
        email=enquiry.email,
        city=enquiry.city,
        state=enquiry.state,
        profile_image_file_id=enquiry.profile_image_file_id,
        father_name=enquiry.guardian_name,
        parent_mobile_number=enquiry.mobile_number,
        status="Active",
    )
    db.add(admission)
    db.flush()
    enquiry.status = "Success"
    enquiry.converted_admission_id = admission.id
    enquiry.updated_at = _utcnow()
    write_audit(
        db,
        action="ENQUIRY_CONVERTED",
        entity_type="admission",
        entity_id=str(admission.id),
        actor_id=actor.id,
        campus_id=actor.campus_id,
        details=f"From enquiry {enquiry.enquiry_code}",
    )
    db.commit()
    db.refresh(admission)
    return admission_to_out(admission)


def list_admissions(db: Session, actor: User, status: str | None = None) -> list[dict]:
    stmt = select(Admission).where(Admission.campus_id == actor.campus_id)
    if status:
        stmt = stmt.where(Admission.status == status)
    stmt = stmt.order_by(Admission.created_at.desc())
    return [admission_to_out(row) for row in db.scalars(stmt).all()]


def list_enrolled_students(db: Session, actor: User) -> list[dict]:
    rows = db.scalars(
        select(Student).where(Student.campus_id == actor.campus_id).order_by(Student.full_name)
    ).all()
    return [
        {
            "id": str(row.id),
            "name": row.full_name,
            "admissionNumber": row.admission_number,
            "className": row.class_name or "",
        }
        for row in rows
    ]


def get_admission(db: Session, actor: User, admission_id: UUID) -> dict:
    return admission_to_out(_get_admission(db, actor, admission_id))


def _store_pending_password(row: Admission, *, field: str, password: str | None, email: str | None) -> None:
    """Hash and keep a temporary portal password until enroll (never returned in plaintext)."""
    plain = (password or "").strip()
    if not plain:
        return
    policy_message = password_policy_message(plain, email=(email or "").strip().lower() or None)
    if policy_message:
        fail(400, "weak_password", policy_message)
    setattr(row, field, hash_password(plain))


JUNIOR_STUDENT_LOGIN_MESSAGE = (
    "Student portal login is only for Grade {min_grade} and above. "
    "Younger children use the parent login; clear the student login fields."
)


def student_login_allowed(class_name: str | None) -> bool:
    """Pre-primary and grades below the configured minimum use the parent login only."""
    from app.core.config import settings
    from app.services.placement import school_grade

    grade = school_grade(class_name)
    return grade is None or grade >= settings.student_login_min_grade


def _reject_junior_student_login(
    class_name: str | None,
    email: str | None,
    password: str | None,
    *,
    password_hash: str | None = None,
) -> None:
    from app.core.config import settings

    # Match account-creation resolution: plain password OR a saved pending hash counts as login material.
    if (email or "").strip() or (password or "").strip() or (password_hash or "").strip():
        if not student_login_allowed(class_name):
            fail(400, "validation_error", JUNIOR_STUDENT_LOGIN_MESSAGE.format(min_grade=settings.student_login_min_grade))


def _apply_admission_fields(row: Admission, payload: AdmissionCreate) -> None:
    data = payload.model_dump(exclude_unset=False)
    skip = {"parent_account_password", "student_account_password"}
    for key, value in data.items():
        if key in skip:
            continue
        if hasattr(row, key):
            setattr(row, key, value)
    if payload.parent_account_email:
        row.parent_account_email = payload.parent_account_email.strip().lower()
    if payload.student_account_email:
        row.student_account_email = payload.student_account_email.strip().lower()
    else:
        # Empty / omitted clears optional student portal email on save.
        row.student_account_email = None
        row.student_pending_password_hash = None
    _store_pending_password(
        row,
        field="parent_pending_password_hash",
        password=payload.parent_account_password,
        email=payload.parent_account_email or row.parent_account_email,
    )
    _store_pending_password(
        row,
        field="student_pending_password_hash",
        password=payload.student_account_password,
        email=payload.student_account_email or row.student_account_email,
    )


def create_admission(db: Session, actor: User, payload: AdmissionCreate) -> dict:
    first = (payload.first_name or "").strip()
    mobile = (payload.mobile_number or "").strip()
    class_name = (payload.class_name or "").strip()
    if not first:
        fail(400, "validation_error", "First name is required.")
    if not mobile:
        fail(400, "validation_error", "Mobile number is required.")
    if not class_name:
        fail(400, "validation_error", "Class is required.")
    _reject_junior_student_login(class_name, payload.student_account_email, payload.student_account_password)

    if payload.enquiry_id:
        _get_enquiry(db, actor, payload.enquiry_id)

    row = Admission(
        campus_id=actor.campus_id,
        admission_code=_next_code(db, Admission, "ADM", actor.campus_id),
        status=payload.status or "Active",
    )
    _apply_admission_fields(row, payload)
    _apply_referral(row, payload)
    row.first_name = first
    row.mobile_number = mobile
    row.class_name = class_name
    row.admission_date = payload.admission_date or date.today()
    db.add(row)
    db.flush()

    if payload.enquiry_id:
        enquiry = _get_enquiry(db, actor, payload.enquiry_id)
        enquiry.status = "Success"
        enquiry.converted_admission_id = row.id
        enquiry.updated_at = _utcnow()

    write_audit(
        db,
        action="ADMISSION_CREATED",
        entity_type="admission",
        entity_id=str(row.id),
        actor_id=actor.id,
        campus_id=actor.campus_id,
    )
    db.commit()
    db.refresh(row)
    try:
        from app.services.integrations import whatsapp_events as wa

        notify_phone = (row.parent_mobile_number or row.mobile_number or mobile or "").strip()
        text, params = wa.admission_message(
            student_name=_full_name(row),
            class_name=class_name,
            admission_code=row.admission_code or "",
        )
        _whatsapp_parent(
            notify_phone,
            text,
            event_key=f"admission-created:{row.id}",
            event=wa.EVENT_ADMISSION,
            template_params=params,
        )
    except Exception:
        pass
    return admission_to_out(row)


def update_admission(db: Session, actor: User, admission_id: UUID, payload: AdmissionCreate) -> dict:
    row = _get_admission(db, actor, admission_id)
    if row.status == "Enrolled":
        fail(409, "already_enrolled", "Enrolled admissions cannot be edited.")
    first = (payload.first_name or row.first_name or "").strip()
    mobile = (payload.mobile_number or row.mobile_number or "").strip()
    class_name = (payload.class_name or row.class_name or "").strip()
    if not first or not mobile or not class_name:
        fail(400, "validation_error", "First name, mobile number, and class are required.")
    _reject_junior_student_login(class_name, payload.student_account_email, payload.student_account_password)
    _apply_admission_fields(row, payload)
    _apply_referral(row, payload)
    row.first_name = first
    row.mobile_number = mobile
    row.class_name = class_name
    row.updated_at = _utcnow()
    write_audit(
        db,
        action="ADMISSION_UPDATED",
        entity_type="admission",
        entity_id=str(row.id),
        actor_id=actor.id,
        campus_id=actor.campus_id,
    )
    db.commit()
    db.refresh(row)
    return admission_to_out(row)


def _full_name(row: Admission) -> str:
    return " ".join(
        part for part in [row.first_name, row.middle_name, row.last_name] if part and str(part).strip()
    ).strip() or row.first_name


def _ensure_portal_user(
    db: Session,
    actor: User,
    *,
    email: str | None,
    password: str | None,
    password_hash: str | None = None,
    skip: bool,
    role_code: str,
    label: str,
) -> tuple[User | None, bool]:
    if skip or not email:
        return None, False
    email = email.strip().lower()
    role = db.scalar(select(Role).where(Role.code == role_code))
    if role is None:
        fail(500, "config_error", f"{label} role is not seeded.")
    existing = db.scalar(select(User).where(User.email == email))
    if existing is not None:
        # Linking a child to a staff (or otherwise non-portal) account would leave the family
        # without a working login, so the email must already be a login of the same role.
        if existing.role_id != role.id:
            fail(
                409,
                "email_in_use",
                f"{email} is already used by another account that is not a {label.lower()} login. "
                f"Use a different {label.lower()} email.",
            )
        if not existing.is_active:
            fail(
                409,
                "account_inactive",
                f"The {label.lower()} login {email} is deactivated. Reactivate it or use a different email.",
            )
        return existing, False

    resolved_hash = (password_hash or "").strip() or None
    plain = (password or "").strip() or None
    if plain:
        policy_message = password_policy_message(plain, email=email)
        if policy_message:
            fail(400, "weak_password", policy_message)
        resolved_hash = hash_password(plain)
    if not resolved_hash:
        fail(
            400,
            "validation_error",
            f"{label} password is required. Save it under Account Information on the admission, then enroll.",
        )
    user = User(
        campus_id=actor.campus_id,
        role_id=role.id,
        email=email,
        password_hash=resolved_hash,
        is_active=True,
        must_change_password=True,
    )
    db.add(user)
    db.flush()
    return user, True


def _ensure_parent_user(
    db: Session,
    actor: User,
    *,
    email: str | None,
    password: str | None,
    password_hash: str | None = None,
    skip: bool,
) -> tuple[User | None, bool]:
    return _ensure_portal_user(
        db,
        actor,
        email=email,
        password=password,
        password_hash=password_hash,
        skip=skip,
        role_code="parent",
        label="Parent",
    )


def _ensure_student_user(
    db: Session,
    actor: User,
    *,
    email: str | None,
    password: str | None,
    password_hash: str | None = None,
    skip: bool,
) -> tuple[User | None, bool]:
    return _ensure_portal_user(
        db,
        actor,
        email=email,
        password=password,
        password_hash=password_hash,
        skip=skip,
        role_code="student",
        label="Student",
    )


def _registration_fee_required_amount(row: Admission) -> float | None:
    """Numeric registration fee due; None when the field holds text that is not an amount."""
    raw = str(row.registration_fees or "").strip()
    if not raw:
        return 0.0
    normalized = raw.replace("₹", "").replace(",", "").replace(" ", "")
    try:
        return max(float(normalized), 0.0)
    except ValueError:
        return None


def _registration_fee_amount_clear(row: Admission) -> bool:
    # Words like "waived" or "free" typed into the fee field are not a waiver; only a zero amount is.
    return _registration_fee_required_amount(row) == 0.0


def _trusted_receipt_source(source: dict) -> bool:
    if str(source.get("verifiedBy") or "") != "server":
        return False
    channel = str(source.get("channel") or "")
    if channel == "desk_collection":
        return True
    if channel == "online_gateway":
        # Stub confirmations exist only for local click-through; they are never proof of payment elsewhere.
        if str(source.get("confirmedVia") or "") == "stub":
            return bool(settings.is_development or settings.demo_integrations)
        return True
    return False


def _has_verified_admission_fee_receipt(db: Session, campus_id, row: Admission) -> bool:
    """Match a server-issued Finance receipt to this admission.

    Only the server receipt ledger is read: the Finance snapshot is editable by Finance data saves, so a
    receipt there is not proof of payment on its own.
    """
    admission_code = (row.admission_code or "").strip().lower()
    if not admission_code:
        return False
    ledger = db.scalars(
        select(FinanceRecord).where(
            FinanceRecord.campus_id == campus_id,
            FinanceRecord.collection == RECEIPT_LEDGER_COLLECTION,
        )
    ).all()
    required = _registration_fee_required_amount(row)
    paid_total = 0.0
    for entry in ledger:
        receipt = dict(entry.body or {})
        if not _trusted_receipt_source(dict(receipt.get("source") or {})):
            continue
        status = str(receipt.get("status") or "").strip().lower().replace(" ", "_")
        if status in _REJECTED_RECEIPT_STATUSES or status not in _SETTLED_RECEIPT_STATUSES:
            continue
        try:
            amount = float(receipt.get("amountPaid") or 0)
        except (TypeError, ValueError):
            continue
        if amount <= 0:
            continue
        heads = " ".join(str(head) for head in (receipt.get("feeHeads") or [])).lower()
        if "admission" not in heads and "registration" not in heads:
            continue

        # Ownership by identifier only — a similar student name is never enough.
        receipt_student_id = str(receipt.get("studentId") or "").strip().lower()
        receipt_admission = str(receipt.get("admissionNo") or "").strip().lower()
        if receipt_admission == admission_code or receipt_student_id == admission_code:
            paid_total += amount
    if paid_total <= 0:
        return False
    # Unparseable fee text cannot be compared; a settled admission receipt for this student is then required.
    return required is None or paid_total >= required


def _finance_fee_waiver(db: Session, campus_id, admission_id) -> FinanceRecord | None:
    return db.scalar(
        select(FinanceRecord).where(
            FinanceRecord.campus_id == campus_id,
            FinanceRecord.collection == _FEE_WAIVER_COLLECTION,
            FinanceRecord.public_id == str(admission_id),
        )
    )


def list_fee_pending_admissions(db: Session, actor: User) -> list[dict]:
    """Not-yet-enrolled admissions whose registration fee is not cleared — Finance's waiver queue."""
    if role_code_for(db, actor) not in FEE_WAIVER_ROLES:
        fail(403, "forbidden", "Only Finance can review registration-fee waivers.")
    rows = db.scalars(
        select(Admission)
        .where(Admission.campus_id == actor.campus_id, Admission.status != "Enrolled")
        .order_by(Admission.created_at.desc())
    ).all()
    out = []
    for row in rows:
        if _registration_fee_cleared(db, actor, row):
            continue
        out.append(
            {
                "id": str(row.id),
                "admissionCode": row.admission_code,
                "studentName": _full_name(row),
                "className": row.class_name,
                "registrationFees": row.registration_fees or "",
                "admissionDate": row.admission_date.isoformat() if row.admission_date else "",
            }
        )
    return out


def waive_registration_fee(db: Session, actor: User, admission_id: UUID, body: dict) -> dict:
    """Finance records a registration-fee waiver; the admission form cannot grant one."""
    code = role_code_for(db, actor)
    if code not in FEE_WAIVER_ROLES:
        fail(403, "forbidden", "Only Finance (Account Head / Finance Manager) can waive the registration fee.")
    row = _get_admission(db, actor, admission_id)
    if row.status == "Enrolled":
        fail(409, "already_enrolled", "This admission is already enrolled.")
    reason = str((body or {}).get("reason") or "").strip()
    if len(reason) < 3:
        fail(422, "reason_required", "A reason is required to waive the registration fee.")
    if len(reason) > 500:
        fail(422, "reason_too_long", "Reason can be at most 500 characters.")
    existing = _finance_fee_waiver(db, actor.campus_id, row.id)
    if existing is not None:
        return {**dict(existing.body or {}), "idempotent": True}
    record = {
        "admissionId": str(row.id),
        "admissionCode": row.admission_code,
        "reason": reason,
        "waivedByUserId": str(actor.id),
        "waivedByEmail": actor.email or "",
        "waivedByRole": code,
        "waivedAt": _utcnow().isoformat(),
    }
    db.add(FinanceRecord(campus_id=actor.campus_id, collection=_FEE_WAIVER_COLLECTION, public_id=str(row.id), body=record))
    write_audit(
        db,
        action="ADMISSION_FEE_WAIVED",
        entity_type="admission",
        entity_id=str(row.id),
        actor_id=actor.id,
        campus_id=actor.campus_id,
        details=reason,
    )
    db.commit()
    return record


def _registration_fee_cleared(db: Session, actor: User, row: Admission) -> bool:
    """Zero fee, a Finance-recorded waiver, or a settled Finance receipt for this admission.

    The RegFeeStatus token on fees_group (Paid / Waived) is editable by Admissions and is never trusted.
    """
    if _registration_fee_amount_clear(row):
        return True
    if _finance_fee_waiver(db, actor.campus_id, row.id) is not None:
        return True
    return _has_verified_admission_fee_receipt(db, actor.campus_id, row)


def enroll_admission(db: Session, actor: User, admission_id: UUID, payload: EnrollAdmissionIn) -> dict:
    row = _get_admission(db, actor, admission_id)
    if row.status == "Enrolled" and row.enrolled_student_id:
        fail(409, "already_enrolled", "This admission is already enrolled.")
    if not _registration_fee_cleared(db, actor, row):
        fail(
            409,
            "fee_pending",
            "Registration / admission fee must be zero, waived by Finance, or backed by a settled Finance receipt for this admission before enrolment.",
        )

    parent_email = payload.parent_account_email or row.parent_account_email
    raw_student_email = payload.student_account_email or row.student_account_email
    student_email = (raw_student_email or "").strip().lower() or None
    # Student portal login is optional: create/link only when an email AND a password (or a
    # pending hash saved on the admission) are available. Email alone must not fail enroll.
    student_password = (payload.student_account_password or "").strip() or None
    student_password_hash = (row.student_pending_password_hash or "").strip() or None
    if not payload.skip_student_account:
        # Same resolved values as _ensure_student_user below (not payload-only).
        _reject_junior_student_login(
            row.class_name,
            student_email,
            student_password,
            password_hash=student_password_hash,
        )
    # Older admissions may still carry a student login for a junior class: enrol without it.
    skip_student = (
        payload.skip_student_account
        or not student_login_allowed(row.class_name)
        or not student_email
        or not (student_password or student_password_hash)
    )
    parent_user, parent_created = _ensure_parent_user(
        db,
        actor,
        email=parent_email,
        password=payload.parent_account_password,
        password_hash=row.parent_pending_password_hash,
        skip=payload.skip_parent_account,
    )
    student_user, student_created = _ensure_student_user(
        db,
        actor,
        email=student_email,
        password=student_password,
        password_hash=student_password_hash,
        skip=skip_student,
    )

    admission_number = row.admission_code
    clash = db.scalar(select(Student.id).where(Student.admission_number == admission_number))
    if clash is not None:
        # Legacy Phase-0 students may already own ADM-0001 etc.
        admission_number = _next_code(db, Admission, "ADM", actor.campus_id)
        row.admission_code = admission_number

    from app.services.placement import canonical_class_name, current_academic_year

    year = current_academic_year(db, actor.campus_id)
    # Admission forms often use Roman/numeric labels (V, 5); masters use Grade 5.
    student_class = canonical_class_name(row.class_name) or (row.class_name or "").strip()
    student = Student(
        campus_id=actor.campus_id,
        enquiry_id=row.enquiry_id,
        admission_id=row.id,
        admission_number=admission_number,
        full_name=_full_name(row),
        class_name=student_class,
        academic_year_id=year.id if year else None,
        placement_status="pending",
        parent_user_id=parent_user.id if parent_user else None,
        student_user_id=student_user.id if student_user else None,
    )
    db.add(student)
    db.flush()

    guardian_name = row.father_name or row.mother_name or row.parent_account_email or "Guardian"
    guardian_phone = row.parent_mobile_number or row.mobile_number
    db.add(
        Guardian(
            campus_id=actor.campus_id,
            student_id=student.id,
            full_name=guardian_name,
            phone=guardian_phone,
            relationship="parent",
        )
    )

    row.status = "Enrolled"
    row.enrolled_student_id = student.id
    row.enrolled_at = _utcnow()
    row.parent_user_id = parent_user.id if parent_user else None
    if parent_email:
        row.parent_account_email = parent_email.strip().lower()
    if student_email:
        row.student_account_email = student_email.strip().lower()
    # Pending form passwords are consumed at enroll; never keep them after.
    row.parent_pending_password_hash = None
    row.student_pending_password_hash = None
    row.updated_at = _utcnow()

    write_audit(
        db,
        action="STUDENT_ENROLLED",
        entity_type="student",
        entity_id=str(student.id),
        actor_id=actor.id,
        campus_id=actor.campus_id,
        details=f"Admission {row.admission_code}",
    )
    db.commit()
    db.refresh(row)
    db.refresh(student)
    try:
        from app.services.integrations import whatsapp_events as wa

        text, params = wa.enrollment_message(
            student_name=student.full_name,
            class_name=student.class_name or row.class_name or "",
            admission_code=row.admission_code or "",
        )
        _whatsapp_parent(
            guardian_phone,
            text,
            event_key=f"student-enrolled:{student.id}",
            event=wa.EVENT_ENROLLMENT,
            template_params=params,
        )
    except Exception:
        pass
    return {
        "admission": admission_to_out(row),
        "student_id": student.id,
        "student_code": student.admission_number,
        "parent_user_id": parent_user.id if parent_user else None,
        "parent_created": parent_created,
        "student_user_id": student_user.id if student_user else None,
        "student_created": student_created,
    }


# Backward-compatible Phase-0 helper used only if something still calls enroll(enquiry_id)
def enroll(db: Session, actor: User, enquiry_id: UUID) -> dict:
    """Legacy: convert enquiry then enroll without parent account."""
    admission_data = convert_enquiry(db, actor, enquiry_id)
    result = enroll_admission(
        db,
        actor,
        admission_data["id"],
        EnrollAdmissionIn(skip_parent_account=True),
    )
    student = db.get(Student, result["student_id"])
    guardian = db.scalar(select(Guardian).where(Guardian.student_id == student.id))
    return {"student": student, "guardian": guardian}
