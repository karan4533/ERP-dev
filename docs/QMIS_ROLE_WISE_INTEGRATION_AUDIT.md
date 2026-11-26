# QMIS ERP — Role-Wise Backend Integration Audit

**Path:** `docs/QMIS_ROLE_WISE_INTEGRATION_AUDIT.md`\
**Audit date:** 2026-11-22\
**Mode:** AUDIT ONLY\
**Matrix:** `docs/QMIS_FULL_APPLICATION_BACKEND_INTEGRATION_MATRIX.md`\
**Tracker (historical UAT):** `docs/ROLE_WISE_UI_BACKEND_INTEGRATION_TRACKER.md`

---

## Executive answer

The ERP is **not fully backend-integrated**, and it is **not zero-integrated**.

- **Genuinely LIVE:** Auth + priority slices for Super Admin, Admin, HR, Finance, Principal, Teacher, Coordinator, Librarian, PRM, Hostel Warden, Transport Manager (ops-backed), and shared announcements/approvals/students/HR employees where wired.
- **Still MOCK / localStorage for most sidebar surface area:** Enterprise ops (Helpdesk, Stores, File Room UI, Activity Logs UI, Star Ratings, Monitoring, many manager/auditor portals).
- **Runtime DB this audit:** SQLite (development process). OpenAPI exposes **209** paths.

**Do not** tell partners “everything is LIVE” or “nothing is LIVE.” Use the per-role sections below.

---

## Discovery counts

| Item | Count |
|---|---:|
| FE portal roles (`ROLES`) | **31** |
| BE matrix roles | **27** |
| FE layouts | **30** |
| Mounted API path prefixes (OpenAPI segments) | **35** |
| OpenAPI operations | **209** |
| Roles with `EnterpriseOperationsRoutes` | **28** |
| Roles with near-zero `isLiveApiEnabled` in Pages | ~12 institutional/ops/auditor portals |

---

## Per-role summaries

### 1. Super Admin (`superadmin`)

| Area | Status |
|---|---|
| Dashboard KPIs | **LIVE** (runtime: students=1, employees=3) |
| Users / Students / Employees / Announcements / Approvals | **LIVE** |
| Student attendance page | **LIVE / PARTIAL** |
| Compliance / charts / audit report visuals | **MOCK** |
| Helpdesk, Stores, File Room, Activity Logs, Star Ratings, Monitoring, Tasks workspace, Leave workspace | **MOCK / LOCALSTORAGE** |
| Calendar | **PARTIAL** |
| Gate Pass PDF | **PARTIAL** (valid client PDF; FO data PARTIAL) |
| Overall | **PARTIAL portal** — priority slice LIVE; majority of sidebar MOCK |

### 2. Admin (`admin`)

| LIVE | MOCK / PARTIAL |
|---|---|
| Dashboard KPIs, admissions, students/employees, received leave, TC, announcements, user creation | Class details, activities, report cards, enterprise ops stubs, attendance workspace |

**Checkpoint (tracker):** COMPLETE for agreed Admin ops slice.

### 3. HR (`hr`)

| LIVE | MOCK / BLOCKED |
|---|---|
| Employees, leave decide, HR attendance, recruitment/performance/docs/payroll priority, announcements | Enterprise attendance workspace MOCK; dashboard charts MOCK; Razorpay bank pay BLOCKED when unset |

**Note:** Login with guessed password failed **401** this pass; APIs still respond for superadmin→HR employees. Treat credential mismatch as **BLOCKED login verify**, not missing HR API.

**Checkpoint:** COMPLETE for priority expansion.

### 4. Finance / Account Head (`accounthead`)

| LIVE | Notes |
|---|---|
| `/finance/state` hydrate, collect, cheque settle, approvals decide (Head), derived reports | Assistant narrower; Razorpay config-dependent |
| Runtime | `GET /finance/state` **200** as superadmin |

**Checkpoint:** COMPLETE for agreed Finance slice.

### 5. Principal (`principal`)

| LIVE | MOCK / PARTIAL |
|---|---|
| Student DB, teacher DB, announcements, received leave | Dashboard MOCK; exams/timetable/enterprise PARTIAL/MOCK |

**Checkpoint:** COMPLETE for priority workflows.

### 6. Teacher (`teacher`)

| LIVE | Limits |
|---|---|
| Students roster (scoped), class attendance GET/POST, my-leave, announcements read | No exams.write; dashboard MOCK; lesson-plan/exam FE incomplete |

**Checkpoint:** COMPLETE for agreed slice.

### 7. Coordinator (`coordinator`)

| LIVE | Notes |
|---|---|
| Grade-band roster, placement, attendance, my/received leave, announcements read | Announcement write not granted; enterprise MOCK |

**Checkpoint:** COMPLETE.

### 8. Librarian (`librarian`)

| LIVE | MOCK / BLOCKED |
|---|---|
| Books / members / issue-return (ops collections) | Dashboard KPIs MOCK; finance/students dir BLOCKED |

**Checkpoint:** COMPLETE.

### 9. PRM / Front Office (`prm`)

| LIVE | PARTIAL / BLOCKED / MOCK |
|---|---|
| Enquiries CRUD, admissions, students, teachers view, TC, FO collection lists | Visitors **404**; Add forms PARTIAL; dashboard/reports/parent DB MOCK |

**Checkpoint:** COMPLETE for agreed LIVE scope. Login password this pass **401** (seed credential variance).

### 10. Hostel Warden (`hostelwarden`)

| LIVE | BACKEND MISSING |
|---|---|
| ops hostel-assignments / hostel-payments + students list | Room master, outpass, mess, visitors, movement, complaints, maintenance domain APIs |

**Checkpoint:** COMPLETE for ops-backed scope.

### 11. Transport Manager (`transportmanager`)

| LIVE | PARTIAL / MOCK |
|---|---|
| Ops-backed fleet/routes/assignments (tracker) | ProTrack GPS config-dependent; many reports MOCK |

Login **OK** this pass.

### 12. Driver (`driver`)

| Status | Notes |
|---|---|
| **PARTIAL → LIVE-capable** | High `isLiveApiEnabled` usage in Driver pages; no EnterpriseOperationsRoutes; subset of transport domain |

Login **OK**.

### 13. Gate Keeper / Gate Keeper Manager

| Status | Notes |
|---|---|
| **PARTIAL** | FO/gate collections when wired; duty/incidents often local; GK login **401** this pass with guessed password |

### 14. Director (`director`)

| LIVE-capable | PARTIAL / MOCK |
|---|---|
| Announcements, approvals patterns | Exam approvals PARTIAL; student/teacher year PARTIAL; cultural/local; Home Fun MOCK attachments |

Login **OK**.

### 15. Parent (`parent`) / Student (`student`)

| Status | Notes |
|---|---|
| **PARTIAL** | Shared `StudentPortalRoutes`; fees/attendance/announcements can be LIVE; Home Fun / some academic views MOCK; isolation must remain API-enforced |

Logins **OK**.

### 16. Institutional / auditor / specialty portals

`canteenmanager`, `itsupportmanager`, `stationerystoremanager`, `housekeepingmanager`, `maintenancemanager`, `jointdirector`, `jointdirectorassistant`, `jointdirectoraudit`, `processauditor`, `qualityauditor`, `pro`, `fileroom`, `cctv`

| Finding | Status |
|---|---|
| Full UI shells + sidebars | Present |
| Live API page wiring | ≈ **none** |
| Dedicated BE APIs | Missing or collection-only unused |
| Overall | **MOCK / FRONTEND ONLY** (with **BACKEND MISSING** for CCTV/FileRoom dedicated APIs) |
| FE↔BE role gap | `fileroom`, `cctv`, `pro`, `maintenancemanager` not in BE `ALL_ROLES` |

### 17. Backend-only roles without FE `ROLES` entry

| Role | Notes |
|---|---|
| `managing_director` | In matrix; no FE portal in `constants/roles.js` |
| `finance_assistant` | Finance subset; Account Head layout patterns |

---

## Integration percentage (operation-based, conservative)

Using tracker + this audit’s module-op inventory (approximate **critical operations** across priority roles ≈ **120**; enterprise mock ops ≈ **160**):

| Bucket | Approx ops | Share of ~280 |
|---|---:|---:|
| LIVE | ~95 | ~34% |
| PARTIAL | ~45 | ~16% |
| MOCK / LOCALSTORAGE | ~120 | ~43% |
| BACKEND MISSING / BLOCKED | ~20 | ~7% |

**Interpretation:** Roughly **one-third** of critical inventoried operations are LIVE; **nearly half** of inventoried UI operations remain frontend/local. Percentages are **not** screen counts.

---

## RBAC / isolation findings

| Issue | Severity |
|---|---|
| FE portals without BE matrix roles (`fileroom`, `cctv`, `pro`, `maintenancemanager`) | High — authz unclear |
| Admin permission-module write BLOCKED | Medium — honest UI |
| Enterprise MOCK UIs can show “success” without DB | High — partner confusion |
| Parent/student isolation depends on API, not FE alone | High — keep tests |
| Some seed logins 401 this pass | Low for audit — credential docs drift |

---

## Browser / API checks this audit

- Live env confirmed; API `:8000`; FE `:5175`
- SA dashboard KPIs match API
- Spot GET: dashboard, students, HR employees, finance state, calendar, ops lost-found, leave received, approvals, announcements
- Multi-role login probe (success/fail listed in matrix)

Full browser matrix for all 31 roles **not** completed in this single audit pass — classifications for expansion-checkpoint roles rely on tracker **T** evidence plus code **C**.

---

## Confirmation

Audit-only documentation. No application code, schema, env, or data changes. No commit/push/merge/deploy.
