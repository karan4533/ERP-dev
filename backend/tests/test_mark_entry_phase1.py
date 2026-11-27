"""Academic Phase 1: marks saved from Mark Entry keep their exam / student / class / section / year,
and a rejected batch tells the teacher why and can be revised."""

import os
from datetime import date, timedelta

os.environ["DATABASE_URL"] = "sqlite+pysqlite:///:memory:"
os.environ["OTP_DEBUG"] = "true"
os.environ["JWT_SECRET"] = "test-secret-qmis-erp-mark-entry-phase1"

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import select

from app.core.database import SessionLocal
from app.main import app
from app.models import Exam, MarkEntry, MarksBatch, Student
from auth_test_helpers import login_headers
from tests.conftest import reset_sqlite_memory_schema

STAFF = {
    "admin": ("admin@qmis.edu", "admin123"),
    "principal": ("principal@qmis.edu", "principal123"),
    "director": ("director@qmis.edu", "director123"),
    "coordinator": ("coordinator@qmis.edu", "coord123"),
    "teacher": ("teacher@qmis.edu", "teacher123"),
}
FUTURE = (date.today() + timedelta(days=40)).isoformat()
FUTURE_END = (date.today() + timedelta(days=43)).isoformat()


def _ok(response, status=200):
    assert response.status_code == status, response.text
    return response.json()


@pytest.fixture(scope="module")
def w():
    reset_sqlite_memory_schema()
    with TestClient(app) as c:
        h = {who: login_headers(c, *creds) for who, creds in STAFF.items()}
        options = _ok(c.get("/api/v1/masters/class-teacher-options", headers=h["admin"]))
        uid = {o["email"]: o["user_id"] for o in options}
        cls = _ok(c.post("/api/v1/masters/classes", json={"name": "Grade 7"}, headers=h["admin"]), 201)
        sec_a = _ok(c.post("/api/v1/masters/sections", json={"class_id": cls["id"], "name": "A",
                                                               "class_teacher_user_id": uid["teacher@qmis.edu"]},
                           headers=h["admin"]), 201)["id"]

        def enroll(first: str) -> str:
            adm = _ok(c.post("/api/v1/admissions", headers=h["admin"], json={
                "first_name": first, "last_name": "Marks", "mobile_number": "9000066666",
                "class_name": "Grade 7", "parent_account_email": f"p1.{first.lower()}@example.com"}), 201)
            sid = str(_ok(c.post(f"/api/v1/admissions/{adm['id']}/enroll", headers=h["admin"], json={
                "parent_account_email": f"p1.{first.lower()}@example.com",
                "parent_account_password": "Phase1-Parent-2026"}))["student_id"])
            _ok(c.post(f"/api/v1/students/{sid}/place", json={"sectionId": sec_a}, headers=h["principal"]))
            return sid

        students = [enroll("Ira"), enroll("Kabir")]
        exam = _ok(c.post("/api/v1/exams", headers=h["principal"], json={
            "name": "Phase1 Midterm", "examType": "MIDTERM", "className": "Grade 7", "academicYear": "2026 - 2027",
            "startDate": FUTURE, "endDate": FUTURE_END}), 201)
        sub = _ok(c.post(f"/api/v1/exams/{exam['id']}/submit", headers=h["principal"]))
        _ok(c.post(f"/api/v1/approvals/{sub['approvalId']}/decide", json={"decision": "approve"}, headers=h["director"]))
        _ok(c.put("/api/v1/students/coordinator-grade-bands", headers=h["principal"],
                  json={"userId": uid["coordinator@qmis.edu"], "gradeFrom": 1, "gradeTo": 12}))
        yield {"c": c, "h": h, "students": students, "exam": exam["id"]}


def test_a_saved_draft_reloads_with_its_exam_class_section_and_year(w):
    c, h, (ira, kabir) = w["c"], w["h"], w["students"]
    made = _ok(c.post("/api/v1/marks-batches", headers=h["teacher"], json={
        "examId": w["exam"], "subject": "Maths", "section": "A", "maxMarks": 50,
        "entries": [{"studentId": ira, "marks": 41}, {"studentId": kabir, "absent": True}]}), 201)
    assert made["status"] == "draft" and made["academicYear"] == "2026 - 2027" and made["submittedAt"] is None

    # "refresh": the screen finds the batch again through the teacher's own list, then opens it
    mine = _ok(c.get(f"/api/v1/marks-batches?examId={w['exam']}&mine=true", headers=h["teacher"]))
    again = _ok(c.get(f"/api/v1/marks-batches/{mine[0]['id']}", headers=h["teacher"]))
    assert again["id"] == made["id"] and again["className"] == "Grade 7" and again["section"] == "A"
    assert {e["studentId"]: (e["marks"], e["absent"]) for e in again["entries"]} == {ira: (41.0, False), kabir: (None, True)}

    with SessionLocal() as db:
        batch = db.get(MarksBatch, __import__("uuid").UUID(made["id"]))
        exam = db.get(Exam, batch.exam_id)
        assert (exam.class_name, exam.academic_year, batch.section, batch.subject) == ("Grade 7", "2026 - 2027", "A", "Maths")
        rows = db.scalars(select(MarkEntry).where(MarkEntry.batch_id == batch.id)).all()
        placed = {s.id: (s.class_name, s.section) for s in db.scalars(select(Student)).all()}
        assert all(placed[r.student_id] == ("Grade 7", "A") for r in rows)


def test_submitted_marks_report_the_waiting_step_and_stay_locked(w):
    c, h, (ira, _) = w["c"], w["h"], w["students"]
    made = _ok(c.post("/api/v1/marks-batches", headers=h["teacher"], json={
        "examId": w["exam"], "subject": "Science", "section": "A", "maxMarks": 20,
        "entries": [{"studentId": ira, "marks": 17}]}), 201)
    sub = _ok(c.post(f"/api/v1/marks-batches/{made['id']}/submit", headers=h["teacher"]))
    assert sub["status"] == "submitted" and sub["awaitingRole"] == "coordinator" and sub["submittedAt"]
    assert sub["rejectionReason"] == ""
    locked = c.put(f"/api/v1/marks-batches/{made['id']}/entries", headers=h["teacher"],
                   json={"entries": [{"studentId": ira, "marks": 20}]})
    assert locked.status_code == 409


def test_a_rejected_batch_carries_the_reason_and_revises_into_an_editable_draft(w):
    c, h, (ira, _) = w["c"], w["h"], w["students"]
    made = _ok(c.post("/api/v1/marks-batches", headers=h["teacher"], json={
        "examId": w["exam"], "subject": "English", "section": "A", "maxMarks": 30,
        "entries": [{"studentId": ira, "marks": 31 - 5}]}), 201)
    sub = _ok(c.post(f"/api/v1/marks-batches/{made['id']}/submit", headers=h["teacher"]))
    _ok(c.post(f"/api/v1/approvals/{sub['approvalId']}/decide", headers=h["coordinator"],
               json={"decision": "deny", "comment": "Recheck the essay marks"}))

    denied = _ok(c.get(f"/api/v1/marks-batches/{made['id']}", headers=h["teacher"]))
    assert denied["status"] == "denied" and denied["rejectionReason"] == "Recheck the essay marks"

    v2 = _ok(c.post(f"/api/v1/marks-batches/{made['id']}/revise", headers=h["teacher"]), 201)
    assert v2["version"] == 2 and v2["status"] == "draft" and v2["rejectionReason"] == ""
    assert v2["entries"][0]["marks"] == 26.0
    fixed = _ok(c.put(f"/api/v1/marks-batches/{v2['id']}/entries", headers=h["teacher"],
                      json={"entries": [{"studentId": ira, "marks": 24}]}))
    assert fixed["entries"][0]["marks"] == 24.0
    latest = max(_ok(c.get(f"/api/v1/marks-batches?examId={w['exam']}&mine=true", headers=h["teacher"])),
                 key=lambda b: b["version"] if b["subject"] == "English" else 0)
    assert latest["id"] == v2["id"]
