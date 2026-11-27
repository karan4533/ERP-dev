const CLOSED_AUDIT = new Set(['completed', 'closed', 'approved'])
const UPCOMING_STATUS = new Set(['pending', 'assigned', 'scheduled', 'not started', 'in progress', 'overdue'])
const CLOSED_ESCALATION = new Set(['closed', 'resolved'])

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const asList = (value) => (Array.isArray(value) ? value : [])

const statusOf = (row) => String(row?.status || '').trim().toLowerCase()

const parseLooseDate = (value) => {
    if (!value) return null
    if (value instanceof Date && !Number.isNaN(value.getTime())) return value
    const text = String(value).trim()
    const dmy = text.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/)
    if (dmy) return new Date(Number(dmy[3]), Number(dmy[2]) - 1, Number(dmy[1]))
    const iso = text.match(/^(\d{4})-(\d{2})-(\d{2})/)
    if (iso) return new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]))
    const parsed = new Date(text)
    return Number.isNaN(parsed.getTime()) ? null : parsed
}

const startOfDay = (date) => {
    const next = new Date(date)
    next.setHours(0, 0, 0, 0)
    return next
}

const formatDmy = (date) => {
    const dd = String(date.getDate()).padStart(2, '0')
    const mm = String(date.getMonth() + 1).padStart(2, '0')
    return `${dd}-${mm}-${date.getFullYear()}`
}

const formatTime = (date) => {
    const hours = date.getHours()
    const minutes = String(date.getMinutes()).padStart(2, '0')
    const suffix = hours >= 12 ? 'PM' : 'AM'
    const h12 = hours % 12 || 12
    return `${String(h12).padStart(2, '0')}:${minutes} ${suffix}`
}

const emptyMonthlyTrend = () => {
    const now = new Date()
    const labels = []
    for (let i = 5; i >= 0; i -= 1) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
        labels.push(MONTH_LABELS[d.getMonth()])
    }
    return { labels, values: labels.map(() => 0) }
}

export const emptyAuditorDashboardPanels = () => ({
    monthlyComplianceTrend: emptyMonthlyTrend(),
    departmentCompliance: [],
    observationStatus: [
        { name: 'Open', value: 0 },
        { name: 'Assigned', value: 0 },
        { name: 'In Review', value: 0 },
        { name: 'Resolved', value: 0 },
        { name: 'Closed', value: 0 },
    ],
    auditCompletion: { completed: 0, total: 0, percentage: 0 },
    upcomingAuditsCalendar: [],
    recentActivity: [],
})

const complianceDepartments = (compliance) => {
    if (Array.isArray(compliance)) {
        return compliance
            .map((row) => ({
                department: String(row.department || row.label || '').trim(),
                compliance: Number(row.compliance ?? row.value) || 0,
            }))
            .filter((row) => row.department)
    }
    if (compliance && typeof compliance === 'object') {
        return asList(compliance.departments)
            .map((row) => ({
                department: String(row.department || row.label || '').trim(),
                compliance: Number(row.compliance ?? row.value) || 0,
            }))
            .filter((row) => row.department)
    }
    return []
}

const buildMonthlyComplianceTrend = (history) => {
    const base = emptyMonthlyTrend()
    const now = new Date()
    const buckets = base.labels.map((_, index) => {
        const d = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1)
        return { key: `${d.getFullYear()}-${d.getMonth()}`, sum: 0, count: 0 }
    })

    asList(history).forEach((row) => {
        const done = parseLooseDate(row.completedOn || row.auditDate || row.scheduledDate)
        const pct = Number(row.compliancePercent ?? row.compliance)
        if (!done || !Number.isFinite(pct)) return
        const key = `${done.getFullYear()}-${done.getMonth()}`
        const bucket = buckets.find((item) => item.key === key)
        if (!bucket) return
        bucket.sum += pct
        bucket.count += 1
    })

    return {
        labels: base.labels,
        values: buckets.map((bucket) => (bucket.count ? Math.round(bucket.sum / bucket.count) : 0)),
    }
}

const buildDepartmentComplianceFromHistory = (history) => {
    const byDept = new Map()
    asList(history).forEach((row) => {
        const department = String(row.department || '').trim()
        const pct = Number(row.compliancePercent ?? row.compliance)
        if (!department || !Number.isFinite(pct)) return
        const prev = byDept.get(department) || { sum: 0, count: 0 }
        prev.sum += pct
        prev.count += 1
        byDept.set(department, prev)
    })
    return [...byDept.entries()]
        .map(([department, { sum, count }]) => ({
            department,
            compliance: Math.round(sum / count),
        }))
        .sort((a, b) => a.department.localeCompare(b.department))
}

const buildObservationStatus = (observations) => {
    const counts = {
        Open: 0,
        Assigned: 0,
        'In Review': 0,
        Resolved: 0,
        Closed: 0,
    }
    asList(observations).forEach((row) => {
        const status = String(row.status || '').trim()
        if (status === 'Under Review') counts['In Review'] += 1
        else if (Object.prototype.hasOwnProperty.call(counts, status)) counts[status] += 1
        else if (status.toLowerCase() === 'open') counts.Open += 1
        else if (status.toLowerCase() === 'closed') counts.Closed += 1
    })
    return Object.entries(counts).map(([name, value]) => ({ name, value }))
}

const buildAuditCompletion = (audits, history) => {
    const auditList = asList(audits)
    const historyList = asList(history)
    const openish = auditList.filter((row) => !CLOSED_AUDIT.has(statusOf(row)))
    const completedFromAudits = auditList.filter((row) => CLOSED_AUDIT.has(statusOf(row))).length
    const completedFromHistory = historyList.filter((row) => CLOSED_AUDIT.has(statusOf(row)) || statusOf(row) === 'approved').length
    const completed = completedFromAudits + completedFromHistory
    const total = Math.max(openish.length + completed, auditList.length + historyList.length, completed)
    const percentage = total ? Math.round((completed / total) * 100) : 0
    return { completed, total, percentage }
}

const buildUpcomingCalendar = (audits) => {
    const today = startOfDay(new Date())
    return asList(audits)
        .map((row) => {
            const scheduled = parseLooseDate(row.scheduledDate || row.assignedDate || row.date || row.dueDate)
            if (!scheduled) return null
            if (startOfDay(scheduled) < today) return null
            if (CLOSED_AUDIT.has(statusOf(row))) return null
            if (statusOf(row) && !UPCOMING_STATUS.has(statusOf(row)) && statusOf(row) !== '') return null
            return {
                date: formatDmy(scheduled),
                day: DAY_LABELS[scheduled.getDay()],
                month: MONTH_LABELS[scheduled.getMonth()],
                auditId: row.auditId || row.id || row.auditNumber || '—',
                department: row.department || '—',
                auditType: row.auditType || row.auditName || 'Audit',
                _sort: scheduled.getTime(),
            }
        })
        .filter(Boolean)
        .sort((a, b) => a._sort - b._sort)
        .slice(0, 8)
        .map(({ _sort, ...rest }) => rest)
}

const pushActivity = (items, entry) => {
    const date = parseLooseDate(entry.date)
    if (!date) return
    items.push({
        ...entry,
        date: entry.date || formatDmy(date),
        time: entry.time || formatTime(date),
        _sort: date.getTime(),
    })
}

const buildRecentActivity = ({ audits, observations, escalations, history }) => {
    const items = []

    asList(audits).forEach((row) => {
        if (!CLOSED_AUDIT.has(statusOf(row))) return
        const date = row.completedOn || row.dueDate || row.scheduledDate
        pushActivity(items, {
            id: `audit-${row.auditId || row.id}`,
            type: 'Audit Submitted',
            reference: row.auditId || row.id || '—',
            department: row.department || '—',
            description: `${row.auditName || row.auditType || 'Audit'} report submitted.`,
            date,
        })
    })

    asList(history).forEach((row) => {
        const date = row.completedOn || row.auditDate
        pushActivity(items, {
            id: `hist-${row.auditNumber || row.id}`,
            type: 'Audit Submitted',
            reference: row.auditNumber || row.id || '—',
            department: row.department || '—',
            description: `${row.auditName || 'Audit'} completed with ${row.compliancePercent ?? '—'}% compliance.`,
            date,
        })
    })

    asList(observations).forEach((row) => {
        pushActivity(items, {
            id: `obs-${row.observationId || row.id}`,
            type: 'Observation Raised',
            reference: row.observationId || row.id || '—',
            department: row.department || '—',
            description: row.title || row.description || 'Observation raised.',
            date: row.createdDate || row.dueDate,
        })
    })

    asList(escalations).forEach((row) => {
        if (!CLOSED_ESCALATION.has(statusOf(row))) return
        pushActivity(items, {
            id: `esc-${row.escalationId || row.id}`,
            type: 'Escalation Closed',
            reference: row.escalationId || row.id || '—',
            department: row.department || '—',
            description: row.observationTitle || row.reason || 'Escalation closed.',
            date: row.expectedResolution || row.escalationDate,
        })
    })

    const seen = new Set()
    return items
        .sort((a, b) => b._sort - a._sort)
        .filter((item) => {
            if (seen.has(item.id)) return false
            seen.add(item.id)
            return true
        })
        .slice(0, 8)
        .map(({ _sort, ...rest }) => rest)
}

export function buildAuditorDashboardPanels({
    audits = [],
    observations = [],
    escalations = [],
    compliance = null,
    history = [],
} = {}) {
    const departments = complianceDepartments(compliance)
    return {
        monthlyComplianceTrend: buildMonthlyComplianceTrend(history),
        departmentCompliance: departments.length ? departments : buildDepartmentComplianceFromHistory(history),
        observationStatus: buildObservationStatus(observations),
        auditCompletion: buildAuditCompletion(audits, history),
        upcomingAuditsCalendar: buildUpcomingCalendar(audits),
        recentActivity: buildRecentActivity({ audits, observations, escalations, history }),
    }
}
