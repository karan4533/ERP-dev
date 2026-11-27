from app.models.academics import AcademicYear, FinancialYear, SchoolClass, Section, Subject
from app.models.academics_record import AcademicsRecord
from app.models.campus_audit_record import CampusAuditRecord
from app.models.ops_record import OpsRecord
from app.models.admission import (
    Admission,
    AdmissionEnquiry,
    AdmissionReferral,
    CoordinatorGradeBand,
    Guardian,
    Student,
)
from app.models.activities import Activity, ActivityPlayer
from app.models.announcements import Announcement, AnnouncementReply, AnnouncementResponse
from app.models.calendar import CalendarEvent
from app.models.communication import Conversation, ConversationParticipant, Message
from app.models.tc_requests import TcRequest, TcRequestNoc
from app.models.approval import ApprovalEvent, ApprovalRequest, Notification, NotificationRead
from app.models.escalation import Escalation, Task, TaskEvent
from app.models.exams import Exam, ExamType, ExamWeightage, MarkEntry, MarksBatch
from app.models.leave import LeaveRequest
from app.models.lesson_plan import LessonPlan
from app.models.attendance import StudentAttendance
from app.models.audit import AuditLog
from app.models.base import Base
from app.models.campus import Campus
from app.models.documents import DocumentItem, DocumentRecord
from app.models.file_asset import FileAsset
from app.models.finance import FinanceRecord
from app.models.front_office import FrontOfficeRecord
from app.models.hr_employee import HrEmployee
from app.models.hr_record import HrRecord
from app.models.otp import OtpChallenge
from app.models.role import Permission, Role, RolePermission
from app.models.substitute_duty import SubstituteDuty
from app.models.user import User
from app.models.user_profile import UserProfile

__all__ = [
    "AcademicYear",
    "AcademicsRecord",
    "Activity",
    "ActivityPlayer",
    "CampusAuditRecord",
    "OpsRecord",
    "FinancialYear",
    "Admission",
    "AdmissionReferral",
    "AdmissionEnquiry",
    "Announcement",
    "AnnouncementReply",
    "AnnouncementResponse",
    "ApprovalEvent",
    "ApprovalRequest",
    "AuditLog",
    "Base",
    "CalendarEvent",
    "Campus",
    "Conversation",
    "ConversationParticipant",
    "CoordinatorGradeBand",
    "DocumentItem",
    "DocumentRecord",
    "FileAsset",
    "FinanceRecord",
    "FrontOfficeRecord",
    "Guardian",
    "HrEmployee",
    "Escalation",
    "Exam",
    "ExamType",
    "ExamWeightage",
    "HrRecord",
    "LeaveRequest",
    "LessonPlan",
    "Message",
    "MarkEntry",
    "MarksBatch",
    "Notification",
    "NotificationRead",
    "OtpChallenge",
    "Permission",
    "Role",
    "RolePermission",
    "SchoolClass",
    "Section",
    "Student",
    "StudentAttendance",
    "Subject",
    "SubstituteDuty",
    "Task",
    "TaskEvent",
    "TcRequest",
    "TcRequestNoc",
    "User",
    "UserProfile",
]
