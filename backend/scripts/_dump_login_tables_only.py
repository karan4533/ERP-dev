"""Dump only login-credential tables as apply-ready SQL for partner import.

Tables:
  campuses, roles, permissions, role_permissions, users, hr_employees, user_profiles

Output (gitignored):
  backend/local/db_backups/qmis_login_credentials_only_<stamp>.sql
"""

from __future__ import annotations

import os
import re
import subprocess
import sys
from datetime import datetime
from pathlib import Path
from urllib.parse import unquote, urlparse

BACKEND = Path(__file__).resolve().parents[1]
OUT_DIR = BACKEND / "local" / "db_backups"

LOGIN_TABLES = [
    "campuses",
    "roles",
    "permissions",
    "role_permissions",
    "users",
    "hr_employees",
    "user_profiles",
]


def load_database_url() -> str:
    vals: dict[str, str] = {}
    for line in (BACKEND / ".env").read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        vals[key.strip()] = value.strip().strip('"').strip("'")
    url = vals.get("DATABASE_URL") or ""
    if "postgres" not in url.lower():
        raise SystemExit("Expected Postgres DATABASE_URL")
    return url


def main() -> int:
    raw = load_database_url()
    raw = re.sub(r"^postgresql\+[^:]+://", "postgresql://", raw)
    parsed = urlparse(raw)
    user = unquote(parsed.username or "")
    password = unquote(parsed.password or "")
    host = parsed.hostname or "localhost"
    port = str(parsed.port or 5432)
    db = (parsed.path or "/").lstrip("/")

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    stamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    raw_dump = OUT_DIR / f"_tmp_login_data_{stamp}.sql"
    out = OUT_DIR / f"qmis_login_credentials_only_{stamp}.sql"

    env = os.environ.copy()
    env["PGPASSWORD"] = password
    cmd = [
        "pg_dump",
        "-h",
        host,
        "-p",
        port,
        "-U",
        user,
        "-d",
        db,
        "--data-only",
        "--no-owner",
        "--no-acl",
        "--column-inserts",
    ]
    for table in LOGIN_TABLES:
        cmd.extend(["-t", table])
    cmd.extend(["-f", str(raw_dump)])

    print("Dumping login tables:", ", ".join(LOGIN_TABLES))
    proc = subprocess.run(cmd, env=env, capture_output=True, text=True)
    if proc.returncode != 0:
        print(proc.stderr or proc.stdout, file=sys.stderr)
        return proc.returncode

    body = raw_dump.read_text(encoding="utf-8", errors="replace")
    raw_dump.unlink(missing_ok=True)

    header = f"""-- QMIS login credentials ONLY
-- Generated: {datetime.now().isoformat(timespec='seconds')}
-- Tables replaced by this script:
--   {', '.join(LOGIN_TABLES)}
--
-- HOW TO USE (partner server):
--   1. Schema must already exist (run migrations / app seed roles first).
--   2. psql -h HOST -U USER -d qmis_erp -f {out.name}
--
-- This script REPLACES data in the tables above.
-- session_replication_role=replica temporarily skips FK checks so other
-- tables that reference users are not cascade-deleted.
-- After apply, re-check app login with the client Excel passwords.

BEGIN;

SET session_replication_role = replica;

-- NO CASCADE: do not wipe students/admissions/etc. that reference users.
TRUNCATE TABLE
  role_permissions,
  user_profiles,
  hr_employees,
  users,
  permissions,
  roles,
  campuses
RESTART IDENTITY;

SET session_replication_role = origin;

"""
    footer = """
COMMIT;

-- Verify after restore:
--   SELECT count(*) FROM users;
--   SELECT count(*) FROM hr_employees WHERE employee_code LIKE 'EMP-QMIS-%';
--   SELECT count(*) FROM roles;
"""
    out.write_text(header + body + footer, encoding="utf-8")
    print(f"OK wrote {out} ({out.stat().st_size} bytes)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
