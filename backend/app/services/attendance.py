"""Teacher class attendance SoT (Y-1)."""

from __future__ import annotations

from datetime import date
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Student, StudentAttendance, User
from app.models.base import utcnow
from app.schemas.attendance import AttendanceUpsertIn
from app.services.audit import write_audit
from app.services.errors import fail

ALLOWED_STATUS = {"Present", "Absent", "Late", "Holiday"}


def _mark_out(row: StudentAttendance, student: Student | None = None) -> dict:
    name = student.full_name if student else ""
    admission = student.admission_number if student else ""
    return {
        "id": str(row.id),
        "studentId": str(row.student_id),
        "studentName": name,
        "admissionNumber": admission,
        "className": row.class_name,
        "section": row.section or "",
        "date": row.attendance_date.isoformat(),
        "time": row.updated_at.isoformat() if row.updated_at else row.created_at.isoformat(),
        "attendanceStatus": row.status,
        "inOutStatus": row.in_out_status or ("—" if row.status == "Absent" else ""),
    }


def list_attendance(
    db: Session,
    actor: User,
    *,
    attendance_date: date,
    class_name: str | None = None,
    section: str | None = None,
) -> list[dict]:
    stmt = select(StudentAttendance).where(
        StudentAttendance.campus_id == actor.campus_id,
        StudentAttendance.attendance_date == attendance_date,
    )
    if class_name:
        stmt = stmt.where(StudentAttendance.class_name == class_name)
    if section:
        stmt = stmt.where(StudentAttendance.section == section)
    rows = db.scalars(stmt.order_by(StudentAttendance.class_name, StudentAttendance.created_at)).all()
    student_ids = [r.student_id for r in rows]
    students = {
        s.id: s
        for s in db.scalars(select(Student).where(Student.id.in_(student_ids))).all()
    } if student_ids else {}
    return [_mark_out(r, students.get(r.student_id)) for r in rows]


def _class_matches(student_class: str | None, filter_class: str | None) -> bool:
    """Exact match, or same grade number (Grade 5 ↔ V ↔ 5)."""
    left = str(student_class or "").strip()
    right = str(filter_class or "").strip()
    if not left or not right:
        return False
    if left.lower() == right.lower():
        return True
    from app.services.placement import parse_grade

    left_g = parse_grade(left)
    right_g = parse_grade(right)
    return left_g is not None and left_g == right_g


def _section_matches(student_section: str | None, filter_section: str | None) -> bool:
    if not filter_section:
        return True
    return str(student_section or "").strip().upper() == str(filter_section).strip().upper()


def roster_with_marks(
    db: Session,
    actor: User,
    *,
    attendance_date: date,
    class_name: str,
    section: str | None = None,
) -> list[dict]:
    """Enrolled students for a class, merged with any marks for the date."""
    from app.services.placement import repair_student_class_labels

    repair_student_class_labels(db, actor.campus_id)

    stmt = select(Student).where(
        Student.campus_id == actor.campus_id,
        Student.placement_status == "placed",
    )
    students = [
        row
        for row in db.scalars(stmt.order_by(Student.roll_number.nulls_last(), Student.full_name)).all()
        if _class_matches(row.class_name, class_name) and _section_matches(row.section, section)
    ]
    marks_stmt = select(StudentAttendance).where(
        StudentAttendance.campus_id == actor.campus_id,
        StudentAttendance.attendance_date == attendance_date,
    )
    marks_all = db.scalars(marks_stmt).all()
    marks = {
        r.student_id: r
        for r in marks_all
        if _class_matches(r.class_name, class_name) and _section_matches(r.section, section)
    }
    out: list[dict] = []
    for student in students:
        mark = marks.get(student.id)
        if mark:
            out.append(_mark_out(mark, student))
        else:
            out.append(
                {
                    "id": None,
                    "studentId": str(student.id),
                    "studentName": student.full_name,
                    "admissionNumber": student.admission_number,
                    "className": student.class_name,
                    "section": student.section or section or "",
                    "rollNumber": student.roll_number if student.roll_number is not None else "",
                    "date": attendance_date.isoformat(),
                    "time": "",
                    "attendanceStatus": "",
                    "inOutStatus": "",
                }
            )
    return out


def upsert_attendance(db: Session, actor: User, payload: AttendanceUpsertIn) -> list[dict]:
    class_name = payload.class_name.strip()
    if not class_name:
        fail(400, "validation_error", "Class is required.")

    results: list[StudentAttendance] = []
    for item in payload.marks:
        status = (item.status or "").strip()
        if status not in ALLOWED_STATUS:
            fail(400, "validation_error", f"Invalid status '{item.status}'. Use {sorted(ALLOWED_STATUS)}.")
        student = db.get(Student, item.student_id)
        if student is None or student.campus_id != actor.campus_id:
            fail(404, "not_found", f"Student {item.student_id} not found.")
        if not _class_matches(student.class_name, class_name):
            fail(400, "validation_error", f"Student {student.full_name} is not in class {class_name}.")

        row = db.scalar(
            select(StudentAttendance).where(
                StudentAttendance.campus_id == actor.campus_id,
                StudentAttendance.student_id == student.id,
                StudentAttendance.attendance_date == payload.date,
            )
        )
        if row is None:
            row = StudentAttendance(
                campus_id=actor.campus_id,
                student_id=student.id,
                attendance_date=payload.date,
                class_name=class_name,
                section=payload.section,
                status=status,
                in_out_status=item.in_out_status,
                marked_by_user_id=actor.id,
            )
            db.add(row)
        else:
            row.status = status
            row.in_out_status = item.in_out_status
            row.class_name = class_name
            row.section = payload.section
            row.marked_by_user_id = actor.id
            row.updated_at = utcnow()
        results.append(row)

    write_audit(
        db,
        action="ATTENDANCE_UPSERT",
        entity_type="student_attendance",
        entity_id=f"{class_name}:{payload.date.isoformat()}",
        actor_id=actor.id,
        campus_id=actor.campus_id,
        details=f"{len(payload.marks)} marks",
    )
    db.commit()
    for row in results:
        db.refresh(row)

    students = {
        s.id: s
        for s in db.scalars(
            select(Student).where(Student.id.in_([r.student_id for r in results]))
        ).all()
    }
    return [_mark_out(r, students.get(r.student_id)) for r in results]


def student_month_map(
    db: Session,
    actor: User,
    student_id: UUID,
    *,
    year: int,
    month: int,
) -> dict[str, str]:
    from app.deps import role_code_for

    student = db.get(Student, student_id)
    if student is None or student.campus_id != actor.campus_id:
        fail(404, "not_found", "Student not found.")
    role = role_code_for(db, actor)
    if role == "parent" and str(student.parent_user_id or "") != str(actor.id):
        fail(404, "not_found", "Student not found.")
    if role == "student" and str(student.student_user_id or "") != str(actor.id):
        fail(404, "not_found", "Student not found.")
    if month < 1 or month > 12:
        fail(400, "validation_error", "Month must be 1–12.")

    start = date(year, month, 1)
    end = date(year + 1, 1, 1) if month == 12 else date(year, month + 1, 1)
    rows = db.scalars(
        select(StudentAttendance).where(
            StudentAttendance.campus_id == actor.campus_id,
            StudentAttendance.student_id == student_id,
            StudentAttendance.attendance_date >= start,
            StudentAttendance.attendance_date < end,
        )
    ).all()
    code = {"Present": "P", "Absent": "A", "Late": "P", "Holiday": "H"}
    return {r.attendance_date.isoformat(): code.get(r.status, "P") for r in rows}
