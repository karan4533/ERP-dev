"""Term report cards and grade-wise performance analytics, computed from published marks only.

Grading rule: the school's bands already used by the result screens
(src/Common/MarkEntryApproval/gradeRules.js) — A+ >= 90, A >= 80, B+ >= 70, B >= 60, C >= 50,
D >= 33, F below 33; a subject is passed at 33 %. There is no term master in QMIS, so a "term" is
the set of exam types the caller selects (e.g. CA + MIDTERM); the label is display-only.

Aggregation:
- Subject percentage: with Director-set weightage for the class (ExamWeightage), the weighted
  mean of the subject's per-exam-type percentages over the weighted types present; without
  weightage, subject marks over subject maximum marks. Absent papers count in neither.
- Overall percentage: the same rule over all subjects (per exam type when weighted, grand total
  otherwise).
- Overall result: Fail if any subject is below the pass mark; Incomplete if a subject has only
  absent papers; otherwise Pass.
"""

from __future__ import annotations

from types import SimpleNamespace
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.deps import role_code_for
from app.models import Exam, ExamType, ExamWeightage, Student, User
from app.services import exams as exam_svc
from app.services.academic_year_labels import academic_years_equivalent
from app.services.errors import fail
from app.services.students import PORTAL_ROLES, class_key, section_key, staff_student_filter

PASS_MARK_PERCENT = 33.0
GRADE_BANDS: tuple[tuple[float, str], ...] = (
    (90.0, "A+"),
    (80.0, "A"),
    (70.0, "B+"),
    (60.0, "B"),
    (50.0, "C"),
    (PASS_MARK_PERCENT, "D"),
)
FAIL_GRADE = "F"
GRADING_RULE = {
    "passMarkPercent": PASS_MARK_PERCENT,
    "bands": [{"grade": g, "minPercent": m} for m, g in GRADE_BANDS] + [{"grade": FAIL_GRADE, "minPercent": 0.0}],
    "source": "src/Common/MarkEntryApproval/gradeRules.js",
    "confirmedByClient": False,
}


def grade_for(percentage: float | None) -> str | None:
    if percentage is None:
        return None
    for minimum, grade in GRADE_BANDS:
        if percentage >= minimum:
            return grade
    return FAIL_GRADE


def _pct(marks: float, maximum: float) -> float | None:
    return round(marks / maximum * 100, 2) if maximum else None


def _same_year(exam: Exam, academic_year: str) -> bool:
    label = (exam.academic_year or "").strip()
    if not label:
        return False
    same = academic_years_equivalent(label, academic_year)
    return same if same is not None else label.lower() == academic_year.strip().lower()


def _parse_types(db: Session, actor: User, exam_types: list[str] | None) -> set[str] | None:
    codes = {c.strip().upper() for c in (exam_types or []) if c and c.strip()}
    if not codes:
        return None
    known = {t["code"] for t in exam_svc.list_types(db, actor)}
    unknown = sorted(codes - known)
    if unknown:
        fail(400, "validation_error", f"Unknown exam type(s): {', '.join(unknown)}.")
    return codes


def _class_weights(db: Session, campus_id, class_name: str) -> dict[str, float]:
    want = class_key(class_name)
    out: dict[str, float] = {}
    for w in db.scalars(select(ExamWeightage).where(ExamWeightage.campus_id == campus_id)).all():
        if class_key(w.class_name) != want:
            continue
        etype = db.get(ExamType, w.exam_type_id)
        if etype is not None:
            out[etype.code] = float(w.weight)
    return out


def _weighted(parts: dict[str, tuple[float, float]], weights: dict[str, float]) -> float | None:
    """parts: exam type -> (marks, max). Weighted mean of per-type percentages over weighted types."""
    num = den = 0.0
    for code, (marks, maximum) in parts.items():
        weight = weights.get(code)
        if weight is None or not maximum:
            continue
        num += weight * (marks / maximum * 100)
        den += weight
    return round(num / den, 2) if den else None


def _overall_result(subject_results: list[str]) -> str | None:
    if not subject_results:
        return None
    if "Fail" in subject_results:
        return "Fail"
    if "Absent" in subject_results:
        return "Incomplete"
    return "Pass"


def _summarise(subject_rows: dict[str, list[dict]], weights: dict[str, float]) -> tuple[list[dict], dict]:
    """subject -> [{examType, marks, maxMarks, absent, ...}] into subject lines and the overall line."""
    use_weights = bool(weights) and any(
        r["examType"] in weights for rows in subject_rows.values() for r in rows
    )
    subjects = []
    by_type_all: dict[str, list[float]] = {}
    grand_marks = grand_max = 0.0
    for subject in sorted(subject_rows):
        rows = subject_rows[subject]
        marks = sum(r["marks"] or 0.0 for r in rows if not r["absent"])
        maximum = sum(r["maxMarks"] for r in rows if not r["absent"])
        grand_marks += marks
        grand_max += maximum
        by_type: dict[str, list[float]] = {}
        for r in rows:
            if r["absent"]:
                continue
            part = by_type.setdefault(r["examType"], [0.0, 0.0])
            part[0] += r["marks"] or 0.0
            part[1] += r["maxMarks"]
            total = by_type_all.setdefault(r["examType"], [0.0, 0.0])
            total[0] += r["marks"] or 0.0
            total[1] += r["maxMarks"]
        if use_weights:
            percentage = _weighted({k: (v[0], v[1]) for k, v in by_type.items()}, weights)
        else:
            percentage = _pct(marks, maximum)
        if percentage is None:
            result = "Absent"
        else:
            result = "Pass" if percentage >= PASS_MARK_PERCENT else "Fail"
        subjects.append({
            "subject": subject,
            "components": rows,
            "obtained": round(marks, 2),
            "maxMarks": round(maximum, 2),
            "percentage": percentage,
            "grade": grade_for(percentage) if percentage is not None else "AB",
            "result": result,
        })
    if use_weights:
        overall_pct = _weighted({k: (v[0], v[1]) for k, v in by_type_all.items()}, weights)
    else:
        overall_pct = _pct(grand_marks, grand_max)
    overall = {
        "obtained": round(grand_marks, 2),
        "maxMarks": round(grand_max, 2),
        "percentage": overall_pct,
        "grade": grade_for(overall_pct),
        "result": _overall_result([s["result"] for s in subjects]),
    }
    return subjects, {"overall": overall, "weighting": "weighted" if use_weights else "raw"}


# ------------------------------------------------------------------ report card


def student_report_card(
    db: Session,
    actor: User,
    student_id: UUID,
    *,
    academic_year: str | None = None,
    exam_types: list[str] | None = None,
    term: str | None = None,
) -> dict:
    """Term report card for one student from Director-published marks.

    Without ``academicYear`` the card covers exams of the student's current class; with it, the exams
    of that year (which may be an earlier class after promotion).
    """
    student = exam_svc.load_student_for_results(db, actor, student_id)
    codes = _parse_types(db, actor, exam_types)
    year = (academic_year or "").strip()

    selected: list[tuple[Exam, str, dict]] = []
    for exam in exam_svc.student_exams(db, actor, student):
        etype = db.get(ExamType, exam.exam_type_id)
        code = etype.code if etype else ""
        if codes is not None and code not in codes:
            continue
        if year:
            if not _same_year(exam, year):
                continue
        elif class_key(exam.class_name) != class_key(student.class_name):
            continue
        row = exam_svc._exam_table(db, exam).get(student.id)
        if row:
            selected.append((exam, code, row))

    classes = {class_key(exam.class_name) for exam, _, _ in selected}
    if len(classes) > 1:
        fail(400, "validation_error", "The selection spans more than one class. Choose a single academic year.")
    class_name = selected[0][0].class_name if selected else student.class_name
    section = selected[-1][2]["_section"] if selected else (student.section or "")
    weights = _class_weights(db, actor.campus_id, class_name)

    subject_rows: dict[str, list[dict]] = {}
    for exam, code, row in selected:
        for s in row["subjects"]:
            subject_rows.setdefault(s["subject"], []).append({
                "examId": str(exam.id),
                "examName": exam.name,
                "examType": code,
                "marks": s["marks"],
                "maxMarks": s["maxMarks"],
                "absent": s["absent"],
                "percentage": None if s["absent"] else _pct(s["marks"] or 0.0, s["maxMarks"]),
            })
    subjects, summary = _summarise(subject_rows, weights)
    used_types = sorted({code for _, code, _ in selected})
    return {
        "studentId": str(student.id),
        "studentName": student.full_name,
        "admissionNumber": student.admission_number,
        "className": class_name,
        "section": section,
        "academicYear": year or ((selected[0][0].academic_year or "") if selected else ""),
        "term": (term or "").strip(),
        "examTypes": sorted(codes) if codes is not None else used_types,
        "exams": [
            {"examId": str(exam.id), "examName": exam.name, "examType": code,
             "startDate": exam.start_date.isoformat(), "rank": row["rank"]}
            for exam, code, row in selected
        ],
        "weighting": summary["weighting"],
        "weights": [
            {"examType": code, "weight": weight}
            for code, weight in sorted(weights.items()) if code in used_types
        ] if summary["weighting"] == "weighted" else [],
        "subjects": subjects,
        "overall": summary["overall"] if subjects else None,
        "gradingRule": GRADING_RULE,
    }


# ------------------------------------------------------------------ grade-wise analytics


def class_performance(
    db: Session,
    actor: User,
    *,
    class_name: str,
    section: str | None = None,
    exam_id: UUID | None = None,
    academic_year: str | None = None,
    exam_types: list[str] | None = None,
) -> dict:
    """Grade-wise analytics over published marks, limited to the students the caller may see."""
    role = role_code_for(db, actor)
    if role in PORTAL_ROLES:
        fail(403, "forbidden", "Class analytics are for staff. Open the student's own results instead.")
    if role not in exam_svc.VIEW_ALL_ROLES and role != "teacher":
        fail(403, "forbidden", "Not allowed to view results.")
    if not (class_name or "").strip():
        fail(400, "validation_error", "className is required.")
    codes = _parse_types(db, actor, exam_types)
    year = (academic_year or "").strip()
    want_class = class_key(class_name)
    want_section = section_key(section) if section else ""

    exams = []
    for exam in db.scalars(
        select(Exam).where(Exam.campus_id == actor.campus_id).order_by(Exam.start_date)
    ).all():
        if class_key(exam.class_name) != want_class:
            continue
        if exam_id and exam.id != exam_id:
            continue
        if year and not _same_year(exam, year):
            continue
        etype = db.get(ExamType, exam.exam_type_id)
        code = etype.code if etype else ""
        if codes is not None and code not in codes:
            continue
        exams.append((exam, code))
    if exam_id and not exams:
        fail(404, "not_found", "Exam not found for this class.")

    allowed = staff_student_filter(db, actor, role)
    if allowed is not None:
        class_students = db.scalars(
            select(Student).where(Student.campus_id == actor.campus_id)
        ).all()
        class_students = [s for s in class_students if class_key(s.class_name) == want_class]
        if want_section:
            class_students = [s for s in class_students if section_key(s.section) == want_section]
        if class_students and not any(allowed(s) for s in class_students):
            fail(403, "forbidden", "This class is outside your assigned classes.")

    per_student: dict[UUID, dict] = {}
    for exam, code in exams:
        for sid, row in exam_svc._exam_table(db, exam).items():
            if want_section and section_key(row["_section"]) != want_section:
                continue
            if allowed is not None and not allowed(
                SimpleNamespace(class_name=exam.class_name, section=row["_section"])
            ):
                continue
            entry = per_student.setdefault(sid, {
                "studentId": str(sid), "studentName": row["studentName"],
                "admissionNumber": row["admissionNumber"], "section": row["_section"], "subjects": {},
            })
            for s in row["subjects"]:
                entry["subjects"].setdefault(s["subject"], []).append({
                    "examType": code, "marks": s["marks"], "maxMarks": s["maxMarks"], "absent": s["absent"],
                })

    weights = _class_weights(db, actor.campus_id, class_name)
    students_out = []
    subject_scores: dict[str, list[tuple[float, str]]] = {}
    for entry in per_student.values():
        subjects, summary = _summarise(entry["subjects"], weights)
        overall = summary["overall"]
        for s in subjects:
            if s["percentage"] is not None:
                subject_scores.setdefault(s["subject"], []).append((s["percentage"], s["result"]))
        students_out.append({
            "studentId": entry["studentId"],
            "studentName": entry["studentName"],
            "admissionNumber": entry["admissionNumber"],
            "section": entry["section"],
            "percentage": overall["percentage"],
            "grade": overall["grade"],
            "result": overall["result"],
        })
    students_out.sort(key=lambda r: (-(r["percentage"] or 0.0), r["studentName"]))

    scored = [r["percentage"] for r in students_out if r["percentage"] is not None]

    def _avg(values: list[float]) -> float | None:
        return round(sum(values) / len(values), 2) if values else None

    sections: dict[str, list[float]] = {}
    for r in students_out:
        if r["percentage"] is not None:
            sections.setdefault(r["section"] or "", []).append(r["percentage"])
    distribution = {band: 0 for _, band in GRADE_BANDS}
    distribution[FAIL_GRADE] = 0
    for r in students_out:
        if r["grade"]:
            distribution[r["grade"]] += 1
    return {
        "className": class_name.strip(),
        "section": (section or "").strip(),
        "academicYear": year,
        "exams": [
            {"examId": str(exam.id), "examName": exam.name, "examType": code,
             "status": exam_svc._exam_out(db, exam)["status"]}
            for exam, code in exams
        ],
        "studentCount": len(students_out),
        "averagePercentage": _avg(scored),
        "highestPercentage": max(scored) if scored else None,
        "lowestPercentage": min(scored) if scored else None,
        "passCount": sum(1 for r in students_out if r["result"] == "Pass"),
        "failCount": sum(1 for r in students_out if r["result"] == "Fail"),
        "gradeDistribution": distribution,
        "subjects": [
            {
                "subject": subject,
                "students": len(values),
                "averagePercentage": _avg([v for v, _ in values]),
                "highestPercentage": max(v for v, _ in values),
                "lowestPercentage": min(v for v, _ in values),
                "passCount": sum(1 for _, res in values if res == "Pass"),
                "failCount": sum(1 for _, res in values if res == "Fail"),
            }
            for subject, values in sorted(subject_scores.items())
        ],
        "sections": [
            {"section": name, "students": len(values), "averagePercentage": _avg(values)}
            for name, values in sorted(sections.items())
        ],
        "students": students_out,
        "weighting": "weighted" if weights and any(
            r["examType"] in weights for e in per_student.values() for rows in e["subjects"].values() for r in rows
        ) else "raw",
        "gradingRule": GRADING_RULE,
    }
