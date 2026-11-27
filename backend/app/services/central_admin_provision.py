"""Create-missing-only provision for dedicated central Admin and Super Admin logins.

Rules:
* Never hardcode passwords — temps are generated at create time.
* Never reset passwords or change roles on existing users.
* Never create duplicates (match by normalized email).
* Super Admin remains non-creatable via Admin User Management API.
* Demo @qmis.edu seed accounts are untouched by this module.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.passwords import generate_temporary_password
from app.core.security import hash_password
from app.models import Campus, Role, User, UserProfile
from app.services.admin_users import _next_staff_code
from app.services.audit import write_audit
from app.services.staff_login_provision import NewCredential, write_credential_handoff

CENTRAL_ADMIN_ROLE = "admin"
CENTRAL_SUPERADMIN_ROLE = "superadmin"

_ACCOUNT_SPECS: tuple[tuple[str, str, str, str, str], ...] = (
    # (settings_attr, role_code, staff_prefix, first_name, last_name)
    ("central_admin_email", CENTRAL_ADMIN_ROLE, "ADM", "Central", "Admin"),
    ("central_superadmin_email", CENTRAL_SUPERADMIN_ROLE, "SAD", "Central", "SuperAdmin"),
)


@dataclass
class CentralAdminProvisionReport:
    inspected: int = 0
    new_accounts_created: int = 0
    existing_accounts_preserved: int = 0
    created: list[NewCredential] = field(default_factory=list)
    preserved: list[dict[str, Any]] = field(default_factory=list)
    review: list[str] = field(default_factory=list)


def central_account_targets() -> list[dict[str, str]]:
    """Normalized email + role targets from settings (no passwords)."""
    targets: list[dict[str, str]] = []
    for attr, role_code, prefix, first_name, last_name in _ACCOUNT_SPECS:
        email = str(getattr(settings, attr, "") or "").strip().lower()
        if not email or "@" not in email:
            continue
        targets.append(
            {
                "email": email,
                "role": role_code,
                "staff_prefix": prefix,
                "first_name": first_name,
                "last_name": last_name,
                "settings_attr": attr,
            }
        )
    return targets


def provision_central_admins(
    db: Session,
    *,
    campus: Campus,
    dry_run: bool = False,
    commit: bool = True,
) -> CentralAdminProvisionReport:
    """Create missing central Admin / Super Admin logins only."""
    report = CentralAdminProvisionReport()
    roles = {role.code: role for role in db.scalars(select(Role)).all()}
    for needed in (CENTRAL_ADMIN_ROLE, CENTRAL_SUPERADMIN_ROLE):
        if needed not in roles:
            report.review.append(f"Missing role definition: {needed}")
            return report

    for target in central_account_targets():
        report.inspected += 1
        email = target["email"]
        role_code = target["role"]
        role = roles[role_code]
        existing = db.scalar(select(User).where(User.email == email))
        if existing is not None:
            existing_role = db.get(Role, existing.role_id)
            existing_code = existing_role.code if existing_role else ""
            report.existing_accounts_preserved += 1
            report.preserved.append(
                {
                    "email": email,
                    "role": existing_code,
                    "want_role": role_code,
                    "active": bool(existing.is_active),
                    "must_change_password": bool(existing.must_change_password),
                    "role_match": existing_code == role_code,
                }
            )
            if existing_code != role_code:
                report.review.append(
                    f"{email} exists with role={existing_code!r}; want={role_code!r}. "
                    "Preserved unchanged (no auto remap / password reset)."
                )
            continue

        temporary = generate_temporary_password()
        if dry_run:
            report.new_accounts_created += 1
            report.created.append(
                NewCredential(
                    employee_id=f"CENTRAL-{role_code.upper()}",
                    name=f"{target['first_name']} {target['last_name']}",
                    role=role_code,
                    login_username=email,
                    temporary_password="(dry-run-not-issued)",
                    must_change_password=True,
                )
            )
            continue

        user = User(
            campus_id=campus.id,
            role_id=role.id,
            email=email,
            password_hash=hash_password(temporary),
            is_active=True,
            must_change_password=True,
        )
        db.add(user)
        db.flush()
        profile = UserProfile(
            user_id=user.id,
            campus_id=campus.id,
            staff_code=_next_staff_code(db, campus.id, target["staff_prefix"]),
            first_name=target["first_name"],
            middle_name="",
            last_name=target["last_name"],
            gender="",
            mobile_number="",
            extra={"source": "central_admin_provision"},
            created_by=None,
        )
        db.add(profile)
        write_audit(
            db,
            action="CENTRAL_ADMIN_PROVISIONED",
            entity_type="user",
            entity_id=str(user.id),
            campus_id=campus.id,
            details=f"role={role_code} email={email} create_missing_only",
        )
        report.new_accounts_created += 1
        report.created.append(
            NewCredential(
                employee_id=profile.staff_code,
                name=f"{profile.first_name} {profile.last_name}".strip(),
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


__all__ = [
    "CENTRAL_ADMIN_ROLE",
    "CENTRAL_SUPERADMIN_ROLE",
    "CentralAdminProvisionReport",
    "central_account_targets",
    "provision_central_admins",
    "write_credential_handoff",
]
