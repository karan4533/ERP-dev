"""Static guards for the Admin > Class > Class Details frontend (API mode).

There is no JS test runner in the project, so these read the React sources. Runtime behaviour is
covered by the browser checks recorded in reports/testing-report.md.
"""

import re
from pathlib import Path

SRC = Path(__file__).resolve().parents[2] / "src"
DETAILS = "Pages/Admin/Class/ClassDetails/"


def _read(relative: str) -> str:
    return (SRC / relative).read_text(encoding="utf-8")


def test_service_uses_only_masters_routes_and_never_touches_storage():
    source = _read("services/classDetailsApi.js")
    assert "localStorage" not in source and "sessionStorage" not in source
    routes = set(re.findall(r"/masters/[a-z-]+", source))
    assert routes == {
        "/masters/academic-years",
        "/masters/class-teacher-options",
        "/masters/classes",
        "/masters/sections",
        "/masters/subjects",
    }
    # edit and deactivate are PATCH, permanent delete is DELETE; nothing else is used
    assert "method: 'PATCH'" in source and "method: 'DELETE'" in source
    assert "method: 'PUT'" not in source


def test_year_filter_goes_to_the_server_and_only_the_active_current_year_list_is_mirrored():
    source = _read("services/classDetailsApi.js")
    assert "academic_year_id=${encodeURIComponent(academicYearId)}" in source
    assert "const filtered = Boolean(academicYearId) || includeInactive" in source
    mirror_call = source[source.index("if (!filtered) {") :]
    mirror_call = mirror_call[: mirror_call.index("mirrorApiClassDetails(mirrored)")]
    # a deactivated class and a class from another year must not reach the other screens' dropdowns
    assert "record.isActive" in mirror_call and "record.academicYearId === currentYear.id" in mirror_call
    assert "section.isActive" in mirror_call


def test_save_is_year_aware_and_idempotent():
    source = _read("services/classDetailsApi.js")
    # the class is looked up by name AND academic year before it is created
    lookup = source.index("/masters/classes?academic_year_id=${encodeURIComponent(yearId)}&include_inactive=true")
    assert lookup < source.index("method: 'POST', body: { name, academic_year_id: yearId }")
    assert "is_active === false" in source  # never adds sections to a deactivated class
    assert "error?.status === 409" in source
    assert "sectionsExisting" in source and "failures" in source
    # the class is created without a section: each section is saved with its own details
    assert "body: { name, academic_year_id: yearId }" in source
    # capacity is validated once, before the first request
    assert "parseCapacity" in source and source.index("detailsByName") < lookup


def test_flag_defaults_to_the_auth_flag_and_can_turn_the_screen_back_to_local():
    client = _read("services/apiClient.js")
    block = client[client.index("export const isApiClassDetailsEnabled") :]
    block = block[: block.index("export const getAccessToken")]
    assert "VITE_USE_API_CLASSES" in block and "isApiAuthEnabled()" in block


def test_mirror_removes_only_api_sourced_classes_and_keeps_local_ones():
    source = _read("Common/RBAC/academicsCatalogData.js")
    body = source[source.index("export const mirrorApiClassDetails") : source.index("export const removeClassDetails")]
    # classes the server no longer lists drop out, but only entries that came from the server
    assert "item.source === 'api' && item.apiId && !mirroredIds.has(String(item.apiId))" in body
    # the flat lists that feed other screens' dropdowns (getClasses, getSections) shed those names too,
    # unless something still here uses them
    assert "catalog.classes = catalog.classes.filter(" in body and "catalog.sections = catalog.sections.filter(" in body
    assert "keepClass.has(" in body and "keepSection.has(" in body
    assert "...local," in body  # local-only fields survive for a class with the same name
    # teacher, capacity and room now come from the server, not from the browser
    assert "classTeacher: taught?.classTeacherName" in body and "classRoomNumber: roomed?.roomNumber" in body
    assert "splice" not in body
    assert "if (JSON.stringify(catalog) !== before)" in body
    assert "saveCatalog(catalog)" in body
    assert "emitClassCatalogUpdated()" in body
    assert "password" not in body.lower()


def test_list_page_shows_server_fields_and_actions_in_api_mode_and_keeps_local_mode():
    page = _read(DETAILS + "ClassDetails.jsx")
    assert "useClassDirectory(yearId, showInactive)" in page
    assert "directory.status === 'loading'" in page and "directory.status === 'error'" in page
    assert "directory.reload" in page  # Retry and refresh after an action
    for needle in ("Academic Year", "Capacity", "Class Teacher", "Room", "Status", "Show deactivated"):
        assert needle in page
    # API actions go through the service, behind a confirmation, with a double-click guard
    assert "setClassActive" in page and "deleteClass" in page and "EditClassModal" in page
    assert "if (!confirm || busy) return" in page
    assert "toast.error(" in page
    # the old "not stored by the server yet" notice is gone
    assert "not stored by the server yet" not in page and "cannot be edited or deleted yet" not in page
    # local mode is untouched: it still edits through the request modal and deletes from the catalog
    assert "removeClassDetails" in page and "EditRequestModal" in page and "classCapacity" in page
    assert "setEditRequestModal(true)" in page and "setPendingDeleteId(record.id)" in page


def test_edit_modal_saves_row_by_row_and_never_renames():
    modal = _read(DETAILS + "Components/EditClassModal.jsx")
    assert "updateSectionDetails" in modal and "addSectionToClass" in modal
    assert "useClassTeacherOptions(true)" in modal
    assert "readOnly" in modal or "disabled" in modal  # an existing section's name cannot change


def test_add_page_sends_capacity_room_and_teacher_in_api_mode_and_keeps_local_mode():
    page = _read(DETAILS + "AddClassDetails.jsx")
    assert "saveClassWithSections" in page and "showCapacity={!apiMode}" in page
    assert "useClassTeacherOptions(apiMode)" in page
    assert "saveClassDetails" in page  # local mode is unchanged
    assert "if (apiMode) return undefined" in page  # no user sync just to fill a teacher picker
    assert "disabled={saving}" in page  # no double submit
    info = _read(DETAILS + "Components/ClassInfo.jsx")
    assert "apiMode ? null : (<>" in info  # class-level teacher, capacity and room are derived in API mode
    section = _read(DETAILS + "Components/SectionInfo.jsx")
    assert "apiMode" in section and "teacherOptions" in section


def test_hook_derives_loading_from_the_request_key_not_from_set_state_in_the_effect():
    hook = _read(DETAILS + "useClassDirectory.js")
    assert "result.key === requestKey" in hook
    effect = hook[hook.index("useEffect(") :]
    assert "setResult({" in effect and ".then(" in effect  # only inside the promise callbacks
    assert "setResult" not in effect[: effect.index("loadClassDirectory(")]
