import noProfile from '../../assets/images/no-profile.png'
import { getAdmissionById } from '../../Pages/Admin/FrontOffice/AdminssionList/admissionListData'
import { liveArray } from '../RBAC/liveArray'
import {
    getAllEnrolledStudents,
    getEnrolledStudentById,
    updateEnrolledStudentRecord,
} from './enrolledStudentsData'

const displayValue = (value) => {
    if (value === undefined || value === null) return '—'
    const text = String(value).trim()
    return text || '—'
}

const resolveAdmissionSource = (record) => {
    if (record.admissionId) {
        const liveAdmission = getAdmissionById(record.admissionId)
        if (liveAdmission) return liveAdmission
    }
    return record.admissionSnapshot || record
}

const mapToStudentView = (admission, record) => ({
    profileImage: admission.profileImage || record.profileImage || null,
    admissionNumber: admission.admissionNumber || record.admissionNumber,
    firstName: admission.firstName || record.firstName || '',
    middleName: admission.middleName || record.middleName || '',
    lastName: admission.lastName || record.lastName || '',
    admissionDate: displayValue(admission.admissionDate),
    class: displayValue(admission.className || record.className),
    classSection: displayValue(record.section),
    registrationFees: displayValue(admission.registrationFees),
    batchYear: displayValue(admission.batchStartYear),
    batchEndYear: displayValue(admission.batchEndYear),
    feesTimeline: displayValue(admission.feesGroup),
    status: displayValue(record.status || admission.status || 'Active'),
    studentId: record.id,
    gender: displayValue(admission.gender || record.gender),
    religion: displayValue(admission.religion),
    caste: displayValue(admission.caste),
    dateOfBirth: displayValue(admission.dateOfBirth || record.dateOfBirth),
    bloodGroup: displayValue(admission.bloodGroup),
    height: displayValue(admission.height),
    weight: displayValue(admission.weight),
    medicalHistory: displayValue(admission.medicalHistory),
    previousSchool: displayValue(admission.previousSchool),
    address: {
        address: displayValue(admission.address),
        country: displayValue(admission.country || record.country),
        state: displayValue(admission.state || record.state),
        city: displayValue(admission.city || record.city),
        zipCode: displayValue(admission.zipCode),
    },
    contact: {
        mobileNumber: displayValue(admission.mobileNumber || record.mobileNumber),
        alternativeNumber: displayValue(admission.altMobileNumber),
        email: displayValue(admission.email || record.email),
    },
    transport: {
        modeOfTransport: displayValue(admission.modeOfTransport),
        routeList: displayValue(admission.route),
        busStop: displayValue(admission.busStop),
    },
    parent: {
        fatherName: displayValue(admission.fatherName),
        motherName: displayValue(admission.motherName),
        fatherOccupation: displayValue(admission.fatherOccupation),
        motherOccupation: displayValue(admission.motherOccupation),
        fatherYearlyIncome: displayValue(admission.fatherIncome),
        motherYearlyIncome: displayValue(admission.motherIncome),
        siblings: displayValue(admission.siblings),
        address: {
            address: displayValue(admission.parentAddress),
            country: displayValue(admission.parentCountry),
            state: displayValue(admission.parentState),
            city: displayValue(admission.parentCity),
            zipCode: displayValue(admission.parentZipCode),
        },
        contact: {
            mobileNumber: displayValue(admission.parentMobileNumber),
            alternativeNumber: displayValue(admission.parentAltMobileNumber),
            email: displayValue(admission.parentEmail),
        },
    },
})

const toListRow = (record) => {
    const admission = resolveAdmissionSource(record)

    return {
        id: record.id,
        admissionNumber: admission.admissionNumber || record.admissionNumber || '—',
        name: record.name || '—',
        gender: admission.gender || record.gender || '—',
        email: admission.email || record.email || '—',
        mobileNumber: admission.mobileNumber || record.mobileNumber || '—',
        dateOfBirth: admission.dateOfBirth || record.dateOfBirth || '—',
        country: admission.country || record.country || '—',
        state: admission.state || record.state || '—',
        city: admission.city || record.city || '—',
        profileImage: admission.profileImage || record.profileImage || null,
    }
}

export const getStudentsList = () => getAllEnrolledStudents().map(toListRow)

export const STUDENTS_LIST = liveArray(getStudentsList)

export const getStudentProfileImage = (record) => record?.profileImage || noProfile

export const getStudentById = (id) => {
    const record = getEnrolledStudentById(id)
    if (!record) return null

    const admission = resolveAdmissionSource(record)

    if (record.admissionId && admission && !record.admissionSnapshot) {
        updateEnrolledStudentRecord(record.id, { admissionSnapshot: { ...admission } })
    }

    return mapToStudentView(admission, record)
}
