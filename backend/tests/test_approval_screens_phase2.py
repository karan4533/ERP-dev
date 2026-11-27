"""Academic Phase 2: what the Coordinator / Principal / Director approval screens rely on.

The screens only show buttons; these checks prove the server enforces the step, the scope and
the no-self-approval rule, and that the history panel can be read by the right people.
"""

import os
from datetime import date, timedelta

os.environ["DATABASE_URL"] = "sqlite+pysqlite:///:memory:"
os.environ["OTP_DEBUG"] = "true"
os.environ["JWT_SECRET"] = "test-secret-qmis-erp-approval-screens-phase2"

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
FUTURE = (date.today() + timedelta(days=45)).isoformat()
FUTURE_END = (date.today() + timedelta(days=48)).isoformat()


def _ok(response, status=200):
    assert response.status_code == status, response.text
    return response.json()


@pytest.fixture(scope="module")
def w():
    reset_sqlite_memory_schema()
    with TestClient(app) as c:
        h = {who: login_headers(c, *creds) for who, creds in STAFF.items()}
        uid = {o["email"]: o["user_id"] for o in _ok(c.get("/api/v1/masters/class-teacher-options", headers=h["admin"]))}
        cls = _ok(c.post("/api/v1/masters/classes", json={"name": "Grade 3"}, headers=h["admin"]), 201)
        sec = _ok(c.post("/api/v1/masters/sections", json={"class_id": cls["id"], "name": "A",
                                                            "class_teacher_user_id": uid["teacher@qmis.edu"]},
                         headers=h["admin"]), 201)["id"]
        adm = _ok(c.post("/api/v1/admissions", headers=h["admin"], json={
            "first_name": "Ria", "last_name": "Phase", "mobile_number": "9000077777", "class_name": "Grade 3",
            "parent_account_email": "p2.screens.parent@example.com"}), 201)
        sid = str(_ok(c.post(f"/api/v1/admissions/{adm['id']}/enroll", headers=h["admin"], json={
            "parent_account_email": "p2.screens.parent@example.com",
            "parent_account_password": "Phase2-Parent-2026"}))["student_id"])
        _ok(c.post(f"/api/v1/students/{sid}/place", json={"sectionId": sec}, headers=h["principal"]))
        exam = _ok(c.post("/api/v1/exams", headers=h["principal"], json={
            "name": "Screens Midterm", "examType": "MIDTERM", "className": "Grade 3",
            "startDate": FUTURE, "endDate": FUTURE_END}), 201)
        sub = _ok(c.post(f"/api/v1/exams/{exam['id']}/submit", headers=h["principal"]))
        _ok(c.post(f"/api/v1/approvals/{sub['approvalId']}/decide", json={"decision": "approve"}, headers=h["director"]))

        def band(lo, hi):
            _ok(c.put("/api/v1/students/coordinator-grade-bands", headers=h["principal"],
                      json={"userId": uid["coordinator@qmis.edu"], "gradeFrom": lo, "gradeTo": hi}))

        band(1, 5)
        yield {"c": c, "h": h, "sid": sid, "exam": exam["id"], "band": band}


def _batch(w, subject):
    c, h = w["c"], w["h"]
    made = _ok(c.post("/api/v1/marks-batches", headers=h["teacher"], json={
        "examId": w["exam"], "subject": subject, "section": "A", "maxMarks": 25,
        "entries": [{"studentId": w["sid"], "marks": 20}]}), 201)
    return _ok(c.post(f"/api/v1/marks-batches/{made['id']}/submit", headers=h["teacher"]))


def _plan(w, subject):
    c, h = w["c"], w["h"]
    plan = _ok(c.post("/api/v1/lesson-plans", headers=h["teacher"], json={
        "className": "Grade 3", "section": "A", "subject": subject, "month": "2099-03",
        "title": f"{subject} plan", "content": {"weeks": [{"week": 1, "topic": "Intro"}]}}), 201)
    return _ok(c.post(f"/api/v1/lesson-plans/{plan['id']}/submit", headers=h["teacher"]))


def test_each_marks_step_is_decided_only_by_its_role_and_publishes_at_the_end(w):
    c, h = w["c"], w["h"]
    batch = _batch(w, "Maths")
    appr = batch["approvalId"]
    for wrong in ("principal", "director"):
        assert c.post(f"/api/v1/approvals/{appr}/decide", json={"decision": "approve"}, headers=h[wrong]).status_code == 403
    assert appr in {a["id"] for a in _ok(c.get("/api/v1/approvals/inbox", headers=h["coordinator"]))}
    assert appr not in {a["id"] for a in _ok(c.get("/api/v1/approvals/inbox", headers=h["principal"]))}

    for who, next_role in (("coordinator", "principal"), ("principal", "director"), ("director", None)):
        out = _ok(c.post(f"/api/v1/approvals/{appr}/decide", json={"decision": "approve"}, headers=h[who]))
        assert out["awaitingRole"] == next_role
    assert _ok(c.get(f"/api/v1/marks-batches/{batch['id']}", headers=h["teacher"]))["status"] == "published"


def test_the_history_panel_lists_route_and_events_for_owner_and_approvers(w):
    c, h = w["c"], w["h"]
    batch = _batch(w, "Science")
    _ok(c.post(f"/api/v1/approvals/{batch['approvalId']}/decide", json={"decision": "approve", "comment": "Checked"},
               headers=h["coordinator"]))
    for who in ("teacher", "coordinator", "principal", "director"):
        detail = _ok(c.get(f"/api/v1/approvals/{batch['approvalId']}", headers=h[who]))
        assert detail["chain"] == ["coordinator", "principal", "director"]
        assert [(e["action"], e["actorRole"]) for e in detail["events"]] == [("submit", "teacher"), ("approve", "coordinator")]
        assert detail["events"][1]["comment"] == "Checked" and detail["awaitingRole"] == "principal"


def test_an_out_of_band_coordinator_cannot_see_or_decide_and_a_reason_is_required_to_reject(w):
    c, h = w["c"], w["h"]
    batch = _batch(w, "English")
    w["band"](6, 12)
    try:
        assert c.get(f"/api/v1/approvals/{batch['approvalId']}", headers=h["coordinator"]).status_code == 404
        assert c.post(f"/api/v1/approvals/{batch['approvalId']}/decide", json={"decision": "approve"},
                      headers=h["coordinator"]).status_code == 404
    finally:
        w["band"](1, 5)
    refused = c.post(f"/api/v1/approvals/{batch['approvalId']}/decide", json={"decision": "deny", "comment": "  "},
                     headers=h["coordinator"])
    assert refused.status_code == 400
    _ok(c.post(f"/api/v1/approvals/{batch['approvalId']}/decide", json={"decision": "deny", "comment": "Recount"},
               headers=h["coordinator"]))
    assert _ok(c.get(f"/api/v1/marks-batches/{batch['id']}", headers=h["teacher"]))["rejectionReason"] == "Recount"


def test_a_coordinators_own_batch_skips_their_step_and_they_cannot_approve_it(w):
    c, h = w["c"], w["h"]
    made = _ok(c.post("/api/v1/marks-batches", headers=h["coordinator"], json={
        "examId": w["exam"], "subject": "Art", "section": "A", "maxMarks": 10,
        "entries": [{"studentId": w["sid"], "marks": 9}]}), 201)
    sub = _ok(c.post(f"/api/v1/marks-batches/{made['id']}/submit", headers=h["coordinator"]))
    assert sub["awaitingRole"] == "principal"
    own = c.post(f"/api/v1/approvals/{sub['approvalId']}/decide", json={"decision": "approve"}, headers=h["coordinator"])
    assert own.status_code == 403


def test_lesson_plan_chain_from_the_review_screens(w):
    c, h = w["c"], w["h"]
    plan = _plan(w, "Maths")
    appr = plan["approvalId"]
    listed = {p["id"]: p for p in _ok(c.get("/api/v1/lesson-plans", headers=h["coordinator"]))}
    assert listed[plan["id"]]["awaitingRole"] == "coordinator" and listed[plan["id"]]["teacherEmail"] == STAFF["teacher"][0]
    assert c.post(f"/api/v1/approvals/{appr}/decide", json={"decision": "approve"}, headers=h["director"]).status_code == 403
    for who in ("coordinator", "principal", "director"):
        _ok(c.post(f"/api/v1/approvals/{appr}/decide", json={"decision": "approve"}, headers=h[who]))
    after = _ok(c.get(f"/api/v1/lesson-plans/{plan['id']}", headers=h["teacher"]))
    assert after["status"] == "approved"
    history = _ok(c.get(f"/api/v1/approvals/{appr}", headers=h["teacher"]))
    assert [e["actorRole"] for e in history["events"]] == ["teacher", "coordinator", "principal", "director"]


def test_a_lesson_plan_rejection_needs_a_reason_and_returns_to_the_teacher(w):
    c, h = w["c"], w["h"]
    plan = _plan(w, "Science")
    assert c.post(f"/api/v1/approvals/{plan['approvalId']}/decide", json={"decision": "deny"},
                  headers=h["coordinator"]).status_code == 400
    _ok(c.post(f"/api/v1/approvals/{plan['approvalId']}/decide", json={"decision": "deny", "comment": "Add assessment"},
               headers=h["coordinator"]))
    assert _ok(c.get(f"/api/v1/lesson-plans/{plan['id']}", headers=h["teacher"]))["status"] == "denied"
