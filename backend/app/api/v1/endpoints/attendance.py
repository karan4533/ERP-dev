from datetime import date
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.deps import require_any, require_permission
from app.models import User
from app.schemas.attendance import AttendanceSyncIn, AttendanceUpsertIn
from app.services import attendance as svc
from app.services import attendance_sync as sync_svc
from app.services.attendance_migrate import ensure_attendance_schema

router = APIRouter(prefix="/api/v1/attendance", tags=["attendance"])


def _ready_attendance_schema() -> None:
    """Soft-add dual-session columns before any list/save (Alembic 0023)."""
    ensure_attendance_schema()


@router.get("")
def list_attendance_route(
    date_: date = Query(alias="date"),
    class_name: str | None = Query(default=None, alias="className"),
    section: str | None = Query(default=None),
    session: str | None = Query(default="FN", description="FN=morning half, AN=afternoon half"),
    roster: bool = Query(default=False, description="Include unmarked enrolled students"),
    db: Session = Depends(get_db),
    user: User = Depends(require_permission("attendance.read")),
) -> list[dict]:
    _ready_attendance_schema()
    if roster:
        if not class_name:
            from app.services.errors import fail

            fail(400, "validation_error", "className is required when roster=true.")
        return svc.roster_with_marks(
            db,
            user,
            attendance_date=date_,
            class_name=class_name,
            section=section,
            session=session or "FN",
        )
    return svc.list_attendance(
        db,
        user,
        attendance_date=date_,
        class_name=class_name,
        section=section,
        session=session,
    )


@router.get("/my-classes")
def my_attendance_classes_route(
    date_: date | None = Query(default=None, alias="date"),
    db: Session = Depends(get_db),
    user: User = Depends(require_permission("attendance.read")),
) -> dict:
    """Classes and sections the signed-in user may load and mark (same rule as roster and save)."""
    _ready_attendance_schema()
    return svc.my_attendance_classes(db, user, date_)


@router.post("")
def upsert_attendance_route(
    body: AttendanceUpsertIn,
    db: Session = Depends(get_db),
    user: User = Depends(require_permission("attendance.write")),
) -> list[dict]:
    _ready_attendance_schema()
    return svc.upsert_attendance(db, user, body)


@router.post("/sync")
def run_attendance_sync_route(
    body: AttendanceSyncIn | None = None,
    db: Session = Depends(get_db),
    user: User = Depends(require_any("attendance.write", "hr.write")),
) -> dict:
    """Convert stored biometric punches into attendance now (admin / HR). Idempotent."""
    sync_svc.ensure_can_run_sync(db, user)
    _ready_attendance_schema()
    body = body or AttendanceSyncIn()
    start, end = sync_svc.resolve_range(body.day, body.from_date, body.to_date)
    return sync_svc.run_attendance_sync(
        db, campus_id=user.campus_id, date_from=start, date_to=end, actor=user, trigger="manual"
    )


@router.get("/sync/status")
def attendance_sync_status_route(
    db: Session = Depends(get_db),
    user: User = Depends(require_any("attendance.write", "hr.write")),
) -> dict:
    sync_svc.ensure_can_run_sync(db, user)
    return sync_svc.sync_status(user.campus_id)


@router.get("/students/{student_id}/calendar")
def student_calendar_route(
    student_id: UUID,
    year: int = Query(...),
    month: int = Query(..., ge=1, le=12),
    db: Session = Depends(get_db),
    user: User = Depends(require_permission("attendance.read")),
) -> dict[str, str]:
    """Month map for AttendanceCalendar (P/A/H codes)."""
    _ready_attendance_schema()
    return svc.student_month_map(db, user, student_id, year=year, month=month)
