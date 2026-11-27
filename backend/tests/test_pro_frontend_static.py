"""Static checks that dedicated PRO portal wiring stays intact."""

from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]


def _read(*parts: str) -> str:
    return (ROOT.joinpath(*parts)).read_text(encoding="utf-8")


def test_pro_role_home_path_and_demo_email():
    roles = _read("src", "constants", "roles.js")
    auth = _read("src", "context", "AuthContext.jsx")
    assert "PRO: 'pro'" in roles
    assert "[ROLES.PRO]: '/pro/dashboard'" in auth
    assert "[ROLES.PRO]: { email: 'pro@qmis.edu' }" in auth
    assert "[ROLES.PRM]: '/front-office/dashboard'" in auth


def test_pro_app_layout_split_from_prm():
    app = _read("src", "App.jsx")
    assert 'import("./Layout/ProLayout")' in app
    assert "ROLES.PRO" in app
    # Segment-aware guard — bare startsWith('/pro') falsely matches /process-auditor.
    assert 'isPathUnder(pathname, "/pro")' in app
    assert 'pathname.startsWith("/pro")' not in app
    # PRO must not share the PRM Front Office shell.
    assert "role === ROLES.PRM || role === ROLES.PRO" not in app
    assert "role === ROLES.PRM" in app


def test_pro_path_prefix_helper_avoids_process_auditor():
    helper = _read("src", "utils", "pathPrefix.js")
    assert "export const isPathUnder" in helper
    assert "path.startsWith(`${root}/`)" in helper
    assert "/process-auditor" in helper


def test_pro_sidebar_and_breadcrumb_use_segment_match():
    # The sidebar and header search share one menu resolver.
    sidebar = _read("src", "Common", "CommonSidebar", "CommonSidebar.jsx")
    assert "resolveSidebarLinks(location.pathname, authRole)" in sidebar
    resolver = _read("src", "Common", "CommonSidebar", "resolveSidebarLinks.js")
    assert "isPathUnder(pathname, '/pro')" in resolver
    assert resolver.index("'/process-auditor'") < resolver.index("isPathUnder(pathname, '/pro')")
    crumbs = _read("src", "Common", "CommonBreadcrumb", "breadcrumbMappings.js")
    assert "proSidebarLinks" in crumbs
    assert "prefix: '/pro'" in crumbs
    assert "isPathUnder(pathname, config.prefix)" in crumbs
    enquiry = _read(
        "src",
        "Pages",
        "Admin",
        "FrontOffice",
        "AdmissionEnquiry",
        "admissionEnquiryData.js",
    )
    assert "isPathUnder(pathname, '/pro')" in enquiry


def test_pro_sidebar_titles():
    sidebar = _read("src", "Common", "CommonSidebar", "Components", "sidebarLinks.js")
    for title in (
        "Dashboard",
        "Government Liaison Cases",
        "Announcements & Circulars",
        "Events & School Activities",
        "Parent & Community Communication",
        "Enquiries & Follow-ups",
        "Communication Reports",
        "Settings",
    ):
        assert f'title: "{title}"' in sidebar
    assert 'to: "/pro/dashboard"' in sidebar
    assert 'to: "/pro/government-cases"' in sidebar
    assert "PRO: proSidebarLinks" in sidebar


def test_pro_dashboard_survives_partial_api_failure():
    dashboard = _read("src", "Pages", "Pro", "Dashboard", "Dashboard.jsx")
    assert "Promise.allSettled" in dashboard
    assert "asArray" in dashboard
    assert "PRO Dashboard" in dashboard
    assert "Some dashboard figures could not be loaded" in dashboard
    layout = _read("src", "Layout", "ProLayout.jsx")
    assert "ProPortalErrorBoundary" in layout
    boundary = _read("src", "Pages", "Pro", "ProPortalErrorBoundary.jsx")
    assert "getDerivedStateFromError" in boundary
    assert "PRO portal error" in boundary
    admissions = _read("src", "services", "admissionsApi.js")
    assert "if (!Array.isArray(rows)) return []" in admissions


def test_pro_routes_reuse_and_pending():
    routes = _read("src", "Routes", "ProRoutes.jsx")
    assert "GovernmentCases" in routes
    assert "AnnouncementList" in routes
    assert "CommunicationInbox" in routes
    assert "AdmissionEnquiry" in routes
    assert "EventsHub" in routes
    assert "PendingFeature" in routes
    assert "announcements.write" not in routes
    assert "Not yet available" in _read("src", "Pages", "Pro", "PendingFeature.jsx")
    assert "roleKey='pro'" in _read("src", "Pages", "Pro", "Announcement", "AnnouncementList.jsx")
    creators = _read("src", "Common", "Announcement", "announcementData.js")
    assert "export const CREATOR_ROLE_KEYS" in creators
    assert "ROLES.PRO" not in creators.split("CREATOR_ROLE_KEYS")[1].split("]")[0]
    assert "pro-gov-cases" in _read("src", "services", "campusCollectionRegistry.js")


def test_prm_and_prior_portals_still_present():
    app = _read("src", "App.jsx")
    assert 'import("./Layout/PRMLayout")' in app
    assert 'import("./Layout/FileRoomLayout")' in app
    assert 'import("./Layout/CctvRoomLayout")' in app
    roles = _read("src", "constants", "roles.js")
    assert "FILE_ROOM: 'fileroom'" in roles
    assert "CCTV: 'cctv'" in roles
