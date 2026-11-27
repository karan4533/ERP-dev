"""Write XLSX from existing JSON handoff and smoke-verify one password against Postgres."""
from __future__ import annotations

import json
import sys
from pathlib import Path

BACKEND_ROOT = Path(__file__).resolve().parents[1]
REPO_ROOT = BACKEND_ROOT.parent
sys.path.insert(0, str(BACKEND_ROOT))

from scripts.replace_staff_logins_from_csv import (  # noqa: E402
    NewCredential,
    load_csv_roster,
    write_client_xlsx,
)


def main() -> int:
    json_path = REPO_ROOT / "local" / "credentials" / "queen-mira-staff-logins-client.json"
    payload = json.loads(json_path.read_text(encoding="utf-8"))
    creds = [
        NewCredential(
            employee_id=a["employeeId"],
            name=a["name"],
            role=a["role"],
            login_username=a["loginUsername"],
            temporary_password=a["temporaryPassword"],
            must_change_password=a.get("mustChangePassword", True),
        )
        for a in payload["accounts"]
    ]
    roster = load_csv_roster(REPO_ROOT / "erp complete documentation" / "QMIS_Staff_Credential_Prep.csv")
    by_id = {r["employee_id"]: r for r in roster}
    xlsx = REPO_ROOT / "local" / "credentials" / "Queen_Mira_Staff_Login_Credentials_CLIENT.xlsx"
    write_client_xlsx(xlsx, creds, by_id)
    print(f"wrote {xlsx} count={len(creds)}")

    vals: dict[str, str] = {}
    for line in (BACKEND_ROOT / ".env").read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        vals[key.strip()] = value.strip().strip('"').strip("'")

    from sqlalchemy import create_engine, func, select
    from sqlalchemy.orm import sessionmaker

    from app.core.security import verify_password
    from app.models import Role, User

    engine = create_engine(vals["DATABASE_URL"])
    SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)
    with SessionLocal() as db:
        must_change = db.scalar(
            select(func.count())
            .select_from(User)
            .where(
                User.must_change_password.is_(True),
                User.is_active.is_(True),
                ~User.email.like("%@qmis.edu"),
            )
        )
        role_rows = db.execute(
            select(Role.code, func.count())
            .join(User, User.role_id == Role.id)
            .where(User.is_active.is_(True), ~User.email.like("%@qmis.edu"))
            .group_by(Role.code)
            .order_by(func.count().desc())
        ).all()
        sample = creds[0]
        user = db.scalar(select(User).where(User.email == sample.login_username))
        ok = bool(user and verify_password(sample.temporary_password, user.password_hash))
        print(
            json.dumps(
                {
                    "activeStaffMustChange": must_change,
                    "roles": {code: n for code, n in role_rows},
                    "sampleEmail": sample.login_username,
                    "sampleVerify": ok,
                    "sampleMustChange": bool(user and user.must_change_password),
                },
                indent=2,
            )
        )
        return 0 if ok else 1


if __name__ == "__main__":
    raise SystemExit(main())
