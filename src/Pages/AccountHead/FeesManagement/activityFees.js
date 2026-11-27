/**
 * Activity fee catalogue — create activities (name + academic year + amount),
 * enroll students, and feed Fee Structure amount auto-fill.
 * API: /api/v1/ops/activity-fee-catalog + activity-fee-enrollments
 */
import {
    ensureCampusSeed,
    hydrateCampusKey,
    persistCampusJson,
    usesCampusApiForKey,
} from '../../../services/campusJsonStore'

export const ACTIVITY_CATALOG_KEY = 'schoolerp-activity-fee-catalog-v1'
export const ACTIVITY_ENROLLMENTS_KEY = 'schoolerp-activity-fee-enrollments-v1'

const seedFor = (key, offlineSeed = []) => (usesCampusApiForKey(key) ? [] : offlineSeed)

export function getActivitiesList() {
    return ensureCampusSeed(ACTIVITY_CATALOG_KEY, seedFor(ACTIVITY_CATALOG_KEY))
}

export function getEnrollmentsList() {
    return ensureCampusSeed(ACTIVITY_ENROLLMENTS_KEY, seedFor(ACTIVITY_ENROLLMENTS_KEY))
}

export function getActivityFeeState() {
    return {
        activities: getActivitiesList(),
        enrollments: getEnrollmentsList(),
    }
}

export async function hydrateActivityFeesFromApi() {
    const tasks = []
    if (usesCampusApiForKey(ACTIVITY_CATALOG_KEY)) {
        tasks.push(hydrateCampusKey(ACTIVITY_CATALOG_KEY, []))
    }
    if (usesCampusApiForKey(ACTIVITY_ENROLLMENTS_KEY)) {
        tasks.push(hydrateCampusKey(ACTIVITY_ENROLLMENTS_KEY, []))
    }
    if (!tasks.length) return false
    await Promise.all(tasks)
    return true
}

export function getActivities({ academicYear = '' } = {}) {
    const activities = getActivitiesList()
    const year = String(academicYear || '').trim()
    if (!year) return activities.filter((row) => row.status !== 'Inactive')
    return activities.filter((row) => row.status !== 'Inactive' && String(row.academicYear) === year)
}

export function getActivityById(id) {
    return getActivitiesList().find((row) => row.id === id) || null
}

export async function createActivity({ name, academicYear, amount, remarks = '' } = {}) {
    const trimmed = String(name || '').trim()
    if (!trimmed) return { success: false, message: 'Activity name is required.' }
    if (!String(academicYear || '').trim()) return { success: false, message: 'Academic year is required.' }
    const cost = Number(amount)
    if (!Number.isFinite(cost) || cost < 0) return { success: false, message: 'Enter a valid amount.' }

    const activity = {
        id: `ACT-${Date.now()}`,
        name: trimmed,
        academicYear: String(academicYear).trim(),
        amount: cost,
        status: 'Active',
        remarks: String(remarks || '').trim(),
        createdAt: new Date().toISOString(),
    }
    const next = [activity, ...getActivitiesList()]
    const result = await persistCampusJson(ACTIVITY_CATALOG_KEY, next)
    if (result?.success === false) return { success: false, message: result.message, activity }
    return { success: true, activity }
}

export async function enrollStudent({ activityId, studentId, studentName } = {}) {
    const activity = getActivityById(activityId)
    if (!activity) return { success: false, message: 'Select an activity.' }
    if (!studentId) return { success: false, message: 'Select a student.' }

    const enrollments = getEnrollmentsList()
    const already = enrollments.some(
        (row) => row.activityId === activityId && String(row.studentId) === String(studentId),
    )
    if (already) return { success: false, message: 'Student is already enrolled in this activity.' }

    const enrollment = {
        id: `ENR-${Date.now()}`,
        activityId: activity.id,
        activityName: activity.name,
        studentId,
        studentName: studentName || '',
        academicYear: activity.academicYear,
        enrolledAt: new Date().toISOString(),
    }
    const result = await persistCampusJson(ACTIVITY_ENROLLMENTS_KEY, [enrollment, ...enrollments])
    if (result?.success === false) return { success: false, message: result.message, enrollment }
    return { success: true, enrollment }
}

export async function removeEnrollment(enrollmentId) {
    const next = getEnrollmentsList().filter((row) => row.id !== enrollmentId)
    return persistCampusJson(ACTIVITY_ENROLLMENTS_KEY, next)
}

/** Names only — for Activities module when a student is enrolled. */
export function getEnrolledActivityNames({ studentId = '', academicYear = '' } = {}) {
    const enrollments = getEnrollmentsList()
    const sid = String(studentId || '').trim()
    const year = String(academicYear || '').trim()
    return enrollments
        .filter((row) => {
            if (sid && String(row.studentId) !== sid) return false
            if (year && String(row.academicYear) !== year) return false
            return Boolean(row.activityName)
        })
        .map((row) => ({
            id: row.id,
            activityId: row.activityId,
            name: row.activityName,
            studentId: row.studentId,
            studentName: row.studentName,
            academicYear: row.academicYear,
        }))
}

/** Fee activities that have enrollments — shown as names in Activities module. */
export function getFeeActivitiesVisibleInModule() {
    const activities = getActivitiesList()
    const enrollments = getEnrollmentsList()
    const enrolledIds = new Set(enrollments.map((row) => row.activityId))
    return activities
        .filter((row) => enrolledIds.has(row.id))
        .map((row) => ({
            id: row.id,
            name: row.name,
            academicYear: row.academicYear,
            amount: row.amount,
            enrollmentCount: enrollments.filter((e) => e.activityId === row.id).length,
        }))
}

/** Options for Fee Structure modal — amount auto-fills from catalogue. */
export function loadActivityFeeOptions(academicYear = '') {
    return getActivities({ academicYear }).map((row) => ({
        id: row.id,
        label: row.name,
        academicYear: row.academicYear,
        amount: Number(row.amount) || 0,
    }))
}
