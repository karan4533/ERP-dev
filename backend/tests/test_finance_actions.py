import os

os.environ["DATABASE_URL"] = "sqlite+pysqlite:///:memory:"
os.environ["OTP_DEBUG"] = "true"
os.environ["JWT_SECRET"] = "test-secret-qmis-erp-finance-actions"

import pytest
from fastapi.testclient import TestClient

from app.core.config import settings
from app.main import app
from app.services.integrations import payments


@pytest.fixture()
def client(monkeypatch):
    # monkeypatch.setattr restores the setting after each test, so other suites keep razorpay.
    monkeypatch.setattr(settings, "payment_provider", "stub")
    with TestClient(app) as test_client:
        yield test_client


def test_stub_provider_is_not_configured_outside_development(monkeypatch):
    monkeypatch.setattr(settings, "payment_provider", "stub")
    monkeypatch.setattr(settings, "environment", "production")
    monkeypatch.setenv("INTEGRATIONS_MODE", "")
    intent = payments.create_payment_intent(amount=500, reference="PAY-PROD-1", student_id="STU-1")
    assert intent["status"] == "NOT_CONFIGURED"
    assert intent["providerConfigured"] is False


def test_stub_provider_opens_an_intent_in_development(monkeypatch):
    monkeypatch.setattr(settings, "payment_provider", "stub")
    monkeypatch.setattr(settings, "environment", "development")
    intent = payments.create_payment_intent(amount=500, reference="PAY-DEV-1", student_id="STU-1")
    assert intent["status"] == "OPEN" and intent["gateway"] == "stub"


def _login(client: TestClient, email="accounthead@qmis.edu", password="accounts123") -> dict:
    response = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    assert response.status_code == 200, response.text
    return {"Authorization": f"Bearer {response.json()['access_token']}"}


def _seed_state(client, headers):
    payload = {
        "data": {
            "students": [{"id": "STU-1", "name": "Aarav Sharma", "admissionNo": "ADM-1", "className": "Grade 1", "academicYear": "2026-2027"}],
            "installments": [
                {
                    "id": "INST-1",
                    "studentId": "STU-1",
                    "feeHead": "Tuition",
                    "feeAmount": 1000,
                    "netAmount": 1000,
                    "paidAmount": 0,
                    "balanceAmount": 1000,
                    "status": "UNPAID",
                }
            ],
            "transactions": [],
            "receipts": [],
            "cheques": [],
            "paymentLinks": [],
            "approvals": [{"id": "APR-1", "raisedBy": "TM", "department": "Transport", "type": "Fuel", "amount": "₹100", "status": "Pending"}],
            "concessions": [],
            "auditLog": [],
            "sequence": {"pay": 1, "rec": 1, "txn": 1, "voucher": 1, "link": 1},
            "meta": {"seeded": True},
        }
    }
    saved = client.put("/api/v1/finance/state", json=payload, headers=headers)
    assert saved.status_code == 200, saved.text


def test_collect_payment_and_send_receipt(client):
    headers = _login(client)
    _seed_state(client, headers)
    paid = client.post(
        "/api/v1/finance/actions/collect-payment",
        headers=headers,
        json={
            "studentId": "STU-1",
            "paymentMode": "CASH",
            "allocations": [{"installmentId": "INST-1", "amount": 1000}],
        },
    )
    assert paid.status_code == 200, paid.text
    assert paid.json()["receipt"]["amountPaid"] == 1000
    state = client.get("/api/v1/finance/state", headers=headers)
    assert state.status_code == 200, state.text
    books = state.json()["data"]
    assert len(books.get("dayBookEntries") or []) >= 1
    assert len(books.get("glEntries") or []) >= 2
    assert len(books.get("cashBookEntries") or []) >= 1


def test_collect_payment_includes_late_fee_in_balance(client):
    """Portal shows fee + late fee; payment must accept that full payable amount."""
    headers = _login(client)
    payload = {
        "data": {
            "students": [
                {
                    "id": "STU-1",
                    "name": "Aarav Sharma",
                    "admissionNo": "ADM-1",
                    "className": "Grade 1",
                    "academicYear": "2026-2027",
                }
            ],
            "fineRules": [
                {
                    "id": "FINE-1",
                    "feeCategoryId": "CAT-TUITION",
                    "active": True,
                    "fineType": "FLAT",
                    "fineValue": 50,
                    "gracePeriod": 0,
                }
            ],
            "installments": [
                {
                    "id": "INST-OVERDUE",
                    "studentId": "STU-1",
                    "feeCategoryId": "CAT-TUITION",
                    "feeHead": "Tuition Fee",
                    "installmentLabel": "Tuition Fee — Term 2",
                    "feeAmount": 5000,
                    "concessionAmount": 0,
                    "fineAmount": 0,
                    "netAmount": 5000,
                    "paidAmount": 0,
                    "balanceAmount": 5000,
                    "dueDate": "2026-10-10",
                    "status": "OVERDUE",
                }
            ],
            "transactions": [],
            "receipts": [],
            "cheques": [],
            "paymentLinks": [],
            "approvals": [],
            "concessions": [],
            "auditLog": [],
            "sequence": {"pay": 1, "rec": 1, "txn": 1, "voucher": 1, "link": 1},
            "meta": {"seeded": True},
        }
    }
    saved = client.put("/api/v1/finance/state", json=payload, headers=headers)
    assert saved.status_code == 200, saved.text

    # Without late-fee-aware balance this used to fail with "Amount exceeds balance … ₹5000".
    paid = client.post(
        "/api/v1/finance/actions/collect-payment",
        headers=headers,
        json={
            "studentId": "STU-1",
            "paymentMode": "CASH",
            "paymentDate": "2026-10-19",
            "allocations": [{"installmentId": "INST-OVERDUE", "amount": 5050}],
        },
    )
    assert paid.status_code == 200, paid.text
    assert paid.json()["receipt"]["amountPaid"] == 5050

    state = client.get("/api/v1/finance/state", headers=headers)
    assert state.status_code == 200
    row = next(i for i in state.json()["data"]["installments"] if i["id"] == "INST-OVERDUE")
    assert float(row["fineAmount"]) == 50
    assert float(row["netAmount"]) == 5050
    assert float(row["paidAmount"]) == 5050
    assert float(row["balanceAmount"]) == 0
    assert row["status"] == "PAID"
    receipt_id = paid.json()["receipt"]["id"]
    sent = client.post(
        "/api/v1/finance/actions/send-receipt",
        headers=headers,
        json={"receiptId": receipt_id, "channel": "whatsapp"},
    )
    assert sent.status_code == 200, sent.text
    assert sent.json()["delivery"]["status"] == "queued_stub"
    assert sent.json()["delivery"]["delivered"] is False
    assert sent.json()["receipt"]["communication"]["whatsapp"] is False
    assert sent.json()["receipt"]["communication"]["whatsappStatus"] == "queued_stub"


def test_gateway_intent_and_approval(client):
    headers = _login(client)
    _seed_state(client, headers)
    intent = client.post(
        "/api/v1/finance/actions/gateway-intent",
        headers=headers,
        json={"studentId": "STU-1", "amount": 500, "installmentIds": ["INST-1"]},
    )
    assert intent.status_code == 200, intent.text
    assert intent.json()["intent"]["gateway"] == "stub"
    reference = intent.json()["intent"]["reference"]
    confirmed = client.post(
        "/api/v1/finance/actions/gateway-confirm",
        headers=headers,
        json={"reference": reference},
    )
    assert confirmed.status_code == 200, confirmed.text
    assert confirmed.json()["intent"]["status"] == "PAID"
    again = client.post(
        "/api/v1/finance/actions/gateway-confirm",
        headers=headers,
        json={"reference": reference},
    )
    assert again.status_code == 200
    assert again.json().get("skipped") is True
    decided = client.post(
        "/api/v1/finance/actions/decide-approval",
        headers=headers,
        json={"approvalId": "APR-1", "decision": "approved", "remarks": "ok"},
    )
    assert decided.status_code == 200, decided.text
    assert decided.json()["approval"]["status"] == "Approved"


def _state(client, headers) -> dict:
    return client.get("/api/v1/finance/state", headers=headers).json()["data"]


def _installment(data: dict, installment_id: str) -> dict:
    return next(row for row in data["installments"] if row["id"] == installment_id)


def test_verified_gateway_payment_settles_the_instalments_once(client):
    headers = _login(client)
    _seed_state(client, headers)
    intent = client.post("/api/v1/finance/actions/gateway-intent", headers=headers,
                         json={"studentId": "STU-1", "amount": 400, "installmentIds": ["INST-1"]}).json()["intent"]
    confirmed = client.post("/api/v1/finance/actions/gateway-confirm", headers=headers,
                            json={"reference": intent["reference"]})
    assert confirmed.status_code == 200, confirmed.text
    receipt = confirmed.json()["receipt"]
    assert receipt["amountPaid"] == 400 and receipt["paymentMode"] == "PAYMENT_GATEWAY"

    data = _state(client, headers)
    row = _installment(data, "INST-1")
    assert row["paidAmount"] == 400 and row["status"] == "PARTIALLY_PAID"
    link = next(item for item in data["paymentLinks"] if item["reference"] == intent["reference"])
    assert link["status"] == "PAID" and link["receiptNo"] == receipt["receiptNo"]
    assert any(t["paymentMode"] == "PAYMENT_GATEWAY" for t in data["transactions"])
    assert data.get("bankBookEntries"), "gateway receipts post to the bank book"

    again = client.post("/api/v1/finance/actions/gateway-confirm", headers=headers, json={"reference": intent["reference"]})
    assert again.json().get("skipped") is True
    data = _state(client, headers)
    assert _installment(data, "INST-1")["paidAmount"] == 400
    assert len([r for r in data["receipts"] if r["receiptNo"] == receipt["receiptNo"]]) == 1


def test_gateway_payment_for_an_already_settled_instalment_is_flagged_not_lost(client):
    headers = _login(client)
    _seed_state(client, headers)
    intent = client.post("/api/v1/finance/actions/gateway-intent", headers=headers,
                         json={"studentId": "STU-1", "amount": 1000, "installmentIds": ["INST-1"]}).json()["intent"]
    desk = client.post("/api/v1/finance/actions/collect-payment", headers=headers, json={
        "studentId": "STU-1", "paymentMode": "CASH", "allocations": [{"installmentId": "INST-1", "amount": 1000}]})
    assert desk.status_code == 200, desk.text
    confirmed = client.post("/api/v1/finance/actions/gateway-confirm", headers=headers, json={"reference": intent["reference"]})
    assert confirmed.status_code == 200 and confirmed.json()["receipt"] is None
    data = _state(client, headers)
    assert _installment(data, "INST-1")["paidAmount"] == 1000
    link = next(item for item in data["paymentLinks"] if item["reference"] == intent["reference"])
    assert link["status"] == "PAID" and link["unallocatedAmount"] == 1000
    assert any(entry["action"] == "GATEWAY_PAYMENT_UNALLOCATED" for entry in data["auditLog"])


def test_a_cheque_cleared_twice_pays_its_instalment_once(client):
    headers = _login(client)
    _seed_state(client, headers)
    held = client.post("/api/v1/finance/actions/collect-payment", headers=headers, json={
        "studentId": "STU-1", "paymentMode": "CHEQUE", "allocations": [{"installmentId": "INST-1", "amount": 1000}],
        "details": {"chequeNo": "123456", "bank": "SBI", "chequeDate": "2026-10-01"}})
    assert held.status_code == 200, held.text
    cheque_id = _state(client, headers)["cheques"][0]["id"]
    for status in ("CLEARED", "RECEIVED", "CLEARED"):
        moved = client.post("/api/v1/finance/actions/settle-cheque", headers=headers,
                            json={"chequeId": cheque_id, "status": status})
        assert moved.status_code == 200, moved.text
    assert _installment(_state(client, headers), "INST-1")["paidAmount"] == 1000


def test_parent_gets_one_in_app_confirmation_per_payment(client):
    admin = _login(client, "admin@qmis.edu", "admin123")
    admission = client.post("/api/v1/admissions", headers=admin, json={
        "first_name": "Ira", "mobile_number": "9000011111", "class_name": "Grade 7",
        "parent_account_email": "parent.ira@example.com"})
    assert admission.status_code == 201, admission.text
    enrolled = client.post(f"/api/v1/admissions/{admission.json()['id']}/enroll", headers=admin, json={
        "parent_account_email": "parent.ira@example.com", "parent_account_password": "Parent-Test-2026"})
    assert enrolled.status_code == 200, enrolled.text
    student_id = str(enrolled.json()["student_id"])

    headers = _login(client)
    seeded = client.put("/api/v1/finance/state", headers=headers, json={"data": {
        "students": [{"id": student_id, "name": "Ira", "admissionNo": "ADM-IRA", "className": "Grade 7", "academicYear": "2026-2027"}],
        "installments": [{"id": "INST-IRA", "studentId": student_id, "feeHead": "Tuition", "feeAmount": 1500,
                          "netAmount": 1500, "paidAmount": 0, "balanceAmount": 1500, "status": "UNPAID"}],
        "transactions": [], "receipts": [], "cheques": [], "paymentLinks": [], "concessions": [], "auditLog": [],
        "sequence": {"pay": 1, "rec": 1, "txn": 1, "voucher": 1, "link": 1}, "meta": {"seeded": True}}})
    assert seeded.status_code == 200, seeded.text
    paid = client.post("/api/v1/finance/actions/collect-payment", headers=headers, json={
        "studentId": student_id, "paymentMode": "UPI", "allocations": [{"installmentId": "INST-IRA", "amount": 1500}]})
    assert paid.status_code == 200, paid.text
    receipt_no = paid.json()["receipt"]["receiptNo"]

    first_login = _login(client, "parent.ira@example.com", "Parent-Test-2026")
    changed = client.post("/api/v1/auth/change-password", headers=first_login,
                          json={"current_password": "Parent-Test-2026", "new_password": "Parent-Test-2027"})
    assert changed.status_code == 200, changed.text
    parent = _login(client, "parent.ira@example.com", "Parent-Test-2027")
    notes = client.get("/api/v1/notifications", headers=parent)
    assert notes.status_code == 200, notes.text
    mine = [n for n in notes.json() if n.get("entityType") == "fee_receipt" and n.get("entityId") == receipt_no]
    assert len(mine) == 1
    assert "1,500" in mine[0]["title"] and receipt_no in mine[0]["body"]
    # staff do not receive the parent's confirmation
    staff_notes = client.get("/api/v1/notifications", headers=headers).json()
    assert not any(n.get("entityId") == receipt_no for n in staff_notes)


def test_hr_concession_and_payroll_voucher(client):
    admin = _login(client, "admin@qmis.edu", "admin123")
    hr = _login(client, "hr@qmis.edu", "hr12345")
    _seed_state(client, admin)
    con = client.post(
        "/api/v1/hr/concessions",
        headers=hr,
        json={
            "id": "CON-MOD-FIN",
            "employeeId": "EMP-2026-001",
            "studentName": "Wrong Name Should Still Match Adm",
            "admissionNumber": "ADM-1",
            "percent": 50,
            "status": "Approved",
        },
    )
    assert con.status_code == 201, con.text
    applied = client.post("/api/v1/finance/actions/apply-hr-concessions", headers=admin)
    assert applied.status_code == 200, applied.text
    assert applied.json()["applied"] >= 1
    installment = next(
        row for row in applied.json()["state"]["data"]["installments"] if row["id"] == "INST-1"
    )
    assert installment["concessionAmount"] == 500

    payroll = client.put(
        "/api/v1/hr/payroll-months",
        headers=hr,
        json=[{
            "id": "PAY-FIN-1",
            "employeeId": "EMP-2026-001",
            "month": "June",
            "year": 2026,
            "paymentStatus": "Paid",
            "netSalary": 42000,
        }],
    )
    assert payroll.status_code == 200, payroll.text
    finance = client.get("/api/v1/finance/state", headers=admin)
    assert finance.status_code == 200
    txns = finance.json()["data"]["transactions"]
    assert any(row.get("sourceModule") == "PAYROLL" and row.get("amount") == 42000 for row in txns)
