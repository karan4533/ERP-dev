/** Mark Entry rules that follow the server's marks workflow (no React, so they can be tested in Node). */

const ROLE_LABELS = {
    coordinator: 'Coordinator',
    principal: 'Principal',
    director: 'Director',
}

export const roleLabel = (role) => ROLE_LABELS[String(role || '').toLowerCase()] || String(role || '')

/** Server batch status: draft | submitted | published | denied. */
export const mapBatchStatus = (batch) => {
    if (!batch) return { status: 'draft', approvalStatus: null }
    const raw = String(batch.status || 'draft').toLowerCase()
    if (raw === 'draft') return { status: 'draft', approvalStatus: null }
    if (raw === 'published' || raw === 'approved') return { status: 'submitted', approvalStatus: 'Approved' }
    if (raw === 'denied' || raw === 'rejected') return { status: 'submitted', approvalStatus: 'Rejected' }
    return { status: 'submitted', approvalStatus: 'Pending' }
}

/** Whether marks may be entered for this exam, and if not, the reason to show. */
export const examEntryState = (exam) => {
    if (!exam) return { open: false, reason: 'Select an exam to enter marks.' }
    const status = String(exam.status || '').toLowerCase()
    if (status === 'approved') return { open: true, reason: '' }
    if (status === 'submitted') {
        const who = roleLabel(exam.awaitingRole) || 'Director'
        return { open: false, reason: `Mark entry opens after the ${who} approves this exam schedule. It is waiting for approval.` }
    }
    if (status === 'denied') {
        return { open: false, reason: 'This exam schedule was not approved. Mark entry opens once a revised schedule is approved.' }
    }
    return { open: false, reason: 'This exam schedule has not been submitted for approval yet, so marks cannot be entered.' }
}

/** Message under the marks table for a server-backed batch. */
export const batchStatusMessage = (session) => {
    if (!session || session.status !== 'submitted') return ''
    if (session.approvalStatus === 'Pending') {
        if (session.awaitingEligibleApprover) {
            return 'Submitted. No one can currently approve this step; an administrator has been alerted. Marks stay hidden from students and parents.'
        }
        const who = roleLabel(session.awaitingRole)
        return who
            ? `Submitted and locked. Now waiting for the ${who} (Coordinator → Principal → Director). Students and parents see marks only after the Director publishes them.`
            : 'Submitted and locked. Students and parents see marks only after final approval.'
    }
    if (session.approvalStatus === 'Approved') {
        return 'Approved and published. Use Request correction to propose changes (Principal → Director). Students keep seeing the published marks until the correction is approved.'
    }
    if (session.approvalStatus === 'Rejected') {
        return session.rejectionReason
            ? `Not approved: ${session.rejectionReason}. Use Revise to create a new version, correct it and submit again.`
            : 'Not approved. Use Revise to create a new version, correct it and submit again.'
    }
    return 'Marks have already been submitted for this exam.'
}

/** A rejected server batch must be revised into a new version before it can change. */
export const needsRevision = (session) =>
    session?.source === 'api' && session.status === 'submitted' && session.approvalStatus === 'Rejected'

/** Published campus batch (API) — teacher may open a correction request, not edit in place. */
export const isPublishedBatch = (session) =>
    session?.source === 'api' && session.status === 'submitted' && session.approvalStatus === 'Approved'

/** The newest version for this subject and section among the teacher's batches. */
export const pickLatestBatch = (batches, { subject, section }) =>
    (Array.isArray(batches) ? batches : [])
        .filter((batch) => batch.subject === subject && (!batch.section || batch.section === section))
        .sort((a, b) => Number(b.version || 0) - Number(a.version || 0))[0] || null
