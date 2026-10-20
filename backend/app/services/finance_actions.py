"""Authoritative finance mutations on the campus snapshot."""

from __future__ import annotations

import math
from datetime import date, datetime, timedelta, timezone
from uuid import uuid4

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.deps import role_code_for
from app.models import HrRecord, User
from app.services import finance as fin
from app.services.audit import write_audit
from app.services.errors import fail
from app.services.integrations import notify, payments

_TRANSPORT_FEE_ROLES = {
    "transportmanager",
    "accounthead",
    "finance_assistant",
    "admin",
    "superadmin",
    "managing_director",
}


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _inr_label(amount: float) -> str:
    return f"₹{int(round(float(amount or 0))):,}"


def _display_date(iso_date: str | None) -> str:
    parsed = _parse_iso_date(iso_date)
    if parsed is None:
        return str(iso_date or "")[:10] or "—"
    return parsed.strftime("%d %b %Y")


def _mode_label(mode: str | None) -> str:
    key = str(mode or "CASH").upper()
    return {
        "CASH": "Cash",
        "CHEQUE": "Cheque",
        "BANK_TRANSFER": "NEFT (Manual)",
        "UPI": "UPI",
        "CARD_ONLINE": "Card",
        "CARD_POS": "Card",
        "PAYMENT_GATEWAY": "UPI",
    }.get(key, "Cash")


def _already_posted_books(data: dict, txn_id: str) -> bool:
    for key in ("dayBookEntries", "glEntries", "cashBookEntries", "bankBookEntries", "onlineBookEntries"):
        for row in data.get(key) or []:
            if str((row or {}).get("sourceTransactionId") or "") == str(txn_id):
                return True
    return False


def _append_accounting_posting(data: dict, transaction: dict, student: dict | None = None) -> None:
    """Mirror FE createAccountingPosting into campus snapshot books."""
    txn_id = str(transaction.get("id") or "")
    if not txn_id or _already_posted_books(data, txn_id):
        return
    status = str(transaction.get("status") or "").upper()
    if status not in {"POSTED", ""}:
        return

    amount = float(transaction.get("amount") or 0)
    if amount <= 0:
        return

    mode = str(transaction.get("paymentMode") or "CASH").upper()
    is_cash = mode == "CASH"
    is_cheque = mode == "CHEQUE"
    is_out = str(transaction.get("direction") or "IN").upper() == "OUT"
    iso = str(transaction.get("transactionDate") or "")[:10]
    display = _display_date(iso)
    amount_label = _inr_label(amount)
    party = (student or {}).get("name") or "Student"
    category = str(transaction.get("category") or "Student Fees")
    narration = transaction.get("narration") or (
        f"{'Payout' if is_out else 'Fee receipt'} — {party}"
    )
    voucher_no = transaction.get("voucherNo") or transaction.get("transactionNo")
    txn_no = transaction.get("transactionNo")
    created_by = transaction.get("createdBy") or "Finance"
    cash_ledger = "Cash in Hand"
    bank_ledger = "Bank — SBI Current A/c"
    income_ledger = (
        "Fee Income — Transport"
        if "transport" in category.lower()
        else "Fee Income — Tuition"
    )
    expense_ledger = category if category else "Operating Expense"
    money_ledger = cash_ledger if is_cash else bank_ledger

    if is_out:
        gl_lines = [
            {
                "id": f"GL-{txn_id}-DR",
                "date": display,
                "dateIso": iso,
                "voucherNo": voucher_no,
                "ledgerAccount": expense_ledger,
                "description": narration,
                "debit": amount_label,
                "credit": "—",
                "balance": amount_label,
                "referenceModule": "Accounting",
                "sourceModule": transaction.get("sourceModule") or "MANUAL",
                "sourceTransactionId": txn_id,
                "referenceNo": txn_no,
                "voucherType": "Payment",
                "department": "Transport" if "transport" in category.lower() else "General",
                "financialYear": "2026–27",
                "status": "Posted",
            },
            {
                "id": f"GL-{txn_id}-CR",
                "date": display,
                "dateIso": iso,
                "voucherNo": voucher_no,
                "ledgerAccount": money_ledger,
                "description": narration,
                "debit": "—",
                "credit": amount_label,
                "balance": amount_label,
                "referenceModule": "Accounting",
                "sourceModule": transaction.get("sourceModule") or "MANUAL",
                "sourceTransactionId": txn_id,
                "referenceNo": txn_no,
                "voucherType": "Payment",
                "department": "Transport" if "transport" in category.lower() else "General",
                "financialYear": "2026–27",
                "status": "Posted",
            },
        ]
        day_book = {
            "id": f"DB-{txn_id}",
            "date": display,
            "voucherNo": voucher_no,
            "transactionType": "Expense",
            "ledgerHead": expense_ledger,
            "description": narration,
            "paymentMethod": _mode_label(mode),
            "debit": "—",
            "credit": amount_label,
            "balance": amount_label,
            "enteredBy": created_by,
            "status": "Posted",
            "department": "General",
            "sourceTransactionId": txn_id,
            "referenceNo": txn_no,
            "category": category,
            "cash": amount_label if is_cash else "—",
            "bank": amount_label if not is_cash else "—",
            "narration": narration,
            "voucherType": "Payment",
        } if (is_cash or is_cheque or mode == "BANK_TRANSFER") else None
        cash_book = {
            "id": f"CB-{txn_id}",
            "date": display,
            "dateIso": iso,
            "voucher": voucher_no,
            "description": narration,
            "receipt": "—",
            "payment": amount_label,
            "balance": amount_label,
            "cashAccount": cash_ledger,
            "transactionType": "Payment",
            "sourceTransactionId": txn_id,
            "referenceNo": txn_no,
        } if is_cash else None
        bank_book = {
            "id": f"BB-{txn_id}",
            "date": display,
            "dateIso": iso,
            "bank": transaction.get("bankName") or "State Bank of India",
            "accountNumber": transaction.get("bankAccountNumber") or "38472910482",
            "account": transaction.get("bankAccountName") or bank_ledger.replace("Bank — ", ""),
            "voucher": voucher_no,
            "deposit": "—",
            "withdrawal": amount_label,
            "balance": amount_label,
            "referenceNumber": transaction.get("paymentReference") or txn_no,
            "voucherType": "Payment",
            "chequeNo": (transaction.get("chequeDetails") or {}).get("chequeNo") or "—",
            "description": narration,
            "sourceTransactionId": txn_id,
            "slNo": 1,
        } if (not is_cash) else None
        online_book = None
    else:
        gl_lines = [
            {
                "id": f"GL-{txn_id}-DR",
                "date": display,
                "dateIso": iso,
                "voucherNo": voucher_no,
                "ledgerAccount": money_ledger,
                "description": narration,
                "debit": amount_label,
                "credit": "—",
                "balance": amount_label,
                "referenceModule": "Fees Management",
                "sourceModule": transaction.get("sourceModule") or "FEES",
                "sourceTransactionId": txn_id,
                "referenceNo": txn_no,
                "voucherType": "Receipt",
                "department": "Fees",
                "financialYear": "2026–27",
                "status": "Posted",
            },
            {
                "id": f"GL-{txn_id}-CR",
                "date": display,
                "dateIso": iso,
                "voucherNo": voucher_no,
                "ledgerAccount": income_ledger,
                "description": narration,
                "debit": "—",
                "credit": amount_label,
                "balance": amount_label,
                "referenceModule": "Fees Management",
                "sourceModule": transaction.get("sourceModule") or "FEES",
                "sourceTransactionId": txn_id,
                "referenceNo": txn_no,
                "voucherType": "Receipt",
                "department": "Fees",
                "financialYear": "2026–27",
                "status": "Posted",
            },
        ]
        day_book = {
            "id": f"DB-{txn_id}",
            "date": display,
            "voucherNo": voucher_no,
            "transactionType": "Income",
            "ledgerHead": income_ledger,
            "description": narration,
            "paymentMethod": _mode_label(mode),
            "debit": amount_label,
            "credit": "—",
            "balance": amount_label,
            "enteredBy": created_by,
            "status": "Posted",
            "department": "Fees",
            "sourceTransactionId": txn_id,
            "referenceNo": txn_no,
            "category": category,
            "cash": amount_label if is_cash else "—",
            "bank": amount_label if is_cheque else "—",
            "narration": narration,
            "voucherType": "Receipt",
        } if (is_cash or is_cheque) else None
        cash_book = {
            "id": f"CB-{txn_id}",
            "date": display,
            "dateIso": iso,
            "voucher": voucher_no,
            "description": narration,
            "receipt": amount_label,
            "payment": "—",
            "balance": amount_label,
            "cashAccount": cash_ledger,
            "transactionType": "Receipt",
            "sourceTransactionId": txn_id,
            "referenceNo": txn_no,
        } if is_cash else None
        bank_book = {
            "id": f"BB-{txn_id}",
            "date": display,
            "dateIso": iso,
            "bank": transaction.get("bankName") or "State Bank of India",
            "accountNumber": transaction.get("bankAccountNumber") or "38472910482",
            "account": transaction.get("bankAccountName") or bank_ledger.replace("Bank — ", ""),
            "voucher": voucher_no,
            "deposit": amount_label,
            "withdrawal": "—",
            "balance": amount_label,
            "referenceNumber": transaction.get("paymentReference") or txn_no,
            "voucherType": "Receipt",
            "chequeNo": (transaction.get("chequeDetails") or {}).get("chequeNo") or "—",
            "description": narration,
            "sourceTransactionId": txn_id,
            "slNo": 1,
        } if (not is_cash and not is_cheque) else None
        online_modes = {"UPI", "CARD_ONLINE", "PAYMENT_GATEWAY"}
        online_book = {
            "id": f"OLT-{txn_id}",
            "dateTime": display,
            "dateIso": iso,
            "transactionId": txn_no,
            "party": party,
            "transactionType": "Income",
            "paymentGateway": "Razorpay",
            "paymentMethod": _mode_label(mode),
            "amount": amount_label,
            "bankReference": transaction.get("paymentReference") or txn_no,
            "status": "Successful",
            "sourceTransactionId": txn_id,
        } if mode in online_modes else None

    if gl_lines:
        data["glEntries"] = [*gl_lines, *(data.get("glEntries") or [])]
    if day_book:
        data["dayBookEntries"] = [day_book, *(data.get("dayBookEntries") or [])]
    if cash_book:
        data["cashBookEntries"] = [cash_book, *(data.get("cashBookEntries") or [])]
    if bank_book:
        data["bankBookEntries"] = [bank_book, *(data.get("bankBookEntries") or [])]
    if online_book:
        data["onlineBookEntries"] = [online_book, *(data.get("onlineBookEntries") or [])]


def _seq(data: dict) -> dict:
    seq = dict(data.get("sequence") or {})
    for key, default in (("pay", 1), ("rec", 1), ("txn", 1), ("voucher", 1), ("link", 1)):
        seq[key] = int(seq.get(key) or default)
    data["sequence"] = seq
    return seq


def _save(db: Session, actor: User, data: dict) -> dict:
    return fin.save_state(db, actor, {"data": data})


def _parse_iso_date(value) -> date | None:
    if not value:
        return None
    text = str(value).strip()[:10]
    try:
        return date.fromisoformat(text)
    except ValueError:
        return None


def _fine_rule_for_category(fine_rules: list | None, category_id) -> dict | None:
    want = str(category_id or "")
    for rule in fine_rules or []:
        if not isinstance(rule, dict):
            continue
        if not rule.get("active", True):
            continue
        if str(rule.get("feeCategoryId") or "") == want:
            return rule
    return None


def _calculate_late_fee(row: dict, fine_rule: dict | None, as_of: date) -> float:
    """Match frontend hydrateInstallment / calculateLateFee for open instalments."""
    if row.get("fineWaived"):
        return 0.0
    status = str(row.get("forcedStatus") or row.get("status") or "").upper()
    if status in {"PAID", "WAIVED", "CANCELLED"}:
        return float(row.get("fineAmount") or 0)

    if not fine_rule:
        return float(row.get("fineAmount") or 0)

    fine_type = str(fine_rule.get("fineType") or "").upper()
    if fine_type in {"", "NONE"}:
        return float(row.get("fineAmount") or 0)

    due = _parse_iso_date(row.get("dueDate"))
    if due is None:
        return float(row.get("fineAmount") or 0)

    grace = int(fine_rule.get("gracePeriod") or fine_rule.get("graceDays") or 0)
    days_late = (as_of - (due + timedelta(days=grace))).days
    if days_late <= 0:
        return 0.0

    value = float(fine_rule.get("fineValue") if fine_rule.get("fineValue") is not None else fine_rule.get("amount") or 0)
    fee_amount = float(row.get("feeAmount") or 0)
    if fine_type == "FLAT":
        fine = value
    elif fine_type == "DAILY":
        fine = days_late * value
    elif fine_type == "WEEKLY":
        fine = math.ceil(days_late / 7) * value
    elif fine_type == "PERCENTAGE":
        percent = float(fine_rule.get("percent") if fine_rule.get("percent") is not None else value)
        fine = (fee_amount * percent) / 100.0
    else:
        fine = 0.0

    max_fine = fine_rule.get("maximumFine")
    if max_fine is not None and float(max_fine or 0) > 0:
        fine = min(fine, float(max_fine))

    return max(0.0, float(round(fine)))


def _live_payable(row: dict, fine_rules: list | None, as_of: date | None = None) -> tuple[float, float, float]:
    """
    Returns (fine_amount, net_amount, balance_amount) including accrued late fee.
    Portal UI hydrates the same way; payment must accept fee + late fee.
    """
    as_of = as_of or datetime.now(timezone.utc).date()
    status = str(row.get("forcedStatus") or row.get("status") or "").upper()
    settled = status in {"PAID", "WAIVED", "CANCELLED"}
    fee = float(row.get("feeAmount") or 0)
    concession = float(row.get("concessionAmount") or 0)
    stored_fine = float(row.get("fineAmount") or 0)
    stored_net = float(row.get("netAmount") or 0)
    paid = float(row.get("paidAmount") or 0)

    if settled:
        fine = stored_fine
        net = max(stored_net, max(0.0, fee - concession + fine))
    else:
        rule = _fine_rule_for_category(fine_rules, row.get("feeCategoryId"))
        accrued = _calculate_late_fee(row, rule, as_of)
        fine = max(stored_fine, accrued)
        net = max(0.0, fee - concession + fine)
        # Prefer computed net; never under-cut a higher stored net that already embeds fines.
        net = max(net, stored_net)

    balance = max(0.0, net - paid)
    return fine, net, balance


def pay_my_fees(db: Session, actor: User, payload: dict) -> dict:
    """
    Parent/student self-service payment for linked children / self only.
    Reuses collect_payment, then returns a scoped my-fees snapshot for the portal.
    """
    from app.deps import role_code_for

    code = role_code_for(db, actor)
    if code not in {"parent", "student"}:
        fail(403, "forbidden", "Parent or student role required.")

    student_id = str(payload.get("studentId") or "")
    allowed = fin._child_student_ids_for_actor(db, actor)
    if not student_id or student_id not in allowed:
        fail(403, "forbidden", "You can only pay fees for your linked student.")

    mode = str(payload.get("paymentMode") or "UPI").upper()
    # Desk cash/cheque collection stays with Account Head; portal pays online-style modes.
    if mode in {"CASH", "CHEQUE"}:
        fail(400, "validation_error", "Use UPI, card, or payment gateway for online fee payment.")

    result = collect_payment(
        db,
        actor,
        {
            **payload,
            "studentId": student_id,
            "paymentMode": mode,
            "collectedBy": payload.get("collectedBy") or actor.email,
            "narration": payload.get("narration") or f"Online fee payment — {actor.email}",
        },
    )
    scoped = fin.get_my_fees(db, actor)
    return {
        "success": True,
        "transaction": result.get("transaction"),
        "receipt": result.get("receipt"),
        "state": scoped,
    }


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

    fine_rules = list(data.get("fineRules") or [])
    as_of = _parse_iso_date(payload.get("paymentDate")) or datetime.now(timezone.utc).date()

    # Cap each allocation to remaining balance (fee + accrued late fee); reject settled rows.
    normalized: list[dict] = []
    for alloc in allocations:
        row = next((i for i in installments if i.get("id") == alloc.get("installmentId")), None)
        if row is None:
            fail(400, "validation_error", "One or more instalments were not found.")
        if str(row.get("studentId") or "") != str(student_id):
            fail(403, "forbidden", "Instalment does not belong to this student.")
        fine, net, balance = _live_payable(row, fine_rules, as_of)
        # Persist live fine/net so subsequent reads and partial pays stay consistent.
        row["fineAmount"] = fine
        row["netAmount"] = net
        row["balanceAmount"] = balance
        if balance <= 0 or str(row.get("status") or "").upper() in {"PAID", "WAIVED", "CANCELLED"}:
            fail(400, "validation_error", f"Instalment {row.get('installmentLabel') or row.get('id')} is already settled.")
        amount = float(alloc.get("amount") or 0)
        if amount > balance + 0.009:
            fail(
                400,
                "validation_error",
                f"Amount exceeds balance for {row.get('installmentLabel') or 'instalment'} "
                f"(balance ₹{balance:.2f}).",
            )
        normalized.append({"installmentId": row.get("id"), "amount": min(amount, balance)})

    allocations = normalized
    total = sum(float(a.get("amount") or 0) for a in allocations)
    mode = payload.get("paymentMode") or "CASH"
    details = payload.get("details") or {}
    iso_date = payload.get("paymentDate") or as_of.isoformat()
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
            fine, net, _ = _live_payable(row, fine_rules, as_of)
            row["fineAmount"] = fine
            row["netAmount"] = net
            paid = min(net, float(row.get("paidAmount") or 0) + float(alloc.get("amount") or 0))
            balance = max(0.0, net - paid)
            row["paidAmount"] = paid
            row["balanceAmount"] = balance
            row["status"] = "PAID" if balance <= 0 else "PARTIALLY_PAID"
            if balance <= 0:
                row["forcedStatus"] = "PAID"

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

    if not holds:
        _append_accounting_posting(data, transaction, student)

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
        cleared_txn = next(
            (t for t in transactions if t.get("id") == cheque.get("transactionId")),
            None,
        )
        if cleared_txn is not None:
            student = next(
                (s for s in (data.get("students") or []) if str(s.get("id")) == str(cheque.get("studentId"))),
                None,
            )
            _append_accounting_posting(data, cleared_txn, student)

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


def _find_finance_student(students: list, hr: dict):
    """Prefer admission number, then exact student name (case-insensitive)."""
    admission = str(hr.get("admissionNumber") or hr.get("admissionNo") or "").strip().lower()
    if admission:
        match = next(
            (
                s
                for s in students
                if str(s.get("admissionNo") or s.get("admissionNumber") or "").strip().lower() == admission
            ),
            None,
        )
        if match is not None:
            return match
    student_name = str(hr.get("studentName") or "").strip().lower()
    if not student_name:
        return None
    return next((s for s in students if str(s.get("name") or "").strip().lower() == student_name), None)


def send_receipt(db: Session, actor: User, payload: dict) -> dict:
    """Deliver via SMTP/WhatsApp when configured; otherwise honest stub (not fake delivered)."""
    state = fin.get_state(db, actor)
    data = dict(state["data"])
    receipts = list(data.get("receipts") or [])
    students = list(data.get("students") or [])
    audit = list(data.get("auditLog") or [])
    receipt_id = payload.get("receiptId")
    channel = (payload.get("channel") or "email").lower()
    if channel not in {"email", "whatsapp"}:
        fail(400, "validation_error", "channel must be email or whatsapp.")
    receipt = next((r for r in receipts if r.get("id") == receipt_id), None)
    if receipt is None:
        fail(404, "not_found", "Receipt not found.")

    student = next((s for s in students if str(s.get("id")) == str(receipt.get("studentId"))), None) or {}
    receipt_no = receipt.get("receiptNo") or receipt_id
    amount = receipt.get("amountPaid") or receipt.get("amount") or ""
    text = f"QMIS fee receipt {receipt_no}. Amount: {amount}."

    if channel == "email":
        to = payload.get("to") or student.get("guardianEmail") or student.get("email") or ""
        delivery = notify.send_email(to=to, subject=f"Fee receipt {receipt_no}", body=text)
    else:
        to_phone = payload.get("to") or student.get("guardianPhone") or student.get("phone") or ""
        delivery = notify.send_whatsapp(to_phone=to_phone, text=text)

    status = delivery.get("status") or "queued_stub"
    delivered = bool(delivery.get("delivered"))
    comm = dict(receipt.get("communication") or {})
    comm[channel] = delivered
    comm[f"{channel}Status"] = status
    receipt["communication"] = comm
    receipt[f"last{channel.title()}At"] = _now()
    receipt[f"{channel}Status"] = status
    audit.insert(
        0,
        {
            "id": f"AUD-{uuid4().hex[:8]}",
            "performedAt": _now(),
            "performedBy": actor.email,
            "action": f"RECEIPT_SEND_{status.upper()}",
            "entity": "Receipt",
            "entityId": receipt_id,
            "newValue": receipt_no,
            "reason": delivery.get("message") or status,
        },
    )
    data["receipts"] = receipts
    data["auditLog"] = audit
    saved = _save(db, actor, data)
    return {"success": True, "receipt": receipt, "delivery": delivery, "state": saved}


def create_gateway_intent(db: Session, actor: User, payload: dict) -> dict:
    state = fin.get_state(db, actor)
    data = dict(state["data"])
    links = list(data.get("paymentLinks") or [])
    audit = list(data.get("auditLog") or [])
    seq = _seq(data)
    seq["link"] += 1
    reference = f"PAY-{seq['link']:04d}"
    amount = float(payload.get("amount") or 0)
    provider = payments.create_payment_intent(
        amount=amount,
        reference=reference,
        student_id=payload.get("studentId"),
    )
    link = {
        "id": f"LNK-{reference}",
        "reference": reference,
        "studentId": payload.get("studentId"),
        "amount": amount,
        "installmentIds": payload.get("installmentIds") or [],
        "url": provider.get("url") or f"/student/payment/fees-payment?ref={reference}",
        "status": provider.get("status") or "OPEN",
        "gateway": provider.get("gateway") or "stub",
        "providerOrderId": provider.get("providerOrderId"),
        "razorpayKeyId": provider.get("razorpayKeyId"),
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
            "reason": provider.get("message") or link["gateway"],
        },
    )
    data["paymentLinks"] = links
    data["auditLog"] = audit
    saved = _save(db, actor, data)
    return {"success": True, "intent": link, "state": saved}


def confirm_gateway_payment(db: Session, actor: User, payload: dict) -> dict:
    """Verify provider payment (Razorpay signature) and mark link PAID once (idempotent)."""
    state = fin.get_state(db, actor)
    data = dict(state["data"])
    links = list(data.get("paymentLinks") or [])
    audit = list(data.get("auditLog") or [])
    reference = payload.get("reference") or payload.get("receipt")
    link = next((row for row in links if row.get("reference") == reference or row.get("id") == payload.get("linkId")), None)
    if link is None:
        fail(404, "not_found", "Payment link not found.")
    if str(link.get("status") or "").upper() == "PAID":
        return {"success": True, "skipped": True, "reason": "already_paid", "intent": link, "state": state}

    gateway = str(link.get("gateway") or "stub").lower()
    if gateway == "razorpay":
        order_id = payload.get("razorpay_order_id") or link.get("providerOrderId")
        payment_id = payload.get("razorpay_payment_id")
        signature = payload.get("razorpay_signature")
        if not order_id or not payment_id or not signature:
            fail(400, "validation_error", "razorpay_order_id, razorpay_payment_id, and razorpay_signature are required.")
        if not payments.verify_razorpay_signature(order_id=order_id, payment_id=payment_id, signature=signature):
            fail(400, "invalid_signature", "Razorpay signature verification failed.")
        link["providerPaymentId"] = payment_id
    else:
        # Stub confirm for local demos only — never invent a paid Razorpay result.
        link["providerPaymentId"] = payload.get("providerPaymentId") or payments.stub_confirm_token()

    link["status"] = "PAID"
    link["paidAt"] = _now()
    audit.insert(
        0,
        {
            "id": f"AUD-{uuid4().hex[:8]}",
            "performedAt": _now(),
            "performedBy": actor.email,
            "action": "PAYMENT_GATEWAY_CONFIRMED",
            "entity": "PaymentLink",
            "entityId": link["id"],
            "newValue": link.get("providerPaymentId"),
            "reason": f"gateway={gateway}",
        },
    )
    data["paymentLinks"] = links
    data["auditLog"] = audit
    write_audit(
        db,
        action="PAYMENT_GATEWAY_CONFIRMED",
        entity_type="payment_link",
        entity_id=str(link.get("id")),
        actor_id=actor.id,
        campus_id=actor.campus_id,
        details=link.get("reference"),
    )
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
    skipped = 0

    for hr in approved:
        percent = float(hr.get("percent") or 0)
        if percent <= 0:
            skipped += 1
            continue
        student = _find_finance_student(students, hr)
        if student is None:
            skipped += 1
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
                    "academicYear": student.get("academicYear") or hr.get("academicYear") or "2026-2027",
                    "source": "hr",
                    "admissionNumber": hr.get("admissionNumber") or hr.get("admissionNo") or student.get("admissionNo"),
                    "employeeId": hr.get("employeeId"),
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
        details=f"applied={applied};skipped={skipped}",
    )
    db.commit()
    return {"success": True, "applied": applied, "skipped": skipped, "state": saved}


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


def post_transport_enrollment_fee(db: Session, actor: User, payload: dict) -> dict:
    """Transport Manager / Finance: attach route-based transport installments to the campus ledger."""
    code = role_code_for(db, actor)
    if code not in _TRANSPORT_FEE_ROLES:
        fail(403, "forbidden", "Only Transport Manager or Finance can post transport enrollment fees.")

    student = payload.get("student") or {}
    fee_structure = payload.get("feeStructure") or {}
    installments_in = payload.get("installments") or []
    assignment_id = str(payload.get("transportAssignmentId") or fee_structure.get("transportAssignmentId") or "").strip()

    if not isinstance(student, dict) or not student.get("id"):
        fail(400, "validation_error", "student.id is required.")
    if not isinstance(installments_in, list) or not installments_in:
        fail(400, "validation_error", "installments are required.")

    state = fin.get_state(db, actor)
    data = dict(state["data"])

    categories = list(data.get("feeCategories") or [])
    if not any(str(c.get("id")) == "CAT-TRANSPORT" for c in categories):
        categories.insert(
            0,
            {
                "id": "CAT-TRANSPORT",
                "name": "Transport Fee",
                "code": "TRANSPORT",
                "active": True,
            },
        )
    data["feeCategories"] = categories

    structures = list(data.get("feeStructures") or [])
    structure_id = str(fee_structure.get("id") or f"FS-TRANSPORT-{assignment_id or student.get('id')}")
    fee_structure = {**fee_structure, "id": structure_id, "feeCategoryId": fee_structure.get("feeCategoryId") or "CAT-TRANSPORT"}
    structures = [row for row in structures if str(row.get("id")) != structure_id]
    structures.insert(0, fee_structure)
    data["feeStructures"] = structures

    students = list(data.get("students") or [])
    student_id = str(student.get("id"))
    students = [row for row in students if str(row.get("id")) != student_id]
    students.insert(0, student)
    data["students"] = students

    installments = list(data.get("installments") or [])
    installments = [
        row
        for row in installments
        if str(row.get("transportAssignmentId") or "") != assignment_id
        and not (
            str(row.get("source") or "") == "transport-enrollment"
            and str(row.get("studentId") or "") == student_id
            and str(row.get("feeStructureId") or "") == structure_id
        )
    ]
    normalized = []
    for row in installments_in:
        if not isinstance(row, dict):
            continue
        normalized.append(
            {
                **row,
                "studentId": student_id,
                "feeStructureId": structure_id,
                "feeCategoryId": row.get("feeCategoryId") or "CAT-TRANSPORT",
                "feeHead": row.get("feeHead") or "Transport Fee",
                "source": "transport-enrollment",
                "transportAssignmentId": assignment_id or row.get("transportAssignmentId"),
            }
        )
    data["installments"] = normalized + installments

    saved = _save(db, actor, data)
    write_audit(
        db,
        action="TRANSPORT_FEE_POSTED",
        entity_type="TransportEnrollment",
        entity_id=assignment_id or student_id,
        actor_id=actor.id,
        campus_id=actor.campus_id,
        details=f"Posted {len(normalized)} transport installment(s) for {student.get('name') or student_id}",
    )
    return {
        "success": True,
        "installmentsCreated": len(normalized),
        "studentId": student_id,
        "feeStructureId": structure_id,
        "state": saved,
    }
