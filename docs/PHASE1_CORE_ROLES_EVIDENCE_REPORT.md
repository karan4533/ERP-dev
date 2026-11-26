# Phase 1 Core Roles — Evidence Report

**Date:** 2026-11-23\
**Frontend:** `ERP_QMIS`\
**Backend:** local FastAPI `127.0.0.1:8000`\
**Live gate:** `VITE_USE_MOCK=false` + `VITE_API_BASE_URL=http://127.0.0.1:8000`\
**Mandate:** Evidence-based LIVE / PARTIAL / MOCK / LOCAL ONLY / BLOCKED. No Phase 2. No new large domains. No commit/push/deploy.

Controlled triage fixes from earlier today (migration 0007, NullPool skip, Track Bus DEMO badge, Roles honesty, calendar hydrate) are **preserved**.

---

## Executive verdict

| Role | Overall | Notes |
|---|---|---|
| HR | **PARTIAL → LIVE core** | Employees, recruitment, attendance, formal leave, training, disciplinary now API-backed; dashboards / enterprise workspace / relieving remain MOCK |
| Finance (Account Head) | **PARTIAL → LIVE core** | `finance/state` hydrate + collect/decide LIVE; POS gateway BLOCKED; Book Fee/Budget/MFP MOCK; dashboard notice now honest when live |
| Principal | **PARTIAL → LIVE core** | Directories, leave, announcements **add form now LIVE**, exams **list LIVE**, calendar LIVE; many enterprise menus MOCK |
| Teacher | **PARTIAL → LIVE core** | Roster, attendance, my-leave, lesson plans, announcements **read**; decide leave **BLOCKED**; announcements create **BLOCKED** in UI; exams.write BLOCKED |
| Coordinator | **PARTIAL → LIVE core** | Placement, attendance, leave decide LIVE; announcements create blocked; **Exam Management schedules LIVE** (blueprints/duties still MOCK) — see final stabilization report |
| Parent | **PARTIAL** | Fees/TC/announcements/calendar LIVE; escalations **BLOCKED**; **identity LIVE via `/parents/me/children`**; dashboard KPIs MOCK |
| Student | **PARTIAL** | Fees/TC/announcements/calendar/escalations LIVE; **identity LIVE via `/students/me`**; attendance calendar LIVE when UUID (no invented marks); Track Bus/Home Fun MOCK |

**Phase 2 not started.** Specialty domains remain MOCK without approval.\
**Final stabilization exit:** [`PHASE1_FINAL_STABILIZATION_REPORT.md`](./PHASE1_FINAL_STABILIZATION_REPORT.md)

---

## Classification rules used

- **LIVE:** Write or authoritative read persists on FastAPI; UI success only after confirmed response; survives refresh/re-login in the same API DB.
- **PARTIAL:** Some actions LIVE, others local/demo on the same screen, or read LIVE without full write path.
- **MOCK:** Demo/presentation data with honesty banner (or clearly non-production UI).
- **LOCAL ONLY:** Browser storage / in-memory SoT without FastAPI.
- **BLOCKED:** UI present but FastAPI permission/route refuses or intentionally disabled; no false success.

Page load alone or a bare 200 without matching UI SoT does **not** count as LIVE.

---

## HTTP persistence / RBAC / isolation (TestClient)

Probe script results (**17/17 PASS**):

| Check | HTTP | Evidence |
|---|---:|---|
| HR `POST /hr/training` then `GET` contains title | 201 / 200 | Persist OK |
| HR `POST /hr/disciplinary` then `GET` | 201 / 200 | Persist OK |
| Principal `POST /announcements` then `GET` contains title | 201 / 200 | Persist OK |
| Principal `GET /exams` | 200 | List OK |
| Teacher `GET leave-requests?box=received` | 200 | Read OK |
| Teacher `POST …/decide` | **403** | RBAC deny |
| Teacher `POST /announcements` | **403** | RBAC deny |
| Coordinator `GET /exams` | 200 | Read OK (`exams.write` exists for create elsewhere) |
| Parent / Student `GET /finance/my-fees` | 200 / 200 | Scoped OK |
| Parent `GET /escalations?box=mine` | **403** | Isolation / RBAC |
| Account Head `GET /finance/state` | 200 | Hydrate OK |
| Parent / Student `GET /tc-requests` | 200 / 200 | Scoped lists OK |

Focused pytest: **72 passed**\
(`test_hr`, `leave`, `lesson_plans`, `finance`, `finance_actions`, parent/student/teacher/principal/coordinator portals, `exams`, `attendance`, `admin_announcements`)

ERP_QMIS `npm run build`: **Pass**

---

## Browser UAT (live FE `:5175` + API `:8000`)

| Role | Screen | Observed |
|---|---|---|
| HR | `/hr/training` | Banner **Live training collection**; row **P1 Wire Training** from API create visible after re-login path |
| Finance | `/account-head/dashboard` | **Live finance snapshot** notice (demo banner removed when hydrated) |
| Principal | `/principal/examination-timetable` | **Live examination timetable** — “Showing N exam(s) from GET /api/v1/exams” |
| Teacher | `/teacher/announcement` | Live list; **no compose / Quick Add** (create roles exclude teacher) |
| Coordinator | `/coordinator/student-allocation` | Live placement banner (`pending-placement` / `place`) |
| Parent | `/parent/escalation-management` | After child select: **Parent escalations blocked** |
| Student | `/student/payment/fees-payment` | **Live my-fees ledger** hydrate notice |

Parent child picker: FE seed now includes `parent@qmis.edu` → `ADM-DEMO-001` (aligned with backend seed link).

---

## Per-role status boards (high-signal)

### HR

| Area | Status |
|---|---|
| Employees / documents / jobs / candidates / interviews | LIVE |
| Formal my-leave / received leave | LIVE |
| Dedicated attendance | LIVE |
| Training / disciplinary | LIVE (wired this pass via `/hr/training`, `/hr/disciplinary`) |
| Payroll mark-paid / leave bundle | LIVE / PARTIAL |
| Offers / onboarding / exit / relieving | LOCAL ONLY / MOCK |
| Attendance & Leave enterprise workspace | MOCK (labeled) |
| Dashboard charts | MOCK |
| Escalations / tasks / calendar | LIVE / PARTIAL |
| Stores / helpdesk / file room | MOCK |

### Finance

| Area | Status |
|---|---|
| State hydrate / collect / Head decide | LIVE |
| Accounting books hydrate | PARTIAL (static register merge still present on some tabs) |
| POS / Razorpay gateway | BLOCKED when unset |
| Book Fee / Budget / MFP | MOCK |
| Settings write | BLOCKED |
| Dashboard notice | LIVE honesty fixed this pass |

### Principal

| Area | Status |
|---|---|
| Students / employees directories | LIVE |
| My + received leave | LIVE |
| Announcements list + **Add form** | LIVE (Add form wired to POST this pass) |
| Examination timetable list | LIVE (listExams this pass); create Published path already LIVE |
| Calendar | LIVE |
| Tasks / escalations | LIVE / PARTIAL |
| Allocation approval / class timetable / deliverables | LOCAL ONLY / MOCK |
| Enterprise ops menus | MOCK |

### Teacher

| Area | Status |
|---|---|
| Students roster / class attendance / my-leave / lesson plans | LIVE |
| Announcements | LIVE read; create **BLOCKED** (UI + API) |
| Received leave decide | **BLOCKED** (UI hides decide; API 403) |
| Exams create | **BLOCKED** (`exams.write` absent) |
| Unit tests / Home Fun / study materials | LOCAL ONLY |
| Enterprise menus | MOCK |

### Coordinator

| Area | Status |
|---|---|
| Students / placement / attendance / leave decide | LIVE |
| Announcements | LIVE read; create **BLOCKED** in FE creator set |
| Lesson plans | LIVE / PARTIAL |
| Enterprise Exam Management page | MOCK UI (API write exists — still not wired on that page) |
| Deliverables / unit tests | LOCAL ONLY |

### Parent / Student

| Area | Status |
|---|---|
| Fees my-fees / pay-my-fees | LIVE |
| TC list/create/view | LIVE |
| Announcements | LIVE |
| Calendar hydrate | LIVE |
| Attendance summary | PARTIAL (class query + client filter; calendar needs student UUID) |
| Parent escalations | **BLOCKED** |
| Student escalations | LIVE (permissioned) |
| Child/profile identity | PARTIAL / LOCAL (FE mapping bridged for seed parent; full enrollment API still missing) |
| Track Bus / Home Fun / hostel-transport payments / dashboard KPIs | MOCK |

---

## Wires completed this pass (existing APIs only)

1. Principal `AddAnnouncementForm` → `POST /api/v1/announcements` (no browser-demo success when live)
2. Teacher/Coordinator removed from announcement creator set (matches `announcements.write`)
3. Principal exam timetable list → `GET /api/v1/exams`
4. HR Training + Disciplinary → `/api/v1/hr/{training|disciplinary}` via `useHrLiveCollection`
5. Teacher leave decide UI gated to `leave.decide` roles
6. Parent escalations fail-closed when live
7. Attendance calendar prefers `/attendance/students/{id}/calendar` (never invents P/A in live)
8. Finance dashboard IntegrationNotice reflects live hydrate
9. Parent FE seed aligned to `parent@qmis.edu` / `ADM-DEMO-001`
10. Layout honesty banners tightened for Parent/Student

---

## Remaining blockers (need approval)

| Item | Why |
|---|---|
| Coordinator `EnterpriseExamManagementPage` → `examsApiService` | Large UI rewrite; API exists |
| Parent/student profile from enrollment API | Identity still dual FE/BE |
| Attendance class roster over-fetch | BE returns class; needs product decision on scoped endpoint usage |
| POS/Razorpay / Book Fee / MFP / recognition / helpdesk domains | New or unset domains |
| Role permission matrix PATCH | Still 405 / schema conflict |

---

## Confirmation

- No Phase 2 work started.
- No commit, push, merge, or deploy.
- Legacy root-`src` static failures remain separately classified (~41).
