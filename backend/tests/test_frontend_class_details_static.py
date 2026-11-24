"""Static guards for Class Details masters client in ERP_QMIS.

Legacy services/classDetailsApi.js → services/api/classDetailsApiService.js.
"""

from pathlib import Path

_ROOT = Path(__file__).resolve().parents[2]
_ERP = _ROOT / "ERP_QMIS" / "src"
_LEGACY = _ROOT / "src"
SRC = _ERP if _ERP.is_dir() else _LEGACY


def _read(relative: str) -> str:
    return (SRC / relative).read_text(encoding="utf-8")


def test_service_uses_masters_routes_and_never_touches_storage():
    source = _read("services/api/classDetailsApiService.js")
    assert "localStorage" not in source and "sessionStorage" not in source
    assert "/masters/" in source
    assert "canUseClassDetailsApi" in source
    assert "loadClassDirectory" in source


def test_flag_defaults_to_live_auth_token_gate():
    source = _read("services/api/classDetailsApiService.js")
    assert "isLiveApiEnabled" in source
    assert "getAccessToken" in source


def test_list_page_uses_class_details_api_service():
    page = _read("Pages/Admin/Class/ClassDetails/ClassDetails.jsx")
    assert "classDetailsApiService" in page or "loadClassDirectory" in page or "canUseClassDetailsApi" in page
