from fastapi import APIRouter, Query

from app.api.deps import CurrentUser, DbSession
from app.schemas.audit import AuditLogPublic
from app.services.audit_service import list_audit_logs

router = APIRouter()


@router.get("/logs", response_model=list[AuditLogPublic])
def get_audit_logs(
    db: DbSession,
    current_user: CurrentUser,
    limit: int = Query(default=50, ge=1, le=200),
) -> list[AuditLogPublic]:
    rows = list_audit_logs(db, campus_id=current_user.campus_id, limit=limit)
    return [AuditLogPublic.model_validate(row) for row in rows]
