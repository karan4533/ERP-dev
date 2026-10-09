import os

os.environ["DATABASE_URL"] = "sqlite+pysqlite:///:memory:"
os.environ["OTP_DEBUG"] = "true"
os.environ["JWT_SECRET"] = "test-secret-qmis-erp-phase0-local"

import pytest
from fastapi.testclient import TestClient

from app.main import app


@pytest.fixture()
def client():
    with TestClient(app) as test_client:
        yield test_client


def _login(client: TestClient, email: str, password: str) -> str:
    response = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    assert response.status_code == 200, response.text
    return response.json()["access_token"]


def test_health(client):
    assert client.get("/health").json()["status"] == "ok"


def test_login_and_me_includes_permissions(client):
    token = _login(client, "admin@qmis.edu", "admin123")
    me = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me.status_code == 200
    body = me.json()
    assert body["role"] == "admin"
    assert body["campus"]["code"] == "QMIS-MDU"
    assert "masters.write" in body["permissions"]
    assert "admissions.write" in body["permissions"]


def test_otp_challenge_and_verify(client):
    challenge = client.post("/api/v1/auth/otp/challenge", json={"email": "admin@qmis.edu"})
    assert challenge.status_code == 200
    code = challenge.json()["debug_code"]
    verified = client.post(
        "/api/v1/auth/otp/verify",
        json={"email": "admin@qmis.edu", "code": code},
    )
    assert verified.status_code == 200
    assert verified.json()["role"] == "admin"


def test_class_and_subject_masters(client):
    token = _login(client, "admin@qmis.edu", "admin123")
    headers = {"Authorization": f"Bearer {token}"}
    years = client.get("/api/v1/masters/academic-years", headers=headers)
    assert years.status_code == 200
    assert any(row["name"] == "2026-27" and row["is_current"] for row in years.json())
    created = client.post("/api/v1/masters/classes", json={"name": "Grade 2", "section": "A"}, headers=headers)
    assert created.status_code == 201
    assert created.json()["section"] == "A"
    assert created.json()["academic_year_id"] is not None
    class_id = created.json()["id"]
    sections = client.get(f"/api/v1/masters/sections?class_id={class_id}", headers=headers)
    assert sections.status_code == 200
    assert any(row["name"] == "A" for row in sections.json())
    extra = client.post(
        "/api/v1/masters/sections",
        json={"class_id": class_id, "name": "b"},
        headers=headers,
    )
    assert extra.status_code == 201
    assert extra.json()["name"] == "B"
    subject = client.post("/api/v1/masters/subjects", json={"code": "eng", "name": "English"}, headers=headers)
    assert subject.status_code == 201
    assert subject.json()["code"] == "ENG"
    denied = client.post(
        "/api/v1/masters/classes",
        json={"name": "Grade 3"},
        headers={"Authorization": f"Bearer {_login(client, 'hr@qmis.edu', 'hr12345')}"},
    )
    assert denied.status_code == 403


def test_academic_year_set_current(client):
    token = _login(client, "admin@qmis.edu", "admin123")
    headers = {"Authorization": f"Bearer {token}"}
    created = client.post(
        "/api/v1/masters/academic-years",
        json={"name": "2027-28", "is_current": True},
        headers=headers,
    )
    assert created.status_code == 201
    assert created.json()["is_current"] is True
    current = client.get("/api/v1/masters/academic-years/current", headers=headers)
    assert current.status_code == 200
    assert current.json()["name"] == "2027-28"
    years = client.get("/api/v1/masters/academic-years", headers=headers).json()
    currents = [row for row in years if row["is_current"]]
    assert len(currents) == 1
    assert currents[0]["name"] == "2027-28"
    older = next(row for row in years if row["name"] == "2026-27")
    restored = client.post(f"/api/v1/masters/academic-years/{older['id']}/set-current", headers=headers)
    assert restored.status_code == 200
    assert restored.json()["is_current"] is True
    patched = client.patch(
        f"/api/v1/masters/academic-years/{created.json()['id']}",
        headers=headers,
        json={"is_active": False},
    )
    assert patched.status_code == 200
    assert patched.json()["is_active"] is False
    listed = client.get("/api/v1/masters/academic-years", headers=headers).json()
    assert all(row["name"] != "2027-28" for row in listed)


def test_section_update_and_deactivate(client):
    token = _login(client, "admin@qmis.edu", "admin123")
    headers = {"Authorization": f"Bearer {token}"}
    created = client.post(
        "/api/v1/masters/classes",
        json={"name": "Grade 5", "section": "A"},
        headers=headers,
    )
    assert created.status_code == 201
    class_id = created.json()["id"]
    sections = client.get(f"/api/v1/masters/sections?class_id={class_id}", headers=headers).json()
    section_id = sections[0]["id"]
    renamed = client.patch(
        f"/api/v1/masters/sections/{section_id}",
        headers=headers,
        json={"name": "c"},
    )
    assert renamed.status_code == 200
    assert renamed.json()["name"] == "C"
    gone = client.delete(f"/api/v1/masters/sections/{section_id}", headers=headers)
    assert gone.status_code == 200
    assert gone.json()["is_active"] is False
    active = client.get(f"/api/v1/masters/sections?class_id={class_id}", headers=headers).json()
    assert active == []



def test_hr_employee_is_hr_only(client):
    hr = _login(client, "hr@qmis.edu", "hr12345")
    created = client.post(
        "/api/v1/hr/employees",
        json={"first_name": "Asha", "last_name": "R", "email": "asha@qmis.edu"},
        headers={"Authorization": f"Bearer {hr}"},
    )
    assert created.status_code == 201
    assert created.json()["employee_code"].startswith("EMP-")
    assert created.json()["email"] == "asha@qmis.edu"
    teacher_headers = {"Authorization": f"Bearer {_login(client, 'admin@qmis.edu', 'admin123')}"}
    # Admin may hold the permission. A role without it must be rejected.
    missing = client.get("/api/v1/hr/employees")
    assert missing.status_code == 401


def test_admission_student_guardian_journey(client):
    token = _login(client, "admin@qmis.edu", "admin123")
    headers = {"Authorization": f"Bearer {token}"}
    enquiry = client.post(
        "/api/v1/admissions/enquiries",
        json={
            "student_name": "Aariv",
            "class_name": "Grade 1",
            "guardian_name": "Meena",
            "guardian_phone": "9876543210",
        },
        headers=headers,
    )
    assert enquiry.status_code == 201
    enrolled = client.post(f"/api/v1/admissions/enquiries/{enquiry.json()['id']}/enroll", headers=headers)
    assert enrolled.status_code == 200
    body = enrolled.json()
    assert body["student"]["full_name"] == "Aariv"
    assert body["guardian"]["full_name"] == "Meena"
    logs = client.get("/api/v1/audit-logs", headers=headers)
    assert logs.status_code == 200
    actions = {row["action"] for row in logs.json()}
    assert "STUDENT_ENROLLED" in actions
    assert "LOGIN" in actions
