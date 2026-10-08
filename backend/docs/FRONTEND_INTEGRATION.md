# Frontend ↔ Backend integration

## Current `main` (partner HR + Phase 0 rewrite)

| Area | Status |
|---|---|
| Auth login | Wired — `VITE_USE_API_AUTH=true` → `POST /api/v1/auth/login` |
| HR module | Partner API + `src/services/hrApi.js` |
| Admissions enquiry / enroll UI | Frontend ready; **API flag off by default** (`VITE_USE_API_ADMISSIONS=false`) so screens use localStorage until rich admissions are ported onto the UUID Phase 0 stack |

### Seed logins (partner backend)

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

## Full Phase 1 admissions (rich API)

The complete enquiry → admission → enroll → parent login + file uploads backend lives on branch:

**`feature/phase1-admissions`**

That branch used the earlier integer-user Phase 0 stack. It needs a short port onto the partner UUID models before flipping `VITE_USE_API_ADMISSIONS=true` on `main`.
