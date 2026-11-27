"""Static guards for the Announcement and Notifications screens in API mode.

There is no JS test runner in the project, so these read the React sources. Runtime behaviour is
covered by the browser checks recorded in reports/testing-report.md.
"""

import re
from pathlib import Path

SRC = Path(__file__).resolve().parents[2] / "src"


def _read(relative: str) -> str:
    return (SRC / relative).read_text(encoding="utf-8")


def test_announcements_are_held_in_memory_in_api_mode():
    source = _read("Common/Announcement/announcementData.js")
    assert "let apiAnnouncements = []" in source
    assert "roleKey !== HR_ROLE && canUseAnnouncementsApi()" in source  # the HR portal keeps its own store
    # server data is never written to browser storage by the API paths
    api_section = source[source.index("let apiAnnouncements") : source.index("export const getAnnouncementsForRole")]
    assert "localStorage.setItem" not in api_section and "sessionStorage" not in api_section
    # reads come from memory in API mode; old browser copies are removed once the server has answered
    assert "if (usesAnnouncementsApi(roleKey)) return [...apiAnnouncements]" in source
    assert "if (usesAnnouncementsApi(roleKey)) return apiAnnouncements.find" in source
    assert "localStorage.removeItem(STORAGE_KEY)" in source and "localStorage.removeItem(RESPONSES_STORAGE_KEY)" in source
    # local mode is untouched
    assert "localStorage.setItem(STORAGE_KEY, JSON.stringify(items))" in source


def test_announcement_screens_use_the_server_in_api_mode():
    add = _read("Common/Announcement/AddAnnouncementForm.jsx")
    assert "usesAnnouncementsApi(roleKey)" in add and "addAnnouncementViaApi(" in add
    assert "file: attachmentFile" in add  # the real file goes to the server, not just its name
    assert add.index("usesAnnouncementsApi(roleKey)") < add.index("addAnnouncement(\n")  # local path stays as the fallback
    view = _read("Common/Announcement/ViewAnnouncementPage.jsx")
    assert "acknowledgeAnnouncementViaApi(id)" in view and "replyToAnnouncementViaApi(id" in view
    assert "(api ? {} : ensureSeed(storageKey, {}))" in view  # no browser storage read/seed in API mode
    assert "openStoredDocument(shown.attachmentUrl)" in view
    listing = _read("Common/Announcement/AnnouncementListView.jsx")
    assert "useAnnouncementList(roleKey)" in listing


def test_view_page_never_reads_fields_of_a_possibly_null_announcement_while_rendering():
    """The React Compiler hoists property reads into its cache check, before any null guard runs.

    This once blanked the whole page (Cannot read properties of null (reading 'acknowledged')), so the
    pieces computed outside the JSX must go through never-null stand-ins.
    """
    view = _read("Common/Announcement/ViewAnnouncementPage.jsx")
    assert "const NO_ANNOUNCEMENT" in view and "const shown = announcement ?? NO_ANNOUNCEMENT" in view
    assert "const NO_UPDATE" in view and "useState(NO_UPDATE)" in view
    body = view[view.index("export default function ViewAnnouncementPage") : view.index("    return (\n        <section")]
    assert not re.search(r"announcement\??\.(acknowledged|replies|attachmentUrl)", body)
    assert "updated?." not in body


def test_sign_out_drops_the_in_memory_announcements():
    auth = _read("context/AuthContext.jsx")
    logout = auth[auth.index("const logout = useCallback") :]
    logout = logout[: logout.index("}, [email, role])")]
    assert "clearAnnouncementsMemory()" in logout


def test_admin_notifications_page_reads_the_server_in_api_mode_and_keeps_sample_data_otherwise():
    page = _read("Pages/Admin/Notification/Notifications.jsx")
    assert "canUseNotificationsApi()" in page and "listNotificationsApi()" in page
    assert "markNotificationReadApi(record.id)" in page
    # the hard-coded cards are only used when there is no backend session
    no_session_branch = page.split("if (!api) {")[1].split("if (answer.key !== requestKey)")[0]
    assert "notifications={NOTIFICATIONS}" in no_session_branch
    assert page.count("notifications={NOTIFICATIONS}") == 1
    assert "notifications={answer.items}" in page
    # nothing from the server is written to the browser
    assert "localStorage" not in page and "sessionStorage" not in page
    shared = _read("Common/Notifications/NotificationsListView.jsx")
    assert "if (!isExpanded && onOpen) onOpen(record)" in shared
