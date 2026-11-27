"""Campus academics collections: class timetables, teacher allocations, timetable change requests."""

from __future__ import annotations

import json
import re
import uuid
from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy import delete, func, or_, select
from sqlalchemy.orm import Session

from app.deps import role_code_for
from app.models import (
    AcademicYear,
    AcademicsRecord,
    HrEmployee,
    SchoolClass,
    Section,
    Student,
    Subject,
    User,
)
from app.services.audit import write_audit
from app.services.errors import fail
from app.services.placement import parse_grade
from app.services.students import (
    PORTAL_ROLES,
    _teacher_roster_scope,
    class_key,
    portal_students,
    section_key,
)

COLLECTIONS: dict[str, str] = {
    "class-timetables": "CTT",
    "teacher-allocations": "TAL",
    "class-timetable-change-requests": "TCR",
    "extra-classes": "EC",
    "online-classes": "OC",
    "student-star-ratings": "SSR",
    "unit-tests": "UT",
    "sample-questions": "SQ",
    "home-fun": "HF",
    "study-materials": "SM",
}

_FULL_WRITERS = {"principal", "admin", "superadmin", "managing_director", "director"}
# Teacher Allocation is Principal-owned (client review). Admin may still edit class timetables.
_ALLOCATION_WRITERS = {"principal", "superadmin", "managing_director"}
_CHANGE_WRITERS = _FULL_WRITERS | {"teacher", "coordinator"}
_EXTRA_WRITERS = _CHANGE_WRITERS
# Coordinators create/edit class timetables; teachers use change-requests only.
# Timetable *change approval* is Principal-only (see _normalize_timetable_approvals).
_TIMETABLE_WRITERS = _FULL_WRITERS | {"coordinator"}
_STAFF_DELIVERABLE_COLLECTIONS = {
    "extra-classes",
    "online-classes",
    "student-star-ratings",
    "unit-tests",
    "sample-questions",
    "home-fun",
    "study-materials",
}
_READERS = _CHANGE_WRITERS | {"student", "parent", "jointdirector"}
# Staff-internal lists: portal logins get an empty list (the timetable page loads these in parallel).
_STAFF_ONLY_COLLECTIONS = {"teacher-allocations", "class-timetable-change-requests"}
# Every staff form for these saves exactly one className and one section (both required, no "All").
_CLASS_CONTENT_COLLECTIONS = {
    "home-fun",
    "study-materials",
    "sample-questions",
    "unit-tests",
    "extra-classes",
    "online-classes",
}
# Submission tracking on home-fun items is staff data; it must never reach a parent/student response.
_PORTAL_HIDDEN_FIELDS = ("studentDetails",)
# Staff roles that still receive the full campus academics list (leadership / admin).
_UNSCOPED_STAFF = {
    "principal",
    "admin",
    "superadmin",
    "managing_director",
    "director",
    "jointdirector",
}
# Collections filtered by teacher allocation / coordinator grade band for non-leadership staff.
_ALLOCATION_SCOPED_COLLECTIONS = {
    "class-timetables",
    "unit-tests",
    "extra-classes",
    "online-classes",
    "sample-questions",
    "home-fun",
    "study-materials",
}
# Scoped writers must not wipe out-of-scope rows via whole-list PUT.
_SCOPED_REPLACE_COLLECTIONS = _ALLOCATION_SCOPED_COLLECTIONS | {"class-timetable-change-requests"}
# Removing a class timetable (DELETE or dropping it from a PUT) is leadership-only; coordinators edit.
_TIMETABLE_DELETERS = _FULL_WRITERS
_SINGLE_DELETE_COLLECTIONS = {"class-timetables", "extra-classes"}
_CHANGE_REQUEST_OWNER_KEYS = (
    "requestedByEmail",
    "teacherEmail",
    "email",
    "createdByEmail",
    "ownerEmail",
    "requestedBy",
    "createdBy",
    "ownerTeacherId",
    "teacherId",
    "userId",
)
_EXTRA_CLASS_EDITABLE_FIELDS = (
    "subject",
    "className",
    "section",
    "topic",
    "date",
    "startTime",
    "endTime",
    "venue",
    "reason",
)
_EXTRA_CLASS_REQUIRED_FIELDS = (
    "subject",
    "className",
    "section",
    "topic",
    "date",
    "startTime",
    "endTime",
    "venue",
)
_EXTRA_CLASS_MAX_LENGTHS = {"topic": 200, "venue": 120, "reason": 1000, "subject": 120}
_ACTIVE_ALLOCATION_STATUSES = {"", "active", "allocated"}


def _code(db: Session, actor: User) -> str:
    return role_code_for(db, actor)


def _ensure_collection(collection: str) -> None:
    if collection not in COLLECTIONS:
        fail(404, "not_found", "That academics collection does not exist.")


def _can_read(db: Session, actor: User) -> bool:
    return _code(db, actor) in _READERS


def _can_write(db: Session, actor: User, collection: str) -> bool:
    code = _code(db, actor)
    if collection == "teacher-allocations":
        return code in _ALLOCATION_WRITERS
    if collection == "class-timetable-change-requests":
        return code in _CHANGE_WRITERS
    if collection == "class-timetables":
        return code in _TIMETABLE_WRITERS
    if collection in _STAFF_DELIVERABLE_COLLECTIONS:
        return code in _EXTRA_WRITERS
    return code in _FULL_WRITERS


def _as_item(row: AcademicsRecord) -> dict:
    body = dict(row.body or {})
    body["id"] = row.public_id
    if row.collection == "teacher-allocations":
        body.setdefault("employeeId", row.public_id)
        body["employeeId"] = row.public_id
    body["_collection"] = row.collection
    body["_updatedAt"] = row.updated_at.isoformat() if row.updated_at else None
    body["_createdAt"] = row.created_at.isoformat() if row.created_at else None
    return body


def _public_id_for(collection: str, body: dict, fallback: str) -> str:
    if collection == "teacher-allocations":
        return str(body.get("employeeId") or body.get("id") or fallback).strip()
    return str(body.get("id") or fallback).strip()


def _timetable_for_student(item: dict, student: Student) -> bool:
    """Same matching as the portal timetable page: the child's class, and their section or a whole-class entry."""
    want_class = class_key(student.class_name)
    want_section = section_key(student.section)
    timelines = [t for t in item.get("timelines") or [] if isinstance(t, dict)]
    class_rows = [t for t in timelines if class_key(t.get("className")) == want_class]
    if class_key(item.get("className")) != want_class and not class_rows:
        return False
    item_section = section_key(item.get("section"))
    if not item_section:
        return True
    if item_section == want_section and want_section:
        return True
    return bool(want_section) and any(section_key(t.get("section")) == want_section for t in class_rows)


def _timetable_published(item: dict) -> bool:
    """Only a Principal/Director-approved timetable is published; Pending and Denied stay staff-only."""
    return str(item.get("approvalStatus") or "").strip().lower() == "approved"


def _content_for_student(item: dict, student: Student) -> bool:
    """Class content targets one class and section; rows missing either are not shown to families."""
    item_class = class_key(item.get("className"))
    item_section = section_key(item.get("section"))
    if not item_class or not item_section:
        return False
    return item_class == class_key(student.class_name) and item_section == section_key(student.section)


def _portal_items(db: Session, actor: User, role: str, collection: str, items: list[dict]) -> list[dict]:
    if collection in _STAFF_ONLY_COLLECTIONS:
        return []
    students = portal_students(db, actor, role)
    if collection == "class-timetables":
        return [
            item for item in items
            if _timetable_published(item) and any(_timetable_for_student(item, s) for s in students)
        ]
    if collection == "student-star-ratings":
        ids = {str(s.id) for s in students}
        return [item for item in items if str(item.get("studentId") or "") in ids]
    if collection in _CLASS_CONTENT_COLLECTIONS:
        visible = [item for item in items if any(_content_for_student(item, s) for s in students)]
        return [{k: v for k, v in item.items() if k not in _PORTAL_HIDDEN_FIELDS} for item in visible]
    return []


def _coordinator_band(db: Session, actor: User) -> tuple[int, int] | None:
    from app.models import CoordinatorGradeBand

    band = db.scalar(
        select(CoordinatorGradeBand).where(
            CoordinatorGradeBand.campus_id == actor.campus_id,
            CoordinatorGradeBand.user_id == actor.id,
        )
    )
    if band is None:
        return None
    return int(band.grade_from), int(band.grade_to)


def _item_class_section_pairs(item: dict) -> list[tuple[str, str]]:
    pairs: list[tuple[str, str]] = []
    root_class = class_key(item.get("className"))
    root_section = section_key(item.get("section"))
    if root_class:
        pairs.append((root_class, root_section))
    for timeline in item.get("timelines") or []:
        if not isinstance(timeline, dict):
            continue
        tl_class = class_key(timeline.get("className"))
        if not tl_class:
            continue
        pairs.append((tl_class, section_key(timeline.get("section"))))
    return pairs


def _pair_in_teacher_scope(pair: tuple[str, str], scope_pairs: set[tuple[str, str]]) -> bool:
    class_name, section = pair
    if not class_name:
        return False
    if (class_name, section) in scope_pairs:
        return True
    # Whole-class rows (empty section) match any allocated section of that class.
    if not section and any(sc == class_name for sc, _ in scope_pairs):
        return True
    # Allocation with empty section covers every section of that class.
    if section and (class_name, "") in scope_pairs:
        return True
    return False


def _item_in_teacher_scope(item: dict, scope_pairs: set[tuple[str, str]]) -> bool:
    pairs = _item_class_section_pairs(item)
    if not pairs:
        return False
    return any(_pair_in_teacher_scope(pair, scope_pairs) for pair in pairs)


def _item_in_coordinator_band(item: dict, band: tuple[int, int]) -> bool:
    lo, hi = band
    for class_name, _section in _item_class_section_pairs(item):
        grade = parse_grade(class_name)
        if grade is not None and lo <= grade <= hi:
            return True
    return False


def _change_request_owned(item: dict, actor: User) -> bool:
    email = str(actor.email or "").strip().lower()
    actor_id = str(actor.id)
    for key in _CHANGE_REQUEST_OWNER_KEYS:
        value = str(item.get(key) or "").strip().lower()
        if value and value in {email, actor_id.lower()}:
            return True
    return False


def _change_request_unowned(item: dict) -> bool:
    return not any(str(item.get(key) or "").strip() for key in _CHANGE_REQUEST_OWNER_KEYS)


def _teacher_scope_pairs(db: Session, actor: User) -> set[tuple[str, str]]:
    return {
        (class_key(entry.get("className")), section_key(entry.get("section")))
        for entry in _teacher_roster_scope(db, actor)
    }


def _staff_identity_keys(db: Session, actor: User) -> set[str]:
    """Lower-cased ids a timetable may use to name this staff member as its owner."""
    email = str(actor.email or "").strip().lower()
    keys = {str(actor.id).lower(), email}
    clauses = [HrEmployee.user_id == actor.id]
    if email:
        clauses.append(func.lower(HrEmployee.email) == email)
    hr = db.scalar(select(HrEmployee).where(HrEmployee.campus_id == actor.campus_id, or_(*clauses)))
    if hr is not None:
        keys.add(str(hr.id).lower())
        keys.add(str(hr.employee_code or "").strip().lower())
    keys.discard("")
    return keys


def _timetable_owned_by(item: dict, identity_keys: set[str]) -> bool:
    for key in ("ownerTeacherId", "ownerTeacherEmail"):
        value = str(item.get(key) or "").strip().lower()
        if value and value in identity_keys:
            return True
    return False


def _staff_scoped_items(db: Session, actor: User, role: str, collection: str, items: list[dict]) -> list[dict]:
    """Teachers/coordinators only see allocation / grade-band rows — never campus-wide lists."""
    if role in _UNSCOPED_STAFF:
        return items
    if collection == "class-timetable-change-requests":
        if role == "teacher":
            # Own requests, plus legacy rows without requester metadata for the teacher's own classes.
            scope_pairs = _teacher_scope_pairs(db, actor)
            return [
                item for item in items
                if _change_request_owned(item, actor)
                or (_change_request_unowned(item) and _item_in_teacher_scope(item, scope_pairs))
            ]
        if role == "coordinator":
            band = _coordinator_band(db, actor)
            if band is None:
                return []
            return [
                item for item in items
                if _change_request_owned(item, actor) or _item_in_coordinator_band(item, band)
            ]
        return items
    if collection not in _ALLOCATION_SCOPED_COLLECTIONS:
        return items
    if role == "teacher":
        scope_pairs = _teacher_scope_pairs(db, actor)
        if collection == "class-timetables":
            # A teacher also sees the timetables that name them as owner (individual timetable).
            identity = _staff_identity_keys(db, actor)
            return [
                item for item in items
                if _item_in_teacher_scope(item, scope_pairs) or _timetable_owned_by(item, identity)
            ]
        return [item for item in items if _item_in_teacher_scope(item, scope_pairs)]
    if role == "coordinator":
        band = _coordinator_band(db, actor)
        if band is None:
            return []
        return [item for item in items if _item_in_coordinator_band(item, band)]
    return items


def list_records(db: Session, actor: User, collection: str) -> list[dict]:
    _ensure_collection(collection)
    if not _can_read(db, actor):
        fail(403, "forbidden", "You are not allowed to view academics records.")
    rows = db.scalars(
        select(AcademicsRecord)
        .where(
            AcademicsRecord.campus_id == actor.campus_id,
            AcademicsRecord.collection == collection,
        )
        .order_by(AcademicsRecord.created_at.desc())
    ).all()
    items = [_as_item(row) for row in rows]
    role = _code(db, actor)
    if role in PORTAL_ROLES:
        return _portal_items(db, actor, role, collection, items)
    return _staff_scoped_items(db, actor, role, collection, items)


def _norm_subject(value: str) -> str:
    return re.sub(r"\s+", " ", str(value or "").strip()).lower()


def _allocation_desired_class_teachers(db: Session, campus_id: UUID, items: list[dict]) -> dict[tuple[str, str], UUID]:
    """Map (class_key, section_key) -> user_id for Active allocations with a class-teacher role."""
    desired: dict[tuple[str, str], UUID] = {}
    for raw in items:
        if not isinstance(raw, dict):
            continue
        status = str(raw.get("status") or "").strip().lower()
        if status and status != "active":
            continue
        ct = raw.get("classTeacher") or {}
        if not isinstance(ct, dict):
            continue
        class_name = str(ct.get("className") or "").strip()
        section_name = str(ct.get("section") or "").strip()
        if not class_name or not section_name:
            continue
        user = _resolve_allocation_user(db, campus_id, raw)
        if user is None:
            continue
        desired[(class_key(class_name), section_key(section_name))] = user.id
    return desired


def _resolve_allocation_user(db: Session, campus_id: UUID, body: dict) -> User | None:
    """Resolve teacher login from allocation employeeId / email (HR link preferred)."""
    employee_id = str(body.get("employeeId") or body.get("id") or "").strip()
    email = str(body.get("email") or body.get("teacherEmail") or "").strip().lower()
    hr = None
    if employee_id:
        try:
            emp_uuid = UUID(employee_id)
        except ValueError:
            emp_uuid = None
        clauses = [
            HrEmployee.employee_code == employee_id,
            func.lower(HrEmployee.email) == employee_id.lower(),
        ]
        if emp_uuid is not None:
            clauses.append(HrEmployee.id == emp_uuid)
        hr = db.scalar(
            select(HrEmployee).where(HrEmployee.campus_id == campus_id, or_(*clauses))
        )
    if hr is None and email:
        hr = db.scalar(
            select(HrEmployee).where(
                HrEmployee.campus_id == campus_id,
                func.lower(HrEmployee.email) == email,
            )
        )
    if hr is not None and hr.user_id is not None:
        user = db.get(User, hr.user_id)
        if user is not None and user.campus_id == campus_id and user.is_active:
            return user
    if email:
        user = db.scalar(
            select(User).where(User.campus_id == campus_id, func.lower(User.email) == email)
        )
        if user is not None and user.is_active:
            return user
    if employee_id and "@" in employee_id:
        user = db.scalar(
            select(User).where(
                User.campus_id == campus_id,
                func.lower(User.email) == employee_id.lower(),
            )
        )
        if user is not None and user.is_active:
            return user
    return None


def _find_section_for_keys(
    db: Session, campus_id: UUID, class_name_key: str, section_name_key: str
) -> Section | None:
    """Prefer the current academic year's class/section; else any matching active pair."""
    current = db.scalar(
        select(AcademicYear).where(
            AcademicYear.campus_id == campus_id,
            AcademicYear.is_current.is_(True),
        )
    )
    classes = db.scalars(
        select(SchoolClass).where(
            SchoolClass.campus_id == campus_id,
            SchoolClass.is_active.is_(True),
        )
    ).all()
    matching_class_ids: list[UUID] = []
    current_match: list[UUID] = []
    for row in classes:
        if class_key(row.name) != class_name_key:
            continue
        matching_class_ids.append(row.id)
        if current is not None and row.academic_year_id == current.id:
            current_match.append(row.id)
    class_ids = current_match or matching_class_ids
    if not class_ids:
        return None
    sections = db.scalars(
        select(Section).where(
            Section.campus_id == campus_id,
            Section.class_id.in_(class_ids),
            Section.is_active.is_(True),
        )
    ).all()
    for section in sections:
        if section_key(section.name) == section_name_key:
            return section
    return None


def _validate_teacher_allocation_subjects(db: Session, campus_id: UUID, items: list) -> None:
    """Campus-wide subject catalogue: reject mapping/subject names absent from masters when seeded."""
    names = {
        _norm_subject(row.name)
        for row in db.scalars(select(Subject).where(Subject.campus_id == campus_id)).all()
        if str(row.name or "").strip()
    }
    if not names:
        # No catalogue yet — do not invent a class↔subject schema; allow free text.
        return
    for index, raw in enumerate(items):
        if not isinstance(raw, dict):
            continue
        for subject in raw.get("subjects") or []:
            label = str(subject or "").strip()
            if label and _norm_subject(label) not in names:
                fail(
                    422,
                    "validation_error",
                    f"Unknown subject {label!r} in allocation item {index + 1}. "
                    "Use a subject from the campus subject list.",
                )
        for mapping in raw.get("mappings") or []:
            if not isinstance(mapping, dict):
                continue
            label = str(mapping.get("subject") or "").strip()
            if label and _norm_subject(label) not in names:
                fail(
                    422,
                    "validation_error",
                    f"Unknown subject {label!r} in allocation mapping. "
                    "Use a subject from the campus subject list.",
                )


# Client review: timetable change / publish approval is Principal-owned (MD/Super Admin override).
_TIMETABLE_APPROVERS = frozenset({"principal", "superadmin", "managing_director"})


def _parse_clock_minutes(value: str) -> int | None:
    """Parse '09:00', '9:00 AM', '01:30 PM' → minutes since midnight."""
    match = re.match(r"^(\d{1,2}):(\d{2})\s*([AP]M)?$", str(value or "").strip(), re.I)
    if not match:
        return None
    hours = int(match.group(1)) % 24
    minutes = int(match.group(2))
    meridiem = (match.group(3) or "").upper()
    if meridiem == "PM" and hours < 12:
        hours += 12
    if meridiem == "AM" and hours == 12:
        hours = 0
    return hours * 60 + minutes


def _ranges_overlap(a_start: int, a_end: int, b_start: int, b_end: int) -> bool:
    return a_start < b_end and b_start < a_end


def _campus_subject_names(db: Session, campus_id: UUID) -> set[str]:
    return {
        _norm_subject(row.name)
        for row in db.scalars(select(Subject).where(Subject.campus_id == campus_id)).all()
        if str(row.name or "").strip()
    }


def _campus_class_section_index(db: Session, campus_id: UUID) -> dict[str, set[str]]:
    """class_key → set of section_keys for active classes/sections."""
    from app.services.class_section_catalog import campus_class_section_index

    return campus_class_section_index(db, campus_id)


def _list_teacher_allocation_bodies(db: Session, campus_id: UUID) -> list[dict]:
    rows = db.scalars(
        select(AcademicsRecord).where(
            AcademicsRecord.campus_id == campus_id,
            AcademicsRecord.collection == "teacher-allocations",
        )
    ).all()
    return [dict(row.body or {}) for row in rows]


def _allocation_matches_owner(body: dict, owner_id: str, owner_email: str) -> bool:
    emp = str(body.get("employeeId") or body.get("id") or "").strip().lower()
    email = str(body.get("email") or body.get("teacherEmail") or "").strip().lower()
    if owner_id and emp and emp == owner_id.lower():
        return True
    if owner_email and email and email == owner_email.lower():
        return True
    if owner_id and "@" in owner_id and email and email == owner_id.lower():
        return True
    if owner_id and email and email == owner_id.lower():
        return True
    return False


def _allocation_covers_period(body: dict, class_name: str, section_name: str, subject: str) -> bool:
    status = str(body.get("status") or "Active").strip().lower()
    if status and status not in {"active", "allocated"}:
        return False
    want_class = class_key(class_name)
    want_section = section_key(section_name)
    want_subject = _norm_subject(subject)
    mappings = [m for m in (body.get("mappings") or []) if isinstance(m, dict)]
    if mappings:
        for mapping in mappings:
            if class_key(mapping.get("className")) != want_class:
                continue
            map_section = section_key(mapping.get("section"))
            if map_section and want_section and map_section != want_section:
                continue
            if _norm_subject(mapping.get("subject")) == want_subject:
                return True
        return False
    teaching = {class_key(c) for c in (body.get("teachingClasses") or []) if str(c or "").strip()}
    subjects = {_norm_subject(s) for s in (body.get("subjects") or []) if str(s or "").strip()}
    if want_class not in teaching:
        return False
    return want_subject in subjects if subjects else True


def _normalize_timetable_approvals(actor_code: str, items: list) -> None:
    """TT-05: only Principal (or MD/Super Admin) may set Approved/Denied; others stay Pending."""
    can_approve = actor_code in _TIMETABLE_APPROVERS
    for raw in items:
        if not isinstance(raw, dict):
            continue
        status = str(raw.get("approvalStatus") or "Pending").strip()
        if can_approve:
            if status not in {"Pending", "Approved", "Denied"}:
                raw["approvalStatus"] = "Pending"
            continue
        # Coordinators (and any non-approver writers) cannot publish or deny via PUT.
        raw["approvalStatus"] = "Pending"
        raw.pop("reviewedBy", None)
        raw.pop("reviewedAt", None)
        raw["rejectionReason"] = ""


def _validate_class_timetables(db: Session, campus_id: UUID, items: list) -> None:
    """TT-03 / TT-04: subjects, class/section masters, allocation coverage, period overlaps."""
    subject_names = _campus_subject_names(db, campus_id)
    class_sections = _campus_class_section_index(db, campus_id)
    allocations = _list_teacher_allocation_bodies(db, campus_id)
    has_allocations = bool(allocations)

    periods: list[dict] = []
    for index, raw in enumerate(items):
        if not isinstance(raw, dict):
            continue
        owner_id = str(raw.get("ownerTeacherId") or "").strip()
        owner_email = str(raw.get("ownerTeacherEmail") or "").strip().lower()
        owner_name = str(raw.get("ownerTeacherName") or "").strip()
        owner_alloc = None
        if has_allocations and (owner_id or owner_email):
            for body in allocations:
                if _allocation_matches_owner(body, owner_id, owner_email):
                    owner_alloc = body
                    break
            if owner_alloc is None:
                fail(
                    422,
                    "validation_error",
                    f"Timetable item {index + 1}: owner teacher is not in teacher allocations. "
                    "Allocate the teacher first.",
                )

        timelines = [t for t in (raw.get("timelines") or []) if isinstance(t, dict)]
        for timeline in timelines:
            class_name = str(timeline.get("className") or raw.get("className") or "").strip()
            section_name = str(timeline.get("section") or raw.get("section") or "").strip()
            subject = str(timeline.get("subject") or "").strip()
            day = str(timeline.get("day") or "").strip()
            start = str(timeline.get("startTime") or "").strip()
            end = str(timeline.get("endTime") or "").strip()
            if not (class_name and section_name and subject and day and start and end):
                continue
            if subject_names and _norm_subject(subject) not in subject_names:
                fail(
                    422,
                    "validation_error",
                    f"Unknown subject {subject!r} on class timetable. "
                    "Use a subject from the campus subject list.",
                )
            if class_sections:
                ck = class_key(class_name)
                if ck not in class_sections:
                    fail(
                        422,
                        "validation_error",
                        f"Unknown class {class_name!r} on class timetable.",
                    )
                sk = section_key(section_name)
                if sk and sk not in class_sections[ck]:
                    fail(
                        422,
                        "validation_error",
                        f"Unknown section {section_name!r} for class {class_name!r}.",
                    )
            if owner_alloc is not None and not _allocation_covers_period(
                owner_alloc, class_name, section_name, subject
            ):
                fail(
                    422,
                    "validation_error",
                    f"Subject {subject!r} for {class_name} {section_name} is not in the "
                    "owner teacher's active allocation.",
                )
            start_m = _parse_clock_minutes(start)
            end_m = _parse_clock_minutes(end)
            if start_m is None or end_m is None or start_m >= end_m:
                fail(
                    422,
                    "validation_error",
                    f"Invalid period times {start!r}–{end!r} on {day}.",
                )
            teacher_label = (
                owner_id.lower()
                or owner_email
                or str(timeline.get("teacher") or owner_name).strip().lower()
            )
            periods.append(
                {
                    "day": day.lower(),
                    "start": start_m,
                    "end": end_m,
                    "class": class_key(class_name),
                    "section": section_key(section_name),
                    "teacher": teacher_label,
                    "label": f"{class_name} {section_name} / {day} {start}-{end}",
                }
            )

    for i, left in enumerate(periods):
        for right in periods[i + 1 :]:
            if left["day"] != right["day"]:
                continue
            if not _ranges_overlap(left["start"], left["end"], right["start"], right["end"]):
                continue
            if left["class"] == right["class"] and left["section"] == right["section"]:
                fail(
                    422,
                    "conflict",
                    "Class/section period conflict: overlapping times on the same day "
                    f"({left['label']} vs {right['label']}).",
                )
            if left["teacher"] and right["teacher"] and left["teacher"] == right["teacher"]:
                fail(
                    422,
                    "conflict",
                    "Teacher period conflict: the same teacher has overlapping times on the same day "
                    f"({left['label']} vs {right['label']}).",
                )


def _sync_section_class_teachers(
    db: Session,
    campus_id: UUID,
    *,
    previous: dict[tuple[str, str], UUID],
    desired: dict[tuple[str, str], UUID],
) -> None:
    """Keep sections.class_teacher_user_id aligned with Active teacher-allocation classTeacher rows.

    Authoritative write for class-teacher *from this screen* is the allocation PUT; Class Details
    section PATCH remains valid for sections never mentioned in allocations.
    """
    for key in set(previous) | set(desired):
        section = _find_section_for_keys(db, campus_id, key[0], key[1])
        if section is None:
            continue
        new_uid = desired.get(key)
        old_uid = previous.get(key)
        if new_uid is not None:
            section.class_teacher_user_id = new_uid
        elif old_uid is not None and section.class_teacher_user_id == old_uid:
            section.class_teacher_user_id = None


def _validate_student_star_ratings(items: list) -> None:
    """SOM individual ratings: whole stars 1–3 only; one row per student+month."""
    seen: set[tuple[str, str]] = set()
    for index, raw in enumerate(items):
        if not isinstance(raw, dict):
            fail(422, "invalid_body", "Each star rating must be an object.")
        raw_rating = raw.get("rating")
        value: int | None = None
        if isinstance(raw_rating, bool):
            value = None
        elif isinstance(raw_rating, (int, float)):
            # Reject half-stars (2.5) — do not coerce with int().
            if float(raw_rating) in (1.0, 2.0, 3.0):
                value = int(raw_rating)
        elif isinstance(raw_rating, str):
            text = raw_rating.strip()
            if text in {"1", "2", "3"}:
                value = int(text)
        if value is None:
            fail(422, "invalid_rating", f"Item {index}: rating must be 1, 2, or 3.")
        raw["rating"] = value
        student_id = str(raw.get("studentId") or "").strip()
        month = str(raw.get("month") or "").strip()
        if student_id and month:
            key = (student_id, month)
            if key in seen:
                fail(422, "duplicate", f"Duplicate star rating for student {student_id} in {month}.")
            seen.add(key)
        file_id = raw.get("attachmentFileId")
        if file_id is not None and str(file_id).strip():
            try:
                UUID(str(file_id).strip())
            except ValueError:
                fail(422, "invalid_body", f"Item {index}: attachmentFileId must be a UUID.")
            raw["attachmentFileId"] = str(file_id).strip()
            raw["attachmentName"] = str(raw.get("attachmentName") or "").strip()[:240]
        else:
            raw["attachmentFileId"] = None
            raw["attachmentName"] = ""


def _campus_items_unscoped(db: Session, actor: User, collection: str) -> list[dict]:
    rows = db.scalars(
        select(AcademicsRecord).where(
            AcademicsRecord.campus_id == actor.campus_id,
            AcademicsRecord.collection == collection,
        )
    ).all()
    return [_as_item(row) for row in rows]


def _actor_may_mutate_item(db: Session, actor: User, role: str, collection: str, item: dict) -> bool:
    if role in _UNSCOPED_STAFF:
        return True
    if collection == "class-timetable-change-requests":
        if role == "teacher":
            return _change_request_owned(item, actor) or (
                _change_request_unowned(item)
                and _item_in_teacher_scope(item, _teacher_scope_pairs(db, actor))
            )
        if role == "coordinator":
            band = _coordinator_band(db, actor)
            return bool(
                band
                and (
                    _change_request_owned(item, actor)
                    or _item_in_coordinator_band(item, band)
                )
            )
        return False
    if collection not in _ALLOCATION_SCOPED_COLLECTIONS:
        return True
    if role == "teacher":
        if not _item_in_teacher_scope(item, _teacher_scope_pairs(db, actor)):
            return False
        if collection == "extra-classes":
            # Teachers edit only the extended classes they created; unowned legacy rows stay editable in scope.
            owner = str(item.get("createdByUserId") or "").strip().lower()
            return not owner or owner == str(actor.id).lower()
        return True
    if role == "coordinator":
        band = _coordinator_band(db, actor)
        return bool(band and _item_in_coordinator_band(item, band))
    return False


def _norm_academic_year(value) -> str:
    return re.sub(r"\s*[-–—/]\s*", "-", str(value or "").strip())


def _validate_teacher_allocation_duplicates(db: Session, campus_id: UUID, items: list) -> None:
    """One active allocation per teacher + class + section + subject + academic year (409 on repeat)."""
    seen: set[tuple[str, str, str, str, str]] = set()
    for raw in items:
        if not isinstance(raw, dict):
            continue
        if str(raw.get("status") or "").strip().lower() not in _ACTIVE_ALLOCATION_STATUSES:
            continue
        user = _resolve_allocation_user(db, campus_id, raw)
        email = str(raw.get("email") or raw.get("teacherEmail") or "").strip().lower()
        employee = str(raw.get("employeeId") or raw.get("id") or "").strip().lower()
        if user is not None:
            teacher = f"user:{user.id}"
        elif email:
            teacher = f"email:{email}"
        elif employee:
            teacher = f"employee:{employee}"
        else:
            continue
        class_teacher = raw.get("classTeacher") if isinstance(raw.get("classTeacher"), dict) else {}
        body_year = _norm_academic_year(raw.get("academicYear") or class_teacher.get("academicYear"))
        for mapping in raw.get("mappings") or []:
            if not isinstance(mapping, dict):
                continue
            class_name = str(mapping.get("className") or "").strip()
            subject = str(mapping.get("subject") or "").strip()
            if not class_name or not subject:
                continue
            section = str(mapping.get("section") or "").strip()
            year = _norm_academic_year(mapping.get("academicYear")) or body_year
            key = (teacher, class_key(class_name), section_key(section), _norm_subject(subject), year)
            if key in seen:
                label = f"{class_name}{f' {section}' if section else ''} / {subject}"
                fail(
                    409,
                    "duplicate_allocation",
                    f"Duplicate teacher allocation: this teacher is already allocated {label}"
                    f"{f' for {year}' if year else ''}.",
                )
            seen.add(key)


def _parse_extra_class_date(value: str) -> bool:
    for fmt in ("%d-%m-%Y", "%Y-%m-%d", "%d/%m/%Y"):
        try:
            datetime.strptime(value, fmt)
            return True
        except ValueError:
            continue
    return False


def _validate_extra_class_formats(body: dict, label: str) -> None:
    date_value = str(body.get("date") or "").strip()
    if date_value and not _parse_extra_class_date(date_value):
        fail(422, "validation_error", f"{label}: date {date_value!r} is not a valid date (DD-MM-YYYY).")
    start = str(body.get("startTime") or "").strip()
    end = str(body.get("endTime") or "").strip()
    if start or end:
        start_m = _parse_clock_minutes(start) if start else None
        end_m = _parse_clock_minutes(end) if end else None
        if (start and start_m is None) or (end and end_m is None):
            fail(422, "validation_error", f"{label}: start/end time must look like 03:30 PM or 15:30.")
        if start_m is not None and end_m is not None and start_m >= end_m:
            fail(422, "validation_error", f"{label}: end time must be after start time.")
    for field, limit in _EXTRA_CLASS_MAX_LENGTHS.items():
        if len(str(body.get(field) or "")) > limit:
            fail(422, "validation_error", f"{label}: {field} must be at most {limit} characters.")


def _validate_extra_class_complete(db: Session, campus_id: UUID, body: dict) -> None:
    missing = [field for field in _EXTRA_CLASS_REQUIRED_FIELDS if not str(body.get(field) or "").strip()]
    if missing:
        fail(422, "validation_error", f"Extended class is missing required fields: {', '.join(missing)}.")
    _validate_extra_class_formats(body, "Extended class")
    subject_names = _campus_subject_names(db, campus_id)
    if subject_names and _norm_subject(body["subject"]) not in subject_names:
        fail(422, "validation_error", f"Unknown subject {body['subject']!r}. Use a subject from the campus subject list.")
    class_sections = _campus_class_section_index(db, campus_id)
    if class_sections:
        ck = class_key(body["className"])
        if ck not in class_sections:
            fail(422, "validation_error", f"Unknown class {body['className']!r}.")
        if section_key(body["section"]) not in class_sections[ck]:
            fail(422, "validation_error", f"Unknown section {body['section']!r} for class {body['className']!r}.")


def _same_extra_class(left: dict, right: dict) -> bool:
    return all(
        str(left.get(field) or "").strip() == str(right.get(field) or "").strip()
        for field in _EXTRA_CLASS_EDITABLE_FIELDS
    )


def _stamp_extra_class_owners(actor: User, items: list, existing: list[dict]) -> None:
    """createdByUserId is server-owned: copied from the stored row, or the actor for new rows."""
    existing_by_id = {str(item.get("id") or ""): item for item in existing}
    for raw in items:
        if not isinstance(raw, dict):
            fail(422, "invalid_body", "Each item must be an object.")
        public_id = _public_id_for("extra-classes", raw, "")
        prior = existing_by_id.get(public_id) if public_id else None
        if prior is None:
            raw["createdByUserId"] = str(actor.id)
        elif prior.get("createdByUserId"):
            raw["createdByUserId"] = prior["createdByUserId"]
        else:
            raw.pop("createdByUserId", None)


def _audit_snapshot(item: dict) -> str:
    body = {k: v for k, v in item.items() if not str(k).startswith("_")}
    return json.dumps(body, default=str, ensure_ascii=False)


def replace_records(db: Session, actor: User, collection: str, items: list) -> list[dict]:
    """Replace the entire campus collection with the given list (SoT put)."""
    _ensure_collection(collection)
    if not _can_write(db, actor, collection):
        fail(403, "forbidden", "You are not allowed to change academics records.")
    if not isinstance(items, list):
        fail(422, "invalid_body", "Body must be a JSON array.")

    role = _code(db, actor)
    working_items = list(items)
    existing_all: list[dict] | None = None
    if collection in {"extra-classes", "class-timetables"} or (
        collection in _SCOPED_REPLACE_COLLECTIONS and role not in _UNSCOPED_STAFF
    ):
        existing_all = _campus_items_unscoped(db, actor, collection)

    if collection == "extra-classes":
        _stamp_extra_class_owners(actor, working_items, existing_all or [])
        existing_by_id = {str(item.get("id") or ""): item for item in existing_all or []}
        for index, raw in enumerate(working_items):
            prior = existing_by_id.get(_public_id_for(collection, raw, ""))
            if prior is None or not _same_extra_class(raw, prior):
                _validate_extra_class_formats(raw, f"Extended class item {index + 1}")

    if collection in _SCOPED_REPLACE_COLLECTIONS and role not in _UNSCOPED_STAFF:
        existing = existing_all or []
        existing_by_id = {str(item.get("id") or ""): item for item in existing}
        submitted: list = []
        for raw in working_items:
            if not isinstance(raw, dict):
                fail(422, "invalid_body", "Each item must be an object.")
            prior = existing_by_id.get(_public_id_for(collection, raw, ""))
            if (
                collection == "extra-classes"
                and prior is not None
                and _same_extra_class(raw, prior)
                and not _actor_may_mutate_item(db, actor, role, collection, prior)
            ):
                # Untouched row the actor may not edit (e.g. another teacher's): the stored copy is kept below.
                continue
            submitted.append(raw)
            stamped = dict(raw)
            if collection == "class-timetable-change-requests" and role == "teacher":
                stamped.setdefault("requestedByEmail", str(actor.email or "").strip().lower())
                stamped.setdefault("teacherEmail", str(actor.email or "").strip().lower())
            if not _actor_may_mutate_item(db, actor, role, collection, stamped):
                fail(403, "forbidden", "You cannot change records outside your allocated classes.")
            raw.update(
                {
                    k: stamped[k]
                    for k in ("requestedByEmail", "teacherEmail")
                    if k in stamped and k not in raw
                }
            )
        keep = [
            item
            for item in existing
            if not _actor_may_mutate_item(db, actor, role, collection, item)
        ]
        keep_ids = {
            _public_id_for(collection, item, str(item.get("id") or ""))
            for item in keep
        }
        for raw in submitted:
            public_id = _public_id_for(collection, raw, "")
            if public_id and public_id in keep_ids:
                fail(403, "forbidden", "You cannot overwrite records outside your allocated classes.")
        if collection == "class-timetables" and role not in _TIMETABLE_DELETERS:
            submitted_ids = {_public_id_for(collection, raw, "") for raw in submitted}
            dropped = [
                str(item.get("id") or "")
                for item in existing
                if str(item.get("id") or "") not in keep_ids and str(item.get("id") or "") not in submitted_ids
            ]
            if dropped:
                fail(403, "forbidden", "Only Principal, Admin or Director can delete class timetables.")
        working_items = keep + submitted

    previous_class_teachers: dict[tuple[str, str], UUID] = {}
    if collection == "teacher-allocations":
        _validate_teacher_allocation_subjects(db, actor.campus_id, working_items)
        _validate_teacher_allocation_duplicates(db, actor.campus_id, working_items)
        old_rows = db.scalars(
            select(AcademicsRecord).where(
                AcademicsRecord.campus_id == actor.campus_id,
                AcademicsRecord.collection == collection,
            )
        ).all()
        previous_class_teachers = _allocation_desired_class_teachers(
            db, actor.campus_id, [dict(row.body or {}) for row in old_rows]
        )

    if collection == "class-timetables":
        # Validate before delete so a failed PUT cannot wipe the campus collection.
        _normalize_timetable_approvals(role, working_items)
        _validate_class_timetables(db, actor.campus_id, working_items)

    if collection == "student-star-ratings":
        _validate_student_star_ratings(working_items)

    if collection == "class-timetables":
        kept_ids = {
            _public_id_for(collection, raw, "") for raw in working_items if isinstance(raw, dict)
        }
        for item in existing_all or []:
            removed_id = str(item.get("id") or "")
            if removed_id and removed_id not in kept_ids:
                write_audit(
                    db,
                    action="CLASS_TIMETABLE_DELETED",
                    entity_type=collection,
                    entity_id=removed_id[:64],
                    actor_id=actor.id,
                    campus_id=actor.campus_id,
                    details=_audit_snapshot(item),
                )

    db.execute(
        delete(AcademicsRecord).where(
            AcademicsRecord.campus_id == actor.campus_id,
            AcademicsRecord.collection == collection,
        )
    )

    now = datetime.now(timezone.utc)
    prefix = COLLECTIONS[collection]
    seen: set[str] = set()
    for index, raw in enumerate(working_items):
        if not isinstance(raw, dict):
            fail(422, "invalid_body", "Each item must be an object.")
        fallback = f"{prefix}-{index + 1:04d}"
        public_id = _public_id_for(collection, raw, fallback)
        if not public_id:
            fail(422, "invalid_body", "Each item needs an id (or employeeId for allocations).")
        if public_id in seen:
            fail(422, "duplicate", f"Duplicate id in payload: {public_id}")
        seen.add(public_id)
        payload = {**raw, "id": public_id}
        if collection == "teacher-allocations":
            payload["employeeId"] = public_id
        if collection == "class-timetable-change-requests" and role == "teacher":
            payload.setdefault("requestedByEmail", str(actor.email or "").strip().lower())
            payload.setdefault("teacherEmail", str(actor.email or "").strip().lower())
        db.add(
            AcademicsRecord(
                id=uuid.uuid4(),
                campus_id=actor.campus_id,
                collection=collection,
                public_id=public_id,
                body=payload,
                created_by=actor.id,
                updated_at=now,
            )
        )

    if collection == "teacher-allocations":
        desired = _allocation_desired_class_teachers(db, actor.campus_id, working_items)
        _sync_section_class_teachers(
            db,
            actor.campus_id,
            previous=previous_class_teachers,
            desired=desired,
        )

    db.commit()
    return list_records(db, actor, collection)


def _get_row(db: Session, actor: User, collection: str, record_id: str) -> AcademicsRecord | None:
    return db.scalar(
        select(AcademicsRecord).where(
            AcademicsRecord.campus_id == actor.campus_id,
            AcademicsRecord.collection == collection,
            AcademicsRecord.public_id == str(record_id or "").strip(),
        )
    )


def update_extra_class(db: Session, actor: User, record_id: str, patch: dict) -> dict:
    """Save Changes on one extended class: owner teacher (in scope), in-band coordinator, or leadership."""
    collection = "extra-classes"
    if not isinstance(patch, dict):
        fail(422, "invalid_body", "Body must be a JSON object.")
    if not _can_write(db, actor, collection):
        fail(403, "forbidden", "You are not allowed to change extended classes.")
    role = _code(db, actor)
    row = _get_row(db, actor, collection, record_id)
    if row is None:
        fail(404, "not_found", "Extended class not found.")
    current = _as_item(row)
    if not _actor_may_mutate_item(db, actor, role, collection, current):
        fail(403, "forbidden", "You can only edit extended classes you created for your allocated classes.")

    updated = dict(row.body or {})
    for field in _EXTRA_CLASS_EDITABLE_FIELDS:
        if field not in patch:
            continue
        value = patch[field]
        if value is not None and not isinstance(value, (str, int, float)):
            fail(422, "invalid_body", f"{field} must be text.")
        updated[field] = str(value if value is not None else "").strip()
    class_name = str(updated.get("className") or "").strip()
    section = str(updated.get("section") or "").strip()
    updated["classSection"] = f"{class_name}-{section}" if class_name and section else class_name or section
    _validate_extra_class_complete(db, actor.campus_id, updated)
    if not _actor_may_mutate_item(db, actor, role, collection, {**updated, "id": row.public_id}):
        fail(403, "forbidden", "You cannot move an extended class outside your allocated classes.")

    previous = dict(row.body or {})
    changed = [f for f in _EXTRA_CLASS_EDITABLE_FIELDS if str(previous.get(f) or "") != str(updated.get(f) or "")]
    updated["id"] = row.public_id
    updated["updatedByUserId"] = str(actor.id)
    row.body = updated
    row.updated_at = datetime.now(timezone.utc)
    write_audit(
        db,
        action="EXTRA_CLASS_UPDATED",
        entity_type=collection,
        entity_id=row.public_id[:64],
        actor_id=actor.id,
        campus_id=actor.campus_id,
        details=json.dumps(
            {"changed": changed, "before": {f: previous.get(f) for f in changed}},
            default=str,
            ensure_ascii=False,
        ),
    )
    db.commit()
    db.refresh(row)
    return _as_item(row)


def delete_record(db: Session, actor: User, collection: str, record_id: str) -> dict:
    """Delete one class timetable / extended class with the same scope rules as PUT, plus an audit snapshot."""
    _ensure_collection(collection)
    if collection not in _SINGLE_DELETE_COLLECTIONS:
        fail(405, "method_not_allowed", "Single-record delete is not available for this collection.")
    if not _can_write(db, actor, collection):
        fail(403, "forbidden", "You are not allowed to delete academics records.")
    role = _code(db, actor)
    if collection == "class-timetables" and role not in _TIMETABLE_DELETERS:
        fail(403, "forbidden", "Only Principal, Admin or Director can delete class timetables.")
    row = _get_row(db, actor, collection, record_id)
    if row is None:
        fail(404, "not_found", "Record not found.")
    item = _as_item(row)
    if not _actor_may_mutate_item(db, actor, role, collection, item):
        fail(403, "forbidden", "You cannot delete records outside your allocated classes.")
    public_id = row.public_id
    action = "CLASS_TIMETABLE_DELETED" if collection == "class-timetables" else "EXTRA_CLASS_DELETED"
    write_audit(
        db,
        action=action,
        entity_type=collection,
        entity_id=public_id[:64],
        actor_id=actor.id,
        campus_id=actor.campus_id,
        details=_audit_snapshot(item),
    )
    db.delete(row)
    db.commit()
    return {"id": public_id, "deleted": True}
