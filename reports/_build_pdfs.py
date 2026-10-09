"""One-off builder for the manager PDFs. Not part of the app."""
from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT, TA_RIGHT
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    ListFlowable, ListItem, HRFlowable, KeepTogether,
)

NAVY = colors.HexColor("#1B2A4A")
BLUE = colors.HexColor("#515DEF")
INK = colors.HexColor("#1E1E1E")
MUTED = colors.HexColor("#5C6570")
LINE = colors.HexColor("#E4E7EE")
HEAD_BG = colors.HexColor("#EEF0FA")
GREEN = colors.HexColor("#1B7F4E")
GREEN_BG = colors.HexColor("#E8F6EE")
AMBER_BG = colors.HexColor("#FFF6E8")


def styles():
    base = getSampleStyleSheet()
    return {
        "kicker": ParagraphStyle("kicker", parent=base["Normal"], fontName="Helvetica", fontSize=8, textColor=BLUE, tracking=0.6, spaceAfter=2),
        "title": ParagraphStyle("title", parent=base["Normal"], fontName="Helvetica-Bold", fontSize=18, textColor=NAVY, leading=22, spaceAfter=2),
        "sub": ParagraphStyle("sub", parent=base["Normal"], fontName="Helvetica", fontSize=9, textColor=MUTED, leading=13, spaceAfter=8),
        "h": ParagraphStyle("h", parent=base["Normal"], fontName="Helvetica-Bold", fontSize=12, textColor=NAVY, spaceBefore=10, spaceAfter=4),
        "body": ParagraphStyle("body", parent=base["Normal"], fontName="Helvetica", fontSize=9.5, textColor=INK, leading=13.5, spaceAfter=3),
        "small": ParagraphStyle("small", parent=base["Normal"], fontName="Helvetica", fontSize=8, textColor=MUTED, leading=11),
        "cell": ParagraphStyle("cell", parent=base["Normal"], fontName="Helvetica", fontSize=8, textColor=INK, leading=10.5),
        "cell_h": ParagraphStyle("cell_h", parent=base["Normal"], fontName="Helvetica-Bold", fontSize=8, textColor=NAVY, leading=10.5),
        "pass": ParagraphStyle("pass", parent=base["Normal"], fontName="Helvetica-Bold", fontSize=8, textColor=GREEN, leading=10.5),
        "footer": ParagraphStyle("footer", parent=base["Normal"], fontName="Helvetica", fontSize=8, textColor=MUTED),
        "footer_r": ParagraphStyle("footer_r", parent=base["Normal"], fontName="Helvetica", fontSize=8, textColor=MUTED, alignment=TA_RIGHT),
    }


def header_footer(canvas, doc, subtitle):
    canvas.saveState()
    canvas.setFillColor(NAVY)
    canvas.rect(0, A4[1] - 12 * mm, A4[0], 12 * mm, fill=1, stroke=0)
    canvas.setFillColor(colors.white)
    canvas.setFont("Helvetica-Bold", 8)
    canvas.drawString(16 * mm, A4[1] - 7.5 * mm, "QMIS ERP")
    canvas.setFont("Helvetica", 8)
    canvas.drawRightString(A4[0] - 16 * mm, A4[1] - 7.5 * mm, subtitle)
    canvas.setFillColor(MUTED)
    canvas.setFont("Helvetica", 8)
    canvas.drawString(16 * mm, 8 * mm, "Queen Mira International School  ·  HR department  ·  9 October 2026")
    canvas.drawRightString(A4[0] - 16 * mm, 8 * mm, f"Page {doc.page}")
    canvas.setStrokeColor(LINE)
    canvas.line(16 * mm, 12 * mm, A4[0] - 16 * mm, 12 * mm)
    canvas.restoreState()


def bullets(items, s):
    flow = []
    for item in items:
        flow.append(ListItem(Paragraph(item, s["body"]), leftIndent=8, bulletColor=BLUE, value="l"))
    return ListFlowable(flow, bulletType="bullet", start="l", leftIndent=14, bulletFontName="ZapfDingbats", bulletFontSize=6, spaceBefore=1, spaceAfter=2)


def work_pdf(path):
    s = styles()
    doc = SimpleDocTemplate(path, pagesize=A4, leftMargin=16 * mm, rightMargin=16 * mm, topMargin=18 * mm, bottomMargin=16 * mm, title="Daily work report — 9 October 2026", author="QMIS ERP")
    story = [
        Paragraph("DAILY WORK REPORT", s["kicker"]),
        Paragraph("9 October 2026", s["title"]),
        Paragraph("Queen Mira International School ERP  ·  HR + Admissions + Finance  ·  Manager update", s["sub"]),
        HRFlowable(width="100%", thickness=1, color=LINE, spaceAfter=8),
    ]
    badge = Table(
        [[Paragraph("<b>Status.</b> Finance closeout: snapshot + server actions + FE wiring. 38 API tests passed.", s["body"])]],
        colWidths=[178 * mm],
    )
    badge.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), GREEN_BG),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("TOPPADDING", (0, 0), (-1, -1), 7),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
        ("BOX", (0, 0), (-1, -1), 0.4, colors.HexColor("#B7E0C6")),
    ]))
    story.append(badge)
    story.append(Paragraph("Done today", s["h"]))
    story.append(bullets([
        "Finance server actions: collect-payment, settle-cheque, send-receipt, gateway-intent, apply-hr-concessions, post-payroll-voucher, decide-approval.",
        "Transport fleet, wallets, approvals, Collections/Reports/Dashboard, SuperAdmin Finance read live snapshot.",
        "Settings button applies approved HR staff-child concessions onto fee installments.",
        "HR paid payroll-months posts Finance OUT vouchers; gateway/WhatsApp/email remain stubs until keys.",
        "Seed login accounthead@qmis.edu / accounts123; VITE_USE_API_FINANCE=true.",
    ], s))
    story.append(Paragraph("Test result", s["h"]))
    story.append(Paragraph("38 automated tests passed in about 20 seconds. The module-by-module detail is in the testing report.", s["body"]))
    story.append(Paragraph("Still open", s["h"]))
    story.append(Paragraph("These items depend on other systems or a browser pass.", s["body"]))
    story.append(bullets([
        "RFID device punches",
        "Real SMTP / WhatsApp Business / payment gateway keys (stubs queue attempts today)",
        "Production cutover: stop treating localStorage as source of truth",
        "Academics reassigning periods when a teacher takes emergency leave",
        "Browser click-through of fees collection against the live API",
    ], s))
    story.append(Paragraph("How to see it", s["h"]))
    story.append(bullets([
        "Account Head portal with VITE_USE_API_FINANCE=true.",
        "API tests: from backend, run python -m pytest tests/test_finance.py tests/test_finance_actions.py tests/test_admissions.py tests/test_hr_modules.py tests/test_hr.py tests/test_phase0.py -v",
    ], s))
    doc.build(story, onFirstPage=lambda c, d: header_footer(c, d, "Daily work report"), onLaterPages=lambda c, d: header_footer(c, d, "Daily work report"))


def testing_pdf(path):
    s = styles()
    page = landscape(A4)
    def hf(canvas, doc):
        canvas.saveState()
        canvas.setFillColor(NAVY)
        canvas.rect(0, page[1] - 12 * mm, page[0], 12 * mm, fill=1, stroke=0)
        canvas.setFillColor(colors.white)
        canvas.setFont("Helvetica-Bold", 8)
        canvas.drawString(14 * mm, page[1] - 7.5 * mm, "QMIS ERP")
        canvas.setFont("Helvetica", 8)
        canvas.drawRightString(page[0] - 14 * mm, page[1] - 7.5 * mm, "HR testing report")
        canvas.setFillColor(MUTED)
        canvas.setFont("Helvetica", 8)
        canvas.drawString(14 * mm, 8 * mm, "Queen Mira International School  ·  HR department  ·  9 October 2026")
        canvas.drawRightString(page[0] - 14 * mm, 8 * mm, f"Page {doc.page}")
        canvas.setStrokeColor(LINE)
        canvas.line(14 * mm, 12 * mm, page[0] - 14 * mm, 12 * mm)
        canvas.restoreState()

    doc = SimpleDocTemplate(path, pagesize=page, leftMargin=14 * mm, rightMargin=14 * mm, topMargin=18 * mm, bottomMargin=16 * mm, title="HR testing report — 9 October 2026", author="QMIS ERP")
    story = [
        Paragraph("HR TESTING REPORT", s["kicker"]),
        Paragraph("Module results for 9 October 2026", s["title"]),
        Paragraph("API tests for Finance actions, Admissions, and HR. The browser was not clicked through in this run.", s["sub"]),
    ]
    summary = Table([[
        Paragraph("<b>38 passed</b>", s["body"]),
        Paragraph("<b>0 failed</b>", s["body"]),
        Paragraph("About 20 seconds", s["body"]),
        Paragraph("Last run: 9 October 2026 finance closeout", s["body"]),
    ]], colWidths=[60 * mm, 50 * mm, 55 * mm, 90 * mm])
    summary.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (0, 0), GREEN_BG),
        ("BACKGROUND", (1, 0), (1, 0), GREEN_BG),
        ("BACKGROUND", (2, 0), (-1, -1), HEAD_BG),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("BOX", (0, 0), (-1, -1), 0.4, LINE),
        ("LINEAFTER", (0, 0), (-2, 0), 0.3, colors.white),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ]))
    story.append(summary)
    story.append(Spacer(1, 4 * mm))
    story.append(Paragraph("Command, from the backend folder:  python -m pytest tests/test_finance.py tests/test_finance_actions.py tests/test_admissions.py tests/test_hr_modules.py tests/test_hr.py tests/test_phase0.py -v", s["small"]))
    story.append(Paragraph("Module results", s["h"]))

    rows_data = [
        ("Finance snapshot", "test_accounthead_can_save_finance_state", "Account Head PUT/GET finance state and receipts collection"),
        ("Finance authz", "test_hr_cannot_write_finance", "HR cannot write finance"),
        ("Finance reset", "test_finance_reset", "Admin reset clears seeded snapshot"),
        ("Finance collect + receipt", "test_collect_payment_and_send_receipt", "Cash collect posts receipt; WhatsApp send is queued_stub"),
        ("Finance gateway + approval", "test_gateway_intent_and_approval", "Stub gateway intent and approve a pending claim"),
        ("Finance HR links", "test_hr_concession_and_payroll_voucher", "Apply staff-child concession; paid payroll posts OUT voucher"),
        ("Admissions enquiry → enroll", "test_rich_enquiry_admission_enroll_with_parent", "Create enquiry, convert, patch, enroll with parent user, reject double enroll"),
        ("Admissions create", "test_create_admission_direct", "Direct admission create and list"),
        ("Staff user creation", "test_module_staff_user_creation", "HR creates the person, the temporary password logs in, first login must change the password, and the assignment is stored"),
        ("Password change", "test_staff_must_change_password_then_clears", "Temporary password forces change; after change, login no longer requires it"),
        ("File upload", "test_file_upload_stub", "File bytes are stored and downloaded through /api/v1/files"),
        ("Announcements", "test_module_announcements_collection", "HR announcements save on the announcements collection"),
        ("Documents", "test_module_documents", "An ID proof is stored as Verified"),
        ("Recruitment and interview", "test_module_recruitment_and_interview", "Job, candidate, scheduled interview, then a Selected decision"),
        ("Offer and onboarding", "test_module_offer_and_onboarding", "Accepted offer and an onboarding checklist item"),
        ("Observation and shadow mentor", "test_module_observation_and_shadow", "Observation decision and a mentor assignment"),
        ("Attendance and leave", "test_module_leave_updates_attendance", "Approved casual leave writes attendance as Leave"),
        ("Permission", "test_permission_request_marks_attendance", "A permission request writes attendance as Permission"),
        ("Leave balance", "test_leave_balance_by_type", "12 days entitlement minus 2 approved days leaves 10"),
        ("Training", "test_module_training", "Session, attendance, and participant feedback"),
        ("Performance and BSC", "test_module_performance_and_increment", "Review with a BSC score. An applied increment cannot be rewritten"),
        ("Increment", "test_applied_increment_updates_salary", "An applied revision updates designation and gross salary"),
        ("Payroll", "test_module_payroll_lock", "A paid month stays at the original net salary"),
        ("Salary advance", "test_module_salary_advance", "An approved advance keeps the outstanding balance"),
        ("Disciplinary action", "test_module_disciplinary_is_permanent", "Editing an approved record is rejected"),
        ("Staff-child concession", "test_module_child_concession", "The concession percent is stored against the employee"),
        ("Exit", "test_module_exit_deactivates_login", "A completed exit makes the old password fail"),
        ("Incentives", "test_module_claims_and_incentives", "An extra-work claim and an incentive row are stored"),
        ("Who can see a profile", "test_employee_sees_only_own_profile", "A teacher login sees only their own profile"),
        ("Locked profile", "test_saved_staff_profile_cannot_be_rewritten", "Name and salary stay fixed. Department and role can transfer, and the old department stays in history"),
        ("HR data round trip", "test_hr_vertical_round_trip", "Employees and HR collections save and load again"),
        ("Login required", "test_hr_routes_require_a_token", "HR routes reject a request with no token"),
        ("Health, login, OTP, masters, legacy enroll", "Phase 0 tests", "Shared login, masters, and the legacy enquiry enroll shortcut still work"),
    ]
    header = [Paragraph(t, s["cell_h"]) for t in ("Module", "Test", "Result", "What was checked")]
    data = [header]
    for module, test, checked in rows_data:
        data.append([
            Paragraph(module, s["cell"]),
            Paragraph(test, s["cell"]),
            Paragraph("Passed", s["pass"]),
            Paragraph(checked, s["cell"]),
        ])
    table = Table(data, colWidths=[52 * mm, 78 * mm, 22 * mm, 115 * mm], repeatRows=1)
    style_cmds = [
        ("BACKGROUND", (0, 0), (-1, 0), HEAD_BG),
        ("TEXTCOLOR", (0, 0), (-1, 0), NAVY),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 4),
        ("RIGHTPADDING", (0, 0), (-1, -1), 4),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ("GRID", (0, 0), (-1, -1), 0.3, LINE),
        ("BACKGROUND", (2, 1), (2, -1), GREEN_BG),
    ]
    for i in range(1, len(data)):
        if i % 2 == 0:
            style_cmds.append(("BACKGROUND", (0, i), (1, i), colors.HexColor("#FAFBFD")))
            style_cmds.append(("BACKGROUND", (3, i), (3, i), colors.HexColor("#FAFBFD")))
    table.setStyle(TableStyle(style_cmds))
    story.append(table)
    story.append(Paragraph("Not covered by this run", s["h"]))
    story.append(bullets([
        "Clicking through each HR screen in the browser",
        "RFID punch import",
        "Sending the temporary password by real email",
        "Real payment gateway / SMTP / WhatsApp keys (stubs only)",
        "Academics reassigning a teacher's periods for emergency leave",
    ], s))
    doc.build(story, onFirstPage=hf, onLaterPages=hf)


if __name__ == "__main__":
    work_pdf(r"c:\karan\ERP dev\reports\Daily-Work-Report-2026-10-09.pdf")
    testing_pdf(r"c:\karan\ERP dev\reports\HR-Testing-Report-2026-10-09.pdf")
    print("ok")
