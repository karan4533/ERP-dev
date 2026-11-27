"""Inspect live Postgres (.env DATABASE_URL) vs hrSeed — redacted dry-run only.

Does not create accounts. Does not print connection strings or passwords.
"""

from __future__ import annotations

import json
import os
import sys
from datetime import datetime, timezone
from pathlib import Path

BACKEND_ROOT = Path(__file__).resolve().parents[1]
REPO_ROOT = BACKEND_ROOT.parent
sys.path.insert(0, str(BACKEND_ROOT))

from app.services.staff_login_provision import (  # noqa: E402
    is_valid_login_email,
    load_roster_from_hr_seed,
)


def load_dotenv_url() -> tuple[str, str]:
    vals: dict[str, str] = {}
    for line in (BACKEND_ROOT / ".env").read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        vals[key.strip()] = value.strip().strip('"').strip("'")
    url = vals.get("DATABASE_URL") or ""
    env = vals.get("ENVIRONMENT") or "development"
    if not url:
        raise SystemExit("backend/.env DATABASE_URL missing")
    return url, env


def redact_email(email: str) -> str:
    email = (email or "").strip().lower()
    if "@" not in email:
        return "(invalid)"
    local, _, domain = email.partition("@")
    if len(local) <= 2:
        masked = local[:1] + "*"
    else:
        masked = local[:2] + ("*" * max(1, len(local) - 3)) + local[-1]
    return f"{masked}@{domain}"


def main() -> int:
    url, env_name = load_dotenv_url()
    scheme = "postgres" if "postgres" in url.lower() else ("sqlite" if "sqlite" in url.lower() else "other")
    print(json.dumps({"databaseScheme": scheme, "environment": env_name}))

    os.environ["DATABASE_URL"] = url
    os.environ["ENVIRONMENT"] = env_name
    os.environ["SMTP_HOST"] = ""
    os.environ["WHATSAPP_API_URL"] = ""
    os.environ["WHATSAPP_API_TOKEN"] = ""
    os.environ["INTEGRATIONS_MODE"] = ""

    from sqlalchemy import create_engine, text

    roster = load_roster_from_hr_seed(REPO_ROOT / "src" / "Pages" / "HR" / "domain" / "hrSeed.js")
    eligible = [row for row in roster if row.role and is_valid_login_email(row.email)]
    directory = [row for row in roster if not row.role]
    invalid = [row for row in roster if row.role and not is_valid_login_email(row.email)]

    engine = create_engine(url)
    with engine.connect() as conn:
        total_users = conn.execute(text("SELECT count(*) FROM users")).scalar()
        emp_qmis = conn.execute(
            text("SELECT count(*) FROM hr_employees WHERE employee_code LIKE 'EMP-QMIS-%'")
        ).scalar()
        emp_linked = conn.execute(
            text(
                "SELECT count(*) FROM hr_employees "
                "WHERE employee_code LIKE 'EMP-QMIS-%' AND user_id IS NOT NULL"
            )
        ).scalar()
        user_emails = {
            row[0]
            for row in conn.execute(text("SELECT lower(email) FROM users")).fetchall()
            if row[0]
        }
        emp_by_email = {
            row[0]: (row[1], row[2])
            for row in conn.execute(
                text(
                    "SELECT lower(email), employee_code, user_id FROM hr_employees "
                    "WHERE employee_code LIKE 'EMP-QMIS-%'"
                )
            ).fetchall()
        }
        emp_by_code = {
            row[0]: (row[1], row[2])
            for row in conn.execute(
                text(
                    "SELECT employee_code, lower(email), user_id FROM hr_employees "
                    "WHERE employee_code LIKE 'EMP-QMIS-%'"
                )
            ).fetchall()
        }

    preserve: list[dict] = []
    create: list[dict] = []
    unresolved: list[dict] = []

    for row in eligible:
        email = row.email.lower()
        code = row.employee_code
        user_exists = email in user_emails
        emp = emp_by_code.get(code) or emp_by_email.get(email)
        if user_exists:
            preserve.append(
                {
                    "employeeId": code,
                    "name": row.name,
                    "role": row.role,
                    "email": redact_email(email),
                    "status": "preserve_existing_user",
                }
            )
            continue
        if emp and emp[1] is not None:
            # employee linked but user email missing? unresolved
            unresolved.append(
                {
                    "employeeId": code,
                    "name": row.name,
                    "email": redact_email(email),
                    "reason": "hr_employee has user_id but users.email not found for roster email",
                }
            )
            continue
        create.append(
            {
                "employeeId": code,
                "name": row.name,
                "role": row.role,
                "email": redact_email(email),
                "hrEmployeeExists": bool(emp),
                "status": "would_create",
            }
        )

    for row in invalid:
        unresolved.append(
            {
                "employeeId": row.employee_code,
                "name": row.name,
                "email": redact_email(row.email),
                "reason": "role set but email invalid",
            }
        )

    report = {
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "mode": "LIVE dry-run inspection (no writes)",
        "databaseScheme": scheme,
        "totals": {
            "roster": len(roster),
            "eligible": len(eligible),
            "directoryOnly": len(directory),
            "invalidEligibleEmail": len(invalid),
            "liveUsersTotal": int(total_users or 0),
            "liveEmpQmis": int(emp_qmis or 0),
            "liveEmpQmisLinked": int(emp_linked or 0),
            "wouldPreserve": len(preserve),
            "wouldCreate": len(create),
            "unresolved": len(unresolved),
            "directorySkipped": len(directory),
        },
        "accountsToPreserve": preserve,
        "accountsToCreate": create,
        "unresolvedRecords": unresolved,
        "directoryOnlySkipped": [
            {"employeeId": r.employee_code, "name": r.name, "designation": r.designation}
            for r in directory
        ],
        "notes": [
            "Isolated-test credentials are not valid on this database.",
            "No passwords are included.",
            "Live provisioning requires backup verification and --i-understand-live.",
        ],
    }

    out = REPO_ROOT / "docs" / "QMIS_Staff_Live_Provision_DryRun.md"
    lines = [
        "# QMIS Staff Live Provision — Redacted Dry-Run",
        "",
        f"**Generated:** {report['generatedAt']}",
        f"**Database scheme:** `{scheme}` (credentials not shown)",
        "**Writes:** none",
        "",
        "## Summary",
        "",
        "| Metric | Count |",
        "|---|---:|",
    ]
    for key, value in report["totals"].items():
        lines.append(f"| {key} | {value} |")
    lines.extend(
        [
            "",
            "## Accounts to preserve (existing live user for roster email)",
            "",
            f"Count: **{len(preserve)}**",
            "",
            "## Accounts that would be created (eligible, no live user)",
            "",
            f"Count: **{len(create)}**",
            "",
        ]
    )
    if create:
        lines.append("| Employee ID | Name | Role | Redacted email | HR row exists |")
        lines.append("|---|---|---|---|---|")
        for item in create:
            lines.append(
                f"| {item['employeeId']} | {item['name']} | {item['role']} | "
                f"`{item['email']}` | {item['hrEmployeeExists']} |"
            )
    lines.extend(["", "## Unresolved (no account action)", ""])
    if not unresolved:
        lines.append("_None._")
    else:
        for item in unresolved:
            lines.append(f"- {item}")
    lines.extend(
        [
            "",
            f"## Directory-only skipped ({len(directory)})",
            "",
            "_Listed by employee ID/name only; no login until role assigned._",
            "",
        ]
    )
    for item in report["directoryOnlySkipped"][:5]:
        lines.append(f"- {item['employeeId']}: {item['name']}")
    if len(directory) > 5:
        lines.append(f"- … and {len(directory) - 5} more")
    lines.extend(
        [
            "",
            "## Next steps",
            "",
            "1. Back up live DB and verify restore.",
            "2. Explicitly approve live provisioning.",
            "3. Run create-missing-only with credential handoff to `local/credentials/`.",
            "",
        ]
    )
    out.write_text("\n".join(lines) + "\n", encoding="utf-8")
    summary_path = REPO_ROOT / "docs" / "QMIS_Staff_Live_Provision_DryRun_summary.json"
    summary_path.write_text(
        json.dumps({"totals": report["totals"], "notes": report["notes"]}, indent=2),
        encoding="utf-8",
    )
    print(json.dumps(report["totals"], indent=2))
    print(f"Wrote {out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
