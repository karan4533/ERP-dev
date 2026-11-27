import os

os.environ["DATABASE_URL"] = "sqlite+pysqlite:///:memory:"
os.environ["OTP_DEBUG"] = "true"
os.environ["JWT_SECRET"] = "test-secret-qmis-erp-admissions"

import pytest
from fastapi.testclient import TestClient

from app.main import app


@pytest.fixture()
def client():
    with TestClient(app) as test_client:
        yield test_client


def _login(client: TestClient) -> dict:
    response = client.post("/api/v1/auth/login", json={"email": "admin@qmis.edu", "password": "admin123"})
    assert response.status_code == 200, response.text
    return {"Authorization": f"Bearer {response.json()['access_token']}"}


def test_rich_enquiry_admission_enroll_with_parent(client):
    headers = _login(client)

    enquiry = client.post(
        "/api/v1/admissions/enquiries",
        json={
            "name": "Aariv Kumar",
            "mobile_number": "9876543210",
            "class_name": "Grade 1",
            "email": "parent.aariv@example.com",
            "source": "Walk-in",
            "city": "Madurai",
        },
        headers=headers,
    )
    assert enquiry.status_code == 201, enquiry.text
    body = enquiry.json()
    assert body["enquiry_code"].startswith("AE-")
    assert body["name"] == "Aariv Kumar"
    assert body["status"] == "Active"
    enquiry_id = body["id"]

    listed = client.get("/api/v1/admissions/enquiries", headers=headers)
    assert listed.status_code == 200
    assert any(row["id"] == enquiry_id for row in listed.json())

    converted = client.post(f"/api/v1/admissions/enquiries/{enquiry_id}/convert", headers=headers)
    assert converted.status_code == 200, converted.text
    admission = converted.json()
    assert admission["admission_code"].startswith("ADM-")
    assert admission["first_name"] == "Aariv"
    assert admission["status"] == "Active"
    admission_id = admission["id"]

    patched = client.patch(
        f"/api/v1/admissions/{admission_id}",
        json={
            "first_name": "Aariv",
            "last_name": "Kumar",
            "mobile_number": "9876543210",
            "class_name": "Grade 1",
            "father_name": "Meena Kumar",
            "parent_account_email": "parent.aariv@example.com",
        },
        headers=headers,
    )
    assert patched.status_code == 200, patched.text

    enrolled = client.post(
        f"/api/v1/admissions/{admission_id}/enroll",
        json={
            "parent_account_email": "parent.aariv@example.com",
            "parent_account_password": "Parent-Test-2026",
        },
        headers=headers,
    )
    assert enrolled.status_code == 200, enrolled.text
    result = enrolled.json()
    assert result["student_code"].startswith("ADM-")
    assert result["parent_created"] is True
    assert result["parent_user_id"]
    assert result["admission"]["status"] == "Enrolled"

    # Parent can authenticate with the enroll credentials (synthetic — no school data needed).
    parent_login = client.post(
        "/api/v1/auth/login",
        json={"email": "parent.aariv@example.com", "password": "Parent-Test-2026"},
    )
    assert parent_login.status_code == 200, parent_login.text
    assert parent_login.json()["role"] == "parent"
    assert parent_login.json()["must_change_password"] is True
    from auth_test_helpers import login_headers

    parent_headers = login_headers(client, "parent.aariv@example.com", "Parent-Test-2026")
    parent_me = client.get("/api/v1/auth/me", headers=parent_headers)
    assert parent_me.status_code == 200
    assert parent_me.json()["role"] == "parent"
    assert parent_me.json()["email"] == "parent.aariv@example.com"
    children = client.get("/api/v1/parents/me/children", headers=parent_headers)
    assert children.status_code == 200, children.text
    assert len(children.json()) == 1
    assert children.json()[0]["name"] == "Aariv Kumar"
    assert children.json()[0]["admissionNumber"] == result["student_code"]

    again = client.post(
        f"/api/v1/admissions/{admission_id}/enroll",
        json={"skip_parent_account": True},
        headers=headers,
    )
    assert again.status_code == 409


def test_enroll_refuses_parent_email_owned_by_staff_account(client):
    headers = _login(client)
    created = client.post(
        "/api/v1/admissions",
        json={
            "first_name": "Ishaan",
            "mobile_number": "9000000077",
            "class_name": "Grade 1",
            "parent_account_email": "hr@qmis.edu",
        },
        headers=headers,
    )
    assert created.status_code == 201, created.text
    admission_id = created.json()["id"]

    enrolled = client.post(
        f"/api/v1/admissions/{admission_id}/enroll",
        json={"parent_account_email": "hr@qmis.edu", "parent_account_password": "Parent-Test-2026"},
        headers=headers,
    )
    assert enrolled.status_code == 409, enrolled.text
    assert enrolled.json()["detail"]["code"] == "email_in_use"

    still_open = client.get(f"/api/v1/admissions/{admission_id}", headers=headers)
    assert still_open.json()["status"] != "Enrolled"


def test_create_admission_direct(client):
    headers = _login(client)
    created = client.post(
        "/api/v1/admissions",
        json={
            "first_name": "Diya",
            "mobile_number": "9000000001",
            "class_name": "Grade 2",
            "gender": "Female",
        },
        headers=headers,
    )
    assert created.status_code == 201, created.text
    assert created.json()["admission_code"].startswith("ADM-")
    rows = client.get("/api/v1/admissions", headers=headers)
    assert rows.status_code == 200
    assert any(row["first_name"] == "Diya" for row in rows.json())


def test_enroll_with_student_email_but_no_password_skips_student_login(client):
    """Student portal login is optional — missing password must not crash enroll."""
    headers = _login(client)
    created = client.post(
        "/api/v1/admissions",
        json={
            "first_name": "Kabir",
            "mobile_number": "9000000099",
            "class_name": "Grade 1",
            "parent_account_email": "parent.kabir@example.com",
        },
        headers=headers,
    )
    assert created.status_code == 201, created.text
    admission_id = created.json()["id"]

    enrolled = client.post(
        f"/api/v1/admissions/{admission_id}/enroll",
        json={
            "parent_account_email": "parent.kabir@example.com",
            "parent_account_password": "Parent-Test-2026",
            "skip_student_account": False,
            "student_account_email": "student.kabir@example.com",
            # student_account_password omitted on purpose
        },
        headers=headers,
    )
    assert enrolled.status_code == 200, enrolled.text
    body = enrolled.json()
    assert body["admission"]["status"] == "Enrolled"
    assert body["student_id"]
    assert body["student_created"] is False
    assert body["student_user_id"] is None
    assert body["parent_created"] is True


def test_typed_route_and_bus_stop_are_saved_and_overlong_values_rejected(client):
    headers = _login(client)
    base = {"first_name": "Ria", "mobile_number": "9000000055", "class_name": "Grade 2",
            "mode_of_transport": "School Bus"}
    created = client.post("/api/v1/admissions", json={**base, "route": "Route 9 - Lake View (new)",
                                                      "bus_stop": "Temple Street corner"}, headers=headers)
    assert created.status_code == 201, created.text
    stored = client.get(f"/api/v1/admissions/{created.json()['id']}", headers=headers).json()
    assert (stored["route"], stored["bus_stop"]) == ("Route 9 - Lake View (new)", "Temple Street corner")

    too_long = client.post("/api/v1/admissions", json={**base, "route": "R" * 81}, headers=headers)
    assert too_long.status_code == 422
    assert client.patch(f"/api/v1/admissions/{created.json()['id']}", json={**base, "bus_stop": "S" * 81},
                        headers=headers).status_code == 422
    assert client.get(f"/api/v1/admissions/{created.json()['id']}", headers=headers).json()["bus_stop"] == "Temple Street corner"


def test_student_portal_login_saved_on_the_admission_survives_later_edits(client):
    """The admission form sends student_account_* on every save; a blank password keeps the saved one."""
    headers = _login(client)
    body = {"first_name": "Tara", "mobile_number": "9000000066", "class_name": "Grade 6",
            "parent_account_email": "parent.tara@example.com", "parent_account_password": "Parent-Test-2026",
            "student_account_email": "Student.Tara@example.com", "student_account_password": "Student-Test-2026"}
    created = client.post("/api/v1/admissions", json=body, headers=headers)
    assert created.status_code == 201, created.text
    admission_id = created.json()["id"]
    first = client.get(f"/api/v1/admissions/{admission_id}", headers=headers).json()
    assert first["student_account_email"] == "student.tara@example.com"
    assert first["has_student_account_password"] is True and first["has_parent_account_password"] is True

    edit = {**body, "first_name": "Tara", "last_name": "Rao", "parent_account_password": None, "student_account_password": None}
    assert client.patch(f"/api/v1/admissions/{admission_id}", json=edit, headers=headers).status_code == 200
    after = client.get(f"/api/v1/admissions/{admission_id}", headers=headers).json()
    assert after["last_name"] == "Rao"
    assert after["student_account_email"] == "student.tara@example.com"
    assert after["has_student_account_password"] is True and after["has_parent_account_password"] is True

    enrolled = client.post(f"/api/v1/admissions/{admission_id}/enroll", json={"skip_student_account": False}, headers=headers)
    assert enrolled.status_code == 200, enrolled.text
    assert enrolled.json()["student_created"] is True and enrolled.json()["student_user_id"]
    login = client.post("/api/v1/auth/login", json={"email": "student.tara@example.com", "password": "Student-Test-2026"})
    assert login.status_code == 200 and login.json()["role"] == "student"


def test_referral_is_recorded_kept_on_unrelated_edits_and_listed_for_accounts(client):
    headers = _login(client)
    body = {"first_name": "Riya", "mobile_number": "9000000155", "class_name": "Grade 7",
            "parent_account_email": "parent.riya@example.com",
            "referral_type": "Parent", "referral_name": "Meena Iyer", "referral_contact": "9000000156",
            "referral_student_admission_no": "ADM-0001", "referral_notes": "Sibling's friend"}
    created = client.post("/api/v1/admissions", json=body, headers=headers)
    assert created.status_code == 201, created.text
    admission = created.json()
    assert admission["referral_type"] == "Parent" and admission["referral_name"] == "Meena Iyer"

    # an edit that does not mention the referral keeps it
    minimal = {k: v for k, v in body.items() if not k.startswith("referral_")}
    assert client.patch(f"/api/v1/admissions/{admission['id']}", json={**minimal, "last_name": "K"},
                        headers=headers).status_code == 200
    again = client.get(f"/api/v1/admissions/{admission['id']}", headers=headers).json()
    assert again["referral_name"] == "Meena Iyer" and again["last_name"] == "K"

    accounts = client.post("/api/v1/auth/login", json={"email": "accounthead@qmis.edu", "password": "accounts123"})
    accounts_headers = {"Authorization": f"Bearer {accounts.json()['access_token']}"}
    listed = client.get("/api/v1/admissions/referrals", headers=accounts_headers)
    assert listed.status_code == 200, listed.text
    row = next(r for r in listed.json() if r["admissionId"] == admission["id"])
    assert row["referrerName"] == "Meena Iyer" and row["referrerStudentAdmissionNo"] == "ADM-0001"
    assert row["studentName"].startswith("Riya")

    # a blank referrer name removes it
    cleared = client.patch(f"/api/v1/admissions/{admission['id']}", json={**body, "referral_name": ""}, headers=headers)
    assert cleared.status_code == 200 and cleared.json()["referral_name"] is None
    assert not any(r["admissionId"] == admission["id"]
                   for r in client.get("/api/v1/admissions/referrals", headers=accounts_headers).json())

    assert client.post("/api/v1/admissions", json={**body, "referral_type": "Neighbour"},
                       headers=headers).status_code == 422


@pytest.fixture()
def school_login_policy(monkeypatch):
    """Production policy: only Grade 6 and above get a student login (conftest relaxes it to 1)."""
    from app.core.config import settings

    monkeypatch.setattr(settings, "student_login_min_grade", 6)


@pytest.mark.parametrize("class_name", ["LKG", "UKG", "Pre-KG", "Grade 1", "Grade 5", "V"])
def test_junior_classes_cannot_get_a_student_login(client, school_login_policy, class_name):
    headers = _login(client)
    tag = "".join(ch for ch in class_name.lower() if ch.isalnum())
    parent, student = f"parent.mini.{tag}@example.com", f"student.mini.{tag}@example.com"
    body = {"first_name": "Mini", "mobile_number": "9000000077", "class_name": class_name,
            "parent_account_email": parent,
            "student_account_email": student, "student_account_password": "Student-Test-2026"}
    rejected = client.post("/api/v1/admissions", json=body, headers=headers)
    assert rejected.status_code == 400, rejected.text
    assert "parent login" in rejected.text

    no_student = {**body, "student_account_email": None, "student_account_password": None}
    created = client.post("/api/v1/admissions", json=no_student, headers=headers)
    assert created.status_code == 201, created.text
    admission_id = created.json()["id"]
    assert client.patch(f"/api/v1/admissions/{admission_id}", json=body, headers=headers).status_code == 400

    enroll_with_student = {"parent_account_email": parent, "parent_account_password": "Parent-Test-2026",
                           "skip_student_account": False, "student_account_email": student,
                           "student_account_password": "Student-Test-2026"}
    assert client.post(f"/api/v1/admissions/{admission_id}/enroll", json=enroll_with_student,
                       headers=headers).status_code == 400
    enrolled = client.post(f"/api/v1/admissions/{admission_id}/enroll",
                           json={"parent_account_email": parent, "parent_account_password": "Parent-Test-2026"},
                           headers=headers)
    assert enrolled.status_code == 200, enrolled.text
    assert enrolled.json()["student_created"] is False and not enrolled.json()["student_user_id"]
    assert enrolled.json()["parent_user_id"]


@pytest.mark.parametrize("class_name", ["Grade 6", "Grade 12", "VI"])
def test_senior_classes_keep_the_optional_student_login(client, school_login_policy, class_name):
    headers = _login(client)
    tag = "".join(ch for ch in class_name.lower() if ch.isalnum())
    body = {"first_name": "Ravi", "mobile_number": "9000000088", "class_name": class_name,
            "parent_account_email": f"parent.ravi.{tag}@example.com", "parent_account_password": "Parent-Test-2026",
            "student_account_email": f"student.ravi.{tag}@example.com", "student_account_password": "Student-Test-2026"}
    created = client.post("/api/v1/admissions", json=body, headers=headers)
    assert created.status_code == 201, created.text
    enrolled = client.post(f"/api/v1/admissions/{created.json()['id']}/enroll", json={"skip_student_account": False},
                           headers=headers)
    assert enrolled.status_code == 200, enrolled.text
    assert enrolled.json()["student_created"] is True


def test_older_junior_admission_with_a_saved_student_login_still_enrols_parent_only(client, school_login_policy, monkeypatch):
    """Admissions saved before the rule may carry a student login; enrolment skips it instead of failing."""
    from app.core.config import settings

    headers = _login(client)
    monkeypatch.setattr(settings, "student_login_min_grade", 1)
    body = {"first_name": "Old", "mobile_number": "9000000099", "class_name": "Grade 3",
            "parent_account_email": "parent.old@example.com", "parent_account_password": "Parent-Test-2026",
            "student_account_email": "student.old@example.com", "student_account_password": "Student-Test-2026"}
    created = client.post("/api/v1/admissions", json=body, headers=headers)
    assert created.status_code == 201, created.text
    monkeypatch.setattr(settings, "student_login_min_grade", 6)
    enrolled = client.post(f"/api/v1/admissions/{created.json()['id']}/enroll", json={}, headers=headers)
    assert enrolled.status_code == 200, enrolled.text
    assert enrolled.json()["student_created"] is False


def test_junior_enroll_rejects_pending_student_hash_when_student_account_requested(
    client, school_login_policy, monkeypatch,
):
    """Pending hash on the row must fail the same junior check as a payload password."""
    from app.core.config import settings

    headers = _login(client)
    monkeypatch.setattr(settings, "student_login_min_grade", 1)
    body = {
        "first_name": "Hash",
        "mobile_number": "9000000100",
        "class_name": "Grade 4",
        "parent_account_email": "parent.hash@example.com",
        "parent_account_password": "Parent-Test-2026",
        "student_account_email": "student.hash@example.com",
        "student_account_password": "Student-Test-2026",
    }
    created = client.post("/api/v1/admissions", json=body, headers=headers)
    assert created.status_code == 201, created.text
    monkeypatch.setattr(settings, "student_login_min_grade", 6)
    # Empty payload password but skip_student_account=False — pending hash is still login material.
    rejected = client.post(
        f"/api/v1/admissions/{created.json()['id']}/enroll",
        json={"skip_student_account": False},
        headers=headers,
    )
    assert rejected.status_code == 400, rejected.text
    assert "parent login" in rejected.text
