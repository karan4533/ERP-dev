# NEW UI ↔ Reference Backend Integration Matrix

**Path:** `docs/NEW_UI_REFERENCE_BACKEND_INTEGRATION_MATRIX.md`\
**Created:** 2026-11-22\
**Frontend:** `ERP_QMIS` (new UI)\
**Backend:** local `backend/` (same FastAPI stack as [Heuristic-Labs/QMIS](https://github.com/Heuristic-Labs/QMIS.git))\
**Live gate:** `VITE_USE_MOCK=false` + `VITE_API_BASE_URL` set

**Companions:** `QMIS_FULL_APPLICATION_BACKEND_INTEGRATION_MATRIX.md`, `ROLE_WISE_UI_BACKEND_INTEGRATION_TRACKER.md`, `NEW_UI_REFERENCE_BACKEND_IMPLEMENTATION_REPORT.md`

Status values: **LIVE** | **PARTIAL** | **MOCK** | **MISSING** | **BLOCKED**

---

## Delivery phases

| Phase | Roles | Rule |
|---|---|---|
| 0 | Super Admin, Admin, PRM (Front Desk) | Partner-complete — **regression only** |
| 1 | HR, Finance, Principal, Teacher, Coordinator, Parent, Student | Core — **stabilization complete** ([final report](./PHASE1_FINAL_STABILIZATION_REPORT.md)); awaiting approval before Phase 2 |
| 2 | Librarian, Transport Manager, Driver, Hostel Warden, Gate Keeper | After Phase 1 exit approval |
| 3 | Specialty portals | After Phase 2; Helpdesk/Stores/File Room/CCTV/PRO/Awards stay **MOCK** without approval |

---

## Auth (all roles)

| UI role | UI screen | User action | Reference API | Method | Integration status |
|---|---|---|---|---|---|
| * | Sign-in | Login | `/api/v1/auth/login` | POST | LIVE |
| * | Session | Me / bootstrap | `/api/v1/auth/me` | GET | LIVE |
| * | Sign-out | Logout | `/api/v1/auth/logout` | POST | LIVE |

---

## Phase 0 — Regression baselines (do not reimplement)

### Super Admin

| UI screen | User action | Reference API | Method | Status |
|---|---|---|---|---|
| Dashboard | KPI read | `/api/v1/admin/dashboard` | GET | LIVE |
| Dashboard charts / surplus | Read | — | — | MOCK |
| User creation | CRUD / status | `/api/v1/admin/users*` | GET/POST/PATCH | LIVE |
| Module permission toggles | Write | `/admin/roles/{code}/permissions` | GET only (PATCH 405) | BLOCKED (read-only UI; no false success) |
| Students / Employees | List/detail | `/students*`, `/hr/portal/employees` | GET | LIVE |
| Announcements | CRUD | `/announcements*` | * | LIVE |
| Approvals inbox | List/decide | `/approvals*` | GET/POST | LIVE |
| Student attendance | List | `/attendance` | GET | PARTIAL |
| Helpdesk / Stores / File Room / Star Ratings / Activity Logs UI | All | — / thin audit | — | MOCK (deferred) |
| Tasks / Escalations enterprise | CRUD | `/tasks`, `/escalations` | * | PARTIAL → wire in Phase 1 shared Common |
| Lost & Found | CRUD | `/ops/hk-lost-found` | GET/PUT | PARTIAL |

### Admin

| UI screen | User action | Reference API | Method | Status |
|---|---|---|---|---|
| Dashboard KPIs | Read | `/admin/dashboard` | GET | LIVE |
| Admissions | List/create | `/admissions*` | * | LIVE |
| Students / Employees | List | `/students*`, `/hr/portal/employees` | GET | LIVE |
| Received leave | List/decide | `/leave-requests*` | GET/POST | LIVE |
| TC decide | List/decide | `/tc-requests*` | * | LIVE |
| Announcements / Users | CRUD | `/announcements*`, `/admin/users*` | * | LIVE |
| Class details / report cards / enterprise ops | — | — | — | MOCK / PARTIAL |

### PRM (Front Desk)

| UI screen | User action | Reference API | Method | Status |
|---|---|---|---|---|
| Enquiries / Admissions / Students / TC | CRUD / forward | `/admissions*`, `/students*`, `/tc-requests*` | * | LIVE |
| FO gate-pass collections | List | `/front-office/{collection}` | GET | LIVE |
| Visitors | Check-in | `/ops/gate-visitors` | GET/PUT | PARTIAL (ops; FO visitors path was 404) |
| Dashboard / reports | Read | — | — | MOCK |

---

## Phase 1 — Core roles

### HR (`hr`)

| UI screen | User action | Reference API | Method | Status |
|---|---|---|---|---|
| Employees | List/detail/edit | `/hr/portal/employees*` | GET/PATCH | LIVE |
| Employee documents | Metadata | `/hr/documents*` | * | LIVE |
| Job openings / Candidates / Interviews | CRUD subset | `/hr/jobs*`, `/candidates*`, `/interviews*` | * | LIVE |
| Dedicated attendance | Read/write | `/hr/attendance` | GET/PUT | LIVE |
| Leave management / received leave | List/decide | `/leave-requests?box=received`, `…/decide` | GET/POST | LIVE |
| My leave (formal) | List/create/view | `/leave-requests` | GET/POST | LIVE (wired this pass; was workspace MOCK) |
| Attendance & Leave workspace | Overview tabs | local `attendanceLeaveData` | — | MOCK (eSSL/demo; labeled) |
| Onboarding / Training / Disciplinary / Exit | Collections | `/hr/{collection}` where mounted | * | PARTIAL |
| Payroll mark-paid | Write | `/hr/payroll*` | * | LIVE |
| Bank / Razorpay pay | Pay | gateway | — | BLOCKED when unset |
| Announcements | CRUD | `/announcements*` | * | LIVE |
| Stores / Audit / Relieving / L&F / Escalation | Enterprise | ops / escalations / local | * | MOCK / PARTIAL |
| Dashboard charts | Read | — | — | MOCK |

### Finance / Account Head (`accounthead`, `finance_assistant`)

| UI screen | User action | Reference API | Method | Status |
|---|---|---|---|---|
| Finance hydrate | Read/write state | `/finance/state` | GET/PUT | LIVE (Head write; assistant limited) |
| Fees / Collections | Collect | `/finance/actions/collect-payment` | POST | LIVE |
| Cheque settle / receipts | Write | settle-cheque / send-receipt | POST | LIVE |
| Approvals decide | Decide | `/finance/actions/decide-approval` | POST | LIVE (Head); BLOCKED (assistant) |
| Accounting books / wallet / transport | Hydrate | `/finance/{collection}` | GET | LIVE |
| POS / EDC / Razorpay | Pay | gateway | — | BLOCKED / NOT_CONFIGURED |
| Book Fee / Budget / MFP | Placeholders | — | — | MOCK |
| Attendance & Leave / Tasks / Stores | Enterprise | leave/tasks/local | — | MOCK / PARTIAL |

### Principal (`principal`)

| UI screen | User action | Reference API | Method | Status |
|---|---|---|---|---|
| Student / Teacher database | List/detail | `/students*`, `/hr/portal/employees` | GET | LIVE |
| Announcements | CRUD | `/announcements*` | * | LIVE |
| Received leave | List/decide | `/leave-requests*` | GET/POST | LIVE |
| My leave | List/create/view | `/leave-requests*` | GET/POST | LIVE (create/detail wired this pass) |
| Calendar | Read/create | `/calendar` | GET/POST | LIVE (shared AcademicCalendarPage hydrate) |
| Tasks / Escalations | CRUD | `/tasks*`, `/escalations*` | * | LIVE (Common wire this pass) |
| Exams / mark entry / timetable | Mixed | `/exams*`, `/academics/*` | * | PARTIAL |
| Star Ratings / Home Fun / Helpdesk / File Room / Stores / Activity Monitoring | — | — | — | MOCK (deferred domains) |
| Gate pass | Approvals | FO collections | * | PARTIAL |
| Dashboard | Charts | — | — | MOCK |

### Teacher (`teacher`)

| UI screen | User action | Reference API | Method | Status |
|---|---|---|---|---|
| Students list | Roster | `/students` (scoped) | GET | LIVE |
| Class attendance | GET/POST | `/attendance` | GET/POST | LIVE |
| My leave | List/create/view | `/leave-requests*` | * | LIVE (create/detail this pass) |
| Announcements | Read | `/announcements*` | GET | LIVE |
| Lesson plans | CRUD/submit | `/lesson-plans*` | * | LIVE (wire this pass) |
| Exams create | Create | `/exams` | POST | BLOCKED (no `exams.write`) |
| Exam list / mark entry / Home Fun / Star Ratings | Mixed | exams / academics / local | * | PARTIAL / MOCK |
| Tasks / Escalations / Calendar | CRUD/read | `/tasks*`, `/escalations*`, `/calendar` | * | LIVE |
| Stores / Helpdesk / L&F / Audit / Relieving | Enterprise | — | — | MOCK |
| Dashboard | Charts | — | — | MOCK |

### Coordinator (`coordinator`)

| UI screen | User action | Reference API | Method | Status |
|---|---|---|---|---|
| Students / Placement | List/place | `/students*`, `pending-placement`, place | * | LIVE |
| Class attendance | GET/POST | `/attendance` | * | LIVE |
| My + received leave | List/create/decide | `/leave-requests*` | * | LIVE |
| Announcements | Read | `/announcements*` | GET | LIVE (create BLOCKED — no `announcements.write`) |
| Exam Management schedules | List / create+submit | `/exams`, `/exams/{id}/submit` | GET/POST | LIVE (UAT: schedules hydrate + create) |
| Exam blueprints / grading / invigilation | View / local edit | `/exam-weightage` (unused by UI) / local | — | MOCK / LOCAL ONLY |
| Lesson plans | View/approve | `/lesson-plans*` | * | LIVE / PARTIAL |
| Mark entry / Home Fun / Star Ratings / enterprise | — | academics / local | — | PARTIAL / MOCK |
| Tasks / Escalations | CRUD | `/tasks*`, `/escalations*` | * | LIVE (Common) |
| Dashboard | Charts | — | — | MOCK |

### Parent (`parent`) / Student (`student`)

| UI screen | User action | Reference API | Method | Status |
|---|---|---|---|---|
| Child / self identity | Resolve profile | `/parents/me/children`, `/students/me` | GET | LIVE (replaces FE seed while live) |
| Fees payment | Read / pay | `/finance/my-fees`, `/finance/actions/pay-my-fees` | GET/POST | LIVE |
| Attendance list / calendar | Read | `/attendance` (class filter) + `/attendance/students/{uuid}/calendar` | GET | PARTIAL (calendar LIVE when UUID; summary class over-fetch; never invent marks) |
| Announcements | Read | `/announcements*` | GET | LIVE |
| TC request | List/create/view | `/tc-requests*` | GET/POST | LIVE |
| Calendar | Read | `/calendar` | GET | LIVE (shared AcademicCalendarPage hydrate) |
| Escalations | Raise/list | `/escalations*` | * | Student LIVE; Parent **BLOCKED** |
| Home Fun / Study materials / Star Ratings | — | academics / local | — | MOCK |
| Library / Transport / Hostel / Track bus | — | ops / protrack | — | MOCK / PARTIAL |
| Apply leave (workspace) | Create | `/leave-requests` if granted | — | PARTIAL / MOCK workspace |
| Online / extended class / timetable | — | — | — | MOCK |
| Communication | Inbox | `/communication*` | * | PARTIAL |

---

## Phase 2 — Campus ops roles

### Librarian (`librarian`)

| UI screen | User action | Reference API | Method | Status |
|---|---|---|---|---|
| Library Management Workspace | Catalog / issue / return | `/ops/library-books`, `/ops/library-issues`, `/ops/library-members` | GET/PUT | LIVE |
| Add Book | Create title | `/ops/library-books` | GET/PUT | LIVE |
| Add Issue Book | Issue loan | `/ops/library-*` | GET/PUT | LIVE |
| Members list | List/add | `/ops/library-members` | GET/PUT | LIVE |
| Book requests / requisitions | Queue | localStorage | — | MOCK (no BE collection) |
| Dashboard KPI charts | Read | local demo | — | MOCK |
| Leave / announcements / tasks | Shared | leave / announcements / tasks | * | PARTIAL / LIVE shared |

### Transport Manager (`transportmanager`)

| UI screen | User action | Reference API | Method | Status |
|---|---|---|---|---|
| Dashboard KPI counts | Read | `/ops/transport-drivers\|vehicles\|routes\|student-assignments` | GET | LIVE |
| Driver / Vehicle / Route management | List/upsert | matching `/ops/transport-*` | GET/PUT | LIVE |
| Student Transport | Assign | `/ops/transport-student-assignments` | GET/PUT | LIVE |
| Assign Duty | Schedule | `/ops/transport-duties` | GET/PUT | LIVE |
| Route Data list | List routes | `/ops/transport-routes` | GET | LIVE (list) |
| Track Bus / GPS / ProTrack | Telemetry | — | — | MOCK (fail closed; not configured) |
| Vehicle maintenance / expenses / request approvals | CRUD | local demo | — | MOCK |
| Driver portal (related) | Duties/health/fuel | `/ops/transport-*` | GET/PUT | LIVE (Phase 2 Driver) |

### Hostel Warden (`hostelwarden`)

| UI screen | User action | Reference API | Method | Status |
|---|---|---|---|---|
| Assignments | Allocate/vacate | `/ops/hostel-assignments` | GET/PUT | LIVE |
| Payments | Dues register | `/ops/hostel-payments` | GET/PUT | LIVE |
| Dashboard counts | Read | hostel-assignments + hostel-payments | GET | LIVE |
| Hostel Accommodation workspace (rooms/bed matrix/outpass/mess) | CRUD | local / mock hostelService | — | MOCK (no BE) |
| Leave / announcements | Shared | leave / announcements | * | LIVE / PARTIAL shared |

### Gate Keeper (`gatekeeper`) — Gate Keeper Manager partial baseline

| UI screen | User action | Reference API | Method | Status |
|---|---|---|---|---|
| Visitors (VisitorsLive + VisitorsWorkspace) | Check-in/out | `/ops/gate-visitors` | GET/PUT | LIVE |
| Incidents (+ add/view) | CRUD/advance | `/ops/gate-incidents` | GET/PUT | LIVE |
| My Duty | Status update | `/ops/gate-duties` | GET/PUT | LIVE |
| Hostel Gate Pass | Read | `/front-office/hostel-gate-passes` | GET | LIVE (read-only; write BLOCKED for GK) |
| Dashboard KPIs | Mixed | gate-visitors / incidents / FO student passes | GET | LIVE / PARTIAL |
| Gate Pass Security workspace overview / student exit-return writes | Mixed | localStorage when mock; refuse silent write when live | — | MOCK / fail-closed |
| GKM Assign Duty list/form | CRUD | `/ops/gate-duties` | GET/PUT | LIVE |

---

## Phase 3 — Specialty portals (documented MOCK — no new domains this delivery)

| UI role / module | UI screen | User action | Reference API | Method | Integration status |
|---|---|---|---|---|---|
| Canteen Manager | Menu / orders / inventory | CRUD | `/ops/canteen-*` (BE exists) | GET/PUT | MOCK FE primary (ops ready, FE not fully wired) |
| IT Support Manager | Assets / tickets | CRUD | `/ops/it-*` | GET/PUT | MOCK FE primary |
| Stationery Store Manager | Inventory / issues | CRUD | `/ops/stationery-*` | GET/PUT | MOCK FE primary |
| Housekeeping Manager | Schedules / inventory / L&F | CRUD | `/ops/hk-*` | GET/PUT | MOCK / PARTIAL (L&F ops) |
| Maintenance Manager | Portal | CRUD | — / ops partial | — | MOCK (FE role; limited BE grants) |
| Process / Quality / JD auditors | Audits / observations | CRUD | `/campus-audit/{collection}` | GET/PUT | MOCK / PARTIAL |
| Helpdesk (all roles) | Tickets | CRUD | — | — | MOCK (deferred — no dedicated domain) |
| Stores / Procurement | Requisitions | CRUD | shared-inventory ops partial | — | MOCK (deferred) |
| Physical File Room | Inward/outward | CRUD | — | — | MOCK / MISSING dedicated |
| CCTV | Cameras / incidents | CRUD | — | — | MISSING |
| PRO | Statutory / correspondence | CRUD | — | — | MOCK (institutional read only) |
| Awards / Star Ratings | SOM / SOY | CRUD | — | — | MISSING / MOCK |

---

## Shared enterprise modules (multi-role) — honesty

| Module | Reference API | Treatment |
|---|---|---|
| Helpdesk | — | MOCK (deferred) |
| Stores / Procurement | — | MOCK (deferred) |
| Physical File Room | — | MOCK (deferred) |
| CCTV / PRO / Awards | — | MISSING dedicated / MOCK |
| Lost & Found | `/ops/hk-lost-found` | PARTIAL |
| Attendance & Leave workspace | formal leave/attendance APIs | MOCK overview; formal pages LIVE |
| Tasks | `/tasks*` | LIVE (Common wire) |
| Escalations | `/escalations*` | LIVE (Common wire) |

---

## Seed credentials (local only — not secrets for production)

| Role | Email | Password (defaults from `backend/app/core/config.py`) |
|---|---|---|
| superadmin | superadmin@qmis.edu | superadmin123 |
| admin | admin@qmis.edu | admin123 |
| hr | hr@qmis.edu | hr12345 |
| accounthead | accounthead@qmis.edu | accounts123 |
| principal | principal@qmis.edu | principal123 |
| teacher | teacher@qmis.edu | teacher123 |
| coordinator | coordinator@qmis.edu | coord123 |
| parent | parent@qmis.edu | parent123 |
| student | student@qmis.edu | student123 |
| prm | prm@qmis.edu | prm12345 |

---

## Classification rules

- **LIVE** — FE action hits FastAPI under live env; DB-backed; UI driven by response; refresh persists.
- **PARTIAL** — mix of LIVE + MOCK, or API exists but not all screen actions wired.
- **MOCK** — localStorage / `*Data.js` / hardcoded is authoritative; option preserved with honesty.
- **MISSING** — no matching backend domain.
- **BLOCKED** — dependency, permission, or config prevents integration (do not bypass RBAC).
