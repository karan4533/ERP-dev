import os
from datetime import date, datetime, timedelta, timezone

os.environ["DATABASE_URL"] = "sqlite+pysqlite:///:memory:"
os.environ["OTP_DEBUG"] = "true"
os.environ["JWT_SECRET"] = "test-secret-qmis-erp-escalations"

import pytest
from fastapi.testclient import TestClient

from app.core.config import settings
from app.main import app

# Seeded development logins come from settings (never typed here), so no password lives in this file.
USERS = {
    "admin": (settings.admin_seed_email, settings.admin_seed_password),
    "teacher": (settings.teacher_seed_email, settings.teacher_seed_password),
    "coordinator": (settings.coordinator_seed_email, settings.coordinator_seed_password),
    "principal": (settings.principal_seed_email, settings.principal_seed_password),
    "director": (settings.director_seed_email, settings.director_seed_password),
    "hr": (settings.hr_seed_email, settings.hr_seed_password),
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


def _later(hours: float) -> str:
    return (datetime.now(timezone.utc).replace(tzinfo=None) + timedelta(hours=hours)).isoformat()


def _raise(client, who="teacher", text="Projector in 8-A is broken"):
    return client.post("/api/v1/escalations", json={"description": text, "fullDescription": text + " (details)"},
                       headers=_h(client, who))


def _sweep(client, hours):
    return client.post("/api/v1/escalations/sla-sweep", params={"asOf": _later(hours)}, headers=_h(client, "admin"))


def _me(client, who):
    return client.get("/api/v1/auth/me", headers=_h(client, who)).json()


def _notes(client, who):
    return client.get("/api/v1/notifications", headers=_h(client, who)).json()


# ------------------------------------------------------------- escalations


def test_raise_goes_one_level_up_and_receiver_resolves_then_raiser_closes(client):
    created = _raise(client)
    assert created.status_code == 201, created.text
    esc = created.json()
    assert esc["status"] == "Pending" and esc["escalatedToRoleKey"] == "coordinator" and esc["level"] == 0
    assert esc["escalationId"].startswith("ESC-") and not esc["overdue"]

    # appears in the coordinator's received box and the teacher's sent box, not elsewhere
    got = client.get("/api/v1/escalations?box=received", headers=_h(client, "coordinator")).json()
    assert [e["id"] for e in got] == [esc["id"]]
    assert client.get("/api/v1/escalations?box=received", headers=_h(client, "principal")).json() == []
    assert [e["id"] for e in client.get("/api/v1/escalations?box=mine", headers=_h(client, "teacher")).json()] == [esc["id"]]
    assert any("Escalation" in n["title"] for n in _notes(client, "coordinator"))

    url = f"/api/v1/escalations/{esc['id']}/status"
    assert client.post(url, json={"status": "In Review"}, headers=_h(client, "teacher")).status_code == 403
    assert client.post(url, json={"status": "In Review"}, headers=_h(client, "principal")).status_code == 404
    assert client.post(url, json={"status": "In Review"}, headers=_h(client, "coordinator")).json()["status"] == "In Review"
    assert client.post(url, json={"status": "Resolved"}, headers=_h(client, "coordinator")).status_code == 400  # needs a note
    done = client.post(url, json={"status": "Resolved", "note": "Replaced the lamp"}, headers=_h(client, "coordinator"))
    assert done.status_code == 200 and done.json()["status"] == "Resolved"
    assert done.json()["resolutionNote"] == "Replaced the lamp"
    assert client.post(url, json={"status": "Rejected", "note": "x"}, headers=_h(client, "coordinator")).status_code == 409

    # the teacher is told, and only the raiser may close it
    assert any(n["title"].startswith("Escalation Resolved") for n in _notes(client, "teacher"))
    assert client.post(url, json={"status": "Closed"}, headers=_h(client, "coordinator")).status_code == 403
    closed = client.post(url, json={"status": "Closed"}, headers=_h(client, "teacher"))
    assert closed.status_code == 200 and closed.json()["status"] == "Closed"
    assert client.post(url, json={"status": "In Review"}, headers=_h(client, "coordinator")).status_code == 409
    actions = [t["action"] for t in client.get(f"/api/v1/escalations/{esc['id']}", headers=_h(client, "teacher")).json()["trail"]]
    assert actions == ["raised", "in_review", "resolved", "closed"]


def test_close_requires_settled_and_recipient_must_match_role(client):
    esc = _raise(client).json()
    url = f"/api/v1/escalations/{esc['id']}/status"
    assert client.post(url, json={"status": "Closed"}, headers=_h(client, "teacher")).status_code == 409  # still open
    # a named recipient must really be the coordinator
    principal_id = _me(client, "principal")["id"]
    bad = client.post("/api/v1/escalations", json={"description": "x", "recipientUserId": principal_id},
                      headers=_h(client, "teacher"))
    assert bad.status_code == 400
    coord_id = _me(client, "coordinator")["id"]
    ok = client.post("/api/v1/escalations", json={"description": "to named coordinator", "recipientUserId": coord_id},
                     headers=_h(client, "teacher"))
    assert ok.status_code == 201 and ok.json()["escalatedToUserId"] == coord_id


def test_24h_clock_auto_escalates_one_level_per_day_and_is_idempotent(client):
    esc = _raise(client).json()
    eid = esc["id"]
    assert client.post("/api/v1/escalations/sla-sweep", headers=_h(client, "teacher")).status_code == 403

    assert _sweep(client, 23).json()["autoEscalated"] == 0  # inside 24h: nothing moves
    assert _sweep(client, 25).json()["autoEscalated"] >= 1
    assert _sweep(client, 25).json()["autoEscalated"] == 0  # idempotent

    moved = client.get(f"/api/v1/escalations/{eid}", headers=_h(client, "principal")).json()
    assert moved["escalatedToRoleKey"] == "principal" and moved["level"] == 1 and moved["status"] == "Pending"
    # old owner keeps read access, new owner now receives it
    assert client.get(f"/api/v1/escalations/{eid}", headers=_h(client, "coordinator")).status_code == 200
    assert any(e["id"] == eid for e in client.get("/api/v1/escalations?box=received", headers=_h(client, "principal")).json())
    assert not any(e["id"] == eid for e in client.get("/api/v1/escalations?box=received", headers=_h(client, "coordinator")).json())
    assert any("not resolved" in n["title"].lower() for n in _notes(client, "teacher"))
    # the old owner can no longer act on it
    assert client.post(f"/api/v1/escalations/{eid}/status", json={"status": "In Review"},
                       headers=_h(client, "coordinator")).status_code == 403

    # two more days elapsed in one sweep: moves two levels (principal -> director -> admin)
    assert _sweep(client, 73).json()["autoEscalated"] >= 2
    final = client.get(f"/api/v1/escalations/{eid}", headers=_h(client, "admin")).json()
    assert final["escalatedToRoleKey"] == "admin" and final["level"] == 3


def test_overdue_flag_shows_and_top_level_only_notifies_once(client):
    esc = _raise(client, who="director", text="Budget freeze").json()  # director -> admin -> superadmin
    assert esc["escalatedToRoleKey"] == "admin"
    assert _sweep(client, 25).json()["autoEscalated"] >= 1
    assert _sweep(client, 60).json()["overdueAtTopLevel"] >= 1
    assert _sweep(client, 90).json()["overdueAtTopLevel"] == 0  # already flagged, no spam
    detail = client.get(f"/api/v1/escalations/{esc['id']}", headers=_h(client, "admin")).json()
    assert detail["escalatedToRoleKey"] == "superadmin"
    assert [t["action"] for t in detail["trail"]] == ["raised", "auto_escalated", "overdue_top_level"]
    # an unresolved item past its deadline reads as overdue in the receiver's list
    listing = client.get("/api/v1/escalations?box=all", headers=_h(client, "admin")).json()
    assert any(e["id"] == esc["id"] for e in listing)


def test_rejected_needs_a_note_is_recorded_and_raiser_can_close(client):
    esc = _raise(client, text="Rejection path check").json()
    url = f"/api/v1/escalations/{esc['id']}/status"
    coord = _h(client, "coordinator")
    assert client.post(url, json={"status": "Rejected"}, headers=coord).status_code == 400  # no note
    assert client.post(url, json={"status": "Rejected", "note": "   "}, headers=coord).status_code == 400  # blank note
    rejected = client.post(url, json={"status": "Rejected", "note": "Not a school task"}, headers=coord)
    assert rejected.status_code == 200 and rejected.json()["status"] == "Rejected"
    assert rejected.json()["resolutionNote"] == "Not a school task"
    # settled: the receiver cannot flip it to Resolved, and the raiser is told with the note
    assert client.post(url, json={"status": "Resolved", "note": "x"}, headers=coord).status_code == 409
    told = [n for n in _notes(client, "teacher") if n["title"].startswith("Escalation Rejected")]
    assert told and told[0]["body"] == "Not a school task"
    # only the raiser closes it; the trail keeps the note
    assert client.post(url, json={"status": "Closed"}, headers=coord).status_code == 403
    assert client.post(url, json={"status": "Closed"}, headers=_h(client, "teacher")).status_code == 200
    trail = client.get(f"/api/v1/escalations/{esc['id']}", headers=_h(client, "teacher")).json()["trail"]
    assert [t["action"] for t in trail] == ["raised", "rejected", "closed"]
    assert "Not a school task" in str(trail[1])


def test_auto_escalation_notifies_each_party_and_director_admin_access_rules(client):
    esc = _raise(client, text="Two-level climb check").json()
    eid = esc["id"]
    assert _sweep(client, 49).json()["autoEscalated"] >= 2  # coordinator -> principal -> director

    # each party gets its own message
    assert any(n["entityId"] == eid and n["title"].startswith("Escalated to you") for n in _notes(client, "director"))
    assert any(n["entityId"] == eid and n["body"] == "Moved from coordinator to principal." for n in _notes(client, "coordinator"))
    assert any(n["entityId"] == eid and n["body"] == "Now with director." for n in _notes(client, "teacher"))

    # the director now owns it and can act; the history shows both hops
    director = _h(client, "director")
    url = f"/api/v1/escalations/{eid}/status"
    detail = client.get(f"/api/v1/escalations/{eid}", headers=director).json()
    assert detail["escalatedToRoleKey"] == "director" and detail["level"] == 2
    assert [t["action"] for t in detail["trail"]] == ["raised", "auto_escalated", "auto_escalated"]
    assert client.post(url, json={"status": "Resolved", "note": "Sorted"}, headers=director).status_code == 200

    # admin can read everything but is not a participant: no status changes of any kind
    admin = _h(client, "admin")
    assert client.get(f"/api/v1/escalations/{eid}", headers=admin).status_code == 200
    assert client.post(url, json={"status": "Closed"}, headers=admin).status_code == 403
    assert client.post(url, json={"status": "Rejected", "note": "x"}, headers=admin).status_code == 403

    # an item that never reached the director is invisible to the director
    other = _raise(client, text="Stays with the coordinator").json()
    assert client.get(f"/api/v1/escalations/{other['id']}", headers=director).status_code == 404
    assert client.get(f"/api/v1/escalations/{other['id']}", headers=admin).status_code == 200


def test_recipients_are_users_at_the_next_level(client):
    people = client.get("/api/v1/escalations/recipients", headers=_h(client, "teacher")).json()
    assert people and all(p["role"] == "coordinator" for p in people)
    assert any(p["email"] == "coordinator@qmis.edu" for p in people)
    assert client.get("/api/v1/escalations/recipients", headers=_h(client, "hr")).status_code == 403


def test_hr_cannot_raise_and_box_validation(client):
    assert _raise(client, who="hr").status_code == 403  # no escalation path for HR
    assert client.get("/api/v1/escalations?box=all", headers=_h(client, "teacher")).status_code == 403
    assert client.get("/api/v1/escalations?box=nonsense", headers=_h(client, "teacher")).status_code == 400
    assert client.get("/api/v1/escalations", headers={}).status_code in (401, 403)


def _mine_level(client, headers, esc_id):
    return next(e for e in client.get("/api/v1/escalations?box=mine", headers=headers).json() if e["id"] == esc_id)["level"]


def test_not_satisfied_is_raiser_only_moves_one_level_up_and_stops_at_the_top(client):
    teacher = _h(client, "teacher")
    esc = _raise(client, text="Not Satisfied: lamp still flickering").json()
    url = f"/api/v1/escalations/{esc['id']}/not-satisfied"
    assert esc["escalatedToRoleKey"] == "coordinator" and esc["level"] == 0

    assert client.post(url, headers={}).status_code in (401, 403)
    assert client.post(url, json={"note": "x"}, headers=_h(client, "coordinator")).status_code == 403
    assert client.post(url, json={"note": "x"}, headers=_h(client, "principal")).status_code == 404
    assert client.post(url, json={"note": "x"}, headers=_h(client, "hr")).status_code in (403, 404)
    assert client.post("/api/v1/escalations/00000000-0000-4000-8000-000000000000/not-satisfied", headers=teacher).status_code == 404
    assert _mine_level(client, teacher, esc["id"]) == 0

    moved = client.post(url, json={"note": "Still broken after the fix"}, headers=teacher)
    assert moved.status_code == 200, moved.text
    body = moved.json()
    assert body["escalatedToRoleKey"] == "principal" and body["level"] == 1 and body["status"] == "Pending"
    assert body["escalatedToUserId"] is None and not body["overdue"]
    assert datetime.fromisoformat(body["resolveBy"]) > datetime.fromisoformat(esc["resolveBy"])
    last = body["trail"][-1]
    assert last["action"] == "not_satisfied" and last["fromRole"] == "coordinator" and last["toRole"] == "principal"
    assert last["note"] == "Still broken after the fix" and last["byRole"] == "teacher"
    assert any(n["title"].startswith("Not Satisfied") for n in _notes(client, "principal"))
    assert esc["id"] in [e["id"] for e in client.get("/api/v1/escalations?box=received", headers=_h(client, "principal")).json()]
    assert client.post(url, headers=_h(client, "coordinator")).status_code == 403

    climbed = []
    for _ in range(3):
        r = client.post(url, headers=teacher)
        assert r.status_code == 200, r.text
        climbed.append((r.json()["escalatedToRoleKey"], r.json()["level"]))
    assert climbed == [("director", 2), ("admin", 3), ("superadmin", 4)]
    assert r.json()["trail"][-1]["note"].startswith("Not Satisfied")

    top = client.post(url, headers=teacher)
    assert top.status_code == 409 and top.json()["detail"]["code"] == "conflict"
    assert _mine_level(client, teacher, esc["id"]) == 4


def test_not_satisfied_is_refused_once_the_escalation_is_closed(client):
    teacher = _h(client, "teacher")
    esc = _raise(client, text="Not Satisfied: closed ticket").json()
    status_url = f"/api/v1/escalations/{esc['id']}/status"
    assert client.post(status_url, json={"status": "Resolved", "note": "Fixed"}, headers=_h(client, "coordinator")).status_code == 200
    assert client.post(status_url, json={"status": "Closed"}, headers=teacher).json()["status"] == "Closed"
    refused = client.post(f"/api/v1/escalations/{esc['id']}/not-satisfied", headers=teacher)
    assert refused.status_code == 409 and refused.json()["detail"]["code"] == "conflict"


# ------------------------------------------------------------------- tasks


def _task(client, who="principal", assignee="teacher", **over):
    body = {
        "assigneeId": _me(client, assignee)["id"],
        "title": "Submit class timetable",
        "description": "Before Friday",
        "priority": "High",
        "dueDate": (date.today() + timedelta(days=1)).isoformat(),
    }
    body.update(over)
    return client.post("/api/v1/tasks", json=body, headers=_h(client, who))


def test_task_assign_flow_only_assignee_moves_status(client):
    created = _task(client)
    assert created.status_code == 201, created.text
    task = created.json()
    assert task["status"] == "Incomplete" and task["assigneeRole"] == "teacher" and task["taskId"].startswith("TASK-")
    assert any("New task" in n["title"] for n in _notes(client, "teacher"))

    assert [t["id"] for t in client.get("/api/v1/tasks?box=mine", headers=_h(client, "teacher")).json()] == [task["id"]]
    assert [t["id"] for t in client.get("/api/v1/tasks?box=assigned", headers=_h(client, "principal")).json()] == [task["id"]]
    assert client.get("/api/v1/tasks?box=mine", headers=_h(client, "principal")).json() == []
    assert client.get(f"/api/v1/tasks/{task['id']}", headers=_h(client, "coordinator")).status_code == 404  # unrelated user

    url = f"/api/v1/tasks/{task['id']}/status"
    assert client.post(url, json={"status": "Completed"}, headers=_h(client, "principal")).status_code == 403
    assert client.post(url, json={"status": "Bogus"}, headers=_h(client, "teacher")).status_code == 400
    assert client.post(url, json={"status": "In Progress"}, headers=_h(client, "teacher")).json()["status"] == "In Progress"
    assert client.post(url, json={"status": "Incomplete"}, headers=_h(client, "teacher")).status_code == 409
    done = client.post(url, json={"status": "Completed"}, headers=_h(client, "teacher")).json()
    assert done["status"] == "Completed" and done["completedAt"]
    assert client.post(url, json={"status": "In Progress"}, headers=_h(client, "teacher")).status_code == 409  # no reopen
    assert any(n["title"].startswith("Task completed") for n in _notes(client, "principal"))


def test_task_validation(client):
    assert _task(client, dueDate=(date.today() - timedelta(days=1)).isoformat()).status_code == 400
    assert _task(client, priority="Urgent").status_code == 400
    assert _task(client, title="   ").status_code in (400, 422)
    assert _task(client, who="principal", assignee="principal").status_code == 400  # not to yourself
    assert client.get("/api/v1/tasks?box=all", headers=_h(client, "teacher")).status_code == 403
    people = client.get("/api/v1/tasks/assignees?role=teacher", headers=_h(client, "principal")).json()
    assert people and all(p["role"] == "teacher" for p in people)


def test_task_overdue_clock_notifies_once(client):
    task = _task(client).json()
    assert task["overdue"] is False
    first = _sweep(client, 24 * 5).json()
    assert first["overdueTasks"] >= 1
    assert _sweep(client, 24 * 5).json()["overdueTasks"] == 0
    assert any(n["title"].startswith("Task overdue") for n in _notes(client, "teacher"))
    assert any(n["title"].startswith("Task overdue") for n in _notes(client, "principal"))

    # a completed task never goes overdue
    other = _task(client, title="Collect forms").json()
    client.post(f"/api/v1/tasks/{other['id']}/status", json={"status": "Completed"}, headers=_h(client, "teacher"))
    assert _sweep(client, 24 * 9).json()["overdueTasks"] == 0


# ------------------------------------------------- task remarks + history (API integration step)


def test_task_status_remark_is_persisted_in_history_with_actor(client):
    task = _task(client).json()
    assert task["remark"] == ""
    url = f"/api/v1/tasks/{task['id']}/status"

    started = client.post(url, json={"status": "In Progress", "remark": "  Working on it  "}, headers=_h(client, "teacher"))
    assert started.status_code == 200, started.text
    assert started.json()["remark"] == "Working on it"  # trimmed
    done = client.post(url, json={"status": "Completed"}, headers=_h(client, "teacher")).json()
    assert done["remark"] == "Working on it"  # the last remark stays visible when a later move has none

    detail = client.get(f"/api/v1/tasks/{task['id']}", headers=_h(client, "principal")).json()
    history = detail["history"]
    assert [(e["action"], e["fromStatus"], e["toStatus"]) for e in history] == [
        ("assigned", None, "Incomplete"),
        ("status", "Incomplete", "In Progress"),
        ("status", "In Progress", "Completed"),
    ]
    assert history[0]["actor"] == "principal@qmis.edu" and history[0]["actorRole"] == "principal"
    assert history[1]["actor"] == "teacher@qmis.edu" and history[1]["actorRole"] == "teacher"
    assert history[1]["remark"] == "Working on it" and history[2]["remark"] == ""
    # lists carry the latest remark but not the full history
    mine = client.get("/api/v1/tasks?box=mine", headers=_h(client, "teacher")).json()
    assert mine[0]["remark"] == "Working on it" and "history" not in mine[0]
    # the assigner is told about the completion
    assert any(n["title"].startswith("Task completed") for n in _notes(client, "principal"))


def test_task_remark_validation_and_rules_unchanged(client):
    task = _task(client).json()
    url = f"/api/v1/tasks/{task['id']}/status"
    assert client.post(url, json={"status": "In Progress", "remark": "x" * 2001}, headers=_h(client, "teacher")).status_code == 422
    # a remark never lets someone else move the task, nor skips the flow, and blank means "no remark"
    assert client.post(url, json={"status": "Completed", "remark": "mine now"}, headers=_h(client, "principal")).status_code == 403
    blank = client.post(url, json={"status": "In Progress", "remark": "   "}, headers=_h(client, "teacher")).json()
    assert blank["remark"] == ""
    assert client.post(url, json={"status": "Incomplete", "remark": "undo"}, headers=_h(client, "teacher")).status_code == 409
    history = client.get(f"/api/v1/tasks/{task['id']}", headers=_h(client, "teacher")).json()["history"]
    assert len(history) == 2  # rejected attempts leave no history
    # unrelated users cannot read the history either
    assert client.get(f"/api/v1/tasks/{task['id']}", headers=_h(client, "coordinator")).status_code == 404


def test_task_create_with_client_ref_is_idempotent(client):
    ref = "retry-key-0001"
    first = _task(client, clientRef=ref, title="Idempotent task A")
    assert first.status_code == 201, first.text
    again = _task(client, clientRef=ref, title="Idempotent task A")
    assert again.status_code == 200 and again.json()["id"] == first.json()["id"] and again.json()["idempotentReplay"] is True
    assigned = client.get("/api/v1/tasks?box=assigned", headers=_h(client, "principal")).json()
    assert len([t for t in assigned if t["title"] == "Idempotent task A"]) == 1
    assert len([n for n in _notes(client, "teacher") if n["title"] == "New task: Idempotent task A"]) == 1
    # same key for a different assignee is a conflict, not a silent second task
    assert _task(client, assignee="coordinator", clientRef=ref).status_code == 409
    # a different key is a new task; another user's identical key is independent of this one
    assert _task(client, clientRef="retry-key-0002").status_code == 201
    assert _task(client, who="director", assignee="principal", clientRef=ref).status_code == 201
    assert _task(client, clientRef="short").status_code == 422


def test_overdue_notification_is_claimed_atomically_by_one_request(client):
    """Two requests running the clock at once (parallel list loads) must not both notify.

    Session A reads the overdue task first; session B then runs the whole clock; A then runs with its stale read.
    """
    from sqlalchemy import select

    from app.core.database import SessionLocal
    from app.models import Notification, Task
    from app.services import escalations as svc

    task = _task(client, title="Race check task").json()
    row_id = task["id"]
    campus_id = None
    with SessionLocal() as probe:
        row = probe.get(Task, __import__("uuid").UUID(row_id))
        campus_id = row.campus_id
    asof = datetime.now(timezone.utc) + timedelta(days=5)

    session_a, session_b = SessionLocal(), SessionLocal()
    try:
        stale = session_a.scalars(
            select(Task).where(Task.campus_id == campus_id, Task.status != "Completed",
                               Task.overdue_notified.is_(False), Task.due_date < asof.date())
        ).all()
        assert any(str(t.id) == row_id for t in stale)

        assert svc.run_clock(session_b, campus_id, now=asof)["overdueTasks"] >= 1  # B notifies first

        real_scalars = session_a.scalars

        class _Rows:
            def __init__(self, rows):
                self._rows = rows

            def all(self):
                return self._rows

        def stale_for_tasks(stmt, *args, **kwargs):
            return _Rows(stale) if "FROM tasks" in str(stmt) else real_scalars(stmt, *args, **kwargs)

        session_a.scalars = stale_for_tasks
        assert svc.run_clock(session_a, campus_id, now=asof)["overdueTasks"] == 0  # A loses the claim, sends nothing
    finally:
        session_a.close()
        session_b.close()

    with SessionLocal() as check:
        sent = check.scalars(select(Notification).where(Notification.entity_id == row_id,
                                                        Notification.title.like("Task overdue%"))).all()
    assert len(sent) == 2  # exactly one for the assignee and one for the assigner

# ------------------------------------------------- assignment hierarchy (backend)


def test_task_hierarchy_allows_only_direct_reports(client):
    allowed = [("principal", "coordinator"), ("principal", "teacher"), ("director", "principal"), ("admin", "director")]
    for who, assignee in allowed:
        r = _task(client, who=who, assignee=assignee, title=f"Hierarchy ok {who}->{assignee}")
        assert r.status_code == 201, (who, assignee, r.text)
        assert r.json()["assigneeRole"] == assignee

    denied = [
        ("principal", "director"),    # upwards
        ("principal", "admin"),       # upwards
        ("director", "teacher"),      # skips a level
        ("director", "coordinator"),
        ("admin", "teacher"),
        ("admin", "principal"),
        ("teacher", "coordinator"),   # roles with no direct reports
        ("coordinator", "teacher"),
        ("hr", "teacher"),
    ]
    for who, assignee in denied:
        title = f"Hierarchy blocked {who}->{assignee}"
        r = _task(client, who=who, assignee=assignee, title=title)
        assert r.status_code == 403, (who, assignee, r.status_code, r.text)
        # nothing was created, nothing was sent
        assert all(t["title"] != title for t in client.get("/api/v1/tasks?box=assigned", headers=_h(client, who)).json())
        assert all(title not in n["body"] and title not in n["title"] for n in _notes(client, assignee))


def test_task_hierarchy_checks_do_not_change_existing_error_codes(client):
    assert _task(client, who="principal", assignee="principal").status_code == 400  # self-assignment stays 400
    assert _task(client, who="principal", assignee="teacher", priority="Urgent").status_code == 400
    # a denied pairing is 403 even when the payload is otherwise valid; unknown assignee is still 400
    assert _task(client, who="principal", assigneeId="00000000-0000-4000-8000-000000000000").status_code == 400


def test_task_hierarchy_applies_to_idempotent_retries(client):
    ref = "ref-hier-0001"
    assert _task(client, who="director", assignee="teacher", clientRef=ref).status_code == 403
    first = _task(client, who="director", assignee="principal", clientRef=ref, title="Hierarchy replay")
    assert first.status_code == 201
    again = _task(client, who="director", assignee="principal", clientRef=ref, title="Hierarchy replay")
    assert again.status_code == 200 and again.json()["id"] == first.json()["id"]


def test_task_assignees_are_limited_to_the_callers_direct_reports(client):
    def roles(who, query=""):
        r = client.get(f"/api/v1/tasks/assignees{query}", headers=_h(client, who))
        return r.status_code, {p["role"] for p in r.json()} if r.status_code == 200 else None

    status, found = roles("principal")
    assert status == 200 and found and found <= {"coordinator", "teacher", "librarian"} and {"teacher", "coordinator"} <= found
    assert roles("principal", "?role=teacher") == (200, {"teacher"})
    assert roles("principal", "?role=director")[0] == 403
    assert roles("principal", "?role=admin")[0] == 403
    status, found = roles("director")
    # Exact set so any widening of TASK_HIERARCHY for Director fails loudly.
    assert status == 200 and found == {"principal", "prm", "pro"}, found
    assert roles("director", "?role=teacher")[0] == 403
    assert roles("admin") == (200, {"director"})
    assert roles("admin", "?role=principal")[0] == 403
    for who in ("teacher", "coordinator", "hr"):
        assert roles(who)[0] == 403, who
        assert roles(who, "?role=teacher")[0] == 403, who