import secrets
from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.security import hash_password, verify_password
from app.models.otp_challenge import OtpChallenge
from app.models.user import User
from app.services.auth_service import get_user_by_email


MAX_ATTEMPTS = 5


def create_otp_challenge(
    db: Session,
    *,
    email: str,
    role: str | None,
    campus_id: int,
) -> tuple[OtpChallenge, str]:
    """
    Create OTP challenge. Returns (challenge, plain_code).
    Plain code is only for delivery / local debug — never store plaintext.
    """
    settings = get_settings()
    user = get_user_by_email(db, email)
    if not user or not user.is_active:
        raise ValueError("No active user for this email")
    if role and user.role != role:
        raise ValueError("Role does not match this account")

    plain_code = f"{secrets.randbelow(1_000_000):06d}"
    challenge = OtpChallenge(
        campus_id=campus_id,
        email=email.lower().strip(),
        role=role or user.role,
        code_hash=hash_password(plain_code),
        expires_at=datetime.now(timezone.utc)
        + timedelta(minutes=settings.otp_expire_minutes),
        consumed=False,
        attempts=0,
    )
    db.add(challenge)
    db.commit()
    db.refresh(challenge)
    return challenge, plain_code


def verify_otp_challenge(
    db: Session,
    *,
    challenge_id: int,
    code: str,
) -> User:
    challenge = db.query(OtpChallenge).filter(OtpChallenge.id == challenge_id).first()
    if not challenge:
        raise ValueError("Invalid challenge")
    if challenge.consumed:
        raise ValueError("Challenge already used")
    expires_at = challenge.expires_at
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        raise ValueError("Challenge expired")

    if challenge.attempts >= MAX_ATTEMPTS:
        raise ValueError("Too many attempts")

    challenge.attempts += 1
    db.add(challenge)
    db.commit()

    if not verify_password(code, challenge.code_hash):
        raise ValueError("Invalid OTP")

    user = get_user_by_email(db, challenge.email)
    if not user or not user.is_active:
        raise ValueError("User not found")

    challenge.consumed = True
    db.add(challenge)
    db.commit()
    return user
