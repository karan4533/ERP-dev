# Testing report

**Updated:** 2026-11-26\
**Context:** Integration of Finance Wave A (A1–A10) into partner `new-ui/main`, branch `integration/main-finance-2026-11-26` (not pushed)

## Backend (`_integration/ERP_QMIS_main_integration/backend`)

```
python -m pytest tests/ -q
```

| Run | Passed | Failed | Errors | Skipped |
|---|---|---|---|---|
| Partner baseline `new-ui/main` (acb39ed) | 663 | 131 | 8 | 47 |
| Integrated (final) | 701 | 132 | 20 | 35 |

- Every integrated failure also fails on the partner baseline, except one order-dependent coordinator test that fails the same way on the baseline when run alone.
- 12 tests moved from skipped to error only because `node_modules` was linked for the frontend build; with `node_modules` on both trees, `test_frontend_fixes_static.py` gives the same 37 failed / 12 errors on baseline and integrated.
- Finance suites (13 files, 57 tests): 54 passed; the 3 failing gateway tests in `test_finance_actions.py` also fail on the partner baseline.
- New `test_finance_portal_isolation.py`: parent and student get 403 on every campus finance read route and 200 on `/my-fees`.
- `alembic heads`: single head `0028_finance_approval_limits`.

Finance worktree subset for A7–A10 (`_integration/ERP_dev_finance_limits/backend`): 36 passed. Staging smoke A7–A10 on `:8010`: 18/18.

## Read-leak fix on the root finance code (`_integration/ERP_dev_finance_leakfix/backend`)

`python -m pytest tests/ -q --continue-on-collection-errors`

| Run | Passed | Failed | Errors | Skipped |
|---|---|---|---|---|
| Before fix (exact copy of root finance worktree) | 431 | 50 | 1 | 36 |
| After fix | 435 | 49 | 1 | 36 |

- No new failures. Fixed: `test_finance.py::test_parent_fees_are_scoped_and_full_ledger_is_denied`. New `test_finance_portal_isolation.py` (3 tests) passes.
- The 1 error is an existing import problem in `test_w1_role_alignment_and_visitors.py`, the same before and after.
- Staging API on :8010, same 19 campus finance read routes: before the fix, parent and student got 200 on all 19; after, 403 on all 19 and 200 on `/my-fees`. Accounthead and finance assistant: 200 on all 19 both times.

After carrying the fix into the root finance worktree (`_integration/ERP_dev_finance_limits/backend`): the portal isolation, finance, hardening and 10 other finance test files ran together, 48 passed and 0 failed.

## Frontend (integration worktree)

| Check | Partner baseline | Integrated |
|---|---|---|
| `npm test` | 445 tests, 32 failed | 448 tests, 32 failed (same failures) |
| `eslint .` | 83 errors | 83 errors (same) |
| `npm run build` | — | Pass |

Browser click-through: not done.

## Git

`integration/main-finance-2026-11-26` pushed to `new-ui/main` as a fast-forward (acb39ed → f9835b0) after approval. No deploy.
