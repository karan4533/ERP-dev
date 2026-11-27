import os

os.environ["DATABASE_URL"] = "sqlite+pysqlite:///:memory:"
os.environ["OTP_DEBUG"] = "true"
os.environ["JWT_SECRET"] = "test-secret-qmis-erp-finance-ok"

import pytest
from fastapi.testclient import TestClient

from app.core.config import settings
from app.main import app


@pytest.fixture()
def client():
    with TestClient(app) as test_client:
        yield test_client


def _login(client: TestClient, email: str, password: str) -> dict:
    response = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    assert response.status_code == 200, response.text
    return {"Authorization": f"Bearer {response.json()['access_token']}"}


def _drop_finance_snapshot():
    """Suite shares one in-memory DB; receipts block the API reset, so clear the snapshot row directly."""
    from sqlalchemy import delete

    from app.core.database import SessionLocal
    from app.models import FinanceRecord

    with SessionLocal() as db:
        db.execute(delete(FinanceRecord).where(FinanceRecord.collection == "snapshot"))
        db.commit()


def test_accounthead_can_save_finance_state(client):
    headers = _login(client, "accounthead@qmis.edu", "accounts123")
    _drop_finance_snapshot()
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
            "receipts": [],
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
    assert body["data"]["receipts"] == []
    assert body["savedAt"]

    again = client.get("/api/v1/finance/state", headers=headers)
    assert again.status_code == 200
    assert again.json()["data"]["transactions"][0]["amount"] == 500

    # A receipt typed into the saved Finance data is refused; receipts come only from payment actions.
    payload["data"]["receipts"] = [{"id": "RCP-1", "receiptNo": "REC-0001", "amountPaid": 500, "status": "Issued"}]
    forged = client.put("/api/v1/finance/state", json=payload, headers=headers)
    assert forged.status_code == 403, forged.text
    assert forged.json()["detail"]["code"] == "receipt_server_only"
    receipts = client.get("/api/v1/finance/receipts", headers=headers)
    assert receipts.status_code == 200
    assert receipts.json() == []


def test_hr_cannot_write_finance(client):
    headers = _login(client, "hr@qmis.edu", "hr12345")
    denied = client.put(
        "/api/v1/finance/state",
        json={"data": {"feeCategories": [], "meta": {"seeded": True}}},
        headers=headers,
    )
    assert denied.status_code == 403


def test_parent_fees_are_scoped_and_full_ledger_is_denied(client):
    admin = _login(client, "admin@qmis.edu", "admin123")
    enquiry = client.post(
        "/api/v1/admissions/enquiries",
        json={
            "name": "Fee Child",
            "mobile_number": "9000000001",
            "class_name": "Grade 1",
            "email": "parent.fees@example.com",
            "source": "Walk-in",
            "city": "Madurai",
        },
        headers=admin,
    )
    assert enquiry.status_code == 201, enquiry.text
    converted = client.post(
        f"/api/v1/admissions/enquiries/{enquiry.json()['id']}/convert",
        headers=admin,
    )
    assert converted.status_code == 200, converted.text
    admission_id = converted.json()["id"]
    enrolled = client.post(
        f"/api/v1/admissions/{admission_id}/enroll",
        json={
            "parent_account_email": "parent.fees@example.com",
            "parent_account_password": "Parent-Test-2026",
        },
        headers=admin,
    )
    assert enrolled.status_code == 200, enrolled.text
    student_code = enrolled.json()["student_code"]

    login = client.post(
        "/api/v1/auth/login",
        json={"email": "parent.fees@example.com", "password": "Parent-Test-2026"},
    )
    assert login.status_code == 200, login.text
    token = login.json()["access_token"]
    changed = client.post(
        "/api/v1/auth/change-password",
        headers={"Authorization": f"Bearer {token}"},
        json={"current_password": "Parent-Test-2026", "new_password": "Parent-Test-2027"},
    )
    assert changed.status_code == 200, changed.text
    parent = _login(client, "parent.fees@example.com", "Parent-Test-2027")

    denied = client.get("/api/v1/finance/state", headers=parent)
    assert denied.status_code == 403, denied.text

    mine = client.get("/api/v1/finance/my-fees", headers=parent)
    assert mine.status_code == 200, mine.text
    body = mine.json()["data"]
    assert body["meta"]["scopedFor"] == "parent"
    assert len(body["students"]) == 1
    assert body["students"][0]["admissionNo"] == student_code

    transport = client.get("/api/v1/ops/my-transport", headers=parent)
    assert transport.status_code == 200, transport.text
    assert transport.json()["assignments"] == []

    teacher = _login(client, "teacher@qmis.edu", "teacher123")
    assert client.get("/api/v1/finance/my-fees", headers=teacher).status_code == 403
    assert client.get("/api/v1/ops/my-transport", headers=teacher).status_code == 403


def test_parent_payment_is_confirmed_by_the_ledger(client, monkeypatch):
    admin = _login(client, "admin@qmis.edu", "admin123")
    enquiry = client.post(
        "/api/v1/admissions/enquiries",
        json={
            "name": "Pay Child",
            "mobile_number": "9000000002",
            "class_name": "Grade 2",
            "email": "parent.pay@example.com",
            "source": "Walk-in",
            "city": "Madurai",
        },
        headers=admin,
    )
    assert enquiry.status_code == 201, enquiry.text
    converted = client.post(
        f"/api/v1/admissions/enquiries/{enquiry.json()['id']}/convert",
        headers=admin,
    )
    assert converted.status_code == 200, converted.text
    enrolled = client.post(
        f"/api/v1/admissions/{converted.json()['id']}/enroll",
        json={
            "parent_account_email": "parent.pay@example.com",
            "parent_account_password": "Parent-Test-2026",
        },
        headers=admin,
    )
    assert enrolled.status_code == 200, enrolled.text
    first = client.post(
        "/api/v1/auth/login",
        json={"email": "parent.pay@example.com", "password": "Parent-Test-2026"},
    )
    token = first.json()["access_token"]
    changed = client.post(
        "/api/v1/auth/change-password",
        headers={"Authorization": f"Bearer {token}"},
        json={"current_password": "Parent-Test-2026", "new_password": "Parent-Test-2027"},
    )
    assert changed.status_code == 200, changed.text
    parent = _login(client, "parent.pay@example.com", "Parent-Test-2027")
    child = client.get("/api/v1/parents/me/children", headers=parent).json()[0]
    account = _login(client, "accounthead@qmis.edu", "accounts123")
    saved = client.put(
        "/api/v1/finance/state",
        headers=account,
        json={
            "data": {
                "students": [{"id": child["id"], "name": child["name"], "admissionNo": child["admissionNumber"]}],
                "installments": [{
                    "id": "INST-PAY-1",
                    "studentId": child["id"],
                    "feeHead": "Tuition",
                    "installmentLabel": "Term 1",
                    "feeAmount": 1000,
                    "concessionAmount": 0,
                    "fineAmount": 0,
                    "netAmount": 1000,
                    "paidAmount": 0,
                    "balanceAmount": 1000,
                    "status": "UNPAID",
                }],
                "receipts": [],
                "transactions": [],
                "meta": {"seeded": True},
            }
        },
    )
    assert saved.status_code == 200, saved.text
    # Saying "paid by UPI" from the portal is not proof of payment.
    claimed = client.post(
        "/api/v1/finance/actions/pay-my-fees",
        headers=parent,
        json={
            "studentId": child["id"],
            "paymentMode": "UPI",
            "allocations": [{"installmentId": "INST-PAY-1", "amount": 1000}],
        },
    )
    assert claimed.status_code == 403, claimed.text
    assert claimed.json()["detail"]["code"] == "gateway_required"
    assert float(client.get("/api/v1/finance/my-fees", headers=parent).json()["data"]["installments"][0]["paidAmount"]) == 0

    monkeypatch.setattr(settings, "payment_provider", "stub")
    intent = client.post(
        "/api/v1/finance/actions/gateway-intent",
        headers=parent,
        json={"studentId": child["id"], "amount": 1000, "installmentIds": ["INST-PAY-1"]},
    )
    assert intent.status_code == 200, intent.text
    paid = client.post(
        "/api/v1/finance/actions/gateway-confirm",
        headers=parent,
        json={"reference": intent.json()["intent"]["reference"]},
    )
    assert paid.status_code == 200, paid.text
    assert paid.json()["receipt"]["receiptNo"]
    assert paid.json()["receipt"]["receiptSource"]["channel"] == "online_gateway"
    again = client.get("/api/v1/finance/my-fees", headers=parent)
    installment = again.json()["data"]["installments"][0]
    assert float(installment["paidAmount"]) == 1000
    assert installment["status"] == "PAID"


def test_finance_reset(client):
    headers = _login(client, "admin@qmis.edu", "admin123")
    account = _login(client, "accounthead@qmis.edu", "accounts123")
    _drop_finance_snapshot()
    seeded = client.put("/api/v1/finance/state", headers=account, json={"data": {
        "students": [{"id": "STU-RST", "name": "Reset Child", "admissionNo": "ADM-RST"}],
        "installments": [{"id": "INST-RST", "studentId": "STU-RST", "feeHead": "Tuition", "feeAmount": 300,
                          "netAmount": 300, "paidAmount": 0, "balanceAmount": 300, "status": "UNPAID"}],
        "meta": {"seeded": True}}})
    assert seeded.status_code == 200, seeded.text
    paid = client.post("/api/v1/finance/actions/collect-payment", headers=account, json={
        "studentId": "STU-RST", "paymentMode": "CASH", "allocations": [{"installmentId": "INST-RST", "amount": 300}]})
    assert paid.status_code == 200, paid.text

    refused = client.post("/api/v1/finance/state/reset", headers=headers)
    assert refused.status_code == 409, refused.text
    assert refused.json()["detail"]["code"] == "receipts_present"
    assert client.get("/api/v1/finance/receipts", headers=headers).json()

    _drop_finance_snapshot()
    client.put(
        "/api/v1/finance/state",
        json={"data": {"feeCategories": [{"id": "X"}], "meta": {"seeded": True}}},
        headers=headers,
    )
    reset = client.post("/api/v1/finance/state/reset", headers=headers)
    assert reset.status_code == 200
    assert reset.json()["seeded"] is False


def _ensure_section(client, class_name: str, section: str = "A") -> str:
    admin = _login(client, "admin@qmis.edu", "admin123")
    options = client.get("/api/v1/masters/class-teacher-options", headers=admin).json()
    teacher_id = next(o["user_id"] for o in options if o["email"] == "teacher@qmis.edu")
    created = client.post("/api/v1/masters/classes", json={"name": class_name}, headers=admin)
    if created.status_code == 201:
        class_id = created.json()["id"]
    else:
        classes = client.get("/api/v1/masters/classes", headers=admin).json()
        class_id = next(c["id"] for c in classes if c["name"] == class_name)
    sec = client.post(
        "/api/v1/masters/sections",
        json={"class_id": class_id, "name": section, "class_teacher_user_id": teacher_id},
        headers=admin,
    )
    if sec.status_code == 201:
        return sec.json()["id"]
    listed = client.get(f"/api/v1/masters/sections?class_id={class_id}", headers=admin)
    assert listed.status_code == 200, listed.text
    match = next((s for s in listed.json() if s["name"] == section), None)
    assert match is not None, listed.text
    return match["id"]


def _enroll_finance_student(client, *, name: str, class_name: str, parent_email: str, mobile: str) -> dict:
    admin = _login(client, "admin@qmis.edu", "admin123")
    enquiry = client.post(
        "/api/v1/admissions/enquiries",
        json={
            "name": name,
            "mobile_number": mobile,
            "class_name": class_name,
            "email": parent_email,
            "source": "Walk-in",
            "city": "Madurai",
        },
        headers=admin,
    )
    assert enquiry.status_code == 201, enquiry.text
    converted = client.post(
        f"/api/v1/admissions/enquiries/{enquiry.json()['id']}/convert",
        headers=admin,
    )
    assert converted.status_code == 200, converted.text
    enrolled = client.post(
        f"/api/v1/admissions/{converted.json()['id']}/enroll",
        json={
            "parent_account_email": parent_email,
            "parent_account_password": "Parent-Test-2026",
        },
        headers=admin,
    )
    assert enrolled.status_code == 200, enrolled.text
    body = enrolled.json()
    return {
        "student_id": str(body["student_id"]),
        "student_code": body["student_code"],
        "admin": admin,
    }


def _finance_student_by_id(client, student_id: str) -> dict:
    account = _login(client, "accounthead@qmis.edu", "accounts123")
    state = client.get("/api/v1/finance/state", headers=account)
    assert state.status_code == 200, state.text
    students = state.json()["data"]["students"]
    match = next((s for s in students if s.get("id") == student_id), None)
    assert match is not None, f"student {student_id} missing from finance mirror: {students}"
    return match


def test_finance_mirror_uses_placed_year_and_section(client):
    """FA-01: placed student receives AcademicYear.name and section label, not hardcodes."""
    enrolled = _enroll_finance_student(
        client,
        name="FA01 Placed",
        class_name="Grade 3",
        parent_email="parent.fa01.placed@example.com",
        mobile="9000000101",
    )
    section_id = _ensure_section(client, "Grade 3", "B")
    principal = _login(client, "principal@qmis.edu", "principal123")
    placed = client.post(
        f"/api/v1/students/{enrolled['student_id']}/place",
        json={"sectionId": section_id},
        headers=principal,
    )
    assert placed.status_code == 200, placed.text

    from uuid import UUID

    from app.core.database import SessionLocal
    from app.models import AcademicYear, Student

    with SessionLocal() as db:
        student = db.get(Student, UUID(enrolled["student_id"]))
        assert student is not None
        assert student.academic_year_id is not None
        year = db.get(AcademicYear, student.academic_year_id)
        assert year is not None
        expected_year = year.name
        expected_section = student.section or "B"

    mirror = _finance_student_by_id(client, enrolled["student_id"])
    assert mirror["academicYear"] == expected_year
    assert expected_year  # real label from AcademicYear — never fabricated fallback
    assert mirror["section"] == expected_section
    assert mirror["admissionNo"] == enrolled["student_code"]
    assert mirror["className"] == "Grade 3"


def test_finance_mirror_unplaced_student_has_empty_section(client):
    """FA-01: unplaced students keep section empty; year still comes from the FK when set."""
    enrolled = _enroll_finance_student(
        client,
        name="FA01 Unplaced",
        class_name="Grade 4",
        parent_email="parent.fa01.unplaced@example.com",
        mobile="9000000102",
    )
    mirror = _finance_student_by_id(client, enrolled["student_id"])
    assert mirror["section"] == ""
    assert mirror["academicYear"]  # enroll assigns current academic year
    assert "2026" in mirror["academicYear"]  # seed year label, not fabricated long form alone


def test_finance_mirror_missing_academic_year_is_empty(client):
    """FA-01: missing academic_year_id must not invent a year string."""
    enrolled = _enroll_finance_student(
        client,
        name="FA01 NoYear",
        class_name="Grade 5",
        parent_email="parent.fa01.noyear@example.com",
        mobile="9000000103",
    )
    from uuid import UUID

    from app.core.database import SessionLocal
    from app.models import Student

    with SessionLocal() as db:
        student = db.get(Student, UUID(enrolled["student_id"]))
        assert student is not None
        student.academic_year_id = None
        db.commit()

    mirror = _finance_student_by_id(client, enrolled["student_id"])
    assert mirror["academicYear"] == ""
    assert mirror["section"] == ""


def test_finance_mirror_keeps_legacy_rows_and_canonical_uuid(client):
    """FA-01: merge keeps non-UUID snapshot rows and adds the canonical Student UUID once."""
    enrolled = _enroll_finance_student(
        client,
        name="FA01 Merge",
        class_name="Grade 6",
        parent_email="parent.fa01.merge@example.com",
        mobile="9000000104",
    )
    account = _login(client, "accounthead@qmis.edu", "accounts123")
    saved = client.put(
        "/api/v1/finance/state",
        headers=account,
        json={
            "data": {
                "students": [
                    {
                        "id": "STU-LEGACY-FA01",
                        "name": "Legacy Demo",
                        "admissionNo": "LEG-1",
                        "className": "Grade 1",
                        "section": "A",
                        "academicYear": "2025-26",
                    }
                ],
                "installments": [],
                "receipts": [],
                "transactions": [],
                "meta": {"seeded": True},
            }
        },
    )
    assert saved.status_code == 200, saved.text

    again = client.get("/api/v1/finance/state", headers=account)
    assert again.status_code == 200, again.text
    students = again.json()["data"]["students"]
    legacy = [s for s in students if s.get("id") == "STU-LEGACY-FA01"]
    canonical = [s for s in students if s.get("id") == enrolled["student_id"]]
    assert len(legacy) == 1
    assert legacy[0]["academicYear"] == "2025-26"
    assert legacy[0]["section"] == "A"
    assert len(canonical) == 1
    assert canonical[0]["admissionNo"] == enrolled["student_code"]


def test_finance_mirror_parent_scope_unchanged_with_year_section(client):
    """FA-01: parent my-fees scoping still returns only the linked child after year/section fix."""
    enrolled = _enroll_finance_student(
        client,
        name="FA01 Parent Scope",
        class_name="Grade 2",
        parent_email="parent.fa01.scope@example.com",
        mobile="9000000105",
    )
    section_id = _ensure_section(client, "Grade 2", "A")
    principal = _login(client, "principal@qmis.edu", "principal123")
    assert client.post(
        f"/api/v1/students/{enrolled['student_id']}/place",
        json={"sectionId": section_id},
        headers=principal,
    ).status_code == 200

    login = client.post(
        "/api/v1/auth/login",
        json={"email": "parent.fa01.scope@example.com", "password": "Parent-Test-2026"},
    )
    assert login.status_code == 200, login.text
    token = login.json()["access_token"]
    changed = client.post(
        "/api/v1/auth/change-password",
        headers={"Authorization": f"Bearer {token}"},
        json={"current_password": "Parent-Test-2026", "new_password": "Parent-Test-2027"},
    )
    assert changed.status_code == 200, changed.text
    parent = _login(client, "parent.fa01.scope@example.com", "Parent-Test-2027")

    denied = client.get("/api/v1/finance/state", headers=parent)
    assert denied.status_code == 403, denied.text

    mine = client.get("/api/v1/finance/my-fees", headers=parent)
    assert mine.status_code == 200, mine.text
    body = mine.json()["data"]
    assert body["meta"]["scopedFor"] == "parent"
    assert len(body["students"]) == 1
    child = body["students"][0]
    assert child["id"] == enrolled["student_id"]
    assert child["section"] == "A"
    assert child["academicYear"]
    assert child["academicYear"] != ""
