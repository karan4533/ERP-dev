# NEW UI ↔ Reference Backend — Implementation Report

**Path:** `docs/NEW_UI_REFERENCE_BACKEND_IMPLEMENTATION_REPORT.md`\
**Updated:** 2026-11-23\
**Frontend:** `ERP_QMIS`\
**Backend:** local `backend/` (Heuristic-Labs/QMIS-compatible FastAPI)\
**Matrix:** `docs/NEW_UI_REFERENCE_BACKEND_INTEGRATION_MATRIX.md`\
**Phase 1 evidence:** `docs/PHASE1_CORE_ROLES_EVIDENCE_REPORT.md`

---

## Scope confirmed

1. Phase 1 core roles: HR, Finance, Principal, Teacher, Coordinator, Parent, Student — **evidence complete** (audit + wire + HTTP + browser UAT; see evidence report). Do not treat prior Phase 2 ops wires as a green light for new specialty domains.
2. Super Admin / Admin / PRM: regression only — **pass** (preserved)
3. Prior ops-role wires (Librarian / Transport / Hostel / Gate) remain as previously documented; **no new Phase 2 work in the 2026-11-23 evidence pass**
4. Specialty (Helpdesk, Stores, File Room, CCTV, PRO, Awards): documented MOCK only — **no new domains**
5. No commit / push / merge / deploy without approval

---

## Reference APIs reused (no duplicates)

Auth, admin dashboard/users, students, HR portal, leave-requests, attendance, finance state + my-fees + pay-my-fees, announcements, calendar, tc-requests, lesson-plans, tasks, escalations, ops library/transport/hostel/gate collections, front-office collections.

---

## Changes this delivery

### Frontend (high-signal)

| Area | Change |
|---|---|
| Leave create + my detail | `leaveApiService.createLeaveRequest`; live `AddLeaveRequestForm`, `ViewMyLeaveRequestPage` |
| HR my-leave routes | Common LeaveRequest pages (no AttendanceAndLeaveWorkspace dual-write) |
| Tasks | `taskApiService.js` + live Enterprise Task workspace |
| Escalations | `escalationApiService.js` + live list/add/view |
| Lesson plans | Extended `lessonPlanApiService`; live workspace + entry form |
| Parent/Student fees | `getMyFees` / `payMyFeesApi`; FeesPayment live; CheckoutMockModal fail-closed when live |
| Parent/Student TC | `createTcRequest` + live list/add/view |
| Parent/Student attendance | Live hydrate via `listAttendance` (honest empty; no fake defaults when live) |
| IntegrationNotice | Visible `mock` state for honesty banners |
| AttendanceAndLeaveWorkspace | Live mock honesty banner (eSSL/demo workspace) |
| Parent/Student/Teacher layouts | Connected notices for LIVE vs remaining MOCK |
| Phase 2 Librarian / Transport / Hostel / Gate | Ops collection LIVE wires + IntegrationNotice; GPS/rooms/mess labeled MOCK |
| Track Bus honesty | DEMO badge `DEMO ROUTE — NOT LIVE GPS`; never presents demo GPS as LIVE |
| Admin Roles (ERP_QMIS) | Live read of `/admin/roles/{id}/permissions`; writes blocked (PATCH 405); no false success |
| Academic calendar | Live GET hydrate + POST create re-hydrate on shared `AcademicCalendarPage` |

### Backend

No new routers. Existing handlers reused. Specialty domain routers for CCTV/File Room/Awards/Helpdesk **not** added. Orphan `/api/v1/rbac` module-matrix writer left unmounted (schema conflict with live `role_permissions`).

---

## Phase 0 regression

| Check | Result |
|---|---|
| `GET /health` | 200 ok |
| Login SA / Admin / Principal / Teacher / Parent / Student | OK |
| Login HR (`hr12345`) / Account Head (`accounts123`) / Coordinator (`coord123`) / PRM (`prm12345`) | OK |
| `GET /admin/dashboard` (SA) | 200 |
| `GET /students` (SA/Admin) | 200 |
| `GET /admissions` (PRM) | 200 |
| Genuine regressions found | None requiring code fix this pass |

---

## Phase 1 exit

### Completed roles

HR, Finance (Account Head), Principal, Teacher, Coordinator, Parent, Student — each with evidence-based status in `PHASE1_CORE_ROLES_EVIDENCE_REPORT.md`.

### Evidence pass delta (2026-11-23)

| Wire | Status |
|---|---|
| Principal AddAnnouncementForm → POST `/announcements` | LIVE |
| Principal ExaminationTimetableList → GET `/exams` | LIVE |
| HR Training + Disciplinary collections | LIVE |
| Teacher/Coordinator announcement create UI | BLOCKED (creator set + API) |
| Teacher leave decide UI | BLOCKED (no `leave.decide`) |
| Parent escalations | BLOCKED fail-closed |
| Attendance calendar live path (no invented marks) | PARTIAL |
| Finance dashboard live notice | LIVE honesty |
| Parent seed `parent@qmis.edu` ↔ `ADM-DEMO-001` | PARTIAL bridge |
| Verification | HTTP 17/17 · pytest 72 · build Pass · 7-role browser UAT |

### LIVE operations (this pass + prior checkpoints)

| Role | LIVE ops |
|---|---|
| HR | Employees portal, `/hr/attendance`, leave decide, **formal my-leave create/list/view**, recruitment subset, payroll mark-paid, announcements, **training**, **disciplinary** |
| Finance | State hydrate, collect, settle, Head decide; assistant decide remains BLOCKED |
| Principal | Students/employees, announcements (**list + add**), received leave, **my-leave create/view**, tasks, escalations, **exam timetable list** |
| Teacher | Roster, class attendance, my-leave, **lesson plans**, announcements read |
| Coordinator | Students, placement, attendance, leave mine/received, announcements read; exams create API capable (Exam Mgmt page still MOCK UI) |
| Parent/Student | **my-fees / pay-my-fees**, **TC create/list/view**, announcements, attendance hydrate |

### Remaining MOCK (Phase 1 roles)

| Area | Status |
|---|---|
| Attendance & Leave enterprise workspace | MOCK (banner); use formal leave/attendance pages |
| Dashboard charts | MOCK |
| Star Ratings / Home Fun / Helpdesk / Stores / File Room | MOCK (deferred) |
| Book Fee / Budget / MFP / POS unset | MOCK / BLOCKED |
| Teacher exam create | BLOCKED (no `exams.write`) |
| Razorpay/gateway | BLOCKED when unset — no client-only success |

### Tests

| Suite | Result |
|---|---|
| Backend pytest full | **399 passed**, 43 failed, 36 skipped (≈4m45s). Failures concentrated in legacy **root `src/`** static frontend tests (`test_frontend_*_static.py`), not ERP_QMIS live wires. Migration/sqlite concurrency failures pre-exist. |
| ERP_QMIS `npm run build` | **Pass** (≈1m14s) |
| API UAT Phase 1 | Leave create 201 (teacher/principal); lesson-plan create 201; my-fees 200; finance state 200; HR employees/attendance 200; tasks/escalations 200 |
| Browser | FE `:5175` + API `:8000` live env; login matrix OK via API |

### Blockers needing approval

| Item | Impact |
|---|---|
| Razorpay / POS unset | Finance gateway BLOCKED |
| Teacher `exams.write` absent | Exam create 403 by design |
| Helpdesk / Stores / File Room / CCTV / PRO / Awards | Stay MOCK — need domain approval |
| Parent `/attendance?date=` may 403/empty depending on scope filters | Attendance page shows honest empty when live fails |
| Driver `/ops/my-transport` | 403 in one probe — use transport-* collections Driver pages already call |

---

## Phase 2 exit

### Completed roles

Librarian, Transport Manager, Driver (harden), Hostel Warden, Gate Keeper

### LIVE operations

| Role | LIVE |
|---|---|
| Librarian | `/ops/library-books|issues|members` catalog/issue/members |
| Transport Manager | `/ops/transport-vehicles|drivers|routes|student-assignments|duties` |
| Driver | Existing transportApiService pages (vehicles/routes/duties/fuel/attendance) |
| Hostel Warden | `/ops/hostel-assignments`, `/ops/hostel-payments` |
| Gate Keeper | `/ops/gate-visitors`, incidents, duties; hostel gate-pass read |

### Remaining MOCK (Phase 2)

GPS/ProTrack Track Bus; vehicle maintenance/expenses; hostel rooms/outpass/mess; gate pass security dual SoT write paths (fail-closed when live); librarian dashboard KPI charts / book requests.

### API probes

library books/issues/members 200; transport vehicles/drivers/routes/assignments/duties 200; hostel assignments/payments 200; gate visitors/incidents 200.

---

## Phase 3 — Specialty (documented only)

| Portal / module | Status | Action this delivery |
|---|---|---|
| Canteen / IT / Stationery / Housekeeping / Maintenance | MOCK / ops collections exist but FE mostly unwired | Document only — no wave started beyond inventory |
| Process / Quality / JD auditors | MOCK / campus-audit PARTIAL | Document only |
| Helpdesk | MOCK | Deferred — no new domain |
| Stores / Procurement | MOCK | Deferred |
| Physical File Room | MOCK / MISSING dedicated | Deferred |
| CCTV | MISSING API | Deferred |
| PRO | MOCK / institutional read only | Deferred |
| Awards / Star Ratings | MISSING API | Deferred |

---

## Outstanding issues

1. Root-`src` static pytest failures remain (legacy FE path assumptions).
2. Parent attendance list needs continued scoping validation in browser with linked child class/section.
3. Phase 3 specialty portals await product approval before domain APIs.

---

## Safety

No commit, push, merge, deploy, or production DB reset performed.
