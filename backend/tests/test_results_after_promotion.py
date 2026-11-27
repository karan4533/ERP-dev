"""Academic Phase 4: published results stay visible after a student is promoted."""

import os
from datetime import date, timedelta

os.environ["DATABASE_URL"] = "sqlite+pysqlite:///:memory:"
os.environ["OTP_DEBUG"] = "true"
os.environ["JWT_SECRET"] = "test-secret-qmis-erp-results-after-promotion"

import pytest
from fastapi.testclient import TestClient

from app.main import app
from auth_test_helpers import login_headers
from tests.conftest import reset_sqlite_memory_schema

STAFF = {
    "admin": ("admin@qmis.edu", "admin123"),
    "principal": ("principal@qmis.edu", "principal123"),
    "director": ("director@qmis.edu", "director123"),
    "coordinator": ("coordinator@qmis.edu", "coord123"),
    "teacher": ("teacher@qmis.edu", "teacher123"),
}
PW = "Phase4-Promo-2026"
FUTURE = (date.today() + timedelta(days=55)).isoformat()
FUTURE_END = (date.today() + timedelta(days=57)).isoformat()


def _ok(response, status=200):
    assert response.status_code == status, response.text
    return response.json()


@pytest.fixture(scope="module")
def w():
    reset_sqlite_memory_schema()
    with TestClient(app) as c:
        h = {who: login_headers(c, *creds) for who, creds in STAFF.items()}
        uid = {o["email"]: o["user_id"] for o in _ok(c.get("/api/v1/masters/class-teacher-options", headers=h["admin"]))}
        _ok(c.put("/api/v1/students/coordinator-grade-bands", headers=h["principal"],
                  json={"userId": uid["coordinator@qmis.edu"], "gradeFrom": 1, "gradeTo": 12}))

        ids = {}
        for cls in ("Grade 7", "Grade 8"):
            row = _ok(c.post("/api/v1/masters/classes", json={"name": cls}, headers=h["admin"]), 201)
            ids[cls] = row["id"]
            body = {"class_id": row["id"], "name": "A"}
            if cls == "Grade 7":
                body["class_teacher_user_id"] = uid["teacher@qmis.edu"]
            ids[f"{cls}-A"] = _ok(c.post("/api/v1/masters/sections", json=body, headers=h["admin"]), 201)["id"]

        adm = _ok(c.post("/api/v1/admissions", headers=h["admin"], json={
            "first_name": "Meera", "last_name": "Promo", "mobile_number": "9000099991",
            "class_name": "Grade 7", "parent_account_email": "p4.promo.parent@example.com"}), 201)
        sid = str(_ok(c.post(f"/api/v1/admissions/{adm['id']}/enroll", headers=h["admin"], json={
            "parent_account_email": "p4.promo.parent@example.com",
            "parent_account_password": PW}))["student_id"])
        _ok(c.post(f"/api/v1/students/{sid}/place", json={"sectionId": ids["Grade 7-A"]}, headers=h["principal"]))

        exam = _ok(c.post("/api/v1/exams", headers=h["principal"], json={
            "name": "P4 G7 Midterm", "examType": "MIDTERM", "className": "Grade 7",
            "academicYear": "2026 - 2027", "startDate": FUTURE, "endDate": FUTURE_END}), 201)
        sub = _ok(c.post(f"/api/v1/exams/{exam['id']}/submit", headers=h["principal"]))
        _ok(c.post(f"/api/v1/approvals/{sub['approvalId']}/decide", json={"decision": "approve"}, headers=h["director"]))

        batch = _ok(c.post("/api/v1/marks-batches", headers=h["teacher"], json={
            "examId": exam["id"], "subject": "Maths", "section": "A", "maxMarks": 50,
            "entries": [{"studentId": sid, "marks": 42}]}), 201)
        sent = _ok(c.post(f"/api/v1/marks-batches/{batch['id']}/submit", headers=h["teacher"]))
        for who in ("coordinator", "principal", "director"):
            _ok(c.post(f"/api/v1/approvals/{sent['approvalId']}/decide", json={"decision": "approve"}, headers=h[who]))

        h["parent"] = login_headers(c, "p4.promo.parent@example.com", PW)
        yield {"c": c, "h": h, "sid": sid, "exam": exam["id"], "ids": ids}


def test_parent_sees_grade7_result_before_and_after_promotion(w):
    c, h, sid = w["c"], w["h"], w["sid"]
    before = _ok(c.get(f"/api/v1/results/students/{sid}", headers=h["parent"]))
    assert before["className"] == "Grade 7"
    assert len(before["exams"]) == 1
    assert before["exams"][0]["className"] == "Grade 7"
    assert before["exams"][0]["percentage"] == 84.0
    assert before["exams"][0]["subjects"][0]["marks"] == 42.0

    promoted = _ok(c.post(f"/api/v1/students/{sid}/promote", headers=h["principal"], json={
        "targetClassId": w["ids"]["Grade 8"], "targetSectionId": w["ids"]["Grade 8-A"]}))
    assert promoted["className"] == "Grade 8"

    after = _ok(c.get(f"/api/v1/results/students/{sid}", headers=h["parent"]))
    assert after["className"] == "Grade 8"
    assert len(after["exams"]) == 1
    assert after["exams"][0]["examId"] == w["exam"]
    assert after["exams"][0]["className"] == "Grade 7"
    assert after["exams"][0]["section"] == "A"
    assert after["exams"][0]["percentage"] == 84.0
    assert after["exams"][0]["subjects"] == [
        {"subject": "Maths", "marks": 42.0, "maxMarks": 50.0, "absent": False}
    ]


def test_exam_class_table_still_lists_the_promoted_student(w):
    c, h, sid = w["c"], w["h"], w["sid"]
    table = _ok(c.get(f"/api/v1/exams/{w['exam']}/results", headers=h["principal"]))
    row = next(r for r in table["results"] if r["studentId"] == sid)
    assert row["percentage"] == 84.0
    assert row["subjects"][0]["marks"] == 42.0
