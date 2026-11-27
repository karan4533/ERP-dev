"""Static guards: Leave and Escalation must not mirror server data into the browser in API mode.

There is no JS test runner in the project, so these read the React sources. Runtime behaviour is
covered by the browser checks recorded in reports/testing-report.md.
"""

from pathlib import Path

SRC = Path(__file__).resolve().parents[2] / "src"


def _read(relative: str) -> str:
    return (SRC / relative).read_text(encoding="utf-8")


def _function_body(source: str, header: str) -> str:
    start = source.index(header)
    return source[start : start + 900]


def test_leave_requests_are_held_in_memory_in_api_mode():
    source = _read("Common/LeaveRequest/leaveRequestData.js")
    assert "let apiMemoryRequests = []" in source
    assert "const usesApiMemory = () => canUseLeaveApi()" in source
    # reads and writes short-circuit to memory before any localStorage / sessionStorage access
    assert "if (usesApiMemory()) return apiMemoryRequests" in _function_body(source, "const loadRawFromStorage")
    save = _function_body(source, "const saveRawToStorage")
    assert save.index("if (usesApiMemory())") < save.index("localStorage.setItem")
    # old browser copies of server data are removed once the API has answered
    assert "localStorage?.removeItem(STORAGE_KEY)" in source and "sessionStorage?.removeItem(STORAGE_KEY)" in source
    # the legacy-import helpers do nothing in API mode
    assert "if (usesApiMemory()) return" in _function_body(source, "export const migrateLegacyLeaveRequestsIfNeeded")
    assert "if (usesApiMemory()) return" in _function_body(source, "export const migrateSessionLeaveRequestsToLocalIfNeeded")
    # local mode is untouched: the browser keys and helpers are still there
    assert "localStorage.setItem(STORAGE_KEY, payload)" in source


def test_escalations_are_held_in_memory_in_api_mode():
    source = _read("Common/EscalationManagement/escalationData.js")
    assert "let apiMemoryEscalations = []" in source
    assert "const usesApiMemory = () => canUseEscalationsApi()" in source
    save = _function_body(source, "const saveAllEscalations")
    assert save.index("if (usesApiMemory())") < save.index("localStorage.setItem")
    assert "if (usesApiMemory()) return apiMemoryEscalations.map(normalizeEscalation)" in source
    assert "localStorage?.removeItem(UNIFIED_STORAGE_KEY)" in source
    # local mode is untouched
    assert "localStorage.getItem(UNIFIED_STORAGE_KEY)" in source


def test_sign_out_drops_the_in_memory_copies():
    auth = _read("context/AuthContext.jsx")
    logout = auth[auth.index("const logout = useCallback") :]
    logout = logout[: logout.index("}, [email, role])")]
    assert "clearLeaveRequestMemory()" in logout
    assert "clearEscalationMemory()" in logout
