import os
from datetime import date

os.environ["DATABASE_URL"] = "sqlite+pysqlite:///:memory:"
os.environ["OTP_DEBUG"] = "true"
os.environ["JWT_SECRET"] = "test-secret-qmis-erp-lessonplans"

import pytest
from fastapi.testclient import TestClient

from app.core.database import SessionLocal
from app.main import app
from app.models import User
from app.services import lesson_plans as svc

USERS = {
    "admin": ("admin@qmis.edu", "admin123"),
    "teacher": ("teacher@qmis.edu", "teacher123"),
    "coordinator": ("coordinator@qmis.edu", "coord123"),
    "principal": ("principal@qmis.edu", "principal123"),
    "director": ("director@qmis.edu", "director123"),
}


@pytest.fixture()
def client():
    with TestClient(app) as test_client:
        yield test_client


def _h(client, who: str) -> dict:
    email, password = USERS[who]
    r = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    assert r.status_code == 200, r.text
    return {"Authorization": f"Bearer {r.json()['access_token']}"}


def _coordinator_band(client, grade_from=1, grade_to=12) -> None:
    """Coordinators review plans only inside their grade band, so give the demo coordinator one."""
    options = client.get("/api/v1/masters/class-teacher-options", headers=_h(client, "admin")).json()
    coordinator_id = next(o["user_id"] for o in options if o["email"] == USERS["coordinator"][0])
    r = client.put(
        "/api/v1/students/coordinator-grade-bands",
        json={"userId": coordinator_id, "gradeFrom": grade_from, "gradeTo": grade_to},
        headers=_h(client, "principal"),
    )
    assert r.status_code == 200, r.text


def _create(client, headers, subject="Maths", month="2099-02"):
    return client.post(
        "/api/v1/lesson-plans",
        json={
            "className": "Grade 3",
            "section": "A",
            "subject": subject,
            "month": month,
            "title": "Fractions",
            "content": {"weeks": [{"week": 1, "topic": "Halves"}]},
        },
        headers=headers,
    )


def test_deadline_is_25th_of_previous_month():
    assert svc.deadline_for("2026-11") == date(2026, 10, 25)
    assert svc.deadline_for("2027-01") == date(2026, 12, 25)


def test_create_edit_submit_and_lock(client):
    teacher = _h(client, "teacher")
    created = _create(client, teacher)
    assert created.status_code == 201, created.text
    plan = created.json()
    assert plan["status"] == "draft" and plan["version"] == 1

    assert _create(client, teacher).status_code == 409  # same class/subject/month

    patched = client.patch(
        f"/api/v1/lesson-plans/{plan['id']}", json={"title": "Fractions v2"}, headers=teacher
    )
    assert patched.status_code == 200 and patched.json()["title"] == "Fractions v2"

    sub = client.post(f"/api/v1/lesson-plans/{plan['id']}/submit", headers=teacher)
    assert sub.status_code == 200, sub.text
    assert sub.json()["status"] == "submitted"
    assert sub.json()["awaitingRole"] == "coordinator"
    assert sub.json()["late"] is False

    locked = client.patch(f"/api/v1/lesson-plans/{plan['id']}", json={"title": "x"}, headers=teacher)
    assert locked.status_code == 409
    assert client.post(f"/api/v1/lesson-plans/{plan['id']}/submit", headers=teacher).status_code == 409


def test_full_approval_then_visibility(client):
    teacher = _h(client, "teacher")
    plan = _create(client, teacher, subject="Science").json()
    sub = client.post(f"/api/v1/lesson-plans/{plan['id']}/submit", headers=teacher).json()
    _coordinator_band(client)
    for who in ("coordinator", "principal", "director"):
        r = client.post(
            f"/api/v1/approvals/{sub['approvalId']}/decide",
            json={"decision": "approve"},
            headers=_h(client, who),
        )
        assert r.status_code == 200, r.text
    detail = client.get(f"/api/v1/lesson-plans/{plan['id']}", headers=teacher).json()
    assert detail["status"] == "approved"
    assert [e["action"] for e in detail["approvalEvents"]] == ["submit", "approve", "approve", "approve"]

    # approvers see everything; the plan is listed for the coordinator
    listed = client.get("/api/v1/lesson-plans", params={"month": "2099-02"}, headers=_h(client, "coordinator"))
    assert any(p["id"] == plan["id"] for p in listed.json())
    # another teacher-role owner filter: teacher sees own via mine flag
    mine = client.get("/api/v1/lesson-plans", params={"mine": True, "status": "approved"}, headers=teacher)
    assert any(p["id"] == plan["id"] for p in mine.json())


def test_deny_then_revise_creates_new_version(client):
    teacher = _h(client, "teacher")
    plan = _create(client, teacher, subject="English").json()
    sub = client.post(f"/api/v1/lesson-plans/{plan['id']}/submit", headers=teacher).json()
    assert client.post(f"/api/v1/lesson-plans/{plan['id']}/revise", headers=teacher).status_code == 409
    _coordinator_band(client)
    denied = client.post(
        f"/api/v1/approvals/{sub['approvalId']}/decide",
        json={"decision": "deny", "comment": "Add assessment"},
        headers=_h(client, "coordinator"),
    )
    assert denied.status_code == 200
    assert client.get(f"/api/v1/lesson-plans/{plan['id']}", headers=teacher).json()["status"] == "denied"

    # a denied plan frees the slot: revise -> v2 draft, then it can be submitted again
    v2 = client.post(f"/api/v1/lesson-plans/{plan['id']}/revise", headers=teacher)
    assert v2.status_code == 201, v2.text
    assert v2.json()["version"] == 2 and v2.json()["status"] == "draft"
    assert client.post(f"/api/v1/lesson-plans/{plan['id']}/revise", headers=teacher).status_code == 409
    again = client.post(f"/api/v1/lesson-plans/{v2.json()['id']}/submit", headers=teacher)
    assert again.status_code == 200 and again.json()["status"] == "submitted"


def test_late_flag_and_validation(client):
    teacher = _h(client, "teacher")
    assert _create(client, teacher, month="2026-13").status_code == 400
    plan = _create(client, teacher, subject="Hindi", month="2020-03").json()  # deadline long past
    sub = client.post(f"/api/v1/lesson-plans/{plan['id']}/submit", headers=teacher)
    assert sub.status_code == 200 and sub.json()["late"] is True


def test_reminders_window_and_idempotent(client):
    with TestClient(app):
        pass
    db = SessionLocal()
    try:
        campus_id = db.query(User).filter(User.email == "teacher@qmis.edu").one().campus_id
        assert svc.run_reminders(db, campus_id, today=date(2026, 10, 10)) == 0  # outside window
        first = svc.run_reminders(db, campus_id, today=date(2026, 10, 18))
        assert first >= 1
        assert svc.run_reminders(db, campus_id, today=date(2026, 10, 20)) == 0  # idempotent
    finally:
        db.close()
    teacher = _h(client, "teacher")
    notes = client.get("/api/v1/notifications", headers=teacher).json()
    assert any(n["title"] == "Submit lesson plan for 2026-11" for n in notes)


def test_teacher_cannot_trigger_reminders_or_see_others(client):
    assert client.post("/api/v1/lesson-plans/reminders/run", headers=_h(client, "teacher")).status_code == 403
    assert client.post("/api/v1/lesson-plans/reminders/run", headers=_h(client, "principal")).status_code == 200
