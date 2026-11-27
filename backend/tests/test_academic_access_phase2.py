"""Phase 2 academic access: attendance assignments, coordinator marks scope, exam/timetable visibility."""

import os
from datetime import date, timedelta

os.environ["DATABASE_URL"] = "sqlite+pysqlite:///:memory:"
os.environ["OTP_DEBUG"] = "true"
os.environ["JWT_SECRET"] = "test-secret-qmis-erp-academic-phase2"

import pytest
from fastapi.testclient import TestClient

from app.main import app
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
PW = "Portal-Phase2-2026"
DAY = "2026-10-14"
FUTURE = (date.today() + timedelta(days=30)).isoformat()
FUTURE_END = (date.today() + timedelta(days=33)).isoformat()


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

        def make_class(name: str, sections: dict[str, str | None]) -> dict[str, str]:
            cls = _ok(c.post("/api/v1/masters/classes", json={"name": name}, headers=h["admin"]), 201)
            out = {}
            for sec, teacher_email in sections.items():
                body = {"class_id": cls["id"], "name": sec}
                if teacher_email:
                    body["class_teacher_user_id"] = uid[teacher_email]
                out[sec] = _ok(c.post("/api/v1/masters/sections", json=body, headers=h["admin"]), 201)["id"]
            return out

        g5 = make_class("Grade 5", {"A": "teacher@qmis.edu", "B": None})
        g8 = make_class("Grade 8", {"A": None})

        def enroll(first: str, cls: str, parent: str, student_login: str | None = None) -> str:
            adm = _ok(c.post("/api/v1/admissions", headers=h["admin"], json={
                "first_name": first, "last_name": "Scope", "mobile_number": "9000055555",
                "class_name": cls, "parent_account_email": parent}), 201)
            body = {"parent_account_email": parent, "parent_account_password": PW}
            if student_login:
                body.update({"skip_student_account": False, "student_account_email": student_login,
                             "student_account_password": PW})
            return str(_ok(c.post(f"/api/v1/admissions/{adm['id']}/enroll", json=body, headers=h["admin"]))["student_id"])

        s = {
            "a": enroll("Arjun", "Grade 5", "p2.parent.a@example.com", "p2.student.a@example.com"),
            "b": enroll("Bela", "Grade 5", "p2.parent.b@example.com"),
            "c": enroll("Chirag", "Grade 5", "p2.parent.c@example.com"),
            "d": enroll("Diya", "Grade 8", "p2.parent.d@example.com"),
        }
        for key, sec in (("a", g5["A"]), ("b", g5["A"]), ("c", g5["B"]), ("d", g8["A"])):
            _ok(c.post(f"/api/v1/students/{s[key]}/place", json={"sectionId": sec}, headers=h["principal"]))

        for who, email in (("parent_a", "p2.parent.a@example.com"), ("parent_c", "p2.parent.c@example.com"),
                           ("parent_d", "p2.parent.d@example.com"), ("student_a", "p2.student.a@example.com")):
            h[who] = login_headers(c, email, PW)

        yield {"c": c, "h": h, "s": s, "uid": uid,
               "names": {"a": "Arjun Scope", "b": "Bela Scope", "c": "Chirag Scope", "d": "Diya Scope"}}


def _allocate(w, mappings: list[dict], *, email="teacher@qmis.edu", status="Active", employee="P2-T1"):
    body = [{"employeeId": employee, "email": email, "status": status, "mappings": mappings}] if mappings else []
    _ok(w["c"].put("/api/v1/academics/teacher-allocations", json=body, headers=w["h"]["principal"]))


def _band(w, grade_from: int, grade_to: int) -> None:
    _ok(w["c"].put("/api/v1/students/coordinator-grade-bands", headers=w["h"]["principal"],
                   json={"userId": w["uid"]["coordinator@qmis.edu"], "gradeFrom": grade_from, "gradeTo": grade_to}))


def _roster(w, who: str, cls: str, section: str | None = None):
    params = {"date": DAY, "className": cls, "roster": True}
    if section:
        params["section"] = section
    return w["c"].get("/api/v1/attendance", params=params, headers=w["h"][who])


def _mark(w, who: str, cls: str, sids: list[str], section: str | None = None, day: str = DAY):
    body = {"date": day, "className": cls, "marks": [{"studentId": sid, "status": "Present"} for sid in sids]}
    if section:
        body["section"] = section
    return w["c"].post("/api/v1/attendance", json=body, headers=w["h"][who])


def _marked_ids(w, day: str = DAY) -> set[str]:
    rows = _ok(w["c"].get("/api/v1/attendance", params={"date": day}, headers=w["h"]["admin"]))
    return {r["studentId"] for r in rows}


# ================================================================ attendance

def test_class_teacher_reads_and_marks_own_section(w):
    names = {r["studentName"] for r in _ok(_roster(w, "teacher", "Grade 5", "A"))}
    assert names == {w["names"]["a"], w["names"]["b"]}
    # Whole-class roster request is narrowed to the teacher's section, not refused.
    whole = {r["studentId"] for r in _ok(_roster(w, "teacher", "Grade 5"))}
    assert whole == {w["s"]["a"], w["s"]["b"]}
    day = "2026-10-15"
    posted = _ok(_mark(w, "teacher", "Grade 5", [w["s"]["a"], w["s"]["b"]], "A", day))
    assert {r["studentId"] for r in posted} == {w["s"]["a"], w["s"]["b"]}
    assert _marked_ids(w, day) == {w["s"]["a"], w["s"]["b"]}


def test_allocated_teacher_access_follows_allocation(w):
    day = "2026-10-16"
    assert _roster(w, "teacher", "Grade 5", "B").status_code == 403
    assert _mark(w, "teacher", "Grade 5", [w["s"]["c"]], "B", day).status_code == 403
    assert w["s"]["c"] not in _marked_ids(w, day)

    _allocate(w, [{"className": "Grade 5", "section": "B", "subject": "Mathematics"}])
    try:
        assert [r["studentId"] for r in _ok(_roster(w, "teacher", "Grade 5", "B"))] == [w["s"]["c"]]
        assert _ok(_mark(w, "teacher", "Grade 5", [w["s"]["c"]], "B", day))[0]["studentId"] == w["s"]["c"]
        assert w["s"]["c"] in _marked_ids(w, day)
    finally:
        _allocate(w, [])
    # Revoked allocation: read and write refused again.
    assert _roster(w, "teacher", "Grade 5", "B").status_code == 403
    assert _mark(w, "teacher", "Grade 5", [w["s"]["c"]], "B", "2026-10-17").status_code == 403
    assert w["s"]["c"] not in _marked_ids(w, "2026-10-17")


@pytest.mark.parametrize(
    "allocation",
    [
        {"status": "Inactive"},  # deactivated (the collection's "revoked/expired" state)
        {"email": "someone.else@qmis.edu", "employee": "P2-OTHER"},  # assignment belongs to another user
    ],
)
def test_inactive_or_mismatched_allocation_grants_nothing(w, allocation):
    _allocate(w, [{"className": "Grade 8", "section": "A", "subject": "Science"}], **allocation)
    try:
        denied = _roster(w, "teacher", "Grade 8", "A")
        assert denied.status_code == 403 and w["names"]["d"] not in denied.text
        assert _mark(w, "teacher", "Grade 8", [w["s"]["d"]], "A", "2026-10-18").status_code == 403
        assert w["s"]["d"] not in _marked_ids(w, "2026-10-18")
    finally:
        _allocate(w, [])


def test_unassigned_teacher_cannot_read_or_mark_and_self_declared_duty_does_not_count(w):
    day = "2026-10-19"
    # Self-declared Grade 8 extra-class is rejected (outside allocation). Seed via principal instead.
    denied_extra = w["c"].put(
        "/api/v1/academics/extra-classes",
        headers=w["h"]["teacher"],
        json=[{"id": "EC-P2", "className": "Grade 8", "section": "A", "teacher": "teacher@qmis.edu", "date": day}],
    )
    assert denied_extra.status_code == 403
    _ok(w["c"].put(
        "/api/v1/academics/extra-classes",
        headers=w["h"]["principal"],
        json=[{"id": "EC-P2", "className": "Grade 8", "section": "A", "teacher": "teacher@qmis.edu", "date": day}],
    ))
    _ok(w["c"].put("/api/v1/academics/class-timetable-change-requests", headers=w["h"]["teacher"],
                   json=[{"id": "TCR-P2", "className": "Grade 8", "section": "A", "substituteTeacher": "teacher@qmis.edu"}]))
    try:
        for section in ("A", None):
            denied = _roster(w, "teacher", "Grade 8", section)
            assert denied.status_code == 403
            assert w["names"]["d"] not in denied.text
        refused = w["c"].post("/api/v1/attendance", headers=w["h"]["teacher"], json={
            "date": day, "className": "Grade 8", "section": "A", "substituteFor": "Grade 8-A",
            "marks": [{"studentId": w["s"]["d"], "status": "Present"}]})
        assert refused.status_code == 403
        assert w["s"]["d"] not in _marked_ids(w, day)
    finally:
        _ok(w["c"].put("/api/v1/academics/extra-classes", json=[], headers=w["h"]["principal"]))
        _ok(w["c"].put("/api/v1/academics/class-timetable-change-requests", json=[], headers=w["h"]["teacher"]))


def test_identifier_tampering_cannot_widen_teacher_access(w):
    day = "2026-10-20"
    s = w["s"]
    # Claim the teacher's own class but send another class's student.
    assert _mark(w, "teacher", "Grade 5", [s["d"]], "A", day).status_code == 400
    # Name the other class directly.
    assert _mark(w, "teacher", "Grade 8", [s["d"]], "A", day).status_code == 403
    # Same class, other section's student hidden in an otherwise allowed batch: nothing is written.
    assert _mark(w, "teacher", "Grade 5", [s["a"], s["c"]], "A", day).status_code == 403
    # Allowed student relabelled into another section.
    assert _mark(w, "teacher", "Grade 5", [s["a"]], "B", day).status_code == 400
    # Spelling the class differently does not change scope.
    assert _roster(w, "teacher", "V", "B").status_code == 403
    assert _marked_ids(w, day) == set()


def test_teacher_unfiltered_list_only_returns_assigned_students(w):
    day = "2026-10-21"
    _ok(_mark(w, "admin", "Grade 5", [w["s"]["a"], w["s"]["c"]], None, day))
    _ok(_mark(w, "admin", "Grade 8", [w["s"]["d"]], None, day))
    rows = _ok(w["c"].get("/api/v1/attendance", params={"date": day}, headers=w["h"]["teacher"]))
    assert [r["studentId"] for r in rows] == [w["s"]["a"]]
    assert _marked_ids(w, day) == {w["s"]["a"], w["s"]["c"], w["s"]["d"]}


def test_admin_and_principal_attendance_unchanged(w):
    assert [r["studentId"] for r in _ok(_roster(w, "admin", "Grade 8"))] == [w["s"]["d"]]
    assert len(_ok(_roster(w, "principal", "Grade 5"))) == 3
    assert _ok(_mark(w, "principal", "Grade 8", [w["s"]["d"]], "A", "2026-10-22"))[0]["studentId"] == w["s"]["d"]


def test_portal_roles_still_denied_rosters_but_keep_own_calendar(w):
    for who in ("parent_a", "student_a"):
        denied = _roster(w, who, "Grade 5")
        assert denied.status_code == 403 and "studentId" not in denied.text
    cal = _ok(w["c"].get(f"/api/v1/attendance/students/{w['s']['a']}/calendar?year=2026&month=10", headers=w["h"]["parent_a"]))
    assert cal.get("2026-10-15") == "P"
    assert w["c"].get(f"/api/v1/attendance/students/{w['s']['d']}/calendar?year=2026&month=10",
                      headers=w["h"]["parent_a"]).status_code == 404


# ================================================================ marks batches

@pytest.fixture(scope="module")
def marks(w):
    c, h, s = w["c"], w["h"], w["s"]

    def approved_exam(cls: str) -> str:
        ex = _ok(c.post("/api/v1/exams", headers=h["principal"], json={
            "name": f"Scope {cls}", "examType": "MIDTERM", "className": cls,
            "startDate": FUTURE, "endDate": FUTURE_END}), 201)
        sub = _ok(c.post(f"/api/v1/exams/{ex['id']}/submit", headers=h["principal"]))
        _ok(c.post(f"/api/v1/approvals/{sub['approvalId']}/decide", json={"decision": "approve"}, headers=h["director"]))
        return ex["id"]

    def submitted_batch(exam_id: str, subject: str, section: str, entries) -> dict:
        b = _ok(c.post("/api/v1/marks-batches", headers=h["teacher"], json={
            "examId": exam_id, "subject": subject, "section": section, "maxMarks": 100,
            "entries": [{"studentId": sid, "marks": m} for sid, m in entries]}), 201)
        return _ok(c.post(f"/api/v1/marks-batches/{b['id']}/submit", headers=h["teacher"]))

    # Teacher is class teacher of 5A; allocate subject teaching for 5B and 8A as well.
    _allocate(
        w,
        [
            {"className": "Grade 5", "section": "A", "subject": "Mathematics"},
            {"className": "Grade 5", "section": "A", "subject": "Science"},
            {"className": "Grade 5", "section": "B", "subject": "Science"},
            {"className": "Grade 8", "section": "A", "subject": "Mathematics"},
        ],
    )
    e5, e8 = approved_exam("Grade 5"), approved_exam("Grade 8")
    return {
        "g5": submitted_batch(e5, "Mathematics", "A", [(s["a"], 77), (s["b"], 58)]),
        # Chirag is placed in Grade 5B — keep section accurate so batch create stays valid.
        "g5_mixed": submitted_batch(e5, "Science", "B", [(s["c"], 66)]),
        "g8": submitted_batch(e8, "Mathematics", "A", [(s["d"], 91)]),
        "e5": e5, "e8": e8,
    }


def _batch_ids(w, who: str) -> set[str]:
    return {b["id"] for b in _ok(w["c"].get("/api/v1/marks-batches", headers=w["h"][who]))}


def test_coordinator_sees_only_batches_in_grade_band(w, marks):
    _band(w, 1, 6)
    assert _batch_ids(w, "coordinator") == {marks["g5"]["id"], marks["g5_mixed"]["id"]}
    by_exam = _ok(w["c"].get(f"/api/v1/marks-batches?examId={marks['e8']}", headers=w["h"]["coordinator"]))
    assert by_exam == []
    detail = _ok(w["c"].get(f"/api/v1/marks-batches/{marks['g5']['id']}", headers=w["h"]["coordinator"]))
    assert {e["studentId"]: e["marks"] for e in detail["entries"]} == {w["s"]["a"]: 77.0, w["s"]["b"]: 58.0}


def test_coordinator_cannot_open_or_approve_out_of_band_batch(w, marks):
    _band(w, 1, 6)
    c, h, g8 = w["c"], w["h"], marks["g8"]
    detail = c.get(f"/api/v1/marks-batches/{g8['id']}", headers=h["coordinator"])
    assert detail.status_code == 404 and "91" not in detail.text and w["names"]["d"] not in detail.text
    assert g8["approvalId"] not in {a["id"] for a in _ok(c.get("/api/v1/approvals/inbox", headers=h["coordinator"]))}
    assert c.get(f"/api/v1/approvals/{g8['approvalId']}", headers=h["coordinator"]).status_code == 404
    assert _ok(c.get("/api/v1/approvals/lookup", params={"entityType": "marks_batch", "entityId": g8["id"]},
                     headers=h["coordinator"])) == []
    decided = c.post(f"/api/v1/approvals/{g8['approvalId']}/decide", json={"decision": "approve"}, headers=h["coordinator"])
    assert decided.status_code == 404
    state = _ok(c.get(f"/api/v1/approvals/{g8['approvalId']}", headers=h["principal"]))
    assert state["status"] == "pending" and state["currentLevel"] == 0 and state["awaitingRole"] == "coordinator"
    table = c.get(f"/api/v1/exams/{marks['e8']}/results", headers=h["coordinator"])
    assert table.status_code in (200, 403) and w["names"]["d"] not in table.text


def test_reading_a_batch_does_not_grant_approval_authority(w, marks):
    c, h, g8 = w["c"], w["h"], marks["g8"]
    for who in ("principal", "director", "jointdirector", "admin"):
        assert g8["id"] in _batch_ids(w, who)
        assert _ok(c.get(f"/api/v1/marks-batches/{g8['id']}", headers=h[who]))["entries"][0]["marks"] == 91.0
        out_of_turn = c.post(f"/api/v1/approvals/{g8['approvalId']}/decide", json={"decision": "approve"}, headers=h[who])
        assert out_of_turn.status_code == 403
    assert _ok(c.get(f"/api/v1/approvals/{g8['approvalId']}", headers=h["admin"]))["currentLevel"] == 0


def test_allocation_scoped_coordinator_needs_every_student_in_scope(w, marks):
    _band(w, 1, 1)
    _allocate(w, [{"className": "Grade 5", "section": "A", "subject": "Mathematics"}],
              email="coordinator@qmis.edu", employee="P2-C1")
    try:
        visible = _batch_ids(w, "coordinator")
        assert marks["g5"]["id"] in visible
        assert marks["g5_mixed"]["id"] not in visible  # contains Chirag from 5B
        assert w["c"].get(f"/api/v1/marks-batches/{marks['g5_mixed']['id']}", headers=w["h"]["coordinator"]).status_code == 404
    finally:
        _allocate(w, [])
        _band(w, 1, 6)


def test_full_approval_sequence_still_publishes(w, marks):
    c, h = w["c"], w["h"]
    _band(w, 1, 6)
    g5 = marks["g5"]
    assert c.post(f"/api/v1/approvals/{g5['approvalId']}/decide", json={"decision": "approve"}, headers=h["principal"]).status_code == 403
    for who in ("coordinator", "principal", "director"):
        _ok(c.post(f"/api/v1/approvals/{g5['approvalId']}/decide", json={"decision": "approve"}, headers=h[who]))
    assert _ok(c.get(f"/api/v1/marks-batches/{g5['id']}", headers=h["teacher"]))["status"] == "published"
    assert _ok(c.get(f"/api/v1/results/students/{w['s']['a']}", headers=h["parent_a"]))["exams"][0]["total"] == 77

    _band(w, 7, 12)  # band moved to Grade 8: the out-of-band batch becomes approvable, Grade 5 drops out
    g8 = marks["g8"]
    assert g8["approvalId"] in {a["id"] for a in _ok(c.get("/api/v1/approvals/inbox", headers=h["coordinator"]))}
    assert marks["g5_mixed"]["approvalId"] not in {a["id"] for a in _ok(c.get("/api/v1/approvals/inbox", headers=h["coordinator"]))}
    for who in ("coordinator", "principal", "director"):
        _ok(c.post(f"/api/v1/approvals/{g8['approvalId']}/decide", json={"decision": "approve"}, headers=h[who]))
    assert _ok(c.get(f"/api/v1/results/students/{w['s']['d']}", headers=h["parent_d"]))["exams"][0]["total"] == 91
    _band(w, 1, 6)


def test_teacher_and_portal_marks_restrictions_unchanged(w, marks):
    c, h = w["c"], w["h"]
    assert _batch_ids(w, "teacher") == {marks["g5"]["id"], marks["g5_mixed"]["id"], marks["g8"]["id"]}
    for who in ("parent_a", "student_a"):
        assert c.get("/api/v1/marks-batches", headers=h[who]).status_code == 403
        assert c.get(f"/api/v1/marks-batches/{marks['g5']['id']}", headers=h[who]).status_code == 403
        assert c.get(f"/api/v1/exams/{marks['e5']}/results", headers=h[who]).status_code == 403


# ================================================================ exams and timetables

@pytest.fixture(scope="module")
def exams(w, marks):
    c, h = w["c"], w["h"]

    def exam(name: str, cls: str, submit: bool) -> str:
        ex = _ok(c.post("/api/v1/exams", headers=h["principal"], json={
            "name": name, "examType": "CA", "className": cls, "startDate": FUTURE, "endDate": FUTURE_END}), 201)
        if submit:
            _ok(c.post(f"/api/v1/exams/{ex['id']}/submit", headers=h["principal"]))
        return ex["id"]

    return {"draft5": exam("Draft G5", "Grade 5", False), "pending5": exam("Pending G5", "Grade 5", True),
            "approved5": marks["e5"], "approved8": marks["e8"]}


def _exam_ids(w, who: str, **params) -> set[str]:
    return {e["id"] for e in _ok(w["c"].get("/api/v1/exams", params=params, headers=w["h"][who]))}


def test_portal_sees_only_approved_exams_for_own_class(w, exams):
    for who in ("parent_a", "student_a"):
        assert _exam_ids(w, who) == {exams["approved5"]}
        assert _exam_ids(w, who, status="draft") == set()
        assert _exam_ids(w, who, className="Grade 8") == set()
        assert _ok(w["c"].get(f"/api/v1/exams/{exams['approved5']}", headers=w["h"][who]))["status"] == "approved"
        for hidden in ("draft5", "pending5", "approved8"):
            r = w["c"].get(f"/api/v1/exams/{exams[hidden]}", headers=w["h"][who])
            assert r.status_code == 404 and "Draft G5" not in r.text and "Pending G5" not in r.text
    assert _exam_ids(w, "parent_d") == {exams["approved8"]}


def test_staff_exam_lists_unchanged(w, exams):
    every = set(exams.values())
    for who in ("teacher", "coordinator", "principal", "director", "admin"):
        assert every <= _exam_ids(w, who)
    assert _ok(w["c"].get(f"/api/v1/exams/{exams['draft5']}", headers=w["h"]["teacher"]))["status"] == "draft"


@pytest.fixture(scope="module")
def timetables(w):
    c, h, s = w["c"], w["h"], w["s"]
    items = [
        {"id": "TT-5A", "className": "Grade 5", "section": "A", "approvalStatus": "Approved", "timelines": []},
        {"id": "TT-5B", "className": "Grade 5", "section": "B", "approvalStatus": "Approved", "timelines": []},
        {"id": "TT-5", "className": "Grade 5", "section": "", "approvalStatus": "Approved", "timelines": []},
        {"id": "TT-8A", "className": "Grade 8", "section": "A", "approvalStatus": "Approved", "timelines": []},
        {"id": "TT-MIX", "className": "Grade 8", "section": "C", "approvalStatus": "Approved",
         "timelines": [{"day": "Monday", "className": "Grade 5", "section": "B", "subject": "Art"}]},
    ]
    _ok(c.put("/api/v1/academics/class-timetables", json=items, headers=h["principal"]))
    _ok(c.put("/api/v1/academics/class-timetable-change-requests", headers=h["teacher"],
              json=[{"id": "TCR-1", "timetableId": "TT-5A", "reason": "swap"}]))
    _allocate(w, [{"className": "Grade 5", "section": "A", "subject": "Mathematics"}], employee="P2-T9")
    _ok(c.put("/api/v1/academics/student-star-ratings", headers=h["teacher"], json=[
        {"id": "SSR-A", "studentId": s["a"], "studentName": w["names"]["a"], "month": "October 2026", "rating": 3},
        {"id": "SSR-C", "studentId": s["c"], "studentName": w["names"]["c"], "month": "October 2026", "rating": 2},
    ]))
    yield
    _allocate(w, [])


def _ids(w, who: str, collection: str) -> set[str]:
    return {i["id"] for i in _ok(w["c"].get(f"/api/v1/academics/{collection}", headers=w["h"][who]))}


def test_portal_timetables_limited_to_childs_class_and_section(w, timetables):
    assert _ids(w, "parent_a", "class-timetables") == {"TT-5A", "TT-5"}
    assert _ids(w, "student_a", "class-timetables") == {"TT-5A", "TT-5"}
    assert _ids(w, "parent_c", "class-timetables") == {"TT-5B", "TT-5", "TT-MIX"}
    assert _ids(w, "parent_d", "class-timetables") == {"TT-8A"}


def test_staff_timetable_access_preserved(w, timetables):
    every = {"TT-5A", "TT-5B", "TT-5", "TT-8A", "TT-MIX"}
    _band(w, 1, 6)
    # Teacher allocation + class-teacher Grade 5-A: Grade 5 rows only (not Grade 8-only).
    assert _ids(w, "teacher", "class-timetables") == {"TT-5A", "TT-5"}
    # Coordinator grades 1-6: Grade 5 + MIX (timeline hits Grade 5); not Grade 8-A alone.
    assert _ids(w, "coordinator", "class-timetables") == {"TT-5A", "TT-5B", "TT-5", "TT-MIX"}
    for who in ("principal", "director", "admin"):
        assert _ids(w, who, "class-timetables") == every
    assert _ids(w, "teacher", "class-timetable-change-requests") == {"TCR-1"}
    assert _ids(w, "principal", "teacher-allocations") == {"P2-T9"}


def test_portal_gets_no_staff_lists_and_only_own_star_ratings(w, timetables):
    for who in ("parent_a", "student_a"):
        for staff_only in ("class-timetable-change-requests", "teacher-allocations"):
            r = w["c"].get(f"/api/v1/academics/{staff_only}", headers=w["h"][who])
            assert r.status_code == 200 and r.json() == []
        ratings = _ok(w["c"].get("/api/v1/academics/student-star-ratings", headers=w["h"][who]))
        assert [r["id"] for r in ratings] == ["SSR-A"] and w["names"]["c"] not in str(ratings)
    assert _ids(w, "parent_c", "student-star-ratings") == {"SSR-C"}
    assert _ids(w, "teacher", "student-star-ratings") == {"SSR-A", "SSR-C"}


def test_portal_cannot_write_or_reach_hidden_timetables_another_way(w, timetables):
    for who in ("parent_a", "student_a"):
        assert w["c"].put("/api/v1/academics/class-timetables", json=[], headers=w["h"][who]).status_code == 403
        assert w["c"].get("/api/v1/academics/not-a-collection", headers=w["h"][who]).status_code == 404
    assert _ids(w, "principal", "class-timetables") == {"TT-5A", "TT-5B", "TT-5", "TT-8A", "TT-MIX"}
