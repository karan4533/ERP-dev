# Testing report

**Date:** 19 November 2026  
**Context:** Transport Manager SQLite concurrency crash fix  
**Scope:** Local only — no commit/push

## Root cause (evidence)

- Crash path: concurrent browser GETs after TM login → `sqlite3.InterfaceError` → process exit `3221225477`.
- Request deps/endpoints use `app.core.database`, which used **StaticPool** (one shared connection) with `check_same_thread=False`.
- FastAPI runs sync routes in worker threads → shared sqlite3 connection across threads.
- Earlier `QueuePool(pool_size=1)` on `app.db.session` did **not** fix the crash (wrong engine; audit middleware only).

## SQLite configuration

| | Before | After |
|---|---|---|
| File SQLite (local uvicorn) | `StaticPool` + `check_same_thread=False` | **`NullPool`** + `check_same_thread=False` + `timeout=30` |
| `:memory:` (pytest) | `StaticPool` | **`StaticPool`** (unchanged — required for shared memory DB) |
| Dual engines | `core.database` ≠ `db.session` | `db.session` re-exports `core.database` engine/SessionLocal/get_db |

**Why NullPool:** each Session opens/closes its own connection; no cross-thread reuse of one sqlite3 connection. Appropriate for file SQLite under threaded ASGI. Not a production Postgres change.

## Concurrent tests

| Suite | Result |
|---|---|
| `tests/test_sqlite_concurrency.py` (alone) | **3 passed** |
| Live uvicorn `127.0.0.1:8001` — 64 parallel authenticated GETs | transport **200**, finance/admin **403**, post-burst GET **200** |
| Mixed pytest StaticPool + threaded burst (pre-skip) | reproduced AV — confirms StaticPool hazard |

## Regression

| Suite | Result |
|---|---|
| `test_transport_manager_apis` + hostel + ops | **13 passed** |
| ops + security_p0 + phase0 + demo_integrations | **67 passed** |
| FE `npm run build` | **Pass** |

## Browser UAT — Transport Manager (post-fix)

| # | Check | Result | Notes |
|---|---|---|---|
| 1 | Login + TM sidebar | **Pass** | `transportmanager@qmis.edu` |
| 2 | LIVE banner + dashboard counts | **Pass** | Drivers 2 after create |
| 3 | Drivers list UI | **Pass** | `TDR-UAT-LOCAL`, `TDR-0002` |
| 4 | Vehicles list UI | **Pass** | Empty table, no fake counts |
| 5 | Routes list UI | **Pass** | Empty / form present |
| 6 | Student assignments UI | **Pass** | Live banner + empty table |
| 7 | Duties UI | **Pass** | Live banner; driver dropdown shows Local UAT |
| 8 | Create local test record | **Pass** | UI save ConcFix Driver → `TDR-0002` |
| 9 | Refresh persistence | **Pass** | Dashboard Drivers=2; API list confirms |
| 10 | Finance/Admin denied | **Pass** | **403** |
| 11 | GPS / maintenance / approvals / expenses / NOC | **Pass** | Still MOCK/BLOCKED; banner honest |

Repeated SPA navigation + dashboard refresh: API stayed alive (no InterfaceError / no process death).

## Remaining limitations

- Local file SQLite remains single-writer; heavy write contention can still serialize/lock (not the prior AV crash).
- Port `8000` was unavailable on this machine (`WinError 10013`); UAT used **8001**.
- GPS Route Data / Maintenance / Approvals / Expenses / NOC not LIVE.
- Changes uncommitted/unpushed pending approval.
