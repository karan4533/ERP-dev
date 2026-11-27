"""Provision dedicated central Admin + Super Admin logins (create-missing-only).

Default: isolated SQLite under backend/local/ — never touches production.

Examples:
  python scripts/provision_central_admins.py --dry-run
  python scripts/provision_central_admins.py --write-credentials ../local/credentials/central-admins-handoff.json
  python scripts/provision_central_admins.py --from-env --skip-seed --i-understand-live --dry-run

Live write requires: --from-env --skip-seed --i-understand-live --write-credentials <path>
and separate partner approval. Never resets existing staff passwords.
"""

from __future__ import annotations

import argparse
import json
import os
import sys
from datetime import datetime, timezone
from pathlib import Path

BACKEND_ROOT = Path(__file__).resolve().parents[1]
REPO_ROOT = BACKEND_ROOT.parent
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))


def _looks_live(url: str) -> bool:
    lowered = (url or "").lower()
    if "sqlite" in lowered:
        return False
    return "postgres" in lowered or "mysql" in lowered or "mssql" in lowered


def _url_from_dotenv() -> str:
    vals: dict[str, str] = {}
    for line in (BACKEND_ROOT / ".env").read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        vals[key.strip()] = value.strip().strip('"').strip("'")
    url = vals.get("DATABASE_URL") or ""
    if not url:
        raise SystemExit("backend/.env DATABASE_URL missing")
    return url


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--isolated-sqlite", type=Path, default=None)
    parser.add_argument("--database-url", default="")
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--write-credentials", type=Path, default=None)
    parser.add_argument("--i-understand-live", action="store_true")
    parser.add_argument("--from-env", action="store_true")
    parser.add_argument(
        "--skip-seed",
        action="store_true",
        help="Do not call seed_reference_data (required for live).",
    )
    args = parser.parse_args()

    os.environ.setdefault("ENVIRONMENT", "development")
    os.environ["SMTP_HOST"] = ""
    os.environ["WHATSAPP_API_URL"] = ""
    os.environ["WHATSAPP_API_TOKEN"] = ""
    os.environ["INTEGRATIONS_MODE"] = ""

    if args.from_env:
        db_url = _url_from_dotenv()
        print("Using DATABASE_URL from backend/.env (credentials not printed).")
    elif args.database_url:
        db_url = args.database_url
    else:
        sqlite_path = args.isolated_sqlite or (BACKEND_ROOT / "local" / "central_admin_provision_isolated.sqlite3")
        sqlite_path.parent.mkdir(parents=True, exist_ok=True)
        db_url = f"sqlite+pysqlite:///{sqlite_path.resolve().as_posix()}"
        print(f"Using isolated SQLite: {sqlite_path}")

    live = _looks_live(db_url)
    if live and not args.i_understand_live:
        print("Refusing non-SQLite database URL without --i-understand-live.", file=sys.stderr)
        return 2
    if live and not args.skip_seed:
        print("Live runs require --skip-seed so demo seeds are not rewritten.", file=sys.stderr)
        return 2

    os.environ["DATABASE_URL"] = db_url

    from sqlalchemy import create_engine, select
    from sqlalchemy.orm import sessionmaker
    from sqlalchemy.pool import StaticPool

    from app.core.config import settings
    from app.models import Campus, User
    from app.models.base import Base
    from app.services.central_admin_provision import (
        central_account_targets,
        provision_central_admins,
        write_credential_handoff,
    )
    from app.services.seed import seed_reference_data

    settings.database_url = db_url
    settings.smtp_host = ""
    settings.whatsapp_api_url = ""
    settings.whatsapp_api_token = ""
    settings.integrations_mode = ""

    connect_args = {"check_same_thread": False} if db_url.startswith("sqlite") else {}
    engine_kwargs: dict = {"connect_args": connect_args}
    if ":memory:" in db_url:
        engine_kwargs["poolclass"] = StaticPool
    engine = create_engine(db_url, **engine_kwargs)
    if not live:
        Base.metadata.create_all(bind=engine)
    SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)

    targets = central_account_targets()
    print("--- Central account targets (emails only) ---")
    for row in targets:
        print(f"  email={row['email']} role={row['role']}")

    with SessionLocal() as db:
        if not args.skip_seed:
            seed_reference_data(db)
        campus = db.scalar(select(Campus).where(Campus.code == "QMIS-MDU"))
        if campus is None:
            print("Campus QMIS-MDU missing.", file=sys.stderr)
            return 1

        before = {email for (email,) in db.execute(select(User.email)).all()}
        report = provision_central_admins(
            db, campus=campus, dry_run=args.dry_run, commit=False
        )

        created_emails = {c.login_username.lower() for c in report.created}
        if created_emails & {e.lower() for e in before} and not args.dry_run:
            db.rollback()
            print("SAFETY STOP: attempted recreate of existing email.", file=sys.stderr)
            return 3

        print("--- Provision report ---")
        print(
            json.dumps(
                {
                    "mode": "dry-run" if args.dry_run else ("live" if live else "isolated"),
                    "inspected": report.inspected,
                    "new_accounts_created": report.new_accounts_created,
                    "existing_accounts_preserved": report.existing_accounts_preserved,
                    "preserved": report.preserved,
                    "review": report.review,
                    "would_create_emails": [c.login_username for c in report.created],
                    "would_create_roles": [c.role for c in report.created],
                },
                indent=2,
            )
        )

        if args.dry_run:
            db.rollback()
            print("Dry-run complete. No users committed. No passwords issued.")
            return 0

        if report.new_accounts_created and not args.write_credentials:
            db.rollback()
            print(
                "Refusing to commit without --write-credentials "
                "(temporary passwords would be lost).",
                file=sys.stderr,
            )
            return 4

        if args.write_credentials:
            out = args.write_credentials.resolve()
            if "local" not in out.parts or "credentials" not in out.parts:
                db.rollback()
                print("Credential path must be under local/credentials/", file=sys.stderr)
                return 5
            write_credential_handoff(
                out,
                report.created,
                note=(
                    f"Central Admin/Super Admin temps {datetime.now(timezone.utc).isoformat()} "
                    f"({'live' if live else 'isolated'}). Create-missing-only. "
                    "Delete after secure distribution."
                ),
            )
            db.commit()
            print(f"Credential handoff written: {out}")
            print("Transfer via approved secure channel, then delete the file.")
        else:
            db.commit()

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
