"""Receipts come only from server payment processing; Finance data saves cannot forge or alter them."""

import hashlib
import hmac
import json
import os

os.environ["DATABASE_URL"] = "sqlite+pysqlite:///:memory:"
os.environ["OTP_DEBUG"] = "true"
os.environ["JWT_SECRET"] = "test-secret-qmis-erp-receipt-integrity"
os.environ["ENVIRONMENT"] = "development"

from uuid import UUID

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import select

from app.core.config import settings
from app.core.database import SessionLocal
from app.main import app
from app.models import Admission, AuditLog, FinanceRecord, User
from app.services import admissions as admissions_svc
from app.services.finance import RECEIPT_LEDGER_COLLECTION
from app.services.integrations import payments
from tests.conftest import reset_sqlite_memory_schema


@pytest.fixture()
def client(monkeypatch):
    reset_sqlite_memory_schema()
    monkeypatch.setattr(settings, "payment_provider", "stub")
    monkeypatch.setenv("INTEGRATIONS_MODE", "")
    with TestClient(app) as test_client:
        yield test_client


def _login(client, email, password):
    from auth_test_helpers import login_headers

    return login_headers(client, email, password)


def _admin(client):
    return _login(client, settings.admin_seed_email, settings.admin_seed_password)


def _finance(client):
    return _login(client, settings.accounthead_seed_email, settings.accounthead_seed_password)


def _create_admission(client, headers, tag, fee="5000"):
    created = client.post(
        "/api/v1/admissions",
        headers=headers,
        json={
            "first_name": f"Rcpt{tag}",
            "last_name": "Check",
            "mobile_number": "9000088888",
            "class_name": "Grade 5",
            "father_name": "Parent Rcpt",
            "parent_account_email": f"parent.rcpt.{tag.lower()}@example.com",
            "registration_fees": fee,
            "fees_group": "RegFeeStatus:Paid",
        },
    )
    assert created.status_code in (200, 201), created.text
    with SessionLocal() as db:
        code = db.get(Admission, UUID(str(created.json()["id"]))).admission_code
    return created.json(), code


def _enroll(client, headers, created, tag):
    return client.post(
        f"/api/v1/admissions/{created['id']}/enroll",
        headers=headers,
        json={"parent_account_email": f"parent.rcpt.{tag.lower()}@example.com", "parent_account_password": "Parent-Test-2026"},
    )


def _seed_registration_fee(client, finance, code, *, amount=5000, receipts=None):
    """Finance puts the pre-admission student and a registration-fee instalment on the ledger."""
    saved = client.put(
        "/api/v1/finance/state",
        headers=finance,
        json={
            "data": {
                "students": [{"id": f"PRE-{code}", "name": "Rcpt Check", "admissionNo": code, "className": "Grade 5"}],
                "installments": [
                    {
                        "id": f"INST-REG-{code}",
                        "studentId": f"PRE-{code}",
                        "feeHead": "Registration Fee",
                        "installmentLabel": "Registration",
                        "feeAmount": amount,
                        "netAmount": amount,
                        "paidAmount": 0,
                        "balanceAmount": amount,
                        "status": "UNPAID",
                    }
                ],
                "receipts": receipts or [],
                "meta": {"seeded": True},
            }
        },
    )
    return saved


def _state(client, headers):
    return client.get("/api/v1/finance/state", headers=headers).json()["data"]


def _pending_ids(client, finance):
    return {row["id"] for row in client.get("/api/v1/admissions/fee-pending", headers=finance).json()}


def _forged_receipt(code, amount=5000):
    return {
        "id": "RCP-FORGED-1",
        "receiptNo": "REC-9999",
        "studentId": f"PRE-{code}",
        "admissionNo": code,
        "feeHeads": ["Registration Fee"],
        "amountPaid": amount,
        "paymentMode": "CASH",
        "status": "Issued",
        "receiptSource": {"channel": "desk_collection", "verifiedBy": "server"},
    }


def test_admin_cannot_forge_receipts_through_finance_saves(client):
    admin = _admin(client)
    created, code = _create_admission(client, admin, "Forge")

    forged = _seed_registration_fee(client, admin, code, receipts=[_forged_receipt(code)])
    assert forged.status_code == 403, forged.text
    assert forged.json()["detail"]["code"] == "receipt_server_only"

    assert _seed_registration_fee(client, admin, code).status_code == 200
    replaced = client.put("/api/v1/finance/receipts", headers=admin, json=[_forged_receipt(code)])
    assert replaced.status_code == 403, replaced.text
    assert _state(client, admin)["receipts"] == []

    blocked = _enroll(client, admin, created, "Forge")
    assert blocked.status_code == 409 and blocked.json()["detail"]["code"] == "fee_pending"


def test_only_the_finance_desk_records_payments(client):
    admin = _admin(client)
    finance = _finance(client)
    _created, code = _create_admission(client, admin, "Desk")
    assert _seed_registration_fee(client, finance, code).status_code == 200
    body = {"studentId": f"PRE-{code}", "paymentMode": "CASH", "allocations": [{"installmentId": f"INST-REG-{code}", "amount": 5000}]}

    for email, password in (
        (settings.admin_seed_email, settings.admin_seed_password),
        (settings.superadmin_seed_email, settings.superadmin_seed_password),
    ):
        denied = client.post("/api/v1/finance/actions/collect-payment", headers=_login(client, email, password), json=body)
        assert denied.status_code == 403, (email, denied.text)
    assert _state(client, finance)["receipts"] == []

    cheque = client.post("/api/v1/finance/actions/collect-payment", headers=finance, json={
        **body, "paymentMode": "CHEQUE", "details": {"chequeNo": "000111", "bank": "SBI", "chequeDate": "2026-11-14"}})
    assert cheque.status_code == 200, cheque.text
    cheque_id = _state(client, finance)["cheques"][0]["id"]
    cleared_by_admin = client.post("/api/v1/finance/actions/settle-cheque", headers=admin, json={"chequeId": cheque_id, "status": "CLEARED"})
    assert cleared_by_admin.status_code == 403, cleared_by_admin.text


def test_desk_receipt_records_its_source_and_clears_the_admission_fee_gate(client):
    admin = _admin(client)
    finance = _finance(client)
    created, code = _create_admission(client, admin, "Paid")
    assert _seed_registration_fee(client, finance, code).status_code == 200
    assert created["id"] in _pending_ids(client, finance)

    paid = client.post("/api/v1/finance/actions/collect-payment", headers=finance, json={
        "studentId": f"PRE-{code}", "paymentMode": "CASH",
        "allocations": [{"installmentId": f"INST-REG-{code}", "amount": 5000}]})
    assert paid.status_code == 200, paid.text
    receipt = paid.json()["receipt"]
    assert receipt["admissionNo"] == code
    source = receipt["receiptSource"]
    assert source["channel"] == "desk_collection" and source["verifiedBy"] == "server"
    assert source["recordedByRole"] == "accounthead" and source["recordedByEmail"] == settings.accounthead_seed_email

    with SessionLocal() as db:
        ledger = db.scalar(select(FinanceRecord).where(
            FinanceRecord.collection == RECEIPT_LEDGER_COLLECTION, FinanceRecord.public_id == receipt["id"]))
        assert ledger is not None
        assert ledger.body["amountPaid"] == 5000 and ledger.body["status"] == "Issued"
        assert ledger.body["admissionNo"] == code and ledger.body["source"]["channel"] == "desk_collection"
        audit = db.scalar(select(AuditLog).where(AuditLog.action == "FEE_RECEIPT_ISSUED", AuditLog.entity_id == receipt["receiptNo"]))
        assert audit is not None and "channel=desk_collection" in audit.details

    assert created["id"] not in _pending_ids(client, finance)
    ok = _enroll(client, admin, created, "Paid")
    assert ok.status_code == 200, ok.text


def test_finance_saves_keep_receipts_and_only_change_reprint_fields(client):
    admin = _admin(client)
    finance = _finance(client)
    _created, code = _create_admission(client, admin, "Keep")
    assert _seed_registration_fee(client, finance, code).status_code == 200
    paid = client.post("/api/v1/finance/actions/collect-payment", headers=finance, json={
        "studentId": f"PRE-{code}", "paymentMode": "CASH",
        "allocations": [{"installmentId": f"INST-REG-{code}", "amount": 2000}]})
    assert paid.status_code == 200, paid.text
    original = paid.json()["receipt"]

    data = _state(client, finance)
    data["receipts"] = [{**original, "amountPaid": 99999, "status": "Issued", "studentId": "SOMEONE",
                         "reprintCount": 2, "reprintReason": "Parent copy"}]
    saved = client.put("/api/v1/finance/state", headers=admin, json={"data": data})
    assert saved.status_code == 200, saved.text
    kept = next(row for row in _state(client, finance)["receipts"] if row["id"] == original["id"])
    assert kept["amountPaid"] == 2000 and kept["studentId"] == original["studentId"]
    assert kept["reprintCount"] == 2 and kept["reprintReason"] == "Parent copy"

    data["receipts"] = []
    assert client.put("/api/v1/finance/state", headers=admin, json={"data": data}).status_code == 200
    assert [row["id"] for row in _state(client, finance)["receipts"]] == [original["id"]]
    refused = client.post("/api/v1/finance/state/reset", headers=admin)
    assert refused.status_code == 409 and refused.json()["detail"]["code"] == "receipts_present"
    assert _state(client, finance)["receipts"]


def test_a_reset_receipt_sequence_never_reuses_a_receipt_number(client):
    finance = _finance(client)
    admin = _admin(client)
    _created, code = _create_admission(client, admin, "Seq")
    assert _seed_registration_fee(client, finance, code).status_code == 200
    allocation = {"studentId": f"PRE-{code}", "paymentMode": "CASH", "allocations": [{"installmentId": f"INST-REG-{code}", "amount": 1000}]}
    first = client.post("/api/v1/finance/actions/collect-payment", headers=finance, json=allocation).json()["receipt"]
    data = _state(client, finance)
    data["sequence"] = {**data["sequence"], "rec": 1}
    assert client.put("/api/v1/finance/state", headers=finance, json={"data": data}).status_code == 200
    second = client.post("/api/v1/finance/actions/collect-payment", headers=finance, json=allocation).json()["receipt"]
    assert second["receiptNo"] != first["receiptNo"]


def test_snapshot_receipt_written_directly_does_not_clear_the_gate(client):
    admin = _admin(client)
    created, code = _create_admission(client, admin, "Snap")
    with SessionLocal() as db:
        campus_id = db.scalar(select(User).where(User.email == settings.admin_seed_email)).campus_id
        db.add(FinanceRecord(campus_id=campus_id, collection="snapshot", public_id="current",
                             body={"students": [], "receipts": [_forged_receipt(code)]}))
        db.commit()
    blocked = _enroll(client, admin, created, "Snap")
    assert blocked.status_code == 409, blocked.text


def test_a_bounced_cheque_receipt_does_not_clear_the_gate(client):
    admin = _admin(client)
    finance = _finance(client)
    created, code = _create_admission(client, admin, "Chq")
    assert _seed_registration_fee(client, finance, code).status_code == 200
    held = client.post("/api/v1/finance/actions/collect-payment", headers=finance, json={
        "studentId": f"PRE-{code}", "paymentMode": "CHEQUE",
        "details": {"chequeNo": "000222", "bank": "SBI", "chequeDate": "2026-11-14"},
        "allocations": [{"installmentId": f"INST-REG-{code}", "amount": 5000}]})
    assert held.status_code == 200, held.text
    assert created["id"] in _pending_ids(client, finance)

    cheque_id = _state(client, finance)["cheques"][0]["id"]
    cleared = client.post("/api/v1/finance/actions/settle-cheque", headers=finance, json={"chequeId": cheque_id, "status": "CLEARED"})
    assert cleared.status_code == 200, cleared.text
    assert created["id"] not in _pending_ids(client, finance)

    bounced = client.post("/api/v1/finance/actions/settle-cheque", headers=finance,
                          json={"chequeId": cheque_id, "status": "BOUNCED", "reason": "Insufficient funds"})
    assert bounced.status_code == 200, bounced.text
    assert created["id"] in _pending_ids(client, finance)
    with SessionLocal() as db:
        ledger = db.scalar(select(FinanceRecord).where(FinanceRecord.collection == RECEIPT_LEDGER_COLLECTION))
        assert ledger.body["status"] == "Bounced"
        assert [step["to"] for step in ledger.body["statusHistory"]] == ["Issued", "Bounced"]
    assert _enroll(client, admin, created, "Chq").status_code == 409


def test_gateway_confirm_pays_the_server_intent_not_the_edited_link(client):
    admin = _admin(client)
    finance = _finance(client)
    _created, code = _create_admission(client, admin, "Gate")
    assert _seed_registration_fee(client, finance, code).status_code == 200
    intent = client.post("/api/v1/finance/actions/gateway-intent", headers=finance,
                         json={"studentId": f"PRE-{code}", "amount": 100, "installmentIds": [f"INST-REG-{code}"]})
    assert intent.status_code == 200, intent.text
    reference = intent.json()["intent"]["reference"]

    data = _state(client, finance)
    for link in data["paymentLinks"]:
        if link["reference"] == reference:
            link["amount"] = 5000
    assert client.put("/api/v1/finance/state", headers=admin, json={"data": data}).status_code == 200

    confirmed = client.post("/api/v1/finance/actions/gateway-confirm", headers=finance, json={"reference": reference})
    assert confirmed.status_code == 200, confirmed.text
    assert confirmed.json()["receipt"]["amountPaid"] == 100
    assert confirmed.json()["receipt"]["receiptSource"]["channel"] == "online_gateway"

    # Re-opening the link in the saved data does not let the same payment settle twice.
    data = _state(client, finance)
    for link in data["paymentLinks"]:
        if link["reference"] == reference:
            link["status"] = "OPEN"
            link.pop("settledTransactionId", None)
    assert client.put("/api/v1/finance/state", headers=admin, json={"data": data}).status_code == 200
    again = client.post("/api/v1/finance/actions/gateway-confirm", headers=finance, json={"reference": reference})
    assert again.status_code == 200 and again.json().get("skipped") is True
    assert len(_state(client, finance)["receipts"]) == 1


def test_gateway_confirm_refuses_a_link_the_server_never_created(client):
    admin = _admin(client)
    finance = _finance(client)
    data = _state(client, finance)
    data["students"] = [{"id": "STU-X", "name": "X", "admissionNo": "ADM-X"}]
    data["paymentLinks"] = [{"id": "LNK-PAY-7777", "reference": "PAY-7777", "studentId": "STU-X", "amount": 5000,
                             "installmentIds": [], "status": "OPEN", "gateway": "stub"}]
    assert client.put("/api/v1/finance/state", headers=admin, json={"data": data}).status_code == 200
    refused = client.post("/api/v1/finance/actions/gateway-confirm", headers=finance, json={"reference": "PAY-7777"})
    assert refused.status_code == 409, refused.text
    assert refused.json()["detail"]["code"] == "unknown_payment_intent"


def test_razorpay_payment_for_another_order_is_refused(client, monkeypatch):
    monkeypatch.setenv("INTEGRATIONS_MODE", "demo")
    monkeypatch.setattr(settings, "payment_provider", "razorpay")
    finance = _finance(client)
    small = client.post("/api/v1/finance/actions/gateway-intent", headers=finance,
                        json={"studentId": "STU-A", "amount": 1, "installmentIds": []}).json()["intent"]
    large = client.post("/api/v1/finance/actions/gateway-intent", headers=finance,
                        json={"studentId": "STU-A", "amount": 5000, "installmentIds": []}).json()["intent"]
    payment_id = "pay_small_1"
    small_signature = payments.demo_payment_signature(order_id=small["providerOrderId"], payment_id=payment_id)

    mismatched = client.post("/api/v1/finance/actions/gateway-confirm", headers=finance, json={
        "reference": large["reference"], "razorpay_order_id": small["providerOrderId"],
        "razorpay_payment_id": payment_id, "razorpay_signature": small_signature})
    assert mismatched.status_code == 400 and mismatched.json()["detail"]["code"] == "order_mismatch"

    reused = client.post("/api/v1/finance/actions/gateway-confirm", headers=finance, json={
        "reference": large["reference"], "razorpay_payment_id": payment_id, "razorpay_signature": small_signature})
    assert reused.status_code == 400 and reused.json()["detail"]["code"] == "invalid_signature"


def test_razorpay_webhook_with_a_different_amount_is_refused(client, monkeypatch):
    monkeypatch.setenv("INTEGRATIONS_MODE", "demo")
    monkeypatch.setattr(settings, "payment_provider", "razorpay")
    monkeypatch.setattr(settings, "razorpay_webhook_secret", "whsec_amount_test")
    finance = _finance(client)
    intent = client.post("/api/v1/finance/actions/gateway-intent", headers=finance,
                         json={"studentId": "STU-W", "amount": 5000, "installmentIds": []}).json()["intent"]

    def _post(amount_paise):
        body = {"event": "payment.captured", "payload": {"payment": {"entity": {
            "id": "pay_wh_1", "order_id": intent["providerOrderId"], "amount": amount_paise}}}}
        raw = json.dumps(body, separators=(",", ":")).encode()
        signature = hmac.new(b"whsec_amount_test", raw, hashlib.sha256).hexdigest()
        return client.post("/api/v1/webhooks/razorpay", content=raw,
                           headers={"Content-Type": "application/json", "X-Razorpay-Signature": signature})

    wrong = _post(100)
    assert wrong.status_code == 409 and wrong.json()["detail"]["code"] == "amount_mismatch"
    right = _post(500000)
    assert right.status_code == 200 and right.json()["success"] is True


def test_stub_gateway_receipts_are_trusted_only_in_development(monkeypatch):
    stub = {"channel": "online_gateway", "verifiedBy": "server", "confirmedVia": "stub"}
    signed = {"channel": "online_gateway", "verifiedBy": "server", "confirmedVia": "signature"}
    desk = {"channel": "desk_collection", "verifiedBy": "server"}
    assert admissions_svc._trusted_receipt_source(stub) is True
    monkeypatch.setattr(settings, "environment", "production")
    monkeypatch.setenv("INTEGRATIONS_MODE", "")
    assert admissions_svc._trusted_receipt_source(stub) is False
    assert admissions_svc._trusted_receipt_source(signed) is True
    assert admissions_svc._trusted_receipt_source(desk) is True
    assert admissions_svc._trusted_receipt_source({"channel": "desk_collection"}) is False
    assert admissions_svc._trusted_receipt_source({}) is False


def test_registration_fee_waiver_still_clears_the_gate(client):
    admin = _admin(client)
    finance = _finance(client)
    created, _code = _create_admission(client, admin, "Waive")
    waived = client.post(f"/api/v1/admissions/{created['id']}/fee-waiver", headers=finance, json={"reason": "Sibling concession"})
    assert waived.status_code == 200, waived.text
    with SessionLocal() as db:
        assert db.scalar(select(FinanceRecord).where(FinanceRecord.collection == RECEIPT_LEDGER_COLLECTION)) is None
    assert _enroll(client, admin, created, "Waive").status_code == 200
