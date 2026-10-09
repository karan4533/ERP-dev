"""25 frontend roles plus Managing Director and Finance Assistant."""

FRONTEND_ROLES: list[tuple[str, str]] = [
    ("superadmin", "Super Admin"),
    ("admin", "Admin"),
    ("student", "Student"),
    ("parent", "Parent"),
    ("librarian", "Librarian"),
    ("prm", "PRM"),
    ("gatekeeper", "Gate Keeper"),
    ("gatekeepermanager", "Gate Keeper Manager"),
    ("director", "Director"),
    ("principal", "Principal"),
    ("canteenmanager", "Canteen Manager"),
    ("itsupportmanager", "IT Support Manager"),
    ("stationerystoremanager", "Stationery Store Manager"),
    ("housekeepingmanager", "Housekeeping Manager"),
    ("transportmanager", "Transport Manager"),
    ("teacher", "Teacher"),
    ("coordinator", "Coordinator"),
    ("jointdirector", "Joint Director"),
    ("jointdirectorassistant", "Joint Director Assistant"),
    ("jointdirectoraudit", "Joint Director Audit"),
    ("processauditor", "Process Auditor"),
    ("qualityauditor", "Quality Auditor"),
    ("hr", "HR"),
    ("accounthead", "Account Head"),
    ("driver", "Driver"),
]

MD_EXTRA_ROLES: list[tuple[str, str]] = [
    ("managing_director", "Managing Director"),
    ("finance_assistant", "Finance Assistant"),
]

ALL_ROLES = FRONTEND_ROLES + MD_EXTRA_ROLES

PERMISSIONS: list[tuple[str, str]] = [
    ("auth.me", "Read own session"),
    ("masters.read", "View classes and subjects"),
    ("masters.write", "Create classes and subjects"),
    ("audit.read", "View audit log"),
    ("hr.employees.read", "View HR employees"),
    ("hr.employees.write", "Create HR employees"),
    ("hr.read", "View HR records"),
    ("hr.write", "Change HR records"),
    ("hr.self", "View own staff profile, leave, attendance, and payslip"),
    ("admissions.write", "Create enquiries and enroll students"),
    ("students.read", "View students and guardians"),
    ("finance.read", "View finance fees, receipts, and books"),
    ("finance.write", "Collect fees and change finance masters"),
]

ALL_PERMISSION_CODES = [code for code, _ in PERMISSIONS]

_CORE = ["auth.me", "masters.read", "hr.self"]
_ADMIN = ALL_PERMISSION_CODES
_HR = ["auth.me", "hr.employees.read", "hr.employees.write", "hr.read", "hr.write", "hr.self", "students.read"]
_ADMISSIONS = ["auth.me", "masters.read", "admissions.write", "students.read"]
_FINANCE = ["auth.me", "masters.read", "finance.read", "finance.write", "students.read", "audit.read"]

ROLE_PERMISSIONS: dict[str, list[str]] = {code: list(_CORE) for code, _ in ALL_ROLES}
ROLE_PERMISSIONS.update(
    {
        "superadmin": list(_ADMIN),
        "admin": list(_ADMIN),
        "managing_director": list(_ADMIN),
        "hr": list(_HR),
        "prm": list(_ADMISSIONS),
        "accounthead": list(_FINANCE),
        "finance_assistant": ["auth.me", "masters.read", "finance.read", "students.read"],
    }
)
