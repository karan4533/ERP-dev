from sqlalchemy.orm import Session

from app.models.permission import PERMISSION_MODULES, RolePermission
from app.models.role import FRONTEND_ROLE_IDS, ROLE_LABELS, RoleId
from app.models.role_record import Role

# Roles that get all modules enabled by default
FULL_ACCESS_ROLES = {
    RoleId.SUPER_ADMIN,
    RoleId.ADMIN,
    RoleId.MD,
}


def ensure_roles(db: Session) -> list[Role]:
    created_or_existing: list[Role] = []
    for role_id, label in ROLE_LABELS.items():
        row = db.query(Role).filter(Role.id == role_id).first()
        if not row:
            row = Role(
                id=role_id,
                label=label,
                is_frontend=role_id in FRONTEND_ROLE_IDS,
                is_active=True,
            )
            db.add(row)
        else:
            row.label = label
            row.is_frontend = role_id in FRONTEND_ROLE_IDS
        created_or_existing.append(row)
    db.commit()
    return created_or_existing


def ensure_role_permissions(db: Session) -> None:
    roles = db.query(Role).all()
    for role in roles:
        full = role.id in FULL_ACCESS_ROLES
        for module_key, _label, always_on in PERMISSION_MODULES:
            existing = (
                db.query(RolePermission)
                .filter(
                    RolePermission.role_id == role.id,
                    RolePermission.module_key == module_key,
                )
                .first()
            )
            enabled = True if always_on or full else False
            if not existing:
                db.add(
                    RolePermission(
                        role_id=role.id,
                        module_key=module_key,
                        enabled=enabled,
                    )
                )
            elif always_on and not existing.enabled:
                existing.enabled = True
    db.commit()


def get_permissions_map(db: Session, role_id: str) -> dict[str, bool]:
    rows = db.query(RolePermission).filter(RolePermission.role_id == role_id).all()
    if not rows:
        return {key: always for key, _label, always in PERMISSION_MODULES}
    return {row.module_key: row.enabled for row in rows}


def list_roles(db: Session, *, frontend_only: bool = False) -> list[Role]:
    q = db.query(Role).filter(Role.is_active.is_(True))
    if frontend_only:
        q = q.filter(Role.is_frontend.is_(True))
    return q.order_by(Role.label.asc()).all()


def set_role_permissions(
    db: Session,
    role_id: str,
    permissions: dict[str, bool],
) -> dict[str, bool]:
    role = db.query(Role).filter(Role.id == role_id).first()
    if not role:
        raise ValueError("Role not found")

    for module_key, _label, always_on in PERMISSION_MODULES:
        enabled = True if always_on else bool(permissions.get(module_key, False))
        row = (
            db.query(RolePermission)
            .filter(
                RolePermission.role_id == role_id,
                RolePermission.module_key == module_key,
            )
            .first()
        )
        if not row:
            db.add(
                RolePermission(role_id=role_id, module_key=module_key, enabled=enabled)
            )
        else:
            row.enabled = enabled
    db.commit()
    return get_permissions_map(db, role_id)
