"""Replace Queen Mira staff logins from Credential Prep CSV (live Postgres).

Reads the client CSV, normalizes RBAC roles (rejects unsafe edits like EA→Super Admin),
ensures role rows exist, then for each eligible staff member:
  - upserts hr_employees
  - creates or replaces the User login with a new temporary password
  - sets must_change_password=True

Preserves demo ``@qmis.edu`` accounts. Does not email/WhatsApp.

Examples:
  python scripts/replace_staff_logins_from_csv.py --dry-run --i-understand-live
  python scripts/replace_staff_logins_from_csv.py --i-understand-live \\
      --write-credentials ../local/credentials/queen-mira-staff-logins-client.json \\
      --write-xlsx ../local/credentials/Queen_Mira_Staff_Login_Credentials.xlsx
"""

from __future__ import annotations

import argparse
import csv
import json
import os
import sys
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path

BACKEND_ROOT = Path(__file__).resolve().parents[1]
REPO_ROOT = BACKEND_ROOT.parent
sys.path.insert(0, str(BACKEND_ROOT))

from app.permissions.matrix import ALL_ROLES  # noqa: E402
from app.services.staff_designation_map import (  # noqa: E402
    map_role_from_designation,
    primary_login_email,
)
from app.services.staff_login_provision import (  # noqa: E402
    NewCredential,
    is_valid_login_email,
    split_name,
    write_credential_handoff,
)

VALID_PORTAL_ROLES = {code for code, _ in ALL_ROLES} - {"student", "parent"}
# Never grant these from a hand-edited CSV cell unless designation map also says so.
_PRIVILEGED = {"superadmin", "admin", "managing_director"}

DEFAULT_CSV = REPO_ROOT / "erp complete documentation" / "QMIS_Staff_Credential_Prep.csv"


def _load_dotenv() -> dict[str, str]:
    vals: dict[str, str] = {}
    for line in (BACKEND_ROOT / ".env").read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        vals[key.strip()] = value.strip().strip('"').strip("'")
    return vals


def resolve_role(designation: str, csv_role: str) -> tuple[str, str]:
    """Return (role_code or '', reason). Empty = directory-only."""
    mapped = map_role_from_designation(designation)
    raw = (csv_role or "").strip()
    compact = raw.lower().replace(" ", "").replace("_", "")
    aliases = {
        "superadmin": "superadmin",
        "joint director audit": "jointdirectoraudit",
        "jointdirectoraudit": "jointdirectoraudit",
        "finance manager": "financemanager",
        "account assistant": "accountassistant",
        "accountassistant": "accountassistant",
        "financemanager": "financemanager",
    }
    csv_code = aliases.get(raw.lower()) or aliases.get(compact) or (raw.lower() if raw.lower() in VALID_PORTAL_ROLES else "")

    # Invalid / informal CSV edits (Camera room, file room, Admin, Super admin on EA) → designation map.
    if not csv_code:
        return mapped, "directory_or_mapped_from_designation" if not mapped else "mapped_from_designation"

    if csv_code in _PRIVILEGED and mapped != csv_code:
        return mapped, f"rejected_csv_privileged:{raw!r};used_map:{mapped or 'directory'}"

    if mapped and mapped != csv_code:
        # Prefer approved designation map when they disagree (e.g. PA marked principal).
        return mapped, f"csv_had:{csv_code};corrected_to_map:{mapped}"

    if not mapped and csv_code:
        # CSV invented a portal role for a directory designation — refuse.
        return "", f"rejected_csv_role_for_directory_designation:{csv_code}"

    return csv_code, "csv_ok"


def load_csv_roster(path: Path) -> list[dict]:
    rows: list[dict] = []
    with path.open(encoding="utf-8-sig", newline="") as fh:
        for raw in csv.DictReader(fh):
            emp = (raw.get("employee_id") or "").strip()
            if not emp.startswith("EMP-QMIS-"):
                continue
            email = primary_login_email(raw.get("login_email") or "")
            designation = (raw.get("designation") or "").strip()
            csv_role = (raw.get("rbac_role") or "").strip()
            role, reason = resolve_role(designation, csv_role)
            rows.append(
                {
                    "employee_id": emp,
                    "name": (raw.get("name") or "").strip(),
                    "department": (raw.get("department") or "").strip(),
                    "designation": designation,
                    "email": email,
                    "phone": (raw.get("phone") or "").strip(),
                    "role": role,
                    "resolve_reason": reason,
                    "csv_role": csv_role,
                }
            )
    rows.sort(key=lambda r: r["employee_id"])
    return rows


def ensure_roles_and_permissions(db) -> dict:
    """Insert any missing ALL_ROLES / permissions / links. Does not touch demo passwords."""
    from sqlalchemy import select

    from app.models import Permission, Role, RolePermission
    from app.permissions.matrix import PERMISSIONS, ROLE_PERMISSIONS

    roles_by_code = {role.code: role for role in db.scalars(select(Role)).all()}
    for code, name in ALL_ROLES:
        if code not in roles_by_code:
            role = Role(code=code, name=name)
            db.add(role)
            roles_by_code[code] = role
    db.flush()

    perms_by_code = {item.code: item for item in db.scalars(select(Permission)).all()}
    for code, description in PERMISSIONS:
        if code not in perms_by_code:
            item = Permission(code=code, description=description)
            db.add(item)
            perms_by_code[code] = item
    db.flush()

    existing_links = {
        (row.role_id, row.permission_id) for row in db.scalars(select(RolePermission)).all()
    }
    for role_code, codes in ROLE_PERMISSIONS.items():
        role = roles_by_code[role_code]
        for perm_code in codes:
            perm = perms_by_code[perm_code]
            key = (role.id, perm.id)
            if key not in existing_links:
                db.add(RolePermission(role_id=role.id, permission_id=perm.id))
                existing_links.add(key)
    db.flush()
    return roles_by_code


def _is_demo_email(email: str) -> bool:
    return (email or "").lower().endswith("@qmis.edu")


def replace_logins(db, *, campus, roster: list[dict], dry_run: bool) -> dict:
    from sqlalchemy import select

    from app.core.passwords import generate_temporary_password
    from app.core.security import hash_password
    from app.models import HrEmployee, User, UserProfile
    from app.services.audit import write_audit

    roles_by_code = ensure_roles_and_permissions(db)
    created: list[NewCredential] = []
    replaced: list[NewCredential] = []
    directory_skipped = 0
    invalid = 0
    review: list[str] = []
    deactivated_old = 0

    eligible_emails = set()
    for item in roster:
        if item["role"] and is_valid_login_email(item["email"]):
            eligible_emails.add(item["email"].lower())

    # Deactivate prior EMP-QMIS logins that are not in the eligible set (and not demos).
    emp_rows = db.scalars(
        select(HrEmployee).where(HrEmployee.employee_code.like("EMP-QMIS-%"))
    ).all()
    for emp in emp_rows:
        if emp.user_id is None:
            continue
        user = db.get(User, emp.user_id)
        if user is None:
            continue
        if _is_demo_email(user.email):
            continue
        if user.email.lower() in eligible_emails:
            continue
        deactivated_old += 1
        if not dry_run:
            user.is_active = False
            emp.user_id = None
            write_audit(
                db,
                action="STAFF_LOGIN_DEACTIVATED",
                entity_type="hr_employee",
                entity_id=str(emp.id),
                campus_id=campus.id,
                details=f"{emp.employee_code} email={user.email} (not in eligible CSV)",
            )

    for item in roster:
        role_code = item["role"]
        email = (item["email"] or "").strip().lower()
        if not role_code:
            directory_skipped += 1
            if item["resolve_reason"].startswith("rejected"):
                review.append(f"{item['employee_id']}: {item['resolve_reason']}")
            continue
        if not is_valid_login_email(email):
            invalid += 1
            review.append(f"{item['employee_id']}: invalid email {item['email']!r}")
            continue
        if role_code not in roles_by_code:
            invalid += 1
            review.append(f"{item['employee_id']}: role {role_code!r} missing in DB")
            continue
        if _is_demo_email(email):
            review.append(f"{item['employee_id']}: refuses to overwrite demo @qmis.edu {email}")
            continue

        by_code = db.scalar(
            select(HrEmployee).where(
                HrEmployee.campus_id == campus.id,
                HrEmployee.employee_code == item["employee_id"],
            )
        )
        by_email = db.scalar(select(HrEmployee).where(HrEmployee.email == email))
        if by_code and by_email and by_code.id != by_email.id:
            review.append(
                f"{item['employee_id']}: employee_code/email conflict "
                f"({by_code.employee_code} vs {by_email.employee_code})"
            )
            continue

        first, last = split_name(item["name"])
        row = by_code or by_email
        if row is None:
            if dry_run:
                row = HrEmployee(
                    campus_id=campus.id,
                    employee_code=item["employee_id"],
                    first_name=first,
                    last_name=last,
                    email=email,
                )
            else:
                row = HrEmployee(
                    campus_id=campus.id,
                    employee_code=item["employee_id"],
                    first_name=first,
                    last_name=last,
                    email=email,
                    phone=item["phone"] or None,
                    department=item["department"] or None,
                    designation=item["designation"] or None,
                    role_title=role_code,
                    status="Active",
                    employment_type="Full Time",
                    category=item["department"] or "Admin",
                )
                db.add(row)
                db.flush()
        elif not dry_run:
            row.first_name = first
            row.last_name = last
            row.email = email
            row.phone = item["phone"] or row.phone
            row.department = item["department"] or row.department
            row.designation = item["designation"] or row.designation
            row.role_title = role_code
            row.status = "Active"
            db.flush()

        temporary = generate_temporary_password()
        existing = db.scalar(select(User).where(User.email == email))

        if dry_run:
            cred = NewCredential(
                employee_id=item["employee_id"],
                name=item["name"],
                role=role_code,
                login_username=email,
                temporary_password="(dry-run-not-issued)",
                must_change_password=True,
            )
            if existing:
                replaced.append(cred)
            else:
                created.append(cred)
            continue

        if existing is not None:
            # Replace credentials in place (avoids FK delete issues).
            profile = db.scalar(select(UserProfile).where(UserProfile.user_id == existing.id))
            if profile is not None:
                db.delete(profile)
                db.flush()
            existing.role_id = roles_by_code[role_code].id
            existing.password_hash = hash_password(temporary)
            existing.is_active = True
            existing.must_change_password = True
            existing.campus_id = campus.id
            db.flush()
            row.user_id = existing.id
            write_audit(
                db,
                action="STAFF_LOGIN_CREDENTIALS_REPLACED",
                entity_type="hr_employee",
                entity_id=str(row.id),
                campus_id=campus.id,
                details=f"{item['employee_id']} role={role_code} email={email}",
            )
            replaced.append(
                NewCredential(
                    employee_id=item["employee_id"],
                    name=item["name"],
                    role=role_code,
                    login_username=email,
                    temporary_password=temporary,
                    must_change_password=True,
                )
            )
        else:
            user = User(
                campus_id=campus.id,
                role_id=roles_by_code[role_code].id,
                email=email,
                password_hash=hash_password(temporary),
                is_active=True,
                must_change_password=True,
            )
            db.add(user)
            db.flush()
            row.user_id = user.id
            write_audit(
                db,
                action="STAFF_LOGIN_PROVISIONED",
                entity_type="hr_employee",
                entity_id=str(row.id),
                campus_id=campus.id,
                details=f"{item['employee_id']} role={role_code} email={email}",
            )
            created.append(
                NewCredential(
                    employee_id=item["employee_id"],
                    name=item["name"],
                    role=role_code,
                    login_username=email,
                    temporary_password=temporary,
                    must_change_password=True,
                )
            )

    if dry_run:
        db.rollback()
    else:
        db.commit()

    return {
        "created": created,
        "replaced": replaced,
        "directory_skipped": directory_skipped,
        "invalid": invalid,
        "deactivated_old": deactivated_old,
        "review": review,
        "role_counts": Counter(
            item["role"] or "DIRECTORY" for item in roster
        ),
    }


def write_client_xlsx(path: Path, credentials: list[NewCredential], roster_by_id: dict) -> None:
    """Minimal xlsx (Excel) without openpyxl dependency — Office Open XML zip."""
    import zipfile
    from xml.sax.saxutils import escape

    path.parent.mkdir(parents=True, exist_ok=True)
    headers = [
        "Employee ID",
        "Name",
        "Designation",
        "Role",
        "Login Email",
        "Temporary Password",
        "Must Change Password",
    ]
    rows = [headers]
    for cred in credentials:
        meta = roster_by_id.get(cred.employee_id, {})
        rows.append(
            [
                cred.employee_id,
                cred.name,
                meta.get("designation", ""),
                cred.role,
                cred.login_username,
                cred.temporary_password,
                "YES — change at first login",
            ]
        )

    def col_letter(idx: int) -> str:
        n = idx + 1
        s = ""
        while n:
            n, r = divmod(n - 1, 26)
            s = chr(65 + r) + s
        return s

    sheet_rows = []
    for r_i, row in enumerate(rows, start=1):
        cells = []
        for c_i, value in enumerate(row):
            ref = f"{col_letter(c_i)}{r_i}"
            text = escape(str(value))
            cells.append(f'<c r="{ref}" t="inlineStr"><is><t>{text}</t></is></c>')
        sheet_rows.append(f'<row r="{r_i}">{"".join(cells)}</row>')
    last = f"{col_letter(len(headers) - 1)}{len(rows)}"
    sheet = (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'
        f'<dimension ref="A1:{last}"/>'
        f'<sheetData>{"".join(sheet_rows)}</sheetData>'
        "</worksheet>"
    )
    content_types = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
</Types>"""
    rels = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>"""
    wb = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets><sheet name="Staff Logins" sheetId="1" r:id="rId1"/></sheets>
</workbook>"""
    wb_rels = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
</Relationships>"""
    with zipfile.ZipFile(path, "w", compression=zipfile.ZIP_DEFLATED) as zf:
        zf.writestr("[Content_Types].xml", content_types)
        zf.writestr("_rels/.rels", rels)
        zf.writestr("xl/workbook.xml", wb)
        zf.writestr("xl/_rels/workbook.xml.rels", wb_rels)
        zf.writestr("xl/worksheets/sheet1.xml", sheet)
    try:
        path.chmod(0o600)
    except OSError:
        pass


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--csv", type=Path, default=DEFAULT_CSV)
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--i-understand-live", action="store_true", required=True)
    parser.add_argument(
        "--write-credentials",
        type=Path,
        default=None,
        help="Gitignored JSON under local/credentials/",
    )
    parser.add_argument(
        "--write-xlsx",
        type=Path,
        default=None,
        help="Gitignored Excel handoff under local/credentials/",
    )
    parser.add_argument(
        "--fix-csv",
        type=Path,
        default=None,
        help="Write sanitized eligible+directory CSV (roles corrected) for the client pack.",
    )
    args = parser.parse_args()

    vals = _load_dotenv()
    url = vals.get("DATABASE_URL") or ""
    if "postgres" not in url.lower():
        print("Expected Postgres DATABASE_URL in backend/.env", file=sys.stderr)
        return 2

    os.environ["DATABASE_URL"] = url
    os.environ["ENVIRONMENT"] = vals.get("ENVIRONMENT") or "development"
    os.environ["SMTP_HOST"] = ""
    os.environ["WHATSAPP_API_URL"] = ""
    os.environ["WHATSAPP_API_TOKEN"] = ""
    os.environ["INTEGRATIONS_MODE"] = ""

    if not args.csv.is_file():
        print(f"CSV not found: {args.csv}", file=sys.stderr)
        return 2

    roster = load_csv_roster(args.csv)
    eligible = [r for r in roster if r["role"] and is_valid_login_email(r["email"])]
    print(
        json.dumps(
            {
                "csv": str(args.csv),
                "roster": len(roster),
                "eligible": len(eligible),
                "directory": sum(1 for r in roster if not r["role"]),
                "roleCounts": dict(Counter(r["role"] or "DIRECTORY" for r in roster)),
                "dryRun": args.dry_run,
                "generatedAt": datetime.now(timezone.utc).isoformat(),
            },
            indent=2,
        )
    )

    if args.fix_csv:
        args.fix_csv.parent.mkdir(parents=True, exist_ok=True)
        with args.fix_csv.open("w", encoding="utf-8", newline="") as fh:
            w = csv.DictWriter(
                fh,
                fieldnames=[
                    "employee_id",
                    "name",
                    "department",
                    "designation",
                    "login_email",
                    "phone",
                    "rbac_role",
                    "rbac_label",
                    "status",
                ],
            )
            w.writeheader()
            labels = dict(ALL_ROLES)
            for r in roster:
                w.writerow(
                    {
                        "employee_id": r["employee_id"],
                        "name": r["name"],
                        "department": r["department"],
                        "designation": r["designation"],
                        "login_email": r["email"],
                        "phone": r["phone"],
                        "rbac_role": r["role"],
                        "rbac_label": labels.get(r["role"], "Directory only"),
                        "status": "eligible" if r["role"] else "directory_only",
                    }
                )
        print(f"wrote sanitized csv {args.fix_csv}")

    from sqlalchemy import create_engine, select
    from sqlalchemy.orm import sessionmaker

    from app.models import Campus

    engine = create_engine(url)
    SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, expire_on_commit=False)
    with SessionLocal() as db:
        campus = db.scalar(select(Campus).where(Campus.code == "QMIS-MDU"))
        if campus is None:
            print("Campus QMIS-MDU not found", file=sys.stderr)
            return 2
        result = replace_logins(db, campus=campus, roster=roster, dry_run=args.dry_run)

    all_creds = result["replaced"] + result["created"]
    summary = {
        "replaced": len(result["replaced"]),
        "created": len(result["created"]),
        "directorySkipped": result["directory_skipped"],
        "invalid": result["invalid"],
        "deactivatedOld": result["deactivated_old"],
        "reviewCount": len(result["review"]),
        "handoffCount": len(all_creds),
    }
    print(json.dumps(summary, indent=2))
    if result["review"]:
        print("review:")
        for line in result["review"][:40]:
            print(" ", line)
        if len(result["review"]) > 40:
            print(f"  … +{len(result['review']) - 40} more")

    if args.dry_run:
        print("Dry-run only — no passwords issued, no DB commit.")
        return 0

    if args.write_credentials:
        out = args.write_credentials.resolve()
        if "local" not in out.parts or "credentials" not in out.parts:
            print("Credential JSON must be under local/credentials/", file=sys.stderr)
            return 2
        write_credential_handoff(
            out,
            all_creds,
            note=(
                "Queen Mira staff logins replaced from Credential Prep CSV. "
                "Users must change password at first login. Transfer securely then delete this file."
            ),
        )
        print(f"wrote credentials json {out} count={len(all_creds)}")

    if args.write_xlsx:
        xlsx = args.write_xlsx.resolve()
        if "local" not in xlsx.parts or "credentials" not in xlsx.parts:
            print("Credential XLSX must be under local/credentials/", file=sys.stderr)
            return 2
        roster_by_id = {r["employee_id"]: r for r in roster}
        write_client_xlsx(xlsx, all_creds, roster_by_id)
        print(f"wrote credentials xlsx {xlsx} count={len(all_creds)}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
