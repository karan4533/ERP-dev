"""Store product request security: server numbering, ownership, approval-before-issue, read scoping."""

import os

os.environ["DATABASE_URL"] = "sqlite+pysqlite:///:memory:"
os.environ["OTP_DEBUG"] = "true"
os.environ["JWT_SECRET"] = "test-secret-qmis-erp-store-request-security"

import pytest
from fastapi.testclient import TestClient

from app.main import app
from tests.conftest import reset_sqlite_memory_schema

HK = ("housekeepingmanager@qmis.edu", "housekeeping123")
MAINT = ("maintenancemanager@qmis.edu", "maintenance123")
STORE = ("stationerystoremanager@qmis.edu", "stationery123")
CREATE = "/api/v1/ops/stationery/requests"
ITEMS = "/api/v1/ops/stationery-requests/items"


@pytest.fixture()
def client():
    reset_sqlite_memory_schema()
    with TestClient(app) as test_client:
        yield test_client


def _h(client, who):
    response = client.post("/api/v1/auth/login", json={"email": who[0], "password": who[1]})
    assert response.status_code == 200, response.text
    return {"Authorization": f"Bearer {response.json()['access_token']}"}


def _create(client, headers, item="Floor cleaner", quantity=3, **extra):
    response = client.post(CREATE, json={"item": item, "quantity": quantity, **extra}, headers=headers)
    assert response.status_code == 201, response.text
    return response.json()


def _list(client, headers):
    response = client.get("/api/v1/ops/stationery-requests", headers=headers)
    assert response.status_code == 200, response.text
    return {row["id"]: row for row in response.json()}


def _seed_inventory(client, store, qty=10):
    saved = client.put(
        "/api/v1/ops/stationery-inventory",
        json=[{"id": "STN-SEC-1", "itemId": "STN-SEC-1", "itemName": "Floor cleaner", "availableQuantity": qty, "reorderLevel": 2}],
        headers=store,
    )
    assert saved.status_code == 200, saved.text


def test_server_assigns_numbers_department_and_identity(client):
    hk, maint = _h(client, HK), _h(client, MAINT)
    first = _create(client, hk, department="Maintenance", status="Approved", requestedByEmail="someone@else")
    second = _create(client, maint, item="Fuse pack", quantity=2)
    third = _create(client, hk, item="Mop", quantity=1)

    ids = [first["id"], second["id"], third["id"]]
    assert ids == ["REQ-ST-0001", "REQ-ST-0002", "REQ-ST-0003"]
    assert first["requestId"] == first["id"]
    # Client-supplied department/status/identity are ignored.
    assert first["department"] == "Housekeeping"
    assert first["status"] == "Pending"
    assert first["requestedByEmail"] == HK[0]
    assert second["department"] == "Maintenance"


def test_duplicate_submission_with_same_client_key_is_idempotent(client):
    hk = _h(client, HK)
    one = _create(client, hk, clientRequestId="form-abc")
    again = client.post(CREATE, json={"item": "Floor cleaner", "quantity": 3, "clientRequestId": "form-abc"}, headers=hk)
    assert again.status_code == 201
    assert again.json()["id"] == one["id"] and again.json().get("idempotent") is True
    assert len(_list(client, hk)) == 1


def _set_request_counter(last):
    from sqlalchemy import select

    from app.core.database import SessionLocal
    from app.models import OpsRecord
    from app.services import stationery_workflow as svc

    with SessionLocal() as db:
        counter = db.scalar(select(OpsRecord).where(OpsRecord.collection == svc.REQUEST_SEQUENCE))
        assert counter is not None
        counter.body = {"last": last}
        db.commit()


def test_number_allocation_retries_when_a_number_is_taken(client, monkeypatch):
    from app.services import stationery_workflow as svc

    hk = _h(client, HK)
    taken = _create(client, hk)
    # A stale counter and a stale scan (e.g. a row written outside the counter) make attempt one collide.
    _set_request_counter(0)
    calls = {"n": 0}
    real = svc._highest_request_number

    def stale(db, campus_id):
        calls["n"] += 1
        return 0 if calls["n"] == 1 else real(db, campus_id)

    monkeypatch.setattr(svc, "_highest_request_number", stale)
    second = _create(client, _h(client, MAINT), item="Fuse pack")
    assert second["id"] != taken["id"] and calls["n"] == 2
    assert set(_list(client, _h(client, STORE))) == {taken["id"], second["id"]}


def test_request_numbers_follow_the_campus_counter(client):
    hk, maint = _h(client, HK), _h(client, MAINT)
    first = _create(client, hk)
    _set_request_counter(41)
    second = _create(client, maint, item="Fuse pack")
    third = _create(client, hk, item="Mop", quantity=1)
    assert (first["id"], second["id"], third["id"]) == ("REQ-ST-0001", "REQ-ST-0042", "REQ-ST-0043")
    # The counter is internal: it is not one of the requests and has no API collection.
    assert set(_list(client, _h(client, STORE))) == {first["id"], second["id"], third["id"]}
    assert client.get("/api/v1/ops/stationery-request-sequence", headers=_h(client, STORE)).status_code == 404


def test_requestors_cannot_create_through_item_upsert(client):
    hk = _h(client, HK)
    response = client.put(f"{ITEMS}/REQ-ST-9999", json={"item": "Soap", "quantity": 1, "status": "Pending"}, headers=hk)
    assert response.status_code == 400
    assert response.json()["detail"]["code"] == "use_create_endpoint"


def test_requestor_cannot_approve_or_change_status(client):
    hk = _h(client, HK)
    request = _create(client, hk)
    upsert = client.put(f"{ITEMS}/{request['id']}", json={**request, "status": "Approved"}, headers=hk)
    assert upsert.status_code == 403
    decide = client.post(f"/api/v1/ops/stationery/requests/{request['id']}/decide", json={"decision": "approve"}, headers=hk)
    assert decide.status_code == 403
    assert _list(client, _h(client, STORE))[request["id"]]["status"] == "Pending"


def test_departments_are_isolated_for_read_edit_and_delete(client):
    hk, maint, store = _h(client, HK), _h(client, MAINT), _h(client, STORE)
    hk_req = _create(client, hk)
    maint_req = _create(client, maint, item="Fuse pack")

    assert set(_list(client, hk)) == {hk_req["id"]}
    assert set(_list(client, maint)) == {maint_req["id"]}
    assert set(_list(client, store)) == {hk_req["id"], maint_req["id"]}

    edit = client.put(f"{ITEMS}/{hk_req['id']}", json={**hk_req, "quantity": 99}, headers=maint)
    assert edit.status_code == 403
    remove = client.delete(f"{ITEMS}/{hk_req['id']}", headers=maint)
    assert remove.status_code == 403
    assert _list(client, store)[hk_req["id"]]["quantity"] == 3


def test_owner_can_edit_and_cancel_only_while_pending(client):
    hk, store = _h(client, HK), _h(client, STORE)
    request = _create(client, hk)

    edited = client.put(f"{ITEMS}/{request['id']}", json={**request, "quantity": 5, "department": "Canteen"}, headers=hk)
    assert edited.status_code == 200, edited.text
    assert edited.json()["quantity"] == 5
    assert edited.json()["department"] == "Housekeeping"

    approved = client.post(f"/api/v1/ops/stationery/requests/{request['id']}/decide", json={"decision": "approve"}, headers=store)
    assert approved.status_code == 200, approved.text
    locked = client.put(f"{ITEMS}/{request['id']}", json={**approved.json(), "quantity": 1}, headers=hk)
    assert locked.status_code == 409

    other = _create(client, hk, item="Mop")
    cancelled = client.put(f"{ITEMS}/{other['id']}", json={**other, "status": "Cancelled"}, headers=hk)
    assert cancelled.status_code == 200 and cancelled.json()["status"] == "Cancelled"


def test_store_cannot_change_status_through_upsert(client):
    hk, store = _h(client, HK), _h(client, STORE)
    request = _create(client, hk)
    response = client.put(f"{ITEMS}/{request['id']}", json={**request, "status": "Issued"}, headers=store)
    assert response.status_code == 409
    assert response.json()["detail"]["code"] == "use_decision_endpoint"


def test_store_cannot_issue_against_an_unapproved_request(client):
    hk, store = _h(client, HK), _h(client, STORE)
    _seed_inventory(client, store, qty=10)
    request = _create(client, hk, quantity=3)
    issue = {
        "activityType": "Issue",
        "clientRequestId": "IR-SEC-1",
        "requestedBy": "HK Manager",
        "department": "Housekeeping",
        "requestId": request["id"],
        "lines": [{"itemName": "Floor cleaner", "quantity": 3}],
    }
    blocked = client.post("/api/v1/ops/stationery/issue-return", json=issue, headers=store)
    assert blocked.status_code == 409 and blocked.json()["detail"]["code"] == "not_approved"
    inventory = client.get("/api/v1/ops/stationery-inventory", headers=store).json()
    assert inventory[0]["availableQuantity"] == 10

    client.post(f"/api/v1/ops/stationery/requests/{request['id']}/decide", json={"decision": "approve"}, headers=store)
    issued = client.post("/api/v1/ops/stationery/issue-return", json=issue, headers=store)
    assert issued.status_code == 200, issued.text
    assert _list(client, store)[request["id"]]["status"] == "Issued"
    inventory = client.get("/api/v1/ops/stationery-inventory", headers=store).json()
    assert inventory[0]["availableQuantity"] == 7


def test_deletes_are_persisted_and_owner_scoped(client):
    hk, store = _h(client, HK), _h(client, STORE)
    own = _create(client, hk)
    removed = client.delete(f"{ITEMS}/{own['id']}", headers=hk)
    assert removed.status_code == 200
    assert own["id"] not in _list(client, store)

    another = _create(client, hk, item="Mop")
    client.post(f"/api/v1/ops/stationery/requests/{another['id']}/decide", json={"decision": "approve"}, headers=store)
    too_late = client.delete(f"{ITEMS}/{another['id']}", headers=hk)
    assert too_late.status_code == 409
    by_store = client.delete(f"{ITEMS}/{another['id']}", headers=store)
    assert by_store.status_code == 200
    assert another["id"] not in _list(client, store)


def test_unrelated_roles_cannot_create_requests(client):
    teacher = _h(client, ("teacher@qmis.edu", "teacher123"))
    response = client.post(CREATE, json={"item": "Chalk", "quantity": 1}, headers=teacher)
    assert response.status_code == 403
