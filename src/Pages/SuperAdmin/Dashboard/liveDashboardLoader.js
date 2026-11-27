import { getAdminDashboardApi, canUseDashboardApi } from '../../../services/dashboardApi'
import { pullFinanceState } from '../../../services/financeApi'
import { isApiFinanceEnabled, getAccessToken, isApiAuthEnabled } from '../../../services/apiClient'
import { buildMonthlyFlowTrend } from '../../AccountHead/financeDomain/financeLiveViews'
import { formatCurrency } from '../../AccountHead/financeDomain/financeHelpers'
import { canUseEmployeeDirectoryApi, loadEmployeeDirectory } from '../../../services/employeeDirectoryApi'
import { hydrateEnrolledStudentsFromApi } from '../../../Common/StudentDatabase/enrolledStudentsData'
import { getStudentsList } from '../../../Common/StudentDatabase/studentDatabaseData'
import { getPendingApprovalCount, hydrateApprovalsFromApi, getAllApprovalRequests } from '../Approvals/approvalsData'
import { hydrateFindingsFromApi, getFindings } from '../../JointDirectorAudit/FindingsCompliance/findingsComplianceData'
import { hydrateVehiclesFromApi, getVehicles } from '../../TransportManager/VehicleManagement/vehicleManagementData'
import { hydrateInventoryItemsFromApi, getInventoryItems } from '../../StationeryStoreManager/Inventory/inventoryData'
import { listOpsCollectionApi, canUseOpsApi } from '../../../services/opsApi'
import { CHART_COLORS } from './dashboardData'

const PERIOD_MONTHS = {
  '3m': 3,
  '6m': 6,
  '12m': 12,
}

const PERIOD_LABEL = {
  '3m': '3M',
  '6m': '6M',
  '12m': '12M',
}

const calcTrend = (current, previous) => {
  if (previous == null || previous === 0) {
    return { trend: current ? 'New' : '—', trendType: 'neutral' }
  }
  const change = ((current - previous) / previous) * 100
  const rounded = Math.abs(change).toFixed(1)
  return {
    trend: `${change >= 0 ? '+' : '-'}${rounded}%`,
    trendType: change === 0 ? 'neutral' : change > 0 ? 'up' : 'down',
  }
}

/** Real monthly series only — never invent ramp values. */
const monthSpark = (series = []) => {
  const values = (Array.isArray(series) ? series : []).map((n) => Number(n) || 0)
  if (!values.length) return [0]
  return values
}

const toLakhsLabel = (amount) => {
  const n = Number(amount) || 0
  if (Math.abs(n) >= 100000) return `₹${(n / 100000).toFixed(1)}L`
  return formatCurrency(n)
}

const sumWindow = (series = [], start, end) =>
  series.slice(start, end).reduce((a, b) => a + (Number(b) || 0), 0)

const findingIsOpen = (f) => {
  const status = String(f.status || '').toLowerCase()
  return Boolean(status) && status !== 'closed' && status !== 'resolved'
}

const findingIsClosed = (f) => /closed|resolved/i.test(String(f.status || ''))

/**
 * Loads a live Super Admin dashboard snapshot from campus APIs.
 * KPIs use real counts/sums only — no padded departments, fake sparklines, or invented compliance floors.
 * @param {'3m'|'6m'|'12m'} period
 */
export async function loadLiveSuperAdminDashboard(period = '6m') {
  const months = PERIOD_MONTHS[period] || 6
  const periodTag = PERIOD_LABEL[period] || '6M'
  const apiOn = isApiAuthEnabled() && Boolean(getAccessToken())

  const settled = await Promise.allSettled([
    canUseDashboardApi() ? getAdminDashboardApi() : Promise.resolve(null),
    isApiFinanceEnabled() && apiOn ? pullFinanceState() : Promise.resolve(null),
    (async () => {
      await hydrateEnrolledStudentsFromApi().catch(() => {})
      return getStudentsList().length
    })(),
    canUseEmployeeDirectoryApi()
      ? loadEmployeeDirectory().then((d) => d.records?.length ?? 0)
      : Promise.resolve(null),
    hydrateApprovalsFromApi().then(() => getPendingApprovalCount()).catch(() => getPendingApprovalCount()),
    hydrateFindingsFromApi().then(() => getFindings()).catch(() => getFindings()),
    hydrateVehiclesFromApi().then(() => getVehicles()).catch(() => getVehicles()),
    hydrateInventoryItemsFromApi().then(() => getInventoryItems()).catch(() => getInventoryItems()),
    canUseOpsApi() ? listOpsCollectionApi('audit-findings').catch(() => []) : Promise.resolve([]),
  ])

  const value = (i, fallback = null) =>
    settled[i].status === 'fulfilled' ? settled[i].value : fallback

  const adminSnap = value(0) || {}
  const financeWrap = value(1)
  const finance = financeWrap?.data || financeWrap || null
  const studentsCount = Number(value(2) ?? adminSnap.students ?? 0) || 0
  const employeesCount = Number(
    value(3) != null ? value(3) : (adminSnap.employees ?? 0),
  ) || 0
  const pendingApprovals = Number(value(4) ?? 0) || 0
  let findings = Array.isArray(value(5)) ? value(5) : []
  const opsFindings = value(8)
  if (Array.isArray(opsFindings) && opsFindings.length) findings = opsFindings
  const vehicles = Array.isArray(value(6)) ? value(6) : []
  const inventory = Array.isArray(value(7)) ? value(7) : []

  const transactions = Array.isArray(finance?.transactions) ? finance.transactions : []
  // Load 2× window so we can compare this period vs the prior equal period.
  const dualTrend = buildMonthlyFlowTrend(transactions, months * 2)
  const trend = {
    labels: dualTrend.labels.slice(-months),
    inflow: dualTrend.inflow.slice(-months),
    outflow: dualTrend.outflow.slice(-months),
    inflowLakhs: dualTrend.inflowLakhs.slice(-months),
    outflowLakhs: dualTrend.outflowLakhs.slice(-months),
  }
  const priorInflow = dualTrend.inflow.slice(0, months)
  const priorOutflow = dualTrend.outflow.slice(0, months)

  const inflow = sumWindow(trend.inflow, 0, months)
  const outflow = sumWindow(trend.outflow, 0, months)
  const priorInTotal = sumWindow(priorInflow, 0, months)
  const priorOutTotal = sumWindow(priorOutflow, 0, months)
  const revenueTrend = calcTrend(inflow, priorInTotal)
  const expenseTrend = calcTrend(outflow, priorOutTotal)

  const installments = Array.isArray(finance?.installments) ? finance.installments : []
  const receipts = Array.isArray(finance?.receipts) ? finance.receipts : []
  const pendingFees = installments.reduce((sum, row) => sum + Number(row.balanceAmount || 0), 0)
  const totalDue = installments.reduce(
    (sum, row) => sum + Number(row.amount || row.totalAmount || row.balanceAmount || 0),
    0,
  )
  const collected = Math.max(totalDue - pendingFees, 0)
  const feeCollectionRate = totalDue > 0 ? Math.round((collected / totalDue) * 1000) / 10 : 0

  const openFindings = findings.filter(findingIsOpen)
  const closedFindings = findings.filter(findingIsClosed)
  const bySeverity = ['Critical', 'High', 'Medium', 'Low'].map((severity) => ({
    name: severity,
    value: openFindings.filter((f) => String(f.severity || '').toLowerCase() === severity.toLowerCase()).length,
  })).filter((row) => row.value > 0)

  const lowStock = inventory.filter((item) => {
    const status = String(item.status || '').toLowerCase()
    return status.includes('low') || status.includes('out')
  })

  // Only departments that appear on real findings — never pad with fake Academic/Transport/…
  const deptNames = [...new Set(findings.map((f) => f.department).filter(Boolean))]
  const departmentSummaries = deptNames.map((department) => {
    const deptOpen = openFindings.filter((f) => f.department === department)
    const deptClosed = closedFindings.filter((f) => f.department === department)
    const total = deptOpen.length + deptClosed.length
    const compliance = total > 0 ? Math.round((deptClosed.length / total) * 100) : null
    return {
      department,
      compliance: compliance == null ? 0 : compliance,
      complianceLabel: compliance == null ? '—' : `${compliance}%`,
      pendingFindings: deptOpen.length,
      closedFindings: deptClosed.length,
      totalAudits: total,
      status:
        compliance == null
          ? 'No data'
          : compliance >= 90
            ? 'Excellent'
            : compliance >= 80
              ? 'Good'
              : compliance >= 50
                ? 'Watch'
                : 'Critical',
    }
  }).sort((a, b) => (a.compliance ?? 0) - (b.compliance ?? 0))

  const scoredDepts = departmentSummaries.filter((d) => d.totalAudits > 0)
  const complianceScore = scoredDepts.length
    ? Math.round(scoredDepts.reduce((s, d) => s + d.compliance, 0) / scoredDepts.length)
    : null

  const incomeByCategory = new Map()
  transactions.forEach((row) => {
    if (row.status && row.status !== 'POSTED') return
    if (row.direction === 'OUT') return
    const label = row.category || row.sourceModule || 'Other'
    incomeByCategory.set(label, (incomeByCategory.get(label) || 0) + (Number(row.amount) || 0))
  })
  const incomeMixTotal = [...incomeByCategory.values()].reduce((a, b) => a + b, 0) || 1
  const palette = CHART_COLORS.palette
  const incomeMix = [...incomeByCategory.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([name, amount], index) => ({
      name,
      percent: Math.round((amount / incomeMixTotal) * 1000) / 10,
      color: palette[index % palette.length],
      amount,
    }))

  const approvalRows = getAllApprovalRequests()
    .filter((item) => !item.status || item.status === 'Pending')
    .slice(0, 5)
    .map((item) => ({
      id: item.id,
      title: item.title,
      category: item.category,
      department: item.department,
      status: item.status || 'Pending',
      priority: item.priority || 'Normal',
    }))

  const kpiCards = [
    {
      key: 'students',
      label: 'Total Students',
      value: String(studentsCount),
      previousValue: null,
      trend: 'Live',
      trendType: 'neutral',
      comparison: 'enrolled student database',
      sparkline: monthSpark([studentsCount]),
      sparkColor: CHART_COLORS.primary,
      iconTone: 'primary',
    },
    {
      key: 'employees',
      label: 'Total Employees',
      value: String(employeesCount),
      previousValue: null,
      trend: 'Live',
      trendType: 'neutral',
      comparison: 'HR employee directory',
      sparkline: monthSpark([employeesCount]),
      sparkColor: CHART_COLORS.info,
      iconTone: 'info',
    },
    {
      key: 'departments',
      label: 'Depts with findings',
      value: String(deptNames.length),
      previousValue: null,
      trend: openFindings.length ? `${openFindings.length} open` : 'Clear',
      trendType: openFindings.length ? 'down' : 'up',
      comparison: 'from audit findings only',
      sparkline: monthSpark([deptNames.length]),
      sparkColor: CHART_COLORS.palette[5],
      iconTone: 'violet',
    },
    {
      key: 'revenue',
      label: `Revenue (${periodTag})`,
      value: toLakhsLabel(inflow),
      previousValue: toLakhsLabel(priorInTotal),
      trend: revenueTrend.trend,
      trendType: revenueTrend.trendType,
      comparison: `vs prior ${periodTag} (posted IN)`,
      sparkline: monthSpark(trend.inflowLakhs?.length ? trend.inflowLakhs : trend.inflow),
      sparkColor: CHART_COLORS.success,
      iconTone: 'success',
    },
    {
      key: 'expenses',
      label: `Expenses (${periodTag})`,
      value: toLakhsLabel(outflow),
      previousValue: toLakhsLabel(priorOutTotal),
      trend: expenseTrend.trend,
      trendType: expenseTrend.trendType,
      comparison: `vs prior ${periodTag} (posted OUT)`,
      sparkline: monthSpark(trend.outflowLakhs?.length ? trend.outflowLakhs : trend.outflow),
      sparkColor: CHART_COLORS.danger,
      iconTone: 'danger',
    },
    {
      key: 'approvals',
      label: 'Pending Approvals',
      value: String(pendingApprovals),
      previousValue: null,
      trend: pendingApprovals ? 'Open' : 'Clear',
      trendType: pendingApprovals ? 'down' : 'up',
      comparison: 'live approvals inbox',
      sparkline: monthSpark([pendingApprovals]),
      sparkColor: CHART_COLORS.warning,
      iconTone: 'warning',
    },
    {
      key: 'audit-findings',
      label: 'Open Findings',
      value: String(openFindings.length),
      previousValue: null,
      trend: openFindings.length ? 'Active' : 'Clear',
      trendType: openFindings.length ? 'down' : 'up',
      comparison: `${findings.length} total in collection`,
      sparkline: monthSpark([openFindings.length]),
      sparkColor: CHART_COLORS.danger,
      iconTone: 'danger',
    },
    {
      key: 'compliance',
      label: 'Compliance Score',
      value: complianceScore == null ? '—' : `${complianceScore}%`,
      previousValue: null,
      trend: complianceScore == null ? 'No findings' : complianceScore >= 85 ? 'On track' : 'Watch',
      trendType: complianceScore == null ? 'neutral' : complianceScore >= 85 ? 'up' : 'down',
      comparison: 'closed ÷ (open + closed) by dept',
      sparkline: monthSpark(complianceScore == null ? [0] : [complianceScore]),
      sparkColor: CHART_COLORS.success,
      iconTone: 'success',
    },
    {
      key: 'vehicles',
      label: 'Fleet Vehicles',
      value: String(vehicles.length),
      previousValue: null,
      trend: 'Live',
      trendType: 'neutral',
      comparison: 'transport vehicles collection',
      sparkline: monthSpark([vehicles.length]),
      sparkColor: CHART_COLORS.info,
      iconTone: 'info',
    },
    {
      key: 'inventory',
      label: 'Stock Alerts',
      value: String(lowStock.length),
      previousValue: null,
      trend: lowStock.length ? 'Attention' : 'Healthy',
      trendType: lowStock.length ? 'down' : 'up',
      comparison: `${inventory.length} items in stationery`,
      sparkline: monthSpark([lowStock.length]),
      sparkColor: CHART_COLORS.warning,
      iconTone: 'warning',
    },
  ]

  return {
    asOf: adminSnap.asOf || new Date().toISOString().slice(0, 10),
    period,
    months,
    source: apiOn ? 'api' : 'local',
    executiveSummary: {
      netSurplus: toLakhsLabel(inflow - outflow),
      feeCollectionRate,
      activeRisks: openFindings.filter((f) => /critical|high/i.test(String(f.severity || ''))).length,
      pendingFees: formatCurrency(pendingFees),
      leaveRequests: Number(adminSnap.leaveRequests ?? 0) || 0,
      openEscalations: Number(adminSnap.openEscalations ?? 0) || 0,
      announcementsThisMonth: Number(adminSnap.announcementsThisMonth ?? 0) || 0,
    },
    kpiCards,
    governanceTrend: {
      labels: trend.labels,
      revenue: trend.inflowLakhs?.length ? trend.inflowLakhs : trend.inflow.map((v) => Number((v / 100000).toFixed(2))),
      expenses: trend.outflowLakhs?.length ? trend.outflowLakhs : trend.outflow.map((v) => Number((v / 100000).toFixed(2))),
      // No invented compliance time-series — omit unless we have a real score (constant line only).
      compliance: complianceScore == null
        ? trend.labels.map(() => null)
        : trend.labels.map(() => complianceScore),
      hasCompliance: complianceScore != null,
    },
    incomeMix: incomeMix.length
      ? incomeMix
      : [{ name: 'No posted income in range', percent: 100, color: '#98A2B3', amount: 0 }],
    findingsBySeverity: bySeverity.length ? bySeverity : [{ name: 'None', value: 0 }],
    departmentSummaries,
    progressMetrics: [
      { label: 'Fee Collection', value: feeCollectionRate, target: 85, color: CHART_COLORS.primary },
      {
        label: 'Audit Compliance',
        value: complianceScore == null ? 0 : complianceScore,
        target: 90,
        color: CHART_COLORS.success,
        emptyLabel: complianceScore == null ? 'No findings yet' : null,
      },
      {
        label: 'Fleet readiness',
        value: vehicles.length ? 100 : 0,
        target: 95,
        color: CHART_COLORS.info,
        emptyLabel: vehicles.length ? null : 'No vehicles in collection',
      },
      {
        label: 'Inventory Health',
        value: inventory.length
          ? Math.max(0, 100 - Math.round((lowStock.length / inventory.length) * 100))
          : 0,
        target: 90,
        color: CHART_COLORS.warning,
        emptyLabel: inventory.length ? null : 'No inventory rows',
      },
    ],
    recentApprovals: approvalRows,
    activeFindings: openFindings.slice(0, 6).map((item) => ({
      id: item.id || item.findingId,
      title: item.title || item.subject || 'Finding',
      department: item.department || '—',
      severity: item.severity || 'Medium',
      status: item.status || 'Open',
      dueDate: item.dueDate || item.due_date || '—',
    })),
    inventoryAlerts: lowStock.slice(0, 5).map((item) => ({
      department: item.category || item.department || 'Store',
      item: item.itemName || item.name || item.itemId,
      alertType: item.status || 'Low Stock',
      status: item.status || 'Critical',
    })),
    moduleHealth: [
      {
        module: 'Academics',
        status: studentsCount ? 'Operational' : 'No students yet',
        score: null,
        detail: `${studentsCount} enrolled`,
      },
      {
        module: 'Finance',
        status: finance ? 'Operational' : 'Not loaded',
        score: null,
        detail: finance ? `${receipts.length} receipts · ${transactions.length} txns` : 'Finance API unavailable',
      },
      {
        module: 'Operations',
        status: inventory.length ? 'Operational' : 'No inventory yet',
        score: null,
        detail: `${inventory.length} items · ${lowStock.length} alerts`,
      },
      {
        module: 'Audit & Compliance',
        status: findings.length ? (openFindings.length > 5 ? 'Monitoring' : 'Operational') : 'No findings yet',
        score: complianceScore,
        detail: `${openFindings.length} open / ${findings.length} total`,
      },
      {
        module: 'Transport',
        status: vehicles.length ? 'Operational' : 'No vehicles yet',
        score: null,
        detail: `${vehicles.length} vehicles`,
      },
      {
        module: 'Inventory',
        status: lowStock.length ? 'Attention' : inventory.length ? 'Operational' : 'No inventory yet',
        score: null,
        detail: `${lowStock.length} stock alerts`,
      },
    ],
    receiptCount: receipts.length,
    errors: settled
      .map((row, index) => (row.status === 'rejected' ? `source-${index}: ${row.reason?.message || 'failed'}` : null))
      .filter(Boolean),
  }
}
