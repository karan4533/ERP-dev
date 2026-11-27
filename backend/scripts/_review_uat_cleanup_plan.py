"""Read-only review helper for A+B UAT cleanup plan. No writes."""

from __future__ import annotations

import json
import sys
from pathlib import Path

from sqlalchemy import create_engine, text

BACKEND = Path(__file__).resolve().parents[1]
REF_A = "97fee98f-f419-4f0c-99a9-9b2a1f05f292"
REF_B = "f371a4cf-0877-49d3-9c1c-74f827f5dbb7"
SMOKE_ADMS = [f"ADM-{i:04d}" for i in range(6, 12)]
DEMO_ENQ = ["DEMO-ENQ-001", "DEMO-ENQ-002", "DEMO-ENQ-003"]


def load_url() -> str:
    vals: dict[str, str] = {}
    for line in (BACKEND / ".env").read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        k, v = line.split("=", 1)
        vals[k.strip()] = v.strip().strip('"').strip("'")
    return vals["DATABASE_URL"]


def main() -> int:
    eng = create_engine(load_url())
    with eng.connect() as c:
        print("=== TOTALS BEFORE (original DB, read-only) ===")
        queries = {
            "students": "SELECT count(*) FROM students",
            "admissions": "SELECT count(*) FROM admissions",
            "guardians": "SELECT count(*) FROM guardians",
            "users": "SELECT count(*) FROM users",
            "users_active": "SELECT count(*) FROM users WHERE is_active",
            "parent_users": (
                "SELECT count(*) FROM users u JOIN roles r ON r.id=u.role_id WHERE r.code = 'parent'"
            ),
            "parent_users_active": (
                "SELECT count(*) FROM users u JOIN roles r ON r.id=u.role_id "
                "WHERE r.code = 'parent' AND u.is_active"
            ),
            "student_users": (
                "SELECT count(*) FROM users u JOIN roles r ON r.id=u.role_id WHERE r.code = 'student'"
            ),
            "student_users_active": (
                "SELECT count(*) FROM users u JOIN roles r ON r.id=u.role_id "
                "WHERE r.code = 'student' AND u.is_active"
            ),
            "student_attendance": "SELECT count(*) FROM student_attendance",
            "tc_requests": "SELECT count(*) FROM tc_requests",
            "admission_enquiries": "SELECT count(*) FROM admission_enquiries",
            "demo_enq_total": (
                "SELECT count(*) FROM admission_enquiries WHERE enquiry_code LIKE 'DEMO-ENQ-%'"
            ),
            "demo_enq_not_inactive": (
                "SELECT count(*) FROM admission_enquiries WHERE enquiry_code LIKE 'DEMO-ENQ-%' "
                "AND status NOT ILIKE '%in active%' AND status NOT ILIKE '%inactive%'"
            ),
            "smoke_parents": (
                "SELECT count(*) FROM users WHERE lower(email) LIKE 'smoke.parent.%@example.com'"
            ),
            "smoke_parents_active": (
                "SELECT count(*) FROM users WHERE lower(email) LIKE 'smoke.parent.%@example.com' "
                "AND is_active"
            ),
            "evening_demo_students": (
                "SELECT count(*) FROM students WHERE admission_number LIKE 'DEMO-ADM-%'"
            ),
        }
        before = {k: c.execute(text(sql)).scalar() for k, sql in queries.items()}
        for k, v in before.items():
            print(f"{k}={v}")

        print("=== VERIFY REF A+B ===")
        for sid, expect_adm, expect_name in [
            (REF_A, "ADM-DEMO-001", "Demo Child Sharma"),
            (REF_B, "DEMO-ADM-1001", "Aarav Mehta"),
        ]:
            r = c.execute(
                text(
                    """
                    SELECT s.id::text AS id, s.admission_number, s.full_name, s.class_name, s.section,
                           s.roll_number, s.placement_status, s.section_id::text AS section_id,
                           s.class_id::text AS class_id,
                           pu.email AS parent_email, pu.id::text AS parent_user_id, pu.is_active AS parent_active,
                           su.email AS student_email, su.id::text AS student_user_id, su.is_active AS student_active
                    FROM students s
                    LEFT JOIN users pu ON pu.id = s.parent_user_id
                    LEFT JOIN users su ON su.id = s.student_user_id
                    WHERE s.id = :id
                    """
                ),
                {"id": sid},
            ).mappings().first()
            ok = bool(r) and r["admission_number"] == expect_adm and r["full_name"] == expect_name
            print("MATCH" if ok else "MISMATCH", json.dumps(dict(r) if r else {"missing": sid}, default=str))

        print("=== S1 SMOKE PARENT SOFT-DEACTIVATE TARGETS ===")
        for adm in SMOKE_ADMS:
            r = c.execute(
                text(
                    """
                    SELECT s.id::text AS student_id, s.admission_number, s.full_name,
                           a.id::text AS admission_id, a.admission_code, a.status AS admission_status,
                           pu.id::text AS parent_user_id, pu.email AS parent_email, pu.is_active AS parent_active,
                           (SELECT count(*) FROM guardians g WHERE g.student_id = s.id) AS guardians,
                           (SELECT count(*) FROM student_attendance sa WHERE sa.student_id = s.id) AS attendance,
                           (SELECT count(*) FROM mark_entries m WHERE m.student_id = s.id) AS marks,
                           (SELECT count(*) FROM tc_requests t WHERE t.student_id = s.id) AS tc,
                           (SELECT count(*) FROM document_records d WHERE d.student_id = s.id) AS docs
                    FROM students s
                    LEFT JOIN admissions a ON a.enrolled_student_id = s.id
                    LEFT JOIN users pu ON pu.id = s.parent_user_id
                    WHERE s.admission_number = :adm
                    """
                ),
                {"adm": adm},
            ).mappings().first()
            print(json.dumps(dict(r) if r else {"missing": adm}, default=str))

        print("=== S2 DEMO ENQUIRY TARGETS ===")
        for code in DEMO_ENQ:
            r = c.execute(
                text(
                    """
                    SELECT id::text AS id, enquiry_code, name, status,
                           converted_admission_id::text AS converted_admission_id
                    FROM admission_enquiries WHERE enquiry_code = :c
                    """
                ),
                {"c": code},
            ).mappings().first()
            print(json.dumps(dict(r) if r else {"missing": code}, default=str))

        print("=== EVENING DEMO UNCHANGED THIS PASS (inventory) ===")
        for adm in [f"DEMO-ADM-100{i}" for i in range(1, 6)]:
            r = c.execute(
                text(
                    """
                    SELECT s.admission_number, s.full_name, s.placement_status,
                           (SELECT count(*) FROM student_attendance sa WHERE sa.student_id = s.id) AS attendance,
                           (SELECT count(*) FROM tc_requests t WHERE t.student_id = s.id) AS tc
                    FROM students s WHERE s.admission_number = :a
                    """
                ),
                {"a": adm},
            ).mappings().first()
            fo = c.execute(
                text(
                    "SELECT collection, public_id FROM front_office_records WHERE body::text LIKE :p"
                ),
                {"p": f"%{adm}%"},
            ).mappings().all()
            d = dict(r) if r else {"missing": adm}
            d["fo"] = [f"{x['collection']}:{x['public_id']}" for x in fo]
            print(json.dumps(d, default=str))

        print("=== EXPECTED AFTER S1+S2 ON ISOLATED (no row deletes) ===")
        expected = {
            "students": before["students"],
            "admissions": before["admissions"],
            "guardians": before["guardians"],
            "users": before["users"],
            "users_active": before["users_active"] - before["smoke_parents_active"],
            "parent_users": before["parent_users"],
            "parent_users_active": before["parent_users_active"] - before["smoke_parents_active"],
            "student_users": before["student_users"],
            "student_users_active": before["student_users_active"],
            "student_attendance": before["student_attendance"],
            "tc_requests": before["tc_requests"],
            "admission_enquiries": before["admission_enquiries"],
            "demo_enq_not_inactive": 0,
            "smoke_parents": before["smoke_parents"],
            "smoke_parents_active": 0,
            "evening_demo_students": before["evening_demo_students"],
            "ref_a_b_present": True,
        }
        print(json.dumps(expected, indent=2))
        print("NO WRITES PERFORMED")
    return 0


if __name__ == "__main__":
    sys.exit(main())
