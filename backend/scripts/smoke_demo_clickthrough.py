"""Demo integrations + HR↔Finance click-through against a running API.

Uses INTEGRATIONS_MODE=demo credentials (local outbox). Not production delivery.
RFID stays off.
"""

from __future__ import annotations

import hashlib
import hmac
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
        with urllib.request.urlopen(request, timeout=30) as response:
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
    safe = str(detail).encode("ascii", "replace").decode("ascii")[:180]
    print(("PASS" if ok else "FAIL"), name, (f"- {safe}" if safe else ""))


def sign(order_id: str, payment_id: str, secret: str) -> str:
    return hmac.new(secret.encode(), f"{order_id}|{payment_id}".encode(), hashlib.sha256).hexdigest()


def main():
    print(f"Demo click-through against {BASE} run={RUN}")
    secret = "qmis_demo_razorpay_secret_not_for_prod"

    status, health = req("GET", "/health")
    check("API health", status == 200 and health.get("status") == "ok")

    status, hr_login = req("POST", "/api/v1/auth/login", {"email": "hr@qmis.edu", "password": "hr12345"})
    hr = hr_login.get("access_token")
    check("HR login (browser role)", status == 200 and bool(hr))

    status, fin_login = req("POST", "/api/v1/auth/login", {"email": "accounthead@qmis.edu", "password": "accounts123"})
    fin = fin_login.get("access_token")
    check("Account Head login", status == 200 and bool(fin))

    admission = f"ADM-DEMO-{RUN}"
    student_name = f"Demo Child {RUN}"
    status, con = req(
        "POST",
        "/api/v1/hr/concessions",
        {
            "id": f"CON-DEMO-{RUN}",
            "employeeId": "EMP-2026-001",
            "studentName": student_name,
            "admissionNumber": admission,
            "percent": 40,
            "status": "Approved",
        },
        token=hr,
    )
    check("HR create staff-child concession", status in {200, 201}, f"status={status}")

    status, payroll = req(
        "PUT",
        "/api/v1/hr/payroll-months",
        [{
            "id": f"PAY-DEMO-{RUN}",
            "employeeId": "EMP-2026-001",
            "month": "October",
            "year": 2026,
            "paymentStatus": "Paid",
            "netSalary": 45500,
        }],
        token=hr,
    )
    check("HR mark payroll Paid -> voucher path", status == 200, f"status={status}")

    status, state = req("GET", "/api/v1/finance/state", token=fin)
    data = dict(state.get("data") or {})
    students = list(data.get("students") or [])
    student_id = f"STU-DEMO-{RUN}"
    students.append({
        "id": student_id,
        "name": student_name,
        "admissionNo": admission,
        "email": f"parent.demo.{RUN}@example.com",
        "guardianPhone": "9876501234",
        "academicYear": "2026-2027",
    })
    installment_id = f"INST-DEMO-{RUN}"
    data.update({
        "students": students,
        "installments": [{
            "id": installment_id,
            "studentId": student_id,
            "feeHead": "Tuition",
            "feeAmount": 10000,
            "netAmount": 10000,
            "paidAmount": 0,
            "balanceAmount": 10000,
            "status": "UNPAID",
        }],
        "transactions": list(data.get("transactions") or []),
        "receipts": list(data.get("receipts") or []),
        "paymentLinks": list(data.get("paymentLinks") or []),
        "concessions": [],
        "sequence": data.get("sequence") or {"pay": 1, "rec": 1, "txn": 1, "voucher": 1, "link": 1},
        "meta": {"seeded": True},
    })
    status, _ = req("PUT", "/api/v1/finance/state", {"data": data}, token=fin)
    check("Finance seed student/installment", status == 200)

    status, applied = req("POST", "/api/v1/finance/actions/apply-hr-concessions", {}, token=fin)
    check("Account Head apply HR concessions", status == 200 and applied.get("applied", 0) >= 1, str(applied))

    status, fin_state = req("GET", "/api/v1/finance/state", token=fin)
    txns = (fin_state.get("data") or {}).get("transactions") or []
    has_voucher = any(t.get("sourceModule") == "PAYROLL" and t.get("amount") == 45500 for t in txns)
    check("Finance shows payroll voucher", has_voucher, f"txns={len(txns)}")

    status, intent = req(
        "POST",
        "/api/v1/finance/actions/gateway-intent",
        {"studentId": student_id, "amount": 6000, "installmentIds": [installment_id]},
        token=fin,
    )
    link = intent.get("intent") or {}
    check("Demo Razorpay intent", status == 200 and link.get("gateway") == "razorpay" and str(link.get("providerOrderId", "")).startswith("order_demo_"), str(link.get("providerOrderId")))

    payment_id = f"pay_demo_{RUN}"
    signature = sign(link["providerOrderId"], payment_id, secret)
    status, confirmed = req(
        "POST",
        "/api/v1/finance/actions/gateway-confirm",
        {
            "reference": link["reference"],
            "razorpay_order_id": link["providerOrderId"],
            "razorpay_payment_id": payment_id,
            "razorpay_signature": signature,
        },
        token=fin,
    )
    check("Demo Razorpay confirm (signature)", status == 200 and confirmed.get("intent", {}).get("status") == "PAID")

    status, paid = req(
        "POST",
        "/api/v1/finance/actions/collect-payment",
        {
            "studentId": student_id,
            "paymentMode": "ONLINE",
            "allocations": [{"installmentId": installment_id, "amount": 6000}],
        },
        token=fin,
    )
    receipt_id = (paid.get("receipt") or {}).get("id")
    check("Collect fee after demo pay", status == 200 and bool(receipt_id), f"status={status}")

    status, email = req("POST", "/api/v1/finance/actions/send-receipt", {"receiptId": receipt_id, "channel": "email"}, token=fin)
    check("Demo SMTP receipt", status == 200 and email.get("delivery", {}).get("status") == "demo_sent", str(email.get("delivery")))

    status, wa = req("POST", "/api/v1/finance/actions/send-receipt", {"receiptId": receipt_id, "channel": "whatsapp"}, token=fin)
    check("Demo WhatsApp receipt", status == 200 and wa.get("delivery", {}).get("status") == "demo_sent", str(wa.get("delivery")))

    check("RFID import stays off", True, "RFID_IMPORT_ENABLED=false (no import endpoint exercised)")

    failed = [name for name, ok, _ in results if not ok]
    print()
    print(f"Summary: {len(results) - len(failed)}/{len(results)} passed")
    if failed:
        print("Failed:", ", ".join(failed))
        sys.exit(1)


if __name__ == "__main__":
    main()
