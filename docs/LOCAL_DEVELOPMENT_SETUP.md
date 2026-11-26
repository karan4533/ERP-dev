# Local Development Setup (Windows)

Integrate **ERP_QMIS UI** with the **local FastAPI backend**.  
Local only — no AWS, no production database, no Git push.

## Prerequisites

- Windows 10/11
- Node.js 20+ (npm)
- Python 3.11+ (3.13 works)
- Optional: PostgreSQL 16/17/18 if you prefer Postgres instead of SQLite

## Repository layout used here

| Path | Purpose |
|---|---|
| `c:\karan\irul\ERP_QMIS` | Existing UI (Vite/React) |
| `c:\karan\irul\backend` | FastAPI backend (already present; Heuristic-Labs/QMIS compatible) |
| `c:\karan\QMIS-heuristic-ref` | Optional read-only shallow clone of Heuristic-Labs/QMIS for comparison |

Do **not** overwrite `backend/` with a fresh clone if it already exists.

---

## 1. Backend setup

```bat
cd c:\karan\irul\backend
python -m venv .venv
.\.venv\Scripts\activate
python -m pip install --upgrade pip
pip install -r requirements.txt
```

### Environment file

If `backend\.env` is missing, copy from example and edit:

```bat
copy .env.example .env
```

**Safe local SQLite configuration (recommended when Postgres password is unknown):**

```env
ENVIRONMENT=development
DATABASE_URL=sqlite+pysqlite:///./qmis_erp_local.db
JWT_SECRET=local-dev-change-me-qmis-erp-2026
OTP_DEBUG=true
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
INTEGRATIONS_MODE=demo
```

**Postgres alternative (only if you know the local password):**

```env
DATABASE_URL=postgresql+psycopg://postgres:YOUR_LOCAL_PASSWORD@localhost:5432/qmis_erp
```

Create DB once:

```bat
"C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -c "CREATE DATABASE qmis_erp;"
```

### Verify DB is local

```bat
.\.venv\Scripts\python.exe -c "from app.core.config import settings; print(settings.environment, settings.database_url)"
```

Confirm:

- `environment` is `development`
- `database_url` is SQLite file **or** `localhost` Postgres — never a cloud/production host

### Migrations

Startup runs `create_all` + seeds demo users in development.

Optional Alembic (Postgres preferred; review before applying):

```bat
.\.venv\Scripts\alembic.exe upgrade head
```

### Start API

```bat
cd c:\karan\irul\backend
.\.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

Or: `run-local.bat` (after `.env` exists).

Checks:

- Health: http://127.0.0.1:8000/health → `{"status":"ok"}`
- Swagger: http://127.0.0.1:8000/docs

### Backend tests

```bat
cd c:\karan\irul\backend
.\.venv\Scripts\python.exe -m pytest tests/ -q
```

---

## 2. Frontend setup (ERP_QMIS)

```bat
cd c:\karan\irul\ERP_QMIS
npm install
```

Create `ERP_QMIS\.env.local` (already provided as template via `.env.example`):

```env
VITE_API_BASE_URL=http://127.0.0.1:8000
VITE_USE_MOCK=false
VITE_API_TIMEOUT_MS=15000
```

Start UI:

```bat
cd c:\karan\irul\ERP_QMIS
npm run dev -- --port 5173 --host 127.0.0.1
```

Open: http://127.0.0.1:5173/signin

### Seed login (development)

Use **Explore Seed Accounts** on the sign-in page, or:

- Email: `admin@qmis.edu`
- Password: `admin123`

Invalid password should show the backend error message (no demo bypass when `VITE_USE_MOCK=false`).

### Production build check

```bat
cd c:\karan\irul\ERP_QMIS
npm run build
```

---

## 3. Ports

| Service | URL |
|---|---|
| Frontend | http://127.0.0.1:5173 |
| Backend | http://127.0.0.1:8000 |
| Swagger | http://127.0.0.1:8000/docs |

---

## 4. Stop commands

- Frontend / Backend terminals: `Ctrl+C`
- Or stop Node/Python processes holding ports 5173 / 8000 in Task Manager

---

## 5. Troubleshooting

| Symptom | Fix |
|---|---|
| `python-multipart` RuntimeError | `pip install python-multipart` (now in `requirements.txt`) |
| Postgres password auth failed | Use SQLite `DATABASE_URL` above |
| CORS errors in browser | Add the exact UI origin to `CORS_ORIGINS` in `backend/.env` |
| Login always uses demo users | Ensure `VITE_USE_MOCK=false` in `.env.local` and restart Vite |
| 401 after refresh | Token cleared; sign in again |
| Role not mapped | Backend role code missing from `ERP_QMIS/src/constants/roles.js` |
| Announcements empty on API | Expected until data is created via API; UI falls back to local on error |

---

## 6. Safety

- Never set `ENVIRONMENT` to production with demo secrets
- Never point `DATABASE_URL` at production
- Never commit `.env` / `.env.local`
- Do not run AWS deploy workflows for this local work
