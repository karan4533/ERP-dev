"""Static guards for production-readiness fixes (no JS test runner in repo)."""

from pathlib import Path

SRC = Path(__file__).resolve().parents[2] / "src"


def _read(relative: str) -> str:
    return (SRC / relative).read_text(encoding="utf-8")


def test_canteen_add_order_persists_before_success_modal():
    source = _read("Pages/CanteenManager/Orders/AddOrder.jsx")
    orders_data = _read("Pages/CanteenManager/Orders/ordersData.js")
    assert "await saveOrders(" in source
    assert "hydrateOrdersFromApi" in source
    assert "setOrderModal(true)" in source
    # success modal only after a successful save
    save_idx = source.index("await saveOrders(")
    modal_idx = source.index("setOrderModal(true)")
    assert save_idx < modal_idx
    assert "could not be saved" in source
    # must not open success on bare click
    assert "onClick={() => setOrderModal(true)}" not in source
    # Durable write path must use persistCampusJson (confirmed API/local write).
    assert "persistCampusJson" in orders_data
    assert "success" in orders_data


def test_protrack_live_does_not_fall_back_to_first_device():
    source = _read("Common/Transport/useProtrackLive.js")
    assert "devicesList[0]" not in source
    assert "Never fall back to the first device" in source
    assert "byImei || byPlate || null" in source
    # Configured IMEI may still be polled even when not yet listed on /device/list.
    assert "chosen?.imei || wantImei" in source


def test_track_bus_map_labels_demo_as_not_live():
    map_source = _read("Pages/TransportManager/RouteData/Components/BusTrackingMap.jsx")
    assert "DEMO ROUTE — NOT LIVE GPS" in map_source
    assert "trackingMode" in map_source
    student = _read("Pages/Student/Transport/TrackBus.jsx")
    assert "live.devices[0]" not in student
    assert "trackingMode={hasLiveGps ? 'live' : 'demo'}" in student
