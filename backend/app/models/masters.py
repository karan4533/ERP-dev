from datetime import date, datetime

from sqlalchemy import Boolean, Date, DateTime, ForeignKey, Integer, String, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.session import Base


class AcademicYear(Base):
    __tablename__ = "academic_years"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    campus_id: Mapped[int] = mapped_column(Integer, index=True, nullable=False, default=1)
    name: Mapped[str] = mapped_column(String(50), nullable=False)  # e.g. 2026-27
    start_date: Mapped[date | None] = mapped_column(Date)
    end_date: Mapped[date | None] = mapped_column(Date)
    is_current: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )


class SchoolClass(Base):
    __tablename__ = "school_classes"
    __table_args__ = (
        UniqueConstraint("campus_id", "name", "academic_year_id", name="uq_class_campus_year"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    campus_id: Mapped[int] = mapped_column(Integer, index=True, nullable=False, default=1)
    academic_year_id: Mapped[int] = mapped_column(ForeignKey("academic_years.id"), index=True)
    name: Mapped[str] = mapped_column(String(50), nullable=False)  # Grade 1, KG, ...
    display_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )


class Section(Base):
    __tablename__ = "sections"
    __table_args__ = (
        UniqueConstraint("campus_id", "class_id", "name", name="uq_section_class"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    campus_id: Mapped[int] = mapped_column(Integer, index=True, nullable=False, default=1)
    class_id: Mapped[int] = mapped_column(ForeignKey("school_classes.id"), index=True)
    name: Mapped[str] = mapped_column(String(20), nullable=False)  # A, B, C
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )


class Subject(Base):
    __tablename__ = "subjects"
    __table_args__ = (
        UniqueConstraint("campus_id", "code", name="uq_subject_code_campus"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    campus_id: Mapped[int] = mapped_column(Integer, index=True, nullable=False, default=1)
    code: Mapped[str] = mapped_column(String(30), nullable=False)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
