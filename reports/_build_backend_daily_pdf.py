"""Build Backend Lead daily work report PDF for management. Not part of the app."""
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import (
    HRFlowable,
    ListFlowable,
    ListItem,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
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
AMBER = colors.HexColor("#9A6700")


def styles():
    base = getSampleStyleSheet()
    return {
        "kicker": ParagraphStyle(
            "kicker", parent=base["Normal"], fontName="Helvetica", fontSize=8,
            textColor=BLUE, spaceAfter=2,
        ),
        "title": ParagraphStyle(
            "title", parent=base["Normal"], fontName="Helvetica-Bold", fontSize=18,
            textColor=NAVY, leading=22, spaceAfter=2,
        ),
        "sub": ParagraphStyle(
            "sub", parent=base["Normal"], fontName="Helvetica", fontSize=9,
            textColor=MUTED, leading=13, spaceAfter=8,
        ),
        "h": ParagraphStyle(
            "h", parent=base["Normal"], fontName="Helvetica-Bold", fontSize=12,
            textColor=NAVY, spaceBefore=10, spaceAfter=4,
        ),
        "body": ParagraphStyle(
            "body", parent=base["Normal"], fontName="Helvetica", fontSize=9.5,
            textColor=INK, leading=13.5, spaceAfter=3,
        ),
        "small": ParagraphStyle(
            "small", parent=base["Normal"], fontName="Helvetica", fontSize=8,
            textColor=MUTED, leading=11,
        ),
        "cell": ParagraphStyle(
            "cell", parent=base["Normal"], fontName="Helvetica", fontSize=8,
            textColor=INK, leading=10.5,
        ),
        "cell_h": ParagraphStyle(
            "cell_h", parent=base["Normal"], fontName="Helvetica-Bold", fontSize=8,
            textColor=NAVY, leading=10.5,
        ),
        "pass": ParagraphStyle(
            "pass", parent=base["Normal"], fontName="Helvetica-Bold", fontSize=8,
            textColor=GREEN, leading=10.5,
        ),
        "open": ParagraphStyle(
            "open", parent=base["Normal"], fontName="Helvetica-Bold", fontSize=8,
            textColor=AMBER, leading=10.5,
        ),
    }


def header_footer(canvas, doc):
    canvas.saveState()
    canvas.setFillColor(NAVY)
    canvas.rect(0, A4[1] - 12 * mm, A4[0], 12 * mm, fill=1, stroke=0)
    canvas.setFillColor(colors.white)
    canvas.setFont("Helvetica-Bold", 8)
    canvas.drawString(16 * mm, A4[1] - 7.5 * mm, "QMIS ERP")
    canvas.setFont("Helvetica", 8)
    canvas.drawRightString(A4[0] - 16 * mm, A4[1] - 7.5 * mm, "Backend lead · Daily work report")
    canvas.setFillColor(MUTED)
    canvas.setFont("Helvetica", 8)
    canvas.drawString(
        16 * mm, 8 * mm,
        "Queen Mira International School  ·  Backend / Admissions  ·  9 October 2026",
    )
    canvas.drawRightString(A4[0] - 16 * mm, 8 * mm, f"Page {doc.page}")
    canvas.setStrokeColor(LINE)
    canvas.line(16 * mm, 12 * mm, A4[0] - 16 * mm, 12 * mm)
    canvas.restoreState()


def bullets(items, s):
    flow = []
    for item in items:
        flow.append(ListItem(Paragraph(item, s["body"]), leftIndent=8, bulletColor=BLUE, value="l"))
    return ListFlowable(
        flow, bulletType="bullet", start="l", leftIndent=14,
        bulletFontName="ZapfDingbats", bulletFontSize=6, spaceBefore=1, spaceAfter=2,
    )


def status_table(rows, s, col_widths):
    data = [[Paragraph(c, s["cell_h"] if i == 0 else s["cell"]) for c in row] for i, row in enumerate(rows)]
    for r in range(1, len(data)):
        label = rows[r][-1]
        data[r][-1] = Paragraph(label, s["pass"] if "Done" in label or "Complete" in label else s["open"])
    t = Table(data, colWidths=col_widths)
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), HEAD_BG),
        ("GRID", (0, 0), (-1, -1), 0.35, LINE),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
    ]))
    return t


def build(path: Path):
    s = styles()
    doc = SimpleDocTemplate(
        str(path),
        pagesize=A4,
        leftMargin=16 * mm,
        rightMargin=16 * mm,
        topMargin=18 * mm,
        bottomMargin=16 * mm,
        title="Backend Lead Daily Work Report — 9 October 2026",
        author="QMIS ERP Backend Lead",
    )

    story = [
        Paragraph("DAILY WORK REPORT", s["kicker"]),
        Paragraph("9 October 2026", s["title"]),
        Paragraph(
            "Queen Mira International School ERP  ·  Backend Lead (Admissions / Foundation / Integration)  ·  Manager update",
            s["sub"],
        ),
        HRFlowable(width="100%", thickness=1, color=LINE, spaceAfter=8),
    ]

    badge = Table(
        [[Paragraph(
            "<b>Summary.</b> Today I completed the admissions identity journey end-to-end "
            "(enquiry → admission → enroll → parent login), wired the frontend screens to the API, "
            "added profile image upload, and published the work to GitHub alongside the partner HR update.",
            s["body"],
        )]],
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

    story.append(Paragraph("My ownership today", s["h"]))
    story.append(Paragraph(
        "Role: <b>Backend Lead</b>. Scope today: Phase 0 completion items for admissions foundation, "
        "Phase 1 admissions APIs, and frontend integration for login + front-office admissions. "
        "HR backend remains with the partner.",
        s["body"],
    ))

    story.append(Paragraph("Completed today", s["h"]))
    story.append(bullets([
        "<b>Phase 1 admissions APIs</b> — enquiry create/list/update, convert to admission, admission save/update, enroll student, parent account create + parent↔child link, all campus-scoped in PostgreSQL.",
        "<b>Profile image storage</b> — upload via files API; enquiry/admission store profile_image_file_id; images display on list/view after save.",
        "<b>Frontend integration</b> — Sign-in uses real API login; Admission Enquiry and Admission List screens call the API (with demo fallback). Admin Add / View / Convert / Enroll paths verified.",
        "<b>Enroll password fix</b> — Enroll now prompts for the parent password so the password entered is the one stored (no silent default).",
        "<b>UI fixes</b> — restored Admin Add Admission Enquiry; fixed View screen so API data renders (async load); enrolled admissions correctly lock edits.",
        "<b>Documentation</b> — frontend integration guide and API backlog updates for Phase 0/1 status.",
        "<b>GitHub delivery</b> — partner HR pull integrated; combined update pushed to main; full Phase 1 admissions backend preserved on feature/phase1-admissions for port onto partner Phase 0 rewrite.",
    ], s))

    story.append(Paragraph("Delivery checklist", s["h"]))
    story.append(status_table([
        ["Item", "Evidence / notes", "Status"],
        ["Enquiry CRUD API", "POST/GET/PATCH /admissions/enquiries", "Done"],
        ["Convert enquiry → admission", "Atomic convert; enquiry marked Success", "Done"],
        ["Admission save + enroll", "Student + parent user + link created", "Done"],
        ["Parent login after enroll", "Verified with API login", "Done"],
        ["Profile image upload", "POST /files + file id on enquiry/admission", "Done"],
        ["FE auth wired to API", "Sign-in + demo API accounts", "Done"],
        ["FE admissions screens wired", "Enquiry list/add/view/convert; list enroll", "Done"],
        ["Published to GitHub", "main + feature/phase1-admissions", "Done"],
        ["Port rich admissions onto partner UUID Phase 0", "Needed before re-enabling admissions API flag on main", "Open"],
    ], s, [52 * mm, 88 * mm, 38 * mm]))

    story.append(Paragraph("Integration path verified (UI)", s["h"]))
    story.append(bullets([
        "Login as Admin / Front Office using API credentials.",
        "Create Admission Enquiry → Save (Postgres).",
        "Convert to Admission (or Add Admission manually) → complete parent email.",
        "Admission List → Enroll → enter parent password.",
        "Logout → Parent login with that email/password.",
    ], s))

    story.append(Paragraph("Still open (not claimed as done today)", s["h"]))
    note = Table(
        [[Paragraph(
            "Partner merged a Phase 0 rewrite (UUID users/auth) that is incompatible with the earlier "
            "integer-based Phase 1 admissions backend. main keeps partner HR + shared auth FE. "
            "Rich admissions APIs remain on branch feature/phase1-admissions "
            "until ported. Admissions UI on main currently uses localStorage unless "
            "VITE_USE_API_ADMISSIONS=true after the port.",
            s["body"],
        )]],
        colWidths=[178 * mm],
    )
    note.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), AMBER_BG),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("TOPPADDING", (0, 0), (-1, -1), 7),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
        ("BOX", (0, 0), (-1, -1), 0.4, colors.HexColor("#F0D9A8")),
    ]))
    story.append(note)
    story.append(Spacer(1, 2 * mm))
    story.append(bullets([
        "Port Phase 1 admissions models/APIs onto partner UUID Phase 0 stack.",
        "Re-enable admissions API flag on main and re-test full UI path.",
        "Later phases (fees, academics, attendance) — not started.",
    ], s))

    story.append(Paragraph("Repository", s["h"]))
    story.append(Paragraph(
        "GitHub: https://github.com/karan4533/ERP-dev<br/>"
        "Branch with today's combined delivery: main<br/>"
        "Branch with full Phase 1 admissions backend: feature/phase1-admissions",
        s["body"],
    ))

    story.append(Paragraph("Prepared for", s["h"]))
    story.append(Paragraph(
        "Management / project lead — Backend Lead daily completion for 9 October 2026. "
        "HR vertical completion is covered in the partner's separate HR daily report.",
        s["small"],
    ))

    doc.build(story, onFirstPage=header_footer, onLaterPages=header_footer)
    return path


if __name__ == "__main__":
    out = Path(__file__).resolve().parent / "Backend-Lead-Daily-Work-Report-2026-10-09.pdf"
    build(out)
    print(f"Wrote {out}")
