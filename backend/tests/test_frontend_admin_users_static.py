"""Static guards for Admin user provisioning clients in ERP_QMIS.

Legacy services/adminUsersApi.js moved to services/api/adminUsersApiService.js.
Keep password / storage safety assertions against the live client and RBAC pages.
"""

from pathlib import Path

_ROOT = Path(__file__).resolve().parents[2]
_ERP = _ROOT / "ERP_QMIS" / "src"
_LEGACY = _ROOT / "src"
SRC = _ERP if _ERP.is_dir() else _LEGACY


def _read(relative: str) -> str:
    return (SRC / relative).read_text(encoding="utf-8")


def test_api_service_never_touches_browser_storage():
    source = _read("services/api/adminUsersApiService.js")
    assert "localStorage" not in source and "sessionStorage" not in source


def test_api_mapper_does_not_invent_persisted_password_fields_for_list_rows():
    source = _read("services/api/adminUsersApiService.js")
    mapper = source[source.index("export function mapAdminUserToUi") : source.index("export async function listAdminUsers")]
    # temporaryPassword may be returned once from create; list mapping must not read browser storage.
    assert "localStorage" not in mapper
    assert "sessionStorage" not in mapper


def test_user_creation_pages_do_not_persist_passwords_in_browser_storage():
    page = _read("Pages/Admin/RBAC/UserCreationPage.jsx")
    create = _read("Pages/Admin/RBAC/CreateUserPage.jsx")
    assert "localStorage" not in page and "sessionStorage" not in page
    assert "localStorage" not in create and "sessionStorage" not in create


def test_roles_page_uses_live_admin_permissions_client_when_enabled():
    """Partner Admin RBAC is live-aware (not permanently read-only)."""
    page = _read("Pages/Admin/RBAC/RolesPage.jsx")
    assert "adminUsersApiService" in page or "getAdminRolePermissions" in page or "listAdminRoles" in page
    assert "isLiveApiEnabled" in page


def test_password_field_does_not_autofill_existing_credentials():
    form = _read("Common/RBAC/Components/UserCreationForm.jsx")
    assert "autoComplete='new-password'" in form or 'autoComplete="new-password"' in form
