# Frontend ↔ Backend integration

## Current `main` (UUID stack)

| Area | Status |
|---|---|
| Auth login | Wired — `VITE_USE_API_AUTH=true` |
| Forced password change | Wired — `POST /api/v1/auth/change-password` |
| File upload stub | Wired — `POST /api/v1/files` |
| HR module | Done — `hrApi.js` |
| Admissions | Done — rich enquiry / admission / enroll; `VITE_USE_API_ADMISSIONS=true` |
| Finance | Done — campus finance snapshot; `VITE_USE_API_FINANCE=true` |

See `ADMISSIONS_ANALYSIS.md` and `FINANCE_ANALYSIS.md`.

### Seed logins

| Email | Password | Role |
|---|---|---|
| admin@qmis.edu | admin123 | admin |
| hr@qmis.edu | hr12345 | hr |
| accounthead@qmis.edu | accounts123 | accounthead |

### Run

1. Backend: `backend\run-local.bat`
2. Frontend `.env`:
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

Frontend: `src/services/financeApi.js` via `FinanceContext` (fees, receipts, books, settings).  
Transport / wallet / approvals screens still use static demo data; snapshot keys are reserved.

### Test case results (latest)

Run from `backend`:

```
python -m pytest tests/ -q
python scripts/smoke_campus_flow.py http://127.0.0.1:8001
```

Latest: **39 pytest passed** (includes `test_e2e_campus_flow.py`) and **21/21 live smoke** steps  
(Phase 0 → Admissions → Partner HR → Finance). Detail: `reports/testing-report.md`.

### Deferred (not blockers)

- RFID / eSSL punch import
- Production SMTP / WhatsApp / payment gateway keys
- Browser click-through against Postgres-backed API
- Academics emergency period reassignment
