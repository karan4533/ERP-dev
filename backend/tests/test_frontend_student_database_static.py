"""Static guards for the shared Student Database mapper (src/Common/StudentDatabase).

There is no JS test runner in the project, so these read the React sources. Runtime behaviour is
covered by the browser checks recorded in reports/testing-report.md.

Regression: with the students API on, every list row used to request GET /admissions/{id}. That
was a request per student (an N+1), Principal and Director got 403 for each one (they hold
students.read, not admissions.write), and the Promise it returned was treated as the admission
record, so admission-only fields on the detail page showed as blanks.
"""

from pathlib import Path

SRC = Path(__file__).resolve().parents[2] / "src"
MAPPER = SRC / "Common" / "StudentDatabase" / "studentDatabaseData.js"


def _source() -> str:
    return MAPPER.read_text(encoding="utf-8")


def _block(source: str, start: str, end: str) -> str:
    begin = source.index(start)
    return source[begin : source.index(end, begin)]


def test_admission_lookup_is_skipped_when_the_students_api_is_on():
    resolver = _block(_source(), "const resolveAdmissionSource", "const mapToStudentView")
    assert "isApiStudentsEnabled()" in resolver
    # the lookup sits behind the flag, and the server snapshot is the API-mode source
    assert resolver.index("!isApiStudentsEnabled()") < resolver.index("getAdmissionById")
    assert "record.admissionSnapshot" in resolver


def test_a_promise_is_never_used_as_an_admission_record():
    resolver = _block(_source(), "const resolveAdmissionSource", "const mapToStudentView")
    assert "isPromise(liveAdmission)" in resolver


def test_api_mode_never_writes_the_snapshot_back():
    source = _source()
    view = source[source.index("export const getStudentById") :]
    assert "!isApiStudentsEnabled() && record.admissionId" in view


def test_mapper_has_no_direct_network_calls():
    code = "\n".join(
        line for line in _source().splitlines() if not line.lstrip().startswith(("*", "/*", "//"))
    )
    assert "apiRequest" not in code
    assert "fetch(" not in code
    assert "admissionsApi" not in code  # only the sync local-mode helper may be used
