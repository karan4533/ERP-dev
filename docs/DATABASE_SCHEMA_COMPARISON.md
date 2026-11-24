# QMIS ERP — Database Schema Comparison (Read-Only Audit)

> **Canonical update (2026-11-24):** For the current code-derived production schema (56 tables, Alembic through `0026`, JSON collection inventory, role mapping, PG sequence), use [`QMIS_PRODUCTION_DATABASE_SCHEMA.md`](./QMIS_PRODUCTION_DATABASE_SCHEMA.md). This file remains a historical SQLite-vs-PG access snapshot from 19 November 2026.

**Date:** 19 November 2026  
**Scope:** Compare local SQLite artifacts with SQLAlchemy metadata and the intended PostgreSQL target.  
**Constraint:** No database modifications. PostgreSQL live introspection was **not** completed (see access limitation).

---

## 1. Current database architecture

| Environment | Engine | Location | Role today |
|---|---|---|---|
| Running FastAPI (ports 8000 / 8001) | SQLite | `backend/qmis_erp_uat.db` via process `DATABASE_URL` | Active API data (incl. TM UAT drivers) |
| `backend/.env` on disk | SQLite | `backend/qmis_erp_local.db` | Config for fresh starts if process env unset |
| Backup artifact | SQLite | `backend/qmis_erp_local.db.bak_uat` | Older richer local dataset |
| Shared / pgAdmin | PostgreSQL 18 | `localhost:5432` / DB `qmis_erp` | Server up; **not** used by running FastAPI |
| Pytest | SQLite `:memory:` | ephemeral | Unit/API tests |

Frontend (React/Vite) never connects to a database; it calls FastAPI only.

---

## 2. PostgreSQL schema (live)

### Access limitation

Attempted connection using the **only documented local credential source** in-repo (`backend/.env.example` → user `postgres`, database `qmis_erp`, host `localhost`, port `5432`).

**Result:** `FATAL: password authentication failed for user "postgres"`.

- No other authorized PostgreSQL password was present in `backend/.env` (SQLite URL), process env of running uvicorn (SQLite), or a readable `.pgpass`.
- Therefore **schemas, columns, indexes, FKs, row counts, and `alembic_version` on live `qmis_erp` were not inspected**.
- Operator report that `public.users` has ~**245** users is noted as **unverified by this audit**.

### What is known without a live login

| Source | Finding |
|---|---|
| PostgreSQL 18 listening | `pg_isready` → `127.0.0.1:5432 - accepting connections` |
| Historical docs (`backend/docs/DATABASE_ARCHITECTURE_RULES.md`, Oct 2026) | Earlier verify: ~48 app tables at Alembic `0012_*`; PG was then primary |
| Current Alembic tree | Revisions `0001` … `0018_exam_academic_year.py` (head ahead of Oct doc) |
| SQLAlchemy `Base.metadata` (current code) | **52** tables — target schema for a healthy PG at `alembic upgrade head` + model alignment |

Live pgAdmin schema must be re-audited after providing a working authorized `DATABASE_URL` (credentials never to be committed).

---

## 3. SQLite schema

All three files expose **52 tables**, matching current SQLAlchemy metadata **exactly** (no missing / extra table names).

| File | Bytes | Tables | `alembic_version` |
|---|---:|---:|---|
| `qmis_erp_uat.db` | 950,272 | 52 | **Absent** |
| `qmis_erp_local.db` | 950,272 | 52 | **Absent** |
| `qmis_erp_local.db.bak_uat` | 1,290,240 | 52 | **Absent** |

Schema was created primarily via startup `Base.metadata.create_all` + seed helpers, not Alembic revision tracking.

### Table list (all three SQLite DBs)

`academic_years`, `academics_records`, `activities`, `activity_players`, `admission_enquiries`, `admissions`, `announcement_replies`, `announcement_responses`, `announcements`, `approval_events`, `approval_requests`, `audit_logs`, `audit_records`, `calendar_events`, `campuses`, `conversation_participants`, `conversations`, `coordinator_grade_bands`, `document_items`, `document_records`, `escalations`, `exam_types`, `exam_weightages`, `exams`, `file_assets`, `finance_records`, `financial_years`, `front_office_records`, `guardians`, `hr_employees`, `hr_records`, `leave_requests`, `lesson_plans`, `mark_entries`, `marks_batches`, `messages`, `notifications`, `ops_records`, `otp_challenges`, `permissions`, `role_permissions`, `roles`, `school_classes`, `sections`, `student_attendance`, `students`, `subjects`, `task_events`, `tasks`, `tc_requests`, `user_profiles`, `users`

### Column / PK / FK / index notes (SQLite)

- **Column sets:** identical across `uat` / `local` / `bak_uat` for every table (0 column-mismatch tables).
- **Types (inspected):** UUID PKs/FKs stored as `CHAR(32)` **without hyphens**; datetimes as `DATETIME`; JSON columns as `JSON`; booleans as `BOOLEAN`.
- **Foreign keys declared:** ~116 FK definitions on `uat` (SQLAlchemy-created).
- **FK enforcement:** `PRAGMA foreign_keys` = **0** on the connection used for inspection (SQLite default off unless enabled per connection).
- **Indexes:** ~29 non-PK indexes on `uat`.

---

## 4. Table-by-table comparison (SQLite trio)

Column shapes match. **Data volume differs.**

Legend: count per DB.

| Table | uat | local | bak_uat | Notes |
|---|---:|---:|---:|---|
| users | 27 | 27 | 49 | Same 27 emails in uat/local; bak has +22 |
| roles | 28 | 28 | 28 | Seed-aligned |
| permissions | 69 | 69 | 69 | Seed-aligned |
| role_permissions | 786 | 786 | 786 | Seed-aligned |
| user_profiles | 0 | 0 | 20 | bak only |
| campuses | 1 | 1 | 1 | **Different campus UUIDs** in each file |
| students | 1 | 0 | 3 | uat has demo student; bak richer |
| admissions | 0 | 0 | 3 | bak |
| admission_enquiries | 0 | 0 | 5 | bak |
| guardians | 0 | 0 | 2 | bak |
| hr_employees | 3 | 0 | 6 | uat partial; bak richer |
| hr_records | 0 | 0 | 16 | bak |
| finance_records | 0 | 0 | 0 | empty everywhere |
| student_attendance | 0 | 0 | 1 | bak |
| ops_records | 2 | 0 | 8 | see transport/hostel |
| front_office_records | 0 | 0 | 1 | bak |
| leave_requests | 0 | 0 | 7 | bak |
| tc_requests | 0 | 0 | 1 | bak |
| announcements | 0 | 0 | 59 | bak |
| lesson_plans | 0 | 0 | 1 | bak |
| exams / exam_types | 0 / 0 | 0 / 0 | 2 / 29 | bak |
| notifications | 0 | 0 | 612 | bak |
| audit_logs | 12 | 5 | 516 | bak heaviest |
| calendar_events | 0 | 0 | 18 | bak |
| school_classes / sections | 0 / 0 | 0 / 0 | 1 / 3 | bak |

Tables with **0 rows in all three** (among important set): `finance_records`, `academics_records`, `audit_records`, `tasks`, `escalations`, `mark_entries` (and several others).

---

## 5. Record-count comparison — domain focus

### Roles / permissions

| DB | users | roles | permissions | role_permissions |
|---|---:|---:|---:|---:|
| uat | 27 | 28 | 69 | 786 |
| local | 27 | 28 | 69 | 786 |
| bak_uat | 49 | 28 | 69 | 786 |

**UUID identity hazard:** for the 27 shared emails, **uat vs local = 0 same user UUIDs / 27 different**; **uat vs bak = 0 same / 27 different**. Seeds recreate identities. Do **not** merge by UUID across SQLite files.

### Students / admissions

| DB | students | admissions | enquiries | guardians |
|---|---:|---:|---:|---:|
| uat | 1 | 0 | 0 | 0 |
| local | 0 | 0 | 0 | 0 |
| bak_uat | 3 | 3 | 5 | 2 |

### HR / finance / attendance

| DB | hr_employees | hr_records | finance_records | student_attendance |
|---|---:|---:|---:|---:|
| uat | 3 | 0 | 0 | 0 |
| local | 0 | 0 | 0 | 0 |
| bak_uat | 6 | 16 | 0 | 1 |

### Hostel / transport (`ops_records`)

| DB | ops rows | Collections |
|---|---:|---|
| uat | 2 | `transport-drivers` only — public_ids `TDR-UAT-LOCAL`, `TDR-0002` (**newest TM UAT**) |
| local | 0 | — |
| bak_uat | 8 | `hostel-assignments` (2), `hostel-payments` (1), `library-*` (3), `transport-drivers` (`TDR-UAT-1`), `transport-vehicles` (`TVH-UAT-1`) |

**Newer unique operational data:** transport drivers in **uat**; hostel/library/legacy transport samples in **bak_uat**. **local** is essentially a fresh seed shell.

---

## 6. Missing tables and columns

### SQLite vs current SQLAlchemy

- Tables: **none missing / none extra** (52 = 52).
- Columns: no per-table column gaps detected vs metadata for the three files.

### PostgreSQL vs current SQLAlchemy (inferred risk)

Without live PG access, treat historical PG (Oct audit at Alembic **0012**, ~48 tables) as **behind** current head **0018** and current metadata **52** tables. Likely gaps on an untouched `qmis_erp`:

- Tables added after 0012 (examples from revisions): academics/ops/audit collections, admission email/pending-pw, student placement, exam academic year, etc.
- Possible VARCHAR↔UUID drift on older altered columns (documented historically; migrations `0002`–`0004` address some).

**Must re-verify** after authorized PG login: `\dt`, column types on UUID FKs, `select version_num from alembic_version`, `select count(*) from users`.

---

## 7. SQLAlchemy dialect type map (compatibility preview)

From compiling current models:

| Logical type | SQLite compile | PostgreSQL compile | Count of columns (approx.) |
|---|---|---|---:|
| UUID | `CHAR(32)` | `UUID` | 171 |
| timezone datetime | `DATETIME` | `TIMESTAMP WITH TIME ZONE` | 71 |
| JSON / BOOL / VARCHAR / TEXT | aligned or close | aligned | remainder |

Data migration must convert 32-char hex UUIDs ↔ PostgreSQL `uuid` (insert hyphenated or cast explicitly).

---

## 8. Which database has unique / newer data?

| Priority for content salvage | DB | Why |
|---|---|---|
| 1 — newest transport UAT | `qmis_erp_uat.db` | Active API; `TDR-UAT-LOCAL`, `TDR-0002` |
| 2 — richest historical local | `qmis_erp_local.db.bak_uat` | Announcements, notifications, hostel ops, more users/students |
| 3 — emptyish seed twin | `qmis_erp_local.db` | Same emails as uat, **different UUIDs**, almost no domain rows |
| 4 — shared PG (unverified) | `qmis_erp` @ 5432 | Reported ~245 users; older schema; **do not overwrite** |

---

## 9. Evidence sources

- Live process inspection (`psutil`): uvicorn `DATABASE_URL` → `./qmis_erp_uat.db`
- Read-only SQLAlchemy inspect / counts on the three SQLite files
- `Base.metadata` compile for SQLite vs PostgreSQL types
- Failed PG connect with documented example credentials only
- Prior docs under `backend/docs/` (historical PG baseline only)
