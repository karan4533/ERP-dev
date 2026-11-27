"""Static guards for the Admin > RBAC > User Creation frontend.

There is no JS test runner in the project, so these read the React sources. They prove a password
is never persisted by the API-backed path; runtime behaviour is covered by the browser checks.
"""

import re
from pathlib import Path

SRC = Path(__file__).resolve().parents[2] / "src"


def _read(relative: str) -> str:
    return (SRC / relative).read_text(encoding="utf-8")


def test_api_service_never_touches_browser_storage():
    source = _read("services/adminUsersApi.js")
    assert "localStorage" not in source and "sessionStorage" not in source


def test_api_mirror_never_stores_a_password():
    source = _read("Common/RBAC/createdUsersData.js")
    mapper = source[source.index("const fromApiUser") : source.index("export const syncCreatedUsersFromApi")]
    assert "password: ''" in mapper
    assert "temporaryPassword" not in mapper
    # nothing in the API section persists the generated password
    api_section = source[source.index("API mode (Admin") :]
    assert not re.search(r"saveUsers\([^)]*temporaryPassword", api_section)
    assert "localStorage" not in api_section


def test_temporary_password_only_travels_in_router_state_and_is_cleared():
    page = _read("Pages/Admin/RBAC/UserCreationPage.jsx")
    assert "localStorage" not in page and "sessionStorage" not in page
    assert "state: null" in page  # the history entry is wiped after the one-time display
    create = _read("Pages/Admin/RBAC/CreateUserPage.jsx")
    assert "localStorage" not in create and "sessionStorage" not in create


def test_roles_page_is_read_only():
    page = _read("Pages/Admin/RBAC/RolesPage.jsx")
    assert "method: 'PATCH'" not in page and "setPermissionsForRole" not in page
    service = _read("services/adminUsersApi.js")
    assert "role" in service and "/permissions`, { method" not in service


def test_password_field_does_not_autofill_existing_credentials():
    assert "autoComplete='new-password'" in _read("Common/RBAC/Components/UserCreationForm.jsx")


# --- Admin > User Management > Employee Database (HR-backed) ---


def test_employee_directory_service_never_touches_browser_storage_or_secrets():
    source = _read("services/employeeDirectoryApi.js")
    assert "localStorage" not in source and "sessionStorage" not in source
    mapper = source[source.index("export const mapHrEmployee") : source.index("export const loadEmployeeDirectory")]
    # explicit allowlist: salary is shown as restricted, never copied; no password or extra bag
    assert "'Restricted (HR)'" in mapper
    for forbidden in ("item.salary", "item.basicSalary", "item.ctc", "item.extra", "item.password", "temporaryPassword"):
        assert forbidden not in mapper, forbidden


def test_employee_directory_reuses_existing_endpoints_not_new_ones():
    source = _read("services/employeeDirectoryApi.js")
    assert "'/hr/portal/employees'" in source
    assert "listAdminUsersApi" in source
    assert "method: 'POST'" not in source and "method: 'PUT'" not in source  # read-only


def test_employee_directory_detail_page_hides_password_in_api_mode():
    page = _read("Pages/Admin/UserManagement/EmployeeDatabase/ViewEmployee.jsx")
    api_branch, local_branch = page.split(") : (", 1)[0], page.split(") : (", 1)[1]
    assert "employee.account.password" not in api_branch
    assert "employee.account.password" in local_branch  # local mode unchanged


def test_employee_directory_is_flag_gated_and_local_mode_kept():
    client = _read("services/apiClient.js")
    assert "VITE_USE_API_EMPLOYEES" in client
    hook = _read("Pages/Admin/UserManagement/EmployeeDatabase/useEmployeeDirectory.js")
    assert "canUseEmployeeDirectoryApi" in hook and "if (!apiMode) return undefined" in hook
    # the shared Principal/Director/SuperAdmin screens do not use the API hook
    for shared in ("Common/UserDatabase/EmployeeDatabaseListView.jsx", "Common/UserDatabase/ViewEmployeePage.jsx"):
        assert "useEmployeeDirectory" not in _read(shared)


# --- Super Admin > User Creation (ASA-02) ---


def test_super_admin_user_edit_uses_authorized_admin_users_api():
    """ASA-02: status edits go through updateAdminUserViaApi → PATCH /admin/users, not sessionStorage alone."""
    data = _read("Pages/SuperAdmin/UserCreation/adminUsersData.js")
    assert "updateAdminUserApi" in data
    assert "export const updateAdminUserViaApi" in data
    assert "export const fetchAdminUserViaApi" in data
    assert "persistedOnServer" in data
    view = _read("Pages/SuperAdmin/UserCreation/ViewAdminUser.jsx")
    assert "updateAdminUserViaApi" in view
    assert "fetchAdminUserViaApi" in view
    assert "handleSave = async" in view or "const handleSave = async" in view
    # Must not call the local-only updater from the view save path.
    assert "updateAdminUser(" not in view
    assert "Administrator account status saved on the server" in view


def test_super_admin_admin_users_list_export_uses_server_access_label():
    """Regression: export once called unbound getPermissionCount and crashed the list page."""
    listing = _read("Pages/SuperAdmin/UserCreation/AdminUsersList.jsx")
    assert "getAdminAccessLabel" in listing
    assert "import {\n    ADMIN_USER_STATUSES,\n    filterAdminUsers,\n    getAdminAccessLabel," in listing or (
        "getAdminAccessLabel," in listing and "from './adminUsersData'" in listing
    )
    # Must not call the old helper without importing it (ReferenceError on Export / render).
    assert "getPermissionCount(" not in listing


def test_asa03_module_permissions_are_preview_only_not_persisted_or_enforced_in_ui():
    """ASA-03: no per-user module-grant API — quarantine checkbox UX and sidebar filtering."""
    data = _read("Pages/SuperAdmin/UserCreation/adminUsersData.js")
    assert "MODULE_PERMISSIONS_PREVIEW_ONLY = true" in data
    assert "MODULE_PERMISSIONS_NOTICE" in data
    assert "getAdminAccessLabel" in data
    # API-mode sidebar must not hide modules based on local checkbox state.
    filtered = data[data.index("export const getFilteredAdminSidebarLinks") :]
    assert "isApiAuthEnabled()" in filtered
    assert "return adminSidebarLinks" in filtered
    # Status PATCH path must ignore permission payloads as access control.
    update = data[data.index("export const updateAdminUserViaApi") : data.index("export const resetAdminUserPasswordViaApi")]
    assert "buildFullPermissions()" in update
    assert "payload.permissions" not in update or "ignored" in update.lower() or "Do not write checkbox" in update

    view = _read("Pages/SuperAdmin/UserCreation/ViewAdminUser.jsx")
    assert "MODULE_PERMISSIONS_NOTICE" in view
    assert "previewOnly" in view
    assert "permissions:" not in view.split("updateAdminUserViaApi")[1].split(")")[0]
    panel = _read("Pages/SuperAdmin/UserCreation/Components/AdminPermissionsPanel.jsx")
    assert "previewOnly" in panel
    assert "disabled={locked}" in panel or "disabled={locked" in panel

    auth = _read("context/AuthContext.jsx")
    # API login must clear local Admin module session filters.
    admin_branch = auth[auth.index("if (expectedRole === ROLES.ADMIN)") : auth.index("} else {")]
    assert "clearActiveAdminSession()" in admin_branch
    assert "isApiAuthEnabled()" in admin_branch
