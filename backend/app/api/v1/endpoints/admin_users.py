from typing import Literal

from fastapi import APIRouter, Depends, Query, Response
from pydantic import BaseModel, ConfigDict, EmailStr, Field
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.deps import require_permission
from app.models import User
from app.services import admin_users as svc

router = APIRouter(prefix="/api/v1/admin", tags=["admin-users"])

Text = Field(default=None, max_length=500)


class _Details(BaseModel):
    """Optional profile fields. Unknown keys (including any password-like key) are ignored."""

    model_config = ConfigDict(extra="ignore")

    alternativeMobileNumber: str | None = Text
    street: str | None = Text
    city: str | None = Text
    state: str | None = Text
    country: str | None = Text
    pincode: str | None = Text
    religion: str | None = Text
    caste: str | None = Text
    dateOfBirth: str | None = Text
    bloodGroup: str | None = Text
    height: str | None = Text
    weight: str | None = Text
    medicalHistory: str | None = Text
    fatherName: str | None = Text
    motherName: str | None = Text
    familyContactNumber: str | None = Text
    qualification: str | None = Text
    yearsOfExperience: str | None = Text
    previousSchool: str | None = Text
    joiningDate: str | None = Text
    username: str | None = Text
    className: str | None = Text
    section: str | None = Text


class UserCreateIn(_Details):
    role: str = Field(min_length=1, max_length=64)
    firstName: str = Field(min_length=1, max_length=120)
    middleName: str = Field(default="", max_length=120)
    lastName: str = Field(min_length=1, max_length=120)
    email: EmailStr
    gender: str = Field(min_length=1, max_length=24)
    mobileNumber: str = Field(default="", max_length=32)
    status: Literal["Active", "Inactive"] = "Active"
    password: str | None = Field(
        default=None,
        max_length=128,
        description="Optional. Leave empty and the server generates a temporary password.",
    )


class UserUpdateIn(_Details):
    firstName: str | None = Field(default=None, max_length=120)
    middleName: str | None = Field(default=None, max_length=120)
    lastName: str | None = Field(default=None, max_length=120)
    email: EmailStr | None = None
    role: str | None = Field(default=None, max_length=64)
    gender: str | None = Field(default=None, max_length=24)
    mobileNumber: str | None = Field(default=None, max_length=32)
    status: Literal["Active", "Inactive"] | None = None


def _no_store(response: Response) -> None:
    # Create / reset responses can carry a one-time temporary password.
    response.headers["Cache-Control"] = "no-store"


@router.get("/users")
def list_users_route(
    role: str | None = Query(default=None),
    status: str | None = Query(default=None, description="Active | Inactive"),
    q: str | None = Query(default=None, max_length=100),
    limit: int = Query(default=200, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
    user: User = Depends(require_permission("users.read")),
) -> list[dict]:
    return svc.list_users(db, user, role=role, status=status, q=q, limit=limit, offset=offset)


@router.get("/users/creatable-roles")
def creatable_roles_route(
    db: Session = Depends(get_db), user: User = Depends(require_permission("users.read"))
) -> list[dict]:
    return svc.creatable_role_options(db, user)


@router.post("/users", status_code=201)
def create_user_route(
    body: UserCreateIn,
    response: Response,
    db: Session = Depends(get_db),
    user: User = Depends(require_permission("users.write")),
) -> dict:
    _no_store(response)
    details = body.model_dump(include=set(svc.DETAIL_FIELDS))
    return svc.create_user(
        db,
        user,
        role_code=body.role,
        first_name=body.firstName,
        middle_name=body.middleName,
        last_name=body.lastName,
        email=str(body.email),
        gender=body.gender,
        mobile_number=body.mobileNumber,
        status=body.status,
        password=body.password,
        details=details,
    )


@router.get("/users/{user_id}")
def get_user_route(
    user_id: str, db: Session = Depends(get_db), user: User = Depends(require_permission("users.read"))
) -> dict:
    return svc.get_user(db, user, user_id)


@router.patch("/users/{user_id}")
def update_user_route(
    user_id: str,
    body: UserUpdateIn,
    db: Session = Depends(get_db),
    user: User = Depends(require_permission("users.write")),
) -> dict:
    changes = body.model_dump(exclude_unset=True, exclude_none=False)
    # An explicit null on a required field means "no change", not "clear it".
    for required in ("firstName", "lastName", "gender", "status"):
        if required in changes and changes[required] is None:
            del changes[required]
    return svc.update_user(db, user, user_id, changes)


@router.post("/users/{user_id}/reset-password")
def reset_password_route(
    user_id: str,
    response: Response,
    db: Session = Depends(get_db),
    user: User = Depends(require_permission("users.write")),
) -> dict:
    _no_store(response)
    return svc.reset_password(db, user, user_id)


@router.get("/roles")
def list_roles_route(db: Session = Depends(get_db), user: User = Depends(require_permission("rbac.read"))) -> list[dict]:
    return svc.list_roles(db, user)


@router.get("/roles/{role_code}/permissions")
def role_permissions_route(
    role_code: str, db: Session = Depends(get_db), user: User = Depends(require_permission("rbac.read"))
) -> dict:
    return svc.role_permissions(db, role_code)
