# Finance — frontend analysis & build plan

Date: 2026-10-09  
Stack: UUID FastAPI (`main`) + Account Head React screens

## Frontend truth

| Surface | Path | Data |
|---|---|---|
| Fees, receipts, books, settings | `/account-head/*` | `FinanceContext` ↔ `/api/v1/finance/state` |
| Transport / Wallet / Approvals | Account Head modules | Snapshot keys `transportFleet`, `wallets`, `walletRecharges`, `approvals` |
| SuperAdmin finance | `/super-admin/finance/*` | Live pull via `pullFinanceState()` when API on |
| Flag | `VITE_USE_API_FINANCE` (default **true**) | localStorage dual-written as cache until production cutover |

### Collections persisted in the snapshot

`students`, `feeCategories`, `feeStructures`, `fineRules`, `bankAccounts`, `posTerminals`, `concessions`, `installments`, `annualBudget`, `transactions`, `receipts`, `cheques`, `paymentLinks`, `auditLog`, `glEntries`, `dayBookEntries`, `cashBookEntries`, `bankBookEntries`, `onlineBookEntries`, `reconciliationItems`, `activityFees`, `wallets`, `walletRecharges`, `transportFleet`, `approvals`, `sequence`, `meta`

## Server actions (authoritative when API on)

| Action | Route |
|---|---|
| Collect fee payment | `POST /api/v1/finance/actions/collect-payment` |
| Settle cheque | `POST /api/v1/finance/actions/settle-cheque` |
| Send receipt (WhatsApp/email stub) | `POST /api/v1/finance/actions/send-receipt` |
| Gateway payment intent (stub) | `POST /api/v1/finance/actions/gateway-intent` |
| Apply HR staff-child concessions | `POST /api/v1/finance/actions/apply-hr-concessions` |
| Post payroll voucher | `POST /api/v1/finance/actions/post-payroll-voucher` (also on HR payroll-months Paid) |
| Decide approval | `POST /api/v1/finance/actions/decide-approval` |

Gateway / WhatsApp / SMTP persist as `queued_stub` until real keys are configured.

## UI wiring (closeout)

| Area | Status |
|---|---|
| Fleet register + add vehicle | Live `transportFleet` |
| Wallet recharge / balances | Live `wallets` + `walletRecharges` |
| Approvals pending / approved | Live `approvals` + decide API |
| Collections / Reports / Dashboard KPIs | Live transactions / dues |
| Settings → Apply HR concessions | Button calls apply action |
| SuperAdmin Finance overview | Live snapshot pull |

## Still deferred (ops)

- Browser click-through of live fee collection in a real browser session  
- Production cutover: drop localStorage as source of truth; real Razorpay/Paytm, SMTP, WhatsApp Business API keys  

## Test case results

Last run: 9 October 2026  
Suite with Finance actions: **38 passed, 0 failed** (~20 seconds)

| Test | Result | What was checked |
|---|---|---|
| `test_accounthead_can_save_finance_state` | Passed | Snapshot PUT/GET |
| `test_hr_cannot_write_finance` | Passed | HR blocked on PUT |
| `test_finance_reset` | Passed | Admin reset |
| `test_collect_payment_and_send_receipt` | Passed | Collect + WhatsApp stub |
| `test_gateway_intent_and_approval` | Passed | Gateway stub + decide approval |
| `test_hr_concession_and_payroll_voucher` | Passed | HR concession → fees; payroll → OUT voucher |

```
python -m pytest tests/test_finance.py tests/test_finance_actions.py tests/test_admissions.py tests/test_hr_modules.py tests/test_hr.py tests/test_phase0.py -q
```

```env
VITE_USE_API_FINANCE=true
```

Seed login: `accounthead@qmis.edu` / `accounts123`
