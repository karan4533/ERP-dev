from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.deps import require_permission
from app.models import AuditLog, User

router = APIRouter(prefix="/api/v1/audit-logs", tags=["audit"])


@router.get("")
def list_audit_logs(
    db: Session = Depends(get_db),
    user: User = Depends(require_permission("audit.read")),
) -> list[dict]:
    rows = db.scalars(
        select(AuditLog).where(AuditLog.campus_id == user.campus_id).order_by(AuditLog.created_at.desc())
    ).all()
    return [
        {
            "id": str(row.id),
            "action": row.action,
            "entity_type": row.entity_type,
            "entity_id": row.entity_id,
            "details": row.details,
        }
        for row in rows
    ]
