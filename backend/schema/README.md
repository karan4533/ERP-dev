# QMIS ERP — PostgreSQL schema (deployment)

Files in this folder are **code-derived** deployment artifacts for an empty PostgreSQL database.

| File | Purpose |
|------|---------|
| `postgresql_schema_head.sql` | Full `CREATE TABLE` DDL for all **56** registered application tables + indexes, stamped as Alembic `0026_audit_logs_ip_ua` |
| `schema_manifest.json` | Machine-readable table list + head revision |

## Who uses this

- **Backend / DevOps:** apply on empty staging/prod Postgres when Alembic baseline alone cannot bootstrap (see `0001_baseline` no-op).
- **Frontend / GitHub consumers:** pull this folder from the repo for the physical table inventory. UI modules that store data in JSON bags (`ops_records`, `finance_records`, etc.) are listed in `docs/QMIS_PRODUCTION_DATABASE_SCHEMA.md` — they are **not** separate SQL tables.

## Apply (empty database only)

```bash
# Example — use your staging role/URL; never commit passwords
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f backend/schema/postgresql_schema_head.sql
```

Then either:

- continue with Alembic for **future** revisions after `0026`, or  
- run app seed separately (not included here).

## Safety

- Do **not** run this against a database that already has production data.
- Does not include demo users or secrets.
- Historical Alembic files `0001`–`0026` are unchanged; this SQL is a parallel bootstrap artifact for deployment.
