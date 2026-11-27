"""Verify all client handoff credentials exist in Postgres users."""
from __future__ import annotations

import json
from pathlib import Path

from sqlalchemy import create_engine, text

BACKEND_ROOT = Path(__file__).resolve().parents[1]
REPO_ROOT = BACKEND_ROOT.parent


def main() -> int:
    vals: dict[str, str] = {}
    for line in (BACKEND_ROOT / ".env").read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        vals[key.strip()] = value.strip().strip('"').strip("'")

    handoff = json.loads(
        (REPO_ROOT / "local" / "credentials" / "queen-mira-staff-logins-client.json").read_text(
            encoding="utf-8"
        )
    )
    accounts = handoff["accounts"]
    print(f"handoff_count={len(accounts)}")

    engine = create_engine(vals["DATABASE_URL"])
    missing = []
    mismatches = []
    found = 0
    with engine.connect() as conn:
        total = conn.execute(text("SELECT count(*) FROM users")).scalar()
        active = conn.execute(text("SELECT count(*) FROM users WHERE is_active = true")).scalar()
        emp_total = conn.execute(
            text("SELECT count(*) FROM hr_employees WHERE employee_code LIKE 'EMP-QMIS-%'")
        ).scalar()
        emp_linked = conn.execute(
            text(
                """
                SELECT count(*) FROM hr_employees h
                JOIN users u ON u.id = h.user_id
                WHERE h.employee_code LIKE 'EMP-QMIS-%' AND u.is_active = true
                """
            )
        ).scalar()

        for account in accounts:
            email = account["loginUsername"].lower()
            row = conn.execute(
                text(
                    """
                    SELECT u.email, u.is_active, u.must_change_password, r.code AS role
                    FROM users u
                    JOIN roles r ON r.id = u.role_id
                    WHERE lower(u.email) = :email
                    """
                ),
                {"email": email},
            ).mappings().first()
            if row is None:
                missing.append((account["employeeId"], email, account["role"]))
                continue
            found += 1
            if not row["is_active"]:
                mismatches.append((account["employeeId"], email, "inactive"))
            if not row["must_change_password"]:
                mismatches.append((account["employeeId"], email, "must_change=false"))
            if row["role"] != account["role"]:
                mismatches.append(
                    (
                        account["employeeId"],
                        email,
                        f"db_role={row['role']} handoff={account['role']}",
                    )
                )

    print(f"users_total={total}")
    print(f"users_active={active}")
    print(f"handoff_found_in_users={found}/{len(accounts)}")
    print(f"hr_emp_qmis={emp_total} linked_active={emp_linked}")
    print(f"missing={len(missing)}")
    for item in missing:
        print("  MISSING", item)
    print(f"mismatches={len(mismatches)}")
    for item in mismatches[:30]:
        print(" ", item)
    return 0 if not missing and not mismatches else 1


if __name__ == "__main__":
    raise SystemExit(main())
