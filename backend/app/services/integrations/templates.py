"""Professional email HTML + WhatsApp text templates (no live send here)."""

from __future__ import annotations

from html import escape


def fee_receipt_email(*, school_name: str, receipt_no: str, amount_label: str, student_name: str, from_address: str) -> tuple[str, str, str]:
    """Return (subject, text_body, html_body)."""
    subject = f"{school_name} — Fee receipt {receipt_no}"
    text = (
        f"Dear Parent/Guardian,\n\n"
        f"This is a fee payment receipt from {school_name}.\n\n"
        f"Student: {student_name or '—'}\n"
        f"Receipt no.: {receipt_no}\n"
        f"Amount: {amount_label}\n\n"
        f"This mailbox is not monitored. Please do not reply to {from_address}.\n"
        f"Contact the school accounts office for queries.\n\n"
        f"— {school_name}\n"
    )
    html = f"""<!DOCTYPE html>
<html><body style="font-family:Segoe UI,Arial,sans-serif;color:#1a202c;line-height:1.5">
  <p>Dear Parent/Guardian,</p>
  <p>This is a fee payment receipt from <strong>{escape(school_name)}</strong>.</p>
  <table style="border-collapse:collapse;margin:16px 0">
    <tr><td style="padding:4px 12px 4px 0;color:#4a5568">Student</td><td style="padding:4px 0">{escape(student_name or "—")}</td></tr>
    <tr><td style="padding:4px 12px 4px 0;color:#4a5568">Receipt no.</td><td style="padding:4px 0">{escape(str(receipt_no))}</td></tr>
    <tr><td style="padding:4px 12px 4px 0;color:#4a5568">Amount</td><td style="padding:4px 0"><strong>{escape(str(amount_label))}</strong></td></tr>
  </table>
  <p style="color:#718096;font-size:13px">This is an automated message from a non-reply address
  (<code>{escape(from_address)}</code>). Do not reply to this email.</p>
  <p>— {escape(school_name)}</p>
</body></html>"""
    return subject, text, html


def fee_receipt_whatsapp(*, school_name: str, receipt_no: str, amount_label: str, student_name: str) -> str:
    return (
        f"{school_name}: Fee receipt {receipt_no} for {student_name or 'student'}. "
        f"Amount {amount_label}. This is an automated notice — please do not reply on WhatsApp."
    )


def enquiry_ack_whatsapp(*, school_name: str, student_name: str, class_name: str, enquiry_code: str) -> str:
    return (
        f"{school_name}: Thank you. We received the admission enquiry for "
        f"{student_name or 'your child'} ({class_name or 'class'}). "
        f"Reference {enquiry_code}. Our admissions team will follow up shortly. "
        f"Please do not reply on WhatsApp."
    )


def admission_ack_whatsapp(*, school_name: str, student_name: str, class_name: str, admission_code: str) -> str:
    return (
        f"{school_name}: Admission recorded for {student_name or 'student'} "
        f"({class_name or 'class'}). Admission no. {admission_code}. "
        f"Please do not reply on WhatsApp."
    )


def enrollment_ack_whatsapp(*, school_name: str, student_name: str, class_name: str, admission_code: str) -> str:
    return (
        f"{school_name}: {student_name or 'Student'} is enrolled in {class_name or 'class'}. "
        f"Admission no. {admission_code}. Parent portal access will follow school process. "
        f"Please do not reply on WhatsApp."
    )


def payment_link_whatsapp(
    *,
    school_name: str,
    student_name: str,
    amount_label: str,
    reference: str,
    url: str,
) -> str:
    return (
        f"{school_name}: Fee payment link for {student_name or 'student'}. "
        f"Amount {amount_label}. Reference {reference}. "
        f"Pay securely: {url}. Please do not reply on WhatsApp."
    )


def fee_due_whatsapp(
    *,
    school_name: str,
    student_name: str,
    label: str,
    amount_label: str,
    due_label: str,
) -> str:
    return (
        f"{school_name}: Fee reminder for {student_name or 'student'}. "
        f"{label} — {amount_label} due on {due_label}. "
        f"Please pay via the parent portal or accounts office. Do not reply on WhatsApp."
    )


def result_publish_whatsapp(
    *,
    school_name: str,
    student_name: str,
    exam_name: str,
    subject: str,
) -> str:
    return (
        f"{school_name}: Result published for {student_name or 'student'}. "
        f"{exam_name} — {subject} is now available in the parent/student portal. "
        f"Please do not reply on WhatsApp."
    )


def password_reset_email(*, school_name: str, login_email: str, temporary_password: str, from_address: str) -> tuple[str, str, str]:
    subject = f"{school_name} — Temporary login password"
    text = (
        f"Your QMIS login password was reset by HR.\n\n"
        f"Email: {login_email}\n"
        f"Temporary password: {temporary_password}\n\n"
        f"Change this password on next login.\n"
        f"Do not reply to {from_address}.\n"
    )
    html = f"""<!DOCTYPE html>
<html><body style="font-family:Segoe UI,Arial,sans-serif;color:#1a202c">
  <p>Your QMIS login password was reset by HR.</p>
  <p>Email: <strong>{escape(login_email)}</strong><br/>
  Temporary password: <code>{escape(temporary_password)}</code></p>
  <p>Change this password on next login.</p>
  <p style="color:#718096;font-size:13px">Non-reply address: {escape(from_address)}</p>
</body></html>"""
    return subject, text, html
