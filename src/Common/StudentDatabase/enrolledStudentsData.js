const buildStudentName = (admission) =>
    [admission?.firstName, admission?.middleName, admission?.lastName]
        .map((part) => String(part || '').trim())
        .filter(Boolean)
        .join(' ') || 'Student'

const STORAGE_KEY = 'schoolerp-enrolled-students'

const loadStudents = () => {
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
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records))
}

export const getAllEnrolledStudents = () => loadStudents()

export const getEnrolledStudentById = (id) =>
    loadStudents().find((item) => item.id === id) ?? null

export const getEnrolledStudentByAdmissionId = (admissionId) =>
    loadStudents().find((item) => item.admissionId === admissionId) ?? null

export const updateEnrolledStudentRecord = (id, patch) => {
    const records = loadStudents()
    const index = records.findIndex((item) => item.id === id)
    if (index < 0) return false

    records[index] = { ...records[index], ...patch }
    saveStudents(records)
    return true
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
