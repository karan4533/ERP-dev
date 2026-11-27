"""Academic Phase 7: parents get one in-app notice when marks are published."""

import os
from datetime import date, timedelta

os.environ["DATABASE_URL"] = "sqlite+pysqlite:///:memory:"
os.environ["OTP_DEBUG"] = "true"
os.environ["JWT_SECRET"] = "test-secret-qmis-erp-result-notifications"

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import select

from app.core.database import SessionLocal
from app.main import app
from app.models import Notification
from auth_test_helpers import login_headers
from tests.conftest import reset_sqlite_memory_schema

STAFF = {
    "admin": ("admin@qmis.edu", "admin123"),
    "principal": ("principal@qmis.edu", "principal123"),
    "director": ("director@qmis.edu", "director123"),
    "coordinator": ("coordinator@qmis.edu", "coord123"),
    "teacher": ("teacher@qmis.edu", "teacher123"),
}
PW = "Phase7-Notify-2026"
FUTURE = (date.today() + timedelta(days=65)).isoformat()
FUTURE_END = (date.today() + timedelta(days=67)).isoformat()


def _ok(response, status=200):
    assert response.status_code == status, response.text
    return response.json()


def _parent_result_notifs(email: str) -> list[Notification]:
    with SessionLocal() as db:
        from app.models import User

        parent = db.scalar(select(User).where(User.email == email))
        return list(
            db.scalars(
                select(Notification).where(
                    Notification.user_id == parent.id,
                    Notification.entity_type == "result_published",
                ).order_by(Notification.created_at)
            ).all()
        )


@pytest.fixture(scope="module")
def w():
    reset_sqlite_memory_schema()
    with TestClient(app) as c:
        h = {who: login_headers(c, *creds) for who, creds in STAFF.items()}
        uid = {o["email"]: o["user_id"] for o in _ok(c.get("/api/v1/masters/class-teacher-options", headers=h["admin"]))}
        _ok(c.put("/api/v1/students/coordinator-grade-bands", headers=h["principal"],
                  json={"userId": uid["coordinator@qmis.edu"], "gradeFrom": 1, "gradeTo": 12}))
        cls = _ok(c.post("/api/v1/masters/classes", json={"name": "Grade 4"}, headers=h["admin"]), 201)
        sec = _ok(c.post("/api/v1/masters/sections", json={
            "class_id": cls["id"], "name": "A", "class_teacher_user_id": uid["teacher@qmis.edu"]},
                        headers=h["admin"]), 201)["id"]

        def enroll(first, parent_email):
            adm = _ok(c.post("/api/v1/admissions", headers=h["admin"], json={
                "first_name": first, "last_name": "Note", "mobile_number": "9000077771",
                "class_name": "Grade 4", "parent_account_email": parent_email}), 201)
            sid = str(_ok(c.post(f"/api/v1/admissions/{adm['id']}/enroll", headers=h["admin"], json={
                "parent_account_email": parent_email, "parent_account_password": PW}))["student_id"])
            _ok(c.post(f"/api/v1/students/{sid}/place", json={"sectionId": sec}, headers=h["principal"]))
            return sid

        mine = enroll("Asha", "p7.parent.asha@example.com")
        other = enroll("Bilal", "p7.parent.bilal@example.com")

        exam = _ok(c.post("/api/v1/exams", headers=h["principal"], json={
            "name": "P7 Midterm", "examType": "MIDTERM", "className": "Grade 4",
            "startDate": FUTURE, "endDate": FUTURE_END}), 201)
        sub = _ok(c.post(f"/api/v1/exams/{exam['id']}/submit", headers=h["principal"]))
        _ok(c.post(f"/api/v1/approvals/{sub['approvalId']}/decide", json={"decision": "approve"}, headers=h["director"]))

        h["parent"] = login_headers(c, "p7.parent.asha@example.com", PW)
        h["other_parent"] = login_headers(c, "p7.parent.bilal@example.com", PW)
        yield {"c": c, "h": h, "mine": mine, "other": other, "exam": exam["id"]}


def test_parent_is_notified_only_when_marks_are_published(w):
    c, h = w["c"], w["h"]
    assert _parent_result_notifs("p7.parent.asha@example.com") == []

    batch = _ok(c.post("/api/v1/marks-batches", headers=h["teacher"], json={
        "examId": w["exam"], "subject": "English", "section": "A", "maxMarks": 50,
        "entries": [{"studentId": w["mine"], "marks": 45}]}), 201)
    sent = _ok(c.post(f"/api/v1/marks-batches/{batch['id']}/submit", headers=h["teacher"]))
    assert _parent_result_notifs("p7.parent.asha@example.com") == []

    _ok(c.post(f"/api/v1/approvals/{sent['approvalId']}/decide", json={"decision": "approve"}, headers=h["coordinator"]))
    assert _parent_result_notifs("p7.parent.asha@example.com") == []
    _ok(c.post(f"/api/v1/approvals/{sent['approvalId']}/decide", json={"decision": "approve"}, headers=h["principal"]))
    assert _parent_result_notifs("p7.parent.asha@example.com") == []

    _ok(c.post(f"/api/v1/approvals/{sent['approvalId']}/decide", json={"decision": "approve"}, headers=h["director"]))
    notes = _parent_result_notifs("p7.parent.asha@example.com")
    assert len(notes) == 1
    assert notes[0].title == "Result published"
    assert "Asha" in notes[0].body and "Bilal" not in notes[0].body
    assert "English" in notes[0].body
    assert _parent_result_notifs("p7.parent.bilal@example.com") == []

    # Retry / re-notify path is idempotent: calling the helper again does not duplicate.
    from app.services.exams import notify_parents_result_published

    with SessionLocal() as db:
        notify_parents_result_published(db, batch["id"])
        db.commit()
    assert len(_parent_result_notifs("p7.parent.asha@example.com")) == 1

    mine = [n for n in _ok(c.get("/api/v1/notifications", headers=h["parent"])) if n["entityType"] == "result_published"]
    assert len(mine) == 1 and "Asha" in mine[0]["body"]
    other = [n for n in _ok(c.get("/api/v1/notifications", headers=h["other_parent"])) if n["entityType"] == "result_published"]
    assert other == []
