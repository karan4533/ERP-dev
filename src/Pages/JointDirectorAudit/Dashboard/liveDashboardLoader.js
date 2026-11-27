import { getCampusMemory, loadCampusJson, usesCampusApiForKey } from '../../../services/campusJsonStore'
import {
    AUDIT_MONITORING_STORAGE_KEY,
    hydrateAuditMonitoringFromApi,
} from '../AuditMonitoring/auditMonitoringData'
import {
    AUDIT_PLANS_STORAGE_KEY,
    DEPARTMENTS as AUDIT_DEPARTMENTS,
    hydrateAuditPlansFromApi,
} from '../AuditPlanning/auditPlanningData'
import {
    FINDINGS_STORAGE_KEY,
    hydrateFindingsFromApi,
} from '../FindingsCompliance/findingsComplianceData'

const readCampusRows = (storageKey) => {
    if (usesCampusApiForKey(storageKey)) {
        const mem = getCampusMemory(storageKey)
        return Array.isArray(mem) ? mem : []
    }
    const rows = loadCampusJson(storageKey, [])
    return Array.isArray(rows) ? rows : []
}

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const parseDmy = (value) => {
    const match = String(value || '').match(/(\d{1,2})-(\d{1,2})-(\d{4})/)
    if (match) return new Date(Number(match[3]), Number(match[2]) - 1, Number(match[1]))
    const iso = Date.parse(value)
    return Number.isFinite(iso) ? new Date(iso) : null
}

const isOpenFinding = (row) => {
    const status = String(row?.status || '').toLowerCase()
    return status && status !== 'closed' && status !== 'resolved' && status !== 'complied'
}

const emptyMonthSeries = () => Array(6).fill(0)

const lastSixMonthLabels = () => {
    const now = new Date()
    const labels = []
    for (let i = 5; i >= 0; i -= 1) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
        labels.push(MONTH_LABELS[d.getMonth()])
    }
    return labels
}

const countInLastSixMonths = (rows, getDate) => {
    const now = new Date()
    const buckets = emptyMonthSeries()
    rows.forEach((row) => {
        const date = parseDmy(getDate(row))
        if (!date) return
        const monthDiff = (now.getFullYear() - date.getFullYear()) * 12 + (now.getMonth() - date.getMonth())
        if (monthDiff < 0 || monthDiff > 5) return
        buckets[5 - monthDiff] += 1
    })
    return buckets
}

export const emptyAuditDashboardView = () => ({
    kpiCards: [
        { label: 'Total Audits Scheduled', value: '0', sub: 'Current quarter plan' },
        { label: 'Audits In Progress', value: '0', sub: 'Active field reviews' },
        { label: 'Completed Audits', value: '0', sub: 'Closed this quarter' },
        { label: 'Pending Findings', value: '0', sub: 'Awaiting remediation' },
        { label: 'Open Compliance Actions', value: '0', sub: 'Assigned owners pending' },
        { label: 'Critical Observations', value: '0', sub: 'Requires immediate attention' },
        { label: 'Compliance Score (%)', value: '0%', sub: 'School-wide average' },
        { label: 'Overdue Actions', value: '0', sub: 'Past due date' },
    ],
    upcomingAudits: [],
    criticalFindings: [],
    complianceSummary: AUDIT_DEPARTMENTS.slice(0, 5).map((department) => ({
        department,
        compliance: 0,
    })),
    auditTrends: {
        labels: lastSixMonthLabels(),
        auditsConducted: emptyMonthSeries(),
        findingsRaised: emptyMonthSeries(),
        findingsClosed: emptyMonthSeries(),
    },
})

/**
 * Findings / planning focused live snapshot for Joint Director Audit.
 * Empty collections → zeros and empty tables (no AUD-/FND- seed rows).
 */
export async function loadLiveAuditDashboard() {
    await Promise.allSettled([
        hydrateFindingsFromApi(),
        hydrateAuditPlansFromApi(),
        hydrateAuditMonitoringFromApi(),
    ])

    const findings = readCampusRows(FINDINGS_STORAGE_KEY)
    const plans = readCampusRows(AUDIT_PLANS_STORAGE_KEY)
    const monitoring = readCampusRows(AUDIT_MONITORING_STORAGE_KEY)

    const openFindings = findings.filter(isOpenFinding)
    const pendingFindings = openFindings
    const criticalObservations = openFindings.filter((row) =>
        /critical|high/i.test(String(row.severity || '')),
    )
    const openCompliance = findings.filter((row) => {
        const c = String(row.complianceStatus || '').toLowerCase()
        return c === 'pending' || c === 'overdue'
    })
    const overdueActions = findings.filter((row) =>
        String(row.complianceStatus || '').toLowerCase() === 'overdue',
    )

    const inProgress = plans.filter((row) => String(row.status || '') === 'In Progress')
        .concat(monitoring.filter((row) => String(row.status || '') === 'In Progress'))
    // Deduplicate in-progress by id
    const inProgressIds = new Set()
    const auditsInProgress = inProgress.filter((row) => {
        const id = row.id || row.auditId
        if (!id) return true
        if (inProgressIds.has(id)) return false
        inProgressIds.add(id)
        return true
    })
    const completed = plans.filter((row) => String(row.status || '') === 'Completed')
        .concat(monitoring.filter((row) => String(row.status || '') === 'Completed'))

    const closedFindings = findings.filter((row) => !isOpenFinding(row))
    const complianceScore = findings.length
        ? Math.max(0, Math.round((closedFindings.length / findings.length) * 100))
        : 0

    const departments = [...new Set([
        ...AUDIT_DEPARTMENTS,
        ...findings.map((f) => f.department).filter(Boolean),
    ])]

    const complianceSummary = departments.map((department) => {
        const deptFindings = findings.filter((f) => f.department === department)
        if (!deptFindings.length) return { department, compliance: 0 }
        const closed = deptFindings.filter((f) => !isOpenFinding(f)).length
        return {
            department,
            compliance: Math.round((closed / deptFindings.length) * 100),
        }
    }).filter((row) => findings.some((f) => f.department === row.department) || AUDIT_DEPARTMENTS.includes(row.department))
        .slice(0, 8)

    // Prefer departments that have findings; if none, show empty zeros for first 5 known depts
    const summaryRows = findings.length
        ? complianceSummary.filter((row) => findings.some((f) => f.department === row.department))
        : AUDIT_DEPARTMENTS.slice(0, 5).map((department) => ({ department, compliance: 0 }))

    const upcomingAudits = [...plans]
        .filter((row) => {
            const status = String(row.status || '')
            return status === 'Planned' || status === 'In Progress'
        })
        .sort((a, b) => {
            const da = parseDmy(a.scheduledDate || a.plannedDate)?.getTime() || 0
            const db = parseDmy(b.scheduledDate || b.plannedDate)?.getTime() || 0
            return da - db
        })
        .slice(0, 8)
        .map((row) => ({
            auditId: row.id || row.auditId || '—',
            auditType: row.auditType || row.title || 'Audit',
            department: row.department || '—',
            scheduledDate: row.scheduledDate || row.plannedDate || '—',
        }))

    const criticalFindings = [...criticalObservations]
        .sort((a, b) => {
            const rank = (s) => (/critical/i.test(s) ? 0 : /high/i.test(s) ? 1 : 2)
            return rank(a.severity) - rank(b.severity)
        })
        .slice(0, 8)
        .map((row) => ({
            findingId: row.id || row.findingId || '—',
            department: row.department || '—',
            severity: row.severity || 'Medium',
        }))

    return {
        kpiCards: [
            { label: 'Total Audits Scheduled', value: String(plans.length), sub: 'Current quarter plan' },
            { label: 'Audits In Progress', value: String(auditsInProgress.length), sub: 'Active field reviews' },
            { label: 'Completed Audits', value: String(completed.length ? new Set(completed.map((r) => r.id || r.auditId)).size : 0), sub: 'Closed this quarter' },
            { label: 'Pending Findings', value: String(pendingFindings.length), sub: 'Awaiting remediation' },
            { label: 'Open Compliance Actions', value: String(openCompliance.length), sub: 'Assigned owners pending' },
            { label: 'Critical Observations', value: String(criticalObservations.length), sub: 'Requires immediate attention' },
            { label: 'Compliance Score (%)', value: `${complianceScore}%`, sub: 'School-wide average' },
            { label: 'Overdue Actions', value: String(overdueActions.length), sub: 'Past due date' },
        ],
        upcomingAudits,
        criticalFindings,
        complianceSummary: summaryRows.length ? summaryRows : emptyAuditDashboardView().complianceSummary,
        auditTrends: {
            labels: lastSixMonthLabels(),
            auditsConducted: countInLastSixMonths(
                [...plans, ...monitoring],
                (row) => row.scheduledDate || row.plannedDate || row.completedDate || row.startDate,
            ),
            findingsRaised: countInLastSixMonths(findings, (row) => row.raisedDate || row.dueDate),
            findingsClosed: countInLastSixMonths(closedFindings, (row) => row.raisedDate || row.dueDate),
        },
    }
}
