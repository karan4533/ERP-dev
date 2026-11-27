"""Static checks that CCTV Room portal wiring stays intact."""

from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]


def _read(*parts: str) -> str:
    return (ROOT.joinpath(*parts)).read_text(encoding="utf-8")


def test_cctv_role_constant_and_home_path():
    roles = _read("src", "constants", "roles.js")
    auth = _read("src", "context", "AuthContext.jsx")
    assert "CCTV: 'cctv'" in roles
    assert "[ROLES.CCTV]: '/cctv-room/dashboard'" in auth
    assert "[ROLES.CCTV]: { email: 'cctv@qmis.edu' }" in auth


def test_cctv_app_layout_guard():
    app = _read("src", "App.jsx")
    assert 'import("./Layout/CctvRoomLayout")' in app
    assert "ROLES.CCTV" in app
    assert 'pathname.startsWith("/cctv-room")' in app


def test_cctv_sidebar_titles():
    sidebar = _read("src", "Common", "CommonSidebar", "Components", "sidebarLinks.js")
    for title in (
        "Dashboard",
        "Live Monitoring",
        "Camera Management",
        "Daily Camera Status",
        "Footage Requests",
        "Recording & Playback",
        "School Locations",
        "Security Reports",
        "Access Logs",
        "Settings",
    ):
        assert f'title: "{title}"' in sidebar
    assert 'to: "/cctv-room/dashboard"' in sidebar
    assert 'to: "/cctv-room/footage-requests"' in sidebar
    assert "CctvRoom: cctvRoomSidebarLinks" in sidebar


def test_cctv_routes_reuse_register_and_non_academics_workflows():
    routes = _read("src", "Routes", "CctvRoomRoutes.jsx")
    assert "CameraRegister" in routes
    assert "canEdit={false}" in routes
    assert "SchoolLocations" in routes
    assert "FootageRequests" in routes
    assert "CameraStatus" in routes
    assert "PendingFeature" in routes
    assert "Not yet available" in _read("src", "Pages", "CctvRoom", "PendingFeature.jsx")


def test_file_room_portal_still_present():
    """Phase 3 must not remove Phase 2 File Room wiring."""
    roles = _read("src", "constants", "roles.js")
    assert "FILE_ROOM: 'fileroom'" in roles
    assert 'import("./Layout/FileRoomLayout")' in _read("src", "App.jsx")
