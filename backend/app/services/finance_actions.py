"""Authoritative finance mutations on the campus snapshot."""

from __future__ import annotations

from datetime import datetime, timezone
from uuid import uuid4

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import HrRecord, User
from app.services import finance as fin
from app.services.audit import write_audit
from app.services.errors import fail


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _seq(data: dict) -> dict:
    seq = dict(data.get("sequence") or {})
    for key, default in (("pay", 1), ("rec", 1), ("txn", 1), ("voucher", 1), ("link", 1)):
        seq[key] = int(seq.get(key) or default)
    data["sequence"] = seq
    return seq


def _save(db: Session, actor: User, data: dict) -> dict:
    return fin.save_state(db, actor, {"data": data})


def collect_payment(db: Session, actor: User, payload: dict) -> dict:
    state = fin.get_state(db, actor)
    data = dict(state["data"])
    students = list(data.get("students") or [])
    installments = list(data.get("installments") or [])
    transactions = list(data.get("transactions") or [])
    receipts = list(data.get("receipts") or [])
    cheques = list(data.get("cheques") or [])
    audit = list(data.get("auditLog") or [])

    student_id = payload.get("studentId")
    student = next((s for s in students if str(s.get("id")) == str(student_id)), None)
    if student is None:
        fail(404, "not_found", "Student not found.")

    allocations = [a for a in (payload.get("allocations") or []) if float(a.get("amount") or 0) > 0]
    if not allocations:
        fail(400, "validation_error", "Select at least one payable instalment.")

    total = sum(float(a.get("amount") or 0) for a in allocations)
    mode = payload.get("paymentMode") or "CASH"
    details = payload.get("details") or {}
    iso_date = payload.get("paymentDate") or _now()[:10]
    seq = _seq(data)
    seq["pay"] += 1
    seq["txn"] += 1
    seq["voucher"] += 1
    seq["rec"] += 1

    txn_id = f"FT-{uuid4().hex[:10]}"
    pay_ref = details.get("paymentReference") or f"PAY-{seq['pay']:04d}"
    txn_no = f"TXN-{seq['txn']:04d}"
    voucher_no = f"JV-{seq['voucher']:04d}"
    receipt_no = f"REC-{seq['rec']:04d}"
    holds = mode == "CHEQUE"
    status = "PENDING_CLEARANCE" if holds else "POSTED"

    fee_heads = []
    for alloc in allocations:
        row = next((i for i in installments if i.get("id") == alloc.get("installmentId")), None)
        if row:
            fee_heads.append(row.get("feeHead") or "Fee")

    if not holds:
        for alloc in allocations:
            row = next((i for i in installments if i.get("id") == alloc.get("installmentId")), None)
            if not row:
                continue
            paid = float(row.get("paidAmount") or 0) + float(alloc.get("amount") or 0)
            balance = max(0.0, float(row.get("netAmount") or row.get("feeAmount") or 0) - paid)
            row["paidAmount"] = paid
            row["balanceAmount"] = balance
            row["status"] = "PAID" if balance <= 0 else "PARTIALLY_PAID"

    transaction = {
        "id": txn_id,
        "transactionNo": txn_no,
        "transactionDate": iso_date,
        "direction": "IN",
        "sourceModule": "FEES",
        "category": fee_heads[0] if fee_heads else "Student Fees",
        "paymentMode": mode,
        "amount": total,
        "studentId": student_id,
        "status": status,
        "voucherNo": voucher_no,
        "receiptNo": receipt_no,
        "paymentReference": pay_ref,
        "installmentIds": [a.get("installmentId") for a in allocations],
        "allocations": allocations,
        "createdBy": payload.get("collectedBy") or actor.email,
        "createdAt": _now(),
        "narration": payload.get("narration") or f"Fee collection — {student.get('name')}",
    }
    transactions.insert(0, transaction)

    receipt = {
        "id": f"RCP-{txn_id}",
        "receiptNo": receipt_no,
        "studentId": student_id,
        "academicYear": student.get("academicYear") or "",
        "paymentDate": iso_date,
        "feeHeads": fee_heads,
        "amountPaid": total,
        "paymentMode": mode,
        "transactionReference": pay_ref,
        "status": "Held" if holds else "Issued",
        "communication": {"email": False, "whatsapp": False},
        "transactionId": txn_id,
        "installmentIds": transaction["installmentIds"],
        "reprintCount": 0,
        "collectedBy": transaction["createdBy"],
    }
    receipts.insert(0, receipt)

    if holds:
        cheques.insert(
            0,
            {
                "id": f"CHQ-{txn_id}",
                "transactionId": txn_id,
                "studentId": student_id,
                "chequeNo": details.get("chequeNo"),
                "bank": details.get("bank"),
                "branch": details.get("branch") or "",
                "chequeDate": details.get("chequeDate"),
                "receivedDate": details.get("receivedDate") or iso_date,
                "amount": total,
                "status": "RECEIVED",
                "installmentAllocations": allocations,
                "narration": transaction["narration"],
            },
        )

    audit.insert(
        0,
        {
            "id": f"AUD-{uuid4().hex[:8]}",
            "performedAt": _now(),
            "performedBy": actor.email,
            "action": "FEE_PAYMENT_COLLECTED",
            "entity": "FinanceTransaction",
            "entityId": txn_id,
            "newValue": receipt_no,
        },
    )

    data["installments"] = installments
    data["transactions"] = transactions
    data["receipts"] = receipts
    data["cheques"] = cheques
    data["auditLog"] = audit
    saved = _save(db, actor, data)
    return {"success": True, "transaction": transaction, "receipt": receipt, "state": saved}


def settle_cheque(db: Session, actor: User, payload: dict) -> dict:
    state = fin.get_state(db, actor)
    data = dict(state["data"])
    cheques = list(data.get("cheques") or [])
    transactions = list(data.get("transactions") or [])
    receipts = list(data.get("receipts") or [])
    installments = list(data.get("installments") or [])
    audit = list(data.get("auditLog") or [])

    cheque_id = payload.get("chequeId")
    next_status = payload.get("status")
    cheque = next((c for c in cheques if c.get("id") == cheque_id), None)
    if cheque is None:
        fail(404, "not_found", "Cheque not found.")
    if next_status not in {"CLEARED", "BOUNCED", "CANCELLED", "RECEIVED", "PDC"}:
        fail(400, "validation_error", "Invalid cheque status.")

    old = cheque.get("status")
    cheque["status"] = next_status
    for txn in transactions:
        if txn.get("id") == cheque.get("transactionId"):
            if next_status == "CLEARED":
                txn["status"] = "POSTED"
            elif next_status == "BOUNCED":
                txn["status"] = "REVERSED"
            txn["chequeDetails"] = {**(txn.get("chequeDetails") or {}), "status": next_status}

    if next_status == "CLEARED":
        for alloc in cheque.get("installmentAllocations") or []:
            row = next((i for i in installments if i.get("id") == alloc.get("installmentId")), None)
            if not row:
                continue
            paid = float(row.get("paidAmount") or 0) + float(alloc.get("amount") or 0)
            balance = max(0.0, float(row.get("netAmount") or row.get("feeAmount") or 0) - paid)
            row["paidAmount"] = paid
            row["balanceAmount"] = balance
            row["status"] = "PAID" if balance <= 0 else "PARTIALLY_PAID"
        for receipt in receipts:
            if receipt.get("transactionId") == cheque.get("transactionId"):
                receipt["status"] = "Issued"

    audit.insert(
        0,
        {
            "id": f"AUD-{uuid4().hex[:8]}",
            "performedAt": _now(),
            "performedBy": actor.email,
            "action": "CHEQUE_STATUS_CHANGED",
            "entity": "Cheque",
            "entityId": cheque_id,
            "oldValue": old,
            "newValue": next_status,
            "reason": payload.get("reason"),
        },
    )
    data["cheques"] = cheques
    data["transactions"] = transactions
    data["receipts"] = receipts
    data["installments"] = installments
    data["auditLog"] = audit
    saved = _save(db, actor, data)
    return {"success": True, "cheque": cheque, "state": saved}


def send_receipt(db: Session, actor: User, payload: dict) -> dict:
    """Stub delivery — marks communication channel true and logs the attempt."""
    state = fin.get_state(db, actor)
    data = dict(state["data"])
    receipts = list(data.get("receipts") or [])
    audit = list(data.get("auditLog") or [])
    receipt_id = payload.get("receiptId")
    channel = (payload.get("channel") or "email").lower()
    if channel not in {"email", "whatsapp"}:
        fail(400, "validation_error", "channel must be email or whatsapp.")
    receipt = next((r for r in receipts if r.get("id") == receipt_id), None)
    if receipt is None:
        fail(404, "not_found", "Receipt not found.")
    comm = dict(receipt.get("communication") or {})
    comm[channel] = True
    receipt["communication"] = comm
    receipt[f"last{channel.title()}At"] = _now()
    receipt[f"{channel}Status"] = "queued_stub"
    audit.insert(
        0,
        {
            "id": f"AUD-{uuid4().hex[:8]}",
            "performedAt": _now(),
            "performedBy": actor.email,
            "action": f"RECEIPT_SENT_{channel.upper()}",
            "entity": "Receipt",
            "entityId": receipt_id,
            "newValue": receipt.get("receiptNo"),
            "reason": "Stub delivery (configure SMTP/WhatsApp provider later)",
        },
    )
    data["receipts"] = receipts
    data["auditLog"] = audit
    saved = _save(db, actor, data)
    return {
        "success": True,
        "receipt": receipt,
        "delivery": {"channel": channel, "status": "queued_stub", "providerConfigured": False},
        "state": saved,
    }


def create_gateway_intent(db: Session, actor: User, payload: dict) -> dict:
    state = fin.get_state(db, actor)
    data = dict(state["data"])
    links = list(data.get("paymentLinks") or [])
    audit = list(data.get("auditLog") or [])
    seq = _seq(data)
    seq["link"] += 1
    reference = f"PAY-{seq['link']:04d}"
    link = {
        "id": f"LNK-{reference}",
        "reference": reference,
        "studentId": payload.get("studentId"),
        "amount": float(payload.get("amount") or 0),
        "installmentIds": payload.get("installmentIds") or [],
        "url": f"/student/payment/fees-payment?ref={reference}",
        "status": "OPEN",
        "gateway": "stub",
        "createdAt": _now(),
    }
    links.insert(0, link)
    audit.insert(
        0,
        {
            "id": f"AUD-{uuid4().hex[:8]}",
            "performedAt": _now(),
            "performedBy": actor.email,
            "action": "PAYMENT_GATEWAY_INTENT",
            "entity": "PaymentLink",
            "entityId": link["id"],
            "newValue": reference,
            "reason": "Stub gateway intent (set real Razorpay/etc. keys later)",
        },
    )
    data["paymentLinks"] = links
    data["auditLog"] = audit
    saved = _save(db, actor, data)
    return {"success": True, "intent": link, "state": saved}


def apply_hr_concessions(db: Session, actor: User) -> dict:
    """Copy approved HR staff-child concessions onto matching finance installments."""
    hr_rows = db.scalars(
        select(HrRecord).where(HrRecord.campus_id == actor.campus_id, HrRecord.collection == "concessions")
    ).all()
    approved = [
        row.body
        for row in hr_rows
        if str((row.body or {}).get("status") or "").lower() == "approved"
    ]
    state = fin.get_state(db, actor)
    data = dict(state["data"])
    students = list(data.get("students") or [])
    installments = list(data.get("installments") or [])
    concessions = list(data.get("concessions") or [])
    applied = 0

    for hr in approved:
        student_name = str(hr.get("studentName") or "").strip().lower()
        percent = float(hr.get("percent") or 0)
        if not student_name or percent <= 0:
            continue
        student = next((s for s in students if str(s.get("name") or "").strip().lower() == student_name), None)
        if student is None:
            continue
        cid = f"CON-HR-{hr.get('id') or uuid4().hex[:6]}"
        if not any(c.get("id") == cid for c in concessions):
            concessions.append(
                {
                    "id": cid,
                    "studentId": student.get("id"),
                    "type": "Staff Child",
                    "feeCategoryId": hr.get("feeCategoryId") or "CAT-TUITION",
                    "amount": percent,
                    "amountType": "PERCENT",
                    "status": "Approved",
                    "academicYear": student.get("academicYear") or "2026-2027",
                    "source": "hr",
                }
            )
            applied += 1
        for row in installments:
            if str(row.get("studentId")) != str(student.get("id")):
                continue
            fee = float(row.get("feeAmount") or 0)
            concession_amt = round(fee * percent / 100, 2)
            row["concessionAmount"] = concession_amt
            row["netAmount"] = max(0.0, fee - concession_amt + float(row.get("fineAmount") or 0))
            row["balanceAmount"] = max(0.0, float(row["netAmount"]) - float(row.get("paidAmount") or 0))

    data["concessions"] = concessions
    data["installments"] = installments
    saved = _save(db, actor, data)
    write_audit(
        db,
        action="HR_CONCESSIONS_APPLIED",
        entity_type="finance_snapshot",
        entity_id="current",
        actor_id=actor.id,
        campus_id=actor.campus_id,
        details=f"applied={applied}",
    )
    db.commit()
    return {"success": True, "applied": applied, "state": saved}


def post_payroll_voucher(db: Session, actor: User, month_row: dict) -> dict:
    """Post an HR paid payroll month as a Finance OUT transaction/voucher."""
    if str(month_row.get("paymentStatus") or "").lower() not in {"paid", "finalized"}:
        return {"success": False, "skipped": True, "reason": "not_paid"}

    state = fin.get_state(db, actor)
    data = dict(state["data"])
    transactions = list(data.get("transactions") or [])
    public_id = f"PAYROLL-{month_row.get('id') or month_row.get('employeeId')}-{month_row.get('month')}-{month_row.get('year')}"
    if any(t.get("id") == public_id for t in transactions):
        return {"success": True, "skipped": True, "reason": "already_posted"}

    seq = _seq(data)
    seq["txn"] += 1
    seq["voucher"] += 1
    amount = float(month_row.get("netSalary") or month_row.get("amount") or 0)
    txn = {
        "id": public_id,
        "transactionNo": f"TXN-{seq['txn']:04d}",
        "transactionDate": _now()[:10],
        "direction": "OUT",
        "sourceModule": "PAYROLL",
        "category": "Staff Salary",
        "paymentMode": "BANK_TRANSFER",
        "amount": amount,
        "employeeId": month_row.get("employeeId"),
        "status": "POSTED",
        "voucherNo": f"JV-{seq['voucher']:04d}",
        "voucherStatus": "Issued",
        "preparedBy": actor.email,
        "narration": f"Payroll {month_row.get('month')} {month_row.get('year')} — {month_row.get('employeeId')}",
        "createdBy": actor.email,
        "createdAt": _now(),
    }
    transactions.insert(0, txn)
    data["transactions"] = transactions
    saved = _save(db, actor, data)
    return {"success": True, "transaction": txn, "state": saved}


def decide_approval(db: Session, actor: User, payload: dict) -> dict:
    state = fin.get_state(db, actor)
    data = dict(state["data"])
    approvals = list(data.get("approvals") or [])
    approval_id = payload.get("approvalId")
    decision = (payload.get("decision") or "").lower()
    if decision not in {"approved", "rejected"}:
        fail(400, "validation_error", "decision must be approved or rejected.")
    row = next((a for a in approvals if a.get("id") == approval_id), None)
    if row is None:
        fail(404, "not_found", "Approval not found.")
    row["status"] = "Approved" if decision == "approved" else "Rejected"
    row["decidedAt"] = _now()
    row["decidedBy"] = actor.email
    row["remarks"] = payload.get("remarks") or ""
    data["approvals"] = approvals
    saved = _save(db, actor, data)
    return {"success": True, "approval": row, "state": saved}
