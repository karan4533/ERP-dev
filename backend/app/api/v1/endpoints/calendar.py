from datetime import date

from fastapi import APIRouter, Depends, Response
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.deps import require_permission
from app.models import User
from app.services import calendar as svc

router = APIRouter(prefix="/api/v1/calendar", tags=["calendar"])


class EventIn(BaseModel):
    type: str
    title: str
    startDate: date
    endDate: date | None = None
    description: str = ""
    allDay: bool = True
    startTime: str | None = None
    endTime: str | None = None


class EventPatch(BaseModel):
    type: str | None = None
    title: str | None = None
    startDate: date | None = None
    endDate: date | None = None
    description: str | None = None
    allDay: bool | None = None
    startTime: str | None = None
    endTime: str | None = None


@router.get("")
def list_route(db: Session = Depends(get_db), user: User = Depends(require_permission("calendar.read"))) -> list[dict]:
    return svc.list_events(db, user)


@router.post("", status_code=201)
def create_route(
    body: EventIn, db: Session = Depends(get_db), user: User = Depends(require_permission("calendar.write"))
) -> dict:
    return svc.create(
        db,
        user,
        event_type=body.type,
        title=body.title,
        start=body.startDate,
        end=body.endDate,
        description=body.description,
        all_day=body.allDay,
        start_time=body.startTime,
        end_time=body.endTime,
    )


@router.patch("/{ref}")
def update_route(
    ref: str, body: EventPatch, db: Session = Depends(get_db), user: User = Depends(require_permission("calendar.write"))
) -> dict:
    return svc.update(
        db,
        user,
        ref,
        event_type=body.type,
        title=body.title,
        start=body.startDate,
        end=body.endDate,
        description=body.description,
        all_day=body.allDay,
        start_time=body.startTime,
        end_time=body.endTime,
    )


@router.delete("/{ref}", status_code=204)
def delete_route(
    ref: str, db: Session = Depends(get_db), user: User = Depends(require_permission("calendar.write"))
) -> Response:
    svc.delete(db, user, ref)
    return Response(status_code=204)
