"""Quick structural health check for staff logins in Postgres."""
from __future__ import annotations

import json
from pathlib import Path

from sqlalchemy import create_engine, text

BACKEND = Path(__file__).resolve().parents[1]
NEEDED_ROLES = [
    "superadmin",
    "jointdirectoraudit",
    "jointdirector",
    "director",
    "principal",
    "qualityauditor",
    "processauditor",
    "coordinator",
    "pro",
    "prm",
    "financemanager",
    "accountassistant",
    "hr",
    "itsupportmanager",
    "librarian",
    "teacher",
    "jointdirectorassistant",
    "housekeepingmanager",
    "maintenancemanager",
    "gatekeeper",
    "stationerystoremanager",
]


def main() -> None:
    vals: dict[str, str] = {}
    for line in (BACKEND / ".env").read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        k, v = line.split("=", 1)
        vals[k.strip()] = v.strip().strip('"').strip("'")

    engine = create_engine(vals["DATABASE_URL"])
    with engine.connect() as c:
        roles = {r for (r,) in c.execute(text("SELECT code FROM roles")).all()}
        missing_roles = [r for r in NEEDED_ROLES if r not in roles]

        users = c.execute(text("SELECT count(*) FROM users")).scalar()
        active = c.execute(text("SELECT count(*) FROM users WHERE is_active")).scalar()
        must = c.execute(
            text(
                """
                SELECT count(*) FROM users u
                WHERE u.is_active AND u.must_change_password
                  AND u.email NOT LIKE '%@qmis.edu'
                """
            )
        ).scalar()

        emp = c.execute(
            text("SELECT count(*) FROM hr_employees WHERE employee_code LIKE 'EMP-QMIS-%'")
        ).scalar()
        linked = c.execute(
            text(
                """
                SELECT count(*) FROM hr_employees h
                JOIN users u ON u.id = h.user_id
                WHERE h.employee_code LIKE 'EMP-QMIS-%' AND u.is_active
                """
            )
        ).scalar()
        orphan_hr = c.execute(
            text(
                """
                SELECT count(*) FROM hr_employees h
                WHERE h.employee_code LIKE 'EMP-QMIS-%'
                  AND (h.user_id IS NULL OR NOT EXISTS (
                    SELECT 1 FROM users u WHERE u.id = h.user_id
                  ))
                """
            )
        ).scalar()
        staff_no_role = c.execute(
            text(
                """
                SELECT count(*) FROM users u
                LEFT JOIN roles r ON r.id = u.role_id
                WHERE u.email NOT LIKE '%@qmis.edu' AND r.id IS NULL
                """
            )
        ).scalar()
        dup_emails = c.execute(
            text(
                """
                SELECT count(*) FROM (
                  SELECT lower(email) AS e FROM users GROUP BY lower(email) HAVING count(*) > 1
                ) t
                """
            )
        ).scalar()

        fk_ok = c.execute(
            text(
                """
                SELECT count(*) FROM information_schema.table_constraints
                WHERE table_name = 'users' AND constraint_type = 'FOREIGN KEY'
                """
            )
        ).scalar()

    print(
        json.dumps(
            {
                "rolesTotal": len(roles),
                "neededRolesMissing": missing_roles,
                "usersTotal": users,
                "usersActive": active,
                "nonDemoMustChangePassword": must,
                "empQmis": emp,
                "empQmisLinkedActive": linked,
                "empQmisOrphan": orphan_hr,
                "usersMissingRoleFk": staff_no_role,
                "duplicateEmails": dup_emails,
                "usersForeignKeys": fk_ok,
                "structureOk": not missing_roles
                and emp == linked
                and orphan_hr == 0
                and staff_no_role == 0
                and dup_emails == 0,
            },
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
