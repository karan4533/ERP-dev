"""Read-only dry-run: list confirmed demo/dummy students and dependency counts.

Does NOT delete. Does NOT print passwords or full DATABASE_URL.
Evidence sources are hardcoded from seed.py / documented UAT patterns only.
"""

from __future__ import annotations

import json
import os
import sys
from pathlib import Path
from urllib.parse import urlparse

BACKEND_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_ROOT))

# Confirmed from backend/app/services/seed.py::_seed_demo_parent_student_link
# and backend/scripts/demo_seed_evening.py (DEMO-ADM-* markers).
CONFIRMED_ADMISSION_NUMBERS = {
    "ADM-DEMO-001",
    "DEMO-ADM-1001",
    "DEMO-ADM-1002",
    "DEMO-ADM-1003",
    "DEMO-ADM-1004",
    "DEMO-ADM-1005",
}
CONFIRMED_FULL_NAMES = {"Demo Child Sharma"}
CONFIRMED_PORTAL_EMAILS = {"parent@qmis.edu", "student@qmis.edu"}
# ADM-DEMO-001 is usually RETAINED for parent/student portal UAT — dry-run still lists it.

# Documented isolated UAT child — only propose if present; do not invent.
SUSPECT_UAT_NAME_PREFIXES = ("Uat ", "UAT ")


def _load_env() -> dict[str, str]:
    vals: dict[str, str] = {}
    for line in (BACKEND_ROOT / ".env").read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        vals[key.strip()] = value.strip().strip('"').strip("'")
    return vals


def main() -> int:
    os.chdir(BACKEND_ROOT)
    vals = _load_env()
    url = vals.get("DATABASE_URL") or ""
    parsed = urlparse(url)
    print("=== DB TARGET (redacted) ===")
    print(f"ENVIRONMENT={vals.get('ENVIRONMENT')}")
    print(f"host={parsed.hostname} port={parsed.port} db={(parsed.path or '/').lstrip('/')} user={parsed.username}")
    print(f"INTEGRATIONS_MODE={vals.get('INTEGRATIONS_MODE')}")
    print()

    from sqlalchemy import create_engine, text

    engine = create_engine(url)

    with engine.connect() as conn:
        total = conn.execute(text("SELECT count(*) FROM students")).scalar()
        print(f"=== STUDENT INVENTORY ===")
        print(f"total_students={total}")

        print()
        print("=== ALL STUDENTS (inventory; not proposed for delete) ===")
        all_students = conn.execute(
            text(
                """
                SELECT s.admission_number, s.full_name, s.class_name, s.section,
                       s.placement_status,
                       pu.email AS parent_email, su.email AS student_email
                FROM students s
                LEFT JOIN users pu ON pu.id = s.parent_user_id
                LEFT JOIN users su ON su.id = s.student_user_id
                ORDER BY s.admission_number
                """
            )
        ).mappings().all()
        for row in all_students:
            print(json.dumps(dict(row)))

        print()
        print("=== CONFIRMED DEMO CANDIDATES (seed.py) ===")
        confirmed = conn.execute(
            text(
                """
                SELECT s.id::text AS id,
                       s.admission_number,
                       s.full_name,
                       s.class_name,
                       s.section,
                       s.placement_status,
                       s.parent_user_id::text AS parent_user_id,
                       s.student_user_id::text AS student_user_id,
                       s.admission_id::text AS admission_id,
                       pu.email AS parent_email,
                       su.email AS student_email
                FROM students s
                LEFT JOIN users pu ON pu.id = s.parent_user_id
                LEFT JOIN users su ON su.id = s.student_user_id
                WHERE s.admission_number = ANY(:adm)
                   OR s.full_name = ANY(:names)
                   OR lower(coalesce(pu.email, '')) = ANY(:emails)
                   OR lower(coalesce(su.email, '')) = ANY(:emails)
                ORDER BY s.admission_number
                """
            ),
            {
                "adm": list(CONFIRMED_ADMISSION_NUMBERS),
                "names": list(CONFIRMED_FULL_NAMES),
                "emails": list(CONFIRMED_PORTAL_EMAILS),
            },
        ).mappings().all()

        if not confirmed:
            print("(none found)")
        for row in confirmed:
            print(json.dumps(dict(row), indent=2))

        print()
        print("=== UAT-NAME REVIEW LIST (not auto-approved) ===")
        uat = conn.execute(
            text(
                """
                SELECT s.id::text AS id,
                       s.admission_number,
                       s.full_name,
                       s.class_name,
                       s.section,
                       pu.email AS parent_email,
                       su.email AS student_email
                FROM students s
                LEFT JOIN users pu ON pu.id = s.parent_user_id
                LEFT JOIN users su ON su.id = s.student_user_id
                WHERE s.full_name ILIKE 'Uat %' OR s.full_name ILIKE 'UAT %'
                ORDER BY s.admission_number
                """
            )
        ).mappings().all()
        if not uat:
            print("(none found)")
        for row in uat:
            print(json.dumps(dict(row), indent=2))

        print()
        print("=== @example.com PARENT/STUDENT LOGINS LINKED TO STUDENTS (review only) ===")
        example_linked = conn.execute(
            text(
                """
                SELECT s.id::text AS id,
                       s.admission_number,
                       s.full_name,
                       s.class_name,
                       pu.email AS parent_email,
                       su.email AS student_email
                FROM students s
                LEFT JOIN users pu ON pu.id = s.parent_user_id
                LEFT JOIN users su ON su.id = s.student_user_id
                WHERE lower(coalesce(pu.email, '')) LIKE '%@example.com'
                   OR lower(coalesce(su.email, '')) LIKE '%@example.com'
                ORDER BY s.admission_number
                LIMIT 50
                """
            )
        ).mappings().all()
        example_count = conn.execute(
            text(
                """
                SELECT count(*) FROM students s
                LEFT JOIN users pu ON pu.id = s.parent_user_id
                LEFT JOIN users su ON su.id = s.student_user_id
                WHERE lower(coalesce(pu.email, '')) LIKE '%@example.com'
                   OR lower(coalesce(su.email, '')) LIKE '%@example.com'
                """
            )
        ).scalar()
        print(f"example_com_linked_students={example_count} (showing up to 50)")
        for row in example_linked:
            print(json.dumps(dict(row), indent=2))

        print()
        print("=== DEPENDENCY COUNTS FOR CONFIRMED CANDIDATE IDs ===")
        candidate_ids = [r["id"] for r in confirmed]
        # Also include UAT names for impact preview only
        review_ids = candidate_ids + [r["id"] for r in uat]

        dep_queries = [
            ("admissions.enrolled_student_id", "SELECT count(*) FROM admissions WHERE enrolled_student_id = :id"),
            ("guardians", "SELECT count(*) FROM guardians WHERE student_id = :id"),
            ("student_attendance", "SELECT count(*) FROM student_attendance WHERE student_id = :id"),
            ("document_records", "SELECT count(*) FROM document_records WHERE student_id = :id"),
            ("tc_requests", "SELECT count(*) FROM tc_requests WHERE student_id = :id"),
            ("mark_entries", "SELECT count(*) FROM mark_entries WHERE student_id = :id"),
        ]

        # Discover optional tables that may not exist in older schemas
        optional = [
            ("notifications entity student", None),
        ]

        table_exists = lambda name: conn.execute(
            text("SELECT to_regclass(:n) IS NOT NULL"), {"n": f"public.{name}"}
        ).scalar()

        extra_tables = [
            ("promotions", "SELECT count(*) FROM promotions WHERE student_id = :id"),
            ("student_promotions", "SELECT count(*) FROM student_promotions WHERE student_id = :id"),
            ("transport_assignments", "SELECT count(*) FROM transport_assignments WHERE student_id = :id"),
            ("student_transport", "SELECT count(*) FROM student_transport WHERE student_id = :id"),
            ("fee_installments", "SELECT count(*) FROM fee_installments WHERE student_id = :id"),
            ("notifications", "SELECT count(*) FROM notifications WHERE entity_type ILIKE '%student%' AND entity_id = :id"),
            ("in_app_notifications", "SELECT count(*) FROM in_app_notifications WHERE entity_id = :id"),
        ]
        for label, sql in extra_tables:
            tbl = label.split()[0]
            if table_exists(tbl):
                dep_queries.append((label, sql))

        if not review_ids:
            print("(no candidate ids)")
        for sid in review_ids:
            print(f"-- student_id={sid}")
            for label, sql in dep_queries:
                try:
                    n = conn.execute(text(sql), {"id": sid}).scalar()
                    if n:
                        print(f"   {label}: {n}")
                except Exception as exc:  # noqa: BLE001
                    conn.rollback()
                    print(f"   {label}: error {type(exc).__name__}")

        # Finance document store (JSON bodies keyed by collection)
        print()
        print("=== FINANCE_RECORDS STUDENT REFERENCES ===")
        if table_exists("finance_records"):
            fin_students = conn.execute(
                text(
                    """
                    SELECT campus_id::text, public_id, body
                    FROM finance_records
                    WHERE collection = 'students'
                    ORDER BY public_id
                    """
                )
            ).mappings().all()
            print(f"finance_records.collection=students count={len(fin_students)}")
            for row in fin_students:
                body = row["body"] if isinstance(row["body"], dict) else {}
                sid = str(body.get("id") or row["public_id"] or "")
                name = body.get("name") or body.get("fullName") or ""
                adm = body.get("admissionNo") or body.get("admissionNumber") or ""
                flag = ""
                if sid.startswith("STU-") or "demo" in str(name).lower() or str(adm).startswith("ADM-DEMO"):
                    flag = " [LIKELY_SEED_OR_FIXTURE]"
                # Highlight refs to confirmed student UUIDs
                for cid in candidate_ids:
                    if cid and cid in json.dumps(body):
                        flag += " [REF_CONFIRMED_DEMO_UUID]"
                print(
                    f"  campus={row['campus_id']} public_id={row['public_id']} "
                    f"id={sid} name={name!r} admissionNo={adm!r}{flag}"
                )
            # Installments / receipts / txns mentioning confirmed UUIDs
            if candidate_ids:
                for coll in ("installments", "receipts", "transactions", "paymentLinks", "cheques"):
                    hits = conn.execute(
                        text(
                            """
                            SELECT public_id
                            FROM finance_records
                            WHERE collection = :coll
                              AND body::text LIKE ANY(:patterns)
                            """
                        ),
                        {
                            "coll": coll,
                            "patterns": [f"%{cid}%" for cid in candidate_ids],
                        },
                    ).scalars().all()
                    print(f"  finance_records.{coll} referencing confirmed demo ids: {len(hits)}")
                    for pid in hits[:10]:
                        print(f"    - {pid}")
        else:
            print("(finance_records missing)")

        print()
        print("=== DEMO PORTAL USERS (preserve unless deleting linked demo child only) ===")
        demo_users = conn.execute(
            text(
                """
                SELECT u.email, r.code AS role, u.is_active, u.id::text AS id
                FROM users u
                JOIN roles r ON r.id = u.role_id
                WHERE lower(u.email) IN (
                    'parent@qmis.edu', 'student@qmis.edu',
                    'admin@qmis.edu', 'accounthead@qmis.edu', 'teacher@qmis.edu'
                )
                ORDER BY u.email
                """
            )
        ).mappings().all()
        for row in demo_users:
            print(json.dumps(dict(row), indent=2))

        print()
        print("=== SUMMARY ===")
        print(f"confirmed_demo_students_proposed={len(confirmed)}")
        print(f"uat_name_review_only={len(uat)}")
        print(f"example_com_linked_review_only={example_count}")
        print("NO DELETIONS PERFORMED")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
