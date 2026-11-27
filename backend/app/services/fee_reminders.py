"""Fee due reminders for parents (in-app + best-effort WhatsApp).

Schedule:
- one reminder per unpaid instalment once it is due within the next 15 days;
- during the final month of the academic year, one weekly reminder per student summarising
  everything still outstanding.

Every reminder carries a stable key (entity_id), so running the sweep again never repeats one.
There is no background scheduler: the sweep runs when the Account Head presses "Send Reminder"
and, for their own children, whenever a parent opens the fee portal.
"""

from __future__ import annotations

import hashlib
from datetime import date
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Admission, FinanceRecord, Guardian, Notification, Student
from app.services import finance as fin
from app.services import finance_actions as fa
from app.services.placement import current_academic_year


def _parent_phone(db: Session, student: Student) -> str:
    guardian = db.scalar(
        select(Guardian).where(Guardian.student_id == student.id).order_by(Guardian.created_at.asc())
    )
    if guardian and guardian.phone:
        return str(guardian.phone).strip()
    if student.admission_id:
        admission = db.get(Admission, student.admission_id)
        if admission is not None:
            return str(admission.parent_mobile_number or admission.mobile_number or "").strip()
    return ""


def _whatsapp_due(db: Session, student: Student, *, event_key: str, title: str, body: str, params: list[str]) -> None:
    phone = _parent_phone(db, student)
    if not phone:
        return
    try:
        from app.services.integrations import whatsapp_events as wa
        from app.services.integrations.notify import notify_event

        notify_event(
            event_key=event_key,
            subject=title,
            body=body,
            phone=phone,
            event=wa.EVENT_FEE_DUE,
            template_params=params,
        )
    except Exception:
        pass

REMINDER_DAYS_BEFORE_DUE = 15
FINAL_MONTH_DAYS = 30
SETTLED = {"PAID", "WAIVED", "CANCELLED"}
ENTITY_TYPE = "fee_reminder"


def _digest(value: str) -> str:
    return hashlib.sha1(value.encode("utf-8")).hexdigest()[:16]


def _uuid(value) -> UUID | None:
    try:
        return UUID(str(value))
    except (TypeError, ValueError):
        return None


def _add_once(db: Session, *, campus_id, user_id, key: str, title: str, body: str) -> bool:
    exists = db.scalar(
        select(Notification.id).where(
            Notification.user_id == user_id,
            Notification.entity_type == ENTITY_TYPE,
            Notification.entity_id == key,
        )
    )
    if exists is not None:
        return False
    db.add(Notification(campus_id=campus_id, user_id=user_id, title=title, body=body,
                        entity_type=ENTITY_TYPE, entity_id=key))
    return True


def run_sweep(db: Session, campus_id, *, today: date | None = None, student_ids: set[str] | None = None) -> dict:
    today = today or date.today()
    snapshot = db.scalar(
        select(FinanceRecord).where(
            FinanceRecord.campus_id == campus_id,
            FinanceRecord.collection == fin._SNAPSHOT,
            FinanceRecord.public_id == fin._SNAPSHOT_ID,
        )
    )
    data = dict(snapshot.body or {}) if snapshot else {}
    fine_rules = list(data.get("fineRules") or [])

    year = current_academic_year(db, campus_id)
    year_end = year.end_date if year and year.end_date else None
    days_left = (year_end - today).days if year_end else None
    final_month = days_left is not None and 0 <= days_left < FINAL_MONTH_DAYS

    outstanding: dict[str, list[tuple[dict, float, date | None]]] = {}
    for row in data.get("installments") or []:
        sid = str(row.get("studentId") or "")
        if not sid or (student_ids is not None and sid not in student_ids):
            continue
        if str(row.get("forcedStatus") or row.get("status") or "").upper() in SETTLED:
            continue
        _, _, balance = fa._live_payable(row, fine_rules, today)
        if balance <= 0:
            continue
        outstanding.setdefault(sid, []).append((row, balance, fa._parse_iso_date(row.get("dueDate"))))

    sent = {"dueSoon": 0, "finalMonth": 0}
    skipped_no_parent = 0
    for sid, rows in outstanding.items():
        key_id = _uuid(sid)
        student = db.get(Student, key_id) if key_id else None
        if student is None or student.campus_id != campus_id or not student.parent_user_id:
            skipped_no_parent += 1
            continue
        for row, balance, due in rows:
            if due is None or not 0 <= (due - today).days <= REMINDER_DAYS_BEFORE_DUE:
                continue
            label = row.get("installmentLabel") or row.get("feeHead") or "School fee"
            due_key = f"due15:{_digest(str(row.get('id')))}"
            title = f"Fee due on {due:%d %b %Y}"
            amount_label = fa._inr_label(balance)
            due_label = f"{due:%d %b %Y}"
            body = f"{student.full_name}: {label} — {amount_label} due on {due_label}."
            if _add_once(
                db,
                campus_id=campus_id,
                user_id=student.parent_user_id,
                key=due_key,
                title=title,
                body=body,
            ):
                sent["dueSoon"] += 1
                from app.services.integrations import whatsapp_events as wa

                wa_text, wa_params = wa.fee_due_message(
                    student_name=student.full_name or "",
                    label=str(label),
                    amount_label=amount_label,
                    due_label=due_label,
                )
                _whatsapp_due(
                    db,
                    student,
                    event_key=f"fee-due-whatsapp:{due_key}",
                    title=title,
                    body=wa_text,
                    params=wa_params,
                )
        if final_month:
            total = sum(balance for _, balance, _ in rows)
            final_key = f"final:{year_end.isoformat()}:w{days_left // 7}:{_digest(sid)}"
            title = f"Fees outstanding — academic year ends {year_end:%d %b %Y}"
            amount_label = fa._inr_label(total)
            due_label = f"{year_end:%d %b %Y}"
            body = f"{student.full_name}: {amount_label} outstanding across {len(rows)} instalment(s)."
            if _add_once(
                db,
                campus_id=campus_id,
                user_id=student.parent_user_id,
                key=final_key,
                title=title,
                body=body,
            ):
                sent["finalMonth"] += 1
                from app.services.integrations import whatsapp_events as wa

                wa_text, wa_params = wa.fee_due_message(
                    student_name=student.full_name or "",
                    label=f"{len(rows)} instalment(s) outstanding",
                    amount_label=amount_label,
                    due_label=due_label,
                )
                _whatsapp_due(
                    db,
                    student,
                    event_key=f"fee-due-whatsapp:{final_key}",
                    title=title,
                    body=wa_text,
                    params=wa_params,
                )
    db.commit()
    return {
        "success": True,
        "sent": sent["dueSoon"] + sent["finalMonth"],
        "dueSoon": sent["dueSoon"],
        "finalMonth": sent["finalMonth"],
        "studentsWithDues": len(outstanding),
        "skippedNoParentLogin": skipped_no_parent,
        "finalMonthActive": final_month,
        "academicYearEnd": year_end.isoformat() if year_end else None,
    }
