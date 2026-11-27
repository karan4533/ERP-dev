# Testing report

**Updated:** 2026-11-27\
**Context:** Frontend (`src/`) aligned to the QMIS API-wired code; backend `backend/` equals `Heuristic-Labs/QMIS` `main`, running against PostgreSQL `qmis_erp_staging`.

## Backend (`backend`, `python -m pytest tests/ -q`)

| Run | Passed | Failed | Skipped |
|---|---|---|---|
| Files up to `test_staff_reconciliation.py` (stopped on first failure) | 954 | 1 | 38 |
| Files after `test_staff_reconciliation.py` (13 files) | 89 | 0 | 0 |
| Total | 1043 | 1 | 38 |

- The one failure is `test_staff_reconciliation.py::test_excel_122_body_resolves_to_120_staff_aligned_with_seed`. It needs `docs/_import_staff_to_hr_seed.py` and the client Excel files, which are not in this checkout.
- The static frontend tests (`test_frontend_*_static.py`) pass against the QMIS pages now in `src/`.

## Frontend

| Check | Result |
|---|---|
| `vite build` | Pass (built in about 52 s) |
| `npm test` (`node --test`) | 212 passed, 71 failed (283 tests) |

- All 283 frontend tests are irul-only. QMIS ships no tests in `src/`.
- The 71 failures assert irul-only UI (responsive/"honest integration" markup, enterprise task, library, activities and navigation modules). Those pages and modules were replaced by the QMIS versions, so the tests need to be deleted or rewritten.
- Live API: `GET /health` returns `ok` on `http://127.0.0.1:8000`. Per-role click-through of each portal against live data has not been run yet.
