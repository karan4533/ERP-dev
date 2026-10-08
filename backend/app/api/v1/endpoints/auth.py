from fastapi import APIRouter, HTTPException, Request, status

from app.api.deps import CurrentUser, DbSession
from app.core.config import get_settings
from app.schemas.auth import (
    LoginRequest,
    MeResponse,
    MessageResponse,
    OtpChallengeRequest,
    OtpChallengeResponse,
    OtpVerifyRequest,
    TokenResponse,
)
from app.services.audit_service import write_audit_log
from app.services.auth_service import (
    authenticate_user,
    build_me_response,
    issue_token_for_user,
)
from app.services.otp_service import create_otp_challenge, verify_otp_challenge

router = APIRouter()


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: DbSession, request: Request) -> TokenResponse:
    """
    Password login for local/bootstrap users.

    Seed: admin@qmis.edu / admin123
    Prefer OTP endpoints for SPA parity with the frontend demo.
    """
    user = authenticate_user(db, payload.email, payload.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )
    token = issue_token_for_user(user)
    me = build_me_response(db, user)
    write_audit_log(
        db,
        action_type="LOGIN",
        campus_id=user.campus_id,
        actor_user_id=user.id,
        actor_role=user.role,
        target_module="auth",
        path=str(request.url.path),
        method="POST",
        status_code=200,
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
    )
    return TokenResponse(access_token=token, user=me)


@router.post("/otp/challenge", response_model=OtpChallengeResponse)
def otp_challenge(payload: OtpChallengeRequest, db: DbSession) -> OtpChallengeResponse:
    settings = get_settings()
    try:
        challenge, plain = create_otp_challenge(
            db,
            email=str(payload.email),
            role=payload.role,
            campus_id=settings.default_campus_id,
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

    return OtpChallengeResponse(
        challenge_id=challenge.id,
        email=challenge.email,
        expires_at=challenge.expires_at,
        message="OTP generated. In production this is sent by SMS/email.",
        debug_otp=plain if settings.app_debug else None,
    )


@router.post("/otp/verify", response_model=TokenResponse)
def otp_verify(payload: OtpVerifyRequest, db: DbSession, request: Request) -> TokenResponse:
    try:
        user = verify_otp_challenge(
            db, challenge_id=payload.challenge_id, code=payload.code
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(exc)) from exc

    token = issue_token_for_user(user)
    me = build_me_response(db, user)
    write_audit_log(
        db,
        action_type="LOGIN",
        campus_id=user.campus_id,
        actor_user_id=user.id,
        actor_role=user.role,
        target_module="auth",
        path=str(request.url.path),
        method="POST",
        status_code=200,
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
        payload_summary=f"otp_challenge_id={payload.challenge_id}",
    )
    return TokenResponse(access_token=token, user=me)


@router.get("/me", response_model=MeResponse)
def read_me(current_user: CurrentUser, db: DbSession) -> MeResponse:
    return build_me_response(db, current_user)


@router.post("/logout", response_model=MessageResponse)
def logout(current_user: CurrentUser, db: DbSession, request: Request) -> MessageResponse:
    """
    Stateless JWT logout: client must discard the token.
    Server records the logout event in the audit trail.
    """
    write_audit_log(
        db,
        action_type="LOGOUT",
        campus_id=current_user.campus_id,
        actor_user_id=current_user.id,
        actor_role=current_user.role,
        target_module="auth",
        path=str(request.url.path),
        method="POST",
        status_code=200,
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
    )
    return MessageResponse(message="Logged out. Discard the access token on the client.")
