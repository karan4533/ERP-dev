from pydantic import BaseModel, Field


class RolePublic(BaseModel):
    id: str
    label: str
    is_frontend: bool
    is_active: bool

    model_config = {"from_attributes": True}


class PermissionModulePublic(BaseModel):
    key: str
    label: str
    always_on: bool
    enabled: bool


class RolePermissionsResponse(BaseModel):
    role_id: str
    role_label: str
    permissions: dict[str, bool]
    modules: list[PermissionModulePublic]


class RolePermissionsUpdate(BaseModel):
    permissions: dict[str, bool] = Field(default_factory=dict)
