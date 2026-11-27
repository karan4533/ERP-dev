import { apiRequest, getAccessToken, isApiAuthEnabled } from './apiClient'

/** Substitute duty lives only on the server; there is no browser-only mode. */
export const canUseSubstituteDutiesApi = () => isApiAuthEnabled() && Boolean(getAccessToken())

/** Teachers and current-year sections an assigner can choose (Principal, Director, admin roles). */
export const getSubstituteDutyOptionsApi = () => apiRequest('/substitute-duties/options')

/** Assigners see the campus; teachers/coordinators see only their own duties. */
export async function listSubstituteDutiesApi({ date, includeRevoked = false } = {}) {
    const qs = new URLSearchParams()
    if (date) qs.set('date', date)
    if (includeRevoked) qs.set('includeRevoked', 'true')
    const suffix = qs.toString() ? `?${qs}` : ''
    const rows = await apiRequest(`/substitute-duties${suffix}`)
    return Array.isArray(rows) ? rows : []
}

/** @param {{teacherUserId: string, classId: string, sectionId: string, date: string, period: string, startTime: string, endTime: string, note?: string}} body */
export const createSubstituteDutyApi = (body) => apiRequest('/substitute-duties', { method: 'POST', body })

export const revokeSubstituteDutyApi = (dutyId, reason) =>
    apiRequest(`/substitute-duties/${encodeURIComponent(dutyId)}/revoke`, {
        method: 'POST',
        body: { reason: reason || null },
    })
