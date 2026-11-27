"""Provision missing Queen Mira staff logins (idempotent, create-missing-only).

Default: isolated SQLite file under backend/local/ — never touches production.

Examples:
  python scripts/provision_queen_mira_staff_logins.py --dry-run
  python scripts/provision_queen_mira_staff_logins.py --isolated-sqlite backend/local/staff_provision_uat.sqlite3
  python scripts/provision_queen_mira_staff_logins.py --database-url sqlite+pysqlite:///./local/staff.db --write-credentials ../local/credentials/handoff.json

Refuses live/Postgres URLs unless --i-understand-live is passed (not used in the default implementation pass).
"""

from __future__ import annotations

import argparse
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
    if "sqlite" in lowered and ":memory:" not in lowered:
        return False
    if ":memory:" in lowered:
        return False
    return "postgres" in lowered or "mysql" in lowered or "mssql" in lowered


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--roster",
        type=Path,
        default=REPO_ROOT / "src" / "Pages" / "HR" / "domain" / "hrSeed.js",
        help="Path to hrSeed.js",
    )
    parser.add_argument(
        "--isolated-sqlite",
        type=Path,
        default=None,
        help="Use this SQLite file (created if missing). Default when no --database-url.",
    )
    parser.add_argument("--database-url", default="", help="Explicit SQLAlchemy URL (avoid for this pass).")
    parser.add_argument("--dry-run", action="store_true", help="Inspect and report; write no users/credentials.")
    parser.add_argument(
        "--write-credentials",
        type=Path,
        default=None,
        help="Gitignored handoff JSON for newly created accounts only.",
    )
    parser.add_argument(
        "--i-understand-live",
        action="store_true",
        help="Required to run against a non-SQLite URL.",
    )
    parser.add_argument(
        "--from-env",
        action="store_true",
        help="Load DATABASE_URL from backend/.env (ignores shell DATABASE_URL override).",
    )
    parser.add_argument(
        "--skip-seed",
        action="store_true",
        help="Do not call seed_reference_data (required for live — avoids resetting demo passwords).",
    )
    args = parser.parse_args()

    os.environ.setdefault("ENVIRONMENT", "development")
    # Block real outbound messaging for this tool.
    os.environ["SMTP_HOST"] = ""
    os.environ["WHATSAPP_API_URL"] = ""
    os.environ["WHATSAPP_API_TOKEN"] = ""
    os.environ["INTEGRATIONS_MODE"] = ""

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

    if args.from_env:
        db_url = _url_from_dotenv()
        print("Using DATABASE_URL from backend/.env (scheme only printed below).")
    elif args.database_url:
        db_url = args.database_url
    else:
        sqlite_path = args.isolated_sqlite or (BACKEND_ROOT / "local" / "staff_provision_isolated.sqlite3")
        sqlite_path.parent.mkdir(parents=True, exist_ok=True)
        db_url = f"sqlite+pysqlite:///{sqlite_path.resolve().as_posix()}"
        print(f"Using isolated SQLite: {sqlite_path}")

    live = _looks_live(db_url)
    if live and not args.i_understand_live:
        print("Refusing non-SQLite database URL without --i-understand-live (safety stop).", file=sys.stderr)
        return 2
    if live and not args.skip_seed:
        print("Live runs require --skip-seed so demo password hashes are not rewritten.", file=sys.stderr)
        return 2
    print(f"Target scheme: {'postgres' if 'postgres' in db_url.lower() else 'other-or-sqlite'}")

    os.environ["DATABASE_URL"] = db_url

    from sqlalchemy import create_engine, select
    from sqlalchemy.orm import sessionmaker
    from sqlalchemy.pool import StaticPool

    from app.core.config import settings
    from app.models import User
    from app.models.base import Base
    from app.services.seed import seed_reference_data
    from app.services.staff_login_provision import (
        campus_by_code,
        load_roster_from_hr_seed,
        provision_missing_staff_logins,
        write_credential_handoff,
    )

    # Reload settings after env mutation.
    settings.database_url = db_url
    settings.smtp_host = ""
    settings.whatsapp_api_url = ""
    settings.whatsapp_api_token = ""
    settings.integrations_mode = ""

    connect_args = {"check_same_thread": False} if db_url.startswith("sqlite") else {}
    engine_kwargs = {"connect_args": connect_args}
    if ":memory:" in db_url:
        engine_kwargs["poolclass"] = StaticPool
    engine = create_engine(db_url, **engine_kwargs)
    if not live:
        Base.metadata.create_all(bind=engine)
    SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)

    roster = load_roster_from_hr_seed(args.roster)
    print(f"Roster loaded: {len(roster)} EMP-QMIS-* rows from {args.roster}")

    with SessionLocal() as db:
        if not args.skip_seed:
            seed_reference_data(db)
        campus = campus_by_code(db)
        if campus is None:
            print("Campus QMIS-MDU missing.", file=sys.stderr)
            return 1

        before_emails = {email for (email,) in db.execute(select(User.email)).all()}
        before_user_count = len(before_emails)

        report = provision_missing_staff_logins(
            db,
            campus=campus,
            roster=roster,
            dry_run=args.dry_run,
            commit=False,
        )

        created_emails = {cred.login_username.lower() for cred in report.created}
        if created_emails & {e.lower() for e in before_emails}:
            db.rollback()
            print("SAFETY STOP: provision attempted to recreate an existing login email.", file=sys.stderr)
            return 3

        print("--- Provision report ---")
        print(f"Inspected: {report.inspected}")
        print(f"Existing accounts preserved: {report.existing_accounts_preserved}")
        print(f"Prior live users present at start: {before_user_count}")
        print(f"New accounts created: {report.new_accounts_created}")
        print(f"Directory-only skipped: {report.directory_only_skipped}")
        print(f"Invalid identity skipped: {report.invalid_identity_skipped}")
        print(f"Ambiguous: {len(report.ambiguous)}")
        print(f"Review notes: {len(report.review)}")
        for line in report.ambiguous:
            print(f"  AMBIGUOUS: {line}")
        for line in report.review:
            print(f"  REVIEW: {line}")

        if args.dry_run:
            db.rollback()
            print("Dry-run complete. No credentials written.")
            return 0

        if report.ambiguous:
            db.rollback()
            print("SAFETY STOP: ambiguous mappings — rolled back; fix and re-run.", file=sys.stderr)
            return 6

        if report.new_accounts_created and not args.write_credentials:
            db.rollback()
            print(
                "Refusing to commit new accounts without --write-credentials "
                "(temporary passwords would be lost).",
                file=sys.stderr,
            )
            return 4

        if args.write_credentials:
            out = args.write_credentials
            resolved = out.resolve()
            forbidden_roots = [
                (REPO_ROOT / "src").resolve(),
                (REPO_ROOT / "backend" / "app").resolve(),
                (REPO_ROOT / "docs").resolve(),
                (REPO_ROOT / "reports").resolve(),
            ]
            if any(str(resolved).startswith(str(root)) for root in forbidden_roots):
                db.rollback()
                print(f"Refusing credential path inside source/docs/reports: {resolved}", file=sys.stderr)
                return 5
            target_label = "live" if live else "isolated"
            try:
                write_credential_handoff(
                    out,
                    report.created,
                    note=(
                        f"Generated {datetime.now(timezone.utc).isoformat()} against {target_label} DB. "
                        "Newly created accounts only. Delete after secure distribution. "
                        "Do not email/WhatsApp unless separately approved."
                    ),
                )
            except Exception:
                db.rollback()
                raise
            db.commit()
            print(f"Credential handoff written: {out}")
            print("Transfer via approved secure channel, then delete the file.")
        else:
            db.commit()

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
