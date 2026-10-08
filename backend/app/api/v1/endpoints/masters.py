from fastapi import APIRouter, status

from app.api.deps import CurrentUser, DbSession
from app.models.masters import AcademicYear, SchoolClass, Section, Subject
from app.schemas.masters import (
    AcademicYearCreate,
    AcademicYearPublic,
    SchoolClassCreate,
    SchoolClassPublic,
    SectionCreate,
    SectionPublic,
    SubjectCreate,
    SubjectPublic,
)
from app.services import masters_service

router = APIRouter()


@router.get("/academic-years", response_model=list[AcademicYearPublic])
def get_academic_years(db: DbSession, current_user: CurrentUser) -> list[AcademicYearPublic]:
    rows = masters_service.list_academic_years(db, current_user.campus_id)
    return [AcademicYearPublic.model_validate(row) for row in rows]


@router.post(
    "/academic-years",
    response_model=AcademicYearPublic,
    status_code=status.HTTP_201_CREATED,
)
def create_academic_year(
    payload: AcademicYearCreate,
    db: DbSession,
    current_user: CurrentUser,
) -> AcademicYearPublic:
    if payload.is_current:
        for year in masters_service.list_academic_years(db, current_user.campus_id):
            year.is_current = False
            db.add(year)
    row = AcademicYear(campus_id=current_user.campus_id, **payload.model_dump())
    db.add(row)
    db.commit()
    db.refresh(row)
    return AcademicYearPublic.model_validate(row)


@router.get("/classes", response_model=list[SchoolClassPublic])
def get_classes(
    db: DbSession,
    current_user: CurrentUser,
    academic_year_id: int | None = None,
) -> list[SchoolClassPublic]:
    rows = masters_service.list_classes(
        db, current_user.campus_id, academic_year_id=academic_year_id
    )
    return [SchoolClassPublic.model_validate(row) for row in rows]


@router.post("/classes", response_model=SchoolClassPublic, status_code=status.HTTP_201_CREATED)
def create_class(
    payload: SchoolClassCreate,
    db: DbSession,
    current_user: CurrentUser,
) -> SchoolClassPublic:
    row = SchoolClass(campus_id=current_user.campus_id, **payload.model_dump())
    db.add(row)
    db.commit()
    db.refresh(row)
    return SchoolClassPublic.model_validate(row)


@router.get("/sections", response_model=list[SectionPublic])
def get_sections(
    db: DbSession,
    current_user: CurrentUser,
    class_id: int | None = None,
) -> list[SectionPublic]:
    rows = masters_service.list_sections(db, current_user.campus_id, class_id=class_id)
    return [SectionPublic.model_validate(row) for row in rows]


@router.post("/sections", response_model=SectionPublic, status_code=status.HTTP_201_CREATED)
def create_section(
    payload: SectionCreate,
    db: DbSession,
    current_user: CurrentUser,
) -> SectionPublic:
    row = Section(campus_id=current_user.campus_id, **payload.model_dump())
    db.add(row)
    db.commit()
    db.refresh(row)
    return SectionPublic.model_validate(row)


@router.get("/subjects", response_model=list[SubjectPublic])
def get_subjects(db: DbSession, current_user: CurrentUser) -> list[SubjectPublic]:
    rows = masters_service.list_subjects(db, current_user.campus_id)
    return [SubjectPublic.model_validate(row) for row in rows]


@router.post("/subjects", response_model=SubjectPublic, status_code=status.HTTP_201_CREATED)
def create_subject(
    payload: SubjectCreate,
    db: DbSession,
    current_user: CurrentUser,
) -> SubjectPublic:
    row = Subject(campus_id=current_user.campus_id, **payload.model_dump())
    db.add(row)
    db.commit()
    db.refresh(row)
    return SubjectPublic.model_validate(row)
