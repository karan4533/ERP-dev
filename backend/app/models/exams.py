import uuid
from datetime import date, datetime

from sqlalchemy import JSON, Boolean, Date, DateTime, Float, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, utcnow


class ExamType(Base):
    """Evaluation category (CA, RCT, Midterm, Final ...) - configurable, never hard-coded."""

    __tablename__ = "exam_types"
    __table_args__ = (UniqueConstraint("campus_id", "code", name="uq_exam_type_campus_code"),)

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    campus_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("campuses.id"), nullable=False)
    code: Mapped[str] = mapped_column(String(24), nullable=False)
    name: Mapped[str] = mapped_column(String(80), nullable=False)
    active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)


class Exam(Base):
    """Exam schedule for one class. Principal creates, DA (director) approves."""

    __tablename__ = "exams"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    campus_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("campuses.id"), nullable=False)
    exam_type_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("exam_types.id"), nullable=False)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    class_name: Mapped[str] = mapped_column(String(40), nullable=False)
    # Display label from masters academic years (e.g. "2026 - 2027") for mark entry / forwarding.
    academic_year: Mapped[str | None] = mapped_column(String(40), nullable=True)
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    end_date: Mapped[date] = mapped_column(Date, nullable=False)
    # Subject day/time rows + optional section/teacher overlay for the examination timetable UI.
    schedule: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    created_by: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), nullable=False)
    approval_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("approval_requests.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)


class ExamWeightage(Base):
    """Per class + exam type weightage (percent), set by the DA; locked once a cycle starts."""

    __tablename__ = "exam_weightages"
    __table_args__ = (UniqueConstraint("campus_id", "class_name", "exam_type_id", name="uq_weightage"),)

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    campus_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("campuses.id"), nullable=False)
    class_name: Mapped[str] = mapped_column(String(40), nullable=False)
    exam_type_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("exam_types.id"), nullable=False)
    weight: Mapped[float] = mapped_column(Float, nullable=False)
    updated_by: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)


class MarksBatch(Base):
    """One teacher's marks for one exam + subject + class. Locked on submit; denied -> new version."""

    __tablename__ = "marks_batches"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    campus_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("campuses.id"), nullable=False)
    exam_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("exams.id"), nullable=False)
    teacher_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), nullable=False)
    subject: Mapped[str] = mapped_column(String(80), nullable=False)
    section: Mapped[str | None] = mapped_column(String(16), nullable=True)
    max_marks: Mapped[float] = mapped_column(Float, nullable=False)
    version: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    approval_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("approval_requests.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)
    updated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class MarkEntry(Base):
    __tablename__ = "mark_entries"
    __table_args__ = (UniqueConstraint("batch_id", "student_id", name="uq_mark_batch_student"),)

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    batch_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("marks_batches.id"), nullable=False)
    student_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("students.id"), nullable=False)
    marks: Mapped[float | None] = mapped_column(Float, nullable=True)
    absent: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    remarks: Mapped[str | None] = mapped_column(Text, nullable=True)
