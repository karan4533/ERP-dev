"""Create temporary logins for the 20 directory-only EMP-QMIS staff.

Best-effort temporary RBAC roles (refine later). Does not grant superadmin.
Invalid emails get a temporary @queenmira.com login until the real email is fixed.

  python scripts/provision_remaining_directory_logins.py --dry-run --i-understand-live
  python scripts/provision_remaining_directory_logins.py --i-understand-live
"""

from __future__ import annotations

import argparse
import csv
import json
import os
import sys
from datetime import datetime, timezone
from pathlib import Path

BACKEND_ROOT = Path(__file__).resolve().parents[1]
REPO_ROOT = BACKEND_ROOT.parent
sys.path.insert(0, str(BACKEND_ROOT))

from app.permissions.matrix import ALL_ROLES  # noqa: E402
from app.services.staff_designation_map import primary_login_email  # noqa: E402
from app.services.staff_login_provision import (  # noqa: E402
    NewCredential,
    is_valid_login_email,
    split_name,
    write_credential_handoff,
)
from scripts.replace_staff_logins_from_csv import (  # noqa: E402
    ensure_roles_and_permissions,
    write_client_xlsx,
)

DEFAULT_CSV = REPO_ROOT / "erp complete documentation" / "QMIS_Staff_Credential_Prep_sanitized.csv"
HANDOFF_JSON = REPO_ROOT / "local" / "credentials" / "queen-mira-staff-logins-client.json"
HANDOFF_XLSX = REPO_ROOT / "local" / "credentials" / "Queen_Mira_Staff_Login_Credentials_CLIENT.xlsx"
HANDOFF_REMAINING_JSON = REPO_ROOT / "local" / "credentials" / "queen-mira-staff-logins-remaining-20.json"
HANDOFF_REMAINING_XLSX = REPO_ROOT / "local" / "credentials" / "Queen_Mira_Staff_Login_Credentials_REMAINING_20.xlsx"

ROLE_LABELS = dict(ALL_ROLES)

# Temporary only — refine with client later. Never map EA/PA to superadmin/principal.
_TEMP_RULES: list[tuple[str, str]] = [
    ("hk supervisor", "housekeepingmanager"),
    ("housekeep", "housekeepingmanager"),
    ("maintenance", "maintenancemanager"),
    ("control room", "cctv"),
    ("file room", "fileroom"),
    ("stores", "stationerystoremanager"),
    ("cyber studio", "itsupportmanager"),
    ("digital marketing", "prm"),
    ("admin manager", "jointdirectorassistant"),
    ("executive assistant", "jointdirectorassistant"),
    ("ea to ", "jointdirectorassistant"),
    ("pa to ", "jointdirectorassistant"),
    ("internship", "teacher"),
    ("l & od", "hr"),
    ("consultant", "hr"),
]
_DEFAULT_TEMP_ROLE = "jointdirectorassistant"


def temp_role_for(designation: str) -> str:
    d = (designation or "").lower()
    for token, role in _TEMP_RULES:
        if token in d:
            return role
    return _DEFAULT_TEMP_ROLE


def load_dotenv_url() -> str:
    vals: dict[str, str] = {}
    for line in (BACKEND_ROOT / ".env").read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        vals[key.strip()] = value.strip().strip('"').strip("'")
    url = vals.get("DATABASE_URL") or ""
    if "postgres" not in url.lower():
        raise SystemExit("Expected Postgres DATABASE_URL in backend/.env")
    return url


def load_directory_rows(path: Path) -> list[dict]:
    rows: list[dict] = []
    with path.open(encoding="utf-8-sig", newline="") as fh:
        for raw in csv.DictReader(fh):
            emp = (raw.get("employee_id") or "").strip()
            if not emp.startswith("EMP-QMIS-"):
                continue
            status = (raw.get("status") or "").strip().lower()
            role = (raw.get("rbac_role") or "").strip()
            if status not in {"directory_only", ""} and role:
                continue
            if status != "directory_only" and role:
                continue
            designation = (raw.get("designation") or "").strip()
            email_raw = (raw.get("login_email") or "").strip()
            email = primary_login_email(email_raw)
            email_note = ""
            if not is_valid_login_email(email):
                # Temporary synthetic login until client supplies a real mailbox.
                email = f"{emp.lower()}@queenmira.com"
                email_note = f"synthetic_email_was:{email_raw!r}"
            rows.append(
                {
                    "employee_id": emp,
                    "name": (raw.get("name") or "").strip(),
                    "department": (raw.get("department") or "").strip() or "Admin",
                    "designation": designation,
                    "email": email.lower(),
                    "phone": (raw.get("phone") or "").strip(),
                    "role": temp_role_for(designation),
                    "email_note": email_note,
                    "temporary": True,
                }
            )
    by_id = {r["employee_id"]: r for r in rows}
    return [by_id[k] for k in sorted(by_id)]


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--csv", type=Path, default=DEFAULT_CSV)
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--i-understand-live", action="store_true", required=True)
    args = parser.parse_args()

    url = load_dotenv_url()
    os.environ["DATABASE_URL"] = url
    os.environ["SMTP_HOST"] = ""
    os.environ["WHATSAPP_API_URL"] = ""
    os.environ["WHATSAPP_API_TOKEN"] = ""
    os.environ["INTEGRATIONS_MODE"] = ""

    roster = load_directory_rows(args.csv)
    print(
        json.dumps(
            {
                "count": len(roster),
                "dryRun": args.dry_run,
                "generatedAt": datetime.now(timezone.utc).isoformat(),
                "plan": [
                    {
                        "employeeId": r["employee_id"],
                        "name": r["name"],
                        "designation": r["designation"],
                        "tempRole": r["role"],
                        "login": r["email"],
                        "note": r["email_note"],
                    }
                    for r in roster
                ],
            },
            indent=2,
        )
    )
    if len(roster) != 20:
        print(f"WARNING: expected 20 directory rows, got {len(roster)}", file=sys.stderr)

    from sqlalchemy import create_engine, select
    from sqlalchemy.orm import sessionmaker

    from app.core.passwords import generate_temporary_password
    from app.core.security import hash_password
    from app.models import Campus, HrEmployee, User, UserProfile
    from app.services.audit import write_audit

    engine = create_engine(url)
    SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, expire_on_commit=False)
    created: list[NewCredential] = []
    replaced: list[NewCredential] = []
    review: list[str] = []

    with SessionLocal() as db:
        campus = db.scalar(select(Campus).where(Campus.code == "QMIS-MDU"))
        if campus is None:
            print("Campus QMIS-MDU missing", file=sys.stderr)
            return 2
        roles_by_code = ensure_roles_and_permissions(db)

        for item in roster:
            role_code = item["role"]
            email = item["email"]
            if role_code not in roles_by_code:
                review.append(f"{item['employee_id']}: missing role {role_code}")
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
                    f"{item['employee_id']}: HR conflict {by_code.employee_code} vs {by_email.employee_code}"
                )
                continue

            first, last = split_name(item["name"])
            temporary = generate_temporary_password()
            existing_user = db.scalar(select(User).where(User.email == email))

            if args.dry_run:
                cred = NewCredential(
                    employee_id=item["employee_id"],
                    name=item["name"],
                    role=role_code,
                    login_username=email,
                    temporary_password="(dry-run-not-issued)",
                    must_change_password=True,
                )
                (replaced if existing_user else created).append(cred)
                continue

            row = by_code or by_email
            if row is None:
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
            else:
                row.first_name = first
                row.last_name = last
                row.email = email
                row.phone = item["phone"] or row.phone
                row.department = item["department"] or row.department
                row.designation = item["designation"] or row.designation
                row.role_title = role_code
                row.status = "Active"
                db.flush()

            if existing_user is not None:
                profile = db.scalar(select(UserProfile).where(UserProfile.user_id == existing_user.id))
                if profile is not None:
                    db.delete(profile)
                    db.flush()
                existing_user.role_id = roles_by_code[role_code].id
                existing_user.password_hash = hash_password(temporary)
                existing_user.is_active = True
                existing_user.must_change_password = True
                existing_user.campus_id = campus.id
                db.flush()
                row.user_id = existing_user.id
                write_audit(
                    db,
                    action="STAFF_LOGIN_CREDENTIALS_REPLACED",
                    entity_type="hr_employee",
                    entity_id=str(row.id),
                    campus_id=campus.id,
                    details=f"{item['employee_id']} TEMP role={role_code} email={email}",
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
                    details=f"{item['employee_id']} TEMP role={role_code} email={email}",
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

        if args.dry_run:
            db.rollback()
        else:
            db.commit()

    all_creds = replaced + created
    print(
        json.dumps(
            {
                "replaced": len(replaced),
                "created": len(created),
                "review": review,
                "handoff": len(all_creds),
            },
            indent=2,
        )
    )
    if args.dry_run:
        print("Dry-run only.")
        return 0

    note = (
        "TEMPORARY directory-staff logins (20). Roles are best-effort placeholders — refine later. "
        "Must change password at first login. Transfer securely then delete."
    )
    write_credential_handoff(HANDOFF_REMAINING_JSON, all_creds, note=note)
    roster_by_id = {r["employee_id"]: r for r in roster}
    write_client_xlsx(HANDOFF_REMAINING_XLSX, all_creds, roster_by_id)

    # Merge into full client handoff JSON if present.
    if HANDOFF_JSON.is_file():
        payload = json.loads(HANDOFF_JSON.read_text(encoding="utf-8"))
        existing = {
            a["employeeId"]: a
            for a in payload.get("accounts", [])
            if str(a.get("employeeId", "")).startswith("EMP-QMIS-")
        }
        for cred in all_creds:
            existing[cred.employee_id] = {
                "employeeId": cred.employee_id,
                "name": cred.name,
                "role": cred.role,
                "loginUsername": cred.login_username,
                "temporaryPassword": cred.temporary_password,
                "mustChangePassword": True,
                "temporaryRolePendingRefine": True,
            }
        merged = [existing[k] for k in sorted(existing)]
        payload["accounts"] = merged
        payload["count"] = len(merged)
        payload["note"] = (
            "Queen Mira staff logins (100 mapped + 20 temporary directory roles). "
            "Users must change password at first login."
        )
        payload["updatedAt"] = datetime.now(timezone.utc).isoformat()
        HANDOFF_JSON.write_text(json.dumps(payload, indent=2), encoding="utf-8")
        # Full XLSX refresh
        full_roster = {**roster_by_id}
        # keep designation from sanitized for the first 100 if possible
        if DEFAULT_CSV.is_file():
            with DEFAULT_CSV.open(encoding="utf-8-sig", newline="") as fh:
                for raw in csv.DictReader(fh):
                    eid = (raw.get("employee_id") or "").strip()
                    if eid:
                        full_roster.setdefault(
                            eid,
                            {
                                "designation": (raw.get("designation") or "").strip(),
                            },
                        )
                        full_roster[eid]["designation"] = (raw.get("designation") or "").strip()
        full_creds = [
            NewCredential(
                employee_id=a["employeeId"],
                name=a["name"],
                role=a["role"],
                login_username=a["loginUsername"],
                temporary_password=a["temporaryPassword"],
                must_change_password=True,
            )
            for a in merged
        ]
        write_client_xlsx(HANDOFF_XLSX, full_creds, full_roster)
        print(f"merged full handoff -> {HANDOFF_JSON} count={len(merged)}")
        print(f"merged full xlsx -> {HANDOFF_XLSX}")

    print(f"wrote {HANDOFF_REMAINING_JSON}")
    print(f"wrote {HANDOFF_REMAINING_XLSX}")

    # Update sanitized CSV roles for these 20 so the pack stays consistent.
    if args.csv.is_file():
        updated_rows = []
        by_emp = {r["employee_id"]: r for r in roster}
        with args.csv.open(encoding="utf-8-sig", newline="") as fh:
            reader = csv.DictReader(fh)
            fieldnames = reader.fieldnames or []
            for raw in reader:
                emp = (raw.get("employee_id") or "").strip()
                if emp in by_emp:
                    item = by_emp[emp]
                    raw["rbac_role"] = item["role"]
                    raw["rbac_label"] = ROLE_LABELS.get(item["role"], item["role"])
                    raw["status"] = "eligible_temporary"
                    raw["login_email"] = item["email"]
                updated_rows.append(raw)
        with args.csv.open("w", encoding="utf-8", newline="") as fh:
            writer = csv.DictWriter(fh, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(updated_rows)
        print(f"updated roles in {args.csv}")

    return 0 if not review else 1


if __name__ == "__main__":
    raise SystemExit(main())
