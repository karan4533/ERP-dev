import { apiRequest } from './apiClient'

/** @returns {Promise<Array<object>>} */
export async function listStudentsApi(params = {}) {
    const qs = new URLSearchParams()
    if (params.className) qs.set('className', params.className)
    const suffix = qs.toString() ? `?${qs}` : ''
    const rows = await apiRequest(`/students${suffix}`)
    return Array.isArray(rows) ? rows : []
}

/** @returns {Promise<object>} */
export async function getStudentApi(studentId) {
    return apiRequest(`/students/${studentId}`)
}

/** Linked student profile for the signed-in student portal login. */
export async function getMyStudentApi() {
    return apiRequest('/students/me')
}

/** Map /students/me (or list row) → ActiveStudentContext profile shape. */
export function mapMyStudentProfile(row) {
    if (!row) return null
    const className = row.className || ''
    const section = row.section || ''
    return {
        id: String(row.id),
        name: row.name || [row.firstName, row.lastName].filter(Boolean).join(' ') || '',
        className,
        section: section || '—',
        classSection: row.classSection || (section ? `${className}-${section}` : className),
        rollNumber: row.rollNumber || '',
        admissionNumber: row.admissionNumber || '',
        admissionId: row.admissionId || null,
        studentUserId: row.studentUserId || null,
        parentUserId: row.parentUserId || null,
        // Portal pages hide timetable / attendance until placementStatus is 'placed'.
        placementStatus: row.placementStatus || '',
        classTeacherEmail: row.classTeacherEmail || '',
        sectionId: row.sectionId || null,
    }
}

/** Map API list row → enrolled-students localStorage shape. */
export function mapStudentListFromApi(row) {
    return {
        id: String(row.id),
        admissionId: row.admissionId || null,
        name: row.name || '',
        firstName: row.firstName || (row.name || '').split(' ')[0] || '',
        middleName: row.middleName || '',
        lastName: row.lastName || '',
        className: row.className || '',
        section: row.section || '',
        classSection: row.classSection || '',
        placementStatus: row.placementStatus || '',
        admissionNumber: row.admissionNumber || '',
        gender: row.gender || '',
        mobileNumber: row.mobileNumber || '',
        email: row.email || '',
        dateOfBirth: row.dateOfBirth || '',
        country: row.country || '',
        state: row.state || '',
        city: row.city || '',
        status: row.status || 'Active',
        parentUserId: row.parentUserId || null,
        studentUserId: row.studentUserId || null,
    }
}

/** Map API detail → view model fields used by studentDatabaseData. */
export function mapStudentDetailFromApi(row) {
    const list = mapStudentListFromApi(row)
    return {
        ...list,
        firstName: row.firstName || list.firstName,
        middleName: row.middleName || '',
        lastName: row.lastName || '',
        admissionSnapshot: {
            admissionNumber: row.admissionNumber,
            firstName: row.firstName,
            middleName: row.middleName,
            lastName: row.lastName,
            admissionDate: row.admissionDate,
            className: row.className,
            registrationFees: row.registrationFees,
            batchStartYear: row.batchStartYear,
            batchEndYear: row.batchEndYear,
            feesGroup: row.feesGroup,
            gender: row.gender,
            religion: row.religion,
            caste: row.caste,
            address: row.address,
            dateOfBirth: row.dateOfBirth,
            country: row.country,
            state: row.state,
            city: row.city,
            zipCode: row.zipCode,
            mobileNumber: row.mobileNumber,
            altMobileNumber: row.altMobileNumber,
            email: row.email,
            previousSchool: row.previousSchool,
            bloodGroup: row.bloodGroup,
            height: row.height,
            weight: row.weight,
            medicalHistory: row.medicalHistory,
            modeOfTransport: row.modeOfTransport,
            route: row.route,
            busStop: row.busStop,
            fatherName: row.fatherName,
            motherName: row.motherName,
            fatherOccupation: row.fatherOccupation,
            motherOccupation: row.motherOccupation,
            fatherIncome: row.fatherIncome,
            motherIncome: row.motherIncome,
            siblings: row.siblings,
            parentAddress: row.parentAddress,
            parentCountry: row.parentCountry,
            parentState: row.parentState,
            parentCity: row.parentCity,
            parentZipCode: row.parentZipCode,
            parentMobileNumber: row.parentMobileNumber,
            parentAltMobileNumber: row.parentAltMobileNumber,
            parentEmail: row.parentEmail,
            status: row.status,
        },
        guardians: row.guardians || [],
    }
}
