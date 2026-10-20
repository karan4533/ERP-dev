"""Campus student list & detail (P1-5 UIS)."""

from __future__ import annotations

import re
from uuid import UUID

from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.models import Admission, Guardian, Student, User
from app.services.errors import fail


def _norm_class_key(value: str | None) -> str:
    # Prefer grade parsing so Roman 'V' / 'VI' match masters 'Grade 5' / 'Grade 6'.
    try:
        from app.services.placement import parse_grade

        grade_n = parse_grade(value)
        if grade_n is not None:
            return f"grade {grade_n}"
    except Exception:
        pass
    text = re.sub(r"\s+", " ", str(value or "").strip().lower())
    text = re.sub(r"^class\s+", "", text)
    grade = re.match(r"^grade\s*(\d+[a-z]?)$", text)
    if grade:
        return f"grade {grade.group(1)}"
    bare = re.match(r"^(\d+[a-z]?)$", text)
    if bare:
        return f"grade {bare.group(1)}"
    return text


def _norm_section_key(value: str | None) -> str:
    return str(value or "").strip().upper()


def _teacher_roster_scope(db: Session, actor: User) -> list[dict]:
    """
    Classes/sections the teacher may see:
    - Sections where they are class teacher (masters.sections.class_teacher_user_id)
    - Principal teacher-allocation mappings for their HR employee / email
    """
    from app.models import AcademicsRecord, HrEmployee, SchoolClass, Section

    scope: list[dict] = []
    seen: set[tuple[str, str]] = set()

    def _add(class_name: str, section: str = "", *, is_class_teacher: bool = False) -> None:
        class_name = str(class_name or "").strip()
        section = str(section or "").strip()
        if not class_name:
            return
        key = (_norm_class_key(class_name), _norm_section_key(section))
        if key in seen:
            return
        seen.add(key)
        scope.append(
            {
                "className": class_name,
                "section": section,
                "isClassTeacher": is_class_teacher,
            }
        )

    class_teacher_rows = db.execute(
        select(SchoolClass.name, Section.name)
        .join(Section, Section.class_id == SchoolClass.id)
        .where(
            Section.campus_id == actor.campus_id,
            Section.class_teacher_user_id == actor.id,
            Section.is_active.is_(True),
        )
    ).all()
    for class_name, section_name in class_teacher_rows:
        _add(class_name, section_name or "", is_class_teacher=True)

    hr = db.scalar(
        select(HrEmployee).where(
            HrEmployee.campus_id == actor.campus_id,
            or_(
                HrEmployee.user_id == actor.id,
                func.lower(HrEmployee.email) == str(actor.email or "").lower(),
            ),
        )
    )
    employee_codes = {
        str(hr.employee_code).strip().lower() if hr and hr.employee_code else "",
        str(hr.id).strip().lower() if hr else "",
        str(actor.id).strip().lower(),
        str(actor.email or "").strip().lower(),
    }
    employee_codes.discard("")

    allocations = db.scalars(
        select(AcademicsRecord).where(
            AcademicsRecord.campus_id == actor.campus_id,
            AcademicsRecord.collection == "teacher-allocations",
        )
    ).all()
    actor_email = str(actor.email or "").strip().lower()
    for row in allocations:
        body = dict(row.body or {})
        if str(body.get("status") or "").strip().lower() in {"inactive", "not allocated"}:
            continue
        public_id = str(row.public_id or body.get("employeeId") or body.get("id") or "").strip().lower()
        body_email = str(body.get("email") or body.get("teacherEmail") or "").strip().lower()
        linked = public_id in employee_codes or (body_email and body_email == actor_email)
        if not linked:
            continue

        class_teacher = body.get("classTeacher") or {}
        ct_class = str(class_teacher.get("className") or "").strip()
        ct_section = str(class_teacher.get("section") or "").strip()
        if ct_class:
            _add(ct_class, ct_section, is_class_teacher=True)

        mapped_classes: set[str] = set()
        for mapping in body.get("mappings") or []:
            if not isinstance(mapping, dict):
                continue
            mapping_class = str(mapping.get("className") or "").strip()
            mapping_section = str(mapping.get("section") or "").strip()
            if mapping_class:
                mapped_classes.add(_norm_class_key(mapping_class))
            _add(
                mapping_class,
                mapping_section,
                is_class_teacher=bool(
                    ct_class
                    and _norm_class_key(mapping_class) == _norm_class_key(ct_class)
                    and (
                        not ct_section
                        or _norm_section_key(mapping_section) == _norm_section_key(ct_section)
                    )
                ),
            )

        # teachingClasses is a grade list without sections. Never expand it to every
        # section of that grade when we already have class-teacher / mapping pins —
        # that was leaking e.g. Grade 6-B when the teacher is only assigned Grade 6-A.
        for class_name in body.get("teachingClasses") or []:
            class_name = str(class_name or "").strip()
            if not class_name:
                continue
            class_key = _norm_class_key(class_name)
            if class_key in mapped_classes:
                continue
            if ct_class and class_key == _norm_class_key(ct_class):
                # Already added via classTeacher above (with section when present).
                continue
            # Unpinned subject-teacher grade: keep for visibility of unplaced students only
            # (empty section), but _student_in_teacher_scope will not treat it as all sections
            # when any section-specific entry exists for the same grade.
            _add(class_name, "", is_class_teacher=False)

    return scope


def _student_in_teacher_scope(student: Student, scope: list[dict]) -> bool:
    if not scope:
        return False
    student_class = student.class_name or ""
    student_section = student.section or ""
    class_entries = [
        entry
        for entry in scope
        if _norm_class_key(student_class) == _norm_class_key(entry.get("className"))
    ]
    if not class_entries:
        return False

    section_specific = [entry for entry in class_entries if _norm_section_key(entry.get("section"))]
    # Prefer section pins (class teacher / mappings). Ignore empty-section wildcards for that grade.
    entries = section_specific or class_entries

    for entry in entries:
        want_section = _norm_section_key(entry.get("section"))
        if not want_section:
            # Whole-grade fallback only when no section was pinned for this class.
            return True
        if not student_section or student_section in {"—", "-"}:
            # Not section-placed yet: only class teachers of a pinned section see them.
            if entry.get("isClassTeacher"):
                return True
            continue
        if _norm_section_key(student_section) == want_section:
            return True
    return False

# Admissions in these statuses are not promoted into the students table.
_SYNC_SKIP_STATUSES = {
    "rejected",
    "withdrawn",
    "cancelled",
    "canceled",
    "in active",
    "inactive",
}


def _iso(value) -> str | None:
    if value is None:
        return None
    if hasattr(value, "isoformat"):
        return value.isoformat()
    return str(value)


def _admission_for(db: Session, student: Student) -> Admission | None:
    if student.admission_id:
        row = db.get(Admission, student.admission_id)
        if row is not None:
            return row
    return db.scalar(
        select(Admission).where(Admission.enrolled_student_id == student.id).limit(1)
    )


def _list_item(student: Student, admission: Admission | None) -> dict:
    class_name = student.class_name or ""
    section = student.section or ""
    return {
        "id": str(student.id),
        "name": student.full_name,
        "admissionNumber": student.admission_number,
        "className": class_name,
        "section": section,
        "classSection": f"{class_name}-{section}" if section else class_name,
        "rollNumber": student.roll_number if student.roll_number is not None else "",
        "placementStatus": student.placement_status or "pending",
        "sectionId": str(student.section_id) if student.section_id else None,
        "classId": str(student.class_id) if student.class_id else None,
        "academicYearId": str(student.academic_year_id) if student.academic_year_id else None,
        "admissionId": str(student.admission_id) if student.admission_id else None,
        "parentUserId": str(student.parent_user_id) if student.parent_user_id else None,
        "studentUserId": str(student.student_user_id) if student.student_user_id else None,
        "gender": (admission.gender if admission else None) or "",
        "email": (admission.email if admission else None) or "",
        "mobileNumber": (admission.mobile_number if admission else None) or "",
        "dateOfBirth": _iso(admission.date_of_birth) if admission else None,
        "country": (admission.country if admission else None) or "",
        "state": (admission.state if admission else None) or "",
        "city": (admission.city if admission else None) or "",
        "status": (admission.status if admission else None) or "Active",
        "createdAt": _iso(student.created_at),
    }


def get_my_student(db: Session, actor: User) -> dict:
    """Student portal profile for the signed-in student login."""
    from sqlalchemy import String, cast, or_

    from app.deps import role_code_for

    if role_code_for(db, actor) != "student":
        fail(403, "forbidden", "Student role required.")
    student_key = str(actor.id)
    row = db.scalar(
        select(Student).where(
            Student.campus_id == actor.campus_id,
            or_(
                Student.student_user_id == actor.id,
                cast(Student.student_user_id, String) == student_key,
            ),
        )
    )
    if row is None:
        fail(404, "not_found", "No student profile is linked to this login.")
    return get_student(db, actor, row.id)


def link_student_user(db: Session, *, student_id: UUID, user_id: UUID) -> Student:
    student = db.get(Student, student_id)
    if student is None:
        fail(404, "not_found", "Student not found.")
    student.student_user_id = user_id
    db.add(student)
    db.flush()
    return student


def list_students(db: Session, actor: User, class_name: str | None = None) -> list[dict]:
    from app.deps import role_code_for
    from app.services.placement import (
        actor_can_manage_grade,
        parse_grade,
        student_placement_fields,
    )

    stmt = select(Student).where(Student.campus_id == actor.campus_id)
    stmt = stmt.order_by(Student.full_name)
    rows = list(db.scalars(stmt).all())
    if class_name:
        want = _norm_class_key(class_name)
        rows = [row for row in rows if _norm_class_key(row.class_name) == want]
    role = role_code_for(db, actor)
    # Coordinators also see students in classes they were allocated to teach (Teacher Allocation),
    # in addition to their Principal grade band (e.g. 1–4).
    roster_scope = _teacher_roster_scope(db, actor) if role in {"teacher", "coordinator"} else []
    out = []
    for row in rows:
        grade = parse_grade(row.class_name)
        if role == "coordinator":
            in_band = actor_can_manage_grade(db, actor, grade)
            in_alloc = bool(roster_scope) and _student_in_teacher_scope(row, roster_scope)
            if not in_band and not in_alloc:
                continue
        if role == "teacher" and not _student_in_teacher_scope(row, roster_scope):
            continue
        item = _list_item(row, _admission_for(db, row))
        item.update(student_placement_fields(db, row))
        out.append(item)
    return out


def sync_students_from_admissions(db: Session, actor: User) -> dict:
    """
    Promote campus admissions (Active / not yet enrolled) into the students table.

    Admin/PRM often create admission rows without clicking Enrol. Finance Import
    previously only read /students (empty), so Account Head saw “no enrolled students”
    despite admissions existing. This sync enrols those admissions without creating
    parent/student portal logins.
    """
    from fastapi import HTTPException

    from app.schemas.admissions import EnrollAdmissionIn
    from app.services.admissions import enroll_admission
    from app.services.placement import repair_student_class_labels

    # Fix legacy Roman/numeric class labels so Fee Collection / Attendance match Grade N.
    repair_student_class_labels(db, actor.campus_id)

    already = (
        db.scalar(select(func.count()).select_from(Student).where(Student.campus_id == actor.campus_id))
        or 0
    )
    admissions = db.scalars(
        select(Admission)
        .where(
            Admission.campus_id == actor.campus_id,
            Admission.enrolled_student_id.is_(None),
        )
        .order_by(Admission.created_at.asc())
    ).all()

    pending = [
        row
        for row in admissions
        if str(row.status or "").strip().lower() not in _SYNC_SKIP_STATUSES
    ]

    created: list[dict] = []
    errors: list[dict] = []
    for row in pending:
        try:
            result = enroll_admission(
                db,
                actor,
                row.id,
                EnrollAdmissionIn(skip_parent_account=True, skip_student_account=True),
            )
            created.append(
                {
                    "admissionId": str(row.id),
                    "studentId": str(result["student_id"]),
                    "studentCode": result.get("student_code"),
                    "name": _full_name_safe(row),
                    "className": row.class_name or "",
                }
            )
        except HTTPException as exc:
            detail = exc.detail if isinstance(exc.detail, dict) else {}
            errors.append(
                {
                    "admissionId": str(row.id),
                    "message": detail.get("message") or str(exc.detail),
                }
            )
        except Exception as exc:  # noqa: BLE001 — surface per-row failures to the client
            errors.append({"admissionId": str(row.id), "message": str(exc)})

    total = (
        db.scalar(select(func.count()).select_from(Student).where(Student.campus_id == actor.campus_id))
        or 0
    )
    return {
        "created": len(created),
        "alreadyEnrolled": int(already),
        "pendingAdmissions": len(pending),
        "totalStudents": int(total),
        "students": created,
        "errors": errors,
    }


def _full_name_safe(row: Admission) -> str:
    parts = [row.first_name, row.middle_name, row.last_name]
    name = " ".join(str(part or "").strip() for part in parts if str(part or "").strip())
    return name or "Student"


def list_parents_for_staff(db: Session, actor: User) -> list[dict]:
    """One row per student in the actor's student scope (parent contact from admission)."""
    students = list_students(db, actor)
    out: list[dict] = []
    for item in students:
        try:
            sid = UUID(str(item["id"]))
        except (TypeError, ValueError):
            continue
        student = db.get(Student, sid)
        if student is None:
            continue
        admission = _admission_for(db, student)
        parent_name = ""
        parent_email = ""
        parent_mobile = ""
        if admission is not None:
            parent_name = (
                (admission.father_name or "").strip()
                or (admission.mother_name or "").strip()
                or "Parent"
            )
            parent_email = (
                (admission.parent_account_email or "").strip()
                or (admission.parent_email or "").strip()
            )
            parent_mobile = (
                (admission.parent_mobile_number or "").strip()
                or (admission.mobile_number or "").strip()
            )
        out.append(
            {
                "id": str(student.id),
                "studentId": str(student.id),
                "studentName": student.full_name,
                "admissionNumber": student.admission_number,
                "className": student.class_name or "",
                "section": student.section or "",
                "parentName": parent_name or "—",
                "parentEmail": parent_email or "—",
                "mobileNumber": parent_mobile or "—",
                "parentUserId": str(student.parent_user_id) if student.parent_user_id else None,
            }
        )
    out.sort(key=lambda row: (row["parentName"] or "", row["studentName"] or ""))
    return out


def get_student(db: Session, actor: User, student_id: UUID) -> dict:
    from app.deps import role_code_for
    from app.services.placement import actor_can_manage_grade, parse_grade

    student = db.get(Student, student_id)
    if student is None or student.campus_id != actor.campus_id:
        fail(404, "not_found", "Student not found.")

    role = role_code_for(db, actor)
    if role == "coordinator":
        grade = parse_grade(student.class_name)
        in_band = actor_can_manage_grade(db, actor, grade)
        scope = _teacher_roster_scope(db, actor)
        in_alloc = bool(scope) and _student_in_teacher_scope(student, scope)
        if not in_band and not in_alloc:
            fail(403, "forbidden", "This student is outside your grade band and teaching allocations.")
    if role == "teacher":
        scope = _teacher_roster_scope(db, actor)
        if not _student_in_teacher_scope(student, scope):
            fail(403, "forbidden", "This student is outside your assigned classes.")

    admission = _admission_for(db, student)
    guardians = db.scalars(
        select(Guardian).where(Guardian.student_id == student.id).order_by(Guardian.created_at)
    ).all()

    from app.services.placement import student_placement_fields

    base = _list_item(student, admission)
    base.update(student_placement_fields(db, student))
    base["guardians"] = [
        {
            "id": str(g.id),
            "fullName": g.full_name,
            "phone": g.phone,
            "relationship": g.relationship,
        }
        for g in guardians
    ]

    if admission is None:
        base["firstName"] = student.full_name
        base["middleName"] = ""
        base["lastName"] = ""
        return base

    base.update(
        {
            "firstName": admission.first_name or "",
            "middleName": admission.middle_name or "",
            "lastName": admission.last_name or "",
            "admissionDate": _iso(admission.admission_date),
            "registrationFees": admission.registration_fees or "",
            "batchStartYear": admission.batch_start_year,
            "batchEndYear": admission.batch_end_year,
            "feesGroup": admission.fees_group or "",
            "religion": admission.religion or "",
            "caste": admission.caste or "",
            "address": admission.address or "",
            "zipCode": admission.zip_code or "",
            "altMobileNumber": admission.alt_mobile_number or "",
            "previousSchool": admission.previous_school or "",
            "bloodGroup": admission.blood_group or "",
            "height": admission.height or "",
            "weight": admission.weight or "",
            "medicalHistory": admission.medical_history or "",
            "profileImageFileId": str(admission.profile_image_file_id)
            if admission.profile_image_file_id
            else None,
            "modeOfTransport": admission.mode_of_transport or "",
            "route": admission.route or "",
            "busStop": admission.bus_stop or "",
            "fatherName": admission.father_name or "",
            "motherName": admission.mother_name or "",
            "fatherOccupation": admission.father_occupation or "",
            "motherOccupation": admission.mother_occupation or "",
            "fatherIncome": admission.father_income or "",
            "motherIncome": admission.mother_income or "",
            "siblings": admission.siblings or "",
            "parentAddress": admission.parent_address or "",
            "parentCountry": admission.parent_country or "",
            "parentState": admission.parent_state or "",
            "parentCity": admission.parent_city or "",
            "parentZipCode": admission.parent_zip_code or "",
            "parentMobileNumber": admission.parent_mobile_number or "",
            "parentAltMobileNumber": admission.parent_alt_mobile_number or "",
            "parentEmail": admission.parent_email or "",
            "parentAccountEmail": admission.parent_account_email or "",
        }
    )
    return base
