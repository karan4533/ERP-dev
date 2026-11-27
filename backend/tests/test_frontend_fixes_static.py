"""Guards for frontend fixes that have no JS test runner (see test_frontend_student_database_static.py).

Most checks read the React sources. The fee maths is executed for real through `jiti`
(already in node_modules) and is skipped when Node is not available.
"""

import json
import os
import re
import shutil
import subprocess
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "src"


def _read(rel: str) -> str:
    return (SRC / rel).read_text(encoding="utf-8")


_SIDEBAR_CACHE: dict[str, list[str]] = {}


def _sidebar_destinations(export: str) -> list[str]:
    """Every `to` in one exported sidebar menu, evaluated with Node (menus are built by shared helpers)."""
    if not _SIDEBAR_CACHE:
        node = shutil.which("node")
        if not node:
            pytest.skip("Node is not available to evaluate the sidebar menus.")
        module = (SRC / "Common/CommonSidebar/Components/sidebarLinks.js").resolve().as_uri()
        script = (
            "const s = await import(process.argv[1]);"
            "const flat = (l) => (l || []).flatMap((x) => [x.to, ...flat(x.subLinks)]).filter(Boolean);"
            "const out = {}; for (const [k, v] of Object.entries(s)) if (Array.isArray(v)) out[k] = flat(v);"
            "console.log(JSON.stringify(out));"
        )
        result = subprocess.run(
            [node, "--input-type=module", "-e", script, module], capture_output=True, text=True, cwd=ROOT, timeout=120
        )
        assert result.returncode == 0, result.stderr
        _SIDEBAR_CACHE.update(json.loads(result.stdout))
    return _SIDEBAR_CACHE[export]


def _code(rel: str) -> str:
    """Source without line comments, so commented-out code cannot satisfy a check."""
    return "\n".join(line for line in _read(rel).splitlines() if not line.lstrip().startswith("//"))


# --- pages that crashed on load -------------------------------------------------------------


def test_assets_inventory_imports_the_helpers_it_calls():
    code = _code("Pages/JointDirectorAssistant/AssetsInventory/AssetsInventoryOverview.jsx")
    assert "getJdAssets" in code.split("from './assetsInventoryData'")[0]
    assert "ASSETS_INVENTORY" not in code


def test_template_versioning_hooks_are_not_inside_a_plain_function():
    code = _code("Pages/JointDirectorAudit/AuditConfiguration/TemplateVersioning/TemplateVersioningList.jsx")
    format_today = code[code.index("const formatToday") : code.index("const TemplateVersioningList")]
    assert "useState" not in format_today and "useEffect" not in format_today
    assert "TEMPLATE_VERSIONS" not in code


@pytest.mark.parametrize(
    ("rel", "constant", "saver"),
    [
        ("Pages/JointDirectorAudit/AuditConfiguration/VisibilityRules/VisibilityRulesList.jsx", "VISIBILITY_RULES", "saveAuditVisibilityRules"),
        ("Pages/JointDirectorAudit/AuditConfiguration/WorkflowRules/WorkflowRulesList.jsx", "WORKFLOW_RULES", "saveAuditWorkflowRules"),
    ],
)
def test_audit_rule_pages_use_imported_getters_and_persist(rel, constant, saver):
    code = _code(rel)
    assert not re.search(rf"\b{constant}\b", code)
    assert saver in code


# --- admissions ----------------------------------------------------------------------------


def test_admission_form_sends_the_student_portal_login():
    code = _code("services/admissionsApi.js")
    assert "student_account_email:" in code
    assert "student_account_password:" in code


def test_admission_transport_fields_accept_typed_values():
    code = _code("Pages/Admin/FrontOffice/AdminssionList/Components/TransportInfo.jsx")
    assert code.count("<datalist") == 2
    assert code.count("maxLength={80}") == 2


# --- student lists -------------------------------------------------------------------------


@pytest.mark.parametrize(
    "rel",
    [
        "Pages/Admin/UserManagement/StudentDatabase/StudentsList.jsx",
        "Pages/Teacher/StudentsList/StudentsList.jsx",
        "Pages/Coordinator/StudentsList/StudentsList.jsx",
    ],
)
def test_student_list_pages_use_the_shared_filtered_view(rel):
    assert "<StudentDatabaseListView" in _code(rel)


def test_employee_list_reads_rows_from_directory_records():
    # loadEmployeeDirectory returns { row, detail } pairs; storing the pairs left every cell blank.
    code = _code("Common/UserDatabase/EmployeeDatabaseListView.jsx")
    assert "setEmployees(records)" not in code
    assert "map(({ row, detail })" in code


def test_teacher_roster_never_shows_demo_teachers_in_server_mode():
    code = _code("Pages/Principal/TeacherAllocation/teacherAllocationData.js")
    getter = code[code.index("export const getTeachers") : code.index("export const setTeacherRoster")]
    # Empty roster until HR directory hydrate — never DEMO_TEACHERS.
    assert "return []" in getter
    assert "DEMO_TEACHERS" not in getter
    assert "director" in code[code.index("export const isAllocatableTeacherRecord") : code.index("export const mapDirectoryRecordToTeacher")]


def test_teacher_allocation_save_awaits_api_and_blocks_on_failed_hydrate():
    """CA-01 / CA-05: no silent .catch; hydrate failure cannot wipe server rows."""
    code = _code("Pages/Principal/TeacherAllocation/teacherAllocationData.js")
    assert ".catch(() => {})" not in code
    assert "await replaceAcademicsCollectionApi" in code
    assert "canSaveTeacherAllocations" in code
    assert "allocationHydrateStatus = 'error'" in code
    assert "lastConfirmedServerAllocations" in code
    assert "allocationHydrateStatus === 'ready'" in code
    hydrate = code[code.index("export const hydrateTeacherAllocationsFromApi") : code.index("export const getAllocations")]
    assert "apiMemoryAllocations = null" in hydrate
    # Success path assigns cleaned rows; failure must not assign a fake empty array.
    assert "apiMemoryAllocations = cleaned" in hydrate
    fail_branch = hydrate[hydrate.index("catch (error)") :]
    assert "apiMemoryAllocations = []" not in fail_branch
    assert "apiMemoryAllocations = null" in fail_branch


def test_teacher_allocation_api_mode_does_not_use_demo_allocations():
    """CA-03: live API mode never returns DEMO_ALLOCATIONS as real saved rows."""
    code = _code("Pages/Principal/TeacherAllocation/teacherAllocationData.js")
    getter = code[code.index("export const getAllocations") : code.index("export const isUsingDemoAllocations")]
    api_branch = getter[getter.index("if (usesApiMemory()") : getter.index("try {")]
    assert "DEMO_ALLOCATIONS" not in api_branch
    assert "return []" in api_branch
    assert "isUsingDemoAllocations" in code
    assert "isUsingDemoAllocations = () => false" in code or "export const isUsingDemoAllocations = () => false" in code


def test_class_timetable_save_awaits_api_and_blocks_on_failed_hydrate():
    """TT-01 / TT-02: no silent .catch; hydrate failure cannot wipe server rows."""
    code = _code("Pages/Principal/ClassTimetable/classTimetableData.js")
    assert ".catch(() => {})" not in code
    assert "await replaceAcademicsCollectionApi" in code
    assert "canSaveClassTimetables" in code
    assert "lastConfirmedServerTimetables" in code
    hydrate = code[
        code.index("export const hydrateClassTimetablesFromApi") : code.index("export const getClassTimetables")
    ]
    assert "apiMemoryTimetables = null" in hydrate
    fail_branch = hydrate[hydrate.index("catch (error)") :]
    assert "apiMemoryTimetables = []" not in fail_branch
    assert "apiMemoryTimetables = null" in fail_branch


def test_student_timetable_requires_approved_status():
    """TT-07: student FE publication matches API (Approved only)."""
    code = _code("Pages/Student/Class/TimeTableDetails.jsx")
    assert "approvalStatus" in code
    assert "status === 'approved'" in code or '=== "approved"' in code or "=== 'approved'" in code
    assert "status === 'active'" not in code
    assert "!status ||" not in code


def test_shared_student_list_filters_are_applied_to_rows():
    code = _code("Common/UserDatabase/StudentDatabaseListView.jsx")
    for name in ("classFilter", "sectionFilter", "genderFilter", "statusFilter"):
        assert re.search(rf"if \({name} &&", code), name
    assert "pageRows.map" in code


# --- promotion -----------------------------------------------------------------------------


def test_bulk_promotion_is_sequential_and_capped():
    code = _code("Pages/Coordinator/StudentPlacement/PromoteStudents.jsx")
    assert "MAX_BATCH" in code
    assert "Promise.all" not in code  # roll numbers are assigned per request; no parallel promotes
    assert "await promoteStudentApi" in code
    assert "Select all" in code


# --- fees ----------------------------------------------------------------------------------


def test_payment_link_is_awaited_before_the_modal_opens():
    code = _code("Pages/AccountHead/FeesManagement/Components/FeeCollectionTab.jsx")
    assert "await generatePaymentLink" in code
    assert "setLink(generatePaymentLink" not in code


def test_route_transport_fees_are_not_billed_to_every_student():
    assert "isRouteBilledFee(row)" in _code("Pages/AccountHead/financeDomain/financeBootstrap.js")
    context = _code("Pages/AccountHead/financeDomain/FinanceContext.jsx")
    assert "routeBilled ? []" in context
    assert "if (routeBilled) return baseInstallments" in context


JITI_CLI = ROOT / "node_modules" / "jiti" / "lib" / "jiti-cli.mjs"
JITI = bool(shutil.which("node")) and JITI_CLI.exists()

FEE_SCRIPT = """
const path = require('path');
const src = process.env.QMIS_SRC;
const { buildPaymentSchedule } = require(path.join(src, 'Pages/AccountHead/FeesManagement/feePaymentSchedule.js'));
const { resolveConcessionAmount } = require(path.join(src, 'Pages/AccountHead/financeDomain/financeHelpers.js'));
const cases = [[10000, 'TERM_WISE'], [25000, 'MONTHLY'], [9999, 'QUARTERLY'], [12000, 'ONE_TIME']];
const splits = cases.map(([amount, frequency]) => (
  buildPaymentSchedule({ amount, frequency, academicYear: '2026-2027' }).parts.map((p) => p.amount)
));
const ins = { studentId: 'S1', feeCategoryId: 'CAT-TUITION', academicYear: '2026-2027', feeAmount: 3000 };
const base = { studentId: 'S1', feeCategoryId: 'CAT-TUITION', status: 'Approved' };
const concessions = {
  percent: resolveConcessionAmount(ins, [{ ...base, amount: 50, amountType: 'PERCENT' }]),
  flat: resolveConcessionAmount(ins, [{ ...base, amount: 200 }]),
  stored: resolveConcessionAmount({ ...ins, concessionAmount: 10 }, []),
};
const terms = [3334, 3333, 3333].map((feeAmount, index) => ({ ...ins, id: `T${index}`, scheduleIndex: index, feeAmount }));
concessions.yearlyFlat = terms.map((row) => resolveConcessionAmount(row, [{ ...base, amount: 3000 }], terms));
process.stdout.write(JSON.stringify({ cases, splits, concessions }));
"""


@pytest.fixture(scope="module")
def fee_results(tmp_path_factory):
    if not JITI:
        pytest.skip("Node / jiti not available")
    script = tmp_path_factory.mktemp("fee") / "fee_check.cjs"
    script.write_text(FEE_SCRIPT, encoding="utf-8")
    out = subprocess.run(
        ["node", str(JITI_CLI), str(script)],
        cwd=ROOT,
        env={**os.environ, "QMIS_SRC": str(SRC)},
        capture_output=True,
        text=True,
        timeout=120,
    )
    if out.returncode != 0:
        pytest.fail(out.stderr[-2000:])
    return json.loads(out.stdout)


def test_fee_instalments_are_whole_rupees_and_add_up(fee_results):
    for (amount, frequency), parts in zip(fee_results["cases"], fee_results["splits"]):
        assert sum(parts) == amount, frequency
        assert all(float(p).is_integer() for p in parts), frequency
    assert fee_results["splits"][0] == [3334, 3333, 3333]


def test_percent_concession_is_a_share_of_the_instalment(fee_results):
    concessions = fee_results["concessions"]
    assert {k: concessions[k] for k in ("percent", "flat", "stored")} == {"percent": 1500, "flat": 200, "stored": 10}


def test_flat_concession_is_a_yearly_amount_spread_over_the_instalments(fee_results):
    shares = fee_results["concessions"]["yearlyFlat"]
    assert sum(shares) == 3000
    assert shares == [1002, 999, 999]


# --- academics -----------------------------------------------------------------------------


def test_class_timetable_filters_match_every_period():
    code = _code("Pages/Principal/ClassTimetable/ClassTimetableList.jsx")
    assert "periodsOf(record).some" in code
    assert "pageRecords.map" in code


def test_routes_removed_by_the_snapshot_commit_are_back():
    coordinator = _read("Routes/CoordinatorRoutes.jsx")
    for path in ("/coordinator/student-placement", "/coordinator/student-placement/promote",
                 "/coordinator/class/class-timetable", "/coordinator/class/edit-class-timetable/:id"):
        assert f'path="{path}"' in coordinator, path
    assert "/director/class-timetable-approvals" in _sidebar_destinations("directorSidebarLinks")
    coordinator_menu = _sidebar_destinations("coordinatorSidebarLinks")
    assert "/coordinator/student-placement" in coordinator_menu
    assert "/coordinator/class/class-timetable" in coordinator_menu


def test_principal_edit_timetable_route_exists():
    assert 'path="/principal/edit-class-timetable/:id"' in _read("Routes/PrincipalRoutes.jsx")


def test_student_daily_timetable_reads_cells_by_slot_label():
    code = _code("Pages/Student/Class/TimeTableDetails.jsx")
    assert "schedule?.[slot.label]" in code
    assert "approved.length ? approved : timetables" not in code  # never fall back to unapproved


def test_weekly_timetable_dates_follow_the_weekday_name():
    assert "WEEKDAY_OFFSETS[" in _code("Pages/Student/Components/WeeklyTimetable.jsx")


def test_attendance_page_has_no_hardcoded_figures():
    code = _code("Pages/Student/Class/AttendanceDetails.jsx")
    assert "subjectWiseAttendance" not in code
    assert "May 2025" not in code
    assert ">22<" not in code and "81.82%" not in code


def test_biometric_saves_never_write_an_empty_list_before_loading():
    code = _code("Common/demoDomain/biometric.js")
    sync = code[code.index("export async function syncBiometricDemo") : code.index("export async function overrideAttendance")]
    assert "await persistRows()" in sync
    assert "if (!loaded)" in sync
    assert "if (!rows.length)" in sync
    override = code[code.index("export async function overrideAttendance") :]
    assert "await persistRows()" in override
    assert "if (!loaded)" in override
    assert "row.id === id" in override


def test_portal_profiles_keep_placement_status():
    # Without it every placed student saw "Awaiting section assignment" on timetable/attendance.
    assert "placementStatus: row.placementStatus" in _code("services/studentsApi.js").split("export function mapStudentListFromApi")[0]
    assert "placementStatus: row.placementStatus" in _code("services/parentsApi.js")


def test_lesson_plans_enter_approval_and_decisions_are_saved_on_the_server():
    code = _code("Common/LessonPlanApproval/lessonPlanApprovalData.js")
    add = code[code.index("export const addLessonPlan") : code.index("export const addLessonPlans")]
    # Draft is created, optional attachment uploaded, then the plan enters the approval chain.
    assert "createLessonPlanApi" in add
    assert "await submitLessonPlanApi(plan.id)" in add or "await submitLessonPlanApi(created.id)" in add
    assert "lesson-plan-attachment" in add or "LESSON_PLAN_ATTACHMENT_RESOURCE" in add
    decide = code[code.index("export const updateLessonPlanStatus") : code.index("export const getSummaryCounts")]
    assert "decideLessonPlanApi(plan.approvalId" in decide
    done = code[code.index("export const markLessonPlanAsDone") : code.index("export const emptyLessonPlanFilters")]
    assert "completeLessonPlanApi(id" in done
    assert "<LessonPlanTabs />" in _code("Pages/Teacher/LessonPlanApproval/SubmitLessonPlan.jsx")
    assert "<LessonPlanTabs />" in _code("Pages/Teacher/LessonPlanApproval/MyLessonPlan.jsx")


def test_star_of_month_matrix_saves_each_class_to_the_server():
    code = _code("Common/StudentStarRatings/somChecklist.js")
    upsert = code[code.index("export const upsertRating") : code.index("export const studentScore")]
    assert "pushContext(context)" in upsert
    assert "upsertOpsItemApi(collection, id, body)" in code
    assert "hydrateSomFromApi()" in _code("Common/StudentStarRatings/SomMatrixPage.jsx")
    assert "SOM_RATINGS = ['1', '2', '3', 'NA']" in code
    assert "'2.5'" not in code
    matrix = _code("Common/StudentStarRatings/SomMatrixPage.jsx")
    assert "downloadSomTemplateExcel" in matrix
    assert "previewSomImportFile" in matrix
    assert "som-matrix-doc" in matrix
    assert "Bulk upload" in _code("Common/StudentStarRatings/StarRatings.jsx")


def test_admission_form_round_trips_the_referral():
    code = _code("services/admissionsApi.js")
    assert "referral_name: String(form.referralName" in code
    assert "referralName: row.referral_name" in code
    assert "<ReferralInfo" in _code("Pages/Admin/FrontOffice/AdminssionList/AddAdmission.jsx")


def test_new_admin_pages_are_routed():
    admin = _read("Routes/AdminRoutes.jsx")
    assert 'path="/admin/file-management"' in admin and 'path="/admin/camera-management"' in admin
    assert 'path="/account-head/admission-referrals"' in _read("Routes/AccountHeadRoutes.jsx")


def test_notification_bell_links_only_to_existing_pages():
    code = _code("Common/CommonHeader/Components/UserNotifications.jsx")
    assert "NOTIFICATION_PAGE_SEGMENTS" in code
    assert "segment === 'dashboard'" in code


# --- client review R29: IT Add Request really saves ----------------------------------------------------

REQUEST_SCRIPT = """
const path = require('path');
const store = new Map();
globalThis.localStorage = { getItem: (k) => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)), removeItem: (k) => store.delete(k) };
globalThis.sessionStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
globalThis.window = globalThis;
globalThis.window.dispatchEvent = () => true;
const data = require(path.join(process.env.QMIS_SRC, 'Pages/ITSupportManager/RequestsApprovals/requestsData.js'));
(async () => {
  const before = data.getRequests().length;
  const missingType = data.validateRequestForm({ ...data.EMPTY_REQUEST_FORM, title: 't', description: 'd' });
  const first = await data.addRequest({ ...data.EMPTY_REQUEST_FORM, requestTypeFull: 'License Renewal', title: ' Adobe renewal ',
    description: 'Renew 10 seats', estimatedCost: 'Rs 50,000', quotationName: 'q.pdf', supportingNames: ['a.pdf'] }, { requestedBy: 'IT Desk' });
  const second = await data.addRequest({ ...data.EMPTY_REQUEST_FORM, requestTypeFull: 'Hardware Purchase', title: 'Mice', description: 'Twenty' });
  process.stdout.write(JSON.stringify({ before, missingType, first, second, after: data.getRequests().length,
    found: data.getRequestById(first.record.requestId) }));
})().catch((e) => { process.stderr.write(String((e && e.stack) || e)); process.exit(1); });
"""


@pytest.fixture(scope="module")
def request_results(tmp_path_factory):
    if not JITI:
        pytest.skip("Node / jiti not available")
    script = tmp_path_factory.mktemp("req") / "request_check.cjs"
    script.write_text(REQUEST_SCRIPT, encoding="utf-8")
    out = subprocess.run(
        ["node", str(JITI_CLI), str(script)],
        cwd=ROOT,
        env={**os.environ, "QMIS_SRC": str(SRC)},
        capture_output=True,
        text=True,
        timeout=120,
    )
    if out.returncode != 0:
        pytest.fail(out.stderr[-2000:])
    return json.loads(out.stdout)


def test_it_add_request_saves_a_numbered_pending_request(request_results):
    first = request_results["first"]
    assert first["success"] is True
    record = first["record"]
    assert re.fullmatch(r"REQ-IT-\d{4}-\d{3}", record["requestId"])
    assert record["title"] == "Adobe renewal" and record["requestType"] == "License"
    assert record["approvalStatus"] == "Pending" and record["requestedBy"] == "IT Desk"
    assert record["attachments"] == ["q.pdf", "a.pdf"]
    assert request_results["after"] == request_results["before"] + 2
    assert request_results["second"]["record"]["requestId"] != record["requestId"]
    assert request_results["found"]["requestId"] == record["requestId"]


def test_it_add_request_requires_a_type_title_and_description(request_results):
    assert request_results["missingType"] == "Select a request type."


def test_it_request_pages_save_and_read_saved_records():
    add = _code("Pages/ITSupportManager/RequestsApprovals/AddRequest.jsx")
    assert "await addRequest(form" in add and "setRequestModal(true)" in add
    assert add.index("await addRequest(form") < add.index("setRequestModal(true)")
    info = _code("Pages/ITSupportManager/RequestsApprovals/Components/RequestInfo.jsx")
    assert "defaultValue" not in info and "value={form.title}" in info
    view = _code("Pages/ITSupportManager/RequestsApprovals/ViewRequest.jsx")
    assert "hydrateRequestsFromApi()" in view
    data = _code("Pages/ITSupportManager/RequestsApprovals/requestsData.js")
    assert "getRequests().find((entry) => entry.requestId === id)" in data
    assert "REQUESTS.find(" not in data


# --- HK / Canteen Add Request really saves (same pattern as IT) ----------------------------------------

HK_REQUEST_SCRIPT = """
const path = require('path');
const store = new Map();
globalThis.localStorage = { getItem: (k) => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)), removeItem: (k) => store.delete(k) };
globalThis.sessionStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
globalThis.window = globalThis;
globalThis.window.dispatchEvent = () => true;
const data = require(path.join(process.env.QMIS_SRC, 'Pages/HousekeepingManager/RequestsApprovals/requestsData.js'));
(async () => {
  const before = data.getRequests().length;
  const missingType = data.validateRequestForm({ ...data.EMPTY_REQUEST_FORM, title: 't', description: 'd', priority: 'High' });
  const first = await data.addRequest({ ...data.EMPTY_REQUEST_FORM, requestType: 'Purchase', title: ' Mop heads ',
    description: 'Replace worn heads', priority: 'High', estimatedAmount: 'Rs 12,400', quotationName: 'q.pdf',
    supportingNames: ['a.pdf'], lineItems: [{ item: 'Mop Head', quantity: '40', estimatedCost: 'Rs 5,800' }] }, { requestedBy: 'HK Desk' });
  const second = await data.addRequest({ ...data.EMPTY_REQUEST_FORM, requestType: 'Stock Replenishment', title: 'Bags',
    description: 'Garbage bags', priority: 'Medium' });
  process.stdout.write(JSON.stringify({ before, missingType, first, second, after: data.getRequests().length,
    found: data.getRequestById(first.record.requestId) }));
})().catch((e) => { process.stderr.write(String((e && e.stack) || e)); process.exit(1); });
"""

CANTEEN_REQUEST_SCRIPT = """
const path = require('path');
const store = new Map();
globalThis.localStorage = { getItem: (k) => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)), removeItem: (k) => store.delete(k) };
globalThis.sessionStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
globalThis.window = globalThis;
globalThis.window.dispatchEvent = () => true;
const data = require(path.join(process.env.QMIS_SRC, 'Pages/CanteenManager/RequestsApprovals/requestsData.js'));
(async () => {
  const before = data.getRequests().length;
  const missingType = data.validateRequestForm({ ...data.EMPTY_REQUEST_FORM, title: 't', description: 'd', priority: 'High' });
  const first = await data.addRequest({ ...data.EMPTY_REQUEST_FORM, requestTypeFull: 'Stock Purchase', title: ' Rice restock ',
    description: 'Basmati rice', priority: 'High', estimatedAmount: 'Rs 45,000' }, { requestedBy: 'Canteen Desk' });
  const second = await data.addRequest({ ...data.EMPTY_REQUEST_FORM, requestTypeFull: 'Maintenance', title: 'Fridge gas',
    description: 'Refill', priority: 'Urgent' });
  process.stdout.write(JSON.stringify({ before, missingType, first, second, after: data.getRequests().length,
    found: data.getRequestById(first.record.requestId) }));
})().catch((e) => { process.stderr.write(String((e && e.stack) || e)); process.exit(1); });
"""


@pytest.fixture(scope="module")
def hk_request_results(tmp_path_factory):
    if not JITI:
        pytest.skip("Node / jiti not available")
    script = tmp_path_factory.mktemp("hkreq") / "hk_request_check.cjs"
    script.write_text(HK_REQUEST_SCRIPT, encoding="utf-8")
    out = subprocess.run(
        ["node", str(JITI_CLI), str(script)],
        cwd=ROOT,
        env={**os.environ, "QMIS_SRC": str(SRC)},
        capture_output=True,
        text=True,
        timeout=120,
    )
    if out.returncode != 0:
        pytest.fail(out.stderr[-2000:])
    return json.loads(out.stdout)


@pytest.fixture(scope="module")
def canteen_request_results(tmp_path_factory):
    if not JITI:
        pytest.skip("Node / jiti not available")
    script = tmp_path_factory.mktemp("cnreq") / "canteen_request_check.cjs"
    script.write_text(CANTEEN_REQUEST_SCRIPT, encoding="utf-8")
    out = subprocess.run(
        ["node", str(JITI_CLI), str(script)],
        cwd=ROOT,
        env={**os.environ, "QMIS_SRC": str(SRC)},
        capture_output=True,
        text=True,
        timeout=120,
    )
    if out.returncode != 0:
        pytest.fail(out.stderr[-2000:])
    return json.loads(out.stdout)


def test_hk_add_request_saves_a_numbered_pending_request(hk_request_results):
    first = hk_request_results["first"]
    assert first["success"] is True
    record = first["record"]
    assert re.fullmatch(r"REQ-HK-\d{4}-\d{3}", record["requestId"])
    assert record["title"] == "Mop heads" and record["requestType"] == "Purchase"
    assert record["status"] == "Pending" and record["requestedBy"] == "HK Desk"
    assert record["sentTo"] == "JD Operations"
    assert record["attachments"] == ["q.pdf", "a.pdf"]
    assert hk_request_results["after"] == hk_request_results["before"] + 2
    assert hk_request_results["second"]["record"]["requestId"] != record["requestId"]
    assert hk_request_results["found"]["requestId"] == record["requestId"]


def test_hk_add_request_requires_a_type_title_description_and_priority(hk_request_results):
    assert hk_request_results["missingType"] == "Select a request type."


def test_canteen_add_request_saves_a_numbered_pending_request(canteen_request_results):
    first = canteen_request_results["first"]
    assert first["success"] is True
    record = first["record"]
    assert re.fullmatch(r"REQ-CN-\d{4}-\d{3}", record["requestId"])
    assert record["title"] == "Rice restock" and record["requestType"] == "Stock"
    assert record["status"] == "Pending" and record["requestedBy"] == "Canteen Desk"
    assert canteen_request_results["after"] == canteen_request_results["before"] + 2
    assert canteen_request_results["found"]["requestId"] == record["requestId"]


def test_canteen_add_request_requires_a_type_title_description_and_priority(canteen_request_results):
    assert canteen_request_results["missingType"] == "Select a request type."


@pytest.mark.parametrize(
    "role_dir",
    [
        "HousekeepingManager",
        "CanteenManager",
    ],
)
def test_hk_canteen_request_pages_save_and_read_saved_records(role_dir):
    add = _code(f"Pages/{role_dir}/RequestsApprovals/AddRequest.jsx")
    assert "await addRequest(form" in add and "setRequestModal(true)" in add
    assert add.index("await addRequest(form") < add.index("setRequestModal(true)")
    info = _code(f"Pages/{role_dir}/RequestsApprovals/Components/RequestInfo.jsx")
    assert "defaultValue" not in info
    assert "value={form.title}" in info
    view = _code(f"Pages/{role_dir}/RequestsApprovals/ViewRequest.jsx")
    assert "hydrateRequestsFromApi()" in view
    assert "REQUESTS.find(" not in view
    data = _code(f"Pages/{role_dir}/RequestsApprovals/requestsData.js")
    assert "persistCampusJson" in data
    assert "export async function addRequest" in data
    assert "getRequests().find(" in data
    assert "REQUESTS.find(" not in data
    list_page = _code(f"Pages/{role_dir}/RequestsApprovals/RequestsApprovalsList.jsx")
    assert "Loading requests" in list_page
    assert "Could not load requests from the server" in list_page


# --- academic Phase 1: Mark Entry follows the server workflow -------------------------------------------

MARK_STATUS_SCRIPT = """
const path = require('path');
const s = require(path.join(process.env.QMIS_SRC, 'Common/MarkEntryApproval/markEntryStatus.js'));
const out = {
  statuses: ['draft', 'submitted', 'published', 'denied'].map((status) => s.mapBatchStatus({ status })),
  none: s.mapBatchStatus(null),
  exams: [null, { status: 'draft' }, { status: 'submitted', awaitingRole: 'director' }, { status: 'denied' }, { status: 'approved' }]
    .map((exam) => s.examEntryState(exam)),
  pending: s.batchStatusMessage({ source: 'api', status: 'submitted', approvalStatus: 'Pending', awaitingRole: 'principal' }),
  stuck: s.batchStatusMessage({ source: 'api', status: 'submitted', approvalStatus: 'Pending', awaitingRole: 'coordinator', awaitingEligibleApprover: true }),
  rejected: s.batchStatusMessage({ source: 'api', status: 'submitted', approvalStatus: 'Rejected', rejectionReason: 'Recheck Q3' }),
  revise: [s.needsRevision({ source: 'api', status: 'submitted', approvalStatus: 'Rejected' }),
           s.needsRevision({ source: 'api', status: 'submitted', approvalStatus: 'Pending' }),
           s.needsRevision({ source: 'local', status: 'submitted', approvalStatus: 'Rejected' })],
  latest: s.pickLatestBatch([{ id: 'v1', subject: 'Maths', section: 'A', version: 1 }, { id: 'v2', subject: 'Maths', section: 'A', version: 2 },
    { id: 'sci', subject: 'Science', section: 'A', version: 3 }, { id: 'b', subject: 'Maths', section: 'B', version: 4 }], { subject: 'Maths', section: 'A' }).id,
};
process.stdout.write(JSON.stringify(out));
"""


@pytest.fixture(scope="module")
def mark_status(tmp_path_factory):
    if not JITI:
        pytest.skip("Node / jiti not available")
    script = tmp_path_factory.mktemp("marks") / "mark_status.cjs"
    script.write_text(MARK_STATUS_SCRIPT, encoding="utf-8")
    out = subprocess.run(
        ["node", str(JITI_CLI), str(script)],
        cwd=ROOT,
        env={**os.environ, "QMIS_SRC": str(SRC)},
        capture_output=True,
        text=True,
        timeout=120,
    )
    if out.returncode != 0:
        pytest.fail(out.stderr[-2000:])
    return json.loads(out.stdout)


def test_a_denied_batch_shows_as_rejected_not_pending(mark_status):
    assert [s["approvalStatus"] for s in mark_status["statuses"]] == [None, "Pending", "Approved", "Rejected"]
    assert mark_status["none"] == {"status": "draft", "approvalStatus": None}


def test_entry_is_open_only_for_an_approved_exam_and_says_why_otherwise(mark_status):
    states = mark_status["exams"]
    assert [s["open"] for s in states] == [False, False, False, False, True]
    assert "not been submitted" in states[1]["reason"]
    assert "Director approves" in states[2]["reason"]
    assert "not approved" in states[3]["reason"]


def test_submitted_messages_name_the_current_step_and_the_rejection_reason(mark_status):
    assert "Principal" in mark_status["pending"] and "Director publishes" in mark_status["pending"]
    assert "administrator has been alerted" in mark_status["stuck"]
    assert "Recheck Q3" in mark_status["rejected"] and "Revise" in mark_status["rejected"]
    assert mark_status["revise"] == [True, False, False]
    assert mark_status["latest"] == "v2"


def test_mark_entry_page_uses_the_demo_closure_gate_only_without_the_server():
    code = _code("Common/MarkEntryApproval/MarkEntryPage.jsx")
    assert "{!api && <EntryClosureGate" in code
    assert code.count("entryBlocked('Mark Entry'") == code.count("!api && entryBlocked('Mark Entry'") == 2
    assert "if (api && !examState.open)" in code and "reviseMarksBatchApi(session.batchId)" in code
    assert code.index("if (api && !examState.open)") < code.index("if (!className || !section || !subject)")
    assert "listSectionNamesForClassApi(examClassName)" in code and "subjectOptions.map(" in code
    assert "disabled={Boolean(selectedExam?.className)}" in code
    assert "const mapBatchStatus" not in code  # the rules live in markEntryStatus.js
    api = _code("services/examsApi.js")
    assert "approvalId: row.approvalId" in api and "awaitingRole: row.awaitingRole" in api


# --- academic Phase 2: approval screens for Coordinator / Principal / Director --------------------------

STEP_SCRIPT = """
const path = require('path');
const s = require(path.join(process.env.QMIS_SRC, 'Common/Approvals/approvalStep.js'));
const item = (o) => ({ approvalStatus: 'Pending', approvalId: 'A1', awaitingRole: 'coordinator', submitterEmail: 'teacher@qmis.edu', ...o });
process.stdout.write(JSON.stringify({
  roles: ['/coordinator/mark-entry-approval', '/principal/lesson-plan-approval/group/x/y', '/director/x', '/teacher/x', ''].map(s.approverRoleForPath),
  mineStep: s.stepAction(item(), 'coordinator', 'coordinator@qmis.edu'),
  otherStep: s.stepAction(item(), 'principal', 'principal@qmis.edu'),
  own: s.stepAction(item({ submitterEmail: 'Coordinator@QMIS.edu' }), 'coordinator', 'coordinator@qmis.edu'),
  decided: s.stepAction(item({ approvalStatus: 'Approved' }), 'coordinator', 'x@y'),
  notSubmitted: s.stepAction(item({ approvalId: null }), 'coordinator', 'x@y'),
  event: s.describeEvent({ actorRole: 'principal', action: 'deny', comment: 'Recheck' }),
}));
"""


@pytest.fixture(scope="module")
def step_results(tmp_path_factory):
    if not JITI:
        pytest.skip("Node / jiti not available")
    script = tmp_path_factory.mktemp("step") / "step_check.cjs"
    script.write_text(STEP_SCRIPT, encoding="utf-8")
    out = subprocess.run(
        ["node", str(JITI_CLI), str(script)],
        cwd=ROOT,
        env={**os.environ, "QMIS_SRC": str(SRC)},
        capture_output=True,
        text=True,
        timeout=120,
    )
    if out.returncode != 0:
        pytest.fail(out.stderr[-2000:])
    return json.loads(out.stdout)


def test_buttons_show_only_for_the_waiting_role_and_never_for_your_own_submission(step_results):
    assert step_results["roles"] == ["coordinator", "principal", "director", "", ""]
    assert step_results["mineStep"]["canAct"] is True
    assert step_results["otherStep"] == {"canAct": False, "note": "Waiting for the Coordinator."}
    assert step_results["own"]["canAct"] is False and "own submission" in step_results["own"]["note"]
    assert step_results["decided"]["canAct"] is False and step_results["notSubmitted"]["canAct"] is False
    assert step_results["event"] == "Principal rejected: Recheck"


def test_coordinator_and_principal_have_marks_and_lesson_plan_approval_routes():
    coordinator = _read("Routes/CoordinatorRoutes.jsx")
    principal = _read("Routes/PrincipalRoutes.jsx")
    for path in (
        "/coordinator/student-evaluation/mark-entry-approval",
        "/coordinator/student-evaluation/mark-entry-approval/review/:contextKey",
        "/coordinator/lesson-plan-review",
        "/coordinator/lesson-plan-review/group/:teacherName/:subject",
    ):
        assert f'path="{path}"' in coordinator, path
    for path in (
        "/principal/mark-entry-approval",
        "/principal/mark-entry-approval/review/:contextKey",
        "/principal/lesson-plan-approval",
        "/principal/lesson-plan-approval/group/:teacherName/:subject",
    ):
        assert f'path="{path}"' in principal, path
    for export, path in (
        ("coordinatorSidebarLinks", "/coordinator/student-evaluation/mark-entry-approval"),
        ("coordinatorSidebarLinks", "/coordinator/lesson-plan-review"),
        ("principalSidebarLinks", "/principal/mark-entry-approval"),
        ("principalSidebarLinks", "/principal/lesson-plan-approval"),
    ):
        assert path in _sidebar_destinations(export), path


def test_every_approver_uses_the_shared_role_aware_screens():
    for role in ("Director", "Principal", "Coordinator"):
        assert "MarkApprovalListPage" in _code(f"Pages/{role}/MarkEntryApproval/MarkEntryApproval.jsx")
        assert "MarkApprovalReviewPage" in _code(f"Pages/{role}/MarkEntryApproval/MarkEntryReview.jsx")
    review = _code("Common/MarkEntryApproval/MarkApprovalReviewPage.jsx")
    assert "stepAction(session, role, email)" in review and "{action.canAct ? (" in review
    assert "<ApprovalHistory approvalId={session.approvalId} />" in review
    detail = _code("Common/LessonPlanApproval/Components/LessonPlanGroupDetail.jsx")
    assert "'director-approval'" not in detail
    assert "variant === 'approval' && actionFor(plan).canAct" in detail
    assert "approvalStatus === 'Draft'" not in detail  # drafts never reach an approver
    data = _code("Common/MarkEntryApproval/markEntryApprovalData.js")
    assert "awaitingRole: batch.awaitingRole" in data and "submitterEmail: batch.teacherEmail" in data


# --- academic Phase 3: real results and exam schedules for students and parents ------------------------

RESULTS_SCRIPT = """
const path = require('path');
const v = require(path.join(process.env.QMIS_SRC, 'Common/Results/studentResultsView.js'));
const s = require(path.join(process.env.QMIS_SRC, 'Common/Results/examScheduleView.js'));
const payload = { exams: [
  { examId: 'E1', examName: 'Midterm', examType: 'MIDTERM', total: 71, maxTotal: 100, percentage: 71,
    subjects: [{ subject: 'Maths', marks: 41, maxMarks: 50, absent: false, remarks: 'Good' },
               { subject: 'Science', marks: 30, maxMarks: 50, absent: false, remarks: '' },
               { subject: 'English', marks: null, maxMarks: 50, absent: true }] },
  { examId: 'E2', examName: 'Unit Test', examType: 'CA', total: 10, maxTotal: 40, percentage: 25,
    subjects: [{ subject: 'Maths', marks: 10, maxMarks: 40, absent: false }] } ], weighted: null };
const rows = v.buildResultRows(payload);
const exams = [
  { id: 'a', name: 'G7 approved', className: 'Grade 7', status: 'approved', startDate: '2026-11-20', endDate: '2026-11-24' },
  { id: 'b', name: 'G7 pending', className: 'Grade 7', status: 'submitted', startDate: '2026-11-01', endDate: '2026-11-02' },
  { id: 'c', name: 'G8 approved', className: 'Grade 8', status: 'approved', startDate: '2026-11-05', endDate: '2026-11-06' },
  { id: 'd', name: 'VII approved', className: 'VII', status: 'approved', startDate: '2026-10-01', endDate: '2026-10-02' } ];
process.stdout.write(JSON.stringify({
  rows,
  summary: v.buildResultSummary(payload, rows),
  weighted: v.buildResultSummary({ ...payload, weighted: { finalPercentage: 62.5, complete: false } }, rows),
  empty: v.buildResultSummary({ exams: [] }),
  bands: v.bandCounts(rows).map((b) => [b.label, b.subjects]),
  schedule: s.examRowsForStudent(exams, 'Grade 7').map((r) => r.examId),
  inRange: [s.inDateRange('2026-11-20', new Date(2026, 10, 20), null), s.inDateRange('2026-11-20', null, new Date(2026, 10, 19))],
}));
"""


@pytest.fixture(scope="module")
def results_view(tmp_path_factory):
    if not JITI:
        pytest.skip("Node / jiti not available")
    script = tmp_path_factory.mktemp("results") / "results_check.cjs"
    script.write_text(RESULTS_SCRIPT, encoding="utf-8")
    out = subprocess.run(
        ["node", str(JITI_CLI), str(script)],
        cwd=ROOT,
        env={**os.environ, "QMIS_SRC": str(SRC)},
        capture_output=True,
        encoding="utf-8",
        timeout=120,
    )
    if out.returncode != 0:
        pytest.fail(out.stderr[-2000:])
    return json.loads(out.stdout)


def test_result_rows_use_the_existing_grade_and_pass_rules(results_view):
    by_key = {(r["examName"], r["subject"]): r for r in results_view["rows"]}
    maths = by_key[("Midterm", "Maths")]
    assert (maths["percentage"], maths["grade"], maths["resultStatus"], maths["teacherRemarks"]) == ("82%", "A", "Pass", "Good")
    assert by_key[("Midterm", "English")]["resultStatus"] == "Absent" and by_key[("Midterm", "English")]["grade"] == "—"
    assert by_key[("Unit Test", "Maths")]["resultStatus"] == "Fail"  # 25% is below the 33% pass mark


def test_summary_is_computed_from_published_marks_or_the_configured_weightage(results_view):
    summary = results_view["summary"]
    assert summary["examAppeared"] == 2
    assert summary["overallPercent"] == round(81 / 140 * 100, 2) and summary["overallBasis"] == "All published marks"
    assert summary["highestMark"] == "41/50" and summary["overallGrade"] == "C"  # 57.86 % under the existing bands
    weighted = results_view["weighted"]
    assert weighted["overallPercent"] == 62.5 and "not all exam types" in weighted["overallBasis"]
    empty = results_view["empty"]
    assert empty["overallPercent"] is None and empty["overallGrade"] == "—" and empty["highestMark"] == "—"
    assert dict(results_view["bands"]) == {"Excellent": 0, "Very Good": 1, "Good": 1, "Need Improvement": 1}


def test_schedule_shows_only_approved_exams_for_the_active_childs_class(results_view):
    assert results_view["schedule"] == ["d", "a"]  # Grade 7 and "VII" are the same grade; earliest first
    assert results_view["inRange"] == [True, False]


def test_no_hardcoded_result_figures_or_demo_class_bypass_remain():
    for rel in ("Pages/Student/Results/ResultDetails.jsx", "Pages/Teacher/StudentsList/ViewStudent.jsx"):
        assert "80.25" not in _code(rel), rel
    result = _code("Pages/Student/Results/ResultDetails.jsx")
    assert "getStudentResultsApi" in result and "buildSummaryFromRows" in result
    assert "subjects: 1, color" not in result
    schedule = _code("Pages/Student/StudentEvaluation/ExamSchedule.jsx")
    assert "loadMergedExamRecords()" in schedule and "filterPortalExams" in schedule
    assert "Keep showing campus approved schedules" not in schedule
    assert "<StudentResultDetails studentId={student.id || id} />" in _code("Pages/Teacher/StudentsList/ViewStudent.jsx")


# --- #38a list Search / Filters must shrink the table ---------------------------------------


@pytest.mark.parametrize(
    "rel",
    [
        "Pages/Gatekeeper/GatePass/GatePassList.jsx",
        "Pages/JointDirectorAudit/AuditPlanning/AuditPlanningList.jsx",
        # Batch #38a wires (this pass) — at least three newly shared-helper imports.
        "Pages/ITSupportManager/SupportTickets/SupportTicketsList.jsx",
        "Pages/StationeryStoreManager/Inventory/Inventory.jsx",
        "Pages/FrontOffice/MaterialGatePass/MaterialGatePassList.jsx",
        "Pages/FrontOffice/GoodsReceivedPass/GoodsReceivedPassList.jsx",
        "Pages/Librarian/BookManagement/BookList/BookList.jsx",
        "Pages/Admin/Components/AdminLiveDataList.jsx",
        "Pages/JointDirectorAudit/AuditConfiguration/AuditTemplates/AuditTemplatesList.jsx",
        "Pages/JointDirectorAudit/AuditConfiguration/QuestionBank/QuestionBankList.jsx",
        "Pages/JointDirectorAudit/AuditConfiguration/ScoringRules/ScoringRulesList.jsx",
        "Pages/JointDirectorAudit/AuditConfiguration/TemplateVersioning/TemplateVersioningList.jsx",
    ],
)
def test_inert_search_pages_wire_filter_list_rows(rel):
    code = _code(rel)
    assert "filterListRows" in code
    assert "setSearch" in code
    assert "filtered" in code.lower()


def test_super_admin_gate_pass_date_filters_are_applied():
    data = _code("Pages/SuperAdmin/GatePass/gatePassData.js")
    assert "fromDate" in data and "toDate" in data
    list_page = _code("Pages/SuperAdmin/GatePass/GatePassList.jsx")
    assert "fromDate, toDate" in list_page or "fromDate,toDate" in list_page.replace(" ", "")


def test_list_filtering_helper_node_unit_suite():
    """Pure helper coverage via `node --test` (no React)."""
    node = shutil.which("node")
    if not node:
        pytest.skip("Node is not available")
    suite = SRC / "Common" / "listFiltering.test.mjs"
    assert suite.is_file()
    result = subprocess.run(
        [node, "--test", str(suite)],
        cwd=ROOT,
        capture_output=True,
        text=True,
        timeout=60,
    )
    assert result.returncode == 0, result.stdout + result.stderr
