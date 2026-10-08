from fastapi import APIRouter, HTTPException, status

from app.api.deps import CurrentUser, DbSession
from app.schemas.auth import LoginRequest, TokenResponse, UserPublic
from app.services.auth_service import authenticate_user, issue_token_for_user

router = APIRouter()


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: DbSession) -> TokenResponse:
    """
    JSON login for the SPA.

    Demo seed (after first boot):
    - email: admin@qmis.edu
    - password: admin123
    """
    user = authenticate_user(db, payload.email, payload.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )
    token = issue_token_for_user(user)
    return TokenResponse(access_token=token, user=UserPublic.model_validate(user))


@router.get("/me", response_model=UserPublic)
def read_me(current_user: CurrentUser) -> UserPublic:
    return UserPublic.model_validate(current_user)
