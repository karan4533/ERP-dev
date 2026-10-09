import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, JSON, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, utcnow


class FinanceRecord(Base):
    """One finance document row (fee structure, receipt, transaction, etc.)."""

    __tablename__ = "finance_records"
    __table_args__ = (UniqueConstraint("campus_id", "collection", "public_id", name="uq_finance_record"),)

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    campus_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("campuses.id"), nullable=False, index=True)
    collection: Mapped[str] = mapped_column(String(40), nullable=False, index=True)
    public_id: Mapped[str] = mapped_column(String(80), nullable=False)
    body: Mapped[dict] = mapped_column(JSON, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)
