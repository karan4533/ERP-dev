"""Coordinator section assignment, auto roll numbers, and grade promotion."""

from __future__ import annotations

import re
import uuid
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.deps import role_code_for
from app.models import (
    AcademicYear,
    AcademicsRecord,
    CoordinatorGradeBand,
    SchoolClass,
    Section,
    Student,
    User,
)
from app.services.audit import write_audit
from app.services.errors import fail

# Internal academics_records collection; not exposed on the campus JSON API.
_PROMOTION_COLLECTION = "student-promotions"


def _promotion_public_id(student_id: UUID, year_id: UUID) -> str:
    return f"{student_id}:{year_id}"

_BYPASS_ROLES = {
    "principal",
    "director",
    "admin",
    "superadmin",
    "managing_director",
    "jointdirector",
}


_PRE_PRIMARY = re.compile(r"^(pre[\s-]*kg|prekg|nursery|play\s*group|playgroup|lkg|ukg|kg|kindergarten|pre[\s-]*primary)\b", re.I)


def school_grade(class_name: str | None) -> int | None:
    """Like parse_grade, but pre-primary classes (Pre-KG, LKG, UKG, KG, Nursery) count as 0."""
    text = str(class_name or "").strip()
    if _PRE_PRIMARY.match(re.sub(r"^(class|grade)\s+", "", text, flags=re.I)):
        return 0
    return parse_grade(text)


def parse_grade(class_name: str | None) -> int | None:
    """Extract grade number from names like 'Grade 1', 'I', '1', 'Class 5', 'VI'."""
    text = str(class_name or "").strip()
    if not text:
        return None
    match = re.search(r"(\d{1,2})", text)
    if match:
        n = int(match.group(1))
        return n if 1 <= n <= 12 else None
    roman = {
        "i": 1,
        "ii": 2,
        "iii": 3,
        "iv": 4,
        "v": 5,
        "vi": 6,
        "vii": 7,
        "viii": 8,
        "ix": 9,
        "x": 10,
        "xi": 11,
        "xii": 12,
    }
    # Exact token only — never endswith("i") which mis-parsed "VI" as grade 1.
    token = re.sub(r"[^a-z]", "", text.lower())
    token = re.sub(r"^(grade|class)", "", token)
    return roman.get(token)


def canonical_class_name(class_name: str | None) -> str:
    """Normalize admission labels like 'V' / '5' / 'Class 5' to masters form 'Grade 5'."""
    text = str(class_name or "").strip()
    if not text:
        return ""
    grade = parse_grade(text)
    if grade is not None:
        return f"Grade {grade}"
    return text


def repair_student_class_labels(db: Session, campus_id: UUID) -> int:
    """Rewrite non-canonical class_name values (e.g. Roman 'V') to Grade N. Returns count changed."""
    rows = db.scalars(select(Student).where(Student.campus_id == campus_id)).all()
    changed = 0
    for row in rows:
        canon = canonical_class_name(row.class_name)
        if canon and canon != (row.class_name or "").strip():
            row.class_name = canon
            changed += 1
    if changed:
        db.commit()
    return changed


def current_academic_year(db: Session, campus_id: UUID) -> AcademicYear | None:
    return db.scalar(
        select(AcademicYear).where(
            AcademicYear.campus_id == campus_id,
            AcademicYear.is_current.is_(True),
        )
    )


def _band_for_user(db: Session, actor: User) -> CoordinatorGradeBand | None:
    return db.scalar(
        select(CoordinatorGradeBand).where(
            CoordinatorGradeBand.campus_id == actor.campus_id,
            CoordinatorGradeBand.user_id == actor.id,
        )
    )


def actor_can_manage_grade(db: Session, actor: User, grade: int | None) -> bool:
    role = role_code_for(db, actor)
    if role in _BYPASS_ROLES:
        return True
    if role != "coordinator":
        return False
    if grade is None:
        return False
    band = _band_for_user(db, actor)
    if band is None:
        # Coordinator with no band configured may not place anyone.
        return False
    return band.grade_from <= grade <= band.grade_to


def _next_roll(db: Session, *, campus_id: UUID, academic_year_id: UUID | None, section_id: UUID) -> int:
    stmt = select(func.max(Student.roll_number)).where(
        Student.campus_id == campus_id,
        Student.section_id == section_id,
        Student.roll_number.is_not(None),
    )
    if academic_year_id:
        stmt = stmt.where(Student.academic_year_id == academic_year_id)
    current = db.scalar(stmt)
    return int(current or 0) + 1


def _section_load(db: Session, section_id: UUID, campus_id: UUID) -> tuple[Section, SchoolClass]:
    section = db.get(Section, section_id)
    if section is None or section.campus_id != campus_id:
        fail(404, "not_found", "Section not found.")
    if not section.is_active:
        fail(400, "validation_error", "Section is not active.")
    school_class = db.get(SchoolClass, section.class_id)
    if school_class is None or school_class.campus_id != campus_id:
        fail(400, "validation_error", "Section has no valid class.")
    return section, school_class


def _capacity_ok(db: Session, section: Section, *, exclude_student_id: UUID | None = None) -> None:
    if section.capacity is None:
        return
    stmt = select(func.count()).select_from(Student).where(
        Student.section_id == section.id,
        Student.placement_status == "placed",
    )
    if exclude_student_id:
        stmt = stmt.where(Student.id != exclude_student_id)
    count = int(db.scalar(stmt) or 0)
    if count >= section.capacity:
        fail(409, "section_full", f"Section {section.name} is at capacity ({section.capacity}).")


def _class_teacher_email(db: Session, section: Section | None) -> str | None:
    if section is None or not section.class_teacher_user_id:
        return None
    teacher = db.get(User, section.class_teacher_user_id)
    return teacher.email if teacher else None


def student_placement_fields(db: Session, student: Student) -> dict:
    section = db.get(Section, student.section_id) if student.section_id else None
    return {
        "section": student.section or "",
        "sectionId": str(student.section_id) if student.section_id else None,
        "classId": str(student.class_id) if student.class_id else None,
        "academicYearId": str(student.academic_year_id) if student.academic_year_id else None,
        "rollNumber": student.roll_number if student.roll_number is not None else "",
        "placementStatus": student.placement_status or "pending",
        "classTeacherEmail": _class_teacher_email(db, section),
        "grade": parse_grade(student.class_name),
    }


def list_pending_placement(db: Session, actor: User) -> list[dict]:
    from app.services.students import _admission_for, _list_item

    stmt = (
        select(Student)
        .where(
            Student.campus_id == actor.campus_id,
            Student.placement_status == "pending",
        )
        .order_by(Student.created_at.asc())
    )
    rows = db.scalars(stmt).all()
    role = role_code_for(db, actor)
    out: list[dict] = []
    for row in rows:
        grade = parse_grade(row.class_name)
        if role == "coordinator" and not actor_can_manage_grade(db, actor, grade):
            continue
        item = _list_item(row, _admission_for(db, row))
        item.update(student_placement_fields(db, row))
        out.append(item)
    return out


def list_placed_for_band(db: Session, actor: User) -> list[dict]:
    """Placed students the actor can promote (current grade in band / all for principal)."""
    from app.services.students import _admission_for, _list_item

    stmt = (
        select(Student)
        .where(
            Student.campus_id == actor.campus_id,
            Student.placement_status == "placed",
        )
        .order_by(Student.class_name, Student.roll_number, Student.full_name)
    )
    rows = db.scalars(stmt).all()
    role = role_code_for(db, actor)
    out: list[dict] = []
    for row in rows:
        grade = parse_grade(row.class_name)
        if role == "coordinator" and not actor_can_manage_grade(db, actor, grade):
            continue
        item = _list_item(row, _admission_for(db, row))
        item.update(student_placement_fields(db, row))
        out.append(item)
    return out


def place_student(db: Session, actor: User, student_id: UUID, section_id: UUID) -> dict:
    from app.services.students import get_student

    student = db.get(Student, student_id)
    if student is None or student.campus_id != actor.campus_id:
        fail(404, "not_found", "Student not found.")

    grade = parse_grade(student.class_name)
    if not actor_can_manage_grade(db, actor, grade):
        fail(403, "forbidden", "This student is outside your grade band.")

    section, school_class = _section_load(db, section_id, actor.campus_id)
    target_grade = parse_grade(school_class.name)
    # Class on section should match student's admission class (or principal override).
    role = role_code_for(db, actor)
    if role == "coordinator":
        if target_grade != grade and school_class.name.strip().lower() != student.class_name.strip().lower():
            fail(
                400,
                "validation_error",
                f"Section belongs to {school_class.name}, but student is in {student.class_name}.",
            )
        if not actor_can_manage_grade(db, actor, target_grade or grade):
            fail(403, "forbidden", "Target class is outside your grade band.")

    _capacity_ok(db, section, exclude_student_id=student.id)

    year = None
    if student.academic_year_id:
        year = db.get(AcademicYear, student.academic_year_id)
    if year is None:
        year = current_academic_year(db, actor.campus_id)

    roll = _next_roll(
        db,
        campus_id=actor.campus_id,
        academic_year_id=year.id if year else None,
        section_id=section.id,
    )

    student.academic_year_id = year.id if year else student.academic_year_id
    student.class_id = school_class.id
    student.class_name = school_class.name
    student.section_id = section.id
    student.section = section.name
    student.roll_number = roll
    student.placement_status = "placed"

    write_audit(
        db,
        action="STUDENT_PLACED",
        entity_type="student",
        entity_id=str(student.id),
        actor_id=actor.id,
        campus_id=actor.campus_id,
        details=f"{school_class.name}-{section.name} roll {roll}",
    )
    db.commit()
    db.refresh(student)
    return get_student(db, actor, student.id)


def promote_student(
    db: Session,
    actor: User,
    student_id: UUID,
    *,
    target_class_id: UUID,
    target_section_id: UUID,
    academic_year_id: UUID | None = None,
) -> dict:
    from app.services.students import get_student

    student = db.get(Student, student_id)
    if student is None or student.campus_id != actor.campus_id:
        fail(404, "not_found", "Student not found.")
    if student.placement_status != "placed":
        fail(400, "validation_error", "Place the student in a section before promoting.")

    current_grade = parse_grade(student.class_name)
    if current_grade is None:
        fail(400, "validation_error", "Cannot determine current grade for this student.")
    if current_grade >= 12:
        fail(400, "validation_error", "Student is already in Grade 12; no further promotion.")
    if not actor_can_manage_grade(db, actor, current_grade):
        fail(403, "forbidden", "This student is outside your grade band.")

    section, school_class = _section_load(db, target_section_id, actor.campus_id)
    if school_class.id != target_class_id:
        fail(400, "validation_error", "Section does not belong to the selected class.")

    target_grade = parse_grade(school_class.name)
    expected = current_grade + 1
    if target_grade != expected:
        fail(
            400,
            "validation_error",
            f"Promotion must be to the next grade only (Grade {expected}).",
        )

    year = None
    if academic_year_id:
        year = db.get(AcademicYear, academic_year_id)
        if year is None or year.campus_id != actor.campus_id:
            fail(404, "not_found", "Academic year not found.")
    else:
        year = current_academic_year(db, actor.campus_id)
    if year is None:
        fail(400, "validation_error", "An academic year is required to promote a student.")

    # Unique (campus, collection, public_id) refuses a second promote in the same year,
    # including when two requests race — no new table or migration.
    public_id = _promotion_public_id(student.id, year.id)
    already = db.scalar(
        select(AcademicsRecord).where(
            AcademicsRecord.campus_id == actor.campus_id,
            AcademicsRecord.collection == _PROMOTION_COLLECTION,
            AcademicsRecord.public_id == public_id,
        )
    )
    if already is not None:
        fail(409, "already_promoted", "This student has already been promoted in this academic year.")

    _capacity_ok(db, section, exclude_student_id=student.id)
    roll = _next_roll(
        db,
        campus_id=actor.campus_id,
        academic_year_id=year.id,
        section_id=section.id,
    )

    previous = f"{student.class_name}-{student.section or ''}#{student.roll_number}"
    student.academic_year_id = year.id
    student.class_id = school_class.id
    student.class_name = school_class.name
    student.section_id = section.id
    student.section = section.name
    student.roll_number = roll
    student.placement_status = "placed"

    db.add(
        AcademicsRecord(
            id=uuid.uuid4(),
            campus_id=actor.campus_id,
            collection=_PROMOTION_COLLECTION,
            public_id=public_id,
            body={
                "studentId": str(student.id),
                "academicYearId": str(year.id),
                "from": previous,
                "to": f"{school_class.name}-{section.name}#{roll}",
                "promotedBy": str(actor.id),
            },
            created_by=actor.id,
        )
    )
    write_audit(
        db,
        action="STUDENT_PROMOTED",
        entity_type="student",
        entity_id=str(student.id),
        actor_id=actor.id,
        campus_id=actor.campus_id,
        details=f"{previous} -> {school_class.name}-{section.name} roll {roll}",
    )
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        fail(409, "already_promoted", "This student has already been promoted in this academic year.")
    db.refresh(student)
    return get_student(db, actor, student.id)


def list_my_grade_band(db: Session, actor: User) -> dict | None:
    band = _band_for_user(db, actor)
    if band is None:
        return None
    return {
        "id": str(band.id),
        "userId": str(band.user_id),
        "gradeFrom": band.grade_from,
        "gradeTo": band.grade_to,
    }


def promote_options(db: Session, actor: User, student_id: UUID) -> dict:
    """Next-grade class + sections only (for the promote screen)."""
    student = db.get(Student, student_id)
    if student is None or student.campus_id != actor.campus_id:
        fail(404, "not_found", "Student not found.")
    if student.placement_status != "placed":
        fail(400, "validation_error", "Place the student in a section before promoting.")

    current_grade = parse_grade(student.class_name)
    if current_grade is None:
        fail(400, "validation_error", "Cannot determine current grade for this student.")
    if not actor_can_manage_grade(db, actor, current_grade):
        fail(403, "forbidden", "This student is outside your grade band.")
    if current_grade >= 12:
        return {
            "studentId": str(student.id),
            "currentClassName": student.class_name,
            "currentGrade": current_grade,
            "nextGrade": None,
            "classId": None,
            "className": None,
            "sections": [],
            "message": "Student is already in Grade 12.",
        }

    next_grade = current_grade + 1
    next_name = f"Grade {next_grade}"
    options = placement_options(db, actor, next_name)
    return {
        "studentId": str(student.id),
        "currentClassName": student.class_name,
        "currentGrade": current_grade,
        "nextGrade": next_grade,
        "classId": options["classId"],
        "className": options["className"],
        "academicYearId": options.get("academicYearId"),
        "sections": options["sections"],
        "message": None,
    }


def _require_band_manager(db: Session, actor: User) -> None:
    role = role_code_for(db, actor)
    if role not in _BYPASS_ROLES:
        fail(403, "forbidden", "Only Principal (or campus leadership) can assign coordinator grade bands.")


def list_coordinator_grade_bands(db: Session, actor: User) -> list[dict]:
    """All campus coordinator logins with their assigned grade bands (Principal)."""
    from app.models import Role

    _require_band_manager(db, actor)
    role = db.scalar(select(Role).where(Role.code == "coordinator"))
    if role is None:
        return []
    users = db.scalars(
        select(User)
        .where(User.campus_id == actor.campus_id, User.role_id == role.id)
        .order_by(User.email)
    ).all()
    bands = {
        row.user_id: row
        for row in db.scalars(
            select(CoordinatorGradeBand).where(CoordinatorGradeBand.campus_id == actor.campus_id)
        ).all()
    }
    out: list[dict] = []
    for user in users:
        band = bands.get(user.id)
        out.append(
            {
                "userId": str(user.id),
                "email": user.email,
                "isActive": bool(user.is_active),
                "gradeFrom": band.grade_from if band else None,
                "gradeTo": band.grade_to if band else None,
                "bandId": str(band.id) if band else None,
            }
        )
    return out


def upsert_coordinator_grade_band(
    db: Session,
    actor: User,
    *,
    user_id: UUID,
    grade_from: int,
    grade_to: int,
) -> dict:
    from app.models import Role

    _require_band_manager(db, actor)
    if not (1 <= grade_from <= 12 and 1 <= grade_to <= 12):
        fail(400, "validation_error", "Grades must be between 1 and 12.")
    if grade_from > grade_to:
        fail(400, "validation_error", "Grade from cannot be greater than grade to.")

    role = db.scalar(select(Role).where(Role.code == "coordinator"))
    user = db.get(User, user_id)
    if user is None or user.campus_id != actor.campus_id:
        fail(404, "not_found", "Coordinator user not found.")
    if role is None or user.role_id != role.id:
        fail(400, "validation_error", "Selected user is not a coordinator.")

    band = db.scalar(
        select(CoordinatorGradeBand).where(
            CoordinatorGradeBand.campus_id == actor.campus_id,
            CoordinatorGradeBand.user_id == user.id,
        )
    )
    if band is None:
        from datetime import datetime, timezone

        band = CoordinatorGradeBand(
            campus_id=actor.campus_id,
            user_id=user.id,
            grade_from=grade_from,
            grade_to=grade_to,
            created_at=datetime.now(timezone.utc),
        )
        db.add(band)
    else:
        band.grade_from = grade_from
        band.grade_to = grade_to

    write_audit(
        db,
        action="COORDINATOR_GRADE_BAND_SET",
        entity_type="coordinator_grade_band",
        entity_id=str(user.id),
        actor_id=actor.id,
        campus_id=actor.campus_id,
        details=f"{user.email} Grades {grade_from}-{grade_to}",
    )
    db.commit()
    db.refresh(band)
    return {
        "userId": str(user.id),
        "email": user.email,
        "isActive": bool(user.is_active),
        "gradeFrom": band.grade_from,
        "gradeTo": band.grade_to,
        "bandId": str(band.id),
    }


_DEFAULT_SECTIONS = ("A", "B", "C")


def _find_class_for_name(
    db: Session,
    *,
    campus_id: UUID,
    class_name: str,
    academic_year_id: UUID | None,
) -> SchoolClass | None:
    """Match class master by exact name, then by grade number (Grade 1 / 1 / I)."""
    want = class_name.strip()
    if not want:
        return None
    stmt = select(SchoolClass).where(
        SchoolClass.campus_id == campus_id,
        SchoolClass.is_active.is_(True),
    )
    if academic_year_id:
        stmt = stmt.where(SchoolClass.academic_year_id == academic_year_id)
    rows = db.scalars(stmt.order_by(SchoolClass.name)).all()
    lower = want.lower()
    for row in rows:
        if str(row.name or "").strip().lower() == lower:
            return row
    want_grade = parse_grade(want)
    if want_grade is None:
        return None
    for row in rows:
        if parse_grade(row.name) == want_grade:
            return row
    return None


def ensure_class_with_sections(
    db: Session,
    actor: User,
    *,
    class_name: str,
) -> tuple[SchoolClass, list[Section]]:
    """
    Resolve the school class for placement. If missing in the current academic year,
    create it with default sections A/B/C so coordinators can assign immediately.
    """
    year = current_academic_year(db, actor.campus_id)
    if year is None:
        fail(
            409,
            "academic_year_required",
            "Mark an academic year as current before assigning sections.",
        )

    name = (class_name or "").strip() or "Grade 1"
    # Prefer canonical "Grade N" when we can parse a grade.
    grade = parse_grade(name)
    if grade is not None:
        name = f"Grade {grade}"

    school_class = _find_class_for_name(
        db,
        campus_id=actor.campus_id,
        class_name=name,
        academic_year_id=year.id,
    )
    created = False
    if school_class is None:
        school_class = SchoolClass(
            campus_id=actor.campus_id,
            academic_year_id=year.id,
            name=name,
            is_active=True,
        )
        db.add(school_class)
        db.flush()
        created = True

    sections = list(
        db.scalars(
            select(Section)
            .where(Section.class_id == school_class.id, Section.campus_id == actor.campus_id)
            .order_by(Section.name)
        ).all()
    )
    if not sections:
        for section_name in _DEFAULT_SECTIONS:
            db.add(
                Section(
                    campus_id=actor.campus_id,
                    class_id=school_class.id,
                    name=section_name,
                    is_active=True,
                )
            )
        db.flush()
        sections = list(
            db.scalars(
                select(Section)
                .where(Section.class_id == school_class.id)
                .order_by(Section.name)
            ).all()
        )
        created = True

    if created:
        db.commit()
        db.refresh(school_class)
        sections = list(
            db.scalars(
                select(Section)
                .where(Section.class_id == school_class.id)
                .order_by(Section.name)
            ).all()
        )
    return school_class, [s for s in sections if s.is_active]


def placement_options(db: Session, actor: User, class_name: str) -> dict:
    """Sections available for a student's class (creates Grade N + A/B/C if missing)."""
    school_class, sections = ensure_class_with_sections(db, actor, class_name=class_name)
    return {
        "classId": str(school_class.id),
        "className": school_class.name,
        "academicYearId": str(school_class.academic_year_id) if school_class.academic_year_id else None,
        "sections": [
            {
                "id": str(section.id),
                "name": section.name,
                "capacity": section.capacity,
                "isActive": section.is_active,
            }
            for section in sections
        ],
    }
