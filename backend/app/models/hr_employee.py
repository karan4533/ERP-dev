from datetime import date, datetime

from sqlalchemy import Date, DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.session import Base


class HrEmployee(Base):
    """
    HR employee master — partner owns expansion of this model.

    Align fields with frontend HR employee forms / handoff page profiles.
    """

    __tablename__ = "hr_employees"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    campus_id: Mapped[int] = mapped_column(Integer, index=True, nullable=False, default=1)
    user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    employee_code: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str | None] = mapped_column(String(255), index=True)
    mobile: Mapped[str | None] = mapped_column(String(30))
    department: Mapped[str | None] = mapped_column(String(100))
    designation: Mapped[str | None] = mapped_column(String(100))
    category: Mapped[str | None] = mapped_column(String(100))  # Academics, Admin, Driver, ...
    role_id: Mapped[str | None] = mapped_column(String(50), index=True)
    status: Mapped[str] = mapped_column(String(50), default="Active", nullable=False)
    joining_date: Mapped[date | None] = mapped_column(Date)
    notes: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
