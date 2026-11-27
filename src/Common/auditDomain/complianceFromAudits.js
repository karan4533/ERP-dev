/**
 * Compliance figures computed from real audit records (execute drafts + observations + schedules).
 * Pure and deterministic so totals can be checked against the source rows (node --test).
 */

export const OPEN_FINDING_STATUSES = ['Open', 'Assigned', 'In Review']
export const CLOSED_FINDING_STATUSES = ['Resolved', 'Closed']

const TEXT_TYPES = new Set(['date', 'place', 'location', 'venue', 'text', 'textarea', 'remarks', 'comment'])
const YES_NO_TYPES = new Set(['yes_no', 'pass_fail', 'checkbox', ''])

/** Same rules as ExecuteAudit getScoreResult: 'pass' | 'fail' | 'partial' | 'na'. */
export const defaultScoreResult = (responseType, value) => {
    const kind = String(responseType || 'yes_no').trim().toLowerCase()
    if (YES_NO_TYPES.has(kind)) {
        if (value === 'Yes') return 'pass'
        if (value === 'No' || value === 'Error') return 'fail'
        return 'na'
    }
    if (TEXT_TYPES.has(kind)) return String(value || '').trim() ? 'pass' : 'na'
    if (value === 'Yes' || value === 'Compliant') return 'pass'
    if (value === 'No' || value === 'Error' || String(value ?? '').includes('Non-Conformity')) return 'fail'
    return 'na'
}

/** Parses dd-mm-yyyy, yyyy-mm-dd or ISO strings; returns a local Date at midnight or null. */
export const parseAuditDate = (value) => {
    const text = String(value || '').trim()
    if (!text) return null
    let match = text.match(/^(\d{1,2})-(\d{1,2})-(\d{4})/)
    if (match) return new Date(Number(match[3]), Number(match[2]) - 1, Number(match[1]))
    match = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/)
    if (match) return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
    return null
}

const dayStart = (date) => (date ? new Date(date.getFullYear(), date.getMonth(), date.getDate()) : null)

const inRange = (value, fromDate, toDate) => {
    if (!fromDate && !toDate) return true
    const date = parseAuditDate(value)
    if (!date) return false
    const from = dayStart(fromDate instanceof Date ? fromDate : parseAuditDate(fromDate))
    const to = dayStart(toDate instanceof Date ? toDate : parseAuditDate(toDate))
    if (from && date < from) return false
    if (to && date > to) return false
    return true
}

const departmentOf = (value) => String(value || '').trim() || 'Unassigned'

/** Audit references (audit id + schedule id) that belong to a schedule filter value. */
const scheduleKeys = (schedules, scheduleId) => {
    if (!scheduleId) return null
    const match = (Array.isArray(schedules) ? schedules : []).find(
        (item) => item && (item.scheduleId === scheduleId || item.id === scheduleId || item.auditId === scheduleId),
    )
    return new Set([scheduleId, match?.scheduleId, match?.auditId, match?.id].filter(Boolean))
}

/** Pass / fail / partial counts of one execute draft. */
export const scoreDraft = (draft, scoreResult = defaultScoreResult) => {
    const counts = { passed: 0, failed: 0, partial: 0, na: 0 }
    const sections = Array.isArray(draft?.sections) ? draft.sections : []
    const responses = draft?.responses && typeof draft.responses === 'object' ? draft.responses : {}
    sections.forEach((section) => {
        ;(Array.isArray(section?.parameters) ? section.parameters : []).forEach((param) => {
            const result = scoreResult(param?.responseType, responses[param?.id]?.response ?? '')
            if (result === 'pass') counts.passed += 1
            else if (result === 'fail') counts.failed += 1
            else if (result === 'partial') counts.partial += 1
            else counts.na += 1
        })
    })
    return counts
}

export const compliancePercent = ({ passed = 0, failed = 0, partial = 0 }) => {
    const scorable = passed + failed + partial
    return scorable ? Math.round(((passed + partial * 0.5) / scorable) * 100) : null
}

/**
 * @param {object} input
 * @param {object[]} input.drafts execute-audit drafts ({ header, sections, responses })
 * @param {object[]} input.observations observation register rows
 * @param {object[]} [input.schedules] audit schedules (for the schedule filter)
 * @param {{ department?: string, scheduleId?: string, fromDate?: Date|string, toDate?: Date|string }} [input.filters]
 * @param {Function} [input.scoreResult]
 */
export const buildComplianceReport = ({ drafts = [], observations = [], schedules = [], filters = {}, scoreResult = defaultScoreResult } = {}) => {
    const keys = scheduleKeys(schedules, filters.scheduleId)
    const wantDepartment = String(filters.department || '').trim()
    const byDepartment = new Map()
    const bucket = (name) => {
        if (!byDepartment.has(name)) {
            byDepartment.set(name, { department: name, totalAudits: 0, passed: 0, failed: 0, partial: 0, pendingFindings: 0, closedFindings: 0 })
        }
        return byDepartment.get(name)
    }

    ;(Array.isArray(drafts) ? drafts : []).forEach((draft) => {
        const header = draft?.header || {}
        const department = departmentOf(header.department)
        if (wantDepartment && department !== wantDepartment) return
        if (keys && ![header.auditNumber, header.auditId, header.scheduleId].some((value) => value && keys.has(value))) return
        if (!inRange(header.auditDate, filters.fromDate, filters.toDate)) return
        const counts = scoreDraft(draft, scoreResult)
        const row = bucket(department)
        row.totalAudits += 1
        row.passed += counts.passed
        row.failed += counts.failed
        row.partial += counts.partial
    })

    ;(Array.isArray(observations) ? observations : []).forEach((obs) => {
        const department = departmentOf(obs?.department)
        if (wantDepartment && department !== wantDepartment) return
        if (keys && !keys.has(obs?.auditReference)) return
        if (!inRange(obs?.createdDate || obs?.createdAt, filters.fromDate, filters.toDate)) return
        if (OPEN_FINDING_STATUSES.includes(obs?.status)) bucket(department).pendingFindings += 1
        else if (CLOSED_FINDING_STATUSES.includes(obs?.status)) bucket(department).closedFindings += 1
    })

    const departments = [...byDepartment.values()]
        .map((row) => ({ ...row, compliance: compliancePercent(row) }))
        .sort((a, b) => a.department.localeCompare(b.department))

    const totals = departments.reduce(
        (acc, row) => ({
            totalAudits: acc.totalAudits + row.totalAudits,
            passed: acc.passed + row.passed,
            failed: acc.failed + row.failed,
            partial: acc.partial + row.partial,
            pendingFindings: acc.pendingFindings + row.pendingFindings,
            closedFindings: acc.closedFindings + row.closedFindings,
        }),
        { totalAudits: 0, passed: 0, failed: 0, partial: 0, pendingFindings: 0, closedFindings: 0 },
    )

    return { departments, totals: { ...totals, overall: compliancePercent(totals) } }
}

export const formatCompliance = (value) => (value == null ? '—' : `${value}%`)
