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
    ("students.place", "Assign students to class sections and roll numbers"),
    ("students.promote", "Promote students to the next grade and section"),
    ("attendance.read", "View class attendance"),
    ("attendance.write", "Mark class attendance"),
    ("lessonplans.read", "View lesson plans (own, or all for approvers)"),
    ("lessonplans.write", "Create, edit, submit and revise own lesson plans"),
    ("lessonplans.remind", "Trigger lesson-plan deadline reminders"),
    ("exams.read", "View exam types, schedules, weightage and published results"),
    ("exams.write", "Create and submit exam schedules"),
    ("exams.configure", "Configure exam types and weightage (DA)"),
    ("marks.read", "View marks batches"),
    ("marks.write", "Enter, submit and revise marks"),
    ("results.read", "View published results of a student"),
    ("leave.read", "View own leave requests and requests received for approval"),
    ("leave.write", "File leave and permission requests"),
    ("leave.decide", "Approve or deny leave requests at your level"),
    ("escalations.read", "View escalations you raised or received"),
    ("escalations.write", "Raise an escalation to the next level"),
    ("escalations.resolve", "Move received escalations to In Review / Resolved / Rejected / Closed"),
    ("escalations.sweep", "Run the 24h escalation clock (auto-escalate overdue items)"),
    ("tasks.read", "View tasks assigned to you or by you"),
    ("tasks.write", "Assign tasks and update the status of your own tasks"),
    ("approvals.submit", "Submit items into the approval chain"),
    ("approvals.decide", "Approve or deny items at your level"),
    ("approvals.read", "View approval inbox and history"),
    ("notifications.read", "View own in-app notifications"),
    ("finance.read", "View finance fees, receipts, and books"),
    ("finance.collect", "Collect fees and send receipts (operational)"),
    ("finance.write", "Change finance masters, fee structures, and snapshot config"),
    ("finance.approve", "Approve finance requests and apply Head-only actions"),
    ("users.read", "View staff logins created by administrators"),
    ("users.write", "Create staff logins, change their status, and reset their passwords"),
    ("rbac.read", "View roles and the permissions each role holds"),
    ("documents.students.read", "View and download student documents"),
    ("documents.students.write", "Upload, replace and remove student documents"),
    ("documents.employees.read", "View and download employee documents"),
    ("documents.employees.write", "Upload, replace and remove employee documents"),
    ("announcements.read", "View announcements sent to your role"),
    ("announcements.write", "Send announcements"),
    ("calendar.read", "View the academic calendar"),
    ("calendar.write", "Add, change and remove academic calendar events"),
    ("tc.read", "View transfer-certificate requests"),
    ("tc.write", "File or forward a transfer-certificate request"),
    ("tc.decide", "Approve or reject a transfer-certificate request"),
    ("frontoffice.read", "View Front Office gate passes, transfers and re-enrollment"),
    ("frontoffice.write", "Create and change Front Office campus records"),
    ("academics.read", "View class timetables, teacher allocations and timetable change requests"),
    ("academics.write", "Change academics campus collections (principals; teachers may file TT change requests)"),
    ("ops.read", "View campus ops collections (library, gate, transport, stores, JD, biometric)"),
    ("ops.write", "Change campus ops collections for your vertical"),
    ("campus_audit.read", "View campus audit collections (JD Audit + Process/Quality)"),
    ("campus_audit.write", "Change campus audit collections for your auditor role"),
    ("activities.read", "View cultural, sports and competition activities"),
    ("activities.write", "Add, change and remove activities"),
    ("activities.approve", "Approve or reject an activity"),
    ("communication.read", "View own inbox"),
    ("communication.write", "Send messages"),
    ("dashboard.read", "View administrator dashboard figures"),
]

ALL_PERMISSION_CODES = [code for code, _ in PERMISSIONS]

_CORE = ["auth.me", "masters.read", "hr.self"]
_ADMIN = ALL_PERMISSION_CODES
_HR = ["auth.me", "hr.employees.read", "hr.employees.write", "hr.read", "hr.write", "hr.self", "students.read"]
_ADMISSIONS = ["auth.me", "masters.read", "admissions.write", "students.read"]
# accounthead = Finance Head (role code preserved for frontend Account Head portal)
_FINANCE_HEAD = [
    "auth.me",
    "masters.read",
    "finance.read",
    "finance.collect",
    "finance.write",
    "finance.approve",
    "students.read",
    "audit.read",
    # Read transport routes/drivers/vehicles for Transport Finance dropdowns (write still denied).
    "ops.read",
]
# Operational collector — cannot change masters or approve
_FINANCE_ASSISTANT = [
    "auth.me",
    "masters.read",
    "finance.read",
    "finance.collect",
    "students.read",
]

_STAFF_STUDENTS = list(dict.fromkeys([*_CORE, "students.read"]))
_STAFF_ATTENDANCE = list(
    dict.fromkeys([*_STAFF_STUDENTS, "attendance.read", "attendance.write"])
)

_APPROVALS = ["approvals.submit", "approvals.decide", "approvals.read", "notifications.read"]
_STAFF_ACADEMIC = list(
    dict.fromkeys(
        [
            *_STAFF_ATTENDANCE,
            *_APPROVALS,
            "lessonplans.read",
            "lessonplans.write",
            "exams.read",
            "marks.read",
            "marks.write",
            "results.read",
            "academics.read",
            "academics.write",
        ]
    )
)

ROLE_PERMISSIONS: dict[str, list[str]] = {code: list(_CORE) for code, _ in ALL_ROLES}
ROLE_PERMISSIONS.update(
    {
        "superadmin": list(_ADMIN),
        "admin": list(_ADMIN),
        "managing_director": list(_ADMIN),
        "prm": list(
            dict.fromkeys(
                [
                    *_ADMISSIONS,
                    "hr.self",
                    "hr.employees.read",
                    "frontoffice.read",
                    "frontoffice.write",
                ]
            )
        ),
        "accounthead": list(_FINANCE_HEAD),
        "finance_assistant": list(_FINANCE_ASSISTANT),
        # Staff UIS + class attendance (P1-5 / Y-1)
        "teacher": list(_STAFF_ACADEMIC),
        # hr.employees.read: campus teacher directory for Class Timetable / allocations (read-only).
        "coordinator": [
            *_STAFF_ACADEMIC,
            "exams.write",
            "students.place",
            "students.promote",
            "hr.employees.read",
        ],
        # Campus employee directory is read-only (hr.employees.read). Not hr.write / admin users.
        "principal": [
            *_STAFF_ACADEMIC,
            "lessonplans.remind",
            "exams.write",
            "hr.employees.read",
            "students.place",
            "students.promote",
        ],
        "director": [
            *_STAFF_ACADEMIC,
            "lessonplans.remind",
            "exams.configure",
            "hr.employees.read",
            "students.place",
            "students.promote",
        ],
        "parent": list(
            dict.fromkeys(
                [
                    *_CORE,
                    "results.read",
                    "notifications.read",
                    "attendance.read",
                    "exams.read",
                    "academics.read",
                    # Parent Academic Payment — scoped via GET /finance/my-fees (not full ledger write).
                    "finance.read",
                ]
            )
        ),
        "student": list(
            dict.fromkeys(
                [
                    *_CORE,
                    "results.read",
                    "notifications.read",
                    "attendance.read",
                    "exams.read",
                    "academics.read",
                    "finance.read",
                ]
            )
        ),
        "jointdirector": list(_STAFF_ACADEMIC),
        "stationerystoremanager": list(dict.fromkeys([*_CORE, *_APPROVALS])),
        "hr": list(
            dict.fromkeys(
                [
                    *_HR,
                    "approvals.submit",
                    "approvals.read",
                    "notifications.read",
                    "documents.employees.read",
                    "documents.employees.write",
                ]
            )
        ),
    }
)

# Leave (Y-4): every staff role files and views its own requests; department heads and HR decide.
_NON_STAFF_ROLES = {"student", "parent"}
_LEAVE_DECIDERS = {
    "coordinator", "principal", "director", "jointdirector", "hr", "gatekeepermanager", "transportmanager",
}
for _code, _perms in ROLE_PERMISSIONS.items():
    if _code in _NON_STAFF_ROLES:
        continue
    for _p in ("leave.read", "leave.write", "notifications.read"):
        if _p not in _perms:
            _perms.append(_p)
    if _code in _LEAVE_DECIDERS and "leave.decide" not in _perms:
        _perms.append("leave.decide")

# Escalations + tasks (Y-5): the escalation hierarchy includes students (-> teacher); parents have no escalation path.
for _code, _perms in ROLE_PERMISSIONS.items():
    if _code == "parent":
        continue
    for _p in ("escalations.read", "escalations.write", "escalations.resolve", "notifications.read"):
        if _p not in _perms:
            _perms.append(_p)
    if _code not in _NON_STAFF_ROLES:
        for _p in ("tasks.read", "tasks.write"):
            if _p not in _perms:
                _perms.append(_p)

# Announcements: every role can read what is sent to it; only the roles that send notices can write
# (mirrors CREATOR_ROLE_KEYS in src/Common/Announcement/announcementData.js; Super Admin and the Managing
# Director already hold every permission).
_ANNOUNCEMENT_SENDERS = {
    "admin", "principal", "gatekeepermanager", "itsupportmanager", "housekeepingmanager", "hr",
}
for _code, _perms in ROLE_PERMISSIONS.items():
    if "announcements.read" not in _perms:
        _perms.append("announcements.read")
    if _code in _ANNOUNCEMENT_SENDERS and "announcements.write" not in _perms:
        _perms.append("announcements.write")

# Academic calendar: every role can read it; the school office roles that plan the year can change it
# (Super Admin and the Managing Director already hold every permission).
_CALENDAR_EDITORS = {"admin", "principal"}
for _code, _perms in ROLE_PERMISSIONS.items():
    if "calendar.read" not in _perms:
        _perms.append("calendar.read")
    if _code in _CALENDAR_EDITORS and "calendar.write" not in _perms:
        _perms.append("calendar.write")

# TC requests: parents and front office file them; PRM forwards; administrators decide.
# Super Admin / Managing Director already hold every permission.
_TC_FILERS = {"parent", "student", "prm", "admin"}
_TC_FORWARDERS = {"prm", "admin"}
_TC_DECIDERS = {"admin"}
for _code, _perms in ROLE_PERMISSIONS.items():
    if _code in {"admin", "superadmin", "managing_director", "prm", "parent", "student"} and "tc.read" not in _perms:
        _perms.append("tc.read")
    if _code in _TC_FILERS and "tc.write" not in _perms:
        _perms.append("tc.write")
    if _code in _TC_DECIDERS and "tc.decide" not in _perms:
        _perms.append("tc.decide")

# Activities: every staff role can read; the office roles that run events can write; Super Admin decides.
_ACTIVITY_EDITORS = {"admin", "principal", "director", "coordinator"}
_ACTIVITY_APPROVERS = {"superadmin", "managing_director"}
for _code, _perms in ROLE_PERMISSIONS.items():
    if _code != "parent" and "activities.read" not in _perms:
        _perms.append("activities.read")
    if _code in _ACTIVITY_EDITORS and "activities.write" not in _perms:
        _perms.append("activities.write")
    if _code in _ACTIVITY_APPROVERS and "activities.approve" not in _perms:
        _perms.append("activities.approve")

# Communication: every signed-in role may use the inbox.
for _code, _perms in ROLE_PERMISSIONS.items():
    for _p in ("communication.read", "communication.write"):
        if _p not in _perms:
            _perms.append(_p)

# Administrator dashboard figures (the /dashboard page). Super Admin already holds every permission.
for _code, _perms in ROLE_PERMISSIONS.items():
    if _code == "admin" and "dashboard.read" not in _perms:
        _perms.append("dashboard.read")

# Front Office campus records:
# - Admin + PRM write (shared campus office); Super Admin / Managing Director already hold all perms.
# - Principal + Director read-only — matches front_office service _READERS.
# - Gate Keeper / Manager may read+write gate-pass collections (service also gates by role).
for _code, _perms in ROLE_PERMISSIONS.items():
    if _code in {"admin", "prm"}:
        for _p in ("frontoffice.read", "frontoffice.write"):
            if _p not in _perms:
                _perms.append(_p)
    if _code in {"gatekeeper", "gatekeepermanager"}:
        for _p in ("frontoffice.read", "frontoffice.write"):
            if _p not in _perms:
                _perms.append(_p)
    if _code in {"principal", "director"} and "frontoffice.read" not in _perms:
        _perms.append("frontoffice.read")

# Ops campus collections (library / gate / transport / stores / JD / biometric).
_OPS_ROLES = {
    "librarian",
    "gatekeeper",
    "gatekeepermanager",
    "transportmanager",
    "driver",
    "canteenmanager",
    "itsupportmanager",
    "stationerystoremanager",
    "housekeepingmanager",
    "jointdirector",
    "jointdirectorassistant",
    "teacher",
    "coordinator",
    "principal",
    "director",
    "hr",
    "admin",
}
for _code, _perms in ROLE_PERMISSIONS.items():
    if _code in _OPS_ROLES:
        for _p in ("ops.read", "ops.write"):
            if _p not in _perms:
                _perms.append(_p)

# Transport Manager assigns students to bus routes — needs campus student roster (read-only).
for _code, _perms in ROLE_PERMISSIONS.items():
    if _code == "transportmanager" and "students.read" not in _perms:
        _perms.append("students.read")

# Campus audit collections (JD Audit + Process/Quality auditors).
_CAMPUS_AUDIT_WRITERS = {
    "jointdirectoraudit",
    "processauditor",
    "qualityauditor",
    "admin",
}
_CAMPUS_AUDIT_READERS = _CAMPUS_AUDIT_WRITERS | {
    "jointdirector",
    "principal",
    "director",
}
for _code, _perms in ROLE_PERMISSIONS.items():
    if _code in _CAMPUS_AUDIT_READERS and "campus_audit.read" not in _perms:
        _perms.append("campus_audit.read")
    if _code in _CAMPUS_AUDIT_WRITERS and "campus_audit.write" not in _perms:
        _perms.append("campus_audit.write")
