const DECISION_STATUSES = new Set(['Approved', 'Rejected'])

export const applyFinanceApprovalDecision = (rows, id, status, decision = {}) => {
    if (!DECISION_STATUSES.has(status)) throw new Error('A valid finance approval decision is required.')
    const remarks = String(decision.remarks || '').trim()
    if (status === 'Rejected' && !remarks) throw new Error('A rejection rationale is required.')

    const decidedAt = decision.decidedAt || new Date().toISOString()
    return rows.map((row) => row.id === id ? {
        ...row,
        status,
        decision: {
            actor: String(decision.actor || 'Account Head').trim() || 'Account Head',
            actorRole: decision.actorRole || 'Account Head',
            remarks,
            decidedAt,
        },
    } : row)
}
