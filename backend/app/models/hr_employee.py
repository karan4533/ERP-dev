import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, JSON, String
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, utcnow


class HrEmployee(Base):
    __tablename__ = "hr_employees"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    campus_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("campuses.id"), nullable=False)
    employee_code: Mapped[str] = mapped_column(String(40), unique=True, nullable=False)
    first_name: Mapped[str] = mapped_column(String(80), nullable=False)
    last_name: Mapped[str] = mapped_column(String(80), nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    phone: Mapped[str | None] = mapped_column(String(40))
    gender: Mapped[str | None] = mapped_column(String(20))
    date_of_birth: Mapped[str | None] = mapped_column(String(20))
    address: Mapped[str | None] = mapped_column(String(255))
    department: Mapped[str | None] = mapped_column(String(80))
    designation: Mapped[str | None] = mapped_column(String(120))
    joining_date: Mapped[str | None] = mapped_column(String(20))
    status: Mapped[str | None] = mapped_column(String(32), default="Active")
    reporting_manager: Mapped[str | None] = mapped_column(String(120))
    role_title: Mapped[str | None] = mapped_column(String(80))
    qualification: Mapped[str | None] = mapped_column(String(160))
    experience: Mapped[str | None] = mapped_column(String(80))
    emergency_contact: Mapped[str | None] = mapped_column(String(160))
    employment_type: Mapped[str | None] = mapped_column(String(40))
    category: Mapped[str | None] = mapped_column(String(80))
    gross_salary: Mapped[int | None] = mapped_column(Integer, default=0)
    other_allowance: Mapped[int | None] = mapped_column(Integer, default=0)
    special_deduction: Mapped[int | None] = mapped_column(Integer, default=0)
    other_employer_benefits: Mapped[int | None] = mapped_column(Integer, default=0)
    extra: Mapped[dict | None] = mapped_column(JSON)
    user_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)
