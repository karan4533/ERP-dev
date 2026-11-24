"""Static guards for announcements / notifications against ERP_QMIS layout."""

from pathlib import Path

_ROOT = Path(__file__).resolve().parents[2]
_ERP = _ROOT / "ERP_QMIS" / "src"
_LEGACY = _ROOT / "src"
SRC = _ERP if _ERP.is_dir() else _LEGACY


def _read(relative: str) -> str:
    return (SRC / relative).read_text(encoding="utf-8")


def test_announcement_data_module_exposes_create_gate():
    source = _read("Common/Announcement/announcementData.js")
    assert "canCreateAnnouncements" in source
    assert "addAnnouncement" in source
    assert "getAnnouncementsForRole" in source


def test_announcement_api_service_has_no_browser_storage():
    source = _read("services/api/announcementApiService.js")
    # Ignore documentation mentions of localStorage in comments.
    code = "\n".join(line for line in source.splitlines() if not line.strip().startswith(("*", "/", "//")))
    assert "localStorage.getItem" not in code and "sessionStorage.getItem" not in code
    assert "localStorage.setItem" not in code and "sessionStorage.setItem" not in code
    assert "announcement" in source.lower()


def test_staff_notifications_workspace_exists():
    page = _read("Common/Notifications/StaffNotificationsPage.jsx")
    assert "StaffNotificationsPage" in page or "export default" in page
