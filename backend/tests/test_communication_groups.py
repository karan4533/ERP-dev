"""Inbox group conversations, membership checks, campus isolation and who-may-message-whom.

Rule under test (app/services/communication.py): staff may message anyone on their campus; parents and
students may only message staff; only members read or send. Seeded staff logins come from settings.
"""

import os
import uuid

os.environ["DATABASE_URL"] = "sqlite+pysqlite:///:memory:"
os.environ["OTP_DEBUG"] = "true"
os.environ["JWT_SECRET"] = "test-secret-qmis-erp-phase0-local"

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import select

from app.core.config import settings
from app.core.database import SessionLocal
from app.core.security import hash_password
from app.main import app
from app.models import Campus, Role, User
from auth_test_helpers import login_headers

ADMIN = (settings.admin_seed_email, settings.admin_seed_password)
TEACHER = (settings.teacher_seed_email, settings.teacher_seed_password)
HR = (settings.hr_seed_email, settings.hr_seed_password)
ACCOUNT_HEAD = (settings.accounthead_seed_email, settings.accounthead_seed_password)
PRINCIPAL = (settings.principal_seed_email, settings.principal_seed_password)
OTHER_PW = "Comm-Group-Test-2026!"
PDF = b"%PDF-1.4\n% group note\n"
BASE = "/api/v1/communication"


@pytest.fixture()
def client():
    with TestClient(app) as test_client:
        yield test_client


def _login(client, who):
    return login_headers(client, who[0], who[1])


def _user_id(email):
    with SessionLocal() as db:
        return str(db.scalar(select(User.id).where(User.email == email.lower())))


def _make_user(role_code, *, campus_id=None):
    email = f"comm.{role_code}.{uuid.uuid4().hex[:8]}@qmis.edu"
    with SessionLocal() as db:
        if campus_id is None:
            campus_id = db.scalar(select(User.campus_id).where(User.email == settings.admin_seed_email.lower()))
        role = db.scalar(select(Role).where(Role.code == role_code))
        user = User(
            campus_id=campus_id, role_id=role.id, email=email, password_hash=hash_password(OTHER_PW), is_active=True
        )
        db.add(user)
        db.commit()
        return email, str(user.id)


def _other_campus_id():
    with SessionLocal() as db:
        other = Campus(code=f"CG{uuid.uuid4().hex[:6]}", name="Other campus", city="Elsewhere")
        db.add(other)
        db.commit()
        return other.id


def _group(client, headers, user_ids, title=None):
    return client.post(f"{BASE}/conversations/groups", json={"userIds": user_ids, "title": title}, headers=headers)


def test_staff_create_one_group_and_every_member_reads_and_sends(client):
    admin = _login(client, ADMIN)
    teacher = _login(client, TEACHER)
    hr = _login(client, HR)
    teacher_id, hr_id = _user_id(TEACHER[0]), _user_id(HR[0])

    made = _group(client, admin, [teacher_id, hr_id, teacher_id], title="  Exam committee  ")
    assert made.status_code == 201, made.text
    group = made.json()
    assert group["isGroup"] is True and group["participant"] is None
    assert group["title"] == "Exam committee"
    assert group["createdBy"] == _user_id(ADMIN[0])
    assert {p["id"] for p in group["participants"]} == {_user_id(ADMIN[0]), teacher_id, hr_id}
    conv_id = group["id"]

    sent = client.post(f"{BASE}/conversations/{conv_id}/messages", data={"body": "Agenda attached."}, headers=teacher)
    assert sent.status_code == 201, sent.text
    assert sent.json()["messages"][-1]["senderId"] == teacher_id
    assert sent.json()["messages"][-1]["senderName"]

    for headers in (admin, hr):
        listed = [c for c in client.get(f"{BASE}/conversations", headers=headers).json() if c["id"] == conv_id]
        assert len(listed) == 1 and listed[0]["unreadCount"] == 1 and listed[0]["lastMessage"] == "Agenda attached."
    notifs = client.get("/api/v1/notifications", headers=hr).json()
    assert any(n.get("entityType") == "conversation" and n.get("entityId") == conv_id for n in notifs)

    replied = client.post(
        f"{BASE}/conversations/{conv_id}/messages",
        data={"body": "Received."},
        files={"file": ("minutes.pdf", PDF, "application/pdf")},
        headers=hr,
    )
    assert replied.status_code == 201, replied.text
    opened = client.get(f"{BASE}/conversations/{conv_id}", headers=admin)
    assert opened.status_code == 200 and opened.json()["unreadCount"] == 0
    assert [m["content"] for m in opened.json()["messages"]] == ["Agenda attached.", "Received."]
    download = client.get(opened.json()["messages"][-1]["attachment"]["url"], headers=teacher)
    assert download.status_code == 200 and download.content == PDF

    again = _group(client, admin, [teacher_id, hr_id])
    assert again.status_code == 201 and again.json()["id"] != conv_id
    assert again.json()["title"]  # falls back to member names when no title is given


def test_a_non_member_cannot_read_send_change_or_download(client):
    admin = _login(client, ADMIN)
    outsider = _login(client, ACCOUNT_HEAD)
    group = _group(client, admin, [_user_id(TEACHER[0]), _user_id(HR[0])]).json()
    conv_id = group["id"]
    sent = client.post(
        f"{BASE}/conversations/{conv_id}/messages",
        data={"body": "members only"},
        files={"file": ("x.pdf", PDF, "application/pdf")},
        headers=admin,
    )
    url = sent.json()["messages"][-1]["attachment"]["url"]

    read = client.get(f"{BASE}/conversations/{conv_id}", headers=outsider)
    assert read.status_code == 403 and read.json()["detail"]["code"] == "not_a_member"
    post = client.post(f"{BASE}/conversations/{conv_id}/messages", data={"body": "let me in"}, headers=outsider)
    assert post.status_code == 403
    assert client.patch(f"{BASE}/conversations/{conv_id}", json={"deleted": True}, headers=outsider).status_code == 403
    assert conv_id not in [c["id"] for c in client.get(f"{BASE}/conversations", headers=outsider).json()]
    assert client.get(url, headers=outsider).status_code == 404
    messages = client.get(f"{BASE}/conversations/{conv_id}", headers=admin).json()["messages"]
    assert [m["content"] for m in messages] == ["members only"]


def test_group_input_is_validated(client):
    admin = _login(client, ADMIN)
    me, teacher_id = _user_id(ADMIN[0]), _user_id(TEACHER[0])
    small = _group(client, admin, [teacher_id, me, teacher_id])
    assert small.status_code == 422 and small.json()["detail"]["code"] == "group_too_small"
    unknown = _group(client, admin, [teacher_id, str(uuid.uuid4())])
    assert unknown.status_code == 404
    long_title = _group(client, admin, [teacher_id, _user_id(HR[0])], title="x" * 121)
    assert long_title.status_code == 422 and long_title.json()["detail"]["code"] == "title_too_long"


def test_conversations_and_people_stay_on_their_own_campus(client):
    admin = _login(client, ADMIN)
    teacher_id, hr_id = _user_id(TEACHER[0]), _user_id(HR[0])
    other_campus = _other_campus_id()
    foreign_email, foreign_id = _make_user("admin", campus_id=other_campus)
    foreign = login_headers(client, foreign_email, OTHER_PW)

    group = _group(client, admin, [teacher_id, hr_id]).json()
    assert client.get(f"{BASE}/conversations/{group['id']}", headers=foreign).status_code == 404
    assert client.post(
        f"{BASE}/conversations/{group['id']}/messages", data={"body": "hi"}, headers=foreign
    ).status_code == 404
    assert group["id"] not in [c["id"] for c in client.get(f"{BASE}/conversations", headers=foreign).json()]
    assert _group(client, admin, [teacher_id, foreign_id]).status_code == 404
    assert client.post(f"{BASE}/conversations", json={"userId": foreign_id}, headers=admin).status_code == 404
    assert teacher_id not in [p["id"] for p in client.get(f"{BASE}/directory", headers=foreign).json()]


def test_two_person_threads_are_unchanged(client):
    admin = _login(client, ADMIN)
    teacher = _login(client, TEACHER)
    teacher_id = _user_id(TEACHER[0])
    first = client.post(f"{BASE}/conversations", json={"userId": teacher_id}, headers=admin)
    assert first.status_code == 201, first.text
    second = client.post(f"{BASE}/conversations", json={"userId": teacher_id}, headers=admin)
    assert second.json()["id"] == first.json()["id"]
    body = first.json()
    assert body["isGroup"] is False and body["participant"]["id"] == teacher_id
    assert body["title"] == body["participant"]["name"] and len(body["participants"]) == 2
    back = client.post(f"{BASE}/conversations", json={"userId": _user_id(ADMIN[0])}, headers=teacher)
    assert back.json()["id"] == body["id"]
    new = client.post(f"{BASE}/messages", data={"userId": teacher_id, "body": "Same thread?"}, headers=admin)
    assert new.status_code == 201 and new.json()["id"] == body["id"]


def test_a_deleted_thread_returns_to_the_recipient_on_a_new_message(client):
    admin = _login(client, ADMIN)
    teacher = _login(client, TEACHER)
    conv_id = client.post(f"{BASE}/conversations", json={"userId": _user_id(TEACHER[0])}, headers=admin).json()["id"]
    client.post(f"{BASE}/conversations/{conv_id}/messages", data={"body": "first"}, headers=admin)
    hidden = client.patch(f"{BASE}/conversations/{conv_id}", json={"deleted": True, "archived": True}, headers=teacher)
    assert hidden.status_code == 200 and hidden.json()["deleted"] is True
    client.post(f"{BASE}/conversations/{conv_id}/messages", data={"body": "are you there?"}, headers=admin)
    row = next(c for c in client.get(f"{BASE}/conversations", headers=teacher).json() if c["id"] == conv_id)
    assert row["deleted"] is False and row["archived"] is False and row["unreadCount"] >= 1


def test_parents_and_students_may_only_message_staff(client):
    parent_email, parent_id = _make_user("parent")
    student_email, student_id = _make_user("student")
    parent = login_headers(client, parent_email, OTHER_PW)
    student = login_headers(client, student_email, OTHER_PW)
    teacher = _login(client, TEACHER)
    teacher_id, principal_id = _user_id(TEACHER[0]), _user_id(PRINCIPAL[0])

    people = client.get(f"{BASE}/directory", headers=parent).json()
    ids = {p["id"] for p in people}
    assert teacher_id in ids and student_id not in ids
    assert not {p["role"] for p in people} & {"Parent", "Student"}
    assert parent_id not in {p["id"] for p in client.get(f"{BASE}/directory", headers=student).json()}

    refused = client.post(f"{BASE}/conversations", json={"userId": student_id}, headers=parent)
    assert refused.status_code == 403 and refused.json()["detail"]["code"] == "recipient_not_allowed"
    assert client.post(f"{BASE}/messages", data={"userId": parent_id, "body": "hi"}, headers=student).status_code == 403
    assert _group(client, parent, [teacher_id, student_id]).status_code == 403
    staff_group = _group(client, parent, [teacher_id, principal_id], title="Bus route concern")
    assert staff_group.status_code == 201, staff_group.text

    ok = client.post(f"{BASE}/conversations", json={"userId": teacher_id}, headers=parent)
    assert ok.status_code == 201 and ok.json()["participant"]["id"] == teacher_id

    # Staff may reach parents and students; they can reply in that thread.
    to_student = client.post(f"{BASE}/messages", data={"userId": student_id, "body": "Homework?"}, headers=teacher)
    assert to_student.status_code == 201, to_student.text
    reply = client.post(
        f"{BASE}/conversations/{to_student.json()['id']}/messages", data={"body": "Done"}, headers=student
    )
    assert reply.status_code == 201
    mixed = _group(client, teacher, [parent_id, student_id], title="Grade 5 follow-up")
    assert mixed.status_code == 201
