"""Re-issue temporary passwords for undelivered EMP-QMIS staff logins only.

Use when create-missing provision committed users but the credential handoff
was not written. Touches only hr_employees EMP-QMIS-* rows whose linked user
still has must_change_password=True. Never modifies other accounts.
Does not send email/WhatsApp. Does not print passwords.
"""

from __future__ import annotations

import os
import sys
from datetime import datetime, timezone
from pathlib import Path

BACKEND_ROOT = Path(__file__).resolve().parents[1]
REPO_ROOT = BACKEND_ROOT.parent
sys.path.insert(0, str(BACKEND_ROOT))


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
        raise SystemExit("Expected Postgres DATABASE_URL in backend/.env")
    return url


def main() -> int:
    import argparse

    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--i-understand-live", action="store_true", required=True)
    parser.add_argument(
        "--write-credentials",
        type=Path,
        required=True,
        help="Gitignored handoff path under local/credentials/",
    )
    args = parser.parse_args()

    url = load_database_url()
    os.environ["DATABASE_URL"] = url
    os.environ["SMTP_HOST"] = ""
    os.environ["WHATSAPP_API_URL"] = ""
    os.environ["WHATSAPP_API_TOKEN"] = ""
    os.environ["INTEGRATIONS_MODE"] = ""

    from sqlalchemy import create_engine, select
    from sqlalchemy.orm import sessionmaker

    from app.core.passwords import generate_temporary_password
    from app.core.security import hash_password
    from app.models import HrEmployee, Role, User
    from app.services.audit import write_audit
    from app.services.staff_login_provision import NewCredential, write_credential_handoff

    out = args.write_credentials.resolve()
    if "local" not in out.parts or "credentials" not in out.parts:
        print("Credential path must be under local/credentials/", file=sys.stderr)
        return 2

    engine = create_engine(url)
    SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, expire_on_commit=False)

    with SessionLocal() as db:
        roles = {role.id: role.code for role in db.scalars(select(Role)).all()}
        rows = db.scalars(
            select(HrEmployee).where(HrEmployee.employee_code.like("EMP-QMIS-%")).order_by(HrEmployee.employee_code)
        ).all()

        created: list[NewCredential] = []
        reissued_ids: set = set()
        skipped = 0
        for emp in rows:
            if emp.user_id is None:
                skipped += 1
                continue
            user = db.get(User, emp.user_id)
            if user is None or not user.must_change_password:
                skipped += 1
                continue
            email = (user.email or "").lower()
            # Never rotate demo / pre-existing @qmis.edu working logins.
            if email.endswith("@qmis.edu"):
                db.rollback()
                print(f"SAFETY STOP: refusing to reissue protected demo email {email}", file=sys.stderr)
                return 3
            temporary = generate_temporary_password()
            user.password_hash = hash_password(temporary)
            user.must_change_password = True
            reissued_ids.add(user.id)
            write_audit(
                db,
                action="STAFF_TEMP_REISSUED",
                entity_type="hr_employee",
                entity_id=str(emp.id),
                campus_id=emp.campus_id,
                details=f"{emp.employee_code} undelivered-handoff-repair",
            )
            created.append(
                NewCredential(
                    employee_id=emp.employee_code,
                    name=f"{emp.first_name} {emp.last_name}".strip(),
                    role=roles.get(user.role_id, emp.role_title or ""),
                    login_username=email,
                    temporary_password=temporary,
                    must_change_password=True,
                )
            )

        db.flush()
        if any(cred.login_username.endswith("@qmis.edu") for cred in created):
            db.rollback()
            print("SAFETY STOP: handoff would include @qmis.edu credentials", file=sys.stderr)
            return 3

        write_credential_handoff(
            out,
            created,
            note=(
                f"Reissued {datetime.now(timezone.utc).isoformat()} for undelivered EMP-QMIS temps only. "
                "Delete after secure distribution. Do not email/WhatsApp unless approved."
            ),
        )
        db.commit()
        import json

        print(
            json.dumps(
                {
                    "reissued": len(created),
                    "skipped": skipped,
                    "handoff": str(out),
                    "note": "Existing @qmis.edu and other non-target accounts were not modified by this script.",
                },
                indent=2,
            )
        )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
