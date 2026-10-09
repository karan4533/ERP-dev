import secrets
from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import create_access_token, hash_password, verify_password
from app.deps import permission_codes_for, role_code_for
from app.models import Campus, OtpChallenge, Role, User
from app.services.audit import write_audit
from app.services.errors import fail


def login(db: Session, email: str, password: str) -> dict:
    user = db.scalar(select(User).where(User.email == email.lower().strip()))
    if user is None or not verify_password(password, user.password_hash) or not user.is_active:
        write_audit(db, action="LOGIN_FAILED", entity_type="user", details=email.lower().strip())
        db.commit()
        fail(401, "invalid_credentials", "Invalid email or password.")
    write_audit(
        db,
        action="LOGIN",
        entity_type="user",
        entity_id=str(user.id),
        actor_id=user.id,
        campus_id=user.campus_id,
    )
    db.commit()
    return _token_payload(db, user)


def start_otp(db: Session, email: str) -> dict:
    normalized = email.lower().strip()
    user = db.scalar(select(User).where(User.email == normalized))
    if user is None or not user.is_active:
        fail(404, "unknown_account", "No active account uses that email.")
    now = datetime.now(timezone.utc)
    for old in db.scalars(
        select(OtpChallenge).where(OtpChallenge.email == normalized, OtpChallenge.consumed_at.is_(None))
    ).all():
        old.consumed_at = now
    code = f"{secrets.randbelow(1_000_000):06d}"
    db.add(
        OtpChallenge(
            email=normalized,
            code_hash=hash_password(code),
            expires_at=now + timedelta(minutes=settings.otp_expire_minutes),
        )
    )
    write_audit(
        db,
        action="OTP_CHALLENGE",
        entity_type="user",
        entity_id=str(user.id),
        actor_id=user.id,
        campus_id=user.campus_id,
    )
    db.commit()
    body = {"email": normalized, "expires_in_minutes": settings.otp_expire_minutes}
    if settings.otp_debug:
        body["debug_code"] = code
    return body


def verify_otp(db: Session, email: str, code: str) -> dict:
    normalized = email.lower().strip()
    now = datetime.now(timezone.utc)
    challenge = db.scalar(
        select(OtpChallenge)
        .where(OtpChallenge.email == normalized, OtpChallenge.consumed_at.is_(None))
        .order_by(OtpChallenge.created_at.desc())
    )
    if challenge is None:
        write_audit(db, action="OTP_FAILED", entity_type="user", details=normalized)
        db.commit()
        fail(401, "invalid_otp", "The code is invalid or expired.")
    expires = challenge.expires_at
    if expires.tzinfo is None:
        expires = expires.replace(tzinfo=timezone.utc)
    if expires < now or not verify_password(code, challenge.code_hash):
        write_audit(db, action="OTP_FAILED", entity_type="user", details=normalized)
        db.commit()
        fail(401, "invalid_otp", "The code is invalid or expired.")
    user = db.scalar(select(User).where(User.email == normalized))
    if user is None or not user.is_active:
        fail(401, "invalid_otp", "The code is invalid or expired.")
    challenge.consumed_at = now
    write_audit(
        db,
        action="OTP_VERIFIED",
        entity_type="user",
        entity_id=str(user.id),
        actor_id=user.id,
        campus_id=user.campus_id,
    )
    db.commit()
    return _token_payload(db, user)


def change_password(db: Session, user: User, current_password: str, new_password: str) -> dict:
    if not verify_password(current_password, user.password_hash):
        fail(401, "invalid_credentials", "Current password is incorrect.")
    if len(new_password) < 6:
        fail(422, "weak_password", "New password must be at least 6 characters.")
    if current_password == new_password:
        fail(422, "same_password", "Pick a new password that is different from the current one.")
    user.password_hash = hash_password(new_password)
    user.must_change_password = False
    write_audit(
        db,
        action="PASSWORD_CHANGED",
        entity_type="user",
        entity_id=str(user.id),
        actor_id=user.id,
        campus_id=user.campus_id,
    )
    db.commit()
    return {"ok": True, "must_change_password": False}


def me_payload(db: Session, user: User) -> dict:
    role = db.get(Role, user.role_id)
    campus = db.get(Campus, user.campus_id)
    return {
        "id": user.id,
        "email": user.email,
        "role": role.code if role else "",
        "role_name": role.name if role else "",
        "campus": {
            "id": campus.id,
            "code": campus.code,
            "name": campus.name,
            "city": campus.city,
        }
        if campus
        else None,
        "permissions": permission_codes_for(db, user),
        "must_change_password": user.must_change_password,
        "is_active": user.is_active,
    }


def _token_payload(db: Session, user: User) -> dict:
    role = role_code_for(db, user)
    return {
        "access_token": create_access_token(user_id=str(user.id), role=role),
        "token_type": "bearer",
        "role": role,
        "must_change_password": user.must_change_password,
    }
