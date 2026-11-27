"""Local verification of student/employee DB writes. Safe test records only."""
from __future__ import annotations

import json
import uuid
import urllib.error
import urllib.request
from datetime import date
from pathlib import Path
from urllib.parse import unquote, urlparse

import psycopg

BASE = "http://127.0.0.1:8000/api/v1"


def req(method: str, path: str, token: str | None = None, body: dict | None = None):
    data = None if body is None else json.dumps(body).encode()
    headers = {"Content-Type": "application/json", "Accept": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    request = urllib.request.Request(BASE + path, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(request, timeout=45) as resp:
            raw = resp.read().decode() or "null"
            return resp.status, json.loads(raw)
    except urllib.error.HTTPError as exc:
        raw = exc.read().decode()
        try:
            payload = json.loads(raw) if raw else {"raw": ""}
        except json.JSONDecodeError:
            payload = {"raw": raw[:500]}
        return exc.code, payload


def main() -> None:
    print("HEALTH", urllib.request.urlopen("http://127.0.0.1:8000/health", timeout=5).read().decode())
    st, login = req("POST", "/auth/login", body={"email": "admin@qmis.edu", "password": "admin123"})
    assert st == 200, login
    token = login["access_token"]
    print("LOGIN_OK role=", login.get("role"))

    st, before_students = req("GET", "/students", token=token)
    st, before_emps = req("GET", "/hr/portal/employees", token=token)
    print("BEFORE students=", len(before_students), "employees=", len(before_emps))

    suffix = uuid.uuid4().hex[:6]
    emp_email = f"verify.emp.{suffix}@qmis.edu"
    emp_body = {
        "id": f"EMP-VRF-{suffix.upper()}",
        "name": f"Verify Employee {suffix}",
        "email": emp_email,
        "role": "Teacher",
        "designation": "Teacher — Science",
        "department": "Academics",
        "joiningDate": date.today().isoformat(),
        "status": "Active",
        "category": "Teaching",
        "grossSalary": 42000,
    }
    st, created_emp = req("POST", "/hr/staff", token=token, body=emp_body)
    print("EMP_CREATE", st, created_emp.get("id") if isinstance(created_emp, dict) else created_emp)
    assert st == 201, created_emp

    adm_payload = {
        "first_name": "Verify",
        "last_name": f"Student{suffix}",
        "class_name": "Grade 1",
        "gender": "Male",
        "date_of_birth": "2018-05-01",
        "mobile_number": "9011200001",
        "email": f"verify.stu.{suffix}@qmis.edu",
        "father_name": "Verify Father",
        "mother_name": "Verify Mother",
        "parent_mobile_number": "9011200002",
        "address": "Test Address",
        "city": "Madurai",
        "state": "Tamil Nadu",
        "country": "India",
        "admission_date": date.today().isoformat(),
        "status": "Active",
    }
    st, adm = req("POST", "/admissions", token=token, body=adm_payload)
    print("ADM_CREATE", st, adm.get("id") if isinstance(adm, dict) else adm)
    assert st == 201, adm
    adm_id = adm["id"]

    st, enrolled = req(
        "POST",
        f"/admissions/{adm_id}/enroll",
        token=token,
        body={"skip_parent_account": True, "skip_student_account": True},
    )
    print("ENROLL", st, {k: enrolled.get(k) for k in ("student_id", "student_code")} if isinstance(enrolled, dict) else enrolled)
    assert st == 200, enrolled
    sid = enrolled["student_id"]
    scode = enrolled["student_code"]

    st, students = req("GET", "/students", token=token)
    match = [row for row in students if str(row.get("id")) == str(sid)]
    print("STUDENT_IN_LIST", bool(match), "total", len(students), "name", match[0].get("name") if match else None)
    assert match

    st, emps = req("GET", "/hr/portal/employees", token=token)
    emp_match = [row for row in emps if row.get("email") == emp_email]
    print("EMP_IN_LIST", bool(emp_match), "total", len(emps))
    assert emp_match

    # Role permission samples
    for email, password, label in [
        ("hr@qmis.edu", "hr12345", "hr"),
        ("teacher@qmis.edu", "teacher123", "teacher"),
        ("coordinator@qmis.edu", "coord123", "coordinator"),
        ("principal@qmis.edu", "principal123", "principal"),
    ]:
        st, lg = req("POST", "/auth/login", body={"email": email, "password": password})
        if st != 200:
            print(f"ROLE_{label}_LOGIN", st)
            continue
        tok = lg["access_token"]
        st_s, rows = req("GET", "/students", token=tok)
        st_e, erows = req("GET", "/hr/portal/employees", token=tok)
        print(
            f"ROLE_{label}",
            "students",
            st_s,
            len(rows) if isinstance(rows, list) else rows,
            "employees",
            st_e,
            len(erows) if isinstance(erows, list) else erows,
        )

    st, dash = req("GET", "/dashboard", token=token)
    print("DASHBOARD", st, {k: dash.get(k) for k in list(dash)[:10]} if isinstance(dash, dict) else dash)

    # Read-only DB proof
    raw = None
    for line in Path(__file__).resolve().parents[1].joinpath(".env").read_text(encoding="utf-8").splitlines():
        if line.startswith("DATABASE_URL="):
            raw = line.split("=", 1)[1].strip()
    parsed = urlparse(raw.replace("postgresql+psycopg://", "postgresql://"))
    with psycopg.connect(
        host="127.0.0.1",
        port=parsed.port or 5432,
        user=parsed.username,
        password=unquote(parsed.password or ""),
        dbname=parsed.path.lstrip("/"),
    ) as conn:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT id::text, admission_number, full_name, class_name FROM students WHERE id=%s",
                (sid,),
            )
            print("DB_STUDENT", cur.fetchone())
            cur.execute(
                "SELECT employee_code, email, role_title FROM hr_employees WHERE email=%s",
                (emp_email,),
            )
            print("DB_EMPLOYEE", cur.fetchone())
            cur.execute("SELECT count(*) FROM students")
            print("DB_students_count", cur.fetchone()[0])
            cur.execute("SELECT count(*) FROM hr_employees")
            print("DB_hr_count", cur.fetchone()[0])

    print("VERIFY_OK", scode, emp_email)


if __name__ == "__main__":
    main()
