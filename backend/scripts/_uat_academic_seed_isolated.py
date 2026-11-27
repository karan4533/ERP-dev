"""Seed minimal synthetic academic chain on isolated SQLite :8001. No live DB."""

from __future__ import annotations

import json
import sys
import urllib.error
import urllib.request

BASE = "http://127.0.0.1:8001/api/v1"


def req(method: str, path: str, token: str | None = None, body: dict | None = None) -> dict:
    data = None if body is None else json.dumps(body).encode()
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    r = urllib.request.Request(BASE + path, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(r, timeout=30) as resp:
            raw = resp.read().decode()
            return json.loads(raw) if raw else {}
    except urllib.error.HTTPError as e:
        detail = e.read().decode()
        raise SystemExit(f"{method} {path} -> {e.code} {detail[:400]}") from e


def main() -> int:
    login = req("POST", "/auth/login", body={"email": "admin@qmis.edu", "password": "admin123"})
    token = login["access_token"]
    years = req("GET", "/masters/academic-years", token)
    year_id = None
    for y in years if isinstance(years, list) else years.get("items", years.get("data", [])):
        if isinstance(y, dict) and y.get("is_current"):
            year_id = y.get("id")
            break
    if not year_id and isinstance(years, list) and years:
        year_id = years[0]["id"]
    print("year_id", year_id)

    classes = req("GET", f"/masters/classes?academic_year_id={year_id}", token) if year_id else []
    if not isinstance(classes, list):
        classes = classes.get("items") or classes.get("data") or []
    grade7 = next((c for c in classes if str(c.get("name") or "") in {"Grade 7", "VII", "7"}), None)
    if grade7 is None:
        grade7 = req(
            "POST",
            "/masters/classes",
            token,
            {"name": "Grade 7", "academic_year_id": year_id},
        )
    class_id = grade7["id"]
    sections = req("GET", f"/masters/sections?class_id={class_id}&include_inactive=true", token)
    if not isinstance(sections, list):
        sections = sections.get("items") or sections.get("data") or []
    sec_a = next((s for s in sections if str(s.get("name") or "").upper() == "A"), None)
    if sec_a is None:
        sec_a = req("POST", "/masters/sections", token, {"class_id": class_id, "name": "A", "capacity": 40})
    print("class", class_id, "section", sec_a["id"])

    adm = req(
        "POST",
        "/admissions",
        token,
        {
            "first_name": "Uat",
            "last_name": "Meera",
            "mobile_number": "9000099001",
            "class_name": "Grade 7",
            "parent_account_email": "uat.parent.meera@example.com",
            "student_account_email": "uat.student.meera@example.com",
            "student_account_password": "Student-Uat-2026",
            "parent_account_password": "Parent-Uat-2026",
        },
    )
    print("admission", adm.get("id"), adm.get("admission_code") or adm.get("admission_number"))
    enrolled = req(
        "POST",
        f"/admissions/{adm['id']}/enroll",
        token,
        {
            "parent_account_email": "uat.parent.meera@example.com",
            "parent_account_password": "Parent-Uat-2026",
            "student_account_email": "uat.student.meera@example.com",
            "student_account_password": "Student-Uat-2026",
            "skip_student_account": False,
        },
    )
    student_id = enrolled.get("student_id") or enrolled.get("studentId")
    print("student_id", student_id)

    # parent must change password
    pl = req("POST", "/auth/login", body={"email": "uat.parent.meera@example.com", "password": "Parent-Uat-2026"})
    if pl.get("must_change_password"):
        req(
            "POST",
            "/auth/change-password",
            pl["access_token"],
            {"current_password": "Parent-Uat-2026", "new_password": "Parent-Uat-2027"},
        )
        print("parent_password_changed")
    sl = req("POST", "/auth/login", body={"email": "uat.student.meera@example.com", "password": "Student-Uat-2026"})
    if sl.get("must_change_password"):
        req(
            "POST",
            "/auth/change-password",
            sl["access_token"],
            {"current_password": "Student-Uat-2026", "new_password": "Student-Uat-2027"},
        )
        print("student_password_changed")

    # place via principal
    prin = req("POST", "/auth/login", body={"email": "principal@qmis.edu", "password": "principal123"})
    placed = req(
        "POST",
        f"/students/{student_id}/place",
        prin["access_token"],
        {"section_id": sec_a["id"]},
    )
    print("placed", placed.get("placement_status") or placed.get("placementStatus"), placed.get("section"))

    # coordinator placement route check is frontend-only
    print("SEED_OK", json.dumps({"student_id": student_id, "admission_id": adm["id"]}))
    return 0


if __name__ == "__main__":
    sys.exit(main())
