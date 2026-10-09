"""Live smoke against a running API (default http://127.0.0.1:8001).

Safe to re-run: each invocation uses a unique run id so masters/HR/parent
rows from a previous smoke do not 409-conflict.
"""

from __future__ import annotations

import json
import sys
import time
import urllib.error
import urllib.request
import uuid

BASE = sys.argv[1] if len(sys.argv) > 1 else "http://127.0.0.1:8001"
RUN = f"{int(time.time()) % 100000}-{uuid.uuid4().hex[:4]}"
results: list[tuple[str, bool, str]] = []


def req(method: str, path: str, body: dict | list | None = None, token: str | None = None):
    data = None if body is None else json.dumps(body).encode()
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    request = urllib.request.Request(f"{BASE}{path}", data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(request, timeout=20) as response:
            raw = response.read().decode()
            return response.status, json.loads(raw) if raw else {}
    except urllib.error.HTTPError as exc:
        raw = exc.read().decode()
        try:
            payload = json.loads(raw) if raw else {}
        except json.JSONDecodeError:
            payload = {"raw": raw}
        return exc.code, payload


def check(name: str, ok: bool, detail: str = ""):
    results.append((name, ok, detail))
    mark = "PASS" if ok else "FAIL"
    print(f"[{mark}] {name}" + (f" — {detail}" if detail else ""))


def main():
    print(f"Smoke run id: {RUN}")
    student_name = f"Smoke Student {RUN}"
    parent_email = f"parent.smoke.{RUN}@example.com"
    staff_id = f"EMP-SMOKE-{RUN}"
    staff_email = f"smoke.teacher.{RUN}@qmis.edu"
    concession_id = f"CON-SMOKE-{RUN}"
    payroll_id = f"PAY-SMOKE-{RUN}"
    installment_id = f"INST-SMOKE-{RUN}"
    approval_id = f"APR-SMOKE-{RUN}"

    status, health = req("GET", "/health")
    check("Phase0 health", status == 200 and health.get("status") == "ok", str(health))

    status, login = req("POST", "/api/v1/auth/login", {"email": "admin@qmis.edu", "password": "admin123"})
    admin_token = login.get("access_token")
    check("Phase0 admin login", status == 200 and bool(admin_token))

    status, me = req("GET", "/api/v1/auth/me", token=admin_token)
    perms = me.get("permissions") or []
    check("Phase0 /auth/me", status == 200 and "admissions.write" in perms and "finance.write" in perms)

    status, otp = req("POST", "/api/v1/auth/otp/challenge", {"email": "admin@qmis.edu"})
    code = otp.get("debug_code")
    status2, verified = req("POST", "/api/v1/auth/otp/verify", {"email": "admin@qmis.edu", "code": code})
    check("Phase0 OTP", status == 200 and status2 == 200 and verified.get("role") == "admin")

    status, klass = req(
        "POST",
        "/api/v1/masters/classes",
        {"name": f"Smoke Grade {RUN}", "section": "S"},
        token=admin_token,
    )
    check("Phase0 masters class", status in {200, 201}, f"status={status}")

    status, enquiry = req(
        "POST",
        "/api/v1/admissions/enquiries",
        {
            "name": student_name,
            "mobile_number": "9111122233",
            "class_name": "Grade 1",
            "email": parent_email,
            "source": "Walk-in",
        },
        token=admin_token,
    )
    enquiry_id = enquiry.get("id")
    check("Phase1 enquiry", status == 201 and bool(enquiry_id), f"status={status}")

    status, converted = req("POST", f"/api/v1/admissions/enquiries/{enquiry_id}/convert", token=admin_token)
    admission_id = converted.get("id")
    check("Phase1 convert", status == 200 and bool(admission_id), f"status={status}")

    status, _ = req(
        "PATCH",
        f"/api/v1/admissions/{admission_id}",
        {
            "first_name": "Smoke",
            "last_name": f"Student {RUN}",
            "mobile_number": "9111122233",
            "class_name": "Grade 1",
            "father_name": "Smoke Parent",
            "parent_account_email": parent_email,
        },
        token=admin_token,
    )
    check("Phase1 patch admission", status == 200, f"status={status}")

    status, enrolled = req(
        "POST",
        f"/api/v1/admissions/{admission_id}/enroll",
        {"parent_account_email": parent_email, "parent_account_password": "parent123"},
        token=admin_token,
    )
    student_id = str(enrolled.get("student_id") or "")
    # parent_created may be False only if email already existed; new run emails should create
    check(
        "Phase1 enroll + parent",
        status == 200 and bool(student_id) and enrolled.get("parent_user_id"),
        f"student={student_id} parent_created={enrolled.get('parent_created')}",
    )

    status, hr_login = req("POST", "/api/v1/auth/login", {"email": "hr@qmis.edu", "password": "hr12345"})
    hr_token = hr_login.get("access_token")
    check("Partner HR login", status == 200 and bool(hr_token))

    status, staff = req(
        "POST",
        "/api/v1/hr/staff",
        {
            "id": staff_id,
            "name": f"Smoke Teacher {RUN}",
            "email": staff_email,
            "role": "teacher",
            "status": "Active",
        },
        token=hr_token,
    )
    check("Partner HR staff create", status in {200, 201}, f"status={status} body={staff if status not in {200, 201} else 'ok'}")

    status, _ = req(
        "POST",
        "/api/v1/hr/concessions",
        {
            "id": concession_id,
            "employeeId": staff_id,
            "studentName": student_name,
            "percent": 20,
            "status": "Approved",
        },
        token=hr_token,
    )
    check("Partner HR concession", status in {200, 201}, f"status={status}")

    status, _ = req(
        "PUT",
        "/api/v1/hr/payroll-months",
        [{
            "id": payroll_id,
            "employeeId": staff_id,
            "month": "June",
            "year": 2026,
            "paymentStatus": "Paid",
            "netSalary": 41000,
        }],
        token=hr_token,
    )
    check("Partner HR payroll paid", status == 200, f"status={status}")

    status, fin_login = req("POST", "/api/v1/auth/login", {"email": "accounthead@qmis.edu", "password": "accounts123"})
    fin_token = fin_login.get("access_token")
    check("Finance login", status == 200 and bool(fin_token))

    status, state = req("GET", "/api/v1/finance/state", token=fin_token)
    check("Finance GET state", status == 200, f"seeded={state.get('seeded')}")
    data = dict(state.get("data") or {})
    students = list(data.get("students") or [])
    student = next((s for s in students if student_name in str(s.get("name") or "") or str(s.get("id")) == student_id), None)
    if student is None:
        student = {
            "id": student_id or f"STU-SMOKE-{RUN}",
            "name": student_name,
            "admissionNo": f"ADM-SMOKE-{RUN}",
            "className": "Grade 1",
            "academicYear": "2026-2027",
        }
        students.append(student)
    data.update({
        "students": students,
        "installments": [{
            "id": installment_id,
            "studentId": student["id"],
            "feeHead": "Tuition",
            "feeAmount": 5000,
            "netAmount": 5000,
            "paidAmount": 0,
            "balanceAmount": 5000,
            "status": "UNPAID",
        }],
        "transactions": list(data.get("transactions") or []),
        "receipts": list(data.get("receipts") or []),
        "approvals": [{
            "id": approval_id,
            "raisedBy": "TM",
            "department": "Transport",
            "type": "Fuel",
            "amount": "₹200",
            "status": "Pending",
        }],
        "concessions": [],
        "sequence": data.get("sequence") or {"pay": 1, "rec": 1, "txn": 1, "voucher": 1, "link": 1},
        "meta": {"seeded": True},
    })
    status, _ = req("PUT", "/api/v1/finance/state", {"data": data}, token=fin_token)
    check("Finance PUT state", status == 200, f"status={status}")

    status, applied = req("POST", "/api/v1/finance/actions/apply-hr-concessions", {}, token=fin_token)
    check("Finance apply HR concessions", status == 200 and applied.get("applied", 0) >= 1, str(applied.get("applied")))

    status, paid = req(
        "POST",
        "/api/v1/finance/actions/collect-payment",
        {
            "studentId": student["id"],
            "paymentMode": "CASH",
            "allocations": [{"installmentId": installment_id, "amount": 4000}],
        },
        token=fin_token,
    )
    check("Finance collect payment", status == 200 and paid.get("receipt", {}).get("amountPaid") == 4000, f"status={status}")

    status, decided = req(
        "POST",
        "/api/v1/finance/actions/decide-approval",
        {"approvalId": approval_id, "decision": "approved"},
        token=fin_token,
    )
    check("Finance decide approval", status == 200 and decided.get("approval", {}).get("status") == "Approved")

    status, final = req("GET", "/api/v1/finance/state", token=fin_token)
    txns = (final.get("data") or {}).get("transactions") or []
    has_payroll = any(t.get("sourceModule") == "PAYROLL" for t in txns)
    has_fees = any(t.get("sourceModule") == "FEES" for t in txns)
    check("Finance books show payroll + fees", status == 200 and has_payroll and has_fees, f"payroll={has_payroll} fees={has_fees}")

    status, denied = req("PUT", "/api/v1/finance/state", {"data": {}}, token=hr_token)
    check("Authz HR cannot write finance", status == 403, f"status={status}")

    failed = [name for name, ok, _ in results if not ok]
    print()
    print(f"Summary: {len(results) - len(failed)}/{len(results)} passed against {BASE}")
    if failed:
        print("Failed:", ", ".join(failed))
        sys.exit(1)


if __name__ == "__main__":
    main()
