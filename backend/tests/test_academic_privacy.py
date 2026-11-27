"""Academic privacy: results and attendance are visible only to the child's family and scoped staff."""

import os
from datetime import date, timedelta

os.environ["DATABASE_URL"] = "sqlite+pysqlite:///:memory:"
os.environ["OTP_DEBUG"] = "true"
os.environ["JWT_SECRET"] = "test-secret-qmis-erp-academic-privacy"

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
PARENT_PW = "Parent-Privacy-2026"
STUDENT_PW = "Student-Privacy-2026"
DAY = "2026-10-12"
FUTURE = (date.today() + timedelta(days=30)).isoformat()
FUTURE_END = (date.today() + timedelta(days=33)).isoformat()


def _ok(response, status=200):
    assert response.status_code == status, response.text
    return response.json()


@pytest.fixture(scope="module")
def world():
    reset_sqlite_memory_schema()
    with TestClient(app) as client:
        h = {who: login_headers(client, *creds) for who, creds in STAFF.items()}

        cls = _ok(client.post("/api/v1/masters/classes", json={"name": "Grade 5"}, headers=h["admin"]), 201)
        options = _ok(client.get("/api/v1/masters/class-teacher-options", headers=h["admin"]))
        teacher_id = next(o["user_id"] for o in options if o["email"] == "teacher@qmis.edu")
        coordinator_id = next(o["user_id"] for o in options if o["email"] == "coordinator@qmis.edu")
        sec_a = _ok(client.post("/api/v1/masters/sections", headers=h["admin"],
                                json={"class_id": cls["id"], "name": "A", "class_teacher_user_id": teacher_id}), 201)
        sec_b = _ok(client.post("/api/v1/masters/sections", headers=h["admin"],
                                json={"class_id": cls["id"], "name": "B"}), 201)

        def enroll(first: str, parent: str, student_login: str | None = None) -> str:
            adm = _ok(client.post("/api/v1/admissions", headers=h["admin"], json={
                "first_name": first, "last_name": "Privacy", "mobile_number": "9000044444",
                "class_name": "Grade 5", "parent_account_email": parent}), 201)
            body = {"parent_account_email": parent, "parent_account_password": PARENT_PW}
            if student_login:
                body.update({"skip_student_account": False, "student_account_email": student_login,
                             "student_account_password": STUDENT_PW})
            return str(_ok(client.post(f"/api/v1/admissions/{adm['id']}/enroll", json=body, headers=h["admin"]))["student_id"])

        a = enroll("Anya", "privacy.parent.a@example.com", "privacy.student.a@example.com")
        b = enroll("Bodhi", "privacy.parent.b@example.com", "privacy.student.b@example.com")
        c = enroll("Chitra", "privacy.parent.c@example.com")
        for sid, section in ((a, sec_a), (b, sec_a), (c, sec_b)):
            _ok(client.post(f"/api/v1/students/{sid}/place", json={"sectionId": section["id"]}, headers=h["principal"]))
        # Coordinators approve marks only inside their grade band.
        _ok(client.put("/api/v1/students/coordinator-grade-bands", headers=h["principal"],
                       json={"userId": coordinator_id, "gradeFrom": 1, "gradeTo": 12}))

        exam = _ok(client.post("/api/v1/exams", headers=h["principal"], json={
            "name": "Privacy Midterm", "examType": "MIDTERM", "className": "Grade 5",
            "startDate": FUTURE, "endDate": FUTURE_END}), 201)
        submitted = _ok(client.post(f"/api/v1/exams/{exam['id']}/submit", headers=h["principal"]))
        _ok(client.post(f"/api/v1/approvals/{submitted['approvalId']}/decide", json={"decision": "approve"}, headers=h["director"]))

        for section, entries in (("A", [(a, 81), (b, 64)]), ("B", [(c, 92)])):
            batch = _ok(client.post("/api/v1/marks-batches", headers=h["teacher"], json={
                "examId": exam["id"], "subject": "Mathematics", "section": section, "maxMarks": 100,
                "entries": [{"studentId": sid, "marks": m} for sid, m in entries]}), 201)
            sent = _ok(client.post(f"/api/v1/marks-batches/{batch['id']}/submit", headers=h["teacher"]))
            for who in ("coordinator", "principal", "director"):
                _ok(client.post(f"/api/v1/approvals/{sent['approvalId']}/decide", json={"decision": "approve"}, headers=h[who]))

        for section, sids in (("A", [a, b]), ("B", [c])):
            _ok(client.post("/api/v1/attendance", headers=h["admin"], json={
                "date": DAY, "className": "Grade 5", "section": section,
                "marks": [{"studentId": sid, "status": "Present"} for sid in sids]}))

        h["parent_a"] = login_headers(client, "privacy.parent.a@example.com", PARENT_PW)
        h["parent_b"] = login_headers(client, "privacy.parent.b@example.com", PARENT_PW)
        h["student_a"] = login_headers(client, "privacy.student.a@example.com", STUDENT_PW)
        yield {
            "client": client, "h": h, "a": a, "b": b, "c": c, "exam": exam["id"],
            "coordinator_id": coordinator_id, "teacher_id": teacher_id,
            "names": {"a": "Anya Privacy", "b": "Bodhi Privacy", "c": "Chitra Privacy"},
        }


def _no_names(response, *names: str) -> None:
    for name in names:
        assert name not in response.text, f"{name} leaked in {response.status_code} response"


# ---- per-student results -------------------------------------------------------------------

def test_parent_reads_only_linked_child_results(world):
    c, h, n = world["client"], world["h"], world["names"]
    mine = _ok(c.get(f"/api/v1/results/students/{world['a']}", headers=h["parent_a"]))
    assert mine["studentId"] == world["a"] and mine["studentName"] == n["a"]
    exam = mine["exams"][0]
    assert exam["total"] == 81 and exam["percentage"] == 81.0
    assert exam["subjects"] == [{"subject": "Mathematics", "marks": 81.0, "maxMarks": 100.0, "absent": False}]
    assert exam["rank"] == 2  # class-wide rank (C scored 92) without exposing who outranked them

    other = c.get(f"/api/v1/results/students/{world['b']}", headers=h["parent_a"])
    assert other.status_code == 404
    _no_names(other, n["b"])
    assert "64" not in other.text


def test_student_reads_self_but_not_another_student(world):
    c, h, n = world["client"], world["h"], world["names"]
    assert _ok(c.get(f"/api/v1/results/students/{world['a']}", headers=h["student_a"]))["studentName"] == n["a"]
    for target in (world["b"], world["c"]):
        denied = c.get(f"/api/v1/results/students/{target}", headers=h["student_a"])
        assert denied.status_code == 404
        _no_names(denied, n["b"], n["c"])


def test_assigned_teacher_reads_results_unassigned_is_denied(world):
    c, h, n = world["client"], world["h"], world["names"]
    assigned = _ok(c.get(f"/api/v1/results/students/{world['a']}", headers=h["teacher"]))
    assert assigned["studentName"] == n["a"] and assigned["exams"][0]["total"] == 81

    denied = c.get(f"/api/v1/results/students/{world['c']}", headers=h["teacher"])
    assert denied.status_code == 403
    assert denied.json()["detail"]["code"] == "forbidden"
    _no_names(denied, n["c"])
    assert "92" not in denied.text
    # Same rule as the student record itself.
    assert c.get(f"/api/v1/students/{world['c']}", headers=h["teacher"]).status_code == 403


def test_teacher_access_follows_allocation_changes(world):
    c, h = world["client"], world["h"]
    allocation = [{"employeeId": "PRIV-T1", "email": "teacher@qmis.edu", "status": "Active",
                   "mappings": [{"className": "Grade 5", "section": "B", "subject": "Mathematics"}]}]
    _ok(c.put("/api/v1/academics/teacher-allocations", json=allocation, headers=h["principal"]))
    try:
        granted = _ok(c.get(f"/api/v1/results/students/{world['c']}", headers=h["teacher"]))
        assert granted["exams"][0]["total"] == 92
    finally:
        _ok(c.put("/api/v1/academics/teacher-allocations", json=[], headers=h["principal"]))
    assert c.get(f"/api/v1/results/students/{world['c']}", headers=h["teacher"]).status_code == 403


def test_coordinator_results_follow_grade_band(world):
    c, h = world["client"], world["h"]
    band = {"userId": world["coordinator_id"], "gradeFrom": 1, "gradeTo": 4}
    _ok(c.put("/api/v1/students/coordinator-grade-bands", json=band, headers=h["principal"]))
    try:
        assert c.get(f"/api/v1/results/students/{world['a']}", headers=h["coordinator"]).status_code == 403
        _ok(c.put("/api/v1/students/coordinator-grade-bands", json={**band, "gradeTo": 6}, headers=h["principal"]))
        assert _ok(c.get(f"/api/v1/results/students/{world['a']}", headers=h["coordinator"]))["exams"][0]["total"] == 81
    finally:
        _ok(c.put("/api/v1/students/coordinator-grade-bands", json={**band, "gradeTo": 12}, headers=h["principal"]))


def test_leadership_keeps_campus_wide_results(world):
    c, h = world["client"], world["h"]
    for who in ("admin", "principal", "director"):
        assert _ok(c.get(f"/api/v1/results/students/{world['c']}", headers=h[who]))["exams"][0]["total"] == 92


# ---- whole-class result table ---------------------------------------------------------------

def test_parents_and_students_cannot_read_class_result_table(world):
    c, h, n = world["client"], world["h"], world["names"]
    for who in ("parent_a", "parent_b", "student_a"):
        denied = c.get(f"/api/v1/exams/{world['exam']}/results", headers=h[who])
        assert denied.status_code == 403, who
        _no_names(denied, n["a"], n["b"], n["c"])
        assert "ADM-" not in denied.text and "results" not in denied.json()


def test_teacher_class_table_is_limited_to_assigned_students(world):
    c, h, n = world["client"], world["h"], world["names"]
    table = _ok(c.get(f"/api/v1/exams/{world['exam']}/results", headers=h["teacher"]))
    rows = {r["studentId"]: r for r in table["results"]}
    assert set(rows) == {world["a"], world["b"]}
    assert rows[world["a"]]["rank"] == 2 and rows[world["b"]]["rank"] == 3
    assert n["c"] not in str(table["results"])


def test_teacher_denied_class_table_for_unassigned_class(world):
    c, h, n = world["client"], world["h"], world["names"]
    _ok(c.patch(f"/api/v1/masters/sections/{_section_id(world, 'A')}", json={"class_teacher_user_id": None}, headers=h["admin"]))
    try:
        denied = c.get(f"/api/v1/exams/{world['exam']}/results", headers=h["teacher"])
        assert denied.status_code == 403
        _no_names(denied, n["a"], n["b"], n["c"])
    finally:
        _ok(c.patch(f"/api/v1/masters/sections/{_section_id(world, 'A')}",
                    json={"class_teacher_user_id": world["teacher_id"]}, headers=h["admin"]))


def test_principal_class_table_is_complete(world):
    c, h = world["client"], world["h"]
    table = _ok(c.get(f"/api/v1/exams/{world['exam']}/results", headers=h["principal"]))
    assert [r["studentId"] for r in table["results"]] == [world["c"], world["a"], world["b"]]
    assert table["classHigh"] == {"Mathematics": 92.0}


def _section_id(world, name: str) -> str:
    c, h = world["client"], world["h"]
    classes = _ok(c.get("/api/v1/masters/classes", headers=h["admin"]))
    class_id = next(x["id"] for x in classes if x["name"] == "Grade 5")
    sections = _ok(c.get(f"/api/v1/masters/sections?class_id={class_id}", headers=h["admin"]))
    return next(s["id"] for s in sections if s["name"] == name)


# ---- attendance ---------------------------------------------------------------------------

@pytest.mark.parametrize("who", ["parent_a", "student_a"])
@pytest.mark.parametrize(
    "params",
    [
        {"date": DAY},
        {"date": DAY, "className": "Grade 5"},
        {"date": DAY, "className": "Grade 5", "section": "B"},
        {"date": DAY, "className": "Grade 5", "roster": True},
        {"date": DAY, "className": "5", "section": "A", "roster": True},
        {"date": DAY, "className": "V", "roster": True},
    ],
)
def test_portal_roles_cannot_list_class_attendance(world, who, params):
    c, h, n = world["client"], world["h"], world["names"]
    denied = c.get("/api/v1/attendance", params=params, headers=h[who])
    assert denied.status_code == 403
    _no_names(denied, n["a"], n["b"], n["c"])
    assert "studentId" not in denied.text


def test_staff_attendance_lists_unchanged(world):
    c, h = world["client"], world["h"]
    roster = _ok(c.get("/api/v1/attendance", params={"date": DAY, "className": "Grade 5", "roster": True}, headers=h["admin"]))
    assert {r["studentId"] for r in roster} == {world["a"], world["b"], world["c"]}
    marks = _ok(c.get("/api/v1/attendance", params={"date": DAY}, headers=h["teacher"]))
    assert {r["attendanceStatus"] for r in marks} == {"Present"}


def test_attendance_calendar_scoping(world):
    c, h, n = world["client"], world["h"], world["names"]
    q = "?year=2026&month=10"
    assert _ok(c.get(f"/api/v1/attendance/students/{world['a']}/calendar{q}", headers=h["parent_a"])) == {DAY: "P"}
    assert _ok(c.get(f"/api/v1/attendance/students/{world['a']}/calendar{q}", headers=h["student_a"])) == {DAY: "P"}
    for who, target in (("parent_a", "b"), ("parent_a", "c"), ("student_a", "b"), ("parent_b", "a")):
        denied = c.get(f"/api/v1/attendance/students/{world[target]}/calendar{q}", headers=h[who])
        assert denied.status_code == 404, (who, target)
        assert DAY not in denied.text
    assert _ok(c.get(f"/api/v1/attendance/students/{world['a']}/calendar{q}", headers=h["teacher"])) == {DAY: "P"}
    denied = c.get(f"/api/v1/attendance/students/{world['c']}/calendar{q}", headers=h["teacher"])
    assert denied.status_code == 403 and DAY not in denied.text
    assert _ok(c.get(f"/api/v1/attendance/students/{world['c']}/calendar{q}", headers=h["principal"])) == {DAY: "P"}


# ---- alternative endpoints and tampered identifiers ----------------------------------------

def test_alternative_endpoints_stay_closed_to_portal_roles(world):
    c, h, n = world["client"], world["h"], world["names"]
    for who in ("parent_a", "student_a"):
        for path in (
            "/api/v1/marks-batches",
            f"/api/v1/marks-batches?examId={world['exam']}",
            "/api/v1/students",
            f"/api/v1/students/{world['b']}",
            "/api/v1/students?className=Grade 5",
        ):
            denied = c.get(path, headers=h[who])
            assert denied.status_code == 403, (who, path)
            _no_names(denied, n["b"], n["c"])
    kids = _ok(c.get("/api/v1/parents/me/children", headers=h["parent_a"]))
    assert [k["id"] for k in kids] == [world["a"]]


def test_tampered_or_unknown_identifiers_reveal_nothing(world):
    c, h = world["client"], world["h"]
    unknown = "00000000-0000-0000-0000-000000000000"
    for who in ("parent_a", "student_a", "teacher"):
        assert c.get(f"/api/v1/results/students/{unknown}", headers=h[who]).status_code == 404
        assert c.get(f"/api/v1/attendance/students/{unknown}/calendar?year=2026&month=10", headers=h[who]).status_code == 404
    assert c.get(f"/api/v1/exams/{unknown}/results", headers=h["parent_a"]).status_code == 403
    assert c.get(f"/api/v1/exams/{unknown}/results", headers=h["principal"]).status_code == 404
    assert c.get("/api/v1/results/students/not-a-uuid", headers=h["parent_a"]).status_code == 422
