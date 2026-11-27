import { emptyJdDashboardView } from './liveDashboardLoader'

/** Empty placeholders until `loadLiveJdDashboard` hydrates campus collections. */
const EMPTY = emptyJdDashboardView()

export const KPI_CARDS = EMPTY.kpiCards
export const DEPARTMENT_SUMMARIES = EMPTY.departmentSummaries
export const PENDING_APPROVALS = EMPTY.pendingApprovals
export const CRITICAL_ALERTS = EMPTY.criticalAlerts
export const RECENT_ESCALATIONS = EMPTY.recentEscalations

export const priorityBadgeColor = {
    Critical: 'bg-[#FF000033] text-[#FF0000]',
    High: 'bg-[#FF980033] text-[#FF9800]',
    Medium: 'bg-[#2196F333] text-[#2196F3]',
    Low: 'bg-[#66708533] text-[#667085]',
}

export const OPERATIONS_TREND = EMPTY.operationsTrend
export const APPROVALS_BY_DEPARTMENT = EMPTY.approvalsByDepartment
export const ESCALATIONS_BY_PRIORITY = EMPTY.escalationsByPriority
export const ALERTS_BY_DEPARTMENT = EMPTY.alertsByDepartment
export const DEPARTMENT_WORKLOAD = EMPTY.departmentWorkload

export const CHART_COLORS = {
    primary: '#515DEF',
    success: '#4CAF50',
    warning: '#FF9800',
    danger: '#FF5722',
    info: '#2196F3',
    palette: ['#515DEF', '#4CAF50', '#FF9800', '#FF5722', '#2196F3', '#9C27B0'],
}
