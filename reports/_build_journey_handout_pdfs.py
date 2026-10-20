#!/usr/bin/env python3
"""Build tester + teammate journey handout PDFs (20 Oct 2026)."""

from __future__ import annotations

from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import (
    KeepTogether,
    ListFlowable,
    ListItem,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

ROOT = Path(__file__).resolve().parent
DOCS = ROOT.parent / "erp complete documentation"

JOBS = [
    {
        "md": ROOT / "QMIS-ERP-Tester-Journey-Flow-20oct.md",
        "pdf": ROOT / "QMIS-ERP-Tester-Journey-Flow-20oct.pdf",
        "title": "QMIS ERP Tester Journey Flow Guide — 20 Oct 2026",
    },
    {
        "md": ROOT / "QMIS-ERP-Teammate-Leftover-Ops-Prompt-20oct.md",
        "pdf": ROOT / "QMIS-ERP-Teammate-Leftover-Ops-Prompt-20oct.pdf",
        "title": "QMIS ERP Teammate Leftover Ops Prompt — 20 Oct 2026",
    },
]

PAGE_W, PAGE_H = A4
LEFT_M = 14 * mm
RIGHT_M = 14 * mm
TOP_M = 12 * mm
BOTTOM_M = 12 * mm
USABLE_W = PAGE_W - LEFT_M - RIGHT_M


def _styles():
    base = getSampleStyleSheet()
    return {
        "title": ParagraphStyle(
            "TitleCustom",
            parent=base["Title"],
            fontSize=14,
            spaceAfter=8,
            textColor=colors.HexColor("#101828"),
        ),
        "h1": ParagraphStyle(
            "H1Custom",
            parent=base["Heading1"],
            fontSize=11.5,
            spaceBefore=12,
            spaceAfter=5,
            textColor=colors.HexColor("#101828"),
        ),
        "h2": ParagraphStyle(
            "H2Custom",
            parent=base["Heading2"],
            fontSize=10,
            spaceBefore=9,
            spaceAfter=3,
            textColor=colors.HexColor("#344054"),
        ),
        "h3": ParagraphStyle(
            "H3Custom",
            parent=base["Heading3"],
            fontSize=9.5,
            spaceBefore=7,
            spaceAfter=2,
            textColor=colors.HexColor("#475467"),
        ),
        "body": ParagraphStyle(
            "BodyCustom",
            parent=base["BodyText"],
            fontSize=9,
            leading=12,
            alignment=TA_LEFT,
            spaceAfter=4,
            wordWrap="CJK",
        ),
        "cell": ParagraphStyle(
            "CellCustom",
            parent=base["BodyText"],
            fontSize=7.5,
            leading=9.5,
            alignment=TA_LEFT,
            spaceAfter=0,
            wordWrap="CJK",
        ),
        "cellHead": ParagraphStyle(
            "CellHeadCustom",
            parent=base["BodyText"],
            fontSize=7.5,
            leading=9.5,
            alignment=TA_LEFT,
            spaceAfter=0,
            textColor=colors.HexColor("#101828"),
            fontName="Helvetica-Bold",
            wordWrap="CJK",
        ),
        "cardTitle": ParagraphStyle(
            "CardTitleCustom",
            parent=base["BodyText"],
            fontSize=8.5,
            leading=11,
            spaceAfter=2,
            textColor=colors.HexColor("#101828"),
            fontName="Helvetica-Bold",
            wordWrap="CJK",
        ),
        "cardBody": ParagraphStyle(
            "CardBodyCustom",
            parent=base["BodyText"],
            fontSize=8,
            leading=10.5,
            spaceAfter=1,
            wordWrap="CJK",
        ),
        "code": ParagraphStyle(
            "CodeCustom",
            parent=base["Code"],
            fontSize=7,
            leading=9,
            backColor=colors.HexColor("#F2F4F7"),
            spaceBefore=2,
            spaceAfter=6,
            wordWrap="CJK",
            fontName="Courier",
        ),
        "li": ParagraphStyle(
            "LiCustom",
            parent=base["BodyText"],
            fontSize=9,
            leading=11,
            leftIndent=4,
            wordWrap="CJK",
        ),
    }


def _escape(text: str) -> str:
    return text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def _soft_break_long(text: str) -> str:
    import re

    def break_token(m: re.Match) -> str:
        tok = m.group(0)
        if len(tok) < 28:
            return tok
        out, buf = [], []
        for ch in tok:
            buf.append(ch)
            if ch in "/_-." and len(buf) >= 8:
                out.append("".join(buf) + "&#8203;")
                buf = []
        out.append("".join(buf))
        return "".join(out)

    return re.sub(r"[^\s]{28,}", break_token, text)


def _inline_md(text: str) -> str:
    import re

    s = _escape(text)
    s = _soft_break_long(s)
    s = re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>", s)
    s = re.sub(r"`(.+?)`", r"<font face='Courier' size='7'>\1</font>", s)
    return s


def _labeled(label: str, value: str) -> str:
    return f"<b>{_escape(label)}:</b> {_inline_md(value)}"


def _col_widths(ncols: int) -> list[float]:
    if ncols <= 0:
        return []
    if ncols == 1:
        return [USABLE_W]
    if ncols == 2:
        weights = [0.28, 0.72]
    elif ncols == 3:
        weights = [0.18, 0.32, 0.50]
    elif ncols == 4:
        weights = [0.10, 0.18, 0.32, 0.40]
    elif ncols == 5:
        weights = [0.08, 0.14, 0.22, 0.28, 0.28]
    elif ncols == 6:
        weights = [0.07, 0.12, 0.18, 0.25, 0.20, 0.18]
    else:
        weights = [1.0 / ncols] * ncols
    total = sum(weights)
    return [USABLE_W * (w / total) for w in weights]


def _render_step_cards(headers: list[str], rows: list[list[str]], styles: dict) -> list:
    flow = []
    keys = [h.strip() for h in headers]
    for row in rows:
        cells = list(row) + [""] * max(0, len(keys) - len(row))
        cells = cells[: len(keys)]
        data = {keys[i]: cells[i] for i in range(len(keys))}
        step = data.get("ID") or data.get("#") or ""
        who = data.get("Who") or data.get("Actor") or ""
        screen = data.get("Screen") or data.get("Where") or ""
        action = data.get("Action") or data.get("Steps") or data.get("Do") or ""
        expected = (
            data.get("Expected")
            or data.get("Must reflect on")
            or data.get("Creates / updates")
            or data.get("Pass?")
            or ""
        )
        title_bits = [b for b in (step, who, screen) if b]
        title = " · ".join(title_bits) if title_bits else "Step"
        lines = [Paragraph(_inline_md(title), styles["cardTitle"])]
        if action:
            lines.append(Paragraph(_labeled("Do", action), styles["cardBody"]))
        if expected:
            lines.append(Paragraph(_labeled("Expect", expected), styles["cardBody"]))
        known = set(keys)
        for k, v in data.items():
            if k in {"ID", "#", "Who", "Actor", "Screen", "Where", "Action", "Steps", "Do", "Expected", "Must reflect on", "Creates / updates", "Pass?"} or not v:
                continue
            if k in known:
                lines.append(Paragraph(_labeled(k, v), styles["cardBody"]))
        inner = Table([[lines]], colWidths=[USABLE_W])
        inner.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#F9FAFB")),
                    ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#D0D5DD")),
                    ("LEFTPADDING", (0, 0), (-1, -1), 6),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 6),
                    ("TOPPADDING", (0, 0), (-1, -1), 5),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
                    ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ]
            )
        )
        flow.append(KeepTogether([inner, Spacer(1, 5)]))
    return flow


def _render_grid_table(headers: list[str], rows: list[list[str]], styles: dict):
    ncols = len(headers)
    widths = _col_widths(ncols)
    data = [[Paragraph(_inline_md(c), styles["cellHead"]) for c in headers]]
    for row in rows:
        cells = list(row) + [""] * max(0, ncols - len(row))
        data.append([Paragraph(_inline_md(c), styles["cell"]) for c in cells[:ncols]])
    table = Table(data, hAlign="LEFT", colWidths=widths, repeatRows=1)
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#EAECF0")),
                ("GRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#D0D5DD")),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 3),
                ("RIGHTPADDING", (0, 0), (-1, -1), 3),
                ("TOPPADDING", (0, 0), (-1, -1), 3),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
            ]
        )
    )
    return table


def md_to_flowables(md_text: str, styles: dict):
    story = []
    lines = md_text.splitlines()
    i = 0
    pending_list: list[str] = []
    table_rows: list[list[str]] = []

    def flush_list():
        nonlocal pending_list
        if not pending_list:
            return
        items = [
            ListItem(Paragraph(_inline_md(item), styles["li"]), leftIndent=12)
            for item in pending_list
        ]
        story.append(ListFlowable(items, bulletType="bullet", start="•"))
        story.append(Spacer(1, 4))
        pending_list = []

    def flush_table():
        nonlocal table_rows
        if not table_rows:
            return
        headers = table_rows[0]
        body = table_rows[1:]
        if len(headers) >= 5:
            story.extend(_render_step_cards(headers, body, styles))
        else:
            story.append(_render_grid_table(headers, body, styles))
            story.append(Spacer(1, 6))
        table_rows = []

    in_code = False
    code_buf: list[str] = []

    while i < len(lines):
        line = lines[i]
        if line.strip().startswith("```"):
            flush_list()
            flush_table()
            if not in_code:
                in_code = True
                code_buf = []
            else:
                story.append(
                    Paragraph(
                        _escape("\n".join(code_buf)).replace("\n", "<br/>"),
                        styles["code"],
                    )
                )
                in_code = False
            i += 1
            continue
        if in_code:
            code_buf.append(line)
            i += 1
            continue

        if line.startswith("|") and "|" in line[1:]:
            flush_list()
            cells = [c.strip() for c in line.strip().strip("|").split("|")]
            if all(set(c) <= {"-", ":", " "} for c in cells):
                i += 1
                continue
            table_rows.append(cells)
            i += 1
            if i >= len(lines) or not lines[i].startswith("|"):
                flush_table()
            continue

        flush_table()

        if not line.strip():
            flush_list()
            i += 1
            continue
        if line.startswith("# "):
            flush_list()
            story.append(Paragraph(_inline_md(line[2:].strip()), styles["title"]))
        elif line.startswith("## "):
            flush_list()
            story.append(Paragraph(_inline_md(line[3:].strip()), styles["h1"]))
        elif line.startswith("### "):
            flush_list()
            story.append(Paragraph(_inline_md(line[4:].strip()), styles["h2"]))
        elif line.startswith("---"):
            flush_list()
            story.append(Spacer(1, 6))
        elif line.lstrip().startswith("- ") or line.lstrip().startswith("* "):
            pending_list.append(line.lstrip()[2:].strip())
        else:
            flush_list()
            story.append(Paragraph(_inline_md(line.strip()), styles["body"]))
        i += 1

    flush_list()
    flush_table()
    return story


def build_one(md_path: Path, pdf_path: Path, title: str) -> None:
    styles = _styles()
    md = md_path.read_text(encoding="utf-8")
    doc = SimpleDocTemplate(
        str(pdf_path),
        pagesize=A4,
        leftMargin=LEFT_M,
        rightMargin=RIGHT_M,
        topMargin=TOP_M,
        bottomMargin=BOTTOM_M,
        title=title,
    )
    doc.build(md_to_flowables(md, styles))
    print("Wrote", pdf_path)
    if DOCS.exists():
        dest = DOCS / pdf_path.name
        dest.write_bytes(pdf_path.read_bytes())
        print("Wrote", dest)


def main() -> None:
    for job in JOBS:
        if not job["md"].exists():
            raise SystemExit(f"Missing markdown: {job['md']}")
        build_one(job["md"], job["pdf"], job["title"])


if __name__ == "__main__":
    main()
