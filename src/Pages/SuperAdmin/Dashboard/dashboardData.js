import { FEE_COLLECTION_SUMMARY } from '../../AccountHead/FeesManagement/feesManagementData'
import { INCOME_EXPENDITURE_TREND, INCOME_MIX } from '../../AccountHead/ReportsAnalytics/reportsAnalyticsData'
import { getComplianceData } from '../../ProcessAuditor/Reports/ComplianceReports/complianceReportsData'
import { MONTHLY_COMPLIANCE_TREND } from '../../ProcessAuditor/Dashboard/dashboardData'
import { ASSETS_INVENTORY } from '../../JointDirector/AssetsInventory/assetsInventoryData'
import { SUMMARY_CARDS as STATIONERY_SUMMARY } from '../../StationeryStoreManager/Dashboard/dashboardData'
import { FINDINGS, severityBadgeColor as findingSeverityBadgeColor } from '../../JointDirectorAudit/FindingsCompliance/findingsComplianceData'
import { RISK_ANALYSIS_REPORT } from '../../JointDirectorAudit/ReportsAnalytics/reportsAnalyticsData'
import { getPendingApprovalCount, getAllApprovalRequests } from '../Approvals/approvalsData'
import { getComplianceScore, getPendingFindings } from '../AuditReports/auditReportsOverviewData'
import { getFleetSummary } from '../TransportOverview/transportOverviewData'

export const CHART_COLORS = {
    primary: '#515DEF',
    success: '#4CAF50',
    warning: '#FF9800',
    danger: '#FF5722',
    info: '#2196F3',
    palette: ['#515DEF', '#4CAF50', '#FF9800', '#FF5722', '#2196F3', '#9C27B0'],
}

const parseSummaryNumber = (label) => {
    const card = STATIONERY_SUMMARY.find((item) => item.label === label)
    return Number(String(card?.value ?? '0').replace(/[^\d]/g, '')) || 0
}

const getInventoryAlertCount = () => {
    const criticalAssets = ASSETS_INVENTORY.filter((item) => item.status === 'Critical').length
    const lowStock = parseSummaryNumber('Low Stock Items')
    const outOfStock = parseSummaryNumber('Out of Stock Items')
    return criticalAssets + lowStock + outOfStock
}

const juneIndex = INCOME_EXPENDITURE_TREND.labels.length - 1
const mayIndex = juneIndex - 1

const calcTrend = (current, previous) => {
    if (!previous) return { trend: '—', trendType: 'neutral' }
    const change = ((current - previous) / previous) * 100
    const rounded = Math.abs(change).toFixed(1)
    return {
        trend: `${change >= 0 ? '+' : '-'}${rounded}%`,
        trendType: change >= 0 ? 'up' : 'down',
    }
}

const revenueThisMonth = INCOME_EXPENDITURE_TREND.income[juneIndex]
const revenueLastMonth = INCOME_EXPENDITURE_TREND.income[mayIndex]
const expenseThisMonth = INCOME_EXPENDITURE_TREND.expenditure[juneIndex]
const expenseLastMonth = INCOME_EXPENDITURE_TREND.expenditure[mayIndex]

const revenueTrend = calcTrend(revenueThisMonth, revenueLastMonth)
const expenseTrend = calcTrend(expenseThisMonth, expenseLastMonth)
const complianceTrend = calcTrend(
    MONTHLY_COMPLIANCE_TREND.values[juneIndex],
    MONTHLY_COMPLIANCE_TREND.values[mayIndex],
)

const pendingFindings = getPendingFindings()
const pendingApprovals = getPendingApprovalCount()
const complianceScore = getComplianceScore()
const fleetSummary = getFleetSummary()
const departmentRows = getComplianceData().departments

export const EXECUTIVE_KPI_CARDS = [
    {
        key: 'students',
        label: 'Total Students',
        value: '1,240',
        previousValue: '1,218',
        trend: '+1.8%',
        trendType: 'up',
        comparison: 'vs last month',
        sparkline: [1180, 1195, 1205, 1210, 1218, 1240],
        sparkColor: CHART_COLORS.primary,
        iconTone: 'primary',
    },
    {
        key: 'employees',
        label: 'Total Employees',
        value: '248',
        previousValue: '241',
        trend: '+2.9%',
        trendType: 'up',
        comparison: 'vs last month',
        sparkline: [232, 235, 238, 239, 241, 248],
        sparkColor: CHART_COLORS.info,
        iconTone: 'info',
    },
    {
        key: 'departments',
        label: 'Total Departments',
        value: String(departmentRows.length),
        previousValue: String(departmentRows.length),
        trend: '0%',
        trendType: 'neutral',
        comparison: 'operational units',
        sparkline: [8, 8, 8, 8, 8, departmentRows.length],
        sparkColor: CHART_COLORS.palette[5],
        iconTone: 'violet',
    },
    {
        key: 'revenue',
        label: 'Revenue This Month',
        value: `₹${revenueThisMonth}.0L`,
        previousValue: `₹${revenueLastMonth}.0L`,
        trend: revenueTrend.trend,
        trendType: revenueTrend.trendType,
        comparison: 'vs last month',
        sparkline: INCOME_EXPENDITURE_TREND.income,
        sparkColor: CHART_COLORS.success,
        iconTone: 'success',
    },
    {
        key: 'expenses',
        label: 'Expenses This Month',
        value: `₹${expenseThisMonth}.0L`,
        previousValue: `₹${expenseLastMonth}.0L`,
        trend: expenseTrend.trend,
        trendType: expenseTrend.trendType === 'up' ? 'down' : 'up',
        comparison: 'vs last month',
        sparkline: INCOME_EXPENDITURE_TREND.expenditure,
        sparkColor: CHART_COLORS.danger,
        iconTone: 'danger',
    },
    {
        key: 'approvals',
        label: 'Pending Approvals',
        value: String(pendingApprovals),
        previousValue: '10',
        trend: pendingApprovals > 10 ? `+${pendingApprovals - 10}` : `${pendingApprovals - 10}`,
        trendType: pendingApprovals > 10 ? 'down' : 'up',
        comparison: 'awaiting decision',
        sparkline: [6, 8, 9, 11, 10, pendingApprovals],
        sparkColor: CHART_COLORS.warning,
        iconTone: 'warning',
    },
    {
        key: 'audit-findings',
        label: 'Active Audit Findings',
        value: String(pendingFindings.length),
        previousValue: '5',
        trend: `+${pendingFindings.length - 5}`,
        trendType: 'down',
        comparison: 'open or in progress',
        sparkline: [3, 4, 5, 6, 5, pendingFindings.length],
        sparkColor: CHART_COLORS.danger,
        iconTone: 'danger',
    },
    {
        key: 'compliance',
        label: 'Compliance Score',
        value: `${complianceScore}%`,
        previousValue: `${MONTHLY_COMPLIANCE_TREND.values[mayIndex]}%`,
        trend: complianceTrend.trend,
        trendType: complianceTrend.trendType,
        comparison: 'vs last month',
        sparkline: MONTHLY_COMPLIANCE_TREND.values,
        sparkColor: CHART_COLORS.success,
        iconTone: 'success',
    },
    {
        key: 'vehicles',
        label: 'Total Vehicles',
        value: String(fleetSummary.totalVehicles),
        previousValue: String(fleetSummary.totalVehicles),
        trend: '0%',
        trendType: 'neutral',
        comparison: 'active fleet',
        sparkline: [5, 5, 5, 5, 5, fleetSummary.totalVehicles],
        sparkColor: CHART_COLORS.info,
        iconTone: 'info',
    },
    {
        key: 'inventory',
        label: 'Inventory Alerts',
        value: String(getInventoryAlertCount()),
        previousValue: '24',
        trend: '-6.3%',
        trendType: 'up',
        comparison: 'critical & low stock',
        sparkline: [28, 27, 26, 25, 24, getInventoryAlertCount()],
        sparkColor: CHART_COLORS.warning,
        iconTone: 'warning',
    },
]

export const EXECUTIVE_SUMMARY = {
    feeCollectionRate: FEE_COLLECTION_SUMMARY[1].progress ?? 77.7,
    netSurplus: '₹19.6L',
    activeRisks: RISK_ANALYSIS_REPORT.filter((item) => item.status === 'Active').length,
    pendingFees: FEE_COLLECTION_SUMMARY[2].value,
}

export const DEPARTMENT_SUMMARIES = departmentRows.map((row) => ({
    department: row.department,
    compliance: row.compliance,
    pendingFindings: row.pendingFindings,
    closedFindings: row.closedFindings,
    totalAudits: row.totalAudits,
    status: row.compliance >= 90 ? 'Excellent' : row.compliance >= 80 ? 'Good' : row.compliance >= 75 ? 'Watch' : 'Critical',
}))

export const DEPARTMENT_STATUS_COLORS = {
    Excellent: 'bg-[#4CAF5033] text-[#4CAF50]',
    Good: 'bg-[#515DEF33] text-[#515DEF]',
    Watch: 'bg-[#FF980033] text-[#FF9800]',
    Critical: 'bg-[#FF000033] text-[#FF0000]',
}

export const PROGRESS_METRICS = [
    {
        label: 'Fee Collection',
        value: EXECUTIVE_SUMMARY.feeCollectionRate,
        target: 85,
        color: CHART_COLORS.primary,
    },
    {
        label: 'Audit Compliance',
        value: complianceScore,
        target: 90,
        color: CHART_COLORS.success,
    },
    {
        label: 'Fleet Document Validity',
        value: Math.round((fleetSummary.totalDocuments - fleetSummary.expiringDocs) / fleetSummary.totalDocuments * 100),
        target: 95,
        color: CHART_COLORS.info,
    },
    {
        label: 'Inventory Health',
        value: Math.max(55, 100 - Math.round(getInventoryAlertCount() * 2.5)),
        target: 90,
        color: CHART_COLORS.warning,
    },
]

export const RECENT_APPROVALS = getAllApprovalRequests()
    .filter((item) => item.status === 'Pending')
    .slice(0, 5)
    .map((item) => ({
        id: item.id,
        title: item.title,
        category: item.category,
        department: item.department,
        status: item.status,
        priority: item.priority,
    }))

export const APPROVAL_PRIORITY_COLORS = {
    High: 'bg-[#FF000033] text-[#FF0000]',
    Normal: 'bg-[#2196F333] text-[#2196F3]',
    Low: 'bg-[#66708533] text-[#667085]',
    Critical: 'bg-[#9C27B033] text-[#9C27B0]',
}

export const ACTIVE_FINDINGS = pendingFindings.slice(0, 6).map((item) => ({
    id: item.id,
    title: item.title,
    department: item.department,
    severity: item.severity,
    status: item.status,
    dueDate: item.dueDate,
}))

export { findingSeverityBadgeColor, INCOME_EXPENDITURE_TREND, INCOME_MIX, MONTHLY_COMPLIANCE_TREND }

export const FINDINGS_BY_SEVERITY = ['Critical', 'High', 'Medium', 'Low'].map((severity) => ({
    name: severity,
    value: FINDINGS.filter((item) => item.severity === severity && item.status !== 'Closed').length,
})).filter((item) => item.value > 0)

export const MODULE_HEALTH = [
    { module: 'Academics', status: 'Operational', score: 96 },
    { module: 'Finance', status: 'Operational', score: 94 },
    { module: 'Operations', status: 'Operational', score: 91 },
    { module: 'Audit & Compliance', status: 'Monitoring', score: 89 },
    { module: 'Transport', status: 'Operational', score: 88 },
    { module: 'Inventory', status: 'Attention', score: 72 },
]

export const MODULE_STATUS_COLORS = {
    Operational: 'bg-[#4CAF5033] text-[#4CAF50]',
    Monitoring: 'bg-[#FF980033] text-[#FF9800]',
    Attention: 'bg-[#FF000033] text-[#FF0000]',
}

export const INVENTORY_ALERTS = ASSETS_INVENTORY
    .filter((item) => item.status === 'Critical')
    .slice(0, 5)
    .map((item) => ({
        department: item.department,
        item: item.assetProduct,
        alertType: item.alertType,
        status: item.status,
    }))

export const GOVERNANCE_TREND = {
    labels: MONTHLY_COMPLIANCE_TREND.labels,
    compliance: MONTHLY_COMPLIANCE_TREND.values,
    revenue: INCOME_EXPENDITURE_TREND.income,
    expenses: INCOME_EXPENDITURE_TREND.expenditure,
}
