from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.deps import require_any, require_permission
from app.models import User
from app.schemas.admissions import (
    AdmissionCreate,
    AdmissionOut,
    EnrollAdmissionIn,
    EnrollAdmissionOut,
    EnquiryCreate,
    EnquiryOut,
)
from app.schemas.phase0 import EnrollOut, GuardianOut, StudentOut
from app.services import admissions as svc

router = APIRouter(prefix="/api/v1/admissions", tags=["admissions"])


@router.get("/enquiries", response_model=list[EnquiryOut])
def list_enquiries_route(
    status: str | None = Query(default=None),
    db: Session = Depends(get_db),
    user: User = Depends(require_permission("admissions.write")),
):
    return svc.list_enquiries(db, user, status)


@router.post("/enquiries", response_model=EnquiryOut, status_code=201)
def create_enquiry_route(
    body: EnquiryCreate,
    db: Session = Depends(get_db),
    user: User = Depends(require_permission("admissions.write")),
):
    return svc.create_enquiry(db, user, body)


@router.get("/enquiries/{enquiry_id}", response_model=EnquiryOut)
def get_enquiry_route(
    enquiry_id: UUID,
    db: Session = Depends(get_db),
    user: User = Depends(require_permission("admissions.write")),
):
    return svc.get_enquiry(db, user, enquiry_id)


@router.patch("/enquiries/{enquiry_id}", response_model=EnquiryOut)
def update_enquiry_route(
    enquiry_id: UUID,
    body: EnquiryCreate,
    db: Session = Depends(get_db),
    user: User = Depends(require_permission("admissions.write")),
):
    return svc.update_enquiry(db, user, enquiry_id, body)


@router.post("/enquiries/{enquiry_id}/convert", response_model=AdmissionOut)
def convert_enquiry_route(
    enquiry_id: UUID,
    db: Session = Depends(get_db),
    user: User = Depends(require_permission("admissions.write")),
):
    return svc.convert_enquiry(db, user, enquiry_id)


@router.post("/enquiries/{enquiry_id}/enroll", response_model=EnrollOut)
def enroll_enquiry_legacy_route(
    enquiry_id: UUID,
    db: Session = Depends(get_db),
    user: User = Depends(require_permission("admissions.write")),
) -> EnrollOut:
    """Phase-0 shortcut: convert + enroll without parent login."""
    result = svc.enroll(db, user, enquiry_id)
    return EnrollOut(
        student=StudentOut.model_validate(result["student"]),
        guardian=GuardianOut.model_validate(result["guardian"]),
    )


@router.get("", response_model=list[AdmissionOut])
def list_admissions_route(
    status: str | None = Query(default=None),
    db: Session = Depends(get_db),
    user: User = Depends(require_permission("admissions.write")),
):
    return svc.list_admissions(db, user, status)


@router.post("", response_model=AdmissionOut, status_code=201)
def create_admission_route(
    body: AdmissionCreate,
    db: Session = Depends(get_db),
    user: User = Depends(require_permission("admissions.write")),
):
    return svc.create_admission(db, user, body)


@router.get("/enrolled-students")
def list_enrolled_students_route(
    db: Session = Depends(get_db),
    user: User = Depends(require_any("students.read", "hr.read", "admissions.write", "finance.read")),
) -> list[dict]:
    """Campus enrolled students for HR concessions / finance pickers — API SoT."""
    return svc.list_enrolled_students(db, user)


@router.get("/{admission_id}", response_model=AdmissionOut)
def get_admission_route(
    admission_id: UUID,
    db: Session = Depends(get_db),
    user: User = Depends(require_permission("admissions.write")),
):
    return svc.get_admission(db, user, admission_id)


@router.patch("/{admission_id}", response_model=AdmissionOut)
def update_admission_route(
    admission_id: UUID,
    body: AdmissionCreate,
    db: Session = Depends(get_db),
    user: User = Depends(require_permission("admissions.write")),
):
    return svc.update_admission(db, user, admission_id, body)


@router.post("/{admission_id}/enroll", response_model=EnrollAdmissionOut)
def enroll_admission_route(
    admission_id: UUID,
    body: EnrollAdmissionIn | None = None,
    db: Session = Depends(get_db),
    user: User = Depends(require_permission("admissions.write")),
):
    return svc.enroll_admission(db, user, admission_id, body or EnrollAdmissionIn())
