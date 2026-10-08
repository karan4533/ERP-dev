from fastapi import APIRouter, HTTPException, status

from app.api.deps import CurrentUser, DbSession
from app.models.permission import PERMISSION_MODULES
from app.models.role import ROLE_LABELS
from app.schemas.rbac import (
    PermissionModulePublic,
    RolePermissionsResponse,
    RolePermissionsUpdate,
    RolePublic,
)
from app.services.role_service import (
    get_permissions_map,
    list_roles,
    set_role_permissions,
)

router = APIRouter()


@router.get("/roles", response_model=list[RolePublic])
def get_roles(
    db: DbSession,
    current_user: CurrentUser,
    frontend_only: bool = True,
) -> list[RolePublic]:
    rows = list_roles(db, frontend_only=frontend_only)
    return [RolePublic.model_validate(row) for row in rows]


@router.get("/roles/{role_id}/permissions", response_model=RolePermissionsResponse)
def get_role_permissions(
    role_id: str,
    db: DbSession,
    current_user: CurrentUser,
) -> RolePermissionsResponse:
    permissions = get_permissions_map(db, role_id)
    if role_id not in ROLE_LABELS and not permissions:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Role not found")

    modules = [
        PermissionModulePublic(
            key=key,
            label=label,
            always_on=always_on,
            enabled=permissions.get(key, always_on),
        )
        for key, label, always_on in PERMISSION_MODULES
    ]
    return RolePermissionsResponse(
        role_id=role_id,
        role_label=ROLE_LABELS.get(role_id, role_id),
        permissions=permissions,
        modules=modules,
    )


@router.patch("/roles/{role_id}/permissions", response_model=RolePermissionsResponse)
def patch_role_permissions(
    role_id: str,
    payload: RolePermissionsUpdate,
    db: DbSession,
    current_user: CurrentUser,
) -> RolePermissionsResponse:
    # TODO: restrict to superadmin/admin once full RBAC guards exist
    try:
        permissions = set_role_permissions(db, role_id, payload.permissions)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc

    modules = [
        PermissionModulePublic(
            key=key,
            label=label,
            always_on=always_on,
            enabled=permissions.get(key, always_on),
        )
        for key, label, always_on in PERMISSION_MODULES
    ]
    return RolePermissionsResponse(
        role_id=role_id,
        role_label=ROLE_LABELS.get(role_id, role_id),
        permissions=permissions,
        modules=modules,
    )
