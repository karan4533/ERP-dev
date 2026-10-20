# QMIS ERP — Tester Journey Flow Guide

**Document date:** 20 October 2026  
**Audience:** Manual UAT testers  
**Journey covered:** User creation policy → Academics → Finance → Transport Manager → Parent/Student Track Bus  
**Stack:** Postgres `@5433` · API `http://127.0.0.1:8000` · App `http://localhost:5173`  

**Pass rule:** After every create / edit / approve — **hard refresh (F5)** — then open the *next* role and confirm the same record.

---

## How to use this guide

1. Start backend (`cd backend && ./run-local.sh`) and frontend (`npm run dev`).
2. Follow sections **in order** (1 → 2 → 3 → 4). Later roles need data from earlier steps.
3. For each step mark: **Pass / Fail / Blocked** + screenshot or ID (e.g. `RT-1007`, `FE-1003`, receipt no.).
4. Prefer **HR onboarding** for staff logins in “real campus” testing. Admin User Creation is allowed for **speed / smoke** of operational roles (see §1).
5. Roles such as Canteen, Driver portal, Gate, Library, Stores, and Audit are **out of scope** for this document (listed briefly at the end).

---

## Seed logins (development)

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

## 1. User creation & onboarding (test first)

### 1.1 Who may create what

| Actor | Where | Can create | Cannot create |
|-------|--------|------------|---------------|
| **Super Admin** | User Creation | Admin-creatable staff roles **+ Administrator** | Follow product policy for other privileged roles |
| **Administrator** | **RBAC → User Creation** | Operational / academic logins listed below | **Admin, Super Admin, HR, Account Head, Student, Parent, Joint Directors, Auditors** |
| **HR** | Employees · Job → Candidate → **Offer Accepted** · Reset password | Staff login for hired employees (including **Driver**, TM, Teacher, etc.) | Not for Parent/Student (use PRM Enroll) |
| **Transport Manager** | Driver Management | **View / export only** | No Add Driver / no login create |
| **Joint Director** | Drivers List | **View only** | No create login |
| **PRM** | Admission Enroll | **Student + Parent** logins | Staff roles |

**Admin User Creation — creatable roles:**

- Principal, PRM, Teacher, Coordinator, Librarian  
- Gate Keeper Manager, Gate Keeper  
- Transport Manager, Driver  
- Canteen Manager, IT Support Manager, Stationery Store Manager, Housekeeping Manager  

### 1.2 Testing policy

| Mode | Policy |
|------|--------|
| **Preferred (production-like)** | **All staff onboarding from HR** (Job → Candidate → Offer **Accepted** → temp password → first-login change). Parent/Student from **PRM Enroll**. |
| **Allowed for tester speed** | **Admin / Super Admin** may create the operational roles above so panels can be opened quickly. Record the login in your sheet. |
| **Never assume** | TM / JD / Driver screens create ERP logins. They do not. |

### 1.3 Checklist

| ID | Steps | Expected | Pass? |
|----|--------|----------|-------|
| U1 | Admin → RBAC → User Creation → create **Transport Manager** | Login works; `/transport-manager/dashboard` | |
| U2 | Admin → create **Driver** | Login works; Driver portal | |
| U3 | Admin → try create **HR** or **Account Head** | **Blocked / not in creatable list** | |
| U4 | HR → Offer **Accepted** (Teacher or Driver) | Toast shows **temp password**; forced password change on first login | |
| U5 | HR → Employee Profile → Reset password | New temp password works | |
| U6 | PRM → Enroll student with parent credentials | Parent + student login work | |
| U7 | TM → Driver Management | List/view only; **no Add Driver** | |

---

## 2. Academic journey

### Story map

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

### Steps

| ID | Who | Screen | Action | Must reflect on |
|----|-----|--------|--------|-----------------|
| A1 | Admin | Class Details / masters | Ensure class + section | PRM enroll, Principal TT |
| A2 | PRM | Admission Enquiry | Add enquiry | Convert |
| A3 | PRM | Admission / Enroll | Enroll + parent email/password | Parent portal, Finance students |
| A4 | HR | Offer Accepted (Teacher) *or* seed Teacher | Staff login | Principal allocation |
| A5 | Principal | Teacher Allocation + Timetable | Assign class/subject/periods | Teacher + Parent timetable |
| A6 | Teacher | Class Attendance | Mark attendance | Parent Attendance |
| A7 | Teacher | Lesson Plan / Marks | Submit LP / enter marks | Coordinator/Director; Parent Results |
| A8 | Coordinator | LP Approval / monitors | Approve / monitor | Teacher unblocked |
| A9 | Director | Approvals inbox | Decide pending items | Teacher / exams |
| A10 | Parent / Student | Attendance, Results, Timetable | View | Matches Teacher/Principal data |
| A11 | Any staff | Leave / Tasks / Escalation / Announcement | Smoke create | Receiver inbox |

### Pass criteria

- Same student ID / admission number on PRM, Teacher class list, Parent child switcher, Finance.
- Attendance / marks by Teacher appear for Parent after refresh.

---

## 3. Finance journey

### Story map

```text
Account Head fee structures / bootstrap
        │
        ├─► Fee Collection (academic)
        │         └─► Parent / Student Academic Payment
        │
        └─► Transport Fee (+ Class = All + route amount)
                  │
                  └─► TM enrolls student on route
                            └─► Finance transport installment
                                      └─► Parent / Student → Transport Payment
```

### Steps

| ID | Who | Screen | Action | Expected |
|----|-----|--------|--------|----------|
| F1 | Account Head | Fee Management / Settings | Bootstrap if empty; ensure **Transport Fee** | Category visible |
| F2 | Account Head | Fee Management | Transport Fee + **Class = All** + **route** + amount | Route tariff stored |
| F3 | Account Head | Fee Collection | Collect academic installment | Receipt; Parent Academic Payment updates |
| F4 | Transport Manager | Student Transport | Enroll student on route/stop | Finance transport installment appears |
| F5 | Account Head | Fee Collection | See transport installment | Scope = transport |
| F6 | Parent / Student | **Transport Payment** | View / pay transport dues | Transport fees **not** under Academic Payment |
| F7 | Parent / Student | Academic Payment | Academic only | No transport lines mixed in |
| F8 | Account Head | Dashboard | Live KPIs + Recent Collections | No fake collection rows in API mode |
| F9 | Account Head | Dashboard → Recent Expenses | Live outflows / maintenance / transport ops | **Not** Metro Supplies / Swift Logistics seed |
| F10 | Account Head | Transport Finance | Maintenance / fleet | Matches Principal-approved / TM costs |

---

## 4. Transport Manager journey

### Modules (live campus ops)

| Module | What to verify |
|--------|----------------|
| Driver Management | List/view only — **no create login** |
| Vehicle Management | Add vehicle; appears on Route / Expense dropdowns |
| Route Management | Fees **only at route level**; stops = location + times only |
| Student Transport | Enroll → Parent Track Bus + Finance transport fee |
| Service Centers | CRUD → dropdowns in Maintenance / Service Expense |
| Vehicle Maintenance → Request Approvals | TM approve → Principal queue |
| Principal Transport Approvals | Final approve → expenses + Finance |
| Transport Expenses | Fuel / Service / Other persist after F5; budget Actual updates |
| Parent / Student Track Bus | Live assignment + GPS (fleet fallback if parent ProTrack fails) |

### Approval chain

```text
TM Maintenance / fuel claim
        → TM Request Approvals (Approve)
        → Principal Transport Approvals (Approve)
        → transport-expenses + Finance
        → Account Head Dashboard / Transport Finance
```

### Steps

| ID | Who | Screen | Action | Expected |
|----|-----|--------|--------|----------|
| T1 | TM | Service Centers | Add center | In Maintenance + Service Expense dropdowns |
| T2 | TM | Vehicle Management | Add vehicle | On Route / Expense dropdowns |
| T3 | TM | Route Management | Add route + yearly fee; stops without fee fields | Route saved |
| T4 | TM | Student Transport | Enroll academic student | Parent Track Bus + Finance transport fee |
| T5 | TM | Vehicle Maintenance | Create approval request | On TM Request Approvals |
| T6 | TM | Request Approvals | Approve | On Principal Transport Approvals |
| T7 | Principal | Transport Approvals | Approve | Expense + Finance updated |
| T8 | TM | Transport Expenses | Add Fuel / Service / Other | Persists after F5 |
| T9 | Account Head | Recent Expenses | Refresh | Live / empty — not stationery seed |
| T10 | Parent | Track Bus | Open enrolled child | Live route card + GPS |
| T11 | Student | Track Bus / Bus Route Details | Same assignment | Matches TM enrollment |

### Known limits

- TM **cannot** hire drivers or create Driver ERP accounts.
- Budget Previous/Current stay **₹0** until approved `transport-budget-requests` exist (correct behaviour).
- ProTrack parent login may fall back to school fleet GPS.

---

## 5. Out of scope for this tester pack

Do **not** mark these as passed from this journey alone. They belong to the next leftover-ops pack:

- Driver portal (duties, bus attendance, vehicle docs)
- Canteen, IT Support, Stationery, Housekeeping managers
- Librarian; Gate Keeper / Gate Keeper Manager
- Joint Director / Assistant / Audit chain

---

## Sign-off

| Stream | Status | Tester | Date |
|--------|--------|--------|------|
| §1 User creation | ☐ Pass ☐ Fail | | |
| §2 Academic | ☐ Pass ☐ Fail | | |
| §3 Finance | ☐ Pass ☐ Fail | | |
| §4 Transport Manager | ☐ Pass ☐ Fail | | |
| §4 Parent/Student Track Bus | ☐ Pass ☐ Fail | | |

**Defects**

| ID | Severity | Module | Summary | Status |
|----|----------|--------|---------|--------|
| | | | | |

---

*End of Tester Journey Flow Guide — 20 Oct 2026.*
