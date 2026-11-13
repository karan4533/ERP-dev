import { getComplianceData, getComplianceColor } from '../../ProcessAuditor/Reports/ComplianceReports/complianceReportsData'
import { MONTHLY_COMPLIANCE_TREND } from '../../ProcessAuditor/Dashboard/dashboardData'
import { getPendingActions } from '../../ProcessAuditor/Reports/ActionsReports/actionsReportsData'
import { getAuditReports } from '../../ProcessAuditor/Reports/AuditReports/auditReportsData'
import {
    FINDINGS,
    severityBadgeColor as findingSeverityBadgeColor,
    statusBadgeColor as findingStatusBadgeColor,
    complianceBadgeColor,
} from '../../JointDirectorAudit/FindingsCompliance/findingsComplianceData'
import {
    AUDIT_SUMMARY_REPORT,
    COMPLIANCE_PERFORMANCE_REPORT,
    RECURRING_ISSUES_REPORT,
    RISK_ANALYSIS_REPORT,
    severityBadgeColor,
    statusBadgeColor as riskStatusBadgeColor,
} from '../../JointDirectorAudit/ReportsAnalytics/reportsAnalyticsData'

export const ROUTE_BASE = '/super-admin/audit-reports'

export const AUDIT_REPORT_SECTIONS = [
    { key: 'overview', label: 'Overview', route: `${ROUTE_BASE}/overview` },
    { key: 'compliance', label: 'Compliance Score', route: `${ROUTE_BASE}/compliance` },
    { key: 'department-ranking', label: 'Department Ranking', route: `${ROUTE_BASE}/department-ranking` },
    { key: 'pending-findings', label: 'Pending Findings', route: `${ROUTE_BASE}/pending-findings` },
    { key: 'critical-findings', label: 'Critical Findings', route: `${ROUTE_BASE}/critical-findings` },
    { key: 'risk-dashboard', label: 'Risk Dashboard', route: `${ROUTE_BASE}/risk-dashboard` },
]

export {
    MONTHLY_COMPLIANCE_TREND,
    RISK_ANALYSIS_REPORT,
    getComplianceColor,
    findingSeverityBadgeColor,
    findingStatusBadgeColor,
    complianceBadgeColor,
    severityBadgeColor,
    riskStatusBadgeColor,
}

export const getComplianceScore = () => getComplianceData().summary.overall

export const getComplianceSummaryCards = () => {
    const { summary } = getComplianceData()
    return [
        { label: 'Overall Compliance', value: `${summary.overall}%`, accent: getComplianceColor(summary.overall) },
        ...summary.departments.map((item) => ({
            label: item.label,
            value: `${item.value}%`,
            accent: getComplianceColor(item.value),
        })),
    ]
}

export const getDepartmentRanking = () => {
    const { departments } = getComplianceData()
    return [...departments]
        .sort((a, b) => b.compliance - a.compliance)
        .map((row, index) => ({ rank: index + 1, ...row }))
}

export const getPendingFindings = () =>
    FINDINGS.filter((finding) => finding.status !== 'Closed')

export const getCriticalFindings = () =>
    FINDINGS.filter((finding) => finding.severity === 'Critical' && finding.status !== 'Closed')

export const getActiveRisks = () =>
    RISK_ANALYSIS_REPORT.filter((risk) => risk.status === 'Active')

export const getOverviewSummary = () => {
    const pending = getPendingFindings()
    const critical = getCriticalFindings()
    const activeRisks = getActiveRisks()
    const completedAudits = getAuditReports().filter((report) =>
        ['Completed', 'Approved', 'Closed'].includes(report.status),
    ).length

    return [
        { label: 'Overall Compliance', value: `${getComplianceScore()}%`, sub: 'School-wide average' },
        { label: 'Departments Ranked', value: String(getDepartmentRanking().length), sub: 'By compliance score' },
        { label: 'Pending Findings', value: String(pending.length), sub: 'Open or in progress' },
        { label: 'Critical Findings', value: String(critical.length), sub: 'Require immediate action' },
        { label: 'Active Risks', value: String(activeRisks.length), sub: `${completedAudits} audits completed` },
    ]
}

export const getSectionMeta = (sectionKey) =>
    AUDIT_REPORT_SECTIONS.find((section) => section.key === sectionKey) ?? AUDIT_REPORT_SECTIONS[0]

export const getSectionSummary = (sectionKey) => {
    switch (sectionKey) {
        case 'compliance': {
            const { summary } = getComplianceData()
            return [
                { label: 'Overall Score', value: `${summary.overall}%` },
                { label: 'Top Department', value: `${getDepartmentRanking()[0]?.department ?? '—'} (${getDepartmentRanking()[0]?.compliance ?? 0}%)` },
                { label: 'Lowest Department', value: `${getDepartmentRanking().at(-1)?.department ?? '—'} (${getDepartmentRanking().at(-1)?.compliance ?? 0}%)` },
                { label: 'Departments Below 85%', value: String(getDepartmentRanking().filter((row) => row.compliance < 85).length) },
            ]
        }
        case 'department-ranking':
            return [
                { label: 'Total Departments', value: String(getDepartmentRanking().length) },
                { label: 'Above 90%', value: String(getDepartmentRanking().filter((row) => row.compliance >= 90).length) },
                { label: 'Total Pending Findings', value: String(getDepartmentRanking().reduce((sum, row) => sum + row.pendingFindings, 0)) },
                { label: 'Total Closed Findings', value: String(getDepartmentRanking().reduce((sum, row) => sum + row.closedFindings, 0)) },
            ]
        case 'pending-findings': {
            const pending = getPendingFindings()
            return [
                { label: 'Total Pending', value: String(pending.length) },
                { label: 'Overdue', value: String(pending.filter((row) => row.complianceStatus === 'Overdue').length) },
                { label: 'High Severity', value: String(pending.filter((row) => row.severity === 'High').length) },
                { label: 'Corrective Actions Open', value: String(getPendingActions().length) },
            ]
        }
        case 'critical-findings': {
            const critical = getCriticalFindings()
            return [
                { label: 'Critical Open', value: String(critical.length) },
                { label: 'Overdue', value: String(critical.filter((row) => row.complianceStatus === 'Overdue').length) },
                { label: 'In Progress', value: String(critical.filter((row) => row.status === 'In Progress').length) },
                { label: 'Active Risk Items', value: String(getActiveRisks().length) },
            ]
        }
        case 'risk-dashboard': {
            const risks = RISK_ANALYSIS_REPORT
            return [
                { label: 'Total Risk Items', value: String(risks.length) },
                { label: 'Active', value: String(risks.filter((row) => row.status === 'Active').length) },
                { label: 'Critical Severity', value: String(risks.filter((row) => row.severity === 'Critical').length) },
                { label: 'Recurring Issue Types', value: String(RECURRING_ISSUES_REPORT.length) },
            ]
        }
        default:
            return []
    }
}

export const getSectionTable = (tableKey) => {
    switch (tableKey) {
        case 'department-ranking':
            return {
                title: 'Department Compliance Ranking',
                columns: [
                    { key: 'rank', label: 'Rank' },
                    { key: 'department', label: 'Department' },
                    { key: 'totalAudits', label: 'Total Audits' },
                    { key: 'compliance', label: 'Compliance', suffix: '%', colorKey: 'compliance' },
                    { key: 'pendingFindings', label: 'Pending', highlight: 'warning' },
                    { key: 'closedFindings', label: 'Closed', highlight: 'success' },
                ],
                rows: getDepartmentRanking(),
            }
        case 'compliance-performance':
            return {
                title: 'Compliance Performance (JD Audit)',
                columns: [
                    { key: 'department', label: 'Department' },
                    { key: 'totalFindings', label: 'Total Findings' },
                    { key: 'closed', label: 'Closed' },
                    { key: 'pending', label: 'Pending' },
                    { key: 'compliance', label: 'Compliance', suffix: '%', colorKey: 'compliance' },
                ],
                rows: COMPLIANCE_PERFORMANCE_REPORT,
            }
        case 'pending-findings':
            return {
                title: 'Pending Findings Register',
                columns: [
                    { key: 'id', label: 'Finding ID' },
                    { key: 'department', label: 'Department' },
                    { key: 'title', label: 'Title' },
                    { key: 'severity', label: 'Severity', badge: true, badgeMap: findingSeverityBadgeColor },
                    { key: 'status', label: 'Status', badge: true, badgeMap: findingStatusBadgeColor },
                    { key: 'complianceStatus', label: 'Compliance', badge: true, badgeMap: complianceBadgeColor },
                    { key: 'dueDate', label: 'Due Date' },
                ],
                rows: getPendingFindings(),
            }
        case 'pending-actions':
            return {
                title: 'Open Corrective Actions',
                columns: [
                    { key: 'observationId', label: 'Observation ID' },
                    { key: 'observation', label: 'Observation' },
                    { key: 'department', label: 'Department' },
                    { key: 'assignedTo', label: 'Assigned To' },
                    { key: 'dueDate', label: 'Due Date' },
                    { key: 'daysLeft', label: 'Days Left' },
                    { key: 'status', label: 'Status', badge: true, badgeMap: findingStatusBadgeColor },
                ],
                rows: getPendingActions(),
            }
        case 'critical-findings':
            return {
                title: 'Critical Findings Register',
                columns: [
                    { key: 'id', label: 'Finding ID' },
                    { key: 'auditTitle', label: 'Audit' },
                    { key: 'department', label: 'Department' },
                    { key: 'title', label: 'Title' },
                    { key: 'responsiblePerson', label: 'Responsible' },
                    { key: 'status', label: 'Status', badge: true, badgeMap: findingStatusBadgeColor },
                    { key: 'complianceStatus', label: 'Compliance', badge: true, badgeMap: complianceBadgeColor },
                    { key: 'dueDate', label: 'Due Date' },
                ],
                rows: getCriticalFindings(),
            }
        case 'risk-dashboard':
            return {
                title: 'Risk Analysis Register',
                columns: [
                    { key: 'riskArea', label: 'Risk Area' },
                    { key: 'department', label: 'Department' },
                    { key: 'severity', label: 'Severity', badge: true, badgeMap: severityBadgeColor },
                    { key: 'status', label: 'Status', badge: true, badgeMap: riskStatusBadgeColor },
                ],
                rows: RISK_ANALYSIS_REPORT,
            }
        case 'recurring-issues':
            return {
                title: 'Recurring Issues',
                columns: [
                    { key: 'department', label: 'Department' },
                    { key: 'issueType', label: 'Issue Type' },
                    { key: 'occurrences', label: 'Occurrences' },
                ],
                rows: RECURRING_ISSUES_REPORT,
            }
        case 'audit-summary':
            return {
                title: 'Audit Summary',
                columns: [
                    { key: 'auditId', label: 'Audit ID' },
                    { key: 'department', label: 'Department' },
                    { key: 'type', label: 'Type' },
                    { key: 'findings', label: 'Findings' },
                    { key: 'status', label: 'Status', badge: true, badgeMap: riskStatusBadgeColor },
                ],
                rows: AUDIT_SUMMARY_REPORT,
            }
        default:
            return { title: '', columns: [], rows: [] }
    }
}

export const getSectionTables = (sectionKey) => {
    switch (sectionKey) {
        case 'compliance':
            return [getSectionTable('compliance-performance'), getSectionTable('department-ranking')]
        case 'department-ranking':
            return [getSectionTable('department-ranking')]
        case 'pending-findings':
            return [getSectionTable('pending-findings'), getSectionTable('pending-actions')]
        case 'critical-findings':
            return [getSectionTable('critical-findings')]
        case 'risk-dashboard':
            return [getSectionTable('risk-dashboard'), getSectionTable('recurring-issues'), getSectionTable('audit-summary')]
        default:
            return []
    }
}

export const getOverviewPreviewTables = () => [
    getSectionTable('department-ranking'),
    getSectionTable('pending-findings'),
    getSectionTable('critical-findings'),
    getSectionTable('risk-dashboard'),
]
