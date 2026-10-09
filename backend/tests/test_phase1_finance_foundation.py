"""Phase 1: Finance Head/Assistant perms, financial year, fee validation, persistence."""

import os

os.environ["DATABASE_URL"] = "sqlite+pysqlite:///:memory:"
os.environ["OTP_DEBUG"] = "true"
os.environ["JWT_SECRET"] = "test-secret-qmis-erp-phase1-foundation"
os.environ["INTEGRATIONS_MODE"] = ""

import pytest
from fastapi.testclient import TestClient

from app.main import app


@pytest.fixture()
def client():
    with TestClient(app) as test_client:
        yield test_client


def _login(client: TestClient, email: str, password: str) -> dict:
    response = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    assert response.status_code == 200, response.text
    return {"Authorization": f"Bearer {response.json()['access_token']}"}


def test_finance_head_and_assistant_permissions(client):
    head = _login(client, "accounthead@qmis.edu", "accounts123")
    assistant = _login(client, "finance.assistant@qmis.edu", "finance123")

    head_me = client.get("/api/v1/auth/me", headers=head).json()
    asst_me = client.get("/api/v1/auth/me", headers=assistant).json()
    assert head_me["role"] == "accounthead"
    assert "finance.write" in head_me["permissions"]
    assert "finance.approve" in head_me["permissions"]
    assert "finance.collect" in head_me["permissions"]
    assert asst_me["role"] == "finance_assistant"
    assert "finance.collect" in asst_me["permissions"]
    assert "finance.read" in asst_me["permissions"]
    assert "finance.write" not in asst_me["permissions"]
    assert "finance.approve" not in asst_me["permissions"]

    denied = client.put("/api/v1/finance/state", headers=assistant, json={"data": {"meta": {"seeded": True}}})
    assert denied.status_code == 403

    denied_approve = client.post("/api/v1/finance/actions/decide-approval", headers=assistant, json={
        "approvalId": "x",
        "decision": "approved",
    })
    assert denied_approve.status_code == 403


def test_financial_year_april_march_separate_from_academic(client):
    admin = _login(client, "admin@qmis.edu", "admin123")
    fy = client.get("/api/v1/masters/financial-years/current", headers=admin)
    assert fy.status_code == 200, fy.text
    body = fy.json()
    assert body["name"] == "FY 2026-27"
    assert body["start_date"] == "2026-04-01"
    assert body["end_date"] == "2027-03-31"

    ay = client.get("/api/v1/masters/academic-years/current", headers=admin)
    assert ay.status_code == 200
    assert ay.json()["name"] == "2026-27"
    assert ay.json()["id"] != body["id"]

    bad = client.post(
        "/api/v1/masters/financial-years",
        headers=admin,
        json={"name": "FY Bad", "start_date": "2026-01-01", "end_date": "2026-12-31"},
    )
    assert bad.status_code == 400


def test_fee_structure_validation_and_persistence_after_relogin(client):
    head = _login(client, "accounthead@qmis.edu", "accounts123")
    marker = "PHASE1-PERSIST-OK"

    invalid = client.put(
        "/api/v1/finance/state",
        headers=head,
        json={
            "data": {
                "feeStructures": [{"id": "FS-1", "className": "Grade 1", "amount": -10}],
                "feeCategories": [],
                "fineRules": [],
                "meta": {"seeded": True},
            }
        },
    )
    assert invalid.status_code == 400

    missing_year = client.put(
        "/api/v1/finance/state",
        headers=head,
        json={
            "data": {
                "feeStructures": [{"id": "FS-1", "className": "Grade 1", "amount": 1000}],
                "feeCategories": [{"id": "CAT-1", "name": "Tuition"}],
                "fineRules": [],
                "meta": {"seeded": True, "phase1Marker": marker},
            }
        },
    )
    assert missing_year.status_code == 400

    saved = client.put(
        "/api/v1/finance/state",
        headers=head,
        json={
            "data": {
                "feeStructures": [{
                    "id": "FS-1",
                    "className": "Grade 1",
                    "academicYear": "2026-27",
                    "amount": 12000,
                }],
                "feeCategories": [{"id": "CAT-1", "name": "Tuition"}],
                "fineRules": [{"id": "FINE-1", "amount": 50, "graceDays": 5}],
                "students": [],
                "installments": [],
                "transactions": [],
                "receipts": [],
                "meta": {"seeded": True, "phase1Marker": marker},
                "sequence": {"pay": 1, "rec": 1, "txn": 1, "voucher": 1, "link": 1},
            }
        },
    )
    assert saved.status_code == 200, saved.text
    assert saved.json()["data"]["meta"]["phase1Marker"] == marker
    assert saved.json()["data"]["meta"].get("financialYearName") == "FY 2026-27"
    assert saved.json()["data"]["meta"].get("financialYearStartMonth") == "April"

    # Simulate logout/login with a fresh token (browser refresh / re-auth).
    again = _login(client, "accounthead@qmis.edu", "accounts123")
    loaded = client.get("/api/v1/finance/state", headers=again)
    assert loaded.status_code == 200
    assert loaded.json()["data"]["meta"]["phase1Marker"] == marker
    assert any(row["id"] == "FS-1" for row in loaded.json()["data"]["feeStructures"])

    assistant = _login(client, "finance.assistant@qmis.edu", "finance123")
    readable = client.get("/api/v1/finance/state", headers=assistant)
    assert readable.status_code == 200
    assert readable.json()["data"]["meta"]["phase1Marker"] == marker
