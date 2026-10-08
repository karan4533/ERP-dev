from app.models.academics import SchoolClass, Subject
from app.models.admission import AdmissionEnquiry, Guardian, Student
from app.models.audit import AuditLog
from app.models.base import Base
from app.models.campus import Campus
from app.models.hr_employee import HrEmployee
from app.models.hr_record import HrRecord
from app.models.otp import OtpChallenge
from app.models.role import Permission, Role, RolePermission
from app.models.user import User

__all__ = [
    "AdmissionEnquiry",
    "AuditLog",
    "Base",
    "Campus",
    "Guardian",
    "HrEmployee",
    "HrRecord",
    "OtpChallenge",
    "Permission",
    "Role",
    "RolePermission",
    "SchoolClass",
    "Student",
    "Subject",
    "User",
]
