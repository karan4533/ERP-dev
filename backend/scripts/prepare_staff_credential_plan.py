"""Build credential prep plan from hrSeed + approved designation map (no DB writes, no passwords)."""

from __future__ import annotations

import csv
import json
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path
import sys

BACKEND_ROOT = Path(__file__).resolve().parents[1]
REPO_ROOT = BACKEND_ROOT.parent
sys.path.insert(0, str(BACKEND_ROOT))

from app.permissions.matrix import ALL_ROLES  # noqa: E402
from app.services.staff_designation_map import (  # noqa: E402
    map_role_from_designation,
    primary_login_email,
)
from app.services.staff_login_provision import load_roster_from_hr_seed  # noqa: E402

HR_SEED = REPO_ROOT / "src" / "Pages" / "HR" / "domain" / "hrSeed.js"
OUT_MD = REPO_ROOT / "docs" / "QMIS_Staff_Credential_Prep.md"
OUT_CSV = REPO_ROOT / "docs" / "QMIS_Staff_Credential_Prep.csv"
OUT_JSON = REPO_ROOT / "docs" / "QMIS_Staff_Credential_Prep_summary.json"

ROLE_LABELS = dict(ALL_ROLES)

APPROVED_GUIDE = [
    ("MD / Managing Director", "Super Admin", "superadmin"),
    ("DA / Joint Director – Audit / Director of Audit", "Joint Director Audit", "jointdirectoraudit"),
    ("JD / Joint Director – Admin", "Joint Director", "jointdirector"),
    ("Director – Academics", "Director", "director"),
    ("Principal", "Principal", "principal"),
    ("Senior Principal / Principal – Quality Audit", "Quality Auditor", "qualityauditor"),
    ("Executive Audit / Audit Executive", "Process Auditor", "processauditor"),
    ("Coordinator", "Coordinator", "coordinator"),
    ("PRO / Assistant PRO / Public Relations Officer", "PRO", "pro"),
    ("PRM / Parent Relationship Manager", "PRM", "prm"),
    ("Finance Manager", "Finance Manager", "financemanager"),
    ("Accountant / Accounts Trainee / Senior Accountant", "Account Assistant", "accountassistant"),
    ("HR Executive / Audit Cum HR Facilitator", "HR", "hr"),
    ("System Administrator", "IT Support Manager", "itsupportmanager"),
    ("Librarian / Assistant Librarian", "Librarian", "librarian"),
    ("Teaching staff (AVP/VP, HOD, PGT/TGT/PRT/SGT, NTT, Facilitator, Counsellor, PET, Rifle/NCC, Lab Assistant, …)", "Teacher", "teacher"),
    ("EA to MD / EA to DA / Office Assistant / Reception / Stores / Digital Marketing / HK / Control Room / …", "Directory only", ""),
]


def main() -> None:
    roster = load_roster_from_hr_seed(HR_SEED)
    role_codes = {c for c, _ in ALL_ROLES}
    rows = []
    for emp in roster:
        mapped = map_role_from_designation(emp.designation)
        login = primary_login_email(emp.email) or emp.email
        seed_role = (emp.role or "").strip()
        status = "eligible" if seed_role else "directory_only"
        if seed_role and seed_role not in role_codes:
            status = "blocked_missing_role"
        if mapped and mapped != seed_role:
            note = f"designation_map={mapped} seed={seed_role or '∅'}"
        elif not seed_role and mapped:
            note = f"seed empty but designation maps to {mapped}"
        else:
            note = ""
        rows.append(
            {
                "employee_id": emp.employee_code,
                "name": emp.name,
                "department": emp.department,
                "designation": emp.designation,
                "login_email": login,
                "phone": emp.contact,
                "rbac_role": seed_role,
                "rbac_label": ROLE_LABELS.get(seed_role, "Directory only"),
                "designation_map_role": mapped,
                "status": status,
                "note": note,
                "password": "(issued at provision / reissue — not stored in this prep)",
                "must_change_password": "yes" if seed_role else "n/a",
            }
        )

    counts = Counter(r["rbac_role"] or "DIRECTORY" for r in rows)
    eligible = [r for r in rows if r["status"] == "eligible"]
    directory = [r for r in rows if r["status"] == "directory_only"]
    blocked = [r for r in rows if r["status"] == "blocked_missing_role"]
    mismatches = [r for r in rows if r["note"].startswith("designation_map=") or r["note"].startswith("seed empty")]

    OUT_CSV.parent.mkdir(parents=True, exist_ok=True)
    with OUT_CSV.open("w", encoding="utf-8", newline="") as fh:
        writer = csv.DictWriter(
            fh,
            fieldnames=[
                "employee_id",
                "name",
                "department",
                "designation",
                "login_email",
                "phone",
                "rbac_role",
                "rbac_label",
                "status",
                "must_change_password",
                "password",
                "note",
            ],
        )
        writer.writeheader()
        for r in rows:
            writer.writerow({k: r[k] for k in writer.fieldnames})

    summary = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "roster": len(rows),
        "eligible": len(eligible),
        "directory_only": len(directory),
        "blocked_missing_role": len(blocked),
        "seed_vs_map_mismatches": len(mismatches),
        "by_role": dict(sorted(counts.items(), key=lambda kv: (-kv[1], kv[0]))),
        "missing_role_codes": sorted({r["rbac_role"] for r in blocked}),
    }
    OUT_JSON.write_text(json.dumps(summary, indent=2), encoding="utf-8")

    lines: list[str] = []
    lines.append("# QMIS Staff Credential Prep")
    lines.append("")
    lines.append(f"**Generated:** {summary['generated_at']}")
    lines.append("**Source:** `src/Pages/HR/domain/hrSeed.js` + approved designation map")
    lines.append("**Writes:** none (plan only — no passwords in this file)")
    lines.append("")
    lines.append("## Verified role codes")
    lines.append("")
    lines.append("| Sheet / short form | Portal label | Role code |")
    lines.append("|---|---|---|")
    for sheet, label, code in APPROVED_GUIDE:
        ok = "OK" if (not code or code in role_codes) else "MISSING"
        lines.append(f"| {sheet} | {label} | `{code or '—'}` ({ok}) |")
    lines.append("")
    lines.append("**DA note:** Director of Audit / Joint Director–Audit uses existing code `jointdirectoraudit` (label: Joint Director Audit).")
    lines.append("")
    lines.append("## Counts")
    lines.append("")
    lines.append("| Metric | Count |")
    lines.append("|---|---:|")
    lines.append(f"| Roster | {summary['roster']} |")
    lines.append(f"| Eligible login accounts | {summary['eligible']} |")
    lines.append(f"| Directory-only (no portal) | {summary['directory_only']} |")
    lines.append(f"| Blocked (role code missing in ALL_ROLES) | {summary['blocked_missing_role']} |")
    lines.append("")
    lines.append("### By role")
    lines.append("")
    lines.append("| Role code | Label | Count |")
    lines.append("|---|---|---:|")
    for code, n in summary["by_role"].items():
        lines.append(f"| `{code}` | {ROLE_LABELS.get(code, 'Directory only')} | {n} |")
    lines.append("")
    lines.append("## Credential creation rules")
    lines.append("")
    lines.append("1. Login username = primary email from the staff sheet / hrSeed.")
    lines.append("2. Temporary password is generated only at provision/reissue time (not written here).")
    lines.append("3. `must_change_password=true` for every new staff login.")
    lines.append("4. Create-missing-only: existing live users are **not** password-reset by normal provision.")
    lines.append("5. Role corrections for already-provisioned accounts need a **separate approved role-update** (provision will not change roles).")
    lines.append("6. MD / Super Admin is the seeded `superadmin` account — not present as a named MD row in this staff sheet.")
    lines.append("")
    lines.append("## Eligible logins (by role)")
    lines.append("")
    for code, n in summary["by_role"].items():
        if code == "DIRECTORY":
            continue
        lines.append(f"### `{code}` — {ROLE_LABELS.get(code, code)} ({n})")
        lines.append("")
        lines.append("| Emp ID | Name | Designation | Login email |")
        lines.append("|---|---|---|---|")
        for r in rows:
            if (r["rbac_role"] or "DIRECTORY") != code:
                continue
            lines.append(
                f"| {r['employee_id']} | {r['name']} | {r['designation']} | `{r['login_email']}` |"
            )
        lines.append("")
    lines.append("## Directory-only (no login)")
    lines.append("")
    lines.append("| Emp ID | Name | Designation | Email |")
    lines.append("|---|---|---|---|")
    for r in directory:
        lines.append(f"| {r['employee_id']} | {r['name']} | {r['designation']} | `{r['login_email']}` |")
    lines.append("")
    lines.append("## Artifacts")
    lines.append("")
    lines.append(f"- CSV plan: `{OUT_CSV.relative_to(REPO_ROOT).as_posix()}`")
    lines.append(f"- Summary JSON: `{OUT_JSON.relative_to(REPO_ROOT).as_posix()}`")
    lines.append("- Password handoff (after approved provision/reissue only): `local/credentials/` (gitignored)")
    lines.append("")
    OUT_MD.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(json.dumps(summary, indent=2))
    print(f"wrote {OUT_MD}")
    print(f"wrote {OUT_CSV}")


if __name__ == "__main__":
    main()
