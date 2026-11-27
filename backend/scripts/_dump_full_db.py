"""Create full Postgres dumps (custom + plain SQL) under backend/local/db_backups/."""
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
        raise SystemExit("Expected Postgres DATABASE_URL in backend/.env")
    return url


def main() -> int:
    raw = load_database_url()
    # sqlalchemy style postgresql+psycopg://...
    raw = re.sub(r"^postgresql\+[^:]+://", "postgresql://", raw)
    parsed = urlparse(raw)
    user = unquote(parsed.username or "")
    password = unquote(parsed.password or "")
    host = parsed.hostname or "localhost"
    port = str(parsed.port or 5432)
    db = (parsed.path or "/").lstrip("/")
    if not user or not db:
        raise SystemExit("Could not parse DATABASE_URL")

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    stamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    dump_fc = OUT_DIR / f"qmis_erp_full_{stamp}.dump"
    dump_sql = OUT_DIR / f"qmis_erp_full_{stamp}.sql"

    env = os.environ.copy()
    env["PGPASSWORD"] = password

    common = ["-h", host, "-p", port, "-U", user, "-d", db]
    print(f"Dumping database={db} host={host} port={port} user={user}")

    r1 = subprocess.run(
        ["pg_dump", *common, "-Fc", "-f", str(dump_fc)],
        env=env,
        capture_output=True,
        text=True,
    )
    if r1.returncode != 0:
        print(r1.stderr or r1.stdout, file=sys.stderr)
        return r1.returncode

    r2 = subprocess.run(
        ["pg_dump", *common, "--no-owner", "--no-acl", "-f", str(dump_sql)],
        env=env,
        capture_output=True,
        text=True,
    )
    if r2.returncode != 0:
        print(r2.stderr or r2.stdout, file=sys.stderr)
        return r2.returncode

    print(f"OK custom dump: {dump_fc} ({dump_fc.stat().st_size} bytes)")
    print(f"OK SQL dump:    {dump_sql} ({dump_sql.stat().st_size} bytes)")
    print("Both files are under backend/local/db_backups/ (gitignored).")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
