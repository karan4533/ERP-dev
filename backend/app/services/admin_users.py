"""Administrator user management (Admin > RBAC > User Creation / Roles).

Rules enforced here, not in the browser:

* Only roles an actor may *create* can be created, and only users holding such a role can be
  changed afterwards. An Administrator can therefore never create, edit, deactivate or reset an
  Administrator, Super Admin, HR, Finance, student or parent account.
* Profile fields, email, status and creatable roles may be edited. Role changes are limited to
  roles the actor is allowed to create. Staff codes stay unchanged when the role changes.
* Every new or reset login gets a temporary password and ``must_change_password``. Passwords are
  never written to the audit log or to the profile table.
* Accounts are deactivated, never deleted: history (audit, tasks, leave) keeps pointing at them.
"""

from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy import func, or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.passwords import generate_temporary_password, password_problems
from app.core.security import hash_password
from app.models import HrEmployee, Permission, Role, RolePermission, User, UserProfile
from app.permissions.matrix import PERMISSIONS
from app.services.audit import write_audit
from app.services.errors import fail

# (role code, label, staff-code prefix). Mirrors the frontend's CREATABLE_ROLE_OPTIONS.
# Campus Admin may create these operational / academic logins. Privileged roles
# (admin, superadmin, hr, accounthead, student, parent, auditors, JD) stay out.
STAFF_ROLES: list[tuple[str, str, str]] = [
    ("principal", "Principal", "PRC"),
    ("prm", "PRM", "PRM"),
    ("teacher", "Teacher", "TEA"),
    ("coordinator", "Coordinator", "CRD"),
    ("librarian", "Librarian", "LIB"),
    ("gatekeepermanager", "Gate Keeper Manager", "GKM"),
    ("gatekeeper", "Gate Keeper", "GKP"),
    ("transportmanager", "Transport Manager", "TRM"),
    ("driver", "Driver", "DRV"),
    ("canteenmanager", "Canteen Manager", "CTN"),
    ("itsupportmanager", "IT Support Manager", "ITM"),
    ("stationerystoremanager", "Stationery Store Manager", "SSM"),
    ("housekeepingmanager", "Housekeeping Manager", "HKM"),
]
_ADMIN_ROLE: tuple[str, str, str] = ("admin", "Administrator", "ADM")

_ROLE_INFO = {code: (label, prefix) for code, label, prefix in [*STAFF_ROLES, _ADMIN_ROLE]}

# Optional profile fields kept in ``UserProfile.extra``. Anything else a client sends is ignored.
DETAIL_FIELDS = (
    "alternativeMobileNumber",
    "street",
    "city",
    "state",
    "country",
    "pincode",
    "religion",
    "caste",
    "dateOfBirth",
    "bloodGroup",
    "height",
    "weight",
    "medicalHistory",
    "fatherName",
    "motherName",
    "familyContactNumber",
    "qualification",
    "yearsOfExperience",
    "previousSchool",
    "joiningDate",
    "username",
    "className",
    "section",
)
_MAX_TEXT = 500


def creatable_roles_for(actor_role: str) -> list[str]:
    """Role codes the actor may create and afterwards manage."""
    codes = [code for code, _, _ in STAFF_ROLES]
    if actor_role == "superadmin":
        codes.append(_ADMIN_ROLE[0])
    return codes


def creatable_role_options(db: Session, actor: User) -> list[dict]:
    allowed = set(creatable_roles_for(_actor_role(db, actor)))
    return [{"role": code, "label": label} for code, (label, _) in _ROLE_INFO.items() if code in allowed]


def _clean_text(value) -> str:
    return str(value).strip()[:_MAX_TEXT] if value is not None else ""


def _clean_details(details: dict) -> dict:
    cleaned = {}
    for key in DETAIL_FIELDS:
        text = _clean_text(details.get(key))
        if text:
            cleaned[key] = text
    return cleaned


def _full_name(profile: UserProfile) -> str:
    return " ".join(part for part in (profile.first_name, profile.middle_name, profile.last_name) if part)


def _serialize(user: User, profile: UserProfile, role: Role, **extra) -> dict:
    label = _ROLE_INFO.get(role.code, (role.name, ""))[0]
    return {
        "id": str(user.id),
        "staffCode": profile.staff_code,
        "name": _full_name(profile),
        "firstName": profile.first_name,
        "middleName": profile.middle_name,
        "lastName": profile.last_name,
        "email": user.email,
        "role": role.code,
        "roleLabel": label,
        "status": "Active" if user.is_active else "Inactive",
        "gender": profile.gender,
        "mobileNumber": profile.mobile_number,
        "details": dict(profile.extra or {}),
        "mustChangePassword": user.must_change_password,
        "createdAt": profile.created_at.isoformat() if profile.created_at else None,
        **extra,
    }


def _next_staff_code(db: Session, campus_id, prefix: str) -> str:
    codes = db.scalars(
        select(UserProfile.staff_code).where(
            UserProfile.campus_id == campus_id, UserProfile.staff_code.like(f"{prefix}-%")
        )
    ).all()
    highest = 0
    for code in codes:
        tail = code.split("-", 1)[1]
        if tail.isdigit():
            highest = max(highest, int(tail))
    return f"{prefix}-{highest + 1:04d}"


def _actor_role(db: Session, actor: User) -> str:
    role = db.get(Role, actor.role_id)
    return role.code if role else ""


_HR_INACTIVE = {"Inactive", "Relieved", "Terminated"}


def _sync_hr_status(db: Session, actor: User, user: User, active: bool) -> bool:
    """Keep a linked HR employee record in step with the login's active flag.

    HR's bulk save derives login activity from the HR status (``_sync_login_active``). If the HR
    record stayed "Active" after an administrator deactivated the login, the next HR save would
    silently switch the login back on. The link is by email, the same fallback HR itself uses
    (``hr._own_employee``); the ``user_id`` column is not compared because it is a different type
    in some existing databases. "Relieved" and "Terminated" are HR decisions and are never
    overwritten, and activation only reverses an "Inactive" record. Returns True if HR changed.
    """
    employee = db.scalar(
        select(HrEmployee).where(HrEmployee.campus_id == actor.campus_id, HrEmployee.email == user.email)
    )
    if employee is None:
        return False
    current = employee.status or "Active"
    if active and current == "Inactive":
        employee.status = "Active"
    elif not active and current not in _HR_INACTIVE:
        employee.status = "Inactive"
    else:
        return False
    write_audit(
        db,
        action="HR_EMPLOYEE_STATUS_SYNCED",
        entity_type="hr_employee",
        entity_id=str(employee.id),
        actor_id=actor.id,
        campus_id=actor.campus_id,
        details=f"{employee.employee_code} {current} -> {employee.status} (login {'activated' if active else 'deactivated'})",
    )
    return True


def _load_managed(db: Session, actor: User, user_id: str) -> tuple[User, UserProfile, Role]:
    """Load a user the actor is allowed to manage, or raise 404 / 403."""
    try:
        uid = UUID(str(user_id))
    except ValueError:
        fail(404, "user_not_found", "User not found.")
    row = db.execute(
        select(User, UserProfile, Role)
        .join(UserProfile, UserProfile.user_id == User.id)
        .join(Role, Role.id == User.role_id)
        .where(User.id == uid, User.campus_id == actor.campus_id)
    ).first()
    if row is None:
        fail(404, "user_not_found", "User not found.")
    user, profile, role = row
    if role.code not in creatable_roles_for(_actor_role(db, actor)):
        fail(403, "forbidden", "You cannot manage users with this role.")
    return user, profile, role


def create_user(
    db: Session,
    actor: User,
    *,
    role_code: str,
    first_name: str,
    middle_name: str,
    last_name: str,
    email: str,
    gender: str,
    mobile_number: str,
    status: str,
    password: str | None,
    details: dict,
) -> dict:
    actor_role = _actor_role(db, actor)
    if role_code not in creatable_roles_for(actor_role):
        fail(403, "role_not_allowed", "You cannot create users with this role.")
    first_name, last_name = _clean_text(first_name), _clean_text(last_name)
    if not first_name:
        fail(400, "first_name_required", "First name is required.")
    if not last_name:
        fail(400, "last_name_required", "Last name is required.")
    if not _clean_text(gender):
        fail(400, "gender_required", "Gender is required.")
    normalized_email = email.strip().lower()
    if db.scalar(select(User.id).where(User.email == normalized_email)) is not None:
        fail(409, "email_exists", "A user with this email already exists.")
    role = db.scalar(select(Role).where(Role.code == role_code))
    if role is None:
        fail(400, "role_unavailable", "That role is not configured.")

    if password:
        problems = password_problems(password, email=normalized_email)
        if problems:
            fail(400, "weak_password", "Password must " + "; ".join(problems) + ".")
        chosen, generated = password, False
    else:
        chosen, generated = generate_temporary_password(), True

    prefix = _ROLE_INFO[role_code][1]
    user = User(
        campus_id=actor.campus_id,
        role_id=role.id,
        email=normalized_email,
        password_hash=hash_password(chosen),
        is_active=(status != "Inactive"),
        must_change_password=True,
    )
    db.add(user)
    db.flush()
    profile = UserProfile(
        user_id=user.id,
        campus_id=actor.campus_id,
        staff_code=_next_staff_code(db, actor.campus_id, prefix),
        first_name=first_name,
        middle_name=_clean_text(middle_name),
        last_name=last_name,
        gender=_clean_text(gender),
        mobile_number=_clean_text(mobile_number),
        extra=_clean_details(details),
        created_by=actor.id,
    )
    db.add(profile)
    try:
        db.flush()
    except IntegrityError:
        # Two administrators creating the same role at once can claim the same next staff code
        # (or the same email). Nothing was committed, so the caller can simply retry.
        db.rollback()
        fail(409, "user_conflict", "Could not create the user because of a concurrent change. Please try again.")

    write_audit(
        db,
        action="admin.user.create",
        entity_type="user",
        entity_id=str(user.id),
        actor_id=actor.id,
        campus_id=actor.campus_id,
        details=f"{profile.staff_code} role={role_code} email={normalized_email} active={user.is_active}",
    )
    db.commit()
    db.refresh(user)
    db.refresh(profile)
    return _serialize(user, profile, role, temporaryPassword=chosen if generated else None)


def list_users(
    db: Session,
    actor: User,
    *,
    role: str | None,
    status: str | None,
    q: str | None,
    limit: int,
    offset: int,
) -> list[dict]:
    stmt = (
        select(User, UserProfile, Role)
        .join(UserProfile, UserProfile.user_id == User.id)
        .join(Role, Role.id == User.role_id)
        .where(User.campus_id == actor.campus_id)
        .order_by(UserProfile.created_at.desc(), UserProfile.staff_code)
        .limit(limit)
        .offset(offset)
    )
    if role:
        stmt = stmt.where(Role.code == role)
    if status in {"Active", "Inactive"}:
        stmt = stmt.where(User.is_active == (status == "Active"))
    if q and q.strip():
        like = f"%{q.strip().lower()}%"
        stmt = stmt.where(
            or_(
                func.lower(User.email).like(like),
                func.lower(UserProfile.staff_code).like(like),
                func.lower(UserProfile.first_name).like(like),
                func.lower(UserProfile.last_name).like(like),
            )
        )
    return [_serialize(u, p, r) for u, p, r in db.execute(stmt).all()]


def get_user(db: Session, actor: User, user_id: str) -> dict:
    user, profile, role = _load_managed(db, actor, user_id)
    return _serialize(user, profile, role)


def update_user(db: Session, actor: User, user_id: str, changes: dict) -> dict:
    user, profile, role = _load_managed(db, actor, user_id)
    audit_bits: list[str] = []
    if user.id == actor.id:
        fail(403, "forbidden", "You cannot change your own account here.")

    actor_role = _actor_role(db, actor)
    allowed_roles = set(creatable_roles_for(actor_role))

    if "email" in changes and changes["email"] is not None:
        normalized_email = str(changes["email"]).strip().lower()
        if not normalized_email:
            fail(400, "email_required", "Email cannot be empty.")
        if normalized_email != user.email:
            conflict = db.scalar(
                select(User.id).where(User.email == normalized_email, User.id != user.id)
            )
            if conflict is not None:
                fail(409, "email_exists", "A user with this email already exists.")
            # Keep a linked HR employee row in step when the login email changes.
            hr_row = db.scalar(
                select(HrEmployee).where(
                    HrEmployee.campus_id == actor.campus_id,
                    HrEmployee.email == user.email,
                )
            )
            old_email = user.email
            user.email = normalized_email
            if hr_row is not None:
                hr_row.email = normalized_email
                audit_bits.append("hr_email_synced")
            audit_bits.append(f"email={old_email}->{normalized_email}")

    if "role" in changes and changes["role"]:
        role_code = str(changes["role"]).strip()
        if role_code not in allowed_roles:
            fail(403, "role_not_allowed", "You cannot assign users this role.")
        if role_code != role.code:
            next_role = db.scalar(select(Role).where(Role.code == role_code))
            if next_role is None:
                fail(400, "role_unavailable", "That role is not configured.")
            user.role_id = next_role.id
            role = next_role
            audit_bits.append(f"role={role_code}")

    for field, attr in (("firstName", "first_name"), ("lastName", "last_name")):
        if field in changes:
            value = _clean_text(changes[field])
            if not value:
                fail(400, f"{'first' if field == 'firstName' else 'last'}_name_required", "Name cannot be empty.")
            setattr(profile, attr, value)
            audit_bits.append(field)
    if "middleName" in changes:
        profile.middle_name = _clean_text(changes["middleName"])
        audit_bits.append("middleName")
    if "gender" in changes:
        value = _clean_text(changes["gender"])
        if not value:
            fail(400, "gender_required", "Gender is required.")
        profile.gender = value
        audit_bits.append("gender")
    if "mobileNumber" in changes:
        profile.mobile_number = _clean_text(changes["mobileNumber"])
        audit_bits.append("mobileNumber")

    detail_changes = {key: changes[key] for key in DETAIL_FIELDS if key in changes}
    if detail_changes:
        merged = dict(profile.extra or {})
        for key, value in detail_changes.items():
            text = _clean_text(value)
            if text:
                merged[key] = text
            else:
                merged.pop(key, None)
        profile.extra = merged  # reassign so the JSON change is tracked
        audit_bits.extend(sorted(detail_changes))

    action = "admin.user.update"
    if "status" in changes:
        wanted = changes["status"] == "Active"
        if wanted != user.is_active:
            user.is_active = wanted
            action = "admin.user.activate" if wanted else "admin.user.deactivate"
            audit_bits.append(f"status={'Active' if wanted else 'Inactive'}")
            if _sync_hr_status(db, actor, user, wanted):
                audit_bits.append("hr_status_synced")

    profile.updated_at = datetime.now(timezone.utc)
    write_audit(
        db,
        action=action,
        entity_type="user",
        entity_id=str(user.id),
        actor_id=actor.id,
        campus_id=actor.campus_id,
        details=f"{profile.staff_code} " + ", ".join(audit_bits) if audit_bits else profile.staff_code,
    )
    db.commit()
    db.refresh(user)
    db.refresh(profile)
    return _serialize(user, profile, role)


def reset_password(db: Session, actor: User, user_id: str) -> dict:
    user, profile, role = _load_managed(db, actor, user_id)
    if user.id == actor.id:
        fail(403, "forbidden", "Use Change Password for your own account.")
    temporary = generate_temporary_password()
    user.password_hash = hash_password(temporary)
    user.must_change_password = True
    write_audit(
        db,
        action="admin.user.reset_password",
        entity_type="user",
        entity_id=str(user.id),
        actor_id=actor.id,
        campus_id=actor.campus_id,
        details=profile.staff_code,
    )
    db.commit()
    db.refresh(user)
    return _serialize(user, profile, role, temporaryPassword=temporary)


# --- roles (read-only) -------------------------------------------------------------------


def list_roles(db: Session, actor: User) -> list[dict]:
    creatable = set(creatable_roles_for(_actor_role(db, actor)))
    user_counts = dict(
        db.execute(
            select(User.role_id, func.count(User.id)).where(User.campus_id == actor.campus_id).group_by(User.role_id)
        ).all()
    )
    perm_counts = dict(
        db.execute(select(RolePermission.role_id, func.count(RolePermission.id)).group_by(RolePermission.role_id)).all()
    )
    roles = db.scalars(select(Role).order_by(Role.name)).all()
    return [
        {
            "id": role.code,
            "label": _ROLE_INFO.get(role.code, (role.name, ""))[0],
            "userCount": int(user_counts.get(role.id, 0)),
            "permissionCount": int(perm_counts.get(role.id, 0)),
            "creatable": role.code in creatable,
        }
        for role in roles
    ]


def role_permissions(db: Session, role_code: str) -> dict:
    role = db.scalar(select(Role).where(Role.code == role_code))
    if role is None:
        fail(404, "role_not_found", "Role not found.")
    held = set(
        db.scalars(
            select(Permission.code)
            .join(RolePermission, RolePermission.permission_id == Permission.id)
            .where(RolePermission.role_id == role.id)
        ).all()
    )
    return {
        "id": role.code,
        "label": role.name,
        "permissions": [
            {"code": code, "description": description, "granted": code in held} for code, description in PERMISSIONS
        ],
    }


__all__ = [
    "create_user",
    "creatable_role_options",
    "creatable_roles_for",
    "get_user",
    "list_roles",
    "list_users",
    "reset_password",
    "role_permissions",
    "update_user",
]
