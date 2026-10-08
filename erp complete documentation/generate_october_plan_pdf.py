"""Generate the QMIS October week-wise / day-wise delivery PDF."""

from reportlab.lib.colors import Color, HexColor, white, black
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    KeepTogether,
    ListFlowable,
    ListItem,
    PageBreak,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

NAVY = HexColor("#1B2A4A")
STEEL = HexColor("#2C4A6E")
ACCENT = HexColor("#3D5A80")
RULE = HexColor("#C5CDD6")
PALE = HexColor("#F3F5F8")
PALE_BLUE = HexColor("#E8EEF5")
PALE_AMBER = HexColor("#F7F1E4")
PALE_GREEN = HexColor("#E6F0EA")
AMBER = HexColor("#8A5A12")
GREEN = HexColor("#1F6B45")
INK = HexColor("#1A1F26")
MUTED = HexColor("#5B6570")
ROW_ALT = HexColor("#F7F8FA")

pdfmetrics.registerFont(TTFont("Calibri", r"C:\Windows\Fonts\calibri.ttf"))
pdfmetrics.registerFont(TTFont("Calibri-Bold", r"C:\Windows\Fonts\calibrib.ttf"))

PAGE_W, PAGE_H = A4
LEFT = 16 * mm
RIGHT = 16 * mm
TOP = 18 * mm
BOTTOM = 16 * mm
CONTENT_W = PAGE_W - LEFT - RIGHT


def header_footer(canvas, doc):
    canvas.saveState()
    canvas.setFillColor(NAVY)
    canvas.rect(0, PAGE_H - 12 * mm, PAGE_W, 12 * mm, fill=1, stroke=0)
    canvas.setFillColor(white)
    canvas.setFont("Calibri", 8.5)
    canvas.drawString(LEFT, PAGE_H - 7.6 * mm, "QMIS School ERP  |  October 2026 Delivery Plan")
    canvas.drawRightString(PAGE_W - RIGHT, PAGE_H - 7.6 * mm, "Week-wise and day-wise process")

    canvas.setFillColor(NAVY)
    canvas.rect(0, 0, PAGE_W, 10 * mm, fill=1, stroke=0)
    canvas.setFillColor(white)
    canvas.setFont("Calibri", 8)
    canvas.drawString(LEFT, 4 * mm, "Internal  ·  Queen Mira International School  ·  Academics PDF v0.1")
    canvas.drawRightString(PAGE_W - RIGHT, 4 * mm, f"Page {doc.page}")
    canvas.restoreState()


def styles():
    s = getSampleStyleSheet()
    s.add(ParagraphStyle(name="CoverKicker", fontName="Calibri", fontSize=10, textColor=STEEL, leading=13, alignment=TA_CENTER))
    s.add(ParagraphStyle(name="CoverTitle", fontName="Calibri-Bold", fontSize=22, textColor=NAVY, leading=27, alignment=TA_CENTER, spaceAfter=6))
    s.add(ParagraphStyle(name="CoverSub", fontName="Calibri", fontSize=11, textColor=MUTED, leading=15, alignment=TA_CENTER, spaceAfter=4))
    s.add(ParagraphStyle(name="H1", fontName="Calibri-Bold", fontSize=14, textColor=NAVY, leading=18, spaceBefore=2, spaceAfter=6))
    s.add(ParagraphStyle(name="H2", fontName="Calibri-Bold", fontSize=11.5, textColor=STEEL, leading=15, spaceBefore=8, spaceAfter=4))
    s.add(ParagraphStyle(name="Body", fontName="Calibri", fontSize=9.2, textColor=INK, leading=12.6, alignment=TA_JUSTIFY, spaceAfter=5))
    s.add(ParagraphStyle(name="BodyLeft", fontName="Calibri", fontSize=9.2, textColor=INK, leading=12.6, alignment=TA_LEFT, spaceAfter=4))
    s.add(ParagraphStyle(name="Small", fontName="Calibri", fontSize=8.4, textColor=MUTED, leading=11.2, spaceAfter=3))
    s.add(ParagraphStyle(name="Cell", fontName="Calibri", fontSize=8.1, textColor=INK, leading=11))
    s.add(ParagraphStyle(name="CellBold", fontName="Calibri-Bold", fontSize=8.1, textColor=NAVY, leading=11))
    s.add(ParagraphStyle(name="Th", fontName="Calibri-Bold", fontSize=8, textColor=white, leading=10.5))
    s.add(ParagraphStyle(name="Exit", fontName="Calibri", fontSize=9, textColor=INK, leading=12.2))
    s.add(ParagraphStyle(name="WeekTitle", fontName="Calibri-Bold", fontSize=16, textColor=NAVY, leading=20, spaceAfter=3))
    s.add(ParagraphStyle(name="WeekMeta", fontName="Calibri", fontSize=9.5, textColor=MUTED, leading=13, spaceAfter=6))
    s.add(ParagraphStyle(name="BulletBody", fontName="Calibri", fontSize=9.2, textColor=INK, leading=12.4))
    return s


def P(text, style):
    return Paragraph(text, style)


def banner(text, bg, fg, st):
    inner = ParagraphStyle("banner", parent=st["Cell"], textColor=fg, fontName="Calibri-Bold", fontSize=9, leading=12)
    t = Table([[P(text, inner)]], colWidths=[CONTENT_W])
    t.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), bg),
                ("LEFTPADDING", (0, 0), (-1, -1), 8),
                ("RIGHTPADDING", (0, 0), (-1, -1), 8),
                ("TOPPADDING", (0, 0), (-1, -1), 7),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
            ]
        )
    )
    return t


def info_box(title, body, st, bg=PALE_BLUE):
    title_s = ParagraphStyle("ib_t", fontName="Calibri-Bold", fontSize=9, textColor=NAVY, leading=12, spaceAfter=2)
    data = [[P(title, title_s)], [P(body, st["Exit"])]]
    t = Table(data, colWidths=[CONTENT_W])
    t.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), bg),
                ("LEFTPADDING", (0, 0), (-1, -1), 8),
                ("RIGHTPADDING", (0, 0), (-1, -1), 8),
                ("TOPPADDING", (0, 0), (0, 0), 7),
                ("BOTTOMPADDING", (0, -1), (-1, -1), 7),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ]
        )
    )
    return t


def simple_table(headers, rows, st, col_widths, header_bg=NAVY):
    head = [P(h, st["Th"]) for h in headers]
    body = []
    for row in rows:
        body.append([P(c, st["CellBold"] if i == 0 else st["Cell"]) for i, c in enumerate(row)])
    data = [head] + body
    t = Table(data, colWidths=col_widths, repeatRows=1)
    cmds = [
        ("BACKGROUND", (0, 0), (-1, 0), header_bg),
        ("TEXTCOLOR", (0, 0), (-1, 0), white),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 5),
        ("RIGHTPADDING", (0, 0), (-1, -1), 5),
        ("TOPPADDING", (0, 0), (-1, -1), 4.5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4.5),
        ("GRID", (0, 0), (-1, -1), 0.3, RULE),
        ("ALIGN", (0, 0), (-1, 0), "LEFT"),
    ]
    for i in range(1, len(data)):
        if i % 2 == 0:
            cmds.append(("BACKGROUND", (0, i), (-1, i), ROW_ALT))
    t.setStyle(TableStyle(cmds))
    return t


def day_table(rows, st):
    """rows: date, day, process (html), owners, done-when"""
    headers = ["Date", "Day", "Day process (what the team does)", "Owners", "Done when"]
    widths = [22 * mm, 16 * mm, 86 * mm, 28 * mm, 26 * mm]
    return simple_table(headers, rows, st, widths)


def build():
    st = styles()
    story = []

    story.append(Spacer(1, 28 * mm))
    story.append(P("QUEEN MIRA INTERNATIONAL SCHOOL", st["CoverKicker"]))
    story.append(Spacer(1, 3 * mm))
    story.append(P("QMIS School ERP", st["CoverTitle"]))
    story.append(P("October Delivery Plan", st["CoverTitle"]))
    story.append(P("Week-wise and day-wise process  ·  6 October to 31 October 2026", st["CoverSub"]))
    story.append(Spacer(1, 6 * mm))

    meta = [
        ["Window", "Tue 6 Oct 2026  →  Sat 31 Oct 2026"],
        ["Working days", "19 weekdays  +  planned Saturday buffers"],
        ["Go-live", "Saturday 31 October 2026"],
        ["Feature freeze", "Tuesday 27 October 2026, 12:00 IST"],
        ["Spec", "ERP Documentation – 1. Academics Department v0.1"],
        ["UI reference", "school-erp-demo-beta.vercel.app  (visual only; PDF wins)"],
    ]
    meta_rows = [[P(a, st["CellBold"]), P(b, st["Cell"])] for a, b in meta]
    mt = Table(meta_rows, colWidths=[38 * mm, CONTENT_W - 38 * mm])
    mt.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (0, -1), PALE_BLUE),
                ("BACKGROUND", (1, 0), (1, -1), PALE),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("LEFTPADDING", (0, 0), (-1, -1), 8),
                ("RIGHTPADDING", (0, 0), (-1, -1), 8),
                ("TOPPADDING", (0, 0), (-1, -1), 5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
                ("GRID", (0, 0), (-1, -1), 0.3, RULE),
            ]
        )
    )
    story.append(mt)

    # WEEK 0
    story.append(PageBreak())
    story.append(P("Week 0  —  Intake lock", st["WeekTitle"]))
    story.append(P("Tue 6 Oct  →  Wed 7 Oct  ·  2 days  ·  Nothing else starts until this week exits", st["WeekMeta"]))
    story.append(
        info_box(
            "Week exit",
            "Codebase runs locally and on <b>dev</b>. iClock / eSSL is reachable (API or DB read, not UI scrape). "
            "October vs November scope is signed in writing. Roles and academic year 2026–27 are seeded. "
            "If the repo is not running by 7 Oct EOD, treat the go-live date as red.",
            st,
            PALE_AMBER,
        )
    )
    story.append(Spacer(1, 4 * mm))
    story.append(
        day_table(
            [
                [
                    "6 Oct",
                    "Tue",
                    "<b>Receive and run the codebase.</b><br/>"
                    "1. Clone repo, install, start app and API.<br/>"
                    "2. Map every demo route to a PDF module. Write a gap list (demo-only vs PDF-only).<br/>"
                    "3. Create <b>dev</b> branch, CI lint/test, and a shared environment.<br/>"
                    "4. Confirm who has Admin / Super Admin / MD demo logins.",
                    "Tech Lead<br/>All engineers",
                    "App opens. Gap list exists. CI is green on an empty/smoke build.",
                ],
                [
                    "7 Oct",
                    "Wed",
                    "<b>Lock access and freeze scope.</b><br/>"
                    "1. Confirm iClock / eSSL read path (API or DB). Record endpoint and credentials in a secrets vault, not chat.<br/>"
                    "2. Confirm SMTP. WhatsApp can stay log-only this month.<br/>"
                    "3. Client call: freeze October vs November in writing.<br/>"
                    "4. Seed one campus, AY 2026–27, and the eight Academics roles: MD, DA, Principal, Coordinator, Teacher, Student, PRM, Librarian.<br/>"
                    "5. Chase current-year student/staff Excel + RFID map.",
                    "Tech Lead<br/>BE-1<br/>Client BA",
                    "iClock reachable or fallback agreed. Scope mail sent. Roles seeded.",
                ],
            ],
            st,
        )
    )
    story.append(Spacer(1, 3 * mm))
    story.append(banner("Do not start feature tickets on 6–7 Oct if the repo does not run. Intake is the whole job.", PALE_AMBER, AMBER, st))

    # WEEK 1
    story.append(PageBreak())
    story.append(P("Week 1  —  Foundation and shared engines", st["WeekTitle"]))
    story.append(P("Thu 8 Oct  →  Wed 14 Oct  ·  Showcase Friday 9 Oct is optional; formal showcase Wed 14 Oct 16:00", st["WeekMeta"]))
    story.append(
        info_box(
            "Week exit",
            "A Teacher can log in, open UIS, and save a student record that cannot be edited. "
            "A dummy 4-tier approval completes. iClock punches appear as Present / default Absent. "
            "A test complaint escalates when the clock TTL expires (use a 2-minute test TTL).",
            st,
            PALE_GREEN,
        )
    )
    story.append(Spacer(1, 4 * mm))
    story.append(
        day_table(
            [
                [
                    "8 Oct",
                    "Thu",
                    "<b>Identity and RBAC.</b><br/>"
                    "BE: login, session/JWT, dynamic RBAC tables, multi-role profile switch.<br/>"
                    "FE: login screen, role shell, select-profile aligned to PDF roles (not demo extras).<br/>"
                    "QA: auth pack — valid login, wrong password, forced password change hook, role switch.",
                    "BE-1<br/>FE-1<br/>QA",
                    "Each of the 8 roles can sign in and land on an empty shell.",
                ],
                [
                    "9 Oct",
                    "Fri",
                    "<b>UIS lifetime record.</b><br/>"
                    "BE: student + staff schema (basic, parents, siblings, documents, academic/attendance/fee/transport/complaint history). First-entry write only.<br/>"
                    "FE: Class Teacher create-student and HR create-staff. Preview → confirm. After save, fields are read-only.<br/>"
                    "QA: try to PATCH a saved record — API must reject.",
                    "BE-1<br/>FE-2<br/>QA",
                    "One student and one staff saved. Edit and delete both fail.",
                ],
                [
                    "10 Oct",
                    "Sat",
                    "<b>Approval engine (buffer day).</b><br/>"
                    "BE: generic approval table (process, entity, level, actor, comment, status). Notification rows.<br/>"
                    "FE: approval inbox for Coordinator, Principal, DA.<br/>"
                    "Run one dummy 4-level chain end to end.",
                    "Tech Lead<br/>BE-2<br/>FE-1",
                    "Dummy item moves Teacher → Coordinator → Principal → DA.",
                ],
                [
                    "11 Oct",
                    "Sun",
                    "<b>No feature work.</b> On-call only if the environment is down.",
                    "On-call",
                    "dev still green Monday morning.",
                ],
                [
                    "12 Oct",
                    "Mon",
                    "<b>Audit log and global settings.</b><br/>"
                    "BE: log login, write, export, print. Settings: attendance cutoffs per group/department, exam weightage, concession types, complaint TTL.<br/>"
                    "FE: Admin / DA settings screens. MD audit viewer.<br/>"
                    "QA: MD can see a login and a UIS write.",
                    "BE-1<br/>FE-1<br/>QA",
                    "MD opens audit and sees today’s writes. Settings persist.",
                ],
                [
                    "13 Oct",
                    "Tue",
                    "<b>iClock / eSSL attendance sync.</b><br/>"
                    "BE: pull job for students and staff. No punch = Absent. Exception mark Present / Absent / Leave / OD before cutoff.<br/>"
                    "FE: attendance list for Class Teacher / Coordinator.<br/>"
                    "QA: reconcile 20 device records to ERP.",
                    "BE-3<br/>FE-1<br/>QA",
                    "20 punches match. A no-punch student is Absent.",
                ],
                [
                    "14 Oct",
                    "Wed",
                    "<b>Notifications + 24-hour complaint clock.</b><br/>"
                    "BE: notify on approval / publish / announcement / deadline / complaint / ticket. Complaint auto-escalate after TTL; “Not Satisfied” also escalates.<br/>"
                    "FE: notification centre + raise complaint.<br/>"
                    "QA: set TTL to 2 minutes and prove escalate.<br/>"
                    "<b>16:00 Week 1 showcase</b> to SMEs: login, UIS freeze, punch, dummy approval.",
                    "BE-1<br/>BE-3<br/>FE-2<br/>QA",
                    "Test complaint escalates. Showcase notes written.",
                ],
            ],
            st,
        )
    )

    # WEEK 2
    story.append(PageBreak())
    story.append(P("Week 2  —  Academics core", st["WeekTitle"]))
    story.append(P("Thu 15 Oct  →  Wed 21 Oct  ·  Showcase Wed 21 Oct 16:00", st["WeekMeta"]))
    story.append(
        info_box(
            "Week exit",
            "Principal publishes a timetable and an academic calendar after DA approval. "
            "A teacher submits a monthly lesson plan through four tiers. "
            "Marks are bulk-uploaded, approved on the same chain, published, and visible to the student. "
            "Weightage is a DA setting and locks when the exam cycle starts.",
            st,
            PALE_GREEN,
        )
    )
    story.append(Spacer(1, 4 * mm))
    story.append(
        day_table(
            [
                [
                    "15 Oct",
                    "Thu",
                    "<b>Masters + academic calendar.</b><br/>"
                    "BE/FE: class, section, subject, house, exam types, evaluation categories, extra-activity list.<br/>"
                    "Principal creates the academic calendar and events. DA approves. Publish + notify selected audience.<br/>"
                    "Lost-and-found announcement can wait until Week 3 if time is short.",
                    "BE-2<br/>FE-1",
                    "DA-approved calendar is visible to Teacher and Student.",
                ],
                [
                    "16 Oct",
                    "Fri",
                    "<b>Timetable.</b><br/>"
                    "Principal creates class timetable, teacher timetable and exam timetable.<br/>"
                    "Clash rules: same teacher two rooms; same class two subjects at once.<br/>"
                    "DA approves → notify. Coordinator sees own + supervised classes. Teacher sees own + class. Student sees class.<br/>"
                    "Friday 16:00 informal walkthrough of calendar + timetable draft.",
                    "BE-2<br/>FE-1<br/>QA",
                    "Published class timetable appears for a student in that class.",
                ],
                [
                    "17 Oct",
                    "Sat",
                    "<b>Emergency cover overlay (buffer).</b><br/>"
                    "Principal or DA reassigns periods for a dated sudden leave. Original published timetable stays. Store a dated overlay (immutability).",
                    "BE-2<br/>FE-1",
                    "Overlay date shows new teacher; original row is unchanged.",
                ],
                [
                    "18 Oct",
                    "Sun",
                    "<b>No feature work.</b>",
                    "On-call",
                    "dev green.",
                ],
                [
                    "19 Oct",
                    "Mon",
                    "<b>Lesson plan — 4 tier.</b><br/>"
                    "Teacher creates next-month plan. Last submit date: <b>25th</b> (configurable). Auto-reminder T-7.<br/>"
                    "Chain: Teacher → Coordinator → Principal → DA (final).<br/>"
                    "Teacher sees status at each level. Deny creates a <b>new</b> submission; old row stays.",
                    "BE-2<br/>FE-1<br/>QA",
                    "One plan reaches DA Approved. One denied plan is a new row.",
                ],
                [
                    "20 Oct",
                    "Tue",
                    "<b>Question bank, study material, marks entry.</b><br/>"
                    "Teachers upload question banks / key notes / study material by class and subject.<br/>"
                    "Marks entry: single and bulk upload. Preview totals before confirm. Types are configurable (Midterm, CA, RCT, custom).",
                    "BE-2<br/>FE-2<br/>QA",
                    "Bulk file loads. Preview totals match. Confirm freezes the row.",
                ],
                [
                    "21 Oct",
                    "Wed",
                    "<b>Marks approval and publish.</b><br/>"
                    "Same chain as lesson plan: Coordinator → Principal → DA, then published to student.<br/>"
                    "DA sets weightage per class and exam type. Lock when that cycle starts. Auto ranks.<br/>"
                    "<b>16:00 Week 2 showcase:</b> publish timetable, 4-tier lesson plan, bulk marks → student result.",
                    "BE-2<br/>FE-1<br/>QA<br/>SMEs",
                    "Student sees published marks. SME notes written.",
                ],
            ],
            st,
        )
    )

    # WEEK 3
    story.append(PageBreak())
    story.append(P("Week 3  —  Student life and cross-department contracts", st["WeekTitle"]))
    story.append(P("Thu 22 Oct  →  Mon 26 Oct  ·  Showcase Mon 26 Oct 16:00  ·  Saturday and Sunday are planned work days this week", st["WeekMeta"]))
    story.append(
        info_box(
            "Week exit",
            "A living student file exists: attendance exceptions, leave, HomeFun, complaint, store ticket, "
            "1:1 message (MD can open it), gate pass, TC with Library + Finance NOCs, library issue (1 book), "
            "PRM admission auto-creates a user, star rating can compute SOM.",
            st,
            PALE_GREEN,
        )
    )
    story.append(Spacer(1, 4 * mm))
    story.append(
        day_table(
            [
                [
                    "22 Oct",
                    "Thu",
                    "<b>Leave, permission, substitution.</b><br/>"
                    "Staff leave → HOD + HR. On approve, attendance = Leave.<br/>"
                    "Permission request: maximum 2 hours, HOD (+ HR for staff), attendance = Permission.<br/>"
                    "Emergency: Principal/DA uses the Week 2 overlay to cover periods.",
                    "BE-3<br/>FE-1<br/>QA",
                    "Approved leave flips attendance. 2-hour permission is a distinct status.",
                ],
                [
                    "23 Oct",
                    "Fri",
                    "<b>HomeFun, extra-curricular, section change.</b><br/>"
                    "Teacher assigns HomeFun → student uploads → teacher marks. Visible up the teacher chain.<br/>"
                    "PRM enrols students in activities (list and coaches managed by PRM). Fee flag to Finance.<br/>"
                    "Class / section change: Class Teacher or PRM initiates; all higher authorities approve.",
                    "BE-2<br/>FE-2<br/>QA",
                    "One HomeFun submitted and marked. One section change pending DA.",
                ],
                [
                    "24 Oct",
                    "Sat",
                    "<b>Complaints + tickets + store request.</b><br/>"
                    "Complaint: 24-hour reply/resolve or auto next rank; Not Satisfied also escalates. Example: parent (via student profile) → Coordinator → Principal → DA → MD.<br/>"
                    "Ticket: pick department (Store / IT / Housekeeping) and person.<br/>"
                    "Store: view stock → request → DA/Principal → Store issues → collect. No stock → new product request. Show Finance budget remaining if available (read-only is fine).",
                    "BE-3<br/>FE-2<br/>QA",
                    "One ticket closed. One complaint escalates on test TTL.",
                ],
                [
                    "25 Oct",
                    "Sun",
                    "<b>Messaging and MD inspection.</b><br/>"
                    "One-to-one text only. Higher ranks can open conversations of people under them. MD can open all threads. This is the message-inspection cockpit.",
                    "BE-1<br/>FE-1<br/>QA",
                    "MD opens a Teacher–Student thread. Student cannot open MD–DA chat.",
                ],
                [
                    "26 Oct",
                    "Mon",
                    "<b>Gate pass, TC, library, PRM, stars, tasks.</b><br/>"
                    "Gate pass: PRM selects approvers at request time (not a fixed chain). Product-in / product-out. Pass goes to Security.<br/>"
                    "TC: Student raises → academic NOCs → Library, Transport (if bus), Finance dues → MD final → TC PDF.<br/>"
                    "Library: catalogue, issue/return, 1 book/student, 5/staff, configurable duration/fines, missing-books, purchase dropdown, library NOC.<br/>"
                    "PRM: enquiry → visit → form → admission. On payment, auto-create user, mail temp password, force change on first login.<br/>"
                    "Star rating: DA configures student vs staff categories. SOM = highest aggregate. Task assign/receive across departments.<br/>"
                    "<b>16:00 Week 3 showcase.</b>",
                    "BE-3<br/>FE-2<br/>QA<br/>SMEs",
                    "TC PDF after NOCs. New admission user must change password. Showcase notes written.",
                ],
            ],
            st,
        )
    )

    # WEEK 4
    story.append(PageBreak())
    story.append(P("Week 4  —  Harden, UAT and go-live", st["WeekTitle"]))
    story.append(P("Tue 27 Oct  →  Sat 31 Oct  ·  Feature freeze Tue 27 Oct 12:00  ·  Production Sat 31 Oct", st["WeekMeta"]))
    story.append(
        info_box(
            "Week exit",
            "Production is live and the MD has passed all seven checks on the last page. "
            "No new modules. Severity 1 and 2 bugs only after freeze.",
            st,
            PALE_AMBER,
        )
    )
    story.append(Spacer(1, 4 * mm))
    story.append(
        day_table(
            [
                [
                    "27 Oct",
                    "Tue",
                    "<b>Feature freeze at 12:00 IST.</b><br/>"
                    "Morning: finish only in-flight PRs already in review. After 12:00, bug fixes only.<br/>"
                    "Bug bash. Add filters + PDF/Excel on any list still missing them.<br/>"
                    "Wire role dashboards (click a chart → source list): Student, Teacher, Coordinator, Principal/DA, MD.<br/>"
                    "Cut <b>main</b> as release candidate from today’s <b>dev</b>.",
                    "All engineers<br/>QA",
                    "main tagged RC. No open feature PRs.",
                ],
                [
                    "28 Oct",
                    "Wed",
                    "<b>UAT day 1.</b><br/>"
                    "School SMEs run the workflow scripts: lesson plan, timetable, marks, attendance, complaint, TC, PRM admission, library issue.<br/>"
                    "Log severity. Fix Sev 1 (blocker) and Sev 2 (wrong rule) only.",
                    "QA<br/>SMEs<br/>Owners of failing tickets",
                    "UAT pack executed once. Sev 1 list is empty or has owners + ETA.",
                ],
                [
                    "29 Oct",
                    "Thu",
                    "<b>UAT day 2 + performance.</b><br/>"
                    "Retest failed scripts. Attendance sync under 5 minutes. Class lists under 2 seconds for about 1,200 students.<br/>"
                    "Fix only regressions from yesterday.",
                    "BE-1<br/>BE-3<br/>QA",
                    "Failed scripts from Day 1 pass. Perf numbers recorded.",
                ],
                [
                    "30 Oct",
                    "Fri",
                    "<b>Data load and training.</b><br/>"
                    "Load current academic year: students, staff, classes, sections, RFID map.<br/>"
                    "Train: 1 DA, 1 Principal, 2 Coordinators, 4 Teachers, 1 PRM, 1 Librarian.<br/>"
                    "Walk MD through the seven exit checks on staging.",
                    "Tech Lead<br/>FE-2<br/>QA<br/>SMEs",
                    "Staging has real-year data. Training attendance signed.",
                ],
                [
                    "31 Oct",
                    "Sat",
                    "<b>Go-live.</b><br/>"
                    "1. Production deploy from the RC tag.<br/>"
                    "2. Switch iClock sync to live.<br/>"
                    "3. MD runs the seven production checks (next page).<br/>"
                    "4. War-room until 18:00 IST. Sev 1 hotfix only.<br/>"
                    "5. Written MD / Admin sign-off.",
                    "Tech Lead<br/>All on-call<br/>MD",
                    "All seven MD checks pass on production.",
                ],
            ],
            st,
        )
    )

    # EXIT + DEPENDENCIES
    story.append(PageBreak())
    story.append(P("31 October — MD production checks", st["H1"]))
    story.append(
        P(
            "If any row fails on production, the month is not complete. Everything else is backlog.",
            st["Body"],
        )
    )
    story.append(
        simple_table(
            ["#", "MD must do this on production", "Pass"],
            [
                ["1", "Switch to the MD profile and open the school-wide academic dashboard.", ""],
                ["2", "Open any student’s UIS and see attendance, fee flag, transport, complaints and library borrows.", ""],
                ["3", "Approve a TC that already has Library and Finance NOCs. TC PDF generates.", ""],
                ["4", "Open any Teacher–Student message thread (message inspection).", ""],
                ["5", "See today’s iClock punches and yesterday’s finalised absentees.", ""],
                ["6", "Export a class marks sheet to Excel.", ""],
                ["7", "Confirm a saved lesson plan and a saved marks row cannot be edited or deleted.", ""],
            ],
            st,
            [12 * mm, CONTENT_W - 32 * mm, 20 * mm],
        )
    )

    story.append(P("Client items to chase on Day 1 (6 Oct)", st["H2"]))
    story.append(
        simple_table(
            ["#", "Dependency", "Needed by", "Owner"],
            [
                ["1", "Source codebase and repo access", "6 Oct EOD", "Client + Tech Lead"],
                ["2", "iClock / eSSL API or DB read (not the web UI)", "7 Oct EOD", "Client IT + BE-3"],
                ["3", "Current-year student / staff Excel + RFID mapping", "12 Oct", "PRM / School admin"],
                ["4", "SMTP credentials (WhatsApp optional / log-only)", "8 Oct", "Client IT"],
                ["5", "Written October vs November scope sign-off", "7 Oct", "Client BA + Tech Lead"],
                ["6", "Named UAT users: DA, Principal, 2 Coordinators, 4 Teachers, PRM, Librarian, MD", "21 Oct", "School"],
                ["7", "Confirm single QMIS campus this month (do not invent multi-campus)", "7 Oct", "Client BA"],
            ],
            st,
            [12 * mm, 88 * mm, 28 * mm, 50 * mm],
        )
    )

    story.append(P("Approval chains (one engine — do not rebuild per module)", st["H2"]))
    story.append(
        simple_table(
            ["Process", "Starts with", "Then", "Output"],
            [
                ["Timetable / exam timetable", "Principal", "DA", "Published + notified"],
                ["Academic calendar", "Principal office", "DA", "Published"],
                ["Lesson plan", "Teacher", "Coordinator → Principal → DA", "Approved plan"],
                ["Marks", "Teacher", "Coordinator → Principal → DA", "Published results"],
                ["Leave", "Staff", "HOD + HR", "Attendance = Leave"],
                ["Permission (max 2 hours)", "Staff / student", "HOD (+ HR for staff)", "Attendance = Permission"],
                ["Gate pass", "PRM / student", "Approvers chosen by PRM at request time", "Pass to Security"],
                ["TC", "Student", "All ranks + Library / Transport / Finance NOCs → MD", "TC PDF"],
                ["Class / section change", "Class Teacher / PRM", "All higher authorities", "Section updated"],
                ["Store request", "Any user", "DA / Principal → Store", "Issued"],
                ["Complaint", "Any user", "Receiver has 24 hours, then next rank automatically", "Resolved or escalated"],
            ],
            st,
            [42 * mm, 38 * mm, 68 * mm, 30 * mm],
        )
    )

    story.append(P("Build order inside the month", st["H2"]))
    story.append(
        P(
            "Do not start a later row until the earlier row is mergeable on <b>dev</b>.",
            st["Small"],
        )
    )
    story.append(
        simple_table(
            ["Order", "Module", "Week"],
            [
                ["0", "Auth, RBAC, settings, audit", "Week 1"],
                ["2", "UIS lifetime record", "Week 1"],
                ["8 / 23", "iClock attendance + notifications / complaint clock", "Week 1"],
                ["4 then 3", "Academic calendar, then timetable", "Week 2"],
                ["5 / 17", "Lesson plan + study material", "Week 2"],
                ["6 / 18", "Exams, marks, analytics", "Week 2"],
                ["9", "Leave and substitution", "Week 3"],
                ["7 / 19 / 20", "HomeFun, extra-curricular, section change", "Week 3"],
                ["13 / 14", "Complaints + tickets / store", "Week 3"],
                ["12", "Messaging + MD inspect", "Week 3"],
                ["15 / 16 / 21 / 22 / 10 / 11", "Gate pass, TC, library, PRM, stars, tasks", "Week 3"],
                ["1", "Dashboards (charts last)", "Week 4"],
            ],
            st,
            [38 * mm, 110 * mm, 30 * mm],
        )
    )

    story.append(Spacer(1, 5 * mm))
    story.append(P("Overall project — end-to-end completeness by 31 Oct", st["H2"]))
    story.append(
        P(
            "Verdict: <b>the overall ERP does not complete end-to-end this month.</b> "
            "This calendar finishes Academics plus shared engines. Other departments are only thin contracts (NOC, ticket, fee flag), not full engines.",
            st["BodyLeft"],
        )
    )
    story.append(
        simple_table(
            ["Area", "Covered in this calendar?", "E2E live on 31 Oct?"],
            [
                ["Foundation — auth, RBAC, UIS, approvals, audit", "Yes — Week 1", "Yes, if Week 1 exits"],
                ["Academics — 24 modules in the department PDF", "Yes — Weeks 2–3", "Yes, if Weeks 2–3 exit"],
                ["HR — recruitment, onboarding, payroll PF/ESI, BSC", "Leave + staff UIS only", "No"],
                ["Finance — ledgers, vouchers, POS, WhatsApp billing", "Fee flag + TC dues NOC only", "No"],
                ["Operations — canteen, GPS, Camera Room, File Room", "Store ticket + gate pass only", "No"],
                ["Transport fleet + driver trip app (full)", "Bus fields + TC NOC only", "No"],
                ["Audit — scheduler, CAPA, ATR, checklists", "Not in the day plan", "No"],
                ["MD cockpit — 08:00 digest, approvals centre", "Dashboards + message inspect only", "No"],
                ["Gamification polish, referral bonus, legacy migration", "SOM calculation only", "No"],
            ],
            st,
            [58 * mm, 58 * mm, CONTENT_W - 116 * mm],
        )
    )

    out = r"c:\karan\ERP dev\QMIS_ERP_October_Weekwise_Delivery_Plan.pdf"
    doc = SimpleDocTemplate(
        out,
        pagesize=A4,
        leftMargin=LEFT,
        rightMargin=RIGHT,
        topMargin=TOP,
        bottomMargin=BOTTOM,
        title="QMIS ERP — October Week-wise and Day-wise Delivery Plan",
        author="QMIS ERP Delivery Team",
        subject="6 Oct 2026 to 31 Oct 2026 operating calendar",
    )
    doc.build(story, onFirstPage=header_footer, onLaterPages=header_footer)
    return out


if __name__ == "__main__":
    path = build()
    print(path)
