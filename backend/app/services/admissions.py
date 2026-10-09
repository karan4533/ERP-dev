from datetime import date, datetime, timezone
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.models import Admission, AdmissionEnquiry, Guardian, Role, Student, User
from app.schemas.admissions import AdmissionCreate, EnrollAdmissionIn, EnquiryCreate
from app.services.audit import write_audit
from app.services.errors import fail


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def _file_url(file_id: UUID | None) -> str | None:
    if file_id is None:
        return None
    return f"/api/v1/files/{file_id}/download"


def enquiry_to_out(row: AdmissionEnquiry) -> dict:
    return {
        "id": row.id,
        "enquiry_code": row.enquiry_code,
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
        "fees_group": row.fees_group,
        "status": row.status,
        "enrolled_student_id": row.enrolled_student_id,
        "enrolled_at": row.enrolled_at,
        "created_at": row.created_at,
    }


def _next_code(db: Session, model, prefix: str, campus_id: UUID) -> str:
    count = db.scalar(select(func.count()).select_from(model).where(model.campus_id == campus_id)) or 0
    return f"{prefix}-{int(count) + 1:04d}"


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
        guardian_name=(payload.guardian_name or payload.assigned_to),
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


def get_admission(db: Session, actor: User, admission_id: UUID) -> dict:
    return admission_to_out(_get_admission(db, actor, admission_id))


def _apply_admission_fields(row: Admission, payload: AdmissionCreate) -> None:
    data = payload.model_dump(exclude_unset=False)
    skip = {"parent_account_password"}
    for key, value in data.items():
        if key in skip:
            continue
        if hasattr(row, key):
            setattr(row, key, value)
    if payload.parent_account_email:
        row.parent_account_email = payload.parent_account_email.strip().lower()


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

    if payload.enquiry_id:
        _get_enquiry(db, actor, payload.enquiry_id)

    row = Admission(
        campus_id=actor.campus_id,
        admission_code=_next_code(db, Admission, "ADM", actor.campus_id),
        status=payload.status or "Active",
    )
    _apply_admission_fields(row, payload)
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
    _apply_admission_fields(row, payload)
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


def _ensure_parent_user(
    db: Session,
    actor: User,
    *,
    email: str | None,
    password: str | None,
    skip: bool,
) -> tuple[User | None, bool]:
    if skip or not email:
        return None, False
    email = email.strip().lower()
    if not password or len(password.strip()) < 6:
        fail(400, "validation_error", "Parent password is required (min 6 characters).")
    existing = db.scalar(select(User).where(User.email == email))
    if existing is not None:
        return existing, False
    role = db.scalar(select(Role).where(Role.code == "parent"))
    if role is None:
        fail(500, "config_error", "Parent role is not seeded.")
    user = User(
        campus_id=actor.campus_id,
        role_id=role.id,
        email=email,
        password_hash=hash_password(password.strip()),
        is_active=True,
        must_change_password=True,
    )
    db.add(user)
    db.flush()
    return user, True


def enroll_admission(db: Session, actor: User, admission_id: UUID, payload: EnrollAdmissionIn) -> dict:
    row = _get_admission(db, actor, admission_id)
    if row.status == "Enrolled" and row.enrolled_student_id:
        fail(409, "already_enrolled", "This admission is already enrolled.")

    parent_email = payload.parent_account_email or row.parent_account_email
    parent_user, parent_created = _ensure_parent_user(
        db,
        actor,
        email=parent_email,
        password=payload.parent_account_password,
        skip=payload.skip_parent_account,
    )

    student = Student(
        campus_id=actor.campus_id,
        enquiry_id=row.enquiry_id,
        admission_id=row.id,
        admission_number=row.admission_code,
        full_name=_full_name(row),
        class_name=row.class_name,
        parent_user_id=parent_user.id if parent_user else None,
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
    return {
        "admission": admission_to_out(row),
        "student_id": student.id,
        "student_code": student.admission_number,
        "parent_user_id": parent_user.id if parent_user else None,
        "parent_created": parent_created,
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
