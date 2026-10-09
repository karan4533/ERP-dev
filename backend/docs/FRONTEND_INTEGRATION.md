# Frontend ↔ Backend integration

## Current `main` (UUID Phase 0 + HR closeout)

| Area | Status |
|---|---|
| Auth login | Wired — `VITE_USE_API_AUTH=true` → `POST /api/v1/auth/login` |
| Forced password change | Wired — `POST /api/v1/auth/change-password` + `/change-password` screen when `must_change_password` is true |
| File upload stub | Wired — `POST /api/v1/files` and `GET /api/v1/files/{id}/download` |
| HR module | Done on this stack — `src/services/hrApi.js` uses the shared `apiClient` token and `VITE_API_BASE_URL` |
| HR announcements | Synced through `/api/v1/hr/announcements` via hrStore |
| Admissions enquiry / enroll UI | Frontend ready; **API flag off by default** (`VITE_USE_API_ADMISSIONS=false`) so screens use localStorage until rich admissions are ported onto the UUID stack |

### Seed logins

| Email | Password | Role |
|---|---|---|
| admin@qmis.edu | admin123 | admin |
| hr@qmis.edu | hr12345 | hr |

### Run

1. Backend: `backend\run-local.bat`
2. Frontend `.env`:
   ```env
   VITE_API_BASE_URL=http://127.0.0.1:8000/api/v1
   VITE_USE_API_AUTH=true
   VITE_USE_API_ADMISSIONS=false
   ```
3. `npm run dev`

### HR deferred integrations (not blockers for Phase 2)

- RFID / eSSL punch import
- Production SMTP for temporary passwords (debug mode returns the password in the API response)
- Finance payroll payment voucher and fee concession apply
- Academics emergency period reassignment

## Full Phase 1 admissions (rich API)

The complete enquiry → admission → enroll → parent login + profile image flow still needs a short port onto the UUID models before flipping `VITE_USE_API_ADMISSIONS=true` on `main`. Current admissions API on this stack: create enquiry + enroll only.
