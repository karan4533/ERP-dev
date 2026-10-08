from datetime import datetime

from sqlalchemy import DateTime, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.session import Base


class SystemAuditLog(Base):
    """
    Immutable system audit trail.
    Do not expose update/delete APIs for this table.
    """

    __tablename__ = "system_audit_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    campus_id: Mapped[int | None] = mapped_column(Integer, index=True)
    actor_user_id: Mapped[int | None] = mapped_column(Integer, index=True)
    actor_role: Mapped[str | None] = mapped_column(String(50))
    action_type: Mapped[str] = mapped_column(String(30), nullable=False, index=True)
    target_module: Mapped[str | None] = mapped_column(String(50))
    target_record_id: Mapped[str | None] = mapped_column(String(100))
    path: Mapped[str | None] = mapped_column(String(500))
    method: Mapped[str | None] = mapped_column(String(10))
    status_code: Mapped[int | None] = mapped_column(Integer)
    ip_address: Mapped[str | None] = mapped_column(String(45))
    user_agent: Mapped[str | None] = mapped_column(String(255))
    payload_summary: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False, index=True
    )
