from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.deps import require_permission
from app.models import User
from app.schemas.phase0 import EnrollOut, EnquiryCreate, EnquiryOut
from app.services.admissions import create_enquiry, enroll

router = APIRouter(prefix="/api/v1/admissions", tags=["admissions"])


@router.post("/enquiries", response_model=EnquiryOut, status_code=201)
def create_enquiry_route(
    body: EnquiryCreate,
    db: Session = Depends(get_db),
    user: User = Depends(require_permission("admissions.write")),
):
    return create_enquiry(db, user, body)


@router.post("/enquiries/{enquiry_id}/enroll", response_model=EnrollOut)
def enroll_route(
    enquiry_id: UUID,
    db: Session = Depends(get_db),
    user: User = Depends(require_permission("admissions.write")),
) -> dict:
    return enroll(db, user, enquiry_id)
