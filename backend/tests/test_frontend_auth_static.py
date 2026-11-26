"""Static guards that the frontend authenticates against the real FastAPI backend.

These read the React sources under ERP_QMIS (the active UI for local integration).
They prove the live-auth code paths exist; runtime behaviour is covered by HTTP + browser checks.
"""

import re
from pathlib import Path

from app.core.config import settings

ROOT = Path(__file__).resolve().parents[2]
# Active UI for local integration (Phase 2). Fall back to repo-root src only if missing.
ERP_QMIS_SRC = ROOT / "ERP_QMIS" / "src"
LEGACY_SRC = ROOT / "src"
SRC = ERP_QMIS_SRC if ERP_QMIS_SRC.is_dir() else LEGACY_SRC


def _source_files():
    return [p for p in SRC.rglob("*") if p.suffix in {".js", ".jsx"} and "node_modules" not in p.parts]


def _read(relative: str) -> str:
    return (SRC / relative).read_text(encoding="utf-8")


def test_sources_exist():
    assert (SRC / "services" / "api" / "authService.js").exists()
    assert (SRC / "services" / "api" / "apiClient.js").exists()
    assert (SRC / "services" / "api" / "tokenStore.js").exists()
    assert (SRC / "context" / "AuthContext.jsx").exists()
    assert len(_source_files()) > 100


def test_no_seeded_api_passwords_outside_signin_helpers():
    """Seed passwords may appear only in SignIn / authService seed directory helpers."""
    seeded = {
        value
        for name, value in settings.model_dump().items()
        if name.endswith("_seed_password") and value
    }
    assert len(seeded) >= 6
    allowed_names = {
        "SignIn.jsx",
        "authService.js",  # BACKEND_SEED_DIRECTORY for local-dev fill only
    }
    offenders = []
    for path in _source_files():
        if path.name in allowed_names:
            continue
        text = path.read_text(encoding="utf-8", errors="ignore")
        for password in seeded:
            if re.search(r"['\"`]" + re.escape(password) + r"['\"`]", text):
                offenders.append(f"{path.relative_to(SRC)} contains a seeded password")
    assert offenders == []


def test_shared_demo_password_literal_is_gone_from_auth_core():
    auth = _read("context/AuthContext.jsx")
    assert not re.search(r"Qmis@20\d\d", auth)
    assert "DEMO_PASSWORD" not in auth


def test_live_login_goes_through_backend_auth_service():
    auth = _read("context/AuthContext.jsx")
    assert "loginWithBackend" in auth
    assert "isLiveApiEnabled" in auth
    assert "findUserByIdentifier" in auth  # offline mock path only when live disabled
    # Live branch must call backend before any local directory resolution.
    live_idx = auth.index("if (isLiveApiEnabled())")
    find_idx = auth.index("findUserByIdentifier", live_idx)
    # There should be a live return before the offline findUser path is reached in that branch.
    assert "loginWithBackend" in auth[live_idx:find_idx]


def test_token_store_and_client_attach_bearer():
    client = _read("services/api/apiClient.js")
    token = _read("services/api/tokenStore.js")
    assert "getAccessToken" in client
    assert "Authorization" in client
    assert "Bearer" in client
    assert "clearAccessToken" in client
    assert "VITE_USE_MOCK" in client
    assert "schoolerp_access_token" in token


def test_sign_in_awaits_login_and_does_not_bypass_api_in_live_mode():
    text = _read("Pages/Authentication/SignIn.jsx")
    assert "await login(" in text
    assert "BACKEND_SEED_DIRECTORY" in text
    assert "isLiveApiEnabled" in text
    # Password starts empty.
    assert re.search(r"const \[password,\s*setPassword\]\s*=\s*useState\(['\"]['\"]\)", text)


def test_api_login_failure_never_falls_back_to_local_accounts_when_live():
    text = _read("context/AuthContext.jsx")
    # Live branch returns backend failure without calling findUserByIdentifier.
    live_block_start = text.index("if (isLiveApiEnabled()) {")
    live_block = text[live_block_start : text.index("if (String(password).trim().length < 4)")]
    assert "loginWithBackend" in live_block
    assert "findUserByIdentifier" not in live_block
    assert "return result" in live_block or "if (!result.success)" in live_block


def test_session_bootstrap_verifies_token_with_me():
    text = _read("context/AuthContext.jsx")
    assert "fetchCurrentUser" in text
    assert "getAccessToken" in text
    assert "qmis:auth-expired" in text
    client = _read("services/api/apiClient.js")
    assert "qmis:auth-expired" in client


def test_logout_calls_backend_when_live():
    text = _read("context/AuthContext.jsx")
    assert "logoutFromBackend" in text
