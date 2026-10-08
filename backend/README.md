# QMIS ERP — Backend (FastAPI)

Python FastAPI boilerplate for the Queen Mira International School ERP.

The React frontend lives at the **repo root**. This `backend/` folder is the API your partner will extend.

**Database:** PostgreSQL (required for this project).

### Team docs (start here)

| Doc | Purpose |
|---|---|
| [docs/TEAM_ROADMAP.md](docs/TEAM_ROADMAP.md) | You vs partner — where each person starts |
| [docs/API_BACKLOG.md](docs/API_BACKLOG.md) | Priority APIs mapped to folders |

HR starter APIs (partner): `/api/v1/hr/employees` — see Swagger tag **hr**.

### Phase 0 endpoints (ready)

| Area | Paths |
|---|---|
| Auth | `POST /auth/login`, `POST /auth/otp/challenge`, `POST /auth/otp/verify`, `GET /auth/me`, `POST /auth/logout` |
| RBAC | `GET /rbac/roles`, `GET/PATCH /rbac/roles/{id}/permissions` |
| Masters | `/masters/academic-years`, `/classes`, `/sections`, `/subjects` |
| Audit | `GET /audit/logs` |
| HR | `/hr/employees` |

---

## Quick start (Windows)

### 1. Prerequisites

- Python 3.11+
- PostgreSQL running locally
- Database created once:

```sql
CREATE DATABASE qmis_erp;
```

(Or run `scripts/create_database.sql` from `psql` / pgAdmin.)

### 2. One-time setup

Double-click or run:

```bat
setup-local.bat
```

This creates `.venv`, installs dependencies, and copies `.env.example` → `.env`.

Edit `backend/.env` if your Postgres user/password/port are not `postgres` / `root` / `5432`.

### 3. Run the API

```bat
run-local.bat
```

- Health: http://127.0.0.1:8000/api/v1/health  
- Swagger: http://127.0.0.1:8000/docs  
- ReDoc: http://127.0.0.1:8000/redoc  

### 4. Seed login (local only)

On first successful boot a bootstrap admin is created if the users table is empty:

| Field | Value |
|---|---|
| Email | `admin@qmis.edu` |
| Password | `admin123` |

```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "admin@qmis.edu",
  "password": "admin123"
}
```

Then call `GET /api/v1/auth/me` with header `Authorization: Bearer <access_token>`.

---

## Manual start (optional)

```bash
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

---

## Project layout

```text
backend/
├── setup-local.bat         # one-time venv + deps
├── run-local.bat           # start API for local dev
├── .env.example
├── requirements.txt
├── README.md
├── scripts/
│   └── create_database.sql
└── app/
    ├── main.py
    ├── core/               # config + JWT/password
    ├── db/                 # SQLAlchemy session
    ├── models/
    ├── schemas/
    ├── services/
    └── api/v1/endpoints/   # add route modules here
```

---

## How to add a new module (partner guide)

1. Add ORM model in `app/models/`
2. Import it in `app/db/base.py`
3. Add Pydantic schemas in `app/schemas/`
4. Add service functions in `app/services/`
5. Add router in `app/api/v1/endpoints/<module>.py`
6. Include the router in `app/api/v1/router.py`

Keep business rules on the server (immutable ledger, campus_id, RBAC). Do not trust the frontend alone.

---

## Database (PostgreSQL)

Default `.env` URL:

```env
DATABASE_URL=postgresql+psycopg2://postgres:root@localhost:5432/qmis_erp
```

Change `USER`, `PASSWORD`, `HOST`, `PORT`, or DB name to match your machine.

Architecture rule: every business table must include `campus_id` from day one.

`create_all` is used for bootstrap only. Before production, switch to Alembic migrations (`alembic` is already in `requirements.txt`).

---

## Team split reminder

| Person | Focus |
|---|---|
| Backend lead | Core engines, schema, auth/RBAC, domain APIs, integrations |
| Partner | Frontend wiring + some module CRUD APIs using this structure |

Agree API shapes in Swagger / shared notes before parallel coding.
