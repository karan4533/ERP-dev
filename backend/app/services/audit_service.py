from sqlalchemy.orm import Session

from app.models.audit_log import SystemAuditLog


def write_audit_log(
    db: Session,
    *,
    action_type: str,
    campus_id: int | None = None,
    actor_user_id: int | None = None,
    actor_role: str | None = None,
    target_module: str | None = None,
    target_record_id: str | None = None,
    path: str | None = None,
    method: str | None = None,
    status_code: int | None = None,
    ip_address: str | None = None,
    user_agent: str | None = None,
    payload_summary: str | None = None,
) -> SystemAuditLog:
    row = SystemAuditLog(
        campus_id=campus_id,
        actor_user_id=actor_user_id,
        actor_role=actor_role,
        action_type=action_type,
        target_module=target_module,
        target_record_id=target_record_id,
        path=path,
        method=method,
        status_code=status_code,
        ip_address=ip_address,
        user_agent=(user_agent or "")[:255] or None,
        payload_summary=payload_summary,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


def list_audit_logs(
    db: Session,
    *,
    campus_id: int | None = None,
    limit: int = 50,
) -> list[SystemAuditLog]:
    q = db.query(SystemAuditLog)
    if campus_id is not None:
        q = q.filter(SystemAuditLog.campus_id == campus_id)
    return q.order_by(SystemAuditLog.id.desc()).limit(limit).all()
