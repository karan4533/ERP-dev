"""Phase 3A: lesson-plan scope, approval notification recipients, class content, published timetables,
and the Class Attendance options endpoint."""

import os
from datetime import date, timedelta

os.environ["DATABASE_URL"] = "sqlite+pysqlite:///:memory:"
os.environ["OTP_DEBUG"] = "true"
os.environ["JWT_SECRET"] = "test-secret-qmis-erp-academic-phase3a"

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
    "jointdirector": ("jointdirector@qmis.edu", "jd12345678"),
    "coordinator": ("coordinator@qmis.edu", "coord123"),
    "teacher": ("teacher@qmis.edu", "teacher123"),
}
SENIOR = ("coord.senior@qmis.edu", "Staff-Login-2026-z")
PW = "Portal-Phase3a-2026"
FUTURE = (date.today() + timedelta(days=30)).isoformat()
FUTURE_END = (date.today() + timedelta(days=33)).isoformat()
CONTENT = ["home-fun", "study-materials", "sample-questions", "unit-tests", "extra-classes", "online-classes"]


def _ok(response, status=200):
    assert response.status_code == status, response.text
    return response.json()


@pytest.fixture(scope="module")
def w():
    reset_sqlite_memory_schema()
    with TestClient(app) as c:
        h = {who: login_headers(c, *creds) for who, creds in STAFF.items()}
        _ok(c.post("/api/v1/admin/users", headers=h["admin"], json={
            "role": "coordinator", "firstName": "Senior", "lastName": "Coordinator", "email": SENIOR[0],
            "gender": "Female", "mobileNumber": "9876500001", "city": "Madurai", "qualification": "M.Ed",
            "password": SENIOR[1]}), 201)
        h["senior"] = login_headers(c, *SENIOR)
        uid = {o["email"]: o["user_id"] for o in _ok(c.get("/api/v1/masters/class-teacher-options", headers=h["admin"]))}

        sections = {}
        for cls, specs in (("Grade 5", {"A": "teacher@qmis.edu", "B": None}), ("Grade 8", {"A": None, "B": None})):
            row = _ok(c.post("/api/v1/masters/classes", json={"name": cls}, headers=h["admin"]), 201)
            for sec, teacher in specs.items():
                body = {"class_id": row["id"], "name": sec}
                if teacher:
                    body["class_teacher_user_id"] = uid[teacher]
                sections[f"{cls}-{sec}"] = _ok(c.post("/api/v1/masters/sections", json=body, headers=h["admin"]), 201)["id"]

        def enroll(first: str, cls: str, section: str, parent: str, student_login: str | None = None) -> str:
            adm = _ok(c.post("/api/v1/admissions", headers=h["admin"], json={
                "first_name": first, "last_name": "Three", "mobile_number": "9000066666",
                "class_name": cls, "parent_account_email": parent}), 201)
            body = {"parent_account_email": parent, "parent_account_password": PW}
            if student_login:
                body.update({"skip_student_account": False, "student_account_email": student_login,
                             "student_account_password": PW})
            sid = str(_ok(c.post(f"/api/v1/admissions/{adm['id']}/enroll", json=body, headers=h["admin"]))["student_id"])
            _ok(c.post(f"/api/v1/students/{sid}/place", json={"sectionId": sections[f"{cls}-{section}"]}, headers=h["principal"]))
            return sid

        s = {
            "a": enroll("Aditi", "Grade 5", "A", "p3.parent.a@example.com", "p3.student.a@example.com"),
            "c": enroll("Charu", "Grade 5", "B", "p3.parent.c@example.com"),
            "d": enroll("Dev", "Grade 8", "A", "p3.parent.d@example.com"),
        }
        for who, email in (("parent_a", "p3.parent.a@example.com"), ("parent_c", "p3.parent.c@example.com"),
                           ("parent_d", "p3.parent.d@example.com"), ("student_a", "p3.student.a@example.com")):
            h[who] = login_headers(c, email, PW)
        for who, lo, hi in (("coordinator@qmis.edu", 1, 6), (SENIOR[0], 7, 12)):
            _ok(c.put("/api/v1/students/coordinator-grade-bands", headers=h["principal"],
                      json={"userId": uid[who], "gradeFrom": lo, "gradeTo": hi}))
        yield {"c": c, "h": h, "s": s, "uid": uid,
               "names": {"a": "Aditi Three", "c": "Charu Three", "d": "Dev Three"}}


def _plan(w, cls: str, subject: str, *, submit: bool = True) -> dict:
    plan = _ok(w["c"].post("/api/v1/lesson-plans", headers=w["h"]["teacher"], json={
        "className": cls, "section": "A", "subject": subject, "month": "2099-03", "title": f"{subject} plan"}), 201)
    if submit:
        plan = _ok(w["c"].post(f"/api/v1/lesson-plans/{plan['id']}/submit", headers=w["h"]["teacher"]))
    return plan


def _plan_ids(w, who: str) -> set[str]:
    return {p["id"] for p in _ok(w["c"].get("/api/v1/lesson-plans", headers=w["h"][who]))}


def _notifications(entity_id: str) -> list[Notification]:
    with SessionLocal() as db:
        return list(db.scalars(select(Notification).where(Notification.entity_id == entity_id)).all())


def _titles_for(w, who: str, entity_id: str) -> list[str]:
    rows = _ok(w["c"].get("/api/v1/notifications", headers=w["h"][who]))
    return [n["title"] for n in rows if n["entityId"] == entity_id]


# ================================================================ 1. lesson plans

def test_coordinator_lesson_plans_follow_grade_band(w):
    c, h = w["c"], w["h"]
    p5, p8 = _plan(w, "Grade 5", "Maths"), _plan(w, "Grade 8", "Maths")
    assert p5["id"] in _plan_ids(w, "coordinator") and p8["id"] not in _plan_ids(w, "coordinator")
    assert p8["id"] in _plan_ids(w, "senior") and p5["id"] not in _plan_ids(w, "senior")

    hidden = c.get(f"/api/v1/lesson-plans/{p8['id']}", headers=h["coordinator"])
    assert hidden.status_code == 404 and "Maths plan" not in hidden.text
    assert _ok(c.get(f"/api/v1/lesson-plans/{p5['id']}", headers=h["coordinator"]))["className"] == "Grade 5"

    inbox = {a["id"] for a in _ok(c.get("/api/v1/approvals/inbox", headers=h["coordinator"]))}
    assert p5["approvalId"] in inbox and p8["approvalId"] not in inbox
    assert c.get(f"/api/v1/approvals/{p8['approvalId']}", headers=h["coordinator"]).status_code == 404
    assert _ok(c.get("/api/v1/approvals/lookup", params={"entityType": "lesson_plan", "entityId": p8["id"]},
                     headers=h["coordinator"])) == []
    assert c.post(f"/api/v1/approvals/{p8['approvalId']}/decide", json={"decision": "approve"},
                  headers=h["coordinator"]).status_code == 404
    state = _ok(c.get(f"/api/v1/approvals/{p8['approvalId']}", headers=h["principal"]))
    assert state["status"] == "pending" and state["currentLevel"] == 0


def test_lesson_plan_approval_sequence_intact_for_in_scope_coordinators(w):
    c, h = w["c"], w["h"]
    p5, p8 = _plan(w, "Grade 5", "Science"), _plan(w, "Grade 8", "Science")
    assert c.post(f"/api/v1/approvals/{p5['approvalId']}/decide", json={"decision": "approve"},
                  headers=h["principal"]).status_code == 403
    for plan, coordinator in ((p5, "coordinator"), (p8, "senior")):
        for who in (coordinator, "principal", "director"):
            _ok(c.post(f"/api/v1/approvals/{plan['approvalId']}/decide", json={"decision": "approve"}, headers=h[who]))
        assert _ok(c.get(f"/api/v1/lesson-plans/{plan['id']}", headers=h["teacher"]))["status"] == "approved"


def test_leadership_and_owner_lesson_plan_access_preserved(w):
    c, h = w["c"], w["h"]
    p8 = _plan(w, "Grade 8", "English")
    for who in ("principal", "director", "jointdirector", "admin", "teacher"):
        assert p8["id"] in _plan_ids(w, who)
        assert _ok(c.get(f"/api/v1/lesson-plans/{p8['id']}", headers=h[who]))["id"] == p8["id"]
    for who in ("jointdirector", "admin"):  # can read, but are not in the approval chain
        assert c.post(f"/api/v1/approvals/{p8['approvalId']}/decide", json={"decision": "approve"},
                      headers=h[who]).status_code == 403


def test_out_of_scope_coordinator_cannot_submit_or_reach_by_identifier(w):
    c, h = w["c"], w["h"]
    draft8 = _plan(w, "Grade 8", "History", submit=False)
    assert c.post(f"/api/v1/lesson-plans/{draft8['id']}/submit", headers=h["coordinator"]).status_code == 404
    assert _ok(c.get(f"/api/v1/lesson-plans/{draft8['id']}", headers=h["teacher"]))["status"] == "draft"
    for path in ("/api/v1/lesson-plans/00000000-0000-0000-0000-000000000000", f"/api/v1/lesson-plans/{draft8['id']}"):
        assert c.get(path, headers=h["coordinator"]).status_code == 404
    assert c.get("/api/v1/lesson-plans/not-a-uuid", headers=h["coordinator"]).status_code == 422
    for who in ("parent_a", "student_a"):
        assert c.get("/api/v1/lesson-plans", headers=h[who]).status_code == 403


# ================================================================ 2. approval notifications

def test_coordinator_step_notifies_only_in_scope_coordinators(w):
    p5, p8 = _plan(w, "Grade 5", "Art"), _plan(w, "Grade 8", "Art")
    for plan, yes, no in ((p5, "coordinator", "senior"), (p8, "senior", "coordinator")):
        rows = _notifications(plan["id"])
        assert [str(n.user_id) for n in rows] == [w["uid"][STAFF[yes][0] if yes != "senior" else SENIOR[0]]]
        assert all(n.role_code is None for n in rows)
        assert _titles_for(w, yes, plan["id"]) == [f"Approval needed: Lesson plan {plan['className']} Art 2099-03"]
        assert _titles_for(w, no, plan["id"]) == []


def test_next_campus_wide_step_still_uses_role_delivery(w):
    c, h = w["c"], w["h"]
    p5 = _plan(w, "Grade 5", "Music")
    _ok(c.post(f"/api/v1/approvals/{p5['approvalId']}/decide", json={"decision": "approve"}, headers=h["coordinator"]))
    principal_rows = [n for n in _notifications(p5["id"]) if n.role_code == "principal"]
    assert len(principal_rows) == 1 and principal_rows[0].user_id is None
    assert _titles_for(w, "principal", p5["id"]) == ["Approval needed: Lesson plan Grade 5 Music 2099-03"]
    assert _titles_for(w, "senior", p5["id"]) == []

    exam = _ok(c.post("/api/v1/exams", headers=h["principal"], json={
        "name": "Notify Exam", "examType": "MIDTERM", "className": "Grade 8", "startDate": FUTURE, "endDate": FUTURE_END}), 201)
    _ok(c.post(f"/api/v1/exams/{exam['id']}/submit", headers=h["principal"]))
    director_rows = _notifications(exam["id"])
    assert [(n.role_code, n.user_id) for n in director_rows] == [("director", None)]


def test_marks_notifications_reach_only_eligible_coordinator_and_carry_no_student_data(w):
    c, h, s, names = w["c"], w["h"], w["s"], w["names"]
    exam = _ok(c.post("/api/v1/exams", headers=h["principal"], json={
        "name": "Marks Notify", "examType": "MIDTERM", "className": "Grade 8", "startDate": FUTURE, "endDate": FUTURE_END}), 201)
    sub = _ok(c.post(f"/api/v1/exams/{exam['id']}/submit", headers=h["principal"]))
    _ok(c.post(f"/api/v1/approvals/{sub['approvalId']}/decide", json={"decision": "approve"}, headers=h["director"]))

    batch = _ok(c.post("/api/v1/marks-batches", headers=h["teacher"], json={
        "examId": exam["id"], "subject": "Physics", "section": "A", "maxMarks": 100,
        "entries": [{"studentId": s["d"], "marks": 87}]}), 201)
    _ok(c.post(f"/api/v1/marks-batches/{batch['id']}/submit", headers=h["teacher"]))
    rows = _notifications(batch["id"])
    assert [str(n.user_id) for n in rows] == [w["uid"][SENIOR[0]]]
    assert _titles_for(w, "coordinator", batch["id"]) == []
    for n in rows:
        text = f"{n.title} {n.body}"
        assert names["d"] not in text and "87" not in text and s["d"] not in text

    # A coordinator's own batch skips the coordinator step (Phase 4): the principal is told, no coordinator is.
    own = _ok(c.post("/api/v1/marks-batches", headers=h["senior"], json={
        "examId": exam["id"], "subject": "Chemistry", "section": "A", "maxMarks": 100,
        "entries": [{"studentId": s["d"], "marks": 70}]}), 201)
    _ok(c.post(f"/api/v1/marks-batches/{own['id']}/submit", headers=h["senior"]))
    assert [(n.role_code, n.user_id) for n in _notifications(own["id"])] == [("principal", None)]


# ================================================================ 3. class content

def _content_items(collection: str) -> list[dict]:
    return [
        {"id": f"{collection}-5A", "className": "Grade 5", "section": "A", "title": "for 5A"},
        {"id": f"{collection}-5B", "className": "Grade 5", "section": "B", "title": "for 5B"},
        {"id": f"{collection}-8A", "className": "Grade 8", "section": "A", "title": "for 8A"},
        {"id": f"{collection}-V-a", "className": "V", "section": "a", "title": "5A spelt V/a"},
        {"id": f"{collection}-noclass", "section": "A", "title": "no class"},
        {"id": f"{collection}-nosection", "className": "Grade 5", "section": "", "title": "no section"},
    ]


@pytest.mark.parametrize("collection", CONTENT)
def test_class_content_scoped_to_childs_class_and_section(w, collection):
    c, h = w["c"], w["h"]
    # Seed campus-wide via principal; teachers may only mutate their allocated classes.
    _ok(c.put(f"/api/v1/academics/{collection}", json=_content_items(collection), headers=h["principal"]))
    try:
        ids = lambda who: {i["id"] for i in _ok(c.get(f"/api/v1/academics/{collection}", headers=h[who]))}  # noqa: E731
        assert ids("parent_a") == {f"{collection}-5A", f"{collection}-V-a"}
        assert ids("student_a") == {f"{collection}-5A", f"{collection}-V-a"}
        assert ids("parent_c") == {f"{collection}-5B"}
        assert ids("parent_d") == {f"{collection}-8A"}
        # Teacher is Grade 5-A class teacher: 5A + V/a + whole-class Grade 5 (empty section).
        assert ids("teacher") == {
            f"{collection}-5A",
            f"{collection}-V-a",
            f"{collection}-nosection",
        }
        assert len(ids("principal")) == 6
        # Negative: teacher cannot plant Grade 8 content through the academics API.
        denied = c.put(
            f"/api/v1/academics/{collection}",
            json=[{"id": f"{collection}-8A-hack", "className": "Grade 8", "section": "A", "title": "nope"}],
            headers=h["teacher"],
        )
        assert denied.status_code == 403
    finally:
        _ok(c.put(f"/api/v1/academics/{collection}", json=[], headers=h["principal"]))


def test_home_fun_submission_details_never_reach_portal(w):
    c, h, names = w["c"], w["h"], w["names"]
    item = {"id": "HF-T1", "className": "Grade 5", "section": "A", "assignmentTitle": "Leaf collage",
            "studentDetails": {"submitted": [{"studentName": names["c"], "rollNumber": "7"}], "pending": [], "late": []}}
    _ok(c.put("/api/v1/academics/home-fun", json=[item], headers=h["teacher"]))
    try:
        portal = _ok(c.get("/api/v1/academics/home-fun", headers=h["parent_a"]))
        assert [i["id"] for i in portal] == ["HF-T1"] and "studentDetails" not in portal[0]
        assert names["c"] not in str(portal)
        staff = _ok(c.get("/api/v1/academics/home-fun", headers=h["teacher"]))
        assert staff[0]["studentDetails"]["submitted"][0]["studentName"] == names["c"]
    finally:
        _ok(c.put("/api/v1/academics/home-fun", json=[], headers=h["teacher"]))


# ================================================================ 4. published timetables

def test_portal_sees_only_approved_timetable_versions(w):
    c, h = w["c"], w["h"]
    items = [
        {"id": "T-5A-OK", "className": "Grade 5", "section": "A", "approvalStatus": "Approved", "timelines": []},
        {"id": "T-5A-PEND", "className": "Grade 5", "section": "A", "approvalStatus": "Pending", "timelines": []},
        {"id": "T-5A-DENY", "className": "Grade 5", "section": "A", "approvalStatus": "Denied", "rejectionReason": "clash", "timelines": []},
        {"id": "T-5A-NONE", "className": "Grade 5", "section": "A", "timelines": []},
        {"id": "T-8A-PEND", "className": "Grade 8", "section": "A", "approvalStatus": "Pending", "timelines": []},
    ]
    _ok(c.put("/api/v1/academics/class-timetables", json=items, headers=h["principal"]))
    _ok(c.put("/api/v1/academics/class-timetable-change-requests", headers=h["teacher"],
              json=[{"id": "TCR-3A", "timetableId": "T-5A-OK", "reason": "swap"}]))
    try:
        for who in ("parent_a", "student_a"):
            got = _ok(c.get("/api/v1/academics/class-timetables", headers=h[who]))
            assert [t["id"] for t in got] == ["T-5A-OK"] and "clash" not in str(got)
            assert _ok(c.get("/api/v1/academics/class-timetable-change-requests", headers=h[who])) == []
        assert _ok(c.get("/api/v1/academics/class-timetables", headers=h["parent_d"])) == []
        every = {i["id"] for i in items}
        grade5 = {i["id"] for i in items if i["className"] == "Grade 5"}
        # Teacher is class teacher of Grade 5-A only — must not receive Grade 8 rows.
        assert {t["id"] for t in _ok(c.get("/api/v1/academics/class-timetables", headers=h["teacher"]))} == grade5
        # Coordinator band 1-6 includes Grade 5, excludes Grade 8.
        assert {t["id"] for t in _ok(c.get("/api/v1/academics/class-timetables", headers=h["coordinator"]))} == grade5
        assert {t["id"] for t in _ok(c.get("/api/v1/academics/class-timetables", headers=h["senior"]))} == {"T-8A-PEND"}
        for who in ("principal", "director", "admin"):
            assert {t["id"] for t in _ok(c.get("/api/v1/academics/class-timetables", headers=h[who]))} == every
        assert [r["id"] for r in _ok(c.get("/api/v1/academics/class-timetable-change-requests", headers=h["principal"]))] == ["TCR-3A"]
    finally:
        _ok(c.put("/api/v1/academics/class-timetables", json=[], headers=h["principal"]))
        _ok(c.put("/api/v1/academics/class-timetable-change-requests", json=[], headers=h["teacher"]))


# ================================================================ 5. Class Attendance options

def _options(w, who: str):
    return w["c"].get("/api/v1/attendance/my-classes", headers=w["h"][who])


def test_teacher_options_list_only_assigned_sections(w):
    assert _ok(_options(w, "teacher")) == {
        "scoped": True, "classes": [{"className": "Grade 5", "sections": ["A"]}], "substituteDuties": []}
    _ok(w["c"].put("/api/v1/academics/teacher-allocations", headers=w["h"]["principal"], json=[
        {"employeeId": "P3-T1", "email": "teacher@qmis.edu", "status": "Active",
         "mappings": [{"className": "Grade 8", "section": "B", "subject": "Maths"}]}]))
    try:
        assert _ok(_options(w, "teacher"))["classes"] == [
            {"className": "Grade 5", "sections": ["A"]}, {"className": "Grade 8", "sections": ["B"]}]
    finally:
        _ok(w["c"].put("/api/v1/academics/teacher-allocations", json=[], headers=w["h"]["principal"]))
    assert _ok(_options(w, "teacher"))["classes"] == [{"className": "Grade 5", "sections": ["A"]}]


def test_coordinator_and_leadership_options(w):
    assert _ok(_options(w, "coordinator"))["classes"] == [{"className": "Grade 5", "sections": ["A", "B"]}]
    assert _ok(_options(w, "senior"))["classes"] == [{"className": "Grade 8", "sections": ["A", "B"]}]
    full = [{"className": "Grade 5", "sections": ["A", "B"]}, {"className": "Grade 8", "sections": ["A", "B"]}]
    for who in ("principal", "admin"):
        assert _ok(_options(w, who)) == {"scoped": False, "classes": full, "substituteDuties": []}
    for who in ("parent_a", "student_a"):
        assert _options(w, who).status_code == 403


def test_every_listed_option_loads_and_unlisted_ones_are_refused(w):
    c, h, s = w["c"], w["h"], w["s"]
    day = "2026-10-23"
    for option in _ok(_options(w, "teacher"))["classes"]:
        for section in option["sections"]:
            r = c.get("/api/v1/attendance", headers=h["teacher"],
                      params={"date": day, "className": option["className"], "section": section, "roster": True})
            assert r.status_code == 200 and {x["studentId"] for x in r.json()} == {s["a"]}
    assert c.get("/api/v1/attendance", headers=h["teacher"],
                 params={"date": day, "className": "Grade 5", "section": "B", "roster": True}).status_code == 403
    refused = c.post("/api/v1/attendance", headers=h["teacher"], json={
        "date": day, "className": "Grade 8", "section": "A", "marks": [{"studentId": s["d"], "status": "Present"}]})
    assert refused.status_code == 403
    assert _ok(c.get("/api/v1/attendance", params={"date": day}, headers=h["admin"])) == []


def test_teacher_without_assignments_gets_no_options(w):
    c, h = w["c"], w["h"]
    classes = _ok(c.get("/api/v1/masters/classes", headers=h["admin"]))
    g5 = next(x["id"] for x in classes if x["name"] == "Grade 5")
    sec_a = next(x["id"] for x in _ok(c.get(f"/api/v1/masters/sections?class_id={g5}", headers=h["admin"])) if x["name"] == "A")
    _ok(c.patch(f"/api/v1/masters/sections/{sec_a}", json={"class_teacher_user_id": None}, headers=h["admin"]))
    try:
        assert _ok(_options(w, "teacher")) == {"scoped": True, "classes": [], "substituteDuties": []}
    finally:
        _ok(c.patch(f"/api/v1/masters/sections/{sec_a}",
                    json={"class_teacher_user_id": w["uid"]["teacher@qmis.edu"]}, headers=h["admin"]))
