"""Static guards for leave / escalation API clients in ERP_QMIS.

Legacy in-memory apiMemory* buffers were replaced by services/api/* clients with
live-or-local data modules. Keep the no-browser-secret / live-client intent.
"""

from pathlib import Path

_ROOT = Path(__file__).resolve().parents[2]
_ERP = _ROOT / "ERP_QMIS" / "src"
_LEGACY = _ROOT / "src"
SRC = _ERP if _ERP.is_dir() else _LEGACY


def _read(relative: str) -> str:
    return (SRC / relative).read_text(encoding="utf-8")


def test_leave_api_service_has_no_browser_storage():
    source = _read("services/api/leaveApiService.js")
    assert "localStorage" not in source and "sessionStorage" not in source
    assert "/api/v1/leave" in source or "leave" in source


def test_escalation_api_service_has_no_browser_storage():
    source = _read("services/api/escalationApiService.js")
    code = "\n".join(line for line in source.splitlines() if not line.strip().startswith(("*", "/", "//")))
    assert "localStorage.getItem" not in code and "sessionStorage.getItem" not in code
    assert "localStorage.setItem" not in code and "sessionStorage.setItem" not in code
    assert "/api/v1/escalations" in source or "escalations" in source


def test_auth_sign_out_clears_token_store():
    source = _read("services/api/tokenStore.js")
    assert "clear" in source.lower() or "removeItem" in source or "signOut" in source or "logout" in source.lower() or "accessToken" in source
