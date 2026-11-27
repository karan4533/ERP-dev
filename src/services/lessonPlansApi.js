import { apiRequest, getAccessToken, isApiAuthEnabled } from './apiClient'

export const canUseLessonPlansApi = () => isApiAuthEnabled() && Boolean(getAccessToken())

/** @returns {Promise<Array<object>>} */
export async function listLessonPlansApi(params = {}) {
    const qs = new URLSearchParams()
    if (params.month) qs.set('month', params.month)
    if (params.className) qs.set('className', params.className)
    if (params.status) qs.set('status', params.status)
    if (params.mine) qs.set('mine', 'true')
    const suffix = qs.toString() ? `?${qs}` : ''
    const rows = await apiRequest(`/lesson-plans${suffix}`)
    return Array.isArray(rows) ? rows : []
}

/** @returns {Promise<object>} */
export async function getLessonPlanApi(planId) {
    return apiRequest(`/lesson-plans/${planId}`)
}

/** @returns {Promise<object>} */
export async function createLessonPlanApi(body) {
    return apiRequest('/lesson-plans', { method: 'POST', body })
}

/** Patch a draft plan (e.g. attach fileId after upload). Submitted plans are locked server-side. */
export async function patchLessonPlanApi(planId, body) {
    return apiRequest(`/lesson-plans/${planId}`, { method: 'PATCH', body })
}

/** Send a draft plan into the approval chain. */
export async function submitLessonPlanApi(planId) {
    return apiRequest(`/lesson-plans/${planId}/submit`, { method: 'POST' })
}

/** Owner marks an approved plan as taught. */
export async function completeLessonPlanApi(planId, remarks = '') {
    return apiRequest(`/lesson-plans/${planId}/complete`, { method: 'POST', body: { remarks } })
}

/** Approve or deny through the shared approvals engine (the chain decides who may act). */
export async function decideLessonPlanApi(approvalId, decision, comment = '') {
    return apiRequest(`/approvals/${approvalId}/decide`, {
        method: 'POST',
        body: { decision, comment: comment || null },
    })
}

/** Map API lesson plan → existing Teacher/Coordinator UI record shape. */
export function mapLessonPlanFromApi(row) {
    const content = row.content && typeof row.content === 'object' ? row.content : {}
    const status = String(row.status || '').toLowerCase()
    const approvalStatus =
        status === 'approved' ? 'Approved' : status === 'denied' || status === 'rejected' ? 'Rejected' : 'Pending'
    return {
        id: String(row.id),
        subject: row.subject || content.subject || '',
        submitterName: row.teacherEmail || row.teacherName || content.submitterName || '',
        submitterEmail: row.teacherEmail || '',
        submitterRole: content.submitterRole || 'Teacher',
        className: row.className || '',
        section: row.section || '',
        title: row.title || content.title || content.chapterName || '',
        academicYear: content.academicYear || '',
        month: row.month || content.month || '',
        weekNo: content.weekNo || '',
        numberOfSessions: content.numberOfSessions || '',
        chapterName: content.chapterName || row.title || '',
        planningRows: Array.isArray(content.planningRows) ? content.planningRows : [],
        specialAttention: content.specialAttention || '',
        classroomSetup: content.classroomSetup || '',
        teacherNotes: content.teacherNotes || '',
        reflection: content.reflection || '',
        subjectMentor: content.subjectMentor || '',
        evaluator: content.evaluator || '',
        coordinatorSignoff: content.coordinatorSignoff || '',
        sdgPlanned: content.sdgPlanned || '',
        sdcPlanned: content.sdcPlanned || '',
        worksheetsPlanned: content.worksheetsPlanned || '',
        description: content.description || row.title || '',
        fromDate: content.fromDate || '',
        toDate: content.toDate || '',
        submittedAt: row.createdAt || row.submittedAt || '',
        approvalStatus,
        // 'draft' plans were saved but never entered approval (older saves); they can be submitted.
        isDraft: status === 'draft',
        approvalId: row.approvalId || null,
        awaitingRole: row.awaitingRole || null,
        trackStatus: content.markAsDone ? 'Completed' : 'On Track',
        markAsDone: Boolean(content.markAsDone),
        completionRemarks: content.completionRemarks || '',
        attachment: row.fileId ? String(row.fileId) : content.attachment || '',
        source: 'api',
    }
}
