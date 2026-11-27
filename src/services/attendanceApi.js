import { apiRequest } from './apiClient'

/** @returns {Promise<Array<object>>} */
export async function listAttendanceApi({ date, className, section, session = 'FN', roster = false } = {}) {
    const qs = new URLSearchParams()
    if (date) qs.set('date', date)
    if (className) qs.set('className', className)
    if (section) qs.set('section', section)
    if (session) qs.set('session', session)
    if (roster) qs.set('roster', 'true')
    const rows = await apiRequest(`/attendance?${qs}`)
    return Array.isArray(rows) ? rows : []
}

/**
 * Classes/sections the signed-in user may load and mark on ``date`` (YYYY-MM-DD; default today).
 * Substitute-duty sections appear only while that duty is valid for the date and current period.
 */
export async function listMyAttendanceClassesApi(date) {
    const suffix = date ? `?date=${encodeURIComponent(date)}` : ''
    const data = await apiRequest(`/attendance/my-classes${suffix}`)
    return {
        scoped: Boolean(data?.scoped),
        classes: Array.isArray(data?.classes) ? data.classes : [],
        substituteDuties: Array.isArray(data?.substituteDuties) ? data.substituteDuties : [],
    }
}

/** @returns {Promise<Array<object>>} */
export async function upsertAttendanceApi(payload) {
    return apiRequest('/attendance', {
        method: 'POST',
        body: payload,
    })
}

/**
 * Admin / HR: convert stored biometric punches into attendance now (server-side, idempotent).
 * ``window`` = { date } or { fromDate, toDate } (YYYY-MM-DD); empty = today (campus time).
 * Resolves to the run summary: { students: {created, updated, unchanged, manualKept}, staff, skippedCount, ... }.
 */
export async function runAttendanceSyncApi(window = {}) {
    return apiRequest('/attendance/sync', {
        method: 'POST',
        body: window,
    })
}

/** @returns {Promise<Record<string, string>>} P/A/H/HD map */
export async function studentAttendanceCalendarApi(studentId, year, month) {
    return apiRequest(`/attendance/students/${studentId}/calendar?year=${year}&month=${month}`)
}
