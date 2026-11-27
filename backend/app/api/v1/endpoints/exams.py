from datetime import date
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.deps import require_permission
from app.models import User
from app.services import exams as svc
from app.services import report_cards

router = APIRouter(prefix="/api/v1", tags=["exams"])


class ExamTypeIn(BaseModel):
    code: str = Field(min_length=1, max_length=24)
    name: str = Field(min_length=1, max_length=80)


class ExamTimelineIn(BaseModel):
    id: str | None = None
    day: str | None = None
    subject: str | None = None
    examDate: str | None = None
    startTime: str | None = None
    endTime: str | None = None


class ExamIn(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    examType: str
    className: str = Field(min_length=1, max_length=40)
    academicYear: str | None = Field(default=None, max_length=40)
    section: str | None = Field(default=None, max_length=40)
    teacherName: str | None = Field(default=None, max_length=120)
    startDate: date
    endDate: date
    timelines: list[ExamTimelineIn] | None = None


class WeightIn(BaseModel):
    examType: str
    weight: float


class WeightageIn(BaseModel):
    weights: list[WeightIn]


class EntryIn(BaseModel):
    studentId: str
    marks: float | None = None
    absent: bool = False
    remarks: str | None = None


class BatchIn(BaseModel):
    examId: UUID
    subject: str = Field(min_length=1, max_length=80)
    section: str | None = Field(default=None, max_length=16)
    maxMarks: float
    entries: list[EntryIn]


class EntriesIn(BaseModel):
    entries: list[EntryIn]


class CorrectionIn(BaseModel):
    reason: str = Field(min_length=1, max_length=500)
    entries: list[EntryIn]


# ---- exam types / exams -------------------------------------------------


@router.get("/exam-types")
def types_route(db: Session = Depends(get_db), user: User = Depends(require_permission("exams.read"))) -> list[dict]:
    return svc.list_types(db, user)


@router.post("/exam-types", status_code=201)
def create_type_route(
    body: ExamTypeIn, db: Session = Depends(get_db), user: User = Depends(require_permission("exams.configure"))
) -> dict:
    return svc.create_type(db, user, code=body.code, name=body.name)


@router.post("/exams", status_code=201)
def create_exam_route(
    body: ExamIn, db: Session = Depends(get_db), user: User = Depends(require_permission("exams.write"))
) -> dict:
    return svc.create_exam(
        db,
        user,
        name=body.name,
        exam_type=body.examType,
        class_name=body.className,
        start_date=body.startDate,
        end_date=body.endDate,
        academic_year=body.academicYear,
        timelines=[row.model_dump() for row in (body.timelines or [])],
        section=body.section,
        teacher_name=body.teacherName,
    )


@router.get("/exams")
def list_exams_route(
    class_name: str | None = Query(default=None, alias="className"),
    status: str | None = None,
    db: Session = Depends(get_db),
    user: User = Depends(require_permission("exams.read")),
) -> list[dict]:
    return svc.list_exams(db, user, class_name=class_name, status=status)


@router.get("/exams/{exam_id}")
def get_exam_route(
    exam_id: UUID, db: Session = Depends(get_db), user: User = Depends(require_permission("exams.read"))
) -> dict:
    return svc.get_exam(db, user, exam_id)


@router.put("/exams/{exam_id}")
def update_exam_route(
    exam_id: UUID,
    body: ExamIn,
    db: Session = Depends(get_db),
    user: User = Depends(require_permission("exams.write")),
) -> dict:
    """Update exam details and reopen Principal/Director approval."""
    return svc.update_exam(
        db,
        user,
        exam_id,
        name=body.name,
        exam_type=body.examType,
        class_name=body.className,
        start_date=body.startDate,
        end_date=body.endDate,
        academic_year=body.academicYear,
        timelines=[row.model_dump() for row in body.timelines] if body.timelines is not None else None,
        section=body.section,
        teacher_name=body.teacherName,
    )


@router.post("/exams/{exam_id}/submit")
def submit_exam_route(
    exam_id: UUID, db: Session = Depends(get_db), user: User = Depends(require_permission("exams.write"))
) -> dict:
    return svc.submit_exam(db, user, exam_id)


@router.get("/exams/{exam_id}/results")
def exam_results_route(
    exam_id: UUID, db: Session = Depends(get_db), user: User = Depends(require_permission("exams.read"))
) -> dict:
    """Published marks only, with auto ranks and class-high per subject."""
    return svc.exam_results(db, user, exam_id)


# ---- weightage -----------------------------------------------------------


@router.get("/exam-weightage")
def get_weightage_route(
    class_name: str = Query(alias="className"),
    db: Session = Depends(get_db),
    user: User = Depends(require_permission("exams.read")),
) -> dict:
    return svc.get_weightage(db, user, class_name)


@router.put("/exam-weightage")
def set_weightage_route(
    body: WeightageIn,
    class_name: str = Query(alias="className"),
    db: Session = Depends(get_db),
    user: User = Depends(require_permission("exams.configure")),
) -> dict:
    return svc.set_weightage(db, user, class_name, [w.model_dump() for w in body.weights])


# ---- marks batches ---------------------------------------------------------


@router.post("/marks-batches", status_code=201)
def create_batch_route(
    body: BatchIn, db: Session = Depends(get_db), user: User = Depends(require_permission("marks.write"))
) -> dict:
    return svc.create_batch(
        db, user, exam_id=body.examId, subject=body.subject, section=body.section,
        max_marks=body.maxMarks, entries=[e.model_dump() for e in body.entries],
    )


@router.get("/marks-batches")
def list_batches_route(
    exam_id: UUID | None = Query(default=None, alias="examId"),
    status: str | None = None,
    mine: bool = False,
    db: Session = Depends(get_db),
    user: User = Depends(require_permission("marks.read")),
) -> list[dict]:
    return svc.list_batches(db, user, exam_id=exam_id, status=status, mine=mine)


@router.get("/marks-batches/{batch_id}")
def get_batch_route(
    batch_id: UUID, db: Session = Depends(get_db), user: User = Depends(require_permission("marks.read"))
) -> dict:
    return svc.get_batch(db, user, batch_id)


@router.put("/marks-batches/{batch_id}/entries")
def replace_entries_route(
    batch_id: UUID,
    body: EntriesIn,
    db: Session = Depends(get_db),
    user: User = Depends(require_permission("marks.write")),
) -> dict:
    return svc.replace_entries(db, user, batch_id, [e.model_dump() for e in body.entries])


@router.post("/marks-batches/{batch_id}/submit")
def submit_batch_route(
    batch_id: UUID, db: Session = Depends(get_db), user: User = Depends(require_permission("marks.write"))
) -> dict:
    return svc.submit_batch(db, user, batch_id)


@router.post("/marks-batches/{batch_id}/revise", status_code=201)
def revise_batch_route(
    batch_id: UUID, db: Session = Depends(get_db), user: User = Depends(require_permission("marks.write"))
) -> dict:
    return svc.revise_batch(db, user, batch_id)


@router.post("/marks-batches/{batch_id}/request-correction", status_code=201)
def request_correction_route(
    batch_id: UUID,
    body: CorrectionIn,
    db: Session = Depends(get_db),
    user: User = Depends(require_permission("marks.write")),
) -> dict:
    return svc.request_correction(
        db, user, batch_id, reason=body.reason, entries=[e.model_dump() for e in body.entries]
    )


# ---- student results (parents via their child) ------------------------------


@router.get("/results/students/{student_id}")
def student_results_route(
    student_id: UUID, db: Session = Depends(get_db), user: User = Depends(require_permission("results.read"))
) -> dict:
    return svc.student_results(db, user, student_id)


def _codes(value: str | None) -> list[str] | None:
    return [part for part in (value or "").split(",") if part.strip()] or None


@router.get("/report-cards/students/{student_id}")
def report_card_route(
    student_id: UUID,
    academic_year: str | None = Query(default=None, alias="academicYear", max_length=40),
    exam_types: str | None = Query(default=None, alias="examTypes", max_length=400),
    term: str | None = Query(default=None, max_length=60),
    db: Session = Depends(get_db),
    user: User = Depends(require_permission("results.read")),
) -> dict:
    """Term report card from published marks: subject totals, grades and overall result."""
    return report_cards.student_report_card(
        db, user, student_id, academic_year=academic_year, exam_types=_codes(exam_types), term=term
    )


@router.get("/results/analytics")
def class_analytics_route(
    class_name: str = Query(alias="className", min_length=1, max_length=40),
    section: str | None = Query(default=None, max_length=16),
    exam_id: UUID | None = Query(default=None, alias="examId"),
    academic_year: str | None = Query(default=None, alias="academicYear", max_length=40),
    exam_types: str | None = Query(default=None, alias="examTypes", max_length=400),
    db: Session = Depends(get_db),
    user: User = Depends(require_permission("results.read")),
) -> dict:
    """Grade-wise performance over published marks, scoped to the caller's classes."""
    return report_cards.class_performance(
        db, user, class_name=class_name, section=section, exam_id=exam_id,
        academic_year=academic_year, exam_types=_codes(exam_types),
    )
