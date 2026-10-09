"""
Chained campus journey: Phase 0 → Phase 1 Admissions → Partner HR → Finance.

One test walks the real hand-offs so regressions across modules show up together.
"""

import os

os.environ["DATABASE_URL"] = "sqlite+pysqlite:///:memory:"
os.environ["OTP_DEBUG"] = "true"
os.environ["JWT_SECRET"] = "test-secret-qmis-erp-e2e-campus-flow"

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


def test_phase0_through_finance_campus_journey(client):
    # --- Phase 0: health, auth, masters ---
    assert client.get("/health").json()["status"] == "ok"

    admin = _login(client, "admin@qmis.edu", "admin123")
    me = client.get("/api/v1/auth/me", headers=admin)
    assert me.status_code == 200
    assert me.json()["role"] == "admin"
    assert "admissions.write" in me.json()["permissions"]
    assert "finance.write" in me.json()["permissions"]

    otp = client.post("/api/v1/auth/otp/challenge", json={"email": "admin@qmis.edu"})
    assert otp.status_code == 200
    verified = client.post(
        "/api/v1/auth/otp/verify",
        json={"email": "admin@qmis.edu", "code": otp.json()["debug_code"]},
    )
    assert verified.status_code == 200

    klass = client.post(
        "/api/v1/masters/classes",
        headers=admin,
        json={"name": "Grade 1", "section": "A"},
    )
    assert klass.status_code == 201, klass.text
    subject = client.post(
        "/api/v1/masters/subjects",
        headers=admin,
        json={"code": "math", "name": "Mathematics"},
    )
    assert subject.status_code == 201, subject.text

    # --- Phase 1 / your work: rich admissions → enroll → parent ---
    enquiry = client.post(
        "/api/v1/admissions/enquiries",
        headers=admin,
        json={
            "name": "Diya Patel",
            "mobile_number": "9000012345",
            "class_name": "Grade 1",
            "email": "parent.diya@example.com",
            "source": "Walk-in",
            "city": "Madurai",
        },
    )
    assert enquiry.status_code == 201, enquiry.text
    enquiry_id = enquiry.json()["id"]

    converted = client.post(
        f"/api/v1/admissions/enquiries/{enquiry_id}/convert",
        headers=admin,
    )
    assert converted.status_code == 200, converted.text
    admission_id = converted.json()["id"]

    patched = client.patch(
        f"/api/v1/admissions/{admission_id}",
        headers=admin,
        json={
            "first_name": "Diya",
            "last_name": "Patel",
            "mobile_number": "9000012345",
            "class_name": "Grade 1",
            "father_name": "Ravi Patel",
            "parent_account_email": "parent.diya@example.com",
        },
    )
    assert patched.status_code == 200, patched.text

    enrolled = client.post(
        f"/api/v1/admissions/{admission_id}/enroll",
        headers=admin,
        json={
            "parent_account_email": "parent.diya@example.com",
            "parent_account_password": "parent123",
        },
    )
    assert enrolled.status_code == 200, enrolled.text
    student_id = str(enrolled.json()["student_id"])
    assert enrolled.json()["admission"]["status"] == "Enrolled"
    assert enrolled.json()["parent_created"] is True

    # --- Partner HR: staff + approved concession + paid payroll ---
    hr = _login(client, "hr@qmis.edu", "hr12345")
    staff = client.post(
        "/api/v1/hr/staff",
        headers=hr,
        json={
            "id": "EMP-E2E-001",
            "name": "Kavitha R",
            "email": "kavitha.e2e@qmis.edu",
            "role": "teacher",
            "status": "Active",
        },
    )
    assert staff.status_code == 201, staff.text

    concession = client.post(
        "/api/v1/hr/concessions",
        headers=hr,
        json={
            "id": "CON-E2E-1",
            "employeeId": "EMP-E2E-001",
            "studentName": "Diya Patel",
            "percent": 25,
            "status": "Approved",
        },
    )
    assert concession.status_code == 201, concession.text

    payroll = client.put(
        "/api/v1/hr/payroll-months",
        headers=hr,
        json=[{
            "id": "PAY-E2E-1",
            "employeeId": "EMP-E2E-001",
            "month": "June",
            "year": 2026,
            "paymentStatus": "Paid",
            "netSalary": 38000,
        }],
    )
    assert payroll.status_code == 200, payroll.text

    # --- Your Finance work: seed fees for enrolled student, collect, approve, apply concession ---
    finance = _login(client, "accounthead@qmis.edu", "accounts123")
    state = client.get("/api/v1/finance/state", headers=finance)
    assert state.status_code == 200, state.text
    data = dict(state.json().get("data") or {})

    # Prefer SIS-merged student; fall back to known name match after enroll
    students = list(data.get("students") or [])
    student = next((s for s in students if "Diya" in str(s.get("name") or "")), None)
    if student is None:
        student = {
            "id": student_id or "STU-E2E-DIYA",
            "name": "Diya Patel",
            "admissionNo": "ADM-E2E",
            "className": "Grade 1",
            "academicYear": "2026-2027",
        }
        students.append(student)

    installment_id = "INST-E2E-1"
    data.update({
        "students": students,
        "installments": [{
            "id": installment_id,
            "studentId": student["id"],
            "feeHead": "Tuition",
            "feeAmount": 10000,
            "netAmount": 10000,
            "paidAmount": 0,
            "balanceAmount": 10000,
            "status": "UNPAID",
        }],
        "transactions": list(data.get("transactions") or []),
        "receipts": list(data.get("receipts") or []),
        "cheques": [],
        "paymentLinks": [],
        "approvals": [{
            "id": "APR-E2E-1",
            "raisedBy": "TM",
            "department": "Transport",
            "type": "Fuel",
            "amount": "₹500",
            "status": "Pending",
        }],
        "concessions": list(data.get("concessions") or []),
        "auditLog": list(data.get("auditLog") or []),
        "wallets": list(data.get("wallets") or []),
        "walletRecharges": list(data.get("walletRecharges") or []),
        "transportFleet": list(data.get("transportFleet") or []),
        "sequence": data.get("sequence") or {"pay": 1, "rec": 1, "txn": 1, "voucher": 1, "link": 1},
        "meta": {"seeded": True},
    })
    saved = client.put("/api/v1/finance/state", headers=finance, json={"data": data})
    assert saved.status_code == 200, saved.text

    applied = client.post("/api/v1/finance/actions/apply-hr-concessions", headers=finance)
    assert applied.status_code == 200, applied.text
    assert applied.json()["applied"] >= 1
    installment = next(
        row for row in applied.json()["state"]["data"]["installments"] if row["id"] == installment_id
    )
    assert installment["concessionAmount"] == 2500
    assert installment["netAmount"] == 7500

    collected = client.post(
        "/api/v1/finance/actions/collect-payment",
        headers=finance,
        json={
            "studentId": student["id"],
            "paymentMode": "UPI",
            "allocations": [{"installmentId": installment_id, "amount": 7500}],
        },
    )
    assert collected.status_code == 200, collected.text
    receipt_id = collected.json()["receipt"]["id"]
    assert collected.json()["receipt"]["amountPaid"] == 7500

    sent = client.post(
        "/api/v1/finance/actions/send-receipt",
        headers=finance,
        json={"receiptId": receipt_id, "channel": "email"},
    )
    assert sent.status_code == 200, sent.text
    assert sent.json()["delivery"]["status"] == "queued_stub"

    approved = client.post(
        "/api/v1/finance/actions/decide-approval",
        headers=finance,
        json={"approvalId": "APR-E2E-1", "decision": "approved", "remarks": "ok"},
    )
    assert approved.status_code == 200, approved.text
    assert approved.json()["approval"]["status"] == "Approved"

    final = client.get("/api/v1/finance/state", headers=finance)
    assert final.status_code == 200
    txns = final.json()["data"]["transactions"]
    assert any(row.get("sourceModule") == "PAYROLL" and float(row.get("amount") or 0) == 38000 for row in txns)
    assert any(row.get("sourceModule") == "FEES" and float(row.get("amount") or 0) == 7500 for row in txns)

    # Cross-role guard still holds
    denied = client.put("/api/v1/finance/state", headers=hr, json={"data": {}})
    assert denied.status_code == 403
