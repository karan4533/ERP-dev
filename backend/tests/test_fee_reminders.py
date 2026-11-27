import os
from datetime import date, timedelta
from uuid import UUID

os.environ["DATABASE_URL"] = "sqlite+pysqlite:///:memory:"
os.environ["OTP_DEBUG"] = "true"
os.environ["JWT_SECRET"] = "test-secret-qmis-erp-fee-reminders"

import pytest
from fastapi.testclient import TestClient

from app.core.database import SessionLocal
from app.main import app
from app.models import Notification, Student
from app.services import fee_reminders
from app.services.placement import current_academic_year

TODAY = date.today()


@pytest.fixture()
def client():
    with TestClient(app) as test_client:
        yield test_client


def _login(client, email, password) -> dict:
    r = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    assert r.status_code == 200, r.text
    return {"Authorization": f"Bearer {r.json()['access_token']}"}


def _row(iid, sid, due: date, *, paid=0, fee=1000, status="UNPAID"):
    return {"id": iid, "studentId": sid, "feeHead": "Tuition", "installmentLabel": f"Tuition {iid}",
            "feeAmount": fee, "netAmount": fee, "paidAmount": paid, "balanceAmount": fee - paid,
            "status": status, "dueDate": due.isoformat()}


@pytest.fixture()
def world(client):
    admin = _login(client, "admin@qmis.edu", "admin123")
    adm = client.post("/api/v1/admissions", headers=admin, json={
        "first_name": "Neel", "mobile_number": "9000022222", "class_name": "Grade 8",
        "parent_account_email": "parent.neel@example.com"})
    assert adm.status_code == 201, adm.text
    enrolled = client.post(f"/api/v1/admissions/{adm.json()['id']}/enroll", headers=admin, json={
        "parent_account_email": "parent.neel@example.com", "parent_account_password": "Parent-Test-2026"})
    assert enrolled.status_code == 200, enrolled.text
    sid = str(enrolled.json()["student_id"])
    accounts = _login(client, "accounthead@qmis.edu", "accounts123")
    saved = client.put("/api/v1/finance/state", headers=accounts, json={"data": {
        "students": [{"id": sid, "name": "Neel", "admissionNo": "ADM-NEEL", "className": "Grade 8", "academicYear": "2026-2027"},
                     {"id": "STU-NO-LOGIN", "name": "Walk-in", "admissionNo": "ADM-X", "className": "Grade 8", "academicYear": "2026-2027"}],
        "installments": [
            _row("DUE-SOON", sid, TODAY + timedelta(days=10)),
            _row("DUE-LATER", sid, TODAY + timedelta(days=40)),
            _row("DUE-PAID", sid, TODAY + timedelta(days=5), paid=1000, status="PAID"),
            _row("NO-PARENT", "STU-NO-LOGIN", TODAY + timedelta(days=3)),
        ],
        "transactions": [], "receipts": [], "cheques": [], "paymentLinks": [], "concessions": [], "auditLog": [],
        "sequence": {"pay": 1, "rec": 1, "txn": 1, "voucher": 1, "link": 1}, "meta": {"seeded": True}}})
    assert saved.status_code == 200, saved.text
    with SessionLocal() as db:
        campus_id = db.get(Student, UUID(sid)).campus_id
    return {"sid": sid, "accounts": accounts, "campus_id": campus_id}


def _parent_reminders(db, campus_id):
    return db.query(Notification).filter(
        Notification.campus_id == campus_id, Notification.entity_type == "fee_reminder").all()


def test_reminder_only_for_instalments_due_within_15_days_and_never_twice(client, world):
    first = client.post("/api/v1/finance/actions/reminder-sweep", headers=world["accounts"])
    assert first.status_code == 200, first.text
    assert first.json()["dueSoon"] == 1
    assert first.json()["skippedNoParentLogin"] == 1
    again = client.post("/api/v1/finance/actions/reminder-sweep", headers=world["accounts"])
    assert again.json()["sent"] == 0
    with SessionLocal() as db:
        notes = _parent_reminders(db, world["campus_id"])
    due = [n for n in notes if n.entity_id.startswith("due15:")]
    assert len(due) == 1 and "Tuition DUE-SOON" in due[0].body and "₹1,000" in due[0].body


def test_final_month_sends_one_weekly_summary(client, world):
    with SessionLocal() as db:
        year = current_academic_year(db, world["campus_id"])
        assert year is not None
        year.end_date = TODAY + timedelta(days=20)
        db.commit()
        week1 = fee_reminders.run_sweep(db, world["campus_id"], today=TODAY)
        same_week = fee_reminders.run_sweep(db, world["campus_id"], today=TODAY + timedelta(days=1))
        next_week = fee_reminders.run_sweep(db, world["campus_id"], today=TODAY + timedelta(days=7))
        assert week1["finalMonthActive"] is True and week1["finalMonth"] == 1
        assert same_week["finalMonth"] == 0
        assert next_week["finalMonth"] == 1
        summaries = [n for n in _parent_reminders(db, world["campus_id"]) if n.entity_id.startswith("final:")]
        assert len(summaries) == 2
        # DUE-SOON + DUE-LATER are both outstanding; the paid one is not counted
        assert "₹2,000 outstanding across 2 instalment(s)" in summaries[0].body


def test_reminders_are_parent_only_and_reach_the_parent_portal(client, world):
    client.post("/api/v1/finance/actions/reminder-sweep", headers=world["accounts"])
    first = _login(client, "parent.neel@example.com", "Parent-Test-2026")
    client.post("/api/v1/auth/change-password", headers=first,
                json={"current_password": "Parent-Test-2026", "new_password": "Parent-Test-2027"})
    parent = _login(client, "parent.neel@example.com", "Parent-Test-2027")
    notes = client.get("/api/v1/notifications", headers=parent).json()
    assert any(n.get("entityType") == "fee_reminder" for n in notes)
    assert client.post("/api/v1/finance/actions/reminder-sweep", headers=parent).status_code == 403
    # opening the fee portal runs the parent's own sweep without failing or duplicating
    assert client.get("/api/v1/finance/my-fees", headers=parent).status_code == 200
    with SessionLocal() as db:
        assert len([n for n in _parent_reminders(db, world["campus_id"]) if n.entity_id.startswith("due15:")]) == 1
