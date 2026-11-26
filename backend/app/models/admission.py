import uuid
from datetime import date, datetime

from sqlalchemy import Date, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, utcnow


class AdmissionEnquiry(Base):
    __tablename__ = "admission_enquiries"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    campus_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("campuses.id"), nullable=False)
    enquiry_code: Mapped[str] = mapped_column(String(32), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String(160), nullable=False)
    mobile_number: Mapped[str] = mapped_column(String(20), nullable=False)
    email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    gender: Mapped[str | None] = mapped_column(String(20), nullable=True)
    address: Mapped[str | None] = mapped_column(Text, nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    note: Mapped[str | None] = mapped_column(Text, nullable=True)
    enquiry_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    next_follow_up_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    assigned_to: Mapped[str | None] = mapped_column(String(120), nullable=True)
    reference: Mapped[str | None] = mapped_column(String(80), nullable=True)
    source: Mapped[str | None] = mapped_column(String(80), nullable=True)
    class_name: Mapped[str] = mapped_column(String(40), nullable=False)
    number_of_child: Mapped[str | None] = mapped_column(String(20), nullable=True)
    city: Mapped[str | None] = mapped_column(String(80), nullable=True)
    state: Mapped[str | None] = mapped_column(String(80), nullable=True)
    profile_image_file_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("file_assets.id"), nullable=True
    )
    status: Mapped[str] = mapped_column(String(32), default="Active", nullable=False)
    converted_admission_id: Mapped[uuid.UUID | None] = mapped_column(nullable=True)
    # Legacy Phase-0 columns kept nullable for older DBs during migrate
    student_name: Mapped[str | None] = mapped_column(String(160), nullable=True)
    guardian_name: Mapped[str | None] = mapped_column(String(160), nullable=True)
    guardian_phone: Mapped[str | None] = mapped_column(String(20), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)
    updated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class Admission(Base):
    __tablename__ = "admissions"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    campus_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("campuses.id"), nullable=False)
    enquiry_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("admission_enquiries.id"), nullable=True
    )
    admission_code: Mapped[str] = mapped_column(String(32), unique=True, nullable=False)
    admission_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    class_name: Mapped[str] = mapped_column(String(40), nullable=False)
    registration_fees: Mapped[str | None] = mapped_column(String(40), nullable=True)
    batch_start_year: Mapped[int | None] = mapped_column(Integer, nullable=True)
    batch_end_year: Mapped[int | None] = mapped_column(Integer, nullable=True)
    first_name: Mapped[str] = mapped_column(String(80), nullable=False)
    middle_name: Mapped[str | None] = mapped_column(String(80), nullable=True)
    last_name: Mapped[str | None] = mapped_column(String(80), nullable=True)
    gender: Mapped[str | None] = mapped_column(String(20), nullable=True)
    religion: Mapped[str | None] = mapped_column(String(40), nullable=True)
    caste: Mapped[str | None] = mapped_column(String(40), nullable=True)
    address: Mapped[str | None] = mapped_column(Text, nullable=True)
    date_of_birth: Mapped[date | None] = mapped_column(Date, nullable=True)
    country: Mapped[str | None] = mapped_column(String(80), nullable=True)
    state: Mapped[str | None] = mapped_column(String(80), nullable=True)
    city: Mapped[str | None] = mapped_column(String(80), nullable=True)
    zip_code: Mapped[str | None] = mapped_column(String(40), nullable=True)
    mobile_number: Mapped[str] = mapped_column(String(20), nullable=False)
    alt_mobile_number: Mapped[str | None] = mapped_column(String(20), nullable=True)
    email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    previous_school: Mapped[str | None] = mapped_column(String(160), nullable=True)
    blood_group: Mapped[str | None] = mapped_column(String(16), nullable=True)
    height: Mapped[str | None] = mapped_column(String(20), nullable=True)
    weight: Mapped[str | None] = mapped_column(String(20), nullable=True)
    medical_history: Mapped[str | None] = mapped_column(Text, nullable=True)
    profile_image_file_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("file_assets.id"), nullable=True
    )
    mode_of_transport: Mapped[str | None] = mapped_column(String(40), nullable=True)
    route: Mapped[str | None] = mapped_column(String(80), nullable=True)
    bus_stop: Mapped[str | None] = mapped_column(String(80), nullable=True)
    father_name: Mapped[str | None] = mapped_column(String(160), nullable=True)
    mother_name: Mapped[str | None] = mapped_column(String(160), nullable=True)
    father_occupation: Mapped[str | None] = mapped_column(String(120), nullable=True)
    mother_occupation: Mapped[str | None] = mapped_column(String(120), nullable=True)
    father_income: Mapped[str | None] = mapped_column(String(40), nullable=True)
    mother_income: Mapped[str | None] = mapped_column(String(40), nullable=True)
    siblings: Mapped[str | None] = mapped_column(String(120), nullable=True)
    parent_address: Mapped[str | None] = mapped_column(Text, nullable=True)
    parent_country: Mapped[str | None] = mapped_column(String(80), nullable=True)
    parent_state: Mapped[str | None] = mapped_column(String(80), nullable=True)
    parent_city: Mapped[str | None] = mapped_column(String(80), nullable=True)
    parent_zip_code: Mapped[str | None] = mapped_column(String(40), nullable=True)
    parent_mobile_number: Mapped[str | None] = mapped_column(String(20), nullable=True)
    parent_alt_mobile_number: Mapped[str | None] = mapped_column(String(20), nullable=True)
    parent_email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    parent_account_email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    student_account_email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    # Hashed temporary passwords collected on the admission form; cleared after enroll.
    parent_pending_password_hash: Mapped[str | None] = mapped_column(String(255), nullable=True)
    student_pending_password_hash: Mapped[str | None] = mapped_column(String(255), nullable=True)
    fees_group: Mapped[str | None] = mapped_column(String(80), nullable=True)
    status: Mapped[str] = mapped_column(String(32), default="Active", nullable=False)
    enrolled_student_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("students.id"), nullable=True
    )
    enrolled_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    parent_user_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)
    updated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    referral: Mapped["AdmissionReferral | None"] = relationship(
        back_populates="admission", uselist=False, lazy="selectin", cascade="all, delete-orphan"
    )


class AdmissionReferral(Base):
    """Who referred an admission. Record only: any bonus is applied manually by the Account Head."""

    __tablename__ = "admission_referrals"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    campus_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("campuses.id"), nullable=False)
    admission_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("admissions.id", ondelete="CASCADE"), unique=True, nullable=False
    )
    referrer_type: Mapped[str] = mapped_column(String(20), nullable=False)  # Parent / Staff / Other
    referrer_name: Mapped[str] = mapped_column(String(160), nullable=False)
    referrer_contact: Mapped[str | None] = mapped_column(String(80), nullable=True)
    # For a parent referrer: their own child's admission number, so a fee concession can be found.
    referrer_student_admission_no: Mapped[str | None] = mapped_column(String(40), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)
    updated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    admission: Mapped[Admission] = relationship(back_populates="referral")


class Student(Base):
    __tablename__ = "students"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    campus_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("campuses.id"), nullable=False)
    enquiry_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("admission_enquiries.id"), nullable=True
    )
    admission_id: Mapped[uuid.UUID | None] = mapped_column(nullable=True)
    admission_number: Mapped[str] = mapped_column(String(32), unique=True, nullable=False)
    full_name: Mapped[str] = mapped_column(String(160), nullable=False)
    class_name: Mapped[str] = mapped_column(String(40), nullable=False)
    academic_year_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("academic_years.id"), nullable=True
    )
    class_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("school_classes.id"), nullable=True
    )
    section_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("sections.id"), nullable=True, index=True
    )
    section: Mapped[str | None] = mapped_column(String(20), nullable=True)
    roll_number: Mapped[int | None] = mapped_column(Integer, nullable=True)
    placement_status: Mapped[str] = mapped_column(
        String(20), default="pending", nullable=False, index=True
    )
    parent_user_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    student_user_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("users.id"), nullable=True, index=True
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)


class CoordinatorGradeBand(Base):
    """Which grade range a coordinator login owns (e.g. 1–4, 5–8, 9–12)."""

    __tablename__ = "coordinator_grade_bands"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    campus_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("campuses.id"), nullable=False)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    grade_from: Mapped[int] = mapped_column(Integer, nullable=False)
    grade_to: Mapped[int] = mapped_column(Integer, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)


class Guardian(Base):
    __tablename__ = "guardians"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    campus_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("campuses.id"), nullable=False)
    student_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("students.id"), nullable=False)
    full_name: Mapped[str] = mapped_column(String(160), nullable=False)
    phone: Mapped[str] = mapped_column(String(20), nullable=False)
    relationship: Mapped[str] = mapped_column(String(40), default="parent", nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)
