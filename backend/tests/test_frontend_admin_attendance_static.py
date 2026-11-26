"""Static guards for attendance API clients in ERP_QMIS (post partner integration).

Legacy paths (services/adminAttendanceApi.js, useAttendanceQuery.js) were replaced by
services/api/attendanceApiService.js and role pages that call it. These assertions keep the
security intent: API client has no browser storage, and Super Admin attendance screens do not
invent write endpoints beyond the shared attendance upsert used by teachers.
"""

from pathlib import Path

_ROOT = Path(__file__).resolve().parents[2]
_ERP = _ROOT / "ERP_QMIS" / "src"
_LEGACY = _ROOT / "src"
SRC = _ERP if _ERP.is_dir() else _LEGACY


def _read(relative: str) -> str:
    return (SRC / relative).read_text(encoding="utf-8")


def test_attendance_api_service_has_no_browser_storage():
    source = _read("services/api/attendanceApiService.js")
    assert "localStorage" not in source and "sessionStorage" not in source
    assert "/api/v1/attendance" in source
    assert "listAttendance" in source
    assert "isLiveApiEnabled" in source


def test_api_client_live_flag_uses_vite_env():
    client = _read("services/api/apiClient.js")
    assert "VITE_USE_MOCK" in client
    assert "VITE_API_BASE_URL" in client


def test_admin_or_teacher_attendance_pages_do_not_embed_credentials():
    candidates = [
        "Pages/Admin/Attendance/AdminAttendanceAndLeave.jsx",
        "Pages/Admin/Attendance/Employees/EmployeesList.jsx",
        "Pages/Admin/Attendance/Students/StudentsList.jsx",
        "Common/AttendanceAndLeave/AttendanceAndLeaveWorkspace.jsx",
    ]
    found = [rel for rel in candidates if (SRC / rel).is_file()]
    assert found, "expected at least one attendance page in ERP_QMIS"
    for rel in found:
        page = _read(rel)
        assert "ADMIN_SEED_PASSWORD" not in page
        assert "temporaryPassword" not in page
