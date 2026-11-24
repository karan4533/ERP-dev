# QMIS ERP — PostgreSQL Migration Readiness

> **Canonical update (2026-11-24):** Schema dictionary, gaps, and recommended production sequence live in [`QMIS_PRODUCTION_DATABASE_SCHEMA.md`](./QMIS_PRODUCTION_DATABASE_SCHEMA.md). This file remains the 19 November 2026 readiness notes (PG login blocked; SQLite runtime observations).

**Date:** 19 November 2026  
**Status:** Read-only audit complete. **No migration executed.**  
**Companion:** [`DATABASE_SCHEMA_COMPARISON.md`](./DATABASE_SCHEMA_COMPARISON.md) · [`QMIS_PRODUCTION_DATABASE_SCHEMA.md`](./QMIS_PRODUCTION_DATABASE_SCHEMA.md)

### Staging setup (2026-11-24) — READY (migrations not run)

| Check | Result |
|---|---|
| PostgreSQL 18 service | Running on `127.0.0.1:5432` |
| Database `qmis_erp_staging` | Created empty (`public` base tables = 0) |
| Role `qmis_staging_user` | LOGIN, NOSUPERUSER, NOCREATEDB, NOCREATEROLE |
| Isolation | Staging user can connect to `qmis_erp_staging` only; denied `qmis_erp`, `qmis_academic_browser`, `postgres` |
| `backend/.env` (SQLite) | Unchanged |
| `backend/.env.staging` | Created, gitignored; `ENVIRONMENT=production` (no demo seed passwords) |
| Alembic / seed | **Not executed** — awaiting separate approval |

### Alembic upgrade attempt (2026-11-24) — FAILED (no repair)

Target confirmed: `qmis_erp_staging` / user `qmis_staging_user` only.

| Step | Result |
|---|---|
| Pre-check `current_database()` | `qmis_erp_staging` |
| Before revision | empty (no `alembic_version`) |
| `alembic upgrade head` | **Failed at `0005_document_records`** |
| After revision (transaction left stamp) | `0004_class_details_fields` |
| Public tables | only `alembic_version` |

**Exact error:** `psycopg.errors.UndefinedTable: relation "campuses" does not exist` while creating `document_records` (FK to `campuses`).

**Root cause:** `0001_baseline` is a **no-op** (`upgrade(): pass`). Revisions `0002`–`0004` alter assumed existing tables; they do not create the core schema. Empty PG cannot be bootstrapped by `alembic upgrade head` alone — historical design expected prior `Base.metadata.create_all` (or an equivalent baseline dump).

**Not done (per safety):** no rollback, no drop, no migration file edits, no seed, no connect to `qmis_erp`.

---

## 1. Executive summary

The application **code is already PostgreSQL-capable** (`psycopg` driver, Alembic, default settings URL shape). The **currently running** FastAPI processes use **SQLite** (`qmis_erp_uat.db`) because process `DATABASE_URL` overrides `backend/.env`.

PostgreSQL 18 is running locally with database `qmis_erp` (pgAdmin). Live schema/row introspection **failed**: documented example password for user `postgres` was rejected. Operator-stated ~245 users in `public.users` is **unverified** here.

**Do not** dump SQLite into `qmis_erp` and overwrite existing PostgreSQL users. Prepare a **staging database**, align schema with Alembic head, then migrate selected datasets with explicit conflict rules (email / natural keys).

---

## 2. Current architecture (verified)

```
React/Vite  -->  FastAPI (8000/8001)  -->  SQLite file qmis_erp_uat.db
backend/.env DATABASE_URL            -->  qmis_erp_local.db  (not what process uses)
PostgreSQL 18 :5432 / qmis_erp       -->  unused by running API (pgAdmin-visible legacy)
Pytest                               -->  sqlite :memory:
```

| Setting | Value |
|---|---|
| SQLAlchemy | 2.1.4 |
| Driver available | `psycopg` 3.3.6 (`psycopg[binary]` in requirements) |
| Engine module | `backend/app/core/database.py` |
| Session | `SessionLocal` / `get_db` (also re-exported from `app.db.session`) |
| Pool (SQLite file) | `NullPool` + `check_same_thread=False` + `timeout=30` |
| Pool (non-SQLite) | default QueuePool + `pool_pre_ping=True` |
| Env | `ENVIRONMENT=development` in `.env` |

---

## 3. PostgreSQL audit result

| Check | Result |
|---|---|
| Server reachable | Yes (`pg_isready` accepting on 5432) |
| Authorized connect | **FAIL** — password authentication failed for documented `postgres` user from `.env.example` |
| Schemas / tables / FKs / counts | **Not inspected** (access blocked) |
| Alembic on PG | **Unknown** until login works |
| Relation to running app | **Not connected** |

**Next operator step (outside this audit):** supply a working local `DATABASE_URL` for PostgreSQL (or unlock pgAdmin-export of schema DDL + counts) without committing secrets. Re-run inspection: table list, `alembic_version`, `count(*)` on `users`/`roles`/`students`/`ops_records`.

---

## 4. SQLite audit highlights

See comparison doc for full tables. Critical points:

1. **Three files, same 52-table schema**, aligned with current models.
2. **Different UUID namespaces** for the same seed emails (uat ≠ local ≠ bak). Campus IDs also differ.
3. **Newest transport UAT** only in `qmis_erp_uat.db`.
4. **Richest non-transport history** in `qmis_erp_local.db.bak_uat` (announcements, hostel ops, more users).
5. **No `alembic_version`** in SQLite files — schema via `create_all`, not migration history.
6. SQLite **FK pragma off** by default — integrity may be weaker than PG will enforce.

---

## 5. SQLAlchemy compatibility issues

### Already OK for PostgreSQL

- Models use portable SQLAlchemy types (`UUID`, `DateTime(timezone=True)`, `JSON`, `Boolean`, `String`, `Text`).
- `psycopg` v3 is in `requirements.txt`.
- Alembic `env.py` reads `get_settings().database_url` (no secrets in `alembic.ini`).
- Non-SQLite path uses normal pooling + `pool_pre_ping`.

### SQLite-specific behavior that must change or be guarded

| Area | Current SQLite behavior | PostgreSQL expectation | Action |
|---|---|---|---|
| Pool | `NullPool` / `StaticPool` branches in `database.py` | Default QueuePool (or sized pool) | Keep SQLite branches; ensure PG path never uses StaticPool/NullPool unless intentional |
| `check_same_thread` | Required for SQLite | N/A | Already gated on sqlite URL |
| UUID storage | `CHAR(32)` hex, no hyphens | native `UUID` | Export/import with explicit cast; preserve values |
| Timestamps | `DATETIME` | `TIMESTAMPTZ` | Prefer aware UTC on write; verify existing naive values |
| JSON | SQLite JSON | PG `JSON`/`JSONB` | Prefer `JSONB` in future Alembic if needed; models use `JSON` today |
| Booleans | OK | OK | Watch string `'0'/'1'` if any raw SQL |
| FK enforcement | Often off | Always on | Clean orphans before load; load parents before children |
| Unique conflicts | Seed emails unique per DB | Collide with existing ~245 PG users | Match on email; **never overwrite** PG passwords/roles blindly |
| Sequences / identity | UUID PKs (no serial dependency for most tables) | UUID PKs | Still verify any `Integer` PKs (`otp_challenges`, audit integer ids if any) |
| `create_all` at startup | Creates missing tables | Safe for empty DB; **does not alter** | PG upgrades must use `alembic upgrade head` |
| Dual engines | Historically split; now unified | One engine | Keep single engine source of truth |

### Files requiring future changes (when implementing, not now)

| File | Why |
|---|---|
| `backend/.env` (local, untracked) | Point `DATABASE_URL` at PostgreSQL staging/primary; remove conflicting process env |
| `backend/app/core/database.py` | Confirm PG pool sizing; optional `JSONB` connect args later |
| `backend/app/core/config.py` | Already validates weak default DB passwords outside development |
| `backend/app/main.py` | `create_all` + seed — gate seed so it cannot clobber PG production users |
| `backend/app/services/seed.py` | Seed must be idempotent by email; no UUID regeneration against live PG |
| `backend/alembic/versions/*` | Run through `0018` (or current head) on staging before data load |
| `backend/app/services/schema_check.py` | Extend checks for PG UUID/VARCHAR drift |
| Ops/data load scripts (**new**, not yet written) | Controlled ETL; not present today |
| Docs / runbooks | Operator steps for backup, cutover, rollback |
| CI / pytest | Keep `:memory:` SQLite; add optional `TEST_PG_URL` job |
| Process supervisors / IDE launch configs | Stop exporting SQLite `DATABASE_URL` that overrides `.env` |

Frontend: no DB driver changes. Only ensure `VITE_API_BASE_URL` targets the API that uses PostgreSQL after cutover.

---

## 6. Recommended migration phases

### Phase 0 — Unlock and baseline (read-only / backup)

1. Obtain authorized PG credentials (pgAdmin owner).
2. `pg_dump` **full backup** of `qmis_erp` (schema + data) to a dated file off the DB volume.
3. Record: `alembic_version`, table list, `count(*)` for `users`, `roles`, `students`, `ops_records`, etc.
4. Freeze writes on SQLite UAT if cutover window starts (or accept freeze time).

### Phase 1 — Staging database (empty or schema-only)

1. Create **`qmis_erp_staging`** (new DB) — **do not** use production `qmis_erp` as the load target first.
2. Set local `DATABASE_URL` to staging only.
3. `alembic upgrade head` on staging.
4. Diff staging schema vs `Base.metadata` / `schema_check`.
5. Optionally restore a **schema-only** copy of current `qmis_erp` into a second reference DB for legacy comparison (still no auto-merge).

### Phase 2 — Schema migration of legacy `qmis_erp` (separate decision)

1. On a restored **clone** of `qmis_erp` (not live): run Alembic upgrade; resolve VARCHAR/UUID failures per revision notes.
2. Reconcile table/column gaps vs 52-model target.
3. Document any legacy tables not in SQLAlchemy (leave untouched or archive).

### Phase 3 — Data migration (selective, non-destructive)

**Rule: existing PostgreSQL users are source-of-truth for identity collisions.**

1. Build email → PG `users.id` map from PostgreSQL.
2. Build email → SQLite `users.id` maps from `uat` / `bak` (separate).
3. For domain rows (students, ops, HR, …):
   - Rewrite FK UUIDs through the email/role maps where the user must exist in PG.
   - If SQLite email has **no** PG user: **insert new user** only with explicit approval list — or skip row.
   - If email exists in PG: **keep PG user row** (password_hash, role_id, flags). Attach migrated child rows to PG UUID.
4. Transport: load `uat` `ops_records` (`TDR-UAT-LOCAL`, `TDR-0002`) into staging first; verify API.
5. Hostel/library from `bak_uat`: separate batch; resolve public_id uniqueness (`UniqueConstraint` on collection+public_id).
6. Skip empty finance tables; do not invent data.
7. Preserve UUID values when inserting **new** entities that do not collide; convert `CHAR(32)` → `UUID`.

### Phase 4 — Reconciliation

1. Count checks per table (staging vs source).
2. Spot-check: login as transport manager, list drivers, hostel collections, admin user count.
3. FK orphan query on staging.
4. Role/permission: prefer PG if already customized; otherwise seed diff by permission code.

### Phase 5 — Cutover

1. Final `pg_dump` of live `qmis_erp`.
2. Either promote staging → rename, or replay approved ETL onto upgraded `qmis_erp`.
3. Point API `DATABASE_URL` at PostgreSQL; **clear** process-level SQLite overrides.
4. Restart API; smoke RBAC + TM + Hostel + Auth.
5. Keep SQLite files as read-only archives.

### Phase 6 — Rollback

1. Repoint `DATABASE_URL` to last-known SQLite file **or** restore PG from pre-cutover `pg_dump`.
2. Restart API; confirm health.
3. Do not delete backups for N days.

---

## 7. Duplicate handling policy (mandatory)

| Conflict | Policy |
|---|---|
| Same email in PG and SQLite | **Keep PG user**; remap FKs; do not overwrite password/role unless operator signs off |
| Same `ops_records (collection, public_id)` | Prefer explicit choose-source; default **keep existing PG**, insert only if absent |
| Same admission number / student natural key | Manual review queue |
| Role codes | Merge by `roles.code`; permissions by stable code string |
| Campus | Single campus expected; map all SQLite campus UUIDs → chosen PG campus id |

---

## 8. Risks

| Risk | Severity | Mitigation |
|---|---|---|
| Overwriting ~245 PG users | Critical | Never DELETE/UPDATE PG users; email-based remap only |
| UUID namespace mismatch across SQLite files | High | Map via email; never assume uat UUID = bak UUID |
| Legacy PG schema behind Alembic head | High | Upgrade clone first; fix failed revisions |
| SQLite orphans failing PG FK | High | Enable checks; fix or drop orphans pre-load |
| Process env overrides `.env` | Medium | Document launch configs; verify with runtime probe |
| Seed on startup recreating users | High | Disable or harden seed against non-empty PG |
| Dual SQLite “sources of truth” | Medium | Declare uat = transport UAT; bak = historical; local = discardable |
| No live PG audit yet | High | Block cutover until Phase 0 connect succeeds |

---

## 9. Rollback plan (summary)

1. **Application rollback:** set `DATABASE_URL` back to archived SQLite (`qmis_erp_uat.db` or agreed file); restart uvicorn; confirm process open file / dialect.
2. **PostgreSQL rollback:** `pg_restore` / replay pre-migration dump onto a clean DB; repoint URL; restart.
3. **Partial ETL failure:** truncate only staging load schemas/tables used by ETL (never drop `qmis_erp` backup).
4. **Verification:** auth login, `alembic current`, row-count snapshot vs saved baseline.

---

## 10. Compatibility checklist before cutover

- [ ] Authorized PG URL works; audit doc updated with real table/count evidence  
- [ ] `pg_dump` of `qmis_erp` stored and restore-tested on a throwaway DB  
- [ ] Staging DB at Alembic head; `schema_check` clean  
- [ ] User email collision report reviewed  
- [ ] Transport UAT rows verified on staging API  
- [ ] Seed cannot destroy PG users  
- [ ] Process env / `.env` aligned  
- [ ] Rollback drill completed once  

---

## 11. Explicit non-actions (this audit)

- No `alembic upgrade` against live PG  
- No data copy, DELETE, TRUNCATE, or INSERT into PostgreSQL  
- No changes to SQLite files  
- No commit / push  
- No password guessing beyond the single documented example URL already known to fail  

---

## 12. Suggested immediate operator actions

1. From pgAdmin, export connection parameters into a **private** local `.env` PostgreSQL URL (or tell the agent a redacted host/db/user only plus a one-time auth method).  
2. Re-run a read-only PG schema/count probe.  
3. Take `pg_dump` before any future migration work.  
4. Stop relying on process-level SQLite `DATABASE_URL` once PG staging is ready.
