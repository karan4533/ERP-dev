# API source-of-truth cutover — HR & Finance

Date: 2026-10-09

## Goal

API is the only business source of truth for HR and Finance.  
Clearing site `localStorage` must **not** wipe employees, payroll, fees, or receipts.

## Done

| Area | Behavior |
|---|---|
| HR hydrate | `hydrateHrStore()` **throws** if API down; HR layout shows error (no silent local seed) |
| HR writes | Memory + API push; localStorage is optional cache only |
| Child concession students | `GET /api/v1/admissions/enrolled-students` (not `schoolerp-enrolled-students`) |
| Payroll Paid | UI blocks re-edit when `paymentStatus` is locked (`PAID` / `FINALIZED` …) |
| Finance hydrate | Remote snapshot required when `VITE_USE_API_FINANCE=true`; fail shows error panel |
| Finance demo reset | Removed from Settings — replaced with **Reload snapshot from API** |
| SuperAdmin Finance | KPIs/tables from API only (no `financeOverviewData` seed cards) |
| Receipt / gateway stubs | `queued_stub`, `delivered: false` — UI toasts say not delivered |

## Smoke checks

1. **HR:** login `hr@qmis.edu` → employees → leave → mark payroll Paid → hard refresh → data still from API. Wipe site data → refresh → still from API (login again).  
2. **Finance:** login `accounthead@qmis.edu` → collect fee → send receipt (stub toast) → hard refresh → receipt/collection still on API.

## API-only vs still stub

| Screen / action | Mode |
|---|---|
| HR employees, leave, payroll months, concessions, documents | **API-only** |
| Finance fees, receipts, books, approvals, wallets, fleet register | **API-only** (snapshot + actions) |
| Receipt email / WhatsApp send | **Stub** `queued_stub` until SMTP / WhatsApp keys |
| Payment gateway intent | **Stub** `gateway: stub` until Razorpay/Paytm keys |
| SuperAdmin income trend chart months | **Static series** (KPI cards are live) |
| Transport maintenance/compliance demo tables (non-fleet) | Mostly static UI chrome |
| RFID, Academics | Not on API yet |

## Flags

```env
VITE_USE_API_AUTH=true
VITE_USE_API_ADMISSIONS=true
VITE_USE_API_FINANCE=true
```
