# Cursor continue prompt — paste on any PC after pull

Open **ERP-dev** in Cursor → new **Agent** chat → paste the block below.

Also pull first:

```bash
git checkout main
git pull origin main
```

Backup branch (same commit): `backup/journey-transport-finance-20oct`

---

## Prompt (copy from next line to end of fence)

```text
You are working in the QMIS ERP repo (ERP-dev) on the updated campus codebase as of 20 Oct 2026 (main / backup/journey-transport-finance-20oct).

GOAL FOR THIS SESSION
Either: (A) continue leftover ops wiring for my teammate, or (B) help me resume testing / fix regressions from the completed journey. Read the docs first, then ask which track if unclear.

READ THESE FIRST (source of truth for what was finished):
- reports/QMIS-ERP-Tester-Journey-Flow-20oct.md (+ .pdf)
- reports/QMIS-ERP-Teammate-Leftover-Ops-Prompt-20oct.md (+ .pdf) — includes leftover Cursor prompt
- reports/QMIS-ERP-Journey-Flow-Testing-Report-20oct.md — combined journey report
- reports/QMIS-ERP-Linked-Module-Flow-Test-Guide.md
- backend/app/services/ops_collections.py
- src/services/campusJsonStore.js
- src/services/campusCollectionRegistry.js
- src/Pages/TransportManager/transportCampus.js

COMPLETED — DO NOT REGRESS
1) User creation: Admin RBAC User Creation can create operational roles only (Principal, PRM, Teacher, Coordinator, Librarian, Gate Keeper/Manager, Transport Manager, Driver, Canteen/IT/Stationery/HK managers). NOT Admin-creatable: Admin, Super Admin, HR, Account Head, Student, Parent, JD family, auditors. Preferred staff path = HR Job→Candidate→Offer Accepted (temp password). Parent/Student = PRM Enroll. TM Driver Management = view only (no create login).
2) Academics linked: Admin masters → PRM Enroll → HR Teacher → Principal allocation/timetable → Teacher attendance/LP/marks → Coordinator/Director → Parent/Student views.
3) Finance: Transport Fee + Class=All + route amounts; Fee Collection; Academic vs Transport Payment split (feeScope / feePaymentScope.js); Account Head dashboard live KPIs/collections/expenses (no Metro Supplies seed in API mode); transport fee bridge from TM enrollment.
4) Transport Manager live ops: transportCampus + ops collections for vehicles, drivers, routes (route-level fees only; stops = location/time — RouteStopsEditor), student transport + transportFeeFinanceBridge, service centers CRUD, maintenance → TM Request Approvals → Principal TransportApprovals → transportApprovalFinanceBridge → expenses/finance, Transport Expenses fuel/service/other + transportBudget from budget-requests + live sums (no demo ₹4.2L/₹4.8L), Parent/Student Track Bus via studentBusAssignment + useProtrackLive (parent panel with admin fallback in protrack.py).

KEY NEW / TOUCHED PATHS
- src/Pages/TransportManager/transportCampus.js
- src/Pages/TransportManager/ServiceCenters/
- src/Pages/Principal/TransportApprovals/
- src/Pages/TransportManager/RequestApprovals/transportApprovalFinanceBridge.js
- src/Pages/TransportManager/StudentTransport/transportFeeFinanceBridge.js
- src/Pages/Student/Transport/studentBusAssignment.js
- src/Pages/Student/PaymentDetails/feePaymentScope.js
- src/Pages/AccountHead/FeesManagement/transportRouteFeeSync.js
- src/Pages/AccountHead/Dashboard/Dashboard.jsx (live Recent Expenses)
- backend/app/services/protrack.py (parent→admin fallback)
- reports/*20oct* tester + teammate PDFs

LEFTOVER WORK (teammate track) — same patterns as Transport:
A) Driver portal  B) Gate  C) Library  D) Canteen  E) IT  F) Stationery  G) Housekeeping  H) JD/Audit
Write checklists into reports/QMIS-ERP-Leftover-Ops-Panels-Flow-Testing-Report.md

RULES
- API mode: never inject demo seed into campus DB (follow transportCampus / hydrateCampusKey with empty seed).
- Match get*Rows + hydrateFromApi + persistCampusJson; toast api vs local; hard-refresh safe.
- Small focused diffs; no drive-by refactors; no new markdown except leftover test report unless asked.
- Stack: Postgres @5433, API :8000, app :5173, backend ./run-local.sh

After reading the docs, summarize what you understood in 5 bullets, then wait for whether I want leftover wiring, a test bugfix, or a specific module.
```
