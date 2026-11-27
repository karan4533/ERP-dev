/** Who may act on an academic approval step. The server enforces the same rules; this only decides what to show. */

export const APPROVER_ROLES = ['coordinator', 'principal', 'director']

const LABELS = { coordinator: 'Coordinator', principal: 'Principal', director: 'Director', teacher: 'Teacher' }

export const approverLabel = (role) => LABELS[String(role || '').toLowerCase()] || String(role || '')

/** The approver role a screen acts as, from its route ('/principal/...' -> 'principal'). */
export const approverRoleForPath = (pathname = '') => {
    const first = String(pathname).split('/').filter(Boolean)[0] || ''
    return APPROVER_ROLES.includes(first) ? first : ''
}

/**
 * @param {{ approvalStatus?: string, approvalId?: string|null, awaitingRole?: string|null,
 *           awaitingEligibleApprover?: boolean, submitterEmail?: string }} item
 * @param {string} role  approver role of this screen
 * @param {string} myEmail
 * @returns {{ canAct: boolean, note: string }}
 */
export const stepAction = (item, role, myEmail = '') => {
    if (!item || item.approvalStatus !== 'Pending') return { canAct: false, note: '' }
    if (!item.approvalId) return { canAct: false, note: 'Not submitted for approval yet.' }
    const mine = String(myEmail || '').trim().toLowerCase()
    if (mine && String(item.submitterEmail || '').trim().toLowerCase() === mine) {
        return { canAct: false, note: 'Your own submission — another approver must decide it.' }
    }
    const waiting = String(item.awaitingRole || '').toLowerCase()
    if (!waiting) return { canAct: false, note: 'Waiting for approval.' }
    if (waiting !== role) return { canAct: false, note: `Waiting for the ${approverLabel(waiting)}.` }
    return { canAct: true, note: '' }
}

/** Plain-language line for one approval history event. */
export const describeEvent = (event) => {
    const who = approverLabel(event.actorRole) || event.actorRole || 'Someone'
    const verb = { submit: 'submitted', approve: 'approved', deny: 'rejected' }[event.action] || event.action
    return `${who} ${verb}${event.comment ? `: ${event.comment}` : ''}`
}
