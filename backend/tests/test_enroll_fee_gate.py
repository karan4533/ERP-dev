"""Backend enrolment requires a zero fee, a Finance waiver, or a server-issued admission receipt."""

import os

os.environ["DATABASE_URL"] = "sqlite+pysqlite:///:memory:"
os.environ["OTP_DEBUG"] = "true"
os.environ["JWT_SECRET"] = "test-secret-qmis-erp-enroll-fee"
os.environ["ENVIRONMENT"] = "development"

import pytest
from fastapi.testclient import TestClient

from app.core.config import settings
from app.core.database import SessionLocal
from app.main import app
from app.models import Admission, FinanceRecord, User
from sqlalchemy import select
from tests.conftest import reset_sqlite_memory_schema

ADMIN = (settings.admin_seed_email, settings.admin_seed_password)


@pytest.fixture()
def client():
    reset_sqlite_memory_schema()
    with TestClient(app) as test_client:
        yield test_client


def _login(client):
    from auth_test_helpers import login_headers

    return login_headers(client, *ADMIN)


def _create_admission(client, headers, *, tag: str, fees_group: str, registration_fees: str = "5000"):
    created = client.post(
        "/api/v1/admissions",
        headers=headers,
        json={
            "first_name": f"Fee{tag}",
            "last_name": "Gate",
            "mobile_number": "9000099999",
            "class_name": "Grade 5",
            "father_name": "Parent Fee",
            "parent_account_email": f"parent.fee.{tag.lower()}@example.com",
            "registration_fees": registration_fees,
            "fees_group": fees_group,
        },
    )
    assert created.status_code in (200, 201), created.text
    return created.json()


_SERVER_SOURCE = {"channel": "desk_collection", "verifiedBy": "server", "recordedByEmail": "accounthead@qmis.edu"}


def _put_admission_receipt(*, admission_code: str, student_name: str, amount: float = 5000, status: str = "Issued", extra=None):
    """Stand-in for receipts the server issued: replaces the campus receipt ledger."""
    from sqlalchemy import delete

    from app.services.finance import RECEIPT_LEDGER_COLLECTION

    with SessionLocal() as db:
        admin = db.scalar(select(User).where(User.email == ADMIN[0]))
        assert admin is not None
        receipts = [
            {
                "receiptId": "RCP-TEST-1",
                "receiptNo": "REC-TEST-1",
                "studentId": admission_code,
                "admissionNo": admission_code,
                "studentName": student_name,
                "feeHeads": ["Admission Fee"],
                "amountPaid": amount,
                "status": status,
                "paymentMode": "CASH",
                "source": _SERVER_SOURCE,
            }
        ]
        for row in extra or []:
            receipts.append({"source": _SERVER_SOURCE, **row, "receiptId": row["id"]})
        db.execute(
            delete(FinanceRecord).where(
                FinanceRecord.campus_id == admin.campus_id,
                FinanceRecord.collection == RECEIPT_LEDGER_COLLECTION,
            )
        )
        for receipt in receipts:
            db.add(
                FinanceRecord(
                    campus_id=admin.campus_id,
                    collection=RECEIPT_LEDGER_COLLECTION,
                    public_id=receipt["receiptId"],
                    body=receipt,
                )
            )
        db.commit()


def test_enroll_blocked_when_fee_pending(client):
    headers = _login(client)
    created = _create_admission(client, headers, tag="Pend", fees_group="Tuition, RegFeeStatus:Pending")
    blocked = client.post(
        f"/api/v1/admissions/{created['id']}/enroll",
        headers=headers,
        json={
            "parent_account_email": "parent.fee.pend@example.com",
            "parent_account_password": "Parent-Test-2026",
        },
    )
    assert blocked.status_code == 409, blocked.text
    assert blocked.json()["detail"]["code"] == "fee_pending"


def test_enroll_blocked_when_paid_token_without_receipt(client):
    """Frontend Paid token alone is not trusted."""
    headers = _login(client)
    created = _create_admission(client, headers, tag="Tokn", fees_group="RegFeeStatus:Paid")
    blocked = client.post(
        f"/api/v1/admissions/{created['id']}/enroll",
        headers=headers,
        json={
            "parent_account_email": "parent.fee.tokn@example.com",
            "parent_account_password": "Parent-Test-2026",
        },
    )
    assert blocked.status_code == 409, blocked.text
    assert blocked.json()["detail"]["code"] == "fee_pending"


def test_enroll_blocked_when_receipt_held_or_mismatched(client):
    headers = _login(client)
    created = _create_admission(client, headers, tag="Held", fees_group="")
    with SessionLocal() as db:
        admission = db.get(Admission, created["id"]) if False else None
    # Prefer code from response
    code = created.get("admission_code") or created.get("admissionCode")
    if not code:
        with SessionLocal() as db:
            from uuid import UUID
            admission = db.get(Admission, UUID(str(created["id"])))
            code = admission.admission_code
    _put_admission_receipt(admission_code=code, student_name="FeeHeld Gate", status="Held")
    blocked = client.post(
        f"/api/v1/admissions/{created['id']}/enroll",
        headers=headers,
        json={
            "parent_account_email": "parent.fee.held@example.com",
            "parent_account_password": "Parent-Test-2026",
        },
    )
    assert blocked.status_code == 409, blocked.text

    _put_admission_receipt(admission_code="OTHER-ADM", student_name="Someone Else", status="Issued")
    blocked2 = client.post(
        f"/api/v1/admissions/{created['id']}/enroll",
        headers=headers,
        json={
            "parent_account_email": "parent.fee.held@example.com",
            "parent_account_password": "Parent-Test-2026",
        },
    )
    assert blocked2.status_code == 409, blocked2.text


def test_enroll_allowed_when_verified_receipt_matches(client):
    headers = _login(client)
    created = _create_admission(client, headers, tag="Paid", fees_group="")
    with SessionLocal() as db:
        from uuid import UUID
        admission = db.get(Admission, UUID(str(created["id"])))
        code = admission.admission_code
        name = f"{admission.first_name} {admission.last_name}".strip()
    _put_admission_receipt(admission_code=code, student_name=name, status="Issued")
    ok = client.post(
        f"/api/v1/admissions/{created['id']}/enroll",
        headers=headers,
        json={
            "parent_account_email": "parent.fee.paid@example.com",
            "parent_account_password": "Parent-Test-2026",
        },
    )
    assert ok.status_code == 200, ok.text
    assert ok.json()["admission"]["status"] == "Enrolled"


def _enroll(client, headers, created, tag):
    return client.post(
        f"/api/v1/admissions/{created['id']}/enroll",
        headers=headers,
        json={
            "parent_account_email": f"parent.fee.{tag.lower()}@example.com",
            "parent_account_password": "Parent-Test-2026",
        },
    )


def _code_and_name(created):
    from uuid import UUID

    with SessionLocal() as db:
        admission = db.get(Admission, UUID(str(created["id"])))
        return admission.admission_code, f"{admission.first_name} {admission.last_name}".strip()


def _finance(client):
    from auth_test_helpers import login_headers

    return login_headers(client, settings.accounthead_seed_email, settings.accounthead_seed_password)


def test_waived_token_on_the_admission_form_is_not_a_waiver(client):
    """fees_group is editable by Admissions, so RegFeeStatus:Waived must not clear the gate."""
    headers = _login(client)
    created = _create_admission(client, headers, tag="Waiv", fees_group="RegFeeStatus:Waived")
    blocked = _enroll(client, headers, created, "Waiv")
    assert blocked.status_code == 409, blocked.text
    assert blocked.json()["detail"]["code"] == "fee_pending"


def test_finance_waiver_allows_enrolment_and_only_finance_can_waive(client):
    admin = _login(client)
    created = _create_admission(client, admin, tag="FinW", fees_group="")

    by_admin = client.post(f"/api/v1/admissions/{created['id']}/fee-waiver", json={"reason": "Staff child"}, headers=admin)
    assert by_admin.status_code == 403, by_admin.text
    from auth_test_helpers import login_headers

    prm = login_headers(client, "prm@qmis.edu", "prm12345")
    assert client.post(f"/api/v1/admissions/{created['id']}/fee-waiver", json={"reason": "x"}, headers=prm).status_code == 403

    finance = _finance(client)
    no_reason = client.post(f"/api/v1/admissions/{created['id']}/fee-waiver", json={"reason": ""}, headers=finance)
    assert no_reason.status_code == 422

    pending = client.get("/api/v1/admissions/fee-pending", headers=finance)
    assert pending.status_code == 200 and created["id"] in {row["id"] for row in pending.json()}

    waived = client.post(f"/api/v1/admissions/{created['id']}/fee-waiver", json={"reason": "Staff child concession"}, headers=finance)
    assert waived.status_code == 200, waived.text
    assert waived.json()["waivedByRole"] == "accounthead"
    again = client.post(f"/api/v1/admissions/{created['id']}/fee-waiver", json={"reason": "again"}, headers=finance)
    assert again.status_code == 200 and again.json().get("idempotent") is True

    assert created["id"] not in {row["id"] for row in client.get("/api/v1/admissions/fee-pending", headers=finance).json()}
    ok = _enroll(client, admin, created, "FinW")
    assert ok.status_code == 200, ok.text


def test_textual_waived_fee_amount_is_not_zero(client):
    headers = _login(client)
    for tag, text in (("Txt1", "waived"), ("Txt2", "Free"), ("Txt3", "NA")):
        created = _create_admission(client, headers, tag=tag, fees_group="", registration_fees=text)
        blocked = _enroll(client, headers, created, tag)
        assert blocked.status_code == 409, (text, blocked.text)


def test_receipt_with_the_same_name_but_another_admission_is_rejected(client):
    headers = _login(client)
    created = _create_admission(client, headers, tag="Name", fees_group="")
    _code, name = _code_and_name(created)
    _put_admission_receipt(admission_code="ADM-SOMEONE-ELSE", student_name=name, status="Issued")
    blocked = _enroll(client, headers, created, "Name")
    assert blocked.status_code == 409, blocked.text


def test_receipts_must_cover_the_registration_fee(client):
    headers = _login(client)
    created = _create_admission(client, headers, tag="Part", fees_group="", registration_fees="5000")
    code, name = _code_and_name(created)
    _put_admission_receipt(admission_code=code, student_name=name, amount=1000, status="Issued")
    assert _enroll(client, headers, created, "Part").status_code == 409

    second = {
        "id": "RCP-TEST-2",
        "receiptNo": "REC-TEST-2",
        "studentId": code,
        "admissionNo": code,
        "feeHeads": ["Registration Fee"],
        "amountPaid": 4000,
        "status": "Issued",
    }
    _put_admission_receipt(admission_code=code, student_name=name, amount=1000, status="Issued", extra=[second])
    ok = _enroll(client, headers, created, "Part")
    assert ok.status_code == 200, ok.text


def test_unsettled_receipt_statuses_do_not_count(client):
    headers = _login(client)
    created = _create_admission(client, headers, tag="Stat", fees_group="")
    code, name = _code_and_name(created)
    for status in ("Pending clearance", "Processing", ""):
        _put_admission_receipt(admission_code=code, student_name=name, status=status)
        assert _enroll(client, headers, created, "Stat").status_code == 409, status


def test_enroll_allowed_when_registration_fee_zero(client):
    headers = _login(client)
    created = _create_admission(
        client,
        headers,
        tag="Zero",
        fees_group="Tuition",
        registration_fees="0",
    )
    ok = client.post(
        f"/api/v1/admissions/{created['id']}/enroll",
        headers=headers,
        json={
            "parent_account_email": "parent.fee.zero@example.com",
            "parent_account_password": "Parent-Test-2026",
        },
    )
    assert ok.status_code == 200, ok.text
