# QMIS — New Developer Setup (Clean Machine)

**Audience:** Another developer setting up frontend + backend on a fresh laptop\
**Status:** Procedure draft from portability audit (2026-11-24)\
**Secrets:** Do **not** paste production credentials here. Use local `.env` / `.env.local` files that are gitignored. Demo seed passwords exist only for `ENVIRONMENT=development` — obtain them from `backend/.env.example` and `backend/app/services/seed.py` on your private clone; do not republish them in shared chat or tickets.

---

## 1. Prerequisites

| Tool | Notes from this workspace |
|---|---|
| Git | Required |
| Node.js | Verified locally on Node **v24**; prefer current LTS if v24 is unavailable — then re-run `npm ci` / `npm run build` |
| npm | Comes with Node (local was **11.x**) |
| Python | **3.11+** recommended; this machine used **3.13.2** successfully |
| PostgreSQL (optional) | Default `.env.example` points at Postgres; SQLite file URL also works for local/dev if configured |
| Disk | Expect `node_modules` + Python venv + local DB |

Clone **two** repositories (boundaries matter):

1. Root / backend host: `ERP-dev` (contains `backend/`)
2. Frontend: `ERP_QMIS` / `new-UI_irul` (own git history)

Exact clone URLs depend on which remotes your team approves after sync. Today’s map:

- Root: `https://github.com/karan4533/ERP-dev.git`
- Frontend remotes in use: `https://github.com/karan4533/new-UI_irul.git` (`new-ui`) and `https://github.com/irulappan151204/ERP_QMIS` (`origin`)

Until partner sync is approved, prefer the branches your lead designates (do not assume `main` == integrated SoT).

---

## 2. Clone repositories

```bash
# Example layout
mkdir qmis && cd qmis
git clone <ERP-dev-url> ERP-dev
git clone <ERP_QMIS-or-new-UI-url> ERP_QMIS
```

Keep frontend and backend as **sibling** folders (or nested only if the frontend repo intentionally vendors backend after an approved SoT decision). Do not mix histories with `git submodule` unless the team agrees.

---

## 3. Backend setup

```bash
cd ERP-dev/backend   # or your approved backend path
python -m venv .venv

# Windows
.venv\Scripts\activate

# macOS / Linux
source .venv/bin/activate

python -m pip install --upgrade pip
pip install -r requirements.txt
```

### Environment

```bash
copy .env.example .env          # Windows
# cp .env.example .env          # macOS / Linux
```

Edit `.env` (never commit it):

- Set `ENVIRONMENT=development` for local demo seeds.
- Set `DATABASE_URL` to your Postgres instance **or** an approved SQLite URL for local-only work.
- Generate a unique `JWT_SECRET` for anything beyond throwaway local demos.
- Set `CORS_ORIGINS` to every Vite origin you use (include both `http://127.0.0.1:5173` and `http://localhost:5173`; add `:5174`/`:5175` if Vite picks another port).
- Leave Razorpay / SMTP / WhatsApp / ProTrack empty unless you have sandbox credentials.

### Database / migrations

```bash
# From backend/
alembic upgrade head
```

If migration heads diverge between partner-embedded backend and root backend, **stop** and ask the integration owner — do not invent a merge of Alembic graphs locally.

### Start FastAPI

```bash
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Health check: open `http://127.0.0.1:8000/docs` (or the project’s health endpoint).

---

## 4. Frontend setup (`ERP_QMIS`)

```bash
cd ERP_QMIS
npm ci
# if lockfile issues: npm install
```

### Environment

```bash
copy .env.example .env.local    # Windows
# cp .env.example .env.local    # macOS / Linux
```

Required keys (from `.env.example`):

| Variable | Purpose |
|---|---|
| `VITE_API_BASE_URL` | FastAPI base, typically `http://127.0.0.1:8000` |
| `VITE_USE_MOCK` | Must be `false` for live backend integration |
| `VITE_API_TIMEOUT_MS` | Optional timeout |

Do not commit `.env.local`.

### Start Vite

```bash
npm run dev
```

Note the printed local URL/port. If the port is not `5173`, update backend `CORS_ORIGINS` and restart uvicorn.

### Production build check

```bash
npm run build
```

---

## 5. Login and smoke verification

1. Open the Vite URL.
2. Sign in with a **development** seed account appropriate to the role under test (from local seed / `.env.example` — not from this document).
3. Confirm role home route (examples: Super Admin, Admin, Front Office / PRM, and any Phase roles your branch includes).
4. Confirm the UI shows live/integration notices when `VITE_USE_MOCK=false`.
5. Perform one write that must persist (e.g. FO enquiry or Admin assignment your branch supports), refresh, and confirm the row remains.
6. Confirm a denied role cannot access finance/admin-only APIs (expect HTTP 403).

---

## 6. Suggested first-day checklist

- [ ] Both repos cloned; correct branches checked out
- [ ] Python venv + `pip install -r requirements.txt`
- [ ] Backend `.env` created from example; API starts on `:8000`
- [ ] `alembic upgrade head` succeeds
- [ ] Frontend `.env.local` with `VITE_USE_MOCK=false`
- [ ] `npm ci` / `npm run dev` / `npm run build`
- [ ] CORS includes the actual Vite origin
- [ ] Login + one persistence check + one RBAC denial check
- [ ] No secrets committed (`git status` clean of `.env*`)

---

## 7. Common portability pitfalls

| Issue | Mitigation |
|---|---|
| Vite on `:5175` but CORS only lists `:5173` | Extend `CORS_ORIGINS` |
| `VITE_USE_MOCK` left `true` | Live APIs never called |
| Hardcoded `localhost` vs `127.0.0.1` mismatch | Align FE base URL and CORS |
| Alembic `0019` conflict between trees | Do not upgrade blindly; follow integration plan |
| Nested `ERP_QMIS/.git` ignored by root git | Clone/pull frontend repo separately |
| Machine DB files / `.db.bak*` | Do not copy production DBs; migrate fresh |
| Node engine drift | Re-run lockfile install + build on the new Node version |

---

## 8. What this guide does not authorize

- Merging partner `main` into local dirty trees
- Resetting or deleting databases
- Committing secrets
- Deploying to shared/staging/production environments
