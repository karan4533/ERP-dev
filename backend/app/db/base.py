"""Import all models here so Alembic / create_all can discover them."""

from app.db.session import Base
from app.models.user import User  # noqa: F401

__all__ = ["Base", "User"]
