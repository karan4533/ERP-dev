"""Staff relieving self-service: own record only, one open application, HR notified and sees it in Exit Formalities."""

import os

os.environ["DATABASE_URL"] = "sqlite+pysqlite:///:memory:"
os.environ["OTP_DEBUG"] = "true"
os.environ["JWT_SECRET"] = "test-secret-qmis-erp-relieving"

from datetime import date, timedelta

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import select

from app.core.database import SessionLocal
from app.main import app
from app.models import HrEmployee, Notification, User
from tests.conftest import reset_sqlite_memory_schema

TEACHER = ("teacher@qmis.edu", "teacher123")
HR = ("hr@qmis.edu", "hr12345")
APPLY = "/api/v1/hr/relieving"


@pytest.fixture()
def client():
    reset_sqlite_memory_schema()
    with TestClient(app) as test_client:
        yield test_client


def _h(client, who):
    response = client.post("/api/v1/auth/login", json={"email": who[0], "password": who[1]})
    assert response.status_code == 200, response.text
    return {"Authorization": f"Bearer {response.json()['access_token']}"}


def _link_employee(email: str, code: str) -> None:
    with SessionLocal() as db:
        user = db.scalar(select(User).where(User.email == email))
        existing = db.scalar(select(HrEmployee).where(HrEmployee.email == email))
        if existing is None:
            db.add(HrEmployee(campus_id=user.campus_id, employee_code=code, first_name="Test", last_name="Teacher",
                              email=email, department="Academics", user_id=user.id, status="Active"))
        else:
            existing.user_id = user.id
            code = existing.employee_code
        db.commit()


def _future(days=30):
    return (date.today() + timedelta(days=days)).isoformat()


def test_staff_applies_for_their_own_record_and_hr_is_notified(client):
    _link_employee(TEACHER[0], "EMP-RLV-1")
    teacher = _h(client, TEACHER)
    created = client.post(APPLY, json={"lastWorkingDate": _future(), "exitType": "Resignation", "reason": "Moving cities",
                                       "employeeId": "EMP-SOMEONE-ELSE"}, headers=teacher)
    assert created.status_code == 201, created.text
    record = created.json()
    with SessionLocal() as db:
        own = db.scalar(select(HrEmployee).where(HrEmployee.email == TEACHER[0]))
        assert record["employeeId"] == own.employee_code, "the server ignores a client-supplied employee id"
        hr_user = db.scalar(select(User).where(User.email == HR[0]))
        assert db.scalar(select(Notification).where(Notification.user_id == hr_user.id, Notification.entity_id == record["id"]))
    assert record["status"] == "Pending HR" and record["requestedByEmail"] == TEACHER[0]

    mine = client.get(f"{APPLY}/mine", headers=teacher)
    assert mine.status_code == 200 and [row["id"] for row in mine.json()] == [record["id"]]
    hr_queue = client.get("/api/v1/hr/exits", headers=_h(client, HR))
    assert hr_queue.status_code == 200 and record["id"] in {row["id"] for row in hr_queue.json()}


def test_one_open_application_and_validation(client):
    _link_employee(TEACHER[0], "EMP-RLV-2")
    teacher = _h(client, TEACHER)
    assert client.post(APPLY, json={"lastWorkingDate": _future(), "reason": "Family"}, headers=teacher).status_code == 201
    again = client.post(APPLY, json={"lastWorkingDate": _future(40), "reason": "Again"}, headers=teacher)
    assert again.status_code == 409 and again.json()["detail"]["code"] == "already_applied"
    assert client.post(APPLY, json={"lastWorkingDate": "2020-01-01", "reason": "x"}, headers=teacher).status_code == 422
    assert client.post(APPLY, json={"lastWorkingDate": _future(), "reason": ""}, headers=teacher).status_code == 422
    assert client.post(APPLY, json={"lastWorkingDate": _future(), "reason": "x", "exitType": "Fired"}, headers=teacher).status_code == 422


def test_a_login_without_an_employee_record_cannot_apply(client):
    store = _h(client, ("stationerystoremanager@qmis.edu", "stationery123"))
    with SessionLocal() as db:
        assert db.scalar(select(HrEmployee).where(HrEmployee.email == "stationerystoremanager@qmis.edu")) is None
    response = client.post(APPLY, json={"lastWorkingDate": _future(), "reason": "x"}, headers=store)
    assert response.status_code == 404 and response.json()["detail"]["code"] == "no_employee_record"
    assert client.get(f"{APPLY}/mine", headers=store).json() == []


def test_staff_cannot_read_other_peoples_exits(client):
    _link_employee(TEACHER[0], "EMP-RLV-3")
    teacher = _h(client, TEACHER)
    client.post(APPLY, json={"lastWorkingDate": _future(), "reason": "Own"}, headers=teacher)
    hr = _h(client, HR)
    assert client.post("/api/v1/hr/exits", json={"employeeId": "EMP-OTHER-9", "status": "Pending HR"}, headers=hr).status_code == 201
    exits = client.get("/api/v1/hr/exits", headers=teacher)
    assert exits.status_code == 200, exits.text
    with SessionLocal() as db:
        code = db.scalar(select(HrEmployee).where(HrEmployee.email == TEACHER[0])).employee_code
    assert exits.json() and all(row["employeeId"] == code for row in exits.json())
    assert client.post("/api/v1/hr/exits", json={"employeeId": code}, headers=teacher).status_code == 403
