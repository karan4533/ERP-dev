"""Import all models here so Alembic / create_all can discover them."""

from app.db.session import Base
from app.models.campus import Campus  # noqa: F401
from app.models.hr_employee import HrEmployee  # noqa: F401
from app.models.user import User  # noqa: F401

__all__ = ["Base", "Campus", "HrEmployee", "User"]
