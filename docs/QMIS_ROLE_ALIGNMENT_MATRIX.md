# QMIS Role Alignment Matrix (W1)

**Date:** 2026-11-22\
**Scope:** Frontend portal roles (`ERP_QMIS/src/constants/roles.js`) vs backend matrix (`backend/app/permissions/matrix.py`).\
**Canonical registry:** FE `roleRegistry.js` + BE `normalize_role_code` / `ROLE_ALIASES`.

## Status legend

| Status | Meaning |
|---|---|
| ALIGNED | Same canonical code on FE + BE; login/portal/API agree |
| FRONTEND ONLY | FE portal exists; BE has no dedicated matrix entry (pre-W1) |
| BACKEND ONLY | BE matrix role; no dedicated FE `ROLES` portal |
| MISMATCHED | Same intent, different codes / aliases needed |
| BLOCKED | Credential drift or inactive seed prevents live login UAT |

## Role reconciliation

| Role | Frontend code | Backend code | Login | Dashboard | API authorization | Final status |
|---|---|---|---|---|---|---|
| Super Admin | `superadmin` | `superadmin` | Yes | `/super-admin/dashboard` | Full admin | ALIGNED |
| Admin | `admin` | `admin` | Yes | `/admin/dashboard` | Full admin | ALIGNED |
| Student | `student` | `student` | Yes | `/student/dashboard` | Student scope | ALIGNED |
| Parent | `parent` | `parent` | Yes | `/parent/select-child` | Parent scope | ALIGNED |
| Librarian | `librarian` | `librarian` | Yes | `/librarian/dashboard` | Library ops | ALIGNED |
| Hostel Warden | `hostelwarden` | `hostelwarden` | Yes | `/hostel-warden/dashboard` | Hostel ops | ALIGNED |
| PRM / Front Office | `prm` | `prm` | Yes (`prm@qmis.edu`) | `/front-office/dashboard` | FO + admissions + ops gate visitors (W1) | ALIGNED |
| Gate Keeper | `gatekeeper` | `gatekeeper` | Seed-dependent | `/gate-keeper/dashboard` | Gate ops R/W | ALIGNED |
| Gate Keeper Manager | `gatekeepermanager` | `gatekeepermanager` | Seed-dependent | `/gatekeeper-manager/...` | Gate ops R/W | ALIGNED |
| Director | `director` | `director` | Yes | `/director/dashboard` | Director grants | ALIGNED |
| Principal | `principal` | `principal` | Seed-dependent | `/principal/dashboard` | Principal grants | ALIGNED |
| Canteen Manager | `canteenmanager` | `canteenmanager` | Seed-dependent | `/canteen-manager/dashboard` | Stores ops | ALIGNED |
| IT Support Manager | `itsupportmanager` | `itsupportmanager` | Seed-dependent | `/it-support-manager/dashboard` | IT ops | ALIGNED |
| Stationery Store Manager | `stationerystoremanager` | `stationerystoremanager` | Seed-dependent | `/stationery-store-manager/dashboard` | Stationery ops | ALIGNED |
| Housekeeping Manager | `housekeepingmanager` | `housekeepingmanager` | Seed-dependent | `/housekeeping-manager/dashboard` | HK ops | ALIGNED |
| Maintenance Manager | `maintenancemanager` | `maintenancemanager` | Seed-dependent | `/maintenance-manager/dashboard` | Ops + approvals submit (W1 registered) | ALIGNED (was FRONTEND ONLY) |
| Transport Manager | `transportmanager` | `transportmanager` | Seed-dependent | `/transport-manager/dashboard` | Transport ops | ALIGNED |
| Teacher | `teacher` | `teacher` | Yes | `/teacher/dashboard` | Academic staff | ALIGNED |
| Coordinator | `coordinator` | `coordinator` | Seed-dependent | `/coordinator/dashboard` | Academic staff + decide | ALIGNED |
| Joint Director | `jointdirector` | `jointdirector` | Seed-dependent | `/joint-director/dashboard` | JD ops | ALIGNED |
| Joint Director Assistant | `jointdirectorassistant` | `jointdirectorassistant` | Seed-dependent | `/joint-director-assistant/dashboard` | JD ops | ALIGNED |
| Joint Director Audit | `jointdirectoraudit` | `jointdirectoraudit` | Seed-dependent | `/joint-director-audit/dashboard` | Campus audit | ALIGNED |
| Process Auditor | `processauditor` | `processauditor` | Seed-dependent | `/process-auditor/dashboard` | Campus audit | ALIGNED |
| Quality Auditor | `qualityauditor` | `qualityauditor` | Seed-dependent | `/quality-auditor/dashboard` | Campus audit | ALIGNED |
| HR | `hr` | `hr` | Yes | `/hr/dashboard` | HR grants | ALIGNED |
| Account Head | `accounthead` | `accounthead` | Seed-dependent | `/account-head/dashboard` | Finance head | ALIGNED |
| Driver | `driver` | `driver` | Seed-dependent | `/driver/dashboard` | Transport driver scope | ALIGNED |
| PRO | `pro` | `pro` | Demo directory / seed-dependent | `/pro/dashboard` | Conservative read grants (W1) | ALIGNED (was FRONTEND ONLY) |
| File Room | `fileroom` | `fileroom` | Demo directory / seed-dependent | `/file-room/dashboard` | Conservative read grants (W1) | ALIGNED (was FRONTEND ONLY) |
| CCTV | `cctv` | `cctv` | Demo directory / seed-dependent | `/cctv/dashboard` | Conservative read grants (W1) | ALIGNED (was FRONTEND ONLY) |
| Managing Director | — | `managing_director` | Backend seed / alias `md` | No dedicated FE portal | Full admin (BE) | BACKEND ONLY |
| Finance Assistant | — | `finance_assistant` | Backend seed | No dedicated FE portal | Finance collect (no approve/write) | BACKEND ONLY |

## Canonical mapping rules (W1)

| Canonical | Legacy aliases | Permitted portal | Permitted API ops | Restricted | Unauthorized response |
|---|---|---|---|---|---|
| `prm` | `front_office`, `frontoffice` | Front Office | FO collections; `ops` gate-visitors | Finance/users admin | 403 |
| `driver` | `vandriver`, `van_driver`, `van-driver` | Driver | Transport driver-scoped ops | Admin/finance | 403 |
| `managing_director` | `md`, `managingdirector` | None (BE) | Admin-equivalent BE | N/A FE | 401/403 as configured |
| `finance_assistant` | `financeassistant` | None (BE) | Finance read/collect | Finance write/approve | 403 |
| `accounthead` | `account_head` | Account Head | Finance head | Non-finance domains | 403 |
| `maintenancemanager` | — | Maintenance Manager | Ops facility + approvals submit/read | Invented maintenance domain APIs | 403 |
| `pro` / `fileroom` / `cctv` | — | Matching portals | Core + announcements/calendar/notifications/communication read | Domain write APIs not invented | 403 |

## Credential drift (no passwords in this doc)

| Account | Observation | Action |
|---|---|---|
| Some non-priority seed roles | Prior audits returned HTTP 401 on long-lived local DB | Document only; do not reset passwords without authorization |
| `prm@qmis.edu`, `superadmin@qmis.edu`, `teacher@qmis.edu`, `hr@qmis.edu` | Used for W1 automated/API checks when active | Prefer seed defaults from settings; never commit secrets |

## Implementation pointers

- Backend: `backend/app/permissions/matrix.py` (`ALL_ROLES`, `ROLE_ALIASES`, `normalize_role_code`, `_OPS_ROLES` includes `prm` + `maintenancemanager`).
- Backend deps: `backend/app/deps.py` uses `normalize_role_code`.
- Frontend: `ERP_QMIS/src/constants/roleRegistry.js`; `AuthContext` normalizes role on login / `/auth/me`.
