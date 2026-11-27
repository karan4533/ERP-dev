"""Reconcile Excel staff file vs hrSeed.js vs isolated provision DB (read-only / dry-run).

Never writes to a live database. Never prints passwords.
"""

from __future__ import annotations

import json
import os
import re
import sys
from collections import Counter
from dataclasses import asdict, dataclass, field
from datetime import datetime, timezone
from pathlib import Path

BACKEND_ROOT = Path(__file__).resolve().parents[1]
REPO_ROOT = BACKEND_ROOT.parent
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))
if str(REPO_ROOT / "docs") not in sys.path:
    sys.path.insert(0, str(REPO_ROOT / "docs"))

from _import_staff_to_hr_seed import (  # type: ignore  # noqa: E402
    XLSX,
    map_role,
    parse_xlsx,
    primary_email,
)

from app.services.staff_login_provision import (  # noqa: E402
    is_valid_login_email,
    load_roster_from_hr_seed,
)

HR_SEED = REPO_ROOT / "src" / "Pages" / "HR" / "domain" / "hrSeed.js"
REPORT_PATH = (
    REPO_ROOT / "docs" / "08_Audit_And_Reports" / "Historical_Audits" / "Staff_Reconciliation_Report.md"
)
ISOLATED_DB = BACKEND_ROOT / "local" / "staff_provision_isolated.sqlite3"
HANDOFF = REPO_ROOT / "local" / "credentials" / "queen-mira-staff-logins-isolated.json"

_EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def _norm_name(value: str) -> str:
    return re.sub(r"\s+", " ", (value or "").strip().lower())


def _norm_email(value: str) -> str:
    return (value or "").strip().lower()


def _redact_email(email: str) -> str:
    email = _norm_email(email)
    if not email or "@" not in email:
        return "(invalid-or-missing)"
    local, _, domain = email.partition("@")
    if len(local) <= 2:
        masked = local[:1] + "*"
    else:
        masked = local[:2] + "*" * max(1, len(local) - 3) + local[-1]
    return f"{masked}@{domain}"


@dataclass
class ExcelRow:
    excel_row: int
    sl: str
    department: str
    name: str
    designation: str
    email_raw: str
    email: str
    phone: str
    mapped_role: str


@dataclass
class Reconciliation:
    excel_body_rows_under_header: int = 0
    excel_blank_rows: int = 0
    excel_repeated_header_rows: int = 0
    excel_raw_staff_rows: int = 0
    excel_unique_after_email_dedupe: int = 0
    hr_seed_count: int = 0
    multi_email_cells: int = 0
    isolated_users_with_emp_qmis: int = 0
    isolated_emp_qmis_rows: int = 0
    eligible_for_login: int = 0
    directory_only: int = 0
    invalid_email: list[dict] = field(default_factory=list)
    duplicate_emails_in_excel: list[dict] = field(default_factory=list)
    excel_only_after_dedupe_gap: list[dict] = field(default_factory=list)
    seed_missing_from_excel: list[dict] = field(default_factory=list)
    unmatched_name_email: list[dict] = field(default_factory=list)
    in_seed_eligible: int = 0
    in_seed_directory_only: int = 0
    isolated_accounts_for_eligible: int = 0
    eligible_missing_account_in_isolated: list[dict] = field(default_factory=list)
    live_note: str = (
        "Isolated-test credentials are NOT valid on live. Live account counts were not queried."
    )
    dry_run_would_create_on_fresh_isolated: int = 0
    review_notes: list[str] = field(default_factory=list)


def load_excel_staff(path: Path) -> list[ExcelRow]:
    rows = parse_xlsx(path)
    staff: list[ExcelRow] = []
    for index, row in enumerate(rows[1:], start=2):
        name = (row.get("C") or "").strip()
        designation = (row.get("D") or "").strip()
        if not name or designation.lower() in {"", "desigination", "designation"}:
            continue
        if name.lower() in {"name", "sl.no"}:
            continue
        email_raw = (row.get("E") or "").strip()
        email = primary_email(email_raw)
        staff.append(
            ExcelRow(
                excel_row=index,
                sl=(row.get("A") or "").strip(),
                department=(row.get("B") or "").strip(),
                name=name,
                designation=designation,
                email_raw=email_raw,
                email=email,
                phone=(row.get("F") or "").strip(),
                mapped_role=map_role(designation),
            )
        )
    return staff


def dedupe_excel_by_email(staff: list[ExcelRow]) -> tuple[list[ExcelRow], list[dict]]:
    seen: dict[str, ExcelRow] = {}
    dups: list[dict] = []
    unique: list[ExcelRow] = []
    for row in staff:
        key = _norm_email(row.email)
        if key and key in seen:
            first = seen[key]
            dups.append(
                {
                    "email": _redact_email(key),
                    "kept": {
                        "excelRow": first.excel_row,
                        "name": first.name,
                        "designation": first.designation,
                    },
                    "duplicate": {
                        "excelRow": row.excel_row,
                        "name": row.name,
                        "designation": row.designation,
                    },
                }
            )
            continue
        if key:
            seen[key] = row
        unique.append(row)
    return unique, dups


def query_isolated(db_path: Path) -> tuple[set[str], set[str], int, int]:
    """Return (user_emails, emp_codes_with_user, emp_count, user_count_linked)."""
    if not db_path.is_file():
        return set(), set(), 0, 0
    import sqlite3

    conn = sqlite3.connect(str(db_path))
    try:
        emp_rows = conn.execute(
            "SELECT employee_code, lower(email), user_id FROM hr_employees WHERE employee_code LIKE 'EMP-QMIS-%'"
        ).fetchall()
        user_emails = {
            row[0]
            for row in conn.execute("SELECT lower(email) FROM users").fetchall()
            if row[0]
        }
    finally:
        conn.close()
    codes_with_user = {code for code, _email, user_id in emp_rows if user_id}
    return user_emails, codes_with_user, len(emp_rows), len(codes_with_user)


def build_report() -> Reconciliation:
    raw_sheet = parse_xlsx(XLSX)
    body = raw_sheet[1:]
    blank = 0
    repeated_header = 0
    for row in body:
        name = (row.get("C") or "").strip()
        designation = (row.get("D") or "").strip()
        email = (row.get("E") or "").strip()
        if not name and not designation and not email:
            blank += 1
        elif name.lower() == "name" and designation.lower() in {"desigination", "designation"}:
            repeated_header += 1

    excel_staff = load_excel_staff(XLSX)
    unique, dups = dedupe_excel_by_email(excel_staff)
    seed = load_roster_from_hr_seed(HR_SEED)

    seed_by_email = {_norm_email(row.email): row for row in seed if row.email}
    seed_by_code = {row.employee_code: row for row in seed}
    seed_by_name = {}
    for row in seed:
        seed_by_name.setdefault(_norm_name(row.name), []).append(row)

    multi_email = sum(1 for row in excel_staff if ("/" in row.email_raw) or ("," in row.email_raw))

    rec = Reconciliation(
        excel_body_rows_under_header=len(body),
        excel_blank_rows=blank,
        excel_repeated_header_rows=repeated_header,
        excel_raw_staff_rows=len(excel_staff),
        excel_unique_after_email_dedupe=len(unique),
        hr_seed_count=len(seed),
        duplicate_emails_in_excel=dups,
        multi_email_cells=multi_email,
    )

    # Assign synthetic codes the same way import does (after email dedupe, sequential).
    for index, row in enumerate(unique, start=1):
        code = f"EMP-QMIS-{index:03d}"
        email = _norm_email(row.email)
        role = row.mapped_role
        valid_email = is_valid_login_email(email)

        seed_row = seed_by_code.get(code)
        if seed_row is None and email:
            seed_row = seed_by_email.get(email)

        if role and valid_email:
            rec.eligible_for_login += 1
        elif not role:
            rec.directory_only += 1
        if role and not valid_email:
            rec.invalid_email.append(
                {
                    "proposedId": code,
                    "name": row.name,
                    "designation": row.designation,
                    "email": _redact_email(email or row.email_raw),
                    "reason": "eligible designation but email malformed/missing",
                }
            )
        if not role and email and not valid_email:
            rec.review_notes.append(
                f"{code} / {row.name}: directory-only and email invalid ({_redact_email(email or row.email_raw)})"
            )

        if seed_row is None:
            # Name fallback
            name_hits = seed_by_name.get(_norm_name(row.name), [])
            if len(name_hits) == 1:
                seed_row = name_hits[0]
                rec.unmatched_name_email.append(
                    {
                        "excel": {"name": row.name, "email": _redact_email(email), "proposedId": code},
                        "matchedSeedByNameOnly": seed_row.employee_code,
                        "note": "name match only — verify before any account action",
                    }
                )
            else:
                rec.excel_only_after_dedupe_gap.append(
                    {
                        "proposedId": code,
                        "name": row.name,
                        "email": _redact_email(email),
                        "designation": row.designation,
                        "mappedRole": role or "(directory-only)",
                    }
                )

    # Seed rows not represented in excel unique set by email/name
    excel_emails = {_norm_email(r.email) for r in unique if r.email}
    excel_names = {_norm_name(r.name) for r in unique}
    for row in seed:
        if _norm_email(row.email) in excel_emails:
            continue
        if _norm_name(row.name) in excel_names:
            continue
        rec.seed_missing_from_excel.append(
            {
                "employeeId": row.employee_code,
                "name": row.name,
                "email": _redact_email(row.email),
                "role": row.role or "(directory-only)",
            }
        )

    for row in seed:
        if row.role and is_valid_login_email(row.email):
            rec.in_seed_eligible += 1
        else:
            rec.in_seed_directory_only += 1
            if row.role and not is_valid_login_email(row.email):
                rec.invalid_email.append(
                    {
                        "proposedId": row.employee_code,
                        "name": row.name,
                        "designation": row.designation,
                        "email": _redact_email(row.email),
                        "reason": "in hrSeed with role but invalid email",
                    }
                )

    user_emails, codes_with_user, emp_count, linked = query_isolated(ISOLATED_DB)
    rec.isolated_emp_qmis_rows = emp_count
    rec.isolated_users_with_emp_qmis = linked
    rec.isolated_accounts_for_eligible = 0

    for row in seed:
        eligible = bool(row.role and is_valid_login_email(row.email))
        if not eligible:
            continue
        has_account = row.employee_code in codes_with_user or _norm_email(row.email) in user_emails
        if has_account:
            rec.isolated_accounts_for_eligible += 1
        else:
            rec.eligible_missing_account_in_isolated.append(
                {
                    "employeeId": row.employee_code,
                    "name": row.name,
                    "email": _redact_email(row.email),
                    "role": row.role,
                }
            )

    # Dry-run would-create on a *fresh* isolated DB equals seed eligible with valid email.
    rec.dry_run_would_create_on_fresh_isolated = rec.in_seed_eligible
    # On current isolated DB, missing among eligible:
    if emp_count:
        rec.dry_run_would_create_on_fresh_isolated = len(rec.eligible_missing_account_in_isolated)
        rec.review_notes.append(
            f"Isolated DB already has {linked} EMP-QMIS-* rows linked to users; "
            f"{len(rec.eligible_missing_account_in_isolated)} eligible still missing there."
        )
    else:
        rec.review_notes.append("Isolated DB missing or empty — treat dry-run create count as full eligible set.")

    if HANDOFF.is_file():
        try:
            handoff = json.loads(HANDOFF.read_text(encoding="utf-8"))
            count = handoff.get("count")
            rec.review_notes.append(
                f"Local handoff file exists with count={count} (passwords not read into this report). "
                "Valid only for the isolated SQLite used when it was generated — not live."
            )
        except json.JSONDecodeError:
            rec.review_notes.append("Handoff file present but unreadable JSON.")

    rec.review_notes.append(
        f"Excel raw staff rows={len(excel_staff)}; after email dedupe={len(unique)}; "
        f"hrSeed={len(seed)}. Gap of {len(excel_staff) - len(unique)} is duplicate-email rows skipped at import."
    )
    return rec


def render_markdown(rec: Reconciliation) -> str:
    lines = [
        "# QMIS Staff Reconciliation Report (redacted)",
        "",
        f"**Generated:** {datetime.now(timezone.utc).isoformat()}",
        "**Mode:** Compare Excel ↔ hrSeed ↔ isolated provision DB only. **No live database writes.**",
        "",
        "## Summary",
        "",
        "| Metric | Count |",
        "|---|---:|",
        f"| Excel body rows under first header (often read as “122”) | {rec.excel_body_rows_under_header} |",
        f"| — blank rows in body | {rec.excel_blank_rows} |",
        f"| — repeated column-header rows in body | {rec.excel_repeated_header_rows} |",
        f"| Real staff rows parsed | {rec.excel_raw_staff_rows} |",
        f"| After email dedupe | {rec.excel_unique_after_email_dedupe} |",
        f"| hrSeed EMP-QMIS-* records | {rec.hr_seed_count} |",
        f"| Cells with multiple emails (primary used) | {rec.multi_email_cells} |",
        f"| Eligible for login (role + valid email) — Excel view | {rec.eligible_for_login} |",
        f"| Directory-only (no RBAC role) — Excel view | {rec.directory_only} |",
        f"| Eligible in hrSeed | {rec.in_seed_eligible} |",
        f"| Directory-only / ineligible in hrSeed | {rec.in_seed_directory_only} |",
        f"| Isolated DB EMP-QMIS employee rows | {rec.isolated_emp_qmis_rows} |",
        f"| Isolated DB EMP-QMIS with linked user | {rec.isolated_users_with_emp_qmis} |",
        f"| Isolated: eligible with account | {rec.isolated_accounts_for_eligible} |",
        f"| Isolated: eligible missing account | {len(rec.eligible_missing_account_in_isolated)} |",
        f"| Duplicate email groups in Excel | {len(rec.duplicate_emails_in_excel)} |",
        f"| Invalid email blocking eligible login | {len(rec.invalid_email)} |",
        f"| Dry-run would create on **current** isolated DB | {rec.dry_run_would_create_on_fresh_isolated} |",
        "",
        "### Why 122 vs 120",
        "",
        f"The sheet has **{rec.excel_body_rows_under_header}** rows under the first header. "
        f"That includes **{rec.excel_blank_rows}** blank row(s) and **{rec.excel_repeated_header_rows}** "
        f"repeated header row(s). **{rec.excel_raw_staff_rows}** are real staff — matching hrSeed.",
        "",
        "## Live campus",
        "",
        rec.live_note,
        "",
        "Do **not** assume the 100 isolated-test credentials work on live. "
        "Live provisioning requires explicit approval after this report is reviewed.",
        "",
        "## Duplicate emails in Excel (kept first occurrence)",
        "",
    ]
    if not rec.duplicate_emails_in_excel:
        lines.append("_None._")
    else:
        lines.append("| Redacted email | Kept (row / name) | Duplicate (row / name) |")
        lines.append("|---|---|---|")
        for item in rec.duplicate_emails_in_excel:
            k = item["kept"]
            d = item["duplicate"]
            lines.append(
                f"| `{item['email']}` | {k['excelRow']} / {k['name']} ({k['designation']}) | "
                f"{d['excelRow']} / {d['name']} ({d['designation']}) |"
            )

    lines.extend(["", "## Invalid or malformed emails", ""])
    if not rec.invalid_email:
        lines.append("_None blocking eligible login in hrSeed._")
    else:
        lines.append("| ID | Name | Designation | Redacted email | Reason |")
        lines.append("|---|---|---|---|---|")
        for item in rec.invalid_email:
            lines.append(
                f"| {item['proposedId']} | {item['name']} | {item['designation']} | "
                f"`{item['email']}` | {item['reason']} |"
            )

    lines.extend(["", "## Excel rows not matched into hrSeed (unexpected)", ""])
    if not rec.excel_only_after_dedupe_gap:
        lines.append("_None — deduped Excel aligns with hrSeed import path._")
    else:
        for item in rec.excel_only_after_dedupe_gap:
            lines.append(f"- {item}")

    lines.extend(["", "## Name-only matches (verify before any account action)", ""])
    if not rec.unmatched_name_email:
        lines.append("_None._")
    else:
        for item in rec.unmatched_name_email:
            lines.append(f"- {item}")

    lines.extend(["", "## hrSeed rows missing from Excel (unexpected)", ""])
    if not rec.seed_missing_from_excel:
        lines.append("_None._")
    else:
        for item in rec.seed_missing_from_excel:
            lines.append(f"- {item}")

    lines.extend(["", "## Eligible missing account in isolated DB", ""])
    if not rec.eligible_missing_account_in_isolated:
        lines.append("_None — all hrSeed-eligible staff have a linked user in the isolated DB._")
    else:
        lines.append("| Employee ID | Name | Role | Redacted email |")
        lines.append("|---|---|---|---|")
        for item in rec.eligible_missing_account_in_isolated:
            lines.append(
                f"| {item['employeeId']} | {item['name']} | {item['role']} | `{item['email']}` |"
            )

    lines.extend(["", "## Review notes", ""])
    for note in rec.review_notes:
        lines.append(f"- {note}")

    lines.extend(
        [
            "",
            "## Recommended next steps (no action taken)",
            "",
            "1. Review duplicate Excel rows and decide which person keeps the shared email.",
            "2. Fix invalid emails / assign RBAC roles for directory-only staff who need portal access.",
            "3. After approval only: run live provisioning with backup + `--i-understand-live`, "
            "writing credentials solely for **newly created** accounts.",
            "4. Do not redistribute the isolated handoff file for live use.",
            "",
        ]
    )
    return "\n".join(lines) + "\n"


def main() -> int:
    os.environ.setdefault("ENVIRONMENT", "development")
    rec = build_report()
    markdown = render_markdown(rec)
    REPORT_PATH.write_text(markdown, encoding="utf-8")
    summary = {
        "excelBodyRows": rec.excel_body_rows_under_header,
        "excelBlank": rec.excel_blank_rows,
        "excelRepeatedHeader": rec.excel_repeated_header_rows,
        "excelStaff": rec.excel_raw_staff_rows,
        "excelDeduped": rec.excel_unique_after_email_dedupe,
        "hrSeed": rec.hr_seed_count,
        "multiEmailCells": rec.multi_email_cells,
        "eligibleSeed": rec.in_seed_eligible,
        "directoryOnlySeed": rec.in_seed_directory_only,
        "isolatedLinked": rec.isolated_users_with_emp_qmis,
        "isolatedMissingEligible": len(rec.eligible_missing_account_in_isolated),
        "duplicateEmailGroups": len(rec.duplicate_emails_in_excel),
        "invalidEmail": len(rec.invalid_email),
        "dryRunWouldCreateOnIsolated": rec.dry_run_would_create_on_fresh_isolated,
        "liveProvisioning": "NOT RUN — awaiting explicit approval",
        "report": str(REPORT_PATH),
    }
    print(json.dumps(summary, indent=2))
    print(f"Wrote redacted report: {REPORT_PATH}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
