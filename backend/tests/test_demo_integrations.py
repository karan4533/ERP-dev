"""Demo-mode Razorpay / SMTP / WhatsApp — local outbox, not live merchant delivery."""

import os

os.environ["DATABASE_URL"] = "sqlite+pysqlite:///:memory:"
os.environ["OTP_DEBUG"] = "true"
os.environ["JWT_SECRET"] = "test-secret-qmis-erp-demo-integrations"
os.environ["RFID_IMPORT_ENABLED"] = "false"

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.services.integrations import payments
from app.services.integrations.demo import demo_outbox_path


@pytest.fixture()
def client(tmp_path, monkeypatch):
    # Override autouse stub for this module's tests only.
    monkeypatch.setenv("INTEGRATIONS_MODE", "demo")
    monkeypatch.setenv("UPLOAD_DIR", str(tmp_path))
    from app.core import config

    config.settings.upload_dir = str(tmp_path)
    config.settings.integrations_mode = "demo"
    with TestClient(app) as test_client:
        yield test_client



def _login(client: TestClient, email="accounthead@qmis.edu", password="accounts123") -> dict:
    response = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    assert response.status_code == 200, response.text
    return {"Authorization": f"Bearer {response.json()['access_token']}"}


def test_demo_gateway_email_whatsapp_and_rfid_off(client):
    from app.core.config import settings

    assert settings.demo_integrations is True
    assert settings.rfid_import_enabled is False

    headers = _login(client)
    seed = client.put(
        "/api/v1/finance/state",
        headers=headers,
        json={
            "data": {
                "students": [{
                    "id": "STU-D1",
                    "name": "Demo Child",
                    "admissionNo": "ADM-D1",
                    "email": "parent.demo@example.com",
                    "guardianPhone": "9000000001",
                    "academicYear": "2026-2027",
                }],
                "installments": [{
                    "id": "INST-D1",
                    "studentId": "STU-D1",
                    "feeAmount": 2000,
                    "netAmount": 2000,
                    "paidAmount": 0,
                    "balanceAmount": 2000,
                    "status": "UNPAID",
                }],
                "transactions": [],
                "receipts": [],
                "paymentLinks": [],
                "concessions": [],
                "auditLog": [],
                "sequence": {"pay": 1, "rec": 1, "txn": 1, "voucher": 1, "link": 1},
                "meta": {"seeded": True},
            }
        },
    )
    assert seed.status_code == 200, seed.text

    intent = client.post(
        "/api/v1/finance/actions/gateway-intent",
        headers=headers,
        json={"studentId": "STU-D1", "amount": 2000, "installmentIds": ["INST-D1"]},
    )
    assert intent.status_code == 200, intent.text
    body = intent.json()["intent"]
    assert body["gateway"] == "razorpay"
    assert str(body["providerOrderId"]).startswith("order_demo_")

    payment_id = "pay_demo_test_1"
    signature = payments.demo_payment_signature(order_id=body["providerOrderId"], payment_id=payment_id)
    confirmed = client.post(
        "/api/v1/finance/actions/gateway-confirm",
        headers=headers,
        json={
            "reference": body["reference"],
            "razorpay_order_id": body["providerOrderId"],
            "razorpay_payment_id": payment_id,
            "razorpay_signature": signature,
        },
    )
    assert confirmed.status_code == 200, confirmed.text
    assert confirmed.json()["intent"]["status"] == "PAID"

    paid = client.post(
        "/api/v1/finance/actions/collect-payment",
        headers=headers,
        json={
            "studentId": "STU-D1",
            "paymentMode": "ONLINE",
            "allocations": [{"installmentId": "INST-D1", "amount": 2000}],
        },
    )
    assert paid.status_code == 200, paid.text
    receipt_id = paid.json()["receipt"]["id"]

    email = client.post(
        "/api/v1/finance/actions/send-receipt",
        headers=headers,
        json={"receiptId": receipt_id, "channel": "email"},
    )
    assert email.status_code == 200, email.text
    assert email.json()["delivery"]["status"] == "demo_sent"
    assert email.json()["delivery"]["delivered"] is True
    assert email.json()["delivery"].get("demo") is True

    wa = client.post(
        "/api/v1/finance/actions/send-receipt",
        headers=headers,
        json={"receiptId": receipt_id, "channel": "whatsapp"},
    )
    assert wa.status_code == 200, wa.text
    assert wa.json()["delivery"]["status"] == "demo_sent"

    outbox = demo_outbox_path()
    assert outbox.exists()
    text = outbox.read_text(encoding="utf-8")
    assert "razorpay" in text
    assert "email" in text
    assert "whatsapp" in text
