"""ASA-04 static guards: Super Admin Approvals — live activity API vs demo seeds."""

from pathlib import Path

SRC = Path(__file__).resolve().parents[2] / "src"


def _read(relative: str) -> str:
    return (SRC / relative).read_text(encoding="utf-8")


def test_asa04_activity_decisions_use_activities_approval_api():
    data = _read("Pages/SuperAdmin/Approvals/approvalsData.js")
    assert "decideApprovalRequestViaApi" in data
    assert "approveActivityViaApi" in data
    assert "includeDemoApprovalSeeds" in data
    assert "DEMO_APPROVAL_SEEDS_NOTICE" in data
    assert "persistedOnServer" in data
    # Demo decisions must be refused under normal API auth.
    assert "isApiAuthEnabled()" in data and "isDemoLoginEnabled()" in data

    view = _read("Pages/SuperAdmin/Approvals/ViewApproval.jsx")
    assert "decideApprovalRequestViaApi" in view
    assert "updateApprovalRequestStatus" not in view  # no direct local-only decide path
    assert "DEMO_APPROVAL_SEEDS_NOTICE" in view
    assert "Activity approved on the server" in view or "Activity ${status.toLowerCase()} on the server" in view


def test_asa04_list_hides_demo_categories_when_seeds_excluded():
    listing = _read("Pages/SuperAdmin/Approvals/ApprovalsList.jsx")
    data = _read("Pages/SuperAdmin/Approvals/approvalsData.js")
    assert "liveApprovalCategories" in listing
    # Category filtering lives in approvalsData (includeDemoApprovalSeeds gate).
    assert "includeDemoApprovalSeeds" in data
    assert "DEMO_APPROVAL_SEEDS_NOTICE" in data
    assert "liveApprovalCategories = ()" in data or "export const liveApprovalCategories" in data


def test_activities_api_exposes_approval_endpoint():
    api = _read("services/activitiesApi.js")
    assert "/approval`" in api or "/approval'" in api
    assert "approveActivityApi" in api
