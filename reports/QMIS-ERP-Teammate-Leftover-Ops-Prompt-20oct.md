# QMIS ERP — Teammate Handoff: Leftover Ops Panels + Cursor Prompt

**Document date:** 20 October 2026  
**Audience:** Teammate developers finishing panels **not** covered in the completed journey  
**Repo:** `ERP-dev`  
**Companion tester PDF:** `QMIS-ERP-Tester-Journey-Flow-20oct.pdf`

---

## 1. What is already done (do not regress)

Your teammate completed and handed to testers:

1. **User creation policy**  
   - Admin RBAC User Creation → operational staff roles only (Principal, PRM, Teacher, Coordinator, Librarian, Gate roles, Transport Manager, Driver, Canteen/IT/Stationery/HK managers).  
   - **Not** Admin-creatable: Admin, Super Admin, HR, Account Head, Student, Parent, JD family, auditors.  
   - Preferred production path: **HR** Job → Candidate → Offer Accepted (temp password).  
   - Parent/Student: **PRM Enroll**.  
   - TM Driver Management = **view only** (no login create).

2. **Academic linked flow**  
   Admin masters → PRM Enroll → HR Teacher → Principal allocation/timetable → Teacher attendance/LP/marks → Coordinator/Director → Parent/Student views.

3. **Finance**  
   Fee structures, Transport Fee + Class=All + route amounts, Fee Collection, Academic vs Transport Payment split (`feeScope`), live dashboard (no Metro Supplies seed in API mode).

4. **Transport Manager (live campus ops)**  
   Vehicles, drivers list, routes (fees at route level only; stops = location/time), student transport → finance transport fee, service centers CRUD, maintenance → TM approvals → Principal approvals → expenses + finance, Transport Expenses (fuel/service/other), budget from `transport-budget-requests` + live expense sums, Parent/Student Track Bus + ProTrack (admin fallback).

**Read:** `reports/QMIS-ERP-Tester-Journey-Flow-20oct.md` (tester pack) and this file.

---

## 2. Your job — leftover panels

Wire each area like Transport: campus ops hydrate/save, **no demo seed in API mode**, empty states when empty, cross-role reflect.

| Priority | Area | Roles | Collections / notes |
|----------|------|-------|---------------------|
| A | Driver portal | Driver | Same `transport-*` TM writes; leave → TM/Principal |
| B | Gate | Gate Keeper, Gate Keeper Manager | `gate-*`; PRM passes must appear |
| C | Library | Librarian | `library-*`; Parent/Student borrowed books |
| D | Canteen | Canteen Manager | `canteen-*` |
| E | IT Support | IT Support Manager | `it-*` |
| F | Stationery | Stationery Store Manager | `stationery-*` |
| G | Housekeeping | Housekeeping Manager | `hk-*` |
| H | JD / Audit | JD, JDA, JD Audit, Process/Quality Auditor | `jd-*` + campus-audit |

After each area, add a short tester checklist to:

`reports/QMIS-ERP-Leftover-Ops-Panels-Flow-Testing-Report.md` (create if missing).

---

## 3. Code patterns to follow

- `src/services/campusJsonStore.js` + `campusCollectionRegistry.js`
- `backend/app/services/ops_collections.py` (writers/readers)
- Transport pattern: `src/Pages/TransportManager/transportCampus.js` — API mode must **not** inject demo seed
- Toast api vs local; hard-refresh safe; small focused diffs

**Do not:** add Admin/TM “create driver login” unless product asks; invent parallel localStorage SoTs; drive-by refactors.

---

## 4. Cursor Agent prompt (copy everything below)

Open a **new Cursor Agent chat** on the `ERP-dev` workspace and paste:

```text
You are continuing QMIS ERP campus wiring in this repo (ERP-dev).

CONTEXT — already completed and signed for testing (do NOT regress):
1) User creation policy: Admin RBAC User Creation can create operational staff roles (Principal, PRM, Teacher, Coordinator, Librarian, Gate roles, Transport Manager, Driver, Canteen/IT/Stationery/HK managers). Privileged roles (Admin, Super Admin, HR, Account Head, Student, Parent, JD family, auditors) are NOT Admin-creatable. Preferred production path: HR Job→Candidate→Offer Accepted creates staff logins + temp password; PRM Enroll creates Parent/Student. Transport Manager Driver Management is VIEW ONLY — no driver account create.
2) Academic linked flow: Admin masters → PRM Enroll → HR Teacher → Principal allocation/timetable → Teacher attendance/LP/marks → Coordinator/Director approvals → Parent/Student views.
3) Finance: Account Head fee structures, Transport Fee + Class=All + route amounts, Fee Collection, Parent/Student Academic vs Transport Payment split (feeScope), dashboard live KPIs/collections/expenses (no Metro Supplies seed in API mode).
4) Transport Manager live ops: vehicles, drivers list, routes (fees at route level only; stops = location/time), student transport enrollment → finance transport fee bridge, service centers CRUD, vehicle maintenance → TM Request Approvals → Principal Transport Approvals → transport-expenses + finance maintenance, Transport Expenses fuel/service/other to campus ops, budget overview from transport-budget-requests + live expense sums (no demo ₹4.2L/₹4.8L), Parent/Student Track Bus from enrollment + ProTrack with admin fallback.

READ FIRST:
- reports/QMIS-ERP-Teammate-Leftover-Ops-Prompt-20oct.md
- reports/QMIS-ERP-Tester-Journey-Flow-20oct.md
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

## 5. Suggested delivery order for you

1. Paste §4 prompt into Cursor → audit leftovers.  
2. Ship **Driver + Gate** with a short tester checklist.  
3. Ship **Library**, then **Canteen / IT / Stationery / HK**.  
4. Ship **JD / Audit**.  
5. Update `QMIS-ERP-Leftover-Ops-Panels-Flow-Testing-Report.md` continuously so testers can start without waiting for all areas.

---

*End of Teammate Handoff — 20 Oct 2026.*
