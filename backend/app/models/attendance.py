import uuid
from datetime import date, datetime

from sqlalchemy import Date, DateTime, ForeignKey, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, utcnow


class StudentAttendance(Base):
    """One class-attendance mark per student per calendar day per half (FN / AN)."""

    __tablename__ = "student_attendance"
    __table_args__ = (
        UniqueConstraint(
            "campus_id",
            "student_id",
            "attendance_date",
            "session",
            name="uq_student_attendance_day_session",
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    campus_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("campuses.id"), nullable=False)
    student_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("students.id"), nullable=False)
    attendance_date: Mapped[date] = mapped_column(Date, nullable=False)
    # FN = morning→afternoon, AN = afternoon→evening
    session: Mapped[str] = mapped_column(String(2), nullable=False, default="FN")
    class_name: Mapped[str] = mapped_column(String(40), nullable=False)
    section: Mapped[str | None] = mapped_column(String(20), nullable=True)
    status: Mapped[str] = mapped_column(String(20), nullable=False)  # Present | Absent | Late | Holiday | Half Day
    in_out_status: Mapped[str | None] = mapped_column(String(40), nullable=True)
    check_in_time: Mapped[str | None] = mapped_column(String(20), nullable=True)
    check_out_time: Mapped[str | None] = mapped_column(String(20), nullable=True)
    marked_by_user_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)
    updated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
