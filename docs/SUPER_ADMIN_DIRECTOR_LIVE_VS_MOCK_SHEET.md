# Super Admin + Director — LIVE vs MOCK sheet (partner handoff)

**Updated:** 2026-11-21\
**Source of truth:** `docs/ROLE_WISE_UI_BACKEND_INTEGRATION_TRACKER.md`\
**Purpose:** Clear answer to “is backend integration done?” — **partially yes; not for every module.**

---

## How to run LIVE locally (required)

Frontend (`ERP_QMIS`):

```text
VITE_USE_MOCK=false
VITE_API_BASE_URL=http://127.0.0.1:8000
```

Backend:

```text
cd backend
.\.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

Frontend:

```text
cd ERP_QMIS
npm run dev
```

Login (SA): `superadmin@qmis.edu` / `superadmin123`

**If `VITE_USE_MOCK` is not `false`, most screens use mock/local data even when APIs exist.**

---

## Legend

| Status | Meaning |
|---|---|
| **LIVE** | UI calls real FastAPI; data persists in DB (for that feature) |
| **PARTIAL** | Some API path exists, or FE wired incompletely; often still localStorage/demo for main SoT |
| **MOCK** | Demo / localStorage / in-memory only — **not** backend-integrated |
| **BLOCKED** | Backend capability missing or intentionally not exposed |

---

## Super Admin — module sheet

### LIVE (backend integrated)

| Module | Route / area | Backend |
|---|---|---|
| Auth / login | `/signin` | JWT auth |
| Dashboard KPIs | `/super-admin/dashboard` | `GET /api/v1/admin/dashboard` |
| User Creation (admins) | `/super-admin/user-creation/*` | `/api/v1/admin/users*` |
| Student directory | `/super-admin/user-database/students*` | `/api/v1/students*` |
| Employee directory | `/super-admin/user-database/employees*` | `/api/v1/hr/portal/employees*` |
| Announcements | `/super-admin/announcement*` | `/api/v1/announcements*` |
| Approvals inbox | `/super-admin/approvals*` | `/api/v1/approvals/inbox` + decide |
| Student attendance (list page) | `/super-admin/attendance/students/list` | `GET /api/v1/attendance` (empty filter = honest empty) |

### PARTIAL (UI may work; **not** full LIVE SoT)

| Module | What partner will see | Reality |
|---|---|---|
| Academic Calendar | Events / validation | BE `/api/v1/calendar` exists; FE still mixed custom/local + live create path |
| Exam Timetable (Director share) | Approvals / shared rows | Shared FE SoT + live `/exams` merge; many seed rows still local |
| Star Ratings SOM/SOY | Nominations / gates | FE eligibility fixed; **no dedicated recognition REST domain** |
| Gate Pass | List / PDF export | Client PDF fixed; FO collection API partial — treat as PARTIAL |
| Activity Logs | Inspect / Back / values | Demo/local audit data; thin `audit-logs` API not full UI SoT |
| Stores & Procurement | Tabs / RFQ / catalog | **local SoT** |
| Physical File Room | Inward / receive back | **localStorage SoT** |
| Department Helpdesk | Tickets / CSV | **local SoT** |
| Activity Monitoring | Filters / review | **local SoT** |
| Lost & Found | Directory / CSV | service + **local seed fallback** |
| Attendance & Leave workspace | Enterprise leave UI | MOCK/PARTIAL workspace (formal leave APIs exist elsewhere) |
| Finance overview / Transport / Escalations / Notifications / Communication | Mixed | MOCK / PARTIAL |

### MOCK (expect no backend persistence)

| Module | Notes |
|---|---|
| Dashboard charts / surplus widgets | Decorative demo |
| Compliance Score (91%) | Layout only; score is MOCK |
| Audit reports tables/charts | No dedicated SA compliance API |
| Task Management | Common mock |
| Module permission toggles on user | **BLOCKED** (read-only matrix) |

---

## Director — quick sheet

| Module | Status | Notes |
|---|---|---|
| Auth | LIVE | Shared |
| Announcements | LIVE | Shared |
| Exam Approvals | PARTIAL → improving | Shared timetable SoT + live exams merge; approve persist needs `approvalId` LIVE path |
| Student Profile / session | PARTIAL | Session scoping FE; not full historical REST |
| Teacher Database / year | PARTIAL | Year column FE; local SoT limits |
| Progress Report Cards | FE fix verified | Crash fix; data source still role-specific |
| Cultural Activities | PARTIAL / local | Refresh event; local SoT |
| Student Home Fun attachments | PARTIAL / MOCK attachments | Preview/download wired; file source often mock |

---

## What “UAT FIXED” means vs “backend integrated”

| Claim | Means |
|---|---|
| FIXED + VERIFIED in 50-case checklist | Original **UI defect** passes browser UAT with evidence |
| LIVE in this sheet | Feature reads/writes **FastAPI + DB** when live env is on |
| PARTIAL / MOCK here | Partner is correct that **backend integration is not done** for that module |

Many of the 50 FAIL cases were UI bugs on MOCK modules. Fixing them does **not** make those modules LIVE.

---

## Honest one-liner for partners

> Super Admin priority slice is LIVE (auth, KPIs, users, students/employees, announcements, approvals). Enterprise ops modules (Helpdesk, Stores, File Room, L&F, Star Ratings, Activity Logs, Tasks) are still MOCK/PARTIAL. Run with `VITE_USE_MOCK=false` + API `:8000` to verify LIVE modules. Full detail: this file + `ROLE_WISE_UI_BACKEND_INTEGRATION_TRACKER.md`.

---

## Suggested next integration order (if continuing backend work)

1. Academic Calendar FE hydrate fully from `/calendar` (close NUI-SA-127 / 128).
2. Exam approvals always carry `approvalId` (close NUI-SA-131 LIVE).
3. Gate Pass → front-office LIVE collection.
4. Formal leave / tasks LIVE where APIs already exist.
5. File Room / Helpdesk / Stores only when dedicated APIs are designed (do not fake LIVE with localStorage).
