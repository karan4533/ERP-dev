from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.deps import require_permission
from app.models import SchoolClass, Subject, User
from app.schemas.phase0 import ClassCreate, ClassOut, SubjectCreate, SubjectOut
from app.services.audit import write_audit
from app.services.errors import fail

router = APIRouter(prefix="/api/v1/masters", tags=["masters"])


@router.get("/classes", response_model=list[ClassOut])
def list_classes(
    db: Session = Depends(get_db),
    user: User = Depends(require_permission("masters.read")),
) -> list[SchoolClass]:
    return list(db.scalars(select(SchoolClass).where(SchoolClass.campus_id == user.campus_id)).all())


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
    row = SchoolClass(campus_id=user.campus_id, name=name, section=body.section)
    db.add(row)
    db.flush()
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
