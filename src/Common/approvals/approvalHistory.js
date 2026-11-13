const DECISION_STATUSES = new Set([
    'Submitted',
    'Pending',
    'Approved',
    'Rejected',
    'Coordinator Reviewed',
    'Principal Approved',
    'PRM Verified',
    'Needs Revision',
    'Under Review',
    'Draft'
])

const normalizeTimestamp = (value) => {
    const date = value ? new Date(value) : new Date()
    if (Number.isNaN(date.getTime())) return new Date().toISOString()
    return date.toISOString()
}

export const appendApprovalDecision = (history = [], decision = {}) => {
    if (!DECISION_STATUSES.has(decision.status)) {
        throw new Error('A valid approval decision status is required.')
    }

    const remarks = String(decision.remarks || '').trim()
    if (decision.status === 'Rejected' && !remarks) {
        throw new Error('A rejection rationale is required.')
    }

    const decidedAt = normalizeTimestamp(decision.decidedAt)
    const event = {
        id: decision.id || `APR-${decidedAt}-${history.length + 1}`,
        status: decision.status,
        actor: String(decision.actor || 'System').trim() || 'System',
        actorRole: String(decision.actorRole || '').trim(),
        remarks,
        decidedAt,
    }

    return [...history, event]
}

export const getLatestApprovalDecision = (history = []) => history.at(-1) ?? null

export const formatApprovalDecisionTime = (value) => {
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return 'Time not recorded'
    return new Intl.DateTimeFormat('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(date)
}
