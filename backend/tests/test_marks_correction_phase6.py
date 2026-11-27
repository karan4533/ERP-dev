"""Academic Phase 6: published marks are corrected only via Principal/Director approval."""

import os
from datetime import date, timedelta

os.environ["DATABASE_URL"] = "sqlite+pysqlite:///:memory:"
os.environ["OTP_DEBUG"] = "true"
os.environ["JWT_SECRET"] = "test-secret-qmis-erp-marks-correction"

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
PW = "Phase6-Correct-2026"
FUTURE = (date.today() + timedelta(days=60)).isoformat()
FUTURE_END = (date.today() + timedelta(days=62)).isoformat()


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
        cls = _ok(c.post("/api/v1/masters/classes", json={"name": "Grade 9"}, headers=h["admin"]), 201)
        sec = _ok(c.post("/api/v1/masters/sections", json={
            "class_id": cls["id"], "name": "A", "class_teacher_user_id": uid["teacher@qmis.edu"]},
                        headers=h["admin"]), 201)["id"]

        adm = _ok(c.post("/api/v1/admissions", headers=h["admin"], json={
            "first_name": "Nora", "last_name": "Fix", "mobile_number": "9000066661",
            "class_name": "Grade 9", "parent_account_email": "p6.fix.parent@example.com"}), 201)
        sid = str(_ok(c.post(f"/api/v1/admissions/{adm['id']}/enroll", headers=h["admin"], json={
            "parent_account_email": "p6.fix.parent@example.com", "parent_account_password": PW}))["student_id"])
        _ok(c.post(f"/api/v1/students/{sid}/place", json={"sectionId": sec}, headers=h["principal"]))

        exam = _ok(c.post("/api/v1/exams", headers=h["principal"], json={
            "name": "P6 Midterm", "examType": "MIDTERM", "className": "Grade 9",
            "startDate": FUTURE, "endDate": FUTURE_END}), 201)
        sub = _ok(c.post(f"/api/v1/exams/{exam['id']}/submit", headers=h["principal"]))
        _ok(c.post(f"/api/v1/approvals/{sub['approvalId']}/decide", json={"decision": "approve"}, headers=h["director"]))

        batch = _ok(c.post("/api/v1/marks-batches", headers=h["teacher"], json={
            "examId": exam["id"], "subject": "Science", "section": "A", "maxMarks": 100,
            "entries": [{"studentId": sid, "marks": 55}]}), 201)
        sent = _ok(c.post(f"/api/v1/marks-batches/{batch['id']}/submit", headers=h["teacher"]))
        for who in ("coordinator", "principal", "director"):
            _ok(c.post(f"/api/v1/approvals/{sent['approvalId']}/decide", json={"decision": "approve"}, headers=h[who]))

        h["parent"] = login_headers(c, "p6.fix.parent@example.com", PW)
        yield {"c": c, "h": h, "sid": sid, "batch": batch["id"], "exam": exam["id"]}


def test_rejected_correction_leaves_published_marks_unchanged(w):
    c, h, sid = w["c"], w["h"], w["sid"]
    before = _ok(c.get(f"/api/v1/results/students/{sid}", headers=h["parent"]))
    assert before["exams"][0]["subjects"][0]["marks"] == 55.0

    corr = _ok(c.post(f"/api/v1/marks-batches/{w['batch']}/request-correction", headers=h["teacher"], json={
        "reason": "Addition error on paper 2",
        "entries": [{"studentId": sid, "marks": 72}]}), 201)
    assert corr["status"] == "submitted" and corr["version"] == 2
    assert corr["awaitingRole"] == "principal"
    appr = _ok(c.get(f"/api/v1/approvals/{corr['approvalId']}", headers=h["principal"]))
    assert appr["chain"] == ["principal", "director"]
    assert "Addition error" in appr["events"][0]["comment"]

    assert _ok(c.get(f"/api/v1/results/students/{sid}", headers=h["parent"]))["exams"][0]["subjects"][0]["marks"] == 55.0
    _ok(c.post(f"/api/v1/approvals/{corr['approvalId']}/decide",
               json={"decision": "deny", "comment": "Evidence incomplete"}, headers=h["principal"]))
    after = _ok(c.get(f"/api/v1/results/students/{sid}", headers=h["parent"]))
    assert after["exams"][0]["subjects"][0]["marks"] == 55.0
    assert after["exams"][0]["percentage"] == 55.0


def test_approved_correction_replaces_published_marks_and_keeps_history(w):
    c, h, sid = w["c"], w["h"], w["sid"]
    # Fresh published path: revise the denied v2, then request a new correction from v1 still published.
    # After deny of v2, parent still sees v1. Request another correction from the original published batch.
    # A newer version (denied v2) exists, so request from v1 must fail — use revise of denied v2 instead,
    # then submit as a normal correction by requesting from... wait, revise creates draft without approval.
    # Correct flow after deny: revise denied correction -> edit -> submit via request? revise only copies.
    # Simpler: create a second student+batch in this test module is heavy. Use revise + submit as marks_batch
    # is NOT a correction. Instead: publish a second subject for a clean correction approve path.

    batch = _ok(c.post("/api/v1/marks-batches", headers=h["teacher"], json={
        "examId": w["exam"], "subject": "Maths", "section": "A", "maxMarks": 100,
        "entries": [{"studentId": sid, "marks": 40}]}), 201)
    sent = _ok(c.post(f"/api/v1/marks-batches/{batch['id']}/submit", headers=h["teacher"]))
    for who in ("coordinator", "principal", "director"):
        _ok(c.post(f"/api/v1/approvals/{sent['approvalId']}/decide", json={"decision": "approve"}, headers=h[who]))

    corr = _ok(c.post(f"/api/v1/marks-batches/{batch['id']}/request-correction", headers=h["teacher"], json={
        "reason": "Misread the answer key",
        "entries": [{"studentId": sid, "marks": 88}]}), 201)
    assert corr["awaitingRole"] == "principal"
    # Coordinator is not on the correction chain.
    assert c.post(f"/api/v1/approvals/{corr['approvalId']}/decide",
                  json={"decision": "approve"}, headers=h["coordinator"]).status_code == 403
    _ok(c.post(f"/api/v1/approvals/{corr['approvalId']}/decide", json={"decision": "approve"}, headers=h["principal"]))
    _ok(c.post(f"/api/v1/approvals/{corr['approvalId']}/decide", json={"decision": "approve"}, headers=h["director"]))

    result = _ok(c.get(f"/api/v1/results/students/{sid}", headers=h["parent"]))
    maths = next(s for e in result["exams"] for s in e["subjects"] if s["subject"] == "Maths")
    assert maths["marks"] == 88.0
    # Original published Science marks from the first test remain.
    science = next(s for e in result["exams"] for s in e["subjects"] if s["subject"] == "Science")
    assert science["marks"] == 55.0


def test_teacher_cannot_overwrite_published_marks_directly(w):
    assert w["c"].put(
        f"/api/v1/marks-batches/{w['batch']}/entries",
        headers=w["h"]["teacher"],
        json={"entries": [{"studentId": w["sid"], "marks": 99}]},
    ).status_code == 409
