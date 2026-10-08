from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models import AdmissionEnquiry, Guardian, Student, User
from app.services.audit import write_audit
from app.services.errors import fail


def create_enquiry(db: Session, actor: User, payload) -> AdmissionEnquiry:
    row = AdmissionEnquiry(
        campus_id=actor.campus_id,
        student_name=payload.student_name.strip(),
        class_name=payload.class_name.strip(),
        guardian_name=payload.guardian_name.strip(),
        guardian_phone=payload.guardian_phone.strip(),
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
    return row


def enroll(db: Session, actor: User, enquiry_id) -> dict:
    enquiry = db.get(AdmissionEnquiry, enquiry_id)
    if enquiry is None or enquiry.campus_id != actor.campus_id:
        fail(404, "not_found", "Enquiry was not found.")
    if enquiry.status == "enrolled":
        fail(409, "already_enrolled", "This enquiry is already enrolled.")
    count = db.scalar(select(func.count()).select_from(Student)) or 0
    student = Student(
        campus_id=actor.campus_id,
        enquiry_id=enquiry.id,
        admission_number=f"ADM-{count + 1:04d}",
        full_name=enquiry.student_name,
        class_name=enquiry.class_name,
    )
    db.add(student)
    db.flush()
    guardian = Guardian(
        campus_id=actor.campus_id,
        student_id=student.id,
        full_name=enquiry.guardian_name,
        phone=enquiry.guardian_phone,
    )
    db.add(guardian)
    enquiry.status = "enrolled"
    write_audit(
        db,
        action="STUDENT_ENROLLED",
        entity_type="student",
        entity_id=str(student.id),
        actor_id=actor.id,
        campus_id=actor.campus_id,
        details=f"Guardian {guardian.full_name}",
    )
    db.commit()
    db.refresh(student)
    db.refresh(guardian)
    return {"student": student, "guardian": guardian}
