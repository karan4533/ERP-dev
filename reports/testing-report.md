# Testing report

Project: Queen Mira International School ERP  
Last run: 9 October 2026, after P0-9 masters closeout  
Result: **40 passed, 0 failed** (pytest, ~22 seconds)  
Kind of test: API unit/integration + chained E2E (`test_e2e_campus_flow.py`).

## Commands

From the `backend` folder:

```
python -m pytest tests/ -q
python scripts/smoke_campus_flow.py http://127.0.0.1:8001
```

(Live smoke needs a running API; use SQLite `:8001` if Postgres `:8000` is down.)

## Coverage by phase

| Phase / owner | What was tested | Result |
|---|---|---|
| Phase 0 (shared) | Health, login, `/auth/me`, OTP, masters (years/classes/sections/subjects), audit | Passed |
| Phase 1 / Admissions | Enquiry → convert → enroll + parent | Passed |
| Partner HR | Staff, leave, payroll lock, concessions, files | Passed |
| Finance | Snapshot, actions, stub receipt (not delivered) | Passed |
| HR ↔ Finance | Apply concessions + payroll voucher (API) | Passed |
| Campus E2E | One chained Phase0→Finance journey | Passed |

## Pytest modules (40)

| Suite | Count | Notes |
|---|---|---|
| `test_phase0.py` | 7 | Foundation + academic year set-current |
| `test_admissions.py` | 2 | Rich admissions |
| `test_hr.py` + `test_hr_modules.py` | 23 | Partner HR vertical |
| `test_finance.py` + `test_finance_actions.py` | 6 | Snapshot + actions (stub delivery) |
| `test_e2e_campus_flow.py` | 1 | Chained Phase0→Finance |
| *(+ masters year/section asserts inside phase0)* | | |

## API SoT cutover

See `backend/docs/API_SOT_CUTOVER.md`.

| Check | Expected |
|---|---|
| Clear site localStorage | Employees / payroll / fee collections still on API after re-login |
| HR API down | HR portal shows error — does not keep working from cache as SoT |
| Finance API down | Account Head shows error — no demo seed restore path |
| Receipt WhatsApp/email | `queued_stub`, delivered=false |

## Not covered by this run

- Real browser click-through (Postgres API on `:8000`)
- Real payment gateway / SMTP / WhatsApp keys
- RFID / eSSL, Academics, Ops verticals
