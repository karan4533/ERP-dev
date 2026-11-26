"""Calendar, TC requests, activities, communication and the administrator dashboard.

Seeded logins come from settings; no credential is hard-coded here.
"""

import os
import uuid

os.environ["DATABASE_URL"] = "sqlite+pysqlite:///:memory:"
os.environ["OTP_DEBUG"] = "true"
os.environ["JWT_SECRET"] = "test-secret-qmis-erp-phase0-local"

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import func, select

from app.core.config import settings
from app.core.database import SessionLocal
from app.main import app
from app.models import Activity, AuditLog, CalendarEvent, Campus, Conversation, Message, Student, TcRequest, User

ADMIN = (settings.admin_seed_email, settings.admin_seed_password)
TEACHER = (settings.teacher_seed_email, settings.teacher_seed_password)
HR = (settings.hr_seed_email, settings.hr_seed_password)
ACCOUNT_HEAD = (settings.accounthead_seed_email, settings.accounthead_seed_password)
PDF = b"%PDF-1.4\n% note\n"


@pytest.fixture()
def client():
    with TestClient(app) as test_client:
        yield test_client


def _login(client, who):
    response = client.post("/api/v1/auth/login", json={"email": who[0], "password": who[1]})
    assert response.status_code == 200, response.text
    return {"Authorization": f"Bearer {response.json()['access_token']}"}


def _student():
    with SessionLocal() as db:
        campus = db.scalar(select(Campus))
        tag = uuid.uuid4().hex[:8]
        row = Student(
            campus_id=campus.id, admission_number=f"ADM-{tag}", full_name=f"TC Student {tag}", class_name="Grade 5"
        )
        db.add(row)
        db.commit()
        return str(row.id), row.admission_number, row.full_name


def _user_id(email):
    with SessionLocal() as db:
        return str(db.scalar(select(User.id).where(User.email == email)))


# --- calendar ------------------------------------------------------------------------------------


def test_calendar_lists_the_seeded_year_and_a_teacher_can_read_it(client):
    admin = _login(client, ADMIN)
    items = client.get("/api/v1/calendar", headers=admin).json()
    codes = {row["id"] for row in items}
    assert "hol-1" in codes and "exam-2" in codes and "evt-1" in codes
    republic = next(row for row in items if row["id"] == "hol-1")
    assert republic["type"] == "holiday" and republic["startDate"] == "2026-01-26"
    teacher = client.get("/api/v1/calendar", headers=_login(client, TEACHER))
    assert teacher.status_code == 200 and "hol-1" in {row["id"] for row in teacher.json()}


def test_admin_can_add_change_and_remove_a_calendar_event_and_a_teacher_cannot(client):
    admin = _login(client, ADMIN)
    made = client.post(
        "/api/v1/calendar",
        json={"type": "event", "title": "Staff meeting", "startDate": "2026-10-20", "description": "Hall A"},
        headers=admin,
    )
    assert made.status_code == 201, made.text
    assert made.json()["id"].startswith("cal-") and made.json()["endDate"] == "2026-10-20"
    ref = made.json()["id"]
    changed = client.patch(f"/api/v1/calendar/{ref}", json={"title": "Staff meeting (moved)"}, headers=admin)
    assert changed.status_code == 200 and changed.json()["title"] == "Staff meeting (moved)"
    teacher = _login(client, TEACHER)
    assert client.post(
        "/api/v1/calendar", json={"type": "holiday", "title": "x", "startDate": "2026-10-21"}, headers=teacher
    ).status_code == 403
    assert client.delete(f"/api/v1/calendar/{ref}", headers=teacher).status_code == 403
    assert client.delete(f"/api/v1/calendar/{ref}", headers=admin).status_code == 204
    assert ref not in {row["id"] for row in client.get("/api/v1/calendar", headers=admin).json()}


def test_invalid_calendar_events_are_refused(client):
    admin = _login(client, ADMIN)
    before = len(client.get("/api/v1/calendar", headers=admin).json())
    bad = client.post(
        "/api/v1/calendar",
        json={"type": "party", "title": "x", "startDate": "2026-10-20"},
        headers=admin,
    )
    assert bad.status_code == 422 and bad.json()["detail"]["code"] == "invalid_type"
    inverted = client.post(
        "/api/v1/calendar",
        json={"type": "holiday", "title": "x", "startDate": "2026-10-22", "endDate": "2026-10-20"},
        headers=admin,
    )
    assert inverted.status_code == 422 and inverted.json()["detail"]["code"] == "invalid_dates"
    assert len(client.get("/api/v1/calendar", headers=admin).json()) == before


def test_calendar_timed_events_persist_and_reject_inverted_times(client):
    """NUI-SA-128: all-day vs timed events; same-day end time before start is refused."""
    admin = _login(client, ADMIN)
    timed = client.post(
        "/api/v1/calendar",
        json={
            "type": "event",
            "title": "Timed staff briefing",
            "startDate": "2026-11-21",
            "endDate": "2026-11-21",
            "allDay": False,
            "startTime": "09:30",
            "endTime": "10:15",
            "description": "NUI-SA-128",
        },
        headers=admin,
    )
    assert timed.status_code == 201, timed.text
    body = timed.json()
    assert body["allDay"] is False and body["startTime"] == "09:30" and body["endTime"] == "10:15"
    listed = client.get("/api/v1/calendar", headers=admin).json()
    match = next(row for row in listed if row["id"] == body["id"])
    assert match["startTime"] == "09:30" and match["endTime"] == "10:15"
    bad = client.post(
        "/api/v1/calendar",
        json={
            "type": "event",
            "title": "Bad times",
            "startDate": "2026-11-21",
            "endDate": "2026-11-21",
            "allDay": False,
            "startTime": "14:00",
            "endTime": "13:00",
        },
        headers=admin,
    )
    assert bad.status_code == 422 and bad.json()["detail"]["code"] == "invalid_times"
    assert client.delete(f"/api/v1/calendar/{body['id']}", headers=admin).status_code == 204


# --- TC requests ---------------------------------------------------------------------------------


def test_tc_request_lifecycle_and_role_gates(client):
    admin = _login(client, ADMIN)
    teacher = _login(client, TEACHER)
    student_id, admission, name = _student()
    created = client.post(
        "/api/v1/tc-requests",
        json={"studentRef": admission, "reason": "Family relocation.", "transferTo": "DPS Mumbai"},
        headers=admin,
    )
    assert created.status_code == 201, created.text
    body = created.json()
    assert body["status"] == "Pending PRM Review" and body["studentName"] == name and body["id"].startswith("TC-REQ-")
    ref = body["id"]
    assert client.post(f"/api/v1/tc-requests/{ref}/decide", json={"decision": "approve"}, headers=admin).status_code == 409
    forwarded = client.post(f"/api/v1/tc-requests/{ref}/forward", json={"remarks": "Dues cleared."}, headers=admin)
    assert forwarded.status_code == 200 and forwarded.json()["status"] == "Pending Super Admin Approval"
    assert client.post(f"/api/v1/tc-requests/{ref}/decide", json={"decision": "approve"}, headers=teacher).status_code == 403
    approved = client.post(f"/api/v1/tc-requests/{ref}/decide", json={"decision": "approve", "remarks": "Issue TC."}, headers=admin)
    assert approved.status_code == 200 and approved.json()["status"] == "Approved"
    assert approved.json()["tcNumber"].startswith("TC/")
    assert client.get("/api/v1/tc-requests", headers=teacher).status_code == 403


def test_tc_rejects_a_second_open_request_and_a_reject_needs_a_remark(client):
    admin = _login(client, ADMIN)
    student_id, admission, _ = _student()
    first = client.post(
        "/api/v1/tc-requests",
        json={"studentRef": student_id, "reason": "Moving.", "transferTo": "NPS"},
        headers=admin,
    )
    assert first.status_code == 201
    second = client.post(
        "/api/v1/tc-requests",
        json={"studentRef": admission, "reason": "Again.", "transferTo": "NPS"},
        headers=admin,
    )
    assert second.status_code == 409 and second.json()["detail"]["code"] == "already_open"
    ref = first.json()["id"]
    client.post(f"/api/v1/tc-requests/{ref}/forward", json={"remarks": "ok"}, headers=admin)
    refused = client.post(f"/api/v1/tc-requests/{ref}/decide", json={"decision": "reject"}, headers=admin)
    assert refused.status_code == 422 and refused.json()["detail"]["code"] == "remarks_required"
    rejected = client.post(
        f"/api/v1/tc-requests/{ref}/decide", json={"decision": "reject", "remarks": "Dues outstanding."}, headers=admin
    )
    assert rejected.status_code == 200 and rejected.json()["status"] == "Rejected"


# --- activities ----------------------------------------------------------------------------------


def test_activity_create_list_update_approve_and_calendar_overlay(client):
    admin = _login(client, ADMIN)
    made = client.post(
        "/api/v1/activities",
        json={
            "type": "sports",
            "eventName": "Inter-house Chess",
            "eventType": "Chess Tournament",
            "eventDate": "2026-10-21",
            "venue": "Hall B",
            "coach": "Coach Rao",
            "players": [{"name": "Kabir", "rank": 1, "result": "Winner", "category": "Open"}],
        },
        headers=admin,
    )
    assert made.status_code == 201, made.text
    assert made.json()["id"].startswith("ACT-SPT-") and made.json()["mdApprovalStatus"] == "Pending"
    assert made.json()["players"][0]["name"] == "Kabir"
    listed = client.get("/api/v1/activities", params={"type": "sports"}, headers=admin).json()
    assert made.json()["id"] in [row["id"] for row in listed]
    cal = client.get("/api/v1/calendar", headers=admin).json()
    overlay = next(row for row in cal if row.get("activityId") == made.json()["id"])
    assert overlay["type"] == "event" and "Pending Super Admin approval" in overlay["description"]
    teacher = _login(client, TEACHER)
    assert client.get("/api/v1/activities", headers=teacher).status_code == 200
    assert client.post(
        "/api/v1/activities",
        json={"type": "cultural", "eventName": "x", "eventDate": "2026-10-22"},
        headers=teacher,
    ).status_code == 403
    decided = client.post(
        f"/api/v1/activities/{made.json()['id']}/approval", json={"status": "Approved"}, headers=admin
    )
    assert decided.status_code == 200 and decided.json()["mdApprovalStatus"] == "Approved"


# --- communication -------------------------------------------------------------------------------


def test_directory_and_a_two_person_thread_with_an_attachment(client):
    admin = _login(client, ADMIN)
    teacher = _login(client, TEACHER)
    teacher_id = _user_id(settings.teacher_seed_email)
    people = client.get("/api/v1/communication/directory", headers=admin).json()
    assert teacher_id in [p["id"] for p in people]
    started = client.post("/api/v1/communication/conversations", json={"userId": teacher_id}, headers=admin)
    assert started.status_code == 201, started.text
    conv_id = started.json()["id"]
    sent = client.post(
        f"/api/v1/communication/conversations/{conv_id}/messages",
        data={"body": "Please see the circular."},
        files={"file": ("note.pdf", PDF, "application/pdf")},
        headers=admin,
    )
    assert sent.status_code == 201, sent.text
    assert sent.json()["messages"][-1]["content"] == "Please see the circular."
    assert sent.json()["messages"][-1]["attachment"]["name"] == "note.pdf"
    # Recipient must get an in-app notification before opening the thread.
    before_open = client.get("/api/v1/communication/conversations", headers=teacher).json()
    hit = next(c for c in before_open if c["id"] == conv_id)
    assert hit["unreadCount"] >= 1
    notifs = client.get("/api/v1/notifications", headers=teacher).json()
    assert any(
        n.get("entityType") == "conversation" and n.get("entityId") == conv_id and not n.get("read")
        for n in notifs
    ), notifs[:5]
    seen = client.get(f"/api/v1/communication/conversations/{conv_id}", headers=teacher)
    assert seen.status_code == 200 and seen.json()["unreadCount"] == 0
    download = client.get(seen.json()["messages"][-1]["attachment"]["url"], headers=teacher)
    assert download.status_code == 200 and download.content == PDF
    outsider = _login(client, ACCOUNT_HEAD)
    listed = client.get("/api/v1/communication/conversations", headers=outsider).json()
    assert conv_id not in [c["id"] for c in listed]
    assert client.get(seen.json()["messages"][-1]["attachment"]["url"], headers=outsider).status_code == 404


def test_cannot_message_yourself_or_send_an_empty_note(client):
    admin = _login(client, ADMIN)
    me = _user_id(settings.admin_seed_email)
    assert client.post("/api/v1/communication/conversations", json={"userId": me}, headers=admin).status_code == 422
    teacher_id = _user_id(settings.teacher_seed_email)
    empty = client.post("/api/v1/communication/messages", data={"userId": teacher_id, "body": "  "}, headers=admin)
    assert empty.status_code == 422 and empty.json()["detail"]["code"] == "empty_message"


# --- dashboard -----------------------------------------------------------------------------------


def test_admin_dashboard_counts_live_rows_and_other_roles_are_refused(client):
    admin = _login(client, ADMIN)
    before = client.get("/api/v1/admin/dashboard", headers=admin)
    assert before.status_code == 200, before.text
    snap = before.json()
    assert set(snap) >= {"students", "employees", "leaveRequests", "openEscalations", "pendingTc", "unreadNotifications", "announcementsThisMonth", "asOf"}
    _, admission, _ = _student()
    filed = client.post(
        "/api/v1/tc-requests",
        json={"studentRef": admission, "reason": "Moving city.", "transferTo": "KV"},
        headers=admin,
    )
    client.post(f"/api/v1/tc-requests/{filed.json()['id']}/forward", json={"remarks": "ok"}, headers=admin)
    after = client.get("/api/v1/admin/dashboard", headers=admin).json()
    assert after["pendingTc"] == snap["pendingTc"] + 1
    assert after["students"] == snap["students"] + 1
    assert client.get("/api/v1/admin/dashboard", headers=_login(client, TEACHER)).status_code == 403
    assert client.get("/api/v1/admin/dashboard", headers=_login(client, HR)).status_code == 403
