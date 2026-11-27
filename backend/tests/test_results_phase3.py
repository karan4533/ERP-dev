"""Academic Phase 3: the student / parent result and exam schedule screens read only published, own-child data.

Teacher remarks are not part of the published result payload (test_academic_privacy pins its exact shape),
so the portal's remarks column shows a dash until the school decides remarks may be shown to families.
"""

import os
from datetime import date, timedelta

os.environ["DATABASE_URL"] = "sqlite+pysqlite:///:memory:"
os.environ["OTP_DEBUG"] = "true"
os.environ["JWT_SECRET"] = "test-secret-qmis-erp-results-phase3"

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
PW = "Phase3-Parent-2026"
FUTURE = (date.today() + timedelta(days=50)).isoformat()
FUTURE_END = (date.today() + timedelta(days=52)).isoformat()


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

        sections = {}

        def section_id(cls, name="A"):
            if cls in sections:
                return sections[cls]
            school = _ok(c.post("/api/v1/masters/classes", json={"name": cls}, headers=h["admin"]), 201)
            sec = _ok(c.post("/api/v1/masters/sections", json={
                "class_id": school["id"], "name": name,
                "class_teacher_user_id": uid["teacher@qmis.edu"]}, headers=h["admin"]), 201)
            sections[cls] = sec["id"]
            return sections[cls]

        def enroll(first, cls, parent):
            adm = _ok(c.post("/api/v1/admissions", headers=h["admin"], json={
                "first_name": first, "last_name": "Results", "mobile_number": "9000088888",
                "class_name": cls, "parent_account_email": parent}), 201)
            sid = str(_ok(c.post(f"/api/v1/admissions/{adm['id']}/enroll", headers=h["admin"], json={
                "parent_account_email": parent, "parent_account_password": PW}))["student_id"])
            _ok(c.post(f"/api/v1/students/{sid}/place", json={"sectionId": section_id(cls)}, headers=h["principal"]))
            return sid

        mine = enroll("Asha", "Grade 7", "p3.parent.asha@example.com")
        other = enroll("Bilal", "Grade 8", "p3.parent.bilal@example.com")

        def exam(name, cls, approve):
            e = _ok(c.post("/api/v1/exams", headers=h["principal"], json={
                "name": name, "examType": "MIDTERM", "className": cls, "startDate": FUTURE, "endDate": FUTURE_END}), 201)
            s = _ok(c.post(f"/api/v1/exams/{e['id']}/submit", headers=h["principal"]))
            if approve:
                _ok(c.post(f"/api/v1/approvals/{s['approvalId']}/decide", json={"decision": "approve"}, headers=h["director"]))
            return e["id"]

        exams = {"g7": exam("P3 Midterm G7", "Grade 7", True), "g7_pending": exam("P3 Pending G7", "Grade 7", False),
                 "g8": exam("P3 Midterm G8", "Grade 8", True)}
        h["parent"] = login_headers(c, "p3.parent.asha@example.com", PW)
        yield {"c": c, "h": h, "mine": mine, "other": other, "exams": exams}


def _publish(w, exam_id, student_id, subject, marks, remarks):
    c, h = w["c"], w["h"]
    made = _ok(c.post("/api/v1/marks-batches", headers=h["teacher"], json={
        "examId": exam_id, "subject": subject, "maxMarks": 50,
        "entries": [{"studentId": student_id, "marks": marks, "remarks": remarks}]}), 201)
    sub = _ok(c.post(f"/api/v1/marks-batches/{made['id']}/submit", headers=h["teacher"]))
    return sub


def test_unpublished_marks_never_reach_the_parent_and_published_ones_do(w):
    c, h = w["c"], w["h"]
    sub = _publish(w, w["exams"]["g7"], w["mine"], "Maths", 41, "Neat working")
    assert _ok(c.get(f"/api/v1/results/students/{w['mine']}", headers=h["parent"]))["exams"] == []
    for who in ("coordinator", "principal", "director"):
        _ok(c.post(f"/api/v1/approvals/{sub['approvalId']}/decide", json={"decision": "approve"}, headers=h[who]))
    result = _ok(c.get(f"/api/v1/results/students/{w['mine']}", headers=h["parent"]))
    assert result["exams"][0]["subjects"] == [{"subject": "Maths", "marks": 41.0, "maxMarks": 50.0, "absent": False}]
    assert "Neat working" not in str(result)
    assert result["exams"][0]["percentage"] == 82.0 and result["weighted"] is None


def test_a_parent_cannot_read_another_childs_results(w):
    assert w["c"].get(f"/api/v1/results/students/{w['other']}", headers=w["h"]["parent"]).status_code == 404


def test_the_parent_schedule_lists_only_approved_exams_of_their_childs_class(w):
    names = {e["name"] for e in _ok(w["c"].get("/api/v1/exams", headers=w["h"]["parent"]))}
    assert names == {"P3 Midterm G7"}


def test_configured_weightage_drives_the_weighted_final(w):
    c, h = w["c"], w["h"]
    _ok(c.put("/api/v1/exam-weightage", params={"className": "Grade 7"}, headers=h["director"],
              json={"weights": [{"examType": "MIDTERM", "weight": 60}, {"examType": "FINAL", "weight": 40}]}))
    result = _ok(c.get(f"/api/v1/results/students/{w['mine']}", headers=h["parent"]))
    assert result["weighted"]["finalPercentage"] == 82.0 and result["weighted"]["complete"] is False
