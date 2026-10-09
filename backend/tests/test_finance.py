import os

os.environ["DATABASE_URL"] = "sqlite+pysqlite:///:memory:"
os.environ["OTP_DEBUG"] = "true"
os.environ["JWT_SECRET"] = "test-secret-qmis-erp-finance-ok"

import pytest
from fastapi.testclient import TestClient

from app.main import app


@pytest.fixture()
def client():
    with TestClient(app) as test_client:
        yield test_client


def _login(client: TestClient, email: str, password: str) -> dict:
    response = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    assert response.status_code == 200, response.text
    return {"Authorization": f"Bearer {response.json()['access_token']}"}


def test_accounthead_can_save_finance_state(client):
    headers = _login(client, "accounthead@qmis.edu", "accounts123")
    empty = client.get("/api/v1/finance/state", headers=headers)
    assert empty.status_code == 200, empty.text
    assert empty.json()["seeded"] is False

    payload = {
        "data": {
            "feeCategories": [{"id": "CAT-TUITION", "name": "Tuition Fee", "code": "TUITION", "active": True}],
            "feeStructures": [],
            "fineRules": [],
            "bankAccounts": [{"id": "BANK-1", "name": "SBI", "enabled": True}],
            "posTerminals": [],
            "concessions": [],
            "installments": [
                {
                    "id": "INST-1",
                    "studentId": "STU-1",
                    "feeAmount": 1000,
                    "paidAmount": 0,
                    "balanceAmount": 1000,
                    "status": "UNPAID",
                }
            ],
            "annualBudget": [],
            "transactions": [
                {
                    "id": "TXN-1",
                    "transactionNo": "TXN-0001",
                    "direction": "IN",
                    "amount": 500,
                    "status": "POSTED",
                    "sourceModule": "FEES",
                }
            ],
            "receipts": [{"id": "RCP-1", "receiptNo": "REC-0001", "amountPaid": 500}],
            "cheques": [],
            "paymentLinks": [],
            "auditLog": [],
            "glEntries": [],
            "dayBookEntries": [],
            "cashBookEntries": [],
            "bankBookEntries": [],
            "onlineBookEntries": [],
            "reconciliationItems": [],
            "students": [{"id": "STU-1", "name": "Test Student", "admissionNo": "ADM-1", "className": "Grade 1"}],
            "sequence": {"pay": 2, "rec": 2, "txn": 2, "voucher": 1, "link": 1},
            "meta": {"seeded": True},
        }
    }
    saved = client.put("/api/v1/finance/state", json=payload, headers=headers)
    assert saved.status_code == 200, saved.text
    body = saved.json()
    assert body["seeded"] is True
    assert body["data"]["receipts"][0]["receiptNo"] == "REC-0001"
    assert body["savedAt"]

    again = client.get("/api/v1/finance/state", headers=headers)
    assert again.status_code == 200
    assert again.json()["data"]["transactions"][0]["amount"] == 500

    receipts = client.get("/api/v1/finance/receipts", headers=headers)
    assert receipts.status_code == 200
    assert receipts.json()[0]["id"] == "RCP-1"


def test_hr_cannot_write_finance(client):
    headers = _login(client, "hr@qmis.edu", "hr12345")
    denied = client.put(
        "/api/v1/finance/state",
        json={"data": {"feeCategories": [], "meta": {"seeded": True}}},
        headers=headers,
    )
    assert denied.status_code == 403


def test_finance_reset(client):
    headers = _login(client, "admin@qmis.edu", "admin123")
    client.put(
        "/api/v1/finance/state",
        json={"data": {"feeCategories": [{"id": "X"}], "meta": {"seeded": True}}},
        headers=headers,
    )
    reset = client.post("/api/v1/finance/state/reset", headers=headers)
    assert reset.status_code == 200
    assert reset.json()["seeded"] is False
