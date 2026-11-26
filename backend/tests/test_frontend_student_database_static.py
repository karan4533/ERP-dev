"""Student directory static guards remapped to ERP_QMIS services."""

from pathlib import Path

_ROOT = Path(__file__).resolve().parents[2]
_ERP = _ROOT / "ERP_QMIS" / "src"
_LEGACY = _ROOT / "src"
SRC = _ERP if _ERP.is_dir() else _LEGACY


def _read(relative: str) -> str:
    return (SRC / relative).read_text(encoding="utf-8")


def test_student_database_shared_data_module_exists():
    candidates = [
        "services/api/admissionsApiService.js",
        "Pages/Admin/UserManagement/StudentDatabase/studentDatabaseData.js",
        "Common/UserDatabase/studentDatabaseData.js",
    ]
    found = [rel for rel in candidates if (SRC / rel).is_file()]
    assert found, "expected student database data module in ERP_QMIS"
    source = _read(found[0])
    assert "export" in source
    assert "localStorage" not in source or "admissions" in found[0].lower()


def test_admin_student_list_does_not_embed_seed_passwords():
    page = _read("Pages/Admin/UserManagement/StudentDatabase/StudentsList.jsx")
    assert "password:" not in page.lower() or "mustChangePassword" in page
    assert "ADMIN_SEED_PASSWORD" not in page
