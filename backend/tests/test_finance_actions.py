import os

os.environ["DATABASE_URL"] = "sqlite+pysqlite:///:memory:"
os.environ["OTP_DEBUG"] = "true"
os.environ["JWT_SECRET"] = "test-secret-qmis-erp-finance-actions"

import pytest
from fastapi.testclient import TestClient

from app.main import app


@pytest.fixture()
def client():
    with TestClient(app) as test_client:
        yield test_client


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
    decided = client.post(
        "/api/v1/finance/actions/decide-approval",
        headers=headers,
        json={"approvalId": "APR-1", "decision": "approved", "remarks": "ok"},
    )
    assert decided.status_code == 200, decided.text
    assert decided.json()["approval"]["status"] == "Approved"


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
            "studentName": "Aarav Sharma",
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
