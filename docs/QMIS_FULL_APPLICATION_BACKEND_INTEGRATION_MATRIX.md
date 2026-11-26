# QMIS ERP — Full Application Backend Integration Matrix

**Path:** `docs/QMIS_FULL_APPLICATION_BACKEND_INTEGRATION_MATRIX.md`\
**Audit date:** 2026-11-22\
**Mode:** AUDIT baseline + **W1 implementation notes** (2026-11-22/23). W1 did **not** commit/push/deploy.\
**Frontend:** `C:\karan\irul\ERP_QMIS` (Vite **:5175**)\
**Backend:** `C:\karan\irul\backend` (`app.main:app`, **:8000**)\
**Companion docs:** `QMIS_ROLE_WISE_INTEGRATION_AUDIT.md`, `QMIS_BACKEND_INTEGRATION_REMEDIATION_ROADMAP.md`, `ROLE_WISE_UI_BACKEND_INTEGRATION_TRACKER.md`, `QMIS_ROLE_ALIGNMENT_MATRIX.md`, `QMIS_W1_IMPLEMENTATION_REPORT.md`

---

## 1. Methodology and evidence tiers

| Tier | Meaning |
|---|---|
| **R** | Runtime this audit: HTTP against `:8000` and/or browser FE with live env |
| **T** | Prior tracker UAT (`ROLE_WISE_UI_BACKEND_INTEGRATION_TRACKER.md`) treated as historical evidence |
| **C** | Code/path evidence only (service → router → model); not re-exercised in browser this pass |

**LIVE classification rules (strict):** Frontend action must call FastAPI under live env (`VITE_USE_MOCK=false` + `VITE_API_BASE_URL` set), handler uses SQLAlchemy DB, response drives UI. Presence of `*ApiService.js` alone is **not** LIVE.

**PARTIAL:** Mix of LIVE ops + MOCK/localStorage/session ops, or API exists but FE primary SoT is still browser storage.

**MOCK / LOCALSTORAGE / FRONTEND ONLY:** Hardcoded, `mockAdapter`, `*Data.js`, or browser storage is authoritative.

**BACKEND MISSING:** FE calls a path with no mounted FastAPI router (or domain never implemented).

**BLOCKED:** Cannot verify (credentials, empty scope, infra) — not assumed LIVE.

---

## 2. Environment discovery (this machine)

| Item | Finding |
|---|---|
| Paths | `ERP_QMIS` and `backend` confirmed present under `C:\karan\irul` |
| FE live flags | `.env.local`: `VITE_USE_MOCK=false`, `VITE_API_BASE_URL` set (value redacted) |
| `isLiveApiEnabled()` | Requires **both** base URL and `VITE_USE_MOCK === 'false'` (`services/api/tokenStore.js`) |
| `apiClient` | Uses HTTP when live; otherwise `mockAdapter` (`schoolerp_mock_db_v1_*`) |
| Running ports | FE **5175** Listen; API **8000** Listen; **5173/8001** not bound |
| Health | `GET /health` → `200 {"status":"ok"}` |
| OpenAPI | **209** paths; **35** distinct `/api/v1/...` first segments |
| Runtime DB | **SQLite** (`settings.is_sqlite=True`, `environment=development`) — process DB, not assumed Postgres |
| Alembic | **19** revisions; latest `0019_calendar_event_times.py` |
| Silent mock fallback | Many enterprise pages never call `isLiveApiEnabled` (0 page refs) → always local SoT even when live env is on |

### Auth spot-check (R) — login only

| Seed account tried | Result |
|---|---|
| superadmin, admin, principal, teacher, coordinator, librarian, parent, student, director, driver, transportmanager | **OK** (role match) |
| hr, accounthead, prm, gatekeeper, hostelwarden | **401** with passwords tried this pass — seed credentials differ; **not** proof APIs missing |

---

## 3. Roles discovered

### Frontend portal roles (`ERP_QMIS/src/constants/roles.js`) — **31**

`superadmin`, `admin`, `student`, `parent`, `librarian`, `hostelwarden`, `prm`, `gatekeeper`, `gatekeepermanager`, `director`, `principal`, `canteenmanager`, `itsupportmanager`, `stationerystoremanager`, `housekeepingmanager`, `maintenancemanager`, `transportmanager`, `teacher`, `coordinator`, `jointdirector`, `jointdirectorassistant`, `jointdirectoraudit`, `processauditor`, `qualityauditor`, `hr`, `accounthead`, `driver`, `pro`, `fileroom`, `cctv`

### Backend RBAC (`backend/app/permissions/matrix.py`) — **31 FE-aligned + 2 BE-only** (after W1)

W1 registered FE portals `maintenancemanager`, `pro`, `fileroom`, `cctv` into `FRONTEND_ROLES` with **conservative** grants.\
Backend extras (still no dedicated FE `ROLES` portal): `managing_director`, `finance_assistant`.\
Aliases + `normalize_role_code` documented in `QMIS_ROLE_ALIGNMENT_MATRIX.md`.

**Pre-W1 gap (historical):** Four FE portals lacked matrix role codes. **Post-W1:** ALIGNED for those four; BE-only MD/FA unchanged by design.

Layouts: **30** role layouts. `EnterpriseOperationsRoutes` composed into **28** staff portals (not Driver/Student/Parent).

---

## 4. Backend surface (mounted)

Routers registered in `backend/app/main.py` (not unused `api/v1/router.py`):

`/api/v1/auth`, `/admin`, `/masters`, `/admissions`, `/parents`, `/students`, `/attendance`, `/approvals`, `/notifications`, `/exam-types`, `/exams`, `/marks-batches`, `/results`, `/lesson-plans`, `/escalations`, `/tasks`, `/leave-requests`, `/finance`, `/hr`, `/files`, `/documents`, `/announcements`, `/calendar`, `/tc-requests`, `/activities`, `/communication`, `/front-office/{collection}`, `/academics/{collection}`, `/ops/{collection}`, `/campus-audit/{collection}`, `/protrack`, `/geo`, `/webhooks`, `/audit-logs`

**Not mounted / no dedicated router:** `/api/v1/cctv`, `/api/v1/fileroom`, legacy FE module paths (`/inventory`, `/hostel`, `/transport`, `/purchase`, `/awards`, `/lostfound`, …). Many of those domains are intended via **ops/front-office JSON collections** when FE is wired — most enterprise UIs still use local `*Data.js` instead.

### Primary DB models / tables (mapped)

| Domain | Models / tables |
|---|---|
| Identity | `users`, `user_profiles`, `campuses`, `roles`, `permissions`, `role_permissions` |
| Academics masters | `academic_years`, classes/sections/subjects |
| Admissions / students | `admission_enquiries`, admissions, `students`, `guardians`, grade bands |
| HR | `hr_employees`, `hr_records` (JSON collections) |
| Finance | `finance_records` (JSON state) |
| Ops / FO / academics / audit JSON | `ops_records`, `front_office_records`, `academics_records`, `audit_records` |
| Workflow | approvals, notifications, escalations, tasks, leave_requests |
| Teaching | student_attendance, lesson_plans, exams/marks |
| Comms | announcements, conversations/messages, calendar_events, activities |
| Files / TC | file_assets, documents, tc_requests |
| Audit | audit_logs, system_audit_logs |

---

## 5. Shared enterprise modules (multi-role) — overall

These ship via `EnterpriseOperationsRoutes` / Common workspaces. **Primary SoT for most is FE localStorage / demo**, even though some ops collections return `200` when called directly.

| Module | FE SoT | Matching BE | Overall |
|---|---|---|---|
| Announcements | `announcementApiService` when live | `/announcements` | **LIVE** (shared; T+R capable) |
| Approvals (generic inbox) | `approvalsApiService` when live | `/approvals` | **LIVE** (SA/Director paths; T+R) |
| Calendar | mixed FE + `calendarApiService` | `/calendar` | **PARTIAL** |
| Communication | `communicationData.js` | `/communication` | **PARTIAL / mostly MOCK UI** |
| Stores & Procurement | `storesProcurementData.js` | no dedicated router; ops partial | **MOCK / LOCALSTORAGE** |
| Department Helpdesk | `departmentTicketingData.js` | no dedicated helpdesk router | **MOCK / LOCALSTORAGE** |
| Physical File Room | `fileRoomData.js` + mock fileroom | no mounted fileroom API | **MOCK / LOCALSTORAGE** (+ **BACKEND MISSING** dedicated) |
| Lost & Found | local + mock lostfound | `ops/hk-lost-found` exists (R: `200 []`) | **PARTIAL** (FE local primary) |
| Activity Monitoring | local SoT | no dedicated API | **MOCK** |
| Activity Logs (SA) | `activityLogsData.js` | thin `/audit-logs` | **MOCK / DEMO** (UI) |
| Task Management | `taskManagementData.js` | `/tasks` exists | **PARTIAL** (FE mock primary for enterprise UI) |
| Attendance & Leave workspace | `attendanceLeaveData.js` | leave/attendance APIs exist for formal pages | **MOCK workspace / LIVE formal leave on wired roles** |
| Escalations | local + `/escalations` | `/escalations` | **PARTIAL** |
| Staff Relieving / NOC | local / HR exits | HR exits partial | **MOCK / PARTIAL** |
| Star Ratings SOM/SOY | recognition local + awards mock | **no `/awards` router** | **MOCK / BACKEND MISSING** |
| Gate Pass (enterprise) | gatePass data / FO collections | FO collections when wired | **PARTIAL** |

---

## 6. Role × module matrix (representative operations)

Columns: Role | Module | Screen / area | Operation | FE entry | API | Handler / store | DB | Evidence | Persistence | Status

### 6.1 Authentication (all roles)

| Role | Module | Screen | Op | FE | API | Backend | DB | Ev | Persist | Status |
|---|---|---|---|---|---|---|---|---|---|---|
| * | Auth | Sign-in | Login | `AuthContext` | `POST /api/v1/auth/login` | auth endpoint | `users` | R | JWT session | **LIVE** |
| * | Auth | Session | Me / token | tokenStore | Bearer header | JWT | users | C/R | session/local | **LIVE** |

### 6.2 Super Admin (`superadmin`)

| Module | Screen | Op | FE | API | Backend | DB | Ev | Persist | Status |
|---|---|---|---|---|---|---|---|---|---|
| Dashboard | KPIs | Read | adminDashboardApiService | `GET /admin/dashboard` | dashboard | aggregates | R (1/3 students/emp) | N/A | **LIVE** |
| Dashboard | Charts / surplus | Read | dashboardData | — | — | — | C | — | **MOCK** |
| Compliance Score | Cards | Read | mock 91% | — | — | — | C/T | — | **MOCK** |
| User Creation | Admin users | CRUD/status | adminUsersApiService | `/admin/users*` | admin_users | users | T | DB | **LIVE** (toggles **BLOCKED**) |
| User Database | Students | List/detail | studentApiService | `/students*` | students | students | T/R | DB | **LIVE** |
| User Database | Employees | List/detail | hrApiService | `/hr/portal/employees` | hr | hr_employees | T | DB | **LIVE** |
| Announcements | List/create | CRUD | announcementApiService | `/announcements*` | announcements | announcements | T | DB | **LIVE** |
| Approvals | Inbox/refresh/decide | Read/decide | approvalsApiService | `/approvals*` | approvals | approval_* | T/R | DB | **LIVE** |
| Attendance students | List | Read | attendanceApiService | `/attendance` | attendance | student_attendance | T | DB | **LIVE / PARTIAL** |
| Star Ratings | SOM/SOY | All | recognition local | — | — | — | C/T | LS | **MOCK / LOCALSTORAGE** |
| Activity Logs | All types | Read/inspect | activityLogsData | (audit-logs thin) | audit | audit_logs | C/T | demo | **MOCK / DEMO** |
| Stores | All tabs | CRUD | storesProcurementData | — | — | — | C/T | LS | **MOCK / LOCALSTORAGE** |
| Helpdesk | Tickets/CSV | CRUD/export | departmentTicketingData | — | — | — | C/T | LS | **MOCK / LOCALSTORAGE** |
| File Room | Inward/outward | CRUD | fileRoomData | — | — | — | C/T | LS | **MOCK / LOCALSTORAGE** |
| L&F | Directory/CSV | CRUD/export | lostAndFound* | ops optional | ops_records | C/T/R empty | LS | **PARTIAL** |
| Monitoring | Filters/review | UI | local | — | — | — | C/T | LS | **MOCK** |
| Tasks | Workspace | CRUD | taskManagementData | `/tasks` unused primarily | tasks | C | LS | **MOCK / PARTIAL** |
| Leave workspace | Enterprise | CRUD | attendanceLeaveData | leave APIs exist | leave | C | LS | **MOCK** |
| Calendar | Schedule | Create/validate | calendarApiService + FE | `/calendar` | calendar | calendar_events | T/R | **PARTIAL** |
| Gate Pass | Export PDF | Export | buildValidPdf + FO partial | FO collections | FO | T | **PARTIAL** |
| Finance overview | SA finance pages | Read | financeOverviewData | `/finance` available | finance_records | C | — | **MOCK / PARTIAL** |
| Audit reports | Tables | Read | mock | campus-audit collections | audit_records | C | — | **MOCK** |

### 6.3 Admin (`admin`)

| Module | Op focus | Status | Evidence |
|---|---|---|---|
| Dashboard KPIs | Read | **LIVE** | T + shared `/admin/dashboard` |
| Admissions enquiry/list | List/create | **LIVE** | T |
| Students / Employees | List | **LIVE** | T |
| Received leave decide | List/decide | **LIVE** | T |
| TC decide | List/decide | **LIVE** | T |
| Announcements | CRUD | **LIVE** | T |
| User creation | CRUD | **LIVE** | T |
| Class details / activities / report cards / enterprise ops | — | **MOCK / PARTIAL** | T |
| Attendance & Leave workspace | — | **MOCK** | T |

### 6.4 HR (`hr`)

| Module | Op focus | Status | Evidence |
|---|---|---|---|
| Employees / portal | CRUD subset | **LIVE** | T; R `GET /hr/employees` 200 |
| Leave bundle + formal decide | Read/write/decide | **LIVE** | T |
| Attendance (HR collection) | Read/write | **LIVE** | T |
| Recruitment / performance / documents / payroll mark-paid | Priority slice | **LIVE** | T |
| Enterprise Attendance workspace | — | **MOCK** | T |
| Dashboard charts | — | **MOCK** | T |
| Bank pay Razorpay | Pay | **BLOCKED / NOT_CONFIGURED** when unset | T |

### 6.5 Finance / Account Head (`accounthead`)

| Module | Op focus | Status | Evidence |
|---|---|---|---|
| Finance state hydrate | Read | **LIVE** | T; R `GET /finance/state` 200 |
| Fee collect / cheque settle / approvals decide | Write | **LIVE** (Head) | T |
| Reports derived from state | Read | **LIVE** (hydrate) | T |
| Assistant decide / some vouchers | — | **BLOCKED** for assistant | T |
| Razorpay collect | Pay | Config-dependent; no fake success | T/C |

### 6.6 Principal / Teacher / Coordinator

| Role | LIVE modules (priority) | MOCK / PARTIAL remainder |
|---|---|---|
| Principal | Students, employees, announcements, received leave | Dashboard MOCK; exams/timetable/enterprise ops PARTIAL/MOCK |
| Teacher | Roster, class attendance, my-leave, announcements read | Dashboard MOCK; exams create 403; many deliverables PARTIAL |
| Coordinator | Roster, placement, attendance, my/received leave, announcements read | Dashboard MOCK; enterprise MOCK |

### 6.7 Librarian / PRM / Hostel / Transport / Gate / Driver

| Role | LIVE (ops or domain) | MOCK / BLOCKED |
|---|---|---|
| Librarian | library-books/members/issues via ops/collections (T) | Dashboard KPIs MOCK; finance BLOCKED |
| PRM | Enquiries, admissions, students, TC, FO collections list; **Visitors LIVE** via ops `gate-visitors` (+ FO `visitors` alias) **(W1 R)** | Dashboard/reports MOCK; Add forms PARTIAL; enterprise ops LOCAL/MOCK with honest indicators |
| Hostel Warden | ops hostel-assignments/payments | Rooms/outpass/mess/visitors **BACKEND MISSING** |
| Transport Manager | ops fleet/routes/assignments (T) | GPS depends on ProTrack config; many reports MOCK |
| Driver | transport APIs when live (high page live refs) | Subset of manager domain |
| Gate Keeper / Manager | gate/FO collections when wired (T partial) | Incidents/duty often local |

### 6.8 Parent / Student

| Role | LIVE-capable | Status note |
|---|---|---|
| Parent | Linked children, fees (`/finance/my-fees`), attendance, announcements, TC ownership | **PARTIAL** overall — portal uses `StudentPortalRoutes`; isolation must stay BE-enforced (T parent TC) |
| Student | Own roster views, fees, announcements | **PARTIAL**; Home Fun attachments often **MOCK** |

### 6.9 Director

| Module | Status | Note |
|---|---|---|
| Exam approvals | **PARTIAL** | Shared SoT + live exams merge; approvalId LIVE path incomplete for seed rows |
| Student/Teacher year scoping | **PARTIAL** | FE scoping; not full REST history |
| Cultural activities | **PARTIAL** | local SoT + event refresh |
| Report cards | **PARTIAL** | crash fixed; data not full LIVE |
| Announcements / approvals | **LIVE**-capable | shared |

### 6.10 Institutional / ops managers (mostly MOCK)

Roles: `canteenmanager`, `itsupportmanager`, `stationerystoremanager`, `housekeepingmanager`, `maintenancemanager`, `jointdirector*`, `processauditor`, `qualityauditor`, `pro`, `fileroom`, `cctv`

| Finding | Status |
|---|---|
| `isLiveApiEnabled` page refs ≈ **0** | Screens not gated to live HTTP |
| FE layouts/routes exist | UI present |
| Dedicated BE namespaces for CCTV/FileRoom/PRO | **BACKEND MISSING** or only mockAdapter |
| Some JD overview may read ops collections | **PARTIAL** at best; treat as **MOCK** until wired |

---

## 7. Status rollup (module-level, not every button)

Counts below are **module inventory units** across roles (shared enterprise counted once + role-priority modules). Methodology: inventory of distinct module areas from sidebars + tracker (~**180** module-role cells compressed to unique module areas ~**95**).

| Classification | Approx. module areas | Notes |
|---|---:|---|
| **LIVE** (fully for priority ops) | ~28 | Auth, SA/Admin priority, HR priority, Finance hydrate/collect, Principal/Teacher/Coordinator priority, Librarian books, PRM admissions/TC, Hostel/Transport ops slices |
| **LIVE — PARTIAL** | ~22 | Calendar, exams/approvals, gate FO, L&F, tasks, communication, Director exams, Parent/Student portals |
| **MOCK / LOCALSTORAGE / FRONTEND ONLY** | ~35 | Helpdesk, Stores, File Room UI, Activity Logs UI, Star Ratings, Monitoring, most enterprise workspaces, auditor UIs, canteen/IT/stationery/HK/maintenance portals |
| **BACKEND MISSING** (dedicated domain) | ~7 | CCTV API, FileRoom API, Awards/Star Ratings API, Hostel domain beyond ops rows, legacy `/inventory|/transport|/hostel` FE module clients (Visitors FO 404 **resolved in W1** via ops SoT + alias) |
| **BLOCKED** | ~5+ | Razorpay when unset; RBAC matrix write; some role logins this pass; empty roster scopes |

**Operation-level honesty:** A LIVE module typically has 3–8 critical ops LIVE; MOCK enterprise modules may have 5–15 ops all local. Do **not** interpret “28 LIVE modules” as “most of the ERP.”

### Runtime-verified endpoints this audit (R)

| Endpoint | Result |
|---|---|
| `POST /api/v1/auth/login` | 200 + token (multiple roles) |
| `GET /api/v1/admin/dashboard` | 200 students=1 employees=3 |
| `GET /api/v1/students` | 200 |
| `GET /api/v1/hr/employees` | 200 |
| `GET /api/v1/finance/state` | 200 |
| `GET /api/v1/calendar` | 200 events |
| `GET /api/v1/ops/hk-lost-found` | 200 `[]` |
| `GET /api/v1/leave-requests?box=received` | 200 `[]` |
| `GET /api/v1/approvals/inbox` | 200 `[]` |
| `GET /api/v1/announcements` | 200 `[]` |
| OpenAPI path count | 209 |

Browser: SA dashboard KPI strip matched API (Students 1 / Employees 3).

---

## 8. Mock / localStorage hotspots (primary SoT)

| Area | Key files |
|---|---|
| Global mock API | `services/api/mockAdapter.js`, `services/data/seedData.js` |
| Enterprise | `storesProcurementData.js`, `departmentTicketingData.js`, `fileRoomData.js`, `lostAndFoundData.js`, `gatePassSecurityData.js`, `taskManagementData.js`, `employeeActivityMonitoringData.js`, `attendanceLeaveData.js` |
| Recognition | recognition / awards modules + mockAdapter awards |
| Activity logs | `Pages/SuperAdmin/ActivityLogs/activityLogsData.js` |
| Finance FE cache | `financeStorage.js` (hydrate from LIVE state when enabled) |
| HR FE cache | `hrStorage.js` / `hrStore.js` (LIVE path when enabled) |
| RBAC UI | `rolePermissionsData.js` localStorage |
| Auth session | `schoolerp_auth` / persistent keys |

---

## 9. RBAC and isolation (summary)

| Check | Finding |
|---|---|
| JWT on protected routes | Required by FastAPI deps (C/T) |
| Teacher denied admin/finance | Prior T: 403 |
| Parent TC ownership | Prior T after admissions fix |
| Student/parent data scope | BE campus + linkage; FE portal shared components — **must stay API-enforced** |
| FE-only RBAC toggles | Admin module toggles **BLOCKED** on API write |
| FE roles without BE codes | `fileroom`, `cctv`, `pro`, `maintenancemanager` — isolation unclear / incomplete |

---

## 10. What this audit does **not** claim

- Full browser UAT of every tab for every role on 2026-11-22.
- That ops `200 []` means the FE module is LIVE.
- That SQLite runtime equals production Postgres deployment.
- That uncommitted local FE fixes are on remote for collaborators.

---

## 11. Confirmation

- Application source, DB schema, env files, and business data were **not** modified for this audit.
- No commit, push, merge, or deployment performed.
