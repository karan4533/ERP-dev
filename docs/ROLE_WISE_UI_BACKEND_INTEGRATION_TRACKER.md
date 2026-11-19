# Role-Wise UI ↔ Backend Integration Tracker

**Updated:** 2026-11-19  
**Frontend:** `C:\karan\irul\ERP_QMIS`  
**Backend:** `C:\karan\irul\backend`  
**Live mode:** `VITE_USE_MOCK=false` + `VITE_API_BASE_URL=http://127.0.0.1:8000`

Status: **LIVE** | **PARTIAL** | **MOCK** | **BLOCKED** | **UAT VERIFIED**

Shared checkpoint (preserve): Auth LIVE · Announcements LIVE · HR Employees LIVE (portal edit limits).

---

## Role roadmap (backend-verified codes)

Proposed order vs actual `permissions/matrix.py` role codes:

| # | Proposed | Backend role code | Notes |
|---|---|---|---|
| 1 | Super Admin | `superadmin` | Full `_ADMIN` = all permission codes |
| 2 | Admin | `admin` | Same permission set as superadmin |
| 3 | HR | `hr` | Expansion checkpoint COMPLETE (employees + priority modules) |
| 4 | Finance / Account Head | `accounthead` (+ `finance_assistant`) | Expansion checkpoint COMPLETE (state hydrate + collect/decide) |
| 5 | Principal | `principal` | Expansion checkpoint COMPLETE (directories + received leave + announcements) |
| 6 | Teacher | `teacher` | Expansion checkpoint COMPLETE (roster + attendance + my-leave + announcements) |
| 7–25 | … | See FRONTEND_ROLES + MD_EXTRA_ROLES | Adjust if API deps require |

Do not start the next role until the current role checkpoint is reported.

---

## Super Admin — Phase A audit

**Login:** `superadmin@qmis.edu` / `superadmin123` → JWT role `superadmin` → `/super-admin/dashboard`  
**Layout:** `Layout/SuperAdminLayout.jsx` → `Routes/SuperAdminRoutes.jsx`  
**Docs (frontend):** `Pages/SuperAdmin/SUPER_ADMIN.md` (demo-era; sidebar may differ from routes)

### Feature inventory

| Area | Routes / pages | Current data source | Backend available? |
|---|---|---|---|
| Dashboard | `/super-admin/dashboard` | `dashboardData.js` mock charts | `GET /api/v1/admin/dashboard` |
| Admin user creation | `/super-admin/user-creation/*` | `adminUsersData.js` sessionStorage | `GET/POST/PATCH /api/v1/admin/users`, reset-password |
| Student directory | `/super-admin/user-database/students*` | hardcoded `STUDENTS_LIST` | `GET /api/v1/students`, `GET /students/{id}` |
| Employee directory | `/super-admin/user-database/employees*` | hardcoded `EMPLOYEES_LIST` | Shared HR `GET /hr/portal/employees` |
| Announcements | `/super-admin/announcement*` | Common → already LIVE | Announcements APIs |
| Student attendance | `/super-admin/attendance/students/list` | Admin attendance mock data | `GET /api/v1/attendance?date=` |
| Employee attendance / leave | AttendanceAndLeaveWorkspace | mock/local | HR attendance + leave-requests |
| Gate pass | `/super-admin/gate-pass*` | `gatePassData.js` | `GET /api/v1/front-office/{collection}` |
| Star ratings | recognition pages | demoDomain / awards mock | **Likely BLOCKED** (no dedicated recognition API) |
| Tasks | TaskManagementRoutes | Common task mock | `GET/POST /api/v1/tasks` (SA assigns to `admin` only) |
| Approvals | `/super-admin/approvals*` | `approvalsData.js` | `GET /api/v1/approvals/inbox`, decide |
| Finance overview | `/super-admin/finance/*` | `financeOverviewData.js` | `GET /api/v1/finance/...` |
| Audit reports | `/super-admin/audit-reports/*` | mock | `campus_audit` + partial; UI not 1:1 |
| Activity logs | `/super-admin/activity-logs/*` | large mock JS | `GET /api/v1/audit-logs` (thin payload) |
| Communication | inbox wrappers | Common mock | `/api/v1/communication/*` |
| Calendar | AcademicCalendar wrapper | Common mock | `/api/v1/calendar` |
| Notifications | wrapper | Common mock | `/api/v1/notifications` |
| Escalations | wrappers | Common mock | `/api/v1/escalations` |
| Transport overview | `transportOverviewData.js` | mock | Partial `ops` / `protrack` |
| Enterprise ops routes | Stores, ticketing, etc. | demo / mock | Mixed ops collections; many **BLOCKED** for full UI |
| RBAC permission matrix edit | ViewAdminUser module toggles | sessionStorage | **BLOCKED** — only `GET /admin/roles/.../permissions` mounted |

---

## Super Admin — Phase B mapping (priority slice)

| Feature | Endpoint | Method | Integration status |
|---|---|---|---|
| Dashboard KPIs | `/api/v1/admin/dashboard` | GET | **LIVE** (this slice) |
| List admin accounts | `/api/v1/admin/users?role=admin` | GET | **LIVE** |
| Create admin | `/api/v1/admin/users` (`role=admin`) | POST | **LIVE** |
| View / status update | `/api/v1/admin/users/{id}` | GET / PATCH | **LIVE** (status; not module toggles) |
| Reset password | `/api/v1/admin/users/{id}/reset-password` | POST | **LIVE** (from view when wired) |
| Students list/detail | `/api/v1/students`, `/students/{id}` | GET | **LIVE** |
| Employees list/detail | `/api/v1/hr/portal/employees`, `/hr/employees/{code}` | GET | **LIVE** (shared `hrApiService`) |
| Announcements | existing | — | **LIVE** (shared) |
| Permission matrix write | — | — | **BLOCKED** |
| Hard delete user | — | — | **BLOCKED** (deactivate only) |
| Remaining SA modules | see audit | — | **MOCK** until later SA slices / role work |

---

## Super Admin — Phase C implementation plan

1. Shared API services (no duplicate clients): `adminUsersApiService`, `studentApiService`, `adminDashboardApiService`; reuse `hrApiService` + `announcementApiService`.
2. Wire SA User Creation list/create/view (live when `isLiveApiEnabled()`; no silent sessionStorage fallback).
3. Wire SA student + employee directories to shared APIs.
4. Wire dashboard KPI strip to `GET /admin/dashboard` (keep existing layout/charts as decorative until later).
5. Leave other SA pages MOCK/PARTIAL with tracker labels.
6. RBAC: verify superadmin write; teacher/unauthorized denied.
7. Browser UAT as `superadmin@qmis.edu`.
8. Regression: auth static + admin users tests + HR tests + frontend build.

**Checkpoint rule:** Admin role work starts only after this Super Admin slice is reported.

---

## Super Admin — status board

| Feature | Status | UAT |
|---|---|---|
| Auth / login | LIVE | **UAT VERIFIED** (`superadmin@qmis.edu`) |
| Announcements | LIVE | Pass (shared Common) |
| Dashboard KPIs | LIVE | **UAT VERIFIED** (live KPI strip) |
| Administrator accounts list/create/status/reset | LIVE | **UAT VERIFIED** (list shows ADM-0001 after create) |
| Module permission toggles | BLOCKED | N/A (honest UI notice) |
| Student directory | LIVE | **UAT VERIFIED** (ADM-DEMO-001) |
| Employee directory | LIVE | **UAT VERIFIED** (6 portal employees via shared HR API) |
| Escalations / Tasks / Leave / Approvals / Comm / Calendar / Notifications / Gate / Finance / Audit UI / Stars / Transport / Ops | MOCK | — |

**RBAC spot-check:** teacher `GET /api/v1/admin/users` → **403**. Super Admin can create `role=admin` (seed API create `ADM-0001`).

**Super Admin checkpoint:** Priority slice complete (acked via push + Admin start).

### Files modified (this slice)

- `docs/ROLE_WISE_UI_BACKEND_INTEGRATION_TRACKER.md` (new)
- `ERP_QMIS/src/services/api/adminUsersApiService.js`
- `ERP_QMIS/src/services/api/studentApiService.js`
- `ERP_QMIS/src/services/api/adminDashboardApiService.js`
- `ERP_QMIS/src/services/modules/adminUsersApiService.js`
- `ERP_QMIS/src/services/modules/studentApiService.js`
- `ERP_QMIS/src/services/index.js`
- `ERP_QMIS/src/Common/RBAC/CreateUserPage.jsx` (async submit + live notice)
- `ERP_QMIS/src/Pages/SuperAdmin/UserCreation/*` (list/create/view)
- `ERP_QMIS/src/Pages/SuperAdmin/UserManagement/StudentDatabase/*`
- `ERP_QMIS/src/Pages/SuperAdmin/UserManagement/EmployeeDatabase/*`
- `ERP_QMIS/src/Pages/SuperAdmin/Dashboard/Dashboard.jsx`

---

## Admin — Phase A audit (menu inventory)

**Login:** `admin@qmis.edu` / `admin123` → JWT role `admin` → `/admin/dashboard`  
**Layout / routes:** Admin sidebar (`adminSidebarLinks`) → `Routes/AdminRoutes.jsx` (+ `EnterpriseOperationsRoutes` for ops stubs)

| Sidebar area | Data source before ops slice | Backend verified? | Status |
|---|---|---|---|
| Dashboard | live KPIs | `GET /admin/dashboard` | **LIVE** |
| Admissions enquiry / list | localStorage | `/admissions/enquiries`, `/admissions` | **LIVE** (ops slice) |
| Student / Employee DB | shared student + HR APIs | `/students`, `/hr/portal/employees` | **LIVE** |
| Class Details | mock | `/masters/classes*` | **MOCK** (out of scope) |
| Attendance & Leave workspace | mock workspace | attendance + leave APIs | **MOCK** workspace; **Received Leave LIVE** |
| Activities / Documents / Report cards | mock | activities/documents APIs | **MOCK** |
| Task Management | Common mock | `/tasks` | **MOCK** |
| Announcement | Common live | `/announcements` | **LIVE** |
| TC Request Approval | sessionStorage | `/tc-requests*` | **LIVE** (ops slice) |
| Communication / Calendar | mock | communication/calendar APIs | **MOCK** |
| Escalations | mock | `/escalations` | **MOCK** |
| RBAC User Creation | live admin users API | `/admin/users*` | **LIVE** |
| RBAC Roles write | blocked | read only | **BLOCKED** |
| Stores / Gate / File Room / Ticketing / Lost & Found / Relieving / Hostel / Finance / Reports | enterprise stubs | mixed/partial | **MOCK** |

**Creatable roles (server):** Principal, PRM, Teacher, Coordinator, Librarian, Gate Keeper Manager, Gate Keeper (+ ops managers). **Cannot** create `admin` / `superadmin`.

---

## Admin — Phase B mapping (identity + ops slices)

| Feature | Endpoint | Status |
|---|---|---|
| Dashboard KPIs | `GET /api/v1/admin/dashboard` | **LIVE** |
| Staff user list / create / status | `/api/v1/admin/users*` | **LIVE** (deactivate only) |
| Roles permission write | — | **BLOCKED** |
| Students list/detail | `/api/v1/students*` | **LIVE** |
| Employees list/detail | HR portal employees | **LIVE** |
| Announcements | `/api/v1/announcements*` | **LIVE** |
| Admission enquiries list | `GET /api/v1/admissions/enquiries` | **LIVE** |
| Admissions list | `GET /api/v1/admissions` | **LIVE** (empty campus OK) |
| Received leave list/decide | `GET/POST /api/v1/leave-requests*` | **LIVE** |
| TC list/decide | `GET/POST /api/v1/tc-requests*` | **LIVE** |
| Remaining Admin modules | see audit | **MOCK** |

---

## Admin — status board

| Feature | Status | UAT |
|---|---|---|
| Auth / login | LIVE | **UAT VERIFIED** (`admin@qmis.edu`) |
| Dashboard KPIs | LIVE | **UAT VERIFIED** |
| Staff user provisioning | LIVE | **UAT VERIFIED** (`TEA-0001`) |
| Permission matrix write | BLOCKED | **UAT VERIFIED** (save disabled) |
| Student directory | LIVE | **UAT VERIFIED** |
| Employee directory | LIVE | **UAT VERIFIED** |
| Announcements | LIVE | shared |
| Admission enquiries | LIVE | **UAT VERIFIED** (`AE-0001`, 1 of 1) |
| Admissions list | LIVE | **UAT VERIFIED** (live empty directory) |
| Received leave | LIVE | **UAT VERIFIED** (list 2; Admin approve LR-0002 → awaiting `hr`) |
| TC requests | LIVE | **UAT VERIFIED** (`TC-REQ-001` Approved `TC/2026/001`) |
| Other Admin modules | MOCK | — |

### Ops slice evidence (18 Nov 2026)

- **Route bug fixed:** `EnterpriseOperationsRoutes` shadowed `/admin/leave-request/received` with Attendance workspace. Admin leave routes now declared before enterprise stubs; enterprise leave stubs skipped when `role === 'admin'`.
- **Leave decide:** Admin step on director leave persists (`Awaiting 'hr' approval.` on second decide). Teacher leave remains principal→hr chain.
- **TC:** create/forward/decide as Admin; re-decide → `wrong_status`; teacher decide → **403**.
- **Teacher RBAC:** `admissions`, `admissions/enquiries`, `tc-requests`, `admin/dashboard`, `admin/users` → **403**.

### Automated tests / build

| Check | Result |
|---|---|
| `test_leave` + `test_frontend_auth_static` + `test_hr` + `test_admin_users` | **49 passed** |
| `test_admissions.py` | **3 failed** (pre-existing backend `AdmissionCreate.student_account_email` AttributeError — not FE) |
| `test_parent_tc_requests.py` | **2 failed** (pre-existing backend — not FE) |
| `npm run build` | **Pass** |

### Known limitations

- Admissions create/convert/enrol write flows not fully remounted in Admin UI (list/enquiry read LIVE; hard delete/local enrol disabled when live).
- Attendance workspace remains MOCK (intentional).
- Leave multi-step chain: Admin is not final approver when `hr` follows.
- Roles matrix write remains BLOCKED.

### Files modified (Admin ops slice)

- `src/services/api/admissionsApiService.js` (new)
- `src/services/api/leaveApiService.js` (new)
- `src/services/api/tcApiService.js` (new)
- `src/services/index.js`
- `src/Pages/Admin/FrontOffice/AdmissionEnquiry/AdmissionEnquiry.jsx`
- `src/Pages/Admin/FrontOffice/AdminssionList/AdminssionList.jsx`
- `src/Pages/Admin/TcRequest/TcRequestApprovalList.jsx`
- `src/Pages/Admin/TcRequest/ViewTcRequestApproval.jsx`
- `src/Common/LeaveRequest/ReceivedLeaveRequestsList.jsx`
- `src/Common/LeaveRequest/ViewReceivedLeaveRequestPage.jsx`
- `src/Routes/AdminRoutes.jsx`
- `src/Routes/EnterpriseOperationsRoutes.jsx` (skip Admin leave stubs only)

**Admin ops checkpoint:** COMPLETE for agreed criteria. **Next recommended role:** HR expansion (employees already LIVE). Do not start Principal/Teacher until acknowledged.

---

## HR — Phase A audit (menu inventory)

**Login:** `hr@qmis.edu` / `hr12345` → JWT role `hr` → `/hr/dashboard`  
**Layout / routes:** `Layout/HRLayout.jsx` → `Routes/HRRoutes.jsx` (+ `EnterpriseOperationsRoutes` for ops stubs)  
**Sidebar:** `hrSidebarLinks` in `sidebarLinks.js`  
**RBAC (matrix):** `_HR` + leave (`leave.read/write/decide`) + announcements write + documents.employees + approvals/notifications/escalations/tasks (staff defaults)  
**Tenant scope:** `HrRecord` / `HrEmployee` filtered by `actor.campus_id`  
**FE data layer today:** almost all modules use `Pages/HR/domain/hrStore.js` → **localStorage** + `hrSeed.js` (except Employees LIVE via `hrApiService`, Announcements LIVE via Common)  
**Layout banner:** still says “Browser-stored HR workspace” (demo) — to be replaced when live hydrate lands  
**Partner docs** mention `hydrateHrStore()` / `hrApi.js`; **not present** in this ERP_QMIS tree (only employees wired).

### Feature inventory (pre-implementation)

| Sidebar / area | Route(s) | FE data source | Backend | Pre-status |
|---|---|---|---|---|
| Dashboard | `/hr/dashboard` | `dashboardData.js` charts | No dedicated HR dashboard KPI API | **MOCK** |
| Employees | `/hr/employee-management/employees`, `…/employee-profile/:id` | `hrApiService` when live | `GET/POST /hr/employees`, `GET/PUT /hr/portal/employees` | **LIVE** (portal edit limits documented) |
| Employee Documents | `/hr/employee-management/documents` | hrStore localStorage | `GET/PUT/POST /hr/documents`, `PATCH …/{id}`, `GET …/employees/{code}/documents` | **MOCK** → API ready |
| Job Openings | `/hr/recruitment/job-openings` | hrStore | `GET/PUT/POST /hr/jobs`, `PATCH …/{id}` | **MOCK** → API ready |
| Candidates | `/hr/recruitment/candidates` | hrStore | `/hr/candidates*` | **MOCK** → API ready |
| Interviews / Feedback | `/hr/recruitment/interviews`, `…/interview-feedback` | hrStore | `/hr/interviews*` | **MOCK** → API ready |
| Onboarding (offers/joiners/obs/shadow/checklist) | `/hr/onboarding/*`, `/hr/onboarding-checklist` | hrStore | `/hr/offers*`, `/hr/onboarding*`, `/hr/observations*`, `/hr/shadow*` | **MOCK** → API ready |
| Attendance & Leave workspace | `/hr/attendance-and-leave` | `AttendanceAndLeaveWorkspace` + `attendanceLeaveData` mock | Mixed student attendance + HR collections; not 1:1 with workspace | **MOCK** (enterprise workspace) |
| Dedicated Attendance | `/hr/attendance` | hrStore | `GET/PUT/POST /hr/attendance`, `PATCH …/{id}`, `GET …/mine` | **MOCK** → API ready |
| Leave Management / policies | `/hr/leave-management`, `…/policies` | hrStore leave bundle | `GET/PUT /hr/leave` (+ `/hr/leave-policies*`, `/hr/leave-requests*`) | **MOCK** → API ready |
| Formal received leave decide | `/hr/leave-request/received*` (enterprise stub today) | Attendance workspace mock | `GET/POST /api/v1/leave-requests*` (HR is final decider) | **MOCK** stub; shared `leaveApiService` exists | 
| Training | `/hr/training*` | hrStore | `/hr/training*` | **MOCK** → API ready |
| Performance / BSC / Increment | `/hr/performance-*` | hrStore + payroll revisions | `/hr/performance*`, `/hr/payroll` revisions | **MOCK** → API ready |
| Payroll (statement/payslip/advance/ctc/referral/claim) | `/hr/payroll/*` | hrStore + some claim localStorage | `/hr/payroll`, `/hr/payroll-months*`, `/hr/payslips*`, `/hr/advances*`, `/hr/referrals*`, `/hr/claims*` | **MOCK** → API ready (bank pay **BLOCKED**) |
| Child concession | `/hr/payroll/child-concession` | hrStore + enrolled students localStorage | `/hr/concessions*` (+ admissions enrolled) | **MOCK** → API ready |
| Disciplinary | `/hr/disciplinary` | hrStore | `/hr/disciplinary*` | **MOCK** → API ready |
| Exit / Relieving | `/hr/exit*`, `/hr/relieving*` | hrStore + StaffRelievingWorkspace | `/hr/exits*` | **PARTIAL** / MOCK UI |
| Reports | `/hr/reports` | aggregates hrStore | No dedicated reports endpoint — derive from collections | **MOCK** (read-derived once collections LIVE) |
| Announcements | `/hr/announcements*` | Common announcement API | `/api/v1/announcements*` | **LIVE** |
| Notifications | `/hr/notifications` | hrStore | `/hr/notifications*` **and** campus `/notifications` | **MOCK** (HR collection) / campus bell separate |
| Stores / Lost & Found / Escalation | enterprise ops | demo stubs | mixed ops APIs | **MOCK** / out of HR priority |
| Audit Observations | `/hr/audit-observations` | enterprise | campus audit partial | **MOCK** |

### Probe evidence (local FastAPI, `hr@qmis.edu`)

All of the following returned **200** with campus-scoped payloads (sample seed present for leave/attendance/jobs/payroll/documents):  
`/hr/employees`, `/hr/portal/employees`, `/hr/attendance`, `/hr/leave`, `/hr/leave-requests`, `/hr/leave-policies`, `/leave-requests?box=received`, `/hr/documents`, `/documents/employees`, `/announcements`, `/hr/jobs`, `/hr/candidates`, `/hr/interviews`, `/hr/offers`, `/hr/onboarding`, `/hr/payroll`, `/hr/payslips`, `/hr/payroll-months`, `/hr/performance`, `/hr/training`, `/hr/disciplinary`, `/hr/exits`, `/hr/advances`, `/hr/claims`, `/hr/concessions`, `/hr/referrals`, `/hr/observations`, `/hr/shadow`, `/hr/notifications`, `/hr/announcements`, `/hr/meta`.

**Permissions:** list/read need `hr.read` or `hr.self`; writes need `hr.write`. Leave decide uses `leave.decide` on `/leave-requests/{id}/decide`.

### Existing tests (backend)

- `tests/test_hr.py` — vertical round-trip (portal, documents, jobs, leave, attendance, payroll, exits)
- `tests/test_hr_modules.py` — staff, docs, recruitment, offer/onboarding, leave→attendance sync, training, performance, payroll lock, advances, …
- `tests/test_hr_my_attendance.py`, `tests/test_admin_attendance_api.py`, leave/auth/admin_users suites
- Frontend static: `test_frontend_admin_attendance_static.py` asserts `/hr/attendance` path presence

### Phase B — dependency priority (this checkpoint)

| # | Workflow | Backend support | Plan |
|---|---|---|---|
| 1 | Leave Management (HR bundle) + formal received leave decide | `/hr/leave*`, `/leave-requests*` | **Integrate LIVE** |
| 2 | Attendance (dedicated HR page) | `/hr/attendance*` | **Integrate LIVE** |
| 3 | Payroll / payslips / advances / referrals | `/hr/payroll*`, payslips, advances, referrals | **Integrate LIVE** (mark paid via API; bank transfer **BLOCKED**) |
| 4 | Recruitment (jobs/candidates/interviews) | collections | **Integrate LIVE** |
| 5 | Performance | `/hr/performance*`, payroll revisions | **Integrate LIVE** |
| 6 | HR Documents | `/hr/documents*` | **Integrate LIVE** |
| 7 | HR Reports | derived reads | **LIVE read** once collections hydrated |
| — | Onboarding / Training / Disciplinary / Exit | collections exist | **PARTIAL** hydrate if store sync lands; full UAT optional this slice |
| — | Dashboard charts / enterprise Attendance workspace / stores / L&F | no 1:1 API | **MOCK** / **BLOCKED** |
| — | Employees / Announcements | already done | **Preserve LIVE** |

---

## Change log

| Date | Change |
|---|---|
| 2026-11-18 | Created tracker; Super Admin audit + priority slice plan; begin Super Admin LIVE wiring |
| 2026-11-18 | Super Admin priority slice LIVE + UAT: dashboard KPIs, admin users, students, employees (shared HR) |
| 2026-11-18 | Pushed ERP_QMIS to https://github.com/karan4533/new-UI_irul ; started Admin priority LIVE slice |
| 2026-11-18 | Admin priority slice LIVE + UAT: dashboard KPIs, staff users, students, employees; roles write BLOCKED |
| 2026-11-18 | Admin ops slice LIVE + UAT: admissions enquiry/list, received leave (route shadow fixed), TC decide; tracker updated |
| 2026-11-18 | HR Phase A audit + Phase B mapping recorded (before coding); employees/announcements already LIVE; most menus MOCK on hrStore |
| 2026-11-18 | HR expansion LIVE slice: leave bundle + formal received leave, attendance, payroll mark-paid, recruitment, performance, documents, derived reports; UAT + regression; checkpoint stop |

---

## HR — Phase C/D implementation + status board

**Login:** `hr@qmis.edu` / `hr12345`  
**Shared client:** extended `hrApiService` (collections + leave/payroll bundles) + existing `leaveApiService` / announcement / employee APIs.  
**No invent endpoints.** Bank payment rails remain disconnected (honest UI).

| Feature | Status | UAT |
|---|---|---|
| Auth / login | LIVE | **UAT VERIFIED** (`hr@qmis.edu` → `/hr/dashboard`) |
| Announcements | LIVE | shared Common |
| Employees list/create/status/edit | LIVE | **UAT VERIFIED** (6 of 6 portal employees) |
| Employee portal edit limits | PARTIAL | documented (existing) |
| HR Leave Management (`/hr/leave`) | LIVE | **UAT VERIFIED** (Live HR leave banner + register) |
| Formal received leave decide | LIVE | **UAT VERIFIED** (2 records; API HR approve LR-0002 → Approved) |
| Dedicated Attendance (staff `/hr/attendance*`) | LIVE | **UAT VERIFIED** (GET + PATCH persist; UI shows Late after API patch) |
| Student class attendance (`/api/v1/attendance*`) | BLOCKED for HR | HR lacks `attendance.read/write` (backend audit) |
| Job openings | LIVE | **UAT VERIFIED** (Live job openings + Edit row) |
| Candidates / Interviews | LIVE | API wired (browser spot-check jobs; API 200) |
| Employee Documents | LIVE | API wired (metadata only; no binary upload) |
| Performance reviews + increments | LIVE | API wired (`/hr/performance`, payroll revisions) |
| Payroll salary statement Mark Paid | LIVE | API ledger via PUT `/hr/payroll`; bank **BLOCKED** |
| HR Reports (derived from collections) | LIVE | no dedicated `/hr/reports` endpoint (**BLOCKED** as standalone API) |
| Dashboard charts | MOCK | decorative seed charts |
| Enterprise Attendance & Leave workspace | MOCK | intentional; not 1:1 with HR APIs |
| eSSL biometric sync | BLOCKED | disconnected in live mode |
| Onboarding / Training / Disciplinary / Exit writes | PARTIAL / MOCK | collections exist; not fully remounted this slice |
| Stores / L&F / Escalations / Audit UI | MOCK | out of HR priority |

### RBAC evidence

- HR holds `hr.*`, `leave.decide`, `documents.employees.*`
- Teacher has `hr.self` → **GET** HR collections allowed; **PUT/POST** `/hr/jobs|leave|payroll|documents|employees` → **403**
- HR decide on formal leave: LR-0002 Admin→HR chain completed (`status=Approved`, actorRole=`hr`)

### Automated tests / build

| Check | Result |
|---|---|
| `test_hr` + `test_hr_modules` + `test_hr_my_attendance` + `test_leave` + `test_frontend_auth_static` + `test_admin_users` | **76 passed** |
| `test_admissions.py` | **3 failed** (pre-existing `AdmissionCreate.student_account_email` — not fixed) |
| `test_parent_tc_requests.py` | **2 failed** (pre-existing — not fixed) |
| `npm run build` | **Pass** |

### Audit reconciliation

Pre-code audits ([HR frontend audit](bfa39f1a-d8ff-49ed-bdfd-41955e5a2461), [HR backend API audit](5dacd036-b154-4b6c-b5c5-2d66a0a5a4de)) matched the Phase A inventory (hrStore MOCK except employees/announcements; backends mounted under `/hr/*`). Post-implementation status board above supersedes those “all MOCK” FE conclusions for the priority slice. Backend nuance retained: student `/attendance*` not granted to `hr`; no dedicated `/hr/reports` (reports page is derived LIVE).

### Known limitations

- Partner `hydrateHrStore()` still not a single global store hydrate; priority pages load live per screen (no silent seed on API fail).
- Employee Profile related tabs may still read local hrStore for some side panels.
- Advances / referrals / claims / child concession / payslip print paths not fully remounted this slice.
- Dashboard and `/hr/attendance-and-leave` enterprise workspace remain MOCK.
- Paid payroll months lock on server; bank transfer never initiated.
- Dual leave surfaces remain: HR ledger `/hr/leave*` vs formal chain `/leave-requests*` (both LIVE for HR).

### Files touched (HR expansion)

- `src/services/api/hrApiService.js`, `src/services/index.js`
- `src/Pages/HR/hooks/useHrLiveCollection.js` (new)
- Leave / Attendance / Documents / Recruitment / Performance / Reports / Payroll (statement)
- `src/Pages/HR/LeaveRequest/*` (new), `Routes/HRRoutes.jsx`, `Routes/EnterpriseOperationsRoutes.jsx` (skip leave stubs for `hr`)
- `Layout/HRLayout.jsx`
- `docs/ROLE_WISE_UI_BACKEND_INTEGRATION_TRACKER.md`

**HR expansion checkpoint:** COMPLETE for agreed priority workflows with real backends. **Next recommended role:** Finance / Account Head (`accounthead`). Do not start Principal/Teacher until acknowledged.

---

## Finance / Account Head — Phase A audit (menu inventory)

**Login:** `accounthead@qmis.edu` / `accounts123` → JWT role `accounthead` → `/account-head/dashboard`  
**Layout / routes:** `Layout/AccountHeadLayout.jsx` → `Routes/AccountHeadRoutes.jsx` (+ `EnterpriseOperationsRoutes`)  
**Sidebar:** `accountHeadSidebarLinks`  
**RBAC:** `_FINANCE_HEAD` (`accounthead`) = `finance.read/collect/write/approve`, `masters.read`, `students.read`, `audit.read`, `ops.read` (+ staff leave loops).  
**`finance_assistant`:** `finance.read` + `finance.collect` only (no write/approve/ops/audit) — same Account Head UI shell today; PUT state / decide-approval / reset / gateway-confirm / apply-hr-concessions / post-payroll-voucher are **Head-only**. No separate assistant sidebar.  
**FE data layer:** `FinanceProvider` / `FinanceContext.jsx` → live `GET/PUT /api/v1/finance/state` when `VITE_USE_MOCK=false` (gated on `isSessionReady` + JWT); else localStorage seed.  
**Client:** `services/api/financeApiService.js` (wired from FinanceContext — not `feeService` `/fees/*`, which has no backend mount).

### Backend (verified)

| Surface | Endpoint | Notes |
|---|---|---|
| Full snapshot | `GET/PUT /api/v1/finance/state`, `POST …/state/reset` | Campus-scoped; GET needs `finance.write`\|`finance.collect` |
| Collections | `GET/PUT /api/v1/finance/{collection}` | Keys in `STATE_COLLECTIONS` (fees, books, wallets, transport*, approvals, …) |
| Collect fee | `POST /api/v1/finance/actions/collect-payment` | Authoritative; appends books |
| Settle cheque / send receipt / gateway | `…/settle-cheque`, `send-receipt`, `gateway-intent`, `gateway-confirm` | Receipt send may stub |
| Approvals | `POST …/decide-approval` | Needs `finance.approve`\|`write` |
| HR concessions / payroll voucher | `apply-hr-concessions`, `post-payroll-voucher` | |
| Parent my-fees | `GET /finance/my-fees` | **403** for Account Head (scoped to parent/student) |

Probe (`accounthead`): `GET /finance/state` **200** (campus has 1 student from admissions; fee masters empty / `seeded=false`). Collection GETs return [].

### Feature inventory — status board (post-implementation)

| Sidebar / area | Route | Backend | Status |
|---|---|---|---|
| Dashboard | `/account-head/dashboard` | state snapshot | **LIVE** (hydrate) |
| Fees Management | `/account-head/fees-management` | state + `collect-payment` | **LIVE** |
| Collections | `/account-head/collections` | state txns | **LIVE** (hydrate) |
| POS / EDC Sync | `/account-head/pos-sync` | posTerminals; gateway | **PARTIAL** (gateway may be `NOT_CONFIGURED`) |
| Wallet | `/account-head/wallet-management` | wallets* in state | **LIVE** (hydrate; no dedicated recharge action) |
| Transport Finance | `/account-head/transport-finance` | transport* in state + `ops.read` | **LIVE** hydrate for head; **PARTIAL** (ops route fee PUT needs `ops.write`; assistant no ops.read) |
| Accounting books | `/account-head/accounting/*` | books + settle-cheque | **LIVE** (assistant: read/collect subset) |
| Approvals | `/account-head/approvals` | approvals + `decide-approval` | **LIVE** (Head); assistant **BLOCKED** on decide |
| Reports & Analytics | `/account-head/reports-analytics` | derived from state (no `/finance/reports`) | **LIVE** (hydrate) |
| Payment Vouchers | `/account-head/payment-vouchers` | transactions OUT; `post-payroll-voucher` | **LIVE** hydrate; payroll voucher action Head-only (assistant **BLOCKED**) |
| Book Fee / Budget / MFP | demo screens | collections in state | **MOCK** / placeholder |
| Attendance workspace | `/account-head/attendance-and-leave` | leave (non-finance) | **MOCK** |
| Tasks / Stores / L&F / Escalation | enterprise | mixed | **MOCK** |
| Settings | `/account-head/settings` | `state/reset` | **LIVE** (async reset) |

### Phase B priority (checkpoint) — DONE for agreed slice

1. Snapshot hydrate + debounced persist (`GET/PUT /finance/state`) — **done**  
2. Fee collect via `collect-payment` — **done**  
3. Collections / Dashboard / Accounting / Wallet / Transport / Reports hydrate — **done**  
4. Approvals decide via `decide-approval` — **done**  
5. Receipt send / cheque settle API paths — **done** (gateway/WhatsApp may stub or `NOT_CONFIGURED`)  
6. Book Fee / MFP / enterprise ops left **MOCK** — intentional  

### Finance verification notes

- API UAT (`accounthead` / `accounts123`): seed PUT → collect `REC-*` ₹1000 → decide `APR-1` Approved; HR PUT `/finance/state` → **403**
- Pytest finance suites: **10 passed**, **2 failed** in `test_finance_actions` (receipt status `NOT_CONFIGURED` vs `queued_stub`; gateway confirm **503** without Razorpay keys) — pre-existing env, not FE regression
- Frontend `npm run build`: **Pass**

**Finance / Account Head expansion checkpoint:** COMPLETE for agreed priority workflows with real backends.

---

## Principal — Phase A audit (menu inventory)

**Login:** `principal@qmis.edu` / `principal123` → JWT role `principal` → `/principal/dashboard` (config defaults; not listed in `.env.example`). No `principal_assistant` role.  
**Layout / routes:** `Layout/PrincipalLayout.jsx` → `Routes/PrincipalRoutes.jsx` (+ `EnterpriseOperationsRoutes`, `TaskManagementRoutes`). **No** `/api/v1/principal/*` router — shared campus APIs only.  
**Sidebar:** `principalSidebarLinks`  
**RBAC (matrix + add-ons):** `_STAFF_ACADEMIC` + `exams.write`, `lessonplans.remind`, `hr.employees.read`, `students.place/promote`, `leave.decide`, `announcements.write`, `calendar.write`, `frontoffice.read`, `ops.read`/`ops.write` (write usable only on allowlisted ops collections), tasks/escalations staff grants. **No** `hr.write`, `users.*`, `finance.*`, `dashboard.read`, `tc.*`, `admissions.write`, `exams.configure`, `campus_audit.write`, `frontoffice.write`.  
**Local note:** seed user may be inactive in long-lived DBs — re-activate + password before UAT (do not wipe campus data).  
**Late FE audit note:** [Principal FE audit](a94305cc-2c6b-4caf-a4c6-a0027398a708) “directories/leave still MOCK” is superseded by the LIVE wire below.

### Backend probe (`principal`, after seed repair)

| Endpoint | Status |
|---|---|
| `GET /students`, `/hr/portal/employees`, `/hr/employees` | **200** |
| `GET /leave-requests?box=mine\|received` | **200** |
| `GET /announcements`, `/calendar`, `/exams`, `/attendance`, `/tasks`, `/escalations`, `/notifications`, `/communication/conversations` | **200** |
| `GET /admin/dashboard`, `/admin/users`, `/finance/state`, `/admissions`, `/tc-requests` | **403** |

Dedicated suite: `tests/test_principal_portal_apis.py`.

### Feature inventory (pre → post priority slice)

| Sidebar / area | Route | FE source (pre) | Backend | Status |
|---|---|---|---|---|
| Dashboard | `/principal/dashboard` | `AcademicDashboard` demo | no principal dashboard API | **MOCK** |
| Student Database | `…/student-database` | Common UserDatabase integrator | `GET /students` | **LIVE** (wired) |
| Teacher Database | `…/employee-database` | Common UserDatabase integrator | `GET /hr/portal/employees` | **LIVE** (wired) |
| Announcement | `/principal/announcement` | shared AnnouncementListView | `/announcements` | **LIVE** (shared) |
| Received leave | `/principal/leave-request/received` | was Attendance workspace mock | `/leave-requests` + decide | **LIVE** (route fixed; enterprise stubs skipped) |
| My leave | `/principal/leave-request/my-requests` | MyLeaveRequestsList local | `/leave-requests?box=mine` | **PARTIAL** (API ready; list UI still local) |
| Attendance workspace | `/principal/attendance-and-leave` | Common mock workspace | `/attendance*` | **MOCK** / **PARTIAL** API |
| Calendar | `/principal/academic-calendar` | AcademicCalendarPage | `/calendar` | **PARTIAL** (API 200; FE not live-gated yet) |
| Tasks | `/principal/task-management` | Enterprise/Task workspaces | `/tasks` | **PARTIAL** (API 200; FE mostly mock) |
| Escalations | `/principal/escalation-management` | Principal pages / Common | `/escalations` | **PARTIAL** |
| Exams / mark entry / report cards | examination + evaluation routes | local/demo | `/exams`, marks | **MOCK** / **PARTIAL** (API exists; no FE apiService yet) |
| Class timetable / teacher allocation | localStorage keys | `GET/PUT /academics/{collection}` (principal full writer) | **MOCK** FE (API LIVE-capable) |
| Home Fun / Star ratings | demo | academics collections / — | **MOCK** |
| Gate / stores / file room / L&F / reports | enterprise ops | frontoffice read; ops read (+ limited ops write) | **MOCK** FE / **PARTIAL** API |
| Finance visibility | — | — | **BLOCKED** (no `finance.*`; transport enrollment fee service also denies principal) |

### Phase B priority (this checkpoint) — DONE for agreed slice

1. Student + Teacher directory LIVE (reuse `studentApiService` / `hrApiService`) — **done**  
2. Received leave LIVE + avoid enterprise leave route shadow — **done**  
3. Preserve Announcements LIVE — **done**  
4. Leave Dashboard / exams FE client / timetable localStorage / enterprise ops as MOCK/PARTIAL — intentional  
5. Document RBAC 403s (admin users, finance, admissions, TC) — **done**

### Principal verification notes

- API: login `principal` / `principal123`; students/employees/leave/announcements/exams/calendar **200**; admin dashboard/users, finance, admissions, TC **403**
- Browser UAT: Live Principal banner; Student DB “Live students · Showing 1 of 1”; Teacher DB “Live employees · Showing 6 of 6”; Received leave “Live leave approval queue · 1 matching”
- Pytest: `test_principal_portal_apis` + leave + auth static **15 passed**; HR+finance foundation+admin users **43 passed**; admissions **3 failed** + parent-TC **2 failed** (pre-existing)
- Frontend `npm run build`: **Pass**

**Principal expansion checkpoint:** COMPLETE for agreed priority workflows with real backends.

---

## Teacher — Phase A audit (menu inventory)

**Login:** `teacher@qmis.edu` / `teacher123` → JWT role `teacher` → `/teacher/dashboard`  
**Layout / routes:** `Layout/TeacherLayout.jsx` → `Routes/TeacherRoutes.jsx` (+ enterprise/task routes). No `/api/v1/teacher/*` router.  
**Sidebar:** `teacherSidebarLinks`  
**RBAC (~32 codes):** `_STAFF_ACADEMIC` + leave read/write (no decide), tasks/escalations, announcements **read**, calendar **read**, activities **read**, communication, ops read/write (service allowlists still block most ops writes; biometric write allowed). Holds `approvals.decide` in matrix but leave decide is separate. **No** `exams.write`/`exams.configure`, `leave.decide`, `announcements.write`, `calendar.write`, `hr.employees.*`, `students.place`/`promote`, `finance.*`, `users.*`, `dashboard.read`, `campus_audit.*`, `frontoffice.*`.  
**Tenant scope:** `campus_id`; students/parents **roster-scoped** via class-teacher + `teacher-allocations` pins. Attendance/academics/exams lists are campus-scoped unless the client filters.  
**Late FE audit note:** [Teacher FE audit](93bf5f45-4c08-4c09-a3b7-08a04e7ba0c6) “attendance/students still MOCK / services unused” is superseded by the LIVE wire below.

### Backend probe (`teacher`)

| Endpoint | Status |
|---|---|
| `GET /students`, `/attendance`, `/leave-requests?box=mine`, `/announcements`, `/exams`, `/lesson-plans`, `/calendar`, `/tasks`, `/academics/class-timetables` | **200** |
| `POST /exams` | **403** (`exams.write` absent) |
| `GET /admin/users`, `/finance/state` | **403** |

Dedicated suite: `tests/test_teacher_portal_apis.py`.

### Feature inventory — status board

| Sidebar / area | Route | Backend | Status |
|---|---|---|---|
| Dashboard | `/teacher/dashboard` | no teacher KPI API | **MOCK** |
| Students List | `…/students-list` | `GET /students` (scoped) | **LIVE** |
| Class Attendance | `…/attendance/class-attendance` | `GET/POST /attendance` | **LIVE** |
| My leave | `…/leave-request/my-requests` | `GET /leave-requests?box=mine` | **LIVE** (shared list) |
| Received leave | `…/leave-request/received` | leave queue | **PARTIAL** (API; no `leave.decide`) |
| Announcement | `/teacher/announcement` | `/announcements` | **LIVE** (read) |
| Lesson plans / timetable / exams / mark entry / Home Fun | class/student menus | lesson-plans (own CRUD LIVE); academics deliverables/TT-change LIVE; class-timetables/allocations PUT **service 403**; exams create **403** | **MOCK** / **PARTIAL** FE (`lessonPlanApiService` ready) |
| Tasks / communication / calendar / escalations / enterprise ops | various | tasks/escalations/communication LIVE; calendar write **403**; library read LIVE / write **BLOCKED**; most ops verticals **BLOCKED** | **MOCK** / **PARTIAL** |
| Finance / docs / FO / TC / campus-audit | — | missing perms | **BLOCKED** |

### Phase B priority — DONE for agreed slice

1. Students roster LIVE — **done**  
2. Class attendance LIVE — **done**  
3. My-leave LIVE + enterprise leave stub skip — **done**  
4. Announcements read LIVE (shared) — **done**  
5. Leave lesson-plan/exam FE full wire + dashboard MOCK — intentional  

### Teacher verification notes

- API: `teacher` / `teacher123`; students/attendance/leave/announcements/exams/lesson-plans **200**; `POST /exams`, finance, admin users **403**; student list roster-scoped (0 when unassigned)
- Browser UAT: Live Teacher banner; students live empty roster; class attendance live GET/POST banner; my-leave live queue (1 matching)
- Pytest: teacher portal + leave + auth static **16 passed**; attendance suite **2 failed** via pre-existing admissions `student_account_email` AttributeError in enroll helper; HR/finance/principal/admin users **44 passed**; admissions **3** + parent-TC **2** still fail
- Frontend `npm run build`: **Pass**

**Teacher expansion checkpoint:** COMPLETE for agreed priority workflows with real backends.

---

## Coordinator — Phase A audit (menu inventory)

**Login:** `coordinator@qmis.edu` / `coord123` → JWT role `coordinator` → `/coordinator/dashboard`  
**Layout / routes:** `Layout/CoordinatorLayout.jsx` → `Routes/CoordinatorRoutes.jsx` (+ enterprise/task routes). No `/api/v1/coordinator/*` router.  
**Sidebar:** `coordinatorSidebarLinks` (Class, Student + Student Placement, Attendance & Leave sublinks, Announcement, Communication, Calendar, Tasks, Escalation, enterprise ops, Reports)  
**RBAC:** `_STAFF_ACADEMIC` + `exams.write` + `students.place` + `students.promote` + `hr.employees.read` + leave read/write/**decide** + announcements **read** + calendar **read** + ops read/write (service allowlists still gate verticals). **No** `exams.configure`, `announcements.write`, `calendar.write`, `finance.*`, `users.*`, `dashboard.read`, `admissions.write`, `frontoffice.*`, `campus_audit.*`.  
**Tenant scope:** `campus_id`; students **grade-band** (`coordinator_grade_bands`) ∪ teaching allocations; empty/unassigned band ⇒ empty roster. Placement APIs require `students.place` and band membership.

### Backend probe (`coordinator`)

| Endpoint | Status |
|---|---|
| `GET /students`, `/students/pending-placement`, `/students/my-grade-band`, `/attendance`, `/leave-requests?box=mine|received`, `/announcements`, `/hr/portal/employees`, `/exams` | **200** |
| `POST /exams` | **201** (`exams.write`) |
| `GET /admin/users`, `/finance/state` | **403** |

Dedicated suite: `tests/test_coordinator_portal_apis.py`.

### Feature inventory — status board

| Sidebar / area | Route | Backend | Status |
|---|---|---|---|
| Dashboard | `/coordinator/dashboard` | no coordinator KPI API | **MOCK** |
| Students List | `…/students-list` | `GET /students` (grade-band scoped) | **LIVE** / **UAT VERIFIED** |
| Student Placement | `/coordinator/student-allocation` | pending-placement + place | **LIVE** / **UAT VERIFIED** (empty pending when already placed) |
| Class Attendance | `…/attendance/class-attendance` | `GET/POST /attendance` | **LIVE** / **UAT VERIFIED** (save + refresh Present) |
| My leave | `…/leave-request/my-requests` | `box=mine` | **LIVE** / **UAT VERIFIED** |
| Received leave | `…/leave-request/received` | `box=received` + decide | **LIVE** / **UAT VERIFIED** (empty queue OK) |
| Announcement | `/coordinator/announcement` | `/announcements` | **LIVE** (read; UI may show Add but write not granted) |
| Lesson plans / timetable / exams / mark entry / Home Fun | class/student menus | exams.write LIVE-capable; lesson-plan VIEW_ALL; TT/mark UIs mostly local | **MOCK** / **PARTIAL** |
| Tasks / communication / calendar / escalations / enterprise ops | various | shared APIs PARTIAL; many ops verticals BLOCKED | **MOCK** / **PARTIAL** |
| Finance / admin users / FO / TC | — | missing perms | **BLOCKED** |

### Phase B priority — DONE for agreed slice

1. Students roster LIVE (reuse `studentApiService`) — **done**  
2. Class attendance LIVE (reuse `attendanceApiService`) — **done**  
3. My-leave + received leave LIVE (`leave.decide`) + enterprise leave stub skip — **done**  
4. Student placement LIVE (placement helpers on `studentApiService`) — **done**  
5. Announcements read LIVE (shared) — **done**  
6. Dashboard / exams FE / timetable / mark-entry full wire — intentional MOCK/PARTIAL  

### Coordinator verification notes

- API: `coordinator` / `coord123`; students/placement/attendance/leave/announcements/hr employees **200**; admin users + finance **403**; exams create **201**
- Local UAT prep: Principal assigned coordinator grade band 1–12 so roster is non-empty (honest empty without band)
- Browser UAT: Live Coordinator banner; students Showing 1 of 1 (Demo Child Sharma); class attendance Grade 10 save “saved on the server” and API refresh Present; my-leave live 0; received leave live 0; placement live band 1–12 / 0 pending; announcements 59 live
- Pytest: coordinator+teacher+leave+auth **17 passed**, attendance **2 failed** (admissions AttributeError cascade); HR/principal/admin + admissions/TC run **36 passed / 5 failed** (3 admissions + 2 parent-TC); finance foundation+`test_finance` **8 passed**; `test_finance_actions` **2 failed** (Razorpay `NOT_CONFIGURED` env — not Coordinator)
- Frontend `npm run build`: **Pass**

**Coordinator expansion checkpoint:** COMPLETE for agreed priority workflows with real backends.

---

## Regression audit — Super Admin → Coordinator (2026-11-18)

Code + API probe (local FastAPI, `VITE_USE_MOCK=false`). No production/AWS.

| Role | Login probe | LIVE features re-verified | AuthZ negatives | Status |
|---|---|---|---|---|
| Super Admin | dashboard/users/students/hr/announcements **200** | Shared FE services still wired | — | **PASS** |
| Admin | dashboard/admissions/leave/tc/students **200** | admissions/leave/tc services present | — | **PASS** |
| HR | `hr@qmis.edu` / `hr12345` employees/leave/attendance/docs **200** | hrApiService modules still live-gated | — | **PASS** (seed password `hr12345`) |
| Finance | `/finance/state` **200** | FinanceContext + financeApiService | — | **PASS** |
| Principal | students/employees/leave/announcements **200**; finance **403** | student/hr/leave pages live | finance blocked | **PASS** |
| Teacher | students/attendance/leave/announcements **200**; finance **403** | ClassAttendance + StudentsList live | finance blocked | **PASS** |
| Coordinator | students/placement/attendance/leave/announcements **200** | placement + attendance + leave live | — | **PASS** |

Pytest: ops+teacher+coordinator+leave **14 passed**; core roles **60 passed / 1 failed** (`test_hr_vertical_round_trip` 409 already_exists — DB flake). Known admissions/parent-TC/attendance AttributeError and Razorpay `NOT_CONFIGURED` unchanged. Frontend build **Pass**. No blocking FE regressions before Librarian.

---

## Librarian — Phase A audit + Phase B LIVE

**Login:** `librarian@qmis.edu` / `librarian123` → JWT `librarian` → `/librarian/dashboard`  
**Layout / routes:** `LibrarianLayout.jsx` → `LibrarianRoutes.jsx`  
**Backend:** `GET/PUT /api/v1/ops/library-books|library-issues|library-members` (`ops.read`/`ops.write`; writers = librarian + admins).  
**RBAC:** students/finance/admin users **403**; teacher library write **403**.

| Feature | Route | API | Status |
|---|---|---|---|
| Catalog list/search | `/librarian/book-management/book-list` | `library-books` | **LIVE** / **UAT VERIFIED** |
| Add book | `/librarian/book-management/add-book` | PUT `library-books` | **LIVE** |
| Members list/add | `/librarian/members/member-list` | `library-members` | **LIVE** |
| Issue / return | Circulation tab | books+issues+members replace | **LIVE** (API UAT persist) |
| Announcements | `/librarian/announcement` | shared | **LIVE** (read) |
| Book requests / dashboard KPIs | — | no dedicated API | **MOCK** |
| Finance / students dir | — | missing perms | **BLOCKED** |

**Librarian verification:** Browser Live banner + catalog UAT Physics (TOTAL TITLES 1); API issue/return avail 2→1→2; build Pass.

**Librarian expansion checkpoint:** COMPLETE.

---

## PRM / Front Office — Phase A audit + Phase B LIVE

**Login:** `prm@qmis.edu` / `prm12345` → JWT `prm` → `/front-office/dashboard`  
**Layout / routes:** `PRMLayout.jsx` → `FrontOfficeRoutes.jsx`  
**RBAC base:** `_ADMISSIONS` (`admissions.write`, `students.read`) + `hr.employees.read` + `frontoffice.read`/`write` + TC forwarder grants (`tc.read`/`tc.write`). **No** finance / admin users / hr.write.

### Endpoint mapping (used)

| Feature | API | Status |
|---|---|---|
| Enquiry list | `GET /api/v1/admissions/enquiries` | **LIVE** / **UAT VERIFIED** |
| Enquiry create/update | `POST` / `PATCH .../enquiries` | **LIVE** / **UAT VERIFIED** (browser create → 5 server rows) |
| Enquiry detail / status / convert | `GET` + `PATCH` + `POST .../convert` | **LIVE** |
| Admissions list | `GET /api/v1/admissions` | **LIVE** (shared Admin re-export) |
| Students / view | `GET /api/v1/students` | **LIVE** / **UAT** (3/3) |
| Teachers / view | `GET /api/v1/hr/portal/employees` (filtered) | **LIVE** |
| TC list / forward / reject-prm | `/api/v1/tc-requests*` | **LIVE** |
| FO collections list | `/api/v1/front-office/{collection}` | **LIVE** list (gate/transfer/re-enroll/hostel/material/goods); Add forms **PARTIAL**/local |
| Announcements | shared announcements | **LIVE** (read) |
| My leave | shared leave pages (enterprise stubs skipped for `prm`) | **LIVE**-capable routes |
| Visitors | no collection | **BLOCKED** (404) |
| Dashboard KPIs / parent DB / reports / communication UX | — | **MOCK** |
| Admission Add form full enroll | schema/UI gap | **PARTIAL** / known admissions AttributeError |
| Documents dedicated API | — | **BLOCKED** |

**Services added/extended:** `frontOfficeApiService.js`; `convertAdmissionEnquiry` + `enquiryFormToApiPayload`; `forwardTcRequest` / `rejectTcRequestAtPrm`.

### RBAC probes (local)

| Call | Result |
|---|---|
| enquiries/admissions/students/hr portal/tc/FO collections/announcements | **200** |
| FO visitors | **404** |
| finance/state, admin/users | **403** |
| Create enquiry + patch Success + create SGP-0001 | **201/OK** |

### Verification

- Browser: Live PRM banner; enquiry list 4→5 after create “PRM Browser UAT Child”; students 3/3; gate pass Showing 1 of 1  
- Pytest FO+admissions+TC+leave+auth+teacher+coordinator+principal+ops: **36 passed / 5 failed** (3 admissions AttributeError + 2 parent-TC — pre-existing)  
- Frontend `npm run build`: **Pass**

**PRM expansion checkpoint:** COMPLETE for agreed LIVE scope. **Await explicit approval before commit/push.**

---

## Regression fixes (2026-11-19) — before Hostel Warden

| Issue | Fix | Result |
|---|---|---|
| Admissions `AdmissionCreate.student_account_email` AttributeError | Optional `student_account_*` on create/update schemas; enroll soft-skips student login when email/password absent | admissions tests **pass** |
| Parent TC cascade (2 failures) | Same admissions fix unblocked TC create→decide ownership path | parent TC tests **pass** |
| Attendance roster missing pending enrolls | Roster includes `placement_status` `pending` + `placed` | attendance tests **pass** |
| Finance Razorpay expectations | Tests expect `NOT_CONFIGURED` / 503 when credentials absent (no fake payments) | finance_actions **pass** |
| HR `409 already_exists` | Not reproduced on latest runs (isolation; no app weaken) | HR tests **pass** |

---

## Hostel Warden — Phase A audit + Phase B LIVE (ops-backed)

**Login:** `hostelwarden@qmis.edu` / `hostelwarden123` → JWT `hostelwarden` → `/hostel-warden/dashboard`  
**Layout / routes:** `HostelWardenLayout.jsx` → `HostelWardenRoutes.jsx`  
**Backend role:** new matrix + seed + creatable STAFF role; writers for `ops/hostel-assignments` and `ops/hostel-payments`; `students.read` for allocation dropdown.  
**No invented** `/api/v1/hostel/*` domain APIs — only existing ops collections.

### Feature classification

| Feature | Status | Notes |
|---|---|---|
| Dashboard (assignment/payment counts) | **LIVE** / **UAT VERIFIED** | GET ops hostel collections |
| Student allocation / room occupancy rows | **LIVE** / **UAT VERIFIED** | GET/PUT `/api/v1/ops/hostel-assignments` (+ students list) |
| Check-in / vacate (status + dates on assignment row) | **LIVE** / **UAT** (UI allocate + API vacate) | No dedicated check-in endpoint |
| Hostel payment dues ledger | **LIVE** / **UAT** (page + API put) | Not Razorpay; ops rows only |
| Announcements / my leave | **LIVE**-capable (shared) | Configured under `/hostel-warden/...` |
| Dedicated hostel/room master, outpass, visitors, mess, movement register, complaints, maintenance, hostel fee collect | **BLOCKED** | No backend APIs |
| Enterprise ops stubs in sidebar | **MOCK**/enterprise | Skipped inventing hostel domain |

### Endpoint mapping

| Feature | API | Method | Status |
|---|---|---|---|
| List/replace assignments | `/api/v1/ops/hostel-assignments` | GET / PUT | **LIVE** |
| List/replace payments | `/api/v1/ops/hostel-payments` | GET / PUT | **LIVE** |
| Student roster for allocate | `/api/v1/students` | GET | **LIVE** (`students.read`) |
| Finance collect / admin users | finance/admin | — | **403** for warden |

### RBAC / UAT

| Check | Result |
|---|---|
| Login → Live banner + Active residents **1** (then allocate Fee Child) | **Pass** |
| Assignments UI save Fee Child A-202/B2 persisted (`HAS-0002`) | **Pass** |
| Payments page Live + resident options | **Pass** |
| Teacher PUT hostel-assignments | **403** |
| Warden finance/state + admin/users | **403** |

**Hostel Warden expansion checkpoint:** COMPLETE for ops-backed LIVE scope. Committed/pushed 2026-11-19 (`irul` + `ERP_QMIS`/`new-ui`).

---

## Transport Manager — Phase A audit + Phase B LIVE (ops-backed)

**Login:** `transportmanager@qmis.edu` / `transport123` → JWT `transportmanager` → `/transport-manager/dashboard`  
**Layout / routes:** `TransportManagerLayout.jsx` (Live banner) → `TransportManagerRoutes.jsx`  
**Service:** `transportApiService.js` → `GET/PUT /api/v1/ops/transport-*`

### Feature classification

| Feature | Status | Notes |
|---|---|---|
| Dashboard counts | **LIVE** | drivers/vehicles/routes/assignments |
| Drivers | **LIVE** | `transport-drivers` |
| Vehicles | **LIVE** | `transport-vehicles` |
| Routes | **LIVE** | `transport-routes` |
| Student assignments | **LIVE** | `transport-student-assignments` + `GET /students` |
| Duties | **LIVE** | `transport-duties` |
| Announcements / my leave | **LIVE**-capable | formal routes + enterprise stub skip |
| GPS / ProTrack track UI | **MOCK** / deferred | APIs exist; track page not rewired |
| Maintenance / approvals / expenses | **MOCK** | ops exist; second slice |
| Driver/Conductor NOC | **BLOCKED** | no API |
| Fake `/api/v1/transport/*` | **BLOCKED** | do not use |

### Verification

- Pytest `test_transport_manager_apis` + hostel + ops: **13 passed**
- API probe: login role `transportmanager`; PUT drivers/vehicles **200**; admin users **403**
- FE build: **Pass**
- Browser UI UAT: deferred (session occupied); use credentials above for manual check

**Transport Manager expansion checkpoint:** Phase B core fleet LIVE complete (local; push with this session).

---

## Change log (continued)

| Date | Change |
|---|---|
| 2026-11-19 | Transport Manager LIVE: drivers/vehicles/routes/student-assignments/duties via ops transport-*; dashboard + layout banner; pytest + build |
| 2026-11-19 | Regression fixes (admissions/TC/attendance/finance tests); Hostel Warden role + ops LIVE assignments/payments; committed/pushed |
| 2026-11-18 | PRM/Front Office LIVE: enquiries CRUD/convert, students/teachers, TC forward, FO collection lists, leave route fix, layout banner; UAT + pytest + build (no commit yet) |
| 2026-11-18 | Regression audit SuperAdmin→Coordinator PASS; Librarian LIVE library-books/issues/members; UAT + build |
| 2026-11-18 | Coordinator LIVE checkpoint: students/attendance/leave/placement; layout banner; enterprise leave skip; UAT + pytest + build |
| 2026-11-18 | Tracker: folded late Teacher FE/BE audit nuance (32 perms, roster vs campus scope, ops/library gates); FE “still MOCK” audit superseded |
| 2026-11-18 | Teacher LIVE checkpoint: attendance/lessonPlan services; students/attendance/my-leave; UAT + pytest + build |
| 2026-11-18 | Teacher LIVE start: attendanceApiService + lessonPlanApiService; students/attendance/my-leave; layout banner |
| 2026-11-18 | Tracker: folded late Principal FE/BE audit nuance (shared routers, ops/academics API LIVE-capable, no principal_assistant); FE “still MOCK” audit superseded |
| 2026-11-18 | Principal LIVE checkpoint: student/teacher DB, received leave routes, layout banner; UAT + pytest + build |
| 2026-11-18 | Principal Phase A/B + start LIVE: student/teacher DB, received leave routes, layout banner; API probes |
| 2026-11-18 | Tracker: folded late FE/BE audit nuance (`finance_assistant` limits, POS/transport/payroll); FE “unused financeApiService” audit is superseded by LIVE wire |
| 2026-11-18 | Finance LIVE: financeApiService + FinanceContext hydrate/collect/settle/send/decide/reset; Approvals + Settings async; layout banner; API UAT + build |
| 2026-11-18 | Finance/Account Head Phase A audit + Phase B mapping recorded (before coding) |
