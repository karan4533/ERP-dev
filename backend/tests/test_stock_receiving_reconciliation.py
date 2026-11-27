"""Store issue / receive ledger: Given and Received stay separate, quantities reconcile, the ledger is append-only."""

import os

os.environ["DATABASE_URL"] = "sqlite+pysqlite:///:memory:"
os.environ["OTP_DEBUG"] = "true"
os.environ["JWT_SECRET"] = "test-secret-qmis-erp-stock-receiving"

import pytest
from fastapi.testclient import TestClient

from app.main import app
from tests.conftest import reset_sqlite_memory_schema

STORE = ("stationerystoremanager@qmis.edu", "stationery123")
HK = ("housekeepingmanager@qmis.edu", "housekeeping123")
MOVE = "/api/v1/ops/stationery/issue-return"
LEDGER = "/api/v1/ops/stationery-issue-returns"


@pytest.fixture()
def client():
    reset_sqlite_memory_schema()
    with TestClient(app) as test_client:
        yield test_client


def _h(client, who):
    response = client.post("/api/v1/auth/login", json={"email": who[0], "password": who[1]})
    assert response.status_code == 200, response.text
    return {"Authorization": f"Bearer {response.json()['access_token']}"}


def _seed(client, store, qty=20):
    saved = client.put(
        "/api/v1/ops/stationery-inventory",
        json=[{"id": "STN-RCV-1", "itemId": "STN-RCV-1", "itemName": "Audit Kit", "availableQuantity": qty, "reorderLevel": 2}],
        headers=store,
    )
    assert saved.status_code == 200, saved.text


def _stock(client, store):
    rows = client.get("/api/v1/ops/stationery-inventory", headers=store).json()
    return next(r for r in rows if r["id"] == "STN-RCV-1")["availableQuantity"]


def _move(client, store, **body):
    payload = {"department": "Audit", "requestedBy": "Process Auditor", "itemId": "STN-RCV-1", **body}
    return client.post(MOVE, json=payload, headers=store)


def _ledger(client, store):
    return {row["id"]: row for row in client.get(LEDGER, headers=store).json()}


def test_partial_receiving_reconciles_against_the_given_record(client):
    store = _h(client, STORE)
    _seed(client, store, qty=20)
    given = _move(client, store, activityType="Given", quantity=10, clientRequestId="GIVE-1")
    assert given.status_code == 200, given.text
    given_id = given.json()["movements"][0]["id"] if "movements" in given.json() else "GIVE-1"
    assert _stock(client, store) == 10
    original = dict(_ledger(client, store)[given_id])

    first = _move(client, store, activityType="Receiving", quantity=4, originalIssueRef=given_id, clientRequestId="RCV-1")
    assert first.status_code == 200, first.text
    second = _move(client, store, activityType="Receiving", quantity=6, originalIssueRef=given_id, clientRequestId="RCV-2")
    assert second.status_code == 200, second.text

    ledger = _ledger(client, store)
    assert {k: v for k, v in ledger[given_id].items() if not k.startswith("_")} == {
        k: v for k, v in original.items() if not k.startswith("_")
    }, "the Given record is never overwritten"
    assert ledger[given_id]["activityType"] == "Issue" and ledger[given_id]["quantity"] == 10
    r1, r2 = ledger["RCV-1"], ledger["RCV-2"]
    assert (r1["issuedQuantity"], r1["receivedToDate"], r1["balanceQuantity"], r1["reconciliationStatus"]) == (10, 4, 6, "Partially Received")
    assert (r2["receivedBefore"], r2["receivedToDate"], r2["balanceQuantity"], r2["reconciliationStatus"]) == (4, 10, 0, "Fully Received")
    assert r1["originalIssueRef"] == given_id and r2["status"] == "Received"
    assert _stock(client, store) == 20


def test_receiving_more_than_was_given_is_refused(client):
    store = _h(client, STORE)
    _seed(client, store, qty=20)
    _move(client, store, activityType="Given", quantity=5, clientRequestId="GIVE-2")
    _move(client, store, activityType="Receiving", quantity=3, originalIssueRef="GIVE-2", clientRequestId="RCV-3")
    over = _move(client, store, activityType="Return", quantity=3, originalIssueRef="GIVE-2", clientRequestId="RET-1")
    assert over.status_code == 409 and over.json()["detail"]["code"] == "exceeds_issued", over.text
    assert _stock(client, store) == 18
    assert "RET-1" not in _ledger(client, store)


def test_receiving_against_an_unknown_issue_or_other_item_is_refused(client):
    store = _h(client, STORE)
    _seed(client, store)
    missing = _move(client, store, activityType="Return", quantity=1, originalIssueRef="NO-SUCH-ISSUE")
    assert missing.status_code == 404, missing.text
    client.put(
        "/api/v1/ops/stationery-inventory",
        json=[
            {"id": "STN-RCV-1", "itemId": "STN-RCV-1", "itemName": "Audit Kit", "availableQuantity": 20, "reorderLevel": 2},
            {"id": "STN-RCV-2", "itemId": "STN-RCV-2", "itemName": "Marker", "availableQuantity": 9, "reorderLevel": 1},
        ],
        headers=store,
    )
    _move(client, store, activityType="Given", quantity=2, clientRequestId="GIVE-3")
    wrong_item = _move(client, store, activityType="Receiving", quantity=1, originalIssueRef="GIVE-3", itemId="STN-RCV-2")
    assert wrong_item.status_code == 422, wrong_item.text


def test_receiving_without_a_reference_is_still_inbound_stock(client):
    store = _h(client, STORE)
    _seed(client, store, qty=3)
    inbound = _move(client, store, activityType="Receiving", quantity=4, clientRequestId="RCV-FREE")
    assert inbound.status_code == 200, inbound.text
    assert _stock(client, store) == 7
    assert "issuedQuantity" not in _ledger(client, store)["RCV-FREE"]


def test_ledger_is_append_only(client):
    store = _h(client, STORE)
    _seed(client, store)
    _move(client, store, activityType="Given", quantity=2, clientRequestId="GIVE-4")
    replaced = client.put(LEDGER, json=[], headers=store)
    assert replaced.status_code == 403, replaced.text
    edited = client.put(f"{LEDGER}/items/GIVE-4", json={"quantity": 99, "activityType": "Issue"}, headers=store)
    assert edited.status_code == 403, edited.text
    deleted = client.delete(f"{LEDGER}/items/GIVE-4", headers=store)
    assert deleted.status_code == 403, deleted.text
    assert _ledger(client, store)["GIVE-4"]["quantity"] == 2
    assert _move(client, _h(client, HK), activityType="Given", quantity=1).status_code == 403
