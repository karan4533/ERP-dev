import os
from datetime import date, timedelta

os.environ["DATABASE_URL"] = "sqlite+pysqlite:///:memory:"
os.environ["OTP_DEBUG"] = "true"
os.environ["JWT_SECRET"] = "test-secret-qmis-erp-exams"

import pytest
from fastapi.testclient import TestClient

from app.main import app

USERS = {
    "admin": ("admin@qmis.edu", "admin123"),
    "teacher": ("teacher@qmis.edu", "teacher123"),
    "coordinator": ("coordinator@qmis.edu", "coord123"),
    "principal": ("principal@qmis.edu", "principal123"),
    "director": ("director@qmis.edu", "director123"),
}
FUTURE = (date.today() + timedelta(days=60)).isoformat()
FUTURE_END = (date.today() + timedelta(days=64)).isoformat()


@pytest.fixture()
def client():
    with TestClient(app) as test_client:
        yield test_client


def _h(client, who: str, creds=None) -> dict:
    from auth_test_helpers import login_headers

    email, password = creds or USERS[who]
    return login_headers(client, email, password)


_SECTION_IDS: dict[str, str] = {}


def _section_for_class(client, cls: str, section: str = "A") -> str:
    """Create (once) masters class+section so enrollments can be placed before marks."""
    key = f"{cls}:{section}"
    if key in _SECTION_IDS:
        return _SECTION_IDS[key]
    admin, principal = _h(client, "admin"), _h(client, "principal")
    options = client.get("/api/v1/masters/class-teacher-options", headers=admin).json()
    teacher_id = next(o["user_id"] for o in options if o["email"] == USERS["teacher"][0])
    created = client.post("/api/v1/masters/classes", json={"name": cls}, headers=admin)
    if created.status_code == 201:
        class_id = created.json()["id"]
    else:
        classes = client.get("/api/v1/masters/classes", headers=admin).json()
        class_id = next(c["id"] for c in classes if c["name"] == cls)
    sec = client.post(
        "/api/v1/masters/sections",
        json={"class_id": class_id, "name": section, "class_teacher_user_id": teacher_id},
        headers=admin,
    )
    if sec.status_code == 201:
        _SECTION_IDS[key] = sec.json()["id"]
    else:
        listed = client.get(f"/api/v1/masters/sections?class_id={class_id}", headers=admin)
        assert listed.status_code == 200, listed.text
        match = next((s for s in listed.json() if s["name"] == section), None)
        assert match is not None, listed.text
        _SECTION_IDS[key] = match["id"]
    return _SECTION_IDS[key]


def _enroll(client, admin, name: str, cls: str, parent_email: str, *, section: str = "A") -> str:
    enquiry = client.post(
        "/api/v1/admissions/enquiries",
        json={"name": name, "mobile_number": "9888800000", "class_name": cls, "email": parent_email},
        headers=admin,
    )
    assert enquiry.status_code == 201, enquiry.text
    adm = client.post(f"/api/v1/admissions/enquiries/{enquiry.json()['id']}/convert", headers=admin).json()["id"]
    client.patch(
        f"/api/v1/admissions/{adm}",
        json={
            "first_name": name.split()[0], "last_name": name.split()[-1], "mobile_number": "9888800000",
            "class_name": cls, "parent_account_email": parent_email,
        },
        headers=admin,
    )
    enrolled = client.post(
        f"/api/v1/admissions/{adm}/enroll",
        json={"parent_account_email": parent_email, "parent_account_password": "Parent-Test-2026"},
        headers=admin,
    )
    assert enrolled.status_code == 200, enrolled.text
    sid = str(enrolled.json()["student_id"])
    sec_id = _section_for_class(client, cls, section)
    placed = client.post(
        f"/api/v1/students/{sid}/place",
        json={"sectionId": sec_id},
        headers=_h(client, "principal"),
    )
    assert placed.status_code == 200, placed.text
    return sid


def _approved_exam(client, cls: str, exam_type="MIDTERM", start=FUTURE, end=FUTURE_END) -> str:
    principal, director = _h(client, "principal"), _h(client, "director")
    # Exams must reference an active Class Details master (create once if missing).
    _section_for_class(client, cls, "A")
    created = client.post(
        "/api/v1/exams",
        json={"name": f"{exam_type} {cls}", "examType": exam_type, "className": cls, "startDate": start, "endDate": end},
        headers=principal,
    )
    assert created.status_code == 201, created.text
    eid = created.json()["id"]
    sub = client.post(f"/api/v1/exams/{eid}/submit", headers=principal)
    assert sub.status_code == 200, sub.text
    assert sub.json()["awaitingRole"] == "director"
    ok = client.post(
        f"/api/v1/approvals/{sub.json()['approvalId']}/decide", json={"decision": "approve"}, headers=director
    )
    assert ok.status_code == 200, ok.text
    return eid


def _coordinator_band(client, grade_from=1, grade_to=12) -> None:
    """Coordinators approve marks only inside their grade band, so give the demo coordinator one."""
    options = client.get("/api/v1/masters/class-teacher-options", headers=_h(client, "admin")).json()
    coordinator_id = next(o["user_id"] for o in options if o["email"] == USERS["coordinator"][0])
    r = client.put(
        "/api/v1/students/coordinator-grade-bands",
        json={"userId": coordinator_id, "gradeFrom": grade_from, "gradeTo": grade_to},
        headers=_h(client, "principal"),
    )
    assert r.status_code == 200, r.text


def _publish(client, batch: dict) -> None:
    _coordinator_band(client)
    for who in ("coordinator", "principal", "director"):
        r = client.post(
            f"/api/v1/approvals/{batch['approvalId']}/decide", json={"decision": "approve"}, headers=_h(client, who)
        )
        assert r.status_code == 200, r.text


def test_exam_types_default_and_configurable(client):
    types = client.get("/api/v1/exam-types", headers=_h(client, "teacher")).json()
    names = {t["name"] for t in types}
    assert {"CA", "MIDTERM", "FINAL"} <= {t["code"] for t in types}
    # same evaluation categories the frontend already offers
    assert {"Split Test 1", "Pre Board", "Full Portion", "Revision Test 6", "CA / RCT"} <= names
    director = _h(client, "director")
    assert client.post("/api/v1/exam-types", json={"code": "UT1", "name": "Unit Test 1"}, headers=director).status_code == 201
    assert client.post("/api/v1/exam-types", json={"code": "ut1", "name": "dup"}, headers=director).status_code == 409
    assert client.post("/api/v1/exam-types", json={"code": "X", "name": "x"}, headers=_h(client, "teacher")).status_code == 403


def test_marks_flow_publish_ranks_and_parent_visibility(client):
    admin = _h(client, "admin")
    a = _enroll(client, admin, "Asha Menon", "Grade 7", "parent.asha@example.com")
    b = _enroll(client, admin, "Bala Iyer", "Grade 7", "parent.bala@example.com")
    teacher = _h(client, "teacher")

    # exam not approved yet -> marks entry blocked
    principal = _h(client, "principal")
    draft_exam = client.post(
        "/api/v1/exams",
        json={"name": "Draft", "examType": "CA", "className": "Grade 7", "startDate": FUTURE, "endDate": FUTURE_END},
        headers=principal,
    ).json()
    blocked = client.post(
        "/api/v1/marks-batches",
        json={"examId": draft_exam["id"], "subject": "Maths", "maxMarks": 50, "entries": [{"studentId": a, "marks": 10}]},
        headers=teacher,
    )
    assert blocked.status_code == 409

    exam_id = _approved_exam(client, "Grade 7")
    batch = client.post(
        "/api/v1/marks-batches",
        json={
            "examId": exam_id, "subject": "Maths", "maxMarks": 50,
            "entries": [{"studentId": a, "marks": 45}, {"studentId": b, "marks": 30}],
        },
        headers=teacher,
    )
    assert batch.status_code == 201, batch.text
    batch = batch.json()
    assert batch["status"] == "draft" and len(batch["entries"]) == 2

    # draft can be edited (preview -> fix), submit locks it
    fixed = client.put(
        f"/api/v1/marks-batches/{batch['id']}/entries",
        json={"entries": [{"studentId": a, "marks": 46}, {"studentId": b, "marks": 30}]},
        headers=teacher,
    )
    assert fixed.status_code == 200, fixed.text
    submitted = client.post(f"/api/v1/marks-batches/{batch['id']}/submit", headers=teacher)
    assert submitted.status_code == 200 and submitted.json()["status"] == "submitted"
    assert client.put(
        f"/api/v1/marks-batches/{batch['id']}/entries",
        json={"entries": [{"studentId": a, "marks": 50}]},
        headers=teacher,
    ).status_code == 409

    # nothing published yet
    parent_a = _h(client, "x", ("parent.asha@example.com", "Parent-Test-2026"))
    before = client.get(f"/api/v1/results/students/{a}", headers=parent_a).json()
    assert before["exams"] == []

    _publish(client, submitted.json())
    final = client.get(f"/api/v1/marks-batches/{batch['id']}", headers=teacher).json()
    assert final["status"] == "published"

    res = client.get(f"/api/v1/exams/{exam_id}/results", headers=principal).json()
    by_name = {r["studentName"]: r for r in res["results"]}
    assert by_name["Asha Menon"]["rank"] == 1 and by_name["Asha Menon"]["percentage"] == 92.0
    assert by_name["Bala Iyer"]["rank"] == 2
    assert res["classHigh"]["Maths"] == 46

    mine = client.get(f"/api/v1/results/students/{a}", headers=parent_a).json()
    assert mine["exams"][0]["rank"] == 1
    # parent cannot view another family's child
    assert client.get(f"/api/v1/results/students/{b}", headers=parent_a).status_code == 404


def test_marks_validation_and_deny_revise(client):
    admin = _h(client, "admin")
    s = _enroll(client, admin, "Charu Nair", "Grade 6", "parent.charu@example.com")
    other = _enroll(client, admin, "Dev Shah", "Grade 5", "parent.dev@example.com")
    exam_id = _approved_exam(client, "Grade 6")
    teacher = _h(client, "teacher")

    def post(entries, subject="Science"):
        return client.post(
            "/api/v1/marks-batches",
            json={"examId": exam_id, "subject": subject, "maxMarks": 20, "entries": entries},
            headers=teacher,
        )

    assert post([{"studentId": s, "marks": 21}]).status_code == 400  # above max
    assert post([{"studentId": other, "marks": 5}]).status_code == 400  # wrong class
    assert post([{"studentId": s}]).status_code == 400  # marks required unless absent

    batch = post([{"studentId": s, "absent": True}])
    assert batch.status_code == 201 and batch.json()["entries"][0]["marks"] is None
    batch = batch.json()
    assert post([{"studentId": s, "marks": 10}]).status_code == 409  # duplicate

    sub = client.post(f"/api/v1/marks-batches/{batch['id']}/submit", headers=teacher).json()
    _coordinator_band(client)
    denied = client.post(
        f"/api/v1/approvals/{sub['approvalId']}/decide",
        json={"decision": "deny", "comment": "Recheck absentee"},
        headers=_h(client, "coordinator"),
    )
    assert denied.status_code == 200
    v2 = client.post(f"/api/v1/marks-batches/{batch['id']}/revise", headers=teacher)
    assert v2.status_code == 201 and v2.json()["version"] == 2 and v2.json()["status"] == "draft"
    fixed = client.put(
        f"/api/v1/marks-batches/{v2.json()['id']}/entries",
        json={"entries": [{"studentId": s, "marks": 18}]},
        headers=teacher,
    )
    assert fixed.status_code == 200 and fixed.json()["entries"][0]["marks"] == 18


def test_weightage_rules_and_weighted_final(client):
    director, principal = _h(client, "director"), _h(client, "principal")
    url = "/api/v1/exam-weightage"
    good = {"weights": [{"examType": "MIDTERM", "weight": 60}, {"examType": "FINAL", "weight": 40}]}

    assert client.put(url, params={"className": "Grade 9"}, json=good, headers=principal).status_code == 403
    bad = client.put(
        url, params={"className": "Grade 9"},
        json={"weights": [{"examType": "MIDTERM", "weight": 60}, {"examType": "FINAL", "weight": 30}]},
        headers=director,
    )
    assert bad.status_code == 400
    ok = client.put(url, params={"className": "Grade 9"}, json=good, headers=director)
    assert ok.status_code == 200 and ok.json()["locked"] is False

    admin = _h(client, "admin")
    s = _enroll(client, admin, "Esha Rao", "Grade 9", "parent.esha@example.com")
    exam_id = _approved_exam(client, "Grade 9", "MIDTERM")
    teacher = _h(client, "teacher")
    batch = client.post(
        "/api/v1/marks-batches",
        json={"examId": exam_id, "subject": "Maths", "maxMarks": 100, "entries": [{"studentId": s, "marks": 80}]},
        headers=teacher,
    ).json()
    sub = client.post(f"/api/v1/marks-batches/{batch['id']}/submit", headers=teacher).json()
    _publish(client, sub)

    out = client.get(f"/api/v1/results/students/{s}", headers=principal).json()
    assert out["weighted"]["finalPercentage"] == 80.0
    assert out["weighted"]["complete"] is False  # FINAL not published yet

    # once an exam cycle has started for a class, weightage is locked
    _approved_exam(client, "Grade 4", "CA", start=date.today().isoformat(), end=date.today().isoformat())
    locked = client.put(url, params={"className": "Grade 4"}, json=good, headers=director)
    assert locked.status_code == 409


def test_exam_rejects_unknown_or_mismatched_class_section(client):
    """API must not accept free-text class/section outside active Class Details."""
    principal = _h(client, "principal")
    admin = _h(client, "admin")
    _section_for_class(client, "Grade 8", "A")

    unknown_class = client.post(
        "/api/v1/exams",
        json={
            "name": "Ghost class exam",
            "examType": "MIDTERM",
            "className": "Grade 99",
            "startDate": FUTURE,
            "endDate": FUTURE_END,
        },
        headers=principal,
    )
    assert unknown_class.status_code == 400, unknown_class.text
    assert "Unknown or inactive class" in unknown_class.json()["detail"]["message"]

    bad_section = client.post(
        "/api/v1/exams",
        json={
            "name": "Wrong section exam",
            "examType": "MIDTERM",
            "className": "Grade 8",
            "section": "Z",
            "startDate": FUTURE,
            "endDate": FUTURE_END,
        },
        headers=principal,
    )
    assert bad_section.status_code == 400, bad_section.text
    assert "Unknown or inactive section" in bad_section.json()["detail"]["message"]

    # Inactive section cannot be used for a new exam.
    classes = client.get("/api/v1/masters/classes", headers=admin).json()
    class_id = next(c["id"] for c in classes if c["name"] == "Grade 8")
    sec_b = client.post(
        "/api/v1/masters/sections",
        json={"class_id": class_id, "name": "B"},
        headers=admin,
    )
    assert sec_b.status_code == 201, sec_b.text
    deactivated = client.patch(
        f"/api/v1/masters/sections/{sec_b.json()['id']}",
        json={"is_active": False},
        headers=admin,
    )
    assert deactivated.status_code == 200, deactivated.text
    inactive = client.post(
        "/api/v1/exams",
        json={
            "name": "Inactive section exam",
            "examType": "CA",
            "className": "Grade 8",
            "section": "B",
            "startDate": FUTURE,
            "endDate": FUTURE_END,
        },
        headers=principal,
    )
    assert inactive.status_code == 400, inactive.text

    ok = client.post(
        "/api/v1/exams",
        json={
            "name": "Valid section exam",
            "examType": "CA",
            "className": "Grade 8",
            "section": "A",
            "startDate": FUTURE,
            "endDate": FUTURE_END,
        },
        headers=principal,
    )
    assert ok.status_code == 201, ok.text

    # Teacher cannot create Class Details masters.
    teacher = _h(client, "teacher")
    assert client.post(
        "/api/v1/masters/classes",
        json={"name": "Grade 77"},
        headers=teacher,
    ).status_code == 403
