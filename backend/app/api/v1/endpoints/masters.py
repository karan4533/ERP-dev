from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.deps import require_permission
from app.models import AcademicYear, SchoolClass, Section, Subject, User
from app.schemas.phase0 import (
    AcademicYearCreate,
    AcademicYearOut,
    ClassCreate,
    ClassOut,
    SectionCreate,
    SectionOut,
    SubjectCreate,
    SubjectOut,
)
from app.services.audit import write_audit
from app.services.errors import fail

router = APIRouter(prefix="/api/v1/masters", tags=["masters"])


def _clear_current_years(db: Session, campus_id: UUID) -> None:
    for row in db.scalars(
        select(AcademicYear).where(AcademicYear.campus_id == campus_id, AcademicYear.is_current.is_(True))
    ).all():
        row.is_current = False


@router.get("/academic-years", response_model=list[AcademicYearOut])
def list_academic_years(
    db: Session = Depends(get_db),
    user: User = Depends(require_permission("masters.read")),
) -> list[AcademicYear]:
    return list(
        db.scalars(
            select(AcademicYear)
            .where(AcademicYear.campus_id == user.campus_id)
            .order_by(AcademicYear.is_current.desc(), AcademicYear.name.desc())
        ).all()
    )


@router.post("/academic-years", response_model=AcademicYearOut, status_code=201)
def create_academic_year(
    body: AcademicYearCreate,
    db: Session = Depends(get_db),
    user: User = Depends(require_permission("masters.write")),
) -> AcademicYear:
    name = body.name.strip()
    existing = db.scalar(
        select(AcademicYear).where(AcademicYear.campus_id == user.campus_id, AcademicYear.name == name)
    )
    if existing is not None:
        fail(409, "academic_year_exists", "That academic year already exists on this campus.")
    if body.is_current:
        _clear_current_years(db, user.campus_id)
    row = AcademicYear(
        campus_id=user.campus_id,
        name=name,
        start_date=body.start_date,
        end_date=body.end_date,
        is_current=body.is_current,
    )
    db.add(row)
    db.flush()
    write_audit(
        db,
        action="ACADEMIC_YEAR_CREATED",
        entity_type="academic_year",
        entity_id=str(row.id),
        actor_id=user.id,
        campus_id=user.campus_id,
        details=name,
    )
    db.commit()
    db.refresh(row)
    return row


@router.post("/academic-years/{year_id}/set-current", response_model=AcademicYearOut)
def set_current_academic_year(
    year_id: UUID,
    db: Session = Depends(get_db),
    user: User = Depends(require_permission("masters.write")),
) -> AcademicYear:
    row = db.scalar(
        select(AcademicYear).where(AcademicYear.id == year_id, AcademicYear.campus_id == user.campus_id)
    )
    if row is None:
        fail(404, "academic_year_not_found", "Academic year not found.")
    _clear_current_years(db, user.campus_id)
    row.is_current = True
    write_audit(
        db,
        action="ACADEMIC_YEAR_SET_CURRENT",
        entity_type="academic_year",
        entity_id=str(row.id),
        actor_id=user.id,
        campus_id=user.campus_id,
        details=row.name,
    )
    db.commit()
    db.refresh(row)
    return row


@router.get("/classes", response_model=list[ClassOut])
def list_classes(
    academic_year_id: UUID | None = Query(default=None),
    db: Session = Depends(get_db),
    user: User = Depends(require_permission("masters.read")),
) -> list[SchoolClass]:
    q = select(SchoolClass).where(SchoolClass.campus_id == user.campus_id)
    if academic_year_id is not None:
        q = q.where(SchoolClass.academic_year_id == academic_year_id)
    return list(db.scalars(q.order_by(SchoolClass.name.asc())).all())


@router.post("/classes", response_model=ClassOut, status_code=201)
def create_class(
    body: ClassCreate,
    db: Session = Depends(get_db),
    user: User = Depends(require_permission("masters.write")),
) -> SchoolClass:
    name = body.name.strip()
    existing = db.scalar(
        select(SchoolClass).where(SchoolClass.campus_id == user.campus_id, SchoolClass.name == name)
    )
    if existing is not None:
        fail(409, "class_exists", "That class already exists on this campus.")

    year_id = body.academic_year_id
    if year_id is not None:
        year = db.scalar(
            select(AcademicYear).where(AcademicYear.id == year_id, AcademicYear.campus_id == user.campus_id)
        )
        if year is None:
            fail(404, "academic_year_not_found", "Academic year not found.")
    else:
        current = db.scalar(
            select(AcademicYear).where(
                AcademicYear.campus_id == user.campus_id, AcademicYear.is_current.is_(True)
            )
        )
        year_id = current.id if current is not None else None

    section_name = body.section.strip().upper() if body.section and body.section.strip() else None
    row = SchoolClass(
        campus_id=user.campus_id,
        academic_year_id=year_id,
        name=name,
        section=section_name,
    )
    db.add(row)
    db.flush()
    if section_name:
        db.add(Section(campus_id=user.campus_id, class_id=row.id, name=section_name))
    write_audit(
        db,
        action="CLASS_CREATED",
        entity_type="school_class",
        entity_id=str(row.id),
        actor_id=user.id,
        campus_id=user.campus_id,
        details=name,
    )
    db.commit()
    db.refresh(row)
    return row


@router.get("/sections", response_model=list[SectionOut])
def list_sections(
    class_id: UUID | None = Query(default=None),
    db: Session = Depends(get_db),
    user: User = Depends(require_permission("masters.read")),
) -> list[Section]:
    q = select(Section).where(Section.campus_id == user.campus_id)
    if class_id is not None:
        q = q.where(Section.class_id == class_id)
    return list(db.scalars(q.order_by(Section.name.asc())).all())


@router.post("/sections", response_model=SectionOut, status_code=201)
def create_section(
    body: SectionCreate,
    db: Session = Depends(get_db),
    user: User = Depends(require_permission("masters.write")),
) -> Section:
    school_class = db.scalar(
        select(SchoolClass).where(SchoolClass.id == body.class_id, SchoolClass.campus_id == user.campus_id)
    )
    if school_class is None:
        fail(404, "class_not_found", "Class not found.")
    name = body.name.strip().upper()
    existing = db.scalar(
        select(Section).where(
            Section.campus_id == user.campus_id,
            Section.class_id == body.class_id,
            Section.name == name,
        )
    )
    if existing is not None:
        fail(409, "section_exists", "That section already exists for this class.")
    row = Section(campus_id=user.campus_id, class_id=body.class_id, name=name)
    db.add(row)
    db.flush()
    if not school_class.section:
        school_class.section = name
    write_audit(
        db,
        action="SECTION_CREATED",
        entity_type="section",
        entity_id=str(row.id),
        actor_id=user.id,
        campus_id=user.campus_id,
        details=f"{school_class.name}-{name}",
    )
    db.commit()
    db.refresh(row)
    return row


@router.get("/subjects", response_model=list[SubjectOut])
def list_subjects(
    db: Session = Depends(get_db),
    user: User = Depends(require_permission("masters.read")),
) -> list[Subject]:
    return list(db.scalars(select(Subject).where(Subject.campus_id == user.campus_id)).all())


@router.post("/subjects", response_model=SubjectOut, status_code=201)
def create_subject(
    body: SubjectCreate,
    db: Session = Depends(get_db),
    user: User = Depends(require_permission("masters.write")),
) -> Subject:
    code = body.code.strip().upper()
    existing = db.scalar(select(Subject).where(Subject.campus_id == user.campus_id, Subject.code == code))
    if existing is not None:
        fail(409, "subject_exists", "That subject code already exists on this campus.")
    row = Subject(campus_id=user.campus_id, code=code, name=body.name.strip())
    db.add(row)
    db.flush()
    write_audit(
        db,
        action="SUBJECT_CREATED",
        entity_type="subject",
        entity_id=str(row.id),
        actor_id=user.id,
        campus_id=user.campus_id,
        details=code,
    )
    db.commit()
    db.refresh(row)
    return row
