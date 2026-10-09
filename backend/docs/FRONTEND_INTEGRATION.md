# Frontend ↔ Backend integration

## Current `main` (UUID stack)

| Area | Status |
|---|---|
| Auth login | Wired — `VITE_USE_API_AUTH=true` → `POST /api/v1/auth/login` |
| Forced password change | Wired — `POST /api/v1/auth/change-password` |
| File upload stub | Wired — `POST /api/v1/files` and `GET /api/v1/files/{id}/download` |
| HR module | Done — `src/services/hrApi.js` + shared `apiClient` |
| Admissions | Done — rich enquiry / admission / enroll API; set `VITE_USE_API_ADMISSIONS=true` |

See `ADMISSIONS_ANALYSIS.md` for the frontend contract and gaps that were closed.

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
   VITE_USE_API_ADMISSIONS=true
   ```
3. `npm run dev`

### Admissions API (rich)

| Method | Path |
|---|---|
| GET/POST | `/api/v1/admissions/enquiries` |
| GET/PATCH | `/api/v1/admissions/enquiries/{id}` |
| POST | `/api/v1/admissions/enquiries/{id}/convert` |
| POST | `/api/v1/admissions/enquiries/{id}/enroll` (legacy Phase-0 shortcut) |
| GET/POST | `/api/v1/admissions` |
| GET/PATCH | `/api/v1/admissions/{id}` |
| POST | `/api/v1/admissions/{id}/enroll` |

Frontend entry: `src/services/admissionsApi.js` via `admissionEnquiryData.js` / `admissionListData.js`.

### Deferred (not blockers)

- RFID / eSSL punch import
- Production SMTP for temporary passwords
- Finance payroll / fee concession apply
- Academics emergency period reassignment
