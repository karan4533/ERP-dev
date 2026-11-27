"""Remap File Room / CCTV staff roles on a live Postgres DATABASE_URL.

Guardrails:
- Refuses localhost / 127.0.0.1
- Does not print passwords or the raw DATABASE_URL
- Does not change passwords
"""
from __future__ import annotations

import os
import re
import sys

from sqlalchemy import create_engine, text

TARGETS = {
    "shanmugavalli1987@gmail.com": "fileroom",
    "emp-qmis-117@queenmira.com": "fileroom",
    "vengadeshwari1999@gmail.com": "cctv",
    "meenavijitha92@gmail.com": "cctv",
}
HR_TITLE = {"fileroom": "File Room", "cctv": "CCTV Room"}


def main() -> int:
    url = os.environ.get("DATABASE_URL") or ""
    if not url:
        print("MISSING_DATABASE_URL")
        return 2
    redacted = re.sub(r":[^:@/]+@", ":***@", url)
    if "localhost" in url or "127.0.0.1" in url:
        print("REFUSE_LOCALHOST", redacted)
        return 3
    print("DB_HOST_REDACTED", redacted)

    eng = create_engine(url)

    def roles_for(conn):
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
            {"emails": list(TARGETS)},
        ).fetchall()
        return {email: code for email, code in rows}

    dry_run = (os.environ.get("REMAP_DRY_RUN") or "").strip() in {"1", "true", "yes"}

    with eng.begin() as conn:
        before = roles_for(conn)
        print("BEFORE")
        for email, want in TARGETS.items():
            print(f"  {email} role={before.get(email, 'MISSING')} want={want}")
        if len(before) != len(TARGETS):
            print("INCOMPLETE_FIND")
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
                    set role_id = :rid
                    where lower(email) = :email
                    """
                ),
                {"rid": role_id, "email": email},
            )
            conn.execute(
                text(
                    """
                    update hr_employees
                    set role_title = :title
                    where lower(email) = :email
                    """
                ),
                {"title": HR_TITLE[want], "email": email},
            )

        after = roles_for(conn)
        print("AFTER")
        ok = True
        for email, want in TARGETS.items():
            got = after.get(email)
            print(f"  {email} role={got} ok={got == want}")
            if got != want:
                ok = False
        if not ok:
            return 6
        print("REMAP_OK")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
