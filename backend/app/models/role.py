"""
Canonical role IDs — must stay aligned with frontend `src/constants/roles.js`.

Architecture may add MD / Finance Assistant later; seed those as extra rows
without removing frontend-compatible IDs.
"""

from enum import StrEnum


class RoleId(StrEnum):
    SUPER_ADMIN = "superadmin"
    ADMIN = "admin"
    STUDENT = "student"
    PARENT = "parent"
    LIBRARIAN = "librarian"
    PRM = "prm"
    GATEKEEPER = "gatekeeper"
    GATEKEEPER_MANAGER = "gatekeepermanager"
    DIRECTOR = "director"
    PRINCIPAL = "principal"
    CANTEEN_MANAGER = "canteenmanager"
    IT_SUPPORT_MANAGER = "itsupportmanager"
    STATIONERY_STORE_MANAGER = "stationerystoremanager"
    HOUSEKEEPING_MANAGER = "housekeepingmanager"
    TRANSPORT_MANAGER = "transportmanager"
    TEACHER = "teacher"
    COORDINATOR = "coordinator"
    JOINT_DIRECTOR = "jointdirector"
    JOINT_DIRECTOR_ASSISTANT = "jointdirectorassistant"
    JOINT_DIRECTOR_AUDIT = "jointdirectoraudit"
    PROCESS_AUDITOR = "processauditor"
    QUALITY_AUDITOR = "qualityauditor"
    HR = "hr"
    ACCOUNT_HEAD = "accounthead"
    DRIVER = "driver"
    # Architecture extras (not in frontend select-profile yet)
    MD = "md"
    FINANCE_ASSISTANT = "financeassistant"
    CONDUCTOR = "conductor"


ROLE_LABELS: dict[str, str] = {
    RoleId.SUPER_ADMIN: "Super Admin",
    RoleId.ADMIN: "Admin",
    RoleId.STUDENT: "Student",
    RoleId.PARENT: "Parent",
    RoleId.LIBRARIAN: "Librarian",
    RoleId.PRM: "PRM",
    RoleId.GATEKEEPER: "Gate Keeper",
    RoleId.GATEKEEPER_MANAGER: "Gate Keeper Manager",
    RoleId.DIRECTOR: "Director",
    RoleId.PRINCIPAL: "Principal",
    RoleId.CANTEEN_MANAGER: "Café Manager",
    RoleId.IT_SUPPORT_MANAGER: "IT Support Team Manager",
    RoleId.STATIONERY_STORE_MANAGER: "Stores Manager",
    RoleId.HOUSEKEEPING_MANAGER: "Housekeeping Manager",
    RoleId.TRANSPORT_MANAGER: "Transport Manager",
    RoleId.TEACHER: "Teacher",
    RoleId.COORDINATOR: "Coordinator",
    RoleId.JOINT_DIRECTOR: "Joint Director",
    RoleId.JOINT_DIRECTOR_ASSISTANT: "Joint Director Assistant",
    RoleId.JOINT_DIRECTOR_AUDIT: "Joint Director - Audit",
    RoleId.PROCESS_AUDITOR: "Process Auditor",
    RoleId.QUALITY_AUDITOR: "Quality Auditor",
    RoleId.HR: "HR",
    RoleId.ACCOUNT_HEAD: "Account Head",
    RoleId.DRIVER: "Driver",
    RoleId.MD: "Managing Director",
    RoleId.FINANCE_ASSISTANT: "Finance Assistant",
    RoleId.CONDUCTOR: "Conductor",
}

# Roles shown on frontend select-profile today
FRONTEND_ROLE_IDS: tuple[str, ...] = (
    RoleId.SUPER_ADMIN,
    RoleId.ADMIN,
    RoleId.STUDENT,
    RoleId.PARENT,
    RoleId.TEACHER,
    RoleId.COORDINATOR,
    RoleId.DRIVER,
    RoleId.LIBRARIAN,
    RoleId.PRM,
    RoleId.GATEKEEPER,
    RoleId.GATEKEEPER_MANAGER,
    RoleId.DIRECTOR,
    RoleId.PRINCIPAL,
    RoleId.CANTEEN_MANAGER,
    RoleId.IT_SUPPORT_MANAGER,
    RoleId.STATIONERY_STORE_MANAGER,
    RoleId.HOUSEKEEPING_MANAGER,
    RoleId.TRANSPORT_MANAGER,
    RoleId.JOINT_DIRECTOR,
    RoleId.JOINT_DIRECTOR_ASSISTANT,
    RoleId.JOINT_DIRECTOR_AUDIT,
    RoleId.PROCESS_AUDITOR,
    RoleId.QUALITY_AUDITOR,
    RoleId.HR,
    RoleId.ACCOUNT_HEAD,
)
