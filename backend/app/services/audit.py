from sqlalchemy.orm import Session

from app.models import AuditLog


def write_audit(
    db: Session,
    *,
    action: str,
    entity_type: str,
    entity_id: str | None = None,
    actor_id=None,
    campus_id=None,
    details: str | None = None,
) -> None:
    db.add(
        AuditLog(
            actor_id=actor_id,
            campus_id=campus_id,
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            details=details,
        )
    )
