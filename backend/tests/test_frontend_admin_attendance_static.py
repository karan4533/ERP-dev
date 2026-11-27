"""Static guards for the Admin > Attendance (Students / Employees) frontend (API mode).

There is no JS test runner in the project, so these read the React sources. Runtime behaviour is
covered by the browser checks recorded in reports/testing-report.md.
"""

import re
from pathlib import Path

SRC = Path(__file__).resolve().parents[2] / "src"
ATTENDANCE = "Pages/Admin/Attendance/"


def _read(relative: str) -> str:
    return (SRC / relative).read_text(encoding="utf-8")


def test_service_reads_only_and_uses_existing_routes():
    source = _read("services/adminAttendanceApi.js")
    assert "localStorage" not in source and "sessionStorage" not in source
    # this screen only reads; marking attendance stays with teachers
    assert "upsertAttendanceApi" not in source
    assert "method: 'POST'" not in source and "method: 'PUT'" not in source and "method: 'DELETE'" not in source
    assert "/hr/attendance" in source and "/hr/portal/employees" in source
    assert "listAttendanceApi" in source


def test_student_roster_is_only_requested_for_a_class_without_a_section():
    source = _read("services/adminAttendanceApi.js")
    # the server ignores section when building the roster, so a section filter must not use it
    assert re.search(r"roster\s*=\s*Boolean\(className\)\s*&&\s*!section", source) or (
        "className && !section" in source
    )


def test_dates_use_local_calendar_day_not_utc():
    source = _read("services/adminAttendanceApi.js")
    block = source[source.index("export const toIsoDate") :]
    block = block[: block.index("export const normalizeAttendanceDate")]
    assert "toISOString" not in block
    assert "getFullYear" in block and "getMonth" in block and "getDate" in block


def test_flag_defaults_to_the_auth_flag_and_can_turn_the_screens_back_to_local():
    client = _read("services/apiClient.js")
    block = client[client.index("export const isApiAdminAttendanceEnabled") :]
    block = block[: block.index("export const", 10)] if "export const" in block[10:] else block
    assert "VITE_USE_API_ADMIN_ATTENDANCE" in block and "isApiAuthEnabled()" in block


def test_hook_derives_loading_without_synchronous_state_in_the_effect():
    hook = _read(ATTENDANCE + "useAttendanceQuery.js")
    assert "requestKey" in hook and "cancelled" in hook
    effect = hook[hook.index("useEffect(") :]
    before_then = effect[: effect.index(".then(")]
    assert "setResult" not in before_then and "setReloadKey" not in before_then
    # the dropdown options survive a failed reload
    assert "options: previous.options" in hook


def test_student_page_keeps_local_mode_and_shows_api_states():
    page = _read(ATTENDANCE + "Students/StudentsList.jsx")
    assert "canUseAdminAttendanceApi()" in page
    assert "STUDENT_ATTENDANCE" in page and "filterStudentAttendance(STUDENT_ATTENDANCE, filters)" in page
    assert "query.status === 'loading'" in page and "query.status === 'error'" in page
    assert "onClick={query.reload}" in page
    assert "Not marked" in page
    # punch times do not exist for students on the server, so the columns are relabelled in API mode
    assert "'Marked At'" in page and "'In / Out'" in page


def test_employee_page_keeps_local_mode_and_explains_other_dates():
    page = _read(ATTENDANCE + "Employees/EmployeesList.jsx")
    assert "canUseAdminAttendanceApi()" in page
    assert "filterEmployeeAttendance(EMPLOYEE_ATTENDANCE, filters)" in page
    assert "query.status === 'loading'" in page and "query.status === 'error'" in page
    assert "Show all dates" in page


def test_demo_data_modules_stay_intact_for_the_other_roles():
    students = _read(ATTENDANCE + "Students/studentAttendanceData.js")
    employees = _read(ATTENDANCE + "Employees/employeeAttendanceData.js")
    assert "export const STUDENT_ATTENDANCE" in students and "export const filterStudentAttendance" in students
    assert "export const EMPLOYEE_ATTENDANCE" in employees and "export const filterEmployeeAttendance" in employees
    for status in ("Present", "Absent", "Late"):
        assert status in students and status in employees


def test_super_admin_attendance_uses_same_read_only_admin_api():
    """Super Admin attendance is intentionally on the shared Admin SoT (read-only API)."""
    students = _read("Pages/SuperAdmin/Attendance/Students/StudentsList.jsx")
    employees = _read("Pages/SuperAdmin/Attendance/Employees/EmployeesList.jsx")
    for page in (students, employees):
        assert "canUseAdminAttendanceApi()" in page
        assert "adminAttendanceApi" in page
        assert "query.status === 'loading'" in page and "query.status === 'error'" in page
    assert "loadStudentAttendance" in students
    assert "loadEmployeeAttendance" in employees
    # Screens stay read-only: no HR write / upsert from Super Admin attendance pages.
    for page in (students, employees):
        assert "upsertAttendanceApi" not in page
        assert "method: 'POST'" not in page and "method: 'PUT'" not in page
