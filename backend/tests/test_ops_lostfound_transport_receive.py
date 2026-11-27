"""Lost & Found workflow, transport decision sync to driver requests, JD department-request inbox,
and the stationery procurement approval chain."""

import os

os.environ["DATABASE_URL"] = "sqlite+pysqlite:///:memory:"
os.environ["OTP_DEBUG"] = "true"
os.environ["JWT_SECRET"] = "test-secret-qmis-erp-lostfound-transport-receive"

from datetime import date, timedelta

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import select

from app.main import app
from tests.conftest import reset_sqlite_memory_schema

HK = ("housekeepingmanager@qmis.edu", "housekeeping123")
PRM = ("prm@qmis.edu", "prm12345")
PRINCIPAL = ("principal@qmis.edu", "principal123")
DIRECTOR = ("director@qmis.edu", "director123")
ADMIN = ("admin@qmis.edu", "admin123")
JD = ("jointdirector@qmis.edu", "jd12345678")
JDA = ("jointdirectorassistant@qmis.edu", "jda1234567")
TEACHER = ("teacher@qmis.edu", "teacher123")
TM = ("transportmanager@qmis.edu", "transport123")
DRIVER = ("driver@qmis.edu", "driver123")
IT = ("itsupportmanager@qmis.edu", "itsupport123")
CANTEEN = ("canteenmanager@qmis.edu", "canteen123")
STORE = ("stationerystoremanager@qmis.edu", "stationery123")
FINANCE = ("accounthead@qmis.edu", "accounts123")

LF = "/api/v1/ops/lost-found"


@pytest.fixture()
def client():
    reset_sqlite_memory_schema()
    with TestClient(app) as test_client:
        yield test_client


def _h(client, who):
    response = client.post("/api/v1/auth/login", json={"email": who[0], "password": who[1]})
    assert response.status_code == 200, response.text
    return {"Authorization": f"Bearer {response.json()['access_token']}"}


def _notifications(**filters):
    from app.core.database import SessionLocal
    from app.models import Notification

    with SessionLocal() as db:
        query = select(Notification)
        for key, value in filters.items():
            query = query.where(getattr(Notification, key) == value)
        return db.scalars(query).all()


def _user_id(email):
    from app.core.database import SessionLocal
    from app.models import User

    with SessionLocal() as db:
        return db.scalar(select(User.id).where(User.email == email))


# --------------------------------------------------------------------------- Lost & Found


def _found(**extra):
    return {
        "item": "Blue water bottle",
        "description": "Steel bottle with a sticker",
        "foundLocation": "Block A corridor",
        "foundDate": date.today().isoformat(),
        "foundBy": "Lakshmi (HK staff)",
        **extra,
    }


def test_lost_found_create_permissions_and_server_ids(client):
    hk, prm, admin = _h(client, HK), _h(client, PRM), _h(client, ADMIN)
    first = client.post(LF, json=_found(id="LF-HACK", status="Handed Over"), headers=hk)
    assert first.status_code == 201, first.text
    body = first.json()
    year = date.today().year
    assert body["id"] == f"LF-{year}-0001"
    assert body["status"] == "Found"
    assert body["recordedByEmail"] == HK[0]
    assert body["history"][0]["event"] == "Recorded"

    by_prm = client.post(LF, json=_found(item="Umbrella"), headers=prm)
    assert by_prm.status_code == 201, by_prm.text
    assert by_prm.json()["id"] == f"LF-{year}-0002"
    assert by_prm.json()["recordedByRole"] == "prm"
    assert client.post(LF, json=_found(item="Pen"), headers=admin).status_code == 201

    for who in (PRINCIPAL, JD, TEACHER, DRIVER):
        denied = client.post(LF, json=_found(), headers=_h(client, who))
        assert denied.status_code == 403, (who, denied.text)


def test_lost_found_read_access_and_permission_flags(client):
    hk = _h(client, HK)
    client.post(LF, json=_found(), headers=hk)
    for who, can_record, can_decide in (
        (HK, True, False),
        (PRM, True, False),
        (ADMIN, True, True),
        (PRINCIPAL, False, True),
        (DIRECTOR, False, True),
        (JD, False, False),
    ):
        response = client.get(LF, headers=_h(client, who))
        assert response.status_code == 200, (who, response.text)
        payload = response.json()
        assert len(payload["items"]) == 1
        assert payload["permissions"]["canRecord"] is can_record
        assert payload["permissions"]["canDecideDisposal"] is can_decide
    for who in (TEACHER, DRIVER, IT):
        assert client.get(LF, headers=_h(client, who)).status_code == 403


def test_lost_found_validation(client):
    hk = _h(client, HK)
    missing = client.post(LF, json={**_found(), "foundLocation": ""}, headers=hk)
    assert missing.status_code == 422
    future = (date.today() + timedelta(days=2)).isoformat()
    assert client.post(LF, json=_found(foundDate=future), headers=hk).status_code == 422
    assert client.post(LF, json=_found(foundDate="31-12-2026"), headers=hk).status_code == 422
    assert client.post(LF, json=_found(photoFileId="not-a-file"), headers=hk).status_code == 422


def test_lost_found_claim_and_handover_flow_with_history(client):
    hk, prm, principal = _h(client, HK), _h(client, PRM), _h(client, PRINCIPAL)
    item = client.post(LF, json=_found(), headers=hk).json()
    item_id = item["id"]

    early = client.post(f"{LF}/{item_id}/handover", json={"handedTo": "Ravi"}, headers=hk)
    assert early.status_code == 409

    no_proof = client.post(
        f"{LF}/{item_id}/claim", json={"claimantName": "Ravi", "claimantContact": "98400"}, headers=prm
    )
    assert no_proof.status_code == 422
    denied = client.post(
        f"{LF}/{item_id}/claim",
        json={"claimantName": "Ravi", "claimantContact": "98400", "proofNote": "Name label"},
        headers=principal,
    )
    assert denied.status_code == 403

    claimed = client.post(
        f"{LF}/{item_id}/claim",
        json={
            "claimantName": "Ravi Kumar",
            "claimantType": "Student",
            "claimantIdentity": "Grade 6B, Adm 1203",
            "claimantContact": "9840012345",
            "proofNote": "Described the sticker and name label inside the cap",
        },
        headers=prm,
    )
    assert claimed.status_code == 200, claimed.text
    assert claimed.json()["status"] == "Claimed"
    assert claimed.json()["claimRecordedByUserId"] == str(_user_id(PRM[0]))

    again = client.post(
        f"{LF}/{item_id}/claim",
        json={"claimantName": "X", "claimantContact": "1", "proofNote": "y"},
        headers=hk,
    )
    assert again.status_code == 409

    assert client.post(f"{LF}/{item_id}/handover", json={"handedTo": "Ravi"}, headers=principal).status_code == 403
    handed = client.post(
        f"{LF}/{item_id}/handover",
        json={"handedTo": "Ravi Kumar (student) with parent", "handoverNote": "ID checked"},
        headers=hk,
    )
    assert handed.status_code == 200, handed.text
    final = handed.json()
    assert final["status"] == "Handed Over"
    assert final["handedOverByEmail"] == HK[0]
    assert final["handedOverAt"]
    assert [entry["event"] for entry in final["history"]] == ["Recorded", "Claimed", "Handed Over"]
    assert [entry["toStatus"] for entry in final["history"]] == ["Found", "Claimed", "Handed Over"]
    assert final["history"][1]["byRole"] == "prm"

    after = client.post(f"{LF}/{item_id}/disposal-request", json={"reason": "old"}, headers=hk)
    assert after.status_code == 409


def test_lost_found_disposal_needs_independent_approval(client):
    hk, principal, admin = _h(client, HK), _h(client, PRINCIPAL), _h(client, ADMIN)
    item_id = client.post(LF, json=_found(), headers=hk).json()["id"]

    assert client.post(f"{LF}/{item_id}/disposal-request", json={"reason": ""}, headers=hk).status_code == 422
    assert client.post(f"{LF}/{item_id}/disposal-request", json={"reason": "x"}, headers=principal).status_code == 403
    requested = client.post(
        f"{LF}/{item_id}/disposal-request", json={"reason": "Unclaimed for 90 days"}, headers=hk
    )
    assert requested.status_code == 200, requested.text
    assert requested.json()["status"] == "Disposal Requested"
    assert _notifications(role_code="principal", entity_type="lost_found", entity_id=item_id)

    assert client.post(f"{LF}/{item_id}/disposal-decision", json={"decision": "approve"}, headers=hk).status_code == 403
    assert client.post(f"{LF}/{item_id}/disposal-decision", json={"decision": "reject"}, headers=principal).status_code == 422
    approved = client.post(
        f"{LF}/{item_id}/disposal-decision", json={"decision": "approve", "remark": "Donate"}, headers=principal
    )
    assert approved.status_code == 200, approved.text
    assert approved.json()["status"] == "Disposed"
    assert approved.json()["disposalDecidedByUserId"] == str(_user_id(PRINCIPAL[0]))
    assert _notifications(user_id=_user_id(HK[0]), entity_id=item_id)

    # Admin requests disposal: admin cannot approve their own request; refusal returns the item to Found.
    other = client.post(LF, json=_found(item="Cap"), headers=admin).json()["id"]
    client.post(f"{LF}/{other}/disposal-request", json={"reason": "Torn"}, headers=admin)
    own = client.post(f"{LF}/{other}/disposal-decision", json={"decision": "approve"}, headers=admin)
    assert own.status_code == 403 and own.json()["detail"]["code"] == "self_approval"
    refused = client.post(
        f"{LF}/{other}/disposal-decision", json={"decision": "reject", "remark": "Keep a month more"}, headers=principal
    )
    assert refused.status_code == 200 and refused.json()["status"] == "Found"
    assert [entry["event"] for entry in refused.json()["history"]][-1] == "Disposal Refused"


def test_lost_found_generic_ops_writes_are_blocked(client):
    hk = _h(client, HK)
    item = client.post(LF, json=_found(), headers=hk).json()
    replace = client.put("/api/v1/ops/hk-lost-found", json=[{**item, "status": "Handed Over", "history": []}], headers=hk)
    assert replace.status_code == 400
    assert replace.json()["detail"]["code"] == "use_lost_found_endpoint"
    upsert = client.put(f"/api/v1/ops/hk-lost-found/items/{item['id']}", json={**item, "history": []}, headers=hk)
    assert upsert.status_code == 400
    assert client.delete(f"/api/v1/ops/hk-lost-found/items/{item['id']}", headers=hk).status_code == 400
    listed = client.get(LF, headers=hk).json()["items"]
    assert listed[0]["status"] == "Found" and len(listed[0]["history"]) == 1


# --------------------------------------------------------------------------- Transport decisions


def _seed_driver(client, tm):
    saved = client.put(
        "/api/v1/ops/transport-drivers",
        json=[{"id": "TDR-1", "email": DRIVER[0], "vehicleNumber": "TN 01 AB 1234", "routeAssigned": "Route 1"}],
        headers=tm,
    )
    assert saved.status_code == 200, saved.text


def _driver_fuel_request(client, driver, request_id="FR-0001"):
    fuel = client.put(
        "/api/v1/ops/transport-driver-fuel",
        json=[{
            "id": request_id,
            "fuelRequestId": request_id,
            "driverEmail": DRIVER[0],
            "vehicleNumber": "TN 01 AB 1234",
            "assignedRoute": "Route 1",
            "requestedQuantity": "60 L",
            "approvalStatus": "Approved",
        }],
        headers=driver,
    )
    assert fuel.status_code == 200, fuel.text
    approval = client.put(
        "/api/v1/ops/transport-approval-requests",
        json=[{
            "id": request_id,
            "requestId": request_id,
            "vehicleNumber": "TN 01 AB 1234",
            "issueType": "Fuel Request",
            "source": "driver-panel",
            "status": "Approved",
        }],
        headers=driver,
    )
    assert approval.status_code == 200, approval.text
    return fuel.json()[0], approval.json()[0]


def _decide(client, headers, request_id, decision, remark=""):
    return client.post(
        f"/api/v1/ops/transport-approval-requests/{request_id}/decide",
        json={"decision": decision, "remark": remark},
        headers=headers,
    )


def _driver_row(client, headers, collection, request_id):
    rows = client.get(f"/api/v1/ops/{collection}", headers=headers).json()
    return next(row for row in rows if row["id"] == request_id)


def test_driver_cannot_self_approve_and_new_requests_start_pending(client):
    tm, driver = _h(client, TM), _h(client, DRIVER)
    _seed_driver(client, tm)
    fuel, approval = _driver_fuel_request(client, driver)
    assert fuel["approvalStatus"] == "Pending"
    assert approval["status"] == "Pending"
    assert _decide(client, driver, "FR-0001", "approve").status_code == 403


def test_principal_final_decision_syncs_driver_fuel_request(client):
    tm, driver, principal = _h(client, TM), _h(client, DRIVER), _h(client, PRINCIPAL)
    _seed_driver(client, tm)
    _driver_fuel_request(client, driver)

    assert _decide(client, principal, "FR-0001", "approve").status_code == 403  # TM decides first
    first = _decide(client, tm, "FR-0001", "approve", "Fuel log checked")
    assert first.status_code == 200, first.text
    assert first.json()["status"] == "Awaiting Principal"
    assert first.json()["linkedDriverRequestId"] == "FR-0001"
    mid = _driver_row(client, driver, "transport-driver-fuel", "FR-0001")
    assert mid["approvalStatus"] == "Pending" and mid["workflowStatus"] == "Awaiting Principal"
    assert _notifications(role_code="principal", entity_id="FR-0001")

    assert _decide(client, tm, "FR-0001", "approve").status_code == 403  # final is Principal's
    final = _decide(client, principal, "FR-0001", "approve", "Approved for route")
    assert final.status_code == 200, final.text
    assert final.json()["status"] == "Approved"
    assert final.json()["principalDecidedBy"] == PRINCIPAL[0]

    synced = _driver_row(client, driver, "transport-driver-fuel", "FR-0001")
    assert synced["approvalStatus"] == "Approved"
    assert synced["workflowStatus"] == "Approved"
    assert synced["decidedBy"] == PRINCIPAL[0]
    assert synced["decidedByRole"] == "principal"
    assert synced["decidedAt"]
    assert [entry["toStatus"] for entry in synced["decisionHistory"]] == ["Awaiting Principal", "Approved"]
    assert _notifications(user_id=_user_id(DRIVER[0]), entity_id="FR-0001")
    assert _decide(client, principal, "FR-0001", "reject", "late").status_code == 409

    # A stale driver re-save cannot reset the decision on either collection.
    client.put(
        "/api/v1/ops/transport-driver-fuel",
        json=[{**{k: v for k, v in synced.items() if not k.startswith("_")}, "approvalStatus": "Pending"}],
        headers=driver,
    )
    client.put(
        "/api/v1/ops/transport-approval-requests",
        json=[{"id": "FR-0001", "requestId": "FR-0001", "vehicleNumber": "TN 01 AB 1234", "status": "Pending"}],
        headers=driver,
    )
    assert _driver_row(client, driver, "transport-driver-fuel", "FR-0001")["approvalStatus"] == "Approved"
    approvals = client.get("/api/v1/ops/transport-approval-requests", headers=tm).json()
    assert approvals[0]["status"] == "Approved"


def test_principal_rejection_syncs_driver_maintenance_request(client):
    tm, driver, principal = _h(client, TM), _h(client, DRIVER), _h(client, PRINCIPAL)
    _seed_driver(client, tm)
    client.put(
        "/api/v1/ops/transport-driver-maintenance",
        json=[{"id": "MR-2001", "requestId": "MR-2001", "driverEmail": DRIVER[0],
               "vehicleNumber": "TN 01 AB 1234", "issueCategory": "Brake Failure", "requestStatus": "Pending"}],
        headers=driver,
    )
    client.put(
        "/api/v1/ops/transport-approval-requests",
        json=[{"id": "MR-2001", "requestId": "MR-2001", "vehicleNumber": "TN 01 AB 1234",
               "source": "driver-panel", "status": "Pending"}],
        headers=driver,
    )
    assert _decide(client, tm, "MR-2001", "approve").status_code == 200
    assert _driver_row(client, driver, "transport-driver-maintenance", "MR-2001")["requestStatus"] == "In Progress"
    assert _decide(client, principal, "MR-2001", "reject").status_code == 422  # remark required
    rejected = _decide(client, principal, "MR-2001", "reject", "Use the quarterly service slot")
    assert rejected.status_code == 200, rejected.text
    row = _driver_row(client, driver, "transport-driver-maintenance", "MR-2001")
    assert row["requestStatus"] == "Rejected"
    assert row["decisionRemark"] == "Use the quarterly service slot"
    assert row["decidedBy"] == PRINCIPAL[0]


def test_same_person_cannot_give_both_transport_decisions(client):
    tm, driver, admin = _h(client, TM), _h(client, DRIVER), _h(client, ADMIN)
    _seed_driver(client, tm)
    _driver_fuel_request(client, driver)
    assert _decide(client, admin, "FR-0001", "approve").status_code == 200
    own = _decide(client, admin, "FR-0001", "approve")
    assert own.status_code == 403 and own.json()["detail"]["code"] == "self_approval"
    assert _decide(client, _h(client, DIRECTOR), "FR-0001", "approve").status_code == 200


def test_list_save_status_change_syncs_driver_and_final_is_principal_only(client):
    tm, driver = _h(client, TM), _h(client, DRIVER)
    _seed_driver(client, tm)
    _driver_fuel_request(client, driver)
    rows = client.get("/api/v1/ops/transport-approval-requests", headers=tm).json()
    base = {k: v for k, v in rows[0].items() if not k.startswith("_")}

    skip = client.put("/api/v1/ops/transport-approval-requests", json=[{**base, "status": "Approved"}], headers=tm)
    assert skip.status_code == 403
    rejected = client.put(
        "/api/v1/ops/transport-approval-requests",
        json=[{**base, "status": "Rejected", "decisionRemark": "Duplicate"}],
        headers=tm,
    )
    assert rejected.status_code == 200, rejected.text
    synced = _driver_row(client, driver, "transport-driver-fuel", "FR-0001")
    assert synced["approvalStatus"] == "Rejected" and synced["decidedBy"] == TM[0]


# --------------------------------------------------------------------------- JD department requests

INBOX = "/api/v1/ops/department-requests"


def _raise_it_request(client, it, request_id="REQ-IT-2026-001", **extra):
    saved = client.put(
        "/api/v1/ops/it-requests",
        json=[{"id": request_id, "requestId": request_id, "title": "Lab laptops", "amount": "₹4,20,000",
               "status": "Approved", "sentTo": "JD", "currentStage": "JD", **extra}],
        headers=it,
    )
    assert saved.status_code == 200, saved.text
    return saved.json()[0]


def _decide_dept(client, headers, collection, request_id, decision, remark=""):
    return client.post(
        f"{INBOX}/{collection}/{request_id}/decide",
        json={"decision": decision, "remark": remark},
        headers=headers,
    )


def test_department_requests_start_pending_and_reach_jd_inbox(client):
    it, jd = _h(client, IT), _h(client, JD)
    raised = _raise_it_request(client, it)
    assert raised["status"] == "Pending"
    assert raised["raisedByEmail"] == IT[0]
    client.put(
        "/api/v1/ops/canteen-requests",
        json=[{"id": "REQ-CN-1", "requestId": "REQ-CN-1", "title": "Rice restock", "status": "Pending"}],
        headers=_h(client, CANTEEN),
    )
    inbox = client.get(INBOX, headers=jd)
    assert inbox.status_code == 200, inbox.text
    payload = inbox.json()
    assert payload["canDecide"] is True
    by_id = {row["id"]: row for row in payload["items"]}
    assert by_id["REQ-IT-2026-001"]["collection"] == "it-requests"
    assert by_id["REQ-IT-2026-001"]["department"] == "IT Support"
    assert by_id["REQ-IT-2026-001"]["decidable"] is True
    assert by_id["REQ-CN-1"]["department"] == "Canteen"

    jda = client.get(INBOX, headers=_h(client, JDA))
    assert jda.status_code == 200 and jda.json()["canDecide"] is False
    for who in (HK, IT, PRINCIPAL, TEACHER):
        assert client.get(INBOX, headers=_h(client, who)).status_code == 403


def test_jd_decides_with_remark_identity_and_notifies_raiser(client):
    it, jd = _h(client, IT), _h(client, JD)
    _raise_it_request(client, it)
    for who in (IT, CANTEEN, JDA, PRINCIPAL):
        denied = _decide_dept(client, _h(client, who), "it-requests", "REQ-IT-2026-001", "approve", "ok")
        assert denied.status_code == 403, (who, denied.text)
    assert _decide_dept(client, jd, "it-requests", "REQ-IT-2026-001", "reject").status_code == 422
    assert _decide_dept(client, jd, "maint-requests", "X", "approve").status_code == 404

    approved = _decide_dept(client, jd, "it-requests", "REQ-IT-2026-001", "approve", "Within budget")
    assert approved.status_code == 200, approved.text
    body = approved.json()
    assert body["status"] == "Approved"
    assert body["decidedBy"] == JD[0]
    assert body["decidedByRole"] == "jointdirector"
    assert body["decisionRemark"] == "Within budget"
    assert body["decidedAt"]
    assert body["decisionHistory"][0]["fromStatus"] == "Pending"
    assert _notifications(user_id=_user_id(IT[0]), entity_type="department_request", entity_id="REQ-IT-2026-001")
    assert _decide_dept(client, jd, "it-requests", "REQ-IT-2026-001", "reject", "late").status_code == 409

    # The IT manager's stale re-save and list drop cannot undo or erase the JD decision.
    resave = client.put(
        "/api/v1/ops/it-requests",
        json=[{"id": "REQ-IT-2026-001", "requestId": "REQ-IT-2026-001", "title": "Edited", "status": "Pending"}],
        headers=it,
    )
    assert resave.status_code == 200
    assert resave.json()[0]["status"] == "Approved" and resave.json()[0]["decidedBy"] == JD[0]
    dropped = client.put("/api/v1/ops/it-requests", json=[], headers=it)
    assert [row["id"] for row in dropped.json()] == ["REQ-IT-2026-001"]
    assert client.put("/api/v1/ops/it-requests", json=[], headers=jd).status_code == 403


def test_hk_request_rejection_and_no_self_approval(client):
    hk, jd, admin = _h(client, HK), _h(client, JD), _h(client, ADMIN)
    client.put(
        "/api/v1/ops/hk-requests",
        json=[{"id": "REQ-HK-1", "requestId": "REQ-HK-1", "title": "Mops", "sentTo": "JD Operations"}],
        headers=hk,
    )
    rejected = _decide_dept(client, jd, "hk-requests", "REQ-HK-1", "reject", "Use existing stock")
    assert rejected.status_code == 200 and rejected.json()["status"] == "Rejected"
    assert _notifications(user_id=_user_id(HK[0]), entity_id="REQ-HK-1")

    client.put(
        "/api/v1/ops/hk-requests",
        json=[{"id": "REQ-HK-2", "requestId": "REQ-HK-2", "title": "Gloves"}],
        headers=admin,
    )
    own = _decide_dept(client, admin, "hk-requests", "REQ-HK-2", "approve", "ok")
    assert own.status_code == 403 and own.json()["detail"]["code"] == "self_approval"
    assert _decide_dept(client, jd, "hk-requests", "REQ-HK-2", "approve", "ok").status_code == 200


def test_hk_and_canteen_create_reach_jd_inbox_and_persist_after_reread(client):
    """Housekeeping and Canteen managers can raise requests; JD lists/decides; others get 403; re-read keeps them."""
    hk, canteen, jd = _h(client, HK), _h(client, CANTEEN), _h(client, JD)

    hk_saved = client.put(
        "/api/v1/ops/hk-requests",
        json=[{
            "id": "REQ-HK-2026-100",
            "requestId": "REQ-HK-2026-100",
            "title": "Floor cleaner restock",
            "requestType": "Stock Replenishment",
            "priority": "High",
            "sentTo": "JD Operations",
            "status": "Approved",
            "amount": "₹9,500",
        }],
        headers=hk,
    )
    assert hk_saved.status_code == 200, hk_saved.text
    hk_row = hk_saved.json()[0]
    assert hk_row["status"] == "Pending"
    assert hk_row["raisedByEmail"] == HK[0]
    assert hk_row["requestId"] == "REQ-HK-2026-100"

    cn_saved = client.put(
        "/api/v1/ops/canteen-requests",
        json=[{
            "id": "REQ-CN-2026-100",
            "requestId": "REQ-CN-2026-100",
            "title": "Rice and dal procurement",
            "requestType": "Stock",
            "priority": "Medium",
            "sentTo": "Operations Head",
            "status": "Approved",
            "requestedAmount": "₹45,000",
        }],
        headers=canteen,
    )
    assert cn_saved.status_code == 200, cn_saved.text
    cn_row = cn_saved.json()[0]
    assert cn_row["status"] == "Pending"
    assert cn_row["raisedByEmail"] == CANTEEN[0]

    # Unauthorized roles cannot create into another department's collection or open the JD inbox.
    assert client.put(
        "/api/v1/ops/hk-requests",
        json=[{"id": "REQ-HK-X", "requestId": "REQ-HK-X", "title": "Nope"}],
        headers=canteen,
    ).status_code == 403
    assert client.put(
        "/api/v1/ops/canteen-requests",
        json=[{"id": "REQ-CN-X", "requestId": "REQ-CN-X", "title": "Nope"}],
        headers=hk,
    ).status_code == 403
    for who in (HK, CANTEEN, IT, TEACHER, PRINCIPAL):
        assert client.get(INBOX, headers=_h(client, who)).status_code == 403
        assert _decide_dept(client, _h(client, who), "hk-requests", "REQ-HK-2026-100", "approve", "ok").status_code == 403

    inbox = client.get(INBOX, headers=jd)
    assert inbox.status_code == 200, inbox.text
    by_id = {row["id"]: row for row in inbox.json()["items"]}
    assert by_id["REQ-HK-2026-100"]["collection"] == "hk-requests"
    assert by_id["REQ-HK-2026-100"]["department"] == "Housekeeping"
    assert by_id["REQ-HK-2026-100"]["decidable"] is True
    assert by_id["REQ-CN-2026-100"]["collection"] == "canteen-requests"
    assert by_id["REQ-CN-2026-100"]["department"] == "Canteen"

    approved = _decide_dept(client, jd, "hk-requests", "REQ-HK-2026-100", "approve", "Stock needed")
    assert approved.status_code == 200, approved.text
    assert approved.json()["status"] == "Approved"
    assert approved.json()["decidedBy"] == JD[0]
    assert _notifications(user_id=_user_id(HK[0]), entity_type="department_request", entity_id="REQ-HK-2026-100")

    rejected = _decide_dept(client, jd, "canteen-requests", "REQ-CN-2026-100", "reject", "Defer to next month")
    assert rejected.status_code == 200, rejected.text
    assert rejected.json()["status"] == "Rejected"
    assert _notifications(user_id=_user_id(CANTEEN[0]), entity_type="department_request", entity_id="REQ-CN-2026-100")

    # Persistence after re-read from each department collection and the JD inbox.
    hk_reread = client.get("/api/v1/ops/hk-requests", headers=hk)
    assert hk_reread.status_code == 200
    hk_again = {row["id"]: row for row in hk_reread.json()}["REQ-HK-2026-100"]
    assert hk_again["status"] == "Approved" and hk_again["decidedBy"] == JD[0]
    assert hk_again["decisionRemark"] == "Stock needed"

    cn_reread = client.get("/api/v1/ops/canteen-requests", headers=canteen)
    assert cn_reread.status_code == 200
    cn_again = {row["id"]: row for row in cn_reread.json()}["REQ-CN-2026-100"]
    assert cn_again["status"] == "Rejected" and cn_again["decisionRemark"] == "Defer to next month"

    inbox_again = {row["id"]: row for row in client.get(INBOX, headers=jd).json()["items"]}
    assert inbox_again["REQ-HK-2026-100"]["decidable"] is False
    assert inbox_again["REQ-CN-2026-100"]["status"] == "Rejected"


# --------------------------------------------------------------------------- Stationery procurement chain

PROC = "/api/v1/ops/stationery-procurement"


def _proc_decide(client, headers, proc_id, action):
    return client.post(
        f"/api/v1/ops/stationery/procurement/{proc_id}/decide", json={"action": action}, headers=headers
    )


def _seed_pen_stock(client, store):
    client.put(
        "/api/v1/ops/stationery-inventory",
        json=[{"id": "STN-P-1", "itemId": "STN-P-1", "itemName": "Pen", "availableQuantity": 2, "reorderLevel": 1}],
        headers=store,
    )


def test_procurement_list_save_cannot_skip_or_rewrite_approvals(client):
    store = _h(client, STORE)
    bad = client.put(PROC, json=[{"id": "PO-X", "title": "Paper", "status": "PO_APPROVED"}], headers=store)
    assert bad.status_code == 422
    created = client.put(PROC, json=[{"id": "PO-1", "title": "Paper", "status": "QUOTATION_PENDING"}], headers=store)
    assert created.status_code == 200, created.text
    assert created.json()[0]["createdByEmail"] == STORE[0]
    rewrite = client.put(
        PROC,
        json=[{"id": "PO-1", "title": "Paper A4", "status": "PO_APPROVED", "budgetApproved": True}],
        headers=store,
    )
    assert rewrite.status_code == 200
    row = rewrite.json()[0]
    assert row["title"] == "Paper A4"
    assert row["status"] == "QUOTATION_PENDING" and "budgetApproved" not in row


def test_procurement_full_chain_roles_and_goods_receipt(client):
    store, jd, finance = _h(client, STORE), _h(client, JD), _h(client, FINANCE)
    _seed_pen_stock(client, store)
    client.put(PROC, json=[{"id": "PO-2", "title": "Pen", "minorPurchase": True}], headers=store)
    assert _proc_decide(client, store, "PO-2", "advance").json()["status"] == "DEPARTMENT_REVIEW"
    assert _proc_decide(client, finance, "PO-2", "approve_budget").status_code == 409  # JD first
    assert _proc_decide(client, jd, "PO-2", "approve").json()["status"] == "MINOR_APPROVED"
    assert _proc_decide(client, store, "PO-2", "approve_budget").status_code == 403
    assert _proc_decide(client, finance, "PO-2", "approve_budget").json()["status"] == "PO_REQUIRED"
    raised = _proc_decide(client, store, "PO-2", "advance").json()
    assert raised["status"] == "PO_RAISED" and raised["poRaisedByUserId"] == str(_user_id(STORE[0]))

    # Store cannot approve its own PO (neither by advance nor mark_po_approved) or receive before approval.
    assert _proc_decide(client, store, "PO-2", "advance").status_code == 409
    assert _proc_decide(client, store, "PO-2", "mark_po_approved").status_code == 403
    early = client.post(
        "/api/v1/ops/stationery/procurement/PO-2/receive-goods",
        json={"grnId": "GRN-2", "itemName": "Pen", "quantity": 5},
        headers=store,
    )
    assert early.status_code == 409
    assert _proc_decide(client, store, "PO-2", "complete").status_code == 409
    assert _proc_decide(client, finance, "PO-2", "mark_po_approved").json()["status"] == "PO_APPROVED"
    assert _proc_decide(client, store, "PO-2", "complete").status_code == 409  # GRN first

    assert client.post(
        "/api/v1/ops/stationery/procurement/PO-2/receive-goods",
        json={"grnId": "GRN-2", "itemName": "Pen", "quantity": 5},
        headers=jd,
    ).status_code == 403
    received = client.post(
        "/api/v1/ops/stationery/procurement/PO-2/receive-goods",
        json={"grnId": "GRN-2", "itemName": "Pen", "quantity": 5},
        headers=store,
    )
    assert received.status_code == 200, received.text
    assert received.json()["procurement"]["status"] == "COMPLETED"
    assert received.json()["procurement"]["grnReceivedBy"] == STORE[0]
    stock = client.get("/api/v1/ops/stationery-inventory", headers=store).json()
    assert stock[0]["availableQuantity"] == 7
    history = [entry["toStatus"] for entry in received.json()["procurement"]["decisionHistory"]]
    assert history == ["DEPARTMENT_REVIEW", "MINOR_APPROVED", "PO_REQUIRED", "PO_RAISED", "PO_APPROVED"]

    # A store whole-list save cannot drop a decided purchase.
    assert [row["id"] for row in client.put(PROC, json=[], headers=store).json()] == ["PO-2"]


def test_procurement_no_self_approval_across_jd_and_finance(client):
    store, admin, finance = _h(client, STORE), _h(client, ADMIN), _h(client, FINANCE)
    client.put(PROC, json=[{"id": "PO-3", "title": "Files", "minorPurchase": True}], headers=admin)
    _proc_decide(client, admin, "PO-3", "advance")
    own = _proc_decide(client, admin, "PO-3", "approve")
    assert own.status_code == 403 and own.json()["detail"]["code"] == "self_approval"

    client.put(PROC, json=[{"id": "PO-4", "title": "Folders", "minorPurchase": True}], headers=store)
    _proc_decide(client, store, "PO-4", "advance")
    assert _proc_decide(client, admin, "PO-4", "approve").status_code == 200
    twice = _proc_decide(client, admin, "PO-4", "approve_budget")
    assert twice.status_code == 403 and twice.json()["detail"]["code"] == "self_approval"
    assert _proc_decide(client, finance, "PO-4", "approve_budget").status_code == 200
