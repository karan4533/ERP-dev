"""Backup live Postgres from backend/.env and verify the dump.

Prefers restore into a temporary database. If CREATEDB is denied, verifies the
custom-format dump via ``pg_restore --list`` (TOC must include core tables).

Never prints connection strings or passwords.
"""

from __future__ import annotations

import os
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import unquote, urlparse

BACKEND_ROOT = Path(__file__).resolve().parents[1]
BACKUP_DIR = BACKEND_ROOT / "local" / "db_backups"
PG_BIN = Path(r"C:\Program Files\PostgreSQL\18\bin")


def _tool(name: str) -> str:
    candidate = PG_BIN / f"{name}.exe"
    if candidate.is_file():
        return str(candidate)
    return name


def load_database_url() -> str:
    vals: dict[str, str] = {}
    for line in (BACKEND_ROOT / ".env").read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        vals[key.strip()] = value.strip().strip('"').strip("'")
    url = vals.get("DATABASE_URL") or ""
    if "postgres" not in url.lower():
        raise SystemExit("backup_live_db.py expects a Postgres DATABASE_URL in backend/.env")
    return url


def pg_env(url: str) -> tuple[dict[str, str], str]:
    parsed = urlparse(url)
    dbname = (parsed.path or "/").lstrip("/") or "postgres"
    env = os.environ.copy()
    if parsed.password:
        env["PGPASSWORD"] = unquote(parsed.password)
    env["PGHOST"] = parsed.hostname or "localhost"
    env["PGPORT"] = str(parsed.port or 5432)
    env["PGUSER"] = unquote(parsed.username or "postgres")
    # Prefer PostgreSQL 18 binaries on PATH for this process.
    env["PATH"] = str(PG_BIN) + os.pathsep + env.get("PATH", "")
    return env, dbname


def main() -> int:
    url = load_database_url()
    env, dbname = pg_env(url)
    BACKUP_DIR.mkdir(parents=True, exist_ok=True)
    stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    dump_path = BACKUP_DIR / f"qmis_live_{stamp}.dump"
    verify_db = f"qmis_restore_verify_{stamp}".lower().replace("-", "_")

    print(f"Creating custom-format dump -> {dump_path.name}")
    dump = subprocess.run(
        [_tool("pg_dump"), "-Fc", "-d", dbname, "-f", str(dump_path)],
        env=env,
        capture_output=True,
        text=True,
    )
    if dump.returncode != 0:
        print("pg_dump failed:", (dump.stderr or dump.stdout)[-500:], file=sys.stderr)
        return 1
    size = dump_path.stat().st_size
    if size < 1024:
        print(f"Dump too small ({size} bytes) — aborting.", file=sys.stderr)
        return 1
    print(f"Dump OK ({size} bytes)")

    listed = subprocess.run(
        [_tool("pg_restore"), "--list", str(dump_path)],
        env=env,
        capture_output=True,
        text=True,
    )
    if listed.returncode != 0:
        print("pg_restore --list failed:", (listed.stderr or "")[-500:], file=sys.stderr)
        return 1
    toc = listed.stdout or ""
    required = ("TABLE public.users", "TABLE public.hr_employees", "TABLE public.roles")
    # pg_restore -l format varies; accept either "TABLE public.users" or "TABLE users"
    missing = []
    for needle in ("users", "hr_employees", "roles"):
        if f"TABLE data public.{needle}" not in toc and f"TABLE public.{needle}" not in toc and f"TABLE {needle}" not in toc:
            # looser: any line mentioning the table name as TABLE
            if not any(line for line in toc.splitlines() if "TABLE" in line and needle in line):
                missing.append(needle)
    if missing:
        print(f"Dump TOC missing expected tables: {missing}", file=sys.stderr)
        return 1
    print("Dump TOC lists users / hr_employees / roles")

    restore_mode = "toc_list_only"
    created = subprocess.run(
        [_tool("createdb"), verify_db],
        env=env,
        capture_output=True,
        text=True,
    )
    if created.returncode == 0:
        restored = subprocess.run(
            [_tool("pg_restore"), "--no-owner", "--dbname", verify_db, str(dump_path)],
            env=env,
            capture_output=True,
            text=True,
        )
        check = subprocess.run(
            [
                _tool("psql"),
                "-d",
                verify_db,
                "-tAc",
                "SELECT count(*) FROM information_schema.tables "
                "WHERE table_schema='public' AND table_name='users'",
            ],
            env=env,
            capture_output=True,
            text=True,
        )
        ok = check.returncode == 0 and check.stdout.strip() == "1"
        subprocess.run(
            [_tool("dropdb"), "--if-exists", verify_db],
            env=env,
            capture_output=True,
            text=True,
        )
        if not ok:
            print("Full restore verification failed.", file=sys.stderr)
            print((restored.stderr or restored.stdout or "")[-500:], file=sys.stderr)
            return 1
        restore_mode = "full_temp_database"
        print("Full restore into temporary database succeeded; temp DB dropped.")
    else:
        err = (created.stderr or "").strip()
        if "permission denied" in err.lower():
            print(
                "CREATEDB permission denied — dump integrity verified via pg_restore --list only. "
                "Keep this dump before live provisioning."
            )
        else:
            print("createdb failed:", err[-500:], file=sys.stderr)
            return 1

    meta = BACKUP_DIR / f"qmis_live_{stamp}.json"
    meta.write_text(
        (
            "{\n"
            f'  "dump": "{dump_path.name}",\n'
            f'  "bytes": {size},\n'
            f'  "verifyMode": "{restore_mode}",\n'
            f'  "createdAt": "{stamp}"\n'
            "}\n"
        ),
        encoding="utf-8",
    )
    print(f"BACKUP_PATH={dump_path}")
    print(f"VERIFY_MODE={restore_mode}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
