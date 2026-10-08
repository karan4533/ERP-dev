from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.deps import get_current_user
from app.models import User
from app.schemas.phase0 import LoginRequest, MeResponse, OtpChallengeRequest, OtpVerifyRequest, TokenResponse
from app.services.auth import login, me_payload, start_otp, verify_otp

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])


@router.post("/login", response_model=TokenResponse)
def login_route(body: LoginRequest, db: Session = Depends(get_db)) -> dict:
    return login(db, body.email, body.password)


@router.post("/otp/challenge")
def otp_challenge(body: OtpChallengeRequest, db: Session = Depends(get_db)) -> dict:
    return start_otp(db, body.email)


@router.post("/otp/verify", response_model=TokenResponse)
def otp_verify(body: OtpVerifyRequest, db: Session = Depends(get_db)) -> dict:
    return verify_otp(db, body.email, body.code)


@router.get("/me", response_model=MeResponse)
def me_route(user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> dict:
    return me_payload(db, user)
