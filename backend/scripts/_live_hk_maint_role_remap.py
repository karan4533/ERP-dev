"""Remap Housekeeping / Maintenance head roles on a live Postgres DATABASE_URL.

Scope (role only — passwords untouched):
  kausikg1@gmail.com           -> housekeepingmanager
  sripradeeptheni96@gmail.com  -> maintenancemanager

Guardrails:
- Refuses localhost / 127.0.0.1
- Does not print passwords or the raw DATABASE_URL
- Does not change passwords
- Creates missing role + permission links from matrix if needed
- REMAP_DRY_RUN=1 prints BEFORE only

Usage:
  $env:DATABASE_URL = 'postgresql+psycopg://qmis_app:***@qmis-erp-db....rds.amazonaws.com:5432/qmis_erp'
  $env:REMAP_DRY_RUN = '1'
  python scripts/_live_hk_maint_role_remap.py
  Remove-Item Env:REMAP_DRY_RUN
  python scripts/_live_hk_maint_role_remap.py
"""
from __future__ import annotations

import os
import re
import sys
from pathlib import Path

BACKEND_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_ROOT))

from sqlalchemy import create_engine, select, text
from sqlalchemy.orm import Session

TARGETS = {
    "kausikg1@gmail.com": "housekeepingmanager",
    "sripradeeptheni96@gmail.com": "maintenancemanager",
}

HR_META = {
    "housekeepingmanager": {
        "role_title": "Housekeeping Manager",
        "department": "Housekeeping",
        "designation": "Housekeeping Manager",
    },
    "maintenancemanager": {
        "role_title": "Maintenance Manager",
        "department": "Maintenance",
        "designation": "Maintenance Manager",
    },
}


def _redact(url: str) -> str:
    return re.sub(r":[^:@/]+@", ":***@", url)


def _ensure_roles(db: Session) -> dict:
    from scripts.replace_staff_logins_from_csv import ensure_roles_and_permissions

    return ensure_roles_and_permissions(db)


def _roles_for(conn, emails: list[str]) -> dict[str, str]:
    rows = conn.execute(
        text(
            """
            select lower(u.email) as email, r.code
            from users u
            join roles r on r.id = u.role_id
            where lower(u.email) = any(:emails)
            order by 1
            """
        ),
        {"emails": emails},
    ).fetchall()
    return {email: code for email, code in rows}


def main() -> int:
    url = (os.environ.get("DATABASE_URL") or "").strip()
    if not url:
        print("MISSING_DATABASE_URL")
        return 2
    redacted = _redact(url)
    if "localhost" in url or "127.0.0.1" in url:
        print("REFUSE_LOCALHOST", redacted)
        return 3
    if "rds.amazonaws.com" not in url and "amazonaws.com" not in url:
        # Allow non-AWS remote hosts only with explicit override.
        if (os.environ.get("ALLOW_NON_RDS") or "").strip() not in {"1", "true", "yes"}:
            print("REFUSE_NON_RDS", redacted)
            return 3

    dry_run = (os.environ.get("REMAP_DRY_RUN") or "").strip() in {"1", "true", "yes"}
    print("DB_HOST_REDACTED", redacted)
    print("MODE", "dry_run" if dry_run else "execute")

    eng = create_engine(url)
    emails = list(TARGETS)

    with Session(eng) as db:
        roles = _ensure_roles(db)
        for want in set(TARGETS.values()):
            if want not in roles:
                print("ROLE_MISSING_AFTER_ENSURE", want)
                return 5
        if not dry_run:
            db.commit()
        else:
            db.rollback()

    with eng.begin() as conn:
        before = _roles_for(conn, emails)
        print("BEFORE")
        for email, want in TARGETS.items():
            print(f"  {email} role={before.get(email, 'MISSING')} want={want}")
        missing = [email for email in TARGETS if email not in before]
        if missing:
            print("INCOMPLETE_FIND", ",".join(missing))
            return 4

        if dry_run:
            print("DRY_RUN_OK")
            return 0

        for email, want in TARGETS.items():
            role_id = conn.execute(
                text("select id from roles where code = :code"),
                {"code": want},
            ).scalar()
            if role_id is None:
                print("ROLE_MISSING", want)
                return 5
            conn.execute(
                text(
                    """
                    update users
                    set role_id = :rid,
                        is_active = true
                    where lower(email) = :email
                    """
                ),
                {"rid": role_id, "email": email},
            )
            meta = HR_META[want]
            # Best-effort HR row update when present; ignore if table/columns differ.
            try:
                conn.execute(
                    text(
                        """
                        update hr_employees
                        set role_title = :role_title,
                            department = :department,
                            designation = :designation
                        where lower(email) = :email
                        """
                    ),
                    {
                        "role_title": meta["role_title"],
                        "department": meta["department"],
                        "designation": meta["designation"],
                        "email": email,
                    },
                )
            except Exception as exc:  # noqa: BLE001
                print("HR_UPDATE_SKIP", email, type(exc).__name__)

        after = _roles_for(conn, emails)
        print("AFTER")
        ok = True
        for email, want in TARGETS.items():
            got = after.get(email)
            print(f"  {email} role={got} ok={got == want}")
            if got != want:
                ok = False
        if not ok:
            raise RuntimeError("REMAP_VERIFY_FAILED")
        print("REMAP_OK")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
