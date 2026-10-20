# QMIS ERP — Journey Flow Testing Report (Academic · Finance · Transport)

**Document date:** 20 October 2026  
**Owner journey:** Campus walkthrough completed through **User creation policy → Academics → Finance → Transport Manager** (plus Parent/Student Track Bus).  
**Audience:** Testers (manual UAT) and teammate developers finishing leftover ops panels.  
**Stack:** Postgres `@5433` · API `http://127.0.0.1:8000` · App `http://localhost:5173`  
**Pass rule:** After every create/edit/approve — **hard refresh (F5)** — then open the *next* role and confirm the same record.

**Related older guides (still valid for leaf checklists):**
- `reports/QMIS-ERP-Linked-Module-Flow-Test-Guide.md`
- `reports/QMIS-ERP-Full-Panel-Test-Guide.md`
- `reports/QMIS-ERP-Module-Flow-Test-Guide.md`

---

## 0. How testers should use this document

1. Start backend (`cd backend && ./run-local.sh`) and frontend (`npm run dev`).
2. Follow sections **in order** (1 → 2 → 3 → 4). Later roles need data from earlier steps.
3. For each step mark: **Pass / Fail / Blocked** + screenshot or ID (e.g. `RT-1007`, `FE-1003`, receipt no.).
4. Prefer **HR onboarding** for staff logins in “real campus” testing. Admin User Creation is allowed for **speed / smoke** of operational roles (see §1).
5. Leftover roles (Canteen, Driver portal, Gate, Library, Stores, Audit…) are listed in **§5**. Do **not** treat them as “done” from this journey.
6. Teammate finishing leftover panels: copy the **Cursor prompt in §6** into Cursor Agent chat in this repo.

---

## 1. User creation & onboarding policy (test first)

### 1.1 Who may create what (codebase truth)

| Actor | Where | Can create | Cannot create |
|-------|--------|------------|---------------|
| **Super Admin** | User Creation / Admin users API | All Admin-creatable staff roles **+ Administrator** | Privileged carve-outs stay governed by product policy |
| **Administrator** | **RBAC → User Creation** | Operational / academic logins listed below | **Admin, Super Admin, HR, Account Head, Student, Parent, Joint Directors, Auditors** |
| **HR** | Employees · Job → Candidate → **Offer Accepted** · Reset password | Staff login for hired employees (role from offer / employee form, including **Driver**, TM, Teacher, etc.) | Should not be used as “Admin RBAC” for privileged roles |
| **Transport Manager** | Driver Management | **View / export only** — **no Add Driver / no login create** | — |
| **Joint Director** | Drivers List (Employee Management) | **View only** | No create login |
| **PRM** | Admission Enroll | **Student + Parent** logins at enroll | Staff roles |

**Admin User Creation — creatable roles** (`CREATABLE_ROLE_OPTIONS` / `admin_users.STAFF_ROLES`):

- Principal, PRM, Teacher, Coordinator, Librarian  
- Gate Keeper Manager, Gate Keeper  
- Transport Manager, Driver  
- Canteen Manager, IT Support Manager, Stationery Store Manager, Housekeeping Manager  

**Privileged / excluded from Admin create:** Admin, Super Admin, HR, Account Head, Student, Parent, Joint Director family, Process/Quality auditors.

### 1.2 Campus testing policy (what we want testers to follow)

| Mode | Policy |
|------|--------|
| **Preferred (production-like)** | **All staff onboarding comes from HR** (Job → Candidate → Offer **Accepted** → temp password → first-login change → Principal allocation where academic). Parent/Student come from **PRM Enroll**. |
| **Allowed for tester speed** | **Admin (or Super Admin)** may create the **operational roles** listed above so panels can be opened without a full hire chain. Document the login in the test sheet. |
| **Never assume** | TM / JD / Driver screens create ERP logins. They do not. |

### 1.3 Tester checklist — User creation

| ID | Steps | Expected | Pass? |
|----|--------|----------|-------|
| U1 | Admin → RBAC → User Creation → create **Transport Manager** | Login works; lands on `/transport-manager/dashboard` | |
| U2 | Admin → create **Driver** | Login works; lands on Driver portal | |
| U3 | Admin → try create **HR** or **Account Head** | **Blocked / not in creatable list** | |
| U4 | HR → Job → Candidate → Offer **Issued** → **Accepted** with role Teacher (or Driver) | Toast shows **temp password**; employee appears; forced password change on first login | |
| U5 | HR → Employee Profile → Reset password | New temp password; login works | |
| U6 | PRM → Enroll student with parent credentials | Parent + student appear; Parent login works | |
| U7 | TM → Driver Management | List/view only; **no Add Driver** | |

**Seed logins (dev):**

| Role | Email | Password |
|------|-------|----------|
| Administrator | `admin@qmis.edu` | `admin123` |
| Super Admin | `superadmin@qmis.edu` | `superadmin123` |
| HR | `hr@qmis.edu` | `hr12345` |
| Account Head | `accounthead@qmis.edu` | `accounts123` |
| PRM | `prm@qmis.edu` | `prm12345` |
| Principal | `principal@qmis.edu` | `principal123` |
| Director | `director@qmis.edu` | `director123` |
| Coordinator | `coordinator@qmis.edu` | `coord123` |
| Teacher | `teacher@qmis.edu` | `teacher123` |
| Parent / Student | From Enroll | Set at Enroll |
| TM / Driver / Canteen / … | Create via **HR** (preferred) or **Admin User Creation** (smoke) | Temp / set at create |

---

## 2. Academic journey (tested end-to-end linking)

### 2.1 Story map

```text
Admin class masters
        │
        ├─► PRM enquiry → Enroll → Student + Parent logins
        │
        ├─► HR hire Teacher → Principal Allocation + Timetable
        │         │
        │         └─► Teacher: Attendance / Lesson Plan / Marks
        │                   │
        │                   ├─► Coordinator / Director approvals
        │                   └─► Parent / Student see attendance, results, timetable
        │
        └─► Leave / Tasks / Escalations / Announcements (cross-role)
```

### 2.2 Step table

| ID | Who | Screen | Action | Creates / updates | Must reflect on |
|----|-----|--------|--------|-------------------|-----------------|
| A1 | Admin | Class Details / Academic masters | Ensure class + section for year | Class master | PRM enroll, Principal TT |
| A2 | PRM | Admission Enquiry | Add enquiry | Enquiry | Convert |
| A3 | PRM | Admission / Enroll | Convert → Enroll + parent email/password | Student + Parent user | Parent portal, Finance students |
| A4 | HR | Offer Accepted (Teacher) *or* use seed Teacher | Staff login | Teacher can sign in | Principal allocation |
| A5 | Principal | Teacher Allocation + Class Timetable | Assign class/subject/periods | Allocation + TT | Teacher + Parent timetable |
| A6 | Teacher | Class Attendance | Mark attendance for enrolled child | Attendance | Parent Attendance |
| A7 | Teacher | Lesson Plan / Marks | Submit LP / enter marks | LP / results | Coordinator/Director; Parent Results |
| A8 | Coordinator | LP Approval / Period Chart / Attendance monitor | Approve / monitor | Status | Teacher unblocked |
| A9 | Director | Approvals inbox (as used) | Decide pending academic items | Decision | Teacher / exams |
| A10 | Parent / Student | Attendance, Results, Timetable, Notifications | View only | — | Matches Teacher/Principal data |
| A11 | Any staff | Leave / Tasks / Escalation / Announcement | Smoke create | Cross-module rows | Receiver role inbox |

### 2.3 Academic pass criteria

- Same student ID / admission number appears on PRM, Teacher class list, Parent child switcher, Finance fee student.
- Attendance / marks entered by Teacher appear for Parent after refresh.
- LP approval path blocks or unblocks Teacher as designed for your campus config.

---

## 3. Finance journey (Account Head · Parent · Student · Transport fee bridge)

### 3.1 Story map

```text
Account Head fee structures / bootstrap
        │
        ├─► Fee Collection (academic installments)
        │         └─► Parent / Student Fees Payment
        │
        └─► Transport Fee category (+ Class = All + route amount)
                  │
                  └─► TM enrolls student on route
                            └─► Finance installment + Fee Collection (transport scope)
                                      └─► Parent / Student → Transport Payment (not Academic Payment)
```

### 3.2 Step table

| ID | Who | Screen | Action | Expected |
|----|-----|--------|--------|----------|
| F1 | Account Head | Fee Management / Settings | Bootstrap ledger once if empty; ensure **Transport Fee** category | Category visible |
| F2 | Account Head | Fee Management | Transport Fee + **Class = All** + **route** + amount | Route tariff stored; syncs with TM route fees |
| F3 | Account Head | Fee Collection | Collect academic installment for enrolled student | Receipt; Parent Academic Payment shows paid/due |
| F4 | Transport Manager | Student Transport | Enroll student on route/stop | Assignment saved; finance transport installment / collection line appears |
| F5 | Account Head | Fee Collection / student fees | See transport installment | Scope = transport |
| F6 | Parent / Student | **Transport Payment** | Pay / view transport dues | Transport fees **do not** appear under Academic Payment |
| F7 | Parent / Student | Academic Payment | Academic only | No transport lines mixed in |
| F8 | Account Head | Dashboard | KPIs + Recent Collections from live snapshot | No fake collection rows in API mode |
| F9 | Account Head | Dashboard → Recent Expenses | Live OUT txns + transport maintenance + ops expenses | **Not** Metro Supplies / Swift Logistics seed |
| F10 | Account Head | Transport Finance | Maintenance / fleet as wired | Matches Principal-approved / TM posted costs |

### 3.3 Finance pass criteria

- API mode: empty tables stay empty until real posts (no demo seed masquerading as live).
- Transport vs Academic payment split is enforced by `feeScope` / Transport Payment screens.

---

## 4. Transport Manager journey (completed in this phase)

### 4.1 Modules wired to campus ops (live)

| Module | Path | Live behaviour |
|--------|------|----------------|
| Driver Management | `/transport-manager/driver-management` | List/view from `transport-drivers` — **no create login** |
| Vehicle Management | Vehicle CRUD + dropdowns | `transport-vehicles` |
| Route Management | Add/Edit/View route | `transport-routes`; **fees only at route level** (not per stop UI) |
| Route Data / Track | Track by route | ProTrack365 admin panel + plate/IMEI |
| Student Transport | Enroll / edit | `transport-student-assignments` → finance bridge |
| Assign Duty | Duties | `transport-duties` |
| Vehicle Maintenance | Log + service centers | `transport-maintenance` |
| Service Centers | Sidebar CRUD | `transport-service-centers` → maintenance/expense dropdowns |
| Request Approvals | TM approve/reject | `transport-approval-requests` → Principal queue |
| Transport Expenses | Fuel / Service / Other | `transport-expenses`; budget overview from **budget requests + live expense sum** (no ₹4.2L/₹4.8L demo) |
| Leave / Building Maintenance | As present | Follow existing leave / ops patterns |

### 4.2 Approval → Finance chain

```text
TM Vehicle Maintenance / fuel claim
        │
        ▼
TM Request Approvals (Approve)
        │
        ▼
Principal → Transport Approvals (final Approve)
        │
        ├─► transport-expenses (SE-/FE- …)
        └─► Finance transportMaintenance / Day Book expense (as bridged)
                    │
                    └─► Account Head Dashboard Recent Expenses + Transport Finance
```

| ID | Who | Screen | Action | Expected |
|----|-----|--------|--------|----------|
| T1 | TM | Service Centers | Add center | Appears in Vehicle Maintenance + Service Expense dropdowns |
| T2 | TM | Vehicle Management | Add vehicle + driver link | Vehicle on Route / Expense dropdowns |
| T3 | TM | Route Management | Add route + yearly fee; add stops (**location/time only**) | Route list; fee once for all stops |
| T4 | TM | Student Transport | Enroll enrolled academic student | Parent Track Bus assignment; Finance transport fee |
| T5 | TM | Vehicle Maintenance | Create request needing approval | Appears on TM Request Approvals |
| T6 | TM | Request Approvals | Approve | Appears on Principal Transport Approvals |
| T7 | Principal | Transport Approvals | Approve | Expense on TM Transport Expenses + Finance |
| T8 | TM | Transport Expenses | Add Fuel / Service / Other | Persists after F5; Actual budget increases |
| T9 | Account Head | Dashboard Recent Expenses | Refresh | Live rows / empty state — not stationery seed |
| T10 | Parent | Track Bus | Open with enrolled child | Live route card + GPS (parent ProTrack; falls back to fleet admin if parent login denied) |
| T11 | Student | Track Bus / Bus Route Details | Same assignment | Matches TM enrollment |

### 4.3 Transport pass criteria

- API mode: empty expense/budget when nothing posted (banner explains missing budget requests).
- Parent Track Bus shows **assigned** route/vehicle/driver — not static “Route 1 / VH-001” seed.
- Route Add Stops has **no** duplicate yearly/half/quarter/monthly fee fields.

### 4.4 Known limits (document for testers)

- TM **cannot** hire drivers or create Driver ERP accounts.
- ProTrack parent credentials may show “permission denied”; product falls back to school fleet (admin) GPS.
- Transport budget **current/previous** require approved rows in `transport-budget-requests`; otherwise ₹0 is correct.

---

## 5. Leftover roles / panels — NOT completed in this journey

Treat the following as **next testing document** / teammate wiring + UAT. Smoke may exist; full linked flow is **not** signed off here.

| Area | Roles | Suggested next flows |
|------|-------|----------------------|
| **Driver portal** | Driver | My duties, vehicle docs, student bus attendance, leave → visible to TM |
| **Canteen** | Canteen Manager | Menu, inventory, orders, requests → ops `canteen-*` |
| **IT Support** | IT Support Manager | Assets, tickets, requests → `it-*` |
| **Stationery** | Stationery Store Manager | Inventory, requests → `stationery-*` |
| **Housekeeping** | Housekeeping Manager | Schedules, duty, RO, lost & found → `hk-*` |
| **Library** | Librarian | Members, issue/return → Parent/Student borrowed books |
| **Gate** | Gate Keeper, Gate Keeper Manager | Visitors, registers, duty, incidents ← PRM passes |
| **Joint Director / Assistant** | JD, JDA | Meetings, approvals, assets, employee lists (view) |
| **Audit** | JD Audit, Process Auditor, Quality Auditor | Templates → execute → observations → RCA/ATR |
| **Managing Director / Finance Assistant** | If seeded | Governance / finance assist smoke |
| **Deep Admin FO** | Admin Front Office Add Driver UI | Still form shell in places — prefer HR + TM ops data |

**Next doc title suggestion:**  
`QMIS-ERP-Leftover-Ops-Panels-Flow-Testing-Report.md`  
(Cover: Driver → Gate → Library → Canteen → IT → Stationery → HK → JD/Audit.)

---

## 6. Prompt for teammate (paste into Cursor Agent)

Copy everything inside the fence into a **new Cursor Agent chat** opened on the `ERP-dev` workspace.

```text
You are continuing QMIS ERP campus wiring in this repo (ERP-dev).

CONTEXT — already completed and signed for testing (do NOT regress):
1) User creation policy: Admin RBAC User Creation can create operational staff roles (Principal, PRM, Teacher, Coordinator, Librarian, Gate roles, Transport Manager, Driver, Canteen/IT/Stationery/HK managers). Privileged roles (Admin, Super Admin, HR, Account Head, Student, Parent, JD family, auditors) are NOT Admin-creatable. Preferred production path: HR Job→Candidate→Offer Accepted creates staff logins + temp password; PRM Enroll creates Parent/Student. Transport Manager Driver Management is VIEW ONLY — no driver account create.
2) Academic linked flow: Admin masters → PRM Enroll → HR Teacher → Principal allocation/timetable → Teacher attendance/LP/marks → Coordinator/Director approvals → Parent/Student views.
3) Finance: Account Head fee structures, Transport Fee + Class=All + route amounts, Fee Collection, Parent/Student Academic vs Transport Payment split (feeScope), dashboard live KPIs/collections/expenses (no Metro Supplies seed in API mode).
4) Transport Manager live ops: vehicles, drivers list, routes (fees at route level only; stops = location/time), student transport enrollment → finance transport fee bridge, service centers CRUD, vehicle maintenance → TM Request Approvals → Principal Transport Approvals → transport-expenses + finance maintenance, Transport Expenses fuel/service/other to campus ops, budget overview from transport-budget-requests + live expense sums (no demo ₹4.2L/₹4.8L), Parent/Student Track Bus from enrollment + ProTrack with admin fallback.

READ FIRST:
- reports/QMIS-ERP-Journey-Flow-Testing-Report-20oct.md (this journey + leftover list)
- reports/QMIS-ERP-Linked-Module-Flow-Test-Guide.md
- backend/app/services/ops_collections.py (writers/readers per collection prefix)
- src/services/campusJsonStore.js + campusCollectionRegistry.js
- src/Pages/TransportManager/transportCampus.js (API mode must NOT inject demo seed)

YOUR JOB — leftover panels, same patterns as Transport:
Wire each remaining ops area to campus API (hydrate/save via ops collections), stop demo seed in API mode, cross-link roles, and keep UI empty-state when no data.

Priority order:
A) Driver portal — duties/attendance/docs must read same transport-* collections TM writes; leave to TM/Principal received leave.
B) Gate Keeper + Gate Keeper Manager — gate-* collections; PRM gate passes must appear on Gate lists.
C) Librarian — library-* ; issue to enrolled student; Parent/Student borrowed books.
D) Canteen Manager — canteen-* menu/inventory/orders/requests.
E) IT Support Manager — it-* assets/tickets/requests.
F) Stationery Store Manager — stationery-*.
G) Housekeeping Manager — hk-*.
H) Joint Director / Assistant / Audit chain — jd-* and campus-audit collections; do not invent parallel localStorage SoTs.

RULES:
- Match existing Transport/Finance patterns: getTransportRows-style helpers, hydrateFromApi, persistCampusJson, toast api vs local, hard-refresh safe.
- In API mode never ensureCampusSeed demo rows into DB.
- Do not add Admin/TM “create driver login” unless product asks; HR/Admin User Creation remains account source.
- After each area, add a short tester checklist (Who → Screen → Action → Reflects on) into reports/QMIS-ERP-Leftover-Ops-Panels-Flow-Testing-Report.md (create that file).
- Prefer small focused diffs; no drive-by refactors; no new markdown except the leftover test report and necessary code comments.
- Run/fix against local ./run-local.sh API when possible.

Start by auditing which leftover sidebars still use static arrays vs campusJsonStore, then implement Driver + Gate first end-to-end, then Library, then stores (Canteen/IT/Stationery/HK), then JD/Audit.
```

---

## 7. Sign-off sheet (this journey)

| Stream | Status | Tester initials | Date |
|--------|--------|-----------------|------|
| §1 User creation policy | ☐ Pass ☐ Fail | | |
| §2 Academic linked flow | ☐ Pass ☐ Fail | | |
| §3 Finance (+ transport fee split) | ☐ Pass ☐ Fail | | |
| §4 Transport Manager full chain | ☐ Pass ☐ Fail | | |
| §4 Parent/Student Track Bus | ☐ Pass ☐ Fail | | |
| §5 Leftover roles | **Out of scope this doc** | | |

**Notes / defects:**

| ID | Severity | Module | Summary | Status |
|----|----------|--------|---------|--------|
| | | | | |

---

*End of Journey Flow Testing Report — 20 Oct 2026.*
