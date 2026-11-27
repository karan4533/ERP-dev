"""Client review R12 / R19: any signed-in user raises an IT ticket and tracks only their own tickets."""

import os
import re
import uuid

os.environ["DATABASE_URL"] = "sqlite+pysqlite:///:memory:"
os.environ["OTP_DEBUG"] = "true"
os.environ["JWT_SECRET"] = "test-secret-qmis-erp-it-tickets-self-service"

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import func, select

from app.core.config import settings
from app.core.database import SessionLocal
from app.main import app
from app.models import OpsRecord

ADMIN = (settings.admin_seed_email, settings.admin_seed_password)
HR = (settings.hr_seed_email, settings.hr_seed_password)
TEACHER = (settings.teacher_seed_email, settings.teacher_seed_password)
COORDINATOR = (settings.coordinator_seed_email, settings.coordinator_seed_password)
RAISE = "/api/v1/ops/it-support-tickets/raise"
MINE = "/api/v1/ops/it-support-tickets/mine"
LIST = "/api/v1/ops/it-support-tickets"


@pytest.fixture(scope="module")
def client():
    with TestClient(app) as test_client:
        yield test_client


def _login(client, email, password):
    response = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    assert response.status_code == 200, response.text
    return {"Authorization": f"Bearer {response.json()['access_token']}"}


@pytest.fixture(scope="module")
def it_manager(client):
    hr = _login(client, *HR)
    email = f"it.desk.{uuid.uuid4().hex[:6]}@example.com"
    created = client.post(
        "/api/v1/hr/staff",
        headers=hr,
        json={"id": f"EMP-IT-{uuid.uuid4().hex[:5].upper()}", "name": "IT Desk", "email": email,
              "role": "itsupportmanager", "department": "IT"},
    )
    assert created.status_code == 201, created.text
    temporary = created.json()["temporaryPassword"]
    first = _login(client, email, temporary)
    changed = client.post("/api/v1/auth/change-password", headers=first,
                          json={"current_password": temporary, "new_password": "Secure-Pass-99"})
    assert changed.status_code == 200, changed.text
    return _login(client, email, "Secure-Pass-99")


def _raise(client, headers, **overrides):
    body = {"subject": f"Projector {uuid.uuid4().hex[:6]}", "description": "No display in room 4.",
            "issueType": "Hardware", "priority": "High", "department": "Academics", **overrides}
    return client.post(RAISE, json=body, headers=headers)


def _ticket_count() -> int:
    with SessionLocal() as db:
        return db.scalar(select(func.count()).select_from(OpsRecord).where(OpsRecord.collection == "it-support-tickets"))


def test_a_teacher_raises_a_ticket_and_the_server_sets_who_and_what(client):
    teacher = _login(client, *TEACHER)
    made = _raise(client, teacher, requesterUserId="someone-else", requesterName="Director",
                  status="Closed", assignedTo="Nobody", ticketId="TKT-1999-9999")
    assert made.status_code == 201, made.text
    ticket = made.json()
    assert re.fullmatch(r"TKT-\d{4}-\d{4}", ticket["ticketId"]) and ticket["id"] == ticket["ticketId"]
    assert ticket["status"] == "Open" and ticket["assignedTo"] == "Academics Queue"
    assert ticket["department"] == "Academics"
    assert ticket["requesterEmail"] == TEACHER[0] and ticket["requesterRole"] == "Teacher"
    assert ticket["requesterUserId"] != "someone-else" and ticket["requesterName"] != "Director"
    assert ticket["history"][0]["event"] == "Created"


def test_numbers_are_sequential(client):
    teacher = _login(client, *TEACHER)
    first = _raise(client, teacher).json()["ticketId"]
    second = _raise(client, teacher).json()["ticketId"]
    assert int(second.rsplit("-", 1)[1]) == int(first.rsplit("-", 1)[1]) + 1


def test_requesters_see_only_their_own_tickets_and_not_the_it_list(client):
    teacher, coordinator = _login(client, *TEACHER), _login(client, *COORDINATOR)
    mine = _raise(client, teacher).json()["ticketId"]
    theirs = _raise(client, coordinator).json()["ticketId"]

    teacher_ids = {row["ticketId"] for row in client.get(MINE, headers=teacher).json()}
    coordinator_ids = {row["ticketId"] for row in client.get(MINE, headers=coordinator).json()}
    assert mine in teacher_ids and theirs not in teacher_ids
    assert theirs in coordinator_ids and mine not in coordinator_ids
    assert client.get(LIST, headers=teacher).status_code == 403
    assert client.put(LIST, json=[], headers=teacher).status_code == 403


def test_the_it_team_sees_the_ticket_and_is_notified(client, it_manager):
    ticket = _raise(client, _login(client, *TEACHER)).json()
    assert ticket["ticketId"] in {row["ticketId"] for row in client.get(LIST, headers=it_manager).json()}
    notes = client.get("/api/v1/notifications", headers=it_manager).json()
    assert [n for n in notes if n["entityType"] == "it_ticket" and n["entityId"] == ticket["ticketId"]]


def test_it_whole_list_save_keeps_raised_tickets_and_their_requester(client, it_manager):
    teacher = _login(client, *TEACHER)
    ticket = _raise(client, teacher).json()
    listed = client.get(LIST, headers=it_manager).json()

    others = [row for row in listed if row["ticketId"] != ticket["ticketId"]]
    saved = client.put(LIST, json=others, headers=it_manager)
    assert saved.status_code == 200, saved.text
    assert ticket["ticketId"] in {row["ticketId"] for row in saved.json()}

    updated = [
        {**row, "status": "In Progress", "remarks": "Technician sent", "requesterUserId": "tampered", "requesterEmail": "x@y.z"}
        if row["ticketId"] == ticket["ticketId"] else row
        for row in client.get(LIST, headers=it_manager).json()
    ]
    assert client.put(LIST, json=updated, headers=it_manager).status_code == 200
    mine = {row["ticketId"]: row for row in client.get(MINE, headers=teacher).json()}
    assert mine[ticket["ticketId"]]["status"] == "In Progress"
    assert mine[ticket["ticketId"]]["remarks"] == "Technician sent"
    assert mine[ticket["ticketId"]]["requesterEmail"] == TEACHER[0]


@pytest.mark.parametrize(
    "overrides",
    [{"subject": "  "}, {"description": ""}, {"priority": "Urgent"}, {"issueType": "Furniture"}, {"subject": "s" * 201}],
)
def test_invalid_tickets_are_refused_and_nothing_is_saved(client, overrides):
    before = _ticket_count()
    response = _raise(client, _login(client, *TEACHER), **overrides)
    assert response.status_code == 422, response.text
    assert _ticket_count() == before


def test_signed_out_requests_are_refused(client):
    assert client.post(RAISE, json={"subject": "a", "description": "b"}).status_code == 401
    assert client.get(MINE).status_code == 401


def test_admin_list_is_unchanged_for_the_it_collection(client):
    admin = _login(client, *ADMIN)
    assert client.get(LIST, headers=admin).status_code == 200
