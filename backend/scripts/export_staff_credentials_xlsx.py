"""Export live staff credential handoff JSON -> Excel (no DB writes, no password prints).

Includes Designation and RBAC Role from hrSeed so the sheet shows how designation
maps to portal access (prm, hr, principal, teacher, etc.).
"""

from __future__ import annotations

import argparse
import json
import re
import sys
import zipfile
from collections import Counter
from pathlib import Path
from xml.sax.saxutils import escape

BACKEND_ROOT = Path(__file__).resolve().parents[1]
REPO_ROOT = BACKEND_ROOT.parent
sys.path.insert(0, str(BACKEND_ROOT))

from app.services.staff_login_provision import load_roster_from_hr_seed  # noqa: E402

DEFAULT_JSON = REPO_ROOT / "local" / "credentials" / "queen-mira-staff-logins-live.json"
DEFAULT_XLSX = REPO_ROOT / "local" / "credentials" / "Queen_Mira_Staff_Login_Credentials.xlsx"
HR_SEED = REPO_ROOT / "src" / "Pages" / "HR" / "domain" / "hrSeed.js"

_EMP_RE = re.compile(r"^EMP-QMIS-\d{3}$")

# Human-readable labels for RBAC codes (matches portal roles).
_ROLE_LABELS = {
    "teacher": "Teacher",
    "coordinator": "Coordinator",
    "principal": "Principal",
    "director": "Director",
    "prm": "PRM",
    "pro": "PRO",
    "hr": "HR",
    "accounthead": "Account Head",
    "financemanager": "Finance Manager",
    "accountassistant": "Account Assistant",
    "finance_assistant": "Finance Assistant",
    "librarian": "Librarian",
    "itsupportmanager": "IT Support Manager",
    "processauditor": "Process Auditor",
    "qualityauditor": "Quality Auditor",
    "jointdirector": "Joint Director",
    "jointdirectoraudit": "Joint Director Audit",
    "superadmin": "Super Admin",
}

_DESIGNATION_GUIDE = [
    ["Designation contains / equals (examples)", "RBAC role assigned", "Portal"],
    ["Principal (not quality/audit)", "principal", "Principal"],
    ["Director… (not Joint Director)", "director", "Director"],
    ["Joint Director Audit…", "jointdirectoraudit", "Joint Director Audit"],
    ["Joint Director…", "jointdirector", "Joint Director"],
    ["Coordinator…", "coordinator", "Coordinator"],
    ["Parent / Parents Relationship…, Public Relations, Assistant PRO", "prm", "PRM / Front Office"],
    ["HR Executive, HR Facilitator, HR …", "hr", "HR"],
    ["Finance Manager, Accountant, Accounts Trainee", "accounthead", "Account Head"],
    ["Librarian, Assistant Librarian", "librarian", "Librarian"],
    ["System Administrator", "itsupportmanager", "IT Support Manager"],
    ["Quality Audit…", "qualityauditor", "Quality Auditor"],
    ["Process Audit…, Audit Executive", "processauditor", "Process Auditor"],
    ["PRT / TGT / PGT / SGT / Facilitator / AVP / Teacher / …", "teacher", "Teacher"],
    ["(blank or unmapped designation)", "(none — directory only)", "No login until designation maps to a role"],
]


def _col_letter(index: int) -> str:
    result = []
    while index:
        index, rem = divmod(index - 1, 26)
        result.append(chr(65 + rem))
    return "".join(reversed(result))


def _cell(ref: str, value: str) -> str:
    return f'<c r="{ref}" t="inlineStr"><is><t>{escape(value)}</t></is></c>'


def _sheet_xml(headers: list[str], rows: list[list[str]]) -> str:
    sheet_rows = []
    header_cells = "".join(_cell(f"{_col_letter(i)}1", h) for i, h in enumerate(headers, start=1))
    sheet_rows.append(f'<row r="1">{header_cells}</row>')
    for r_index, row in enumerate(rows, start=2):
        cells = "".join(_cell(f"{_col_letter(c)}{r_index}", value) for c, value in enumerate(row, start=1))
        sheet_rows.append(f'<row r="{r_index}">{cells}</row>')
    return (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'
        f'<sheetData>{"".join(sheet_rows)}</sheetData></worksheet>'
    )


def write_xlsx_multi(path: Path, sheets: list[tuple[str, list[str], list[list[str]]]]) -> None:
    """sheets: list of (name, headers, rows)."""
    content_types_overrides = []
    workbook_sheets = []
    workbook_rels = []
    path.parent.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(path, "w", compression=zipfile.ZIP_DEFLATED) as zf:
        for index, (name, headers, rows) in enumerate(sheets, start=1):
            part = f"worksheets/sheet{index}.xml"
            zf.writestr(f"xl/{part}", _sheet_xml(headers, rows))
            rid = f"rId{index}"
            safe_name = escape(name[:31])
            workbook_sheets.append(f'<sheet name="{safe_name}" sheetId="{index}" r:id="{rid}"/>')
            workbook_rels.append(
                f'<Relationship Id="{rid}" '
                f'Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" '
                f'Target="{part}"/>'
            )
            content_types_overrides.append(
                f'<Override PartName="/xl/{part}" '
                f'ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>'
            )
        zf.writestr(
            "[Content_Types].xml",
            (
                '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
                '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
                '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'
                '<Default Extension="xml" ContentType="application/xml"/>'
                '<Override PartName="/xl/workbook.xml" '
                'ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>'
                f"{''.join(content_types_overrides)}</Types>"
            ),
        )
        zf.writestr(
            "_rels/.rels",
            (
                '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
                '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
                '<Relationship Id="rId1" '
                'Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" '
                'Target="xl/workbook.xml"/></Relationships>'
            ),
        )
        zf.writestr(
            "xl/workbook.xml",
            (
                '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
                '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" '
                'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">'
                f'<sheets>{"".join(workbook_sheets)}</sheets></workbook>'
            ),
        )
        zf.writestr(
            "xl/_rels/workbook.xml.rels",
            (
                '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
                '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
                f"{''.join(workbook_rels)}</Relationships>"
            ),
        )
    try:
        path.chmod(0o600)
    except OSError:
        pass


def validate(accounts: list[dict]) -> dict:
    ids = [str(a.get("employeeId") or "") for a in accounts]
    emails = [str(a.get("loginUsername") or "").lower() for a in accounts]
    temps = [a.get("temporaryPassword") for a in accounts]
    return {
        "accounts": len(accounts),
        "empQmisIds": sum(1 for i in ids if _EMP_RE.match(i)),
        "uniqueEmployeeIds": len(set(ids)),
        "uniqueUsernames": len(set(emails)),
        "uniqueTemporaryPasswords": len(set(temps)),
        "duplicateEmployeeIds": sum(1 for _, n in Counter(ids).items() if n > 1),
        "duplicateUsernames": sum(1 for _, n in Counter(emails).items() if n > 1),
        "missingFields": sum(
            1
            for a in accounts
            if not a.get("employeeId")
            or not a.get("name")
            or not a.get("loginUsername")
            or not a.get("temporaryPassword")
        ),
        "mustChangePasswordTrue": sum(1 for a in accounts if a.get("mustChangePassword") is True),
        "qmisEduUsernames": sum(1 for e in emails if e.endswith("@qmis.edu")),
    }


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--json", type=Path, default=DEFAULT_JSON)
    parser.add_argument("--xlsx", type=Path, default=DEFAULT_XLSX)
    args = parser.parse_args()

    payload = json.loads(args.json.read_text(encoding="utf-8"))
    accounts = list(payload.get("accounts") or [])
    accounts.sort(key=lambda row: str(row.get("employeeId") or ""))
    stats = validate(accounts)
    if stats["accounts"] != 100 or stats["empQmisIds"] != 100:
        raise SystemExit(f"Validation failed: expected 100 EMP-QMIS accounts, got {stats}")
    if stats["duplicateEmployeeIds"] or stats["duplicateUsernames"] or stats["missingFields"]:
        raise SystemExit(f"Validation failed: duplicates/missing fields {stats}")
    if stats["uniqueTemporaryPasswords"] != 100 or stats["mustChangePasswordTrue"] != 100:
        raise SystemExit(f"Validation failed: password/status counts {stats}")
    if stats["qmisEduUsernames"]:
        raise SystemExit("Validation failed: handoff includes @qmis.edu accounts")

    roster = {row.employee_code: row for row in load_roster_from_hr_seed(HR_SEED)}

    login_headers = [
        "Employee ID",
        "Employee Name",
        "Designation",
        "RBAC Role",
        "Portal",
        "Login Username/Email",
        "Temporary Password",
        "Account Status",
    ]
    login_rows: list[list[str]] = []
    for account in accounts:
        emp_id = str(account.get("employeeId") or "")
        seed = roster.get(emp_id)
        role_code = str(account.get("role") or (seed.role if seed else "") or "")
        designation = str(seed.designation if seed else "") or ""
        status = "Password change required" if account.get("mustChangePassword") else "Active"
        login_rows.append(
            [
                emp_id,
                str(account.get("name") or ""),
                designation,
                role_code,
                _ROLE_LABELS.get(role_code, role_code),
                str(account.get("loginUsername") or ""),
                str(account.get("temporaryPassword") or ""),
                status,
            ]
        )

    directory_headers = [
        "Employee ID",
        "Employee Name",
        "Designation (needs RBAC mapping)",
        "Email",
        "Current RBAC",
        "Action needed",
    ]
    directory_rows: list[list[str]] = []
    for emp in sorted(roster.values(), key=lambda row: row.employee_code):
        if emp.role:
            continue
        directory_rows.append(
            [
                emp.employee_code,
                emp.name,
                emp.designation or "(blank)",
                emp.email,
                "(none — directory only)",
                "Update designation in staff Excel / HR so it maps to prm, hr, principal, teacher, etc., then provision login",
            ]
        )

    guide_headers = _DESIGNATION_GUIDE[0]
    guide_rows = _DESIGNATION_GUIDE[1:]

    if str(args.xlsx.resolve()).find("local") < 0 or "credentials" not in args.xlsx.resolve().parts:
        raise SystemExit("Refusing to write credentials Excel outside local/credentials/")

    write_xlsx_multi(
        args.xlsx,
        [
            ("Staff Logins", login_headers, login_rows),
            ("Designation to RBAC", guide_headers, guide_rows),
            ("No Login Until Designation", directory_headers, directory_rows),
        ],
    )

    with zipfile.ZipFile(args.xlsx, "r") as zf:
        xml = zf.read("xl/worksheets/sheet1.xml").decode("utf-8")
    data_rows = xml.count("<row r=") - 1
    print(
        json.dumps(
            {
                "output": str(args.xlsx),
                "loginRows": data_rows,
                "withDesignationAndRole": data_rows,
                "directoryOnlyNeedingDesignationMap": len(directory_rows),
                "sheets": ["Staff Logins", "Designation to RBAC", "No Login Until Designation"],
                "note": "RBAC comes from designation mapping. Fill/correct designation, then re-import/provision.",
            },
            indent=2,
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
