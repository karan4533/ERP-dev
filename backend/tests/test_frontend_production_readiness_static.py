"""Production-readiness static guards remapped to ERP_QMIS after partner integration."""

from pathlib import Path

_ROOT = Path(__file__).resolve().parents[2]
_ERP = _ROOT / "ERP_QMIS" / "src"
_LEGACY = _ROOT / "src"
SRC = _ERP if _ERP.is_dir() else _LEGACY


def _read(relative: str) -> str:
    return (SRC / relative).read_text(encoding="utf-8")


def test_canteen_order_workspace_exists():
    page = _read("Common/operations/CanteenOrderWorkspace.jsx")
    assert "export default" in page or "function CanteenOrderWorkspace" in page


def test_bus_tracking_maps_label_demo_as_not_live_when_demo():
    student_map = _read("Pages/Student/Transport/Components/BusTrackingMap.jsx")
    tm_map = _read("Pages/TransportManager/RouteData/Components/BusTrackingMap.jsx")
    for source in (student_map, tm_map):
        assert (
            "DEMO" in source
            or "NOT LIVE" in source
            or "not live" in source.lower()
            or "demo" in source.lower()
        )


def test_transport_api_service_has_no_browser_storage():
    source = _read("services/api/transportApiService.js")
    assert "localStorage" not in source and "sessionStorage" not in source
