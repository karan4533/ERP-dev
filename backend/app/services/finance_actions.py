"""Authoritative finance mutations on the campus snapshot."""

from __future__ import annotations

import math
from datetime import date, datetime, timedelta, timezone
from uuid import uuid4

from sqlalchemy import select
from sqlalchemy.orm import Session
from sqlalchemy.orm.attributes import flag_modified

from app.deps import role_code_for
from app.models import FinanceRecord, HrRecord, User
from app.services import finance as fin
from app.services.audit import write_audit
from app.services.errors import fail
from app.services.integrations import notify, payments

_TRANSPORT_FEE_ROLES = {
    "transportmanager",
    "accounthead",
    "financemanager",
    "finance_assistant",
    "accountassistant",
    "admin",
    "superadmin",
    "managing_director",
}
# Desk collection records money received in person, so only the Finance desk may do it. Admin, Super Admin
# and the Managing Director hold every permission code but are not the collecting desk.
DESK_COLLECTOR_ROLES = {"accounthead", "financemanager", "finance_assistant", "accountassistant"}
_PAYMENT_INTENT_COLLECTION = "payment-intent"
_LEDGER_STATUS_FOR_CHEQUE = {
    "CLEARED": "Issued",
    "BOUNCED": "Bounced",
    "CANCELLED": "Cancelled",
    "RECEIVED": "Held",
    "PDC": "Held",
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
    return fin.save_state(db, actor, {"data": data}, server_authored=True)


def _require_desk_collector(db: Session, actor: User) -> str:
    code = role_code_for(db, actor)
    if code not in DESK_COLLECTOR_ROLES:
        fail(403, "forbidden", "Only the Finance desk (Account Head, Finance Manager or Account Assistant) can record fee payments.")
    return code


def _receipt_source(db: Session | None, actor: User | None, channel: str, **extra) -> dict:
    return {
        "channel": channel,
        "verifiedBy": "server",
        "recordedByUserId": str(actor.id) if actor is not None else "",
        "recordedByEmail": (actor.email or "") if actor is not None else "",
        "recordedByRole": role_code_for(db, actor) if (db is not None and actor is not None) else "",
        "recordedAt": _now(),
        **{key: value for key, value in extra.items() if value is not None},
    }


def _ledger_row(db: Session, campus_id, receipt_id: str) -> FinanceRecord | None:
    return db.scalar(
        select(FinanceRecord).where(
            FinanceRecord.campus_id == campus_id,
            FinanceRecord.collection == fin.RECEIPT_LEDGER_COLLECTION,
            FinanceRecord.public_id == receipt_id,
        )
    )


def _record_receipt_ledger(db: Session, campus_id, receipt: dict, *, actor_id=None) -> None:
    """Server-only copy of an issued receipt (committed with the snapshot save that follows)."""
    receipt_id = str(receipt.get("id") or "")
    if not receipt_id or _ledger_row(db, campus_id, receipt_id) is not None:
        return
    body = {
        "receiptId": receipt_id,
        "receiptNo": receipt.get("receiptNo"),
        "studentId": str(receipt.get("studentId") or ""),
        "admissionNo": str(receipt.get("admissionNo") or ""),
        "feeHeads": list(receipt.get("feeHeads") or []),
        "amountPaid": float(receipt.get("amountPaid") or 0),
        "paymentMode": receipt.get("paymentMode"),
        "paymentDate": receipt.get("paymentDate"),
        "status": receipt.get("status"),
        "transactionId": receipt.get("transactionId"),
        "installmentIds": list(receipt.get("installmentIds") or []),
        "source": dict(receipt.get("receiptSource") or {}),
    }
    db.add(FinanceRecord(campus_id=campus_id, collection=fin.RECEIPT_LEDGER_COLLECTION, public_id=receipt_id, body=body))
    source = body["source"]
    write_audit(
        db,
        action="FEE_RECEIPT_ISSUED",
        entity_type="fee_receipt",
        entity_id=str(receipt.get("receiptNo") or receipt_id),
        actor_id=actor_id,
        campus_id=campus_id,
        details=(
            f"channel={source.get('channel')};amount={body['amountPaid']:.2f};status={body['status']};"
            f"student={body['studentId']};by={source.get('recordedByEmail') or source.get('recordedBy') or ''}"
        ),
    )


def _set_ledger_status(db: Session, campus_id, receipt_id: str, status: str, *, by: str) -> None:
    row = _ledger_row(db, campus_id, receipt_id)
    if row is None:
        return
    body = dict(row.body or {})
    history = list(body.get("statusHistory") or [])
    history.append({"from": body.get("status"), "to": status, "at": _now(), "by": by})
    body["status"] = status
    body["statusHistory"] = history
    row.body = body
    flag_modified(row, "body")


def _payment_intent(db: Session, campus_id, reference: str) -> FinanceRecord | None:
    if not reference:
        return None
    return db.scalar(
        select(FinanceRecord).where(
            FinanceRecord.campus_id == campus_id,
            FinanceRecord.collection == _PAYMENT_INTENT_COLLECTION,
            FinanceRecord.public_id == reference,
        )
    )


def _mark_intent_paid(intent: FinanceRecord, link: dict, settled: dict | None) -> None:
    body = dict(intent.body or {})
    body.update(
        {
            "status": "PAID",
            "paidAt": link.get("paidAt") or _now(),
            "providerPaymentId": link.get("providerPaymentId"),
            "confirmedVia": link.get("confirmedVia"),
            "receiptId": (settled or {}).get("receipt", {}).get("id"),
            "receiptNo": (settled or {}).get("receipt", {}).get("receiptNo"),
        }
    )
    intent.body = body
    flag_modified(intent, "body")


def _apply_intent_to_link(link: dict, intent: FinanceRecord) -> dict:
    """The snapshot link is editable by Finance data saves; the server intent decides what is paid."""
    body = dict(intent.body or {})
    link["studentId"] = body.get("studentId")
    link["amount"] = float(body.get("amount") or 0)
    link["installmentIds"] = list(body.get("installmentIds") or [])
    link["gateway"] = body.get("gateway") or link.get("gateway")
    link["providerOrderId"] = body.get("providerOrderId")
    return body


def _amount_matches(paise, amount: float) -> bool:
    if paise in (None, ""):
        return True
    try:
        return int(paise) == int(round(float(amount) * 100))
    except (TypeError, ValueError):
        return False


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
    """Parent/student portal payments settle only through the payment gateway.

    A portal request saying "paid by UPI" is not proof of payment, so this route never issues a receipt;
    the portal uses gateway-intent and gateway-confirm (signature or provider verified) instead.
    """
    code = role_code_for(db, actor)
    if code not in {"parent", "student"}:
        fail(403, "forbidden", "Parent or student role required.")
    student_id = str(payload.get("studentId") or "")
    allowed = fin._child_student_ids_for_actor(db, actor)
    if not student_id or student_id not in allowed:
        fail(403, "forbidden", "You can only pay fees for your linked student.")
    fail(
        403,
        "gateway_required",
        "Online fee payments must go through the payment gateway so the payment can be verified.",
    )


def _apply_collection(data: dict, payload: dict, *, actor_email: str, source: dict) -> tuple[dict, dict]:
    """Apply one fee collection to the snapshot ``data`` in place; returns (transaction, receipt)."""
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
    # The sequence is part of the editable snapshot; never hand out a receipt number twice.
    used_receipt_numbers = {str(row.get("receiptNo") or "") for row in receipts if isinstance(row, dict)}
    while f"REC-{seq['rec']:04d}" in used_receipt_numbers:
        seq["rec"] += 1
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
        "createdBy": payload.get("collectedBy") or actor_email,
        "createdAt": _now(),
        "narration": payload.get("narration") or f"Fee collection — {student.get('name')}",
    }
    transactions.insert(0, transaction)

    receipt = {
        "id": f"RCP-{txn_id}",
        "receiptNo": receipt_no,
        "studentId": student_id,
        "admissionNo": student.get("admissionNo") or student.get("admissionNumber") or "",
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
        "receiptSource": source,
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
            "performedBy": actor_email,
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
    return transaction, receipt


def _notify_fee_paid(db: Session, campus_id, student_id, receipt: dict) -> None:
    """In-app confirmation + best-effort WhatsApp receipt to the parent phone."""
    from uuid import UUID

    from app.models import Admission, Guardian, Notification, Student
    from app.services.integrations.notify import notify_event

    try:
        sid = UUID(str(student_id))
    except (TypeError, ValueError):
        return
    student = db.get(Student, sid)
    if student is None or student.campus_id != campus_id:
        return
    receipt_no = str(receipt.get("receiptNo") or "")
    heads = ", ".join(receipt.get("feeHeads") or []) or "School fees"
    amount_label = _inr_label(receipt.get("amountPaid") or 0)

    if student.parent_user_id:
        already = db.scalar(
            select(Notification.id).where(
                Notification.user_id == student.parent_user_id,
                Notification.entity_type == "fee_receipt",
                Notification.entity_id == receipt_no,
            )
        )
        if already is None:
            db.add(
                Notification(
                    campus_id=campus_id,
                    user_id=student.parent_user_id,
                    title=f"Payment received — {amount_label}",
                    body=f"{student.full_name}: {heads}. Receipt {receipt_no} ({_display_date(receipt.get('paymentDate'))}).",
                    entity_type="fee_receipt",
                    entity_id=receipt_no,
                )
            )
            db.commit()

    phone = ""
    guardian = db.scalar(
        select(Guardian).where(Guardian.student_id == student.id).order_by(Guardian.created_at.asc())
    )
    if guardian and guardian.phone:
        phone = str(guardian.phone).strip()
    if not phone and student.admission_id:
        admission = db.get(Admission, student.admission_id)
        if admission is not None:
            phone = str(admission.parent_mobile_number or admission.mobile_number or "").strip()
    if not phone:
        return
    try:
        from app.services.integrations import whatsapp_events as wa

        text, params = wa.fee_receipt_message(
            student_name=student.full_name or "",
            receipt_no=receipt_no,
            amount_label=amount_label,
        )
        notify_event(
            event_key=f"fee-receipt-whatsapp:{receipt_no}:{phone}",
            subject="Payment received",
            body=text,
            phone=phone,
            event=wa.EVENT_FEE_RECEIPT,
            template_params=params,
        )
    except Exception:
        pass


def collect_payment(db: Session, actor: User, payload: dict) -> dict:
    _require_desk_collector(db, actor)
    state = fin.get_state(db, actor)
    data = dict(state["data"])
    source = _receipt_source(db, actor, "desk_collection", paymentMode=payload.get("paymentMode") or "CASH")
    transaction, receipt = _apply_collection(data, payload, actor_email=actor.email, source=source)
    _record_receipt_ledger(db, actor.campus_id, receipt, actor_id=actor.id)
    saved = _save(db, actor, data)
    if transaction.get("status") == "POSTED":
        _notify_fee_paid(db, actor.campus_id, transaction.get("studentId"), receipt)
    return {"success": True, "transaction": transaction, "receipt": receipt, "state": saved}


def settle_cheque(db: Session, actor: User, payload: dict) -> dict:
    _require_desk_collector(db, actor)
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

    # A cheque moved CLEARED -> RECEIVED -> CLEARED must not pay its instalments twice.
    newly_cleared = next_status == "CLEARED" and old != "CLEARED" and not cheque.get("allocationsApplied")
    if newly_cleared:
        cheque["allocationsApplied"] = True
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
    if old != next_status:
        for receipt in receipts:
            if receipt.get("transactionId") == cheque.get("transactionId"):
                _set_ledger_status(
                    db, actor.campus_id, str(receipt.get("id") or ""), _LEDGER_STATUS_FOR_CHEQUE[next_status], by=actor.email
                )
    data["cheques"] = cheques
    data["transactions"] = transactions
    data["receipts"] = receipts
    data["installments"] = installments
    data["auditLog"] = audit
    saved = _save(db, actor, data)
    if newly_cleared:
        receipt = next((r for r in receipts if r.get("transactionId") == cheque.get("transactionId")), None)
        if receipt is not None:
            _notify_fee_paid(db, actor.campus_id, cheque.get("studentId"), receipt)
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
    """Deliver via SMTP/WhatsApp when configured; otherwise NOT_CONFIGURED (never fake delivered)."""
    from app.core.config import settings
    from app.services.integrations import templates as tpl

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
    amount_label = str(amount)
    student_name = str(student.get("name") or student.get("shortName") or "")
    school = settings.school_display_name
    from_addr = settings.smtp_from or "noreply@school.example"

    if channel == "email":
        to = payload.get("to") or student.get("guardianEmail") or student.get("email") or ""
        subject, text, html = tpl.fee_receipt_email(
            school_name=school,
            receipt_no=str(receipt_no),
            amount_label=amount_label,
            student_name=student_name,
            from_address=from_addr,
        )
        delivery = notify.send_email(to=to, subject=subject, body=text, html_body=html)
    else:
        from app.services.integrations import whatsapp_events as wa

        to_phone = payload.get("to") or student.get("guardianPhone") or student.get("phone") or ""
        text, params = wa.fee_receipt_message(
            student_name=student_name,
            receipt_no=str(receipt_no),
            amount_label=amount_label,
        )
        delivery = notify.send_whatsapp(
            to_phone=to_phone,
            text=text,
            event=wa.EVENT_FEE_RECEIPT,
            template_params=params,
        )

    # Finance UI / older clients still key off legacyStatus for unconfigured WhatsApp.
    delivery = dict(delivery or {})
    status = delivery.get("status") or "NOT_CONFIGURED"
    if channel == "whatsapp" and status == "NOT_CONFIGURED":
        status = delivery.get("legacyStatus") or "queued_stub"
        delivery["status"] = status
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


def _assert_gateway_student_access(db: Session, actor: User, student_id: str) -> None:
    """Parents/students may only create or confirm intents for linked children / self."""
    code = role_code_for(db, actor)
    if code not in {"parent", "student"}:
        return
    allowed = fin._child_student_ids_for_actor(db, actor)
    if not student_id or str(student_id) not in allowed:
        fail(403, "forbidden", "You can only pay fees for your linked student.")


def send_payment_link(db: Session, actor: User, payload: dict) -> dict:
    """Send an existing payment link via WhatsApp or email to the parent/guardian."""
    from app.core.config import settings
    from app.services.integrations import templates as tpl

    state = fin.get_state(db, actor)
    data = dict(state["data"])
    links = list(data.get("paymentLinks") or [])
    students = list(data.get("students") or [])
    audit = list(data.get("auditLog") or [])
    link_id = str(payload.get("linkId") or payload.get("id") or "").strip()
    reference = str(payload.get("reference") or "").strip()
    channel = (payload.get("channel") or "whatsapp").lower()
    if channel not in {"email", "whatsapp"}:
        fail(400, "validation_error", "channel must be email or whatsapp.")
    link = next(
        (
            row
            for row in links
            if str(row.get("id")) == link_id
            or (reference and str(row.get("reference")) == reference)
        ),
        None,
    )
    if link is None:
        fail(404, "not_found", "Payment link not found.")

    student = next((s for s in students if str(s.get("id")) == str(link.get("studentId"))), None) or {}
    student_name = str(student.get("name") or student.get("shortName") or "")
    amount_label = _inr_label(link.get("amount") or 0)
    school = settings.school_display_name
    url = str(link.get("url") or "")
    ref = str(link.get("reference") or reference)

    if channel == "email":
        to = payload.get("to") or student.get("guardianEmail") or student.get("email") or ""
        subject = f"{school} — Fee payment link {ref}"
        body = (
            f"Dear Parent/Guardian,\n\n"
            f"Please pay school fees for {student_name or 'your child'}.\n"
            f"Amount: {amount_label}\n"
            f"Reference: {ref}\n"
            f"Pay here: {url}\n\n"
            f"— {school}\n"
        )
        delivery = notify.send_email(to=to, subject=subject, body=body)
    else:
        from app.services.integrations import whatsapp_events as wa

        to_phone = payload.get("to") or student.get("guardianPhone") or student.get("phone") or ""
        text, params = wa.payment_link_message(
            student_name=student_name,
            amount_label=amount_label,
            reference=ref,
            url=url,
        )
        delivery = notify.send_whatsapp(
            to_phone=to_phone,
            text=text,
            event=wa.EVENT_PAYMENT_LINK,
            template_params=params,
        )

    delivery = dict(delivery or {})
    status = delivery.get("status") or "NOT_CONFIGURED"
    if channel == "whatsapp" and status == "NOT_CONFIGURED":
        status = delivery.get("legacyStatus") or "queued_stub"
        delivery["status"] = status
    link[f"last{channel.title()}At"] = _now()
    link[f"{channel}Status"] = status
    audit.insert(
        0,
        {
            "id": f"AUD-{uuid4().hex[:8]}",
            "performedAt": _now(),
            "performedBy": actor.email,
            "action": f"PAYMENT_LINK_SEND_{status.upper()}",
            "entity": "PaymentLink",
            "entityId": link.get("id"),
            "newValue": ref,
            "reason": delivery.get("message") or status,
        },
    )
    data["paymentLinks"] = links
    data["auditLog"] = audit
    saved = _save(db, actor, data)
    return {"success": True, "link": link, "delivery": delivery, "state": saved}


def create_gateway_intent(db: Session, actor: User, payload: dict) -> dict:
    student_id = str(payload.get("studentId") or "")
    _assert_gateway_student_access(db, actor, student_id)
    state = fin.get_state(db, actor)
    data = dict(state["data"])
    links = list(data.get("paymentLinks") or [])
    audit = list(data.get("auditLog") or [])
    seq = _seq(data)
    seq["link"] += 1
    reference = f"PAY-{seq['link']:04d}"
    # The sequence lives in the editable snapshot, so skip any reference the server already used.
    while _payment_intent(db, actor.campus_id, reference) is not None:
        seq["link"] += 1
        reference = f"PAY-{seq['link']:04d}"
    try:
        amount = float(payload.get("amount") or 0)
    except (TypeError, ValueError):
        fail(400, "validation_error", "Amount must be a number.")
    if not math.isfinite(amount) or amount < 1:
        fail(400, "validation_error", "Amount must be at least ₹1 for online payment.")
    provider = payments.create_payment_intent(
        amount=amount,
        reference=reference,
        student_id=student_id or payload.get("studentId"),
    )
    if str(provider.get("status") or "").upper() in {"FAILED", "NOT_CONFIGURED"}:
        fail(
            503 if provider.get("status") == "NOT_CONFIGURED" else 502,
            str(provider.get("status") or "gateway_error").lower(),
            provider.get("message") or "Could not create payment order.",
        )
    link = {
        "id": f"LNK-{reference}",
        "reference": reference,
        "studentId": student_id or payload.get("studentId"),
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
    db.add(
        FinanceRecord(
            campus_id=actor.campus_id,
            collection=_PAYMENT_INTENT_COLLECTION,
            public_id=reference,
            body={
                "reference": reference,
                "linkId": link["id"],
                "studentId": link["studentId"],
                "amount": amount,
                "installmentIds": list(link["installmentIds"]),
                "gateway": link["gateway"],
                "providerOrderId": link.get("providerOrderId"),
                "status": "OPEN",
                "createdByUserId": str(actor.id),
                "createdByEmail": actor.email or "",
                "createdByRole": role_code_for(db, actor),
                "createdAt": link["createdAt"],
            },
        )
    )
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
    code = role_code_for(db, actor)
    out_state = fin.get_my_fees(db, actor) if code in {"parent", "student"} else saved
    return {"success": True, "intent": link, "state": out_state}


def _settle_gateway_link(data: dict, link: dict, *, actor_email: str, source: dict) -> dict | None:
    """Turn a verified gateway payment into a fee collection (instalments, receipt, books) once.

    The link amount is applied to its instalments in order, capped at each live balance. Anything
    that cannot be applied (instalments settled at the desk meanwhile) is recorded on the link for
    manual reconciliation instead of being dropped.
    """
    if link.get("settledTransactionId"):
        return None
    installments = list(data.get("installments") or [])
    fine_rules = list(data.get("fineRules") or [])
    as_of = datetime.now(timezone.utc).date()
    student_id = str(link.get("studentId") or "")
    remaining = round(float(link.get("amount") or 0), 2)
    allocations: list[dict] = []
    for installment_id in link.get("installmentIds") or []:
        if remaining <= 0.009:
            break
        row = next((i for i in installments if i.get("id") == installment_id), None)
        if row is None or str(row.get("studentId") or "") != student_id:
            continue
        if str(row.get("status") or "").upper() in {"PAID", "WAIVED", "CANCELLED"}:
            continue
        _, _, balance = _live_payable(row, fine_rules, as_of)
        take = round(min(balance, remaining), 2)
        if take <= 0:
            continue
        allocations.append({"installmentId": installment_id, "amount": take})
        remaining = round(remaining - take, 2)

    audit = list(data.get("auditLog") or [])
    if not allocations:
        link["unallocatedAmount"] = round(float(link.get("amount") or 0), 2)
        audit.insert(0, {
            "id": f"AUD-{uuid4().hex[:8]}",
            "performedAt": _now(),
            "performedBy": actor_email,
            "action": "GATEWAY_PAYMENT_UNALLOCATED",
            "entity": "PaymentLink",
            "entityId": link.get("id"),
            "newValue": str(link["unallocatedAmount"]),
            "reason": "No unpaid instalments left on this link; reconcile manually.",
        })
        data["auditLog"] = audit
        return None

    transaction, receipt = _apply_collection(
        data,
        {
            "studentId": student_id,
            "allocations": allocations,
            "paymentMode": "PAYMENT_GATEWAY",
            "paymentDate": as_of.isoformat(),
            "details": {"paymentReference": link.get("providerPaymentId") or link.get("reference")},
            "collectedBy": "Payment gateway",
            "narration": f"Online payment {link.get('reference')}",
        },
        actor_email=actor_email,
        source=source,
    )
    link["settledTransactionId"] = transaction["id"]
    link["receiptNo"] = receipt["receiptNo"]
    if remaining > 0.009:
        link["unallocatedAmount"] = remaining
        data["auditLog"].insert(0, {
            "id": f"AUD-{uuid4().hex[:8]}",
            "performedAt": _now(),
            "performedBy": actor_email,
            "action": "GATEWAY_PAYMENT_UNALLOCATED",
            "entity": "PaymentLink",
            "entityId": link.get("id"),
            "newValue": str(remaining),
            "reason": "Part of the payment exceeded the instalment balances; reconcile manually.",
        })
    return {"transaction": transaction, "receipt": receipt}


def confirm_gateway_payment(db: Session, actor: User, payload: dict) -> dict:
    """Verify provider payment (Razorpay signature) and mark link PAID once (idempotent).

    Frontend success alone is never enough — signature must verify (or webhook path).
    """
    state = fin.get_state(db, actor)
    data = dict(state["data"])
    links = list(data.get("paymentLinks") or [])
    audit = list(data.get("auditLog") or [])
    reference = payload.get("reference") or payload.get("receipt")
    link = next((row for row in links if row.get("reference") == reference or row.get("id") == payload.get("linkId")), None)
    if link is None:
        fail(404, "not_found", "Payment link not found.")
    intent = _payment_intent(db, actor.campus_id, str(link.get("reference") or ""))
    if intent is None:
        fail(409, "unknown_payment_intent", "This payment link was not created by the payment service, so it cannot be confirmed.")
    intent_body = _apply_intent_to_link(link, intent)
    _assert_gateway_student_access(db, actor, str(link.get("studentId") or ""))
    if str(intent_body.get("status") or "").upper() == "PAID" or str(link.get("status") or "").upper() == "PAID":
        # Portal actors get a scoped snapshot so the UI can refresh balances.
        code = role_code_for(db, actor)
        out_state = fin.get_my_fees(db, actor) if code in {"parent", "student"} else state
        return {"success": True, "skipped": True, "reason": "already_paid", "intent": link, "state": out_state}

    from app.core.config import settings

    gateway = str(link.get("gateway") or "stub").lower()
    if gateway in {"stub", ""} or str(link.get("status") or "") == "NOT_CONFIGURED":
        # Production must not mark stub intents paid. Local development / demo may, so campus
        # click-through and finance action tests can exercise the PAID path without Razorpay keys.
        if not (settings.is_development or settings.demo_integrations):
            fail(
                503,
                "NOT_CONFIGURED",
                "Payment gateway is NOT_CONFIGURED. Set RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET before confirming payment.",
            )
        link["confirmedVia"] = "stub"
        link["providerPaymentId"] = payload.get("stubToken") or payments.stub_confirm_token()
    elif gateway == "razorpay":
        order_id = link.get("providerOrderId")
        if payload.get("razorpay_order_id") and payload.get("razorpay_order_id") != order_id:
            fail(400, "order_mismatch", "This payment belongs to a different payment order.")
        payment_id = payload.get("razorpay_payment_id")
        signature = payload.get("razorpay_signature")
        sync_from_provider = bool(payload.get("syncFromProvider"))
        if payment_id and signature and order_id:
            if not payments.verify_razorpay_signature(order_id=order_id, payment_id=payment_id, signature=signature):
                fail(400, "invalid_signature", "Razorpay signature verification failed.")
            link["providerPaymentId"] = payment_id
            link["confirmedVia"] = "signature"
        elif sync_from_provider or (order_id and not payment_id):
            # Checkout sometimes closes after Success without firing the JS handler.
            # Recover by asking Razorpay whether this order was captured (server-side keys).
            if not order_id:
                fail(400, "validation_error", "razorpay_order_id is required to sync payment.")
            captured = payments.fetch_captured_payment_for_order(order_id)
            if not captured:
                # Stale OPEN link after dues were already settled (or a newer unpaid attempt) —
                # abandon so the student UI banner does not stick forever.
                installments = list(data.get("installments") or [])
                fine_rules = list(data.get("fineRules") or [])
                as_of = datetime.now(timezone.utc).date()
                ids = link.get("installmentIds") or []
                still_due = False
                for installment_id in ids:
                    row = next((i for i in installments if i.get("id") == installment_id), None)
                    if row is None:
                        continue
                    _, _, balance = _live_payable(row, fine_rules, as_of)
                    if balance > 0.009:
                        still_due = True
                        break
                if ids and not still_due:
                    link["status"] = "ABANDONED"
                    link["abandonedAt"] = _now()
                    link["abandonReason"] = "Instalments already settled; no capture on this order."
                    audit.insert(
                        0,
                        {
                            "id": f"AUD-{uuid4().hex[:8]}",
                            "performedAt": _now(),
                            "performedBy": actor.email,
                            "action": "PAYMENT_GATEWAY_ABANDONED",
                            "entity": "PaymentLink",
                            "entityId": link["id"],
                            "newValue": order_id,
                            "reason": link["abandonReason"],
                        },
                    )
                    data["paymentLinks"] = links
                    data["auditLog"] = audit
                    saved = _save(db, actor, data)
                    code = role_code_for(db, actor)
                    out_state = fin.get_my_fees(db, actor) if code in {"parent", "student"} else saved
                    return {
                        "success": True,
                        "skipped": True,
                        "reason": "abandoned_stale",
                        "intent": link,
                        "state": out_state,
                    }
                fail(
                    409,
                    "payment_pending",
                    "No captured Razorpay payment found for this order yet. Wait a moment and retry sync.",
                )
            if not _amount_matches(captured.get("amount"), link["amount"]):
                fail(409, "amount_mismatch", "The captured payment amount does not match this payment order.")
            link["providerPaymentId"] = captured.get("id")
            link["confirmedVia"] = "provider_sync"
        else:
            fail(400, "validation_error", "razorpay_order_id, razorpay_payment_id, and razorpay_signature are required.")
    else:
        fail(400, "validation_error", f"Unsupported gateway: {gateway}")

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
    source = _receipt_source(
        db,
        actor,
        "online_gateway",
        gateway=gateway,
        confirmedVia=link.get("confirmedVia"),
        providerPaymentId=link.get("providerPaymentId"),
        providerOrderId=link.get("providerOrderId"),
        paymentReference=link.get("reference"),
    )
    settled = _settle_gateway_link(data, link, actor_email=actor.email, source=source)
    if settled:
        _record_receipt_ledger(db, actor.campus_id, settled["receipt"], actor_id=actor.id)
    _mark_intent_paid(intent, link, settled)
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
    if settled:
        _notify_fee_paid(db, actor.campus_id, link.get("studentId"), settled["receipt"])
    code = role_code_for(db, actor)
    out_state = fin.get_my_fees(db, actor) if code in {"parent", "student"} else saved
    return {
        "success": True,
        "intent": link,
        "receipt": settled["receipt"] if settled else None,
        "transaction": settled["transaction"] if settled else None,
        "state": out_state,
    }


def apply_razorpay_webhook(db: Session, *, raw_body: bytes, signature: str, payload: dict) -> dict:
    """Mark a payment link PAID from a verified Razorpay webhook (no JWT / no frontend trust)."""
    from app.core.config import settings

    if not (settings.razorpay_webhook_secret or "").strip():
        fail(503, "NOT_CONFIGURED", "RAZORPAY_WEBHOOK_SECRET is not configured.")
    if not payments.verify_webhook_signature(body=raw_body, signature=signature):
        fail(400, "invalid_signature", "Webhook signature verification failed.")

    event = str(payload.get("event") or "")
    entity = ((payload.get("payload") or {}).get("payment") or {}).get("entity") or {}
    if event not in {"payment.captured", "payment.authorized"}:
        return {"success": True, "ignored": True, "event": event}

    order_id = str(entity.get("order_id") or "")
    payment_id = str(entity.get("id") or "")
    if not order_id:
        fail(400, "validation_error", "Webhook payment entity missing order_id.")

    intents = db.scalars(select(FinanceRecord).where(FinanceRecord.collection == _PAYMENT_INTENT_COLLECTION)).all()
    intent = next((item for item in intents if str((item.body or {}).get("providerOrderId") or "") == order_id), None)
    if intent is None:
        fail(404, "not_found", "No payment order created by this school matches this Razorpay order.")
    if str((intent.body or {}).get("status") or "").upper() == "PAID":
        return {"success": True, "skipped": True, "reason": "already_paid", "reference": (intent.body or {}).get("reference")}
    if not _amount_matches(entity.get("amount"), float((intent.body or {}).get("amount") or 0)):
        fail(409, "amount_mismatch", "The captured payment amount does not match this payment order.")

    snapshots = db.scalars(
        select(FinanceRecord).where(
            FinanceRecord.collection == "snapshot",
            FinanceRecord.campus_id == intent.campus_id,
        )
    ).all()

    for row in snapshots:
        body = dict(row.body or {})
        links = list(body.get("paymentLinks") or [])
        reference = str((intent.body or {}).get("reference") or "")
        link = next((item for item in links if str(item.get("reference") or "") == reference), None)
        if link is None:
            continue
        _apply_intent_to_link(link, intent)
        if str(link.get("status") or "").upper() == "PAID":
            return {"success": True, "skipped": True, "reason": "already_paid", "reference": link.get("reference")}
        link["status"] = "PAID"
        link["paidAt"] = _now()
        link["providerPaymentId"] = payment_id or link.get("providerPaymentId")
        link["confirmedVia"] = "webhook"
        body["paymentLinks"] = links
        audit = list(body.get("auditLog") or [])
        audit.insert(
            0,
            {
                "id": f"AUD-{uuid4().hex[:8]}",
                "performedAt": _now(),
                "performedBy": "razorpay-webhook",
                "action": "PAYMENT_GATEWAY_WEBHOOK",
                "entity": "PaymentLink",
                "entityId": link.get("id"),
                "newValue": payment_id,
                "reason": event,
            },
        )
        body["auditLog"] = audit
        source = _receipt_source(
            None,
            None,
            "online_gateway",
            gateway="razorpay",
            confirmedVia="webhook",
            providerPaymentId=link.get("providerPaymentId"),
            providerOrderId=order_id,
            paymentReference=link.get("reference"),
            recordedBy="razorpay-webhook",
        )
        settled = _settle_gateway_link(body, link, actor_email="razorpay-webhook", source=source)
        if settled:
            _record_receipt_ledger(db, row.campus_id, settled["receipt"])
        _mark_intent_paid(intent, link, settled)
        row.body = body
        flag_modified(row, "body")
        write_audit(
            db,
            action="PAYMENT_GATEWAY_WEBHOOK",
            entity_type="payment_link",
            entity_id=str(link.get("id")),
            campus_id=row.campus_id,
            details=link.get("reference"),
        )
        db.commit()
        if settled:
            _notify_fee_paid(db, row.campus_id, link.get("studentId"), settled["receipt"])
        # Signature-verified webhook path — liveVerified only when not in demo outbox mode.
        return {
            "success": True,
            "reference": link.get("reference"),
            "event": event,
            "liveVerified": not settings.demo_integrations,
            "demo": bool(settings.demo_integrations),
        }

    fail(404, "not_found", "No payment link matches this Razorpay order.")


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


def _parse_money(value) -> float:
    if isinstance(value, (int, float)):
        return float(value or 0)
    digits = "".join(ch for ch in str(value or "") if ch.isdigit() or ch == ".")
    try:
        return float(digits) if digits else 0.0
    except ValueError:
        return 0.0


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

    # Approved claims become posted OUT expenditure so Reports / Collections track spend.
    if decision == "approved":
        amount = _parse_money(row.get("amount"))
        txn_id = f"TXN-APR-{str(row.get('id') or '').replace(' ', '')}"
        transactions = list(data.get("transactions") or [])
        already = any(
            str(t.get("id") or "") == txn_id
            or str(t.get("linkedApprovalId") or "") == str(row.get("id") or "")
            for t in transactions
        )
        if amount > 0 and not already:
            seq = _seq(data)
            seq["txn"] += 1
            seq["voucher"] += 1
            dept = str(row.get("department") or "")
            txn = {
                "id": txn_id,
                "transactionNo": f"TXN-{seq['txn']:04d}",
                "transactionDate": _now()[:10],
                "direction": "OUT",
                "sourceModule": "TRANSPORT" if dept.lower() == "transport" else "MANUAL",
                "category": row.get("type") or "Expense Claim",
                "paymentMode": "BANK_TRANSFER",
                "amount": amount,
                "status": "POSTED",
                "voucherNo": f"PV-{seq['voucher']:04d}",
                "reference": row.get("id"),
                "linkedApprovalId": row.get("id"),
                "linkedRequestId": row.get("linkedRequestId") or "",
                "narration": (
                    f"{row.get('type') or 'Approval'} — {row.get('raisedBy') or 'Staff'}"
                    f" · {dept}".strip()
                ),
                "createdBy": actor.email,
                "createdAt": _now(),
                "entryType": "Expense",
            }
            transactions.insert(0, txn)
            data["transactions"] = transactions
            _append_accounting_posting(data, txn, None)

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
