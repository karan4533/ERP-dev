"""Phase 4: coordinator self-submission routing, missing-approver handling, and substitute duty."""

import os
import uuid
from datetime import date, datetime, time, timedelta
from zoneinfo import ZoneInfo

os.environ["DATABASE_URL"] = "sqlite+pysqlite:///:memory:"
os.environ["OTP_DEBUG"] = "true"
os.environ["JWT_SECRET"] = "test-secret-qmis-erp-academic-phase4"

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import select

from app.core.database import SessionLocal
from app.main import app
from app.models import ApprovalRequest, AuditLog, Notification, SubstituteDuty, User
from app.services import substitute_duties as subs
from auth_test_helpers import login_headers
from tests.conftest import reset_sqlite_memory_schema

STAFF = {
    "admin": ("admin@qmis.edu", "admin123"),
    "principal": ("principal@qmis.edu", "principal123"),
    "director": ("director@qmis.edu", "director123"),
    "coordinator": ("coordinator@qmis.edu", "coord123"),
    "teacher": ("teacher@qmis.edu", "teacher123"),
}
SENIOR = ("coord.p4@qmis.edu", "Staff-Login-2026-z")
PW = "Portal-Phase4-2026"
FUTURE = (date.today() + timedelta(days=30)).isoformat()
FUTURE_END = (date.today() + timedelta(days=33)).isoformat()
DUTY_DAY = date(2030, 6, 10)
TZ = ZoneInfo("Asia/Kolkata")


def _ok(response, status=200):
    assert response.status_code == status, response.text
    return response.json()


def _clock(monkeypatch, hh: int, mm: int, day: date = DUTY_DAY) -> None:
    monkeypatch.setattr(subs, "local_now", lambda: datetime.combine(day, time(hh, mm), tzinfo=TZ))


@pytest.fixture(scope="module")
def w():
    reset_sqlite_memory_schema()
    with TestClient(app) as c:
        h = {who: login_headers(c, *creds) for who, creds in STAFF.items()}
        _ok(c.post("/api/v1/admin/users", headers=h["admin"], json={
            "role": "coordinator", "firstName": "Phase", "lastName": "Four", "email": SENIOR[0], "gender": "Male",
            "mobileNumber": "9876500002", "city": "Madurai", "qualification": "M.Ed", "password": SENIOR[1]}), 201)
        h["senior"] = login_headers(c, *SENIOR)
        uid = {o["email"]: o["user_id"] for o in _ok(c.get("/api/v1/masters/class-teacher-options", headers=h["admin"]))}

        ids: dict[str, str] = {}
        for cls, specs in (("Grade 5", {"A": "teacher@qmis.edu"}), ("Grade 8", {"A": None, "B": None}),
                           ("Grade 11", {"A": None})):
            row = _ok(c.post("/api/v1/masters/classes", json={"name": cls}, headers=h["admin"]), 201)
            ids[cls] = row["id"]
            for sec, teacher in specs.items():
                body = {"class_id": row["id"], "name": sec}
                if teacher:
                    body["class_teacher_user_id"] = uid[teacher]
                ids[f"{cls}-{sec}"] = _ok(c.post("/api/v1/masters/sections", json=body, headers=h["admin"]), 201)["id"]

        def enroll(first: str, cls: str, section: str, parent: str) -> str:
            adm = _ok(c.post("/api/v1/admissions", headers=h["admin"], json={
                "first_name": first, "last_name": "Four", "mobile_number": "9000077777",
                "class_name": cls, "parent_account_email": parent}), 201)
            sid = str(_ok(c.post(f"/api/v1/admissions/{adm['id']}/enroll", headers=h["admin"],
                                 json={"parent_account_email": parent, "parent_account_password": PW}))["student_id"])
            _ok(c.post(f"/api/v1/students/{sid}/place", json={"sectionId": ids[f"{cls}-{section}"]}, headers=h["principal"]))
            return sid

        s = {"a": enroll("Asha", "Grade 5", "A", "p4.parent.a@example.com"),
             "d": enroll("Dinesh", "Grade 8", "A", "p4.parent.d@example.com"),
             "f": enroll("Farah", "Grade 8", "B", "p4.parent.f@example.com"),
             "e": enroll("Esha", "Grade 11", "A", "p4.parent.e@example.com")}
        h["parent_d"] = login_headers(c, "p4.parent.d@example.com", PW)
        for email, lo, hi in (("coordinator@qmis.edu", 1, 6), (SENIOR[0], 7, 10)):
            _ok(c.put("/api/v1/students/coordinator-grade-bands", headers=h["principal"],
                      json={"userId": uid[email], "gradeFrom": lo, "gradeTo": hi}))

        exams = {}
        for cls in ("Grade 5", "Grade 8", "Grade 11"):
            ex = _ok(c.post("/api/v1/exams", headers=h["principal"], json={
                "name": f"P4 {cls}", "examType": "MIDTERM", "className": cls, "startDate": FUTURE, "endDate": FUTURE_END}), 201)
            sub = _ok(c.post(f"/api/v1/exams/{ex['id']}/submit", headers=h["principal"]))
            _ok(c.post(f"/api/v1/approvals/{sub['approvalId']}/decide", json={"decision": "approve"}, headers=h["director"]))
            exams[cls] = ex["id"]
        yield {"c": c, "h": h, "s": s, "uid": uid, "ids": ids, "exams": exams}


def _batch(w, who: str, cls: str, subject: str, sid: str, section: str = "A") -> dict:
    b = _ok(w["c"].post("/api/v1/marks-batches", headers=w["h"][who], json={
        "examId": w["exams"][cls], "subject": subject, "section": section, "maxMarks": 100,
        "entries": [{"studentId": sid, "marks": 60}]}), 201)
    return _ok(w["c"].post(f"/api/v1/marks-batches/{b['id']}/submit", headers=w["h"][who]))


def _approval(w, approval_id: str) -> dict:
    return _ok(w["c"].get(f"/api/v1/approvals/{approval_id}", headers=w["h"]["principal"]))


def _decide(w, who: str, approval_id: str, decision: str = "approve"):
    body = {"decision": decision} if decision == "approve" else {"decision": decision, "comment": "recheck"}
    return w["c"].post(f"/api/v1/approvals/{approval_id}/decide", json=body, headers=w["h"][who])


# ================================================================ Part A — approval routing

def test_teacher_submission_keeps_the_full_chain(w):
    sent = _batch(w, "teacher", "Grade 5", "Maths", w["s"]["a"])
    assert _approval(w, sent["approvalId"])["chain"] == ["coordinator", "principal", "director"]


def test_coordinator_marks_self_submission_routes_to_principal(w):
    c, h = w["c"], w["h"]
    sent = _batch(w, "coordinator", "Grade 5", "Science", w["s"]["a"])
    appr = _approval(w, sent["approvalId"])
    assert appr["chain"] == ["principal", "director"] and appr["awaitingRole"] == "principal"
    assert "routed to principal>director" in appr["events"][0]["comment"]
    rows = _notifs(sent["id"])
    assert [(n.role_code, n.user_id) for n in rows] == [("principal", None)]

    assert _decide(w, "coordinator", sent["approvalId"]).status_code == 403  # own item, not their step
    assert _decide(w, "senior", sent["approvalId"]).status_code in (403, 404)
    assert _decide(w, "director", sent["approvalId"]).status_code == 403  # order kept
    _ok(_decide(w, "principal", sent["approvalId"]))
    assert _decide(w, "coordinator", sent["approvalId"]).status_code == 403
    _ok(_decide(w, "director", sent["approvalId"]))
    final = _ok(c.get(f"/api/v1/marks-batches/{sent['id']}", headers=h["coordinator"]))
    assert final["status"] == "published"
    actions = [(e["action"], e["actorRole"]) for e in _approval(w, sent["approvalId"])["events"]]
    assert actions == [("submit", "coordinator"), ("approve", "principal"), ("approve", "director")]


def test_coordinator_lesson_plan_self_submission_routes_to_principal(w):
    c, h = w["c"], w["h"]
    plan = _ok(c.post("/api/v1/lesson-plans", headers=h["coordinator"], json={
        "className": "Grade 5", "section": "A", "subject": "EVS", "month": "2099-04", "title": "Plants"}), 201)
    plan = _ok(c.post(f"/api/v1/lesson-plans/{plan['id']}/submit", headers=h["coordinator"]))
    assert plan["chain"] == ["principal", "director"] and plan["awaitingRole"] == "principal"
    assert _decide(w, "coordinator", plan["approvalId"]).status_code == 403
    for who in ("principal", "director"):
        _ok(_decide(w, who, plan["approvalId"]))
    assert _ok(c.get(f"/api/v1/lesson-plans/{plan['id']}", headers=h["coordinator"]))["status"] == "approved"


def test_missing_coordinator_coverage_waits_and_alerts_admin(w):
    c, h = w["c"], w["h"]
    sent = _batch(w, "teacher", "Grade 11", "Physics", w["s"]["e"])  # no coordinator band covers Grade 11
    batch = _ok(c.get(f"/api/v1/marks-batches/{sent['id']}", headers=h["teacher"]))
    assert batch["status"] == "submitted" and batch["awaitingEligibleApprover"] is True
    appr = _approval(w, sent["approvalId"])
    assert appr["awaitingRole"] == "coordinator" and appr["awaitingEligibleApprover"] is True and appr["currentLevel"] == 0
    alerts = [n for n in _notifs(sent["id"]) if n.role_code == "admin"]
    assert len(alerts) == 1 and alerts[0].title.startswith("No eligible approver:")
    assert "Esha" not in f"{alerts[0].title} {alerts[0].body}"
    assert any(n["entityId"] == sent["id"] for n in _ok(c.get("/api/v1/notifications", headers=h["admin"])))
    assert _audit("APPROVAL_NO_ELIGIBLE_APPROVER", sent["approvalId"])
    # Not bypassed: nobody further down the chain can act, and the admin is not an approver.
    for who in ("principal", "director", "admin"):
        assert _decide(w, who, sent["approvalId"]).status_code == 403

    _ok(c.put("/api/v1/students/coordinator-grade-bands", headers=h["principal"],
              json={"userId": w["uid"][SENIOR[0]], "gradeFrom": 7, "gradeTo": 12}))
    try:
        assert _approval(w, sent["approvalId"])["awaitingEligibleApprover"] is False
        assert sent["approvalId"] in {a["id"] for a in _ok(c.get("/api/v1/approvals/inbox", headers=h["senior"]))}
        for who in ("senior", "principal", "director"):
            _ok(_decide(w, who, sent["approvalId"]))
        assert _ok(c.get(f"/api/v1/marks-batches/{sent['id']}", headers=h["teacher"]))["status"] == "published"
    finally:
        _ok(c.put("/api/v1/students/coordinator-grade-bands", headers=h["principal"],
                  json={"userId": w["uid"][SENIOR[0]], "gradeFrom": 7, "gradeTo": 10}))


def test_rerouted_step_with_no_active_principal_waits_and_alerts_admin(w):
    with SessionLocal() as db:
        principal = db.scalar(select(User).where(User.email == STAFF["principal"][0]))
        principal.is_active = False
        db.commit()
    try:
        sent = _batch(w, "coordinator", "Grade 5", "Art", w["s"]["a"])
        with SessionLocal() as db:
            row = db.get(ApprovalRequest, uuid.UUID(sent["approvalId"]))
            assert row.status == "pending" and row.current_level == 0
        assert sorted(n.role_code for n in _notifs(sent["id"])) == ["admin", "principal"]
        assert _ok(w["c"].get(f"/api/v1/marks-batches/{sent['id']}", headers=w["h"]["coordinator"]))["awaitingEligibleApprover"] is True
    finally:
        with SessionLocal() as db:
            principal = db.scalar(select(User).where(User.email == STAFF["principal"][0]))
            principal.is_active = True
            db.commit()
    assert _ok(w["c"].get(f"/api/v1/marks-batches/{sent['id']}", headers=w["h"]["coordinator"]))["awaitingEligibleApprover"] is False


def test_unauthorized_decisions_are_refused(w):
    sent = _batch(w, "teacher", "Grade 5", "Music", w["s"]["a"])
    assert _decide(w, "teacher", sent["approvalId"]).status_code == 403
    assert _decide(w, "senior", sent["approvalId"]).status_code == 404  # out of band: not visible
    assert _decide(w, "admin", sent["approvalId"]).status_code == 403
    assert _approval(w, sent["approvalId"])["currentLevel"] == 0


def _notifs(entity_id: str) -> list[Notification]:
    with SessionLocal() as db:
        return list(db.scalars(select(Notification).where(Notification.entity_id == entity_id)
                               .order_by(Notification.created_at)).all())


def _audit(action: str, entity_id: str) -> list[AuditLog]:
    with SessionLocal() as db:
        return list(db.scalars(select(AuditLog).where(AuditLog.action == action, AuditLog.entity_id == entity_id)).all())


# ================================================================ Part B — substitute duty

def _assign(w, who: str, *, section: str = "Grade 8-A", day: date = DUTY_DAY, period="P3",
            start="10:00", end="10:45", teacher="teacher@qmis.edu", class_name: str | None = None):
    cls = class_name or section.rsplit("-", 1)[0]
    return w["c"].post("/api/v1/substitute-duties", headers=w["h"][who], json={
        "teacherUserId": w["uid"][teacher], "classId": w["ids"][cls], "sectionId": w["ids"][section],
        "date": day.isoformat(), "period": period, "startTime": start, "endTime": end, "note": "Class teacher on leave"})


def _roster(w, who: str, section: str = "A", cls: str = "Grade 8", day: date = DUTY_DAY):
    return w["c"].get("/api/v1/attendance", headers=w["h"][who],
                      params={"date": day.isoformat(), "className": cls, "section": section, "roster": True})


def _mark(w, who: str, sid: str, section: str = "A", cls: str = "Grade 8", day: date = DUTY_DAY):
    return w["c"].post("/api/v1/attendance", headers=w["h"][who], json={
        "date": day.isoformat(), "className": cls, "section": section, "marks": [{"studentId": sid, "status": "Present"}]})


def _marked(w, day: date = DUTY_DAY) -> set[str]:
    return {r["studentId"] for r in _ok(w["c"].get("/api/v1/attendance", params={"date": day.isoformat()}, headers=w["h"]["admin"]))}


def _duty_count() -> int:
    with SessionLocal() as db:
        return len(db.scalars(select(SubstituteDuty)).all())


@pytest.fixture()
def clean_duties(w):
    yield
    for d in _ok(w["c"].get("/api/v1/substitute-duties", headers=w["h"]["principal"])):
        _ok(w["c"].post(f"/api/v1/substitute-duties/{d['id']}/revoke", json={"reason": "test cleanup"}, headers=w["h"]["principal"]))


def test_principal_director_admin_can_assign_coordinator_teacher_cannot(w, clean_duties):
    made = []
    for who, period, start, end in (("principal", "P1", "08:00", "08:40"), ("director", "P2", "08:45", "09:25"),
                                    ("admin", "P3", "10:00", "10:45")):
        duty = _ok(_assign(w, who, period=period, start=start, end=end), 201)
        assert duty["status"] == "active" and duty["assignedBy"] == STAFF[who][0]
        assert (duty["className"], duty["section"], duty["date"], duty["period"]) == ("Grade 8", "A", DUTY_DAY.isoformat(), period)
        assert _audit("SUBSTITUTE_DUTY_ASSIGNED", duty["id"])
        made.append(duty["id"])
    before = _duty_count()
    for who in ("coordinator", "teacher", "senior"):
        r = _assign(w, who, period="P5", start="12:00", end="12:40")
        assert r.status_code == 403
    assert _duty_count() == before
    assert w["c"].get("/api/v1/substitute-duties/options", headers=w["h"]["teacher"]).status_code == 403
    options = _ok(w["c"].get("/api/v1/substitute-duties/options", headers=w["h"]["principal"]))
    assert "teacher@qmis.edu" in {t["email"] for t in options["teachers"]}
    assert {c["className"] for c in options["classes"]} == {"Grade 5", "Grade 8", "Grade 11"}


def test_assignment_validation(w, monkeypatch, clean_duties):
    _clock(monkeypatch, 9, 0)
    assert _assign(w, "principal", day=DUTY_DAY - timedelta(days=1)).status_code == 400  # past date
    assert _assign(w, "principal", start="11:00", end="10:00").status_code == 400
    assert _assign(w, "principal", start="10am", end="11am").status_code == 400
    assert _assign(w, "principal", period="").status_code == 422
    assert _assign(w, "principal", section="Grade 8-A", class_name="Grade 5").status_code == 400  # section/class mismatch
    parent = w["c"].post("/api/v1/substitute-duties", headers=w["h"]["principal"], json={
        "teacherUserId": _user_id("p4.parent.d@example.com"), "classId": w["ids"]["Grade 8"],
        "sectionId": w["ids"]["Grade 8-A"], "date": DUTY_DAY.isoformat(), "period": "P3", "startTime": "10:00", "endTime": "10:45"})
    assert parent.status_code == 400
    _ok(_assign(w, "principal"), 201)
    assert _assign(w, "director", start="10:30", end="11:15").status_code == 409  # overlaps
    assert _duty_count() >= 1


def _user_id(email: str) -> str:
    with SessionLocal() as db:
        return str(db.scalar(select(User).where(User.email == email)).id)


def test_valid_substitute_can_read_and_mark_only_during_the_period(w, monkeypatch, clean_duties):
    s = w["s"]
    _clock(monkeypatch, 9, 0)
    _ok(_assign(w, "principal"), 201)

    _clock(monkeypatch, 9, 59)  # before the period
    assert _roster(w, "teacher").status_code == 403
    assert _mark(w, "teacher", s["d"]).status_code == 403

    _clock(monkeypatch, 10, 15)  # inside the period
    options = _ok(w["c"].get("/api/v1/attendance/my-classes", params={"date": DUTY_DAY.isoformat()}, headers=w["h"]["teacher"]))
    assert {"className": "Grade 8", "sections": ["A"]} in options["classes"]
    assert [(d["className"], d["section"], d["period"]) for d in options["substituteDuties"]] == [("Grade 8", "A", "P3")]
    assert [r["studentId"] for r in _ok(_roster(w, "teacher"))] == [s["d"]]
    assert _ok(_mark(w, "teacher", s["d"]))[0]["studentId"] == s["d"]
    assert s["d"] in _marked(w)

    _clock(monkeypatch, 10, 46)  # after the period
    assert _roster(w, "teacher").status_code == 403
    assert _mark(w, "teacher", s["d"]).status_code == 403
    options = _ok(w["c"].get("/api/v1/attendance/my-classes", params={"date": DUTY_DAY.isoformat()}, headers=w["h"]["teacher"]))
    assert options["substituteDuties"] == [] and all(o["className"] != "Grade 8" for o in options["classes"])


def test_substitute_duty_is_limited_to_its_date_section_and_teacher(w, monkeypatch, clean_duties):
    s = w["s"]
    _clock(monkeypatch, 9, 0)
    _ok(_assign(w, "principal"), 201)
    _clock(monkeypatch, 10, 15)
    # Past attendance through the duty: refused, and nothing is written.
    yesterday = DUTY_DAY - timedelta(days=1)
    assert _roster(w, "teacher", day=yesterday).status_code == 403
    assert _mark(w, "teacher", s["d"], day=yesterday).status_code == 403
    assert s["d"] not in _marked(w, yesterday)
    # Other section of the same class.
    assert _roster(w, "teacher", section="B").status_code == 403
    assert _mark(w, "teacher", s["f"], section="B").status_code == 403
    # Another teacher cannot use this teacher's duty.
    assert _roster(w, "coordinator").status_code == 403
    # Next day, same time.
    _clock(monkeypatch, 10, 15, DUTY_DAY + timedelta(days=1))
    assert _roster(w, "teacher", day=DUTY_DAY + timedelta(days=1)).status_code == 403


def test_substitute_duty_grants_no_history_or_student_records(w, monkeypatch, clean_duties):
    c, h, s = w["c"], w["h"], w["s"]
    _clock(monkeypatch, 9, 0)
    _ok(_assign(w, "principal"), 201)
    _clock(monkeypatch, 10, 15)
    assert _roster(w, "teacher").status_code == 200
    assert c.get(f"/api/v1/attendance/students/{s['d']}/calendar?year=2030&month=6", headers=h["teacher"]).status_code == 403
    assert c.get(f"/api/v1/students/{s['d']}", headers=h["teacher"]).status_code == 403
    assert c.get(f"/api/v1/results/students/{s['d']}", headers=h["teacher"]).status_code == 403
    assert s["d"] not in {x["id"] for x in _ok(c.get("/api/v1/students", headers=h["teacher"]))}


def test_revocation_removes_access_immediately_and_keeps_history(w, monkeypatch, clean_duties):
    c, h, s = w["c"], w["h"], w["s"]
    _clock(monkeypatch, 9, 0)
    duty = _ok(_assign(w, "principal"), 201)
    _clock(monkeypatch, 10, 15)
    assert _roster(w, "teacher").status_code == 200
    assert c.post(f"/api/v1/substitute-duties/{duty['id']}/revoke", json={"reason": "x"}, headers=h["coordinator"]).status_code == 403
    revoked = _ok(c.post(f"/api/v1/substitute-duties/{duty['id']}/revoke", json={"reason": "Teacher returned"}, headers=h["director"]))
    assert revoked["status"] == "revoked" and revoked["revokedBy"] == STAFF["director"][0] and revoked["revokeReason"] == "Teacher returned"
    assert _roster(w, "teacher").status_code == 403
    assert _mark(w, "teacher", s["d"]).status_code == 403
    assert c.post(f"/api/v1/substitute-duties/{duty['id']}/revoke", json={}, headers=h["director"]).status_code == 409
    history = _ok(c.get("/api/v1/substitute-duties", params={"includeRevoked": True}, headers=h["principal"]))
    row = next(d for d in history if d["id"] == duty["id"])
    assert row["assignedBy"] == STAFF["principal"][0] and row["revokedAt"]
    assert _audit("SUBSTITUTE_DUTY_REVOKED", duty["id"])
    assert duty["id"] not in {d["id"] for d in _ok(c.get("/api/v1/substitute-duties", headers=h["principal"]))}


def test_duty_visibility_by_role(w, monkeypatch, clean_duties):
    c, h = w["c"], w["h"]
    _clock(monkeypatch, 9, 0)
    duty = _ok(_assign(w, "principal"), 201)
    assert [d["id"] for d in _ok(c.get("/api/v1/substitute-duties", headers=h["teacher"]))] == [duty["id"]]
    assert _ok(c.get("/api/v1/substitute-duties", headers=h["coordinator"])) == []
    assert c.get("/api/v1/substitute-duties", headers=h["parent_d"]).status_code == 403


def test_standing_access_and_portal_blocks_unchanged(w, monkeypatch, clean_duties):
    s = w["s"]
    _clock(monkeypatch, 9, 0)
    _ok(_assign(w, "principal"), 201)
    for hh in (7, 10, 18):  # class teacher access does not depend on any duty window
        _clock(monkeypatch, hh, 0)
        assert [r["studentId"] for r in _ok(_roster(w, "teacher", cls="Grade 5"))] == [s["a"]]
    _clock(monkeypatch, 10, 15)
    assert _roster(w, "parent_d").status_code == 403
    assert len(_ok(_roster(w, "principal"))) == 1 and len(_ok(_roster(w, "admin", section="B"))) == 1
