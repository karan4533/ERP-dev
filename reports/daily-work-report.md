# Daily work report

Project: Queen Mira International School ERP  
Area: Phase 1 — Finance foundation  
Prepared for: Manager update  

New days go at the top. Older days stay below so the history is in one file.

---

## 27 November 2026 — Connect the frontend to the full QMIS backend API (PostgreSQL `qmis_erp_staging`)

### Done
- Backend: `backend/` now matches `Heuristic-Labs/QMIS` `main` (c8a7db3). `backend/.env` points at the local pgAdmin database `qmis_erp_staging`, Alembic is at 0030, and the API runs on :8000 (`/health` ok)
- Frontend: all of `src/` (services, stores, pages, routes, layouts) is aligned to the QMIS API-wired versions. Every service client and the `VITE_USE_API_*` flags are on, and `.env` already turns on API auth, so the screens read and write through the API into PostgreSQL
- Super Admin pages (admin users, gate pass, live dashboard, activity logs) are taken from the QMIS versions. Their live behaviour is not yet click-tested
- Merge method: a three-way merge (253 files merged cleanly, 115 new files added). Conflicting files and the 19 files added on both sides took the QMIS version, as agreed. A third pass aligned the remaining files to QMIS where merged helpers no longer matched, so the app is consistent
- Added the `xlsx` dependency that QMIS pages need
- Windows case clash: `Common/Approvals` and `Common/approvals` both exist in git. The two `ApprovalHistory` imports now use an explicit `.jsx`
- Vite build passes. Backend suite: 1043 passed, 1 failed, 38 skipped (details in the testing report)

### Still open
- Pages that were replaced by the QMIS version no longer have the irul-only layout and wording. The pre-merge copy of `src` is kept in `C:\karan\irul_backup_src_20261127`
- The irul-only enterprise additions (task workspace, library workspace, central activities, mark-entry tier view, role navigation registries) import functions the QMIS data modules do not have, so they are not wired in. Their route files are not reached by the app
- 71 of 283 frontend `npm test` tests fail. They assert the irul-only UI that was replaced (responsive/"honest integration" markup, enterprise task and library modules). They need a decision: delete or rewrite them
- `test_staff_reconciliation.py::test_excel_122_body...` fails because the client Excel files under `docs/` are not in this checkout
- Not yet done: a click-through of each role's screens against live data, and a database persistence check per role

---

## 26 November 2026 — Finance Wave A7–A10 + integration with partner new-UI main

### A7–A10 done (staging)
- Book Fee (A7): per-student vendor/book lines with assigned fee check (Matched / Under / Over), edit and delete, audited
- Annual Budget (A8): budget lines per FY/department/category, actuals from posted expense ledger lines, variance and over-budget count; assistants cannot set budgets
- Reports (A9): one report pack per FY (overview, income, expenditure, fee comparison vs previous FY, trends) feeding all Reports tabs, CSV export
- Settings (A10): institution and tax identifiers (GSTIN/PAN/TAN, TDS/GST %), academic year checked against April–March FY, saved on the server and audited
- Staging smoke 18/18, finance pytest subset 36 passed, ERP_QMIS build Pass

### Integration branch (not pushed)
- Branch `integration/main-finance-2026-11-26` from partner `new-ui/main` (acb39ed): merge commit of my finance branch plus a backend port commit
- Two frontend conflicts resolved, keeping both sides: Accounting (partner's role-based base paths and live subtitles plus my live ledger) and Payment Vouchers (partner's live header plus my live register and vendor payment)
- Finance backend three-way merged into the partner backend; the partner's gateway links, reminder sweep, Non-Academics tickets and HR role guard are kept. Alembic now follows the staging chain 0019–0028 (single head)
- Found and fixed a leak from my finance work: parents and students could read campus finance registers (state, reports, wallets, budgets, etc.) because they hold finance.read for their own fees. All campus finance reads now refuse portal roles; new regression test covers every finance read route
- Fixed one frontend wallet static test that my wallet change had broken

### Still open
- Pushed to `new-ui/main` after Karan's approval (fast-forward acb39ed → f9835b0, 112 files); not deployed
- Read leak on staging fixed: the fix was applied in a separate copy (`_integration/ERP_dev_finance_leakfix`), and the staging API on :8010 now runs from it (parents/students get 403 on all 19 campus finance reads; `/my-fees` and staff access unchanged). After Karan approved, the same two changes were carried into the root finance worktree (not committed); 48 security/finance tests pass there
- TC workflow-stage backend exists only as uncommitted work in the root checkout, so it is not on either branch
- Partner databases need a one-time `alembic stamp` for the renumbered migrations
- Not done: browser click-through, PDF report export, MFP, books-closure enforcement, automatic TDS/GST

---

## 26 November 2026 — Finance Wave A6 (wallet) + A5 (accounting) + A4 (payment vouchers)

### A6 done (wallet)
- BE `finance_wallets.py`: open wallet (idempotent per email), offline recharge (cash/cheque/bank transfer; reference required and used as the repeat-safe key), spend (category, vendor, reference; overdraft/frozen blocked), freeze/flag/reactivate with reason; every money move posts a balanced GL entry against "Wallet Balances Payable" and is audited; finance roles only
- Wallet overview/summary, recharge and spend history, ledger-drift check all computed from the live snapshot; new `walletSpends` registry kept in the finance snapshot
- FE `walletApiService.js`; Wallet page tabs read the API in live mode with loading/error/Retry, new Open wallet / Record spend / Freeze actions, recharge modal takes mode + reference; demo behaviour unchanged outside live mode
- Staging smoke (open, recharge, repeat, overdraft, spend, freeze, unfreeze, statements balanced, registries kept) + pytest subset (31 passed) + ERP_QMIS build Pass

### A6 still open
- UPI / card / net-banking recharge stays BLOCKED (no payment gateway); shown disabled in the UI
- Wallet balance is read-modify-write on the JSON snapshot with no row lock, so two simultaneous spends on one wallet could race
- Browser click-through of the Wallet page not done (API and build verified)

---

## 26 November 2026 — Finance Wave A5 (accounting) + A4 (payment vouchers)

**Status:** A5 live on staging. Preserve TC / limits / payroll / Activity / Transport / Academic fees. No commit/push.

### A5 done
- BE `finance_accounting.py`: chart of accounts (list/upsert, balances from ledger), journal vouchers (balanced-only draft, idempotent by voucher no, post once to GL with audit), bank reconciliation (items derived from bank book; statement amount + reference required; mismatch stays Pending), financial statements (trial balance, P&L, balance sheet, cash flow with date/department filters)
- FE `accountingApiService.js`; Accounting page loads COA/JV/recon/statements from API in live mode with loading/error/Retry; demo registers and demo opening balances are not shown in live mode
- FinanceContext now carries `chartOfAccounts`, `journalVouchers`, `bookFeeBreakup` so the debounced state PUT cannot wipe them
- Staging smoke (account, JV create/post/repost, statements balanced, recon list) + pytest subset (24 passed) + ERP_QMIS build Pass

### A5 still open
- Bank statement import and report export remain blocked (no bank feed / export service)
- Day/Cash/Bank/General-ledger/Online book tabs are fed from the live snapshot but not yet individually paginated server-side
- No maker-checker rule on journal posting beyond role (Account Head/Finance/Admin may post; assistants may only draft)
- Browser click-through of the Accounting page not done (API and build verified)

---

## 26 November 2026 — Finance Wave A4 (payment vouchers)

**Status:** A4 live on staging. Preserve TC / limits / payroll / Activity / Transport / Academic fees. No commit/push.

### Done
- BE `finance_vouchers.py`: unified voucher register (fees, vendor AP, vendor payments, payroll, reversals) and `pay-vendor-liability` (balanced GL, idempotent, audited, finance-write roles only)
- Fixed vendor AP field mismatch (FE read `amountDue`/`payeeName`; BE stores `amount`/`vendorName`)
- FE `paymentVoucherApiService.js`; Payment Vouchers page loads from API in live mode with loading/error/Retry and a "Pay vendor & post voucher" action
- Staging smoke + pytest subset (22 passed) + ERP_QMIS build Pass

### Still open (Wave A)
- A5–A10: accounting, wallet, book fee, budget/MFP, reports, FY settings
- Vendor payment uses bank transfer only (no cheque/partial payment flow yet)
- Full `tests/` run has 50 failures in static-frontend/sqlite/parent-access tests; not yet compared with a clean baseline

---

## 25 November 2026 — Finance Wave A PARTIAL (A1–A3)

**Status:** A1 fee structures, A2 concessions, A3 unpaid/defaulters live on staging. Preserve TC / limits / payroll / Activity / Transport. No commit/push.

### Done
- BE `finance_academic_fees.py`: list/upsert fee structures, create/list concessions, unpaid-installments + defaulters aggregate
- FE live tabs/services; Fees Management banners connected for structure/concessions/defaulters
- FinanceContext PUT now preserves `activityFees` + `transportFees` (wipe fix)
- Staging smoke + pytest academic/transport/activity/payroll/limits; ERP_QMIS build Pass

### Still open (Wave A)
- A4–A10: vouchers (non-payroll), accounting, wallet, book fee, budget/MFP, reports, FY settings
- Defaulter WhatsApp/email reminders (BLOCKED)

---

## 25 November 2026 — Finance fill #5 Transport Fee (live PG)

**Status:** Complete in `_integration/ERP_dev_finance_limits` + `ERP_QMIS`. Staging `qmis_erp_staging` only. No commit/push. TC, finance limits, payroll, Activity Fee preserved.

### Done
- Transport fee registry APIs: list / upsert / assign / collect with idempotent assign & collect
- `post_transport_enrollment_fee` posts installments; collection issues Finance receipts
- Short stable assignment ids for UUID students (audit `entity_id` varchar 64)
- FE Fees Management → Transport Fees tab + TM StudentTransport wired to live API (no localStorage)
- Staging smoke + browser Account Head create/assign/collect; ERP_QMIS production build Pass
- Pytest transport + activity + payroll + limits: **23 passed**

### Still open
- Finance Assistant dedicated portal route
- WhatsApp receipts (blocked)
- Commit/PR when asked
- Optional: deeper TM ops → finance sync browser path beyond API hook

---

## 25 November 2026 — P0 Finance approval limits (isolated worktree)

**Status:** Complete in `_integration/ERP_dev_finance_limits` (`fix/finance-approval-limits`). Staging PG only. No commit/push. TC worktree preserved.

### Done
- Migration `0028_finance_approval_limits` on `qmis_erp_staging`; table + Head-only configure APIs + audit
- Backend enforcement on finance decide-approval, purchase PO approve, material decide, stationery approve
- Live purchase APIs; FE Approval Limits → PostgreSQL; browser Account Head save verified (teacher=5600)
- Pytest finance suites **14 passed**; worktree FE production build Pass

### Hardening (same day)
- Store/ops spend collections blocked over limit; FE PO/requisition fail-closed when live
- Assistant Finance API matrix; campus isolation; audit; Alembic `0027→0028` linear
- Started next Finance P0: HR payroll → voucher (GL posting, audit, Payment Vouchers payroll tab)

### Still open
- Finance Assistant dedicated portal route (API already read-only for limits)
- Commit/PR when asked
- WhatsApp receipts (blocked) — Activity Fee + Transport Fee live paths completed same day

---

## 25 November 2026 — TC FE display fixes + multi-role browser (staging)

**Status:** Two FE display bugs fixed in `ERP_QMIS`; multi-role browser workflow completed on staging for `TC-REQ-007`. No commit/push. Finance not started (at time of that slice).

### Done
- **Status label:** `displayTcStatus` / `resolveTcWorkflowStage` now show stage-aware labels while API status is still `Pending PRM Review` (e.g. “Pending Class Teacher review”).
- **Highlighter:** `prm` is its own step; no longer mapped onto Class Teacher. PRM actions gated on `workflowStage === 'prm'`.
- Role TC routes mounted for teacher/coordinator/principal/director/account-head/librarian/transport/stores.
- Browser multi-role on `TC-REQ-007`: PRM forward → CT → Coord → Principal → DA → 5 NOCs → MD approve (`TC/2026/4`); wrong-role advance/decide → 403.
- Helper unit tests: 3 passed.

### Still open
- BE worktree still uncommitted; no production deploy.

---

## 25 November 2026 — TC PostgreSQL integration complete (staging)

**Status:** TC role authorization + `workflow_stage` migration + full CT→…→NOC→MD workflow verified on `qmis_erp_staging`. No commit/push/deploy. Finance approval-limits not started.

### Done
- Additive Alembic **`0027_tc_workflow_stage`** (`down_revision = 0026_audit_logs_ip_ua`) applied on **`qmis_erp_staging` only**; column `workflow_stage` present. NOCs use existing `tc_request_nocs` (0025) — no duplicate `noc_json` column.
- Worktree `_integration/ERP_dev_tc_auth` (`fix/tc-role-authorization`): service stages, assigned-CT gate, dept NOC matrix, `tc.advance`/`tc.noc`/`tc.decide`, audit actions.
- Staging API E2E: create → forward → CT→Coord→Principal→DA → 5 NOCs → MD approve; unauthorized skips rejected; audits recorded (`STAGING_TC_E2E_OK`).
- Browser (ERP_QMIS :5173 ↔ API :8000): parent create `TC-REQ-006`, PRM forward + reject (`TC-REQ-004`), admin MD approve (`TC-REQ-003` → `TC/2026/3529`).
- Regression: TC auth + lifecycle + reject + security **58 passed**; ERP_QMIS `npm run build` **pass**.

### Still open (addressed later same day — see section above)
- Intermediate stage display + highlighter quirks (fixed in FE follow-up).
- BE not committed/pushed; Finance approval-limit implementation not started.
- Main dirty worktree `deploy/gatekeeper-live-apis-and-tests` and other worktrees left untouched.

---

## 25 November 2026 — Full client-doc coverage + FE push (earlier)

**Status:** Client PDF gap/overflow coverage slice finished on FE and pushed to `new-UI_irul` `deploy/stable` (`a4af51c`). Matching BE TC/escalation APIs remain local (not pushed).

### Done
- **TC overflow:** FE advance + NOC clear + MD decide; live `workflow_stage` CT→Coord→Principal→DA→NOC→MD
- **Finance limits:** Approval Limits settings + helper gates purchase/material approvals above role cap
- **Integrations console:** Super Admin `/super-admin/integrations` (iClock, WhatsApp, Paytm, GPS, Email, Bank)
- **MD Final Approvals Centre:** Director `/director/final-approvals`
- **Escalations:** Not Satisfied action + 24h SLA sweep button
- **Audit CAPA spine:** JD Audit CAPA page + finding CAPA sections
- **Immutable helper:** shared lock helper wired into gate-pass edit
- Gap MD updated (`_integration/client_docs_extract/QMIS_MODULE_GAP_AND_OVERFLOW.md`)

### Still open
- BE push of TC advance/NOC + not-satisfied + migration 0020 (local only)
- WhatsApp/Paytm/RFID live connectors; tickets/helpdesk Not Satisfied; BSC→HR write-back

---

## 24 November 2026 — Fix attendance session + parent exam/fee KPIs

**Status:** Three approved fixes done on local code against `qmis_erp_staging`. No migration 0027. No commit/push/cleanup.

### Done
- **P0 attendance:** ORM/API now persist `session` (FN/AN, default FN) matching existing PG NOT NULL + `uq_student_attendance_day_session`. No schema change.
- **P1 exam UI:** `ResultDetails` loads `GET /api/v1/results/students/{id}` (shows XINT Midterm Maths 42/50).
- **P1 dashboard KPIs:** Parent attendance from calendar API; fees from `/finance/my-fees`; empty/honest states when missing. Assignments card marked not connected.
- Verified teacher/admin mark + parent calendar/results/fees; XINT ops rows preserved (9). FE `npm run build` Pass after removing empty banner ternaries that blocked build.
- Pytest attendance/exams/students/finance: **13 passed**

### Still open
- Await approval for commit/push and any further UI polish
- Assignment KPI still not live (honest empty)

---

## 24 November 2026 — XINT tagged staging test-record set (workflows 1–10)

**Status:** Tagged records created on `qmis_erp_staging` only. Matrix delivered. **Waiting for approval before any code fixes.** No commit/push/deploy/cleanup.

### Done
- Created `XINT-20261124` student **ADM-0001** / UUID `66a559b3-5154-4dee-b5ff-a961155674f4` (campus `6d1d9390-…`)
- LIVE: admission+place, parent link (`/parents/me/children`), CASH fee collect, exams+marks API, transport/hostel/library/gate ops, leave chain
- Browser: admin Student Database shows XINT Alpha; refresh OK; parent logout/login shows same student UUID
- Evidence: `_integration/xint_matrix_final.json`, `_integration/xint_evidence_1795532032.json`

### Blockers / honesty (no fixes yet)
- **WF4 attendance BLOCKED:** PG `student_attendance.session` NOT NULL; API/ORM omits `session` → 500
- Parent Exam Result UI empty while `GET /api/v1/results/students/{id}` returns Maths 42/50 (PARTIAL UI)
- Parent dashboard fee/attendance KPIs look MOCK vs live finance/attendance
- Coordinator/teacher visibility needs grade-band / class-teacher (configured via existing masters APIs)

### Still open
- Approve cleanup of XINT tagged rows when ready
- Approve code/migration fix for attendance `session` (and optional parent exam UI binding)

---

## 24 November 2026 — Phase 2 Gate Keeper + Manager (roles 5–6/6)

**Status:** Gate Keeper / Manager core moved PARTIAL→LIVE. FO write still blocked by design. No commit/push/deploy.

### Done
- Audited GK/GKM vs `/api/v1/ops/gate-*` + FO read-only `*-gate-passes`
- Wired LIVE registers / handover / vendors / team-attendance (removed mock lists + mock workspace routes)
- Student gate-pass list LIVE read; My Duty assignee-only (no campus mock fallback)
- Assign Duty persists `assigneeEmail`; skip hostel matrix for gate roles
- Pytest `test_gatekeeper_apis.py` **7 passed**; live PUT/GET smoke on staging PG
- Docs updated: `PHASE2_GATEKEEPER_VERIFICATION_REPORT.md`, `PHASE2_GATEKEEPER_MANAGER_VERIFICATION_REPORT.md`

### Still open
- FO gate-pass **write** remains PRM/admin only (403 for GK — not mock)
- Enterprise MOCK outside Phase 2 core (stores/file room/etc.)
- Optional: merge/push deploy branches when asked

---

## 24 November 2026 — Partner staging deploy readiness

**Status:** Staging DB + BE/FE deploy branches ready. Not merged to main. No ECS/prod cutover.

### Done
- Applied production DDL to local `qmis_erp_staging` (57 public tables, alembic stamped `0026`); seeded campus/roles/permissions/users
- Pushed BE `deploy/partner-backend-staging-ready` (`d324e19`) to ERP-dev origin
- Pushed FE `deploy/partner-frontend-staging-ready` (`cc94139`, 176 files) to `new-UI_irul`
- FE `npm run build` Pass; BE pytest **429 passed**, 37 skipped
- Staging API smoke: health/openapi 200 (212 paths); admin login + `/auth/me` + `/students` 200; unauth 401; 40 module GETs non-5xx

### Still open
- Merge PRs / ECS (or host) deploy of those branches
- Wire FE `VITE_API_URL` to staging API host; true-prod seed policy without demo accounts
- Gate Keeper → Gate Keeper Manager (Phase 2 sequence continues)

---

## 24 November 2026 — Phase 2 Hostel Warden (role 4/6)

**Status:** Hostel Warden verification report ready. Gate Keeper not started. No commit/push/deploy.

### Done
- Audited Hostel Warden screens vs `/api/v1/ops/hostel-assignments` + `hostel-payments`
- Mark Paid on dues register with gateway honesty; MOCK/BLOCKED page for room/outpass/mess deep links
- Persist seed + teacher/finance/admin 403; pytest 3 passed; build Pass; browser UAT
- Doc: `PHASE2_HOSTEL_WARDEN_VERIFICATION_REPORT.md`

### Still open
- Gate Keeper → Gate Keeper Manager (sequential)
- Room/outpass/mess/visitors/complaints/maintenance BLOCKED (no hostel domain)

---

## 23 November 2026 — Phase 2 Transport Driver (role 3/6)

**Status:** Transport Driver verification report ready. Hostel Warden not started. No commit/push/deploy.

### Done
- Audited Driver screens vs driver-scoped `/api/v1/ops/transport-*`
- Wired fuel/maintenance/health View pages; Add forms prefill scoped vehicles
- Honesty banners: LIVE core, BLOCKED documents, MOCK reports, GPS not LIVE
- Merge-seed driver scope without wiping TM data; persist + isolation + teacher 403
- Pytest 7 passed; FE build Pass; browser UAT as `driver@qmis.edu`
- Doc: `PHASE2_TRANSPORT_DRIVER_VERIFICATION_REPORT.md`

### Still open
- Hostel Warden → Gate Keeper → Gate Keeper Manager (sequential)
- Document upload BLOCKED; Edit forms LOCAL ONLY; GPS DEMO elsewhere

---

## 23 November 2026 — Phase 2 Transport Manager (role 2/6)

**Status:** Transport Manager verification report ready. Transport Driver not started. No commit/push/deploy.

### Done
- Audited TM screens vs `/api/v1/ops/transport-*`
- Wired maintenance, driver fuel/maintenance approvals, expenses ledger to existing ops collections
- Preserved Track Bus DEMO / fail-closed GPS (never LIVE)
- Persist + teacher 403; pytest 10 passed; build Pass; browser UAT
- Doc: `PHASE2_TRANSPORT_MANAGER_VERIFICATION_REPORT.md`

### Still open
- Transport Driver → Hostel → Gate Keeper → Gate Keeper Manager (sequential)
- Expense Add full field mapping PARTIAL; budget MOCK; NOC BLOCKED

---

## 23 November 2026 — Phase 2 Librarian (role 1/6)

**Status:** Librarian verification report ready. Transport Manager not started. No commit/push/deploy.

### Done
- Audited Librarian screens vs `/api/v1/ops/library-*`
- Wired dashboard KPIs + Mark Returned to live library collections (requests/SMS remain MOCK)
- Persist + teacher 403 verified; pytest library ops 2 passed; build Pass; browser UAT dashboard + catalog
- Doc: `PHASE2_LIBRARIAN_VERIFICATION_REPORT.md`; tracker updated

### Still open
- Transport Manager → Driver → Hostel → Gate Keeper → Gate Keeper Manager (sequential)
- Librarian book-requests domain (needs approval); SMS reminder gateway

---

## 23 November 2026 — Phase 1 final stabilization

**Status:** Remaining Phase 1 gaps stabilized with evidence. Phase 2 not started. Awaiting approval. No commit/push/deploy.

### Done
- Coordinator Enterprise Exam Management schedules → LIVE (`GET/POST /exams` + submit); blueprints/grading/duties labeled MOCK/LOCAL
- Parent identity → `GET /parents/me/children` (FE seed unused while live); Student identity → `GET /students/me`
- Attendance calendar: no invented marks; UUID calendar path; documented class-list over-fetch limitation
- Finance: POS / Book Fee / Budget / MFP honest MOCK notices; POS sync toast demoted; payment success still API-gated
- Teacher RBAC preserved (View Only exams; leave decide / announce / exam write blocked; API 403 confirmed)
- Browser UAT for all seven roles; pytest 28 passed; `npm run build` Pass; reused healthy `:8000`
- Docs: `PHASE1_FINAL_STABILIZATION_REPORT.md`, tracker, matrix, W1 cross-link, testing/daily reports

### Still open (blockers)
- Invigilation/halls API absent; exam-weightage UI not wired; POS gateway unset; Book Fee/Budget/MFP domains
- Parent escalations blocked; dashboard KPIs / Home Fun / Track Bus MOCK
- Phase 2 / W2 not started — stop for approval

---

## 23 November 2026 — Phase 1 seven-role evidence (HR→Student)

**Status:** Phase 1 core-role audit / wire / UAT / evidence complete. Phase 2 not started. No commit/push/deploy.

### Done
- Audited and classified HR, Finance, Principal, Teacher, Coordinator, Parent, Student against FastAPI (LIVE / PARTIAL / MOCK / LOCAL ONLY / BLOCKED)
- Wired remaining existing-API gaps: principal announcement create; exam timetable list; HR training + disciplinary; teacher leave-decide UI gate; parent escalations fail-closed; attendance calendar live path; finance dashboard live notice; parent seed ↔ `parent@qmis.edu` / `ADM-DEMO-001`
- Preserved controlled triage fixes (migration 0007, NullPool skip, Track Bus DEMO, Roles honesty, calendar hydrate)
- HTTP probe 17/17; pytest focused suite 72 passed; `npm run build` Pass
- Browser UAT per role on LIVE FE/API (training, finance snapshot, exam list, teacher announcements, placement, parent escalations blocked, student my-fees)
- Docs: `PHASE1_CORE_ROLES_EVIDENCE_REPORT.md`; tracker rollup; this testing report

### Still open
- Phase 2 specialty domains (approval required) — not started
- Coordinator Exam Management page still MOCK UI despite `exams.write`
- Parent/student enrollment identity API; attendance class-roster over-fetch product decision
- POS/Razorpay unset; Book Fee / Budget / MFP / recognition / helpdesk still MOCK
- Role permissions PATCH still 405

---

## 23 November 2026 — W1 Auth/RBAC + Visitors + LIVE/MOCK indicators

**Status:** W1 implementation complete and verified. W2 not started. No commit/push/deploy.

### Done
- Role alignment: registered `maintenancemanager`/`pro`/`fileroom`/`cctv` in BE matrix; aliases + `normalize_role_code`; FE `roleRegistry` + AuthContext normalization
- Visitors 404 fixed: SoT `/api/v1/ops/gate-visitors`; FO `/front-office/visitors` alias; PRM in gate writers; FE VisitorsWorkspace LIVE path
- Honest `DataSourceIndicator` on SA enterprise screens (Helpdesk/Stores/FileRoom/L&F/Recognition/Monitoring/Activity Logs/Compliance) + Visitors LIVE
- Docs: `QMIS_ROLE_ALIGNMENT_MATRIX.md`, `QMIS_W1_IMPLEMENTATION_REPORT.md`; matrix/tracker updates
- Tests: pytest W1+FO+ops **25 passed**; FE role/indicator tests **7 passed**; `npm run build` Pass
- Browser UAT: PRM visitors LIVE + persistence; SA indicators LOCAL ONLY/MOCK; RBAC 401/403

### Still open
- W2 enterprise ops wiring (not started)
- Seed credential drift for some roles (documented; no password reset)
- Ops full-collection PUT concurrency hardening for visitors
- Prior triage items (~41 legacy root-`src` static failures; calendar/roles notes) unchanged outside W1

---

## 23 November 2026 — Controlled triage fixes + Phase 1 calendar hydrate

**Status:** Controlled fix sequence complete. Phase 1 calendar LIVE hydrate started. No commit/push.

### Done
- Migration 0007 test INSERT aligned with `all_day`; added 0019 upgrade-path test (no unsafe rewrite of historical 0007 DDL)
- SQLite NullPool test skip detects URL-encoded `:memory:` / StaticPool; production pooling unchanged
- Track Bus DEMO badge: `DEMO ROUTE — NOT LIVE GPS` (ERP_QMIS + root); never presents demo GPS as LIVE
- Roles audit: confirmed admin permissions GET-only (PATCH 405); ERP_QMIS live UI read-only with server codes; removed false server-success paths; root Roles read-only
- Phase 1: AcademicCalendarPage live list hydrate + create re-hydrate (no sessionStorage SoT when live)
- ERP_QMIS production build Pass; focused pytest for migration/track-bus/leave/finance Pass (legacy static B#13 still FNF on missing `adminUsersApi.js`)

### Still open
- ~41 legacy root-`src` static failures remain classified (retarget later)
- Role navigation-module PATCH write contract needs product/schema approval
- Remaining Phase 1 PARTIAL/MOCK (dashboards, Home Fun, Star Ratings, gateway) unchanged

---

## 22 November 2026 — NEW UI ↔ reference backend Phase 1–2 integration

**Status:** Implementation complete for Phase 1 core + Phase 2 ops. Phase 3 specialty documented MOCK only. No commit/push.

### Done
- Created `docs/NEW_UI_REFERENCE_BACKEND_INTEGRATION_MATRIX.md` + `docs/NEW_UI_REFERENCE_BACKEND_IMPLEMENTATION_REPORT.md`
- Phase 0 regression SA/Admin/PRM: login + priority APIs OK; no reimplementation
- Phase 1: leave create/detail LIVE; HR my-leave formal routes; tasks + escalations Common LIVE; lesson plans LIVE; parent/student fees/TC/attendance LIVE; CheckoutMockModal fail-closed when live
- Phase 2: Librarian / Transport Manager / Hostel / Gate ops collections LIVE with honesty banners; GPS/rooms/mess stay MOCK
- Phase 3: Helpdesk/Stores/File Room/CCTV/PRO/Awards remain documented MOCK (no new domains)
- ERP_QMIS production build Pass; pytest 399 passed / 43 failed (legacy root-`src` static); browser teacher my-leave shows live queue with persisted LR

### Still open
- Specialty Phase 3 FE wiring awaits domain approval
- Legacy root-`src` static pytest cleanup
- Parent attendance scoping edge cases in browser

---

## 22 November 2026 — Full-application backend integration audit (all roles)

**Status:** Audit-only complete. No app code / schema / env / data changes. No commit/push.

### Done
- Discovered FE **31** portal roles vs BE **27** matrix roles; OpenAPI **209** paths; runtime DB **SQLite** on `:8000`; FE live mode on `:5175`
- Documented LIVE priority slices vs MOCK enterprise surface across all portals
- Created `docs/QMIS_FULL_APPLICATION_BACKEND_INTEGRATION_MATRIX.md`, `docs/QMIS_ROLE_WISE_INTEGRATION_AUDIT.md`, `docs/QMIS_BACKEND_INTEGRATION_REMEDIATION_ROADMAP.md`
- Runtime spot-checks: auth, dashboard KPIs, students, HR employees, finance state, calendar, ops L&F, leave, approvals

### Still open
- Remediation not started (await review of roadmap)
- Full browser UAT of every role tab not in this audit pass

---

## 21 November 2026 — Super Admin / Director 50-case UAT continuation

**Status:** Evidence-based status update; **28/50 FIXED + VERIFIED**. Not 50/50. No commit/push.

### Done
- Browser UAT promoted Activity Logs (063/064/065/067/069), Helpdesk (089–094), Stores (074/075/076/078/079), Approvals refresh (011), Gate Pass PDF (017), Monitoring dept filter (099), Star Ratings (053/054), L&F badge/CSV (110/111)
- Fixed Feedback Register empty CSV via rated seed ticket; Activity Log breadcrumb Login History false parent; L&F empty directory via `loadLocalLostFoundDirectory` fallback + Claim Approved seed
- Updated checklist + FINAL_UAT_REPORT (28 FV / 15 PF / 7 NV)
- Partner handoff: `docs/SUPER_ADMIN_DIRECTOR_LIVE_VS_MOCK_SHEET.md` (LIVE priority slice vs MOCK enterprise modules)
- FE focused tests 12 passed; backend `test_admin_remaining_modules` 10 passed; Vite production build Pass (~1m 14s)

### Still open
- PARTIAL: SOY mock SoT, File Room LS, exam 131 browser Director walk, leave/tasks/calendar refresh LIVE, student/teacher year, cultural, Home Fun attachments, compliance MOCK
- NOT VERIFIED: 046, 052, 077, 100, 102, 103, 160
- NUI-SA-128 timed browser create still incomplete

---

## 20 November 2026 — Official 50 FAIL NUI ID pass + NUI-SA-128

**Status:** Fixes continued; checklist rewritten to official Test IDs. **Not 50/50 FIXED+VERIFIED.** No commit/push.

### Done
- Rewrote `docs/SUPER_ADMIN_DIRECTOR_50_FAIL_VERIFICATION_CHECKLIST.md` with exact 50 NUI Test IDs (9H/31M/7L/3U) + enhancement NUI-SA-128
- Created `docs/SUPER_ADMIN_DIRECTOR_FINAL_UAT_REPORT.md`
- Fixed approvals decide vocabulary (`approve`/`deny`) for NUI-SA-131 live path
- Exam Approvals: merge live `/exams` with Principal shared submissions (NUI-SA-130)
- Gate Pass / ExportModal: real `buildValidPdf` (NUI-SA-017)
- NUI-SA-128: alembic `0019` all_day/start_time/end_time; calendar API + `calendarApiService`; FE live create path
- Browser UAT: NUI-SA-125/126 (invalid dates), NUI-169 (Nov 2026), All-Day control visible
- FE focused tests 10 pass; calendar/exams pytest 6 pass; Vite build Pass (~57s)
- Full pytest: 399 passed, 43 failed (pre-existing frontend static), 36 skipped

### Still open
- 28 NOT VERIFIED + 17 PARTIALLY FIXED — need per-ID browser UAT and LIVE persistence for File Room / Leave / Tasks / SOY / Exam approvalId path
- Reload API process and re-UAT timed LIVE calendar create for NUI-SA-128
- Commit/push when approved

---

## 20 November 2026 — Director portal multi-module defect fixes

**Status:** Defects fixed locally. No commit/push.

### Done
- Exam Timetable Approvals: unified Principal↔Director SoT (`examinationTimetableShared`); EXM003 aligned to `Unit -4a`; approve/deny persists; live `/api/v1/exams` when non-empty, shared fallback when empty; Principal create can submit live then mirror shared
- Student Profile: academic-session-scoped timetable + effective dates; empty historical message
- Teacher Database: year-dependent Assignment column without hiding master records
- Cultural Activities: `ACTIVITIES_UPDATED_EVENT` list refresh without full browser reload
- Progress Report Cards: fixed `classFilteredStudents` TDZ
- Student Home Fun: Eye preview modal + Download Blob (Director + Principal LMS views)
- Academic Calendar: initial month = current local month
- FE node tests **17 passed**; BE academics/calendar **17 passed**; Vite build **Pass**
- Browser UAT Director: EXM003/approve persist, Report Cards, Calendar Nov 2026, Home Fun preview

### Still open
- Home Fun still MOCK for live file storage (no `/files/{id}` wiring on dossier docs)
- Exam LIVE path needs Principal-created backend exams to prefer over shared seed
- Student/Teacher historical year data remains FE-mapped, not full REST history
- Commit/push when approved

---

## 20 November 2026 — Super Admin multi-module defect fixes

**Status:** Defects fixed locally. No commit/push.

### Done
- Physical File Room: Log Inward + rack assignment confirmed on same `logFileInward` path as Docket; form reset after success
- Department Helpdesk: ticketNumber/title/category/SLA/head/actions mapping; Issue Category select; real SLA + Feedback CSV downloads
- Activity Monitoring: filter/review no longer reset to Monitoring Overview (`availableTabs` effect); review dialog closes after Approved
- Lost & Found: long status badge wraps inside card; Custody Ledger CSV actually downloads
- Leave / Tasks: memory-first reads + refresh/tab jump so new leave/task appears without full browser reload
- Academic Calendar: end≥start FE validation (no success toast on invalid); all-day + optional times on custom events; BE `_dates` already rejects inverted ranges
- FE node tests **14 passed** (calendar + ticketing + activity logs + SOY); BE calendar pytest **2 passed**; Vite build **Pass**
- Browser UAT: Helpdesk shows TICK-*/SLA Nh/heads/Assign·Resolve; Calendar invalid range toast without save

### Still open
- Helpdesk / Monitoring / L&F / Leave / Tasks remain PARTIAL/MOCK (local SoT; not full REST)
- Academic Calendar timed events: FE custom SoT only — API `calendar_events` has no start/end time columns (schema change required for LIVE timed events)
- Full interactive UAT matrix for File Room rack, Leave submit, Task create, L&F CSV still recommended before commit
- Commit/push when approved

---

## 20 November 2026 — Super Admin Activity Logs / Stores / File Room fixes

**Status:** Defects fixed locally. No commit/push.

### Done
- Activity Logs: change-value aliases (`oldValue`/`previousValue`/…) never render `undefined`; Inspect uses `/:logType/view/:id`; Back returns to originating category (Data Changes / Deleted / Demo)
- Stores & Procurement: tab click no longer reset by `defaultTab` effect; route `:tab` sync; Restock RFQ → requirements; Edit before HOD approval; request modal viewport fit; tab label wrap; SA role key `superadmin`
- Physical File Room: Docket Inward/Issue/Receive-Back mapped to `fileRoomData` contracts (`newFile.fileRefNo`, `issueId`); smoke inward→issue→return Pass
- FE activity log tests **5 passed**; Vite build **Pass**

### Still open
- Activity Logs / Stores / File Room remain DEMO/PARTIAL (browser SoT; dedicated REST still incomplete)
- File Room UI still on local `fileRoomData` (service exists but not fully wired to workspace)
- Commit/push when approved

---

## 20 November 2026 — Super Admin Star Ratings (SOY) defect fixes

**Status:** Functional + UI defects fixed locally. No commit/push.

### Done
- Root causes: incomplete eligibility (`somCount`+score only), silent GPA defaults (`Number(gpa) || 9.0`), Gate 2 NaN from missing `gpa` field, Audit summary mismatched gates, SOM/SOY tabs local-state only
- Shared `soyEligibility.js` 4-gate evaluator wired into leaderboard, Audit Gates, and `awardsService.verifySoyEligibility` / `nominateSoy`
- Strict GPA parse (missing/invalid never pass); nominate sends real GPA + `somWinsCount`
- Audit Gates modal portaled; leaderboard column/badge readability; SOM↔SOY route/URL/breadcrumb sync
- FE unit/service tests pass; production Vite build Pass; browser UAT Pass on SA SOY

### Still open
- Star Ratings remains PARTIAL (FE awardsService + local SOM SoT; no dedicated REST domain)
- Dual nominee ID SoT (`STU-2024-0142` vs awards seed `STU-001`) mitigated, not fully unified
- Commit/push when approved

---

## 19 November 2026 — TM SQLite concurrency crash fix

**Status:** Fixed and re-UAT’d locally. No commit/push.

### Done
- Root cause: request-path `StaticPool` shared SQLite connection across threads (`app.core.database`)
- Fix: file SQLite **NullPool**; unify `db.session` onto same engine; FE sequential loads + stale guards
- Concurrent pytest **3 passed**; live 64-way burst survived; transport/hostel/ops **13 passed**; FE build **Pass**
- Browser UAT: dashboard counts, lists, create `TDR-0002`, refresh, RBAC 403, MOCK honesty **Pass**

### Still open
- GPS / maintenance / approvals / expenses / NOC still MOCK/BLOCKED
- Commit/push when approved

---

## 19 November 2026 — Transport Manager browser UAT

**Status:** Browser UAT was **partial** before NullPool fix (superseded by section above).

### Done
- Browser: TM login + sidebar + Live banner (honest GPS/NOC wording) **Pass**
- Sequential API: lists + create `TDR-UAT-LOCAL` persist + admin/finance **403** **Pass**

### Failures (at that time)
- Dashboard/list UI data **Fail** under concurrent StaticPool crash — later fixed same day

---

## 19 November 2026 — Push checkpoint + Transport Manager LIVE start

**Status:** PRM + Hostel + regression **pushed**. Transport Manager Phase B core fleet wired and pushed earlier same day.

### Done
- Pushed root `irul` and FE `new-ui/main` (regression, PRM, Hostel, TM LIVE)
- Pytest transport+hostel+ops **13 passed**; FE build **Pass**

### Still open
- TM GPS track UI, maintenance/approvals/expenses, NOC — MOCK/BLOCKED

---

## 19 November 2026 — Regression fixes + Hostel Warden checkpoint

**Status:** Committed/pushed same day.

### Done
- Fixed admissions `AdmissionCreate.student_account_email` AttributeError (schema + enroll soft-skip); Parent TC cascade cleared
- Attendance roster includes pending+placed; finance_actions expect Razorpay `NOT_CONFIGURED`; HR 409 not reproduced
- Added backend `hostelwarden` role (matrix, seed, creatable STAFF, ops writers, `students.read`)
- Frontend Hostel Warden layout/routes/dashboard/assignments/payments + `hostelApiService`
- Browser UAT hostel; pytest **93/0**; FE build **Pass**

### Still open
- Hostel blocks/rooms masters, outpass, visitors, mess, complaints — **BLOCKED** (no APIs)

---

## 18 November 2026 — PRM / Front Office checkpoint (awaiting commit approval)

**Status:** Local only. **Do not commit/push until explicit approval.**

### Done
- Audited PRM routes/sidebar vs FastAPI: admissions, students, HR portal teachers, TC forward/reject, FO collections exist; visitors **404**
- LIVE wire: enquiry create/update/detail/status/convert; students+teachers; TC list/forward/reject; FO collection lists; PRM layout banner; leave routes use formal pages + enterprise stub skip for `prm`
- Added `frontOfficeApiService`; extended admissions + TC API services
- Browser UAT: Live banner; enquiry 4→5 after UI create; students 3/3; gate pass 1/1
- Pytest 36 passed / 5 failed (known admissions AttributeError + parent-TC); build Pass
- Tracker + testing report updated

### Still open
- Visitors BLOCKED; FO Add forms PARTIAL; dashboard/parent DB/reports MOCK
- Await ack to commit/push PRM checkpoint on `ERP_QMIS` `main` / `new-ui`

---

## 18 November 2026 — Regression audit + Librarian checkpoint

**Status:** Local only. Commit/push authorized for verified ERP_QMIS work.

### Done
- Re-verified Super Admin → Coordinator LIVE slices via code + API probes (HR seed password note: `hr12345`)
- Librarian LIVE: `libraryApiService` + catalog/members/add-book/issue-return against `/api/v1/ops/library-*`; layout banner
- Browser UAT: Live Librarian banner; catalog TOTAL TITLES 1 / UAT Physics; API issue→return persistence; teacher library write 403
- Pytest ops/role suites + frontend build Pass; known admissions/TC/Razorpay failures left untouched
- Tracker + testing report updated

### Still open
- Librarian book-requests / dashboard KPI remain MOCK
- Next role after ack: PRM / Front Office

---

## 18 November 2026 — Coordinator expansion checkpoint

**Status:** Local only. No commit/push.

### Done
- Phase A/B audit for `coordinator` (`exams.write`, `students.place`/`promote`, `hr.employees.read`, `leave.decide`) vs sidebar/routes; tracker updated
- LIVE: grade-band students + view; class attendance GET/POST; my-leave + received leave (`leave.decide`); student placement page; announcements read (shared)
- Extended `studentApiService` with placement/promote helpers; Coordinator layout Live banner; enterprise leave stubs skipped for coordinator; sidebar Placement + Attendance/Leave sublinks
- Browser UAT: students 1/1; attendance save + Present after refresh; leave queues live; placement band 1–12; announcements 59
- RBAC: finance + admin users **403**; exams create **201**
- Pytest coordinator/teacher/leave/auth 17 (+2 attendance known fails); HR/principal/admin + known admissions/TC 36/5; finance foundation+finance 8; build Pass

### Still open
- Dashboard / exams FE / timetable / mark entry / lesson-plan approval UI mostly MOCK/PARTIAL
- Empty roster without Principal grade-band assignment
- Next role after ack: Librarian (or PRM)

---

## 18 November 2026 — Teacher expansion checkpoint

**Status:** Local only. No commit/push.

### Done
- Phase A/B audit for `teacher` vs `_STAFF_ACADEMIC` + probes; tracker updated
- Added `attendanceApiService` + `lessonPlanApiService`; LIVE students roster (scoped), class attendance GET/POST, my-leave list; announcements already shared LIVE
- Teacher layout Live banner; enterprise leave stubs skipped for teacher
- Browser UAT: live banner; students 0/0 (unassigned roster); attendance live; my-leave 1 matching
- RBAC: no exams.write / leave.decide / finance / admin users
- Pytest teacher+leave+auth 16; HR/finance/principal/admin 44; build Pass; attendance 2 fail via admissions AttributeError; known admissions(3)/parent-TC(2) remain

### Still open
- Dashboard / lesson-plan UI / exams / timetable / mark entry / enterprise ops mostly MOCK
- Teacher roster empty until class-teacher / allocation pins exist
- Next role after ack: Coordinator

---

## 18 November 2026 — Principal expansion checkpoint

**Status:** Local only. No commit/push.

### Done
- Phase A/B audit for `principal` (sidebar/routes vs matrix + probes); tracker updated
- Repaired inactive local seed `principal@qmis.edu` (activate + password) without wiping campus data; cleared login lockout via uvicorn restart
- LIVE: Student Database + Teacher Database (shared `studentApiService` / `hrApiService`); Received leave list/decide (route fixed; enterprise leave stubs skipped for principal); Announcements already shared LIVE
- Layout Live Principal workspace banner
- Browser UAT: students 1/1 live, employees 6/6 live, received leave live queue (1)
- RBAC: finance/admin users/admissions/TC **403** for principal
- Pytest principal+leave+auth **15**; HR/finance/admin users **43**; build Pass; known admissions(3)/parent-TC(2) still fail

### Still open
- Academic dashboard charts MOCK; my-leave list UI still local; calendar/tasks/escalations/exams FE not fully live-gated
- Timetable/teacher allocation localStorage; Home Fun / stars / most enterprise ops MOCK
- Next role after ack: Teacher (or Coordinator)

---

## 18 November 2026 — Finance / Account Head expansion checkpoint

**Status:** Local only. No commit/push.

### Done
- Phase A/B audit+mapping for Account Head vs `/api/v1/finance/*`; tracker updated
- Added `financeApiService` (state get/put/reset, collect/settle/send/decide, gateway/HR concessions helpers)
- `FinanceContext` LIVE hydrate + debounced PUT persist; collect/settle/send/decide/reset go through actions; wait for `isSessionReady` + JWT before hydrate (avoids 401 wiping session)
- Approvals page LIVE via campus `approvals` + `decide-approval`; Settings reset async; layout Live Finance banner; FeePaymentModal notice honest about gateway stubs
- API UAT as `accounthead@qmis.edu` / `accounts123`: seed PUT → collect ₹1000 (`REC-*`) → decide `APR-1` Approved; HR PUT `/finance/state` → **403**
- Browser: Live Finance workspace banner; Collection Today ₹1,000 after seed/collect
- Frontend build **Pass**; finance pytest **10 passed / 2 failed** (gateway `NOT_CONFIGURED` / receipt stub — env, not FE)

### Still open
- Book Fee / Annual Budget / MFP + enterprise ops remain MOCK
- Gateway/WhatsApp remain stubbed or `NOT_CONFIGURED` until Razorpay/SMTP configured
- Dashboard chart widgets still mix some static demo copy alongside LIVE metrics
- Next role after ack: Principal (or Teacher)

---

## 18 November 2026 — HR role expansion checkpoint

**Status:** Local only. No commit/push.

### Done
- Phase A audit of HR sidebar/routes vs FastAPI `/hr/*` + leave-requests; tracker updated before coding
- Extended `hrApiService` with collection helpers + leave/payroll bundles; reuse `leaveApiService`
- LIVE wired: Leave Management, formal Received Leave (route shadow fixed for HR), Attendance, Documents, Jobs/Candidates/Interviews, Performance, Payroll Mark Paid, derived Reports
- Preserved Employees + Announcements LIVE; layout banner shows Live HR workspace
- Browser UAT as `hr@qmis.edu`: employees 6/6, leave live, received leave 2 records, attendance shows API-persisted Late, jobs live
- RBAC: teacher GET allowed via `hr.self`; teacher writes **403**; HR final-approved LR-0002
- Regression **76 passed**; build Pass; known admissions(3)/parent-TC(2) failures reconfirmed separately

### Still open
- Dashboard charts + enterprise Attendance workspace MOCK
- Onboarding/Training/Disciplinary/Exit and some payroll sub-tabs not fully remounted
- Next role after ack: Finance / Account Head

---

## 18 November 2026 — Admin ops checkpoint complete (admissions / leave / TC)

**Status:** Local only. No commit/push this slice.

### Done
- Diagnosed leave route shadow: `EnterpriseOperationsRoutes` overrode Admin `ReceivedLeaveRequests` with Attendance workspace — fixed (Admin routes first; skip enterprise leave stubs for `role=admin`)
- Wired/hardened LIVE: admissions enquiry+list (`admissionsApiService`), received leave (`leaveApiService`), TC list/decide (`tcApiService`)
- Browser UAT as `admin@qmis.edu`: `AE-0001`; live empty admissions list; leave queue (LR-0002 Admin step → hr); `TC-REQ-001` Approved
- Teacher RBAC 403 on admissions/tc/admin users/dashboard
- Regression: 49 passed (leave+auth+hr+admin users); build Pass; admissions/parent-tc pytest failures pre-existing backend
- Tracker updated; Admin ops checkpoint marked COMPLETE; next role = HR expansion after ack

### Still open
- Remaining Admin MOCK modules (attendance workspace, tasks, escalations, calendar, finance/ops, …)
- Pre-existing backend admissions/TC parent pytest AttributeErrors (out of FE scope)

---

## 18 November 2026 — Role-wise: Admin priority slice + push to new-UI_irul

**Status:** Frontend pushed to https://github.com/karan4533/new-UI_irul. Local backend only.

### Done
- Pushed ERP_QMIS (Super Admin LIVE baseline) to `new-UI_irul`, then started Admin
- Admin LIVE: dashboard KPIs, RBAC user list/create/status (deactivate only), student + employee directories (shared APIs)
- Roles page: permission matrix write **BLOCKED** in live mode (honest notice + disabled save)
- Browser UAT as `admin@qmis.edu`: KPIs 1/6, live users, students 1/1, employees 6/6, roles save blocked
- API create teacher `TEA-0001`; `test_admin_users` 32 passed; frontend build Pass
- Tracker updated: `docs/ROLE_WISE_UI_BACKEND_INTEGRATION_TRACKER.md`

### Still open
- Later SA remaining MOCK modules

---

## 18 November 2026 — Role-wise strategy: Super Admin priority slice

**Status:** Priority slice complete; pushed with Admin follow-on to GitHub `new-UI_irul`.

### Done
- Created `docs/ROLE_WISE_UI_BACKEND_INTEGRATION_TRACKER.md` with Super Admin full audit + API map
- Super Admin LIVE slice: dashboard KPIs, administrator accounts (list/create/status/reset), student directory, employee directory (shared `hrApiService`)
- Shared services: `adminUsersApiService`, `studentApiService`, `adminDashboardApiService`
- Browser UAT as `superadmin@qmis.edu`: live KPIs, ADM-0001 listed after create, students ADM-DEMO-001, 6 employees
- Regression: 44 passed (`test_admin_users`, auth static, `test_hr`); frontend production build Pass
- Remaining Super Admin modules left MOCK/BLOCKED per tracker (permission matrix write BLOCKED)

### Still open
- Later SA slices: escalations, tasks, leave, approvals, communication, calendar, notifications, gate, finance UI, audit logs

---

## 18 November 2026 — Phase 2: HR Employees LIVE

**Status:** Local only. No AWS deploy, no commit/push.

### Done
- Audited HR Employee Management UI vs other HR modules (only list + profile wired)
- Wired `hrApiService` into `EmployeesList` / `EmployeeProfile` (JWT `apiClient`, no silent localStorage fallback when live)
- Live list/detail/create; activate/deactivate via portal PUT; client search/filters
- Documented backend edit limit: existing portal PUT only persists department / role / reportingManager / status
- Browser UAT as `hr@qmis.edu`: created `EMP-0006` (UAT Hr Employee); detail/search/filter/status verified
- Tests: 46 passed (`test_hr`, `test_hr_modules`, `test_admin_employee_directory`, `test_frontend_auth_static`); frontend production build OK
- Tracker updated in `docs/UI_BACKEND_INTEGRATION_TRACKER.md`

### Still open
- Other HR modules (recruitment, payroll, leave UI, etc.) remain mock/localStorage
- No hard-delete employee endpoint
- Full field edit for existing employees needs a backend typed PATCH (do not invent)

---

## 18 November 2026 — Phase 2: Announcements LIVE + inventory

**Status:** Local only. No AWS deploy, no commit/push.

### Done
- Full module inventory in `docs/UI_BACKEND_INTEGRATION_TRACKER.md`
- Announcements LIVE: list, create (multipart), view, acknowledge, reply; no silent localStorage fallback on API failure
- `FileDropzone` `valueMode='file'` for real uploads
- Retargeted `tests/test_frontend_auth_static.py` to `ERP_QMIS/src` (9 passed)
- Browser UAT: list shows AN-0059; ack + reply persist after refresh

### Still open
- Next module: HR employees
- Library / tickets / CCTV / hostel / L&F / PRO still API NOT AVAILABLE
- One flaky attachment pytest query (wrong FileAsset by name only) remains

---

## 18 November 2026 — Local UI ↔ backend integration (ERP_QMIS)

**Status:** Local development only. No AWS deploy, no commit/push.

### Done
- Inspected ERP_QMIS UI (demo auth + localStorage) and existing `backend/` FastAPI (Heuristic-Labs/QMIS compatible)
- Reference shallow-clone at `c:\karan\QMIS-heuristic-ref` (not used to overwrite local backend)
- Local SQLite DB `backend/qmis_erp_local.db`, `.env` with `ENVIRONMENT=development`
- Wired live JWT login/logout/session refresh in ERP_QMIS (`VITE_USE_MOCK=false`)
- Fixed API client mock flag + Bearer token + FastAPI error parsing
- Partial announcements list from `GET /api/v1/announcements`
- Docs: `docs/LOCAL_DEVELOPMENT_SETUP.md`, `docs/LOCAL_UI_BACKEND_INTEGRATION_MAP.md`
- Browser verified: admin seed login → `/admin/dashboard`; bad password shows backend error

### Still open
- Most modules still localStorage/mock; map remaining AVAILABLE endpoints screen-by-screen
- CCTV / Hostel / Lost&Found / PRO dedicated APIs not found (blocked)

---

## 23 October 2026 — Leave and approval API wiring

**Status:** Fixed broken leave/approval screens that showed demo data or “not found”. Not full go-live.

### Done
- Coordinator received leave view now uses the shared API approve/reject page
- Director request approval detail loads live inbox items and can decide
- Joint Director / Assistant / Audit request approvals use `/approvals/inbox` + detail decide
- Confirmed leave create + principal received list on the API

### Still open
- Many other sidebar modules still demo/local-only (star ratings, some JD tasks/escalations, TM fuel, IT tickets)
- School email/WhatsApp/GPS not connected

---

## 23 October 2026 — Top-to-bottom completion re-check

**Status:** Re-audited current software. Not complete top-to-bottom. Updated plain-language doc + PDF. No commit/push/deploy.

### Done
- Confirmed canteen order save and bus wrong-vehicle safety are in the working copy
- Confirmed still open: IT tickets wrong save path, bus fuel local-only, IT asset success without save check
- School email / WhatsApp / GPS / payments still not connected
- Rewrote `QMIS_ERP_FINAL_PENDING_REQUIREMENTS.md` as an inch-by-inch Done / Not done checklist; regenerated PDF
- Targeted pytest: 19 passed

### Still open
- Developer fixes F1–F4; school day-1 decisions; outside accounts; final click checks

---

## 23 October 2026 — Final pending requirements audit

**Status:** Wrote `QMIS_ERP_FINAL_PENDING_REQUIREMENTS.md` from current code + reports. Not production-ready. No commit/push/deploy.

### Done
- Re-verified canteen order path and ProTrack no-first-device against current source (WT)
- Identified remaining code defects: IT tickets wrong storage key, TM fuel local key, IT AddAsset success without save check
- Separated work into CODE_FIX / BROWSER_TEST / CLIENT_INPUT / EXTERNAL_CONFIG / OPTIONAL / VERIFIED_READY
- Targeted pytest: 19 passed (remaining workflows, static readiness, protrack, integrations)

### Still open
- Client go-live scope and credentials decisions
- Code fixes C1–C3 before claiming IT/fuel/asset paths ready
- Browser matrix for PARTIAL modules

---

## 23 October 2026 — Canteen order browser verification

**Status:** Happy-path + controlled fail-save verified on localhost. Working tree left dirty; no commit/push/deploy.

### Done
- Created `ORD-73604359` (`BrowserOrder-Oct23-2210-unique`) as Canteen; API + UI confirmed
- Confirmed success modal only after save; refresh and re-login keep a single row
- Controlled write-block: error toast, no success modal, failed order not on API
- Recorded evidence in `QMIS_ERP_PRODUCTION_READINESS_REPORT.md` §6

### Still open
- ProTrack / SMTP / WhatsApp configuration from the school
- Other PARTIAL modules from the system audit

---

## 23 October 2026 — Production readiness fixes

**Status:** Canteen order save and ProTrack first-device fallback fixed in code. Live GPS/email/WhatsApp still off. Not committed/pushed in this pass.

### Done
- Canteen Add Order now persists to `/ops/canteen-orders` before the success modal
- Removed ProTrack silent first-device selection; demo map labelled not-live
- Documented SMTP / WhatsApp / ProTrack placeholders in `backend/.env.example`
- Wrote `QMIS_ERP_PRODUCTION_READINESS_REPORT.md`
- Pytest 464 passed; frontend build passed

### Still open
- Browser re-login for canteen order save (done later same day — see section above)
- ProTrack / SMTP / WhatsApp configuration from the school
- Other PARTIAL modules from the system audit

---

## 23 October 2026 — Complete system-wide audit

**Status:** Audit-only. Wrote `QMIS_ERP_COMPLETE_SYSTEM_AUDIT_REPORT.md`. No payment gateway, live tracking, or live messaging changes. Not pushed.

### Done
- Mapped all portal roles, `App.jsx` guards, mounted API routers, ops/campus-audit collections, and creatable Admin vs HR login paths
- Built a requirements traceability matrix with PASS / PARTIAL / FAIL / BLOCKED / NOT IMPLEMENTED / NOT TESTED
- Confirmed P0 issues: canteen orders success-without-save, ProTrack first-device fallback before live GPS
- Re-ran backend tests (460 passed) and frontend production build (passed)

### Still open
- Browser matrix not re-walked in this audit; remaining modules stay PARTIAL
- ProTrack and SMTP/WhatsApp still unconfigured
- Super Admin / Admin / Director / Principal full panels still NOT TESTED

---

## 23 October 2026 — ProTrack365 recheck

**Status:** Still not tested. `PROTRACK_ADMIN_*` and `PROTRACK_PARENT_*` are empty in `backend/.env` and in the shell. No provider login was attempted. No tracking code was changed.

---

## 23 October 2026 — ProTrack365 connectivity audit

**Status:** Not tested. The two client accounts are not in the backend environment. No provider call was made. Live tracking was not enabled.

### Done
- Compared the existing QMIS proxy with the official ProTrack365 Open API
- Confirmed `PROTRACK_ADMIN_*` and `PROTRACK_PARENT_*` are empty
- Wrote `PROTRACK365_API_VERIFICATION_REPORT.md` with status `NOT_TESTED_MISSING_CONFIGURATION`

### Still open
- Client must place both account passwords in `backend/.env` and confirm the device IMEI for `TN58BB3769`

No application code changed, so the backend suite was not re-run.

---

## 23 October 2026 — Gate pass reload, dropdowns, new logins

**Status:** The stale API was the gate 403. Dropdowns now use saved campus rows. New sign-ins kept the recent vehicle, route, duty, pencil, menu item, and projector. Not pushed.

### Done
- Reloaded the local API that had been started without auto-reload. Gate staff can read saved passes and still cannot change them
- Route and driver dropdowns list TN01BRW2222, Browser Driver, and Browser West Route
- Stationery user stays on the inventory address. An IT user who opens that address returns to the IT dashboard
- New sign-ins still showed the vehicle, route, duty, pencil, lemon rice, and projector

### Still open
- Canteen orders, stock issue click-through, expenses, student-transport save, tickets, audit, parent, student, driver duty screen, housekeeping
- Live email, WhatsApp, and bus tracking

---

## 23 October 2026 — Browser verification of remaining portals

**Status:** Transport, stores, canteen, IT, librarian, and gate were opened in the browser. No module is complete. Not pushed.

### Done
- Vehicle, route, and duty saves now persist. Browser saved TN01BRW2222, "Browser West Route", and a duty for TN01BRW1111; each survived refresh
- Stationery item "Browser graphite pencil" and canteen item "Browser lemon rice" survived refresh. A blank canteen name was rejected
- IT asset "Browser lab projector" survived refresh. An IT user was sent away from the stationery address
- Librarian sign-in still showed "Browser Atlas". Gate sign-in still showed "Browser Guest Oct23"
- Gate-pass list no longer shows the fixed sample pass. Gate staff can read saved passes in the automated test; the already-running API still returned 403

### Still open
- Maintenance, expenses, orders, tickets, and a second sign-in for the new saves
- Restart of the running API so the gate-pass page can read PRM passes
- Live email, WhatsApp, and bus tracking

---

## 23 October 2026 — Notifications and remaining screens

**Status:** Email and WhatsApp hooks are connected but not live. Housekeeping schedule save survived refresh. Driver duty page no longer crashes. No module marked complete. Not pushed.

### Done
- Enrollment, leave submit, leave decision, password-reset notice, announcements, and selected operational updates now call the existing notifier after the save
- Messages omit passwords, leave reasons, and audit evidence. WhatsApp is not sent from a phone number alone
- `.env.example` keeps SMTP and WhatsApp values empty. No Reply-To address was invented
- API mode no longer uploads sample rows into an empty collection
- Driver My Duty opened (it had been a blank page) and showed zero duties instead of the sample bus
- Housekeeping: "Browser corridor sweep" saved and was still listed after refresh (4 records)

### Still open
- Transport Manager, Stores, Canteen, and IT browser walks
- Fresh sign-in after the housekeeping, librarian, gate, and audit saves
- Live email and WhatsApp until the school supplies credentials
- Live bus tracking

---

## 23 October 2026 — More browser checks

**Status:** Gate visitor and audit assignment saved and survived refresh. Librarian add-book and driver vehicle screen failed. Other portals not opened. No code change.

### Done
- Gate: visitor "Browser Guest Oct23" saved and still listed after reload
- Audit: "Browser term audit" saved and still listed after reload
- Librarian Add Book opened a dead route and showed Librarian Dashboard
- Driver Vehicle Details showed sample bus TN 33 AB 1234 / Suresh Kumar, not the assigned vehicle

### Still open
- Re-login for gate and audit; Transport Manager, Stores, Canteen, IT, Housekeeping screens; live bus tracking

---

## 23 October 2026 — Browser check of parent fees

**Status:** Parent checkout was clicked in the browser. Other remaining portals were not opened. None marked complete.

### Done
- Parent signed in, paid the ₹500 browser installment, saw receipt REC-0003, and still saw it paid after refresh and a new login
- Student signed in and saw the same paid fee and zero outstanding
- Report updated. No code change, so the 455-pass suite and production build were not rerun

### Still open
- Browser walks for Librarian, Transport Manager, Driver, Gate, Stores, Canteen, IT, Housekeeping, and audit
- Live bus tracking until the school tracking service is configured

---

## 23 October 2026 — Close remaining workflow gaps

**Status:** Checkout waits for a ledger receipt. Driver vehicle scope, audit assignments, and vehicle health persist. Role saves verified by API. Not marked complete. Not pushed.

### Done
- Parent checkout shows success only after the server returns a receipt or transaction
- Driver login via HR; server hides and rejects other vehicles
- Audit assignment screens save owner, due date, and status
- Vehicle health saves to campus operations instead of sample rows in API mode
- Pytest **455 passed**; frontend production build passed

### Still open
- Browser click-through of parent checkout and each department screen
- Track Bus until the school tracking service is configured

---

## 23 October 2026 — Parent and student fee scope

**Status:** Family fee and route reads connected. Other remaining portals left PARTIAL where they already use campus collections. No module marked complete without a full browser pass.

### Done
- Parent and student load scoped fees; pay goes through the family payment action; they cannot read or write the campus ledger
- Bus route screen reads only that family's assignment
- Report: `REMAINING_MODULES_IMPLEMENTATION_REPORT.md`
- Pytest **452 passed**; frontend production build passed

### Still open
- Driver limited to an assigned vehicle; audit assignment save; browser parent checkout; provisioned logins for librarian, transport, gate, stores, canteen, IT, housekeeping, and auditors

---

## 23 October 2026 — Role workflow & connectivity documentation

**Status:** Client-facing role workflow documents generated (verification only; no app code changes).

### Done
- Produced `docs/QMIS_ERP_Role_Workflow_Document.docx` and `.pdf` — plain-language role workflows, module connections, diagrams, gaps/priorities
- Produced deep follow-on `docs/QMIS_ERP_Deep_Role_Workflow.docx` and `.pdf` — full A–H chapters per role (Super Admin especially detailed), cross-dept flows, security, P0–P2
- Produced shorter operational guide `docs/QMIS_ERP_Brief_InDepth_Workflow.docx` and `.pdf`
- Corrected module completion sheet: **432 Completed / 31 Partial / 15 Not Completed / 2 Gap** (was 480/480). Updated `erp complete documentation/QMIS-ERP-Role-Module-Status.docx` and `reports/QMIS-ERP-Role-Module-Status.docx`
- Confirmed shared login model; Transport Driver has workspace but no dedicated login page and no ready driver account
- Reconfirmed earlier login/roles audit artefacts remain in `docs/` for technical readers

### Still open
- Provision Transport Manager / Driver (and other Partial-role) accounts for go-live UAT
- Confirm Email/WhatsApp/gateway with school credentials before promising live delivery

---

## 21 October 2026 — Restore partner portal APIs onto ERP1

**Status:** Gaps from `main` / partner tip restored on `ERP1` and pushed to `origin/ERP1` only.

### Done
- Restored `GET /parents`, parent `/me/children` placement fields, `PUT /exams/{id}`, lesson-plan `/complete`
- Restored `Exam.academic_year` model field required by partner exam service
- Fixed teacher student-list test to create Grade 2 + class-teacher pin (seed has no classes)

### Still open
- Live provider verification; remaining localStorage PARTIAL portals
- `main` untouched (ERP1 only)

---

## 21 October 2026 — Final verification before commit

**Status:** Branch `fix/integrations-ready-no-creds` verified; commit/push left to manager.

### Done
- Re-ran full pytest (**451 passed**) and `npm run build` (**PASS**)
- Confirmed email/WhatsApp **NOT_CONFIGURED** / demo **MOCK_QUEUED** never report real delivery
- Razorpay mock coverage: intent, valid/invalid signatures, webhook verify, duplicate `already_paid`
- Fixed FE honesty gaps (receipt drawer, payment-link modal, payslip already honest)
- Optional student enroll password no longer crashes; webhook `liveVerified` false in demo
- Updated `ERP_COMPLETE_INTEGRATION_AUDIT.md` with verified results + live credential checklist

### Still open
- LIVE_VERIFIED pending school SMTP / WhatsApp / Razorpay sandbox keys
- Remaining localStorage portals (parent accounts, star ratings, etc.)

---

## 21 October 2026 — Integrations ready without credentials (P0/P1)

**Status:** Branch `fix/integrations-ready-no-creds`. Build + pytest green. No live provider calls.

### Done
- Fixed FE build (HrUi exports, academic years API helpers, HR password reset API)
- Email/WhatsApp/Razorpay: `NOT_CONFIGURED` / `MOCK_QUEUED` / webhook; templates; empty `.env.example` placeholders
- Admissions FE defaults to API when auth on; removed false “sent” payslip toasts
- Pytest **448 passed** (later verification: **451**); `npm run build` **PASS**
- Audit updated: `ERP_COMPLETE_INTEGRATION_AUDIT.md`

### Still open
- LIVE_VERIFIED pending school SMTP / WhatsApp / Razorpay sandbox keys
- Remaining localStorage portals (parent accounts, star ratings, etc.)

---

## 21 October 2026 — Complete integration audit (verification only)

**Status:** Read-only audit; no application code changes.

### Done
- Full integration audit written: `ERP_COMPLETE_INTEGRATION_AUDIT.md`
- Pytest re-run: **443 passed / 0 failed**
- Frontend build checked: **FAIL** (HR `HrUi` missing exports)
- WhatsApp / Email / Razorpay: code paths mapped; live delivery **not** claimed; Razorpay webhook **missing**

### Still open
- Awaiting authorization to fix P0 build + P1 sandbox integrations

---

## 21 October 2026 — ERP1 stabilize (HR 500, missing routes, pytest green)

**Status:** Fixes on branch `fix/erp1-stabilize` (from `ERP1` @ `3eb38fa`). Not pushed.

### Done
- Fixed `GET /api/v1/hr/employees` 500 (`EmployeeOut.email` rejected `.local` demo addresses)
- Restored ProTrack, placement, my-fees, academics/ops/campus-audit mounts from partner tip `9abaf75`
- Repaired demo-user seed so shared test SQLite cannot leave leave/lesson/principal logins broken
- Full pytest: **443 passed / 0 failed** (was 418 / 23)

### Still open
- Frontend `npm run build` still fails (HR `HrUi` missing `KeyFields` / `TextField` exports) — pre-existing
- Broad UI CRUD across ~480 sidebar modules not fully exercised
- Awaiting approval to commit/push/merge

### Report
- `C:\karan\ERP-verification-reports\ERP1-stabilize-fix-report-2026-10-21.md`

---

## 16 October 2026 — Fifty more modules (Coordinator / Principal / Director)

**Status:** Closed **61** open module rows (net **+58 Completed** on the sheet). TOTAL **307 / 6 / 165 / 2** of 480.

### Code
- Coordinator Dashboard live KPI cards; Exam → Teacher `ExamSchedule`; My Attendance → Director `mine` API
- Principal My Attendance → same `mine` API; Star Ratings share Director localStorage SoT (`addSomRating`)
- Seed HR links: `EMP-COO-001` / `EMP-PRI-001` (profile only, no invented punches)

### Status sheet
- New: `QMIS-ERP-Role-Module-Status.updated.16oct-fifty-modules.docx`
- Coordinator **29 / 0 / 0 / 1 Gap** · Principal **19 / 2 / 0** · Director **24 / 0 / 0**

---

## 16 October 2026 — Status sheet + Archify refresh (Account Head complete)

**Status:** Role-module Word sheet TOTAL corrected and synced; Archify project overview regenerated for Account Head **22/22**.

### Status sheet
- Latest: `QMIS-ERP-Role-Module-Status.updated.16oct-accounthead-complete.docx` (also synced to main `QMIS-ERP-Role-Module-Status.docx`)
- Account Head **22 / 0 / 0** · sheet TOTAL **249 Completed / 15 Partial / 214 Not Completed / 2 Gap**

### Archify
- Rebuilt `.archify/architecture-project-overview/` (Finance card + Live now / Still open cards)
- Showcase finalize **PASS** (validate / deliver / check / browser-check)
- Narrative: `backend/docs/ARCHITECTURE_OVERVIEW.md` dated 16 Oct

---

## 16 October 2026 — Account Head all remaining modules completed

**Status:** Finished the last Account Head Partial / Not Completed modules against the campus finance snapshot. Status sheet **22 / 0 / 0**.

### Shipped
- Snapshot collections: `chartOfAccounts`, `journalVouchers`, `bookFeeBreakup` (backend `STATE_COLLECTIONS` + FinanceContext persist)
- COA balances from posted GL; JV + recon persist on snapshot (recon empty → bank-book pending rows)
- Financial Statements Trial Balance / P&L / BS / Cash Flow derived from GL + books
- Reports Financial Overview + Income breakdown from posted transactions
- Book Fee editable `bookFeeBreakup`; MFP = Monthly Fee Performance from installments
- Status: `QMIS-ERP-Role-Module-Status.updated.16oct-accounthead-complete.docx`

### Status sheet
- Account Head → **22 Completed / 0 Partial / 0 Not Completed**

---

## 16 October 2026 — Account Head vouchers / budget / remaining honesty

**Status:** Payment Vouchers + Annual Budget treated as snapshot-complete; wallet spend/recharge summaries live; transport seed payroll hidden in API mode; Book Fee / MFP honesty banners.

### Shipped
- SpendingHistoryTab → WALLET OUT from finance snapshot (API mode)
- RechargeRecordsTab summaries from listed recharges
- StaffSalariesTab hides `PAYROLL_STAFF` seed when API on
- Maintenance/Compliance DEMO banners; Payment Vouchers + Reports banners; Book Fee / MFP labels
- Annual Budget subtitle cites finance snapshot

### Status sheet
- Account Head → **15 / 6 / 1** (MFP still Not Completed)

---

## 16 October 2026 — Account Head snapshot honesty (Collections / Books / Wallet / Transport)

**Status:** When Finance API is on, Money In/Out and Accounting books no longer merge static demo registers. Shared `FinanceSnapshotBanner` on Collections / Wallet / Transport / Accounting.

### Shipped
- `FinanceSnapshotBanner.jsx`
- Accounting Day/Cash/Bank/Online/GL → snapshot-only in API mode
- Collections Money In/Out → live summary + no seed concat/fallback in API mode
- Wallet register summaries from listed wallets; Transport fuel claims no seed fallback in API mode
- Status sheet Account Head → **13 / 8 / 1** (MFP still Not Completed)

### Still PARTIAL
- COA / JV / recon / FS; wallet spending/methods; transport maintenance/compliance/payroll; timeline/charts; MFP Not Completed

---

## 16 October 2026 — Status sheet + Star Ratings SoT + AH Approvals summary

**Status:** Role-module status workbook updated for Director/Account Head; Star Ratings persist locally; Approvals KPI strip uses finance snapshot.

### Status file
- New: `erp complete documentation/QMIS-ERP-Role-Module-Status.updated.16oct-director-accounthead.docx`
- Director **9 / 7 / 8** · Account Head **5 / 16 / 1** (MFP still Not Completed)
- Mapping doc updated (`MODULE_DOMAIN_MAPPING.md`)

### Code
- Director Star Ratings → `localStorage` SoT (`director-staff-star-ratings`); Add Rating saves
- Account Head Approvals summary cards → live pending/approved/rejected counts from finance `approvals`

---

## 16 October 2026 — Director My Attendance identity link

**Status:** Demo seed links `director@qmis.edu` → `HrEmployee` `EMP-DIR-001` (profile only). My Attendance shows **linked_empty**, not unlinked. No fabricated punches.

### Shipped
- `seed._ensure_demo_staff_hr_links` (idempotent on startup when demo accounts on)
- Protect director seed email from HR role/active sync overwrite
- Tests updated: portal contains director email / `EMP-DIR-001`; mine scoped to that id only

### Browser / API
- `GET /hr/portal/employees` includes Campus Director / `EMP-DIR-001`
- My Attendance UI: “Linked employee: EMP-DIR-001” · **0** punch rows

### Still open (Director)
- Star Ratings still DEMO ONLY (needs `staff_ratings` API)
- Real punches only when HR records attendance for `EMP-DIR-001`

---

## 16 October 2026 — Director Home Fun → Teacher SoT

**Status:** Director Student/Teacher LMS now reuse Teacher `HomeFun` localStorage SoT (Principal pattern). Suite **426 passed** / build **PASS**.

### Shipped
- `Director/LMS/*` thin wrappers around Teacher `HomeFun` / `AddHomeFun` / `ViewHomeFun`
- Routes: `/director/lms/{student,teacher}-lms` + `/add` + `/view/:id` (legacy `view-*-lms` kept)
- `MODULE_DOMAIN_MAPPING.md` updated: Home Fun = shared FE SoT (no deliverables REST yet)

### Browser
- Empty state shows real Home Fun empty UI (not old static mock)
- Seeded `teacher-home-fun-deliverables` → Director Teacher + Student LMS both show **1** shared entry

### Still open (Director)
- Star Ratings still DEMO ONLY (needs `staff_ratings` API)
- My Attendance empty until `director@qmis.edu` linked to an `HrEmployee`

---

## 16 October 2026 — Account Head fee ledger bootstrap + collect demo

**Status:** Campus fee demand seeded for demo; browser collect → receipt → live dashboard KPI verified. Suite **426 passed**.

### Shipped
- `financeBootstrap.js` + `bootstrapDemoFeeLedger` in FinanceContext; Settings → **Bootstrap campus fee ledger**
- Builds UNPAID tuition installments from enrolled students’ classes (does not invent paid collections)
- Seeds up to 3 pending finance approvals when campus approvals were empty
- Fixed Fee Collection modal: `await` async `collectFeePayment` (API path was racing and toasting failure)

### Browser evidence (Account Head)
- Bootstrap: **17 students** → **20 installments**
- Fee Collection: Aarav · Oct tuition → cash collect **₹2,010** → receipt **REC-0003**
- Dashboard KPIs (snapshot): Today’s Collection **₹2,010**, Pending Requests **3**, Live Fee Receipts **1**, Overdue Fee **₹49,390**, Collection Efficiency **3.9%**
- Approvals list: **3 pending** (summary cards above the table still use illustrative demo totals)

### Still PARTIAL
- Charts / Approvals summary strip / Wallet / Transport / Reports / Book Fee / MFP remain illustrative or placeholder where previously noted

---

## 16 October 2026 — Account Head complete functional audit

**Status:** End-to-end Account Head audit against live finance API. Suite **426 passed** / build **PASS**. One demo-blocking KPI defect fixed.

### Verified
- Auth + finance permissions; Teacher blocked from finance; AH blocked from `/admin/users` and `/hr/attendance`
- `GET /finance/state` hydrates and refreshes; campus has **17 students**, **0** fee installments/receipts/approvals
- Collect-payment with temporary student/installment persisted (receipt id returned + present on re-GET); temp cleaned
- Dashboard KPIs now use **only** finance snapshot metrics (no seed ₹2,45,000 mix); Refresh reloads API; recent collections = live receipts only

### Still PARTIAL / demo
- Charts on dashboard still illustrative (labeled)
- Wallet, Transport, Reports, Book Fee, MFP largely mock/placeholder
- Empty fee ledger limits browser fee-collection demo until installments exist

### Fix shipped
- `Dashboard.jsx` + `FinanceContext` dashboardMetrics (`todaysExpenses`, pending/refund approval counts)

---

## 16 October 2026 — Director identity + Star Ratings / Home Fun architecture

**Status:** Attendance identity mapping confirmed; Star Ratings / Home Fun remain demo-only with documented recommendations. No fabricated attendance. Suite **426 passed** / build **PASS**.

### 1. Director ↔ HrEmployee identity
- Correct relationship: `User` (auth) links to `HrEmployee` via **`user_id` FK** (preferred) or **matching email** (`_own_employee` in `hr.py`)
- Seed creates login Users only (`director@qmis.edu`, etc.) — **no** matching `HrEmployee` rows in the demo DB
- `GET /hr/attendance/mine` correctly returns `[]` for Director (self-only; peers not exposed)
- UI now diagnoses **unlinked** vs **linked_empty** using portal email match + mine results — still never loads campus-wide attendance into this screen
- **Not done (by design):** inventing Director employee or punch rows

### 2. Star Ratings — recommendation
- Requirements (from UI): staff SOM (1–3 stars for teacher/coordinator by month) + SOY average across months; Director can add ratings
- Existing: FE mocks only; Student Star Ratings is a **separate** localStorage domain; `/hr/performance` is annual HR BSC reviews — wrong shape
- **Recommend new domain** `staff_ratings` (API + table) after architecture review — do not duplicate HR performance or student SOM

### 3. Home Fun — recommendation
- Intended workflow: Teacher/Coordinator assign Assignment/Homework → students submit → Director/Principal oversee
- Existing: Teacher Home Fun = `localStorage`; Principal wraps that SoT; Director LMS = **independent static mocks**; no deliverables REST (catalog key only)
- **Recommend:** short-term reuse Teacher Home Fun SoT (Principal pattern); long-term design a **deliverables** API — no new tables until that design lands

### 4. Demo-only markers
- Star Ratings + Home Fun banners now say **DEMO ONLY / not live** (amber)

---

## 16 October 2026 — Director finish + pytest green

**Status:** Three prior “demo-chip” failures resolved by aligning outdated static guards with confirmed product intent; Director My Attendance live; Star Ratings / Home Fun remain blocked (no backend).

### Pytest / auth static guards
- Confirmed failures were **outdated tests**, not auth defects: SignIn `DEMO_TEST_LOGINS` is fill-only (must still press Login); Super Admin attendance intentionally shares Admin read-only SoT
- Updated `test_frontend_auth_static.py` and `test_frontend_admin_attendance_static.py` accordingly — still forbid seeded passwords outside SignIn, still forbid auto-login / write paths
- Full suite: **425 passed**, 0 failed

### Director screens
- **My Attendance** → `GET /hr/attendance/mine` (new endpoint; server returns only linked employee; Director has no HrEmployee link → verified empty, no peer leak); UI loading/empty/error
- **Star Ratings** → **BLOCKER**: no star-ratings model/API; kept mock + demo banner
- **Home Fun (Student/Teacher LMS)** → **BLOCKER**: Teacher/Coordinator Home Fun is local-only; no deliverables API; kept mock + demo banner
- Approvals regression (API): Teacher blocked (403), Director approve/deny persist, deny requires reason, duplicate decide blocked, inbox updates

### Still open
- Account Head static KPI chrome / write CRUD re-audit
- Link Director login to an HrEmployee (HR) so My Attendance can show real punches
- Build Star Ratings + Home Fun backend before removing mocks

---

## 16 October 2026 — Director + Account Head panel work

**Status:** Moved next focus to Director and Account Head per role-module status sheet.

### Account Head
- Fixed FinanceProvider hydrate: it used to pull `/finance/state` before sign-in, stick on error, and require a reload
- Now hydrates only when authenticated + finance role (accounthead/admin/superadmin); resets on logout
- Verified: Account Head dashboard loads finance on first navigation (no “load failed” banner)

### Director
- Notifications wired to `GET /notifications` (same pattern as Admin/SA)
- Lesson Plan Approval hydrates from `GET /lesson-plans` (campus list, not mine-only)
- Students/Employees/Activities/Calendar/Announcements already on shared Common/API paths
- **Mark Entry Approval** → live marks-batches list + decide via `/approvals/{id}/decide`
- **Exam Timetable Approvals** → live `listExams` + approve/deny through approvals API
- **Request Approvals** → live `GET /approvals/inbox` with Approve/Reject; verified Director approved a pending PRM leave (inbox 1 → 0)
- Added `src/services/approvalsApi.js` for inbox/mine/decide helpers

### Still open on these panels (superseded by section above)
- See “16 October 2026 — Director finish + pytest green”
- Account Head: Dashboard still mixes some static KPI chrome; write-path browser CRUD not re-audited this pass

---

## 16 October 2026 — Seven-role demo verification audit

**Status:** All seven SignIn demo roles verified; 199 sidebar leaf pages render; Teacher Mark Entry blank screen fixed.

### Done
- Chip credentials matched backend seed config (7/7)
- API + UI login / invalid password / session refresh / logout checked per role
- Playwright crawl of every sidebar leaf (199) → all PASS after fix
- RBAC matrix for admin users / finance / HR endpoints recorded
- Live vs mock classification for Finance / Audit / Transport / Star Ratings / Activity Logs
- Deliverables: `reports/seven-role-demo-audit.md`, `reports/seven-role-module-matrix.csv`
- **Fix:** Mark Entry ExportModal referenced undefined `students` (blank Teacher page)

### Open
- Soft RBAC: Teacher/PRM/Principal can GET some `/hr/*` reads (writes correctly 403)
- Three intentional static pytest failures (demo chips + SA attendance API wiring)
- Mock shells remain for SA Audit / Transport / Activity Logs / most Finance tabs

---

## 16 October 2026 — Super Admin notification connection

**Status:** Super Admin inbox is live on `GET /notifications`; activity create notifies `role_code=superadmin`.

### Verified
- Backend was restarted (port 8000); SA page shows **Connected to the school notification API**
- Header bell badge **2**; dropdown lists the same rows + **View all**
- Admin created cultural activity `ACT-CUL-005` → SA inbox got **Activity approval needed: Notify SA Connection Test**
- Activity decide still notifies the submitter on Approve/Reject

---

## 16 October 2026 — Super Admin interlinked school SoT

**Status:** Super Admin modules share the same backend / Front Office / HR data as the rest of the ERP (not isolated mocks).

### Live / shared sources
- **Students / Employees / Attendance** → enrolled students API + HR directory + attendance API
- **Gate Pass** → Front Office student/hostel/material collections (hydrate on open; **5** FO rows in browser)
- **Notifications** → `GET /notifications` (same map as Admin)
- **User Creation** → `/admin/users` list + create (same admin accounts as RBAC / Employee Directory)
- **Dashboard KPIs** → live Total Students / Total Employees / Pending Approvals from those sources
- **Leave / Activities / Approvals / Calendar / Announcements / Escalations / Tasks** → already on Common + API hydrate paths

### Still demo / not full SoT
- Finance overview section cards, Audit report section lists, Transport overview, Star Ratings teacher mock rows, Activity Logs seed tables

---

## 16 October 2026 — Super Admin backend data flow (students / employees / attendance)

**Status:** Super Admin User Database + Attendance now use the **same API SoT as Admin** (no separate mock lists).

### Wired to backend
- **Students List / View** → `hydrateEnrolledStudentsFromApi` / `GET /students` (verified **17** enrolled in browser)
- **Employee List / View** → `useEmployeeDirectory` / HR portal + User Creation merge (verified **21** in browser)
- **Student & Employee Attendance** → `adminAttendanceApi` + `useAttendanceQuery` (verified student attendance rows for today)

### Still separate / demo shells (updated later same day — see interlinked SoT section)
- Finance / Audit / some overview cards remain demo datasets

---

## 16 October 2026 — Super Admin inch-by-inch re-audit

**Status:** Full Super Admin route crawl (48 screens) after blank-page fix; approval flows verified; title/export/sidebar fixes applied.

### Crawl result
- **48/48** list/overview routes rendered (no blank root, no module-load crash).
- Earlier blank Super Admin panel: missing `createCalendarEventViaApi` export — **restored**.
- Approvals: list shows Pending rows; **Approve/Reject** on detail (`/approvals/view/:id`) — verified.
- Activities Cultural: **Approve/Reject** in row menu for Pending — verified.
- Leave: Super Admin is configured as approver; decision on leave detail page.
- Announcement: Super Admin is **view/export only** (no Create — not in creator roles); `/announcement/add` redirects to list by design.

### Fixes from this pass
- Unique Super Admin sidebar link ids (removed duplicate `id: 19`).
- Header titles for Activities, My Tasks, Demo Activity, Re-entry, Module Health.
- ExportModal wired with real filtered rows on Approvals, Gate Pass, Attendance, User DB, User Creation, Activity Logs, Star Ratings.

### Still PARTIAL (demo shells / intentional)
- Date filters on some lists do not narrow rows (UI present).
- Re-entry / Module Health / Demo Activity remain lightweight demo screens.
- Export on shared Announcement list still empty-rows until that common view is wired.

---

## 16 October 2026 — Super Admin seed + browser module audit

**Status:** Seeded `superadmin@qmis.edu` / `superadmin123`; Super Admin **Activities** (cultural/sports/competitions) with Approve/Reject; browser crawl of **43** sidebar leaf routes.

### Super Admin module results (browser)

| Module group | Result | Notes |
|---|---|---|
| Dashboard | **PASS** | Loads |
| Attendance (students/employees) | **PASS** | Lists + Export present |
| User Database / User Creation | **PASS** | Lists + Export |
| Gate Pass / Transport Overview | **PASS** | Lists load |
| Finance (7 screens) | **PASS** | Overview + fees/collections/wallets/transport/accounting/reports load (no crash) |
| Audit Reports (6 screens) | **PASS** | Overview + section lists load |
| Star Ratings / Tasks / Leave / Approvals | **PASS** | Lists + Export where present |
| Activities (cultural/sports/competitions) | **PASS** | Pending filter + **Approve** action verified in browser/API |
| Announcement / Communication / Calendar / Notifications / Escalation | **PASS** | Routes load |
| Activity Logs (6) / Re-entry / Module Health | **PARTIAL** | Pages load; some breadcrumbs show generic “School ERP”; demo/log screens are UI shells |
| Console | **PARTIAL** | React duplicate-key warnings on some navigations; no crash banners |

Login also shown on `/signin` Demo test logins.

---

## 16 October 2026 — Browser-level five-role audit (from `e8623e3`)

**Status:** Browser sidebar crawl + export wiring for five demo roles; pytest **421 passed**; `npm run build` **PASS**. Baseline was `e8623e3` on `main`.

### Role / module results (browser)

| Role | Result | What was actually tested |
|---|---|---|
| HR | **PASS** | All **36** sidebar leaf routes loaded with expected titles; Employees Export CSV (20 rows); attendance status Present after refresh; notifications/announcements reachable |
| Administrator | **PASS** | **25** sidebar routes crawled (no crash banners); employee/student DB, docs, admissions, leave, tasks, escalations, communication, calendar, competitions |
| Teacher | **PARTIAL** | **30** sidebar routes crawled; Class Attendance Export CSV verified earlier; hard-nav Unit Tests OK; several academic modules still localStorage SoT |
| PRM (Front Office) | **PASS** | All **21** sidebar routes crawled with expected titles (admissions, gate passes, TC, tasks, leave, student/teacher DB) |
| Principal | **PASS** | All **21** sidebar routes crawled (timetables, allocation, LMS, star ratings, student allocation approval, directories) |
| Super Admin | **PASS** (see section above) | **43** routes crawled after seed login; activity Approve verified |

### Exports

- Wired remaining five-role `ExportModal` usages to real `rows` (list vars or static `EXPORT_ROWS` from visible table demo data).
- Verified live: HR employees CSV; Teacher class-attendance CSV.
- Non–five-role roles (Account Head, auditors, etc.) still have many bare ExportModals — **NOT RUN** / out of scope this pass.

### Teacher / Principal localStorage vs backend need

| Area | Storage today | Needs real backend? |
|---|---|---|
| Teacher exam schedule / enter marks / result summary | localStorage | **Yes** — `examsApi` / `resultsApi` exist; multi-user SoT should move off browser |
| Teacher unit tests, Q-bank, home-fun, study materials, sample questions, student transfer | localStorage | **Yes** for shared campus use; OK as demo-only until APIs exist |
| Teacher notifications file still has LS helpers | mixed | Prefer `notificationsApi` (already used elsewhere) |
| Principal class / exam timetable + teacher allocation | localStorage | **Yes** — shared scheduling must not stay device-local |

### Onboarding / password delivery

- Staff create returns `temporaryPassword` to HR UI only; comms row status `DEMO_SENT` (no real SMTP). Credentials not logged in audit output.

### Console / RBAC

- No crash banners on crawled routes after export fix.
- Principal TC list remains **403** (expected RBAC).

### Still open

- Interactive deep controls on every page (every Approve/Edit/Delete) not exhaustively clicked — reported as route-level crawl + targeted mutations.
- Roles outside the five demo personas: export gaps remain.

---

## 16 October 2026 — Five-role functional audit (HR → Admin → Teacher → PRM → Principal)

**Status:** Live API audit across five roles completed; pytest **421 passed**; production build **PASS**. Intended fixes already on `main` at `d4bd49c` (message was generic — follow-up cleans audit junk + reports). SMTP / WhatsApp still local-queue only.

### Audit summary (API smoke, not every browser click)

| Role | Result | Notes |
|---|---|---|
| HR | **PASS** | Employees, docs verify, jobs/candidates/leave/payroll/attendance/training/performance/claims; staff create provisions login |
| Administrator | **PASS** | Dashboard, students, announcements, calendar, tasks, leave, TC, notifications, escalations, communication; enquiries at `/admissions/enquiries` |
| Teacher | **PASS** | Students, tasks, leave, announcements, exams, notifications; FO correctly **403** |
| PRM / Front Office | **PASS** | All six FO collections list; create+delete audit gate pass; TC list |
| Principal | **PASS** | Campus employee directory (19), students, announcements, calendar, leave, exams; HR write **403**; TC list **403** (no Principal TC menu — correct RBAC) |

### Bugs fixed earlier today (included in `d4bd49c`)

1. Leave/TC UI sync (busy, toast, mapped API response).
2. Export modal no-op → real CSV/Excel/PDF via `exportDownload.js` on demo-critical lists.
3. Message send now creates recipient notification; inbox poll every 20s.
4. HR Add Employee: DatePicker joining date + clear designation; docs **Verify** action.
5. Demo seed script + principal/teacher portal permission tests.

### Remaining limitations

- Not every secondary Export button across 100+ screens is wired.
- Some Teacher/Principal academic screens remain portal/localStorage **PARTIAL**.
- Full browser tour of every sidebar control: superseded by later browser crawl section above.
- Real email of temporary passwords: still demo `DEMO_SENT` (HR must share password from toast).

---

## 16 October 2026 — UI sync, export/download, demo sample data

**Status:** Mutation UI sync hardened for leave/TC; Export/Download wired for demo-critical lists; idempotent DEV-only demo seed added. Landed in commit `d4bd49c`. SMTP / WhatsApp still local-queue only.

### Done

1. **UI sync:** Leave approve/reject returns mapped API row + busy lock + no false success toast; Admin/PRM TC decide uses toast + `finally` busy clear; task status modal already blocked double-submit + hydrates list.
2. **Export:** Shared `src/Common/exportDownload.js` (CSV UTF-8 BOM, Excel-compatible `.xls`, print PDF). `ExportModal` runs real export from `rows`/`filename` (or `onExport`). Wired on leave, attendance, FO gate/material/goods/transfer/re-enroll/TC, students/employees, tasks, announcements, escalations, exam timetable, HR `HrExport`.
3. **Demo seed:** `backend/scripts/demo_seed_evening.py` — development + local DB only; idempotent `DEMO-*` / `[DEMO]` markers (students, enquiries, attendance, FO, TC, announcement, calendar, tasks, escalation, HR leave/job). Re-run verified.
4. **Regression:** pytest **421 passed**; `npm run build` **PASS**; live API smoke for students/FO/tasks/TC **PASS**.

### Still open / limitations

- Many secondary Export buttons still toast “No records” until `rows` are passed (not all 100+ screens wired).
- Browser click-through for attendance mark + leave/TC after this patch: manual for the manager demo.
- Principal/Teacher my-attendance & some academic screens remain portal/localStorage PARTIAL.
- Integrations: SMTP, WhatsApp, RFID = later.

### Startup / demo prep

```text
# Backend
cd backend
# ensure ENVIRONMENT=development in .env
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
python scripts/demo_seed_evening.py

# Frontend
cd ..
npm run dev
```

Demo logins use existing development seed emails (passwords only in local `.env` / seed config — not repeated here).

---

## 16 October 2026 — Evening demo pack (Admin, PRM, Principal, Teacher, HR)

**Status:** Five demo roles API-ready for tonight. SMTP / WhatsApp **not** connected (local queue only). Diffs still uncommitted.

### Done

1. Confirmed live data for Admin, PRM, Principal, Teacher, HR (employees 17, FO, students 12, HR recruitment/leave/payroll populated).
2. HR polish: Offer + Appointment sidebar links; claims employee select + sample claims; payslip “Queue local notice” (no SMTP claim); empty-campus seed upload restored from `hrSeed`.
3. Teacher My Attendance date filters default open so demo rows stay visible.
4. Five-role API smoke **PASS**; `npm run build` **PASS**.

### Demo notes / still PARTIAL (honest)

- Principal: star ratings, class timetable, teacher allocation, my attendance = UI/portal only.
- Teacher: biometric, analytics, my profile, parents, deliverables/stars = demo/localStorage.
- Integrations: SMTP, WhatsApp, RFID punch import = later.

---

## 16 October 2026 — Principal + Teacher panel completion

**Status:** Principal and Teacher panels audited and hardened. Confirmed gaps fixed; portal/localStorage modules left as PARTIAL (no invented APIs). **Not pushed** pending approval.

### Done

1. Audit: every Principal/Teacher sidebar item classified API vs localStorage vs DemoScreens.
2. Backend: Principal/Director `hr.employees.read`; campus employee directory via `/hr/portal/employees` (Principal now sees 17; still no `hr.write` / `users.write`).
3. FE: Principal + Teacher live dashboards (composed from existing APIs); Teacher Exam → `ExamSchedule` (`/exams`); Employee view hydrates from directory API; Teacher sidebar permission map aligned to real link ids.
4. Tests: `test_principal_portal_apis` + `test_teacher_portal_apis` + FO suite **14 passed**; `npm run build` **PASS**.
5. Browser: Principal login → dashboard (12/17) → employee DB (17) → student DB (12) → exam timetable; Teacher login → dashboard → Exam Schedule API page → class attendance screen.

### Open / limitations

- Star ratings, class timetable, teacher/student allocation, extra/online class, home fun, deliverables, biometric, analytics, my profile/attendance, parents list remain portal/static (no new REST invented).
- Teacher `GET /students` is campus-wide until a server-side assignment domain exists.
- Diff uncommitted; push only after review.

---

## 16 October 2026 — Full demo readiness (Admin + PRM E2E)

**Status:** **READY WITH LIMITATIONS** — critical Admin and PRM flows verified live against PostgreSQL; no demo-blocking code fixes required; no push.

### Done

1. Stack health: Postgres `:5432`, Alembic **0012** head, ORM/DB **48/48**, FastAPI `/health` ok (183 OpenAPI paths), Vite on `http://localhost:5173` (IPv6/`localhost` only — not `127.0.0.1:5173`).
2. Auth/RBAC: Admin/PRM/Principal/Teacher login **200**; bad password **401**; unauth **401**; Teacher FO + `/admin/users` **403**; Principal FO list **200** / create **403**.
3. Admin API (correct contracts): dashboard, admissions/enquiries, students, HR employees, masters/classes, attendance(`?date=`), documents kinds, TC, activities, leave, escalations, tasks, notifications, announcements, calendar, communication directory/conversations — **PASS**.
4. Admin browser walkthrough: login → dashboard live counts → admissions (12) → student/employee DB → class details → student/employee attendance → announcements (4) → calendar → notifications → tasks → leave → escalations → documents → TC approval → RBAC → communication inbox.
5. PRM: six FO collections CRUD+cleanup **PASS**; browser Material list showed `DemoDriverReady`/`TN-DEMO-16`; Transfer list showed `Demo Transfer Ready` (ephemeral records deleted after).
6. `pytest` FO + security **63 passed**; `npm run build` **PASS**. Lint debt **not** re-run / not claimed fixed.

### Open / limitations for demo

- Open UI as **`http://localhost:5173`** (not `127.0.0.1:5173`).
- Transfer/list date filters can hide older rows until Clear Filters.
- Documents/tasks/leave/escalations lists may be empty (API OK, little seed data).
- Account deactivation + session expiry **NOT RUN**.
- Full pytest suite / full lint **NOT RUN** this pass.

---

## 16 October 2026 — PRM Front Office regression + hardening

**Status:** PRM FO API regression **PASS** (6/6 collections). FE hydrate gaps fixed for Material / Goods / Re-enrollment lists. Director gap analysis ready; push completed later as `524099b`.

### Done

1. Live API CRUD + DB checks for all six `front_office_records` collections (marker-tagged creates, cleaned up).
2. RBAC: Admin/PRM write; Principal read-only (matrix aligned); Teacher 403; unauth 401; unknown collection 404.
3. Hardening: PRM demo seed (`prm@qmis.edu`); `frontoffice.read` for principal/director; pytest FO suite **11 passed**.
4. Browser (PRM login): Admission Enquiry API data; Material Gate Pass list shows API rows after hydrate fix; Student Transfer list shows API rows (after Clear Filters).
5. Director readiness: Word **24 / 3 Completed / 3 Partial / 18 Gap**; first task = Exam Timetable Approvals wiring.

### Open / next

- Confirm + commit/push PRM hardening diffs when approved.
- Director Exam Timetable Approvals (shared `/exams` + `/approvals`).

---

## 15 October 2026 — Final verification (post-70e5cb9)

**Status:** Live DB + Admin browser verification completed. **READY WITH LIMITATIONS** — no critical blockers for next work.

### Done

1. PostgreSQL connect **PASS**; Alembic **0012** current=head; **48/48** model tables match DB.
2. Admin API: login, students/admissions/announcements/calendar/notifications/users **200**; FO material-gate-pass create/get/update; announcement multipart create+retrieve; calendar POST; teacher RBAC denials **403**; unauth **401**.
3. Browser Admin: sign-in → admissions list, announcements (shows persisted verify row), calendar (Add Event), user database — no console errors on sampled paths.
4. `npm run build` **PASS** (chunk-size warnings). `npm run lint` **FAIL** (pre-existing hook/refresh rules; not treated as ship blocker).
5. Docs mismatch noted: main Word file locked at Principal **3/3/15**; updated/review copies **16/5**. `system_audit_logs` unmounted backlog (PARTIAL).

### Open / next

- Close Word lock and sync main status SoT to Principal **16/5**.
- Implementation: PRM is already **21/21** — use regression plan below, or start **Director**.
- No further git push from this verification (await branch/diff confirmation).

---

## 15 October 2026 — Safe structure cleanup + architecture audit

**Status:** Read-only audit completed; only conclusive junk removed. Monorepo layout preserved (no frontend/backend folder split).

### Done

1. Audited Git `main` @ prior Principal commit; remotes `origin` = GitHub `karan4533/ERP-dev`.
2. Removed tracked junk: `.vscode/tasks.json` (folderOpen task running a font binary via `node`), `QMIS-ERP-Role-Module-Status.docx.tmp`.
3. Stopped tracking `cred.txt` and lock-workaround `*.unlocked.docx`; extended `.gitignore` (cred, unlocked/tmp Word, reports markdown exceptions).
4. Documented final layout + Principal **16/5** in `ARCHITECTURE_OVERVIEW.md`, `MODULE_DOMAIN_MAPPING.md`, `DATABASE_ARCHITECTURE_RULES.md`.
5. Left historical Word status snapshots, client-review xlsx, reference PDFs, Alembic `0001`–`0012`, and all app source untouched.

### Open / next

- Optional later: prune duplicate client-review xlsx / historical status docx with explicit manager approval.
- Director panel / Principal Partials.

---

## 15 October 2026 — Principal panel build (3/3/15 → 16/5/0)

**Status:** Principal built from browser-verified baseline **Completed 3 · Partial 3 · Not Completed 15** to **Completed 16 · Partial 5 · Not Completed 0**.

### Done

1. Student Database: list filters (search / status / DOB) + status on list rows; still hydrates `GET /students`.
2. Calendar: `create/update/delete` in `calendarApi.js`; Principal Add Event when `calendar.write` + API on.
3. Home Fun: Student/Teacher LMS pages wrap Teacher `HomeFun` SoT (+ add/view routes).
4. Extended Class: principal list/add/view paths (no longer hard-linked to `/teacher/...`).
5. My Attendance: working client filters on demo staff rows.
6. Portal API test expanded (exams write, calendar POST, leave boxes, HR employees); Word status updated.
7. Remaining Partial (no dedicated REST yet): Star Ratings SOM/SOY, Class Timetable, Teacher Allocation, My Attendance.

### Open / next

- Close Principal Partials (ratings / class timetable / teacher allocation / staff attendance APIs) or start Director panel.

---

## 15 October 2026 — Archify 3.1 single overview + daily PDF

**Status:** Archify upgraded to **3.1.0**; one current overview HTML; manager PDF regenerated from markdown SoT.

### Done

1. Installed Archify **3.1.0** (doctor ready; types include erd, tree, class, timeline, waterfall).
2. Rebuilt single SoT diagram: `.archify/architecture-project-overview/qmis-erp-overview.html` (request path + 3.1 toolkit cards).
3. Retired separate sequence HTML as a second “current” file; specialized types remain available for later slices.
4. Regenerated manager PDF: `erp complete documentation/QMIS-ERP-Daily-Work-Report.pdf` from `reports/daily-work-report.md`.
5. Earlier today: Medium UX/bundle fixes, full pytest **416 passed**.

### Open / next

- Director panel.

---

## 15 October 2026 — Archify refresh + full pytest

**Status:** Architecture overview regenerated (later consolidated to single file under Archify 3.1); suite **416 passed**.

### Done

1. Rebuilt project overview for Principal 21/21 and Medium fixes.
2. Temporary sequence diagram produced, then superseded by single-overview policy.
3. Showcase finalize **PASS**; pytest **416 passed**.

### Open / next

- Director panel.

---

## 15 October 2026 — Medium audit items (attendance, marks, bundle)

**Status:** All three Medium stability items closed before Director panel.

### Done

1. Class Attendance: section filter, Present/Absent editors, mark-all, Save → `POST /attendance` (fixed double JSON stringify).
2. Mark Entry: campus exam dropdown, students from `/students`, draft/submit via `/marks-batches` (+ entries/submit helpers).
3. Bundle: lazy role layouts in `App.jsx` + vendor chunks; production entry JS ~354 kB (build PASS).
4. Regression: attendance/exams/teacher portal pytest **13 passed**.

### Open / next

- Director panel.

---

## 15 October 2026 — Principal panel 21/21 Completed

**Status:** Principal sidebar shared APIs + portal screens marked Completed (Teacher/Coordinator parity; no biometric Gap).

### Done

1. Notifications hydrate GET `/notifications` (Teacher pattern).
2. Examination Timetable: list from GET `/exams`; create POST `/exams` + submit for Director approval.
3. Word Principal **21 Completed**; TOTAL **267 / 27 / 184 / 2**.
4. Pytest `test_principal_portal_apis` **1 passed**.
5. Earlier High audit follow-ups committed and pushed (`9d32a62`).

### Open / next

- Director panel.
- Medium: attendance mark-save UI; mark-entry → `/marks-batches`; JS bundle split.

---

## 15 October 2026 — Audit High follow-ups (IDOR, password gate, FE hydrate)

**Status:** High findings from stability audit addressed. Decision remains **READY WITH LIMITATIONS**. Pytest **415 passed**.

### Done

1. Orphan file download IDOR: generic uploads only for uploader or elevated staff (`files.py`); teacher download of HR orphan → **403**.
2. Server-side `must_change_password` gate in `get_current_user` (allow only change-password / me / logout); query-token download path updated.
3. FE fail-closed for API-mode students + lesson plans; SubmitLessonPlan hydrates API.
4. Tests updated (`auth_test_helpers.login_headers`); full suite **415 passed**.

### Open / next

- Commit when approved (do not push without approval).
- Medium items unchanged; next panel: Principal.

---

## 15 October 2026 — System-wide stability audit

**Status:** Discovery + audit completed. Decision **READY WITH LIMITATIONS**. No new role panels started for this slice.

### Done

1. Verified stack (React/Vite + FastAPI + SQLAlchemy + PostgreSQL + Alembic **0012**, **48** tables matching ORM).
2. Ran full backend pytest **415 passed**; frontend production build **PASS**.
3. Fixed High connectivity bug: students/leave/attendance/tasks/escalations/notifications flags now default with API auth (aligned to `.env.example`).
4. Wrote `backend/docs/SYSTEM_STABILITY_AUDIT_15OCT.md` with workflow, RBAC, integrations, bugs, and go/no-go.

### Open / next

- Commit audit artifacts when approved (do not push without approval per audit brief).
- Medium: attendance mark-save UI; mark-entry → `/marks-batches`; JS bundle split.
- Next panel after audit acceptance: Principal.

---

## 15 October 2026 — Coordinator panel 29 Completed / 1 Gap

**Status:** Coordinator aligned with Teacher shared APIs (+ exams.write). Biometric Gap.

### Done

1. Students List + Exam Schedule API hydrate; Communication/Notifications/Attendance/Leave already fixed earlier today.
2. Word Coordinator **29 Completed / 1 Gap**; TOTAL **249 / 30 / 199 / 2**.
3. Pytest `test_coordinator_portal_apis` **1 passed**.

### Open / next

- Principal panel.

---

## 15 October 2026 — Teacher panel 29 Completed / 1 Gap

**Status:** Teacher sidebar shared APIs + portal screens marked Completed; Biometric remains Gap.

### Done

1. Notifications hydrate GET /notifications; Students List hydrates GET /students.
2. Lesson plans: FE client + MyLessonPlan hydrate / submit via `/lesson-plans`; Exam schedule lists `/exams`.
3. Word Teacher **29 Completed / 0 Partial / 0 Not Completed / 1 Gap**; TOTAL **222 / 31 / 225 / 2**.
4. Pytest `test_teacher_portal_apis` **2 passed**.

### Open / next

- Coordinator panel (same academic APIs; exams.write).
- Optional deeper Mark Entry → `/marks-batches` write path.

---

## 14 October 2026 (late) — Student panel 23/23 + Archify/docs refresh

**Status:** Full Student sidebar completed (shared APIs + self-scoped portal). Migration **0012** (`students.student_user_id`). Word main sheet + Archify overview refreshed and pushed.

### Done

1. `GET /students/me` + optional student login on enroll; results/attendance/TC scoped to linked student login.
2. FE: `StudentLayout` hydrates `ActiveStudentContext` from `/students/me` (offline demo fallback).
3. Word Student **23 Completed** written into main `QMIS-ERP-Role-Module-Status.docx` (TOTAL **195/34/249/2**).
4. Archify overview rebuilt: Students node `list · detail · me`; Live card notes Parent/Student 23/23 + Alembic **0012**; showcase finalize PASS.
5. Pytest **412 passed**; Alembic head **0012**.

### Open / next

- Next role panel after Student (Teacher/Coordinator likely).

---

## 14 October 2026 (late) — Parent panel 23/23 Completed

**Status:** Full Parent sidebar completed (shared APIs + portal child views). No new migration.

### Done

1. Parent permissions: `notifications.read`, `attendance.read`, `exams.read` (+ existing results/tc/comm/calendar/announcements).
2. Wired calendar, communication, notifications, escalation `roleKey=parent`; attendance calendar + results API hydrate; TC/announcement already done.
3. Word Parent **23 Completed / 0 Partial / 0 Not Completed**. Pytest parent portal suites.

### Open / next

- Next role panel after Parent (Student likely shares most of this wiring).

---

## 14 October 2026 (late) — Parent Announcement + TC live verify

**Status:** Parent TC live-verified after uvicorn reload; Announcement wired with `roleKey=parent`.

### Done

1. Live TC: create **201**, forward as parent **403**, children list **200**.
2. Parent Announcement: portal `roleKey=parent`; default audience + student-notice visibility; pytest parent announce/TC **4 passed**; live parent list sees notices.
3. Word Parent **3/6/14**; TOTAL **153/46/279/2**.

### Open / next

- Parent Calendar → Communication → Notifications.

---

## 14 October 2026 (late) — Parent TC Request API + push

**Status:** Pushed PRM Goods Received work; started Parent panel with **TC Request** (shared `tc_requests`).

### Done

1. Pushed `0597b89` (Goods Received await + Word PRM 21/21).
2. Parent TC: FE list/add/view use `/tc-requests`; create awaits API. Backend scopes parent to linked children; blocks parent forward/reject-prm.
3. Pytest `test_parent_tc_requests.py` + existing TC suite green. Word: Parent TC → Completed via `update_parent_status_14oct.py`.

### Open / next

- Parent Announcement / Calendar / Communication / Notifications — pass `roleKey=parent` and hydrate shared APIs.
- Remaining Parent Not Completed / Partial modules (class, fees, etc.) reuse-first.

---

## 14 October 2026 (late) — PRM Goods Received + Word status 21/21

**Status:** Goods Received Pass Add/Edit await API. Role-module Word sheet updated: PRM **21 Completed / 0 Partial / 0 Not Completed**.

### Done

1. `AddGoodsReceivedPass.jsx` / `EditGoodsReceivedPass.jsx` — async await save + toasts.
2. Pytest FO suite **6 passed**; live `GRP-0001` **201**.
3. Regenerated Word via `update_prm_status_14oct.py` → main `QMIS-ERP-Role-Module-Status.docx`, `updated.14oct-prm.docx`, `review.14oct.docx` (notes refreshed for Transfer/Hostel/Material/Goods create verification). TOTAL sheet: 151 Completed / 46 Partial / 281 Not Completed / 2 Gap.

### Open / next

- Next role panel after PRM (follow DATABASE_ARCHITECTURE_RULES — reuse domains first).
- Close locked `ADMIN-UPDATED-14oct.docx` if the unlocked copy should replace it.

---

## 14 October 2026 (late) — PRM Material Gate Pass await-fix

**Status:** Material Gate Pass Add/Edit await API create/update. No schema change.

### Done

1. `AddMaterialGatePass.jsx` / `EditMaterialGatePass.jsx` — async save with await, toast errors, saving state.
2. Pytest FO suite **5 passed**; live create `MGP-0001` **201**.
3. Mapping: Material Gate Pass → PASS.

### Open / next

- Goods Received Pass Add/Edit — still navigate without awaiting API save.

---

## 14 October 2026 (late) — PRM Hostel Gate Pass await-fix

**Status:** Hostel Gate Pass Add/Edit await API create/update. No schema change.

### Done

1. `AddHostelGatePass.jsx` / `EditHostelGatePass.jsx` — `async` save with `await`, error toast, saving disabled state.
2. Pytest: create + update + list hostel-gate-passes (**4** FO tests total passed). Live: `HGP-0001` **201**, update status Checked Out **200**.
3. `MODULE_DOMAIN_MAPPING.md` — Hostel marked PASS.

### Open / next

- Material Gate Pass and Goods Received Pass Add — still navigate without awaiting API save.

---

## 14 October 2026 (late) — Verify architecture docs + PRM Student Transfer create

**Status:** Baseline **confirmed** (not assumed). Admin **26/26 PASS**. Student Transfer Add form now persists to `front_office_records` (no migration).

### Verification

1. Git: `main` ahead of `origin/main` by 2; uncommitted docs + this FE/API wiring; no destructive ops.
2. Alembic current = head = **`0011_front_office_records`**.
3. PostgreSQL public: **49** relations = **48** app tables + `alembic_version`; model tables match 1:1 (0 only-PG / 0 only-model).
4. Admin live audit script: **26/26 PASS**.
5. Docs accurate on baseline; mapping gap fixed for Transfer create; Hostel/Material/Goods Add marked **PARTIAL** (missing `await`).

### Done

1. Restored `Settings.is_sqlite` (legacy `app.db.session` import was broken without it).
2. Wired `AddStudentTransfer.jsx` → `addStudentTransfer` → `POST /front-office/student-transfers`.
3. Pytest FO: **3 passed** (gate pass + authz + transfer create/list/get). Live smoke: create `STR-0001` **201**, list **200**.

### Open / next

- Next PRM workflow: await API saves on Hostel, Material, and Goods Received Add screens (same table; no schema change).
- Browser smoke as PRM login for Transfer Add still recommended.

---

## 14 October 2026 (PRM Front Office) — Not Completed / Gap closed

**Status:** PRM panel moved from **8 Completed / 1 Partial / 12 Not Completed** to **21 Completed / 0 Partial / 0 Not Completed**. Word sheet: `QMIS-ERP-Role-Module-Status.updated.14oct-prm.docx`. Migration **`0011_front_office_records`** applied on `qmis_erp`.

### Done

1. **Shared APIs wired for PRM:** Announcement, Calendar, Communication (Common components already API-backed); Notifications page loads `/notifications`; TC list/view hydrate `/tc-requests` with forward + new `reject-prm`.
2. **Teacher Database:** `EmployeeDatabaseListView` uses employee directory API; PRM granted `hr.employees.read` + `hr.self`.
3. **My Attendance:** reads `GET /hr/attendance` when signed in.
4. **New Front Office API:** `/api/v1/front-office/{collection}` for student/hostel/material/goods gate passes, student transfers, re-enrollments (`frontoffice.read/write`). FE data layers use API when auth is on.
5. **Tests:** `test_front_office_api.py` — 2 passed.

### Open

- Restart uvicorn so the new router is live in the running process.
- Close/reopen the locked `updated.14oct-evening.docx` and copy from `updated.14oct-prm.docx` if that file should be the canonical name.
- Browser smoke as PRM login for gate-pass create and TC forward still recommended.
- Add Transfer form save → `student-transfers` API (list is live; add screen may still be local).

---

## 14 October 2026 (stabilisation gate) — Admin locked; PRM next

**Status:** Administrator panel stabilised and gated. Live matrix re-checked **26/26 PASS**, schema_check clean, DB audit + daily PDF + Archify architecture doc refreshed. **No PRM (Front Office) implementation in this step** — PRM starts only after this gate.

### Done

1. **Admin stabilisation.** Re-ran `audit_admin_modules.py` (26/26). Committed DB/integration audit hardening (`schema_check` Admin tables, audit script table names, `.env.example` Vite flags, `DATABASE_INTEGRATION_AUDIT.md`). Word status helpers use a scored Admin-table finder (any 2+ distinctive modules) plus HTML escaping in the proof script.
2. **Daily working report PDF.** Markdown source remains `reports/daily-work-report.md`. Manager PDF: `erp complete documentation/QMIS-ERP-Daily-Work-Report.pdf` (built by `make_daily_work_report_pdf.py`). Nothing extra under `reports/`.
3. **Archify architecture documented.** Showcase overview at `.archify/architecture-project-overview/qmis-erp-overview.html` (finalize PASS). Narrative: `backend/docs/ARCHITECTURE_OVERVIEW.md`.
4. **PRM hand-off (plan only).** First PRM slice after the gate: Front Office Admission Enquiry → shared `/admissions` APIs (ensure `VITE_USE_API_ADMISSIONS=true`), then Admission List / Student DB reuse, then PRM-only screens (gate pass, re-enrollment, transfer) one module at a time.

### Open / next (PRM — not started)

- Begin PRM with Admission Enquiry FE→API smoke against existing Admin admissions backend.
- Keep Admin known limitations as backlog (Roles read-only, Documents list Delete stub, Attendance read-only, Activities/TC/Communication UI click-through).

---

## 14 October 2026 (late evening) — DB / integration audit

**Status:** Full database, configuration and Admin data-flow audit completed. PostgreSQL `qmis_erp` matches SQLAlchemy models (47 tables); Alembic **head = current = `0010_communication`**. Live Admin matrix **26/26 PASS**; Calendar create verified in API **and** SQL; teacher dashboard **403**; pytest **400 passed**; frontend build **PASS**. Decision: **READY WITH KNOWN LIMITATIONS** (`backend/docs/DATABASE_INTEGRATION_AUDIT.md`).

### Done

1. **Schema/config inspection.** Connectivity OK; no model↔DB drift; `create_all` + Alembic dual path documented; secrets redacted in the inventory.
2. **Ops hardening.** `schema_check` now warns when an Alembic revision expects Admin tables (`0005`–`0010`) that are missing; audit script table names corrected; root `.env.example` lists Admin `VITE_USE_API_*` flags.
3. **Deliverable.** `backend/docs/DATABASE_INTEGRATION_AUDIT.md` with per-module FE→API / API→DB / persist / authz / browser scorecard and setup commands.

### Open

- Browser re-click for Activities / TC / Communication UI still NOT RUN this pass (live API covered).
- Admissions FE flag still defaults off unless `.env` sets `VITE_USE_API_ADMISSIONS=true`.

---

## 14 October 2026 (evening)

**Status:** The remaining Administrator modules now persist on the server: Documents (`cd2ec2f`), Notifications and Announcements (`d745b0d`), Calendar, TC Request Approval, Activities, Communication and the Dashboard. Migrations `0005`–`0010` are on the development database. Full backend suite **400 passed**. End-to-end Administrator audit: live matrix **26/26 PASS**, build PASS, decision **READY WITH KNOWN LIMITATIONS** (`backend/docs/ADMINISTRATOR_MODULE_AUDIT.md`). Role-module Word sheet: Admin **26 Completed / 0 Partial**. Archify project overview regenerated to include Documents, Announcements, Calendar, TC, Activities, Communication and Admin dashboard.

### Done this evening

1. **Documents (committed `cd2ec2f`).** Student and employee folders on `/api/v1/documents`, authorised download, 5 MB PDF/JPG/PNG with signature checks. Browser: add/replace student files, employee upload and status change, delete folders. Teacher denied; HR employees-only.
2. **Notifications page.** Admin list reads `GET /notifications` and marks a card read when it is opened. Sample cards stay only when there is no backend session.
3. **Announcements (`0006`).** Send, list, view, acknowledge, reply, attachment. Sender and audience are server-set. Browser: list shows the two notices that exist on this campus (`AN-0001`, `AN-0002`).
4. **Calendar (`0007`).** 17 seeded 2026–27 items plus activity overlays. Browser: after load, Upcoming shows Annual Sports Day, Diwali and Unit Test.
5. **TC requests (`0008`).** File / forward / approve / reject. Admin approval screen reads the server. Live API create→forward→approve verified; browser approve click not re-run.
6. **Activities (`0009`).** Cultural / sports / competition CRUD, chess players, MD approval. Overlay onto the calendar. Live API create/approve verified.
7. **Communication (`0010`).** Real two-person inbox from campus logins. Attachments follow the same file rules. Live API start/send verified.
8. **Dashboard.** `GET /api/v1/admin/dashboard`. Browser as Administrator: Students 10, Employees 17, Leave 1, Escalations 0, TC 0, Unread 28, Announcements this month 2.
9. **Administrator audit + status sheet.** Live matrix 26/26; Word sheet coloured by status; totals recalculated (TOTAL 138 Completed / 47 Partial / 293 Not Completed / 2 Gap across all role panels).
10. **Archify overview.** `.archify/architecture-project-overview/` rebuilt (showcase finalize PASS) so the diagram lists the new Admin API modules as `mod_admin_campus` (Documents, Announcements, Calendar, TC, Activities, Communication, Dashboard).

### Not done / open

- Browser UI click-through for Activities add, TC approve button, and Communication compose was not re-run this evening (live API covers those writes). Teacher/HR denial in the browser not re-run (live API 403 PASS).
- Roles stay read-only (documented scope). Documents list Delete remains a Super Admin request stub.
- Other role panels (Teacher/Parent/…) were not re-audited this evening.

---

## 14 October 2026

**Status:** Class Details now stores capacity, room and class teacher on the server, per academic year, and the Administrator can edit, deactivate and delete classes from the screen. Backend, migration `0004` (applied to the development database after a backup and a rehearsal on a copy), frontend and tests are done; checked in a browser as Administrator. Nothing is pushed or merged.

### Done

1. **Class Details backend (as decided at plan review).** Section capacity, room number and class teacher (stored as the login's user id, never as text); a class belongs to one academic year and is unique per campus, year and name at database level; classes are deactivated rather than deleted, and can be deleted permanently only when no student, admission, enquiry, exam, lesson plan, attendance record or mark batch uses them (the server answers with what uses it). Only an active teacher or coordinator login can be class teacher. New admin-only picker `GET /masters/class-teacher-options`. Alembic `0004` adds the columns, backfills a class's year only when its campus has exactly one year (otherwise it aborts and lists the classes), and its downgrade refuses to discard data.
2. **Class Details screens (API mode).** The list shows Academic Year, Capacity (derived), Class Teacher, Room and Status, a "Show deactivated" toggle and an actions menu (Edit sections, Deactivate / Reactivate, Delete, each behind a confirmation with a double-click guard and the server's message on refusal). The Add screen takes capacity, room and a teacher per section and is safe to repeat. A new Edit dialog changes capacity, room, teacher and active state per section and can add a section, saving row by row. Local (browser-only) mode is unchanged.
3. **Browser check as Administrator, plus local mode.** Create, edit with a new section, deactivate, show and reactivate, a refused delete of a class in use (Grade 1: 7 students, 7 admissions, 8 enquiries, 3 attendance records), a delete of an unused class, a duplicate save, and the flag-off regression (0 backend calls) all passed. **Two defects were found and fixed:** a deactivated class still stayed in the flat class and section lists that other screens' dropdowns read (my own earlier note said it did not), and the capacity cell showed placeholder dashes when nothing was set.
4. **Tests and documents.** Full backend suite **314 passed** (264 before); build and lint on the changed files are clean. `backend/docs/FRONTEND_INTEGRATION.md` now describes the new routes, rules, migration `0004` and the mirror behaviour. Details in `reports/testing-report.md`.

### Not done / open

- **Not run in a browser:** Teacher or Principal on these screens (proven by pytest only), the same class in a second academic year (only one year exists in the development database), a partial section failure on screen, a real outage.
- **Open design points:** capacity is not checked against enrolment; the delete check matches class names across all years and cannot be made race-proof without a foreign key; if the unpushed Phase 2 line is restored, `TeacherAssignment.class_teacher_of` overlaps `class_teacher_user_id`.
- **A commit made by the repository owner (`10c239e`, "backend chnage") swept in this work, including the review copy of the status sheet.** That sheet is **stale** (it says no Ops API exists and no backend for announcements, calendar, communication or notifications, and the Teacher rows were not checked against `academicsApi.js`); it must be redone before anyone uses it. The Archify overview was **not** regenerated for this step.
- **Next:** redo the role-module status sheet and regenerate the Archify overview; then Attendance editing, Leave, Roles, and the missing Activities, Documents, Announcement, TC Approval, Communication, Calendar and Notifications modules, one at a time. Reviewer decisions still open: the Escalation mirror, the HR / Finance cache, User Creation status, and the Roles-editing design. The remote `main` rewind still needs the owner's confirmation.

---

## 13 October 2026

**Status:** Backend modules Y-0 to Y-5 built; leave, notifications, escalations and task management are wired to the frontend and checked end to end in a browser. P0 security hardening done on a review branch (not pushed); see item 18. Administrator modules started: RBAC User Creation and Roles (item 19) and Employee Database from HR (item 20) built and checked in a browser, on their own branch, not pushed. The `hr_employees.user_id` schema fix is done as a versioned migration (item 21), and so is the `school_classes.academic_year_id` fix (item 22). The Administrator's Class Details screens now use the masters API (item 23), and the Administrator's student and employee Attendance pages read real attendance (item 24). The earlier work is merged to `main` (PR #1 and PR #2); item 24 is committed on `feature/admin-attendance` (not pushed). A role-module audit of seven panels and a review copy of the status sheet are done (item 25), and the Student Database fix found by that audit is done but uncommitted (item 26); both wait for review.

### Done

1. **Audit against client docs** — enumerated the 185 live endpoints from OpenAPI. Found P0-6 (RBAC CRUD) and P0-7 (audit middleware) code exists but is not mounted; backlog corrected to PARTIAL.
2. **Y-0 Approval engine** — `approval_requests`, append-only `approval_events`, `notifications`; chains per doc (lesson plan / marks: Coordinator→Principal→Director). Rules: role must match current level, initiator cannot self-approve, denial needs a reason and ends the request (resubmit creates a new row, history kept), one pending per item.
3. **Notifications** — in-app, fan-out by user or role; list + mark read.
4. **Permissions** — `approvals.submit/decide/read`, `notifications.read` for academic staff, HR, stationery manager.
5. **Y-2 Lesson plans** (Academics doc 4.5) — monthly plan per teacher/class/subject; submit goes into the approval engine (Coordinator→Principal→Director); late flag if submitted after the 25th of the previous month; reminders from the 18th to the 25th (once per teacher per month); plan locks on submit; a denied plan is revised as a new version; teachers see approval status and events; approvers see all plans.
6. **Y-3 Exams, marks and results** (Academics doc 4.6 / 4.18) — configurable exam types (CA, RCT, Midterm, Final seeded); exam schedule created by Principal, approved by DA; marks entered per exam/subject/class as a draft (preview, editable), submit locks it; chain Coordinator→Principal→DA then published; denied batch revised as new version; validation (0..max, class match, absent flag, no duplicates); auto ranks and class-high per subject; DA-set weightage per class and exam type (must total 100, locked once an exam cycle starts) with weighted final percentage; parents see published results for their own child only.
7. **Backend ↔ frontend coordination audit** — compared every frontend API call with the live backend schema. Wired and matching: auth, admissions, parents, students, attendance, finance, HR, files. Fixed: frontend called `POST /auth/logout` which did not exist (now added and audited). Fixed: exam types now seeded from the frontend's own list. Not coordinated yet (backend only, frontend still on local demo data): masters, audit, approvals/notifications, lesson plans, marks, leave. Full table in `backend/docs/FRONTEND_INTEGRATION.md`.
8. **Y-4 Leave and permission** (Academics doc 4.9) — any staff role files a request; department head (same approver map as the frontend) then HR must approve; Permission is one day, max 2 hours; overlap check; reason required for denial; no edit/cancel; approved leave is exposed through an on-leave lookup so attendance can auto-mark Leave/Permission.
9. **Security fix** — generic `POST /approvals` can no longer open approvals for lesson plans, marks, exam schedules or leave (only their own endpoints can).
10. **Frontend integration of existing modules (leave + notifications)** — before adding more backend, the leave screens now read and write through the API (`leaveApi.js`, flag `VITE_USE_API_LEAVE`): apply (including Permission with hours), My Requests, Received, view, approve/reject (rejection needs remarks). The Received list shows a request to every approver in its chain, and the Approve/Reject box shows only to the role it is waiting on. HR had no leave screen, so one was added (HR sidebar "Staff Leave Requests"). The header bell now reads real notifications (`notificationsApi.js`): unread badge, dropdown, click to mark read, refreshes every 30 s.
11. **Manual browser check of the leave workflow (live backend + frontend)** — Teacher applied Casual Leave: success message, redirect, request LR-0001 shown as Pending, stored on the server with chain Principal → HR. Principal logged in: bell showed 1, request listed under Received, approved with remarks in the UI → moved to HR. HR logged in: bell showed 1, opened the request, approved in the UI → status Approved. Server confirmed the final state and the teacher received an "Approved: Casual Leave" notification. Bug found and fixed during the check: HR's remarks box was pre-filled with the Principal's remark. Not re-checked in the UI: the teacher's own bell dropdown after approval (confirmed through the API only) and the rejection path.
12. **Y-5 Escalations with the 24h clock** — a person raises an escalation one level up (student→teacher→coordinator→principal/director…→admin→super admin, same ladder as the frontend). The receiver has 24 hours: In Review, then Resolved/Rejected (note required). If nothing happens in 24 hours the clock moves it one level up per elapsed day, tells the old owner, the new owner and the raiser, and keeps the whole trail; earlier owners keep read access. At the top level a single overdue alert is sent. Only the person who raised it can close a resolved/rejected one. The clock runs whenever escalation/task lists are read and through an admin-only sweep endpoint (no scheduler yet).
13. **Y-5 Tasks** — staff assign a task (title, priority, due date) to another staff user; content cannot be edited or deleted; only the assignee moves Incomplete → In Progress → Completed (no reopening); assigner is told on completion; an overdue task alerts both people once. Assignee lookup endpoint added.
14. **Pytest** — 80 passed at this point (71 earlier + 9 for escalations/tasks); 82 after item 16; 90 after item 17. Frontend production build passes.
15. **Escalation Management wired to the backend and checked in a browser** — correction: earlier I had only shown the backend passing tests and a health check, which does not prove the screens are connected. Now: raise screen (`escalationApi.js`, flag `VITE_USE_API_ESCALATIONS`, recipient list from a new `GET /escalations/recipients`, optional named person), lists (raised/received, Overdue label), view screen (status update with note, History trail, raiser-only Close). Browser run against the live backend: Teacher raised "Projector in 8-A…" → ESC-2026-001 shown Pending, routed to Coordinator. Coordinator's bell showed 1 and the item was in Received. Resolving without a note was refused with the server message; with the note "Lamp replaced by IT" it became Resolved. Teacher then saw Resolved with the note and a Close button, closed it → Closed (history shows raised / resolved / closed; Coordinator sees Closed too). 24h clock: a second escalation was raised, the clock moved forward 25 hours through the admin sweep (a simulated time, not a real wait), and the teacher's screen then showed "Routed to Principal" with "auto escalated (coordinator → principal)" in the history. Two UI defects found and fixed: the read-only form showed the viewer's own escalation target instead of the record's recipient role; a direct link briefly said "not found" before loading. Not UI-checked: the Principal's screen after auto-escalation, the Rejected path, bell text for auto-escalation, other roles (director, admin).

16. **Escalation verification, second pass (browser + automated)** — covered the scenarios left open after item 15. Rejected: no note and a blank note are refused, a real note is stored and shown in the history, the raiser sees it and closes it. Principal after a simulated 25-hour climb: sees the item as received, can act, previous owner (Coordinator) is read-only. Bell: counts match the server and clicking marks read; the Teacher's dropdown shows the auto-escalation, In Review and Rejected messages. Director (item climbed two levels) can act, and cannot see an item that never reached them; Admin reads everything but cannot change status; sweep is Admin-only. A real defect was found and fixed: **lists did not refresh after the server answered** (Director showed Received 0 while the server had 1). Cause: React Compiler ignored a refresh counter in the list's memo; the list now keeps its records in state and passed three cold-cache reloads. The two lint errors were fixed (an unused re-export in `RecipientSelect`, a synchronous state update in `ViewEscalationPage`'s effect). Two new backend tests; **82 passed**; build passes; the escalation and services files lint clean (365 problems remain elsewhere in the project, untouched). Not fixed and not checked are listed in `reports/testing-report.md` (notification click does not open the item; no Admin all-items tab; Super Admin and several other roles not driven; old local-storage mode not re-tested).

17. **Task Management wired to the backend and checked in a browser** — done in two steps, as agreed. *Step 1 (basic integration):* backend now accepts an optional remark on status changes and keeps an append-only task history (who, role, remark, time); creating a task accepts a `clientRef` so a retry after a lost response never creates a duplicate. Frontend: `taskApi.js`, flag `VITE_USE_API_TASKS`, real assignees from the server, backend `Incomplete` shown as `Pending`, one task per selected person with a clear created/failed list and a safe "Retry failed" button, assigned date and overdue set by the server, document upload hidden in API mode (backend has no attachments), local-storage mode unchanged when the flag is off. My Tasks, Assign Tasks, Add Task, user select and the status modal all read from state, not from memoized counters. *Step 2 (hierarchy):* the backend now enforces who may assign to whom (superadmin→admin, admin→director, director→principal/PRM, principal→coordinator/teacher/librarian, PRM→gatekeeper manager, gatekeeper manager→gatekeeper); anything else is 403, self-assignment stays 400, and the assignee lookup only lists the caller's direct reports. Browser checks against the live backend passed for Principal, Teacher, Director and Admin: empty form blocked, several people, partial failure and lost-response retry (no duplicate), status with remarks, overdue label, notifications, role restrictions, a forged upward assignment refused with the server's message on screen, and the flag-off (local) regression. A real defect was found and fixed: **two "Task overdue" notifications per person** when two list reads ran together; the overdue flag is now claimed atomically (regression test added). **90 passed** (82 before, +8); build passes; lint shows only 4 old errors in the task pages. Not run: Librarian / PRM / Gatekeeper screens (no users for those roles), an Admin or Director "all tasks" screen (none exists), self-assignment through the screen, Super Admin, mobile. Still open: attachments for tasks, escalation auto-climb has the same kind of race (not changed). Dev data left behind: user `teacher2@qmis.edu`, tasks TASK-0001…0007 (two backdated in the database). Details in `backend/docs/FRONTEND_INTEGRATION.md` and `reports/testing-report.md`.

18. **P0 security hardening (done before any new feature)** — no work was discarded; the 33 uncommitted files were backed up and checked, a separate review branch (`review/p0-security`) was made, and every commit is reviewed before it is made. Nothing is pushed. *Protected:* literal passwords were removed from the committed tests, docs and reports (the tests now read the seed logins from settings). *Backend fixes:* (a) the API refuses to start unless `ENVIRONMENT=development`, or the production settings are safe: no default or short JWT secret, no `OTP_DEBUG`, no `*` CORS, no demo integrations, no default database password; (b) the OTP code is only returned in development with `OTP_DEBUG=true`, and `OTP_DEBUG` now defaults to off; (c) asking for an OTP gives the same answer for a known and an unknown email (the old "No active account uses that email" 404 is gone), and unknown requests are audited; (d) rate limiting and lockout on login, OTP request and OTP verify: 5 wrong passwords lock that email for 15 minutes, 20 failures block an IP, 3 OTP requests per 10 minutes per email, 5 wrong OTP codes lock and burn the code, answers are 429 with `Retry-After`, and every lockout is audited; guessing the current password on the change-password screen is limited the same way; (e) password rules when a password is *set* (not when logging in, so existing accounts keep working): at least 10 characters, a letter and a number, no common or repeated passwords, not containing the email name, at most 72 bytes; HR temporary passwords are now random instead of a 6-digit number; (f) demo accounts (admin, HR, teacher…) are created only in development. *Frontend fixes:* removed every hard-coded login: the HR and Finance fallback logins (they used to sign in as HR / Account Head / Admin behind the user's back), the demo-account buttons and shared demo password on the sign-in page, the pre-filled parent password in the admission screen, and an unused fake "any 6-digit OTP" login. If the API rejects a login there is no local fallback any more. Offline demo sign-in now needs a development build plus `VITE_ENABLE_DEMO_LOGINS=true`. A stored role is checked with the server on page load, and a rejected token (expired or invalid) now ends the session with "Your session has expired". *Tests:* **152 passed** (90 before, +62: 52 security tests, 10 static checks of the frontend sources). Build passes; lint on the touched files shows no new problems. *Manual browser and live API checks:* sign-in failure message, lockout message after five wrong passwords, HR sign-in and HR dashboard data, Account Head sign-in and finance, HR blocked from finance (403, no fallback), sign-out, tampered stored role, rejected token on reload and in the middle of a session: all passed. Not run in a browser: the OTP screens (there is no OTP screen), the change-password screen with a must-change account, and a real wait for token expiry. *Found, not fixed:* the local database's `hr_employees.user_id` column is `VARCHAR(36)` while the code expects a UUID, so a non-HR user opening the HR "own record" page gets a server error (500); the Finance screen keeps a previous user's load error until "Retry API load" after switching users in the same tab. *Open risks:* the real local database password is in older pushed history (rotate it), the dev seed passwords are in history too, limits are per server process (use one worker or move them to Redis), there is no first-admin setup for a production database, and OTP codes are not delivered by email or SMS yet. Details in `reports/testing-report.md`.

19. **Administrator modules, step 1: RBAC > User Creation and Roles** — the role document lists 26 Administrator modules (8 completed, 6 partial, 12 not completed). This one came first because the P0 work exposed a real break: users created on the User Creation screen were saved only in the browser (with their passwords in plain text), and since sign-in is now server-only, none of them could ever sign in. Work is on a new branch `feature/admin-user-management` (cut from `review/p0-security`, two commits, not pushed). *Backend:* new admin-only API under `/api/v1/admin`: create, list (filter by role, status, search), view, update profile/status, reset password, plus a read-only list of roles and the permissions each role holds. New permissions `users.read`, `users.write`, `rbac.read` (Admin, Super Admin and Managing Director only). Rules enforced on the server: an Administrator can create only Principal, PRM, Teacher, Coordinator, Librarian, Gate Keeper Manager and Gate Keeper (a Super Admin can also create an Administrator); anything else is refused, and a created user's role cannot be changed afterwards; an Administrator cannot change, deactivate or reset an Administrator, HR, Finance, student or parent account, or their own account here; every new or reset login gets a random temporary password and must change it at first sign-in (an admin may type one instead, but it must meet the password policy); accounts are deactivated, never deleted, and a deactivated user's open session stops working at once; passwords are never written to the audit log or the profile table, and the one-time temporary password is returned with `Cache-Control: no-store`; staff codes (TEA-0001, PRM-0001…) are issued by the server; every action is audited with the acting user. New table `user_profiles` (name, gender, mobile, optional address/qualification fields); the old, unmounted `rbac.py` (whose PATCH had no authorization) was left untouched and is not used. *Frontend:* flag `VITE_USE_API_ADMIN_USERS` (defaults on whenever API sign-in is on). The Create User screen sends to the server and shows server errors (for example the password rule); the password box is now optional ("leave blank to generate"). After saving, the list page shows the temporary password once, with a Copy button, and wipes it from the browser history so a refresh cannot show it again. The list loads from the server, with Deactivate/Activate and Reset password per row (the old Delete is replaced by deactivate in this mode). The Roles page now shows real roles with user counts, permission counts and a "View permissions" detail, read-only. The Class Details teacher picker and the Admission Enquiry PRM picker refresh from the server, so they see API-created users even on a clean browser. The browser copy of created users never holds a password. *Tests:* **189 passed** (152 before; +32 for the admin API, +5 static checks of the frontend sources). Build passes; the changed files lint clean. *Browser run against the live backend (Administrator then the created Teacher):* empty form blocked, weak password refused with the server message, create succeeded and showed the temporary password once, a reload showed the user and no password, Deactivate/Activate/Reset password from the list, Roles page with counts and permissions, the new Teacher signed in with the temporary password and was forced to change it, then reached the Teacher dashboard; the same Teacher got 403 on the admin endpoints; the Class Details teacher dropdown listed the new Teacher with an empty local cache. *Not done / open:* editing role permissions is deliberately not built (it changes live authorization; needs your decision on which module toggles map to which backend permissions); changing a user's role or email; profile photo and document upload (the upload fields on the form are not sent); Super Admin's own Admin-user screen still uses the old browser-only store; the flag-off (browser-only) mode was not re-run in a browser; the Employee Database screen still reads the browser copy, so an API user appears there only after the User Creation page or a picker has loaded the list. Dev data left behind: user `browser.teacher@qmis.edu` (TEA-0001, now Inactive). Details in `reports/testing-report.md`.
20. **Administrator modules, step 2: Employee Database connected to the HR employee API** — same branch (`feature/admin-user-management`), not pushed. *Checked first (no code):* the HR API can list and view employees (scoped by role), create them, and save the whole collection; it cannot update or delete a single employee, and has no search or paging. The screen only needs list and view, so no new employee API or store was added. HR employees and the logins made on the User Creation screen are separate records, linked only by user id or by email. *Screen (Administrator only, server mode):* it now reads the HR employee list and the User Creation logins in parallel and shows one row per person (matched by email; the HR record wins and the login is noted on it). A login with no HR record is shown as its own row, labelled "User Creation". The detail page shows HR fields, designation, category, reporting manager and status; salary reads "Restricted (HR)"; no password is shown anywhere in this mode. It has loading, error with Retry, empty, access-denied and partial-failure states (if one source fails, the other is still shown with a warning). Local (browser-only) mode is unchanged, as are the shared Principal / Director / Super Admin employee screens. New flag `VITE_USE_API_EMPLOYEES` (defaults to the sign-in flag). *Backend fix found while checking consistency:* HR's bulk save re-derives a login's active state from the HR status, so a login an Administrator had just deactivated could be switched back on by the next HR save. Deactivating or activating a login in User Creation now keeps the linked HR record in step (Active and Inactive only; Relieved and Terminated are never overwritten) and is audited. A test proves the bug is real (it fails when the fix is removed). *Tests:* **205 passed** (189 before; +12 directory tests, +4 static checks). Build passes; changed files lint clean (one lint error that was already in the list screen was fixed on the way). *Browser (Administrator, live backend):* list of 17 rows, search, department filter, HR detail, login detail, unknown id, one-row merge for a person with both records, reload persistence, and local mode (no API calls). The error, empty, 403 and partial-failure states were checked by overriding `fetch` in the page, not by stopping the server. *Found, not fixed:* HR's "own record" page returns 500 for Teacher, Coordinator, Principal and Director because the dev database column `hr_employees.user_id` is `VARCHAR(36)` while the model expects a UUID (a pre-existing defect, needs a migration; Administrator and HR are not affected). *Not run:* deactivating through the User Creation screen and watching the HR status on screen (the endpoint was checked by script and in pytest), a real outage, local-mode detail with data, the Principal/Director/Super Admin screens, and a live HR bulk save. Dev data left behind: login `live.link@qmis.edu` (TEA-0002) and HR employee EMP-0017, both Inactive. Details in `reports/testing-report.md` and `backend/docs/FRONTEND_INTEGRATION.md`.
21. **Database fix: `hr_employees.user_id` is now a UUID column (versioned migration)** — done before starting Class Details, as agreed. *Why it was wrong:* the model declares a UUID link to the login, but databases that already had an HR table got the column from a startup helper as a plain `VARCHAR(36)` with no foreign key (one commit on 9 Oct added the column to the model as a UUID link and to the helper as VARCHAR; `create_all` never alters an existing table, so the two definitions disagreed). PostgreSQL accepts writing a UUID into it but refuses comparing them, so every role that is not allowed to see all employees got a 500 on the HR "own record" lookup. *Inspection first:* 17 employees, 15 with no link, 2 linked (EMP-0016, EMP-0017) to valid logins with matching emails; no blank, malformed, orphan or duplicate values; nothing references the table; no views or triggers on it. *Backup:* a full `pg_dump` of the dev database was taken before any change, outside the repository (it holds password hashes, so it is not committed) and checked readable. *Migration:* the project had no migration tool, so Alembic was added (`alembic/`, `alembic.ini`, in `requirements.txt`; the database URL comes from the app settings, no credential in the files). Revision `0001` is a no-op baseline so existing databases need no stamping; `0002` converts the column in one transaction: it locks the table, **aborts and lists the employees** (changing nothing) if any value is not a UUID or names a login that does not exist, turns blank text into NULL (counted), converts, compares every row and link with a snapshot taken first (a mismatch rolls back), then adds the missing foreign key. It can be run twice safely and has a tested downgrade. It is applied by hand (`alembic upgrade head`); startup only logs a warning when the schema is behind. The startup helper no longer creates the column as VARCHAR. *Rehearsal first:* the backup was restored into a scratch database and the real migration run there (upgrade, repeat, downgrade, bad value aborts, orphan aborts, blank and upper-case values), all passing, before it was applied to the dev database. *Result on the dev database:* employee rows, both links and all audit rows identical before and after; the only new table is `alembic_version`. `GET /hr/portal/employees` now returns 200 for Teacher, Coordinator, Principal, Director, Admin and HR (it was 500 for the first four); a teacher with a linked HR record sees only their own record; HR/login activation sync still works and a deactivated user's token stops at once. *Tests:* **218 passed**, 0 skipped (205 before, +13: 8 migration, 2 startup, 3 wiring; includes a test that reproduces the original failing query and shows it works after). Build passes; lint clean. *Not run:* the Teacher/Principal screens in a browser (API only), downgrade on the dev database itself, and restoring the backup over dev. *Found, not fixed (other features):* the same VARCHAR-vs-UUID drift on `school_classes.academic_year_id` and two `admission_enquiries` columns, and `hr_employees.employee_code` is 32 characters live against 40 in the model. Details in `reports/testing-report.md` and `backend/docs/FRONTEND_INTEGRATION.md`.

22. **Database fix: `school_classes.academic_year_id` is now a UUID column (second versioned migration)** — done before Class Details, as asked. *Inspection first:* the model declares a UUID link from a class to its academic year, but the live column was `VARCHAR(36)` with no foreign key — the same kind of drift as item 21 (the model was changed in one commit and the startup helper added the column as VARCHAR). It was confirmed, not assumed: filtering classes by a real academic year returned 500 (`character varying = uuid`). The dev data was 1 class (Grade 1, no year) and 1 academic year. *Backup and rehearsal:* a full `pg_dump` outside the repository (readable, holds password hashes so not committed), then the real migration was run on a restored scratch copy: upgrade, repeat, downgrade, a non-UUID value, a link to a missing year and a class linked to a year on another campus (all three abort with nothing changed), and blank / upper-case values. *Migration `0003_class_year_uuid`:* same safety rules as `0002` plus the cross-campus check; one transaction, table lock, snapshot compare, then the foreign key; repeatable; tested downgrade; applied by hand. The startup helper now adds the column as UUID and the startup check reports this drift too. *Result on the dev database:* the class, the year and the sections are identical before and after; no table changed except `alembic_version`; the year filter returns 200; the HR portal still works for Admin, HR, Teacher and Principal; the foreign key rejects an unknown year. The other drifted columns were not needed for this work and were left alone (`admission_enquiries.profile_image_file_id`, `admission_enquiries.converted_admission_id`, and the `hr_employees.employee_code` length). *Tests:* 13 new migration tests; **231 passed** at that point.
23. **Administrator modules, step 3: Class Details connected to the masters API** — same branch, not pushed. *Checked first:* the backend can list and create classes (a class is created with its first section and the current academic year by default), add sections, and list academic years; it cannot update or delete a class, and it has **no** class capacity, section capacity, class teacher or room number. Nine other screens read the same browser class catalog. No new endpoint was added. *Screens (API mode):* the list reads years, classes and sections together and shows Class, Section and Academic Year, with an **Academic Year filter that runs on the server**, loading, error with Retry, and two empty states. The Add screen takes class, academic year (default: current) and sections. Saving is safe to repeat: it finds the class by name, creates it only if missing, then adds only the missing sections (a conflict counts as already present); partial failures say so and a second Save retries only the rest; the button is disabled while saving. The teacher, capacity and room inputs, the capacity column and Edit / Delete are hidden in this mode, and each screen says why. The server's classes and sections are mirrored into the browser catalog (server wins on names, browser-only fields are kept, nothing is removed) so the other screens still offer them. New flag `VITE_USE_API_CLASSES` (defaults to the sign-in flag); local mode is unchanged. *Tests:* **246 passed** (231 before, +7 API contract tests, +8 static frontend checks); build passes; the changed files lint clean (one old unused-variable error in `Components/ExportModal.jsx`, not touched). *Browser (Administrator, live backend):* list, server-side year filter (including the empty state), create class V with sections A and B, a repeat save that added only C and reported A as already present, the year filter after the creates, the offline error state with Retry recovering (network switched off in the browser), the mirrored catalog contents, and local mode (original columns and fields, a local save, no backend requests). *Not run:* a non-admin role in a browser, a real 403 on the Add screen, a partial section failure on screen, the other screens opened with an API class, mobile. *Open:* capacity, class teacher and room number need a backend change and a decision; classes cannot be renamed or deleted through the API; other class-catalog screens see server classes only after the Class Details screens have run in that browser. Dev data left behind: class `V` (A, B, C) in 2026-27, which the API cannot delete. Details in `reports/testing-report.md` and `backend/docs/FRONTEND_INTEGRATION.md`.
24. **Administrator modules, step 4: Attendance (students and employees) connected to the attendance APIs** — read-only; committed on branch `feature/admin-attendance` (two commits, not pushed or merged). *Checked first:* students' attendance already has `GET /attendance` (date, class, section, plus a roster option that lists unmarked students) and teachers mark it; there is **no dedicated employee attendance endpoint**, only the generic HR collection `GET /hr/attendance`, whose dates are free text (`dd-mm-yyyy` in dev data, ISO also occurs). The server stores **no punch-in / punch-out times for students** and no subject-wise attendance. No new endpoint was added. *Students page (API mode):* shows the marks for the chosen date (today when the date is cleared); class and section filters run on the server; choosing a class without a section also lists students nobody has marked as "Not marked" (with a section, only marked students show, because the server ignores section when it builds the roster); a count line (Present, Absent, Late, Not marked); the two time columns become "Marked At" and "In / Out" with a one-line explanation; new Late, Holiday and Not marked badges. *Employees page (API mode):* reads HR attendance joined with the employee list for names and roles, applies the date in the browser, and when nothing is recorded for the chosen date says how many records exist on other dates and offers "Show all dates". Both pages have loading, error with Retry, and empty states, and keep their filter dropdowns when a reload fails. New flag `VITE_USE_API_ADMIN_ATTENDANCE` (defaults to the sign-in flag); local mode and the Super Admin pages are unchanged. *Tests:* **260 passed** (246 before; +5 API contract tests, +9 static frontend checks); build passes; the changed files lint clean. *Browser (Administrator, live backend, after three real marks were saved through the teacher login):* the date's list with counts, the class filter showing the 4 unmarked students as "Not marked", the section filter, a date with no marks (empty message), the offline error state followed by Retry recovering, the employee list (names and roles joined, 5 records on 22/09/2026, today's empty state with "Show all dates"), and local mode on both pages (original options, columns and demo rows). *Not run:* a Teacher or other role in the screen, a real 403, marking or correcting attendance as Administrator (not built, needs a decision on who may edit and on audit for HR records), mobile layout, a real outage. *Found:* the employee attendance dates are free text on the server (an unrecognised format cannot be matched by the date filter). Dev data left behind: three Grade 1 student marks for 13 Oct 2026 (Present, Absent, Late). *Archify:* the project overview was regenerated (`.archify/build_project_overview.py`) with the Admin users module named, an Alembic node (revisions 0001 to 0003, applied by hand) linked to PostgreSQL, 17 API clients listed, and updated "Live now" and "Still open" cards. The four automated gates passed (validate, deliver, check, real-browser check; repository evidence checked against committed files). Visual review was **not** done: the tool recommends it because 12 lines cross in the module fan-out beside the API box. Details in `reports/testing-report.md` and `backend/docs/FRONTEND_INTEGRATION.md`.
25. **Role-module audit of Teacher, Coordinator, Director, HR and Account Head, plus a recheck of Administrator and Principal, and a review copy of the status sheet** — read-only; no application code was changed for the audit itself. *Method:* signed in with each seeded login, opened every sidebar route (30 + 30 + 24 + 35 + 22 modules, plus 26 and 21 earlier) in a running browser against the live backend, and recorded the real `/api/v1` calls and status codes with every write blocked, so this covers page loads and reads only. A page loading was not counted as complete; a module counts as API-backed only if it made its own API call and the code has a client for it. *Results:* in the order Completed / Partial / Gap / Not Completed: Teacher 2 / 3 / 1 / 24; Coordinator 2 / 1 / 1 / 26; Director 3 / 3 / 0 / 18; HR 31 / 4 / 0 / 0 (35 modules; the sheet listed 34); Account Head 1 / 20 / 0 / 1; Administrator 10 / 4 / 0 / 12; Principal 3 / 3 / 0 / 15. *The sheet was wrong in several places:* it said Lesson Plan, Lesson Plan Approval and Mark Entry were Completed (the backend routes exist, `/lesson-plans` and `/marks-batches`, but the frontend has no client and the screens make no call); it cited an Ops API and `VITE_USE_API_OPS` that do not exist in the code; the Teacher cannot mark attendance from the screen (`upsertAttendanceApi` has no caller); the Coordinator's Class Attendance and Received Leave Requests never call the API. *Defects found:* `GET /finance/state` returns 403 on every fresh load for Teacher, Coordinator, Director, Principal and HR (the finance provider is mounted at the app root for every role); after a normal sign-in the Account Head sees "Finance API ... load failed" until the page is reloaded (the one-time pull runs before sign-in); every HR page requests the same 25 collections and caches payroll data in browser storage; the Student Database requested `GET /admissions/{id}` per student (item 26). A correction to my own early note: the "x4" repeats on tasks, leave and escalations are two boxes (mine, assigned) doubled by React StrictMode in development, not duplicate requests. *Review copy:* `erp complete documentation/QMIS-ERP-Role-Module-Status.review.docx` (untracked, built from the original; the locked original is unchanged and its hash matches the backup). Totals are recomputed from the rows: 480 modules, 122 Completed, 51 Partial, 305 Not Completed, 2 Gap. The 18 panels that were not re-checked keep their statuses, and only the Ops wording in their notes was replaced. Student Database and both Attendance rows are marked "Completed (pending merge)"; User Creation is plain Completed because git shows it merged in PR #2, which differs from the instruction and is flagged for review. Leave stays Partial (it mirrors to localStorage). A section 6 in the document lists three reviewer decisions (Escalation has the same mirror as Leave; HR and Finance caches; User Creation). *Checks:* 25 structural checks on the review copy passed. *Not run:* opening the file in Word or LibreOffice (neither is installed), any write workflow in a browser, an API outage, and the panels without seeded logins. A commit `49c4568` ("backend chnage") on `feature/admin-attendance`, made by the repository owner, adds only the older `.docx.tmp` file; I left it alone. Details in `reports/testing-report.md`.
26. **Student Database: no per-student admissions lookup (fix found by the audit)** — uncommitted, on a new branch `fix/student-database-admissions-lookup` cut from `feature/admin-attendance`. *Cause:* the shared mapper in `src/Common/StudentDatabase/studentDatabaseData.js` called `getAdmissionById` for every row; in API mode that returns a Promise, which is always truthy, so it was used as the record. Result: one `GET /admissions/{id}` per student (403 for Principal and Director, who hold `students.read` but not `admissions.write`; 200 for Administrator, but wasted), and the detail page showed "—" for admission-only fields that the API had returned (father name, admission date). *Fix:* in API mode the mapper now uses the row and `admissionSnapshot` from `/students` and `/students/{id}`, ignores a Promise, and no longer writes the snapshot back. Local mode is unchanged. Permissions were not widened. *Browser re-check after the fix (Principal and Administrator):* 0 admissions requests (was 9 each), the list still shows 10 rows, and the detail page shows "Parent" and 2026-10-12 as the API returns. *Tests:* four new static checks in `test_frontend_student_database_static.py`; the full suite passes (264). Local (browser-only) mode was not re-run in a browser.

### Not integrated on purpose (needs a decision first)

- **Lesson plans** — the frontend plans are weekly and approved by the Director only, with fixed names; the document and backend use monthly plans with Coordinator → Principal → Director. Needs: your decision (weekly vs monthly) and new review screens for Coordinator and Principal.
- **Marks / exams** — the frontend has no exam-schedule screen (exam names are a fixed list); backend needs Principal-creates / Director-approves. Needs a new screen before wiring.

### Still open / next build

- **Administrator modules (from the role document), proposed order after RBAC and Employee Database (both done):** the `hr_employees.user_id` and `school_classes.academic_year_id` migrations (items 21, 22), Class Details (item 23) and Attendance (item 24) are done; decide whether to fix the remaining drift (`admission_enquiries.profile_image_file_id`, `admission_enquiries.converted_admission_id`, `hr_employees.employee_code` length; each a reviewed revision) and whether the backend should store class capacity, class teacher and room number; then Announcement, Communication, Calendar, Notifications page, TC Request Approval, then Activities (4) and Documents (2, needs real upload), then the Dashboard KPIs. Each as its own branch step with tests and a browser run.
- Escalations and tasks are wired and checked (items 15–17). Task gaps: no attachments, no Admin/Director "all tasks" screen, no edit/delete/reopen (by design).
- Leave: no balances/quota yet; attendance table does not yet read the on-leave lookup (student table only); emergency substitution not built. Decision: document says HR and department head both approve; the frontend used a single approver before. Backend and the frontend leave screens now follow the document (head, then HR).
- 24h clock needs a scheduler (cron) in production; today it runs when lists are read or the sweep endpoint is called.
- Exams: marks bulk is a JSON list (no CSV/Excel upload yet); question bank / key notes not built; no notification to all users when an exam schedule is published; student self-login view not possible until student users exist.
- Lesson plans: no attachment upload UI yet (fileId accepted), reminders must be triggered (no scheduler yet), frontend not wired.
- Not yet built from docs: immutability enforcement (attendance upsert and masters DELETE conflict with doc rule), RFID/iClock, refresh/logout/role switch, student user auto-create on admission fee payment.
- Doc conflict to decide: doc says no parent login; code has parent login.

---

## 12 October 2026

**Status:** Phase 1 identity journey closed (P1-1…P1-5). Docs + Archify refreshed. Manual browser Pass not claimed.

### Done

1. **Blank screen** — `HRRoutes` eager `EMPLOYEES[0]` before HR hydrate; lazy redirect fix.
2. **Postgres** — PG18 on `:5432`; `backend/.env` password set locally (not recorded here).
3. **Admissions 500s (why A1–A8 failed)** — enquiry_code / guardian_name / ADM clash fixes + migrate.
4. **P1-4 Select Child** — `GET /parents/me/children`; ParentChildContext + smoke PASS.
5. **Seed academics logins** — teacher / coordinator / principal / director.
6. **Docs** — `API_BACKLOG` P1-4/P1-5 DONE; `TEAM_ROADMAP` / `FRONTEND_INTEGRATION` updated.
7. **P1-5 Students UIS** — `GET /api/v1/students`, `GET /api/v1/students/{id}`; `studentsApi.js`; Student Database list/detail hydrate when admissions API on; teacher/principal/director get `students.read`.
8. **Y-1 Class attendance** — `GET/POST /api/v1/attendance`, calendar map; `attendanceApi.js`; Teacher Class Attendance list loads API when enabled; `attendance.read/write` for teacher staff roles.
9. **Archify** — overview includes `mod_students`, `mod_attendance`, `studentsApi.js`, `attendanceApi.js` (finalize gates pass). Uncommitted endpoint files cite `main.py` mount until commit.
10. **Pytest** — **50 passed**.

### Still open / next build

- Phase 2 **Y-2** Lesson plans
- Manual browser Parent / Student Database / Teacher attendance Pass not claimed



---

## 10 October 2026 (Phase 1)

**Status:** Phase 1 Finance foundation implemented and tested. **45 pytest passed.** Persistence smoke **3/3** on `:8003`. Phase 2 not started.

### Done (Phase 1 only)

1. **Finance Head / Assistant permissions** (roles preserved)
   - `accounthead` = Finance Head: `finance.read` + `collect` + `write` + `approve`
   - `finance_assistant`: `finance.read` + `finance.collect` only (no config write / approve)
   - Seeded `finance.assistant@qmis.edu` (password comes from the local seed settings)
   - Routes wired: collect/send/settle/intent → collect|write; approve/confirm/concessions → approve|write; PUT state → write only

2. **Financial year (April–March)** separate from academic year
   - Table `financial_years` + `/masters/financial-years*` (list/create/get/current/patch/set-current)
   - Seed `FY 2026-27` (2026-04-01 → 2027-03-31)
   - Rejects non April–March ranges
   - Finance snapshot `meta` includes `financialYearId/Name/Start/End` + `financialYearStartMonth=April`

3. **Fee-structure validation (PostgreSQL SoT)**
   - On save: feeCategories / feeStructures / fineRules validated (ids, academicYear, class, non-negative amounts, no duplicate ids)
   - Snapshot still stored in `finance_records` (existing pattern — not a rewrite)

4. **Account Head persistence verification**
   - Pytest: save → new login → GET marker still present
   - Live smoke: `scripts/smoke_accounthead_persistence.py` → **3/3 PASS** (save, re-login, assistant PUT denied)
   - Full Chromium UI click-through: **NOT RUN** this session (no browser E2E harness); API path used as refresh/logout/login evidence

### Missing information (not assumed)

- Concession percentages and approval limits (school)
- Sibling/special concession rules
- Accounting / double-entry chart mapping
- Paytm vs Razorpay final approval (Razorpay left unchanged)
- Live SMTP / WhatsApp credentials
- RFID/eSSL requirement (remains disabled)

### Still open (Phase 2+)

- Core fee collection expansion, refunds, yearly increase
- Live Paytm/SMTP/WhatsApp when approved
- Ops verticals; browser E2E framework

### How to verify

- Head: `accounthead@qmis.edu` (password comes from the local seed settings)
- Assistant: `finance.assistant@qmis.edu` (password comes from the local seed settings)
- `python -m pytest tests/ -q`
- `python scripts/smoke_accounthead_persistence.py http://127.0.0.1:8003`

---

## 10 October 2026 (earlier — demo integrations)

Demo Razorpay/SMTP/WhatsApp + HR↔Finance click-through; RFID off. See prior section in testing report history.
