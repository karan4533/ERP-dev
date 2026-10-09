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
            "parent_account_password": "parent123",
        },
        headers=headers,
    )
    assert enrolled.status_code == 200, enrolled.text
    result = enrolled.json()
    assert result["student_code"].startswith("ADM-")
    assert result["parent_created"] is True
    assert result["parent_user_id"]
    assert result["admission"]["status"] == "Enrolled"

    again = client.post(
        f"/api/v1/admissions/{admission_id}/enroll",
        json={"skip_parent_account": True},
        headers=headers,
    )
    assert again.status_code == 409


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
