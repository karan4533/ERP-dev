from uuid import UUID

import jwt
from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import decode_access_token
from app.models import Permission, Role, RolePermission, User
from app.services.errors import fail

bearer = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer),
    db: Session = Depends(get_db),
) -> User:
    if credentials is None or not credentials.credentials:
        fail(401, "not_authenticated", "Sign in required.")
    try:
        payload = decode_access_token(credentials.credentials)
        user_id = UUID(str(payload["sub"]))
    except (jwt.PyJWTError, ValueError, KeyError):
        fail(401, "invalid_token", "Sign in required.")
    user = db.get(User, user_id)
    if user is None or not user.is_active:
        fail(401, "invalid_token", "Sign in required.")
    return user


def permission_codes_for(db: Session, user: User) -> list[str]:
    rows = db.scalars(
        select(Permission.code)
        .join(RolePermission, RolePermission.permission_id == Permission.id)
        .where(RolePermission.role_id == user.role_id)
        .order_by(Permission.code)
    ).all()
    return list(rows)


def require_permission(code: str):
    def checker(user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> User:
        allowed = set(permission_codes_for(db, user))
        if code not in allowed:
            fail(403, "forbidden", "You do not have permission for this action.")
        return user

    return checker


def role_code_for(db: Session, user: User) -> str:
    role = db.get(Role, user.role_id)
    return role.code if role else ""
