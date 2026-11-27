/**
 * Derive Super Admin Audit Reports sections from the live JD audit findings collection.
 * Never import DEFAULT_FINDINGS / Process Auditor mock reports here.
 */
import {
    severityBadgeColor as findingSeverityBadgeColor,
    statusBadgeColor as findingStatusBadgeColor,
    complianceBadgeColor,
} from '../../JointDirectorAudit/FindingsCompliance/findingsComplianceData'

export const ROUTE_BASE = '/super-admin/audit-reports'

export const AUDIT_REPORT_SECTIONS = [
    { key: 'overview', label: 'Overview', route: `${ROUTE_BASE}/overview` },
    { key: 'compliance', label: 'Compliance Score', route: `${ROUTE_BASE}/compliance` },
    { key: 'department-ranking', label: 'Department Ranking', route: `${ROUTE_BASE}/department-ranking` },
    { key: 'pending-findings', label: 'Pending Findings', route: `${ROUTE_BASE}/pending-findings` },
    { key: 'critical-findings', label: 'Critical Findings', route: `${ROUTE_BASE}/critical-findings` },
    { key: 'risk-dashboard', label: 'Risk Dashboard', route: `${ROUTE_BASE}/risk-dashboard` },
]

export const getComplianceColor = (value) => {
    const n = Number(value) || 0
    if (n >= 90) return '#4CAF50'
    if (n >= 80) return '#515DEF'
    if (n >= 70) return '#FF9800'
    return '#FF0000'
}

export {
    findingSeverityBadgeColor,
    findingStatusBadgeColor,
    complianceBadgeColor,
}

const isClosed = (f) => /closed|resolved/i.test(String(f.status || ''))
const isOpen = (f) => !isClosed(f)
const isCritical = (f) => /critical/i.test(String(f.severity || ''))
const isHigh = (f) => /high/i.test(String(f.severity || ''))

const normalizeFinding = (f) => ({
    id: f.id || f.findingId || '—',
    auditId: f.auditId || f.audit_id || '—',
    auditTitle: f.auditTitle || f.audit_title || f.auditName || '—',
    department: f.department || 'General',
    title: f.title || f.subject || 'Finding',
    severity: f.severity || 'Medium',
    status: f.status || 'Open',
    complianceStatus: f.complianceStatus || f.compliance_status || (isClosed(f) ? 'Complied' : 'Pending'),
    responsiblePerson: f.responsiblePerson || f.assignedTo || f.owner || '—',
    dueDate: f.dueDate || f.due_date || '—',
    raisedDate: f.raisedDate || f.raised_date || f.createdAt || '—',
    observation: f.observation || '',
    correctiveAction: f.correctiveAction || f.corrective_action || '',
    actionTaken: f.actionTaken || f.action_taken || '',
})

export const buildDepartmentRanking = (findings = []) => {
    const byDept = new Map()
    findings.forEach((raw) => {
        const f = normalizeFinding(raw)
        const bucket = byDept.get(f.department) || {
            department: f.department,
            pendingFindings: 0,
            closedFindings: 0,
            totalAudits: 0,
            criticalOpen: 0,
        }
        bucket.totalAudits += 1
        if (isClosed(f)) bucket.closedFindings += 1
        else {
            bucket.pendingFindings += 1
            if (isCritical(f)) bucket.criticalOpen += 1
        }
        byDept.set(f.department, bucket)
    })

    return [...byDept.values()]
        .map((row) => {
            const total = row.pendingFindings + row.closedFindings
            const compliance = total ? Math.round((row.closedFindings / total) * 100) : null
            return {
                ...row,
                compliance: compliance == null ? 0 : compliance,
                complianceLabel: compliance == null ? '—' : `${compliance}%`,
            }
        })
        .sort((a, b) => (b.compliance || 0) - (a.compliance || 0))
        .map((row, index) => ({ rank: index + 1, ...row }))
}

export const buildLiveAuditReports = (findingsInput = []) => {
    const findings = (Array.isArray(findingsInput) ? findingsInput : []).map(normalizeFinding)
    const pending = findings.filter(isOpen)
    const closed = findings.filter(isClosed)
    const critical = pending.filter(isCritical)
    const high = pending.filter(isHigh)
    const ranking = buildDepartmentRanking(findings)
    const scored = ranking.filter((row) => row.pendingFindings + row.closedFindings > 0)
    const complianceScore = scored.length
        ? Math.round(scored.reduce((sum, row) => sum + row.compliance, 0) / scored.length)
        : null

    const overdue = pending.filter((row) => /overdue/i.test(String(row.complianceStatus || '')))
    const inProgress = pending.filter((row) => /progress/i.test(String(row.status || '')))

    const openActions = pending
        .filter((row) => row.correctiveAction)
        .map((row) => ({
            observationId: row.id,
            observation: row.title,
            department: row.department,
            assignedTo: row.responsiblePerson,
            dueDate: row.dueDate,
            daysLeft: '—',
            status: row.status,
        }))

    // Risk view = open findings by severity (no separate mock risk register).
    const risks = pending.map((row) => ({
        riskArea: row.title,
        department: row.department,
        severity: row.severity,
        status: /progress/i.test(row.status) ? 'Monitoring' : 'Active',
        findingId: row.id,
    }))

    const recurring = (() => {
        const map = new Map()
        findings.forEach((row) => {
            const key = `${row.department}::${String(row.title || '').toLowerCase().slice(0, 48)}`
            const cur = map.get(key) || { department: row.department, issueType: row.title, occurrences: 0 }
            cur.occurrences += 1
            map.set(key, cur)
        })
        return [...map.values()].filter((row) => row.occurrences > 1).sort((a, b) => b.occurrences - a.occurrences)
    })()

    const auditSummary = (() => {
        const map = new Map()
        findings.forEach((row) => {
            const key = row.auditId || row.auditTitle
            const cur = map.get(key) || {
                auditId: row.auditId,
                department: row.department,
                type: row.auditTitle,
                findings: 0,
                open: 0,
                status: 'Active',
            }
            cur.findings += 1
            if (isOpen(row)) cur.open += 1
            map.set(key, cur)
        })
        return [...map.values()].map((row) => ({
            ...row,
            status: row.open ? 'Active' : 'Mitigated',
        }))
    })()

    const severityCounts = {
        Critical: pending.filter(isCritical).length,
        High: pending.filter(isHigh).length,
        Medium: pending.filter((f) => /medium/i.test(f.severity)).length,
        Low: pending.filter((f) => /low/i.test(f.severity)).length,
    }

    const riskStatusCounts = {
        Active: risks.filter((r) => r.status === 'Active').length,
        Monitoring: risks.filter((r) => r.status === 'Monitoring').length,
        Mitigated: closed.length,
    }

    const sectionMeta = (sectionKey) =>
        AUDIT_REPORT_SECTIONS.find((section) => section.key === sectionKey) ?? AUDIT_REPORT_SECTIONS[0]

    const sectionSummary = (sectionKey) => {
        switch (sectionKey) {
            case 'compliance':
                return [
                    { label: 'Overall Score', value: complianceScore == null ? '—' : `${complianceScore}%` },
                    {
                        label: 'Top Department',
                        value: ranking[0]
                            ? `${ranking[0].department} (${ranking[0].complianceLabel})`
                            : '—',
                    },
                    {
                        label: 'Lowest Department',
                        value: ranking.length
                            ? `${ranking.at(-1).department} (${ranking.at(-1).complianceLabel})`
                            : '—',
                    },
                    {
                        label: 'Departments Below 85%',
                        value: String(ranking.filter((row) => row.compliance < 85).length),
                    },
                ]
            case 'department-ranking':
                return [
                    { label: 'Departments with findings', value: String(ranking.length) },
                    { label: 'Above 90%', value: String(ranking.filter((row) => row.compliance >= 90).length) },
                    { label: 'Open findings', value: String(pending.length) },
                    { label: 'Closed findings', value: String(closed.length) },
                ]
            case 'pending-findings':
                return [
                    { label: 'Total Pending', value: String(pending.length) },
                    { label: 'Overdue', value: String(overdue.length) },
                    { label: 'High Severity', value: String(high.length) },
                    { label: 'Corrective Actions Open', value: String(openActions.length) },
                ]
            case 'critical-findings':
                return [
                    { label: 'Critical Open', value: String(critical.length) },
                    { label: 'Overdue', value: String(critical.filter((row) => /overdue/i.test(row.complianceStatus)).length) },
                    { label: 'In Progress', value: String(critical.filter((row) => /progress/i.test(row.status)).length) },
                    { label: 'Active Risk Items', value: String(risks.filter((r) => r.status === 'Active').length) },
                ]
            case 'risk-dashboard':
                return [
                    { label: 'Open Risk Items', value: String(risks.length) },
                    { label: 'Active', value: String(riskStatusCounts.Active) },
                    { label: 'Critical Severity', value: String(severityCounts.Critical) },
                    { label: 'Recurring Issue Types', value: String(recurring.length) },
                ]
            default:
                return []
        }
    }

    const complianceCards = [
        {
            label: 'Overall Compliance',
            value: complianceScore == null ? '—' : `${complianceScore}%`,
            accent: getComplianceColor(complianceScore ?? 0),
        },
        ...ranking.slice(0, 7).map((row) => ({
            label: row.department,
            value: row.complianceLabel,
            accent: getComplianceColor(row.compliance),
        })),
    ]

    const tablesFor = (sectionKey) => {
        const deptTable = {
            title: 'Department Compliance Ranking',
            columns: [
                { key: 'rank', label: 'Rank' },
                { key: 'department', label: 'Department' },
                { key: 'totalAudits', label: 'Total Findings' },
                { key: 'compliance', label: 'Compliance', suffix: '%', colorKey: 'compliance' },
                { key: 'pendingFindings', label: 'Open', highlight: 'warning' },
                { key: 'closedFindings', label: 'Closed', highlight: 'success' },
            ],
            rows: ranking,
        }
        const pendingTable = {
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
            rows: pending,
        }
        const actionsTable = {
            title: 'Open Corrective Actions',
            columns: [
                { key: 'observationId', label: 'Finding ID' },
                { key: 'observation', label: 'Observation' },
                { key: 'department', label: 'Department' },
                { key: 'assignedTo', label: 'Assigned To' },
                { key: 'dueDate', label: 'Due Date' },
                { key: 'status', label: 'Status', badge: true, badgeMap: findingStatusBadgeColor },
            ],
            rows: openActions,
        }
        const criticalTable = {
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
            rows: critical,
        }
        const riskTable = {
            title: 'Open Findings as Risk Items',
            columns: [
                { key: 'riskArea', label: 'Risk Area' },
                { key: 'department', label: 'Department' },
                { key: 'severity', label: 'Severity', badge: true, badgeMap: findingSeverityBadgeColor },
                { key: 'status', label: 'Status', badge: true, badgeMap: findingStatusBadgeColor },
            ],
            rows: risks,
        }
        const recurringTable = {
            title: 'Recurring Issues (same title 2+ times)',
            columns: [
                { key: 'department', label: 'Department' },
                { key: 'issueType', label: 'Issue Type' },
                { key: 'occurrences', label: 'Occurrences' },
            ],
            rows: recurring,
        }
        const auditTable = {
            title: 'Audit Summary (from findings)',
            columns: [
                { key: 'auditId', label: 'Audit ID' },
                { key: 'department', label: 'Department' },
                { key: 'type', label: 'Type' },
                { key: 'findings', label: 'Findings' },
                { key: 'status', label: 'Status', badge: true, badgeMap: findingStatusBadgeColor },
            ],
            rows: auditSummary,
        }
        const performanceTable = {
            title: 'Compliance Performance by Department',
            columns: [
                { key: 'department', label: 'Department' },
                { key: 'totalAudits', label: 'Total Findings' },
                { key: 'closedFindings', label: 'Closed' },
                { key: 'pendingFindings', label: 'Pending' },
                { key: 'compliance', label: 'Compliance', suffix: '%', colorKey: 'compliance' },
            ],
            rows: ranking,
        }

        switch (sectionKey) {
            case 'compliance':
                return [performanceTable, deptTable]
            case 'department-ranking':
                return [deptTable]
            case 'pending-findings':
                return [pendingTable, actionsTable]
            case 'critical-findings':
                return [criticalTable]
            case 'risk-dashboard':
                return [riskTable, recurringTable, auditTable]
            default:
                return []
        }
    }

    return {
        findings,
        pending,
        closed,
        critical,
        ranking,
        complianceScore,
        complianceCards,
        severityCounts,
        riskStatusCounts,
        sectionMeta,
        sectionSummary,
        tablesFor,
        overviewSummary: [
            { label: 'Total Findings', value: findings.length },
            { label: 'Open', value: pending.length },
            { label: 'Closed', value: closed.length },
            {
                label: 'Compliance Score',
                value: complianceScore == null ? '—' : `${complianceScore}%`,
            },
        ],
        overviewPreview: [
            {
                title: 'Open Findings',
                columns: [
                    { key: 'title', label: 'Finding' },
                    { key: 'department', label: 'Department' },
                    { key: 'severity', label: 'Severity', badge: true, badgeMap: findingSeverityBadgeColor },
                    { key: 'status', label: 'Status', badge: true, badgeMap: findingStatusBadgeColor },
                ],
                rows: pending.slice(0, 10),
            },
            {
                title: 'Department Ranking',
                columns: [
                    { key: 'rank', label: 'Rank' },
                    { key: 'department', label: 'Department' },
                    { key: 'compliance', label: 'Compliance', suffix: '%', colorKey: 'compliance' },
                    { key: 'pendingFindings', label: 'Open', highlight: 'warning' },
                    { key: 'closedFindings', label: 'Closed', highlight: 'success' },
                ],
                rows: ranking.slice(0, 10),
            },
        ],
    }
}
