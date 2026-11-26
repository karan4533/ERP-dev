from datetime import date
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.deps import require_permission
from app.models import User
from app.services import substitute_duties as svc

router = APIRouter(prefix="/api/v1/substitute-duties", tags=["substitute-duties"])


class SubstituteDutyIn(BaseModel):
    teacherUserId: UUID
    classId: UUID
    sectionId: UUID
    duty_date: date = Field(alias="date")
    period: str = Field(min_length=1, max_length=20)
    startTime: str = Field(min_length=4, max_length=8, description="HH:MM, campus time")
    endTime: str = Field(min_length=4, max_length=8, description="HH:MM, campus time")
    note: str | None = Field(default=None, max_length=500)

    model_config = {"populate_by_name": True}


class RevokeIn(BaseModel):
    reason: str | None = Field(default=None, max_length=500)


@router.get("/options")
def options_route(
    db: Session = Depends(get_db), user: User = Depends(require_permission("attendance.write"))
) -> dict:
    return svc.options(db, user)


@router.get("")
def list_route(
    date_: date | None = Query(default=None, alias="date"),
    include_revoked: bool = Query(default=False, alias="includeRevoked"),
    db: Session = Depends(get_db),
    user: User = Depends(require_permission("attendance.read")),
) -> list[dict]:
    return svc.list_duties(db, user, on_date=date_, include_revoked=include_revoked)


@router.post("", status_code=201)
def create_route(
    body: SubstituteDutyIn,
    db: Session = Depends(get_db),
    user: User = Depends(require_permission("attendance.write")),
) -> dict:
    return svc.create(
        db,
        user,
        teacher_user_id=body.teacherUserId,
        class_id=body.classId,
        section_id=body.sectionId,
        duty_date=body.duty_date,
        period=body.period,
        start_time=body.startTime,
        end_time=body.endTime,
        note=body.note,
    )


@router.post("/{duty_id}/revoke")
def revoke_route(
    duty_id: UUID,
    body: RevokeIn | None = None,
    db: Session = Depends(get_db),
    user: User = Depends(require_permission("attendance.write")),
) -> dict:
    return svc.revoke(db, user, duty_id, reason=body.reason if body else None)
