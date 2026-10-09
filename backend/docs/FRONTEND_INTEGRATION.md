# Frontend ↔ Backend integration

## Current `main` (UUID stack)

| Area | Status |
|---|---|
| Auth login | Wired — `VITE_USE_API_AUTH=true` |
| Forced password change | Wired — `POST /api/v1/auth/change-password` |
| File upload stub | Wired — `POST /api/v1/files` |
| HR module (partner) | Done — `hrApi.js` |
| Admissions (Phase 1) | Done — enquiry → convert → enroll; `VITE_USE_API_ADMISSIONS=true` |
| Finance | Done — snapshot + server actions; `VITE_USE_API_FINANCE=true` |

See `ADMISSIONS_ANALYSIS.md`, `FINANCE_ANALYSIS.md`, and **`API_SOT_CUTOVER.md`** (HR/Finance API-only; no silent localStorage SoT).  
Archify overview: `.archify/architecture-project-overview/qmis-erp-overview.html`.

### Seed logins

| Email | Password | Role |
|---|---|---|
| admin@qmis.edu | admin123 | admin |
| hr@qmis.edu | hr12345 | hr |
| accounthead@qmis.edu | accounts123 | accounthead |

### Run

1. Backend needs PostgreSQL (`DATABASE_URL` in `backend/.env`). If Postgres is down, smoke can use SQLite on `:8001` (see testing report).
2. Frontend `.env` (from `.env.example`):
   ```env
   VITE_API_BASE_URL=http://127.0.0.1:8000/api/v1
   VITE_USE_API_AUTH=true
   VITE_USE_API_ADMISSIONS=true
   VITE_USE_API_FINANCE=true
   ```
3. `npm run dev`

### Finance API

| Method | Path |
|---|---|
| GET/PUT | `/api/v1/finance/state` |
| POST | `/api/v1/finance/state/reset` |
| GET/PUT | `/api/v1/finance/{collection}` |
| POST | `/api/v1/finance/actions/collect-payment` |
| POST | `/api/v1/finance/actions/settle-cheque` |
| POST | `/api/v1/finance/actions/send-receipt` |
| POST | `/api/v1/finance/actions/gateway-intent` |
| POST | `/api/v1/finance/actions/apply-hr-concessions` |
| POST | `/api/v1/finance/actions/post-payroll-voucher` |
| POST | `/api/v1/finance/actions/decide-approval` |

Frontend: `src/services/financeApi.js` via `FinanceContext`.  
Live UI wiring: fees, books, transport fleet, wallets, approvals, collections/reports KPIs, SuperAdmin finance overview.  
Gateway / WhatsApp / email remain stubs (`queued_stub`) until production keys.

### Test case results (latest)

```
cd backend
python -m pytest tests/ -q
python scripts/smoke_campus_flow.py http://127.0.0.1:8001
```

Latest: **39 pytest passed** + **21/21 live smoke** (Phase 0 → Admissions → Partner HR → Finance).  
Detail: `reports/testing-report.md`.

### Deferred (not blockers)

- RFID / eSSL punch import
- Production SMTP / WhatsApp / payment gateway keys
- Browser click-through against Postgres-backed API on `:8000`
- Academics emergency period reassignment
