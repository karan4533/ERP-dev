from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.security import create_access_token, hash_password, verify_password
from app.models.user import User


def get_user_by_email(db: Session, email: str) -> User | None:
    return db.query(User).filter(User.email == email).first()


def authenticate_user(db: Session, email: str, password: str) -> User | None:
    user = get_user_by_email(db, email)
    if not user or not user.is_active:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    return user


def issue_token_for_user(user: User) -> str:
    return create_access_token(
        user.id,
        extra_claims={
            "role": user.role,
            "campus_id": user.campus_id,
            "email": user.email,
        },
    )


def ensure_seed_admin(db: Session) -> User:
    """
    Create a local bootstrap admin if the users table is empty.
    Partner / local dev convenience only — replace with HR provisioning later.
    """
    existing = db.query(User).first()
    if existing:
        return existing

    settings = get_settings()
    admin = User(
        campus_id=settings.default_campus_id,
        email="admin@qmis.edu",
        full_name="Bootstrap Admin",
        hashed_password=hash_password("admin123"),
        role="superadmin",
        is_active=True,
    )
    db.add(admin)
    db.commit()
    db.refresh(admin)
    return admin
