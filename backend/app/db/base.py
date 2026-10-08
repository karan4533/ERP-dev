"""Import all models here so Alembic / create_all can discover them."""

from app.db.session import Base
from app.models.audit_log import SystemAuditLog  # noqa: F401
from app.models.campus import Campus  # noqa: F401
from app.models.hr_employee import HrEmployee  # noqa: F401
from app.models.masters import AcademicYear, SchoolClass, Section, Subject  # noqa: F401
from app.models.otp_challenge import OtpChallenge  # noqa: F401
from app.models.permission import RolePermission  # noqa: F401
from app.models.role_record import Role  # noqa: F401
from app.models.user import User  # noqa: F401

__all__ = [
    "Base",
    "Campus",
    "User",
    "Role",
    "RolePermission",
    "OtpChallenge",
    "SystemAuditLog",
    "HrEmployee",
    "AcademicYear",
    "SchoolClass",
    "Section",
    "Subject",
]
