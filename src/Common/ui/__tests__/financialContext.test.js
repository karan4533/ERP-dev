import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

import { createFinancialContext } from '../../Finance/financialContext.js'
import { applyFinanceApprovalDecision } from '../../../Pages/AccountHead/Approvals/financeApprovalState.js'
import { postJournalVouchers } from '../../../Pages/AccountHead/Accounting/Components/journalVoucherState.js'

test('financial context exposes period, lock, source and integration provenance', () => {
    assert.deepEqual(createFinancialContext({
        period: 'September 2026',
        lockState: 'Open',
        source: 'Browser demonstration ledger',
        integration: 'Disconnected',
    }), {
        period: 'September 2026',
        lockState: 'Open',
        source: 'Browser demonstration ledger',
        integration: 'Disconnected',
    })
})

test('financial context fails closed when required provenance is absent', () => {
    const context = createFinancialContext({})
    assert.equal(context.period, 'Period not selected')
    assert.equal(context.lockState, 'Unknown lock state')
    assert.equal(context.source, 'Source not connected')
    assert.equal(context.integration, 'Disconnected')
})

test('finance and payroll layouts render the shared context strip', () => {
    const accountLayout = readFileSync(new URL('../../../Layout/AccountHeadLayout.jsx', import.meta.url), 'utf8')
    const hrLayout = readFileSync(new URL('../../../Layout/HRLayout.jsx', import.meta.url), 'utf8')
    assert.match(accountLayout, /FinancialContextBar/)
    assert.match(hrLayout, /FinancialContextBar/)
    assert.match(hrLayout, /pathname\.startsWith\('\/hr\/payroll'\)/)
})

test('payroll and finance approvals distinguish every transaction stage', () => {
    const flow = readFileSync(new URL('../../Finance/FinancialActionFlow.jsx', import.meta.url), 'utf8')
    const payroll = readFileSync(new URL('../../../Pages/HR/Payroll/Payroll.jsx', import.meta.url), 'utf8')
    const approvals = readFileSync(new URL('../../../Pages/AccountHead/Approvals/Approvals.jsx', import.meta.url), 'utf8')
    for (const stage of ['Calculate', 'Review', 'Approve', 'Post', 'Pay', 'Reverse']) {
        assert.match(flow, new RegExp(`'${stage}'`))
    }
    assert.match(payroll, /FinancialActionFlow/)
    assert.match(approvals, /FinancialActionFlow/)
})

test('finance approval decisions require governed rejection rationale', () => {
    const rows = [{ id: 'APR-1', status: 'Pending' }]
    assert.throws(
        () => applyFinanceApprovalDecision(rows, 'APR-1', 'Rejected', { remarks: ' ' }),
        /rationale/i,
    )
    const approved = applyFinanceApprovalDecision(rows, 'APR-1', 'Approved', {
        actor: 'Vikram Shah',
        decidedAt: '2026-10-28T10:00:00.000Z',
    })
    assert.equal(approved[0].status, 'Approved')
    assert.equal(approved[0].decision.actor, 'Vikram Shah')
    assert.equal(rows[0].status, 'Pending')
})

test('finance approval workspace uses shared responsive and confirmation primitives', () => {
    const source = readFileSync(new URL('../../../Pages/AccountHead/Approvals/Approvals.jsx', import.meta.url), 'utf8')
    assert.match(source, /<DataTable/)
    assert.match(source, /<ConfirmAction/)
    assert.match(source, /<Pagination/)
    assert.doesNotMatch(source, /ExportModal/)
    assert.doesNotMatch(source, /fixed inset-0/)
})

test('payroll payment recording is explicit, confirmed and honest about bank connectivity', () => {
    const payroll = readFileSync(new URL('../../../Pages/HR/Payroll/Payroll.jsx', import.meta.url), 'utf8')
    assert.match(payroll, /<IntegrationNotice/)
    assert.match(payroll, /<ConfirmAction/)
    assert.match(payroll, /<DataTable/)
    assert.match(payroll, /Record demo payment/)
    assert.match(payroll, /No bank or payment API is connected/)
    assert.doesNotMatch(payroll, />Mark as Paid</)
})

test('finance dashboard uses responsive tables and labels local versus sample data', () => {
    const dashboard = readFileSync(new URL('../../../Pages/AccountHead/Dashboard/Dashboard.jsx', import.meta.url), 'utf8')
    assert.match(dashboard, /<PageHeader/)
    assert.match(dashboard, /<IntegrationNotice/)
    assert.match(dashboard, /<DataTable/)
    assert.match(dashboard, /Browser-stored receipts/)
    assert.match(dashboard, /Export unavailable/)
    assert.doesNotMatch(dashboard, /Real-time overview/)
    assert.doesNotMatch(dashboard, /ExportModal/)
    assert.doesNotMatch(dashboard, /<Dropdown/)
    assert.doesNotMatch(dashboard, /<DatePicker/)
    assert.doesNotMatch(dashboard, /MoreVertical/)
    assert.doesNotMatch(dashboard, /RECENT_COLLECTIONS/)
})

test('finance analytics labels reference data and removes non-functional report controls', () => {
    const reports = readFileSync(new URL('../../../Pages/AccountHead/ReportsAnalytics/ReportsAnalytics.jsx', import.meta.url), 'utf8')
    const shared = readFileSync(new URL('../../../Pages/AccountHead/ReportsAnalytics/Components/ReportsShared.jsx', import.meta.url), 'utf8')
    const income = readFileSync(new URL('../../../Pages/AccountHead/ReportsAnalytics/Components/IncomeReportsTab.jsx', import.meta.url), 'utf8')
    const expenditure = readFileSync(new URL('../../../Pages/AccountHead/ReportsAnalytics/Components/ExpenditureReportsTab.jsx', import.meta.url), 'utf8')
    assert.match(reports, /<PageHeader/)
    assert.match(reports, /<IntegrationNotice/)
    assert.match(reports, /Sample analytics dataset/)
    assert.match(reports, /Export unavailable/)
    assert.doesNotMatch(reports, /ExportModal/)
    assert.doesNotMatch(reports, /REPORTS_PERIODS/)
    assert.doesNotMatch(shared, /<button/)
    assert.doesNotMatch(income, />\s*Export\s*</)
    assert.doesNotMatch(expenditure, />\s*Export\s*</)
})

test('payment vouchers are responsive, printable records and MFP stays specification-gated', () => {
    const vouchers = readFileSync(new URL('../../../Pages/AccountHead/PaymentVouchers/PaymentVouchers.jsx', import.meta.url), 'utf8')
    const routes = readFileSync(new URL('../../../Routes/AccountHeadRoutes.jsx', import.meta.url), 'utf8')
    const demoScreens = readFileSync(new URL('../../demoDomain/DemoScreens.jsx', import.meta.url), 'utf8')
    assert.match(vouchers, /<PageHeader/)
    assert.match(vouchers, /<IntegrationNotice/)
    assert.match(vouchers, /<DataTable/)
    assert.match(vouchers, /openPrintDocument/)
    assert.doesNotMatch(vouchers, /<table\s+className/)
    assert.doesNotMatch(vouchers, /window\.print/)
    assert.match(routes, /account-head\/mfp.*MfpPlaceholder/)
    assert.match(demoScreens, /MFP report is awaiting specification/)
    assert.match(demoScreens, /measures, filters, approval rules, and export format/)
})

test('journal posting fails closed when no specific voucher is selected', () => {
    const vouchers = [{ id: 'JV-1', status: 'Draft' }, { id: 'JV-2', status: 'Pending Approval' }]
    const unchanged = postJournalVouchers(vouchers, null)
    assert.deepEqual(unchanged, vouchers)
    assert.equal(unchanged[0].status, 'Draft')
})

test('accounting shell and reconciliation expose honest integrations and governed decisions', () => {
    const accounting = readFileSync(new URL('../../../Pages/AccountHead/Accounting/Accounting.jsx', import.meta.url), 'utf8')
    const reconciliation = readFileSync(new URL('../../../Pages/AccountHead/Accounting/Components/BankReconciliationTab.jsx', import.meta.url), 'utf8')
    const drawer = readFileSync(new URL('../../../Pages/AccountHead/Accounting/Components/ReconciliationDrawer.jsx', import.meta.url), 'utf8')
    assert.match(accounting, /<PageHeader/)
    assert.match(accounting, /<IntegrationNotice/)
    assert.match(accounting, /<ConfirmAction/)
    assert.match(accounting, /Export unavailable/)
    assert.match(accounting, /Sync unavailable/)
    assert.match(accounting, /Import unavailable/)
    assert.match(accounting, /Run local match rules/)
    assert.doesNotMatch(accounting, /ExportModal/)
    assert.doesNotMatch(accounting, /window\.print/)
    assert.doesNotMatch(accounting, />Sync Transactions</)
    assert.doesNotMatch(accounting, />Import Bank Statement</)
    assert.match(reconciliation, /<DataTable/)
    assert.match(reconciliation, /<ConfirmAction/)
    assert.doesNotMatch(reconciliation, /<table\s+className/)
    assert.match(drawer, /<Drawer/)
    assert.match(drawer, /<ConfirmAction/)
    assert.doesNotMatch(drawer, /fixed inset-0/)
})

test('fees shell labels browser data and removes simulated bulk and file actions', () => {
    const fees = readFileSync(new URL('../../../Pages/AccountHead/FeesManagement/FeesManagement.jsx', import.meta.url), 'utf8')
    const concessions = readFileSync(new URL('../../../Pages/AccountHead/FeesManagement/Components/ConcessionsWaiversTab.jsx', import.meta.url), 'utf8')
    const defaulters = readFileSync(new URL('../../../Pages/AccountHead/FeesManagement/Components/DefaultersTab.jsx', import.meta.url), 'utf8')
    const receipts = readFileSync(new URL('../../../Pages/AccountHead/FeesManagement/Components/ReceiptManagementTab.jsx', import.meta.url), 'utf8')
    assert.match(fees, /<PageHeader/)
    assert.match(fees, /<IntegrationNotice/)
    assert.match(fees, /<DataTable/)
    assert.match(fees, /Import unavailable/)
    assert.match(fees, /Export unavailable/)
    assert.match(fees, /Reminder unavailable/)
    assert.doesNotMatch(fees, /ExportModal/)
    assert.doesNotMatch(fees, /toast\.info/)
    assert.doesNotMatch(fees, /<table\s+className/)
    assert.doesNotMatch(concessions, /ExportModal/)
    assert.doesNotMatch(defaulters, /ExportModal/)
    assert.doesNotMatch(receipts, /ExportModal/)
})

test('fee collection removes mock gateways and confirms local collection mutations', () => {
    const collection = readFileSync(new URL('../../../Pages/AccountHead/FeesManagement/Components/FeeCollectionTab.jsx', import.meta.url), 'utf8')
    const payment = readFileSync(new URL('../../../Pages/AccountHead/FeesManagement/Components/FeePaymentModal.jsx', import.meta.url), 'utf8')
    const receipt = readFileSync(new URL('../../../Pages/AccountHead/FeesManagement/Components/ReceiptDetailsDrawer.jsx', import.meta.url), 'utf8')
    assert.match(collection, /Payment link unavailable/)
    assert.match(collection, /openPrintDocument/)
    assert.doesNotMatch(collection, /CheckoutMockModal/)
    assert.doesNotMatch(collection, /PaymentLinkModal/)
    assert.doesNotMatch(collection, /generatePaymentLink/)
    assert.doesNotMatch(collection, /window\.print/)
    assert.match(payment, /<Dialog/)
    assert.match(payment, /<ConfirmAction/)
    assert.match(payment, /Review collection/)
    assert.doesNotMatch(payment, /fixed inset-0/)
    assert.match(receipt, /Delivery unavailable/)
    assert.doesNotMatch(receipt, /Mock email sent/)
    assert.doesNotMatch(receipt, /Demo WhatsApp delivery/)
})

test('collections separate browser transactions from sample analytics and use responsive records', () => {
    const collections = readFileSync(new URL('../../../Pages/AccountHead/Collections/Collections.jsx', import.meta.url), 'utf8')
    const moneyIn = readFileSync(new URL('../../../Pages/AccountHead/Collections/Components/MoneyInTab.jsx', import.meta.url), 'utf8')
    const moneyOut = readFileSync(new URL('../../../Pages/AccountHead/Collections/Components/MoneyOutTab.jsx', import.meta.url), 'utf8')
    assert.match(collections, /<PageHeader/)
    assert.match(collections, /<IntegrationNotice/)
    assert.match(collections, /Export unavailable/)
    assert.doesNotMatch(collections, /ExportModal/)
    assert.match(moneyIn, /Browser-stored inflows/)
    assert.match(moneyIn, /Sample income reference/)
    assert.match(moneyIn, /<DataTable/)
    assert.doesNotMatch(moneyIn, /\.\.\.liveRows, \.\.\.INCOME_REGISTER/)
    assert.doesNotMatch(moneyIn, /<table\s+className/)
    assert.match(moneyOut, /Sample expense reference/)
    assert.match(moneyOut, /<DataTable/)
    assert.doesNotMatch(moneyOut, /<table\s+className/)
})

test('wallet credits are local, confirmed and never redirect to a fake gateway', () => {
    const wallet = readFileSync(new URL('../../../Pages/AccountHead/WalletManagement/WalletManagement.jsx', import.meta.url), 'utf8')
    const recharge = readFileSync(new URL('../../../Pages/AccountHead/WalletManagement/Components/RechargeWalletModal.jsx', import.meta.url), 'utf8')
    const users = readFileSync(new URL('../../../Pages/AccountHead/WalletManagement/Components/UserWalletsTab.jsx', import.meta.url), 'utf8')
    const rechargeRecords = readFileSync(new URL('../../../Pages/AccountHead/WalletManagement/Components/RechargeRecordsTab.jsx', import.meta.url), 'utf8')
    const spending = readFileSync(new URL('../../../Pages/AccountHead/WalletManagement/Components/SpendingHistoryTab.jsx', import.meta.url), 'utf8')
    const options = readFileSync(new URL('../../../Pages/AccountHead/WalletManagement/Components/RechargeOptionsTab.jsx', import.meta.url), 'utf8')
    const data = readFileSync(new URL('../../../Pages/AccountHead/WalletManagement/walletManagementData.js', import.meta.url), 'utf8')
    assert.match(wallet, /<PageHeader/)
    assert.match(wallet, /<IntegrationNotice/)
    assert.match(wallet, /Export unavailable/)
    assert.match(wallet, /Record wallet credit/)
    assert.doesNotMatch(wallet, /ExportModal/)
    assert.doesNotMatch(wallet, /AddRechargeMethodModal/)
    assert.match(recharge, /<Dialog/)
    assert.match(recharge, /<ConfirmAction/)
    assert.match(recharge, /Confirm local credit/)
    assert.doesNotMatch(recharge, /PAYMENT_GATEWAY_URL/)
    assert.doesNotMatch(recharge, /window\.open/)
    assert.doesNotMatch(recharge, /setTimeout/)
    assert.doesNotMatch(recharge, /fixed inset-0/)
    assert.match(users, /<DataTable/)
    assert.match(users, /matchesWalletRole\(row\.role, initialRole\)/)
    assert.doesNotMatch(users, /<table\s+className/)
    assert.match(data, /Students: 'Student'/)
    assert.match(data, /Parents: 'Parent'/)
    assert.match(wallet, /RechargeRecordsTab rechargeRecords=\{rechargeRecords\} initialRole=\{roleFilter\}/)
    assert.match(wallet, /SpendingHistoryTab initialRole=\{roleFilter\}/)
    assert.match(rechargeRecords, /<IntegrationNotice/)
    assert.match(rechargeRecords, /<DataTable/)
    assert.doesNotMatch(rechargeRecords, /<table\s+className/)
    assert.match(spending, /<IntegrationNotice/)
    assert.match(spending, /<DataTable/)
    assert.doesNotMatch(spending, /<table\s+className/)
    assert.match(options, /<DataTable/)
    assert.match(options, /Configuration unavailable/)
    assert.doesNotMatch(options, /AddRechargeMethodModal/)
})

test('transport finance uses responsive registers and honest local-only workflows', () => {
    const shell = readFileSync(new URL('../../../Pages/AccountHead/TransportFinance/TransportFinance.jsx', import.meta.url), 'utf8')
    const fleet = readFileSync(new URL('../../../Pages/AccountHead/TransportFinance/Components/FleetServiceTab.jsx', import.meta.url), 'utf8')
    const maintenance = readFileSync(new URL('../../../Pages/AccountHead/TransportFinance/Components/MaintenanceDamageTab.jsx', import.meta.url), 'utf8')
    const compliance = readFileSync(new URL('../../../Pages/AccountHead/TransportFinance/Components/ComplianceTab.jsx', import.meta.url), 'utf8')
    const claims = readFileSync(new URL('../../../Pages/AccountHead/TransportFinance/Components/FuelExpenseClaimsTab.jsx', import.meta.url), 'utf8')
    const payroll = readFileSync(new URL('../../../Pages/AccountHead/TransportFinance/Components/StaffSalariesTab.jsx', import.meta.url), 'utf8')
    const addVehicle = readFileSync(new URL('../../../Pages/AccountHead/TransportFinance/Components/AddVehicleModal.jsx', import.meta.url), 'utf8')
    const logDamage = readFileSync(new URL('../../../Pages/AccountHead/TransportFinance/Components/LogDamageModal.jsx', import.meta.url), 'utf8')
    assert.match(shell, /<PageHeader/)
    assert.match(shell, /<IntegrationNotice/)
    assert.match(shell, /Export unavailable/)
    assert.doesNotMatch(shell, /ExportModal/)
    for (const register of [fleet, maintenance, compliance, claims, payroll]) {
        assert.match(register, /<DataTable/)
        assert.match(register, /<IntegrationNotice/)
        assert.doesNotMatch(register, /<table\s+className/)
    }
    assert.match(addVehicle, /<Dialog/)
    assert.match(addVehicle, /<ConfirmAction/)
    assert.match(addVehicle, /Confirm local vehicle/)
    assert.doesNotMatch(addVehicle, /fixed inset-0/)
    assert.match(logDamage, /<Dialog/)
    assert.match(logDamage, /<ConfirmAction/)
    assert.match(logDamage, /Confirm local record/)
    assert.doesNotMatch(logDamage, /fixed inset-0/)
    assert.match(payroll, /Run payroll unavailable/)
    assert.doesNotMatch(payroll, /toast\./)
    assert.doesNotMatch(claims, />Export</)
    assert.doesNotMatch(compliance, />Export</)
})

test('finance settings distinguish local preferences from unavailable authoritative configuration', () => {
    const shell = readFileSync(new URL('../../../Pages/AccountHead/Settings/Settings.jsx', import.meta.url), 'utf8')
    const general = readFileSync(new URL('../../../Pages/AccountHead/Settings/Components/GeneralTab.jsx', import.meta.url), 'utf8')
    const payment = readFileSync(new URL('../../../Pages/AccountHead/Settings/Components/PaymentConfigurationTab.jsx', import.meta.url), 'utf8')
    const notifications = readFileSync(new URL('../../../Pages/AccountHead/Settings/Components/NotificationsTab.jsx', import.meta.url), 'utf8')
    const integrations = readFileSync(new URL('../../../Pages/AccountHead/Settings/Components/IntegrationsTab.jsx', import.meta.url), 'utf8')
    const registers = [
        readFileSync(new URL('../../../Pages/AccountHead/Settings/Components/FineRulesTab.jsx', import.meta.url), 'utf8'),
        readFileSync(new URL('../../../Pages/AccountHead/Settings/Components/BankAccountsTab.jsx', import.meta.url), 'utf8'),
        readFileSync(new URL('../../../Pages/AccountHead/Settings/Components/PosTerminalsTab.jsx', import.meta.url), 'utf8'),
        readFileSync(new URL('../../../Pages/AccountHead/Settings/Components/RolesPermissionsTab.jsx', import.meta.url), 'utf8'),
        integrations,
    ]
    assert.match(shell, /<PageHeader/)
    assert.match(shell, /<IntegrationNotice/)
    assert.match(shell, /Save unavailable/)
    for (const register of registers) {
        assert.match(register, /<DataTable/)
        assert.doesNotMatch(register, /<table\s+className/)
    }
    assert.match(general, /<ConfirmAction/)
    assert.doesNotMatch(general, /window\.confirm/)
    assert.match(payment, /<IntegrationNotice/)
    assert.match(notifications, /<IntegrationNotice/)
    assert.match(integrations, /Configuration unavailable/)
})

test('HR foundation uses shared provenance, dialog, status and responsive records', () => {
    const layout = readFileSync(new URL('../../../Layout/HRLayout.jsx', import.meta.url), 'utf8')
    const shared = readFileSync(new URL('../../../Pages/HR/components/HrUi.jsx', import.meta.url), 'utf8')
    const dashboard = readFileSync(new URL('../../../Pages/HR/Dashboard/Dashboard.jsx', import.meta.url), 'utf8')
    const attendance = readFileSync(new URL('../../../Pages/HR/Attendance/Attendance.jsx', import.meta.url), 'utf8')
    const reports = readFileSync(new URL('../../../Pages/HR/Reports/Reports.jsx', import.meta.url), 'utf8')
    assert.match(layout, /<IntegrationNotice/)
    assert.match(shared, /<Dialog/)
    assert.match(shared, /<StatusBadge/)
    assert.doesNotMatch(shared, /fixed inset-0/)
    for (const register of [dashboard, attendance, reports]) {
        assert.match(register, /<DataTable/)
        assert.doesNotMatch(register, /<table\s+className/)
    }
})

test('HR recruitment registers remain responsive across openings, candidates and interviews', () => {
    const files = [
        readFileSync(new URL('../../../Pages/HR/Recruitment/JobOpenings.jsx', import.meta.url), 'utf8'),
        readFileSync(new URL('../../../Pages/HR/Recruitment/Candidates.jsx', import.meta.url), 'utf8'),
        readFileSync(new URL('../../../Pages/HR/Recruitment/Interviews.jsx', import.meta.url), 'utf8'),
    ]
    for (const source of files) {
        assert.match(source, /<DataTable/)
        assert.doesNotMatch(source, /<table\s+className/)
    }
})

test('HR employee management uses responsive registers and guarded status changes', () => {
    const list = readFileSync(new URL('../../../Pages/HR/EmployeeManagement/EmployeesList.jsx', import.meta.url), 'utf8')
    const documents = readFileSync(new URL('../../../Pages/HR/EmployeeManagement/EmployeeDocuments.jsx', import.meta.url), 'utf8')
    const profile = readFileSync(new URL('../../../Pages/HR/EmployeeManagement/EmployeeProfile.jsx', import.meta.url), 'utf8')
    for (const source of [list, documents, profile]) {
        assert.match(source, /<DataTable/)
        assert.doesNotMatch(source, /<table\s+className/)
    }
    assert.match(list, /<ConfirmAction/)
    assert.doesNotMatch(list, /<Dropdown/)
})

test('HR offers and onboarding use responsive registers and guard consequential offer transitions', () => {
    const offers = readFileSync(new URL('../../../Pages/HR/Onboarding/Offers.jsx', import.meta.url), 'utf8')
    const onboarding = readFileSync(new URL('../../../Pages/HR/Onboarding/Onboarding.jsx', import.meta.url), 'utf8')

    for (const source of [offers, onboarding]) {
        assert.match(source, /<DataTable/)
        assert.doesNotMatch(source, /<table className/)
    }
    assert.match(offers, /<ConfirmAction/)
    assert.match(offers, /pendingSave/)
})

test('HR leave policies and requests use responsive registers with guarded decisions', () => {
    const source = readFileSync(new URL('../../../Pages/HR/LeaveManagement/LeaveManagement.jsx', import.meta.url), 'utf8')
    assert.match(source, /<DataTable/)
    assert.match(source, /<ConfirmAction/)
    assert.match(source, /decisionCandidate/)
    assert.doesNotMatch(source, /<table className/)
})

test('HR training and performance use responsive registers and guard applied salary revisions', () => {
    const training = readFileSync(new URL('../../../Pages/HR/Training/Training.jsx', import.meta.url), 'utf8')
    const performance = readFileSync(new URL('../../../Pages/HR/Performance/Performance.jsx', import.meta.url), 'utf8')
    for (const source of [training, performance]) {
        assert.match(source, /<DataTable/)
        assert.doesNotMatch(source, /<table className/)
    }
    assert.match(performance, /<ConfirmAction/)
    assert.match(performance, /pendingRevision/)
})

test('HR disciplinary, exit and child-concession workflows use responsive governed records', () => {
    const disciplinary = readFileSync(new URL('../../../Pages/HR/Relations/Disciplinary.jsx', import.meta.url), 'utf8')
    const exit = readFileSync(new URL('../../../Pages/HR/Exit/ExitFormalities.jsx', import.meta.url), 'utf8')
    const concession = readFileSync(new URL('../../../Pages/HR/Payroll/ChildConcession.jsx', import.meta.url), 'utf8')
    for (const source of [disciplinary, exit, concession]) {
        assert.match(source, /<DataTable/)
        assert.doesNotMatch(source, /<table className/)
    }
    assert.match(disciplinary, /<ConfirmAction/)
    assert.match(exit, /<ConfirmAction/)
    assert.doesNotMatch(concession, /Student name if not enrolled/)
    assert.match(concession, /Select an enrolled student/)
})

test('HR secondary payroll registers are responsive and guard financial status transitions', () => {
    const source = readFileSync(new URL('../../../Pages/HR/Payroll/Payroll.jsx', import.meta.url), 'utf8')
    assert.match(source, /caption='Salary advance register'/)
    assert.match(source, /caption='CTC register'/)
    assert.match(source, /caption='Referral bonus register'/)
    assert.match(source, /caption='Claim compensation register'/)
    assert.doesNotMatch(source, /<table className='w-full text-left/)
    assert.match(source, /nextReferralStatus/)
    assert.match(source, /advanceCandidate/)
    assert.match(source, /referralCandidate/)
    assert.match(source, /claimCandidate/)
})

test('IT assets and tickets expose responsive operational context and honest actions', () => {
    const assets = readFileSync(new URL('../../../Pages/ITSupportManager/AssetManagement/AssetManagement.jsx', import.meta.url), 'utf8')
    const tickets = readFileSync(new URL('../../../Pages/ITSupportManager/SupportTickets/SupportTicketsList.jsx', import.meta.url), 'utf8')
    for (const source of [assets, tickets]) {
        assert.match(source, /<DataTable/)
        assert.match(source, /<DataToolbar/)
        assert.doesNotMatch(source, /<table className/)
        assert.doesNotMatch(source, /<Dropdown/)
    }
    assert.match(assets, /department/)
    assert.match(assets, /custodian/)
    assert.match(assets, /Export unavailable/)
    assert.match(tickets, /SLA_HOURS/)
    assert.match(tickets, /assignedTo/)
    assert.match(tickets, /location/)
    assert.doesNotMatch(tickets, /ExportModal/)
})

test('shared stock and procurement workflows expose responsive movement and decision timelines', () => {
    const demoScreens = readFileSync(new URL('../../demoDomain/DemoScreens.jsx', import.meta.url), 'utf8')
    const workflows = readFileSync(new URL('../../demoDomain/WorkflowScreens.jsx', import.meta.url), 'utf8')
    const procurement = readFileSync(new URL('../../demoDomain/procurement.js', import.meta.url), 'utf8')
    assert.match(demoScreens, /caption='Inventory movement register'/)
    assert.match(demoScreens, /caption='Inventory requirement register'/)
    assert.match(demoScreens, /<ConfirmAction/)
    assert.match(workflows, /caption='Procurement request register'/)
    assert.match(workflows, /caption='Purchase order register'/)
    assert.match(workflows, /<ConfirmAction/)
    assert.match(workflows, /Procurement timeline/)
    assert.match(procurement, /history/)
})

test('operations inventory registers share working filters and honest integration boundaries', () => {
    const register = readFileSync(new URL('../../operations/InventoryRegister.jsx', import.meta.url), 'utf8')
    const stationery = readFileSync(new URL('../../../Pages/StationeryStoreManager/Inventory/Inventory.jsx', import.meta.url), 'utf8')
    const housekeeping = readFileSync(new URL('../../../Pages/HousekeepingManager/Inventory/Inventory.jsx', import.meta.url), 'utf8')
    const canteen = readFileSync(new URL('../../../Pages/CanteenManager/Inventory/Inventory.jsx', import.meta.url), 'utf8')

    assert.match(register, /<DataToolbar/)
    assert.match(register, /<DataTable/)
    assert.match(register, /<IntegrationNotice/)
    assert.match(register, /disabled/)
    assert.match(register, /categoryFilter/)
    assert.match(register, /statusFilter/)
    for (const screen of [stationery, housekeeping, canteen]) {
        assert.match(screen, /<InventoryRegister/)
        assert.doesNotMatch(screen, /<table/)
        assert.doesNotMatch(screen, /ExportModal/)
    }
})

test('transport registers expose vehicle to route to duty operational state', () => {
    const register = readFileSync(new URL('../../operations/TransportRegister.jsx', import.meta.url), 'utf8')
    const state = readFileSync(new URL('../../operations/transportState.js', import.meta.url), 'utf8')
    const routes = readFileSync(new URL('../../../Pages/TransportManager/RouteManagement/RouteManagement.jsx', import.meta.url), 'utf8')
    const vehicles = readFileSync(new URL('../../../Pages/TransportManager/VehicleManagement/VehicleManagement.jsx', import.meta.url), 'utf8')
    const duties = readFileSync(new URL('../../../Pages/TransportManager/AssignDuty/AssignDuty.jsx', import.meta.url), 'utf8')

    assert.match(register, /Vehicle readiness/)
    assert.match(register, /Live trip/)
    assert.match(register, /<DataTable/)
    assert.match(register, /<IntegrationNotice/)
    assert.match(state, /deriveVehicleState/)
    assert.match(state, /deriveRouteState/)
    assert.match(state, /deriveDutyState/)
    for (const screen of [routes, vehicles, duties]) {
        assert.match(screen, /<TransportRegister/)
        assert.match(screen, /operationalState/)
        assert.doesNotMatch(screen, /<table/)
        assert.doesNotMatch(screen, /ExportModal|EditRequestModal|DeleteRequestModal/)
    }
})

test('security incidents share responsive SLA, assignment and timeline context', () => {
    const register = readFileSync(new URL('../../operations/SecurityIncidentRegister.jsx', import.meta.url), 'utf8')
    const domain = readFileSync(new URL('../../demoDomain/securityIncidents.js', import.meta.url), 'utf8')
    const gatekeeper = readFileSync(new URL('../../../Pages/GateKeeper/Incidents/Incidents.jsx', import.meta.url), 'utf8')
    const manager = readFileSync(new URL('../../../Pages/GatekeeperManager/IncidentManagement/IncidentsList.jsx', import.meta.url), 'utf8')

    assert.match(register, /<DataToolbar/)
    assert.match(register, /<DataTable/)
    assert.match(register, /<ConfirmAction/)
    assert.match(register, /Incident timeline/)
    assert.match(register, /assignedTo/)
    assert.match(register, /slaState/)
    assert.match(domain, /history/)
    assert.match(domain, /updateIncident/)
    for (const screen of [gatekeeper, manager]) {
        assert.match(screen, /<SecurityIncidentRegister/)
        assert.doesNotMatch(screen, /<table/)
        assert.doesNotMatch(screen, /ExportModal/)
    }
})

test('missing operations modules are explicit planned capabilities', () => {
    const roadmap = readFileSync(new URL('../../operations/PlannedOperationsCapabilities.jsx', import.meta.url), 'utf8')
    const directorRoutes = readFileSync(new URL('../../../Routes/JointDirectorRoutes.jsx', import.meta.url), 'utf8')
    const assistantRoutes = readFileSync(new URL('../../../Routes/JointDirectorAssistantRoutes.jsx', import.meta.url), 'utf8')
    const navigation = readFileSync(new URL('../../CommonSidebar/Components/sidebarLinks.js', import.meta.url), 'utf8')

    for (const capability of ['File Room', 'CCTV', 'Public Relations (PRO)', 'Unified Maintenance']) assert.match(roadmap, new RegExp(capability.replace(/[()]/g, '\\$&')))
    assert.match(roadmap, /Specification required/)
    assert.match(roadmap, /<IntegrationNotice/)
    assert.doesNotMatch(roadmap, /toast|onClick|<button/)
    assert.match(directorRoutes, /operations-capabilities/)
    assert.match(assistantRoutes, /operations-capabilities/)
    assert.match(navigation, /Planned Capabilities/)
})

test('canteen menu, order and request registers are responsive and integration-honest', () => {
    const register = readFileSync(new URL('../../operations/OperationsRecordRegister.jsx', import.meta.url), 'utf8')
    const canteenRegister = readFileSync(new URL('../../operations/CanteenOperationsRegister.jsx', import.meta.url), 'utf8')
    const menu = readFileSync(new URL('../../../Pages/CanteenManager/MenuManagement/MenuManagement.jsx', import.meta.url), 'utf8')
    const orders = readFileSync(new URL('../../../Pages/CanteenManager/Orders/Orders.jsx', import.meta.url), 'utf8')
    const requests = readFileSync(new URL('../../../Pages/CanteenManager/RequestsApprovals/RequestsApprovalsList.jsx', import.meta.url), 'utf8')

    assert.match(register, /<DataToolbar/)
    assert.match(register, /<DataTable/)
    assert.match(register, /<IntegrationNotice/)
    assert.match(register, /primaryFilter/)
    assert.match(register, /secondaryFilter/)
    assert.match(register, /Export unavailable/)
    assert.match(canteenRegister, /<OperationsRecordRegister/)
    for (const screen of [menu, orders, requests]) {
        assert.match(screen, /<CanteenOperationsRegister/)
        assert.doesNotMatch(screen, /<table/)
        assert.doesNotMatch(screen, /ExportModal|EditRequestModal|DeleteRequestModal|Dropdown/)
    }
})

test('stationery issue and approval workflows use shared responsive operational records', () => {
    const issueReturns = readFileSync(new URL('../../../Pages/StationeryStoreManager/IssueReturns/IssueReturnsList.jsx', import.meta.url), 'utf8')
    const requests = readFileSync(new URL('../../../Pages/StationeryStoreManager/RequestsApprovals/RequestsApprovalsList.jsx', import.meta.url), 'utf8')

    for (const source of [issueReturns, requests]) {
        assert.match(source, /<OperationsRecordRegister/)
        assert.doesNotMatch(source, /<table|ExportModal|Dropdown|DatePicker/)
    }
    assert.match(issueReturns, /activityType/)
    assert.match(issueReturns, /condition/)
    assert.match(requests, /currentStage/)
    assert.match(requests, /priority/)
})

test('stationery dashboard and reports expose responsive reference operations', () => {
    const dashboard = readFileSync(new URL('../../../Pages/StationeryStoreManager/Dashboard/Dashboard.jsx', import.meta.url), 'utf8')
    const reports = readFileSync(new URL('../../../Pages/StationeryStoreManager/Reports/Reports.jsx', import.meta.url), 'utf8')
    const reportWorkspace = readFileSync(new URL('../../operations/OperationsReportWorkspace.jsx', import.meta.url), 'utf8')

    assert.match(dashboard, /<IntegrationNotice/)
    assert.match(dashboard, /caption='Recent issue queue'/)
    assert.match(dashboard, /caption='Low-stock watchlist'/)
    assert.match(dashboard, /caption='Pending approval queue'/)
    assert.doesNotMatch(dashboard, /<table/)
    assert.match(reports, /<OperationsReportWorkspace/)
    assert.doesNotMatch(reports, /<table|ExportModal|DatePicker/)
    assert.match(reportWorkspace, /<DataToolbar/)
    assert.match(reportWorkspace, /<DataTable/)
    assert.match(reportWorkspace, /report\.dateKey/)
    assert.match(reportWorkspace, /Export unavailable/)
})

test('housekeeping keeps shared tasks and migrates live operations surfaces', () => {
    const routes = readFileSync(new URL('../../../Routes/HousekeepingManagerRoutes.jsx', import.meta.url), 'utf8')
    const requests = readFileSync(new URL('../../../Pages/HousekeepingManager/RequestsApprovals/RequestsApprovalsList.jsx', import.meta.url), 'utf8')
    const dashboard = readFileSync(new URL('../../../Pages/HousekeepingManager/Dashboard/Dashboard.jsx', import.meta.url), 'utf8')
    const reports = readFileSync(new URL('../../../Pages/HousekeepingManager/Reports/Reports.jsx', import.meta.url), 'utf8')

    assert.match(routes, /TaskManagementRoutes/)
    assert.doesNotMatch(routes, /Pages\/HousekeepingManager\/TaskManagement\/TaskManagement/)
    assert.match(requests, /<OperationsRecordRegister/)
    assert.doesNotMatch(requests, /<table|ExportModal|Dropdown|DatePicker/)
    assert.match(dashboard, /<IntegrationNotice/)
    assert.match(dashboard, /caption='Recent task queue'/)
    assert.match(dashboard, /caption='Low-stock supply watchlist'/)
    assert.match(dashboard, /caption='Pending request queue'/)
    assert.doesNotMatch(dashboard, /<table/)
    assert.match(reports, /<OperationsReportWorkspace/)
    assert.doesNotMatch(reports, /<table|ExportModal|DatePicker/)
})

test('operations request creation uses one validated integration-ready workspace', () => {
    const workspace = readFileSync(new URL('../../operations/OperationsRequestWorkspace.jsx', import.meta.url), 'utf8')
    const canteen = readFileSync(new URL('../../../Pages/CanteenManager/RequestsApprovals/AddRequest.jsx', import.meta.url), 'utf8')
    const stationery = readFileSync(new URL('../../../Pages/StationeryStoreManager/RequestsApprovals/AddRequest.jsx', import.meta.url), 'utf8')
    const housekeeping = readFileSync(new URL('../../../Pages/HousekeepingManager/RequestsApprovals/AddRequest.jsx', import.meta.url), 'utf8')

    assert.match(workspace, /<FormField/)
    assert.match(workspace, /<IntegrationNotice/)
    assert.match(workspace, /<Dialog/)
    assert.match(workspace, /validateOperationsRequest/)
    assert.match(workspace, /type='date'/)
    assert.match(workspace, /API submission unavailable/)
    assert.doesNotMatch(workspace, /<table|DatePicker|fixed inset-0/)

    for (const screen of [canteen, stationery, housekeeping]) {
        assert.match(screen, /<OperationsRequestWorkspace/)
        assert.doesNotMatch(screen, /RequestInfo|RequestModal|setRequestModal|Save Changes/)
    }
})

test('operations request details fail closed and share responsive workflow context', () => {
    const detail = readFileSync(new URL('../../operations/OperationsRequestDetail.jsx', import.meta.url), 'utf8')
    const canteen = readFileSync(new URL('../../../Pages/CanteenManager/RequestsApprovals/ViewRequest.jsx', import.meta.url), 'utf8')
    const stationery = readFileSync(new URL('../../../Pages/StationeryStoreManager/RequestsApprovals/ViewRequest.jsx', import.meta.url), 'utf8')
    const housekeeping = readFileSync(new URL('../../../Pages/HousekeepingManager/RequestsApprovals/ViewRequest.jsx', import.meta.url), 'utf8')

    assert.match(detail, /<FeedbackState/)
    assert.match(detail, /<IntegrationNotice/)
    assert.match(detail, /<WorkflowContextBar/)
    assert.match(detail, /<StatusBadge/)
    assert.doesNotMatch(detail, /<table|overflow-x-auto/)

    for (const screen of [canteen, stationery, housekeeping]) {
        assert.match(screen, /<OperationsRequestDetail/)
        assert.doesNotMatch(screen, /REQUESTS\[0\]|<table|priorityBadgeColor|statusBadgeColor/)
    }
})

test('canteen reports use responsive records and expose unavailable datasets honestly', () => {
    const reports = readFileSync(new URL('../../../Pages/CanteenManager/Reports/Reports.jsx', import.meta.url), 'utf8')
    const reportState = readFileSync(new URL('../../operations/canteenReportState.js', import.meta.url), 'utf8')

    assert.match(reports, /<DataTable/)
    assert.match(reports, /<DataToolbar/)
    assert.match(reports, /<IntegrationNotice/)
    assert.match(reports, /Order summary dataset unavailable/)
    assert.match(reports, /type='date'/)
    assert.doesNotMatch(reports, /<table|ExportModal/)
    assert.match(reportState, /filterCanteenReportRows/)
})

test('canteen dashboard is an honest responsive operations briefing', () => {
    const dashboard = readFileSync(new URL('../../../Pages/CanteenManager/Dashboard/Dashboard.jsx', import.meta.url), 'utf8')

    assert.match(dashboard, /<IntegrationNotice/)
    assert.match(dashboard, /caption='Recent order queue'/)
    assert.match(dashboard, /caption='Low-stock watchlist'/)
    assert.match(dashboard, /caption='Pending request queue'/)
    assert.match(dashboard, /Reference dashboard/)
    assert.doesNotMatch(dashboard, /<table|ReactECharts/)
})
