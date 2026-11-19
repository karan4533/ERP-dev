# Testing report

**Date:** 19 November 2026  
**Context:** Regression fixes + Hostel Warden ops LIVE checkpoint  
**Scope:** Local only — no commit/push

## Backend

| Suite | Passed | Failed | Notes |
|---|---|---|---|
| Broader regression (hostel warden + admissions + parent TC + attendance + HR + finance + finance_actions + phase1 finance + ops/audit + front office + leave + auth static + admin users + teacher + coordinator + principal) | **93** | **0** | Ran to completion |
| Earlier focused: hostel + admissions + TC + attendance + finance_actions + HR + ops + leave + auth + teacher + coordinator + principal + FO | **53** | **0** | Pre-final pack |
| `test_admin_users::test_creatable_roles_for_admin` + finance packs | **16** | **0** | After adding `hostelwarden` to expected creatable set |
| Hostel Warden API (`test_hostel_warden_apis`) | **3** | **0** | assign/list, teacher 403 write, finance/admin 403 |

### Fixes verified

| Area | Result |
|---|---|
| Admissions `student_account_email` | **Pass** — schema fields + enroll soft-skip without password |
| Parent TC | **Pass** — cascading admissions AttributeError resolved |
| Attendance | **Pass** — pending+placed roster (not admissions cascade only) |
| HR vertical | **Pass** — no `409 already_exists` on this run |
| Finance / Razorpay | **Pass** — `NOT_CONFIGURED`/503 expectations; no fake payments |
| Librarian/ops | Covered via `test_ops_and_audit_collections` in 93-pass pack |
| PRM / FO | Covered via `test_front_office_api` in 93-pass pack |
| Shared RBAC / auth static | Covered via `test_frontend_auth_static` + role portal suites |

## Frontend

| Check | Result |
|---|---|
| `npm run build` (ERP_QMIS) | **Pass** (~70s, exit 0) |

## Browser / API UAT (Hostel Warden)

| Check | Result |
|---|---|
| Login `hostelwarden@qmis.edu` / `hostelwarden123` | **Pass** → `/hostel-warden/dashboard` + Live banner |
| Dashboard Live counts | **Pass** — Active residents **1** after API seed |
| Assign Fee Child A-202/B2 via UI | **Pass** — persisted `HAS-0002` |
| Payments page Live | **Pass** — resident options include Fee Child |
| Vacate (API) + teacher PUT assignments | **Pass** / teacher **403** |
| Warden finance/state + admin/users | **403** |

## Coverage notes

- Do not invent `/api/v1/hostel/*`; LIVE scope is ops collections only.
- Outpass, visitors, mess, room masters remain **BLOCKED** (no API).
- PRM uncommitted work preserved alongside Hostel Warden FE/BE changes.
