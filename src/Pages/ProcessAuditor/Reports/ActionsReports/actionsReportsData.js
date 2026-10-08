import { getObservations, OPEN_STATUSES, CLOSED_STATUSES, statusBadgeColor } from '../../Observations/observationsData'

export { DEPARTMENTS } from '../../Observations/observationsData'
export { statusBadgeColor }

const STORAGE_KEY = 'process-auditor-actions-reports'

const parseDate = (dateStr) => {
    if (!dateStr) return null
    const normalized = dateStr.replace(/-/g, '/')
    const parsed = new Date(normalized)
    return Number.isNaN(parsed.getTime()) ? null : parsed
}

export const computeDaysLeft = (dueDate, reference = new Date()) => {
    const due = parseDate(dueDate)
    if (!due) return '—'
    const diff = Math.ceil((due - reference) / (1000 * 60 * 60 * 24))
    if (diff < 0) return `${Math.abs(diff)} overdue`
    if (diff === 0) return 'Due today'
    return `${diff} days`
}

const CLOSED_META = {
    'OBS-PA-2026-009': { closedBy: 'Mr. Arjun Mehta', closedDate: '10-06-2026', daysTaken: 9 },
    'OBS-PA-2026-007': { closedBy: 'Mr. Ramesh Iyer', closedDate: '28-05-2026', daysTaken: 6 },
    'OBS-PA-2026-005': { closedBy: 'Mr. Vikram Singh', closedDate: '05-06-2026', daysTaken: 35 },
    'OBS-PA-2026-003': { closedBy: 'Prof. Anil Kapoor', closedDate: '25-04-2026', daysTaken: 5 },
}

const buildPendingFromObservations = () =>
    getObservations()
        .filter((obs) => OPEN_STATUSES.includes(obs.status))
        .map((obs) => ({
            id: obs.observationId,
            observationId: obs.observationId,
            observation: obs.title,
            department: obs.department,
            assignedTo: obs.assignTo || obs.responsiblePerson,
            dueDate: obs.dueDate,
            daysLeft: computeDaysLeft(obs.dueDate),
            status: obs.status,
        }))

const buildClosedFromObservations = () =>
    getObservations()
        .filter((obs) => CLOSED_STATUSES.includes(obs.status))
        .map((obs) => {
            const meta = CLOSED_META[obs.observationId] ?? {
                closedBy: obs.responsiblePerson,
                closedDate: obs.createdDate,
                daysTaken: 7,
            }
            return {
                id: obs.observationId,
                observationId: obs.observationId,
                observation: obs.title,
                department: obs.department,
                closedBy: meta.closedBy,
                closedDate: meta.closedDate,
                daysTaken: meta.daysTaken,
                status: obs.status,
            }
        })

const DEFAULT_DATA = {
    pending: buildPendingFromObservations(),
    closed: buildClosedFromObservations(),
}

export const saveActionsReports = (data) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

export const getActionsReports = () => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY)
        if (stored) return JSON.parse(stored)
    } catch {
        /* ignore */
    }
    const data = DEFAULT_DATA
    saveActionsReports(data)
    return data
}

export const getPendingActions = () => {
    const stored = getActionsReports()
    if (stored.pending?.length) return stored.pending
    return buildPendingFromObservations()
}

export const getClosedActions = () => {
    const stored = getActionsReports()
    if (stored.closed?.length) return stored.closed
    return buildClosedFromObservations()
}

export const daysLeftBadgeClass = (daysLeft) => {
    if (typeof daysLeft === 'string' && daysLeft.includes('overdue')) return 'text-[#FF0000] font-semibold'
    if (daysLeft === 'Due today') return 'text-[#FF9800] font-semibold'
    return 'text-[#667085]'
}
