# QMIS W1 Implementation Report

**Wave:** W1 — Auth/RBAC alignment + Visitors 404 + LIVE/MOCK indicators\
**Date:** 2026-11-22 / 2026-11-23 (implementation + UAT)\
**Branch:** `irul` (tracking `origin/irul`)\
**Git actions:** **None** — no commit, push, merge, or deploy\
**Stop rule:** W2 not started

---

## 1. Initial Git and environment status

| Item | Value |
|---|---|
| Branch | `irul` |
| Working tree | Dirty (prior UAT + W1 changes; `ERP_QMIS/` largely untracked in this checkout) |
| Frontend | `C:\karan\irul\ERP_QMIS` — Vite **:5175** |
| Backend | `C:\karan\irul\backend` — uvicorn `app.main:app` **:8000** |
| Live flags | `.env.local`: `VITE_USE_MOCK=false`, `VITE_API_BASE_URL=http://127.0.0.1:8000` |
| Runtime DB | SQLite development DB (no production writes; no DB reset) |

Uvicorn was restarted once during UAT so W1 Python changes were loaded. No migrations were applied for visitors.

---

## 2. Role mismatches discovered (before W1)

| Finding | Before |
|---|---|
| FE portals without BE matrix codes | `maintenancemanager`, `pro`, `fileroom`, `cctv` |
| BE-only roles | `managing_director`, `finance_assistant` (intentional; no dedicated FE `ROLES` portal) |
| Alias drift | `front_office` / `van_driver` / `md` / `account_head` not normalized |
| AuthContext | Stored JWT/demo role strings without canonicalization |

---

## 3. Role mappings implemented

| Change | Detail |
|---|---|
| BE `FRONTEND_ROLES` | Added `maintenancemanager`, `pro`, `fileroom`, `cctv` |
| BE `ROLE_ALIASES` + `normalize_role_code` | Legacy → canonical; used from `deps.role_code_for` |
| BE grants | Conservative: institutional read for pro/fileroom/cctv; `maintenancemanager` in `_OPS_ROLES` + approvals submit/read |
| BE `_OPS_ROLES` | Added `prm` so PRM can use `/api/v1/ops/gate-visitors` |
| FE `roleRegistry.js` | Mirror aliases + helpers |
| FE `AuthContext` | `normalizeRoleCode` on login / `/auth/me` |

Full matrix: `docs/QMIS_ROLE_ALIGNMENT_MATRIX.md`.

**Privilege rule:** Normalization does not invent domain APIs or expand admin grants for new portals.

---

## 4. Visitor 404 root cause

1. FE Front Office Visitors previously relied on localStorage / non-mounted paths in LIVE mode paths that 404’d.
2. `GET/POST /api/v1/front-office/visitors` was **not** in FO `COLLECTIONS` → FastAPI returned **404 not_found**.
3. Authoritative ops collection **`gate-visitors`** already existed under `/api/v1/ops/gate-visitors`, but PRM was not in `_GATE` writers and FO had no alias.

---

## 5. Visitor API changes

| Layer | Change |
|---|---|
| SoT | `/api/v1/ops/gate-visitors` (ops JSON collection) |
| FO alias | `visitors` collection delegates list/get/create/update to ops `gate-visitors` |
| AuthZ | Gate writers: `gatekeeper`, `gatekeepermanager`, `prm`, admins; teacher write → **403**; unauthenticated → **401** |
| FE | `VisitorsWorkspace` uses `listGateVisitors` / `upsertGateVisitor`; no silent localStorage fallback when LIVE |
| Indicator | `DataSourceIndicator` **LIVE** when live API succeeds |

**Verified ops:** list, create (check-in), checkout (status + timestamps), FO alias list, persistence across GET, RBAC denial.

---

## 6. LIVE/MOCK indicator implementation

New component: `ERP_QMIS/src/Common/ui/DataSourceIndicator.jsx`\
Statuses: **LIVE | PARTIAL | MOCK | LOCAL ONLY | UNAVAILABLE**

Applied on:

| Screen | Status |
|---|---|
| Front Office Visitors | LIVE (when `VITE_USE_MOCK=false` and load OK) |
| Helpdesk | LOCAL ONLY |
| Stores & Procurement | LOCAL ONLY |
| Physical File Room | LOCAL ONLY |
| Lost & Found | PARTIAL |
| Star Ratings / Recognition | MOCK |
| Activity Logs | LOCAL ONLY |
| Activity Monitoring | LOCAL ONLY |
| Audit / Compliance Score | MOCK |

Browser UAT confirmed Helpdesk **LOCAL ONLY**, Compliance **MOCK**, Activity Logs **LOCAL ONLY**, Visitors **LIVE**.

---

## 7. Files changed (W1 primary)

### Backend
- `backend/app/permissions/matrix.py`
- `backend/app/deps.py`
- `backend/app/services/ops_collections.py`
- `backend/app/services/front_office.py`
- `backend/tests/test_w1_role_alignment_and_visitors.py` (new)

### Frontend
- `ERP_QMIS/src/constants/roleRegistry.js` (new)
- `ERP_QMIS/src/constants/__tests__/roleRegistry.test.js` (new)
- `ERP_QMIS/src/context/AuthContext.jsx`
- `ERP_QMIS/src/Common/ui/DataSourceIndicator.jsx` (new)
- `ERP_QMIS/src/Common/ui/index.js`
- `ERP_QMIS/src/Common/ui/__tests__/dataSourceIndicator.test.js` (new)
- `ERP_QMIS/src/Common/Visitors/VisitorsWorkspace.jsx`
- `ERP_QMIS/src/Common/StoresProcurement/StoresProcurementWorkspace.jsx`
- `ERP_QMIS/src/Common/FileRoom/FileRoomWorkspace.jsx`
- `ERP_QMIS/src/Common/LostAndFound/LostAndFoundWorkspace.jsx`
- `ERP_QMIS/src/Common/EmployeeActivityMonitoring/DepartmentActivityMonitoringWorkspace.jsx`
- `ERP_QMIS/src/Common/Recognition/EnterpriseRecognitionPage.jsx`
- `ERP_QMIS/src/Common/DepartmentTicketing/DepartmentTicketingWorkspace.jsx`
- `ERP_QMIS/src/Pages/SuperAdmin/ActivityLogs/ActivityLogList.jsx`
- `ERP_QMIS/src/Pages/SuperAdmin/AuditReports/AuditReportsOverview.jsx`
- `ERP_QMIS/src/Pages/SuperAdmin/AuditReports/AuditReportsSectionList.jsx`
- (PRM layout copy / calendar duplicate-import fix from same wave)

### Docs
- `docs/QMIS_ROLE_ALIGNMENT_MATRIX.md` (new)
- `docs/QMIS_W1_IMPLEMENTATION_REPORT.md` (this file)
- Updates to full matrix + role-wise tracker + reports

---

## 8. Database changes

**None** for W1 visitors (reuses existing ops collection persistence). No Alembic revision added for visitors. No production data modified intentionally beyond controlled UAT visitor rows in local SQLite.

---

## 9. Automated tests

### Backend
```
python -m pytest tests/test_w1_role_alignment_and_visitors.py \
  tests/test_front_office_api.py tests/test_ops_and_audit_collections.py -q
```
**Result:** **25 passed**

### Frontend
```
node --test src/constants/__tests__/roleRegistry.test.js \
  src/Common/ui/__tests__/dataSourceIndicator.test.js
```
**Result:** **7 passed**

### Production build
```
npm run build
```
**Result:** **Pass** (~1m 4s)

---

## 10. Browser UAT

| Case | Result |
|---|---|
| PRM login → `/front-office/dashboard` | Pass |
| Visitors page shows **LIVE** indicator | Pass |
| List shows persisted ops visitor (`GVS-W1-UAT-CLEAN`) | Pass |
| UI check-in “W1 UI Visitor” appeared in register | Pass (screenshot before later probe overwrite) |
| Merge/checkout persistence + FO alias | Pass (API) |
| Teacher PUT gate-visitors | **403** |
| Unauthenticated GET | **401** |
| SA Helpdesk indicator | **LOCAL ONLY** |
| SA Compliance indicator | **MOCK** |
| SA Activity Logs indicator | **LOCAL ONLY** |
| SA dashboard API regression | **200** |
| Students list regression | **200** |

---

## 11. Regression results

| Area | Check | Result |
|---|---|---|
| Auth login PRM / SA / Teacher | 200 + role | Pass |
| SA dashboard | 200 | Pass |
| Students | 200 | Pass |
| FO non-visitor collections tests | pytest FO suite | Pass |
| Ops library/biometric suite | pytest ops suite | Pass |
| Existing LIVE portals | Not reimplemented; no intentional breakage | Pass (spot) |

---

## 12. Remaining blockers

1. Some seed accounts still 401 on long-lived local DB (credential drift) — documented; passwords not reset.
2. Enterprise modules (Helpdesk/Stores/File Room/etc.) remain LOCAL/MOCK — indicators honest; domain APIs not in W1.
3. Ops visitors use full-collection PUT (existing pattern) — concurrent writers can overwrite; needs W2 hardening if required.
4. `managing_director` / `finance_assistant` remain backend-only by design.
5. Root `src/` vs `ERP_QMIS/` dual-tree hygiene still open outside W1.

---

## 13. Exact next steps for W2 (do not start automatically)

Per remediation roadmap Wave 2:

1. Wire highest-value enterprise ops to existing `/ops` / FO collections where contracts already exist (L&F, selected stores) without inventing parallel stores.
2. Harden visitor upsert to merge-safe updates if multi-client write is required.
3. Expand honest indicators to remaining Director/enterprise screens.
4. Resolve credential-drift accounts only with explicit authorization.
5. Keep LIVE priority portals regression-gated after each change.

---

## 14. Phase 1 final stabilization cross-link (2026-11-23)

W1 visitors/RBAC work remains preserved. Separately, Phase 1 core-role **final stabilization** completed without starting W2/Phase 2:

- Coordinator exam schedules LIVE (`/exams`)
- Parent `/parents/me/children` + Student `/students/me` identity
- Attendance calendar honesty (no invented marks)
- Finance POS/Book Fee/Budget/MFP MOCK labels
- Teacher RBAC denials preserved

Full evidence: [`PHASE1_FINAL_STABILIZATION_REPORT.md`](./PHASE1_FINAL_STABILIZATION_REPORT.md).\
**Stop:** awaiting approval before any Phase 2 / W2 start. No commit/push/deploy.
