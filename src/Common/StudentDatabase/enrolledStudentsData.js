import { isApiStudentsEnabled } from '../../services/apiClient'
import {
    getStudentApi,
    listStudentsApi,
    mapStudentDetailFromApi,
    mapStudentListFromApi,
} from '../../services/studentsApi'

const buildStudentName = (admission) =>
    [admission?.firstName, admission?.middleName, admission?.lastName]
        .map((part) => String(part || '').trim())
        .filter(Boolean)
        .join(' ') || 'Student'

const STORAGE_KEY = 'schoolerp-enrolled-students'

/** In-memory API SoT cache when VITE_USE_API_STUDENTS / admissions API is on. */
let apiCache = null
let apiHydratePromise = null

const loadStudents = () => {
    // API mode: never fall back to stale localStorage (fail closed until hydrate).
    if (isApiStudentsEnabled()) return apiCache || []
    try {
        const stored = localStorage.getItem(STORAGE_KEY)
        if (stored) {
            const parsed = JSON.parse(stored)
            return Array.isArray(parsed) ? parsed : []
        }
    } catch {
        /* ignore */
    }
    return []
}

const saveStudents = (records) => {
    if (isApiStudentsEnabled()) {
        apiCache = records
        return
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records))
}

export const getAllEnrolledStudents = () => loadStudents()

export const getEnrolledStudentById = (id) =>
    loadStudents().find((item) => String(item.id) === String(id)) ?? null

export const getEnrolledStudentByAdmissionId = (admissionId) =>
    loadStudents().find((item) => item.admissionId === admissionId) ?? null

export const updateEnrolledStudentRecord = (id, patch) => {
    const records = loadStudents()
    const index = records.findIndex((item) => String(item.id) === String(id))
    if (index < 0) return false

    records[index] = { ...records[index], ...patch }
    saveStudents(records)
    return true
}

/** Load campus students from API into the shared enrolled cache. */
export async function hydrateEnrolledStudentsFromApi() {
    if (!isApiStudentsEnabled()) return getAllEnrolledStudents()
    if (apiHydratePromise) return apiHydratePromise
    apiHydratePromise = listStudentsApi()
        .then((rows) => {
            const mapped = rows.map(mapStudentListFromApi)
            apiCache = mapped
            return mapped
        })
        .catch(() => {
            apiCache = apiCache || []
            return apiCache
        })
        .finally(() => {
            apiHydratePromise = null
        })
    return apiHydratePromise
}

/** Ensure one student detail is in cache (admissionSnapshot for view page). */
export async function ensureEnrolledStudentDetailFromApi(id) {
    if (!isApiStudentsEnabled()) return getEnrolledStudentById(id)
    const detail = await getStudentApi(id)
    const mapped = mapStudentDetailFromApi(detail)
    const records = [...(apiCache || loadStudents())]
    const index = records.findIndex((item) => String(item.id) === String(id))
    if (index >= 0) records[index] = { ...records[index], ...mapped }
    else records.unshift(mapped)
    apiCache = records
    return mapped
}

export const createEnrolledStudentFromAdmission = (admission) => {
    const existing = getEnrolledStudentByAdmissionId(admission.id)
    if (existing) {
        return { success: false, message: 'This admission is already enrolled as a student.' }
    }

    const studentId =
        admission.enrolledStudentId ||
        `STU-${String(admission.rollNumber || admission.id)
            .replace(/\D/g, '')
            .padStart(4, '0')}`

    const record = {
        id: studentId,
        admissionId: admission.id,
        name: buildStudentName(admission),
        firstName: admission.firstName,
        middleName: admission.middleName,
        lastName: admission.lastName,
        className: admission.className,
        rollNumber: admission.rollNumber,
        admissionNumber: admission.admissionNumber,
        gender: admission.gender,
        mobileNumber: admission.mobileNumber,
        email: admission.email,
        dateOfBirth: admission.dateOfBirth,
        country: admission.country,
        state: admission.state,
        city: admission.city,
        profileImage: admission.profileImage,
        status: 'Active',
        enrolledAt: new Date().toISOString(),
        admissionSnapshot: { ...admission },
    }

    saveStudents([record, ...loadStudents()])
    return { success: true, record }
}
