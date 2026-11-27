"""Resolve and enforce active Class Details masters for academic write paths."""

from __future__ import annotations

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import SchoolClass, Section
from app.services.errors import fail
from app.services.students import class_key, section_key


def campus_class_section_index(db: Session, campus_id: UUID) -> dict[str, set[str]]:
    """class_key → set of active section_keys for the campus."""
    index: dict[str, set[str]] = {}
    classes = db.scalars(
        select(SchoolClass).where(SchoolClass.campus_id == campus_id, SchoolClass.is_active.is_(True))
    ).all()
    for school_class in classes:
        key = class_key(school_class.name)
        sections = db.scalars(
            select(Section).where(
                Section.campus_id == campus_id,
                Section.class_id == school_class.id,
                Section.is_active.is_(True),
            )
        ).all()
        index.setdefault(key, set()).update(section_key(s.name) for s in sections)
    return index


def require_active_class(
    db: Session,
    campus_id: UUID,
    class_name: str,
    *,
    index: dict[str, set[str]] | None = None,
) -> str:
    """Return the normalized class key or fail if the class is missing/inactive."""
    label = str(class_name or "").strip()
    if not label:
        fail(400, "validation_error", "Class is required.")
    catalog = index if index is not None else campus_class_section_index(db, campus_id)
    # Empty campus masters: do not invent classes; reject so Admin must configure Class Details.
    if not catalog:
        fail(
            400,
            "validation_error",
            "No active classes are configured. An Admin must add Class Details first.",
        )
    ck = class_key(label)
    if ck not in catalog:
        fail(400, "validation_error", f"Unknown or inactive class {label!r}.")
    return ck


def require_active_class_section(
    db: Session,
    campus_id: UUID,
    class_name: str,
    section: str | None = None,
    *,
    require_section: bool = False,
) -> tuple[str, str | None]:
    """
    Ensure class (and optional section) exist as active Class Details on this campus.
    Empty section is allowed unless require_section=True (e.g. marks for one section).
    """
    index = campus_class_section_index(db, campus_id)
    ck = require_active_class(db, campus_id, class_name, index=index)
    section_label = str(section or "").strip()
    if not section_label:
        if require_section:
            fail(400, "validation_error", "Section is required.")
        return ck, None
    sk = section_key(section_label)
    allowed = index.get(ck) or set()
    if sk not in allowed:
        fail(
            400,
            "validation_error",
            f"Unknown or inactive section {section_label!r} for class {str(class_name).strip()!r}.",
        )
    return ck, sk
