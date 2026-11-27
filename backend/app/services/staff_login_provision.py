"""Idempotent login provisioning for Queen Mira HR roster staff.

Creates User accounts only for eligible employees who do not already have one.
Never resets passwords, never changes roles on existing accounts, never sends
real email/WhatsApp, and never deletes or rewrites employee identity fields.
"""

from __future__ import annotations

import json
import re
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.passwords import generate_temporary_password
from app.core.security import hash_password, verify_password
from app.models import Campus, HrEmployee, Role, User
from app.services.audit import write_audit
from app.services.hr import _role_code
from app.services.staff_designation_map import map_role_from_designation

_EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
_OBJECT_RE = re.compile(r"\{[^{}]+\}")


@dataclass
class RosterEmployee:
    employee_code: str
    name: str
    email: str
    role: str
    department: str = ""
    designation: str = ""
    contact: str = ""
    status: str = "Active"
    employment_type: str = "Full Time"
    category: str = "Admin"


@dataclass
class NewCredential:
    employee_id: str
    name: str
    role: str
    login_username: str
    temporary_password: str
    must_change_password: bool = True


@dataclass
class ProvisionReport:
    inspected: int = 0
    existing_accounts_preserved: int = 0
    new_accounts_created: int = 0
    directory_only_skipped: int = 0
    invalid_identity_skipped: int = 0
    ambiguous: list[str] = field(default_factory=list)
    review: list[str] = field(default_factory=list)
    created: list[NewCredential] = field(default_factory=list)
    dry_run: bool = False


def load_roster_from_hr_seed(path: Path) -> list[RosterEmployee]:
    """Parse SEED.employees objects from hrSeed.js without executing JavaScript."""
    text = path.read_text(encoding="utf-8")
    marker = "employees: ["
    start = text.find(marker)
    if start < 0:
        raise ValueError(f"No employees array found in {path}")
    depth = 0
    i = start + len(marker) - 1
    end = None
    while i < len(text):
        ch = text[i]
        if ch == "[":
            depth += 1
        elif ch == "]":
            depth -= 1
            if depth == 0:
                end = i
                break
        i += 1
    if end is None:
        raise ValueError(f"Unclosed employees array in {path}")
    block = text[start + len(marker) : end]
    rows: list[RosterEmployee] = []
    for match in _OBJECT_RE.finditer(block):
        raw = match.group(0)
        # Convert JS object literal keys to JSON.
        jsonish = re.sub(r"(\w+):", r'"\1":', raw)
        jsonish = jsonish.replace("'", '"')
        try:
            item = json.loads(jsonish)
        except json.JSONDecodeError:
            continue
        code = str(item.get("id") or "").strip()
        if not code.startswith("EMP-QMIS-"):
            continue
        rows.append(
            RosterEmployee(
                employee_code=code,
                name=str(item.get("name") or "").strip(),
                email=str(item.get("email") or "").strip().lower(),
                role=str(item.get("role") or "").strip(),
                department=str(item.get("department") or "").strip(),
                designation=str(item.get("designation") or "").strip(),
                contact=str(item.get("contact") or "").strip(),
                status=str(item.get("status") or "Active").strip() or "Active",
                employment_type=str(item.get("employmentType") or "Full Time").strip(),
                category=str(item.get("category") or "Admin").strip(),
            )
        )
    rows.sort(key=lambda row: row.employee_code)
    return rows


def is_valid_login_email(email: str) -> bool:
    return bool(email and _EMAIL_RE.match(email.strip().lower()))


def split_name(full_name: str) -> tuple[str, str]:
    parts = [part for part in str(full_name or "").strip().split() if part]
    if not parts:
        return ("Staff", "-")
    if len(parts) == 1:
        return (parts[0], "-")
    return (parts[0], " ".join(parts[1:]))


def provision_missing_staff_logins(
    db: Session,
    *,
    campus: Campus,
    roster: list[RosterEmployee],
    dry_run: bool = False,
    commit: bool = True,
) -> ProvisionReport:
    """Ensure employee rows exist (insert-only) and create missing User logins.

    Existing users: link ``user_id`` if needed; never change password or role.
    Directory-only (empty/unmapped role): no login.
    """
    report = ProvisionReport(dry_run=dry_run)
    report.inspected = len(roster)

    roles_by_code = {role.code: role for role in db.scalars(select(Role)).all()}
    seen_emails: dict[str, str] = {}

    for item in roster:
        email = (item.email or "").strip().lower()
        if email in seen_emails and seen_emails[email] != item.employee_code:
            report.ambiguous.append(
                f"{item.employee_code}: duplicate roster email {email} also on {seen_emails[email]}"
            )
            continue
        if email:
            seen_emails[email] = item.employee_code

        # Prefer explicit roster role; otherwise map from designation (partner procedure).
        role_code = _role_code(item.role) if (item.role or "").strip() else None
        if role_code is None and (item.designation or "").strip():
            mapped = map_role_from_designation(item.designation)
            role_code = mapped or None
        if role_code is None:
            report.directory_only_skipped += 1
            if item.email and not is_valid_login_email(item.email):
                report.review.append(
                    f"{item.employee_code}: directory-only and email is not a valid login address ({item.email!r})"
                )
            continue

        if not is_valid_login_email(email):
            report.invalid_identity_skipped += 1
            report.review.append(
                f"{item.employee_code}: eligible role {role_code} but email is not a valid login address ({item.email!r})"
            )
            continue

        if role_code not in roles_by_code:
            report.invalid_identity_skipped += 1
            report.review.append(f"{item.employee_code}: role code {role_code!r} is not seeded in RBAC")
            continue

        by_code = db.scalar(
            select(HrEmployee).where(
                HrEmployee.campus_id == campus.id,
                HrEmployee.employee_code == item.employee_code,
            )
        )
        by_email = db.scalar(select(HrEmployee).where(HrEmployee.email == email))

        if by_code is not None and by_email is not None and by_code.id != by_email.id:
            report.ambiguous.append(
                f"{item.employee_code}: employee_code and email point at different HR rows "
                f"({by_code.employee_code} vs {by_email.employee_code})"
            )
            continue

        if by_email is not None and by_code is None and by_email.employee_code != item.employee_code:
            report.ambiguous.append(
                f"{item.employee_code}: email {email} already used by {by_email.employee_code}; refusing to invent a second identity"
            )
            continue

        row = by_code or by_email
        if row is None:
            if dry_run:
                # Pretend create for count purposes after user check below.
                first, last = split_name(item.name)
                row = HrEmployee(
                    campus_id=campus.id,
                    employee_code=item.employee_code,
                    first_name=first,
                    last_name=last,
                    email=email,
                    phone=item.contact or None,
                    department=item.department or None,
                    designation=item.designation or None,
                    role_title=role_code,
                    status=item.status,
                    employment_type=item.employment_type,
                    category=item.category,
                )
            else:
                first, last = split_name(item.name)
                row = HrEmployee(
                    campus_id=campus.id,
                    employee_code=item.employee_code,
                    first_name=first,
                    last_name=last,
                    email=email,
                    phone=item.contact or None,
                    department=item.department or None,
                    designation=item.designation or None,
                    role_title=role_code,
                    status=item.status,
                    employment_type=item.employment_type,
                    category=item.category,
                )
                db.add(row)
                db.flush()
        else:
            # Preserve identity. Only fill blank role_title so eligible staff can provision.
            if not (row.role_title or "").strip():
                if not dry_run:
                    row.role_title = role_code
            elif _role_code(row.role_title or "") != role_code:
                report.review.append(
                    f"{item.employee_code}: existing role_title {row.role_title!r} differs from roster "
                    f"{role_code!r}; left unchanged"
                )

        existing_user = db.scalar(select(User).where(User.email == email))
        if existing_user is not None:
            report.existing_accounts_preserved += 1
            if row.user_id is None and not dry_run:
                row.user_id = existing_user.id
                db.flush()
            elif row.user_id is not None and row.user_id != existing_user.id:
                report.ambiguous.append(
                    f"{item.employee_code}: linked user_id does not match User for {email}"
                )
            continue

        if row.user_id is not None:
            linked = db.get(User, row.user_id)
            if linked is not None:
                report.existing_accounts_preserved += 1
                continue
            report.review.append(
                f"{item.employee_code}: dangling user_id; will create a new login if not dry-run"
            )
            if not dry_run:
                row.user_id = None

        temporary = generate_temporary_password()
        if dry_run:
            report.new_accounts_created += 1
            report.created.append(
                NewCredential(
                    employee_id=item.employee_code,
                    name=item.name,
                    role=role_code,
                    login_username=email,
                    temporary_password="(dry-run-not-issued)",
                    must_change_password=True,
                )
            )
            continue

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
            details=f"{item.employee_code} role={role_code} email={email}",
        )
        report.new_accounts_created += 1
        report.created.append(
            NewCredential(
                employee_id=item.employee_code,
                name=item.name,
                role=role_code,
                login_username=email,
                temporary_password=temporary,
                must_change_password=True,
            )
        )

    if commit and not dry_run:
        db.commit()
    elif dry_run:
        db.rollback()
    else:
        db.flush()
    return report


def write_credential_handoff(path: Path, credentials: list[NewCredential], *, note: str) -> None:
    """Write one-time handoff file. Caller must use a gitignored path."""
    path.parent.mkdir(parents=True, exist_ok=True)
    payload: dict[str, Any] = {
        "warning": (
            "ONE-TIME CREDENTIAL HANDOFF. Transfer only through an approved secure channel. "
            "Delete this file after distribution. Do not commit, email broadly, or paste into tickets."
        ),
        "note": note,
        "count": len(credentials),
        "accounts": [
            {
                "employeeId": row.employee_id,
                "name": row.name,
                "role": row.role,
                "loginUsername": row.login_username,
                "temporaryPassword": row.temporary_password,
                "mustChangePassword": row.must_change_password,
            }
            for row in credentials
        ],
    }
    path.write_text(json.dumps(payload, indent=2), encoding="utf-8")
    try:
        path.chmod(0o600)
    except OSError:
        pass


def assert_password_not_stored_plaintext(db: Session, email: str, temporary: str) -> None:
    user = db.scalar(select(User).where(User.email == email.lower()))
    if user is None:
        raise AssertionError("user missing")
    if temporary in (user.password_hash or ""):
        raise AssertionError("temporary password stored in plaintext hash field")
    if not verify_password(temporary, user.password_hash):
        raise AssertionError("hash does not verify temporary password")


def campus_by_code(db: Session, code: str = "QMIS-MDU") -> Campus | None:
    return db.scalar(select(Campus).where(Campus.code == code))
