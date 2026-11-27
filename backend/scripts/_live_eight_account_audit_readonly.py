"""Read-only live audit of eight staff accounts. Never writes. Never prints secrets."""
from __future__ import annotations

import os
import re
import sys

from sqlalchemy import create_engine, text

EXPECTED = {
    "vaiyapuri.gurusamy@queenmira.com": "pro",
    "jeyakumarselvam@queenmira.com": "pro",
    "vengadeshwari1999@gmail.com": "cctv",
    "meenavijitha92@gmail.com": "cctv",
    "shanmugavalli1987@gmail.com": "fileroom",
    "emp-qmis-117@queenmira.com": "fileroom",
    "ecacoordinator@queenmira.com": "transportmanager",
    "kausikg1@gmail.com": "housekeepingmanager",
}

NEEDED_ROLES = sorted(set(EXPECTED.values()))


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
    print("MODE read_only_audit")

    eng = create_engine(url)
    with eng.connect() as conn:
        role_rows = conn.execute(
            text("select code, id::text from roles where code = any(:codes) order by code"),
            {"codes": NEEDED_ROLES},
        ).fetchall()
        print("ROLE_DEFS")
        present = {code for code, _ in role_rows}
        for code in NEEDED_ROLES:
            print(f"  role_code={code} exists={code in present}")

        rows = conn.execute(
            text(
                """
                select
                  lower(u.email) as email,
                  u.id::text as user_id,
                  u.is_active,
                  u.must_change_password,
                  u.role_id::text as role_id,
                  r.code as role_code
                from users u
                left join roles r on r.id = u.role_id
                where lower(u.email) = any(:emails)
                order by 1
                """
            ),
            {"emails": list(EXPECTED)},
        ).fetchall()
        by_email = {r[0]: r for r in rows}

        print("ACCOUNTS")
        for email, want in EXPECTED.items():
            row = by_email.get(email)
            if row is None:
                print(
                    f"  email={email} exists=false active=- user_id=- role_id=- "
                    f"role_code=MISSING want={want} action=missing_account"
                )
                continue
            _, user_id, active, mcp, role_id, role_code = row
            match = role_code == want
            action = "unchanged" if match else "role_remap"
            print(
                f"  email={email} exists=true active={active} user_id={user_id} "
                f"role_id={role_id} role_code={role_code} mcp={mcp} want={want} "
                f"match={match} action={action}"
            )

        print("AUDIT_READONLY_OK")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
