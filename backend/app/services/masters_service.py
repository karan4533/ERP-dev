from datetime import date

from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.models.masters import AcademicYear, SchoolClass, Section, Subject


DEFAULT_CLASSES = [
    "KG",
    "Grade 1",
    "Grade 2",
    "Grade 3",
    "Grade 4",
    "Grade 5",
    "Grade 6",
    "Grade 7",
    "Grade 8",
    "Grade 9",
    "Grade 10",
    "Grade 11",
    "Grade 12",
]

DEFAULT_SECTIONS = ["A", "B"]

DEFAULT_SUBJECTS = [
    ("ENG", "English"),
    ("MAT", "Mathematics"),
    ("SCI", "Science"),
    ("SST", "Social Studies"),
    ("TAM", "Tamil"),
    ("HIN", "Hindi"),
    ("COM", "Computer Science"),
    ("PHY", "Physics"),
    ("CHE", "Chemistry"),
    ("BIO", "Biology"),
]


def ensure_master_seeds(db: Session) -> None:
    settings = get_settings()
    campus_id = settings.default_campus_id

    year = (
        db.query(AcademicYear)
        .filter(AcademicYear.campus_id == campus_id, AcademicYear.is_current.is_(True))
        .first()
    )
    if not year:
        year = AcademicYear(
            campus_id=campus_id,
            name="2026-27",
            start_date=date(2026, 4, 1),
            end_date=date(2027, 3, 31),
            is_current=True,
            is_active=True,
        )
        db.add(year)
        db.commit()
        db.refresh(year)

    existing_classes = (
        db.query(SchoolClass)
        .filter(SchoolClass.campus_id == campus_id, SchoolClass.academic_year_id == year.id)
        .count()
    )
    if existing_classes == 0:
        for idx, name in enumerate(DEFAULT_CLASSES, start=1):
            school_class = SchoolClass(
                campus_id=campus_id,
                academic_year_id=year.id,
                name=name,
                display_order=idx,
                is_active=True,
            )
            db.add(school_class)
            db.flush()
            for section_name in DEFAULT_SECTIONS:
                db.add(
                    Section(
                        campus_id=campus_id,
                        class_id=school_class.id,
                        name=section_name,
                        is_active=True,
                    )
                )
        db.commit()

    existing_subjects = db.query(Subject).filter(Subject.campus_id == campus_id).count()
    if existing_subjects == 0:
        for code, name in DEFAULT_SUBJECTS:
            db.add(
                Subject(
                    campus_id=campus_id,
                    code=code,
                    name=name,
                    is_active=True,
                )
            )
        db.commit()


def list_academic_years(db: Session, campus_id: int) -> list[AcademicYear]:
    return (
        db.query(AcademicYear)
        .filter(AcademicYear.campus_id == campus_id, AcademicYear.is_active.is_(True))
        .order_by(AcademicYear.id.desc())
        .all()
    )


def list_classes(db: Session, campus_id: int, academic_year_id: int | None = None) -> list[SchoolClass]:
    q = db.query(SchoolClass).filter(
        SchoolClass.campus_id == campus_id,
        SchoolClass.is_active.is_(True),
    )
    if academic_year_id:
        q = q.filter(SchoolClass.academic_year_id == academic_year_id)
    return q.order_by(SchoolClass.display_order.asc(), SchoolClass.id.asc()).all()


def list_sections(db: Session, campus_id: int, class_id: int | None = None) -> list[Section]:
    q = db.query(Section).filter(
        Section.campus_id == campus_id,
        Section.is_active.is_(True),
    )
    if class_id:
        q = q.filter(Section.class_id == class_id)
    return q.order_by(Section.name.asc()).all()


def list_subjects(db: Session, campus_id: int) -> list[Subject]:
    return (
        db.query(Subject)
        .filter(Subject.campus_id == campus_id, Subject.is_active.is_(True))
        .order_by(Subject.name.asc())
        .all()
    )
