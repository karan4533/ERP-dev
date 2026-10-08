from datetime import datetime

from sqlalchemy import Boolean, DateTime, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.session import Base


class OtpChallenge(Base):
    __tablename__ = "otp_challenges"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    campus_id: Mapped[int] = mapped_column(Integer, index=True, nullable=False, default=1)
    email: Mapped[str] = mapped_column(String(255), index=True, nullable=False)
    role: Mapped[str | None] = mapped_column(String(50), nullable=True)
    code_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    consumed: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    attempts: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
