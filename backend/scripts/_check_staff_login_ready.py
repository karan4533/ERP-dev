"""Confirm live staff teacher accounts exist (no passwords read or printed)."""

from __future__ import annotations

import json
import os
import sys
from pathlib import Path

BACKEND_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_ROOT))


def load_url() -> str:
    vals: dict[str, str] = {}
    for line in (BACKEND_ROOT / ".env").read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        vals[key.strip()] = value.strip().strip('"').strip("'")
    return vals["DATABASE_URL"]


def main() -> int:
    from sqlalchemy import create_engine, text

    url = load_url()
    os.environ["DATABASE_URL"] = url
    engine = create_engine(url)
    with engine.connect() as conn:
        teachers = conn.execute(
            text(
                """
                SELECT count(*) FROM hr_employees e
                JOIN users u ON u.id = e.user_id
                JOIN roles r ON r.id = u.role_id
                WHERE e.employee_code LIKE 'EMP-QMIS-%'
                  AND r.code = 'teacher'
                  AND u.is_active = true
                  AND u.must_change_password = true
                """
            )
        ).scalar()
        demo = conn.execute(
            text(
                """
                SELECT u.is_active, r.code
                FROM users u
                JOIN roles r ON r.id = u.role_id
                WHERE lower(u.email) = 'teacher@qmis.edu'
                """
            )
        ).first()
        total_staff = conn.execute(
            text(
                """
                SELECT count(*) FROM hr_employees e
                JOIN users u ON u.id = e.user_id
                WHERE e.employee_code LIKE 'EMP-QMIS-%' AND u.is_active = true
                """
            )
        ).scalar()
    xlsx = Path(__file__).resolve().parents[2] / "local" / "credentials" / "Queen_Mira_Staff_Login_Credentials.xlsx"
    print(
        json.dumps(
            {
                "activeEmpQmisLogins": int(total_staff or 0),
                "activeTeacherEmpQmisMustChange": int(teachers or 0),
                "demoTeacherExists": bool(demo),
                "demoTeacherActive": bool(demo[0]) if demo else False,
                "demoTeacherRole": demo[1] if demo else None,
                "credentialsExcelExists": xlsx.is_file(),
                "credentialsExcelPath": "local/credentials/Queen_Mira_Staff_Login_Credentials.xlsx",
            },
            indent=2,
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
