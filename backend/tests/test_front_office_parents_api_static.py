"""Front Office Parent Management: live GET /parents, sidebar, failure/retry UX."""

from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "src"
FO = SRC / "Pages" / "FrontOffice" / "ParentManagement"
SIDEBAR = SRC / "Common" / "CommonSidebar" / "Components" / "sidebarLinks.js"
TITLES = SRC / "Common" / "CommonHeader" / "Components" / "TitleMappings.jsx"
ROUTES = SRC / "Routes" / "FrontOfficeRoutes.jsx"


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def test_prm_sidebar_includes_parent_database_menu():
    sidebar = _read(SIDEBAR)
    # Inside prmSidebarLinks User Database group.
    assert 'title: "Parent Database"' in sidebar
    assert 'to: "/front-office/parent-management"' in sidebar
    prm_block = sidebar.split("export const prmSidebarLinks")[1].split("export const")[0]
    assert "/front-office/parent-management" in prm_block


def test_fo_parent_route_and_title_mappings_present():
    routes = _read(ROUTES)
    titles = _read(TITLES)
    assert 'path="/front-office/parent-management"' in routes
    assert 'path="/front-office/view-parent/:id"' in routes
    assert '"/front-office/parent-management": "Parent Database"' in titles


def test_fo_parents_list_hydrates_from_staff_parents_api_with_retry():
    code = _read(FO / "ParentsList.jsx")
    assert "listStaffParentsApi" in code
    assert "isApiStudentsEnabled" in code
    assert "mapStaffParentApiRowToListRow" in code
    assert "Retry live API" in code
    assert "Offline / cached only" in code or "offline/cached" in code.lower()
    assert "Live campus data from API" in code
    assert "EditRequestModal" in code
    assert "One row per enrolled student" in code


def test_fo_parent_view_retry_and_cached_label():
    code = _read(FO / "ViewParent.jsx")
    assert "getStudentApi" in code
    assert "mapStudentDetailToParentDetail" in code
    assert "Retry live API" in code
    assert "Offline / cached only" in code or "offline/cached" in code.lower()


def test_fo_parent_mappers_keep_student_guardian_association():
    code = _read(FO / "parentDatabaseData.js")
    assert "mapStaffParentApiRowToListRow" in code
    assert "mapStudentDetailToParentDetail" in code
    assert "studentId" in code
    assert "parentUserId" in code
    assert "one row per enrolled student" in code.lower() or "One row per" in code
