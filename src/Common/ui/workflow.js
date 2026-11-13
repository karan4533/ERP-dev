const STATE_DEFINITIONS = Object.freeze({
    draft: Object.freeze({ label: 'Draft', tone: 'neutral', terminal: false }),
    submitted: Object.freeze({ label: 'Submitted', tone: 'info', terminal: false }),
    pending: Object.freeze({ label: 'Pending', tone: 'warning', terminal: false }),
    'in-review': Object.freeze({ label: 'In review', tone: 'info', terminal: false }),
    'in-progress': Object.freeze({ label: 'In progress', tone: 'info', terminal: false }),
    approved: Object.freeze({ label: 'Approved', tone: 'success', terminal: true }),
    resolved: Object.freeze({ label: 'Resolved', tone: 'success', terminal: true }),
    completed: Object.freeze({ label: 'Completed', tone: 'success', terminal: true }),
    rejected: Object.freeze({ label: 'Rejected', tone: 'danger', terminal: true }),
    closed: Object.freeze({ label: 'Closed', tone: 'neutral', terminal: true }),
    overdue: Object.freeze({ label: 'Overdue', tone: 'danger', terminal: false }),
})

const normaliseStateKey = (status) => {
    const key = String(status || 'pending')
        .trim()
        .toLowerCase()
        .replace(/[_\s]+/g, '-')

    if (key === 'open') return 'pending'
    return STATE_DEFINITIONS[key] ? key : 'pending'
}

export const parseWorkflowDate = (value) => {
    if (!value) return null
    if (value instanceof Date) {
        return Number.isNaN(value.getTime()) ? null : new Date(value.getTime())
    }

    const storedDate = String(value).match(/^(\d{2})-(\d{2})-(\d{4})$/)
    if (storedDate) {
        const [, day, month, year] = storedDate
        const parsed = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)))
        if (
            parsed.getUTCFullYear() !== Number(year)
            || parsed.getUTCMonth() !== Number(month) - 1
            || parsed.getUTCDate() !== Number(day)
        ) return null
        return parsed
    }

    const parsed = new Date(value)
    return Number.isNaN(parsed.getTime()) ? null : parsed
}

export const getWorkflowDueDate = (value) => {
    if (!value) return null
    const text = String(value)
    const dateOnly = text.match(/^(?:(\d{2})-(\d{2})-(\d{4})|(\d{4})-(\d{2})-(\d{2}))$/)
    if (!dateOnly) return parseWorkflowDate(value)

    const year = Number(dateOnly[3] || dateOnly[4])
    const month = Number(dateOnly[2] || dateOnly[5])
    const day = Number(dateOnly[1] || dateOnly[6])
    const parsed = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999))
    if (
        parsed.getUTCFullYear() !== year
        || parsed.getUTCMonth() !== month - 1
        || parsed.getUTCDate() !== day
    ) return null
    return parsed
}

export const getWorkflowState = (status, { dueAt, now = new Date() } = {}) => {
    const key = normaliseStateKey(status)
    const definition = STATE_DEFINITIONS[key]
    const dueDate = parseWorkflowDate(dueAt)
    const currentDate = parseWorkflowDate(now)
    const isOverdue = Boolean(
        !definition.terminal
        && dueDate
        && currentDate
        && currentDate.getTime() > dueDate.getTime(),
    )

    if (isOverdue) {
        return {
            key: 'overdue',
            ...STATE_DEFINITIONS.overdue,
            overdue: true,
            sourceStatus: status,
        }
    }

    return {
        key,
        ...definition,
        overdue: false,
        sourceStatus: status,
    }
}

export const buildWorkflowEvents = ({
    status,
    submittedLabel = 'Submitted',
    submittedBy = '',
    submittedAt,
    owner = '',
    remarks = '',
    decisionAt,
    dueAt,
    now,
} = {}) => {
    const state = getWorkflowState(status, { dueAt, now })
    const submittedDate = parseWorkflowDate(submittedAt)
    const decisionDate = parseWorkflowDate(decisionAt)
    const isSubmissionCurrent = ['draft', 'submitted'].includes(state.key)
    const events = [
        {
            id: 'submitted',
            label: submittedLabel,
            actor: submittedBy,
            timestamp: submittedDate?.toISOString() ?? null,
            description: '',
            tone: 'info',
            current: isSubmissionCurrent,
        },
    ]

    if (!isSubmissionCurrent) {
        events.push({
            id: state.key,
            label: state.label,
            actor: owner,
            timestamp: decisionDate?.toISOString() ?? null,
            description: remarks,
            tone: state.tone,
            current: true,
        })
    }

    return events
}

