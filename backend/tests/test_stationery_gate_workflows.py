"""Stationery stock / procurement / gate visitor upsert + duty isolation."""

import os

os.environ["DATABASE_URL"] = "sqlite+pysqlite:///:memory:"
os.environ["OTP_DEBUG"] = "true"
os.environ["JWT_SECRET"] = "test-secret-qmis-erp-phase0-local"
os.environ["ENVIRONMENT"] = "development"

import pytest
from fastapi.testclient import TestClient

from app.core.config import settings
from app.main import app


@pytest.fixture()
def client():
    with TestClient(app) as test_client:
        yield test_client


def _login(client, email: str, password: str):
    response = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    assert response.status_code == 200, response.text
    return {"Authorization": f"Bearer {response.json()['access_token']}"}


def _store(client):
    return _login(client, "stationerystoremanager@qmis.edu", "stationery123")


def _gate(client):
    return _login(client, "gatekeeper@qmis.edu", "gatekeeper123")


def _gkm(client):
    return _login(client, "gatekeepermanager@qmis.edu", "gkm1234567")


def _jd(client):
    return _login(client, "jointdirector@qmis.edu", "jd12345678")


def _finance(client):
    return _login(client, settings.accounthead_seed_email, settings.accounthead_seed_password)


def _seed_inventory(client, headers, qty=10):
    payload = [
        {
            "id": "STN-TEST-1",
            "itemId": "STN-TEST-1",
            "itemName": "Test Ballpoint Pen",
            "availableQuantity": qty,
            "reorderLevel": 5,
            "unitCost": "₹10",
            "status": "Available",
        }
    ]
    put = client.put("/api/v1/ops/stationery-inventory", json=payload, headers=headers)
    assert put.status_code == 200, put.text


def test_issue_return_deducts_stock_and_is_idempotent(client):
    headers = _store(client)
    _seed_inventory(client, headers, qty=10)

    body = {
        "activityType": "Issue",
        "clientRequestId": "IR-IDEMP-1",
        "requestedBy": "Priya",
        "department": "Mathematics",
        "lines": [{"itemName": "Test Ballpoint Pen", "quantity": 3}],
    }
    first = client.post("/api/v1/ops/stationery/issue-return", json=body, headers=headers)
    assert first.status_code == 200, first.text
    assert first.json()["success"] is True

    inv = client.get("/api/v1/ops/stationery-inventory", headers=headers).json()
    assert inv[0]["availableQuantity"] == 7

    second = client.post("/api/v1/ops/stationery/issue-return", json=body, headers=headers)
    assert second.status_code == 200, second.text
    assert second.json().get("idempotent") is True
    inv2 = client.get("/api/v1/ops/stationery-inventory", headers=headers).json()
    assert inv2[0]["availableQuantity"] == 7


def test_issue_rejects_insufficient_stock(client):
    headers = _store(client)
    _seed_inventory(client, headers, qty=2)
    response = client.post(
        "/api/v1/ops/stationery/issue-return",
        json={
            "activityType": "Issue",
            "clientRequestId": "IR-OVER",
            "requestedBy": "Priya",
            "department": "Mathematics",
            "lines": [{"itemName": "Test Ballpoint Pen", "quantity": 5}],
        },
        headers=headers,
    )
    assert response.status_code == 409
    assert response.json()["detail"]["code"] == "insufficient_stock"


def test_request_decide_approve_and_reject_permissions(client):
    store = _store(client)
    teacher = _login(client, settings.teacher_seed_email, settings.teacher_seed_password)

    put = client.put(
        "/api/v1/ops/stationery-requests/items/REQ-SS-TEST-1",
        json={
            "id": "REQ-SS-TEST-1",
            "requestId": "REQ-SS-TEST-1",
            "title": "Pens",
            "status": "Pending",
            "requestedByEmail": "teacher@example.com",
        },
        headers=store,
    )
    assert put.status_code == 200, put.text

    denied = client.post(
        "/api/v1/ops/stationery/requests/REQ-SS-TEST-1/decide",
        json={"decision": "approve"},
        headers=teacher,
    )
    assert denied.status_code == 403

    approved = client.post(
        "/api/v1/ops/stationery/requests/REQ-SS-TEST-1/decide",
        json={"decision": "approve", "comment": "OK"},
        headers=store,
    )
    assert approved.status_code == 200, approved.text
    assert approved.json()["status"] == "Approved"
    assert approved.json()["decidedBy"]


def test_procurement_jd_and_finance_gates(client):
    store = _store(client)
    jd = _jd(client)
    finance = _finance(client)

    create = client.put(
        "/api/v1/ops/stationery-procurement",
        json=[
            {
                "id": "REQ-ST-PO-TEST",
                "title": "Paper",
                "amount": 1000,
                "minorPurchase": True,
                "status": "QUOTATION_PENDING",
            }
        ],
        headers=store,
    )
    assert create.status_code == 200, create.text

    to_review = client.post(
        "/api/v1/ops/stationery/procurement/REQ-ST-PO-TEST/decide",
        json={"action": "advance"},
        headers=store,
    )
    assert to_review.status_code == 200, to_review.text
    assert to_review.json()["status"] == "DEPARTMENT_REVIEW"

    # Store cannot JD-approve
    store_jd = client.post(
        "/api/v1/ops/stationery/procurement/REQ-ST-PO-TEST/decide",
        json={"action": "approve"},
        headers=store,
    )
    assert store_jd.status_code == 403

    jd_ok = client.post(
        "/api/v1/ops/stationery/procurement/REQ-ST-PO-TEST/decide",
        json={"action": "approve", "comment": "JD ok"},
        headers=jd,
    )
    assert jd_ok.status_code == 200, jd_ok.text
    assert jd_ok.json()["status"] == "MINOR_APPROVED"

    fin = client.post(
        "/api/v1/ops/stationery/procurement/REQ-ST-PO-TEST/decide",
        json={"action": "approve_budget"},
        headers=finance,
    )
    assert fin.status_code == 200, fin.text
    assert fin.json()["status"] == "PO_REQUIRED"
    assert fin.json().get("budgetApproved") is True

    paid = client.post(
        "/api/v1/ops/stationery/procurement/REQ-ST-PO-TEST/decide",
        json={"action": "mark_paid"},
        headers=store,
    )
    assert paid.status_code == 400


def test_grn_idempotent_inventory_update(client):
    store = _store(client)
    _seed_inventory(client, headers=store, qty=4)
    client.put(
        "/api/v1/ops/stationery-procurement",
        json=[
            {
                "id": "REQ-ST-PO-GRN",
                "title": "Test Ballpoint Pen",
                "status": "QUOTATION_PENDING",
                "minorPurchase": True,
            }
        ],
        headers=store,
    )
    # A purchase reaches PO_APPROVED only through the Store -> JD -> Finance -> Store -> Finance chain.
    for headers, action in (
        (store, "advance"),
        (_jd(client), "approve"),
        (_finance(client), "approve_budget"),
        (store, "advance"),
        (_finance(client), "mark_po_approved"),
    ):
        step = client.post(
            "/api/v1/ops/stationery/procurement/REQ-ST-PO-GRN/decide",
            json={"action": action},
            headers=headers,
        )
        assert step.status_code == 200, step.text
    assert step.json()["status"] == "PO_APPROVED"
    body = {"grnId": "GRN-1", "itemName": "Test Ballpoint Pen", "quantity": 6}
    first = client.post(
        "/api/v1/ops/stationery/procurement/REQ-ST-PO-GRN/receive-goods",
        json=body,
        headers=store,
    )
    assert first.status_code == 200, first.text
    inv = client.get("/api/v1/ops/stationery-inventory", headers=store).json()
    assert inv[0]["availableQuantity"] == 10

    second = client.post(
        "/api/v1/ops/stationery/procurement/REQ-ST-PO-GRN/receive-goods",
        json=body,
        headers=store,
    )
    assert second.status_code == 200, second.text
    assert second.json().get("idempotent") is True
    inv2 = client.get("/api/v1/ops/stationery-inventory", headers=store).json()
    assert inv2[0]["availableQuantity"] == 10


def test_gate_visitor_item_upsert_and_exit_stamp(client):
    headers = _gate(client)
    # Whole-list PUT is rejected for gate-visitors
    denied = client.put(
        "/api/v1/ops/gate-visitors",
        json=[{"id": "GVS-1", "visitorName": "Asha", "status": "Inside"}],
        headers=headers,
    )
    assert denied.status_code == 400

    create = client.put(
        "/api/v1/ops/gate-visitors/items/GVS-1",
        json={"id": "GVS-1", "visitorName": "Asha", "status": "Inside"},
        headers=headers,
    )
    assert create.status_code == 200, create.text

    exit_one = client.put(
        "/api/v1/ops/gate-visitors/items/GVS-1",
        json={"id": "GVS-1", "visitorName": "Asha", "status": "Exited"},
        headers=headers,
    )
    assert exit_one.status_code == 200, exit_one.text
    body = exit_one.json()
    assert body["status"] == "Exited"
    assert body.get("exitedAt")
    assert body.get("exitedByEmail")

    # Second exit keeps original stamp (idempotent)
    exited_at = body["exitedAt"]
    exit_two = client.put(
        "/api/v1/ops/gate-visitors/items/GVS-1",
        json={"id": "GVS-1", "visitorName": "Asha", "status": "Exited", "note": "again"},
        headers=headers,
    )
    assert exit_two.status_code == 200
    assert exit_two.json()["exitedAt"] == exited_at


def test_gatekeeper_duty_list_is_isolated(client):
    gkm = _gkm(client)
    gate = _gate(client)

    client.put(
        "/api/v1/ops/gate-duty-assignments/items/DUT-A",
        json={
            "id": "DUT-A",
            "dutyId": "DUT-A",
            "gateKeeperName": "Other",
            "assigneeEmail": "other@qmis.edu",
            "status": "Assigned",
        },
        headers=gkm,
    )
    client.put(
        "/api/v1/ops/gate-duty-assignments/items/DUT-B",
        json={
            "id": "DUT-B",
            "dutyId": "DUT-B",
            "gateKeeperName": "Self",
            "assigneeEmail": "gatekeeper@qmis.edu",
            "status": "Assigned",
        },
        headers=gkm,
    )

    mine = client.get("/api/v1/ops/gate-duty-assignments", headers=gate)
    assert mine.status_code == 200, mine.text
    ids = {row["id"] for row in mine.json()}
    assert ids == {"DUT-B"}

    manager = client.get("/api/v1/ops/gate-duty-assignments", headers=gkm)
    assert {row["id"] for row in manager.json()} == {"DUT-A", "DUT-B"}
