"""Static guards for production-readiness fixes (no JS test runner in repo)."""

from pathlib import Path

SRC = Path(__file__).resolve().parents[2] / "src"


def _read(relative: str) -> str:
    return (SRC / relative).read_text(encoding="utf-8")


def test_canteen_add_order_persists_before_success_modal():
    source = _read("Pages/CanteenManager/Orders/AddOrder.jsx")
    assert "await saveOrders(" in source
    assert "hydrateOrdersFromApi" in source
    assert "setOrderModal(true)" in source
    # success modal only after a successful save
    save_idx = source.index("const saved = await saveOrders")
    modal_idx = source.index("setOrderModal(true)")
    assert save_idx < modal_idx
    assert "could not be saved" in source
    # must not open success on bare click
    assert "onClick={() => setOrderModal(true)}" not in source


def test_protrack_live_does_not_fall_back_to_first_device():
    source = _read("Common/Transport/useProtrackLive.js")
    assert "devicesList[0]" not in source
    assert "Never fall back to the first device" in source
    assert "byImei || byPlate || null" in source


def test_track_bus_map_labels_demo_as_not_live():
    map_source = _read("Pages/TransportManager/RouteData/Components/BusTrackingMap.jsx")
    assert "DEMO ROUTE — NOT LIVE GPS" in map_source
    assert "trackingMode" in map_source
    assert "LAST KNOWN — NOT LIVE" in map_source
    assert "+919999999999" not in map_source
    assert "No driver contact" in map_source
    assert "normalizeDialNumber" in map_source
    student = _read("Pages/Student/Transport/TrackBus.jsx")
    assert "live.devices[0]" not in student
    assert "last-known" in student
    assert "trackingMode={trackingMode}" in student
    tm_track = _read("Pages/TransportManager/RouteData/TrackBus.jsx")
    assert "last-known" in tm_track
    assert "|| 'Pickup'" not in tm_track
    assert "|| 'School'" not in tm_track


def test_route_data_cards_check_gps_freshness():
    source = _read("Pages/TransportManager/RouteData/RouteData.jsx")
    card = _read("Pages/TransportManager/RouteData/routeCardGps.js")
    assert "presentRouteCard" in source
    assert "imeisForTrackRequest" in source
    assert "No driver contact" in source
    assert "IMEI LINKED" not in source
    assert "7448907020" not in source
    assert "Browser Driver" not in source
    assert "erode" not in source
    assert "classifyTrackFreshness" in card
    assert "reason: 'none'" in card


def test_protrack_freshness_requires_600s():
    source = _read("services/protrackFreshness.js")
    assert "GPS_FRESH_MAX_AGE_SEC = 600" in source
    assert "state: 'fresh'" in source
    assert "state: 'stale'" in source
    assert "ageSec < 0" in source
    hook = _read("Common/Transport/useProtrackLive.js")
    assert "freshness.live === true && freshness.state === 'fresh'" in hook
    assert "lastKnownPosition" in hook
