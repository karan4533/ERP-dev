"""Static checks that File Room portal wiring stays intact."""

from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]


def _read(*parts: str) -> str:
    return (ROOT.joinpath(*parts)).read_text(encoding="utf-8")


def test_file_room_role_constant_and_home_path():
    roles = _read("src", "constants", "roles.js")
    auth = _read("src", "context", "AuthContext.jsx")
    assert "FILE_ROOM: 'fileroom'" in roles
    assert "[ROLES.FILE_ROOM]: '/file-room/dashboard'" in auth
    assert "[ROLES.FILE_ROOM]: { email: 'fileroom@qmis.edu' }" in auth


def test_file_room_app_layout_guard():
    app = _read("src", "App.jsx")
    assert 'import("./Layout/FileRoomLayout")' in app
    assert "ROLES.FILE_ROOM" in app
    assert 'pathname.startsWith("/file-room")' in app


def test_file_room_sidebar_titles():
    sidebar = _read("src", "Common", "CommonSidebar", "Components", "sidebarLinks.js")
    for title in (
        "Dashboard",
        "File Register",
        "File Management",
        "Student Records",
        "Staff Records",
        "File Requests",
        "Search & Retrieval",
        "Archive & Disposal",
        "Activity & Reports",
        "Settings",
    ):
        assert f'title: "{title}"' in sidebar
    assert 'to: "/file-room/dashboard"' in sidebar
    assert 'to: "/file-room/file-register"' in sidebar
    assert "FileRoom: fileRoomSidebarLinks" in sidebar


def test_file_room_routes_reuse_documents_and_non_academics_workflows():
    routes = _read("src", "Routes", "FileRoomRoutes.jsx")
    assert "FILE_ROOM_STUDENT_DOCUMENT_PATHS" in routes
    assert "FILE_ROOM_EMPLOYEE_DOCUMENT_PATHS" in routes
    assert "FileManagement" in routes
    assert "FileRegister" in routes
    assert "FileRequests" in routes
    assert "PendingFeature" in routes
    assert "Not yet available" in _read("src", "Pages", "FileRoom", "PendingFeature.jsx")
