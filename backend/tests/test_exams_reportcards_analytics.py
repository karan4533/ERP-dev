"""Exam timetable flow + permissions, Principal exam access, term report cards, grade-wise analytics
and CA/RCT record authorization (isolated SQLite).

Sample marks (published through Coordinator -> Principal -> Director):

Grade 6 (no weightage)            CA (max 20)        MIDTERM (max 80)
  Asha  (6-A)  Maths / Science    18 / 15            70 / 62
  Bala  (6-A)  Maths / Science     6 / absent        20 / 36
  Chitra(6-B)  Maths              10                 50

Grade 7 (weightage CA 40, MIDTERM 60)
  Dev   (7-A)  Maths / Science    18 / 10            40 / 64
"""

import os
from datetime import date, timedelta

os.environ["DATABASE_URL"] = "sqlite+pysqlite:///:memory:"
os.environ["OTP_DEBUG"] = "true"
os.environ["JWT_SECRET"] = "test-secret-qmis-erp-reportcards"

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
    "accounthead": ("accounthead@qmis.edu", "accounts123"),
}
PARENT_PW = "Parent-ReportCard-2026"
STUDENT_PW = "Student-ReportCard-2026"
FUTURE = (date.today() + timedelta(days=40)).isoformat()
FUTURE_END = (date.today() + timedelta(days=44)).isoformat()


def _ok(response, status=200):
    assert response.status_code == status, response.text
    return response.json()


@pytest.fixture(scope="module")
def world():
    reset_sqlite_memory_schema()
    with TestClient(app) as c:
        h = {who: login_headers(c, *creds) for who, creds in STAFF.items()}
        options = _ok(c.get("/api/v1/masters/class-teacher-options", headers=h["admin"]))
        teacher_id = next(o["user_id"] for o in options if o["email"] == "teacher@qmis.edu")
        coordinator_id = next(o["user_id"] for o in options if o["email"] == "coordinator@qmis.edu")

        sections = {}
        for cls, secs in (("Grade 6", ("A", "B")), ("Grade 7", ("A",)), ("Grade 11", ("A",))):
            row = _ok(c.post("/api/v1/masters/classes", json={"name": cls}, headers=h["admin"]), 201)
            for sec in secs:
                body = {"class_id": row["id"], "name": sec}
                # The teacher is class teacher of 6-A and 7-A only.
                if (cls, sec) in {("Grade 6", "A"), ("Grade 7", "A")}:
                    body["class_teacher_user_id"] = teacher_id
                sections[(cls, sec)] = _ok(c.post("/api/v1/masters/sections", json=body, headers=h["admin"]), 201)["id"]

        def enroll(first, cls, sec, parent, student_login=None):
            adm = _ok(c.post("/api/v1/admissions", headers=h["admin"], json={
                "first_name": first, "last_name": "Card", "mobile_number": "9000055555",
                "class_name": cls, "parent_account_email": parent}), 201)
            body = {"parent_account_email": parent, "parent_account_password": PARENT_PW}
            if student_login:
                body.update({"skip_student_account": False, "student_account_email": student_login,
                             "student_account_password": STUDENT_PW})
            sid = str(_ok(c.post(f"/api/v1/admissions/{adm['id']}/enroll", json=body, headers=h["admin"]))["student_id"])
            _ok(c.post(f"/api/v1/students/{sid}/place", json={"sectionId": sections[(cls, sec)]}, headers=h["principal"]))
            return sid

        s = {
            "asha": enroll("Asha", "Grade 6", "A", "rc.parent.asha@example.com", "rc.student.asha@example.com"),
            "bala": enroll("Bala", "Grade 6", "A", "rc.parent.bala@example.com"),
            "chitra": enroll("Chitra", "Grade 6", "B", "rc.parent.chitra@example.com"),
            "dev": enroll("Dev", "Grade 7", "A", "rc.parent.dev@example.com"),
            "esha": enroll("Esha", "Grade 11", "A", "rc.parent.esha@example.com"),
        }
        _ok(c.put("/api/v1/students/coordinator-grade-bands", headers=h["principal"],
                  json={"userId": coordinator_id, "gradeFrom": 1, "gradeTo": 8}))
        _ok(c.put("/api/v1/exam-weightage", params={"className": "Grade 7"}, headers=h["director"],
                  json={"weights": [{"examType": "CA", "weight": 40}, {"examType": "MIDTERM", "weight": 60}]}))

        def approved_exam(name, exam_type, cls):
            exam = _ok(c.post("/api/v1/exams", headers=h["principal"], json={
                "name": name, "examType": exam_type, "className": cls, "academicYear": "2026-27",
                "startDate": FUTURE, "endDate": FUTURE_END}), 201)
            sub = _ok(c.post(f"/api/v1/exams/{exam['id']}/submit", headers=h["principal"]))
            _ok(c.post(f"/api/v1/approvals/{sub['approvalId']}/decide", json={"decision": "approve"}, headers=h["director"]))
            return exam["id"]

        exams = {
            "ca6": approved_exam("CA G6", "CA", "Grade 6"),
            "mid6": approved_exam("Mid G6", "MIDTERM", "Grade 6"),
            "ca7": approved_exam("CA G7", "CA", "Grade 7"),
            "mid7": approved_exam("Mid G7", "MIDTERM", "Grade 7"),
        }

        def publish(exam_id, subject, section, max_marks, entries):
            batch = _ok(c.post("/api/v1/marks-batches", headers=h["teacher"], json={
                "examId": exam_id, "subject": subject, "section": section, "maxMarks": max_marks,
                "entries": [
                    {"studentId": s[who], "absent": True} if marks is None else {"studentId": s[who], "marks": marks}
                    for who, marks in entries
                ]}), 201)
            sent = _ok(c.post(f"/api/v1/marks-batches/{batch['id']}/submit", headers=h["teacher"]))
            for who in ("coordinator", "principal", "director"):
                _ok(c.post(f"/api/v1/approvals/{sent['approvalId']}/decide", json={"decision": "approve"}, headers=h[who]))
            return batch["id"]

        batches = {
            "ca6_maths_a": publish(exams["ca6"], "Maths", "A", 20, [("asha", 18), ("bala", 6)]),
            "ca6_sci_a": publish(exams["ca6"], "Science", "A", 20, [("asha", 15), ("bala", None)]),
            "mid6_maths_a": publish(exams["mid6"], "Maths", "A", 80, [("asha", 70), ("bala", 20)]),
            "mid6_sci_a": publish(exams["mid6"], "Science", "A", 80, [("asha", 62), ("bala", 36)]),
            "ca6_maths_b": publish(exams["ca6"], "Maths", "B", 20, [("chitra", 10)]),
            "mid6_maths_b": publish(exams["mid6"], "Maths", "B", 80, [("chitra", 50)]),
            "ca7_maths": publish(exams["ca7"], "Maths", "A", 20, [("dev", 18)]),
            "ca7_sci": publish(exams["ca7"], "Science", "A", 20, [("dev", 10)]),
            "mid7_maths": publish(exams["mid7"], "Maths", "A", 80, [("dev", 40)]),
            "mid7_sci": publish(exams["mid7"], "Science", "A", 80, [("dev", 64)]),
        }

        h["parent_asha"] = login_headers(c, "rc.parent.asha@example.com", PARENT_PW)
        h["student_asha"] = login_headers(c, "rc.student.asha@example.com", STUDENT_PW)
        yield {"c": c, "h": h, "s": s, "exams": exams, "batches": batches}


def _card(world, who, student, **params):
    c, h, s = world["c"], world["h"], world["s"]
    return c.get(f"/api/v1/report-cards/students/{s[student]}", params=params, headers=h[who])


def _subjects(card):
    return {row["subject"]: row for row in card["subjects"]}


# ---- #6b report card: exact aggregation ------------------------------------------------------

def test_report_card_raw_term_totals_grades_and_result(world):
    card = _ok(_card(world, "principal", "asha", examTypes="CA,MIDTERM", term="Term 1"))
    assert card["weighting"] == "raw" and card["weights"] == []
    assert card["term"] == "Term 1" and card["examTypes"] == ["CA", "MIDTERM"]
    assert card["className"] == "Grade 6" and card["section"] == "A"
    subjects = _subjects(card)
    assert (subjects["Maths"]["obtained"], subjects["Maths"]["maxMarks"]) == (88.0, 100.0)
    assert (subjects["Maths"]["percentage"], subjects["Maths"]["grade"], subjects["Maths"]["result"]) == (88.0, "A", "Pass")
    assert (subjects["Science"]["obtained"], subjects["Science"]["maxMarks"]) == (77.0, 100.0)
    assert (subjects["Science"]["percentage"], subjects["Science"]["grade"]) == (77.0, "B+")
    assert card["overall"] == {"obtained": 165.0, "maxMarks": 200.0, "percentage": 82.5, "grade": "A", "result": "Pass"}
    assert card["gradingRule"]["passMarkPercent"] == 33.0
    assert card["gradingRule"]["confirmedByClient"] is False


def test_report_card_absent_paper_and_failed_subject_fail_overall(world):
    card = _ok(_card(world, "principal", "bala", examTypes="CA,MIDTERM"))
    subjects = _subjects(card)
    assert (subjects["Maths"]["obtained"], subjects["Maths"]["percentage"]) == (26.0, 26.0)
    assert (subjects["Maths"]["grade"], subjects["Maths"]["result"]) == ("F", "Fail")
    # CA Science absent: counted in neither marks nor maximum.
    assert (subjects["Science"]["obtained"], subjects["Science"]["maxMarks"]) == (36.0, 80.0)
    assert (subjects["Science"]["percentage"], subjects["Science"]["grade"], subjects["Science"]["result"]) == (45.0, "D", "Pass")
    absent = [r for r in subjects["Science"]["components"] if r["absent"]]
    assert len(absent) == 1 and absent[0]["examType"] == "CA"
    # 62 / 180 = 34.44 % is above the pass mark, but a failed subject fails the card.
    assert card["overall"] == {"obtained": 62.0, "maxMarks": 180.0, "percentage": 34.44, "grade": "D", "result": "Fail"}


def test_report_card_term_selects_exam_types(world):
    card = _ok(_card(world, "principal", "asha", examTypes="CA"))
    subjects = _subjects(card)
    assert (subjects["Maths"]["percentage"], subjects["Maths"]["grade"]) == (90.0, "A+")
    assert (subjects["Science"]["percentage"], subjects["Science"]["grade"]) == (75.0, "B+")
    assert card["overall"]["percentage"] == 82.5 and card["overall"]["obtained"] == 33.0
    assert [e["examType"] for e in card["exams"]] == ["CA"]
    # Same exams through an equivalent academic-year label.
    by_year = _ok(_card(world, "principal", "asha", academicYear="2026 - 2027", examTypes="CA"))
    assert by_year["overall"]["percentage"] == 82.5
    assert _card(world, "principal", "asha", examTypes="NOPE").status_code == 400


def test_report_card_uses_director_weightage(world):
    card = _ok(_card(world, "principal", "dev", examTypes="CA,MIDTERM"))
    assert card["weighting"] == "weighted"
    assert card["weights"] == [{"examType": "CA", "weight": 40.0}, {"examType": "MIDTERM", "weight": 60.0}]
    subjects = _subjects(card)
    # Maths: 0.4 * 90 + 0.6 * 50 = 66 ; Science: 0.4 * 50 + 0.6 * 80 = 68
    assert (subjects["Maths"]["percentage"], subjects["Maths"]["grade"]) == (66.0, "B")
    assert (subjects["Science"]["percentage"], subjects["Science"]["grade"]) == (68.0, "B")
    assert (subjects["Maths"]["obtained"], subjects["Maths"]["maxMarks"]) == (58.0, 100.0)
    # Overall: CA 28/40 = 70 %, MIDTERM 104/160 = 65 % -> 0.4 * 70 + 0.6 * 65 = 67 (raw would be 66)
    assert card["overall"] == {"obtained": 132.0, "maxMarks": 200.0, "percentage": 67.0, "grade": "B", "result": "Pass"}
    ca_only = _ok(_card(world, "principal", "dev", examTypes="CA"))
    assert ca_only["overall"]["percentage"] == 70.0 and _subjects(ca_only)["Maths"]["percentage"] == 90.0


def test_report_card_empty_selection_has_no_overall(world):
    card = _ok(_card(world, "principal", "esha"))
    assert card["subjects"] == [] and card["overall"] is None and card["exams"] == []


# ---- report card scope ------------------------------------------------------------------------

def test_report_card_family_sees_only_own_child(world):
    assert _ok(_card(world, "parent_asha", "asha"))["studentName"] == "Asha Card"
    assert _ok(_card(world, "student_asha", "asha"))["overall"]["percentage"] == 82.5
    for who in ("parent_asha", "student_asha"):
        denied = _card(world, who, "bala")
        assert denied.status_code == 404 and "Bala" not in denied.text


def test_report_card_staff_scope(world):
    assert _card(world, "teacher", "asha").status_code == 200
    denied = _card(world, "teacher", "chitra")
    assert denied.status_code == 403 and "Chitra" not in denied.text
    assert _card(world, "coordinator", "chitra").status_code == 200
    assert _card(world, "coordinator", "esha").status_code == 403
    assert _card(world, "accounthead", "asha").status_code == 403
    assert world["c"].get(f"/api/v1/report-cards/students/{world['s']['asha']}").status_code == 401


# ---- #60 grade-wise analytics -----------------------------------------------------------------

def _analytics(world, who, **params):
    return world["c"].get("/api/v1/results/analytics", params=params, headers=world["h"][who])


def test_grade_wise_analytics_exact_numbers(world):
    out = _ok(_analytics(world, "principal", className="Grade 6", examTypes="CA,MIDTERM"))
    assert out["studentCount"] == 3
    by_name = {r["studentName"]: r for r in out["students"]}
    assert (by_name["Asha Card"]["percentage"], by_name["Asha Card"]["grade"], by_name["Asha Card"]["result"]) == (82.5, "A", "Pass")
    assert (by_name["Bala Card"]["percentage"], by_name["Bala Card"]["result"]) == (34.44, "Fail")
    assert (by_name["Chitra Card"]["percentage"], by_name["Chitra Card"]["grade"]) == (60.0, "B")
    assert [r["studentName"] for r in out["students"]] == ["Asha Card", "Chitra Card", "Bala Card"]
    # (82.5 + 34.44 + 60) / 3 = 58.98
    assert out["averagePercentage"] == 58.98
    assert (out["highestPercentage"], out["lowestPercentage"]) == (82.5, 34.44)
    assert (out["passCount"], out["failCount"]) == (2, 1)
    assert out["gradeDistribution"] == {"A+": 0, "A": 1, "B+": 0, "B": 1, "C": 0, "D": 1, "F": 0}
    subjects = {r["subject"]: r for r in out["subjects"]}
    # Maths 88, 26, 60 ; Science 77, 45
    assert subjects["Maths"] == {"subject": "Maths", "students": 3, "averagePercentage": 58.0,
                                 "highestPercentage": 88.0, "lowestPercentage": 26.0, "passCount": 2, "failCount": 1}
    assert subjects["Science"]["averagePercentage"] == 61.0 and subjects["Science"]["students"] == 2
    assert out["sections"] == [
        {"section": "A", "students": 2, "averagePercentage": 58.47},
        {"section": "B", "students": 1, "averagePercentage": 60.0},
    ]


def test_analytics_single_exam_and_section_filter(world):
    out = _ok(_analytics(world, "principal", className="Grade 6", examId=world["exams"]["ca6"], section="A"))
    by_name = {r["studentName"]: r["percentage"] for r in out["students"]}
    # CA only: Asha 33/40, Bala 6/20 (Science absent)
    assert by_name == {"Asha Card": 82.5, "Bala Card": 30.0}
    assert [e["examId"] for e in out["exams"]] == [world["exams"]["ca6"]]


def test_analytics_scope_and_empty_state(world):
    teacher = _ok(_analytics(world, "teacher", className="Grade 6"))
    assert {r["studentName"] for r in teacher["students"]} == {"Asha Card", "Bala Card"}
    assert teacher["averagePercentage"] == 58.47
    assert "Chitra" not in _analytics(world, "teacher", className="Grade 6").text
    assert _analytics(world, "teacher", className="Grade 6", section="B").status_code == 403
    assert _ok(_analytics(world, "coordinator", className="Grade 6"))["studentCount"] == 3
    assert _analytics(world, "coordinator", className="Grade 11").status_code == 403
    for who in ("parent_asha", "student_asha", "accounthead"):
        assert _analytics(world, who, className="Grade 6").status_code == 403
    empty = _ok(_analytics(world, "principal", className="Grade 11"))
    assert empty["studentCount"] == 0 and empty["averagePercentage"] is None and empty["subjects"] == []
    weighted = _ok(_analytics(world, "principal", className="Grade 7"))
    assert weighted["weighting"] == "weighted" and weighted["students"][0]["percentage"] == 67.0


# ---- #2 / #59 exam timetable flow and permissions ------------------------------------------------

def _exam_body(cls="Grade 6", name="Timetable flow"):
    return {
        "name": name, "examType": "MIDTERM", "className": cls, "section": "A",
        "startDate": FUTURE, "endDate": FUTURE_END,
        "timelines": [{"day": "Monday", "subject": "Maths", "examDate": FUTURE, "startTime": "09:00", "endTime": "11:00"}],
    }


def test_exam_timetable_reaches_director_and_status_persists(world):
    c, h = world["c"], world["h"]
    exam = _ok(c.post("/api/v1/exams", json=_exam_body(), headers=h["principal"]), 201)
    assert exam["status"] == "draft" and exam["timelines"][0]["subject"] == "Maths"
    sub = _ok(c.post(f"/api/v1/exams/{exam['id']}/submit", headers=h["principal"]))
    assert (sub["status"], sub["awaitingRole"]) == ("submitted", "director")
    inbox = _ok(c.get("/api/v1/approvals/inbox", headers=h["director"]))
    assert any(r["id"] == sub["approvalId"] and r["entityType"] == "exam_timetable" for r in inbox)
    # Only the Director decides an exam timetable.
    for who in ("principal", "coordinator", "teacher"):
        assert c.post(f"/api/v1/approvals/{sub['approvalId']}/decide", json={"decision": "approve"},
                      headers=h[who]).status_code in (403, 404)
    assert c.post(f"/api/v1/approvals/{sub['approvalId']}/decide", json={"decision": "deny"},
                  headers=h["director"]).status_code == 400
    _ok(c.post(f"/api/v1/approvals/{sub['approvalId']}/decide", json={"decision": "deny", "comment": "Clash"},
               headers=h["director"]))
    assert _ok(c.get(f"/api/v1/exams/{exam['id']}", headers=h["principal"]))["status"] == "denied"
    again = _ok(c.post(f"/api/v1/exams/{exam['id']}/submit", headers=h["principal"]))
    _ok(c.post(f"/api/v1/approvals/{again['approvalId']}/decide", json={"decision": "approve"}, headers=h["director"]))
    assert _ok(c.get(f"/api/v1/exams/{exam['id']}", headers=h["principal"]))["status"] == "approved"
    assert c.post(f"/api/v1/exams/{exam['id']}/submit", headers=h["principal"]).status_code == 409


def test_teacher_and_portal_roles_cannot_write_exam_timetables(world):
    c, h = world["c"], world["h"]
    exam_id = world["exams"]["ca6"]
    for who in ("teacher", "parent_asha", "student_asha", "accounthead"):
        assert c.post("/api/v1/exams", json=_exam_body(), headers=h[who]).status_code == 403
        assert c.put(f"/api/v1/exams/{exam_id}", json=_exam_body(), headers=h[who]).status_code == 403
        assert c.post(f"/api/v1/exams/{exam_id}/submit", headers=h[who]).status_code == 403
    assert c.post("/api/v1/exam-types", json={"code": "T59", "name": "x"}, headers=h["teacher"]).status_code == 403
    assert c.put("/api/v1/exam-weightage", params={"className": "Grade 6"}, headers=h["principal"],
                 json={"weights": [{"examType": "CA", "weight": 100}]}).status_code == 403


def test_coordinator_exam_timetable_limited_to_band_and_own_exams(world):
    c, h = world["c"], world["h"]
    own = _ok(c.post("/api/v1/exams", json=_exam_body(name="Coord G6"), headers=h["coordinator"]), 201)
    sub = _ok(c.post(f"/api/v1/exams/{own['id']}/submit", headers=h["coordinator"]))
    assert sub["awaitingRole"] == "director"
    out_of_band = c.post("/api/v1/exams", json=_exam_body(cls="Grade 11", name="Coord G11"), headers=h["coordinator"])
    assert out_of_band.status_code == 403
    principal_exam = _ok(c.post("/api/v1/exams", json=_exam_body(name="Principal draft"), headers=h["principal"]), 201)
    assert c.put(f"/api/v1/exams/{principal_exam['id']}", json=_exam_body(name="Hijack"),
                 headers=h["coordinator"]).status_code == 403
    assert c.post(f"/api/v1/exams/{principal_exam['id']}/submit", headers=h["coordinator"]).status_code == 403
    assert _ok(c.get(f"/api/v1/exams/{principal_exam['id']}", headers=h["principal"]))["name"] == "Principal draft"


def test_exam_with_marks_cannot_be_edited(world):
    c, h = world["c"], world["h"]
    exam_id = world["exams"]["ca6"]
    body = {**_exam_body(name="Renamed"), "examType": "CA"}
    assert c.put(f"/api/v1/exams/{exam_id}", json=body, headers=h["principal"]).status_code == 409
    assert _ok(c.get(f"/api/v1/exams/{exam_id}", headers=h["principal"]))["status"] == "approved"


def test_portal_sees_only_approved_exams_of_own_class(world):
    c, h = world["c"], world["h"]
    draft = _ok(c.post("/api/v1/exams", json=_exam_body(name="Hidden draft"), headers=h["principal"]), 201)
    visible = {e["id"] for e in _ok(c.get("/api/v1/exams", headers=h["parent_asha"]))}
    assert world["exams"]["ca6"] in visible and world["exams"]["ca7"] not in visible
    assert draft["id"] not in visible
    assert c.get(f"/api/v1/exams/{draft['id']}", headers=h["parent_asha"]).status_code == 404


# ---- #6a Principal examination access -------------------------------------------------------------

def test_principal_keeps_exam_and_marks_visibility(world):
    c, h, s = world["c"], world["h"], world["s"]
    exam_ids = {e["id"] for e in _ok(c.get("/api/v1/exams", headers=h["principal"]))}
    assert set(world["exams"].values()) <= exam_ids
    batch_ids = {b["id"] for b in _ok(c.get("/api/v1/marks-batches", headers=h["principal"]))}
    assert set(world["batches"].values()) <= batch_ids
    batch = _ok(c.get(f"/api/v1/marks-batches/{world['batches']['ca6_maths_b']}", headers=h["principal"]))
    assert batch["status"] == "published" and batch["entries"][0]["marks"] == 10
    table = _ok(c.get(f"/api/v1/exams/{world['exams']['mid6']}/results", headers=h["principal"]))
    assert {r["studentName"] for r in table["results"]} == {"Asha Card", "Bala Card", "Chitra Card"}
    assert table["classHigh"] == {"Maths": 70.0, "Science": 62.0}
    assert _ok(c.get(f"/api/v1/results/students/{s['chitra']}", headers=h["principal"]))["exams"]
    assert _card(world, "principal", "chitra").status_code == 200


# ---- #58a CA / RCT records (academics "unit-tests" collection) ------------------------------------

def _ut(item_id, cls, sec, title):
    return {"id": item_id, "className": cls, "section": sec, "subject": "Maths", "title": title,
            "testDate": FUTURE, "totalMarks": 20, "duration": 40}


def test_ca_rct_records_follow_teacher_and_coordinator_scope(world):
    c, h = world["c"], world["h"]
    url = "/api/v1/academics/unit-tests"
    _ok(c.put(url, json=[_ut("UT-6A", "Grade 6", "A", "CA 1 6-A")], headers=h["teacher"]))
    assert c.put(url, json=[_ut("UT-6B-T", "Grade 6", "B", "Not mine")], headers=h["teacher"]).status_code == 403
    assert c.put(url, json=[_ut("UT-11", "Grade 11", "A", "Out of band")], headers=h["coordinator"]).status_code == 403

    current = _ok(c.get(url, headers=h["principal"]))
    _ok(c.put(url, json=[*current, _ut("UT-6B", "Grade 6", "B", "CA 1 6-B")], headers=h["principal"]))

    assert {r["id"] for r in _ok(c.get(url, headers=h["teacher"]))} == {"UT-6A"}
    assert {r["id"] for r in _ok(c.get(url, headers=h["coordinator"]))} == {"UT-6A", "UT-6B"}
    assert {r["id"] for r in _ok(c.get(url, headers=h["parent_asha"]))} == {"UT-6A"}

    # Overwriting an out-of-scope record by id is refused; a scoped empty list cannot delete it.
    assert c.put(url, json=[_ut("UT-6B", "Grade 6", "A", "Takeover")], headers=h["teacher"]).status_code == 403
    _ok(c.put(url, json=[], headers=h["teacher"]))
    remaining = {r["id"]: r for r in _ok(c.get(url, headers=h["principal"]))}
    assert set(remaining) == {"UT-6B"} and remaining["UT-6B"]["title"] == "CA 1 6-B"

    for who in ("parent_asha", "student_asha"):
        assert c.put(url, json=[], headers=h[who]).status_code == 403
    assert c.get(url, headers=h["accounthead"]).status_code == 403
