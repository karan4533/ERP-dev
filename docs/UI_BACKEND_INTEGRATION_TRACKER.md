# UI ↔ Backend Integration Tracker

**Updated:** 2026-11-18 (Phase 2 — HR Employees LIVE)  
**Frontend:** `C:\karan\irul\ERP_QMIS`  
**Backend:** `C:\karan\irul\backend`  
**Live mode:** `VITE_USE_MOCK=false` + `VITE_API_BASE_URL=http://127.0.0.1:8000`

Status: **LIVE** | **PARTIALLY LIVE** | **MOCK** | **BLOCKED** | **API NOT AVAILABLE**

UAT: **Pass** | **Fail** | **Pending** | **N/A**

---

## Inventory summary

| Metric | Value |
|---|---|
| Frontend `*Data.js` files | ~294 |
| Of those using localStorage | ~92 |
| Service modules under `src/services/modules` | 13 |
| Live-gated API helpers | auth, announcements, **hr employees** |
| Backend routers mounted | auth, admin, masters, admissions, parents, students, attendance, approvals, lesson-plans, exams, leave, escalations, finance, hr, files, documents, announcements, calendar, tc-requests, activities, communication, dashboard, front-office, academics, ops, campus-audit, protrack, geo, webhooks |

---

## Module map

| Module | UI Page / Workspace | Current Data Source | Backend Endpoint(s) | Status | Test | Browser UAT | Remaining / Gaps |
|---|---|---|---|---|---|---|---|
| Auth | `Pages/Authentication/SignIn.jsx`, `context/AuthContext.jsx` | JWT via `authService` | `POST /api/v1/auth/login`, `GET /me`, `POST /logout` | **LIVE** | HTTP smoke Pass | Pass | OTP / change-password UI still unused |
| Announcements | `Common/Announcement/*` | **LIVE** (list/create/view/ack/reply) | `GET/POST /api/v1/announcements`, `GET /{ref}`, `POST /{ref}/acknowledge`, `POST /{ref}/replies`, `GET /categories` | **LIVE** | Pass (`test_admin_announcements` core + auth static) | Pass (list AN-0059, ack+reply persist after refresh) | Optional attachment upload via multipart; download uses `/api/v1/files/{id}/download` |
| HR Employees | `Pages/HR/EmployeeManagement/EmployeesList.jsx`, `EmployeeProfile.jsx` | **LIVE** portal + typed employees (no silent LS fallback) | `GET/POST /api/v1/hr/employees`, `GET /api/v1/hr/employees/{code}`, `GET/PUT /api/v1/hr/portal/employees` | **LIVE** (edit limited) | Pass (46: hr + hr_modules + admin directory + auth static) | Pass (list/search/filter/detail/create/status) | Portal PUT on *existing* rows only writes department / role / reportingManager / status; no hard-delete; other HR modules still mock |
| Super Admin (priority) | Dashboard KPIs, User Creation, Student/Employee directories | **LIVE** shared admin/student/HR APIs | `/api/v1/admin/dashboard`, `/api/v1/admin/users*`, `/api/v1/students`, `/api/v1/hr/portal/employees` | **PARTIAL** role (priority slice LIVE) | Pass (44 admin_users+auth+hr) | Pass (`superadmin@qmis.edu`) | See `docs/ROLE_WISE_UI_BACKEND_INTEGRATION_TRACKER.md`; other SA modules still MOCK; permission matrix write BLOCKED |
| User Management | RBAC / CreateUser | localStorage | `/api/v1/admin/...` | **MOCK** | N/A | N/A | Map admin user APIs |
| Academic (classes / timetable) | Principal/Teacher ClassTimetable | localStorage / hardcoded | `/api/v1/academics`, `/api/v1/masters` | **MOCK** | N/A | N/A | Confirm collection shapes |
| Students | Student database views | localStorage | `/api/v1/students` | **MOCK** | N/A | N/A | |
| Parents | ParentAccounts / Parent portal | localStorage | `/api/v1/parents` | **MOCK** | N/A | N/A | |
| Attendance | AttendanceAndLeaveWorkspace | localStorage | `/api/v1/attendance` | **MOCK** | N/A | N/A | |
| Exams / Marks | Exam schedule, MarkEntry | localStorage + academicService mock | `/api/v1/exams`, marks routes | **MOCK** | N/A | N/A | |
| Finance | AccountHead finance domain | in-memory seed + feeService mock | `/api/v1/finance` | **MOCK** | N/A | N/A | |
| Library | Librarian pages | localStorage | *(no dedicated library router)* | **API NOT AVAILABLE** | N/A | N/A | Propose backend module |
| Transport | TransportManager / NOC | hardcoded + transportService mock | `/api/v1/protrack` (GPS only) | **PARTIALLY** / **BLOCKED** for fleet CRUD | N/A | N/A | Fleet CRUD not in dedicated API |
| Store | StoresProcurementWorkspace | LS + purchase/inventory mock | `/api/v1/ops` fragments | **MOCK** | N/A | N/A | Confirm ops contracts before wiring |
| Leave | LeaveRequest | localStorage | `/api/v1/leave-requests` | **MOCK** | N/A | N/A | |
| Tickets / Maintenance | DepartmentTicketing, CampusMaintenance | localStorage | *(no dedicated tickets router)* | **API NOT AVAILABLE** | N/A | N/A | Propose tickets API |
| CCTV | Pages/CCTV | cctvService mock | *(no CCTV router)* | **API NOT AVAILABLE** | N/A | N/A | |
| File Room | FileRoom pages | fileRoomService mock | `/api/v1/files` (generic) | **PARTIALLY** mappable | N/A | N/A | Domain workflow gaps |
| Hostel | HostelManagementWorkspace | hostelService mock | *(no hostel router)* | **API NOT AVAILABLE** | N/A | N/A | |
| Lost & Found | LostAndFoundWorkspace | lostFoundService mock | *(no L&F router)* | **API NOT AVAILABLE** | N/A | N/A | |
| PRO | Pages/PRO | proService mock | *(no PRO router)* | **API NOT AVAILABLE** | N/A | N/A | |
| Gate pass | GatePassSecurity / FO | localStorage | `/api/v1/front-office` | **MOCK** | N/A | N/A | Map FO endpoints |
| TC | TcRequest | sessionStorage | `/api/v1/tc-requests` | **MOCK** | N/A | N/A | |
| Communication | CommunicationPage | localStorage | `/api/v1/communication` | **MOCK** | N/A | N/A | |
| Tasks | EnterpriseTaskWorkspace | localStorage | `/api/v1/tasks` (via escalations router) | **MOCK** | N/A | N/A | |
| Calendar | AcademicCalendar | localStorage | `/api/v1/calendar` | **MOCK** | N/A | N/A | |
| Global search | GlobalSearchModal | hardcoded links | *(none)* | **API NOT AVAILABLE** | N/A | N/A | |

---

## Phase 2 sprint focus

1. ~~Inventory~~  
2. ~~API architecture harden (shared client only)~~  
3. ~~Announcements → LIVE~~ (list, create, view, acknowledge, reply; **no silent mock fallback**)  
4. ~~Tracker + UAT updates~~  
5. ~~HR Employees → LIVE~~ (list/detail/create/status; honest warnings on limited portal edits)  
6. **Next:** pick another mapped module (not other HR workflows yet)

---

## HR Employees — API mapping

| HR UI Feature | Backend API | Method | Status |
|---|---|---|---|
| Employee list | `/api/v1/hr/portal/employees` | GET | **LIVE** (client-side search/filter; no server pagination query) |
| Employee details | `/api/v1/hr/portal/employees` + `/api/v1/hr/employees/{code}` | GET | **LIVE** |
| Create employee | `/api/v1/hr/employees` then merge via portal PUT | POST + PUT | **LIVE** (server assigns `employee_code`) |
| Edit employee | `/api/v1/hr/portal/employees` | PUT (full list) | **PARTIAL** — existing rows: only department, role, reportingManager, status |
| Search / filters | Client-side on portal list | — | **LIVE** (no dedicated query params) |
| Deactivate / activate | Portal PUT `status` | PUT | **LIVE** |
| Hard delete | — | — | **API NOT AVAILABLE** |

**Permissions:** create `hr.employees.write`; portal replace `hr.write`; list/detail `hr.read` / `hr.employees.read` / `hr.self`. RBAC not weakened.

**Files modified:** `ERP_QMIS/src/services/api/hrApiService.js`, `services/modules/hrApiService.js`, `services/index.js`, `Pages/HR/EmployeeManagement/EmployeesList.jsx`, `EmployeeProfile.jsx`, this tracker.

---

## Backend gaps (do not invent FE persistence)

| Gap | Suggested home | Notes |
|---|---|---|
| Library issue/catalog API | New `library` router under `/api/v1` | Follow documents/files patterns |
| Department tickets | New `tickets` or ops collection | UI has DepartmentTicketing |
| CCTV footage workflow | New `cctv` router | Approval tiers in UI only today |
| Hostel occupancy | New `hostel` or ops | |
| Lost & Found | New `lost-found` or ops | |
| PRO case tracking | New `pro` router | |
| Global search | Optional search aggregator | |

---

## Change log

| Date | Change |
|---|---|
| 2026-11-18 | Phase 1: Auth LIVE; announcements list PARTIAL |
| 2026-11-18 | Phase 2: Full inventory; Announcements LIVE (list/create/view/ack/reply); auth static tests retargeted to ERP_QMIS |
| 2026-11-18 | Phase 2: HR Employees LIVE — list/detail/create/status via portal + typed APIs; edit limited by backend `_apply_portal(existing=True)` |
