import { emptyAuditDashboardView } from './liveDashboardLoader'

/** Empty placeholders until `loadLiveAuditDashboard` hydrates findings/plans. */
const EMPTY = emptyAuditDashboardView()

export const KPI_CARDS = EMPTY.kpiCards
export const UPCOMING_AUDITS = EMPTY.upcomingAudits
export const CRITICAL_FINDINGS = EMPTY.criticalFindings
export const COMPLIANCE_SUMMARY = EMPTY.complianceSummary

export const severityBadgeColor = {
    Critical: 'bg-[#FF000033] text-[#FF0000]',
    High: 'bg-[#FF980033] text-[#FF9800]',
    Medium: 'bg-[#2196F333] text-[#2196F3]',
    Low: 'bg-[#66708533] text-[#667085]',
}

export const AUDIT_TRENDS = EMPTY.auditTrends

export const CHART_COLORS = {
    primary: '#515DEF',
    success: '#4CAF50',
    warning: '#FF9800',
    danger: '#FF5722',
    info: '#2196F3',
}
