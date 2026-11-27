"""Event → WhatsApp content + AskEva template mapping.

AskEva free-form text only works inside an open chat session. Cold outreach needs a
Meta-approved template. Event templates are configured in .env; message bodies always
carry the correct business content for open sessions / future variable templates.
"""

from __future__ import annotations

from app.core.config import settings
from app.services.integrations import templates as tpl

# Logical events used by admissions / finance / exams / reminders.
EVENT_ENQUIRY = "enquiry"
EVENT_ADMISSION = "admission"
EVENT_ENROLLMENT = "enrollment"
EVENT_FEE_RECEIPT = "fee_receipt"
EVENT_FEE_DUE = "fee_due"
EVENT_PAYMENT_LINK = "payment_link"
EVENT_RESULT = "result"
EVENT_GENERIC = "generic"


def template_for_event(event: str | None) -> str:
    """Approved AskEva template name for this event (empty = text-only / session required)."""
    key = str(event or EVENT_GENERIC).strip().lower()
    mapping = {
        EVENT_ENQUIRY: settings.whatsapp_template_enquiry,
        EVENT_ADMISSION: settings.whatsapp_template_admission,
        EVENT_ENROLLMENT: settings.whatsapp_template_enrollment,
        EVENT_FEE_RECEIPT: settings.whatsapp_template_fee_receipt,
        EVENT_FEE_DUE: settings.whatsapp_template_fee_due,
        EVENT_PAYMENT_LINK: settings.whatsapp_template_payment_link,
        EVENT_RESULT: settings.whatsapp_template_result,
        EVENT_GENERIC: settings.whatsapp_template_name,
    }
    named = str(mapping.get(key) or "").strip()
    if named:
        return named
    # Welcome-style templates are OK for admissions funnel only — never for fees/results.
    if key in {EVENT_ENQUIRY, EVENT_ADMISSION, EVENT_ENROLLMENT, EVENT_GENERIC}:
        return str(settings.whatsapp_template_name or "").strip()
    return ""


def fee_receipt_message(*, student_name: str, receipt_no: str, amount_label: str) -> tuple[str, list[str]]:
    school = settings.school_display_name
    text = tpl.fee_receipt_whatsapp(
        school_name=school,
        receipt_no=receipt_no,
        amount_label=amount_label,
        student_name=student_name,
    )
    # Matches AskEva fee_payment_done:
    # Hello {{1}}, payment of {{2}} received for {{3}}. Receipt no. {{4}}.
    name = student_name or "Parent"
    return text, [name, amount_label, name, str(receipt_no)]


def fee_due_message(
    *,
    student_name: str,
    label: str,
    amount_label: str,
    due_label: str,
) -> tuple[str, list[str]]:
    school = settings.school_display_name
    text = tpl.fee_due_whatsapp(
        school_name=school,
        student_name=student_name,
        label=label,
        amount_label=amount_label,
        due_label=due_label,
    )
    return text, [student_name or "Parent", label, amount_label, due_label]


def payment_link_message(
    *,
    student_name: str,
    amount_label: str,
    reference: str,
    url: str,
) -> tuple[str, list[str]]:
    school = settings.school_display_name
    text = tpl.payment_link_whatsapp(
        school_name=school,
        student_name=student_name,
        amount_label=amount_label,
        reference=reference,
        url=url,
    )
    return text, [student_name or "Parent", amount_label, reference, url]


def result_message(*, student_name: str, exam_name: str, subject: str) -> tuple[str, list[str]]:
    school = settings.school_display_name
    text = tpl.result_publish_whatsapp(
        school_name=school,
        student_name=student_name,
        exam_name=exam_name,
        subject=subject,
    )
    return text, [student_name or "Parent", exam_name, subject]


def enquiry_message(*, student_name: str, class_name: str, enquiry_code: str) -> tuple[str, list[str]]:
    school = settings.school_display_name
    text = tpl.enquiry_ack_whatsapp(
        school_name=school,
        student_name=student_name,
        class_name=class_name,
        enquiry_code=enquiry_code,
    )
    return text, [student_name or "Parent", class_name, enquiry_code]


def admission_message(*, student_name: str, class_name: str, admission_code: str) -> tuple[str, list[str]]:
    school = settings.school_display_name
    text = tpl.admission_ack_whatsapp(
        school_name=school,
        student_name=student_name,
        class_name=class_name,
        admission_code=admission_code,
    )
    return text, [student_name or "Parent", class_name, admission_code]


def enrollment_message(*, student_name: str, class_name: str, admission_code: str) -> tuple[str, list[str]]:
    school = settings.school_display_name
    text = tpl.enrollment_ack_whatsapp(
        school_name=school,
        student_name=student_name,
        class_name=class_name,
        admission_code=admission_code,
    )
    return text, [student_name or "Parent", class_name, admission_code]
