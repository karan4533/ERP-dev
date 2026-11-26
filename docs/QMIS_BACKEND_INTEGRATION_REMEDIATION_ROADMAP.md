# QMIS ERP — Backend Integration Remediation Roadmap

**Path:** `docs/QMIS_BACKEND_INTEGRATION_REMEDIATION_ROADMAP.md`\
**Audit date:** 2026-11-22\
**Mode:** Roadmap only — **do not implement in the audit task**\
**Inputs:** `QMIS_FULL_APPLICATION_BACKEND_INTEGRATION_MATRIX.md`, `QMIS_ROLE_WISE_INTEGRATION_AUDIT.md`, `ROLE_WISE_UI_BACKEND_INTEGRATION_TRACKER.md`

---

## Guiding principles

1. Wire FE to **existing** FastAPI routers/collections before inventing new domains.
2. Never mark LIVE while localStorage remains the authoritative write path.
3. Never fake payment/approval success without backend confirmation.
4. Close FE↔BE **role gaps** before building specialty portals.
5. Preserve RBAC and tenant isolation; do not open endpoints to “make green.”
6. Prefer one shared Common workspace → one ops/FO collection contract used by all roles.

---

## Priority order (and why)

| Pri | Theme | Why first |
|---:|---|---|
| 1 | Auth / RBAC / role alignment | Broken roles break every later integration |
| 2 | Core identity (students, employees, users) | Already LIVE — harden + eliminate silent mock fallbacks |
| 3 | Finance / payments | Money risk; Account Head already LIVE — finish gaps |
| 4 | Attendance / leave (formal APIs) | High daily use; kill MOCK enterprise workspace dual-path |
| 5 | Parent / student portals + isolation tests | Safety and trust |
| 6 | Transport / hostel (ops collections) | Partial LIVE exists — finish FE wiring |
| 7 | Library / gate / FO visitors | Library LIVE; visitors **404** is hard fail |
| 8 | Enterprise admin modules (Helpdesk, Stores, File Room, L&F, Monitoring) | Large UI surface; need real domains or honest MOCK banners |
| 9 | Recognition / Star Ratings | No awards API — design or drop claims |
| 10 | Reports / audit / CCTV / PRO / specialty managers | Lowest dependency leverage; many BACKEND MISSING |

---

## Work packages

### P1 — Auth, RBAC, role registry

| Item | Current | Required | Complexity |
|---|---|---|---|
| Align FE `ROLES` with BE `ALL_ROLES` | FE has `fileroom`,`cctv`,`pro`,`maintenancemanager`; BE has `managing_director`,`finance_assistant` | Single source of truth; seed users; matrix grants | M |
| Admin module permission write | BLOCKED | Either implement `/admin/roles/.../permissions` write or keep honest disabled UI | M |
| Credential/docs drift | Some seed logins 401 | Document actual seed passwords in secure internal runbook (not in git secrets) | S |
| Tests | auth static + role login matrix | Expand multi-role login + 403 probes | S |

**UAT:** Login each portal; unauthorized 403 spot checks.

---

### P2 — Core identity hardening

| Module | Current | Required | FE | BE | Tests |
|---|---|---|---|---|---|
| Students / Employees / Admin users | LIVE | Remove any silent sessionStorage fallback when live fails (show error) | ApiServices already exist | Stable | Existing suites |
| Dashboard KPIs | LIVE | Keep charts labeled MOCK until real series APIs | SA dashboard | Optional later KPI series | Browser KPI match |

---

### P3 — Finance / payments

| Gap | Current | Required | Complexity |
|---|---|---|---|
| Razorpay | NOT_CONFIGURED / 503 path | Configured env + webhook verify; never client-only success | M |
| Finance assistant vs head | Decide blocked for assistant | Keep; document | S |
| SA Finance overview pages | Mostly MOCK UI | Point at `/finance/state` or remove fake surplus | M |

**UAT:** Collect → ledger refresh → re-login; webhook signature tests.

---

### P4 — Attendance & leave unification

| Gap | Current | Required | Complexity |
|---|---|---|---|
| `AttendanceAndLeaveWorkspace` | MOCK local SoT | Route roles to formal `/leave-requests` + `/attendance` pages already LIVE | L |
| NUI-SA-115 style refresh | Memory-first | Refetch after POST | S |
| Tasks enterprise UI | MOCK despite `/tasks` | Wire TaskManagement to `/tasks` CRUD | M |

**Why before enterprise Helpdesk:** APIs already exist; dual UI confuses UAT.

---

### P5 — Parent / Student portal

| Gap | Current | Required | Complexity |
|---|---|---|---|
| Portal integration consistency | PARTIAL | Every menu item either LIVE or labeled MOCK | L |
| Home Fun attachments | MOCK blobs | Persist via `/files` + metadata; preview from stored URL | M |
| Isolation | Tests exist | Continuous parent/student negative tests | S |

---

### P6 — Transport / Hostel finish

| Gap | Current | Required | Complexity |
|---|---|---|---|
| Hostel domain screens | Only assignments/payments LIVE | Either scope UI to LIVE ops or add models for rooms/outpass/mess | L |
| Transport GPS | ProTrack optional | Fail closed when integrations demo/off | M |
| Driver ↔ manager shared SoT | PARTIAL | Same ops collections | M |

---

### P7 — Library / Gate / FO

| Gap | Current | Required | Complexity |
|---|---|---|---|
| FO Visitors | **404** | Add collection allowlist + FE wire **or** remove nav | S–M |
| Gate Pass enterprise | PARTIAL | Standardize on FO collections; drop parallel gatePassData writes | M |
| Librarian remaining MOCK KPIs | MOCK | Derive from ops counts | S |

---

### P8 — Enterprise admin modules (largest MOCK surface)

Do **not** claim LIVE with localStorage. Choose per module:

| Module | Existing BE option | Recommended approach | Complexity |
|---|---|---|---|
| Helpdesk / Ticketing | None dedicated | New domain **or** ops collection + replace `departmentTicketingData` | L |
| Stores & Procurement | Legacy FE prefixes unused; ops partial | Design purchase/inventory collections; replace `storesProcurementData` | L |
| Physical File Room | mockAdapter fileroom; no mount | Mount file-room API **or** ops collections; replace `fileRoomData` | L |
| Lost & Found | `ops/hk-lost-found` empty | Wire FE exclusively to ops; drop dual SoT | M |
| Activity Monitoring | None | Backend events from audit/tasks **or** honest MOCK banner | L |
| Activity Logs UI | thin `/audit-logs` | Map UI to `audit_logs` / `system_audit_logs` or keep DEMO label | M |
| Escalations | `/escalations` | Wire Common escalation UI to API | M |

**Dependency:** Shared pattern for “JSON collection + FE service” already proven (hostel/library). Reuse before new microservices.

---

### P9 — Recognition / Star Ratings

| Gap | Current | Required | Complexity |
|---|---|---|---|
| SOM/SOY | FE-only + mock awards | Domain API (nominations, gates, GPA source) **or** permanently label DEMO | L |
| GPA / attendance gates | Local evaluator | Authoritative academic/attendance services | L |

---

### P10 — Specialty managers / auditors / CCTV / PRO

| Portal | Current | Required | Complexity |
|---|---|---|---|
| CCTV | FE only; FE calls `/cctv` missing | Implement router **or** remove/hide portal | L |
| File Room role | FE only | Same as P8 File Room | L |
| PRO | FE only | Statutory collections under FO/ops **or** hide | L |
| Process/Quality/JD Audit | Local Data.js | campus-audit collections already exist — wire or MOCK banner | M |
| Canteen / IT / Stationery / HK / Maintenance | FE only | Ops collections per vertical or defer portals | L |

---

## Suggested delivery waves

| Wave | Scope | Exit criteria |
|---|---|---|
| **W0** | Publish audit docs; partner alignment; live-env checklist | Shared understanding of LIVE vs MOCK |
| **W1** | P1 role alignment + Visitors 404 + MOCK banners on enterprise SA modules | No silent “success” on LS-only creates |
| **W2** | P4 leave/tasks wire + P5 parent/student labeling | Dual leave UI eliminated for staff |
| **W3** | P8 L&F + Escalations + Activity Logs → real APIs | Three enterprise modules LIVE |
| **W4** | Helpdesk + Stores + File Room domains | SA enterprise ops credible |
| **W5** | Recognition + CCTV/PRO/specialty | Only if product prioritizes |

---

## Test plan requirements (each package)

1. Backend pytest for handler + RBAC 403.
2. FE unit for live-gate (`isLiveApiEnabled`) paths.
3. Browser UAT: create → network 2xx → DB/API re-list → refresh → re-login.
4. Negative: wrong role 403; parent/student isolation.
5. Production build Pass.

---

## Explicit non-goals for early waves

- Rewriting all auditor UIs.
- Inventing Razorpay success without keys.
- Treating `mockAdapter` as production.
- Committing/pushing without human approval.

---

## Confirmation

This file is planning documentation only. No implementation performed under the audit mandate.
