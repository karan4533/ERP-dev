import noProfile from '../../../../assets/images/no-profile.png'
import {
    ensureParentForEnrolledStudent,
    validateAdmissionAccountFields,
} from '../../../../Common/ParentAccounts/parentAccountsData'
import {
    createEnrolledStudentFromAdmission,
    updateEnrolledStudentRecord,
} from '../../../../Common/StudentDatabase/enrolledStudentsData'
import { ensureStudentAllocationRecord } from '../../../../Common/StudentAllocation/studentAllocationData'

const STORAGE_KEY = 'schoolerp-admin-admissions'

export const FEES_GROUP_OPTIONS = [
    'Annual Fees',
    'Tuition Fees',
    'Transport Fees',
    'Activity Fees',
]

export const ADMISSION_STATUS_OPTIONS = ['Active', 'Enrolled']

export const DEFAULT_ADMISSION_FORM = {
    fromEnquiryId: '',
    admissionDate: null,
    className: '',
    registrationFees: '',
    batchStartYear: null,
    batchEndYear: null,
    firstName: '',
    middleName: '',
    lastName: '',
    gender: '',
    religion: '',
    caste: '',
    address: '',
    dateOfBirth: null,
    country: '',
    state: '',
    city: '',
    zipCode: '',
    mobileNumber: '',
    altMobileNumber: '',
    email: '',
    previousSchool: '',
    bloodGroup: '',
    height: '',
    weight: '',
    medicalHistory: '',
    profileImage: '',
    modeOfTransport: '',
    route: '',
    busStop: '',
    fatherName: '',
    motherName: '',
    fatherOccupation: '',
    motherOccupation: '',
    fatherIncome: '',
    motherIncome: '',
    siblings: '',
    parentAddress: '',
    parentCountry: '',
    parentState: '',
    parentCity: '',
    parentZipCode: '',
    parentMobileNumber: '',
    parentAltMobileNumber: '',
    parentEmail: '',
    parentAccountEmail: '',
    parentAccountPassword: '',
    feesGroup: '',
    status: 'Active',
    enrolledStudentId: '',
}

const formatDate = (date) => {
    if (!date) return ''
    const value = date instanceof Date ? date : new Date(date)
    if (Number.isNaN(value.getTime())) return ''
    const day = String(value.getDate()).padStart(2, '0')
    const month = String(value.getMonth() + 1).padStart(2, '0')
    const year = value.getFullYear()
    return `${day}-${month}-${year}`
}

const parseStoredDate = (value) => {
    if (!value) return null
    if (value instanceof Date) return value
    const [day, month, year] = String(value).split('-').map(Number)
    if (!day || !month || !year) return null
    return new Date(year, month - 1, day)
}

const parseStoredYear = (value) => {
    if (!value) return null
    const year = Number(value)
    if (Number.isNaN(year)) return null
    return new Date(year, 0, 1)
}

const loadAdmissions = () => {
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

const saveAdmissions = (records) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records))
}

export const getAllAdmissions = () => loadAdmissions()

export const getAdmissionById = (id) =>
    loadAdmissions().find((item) => item.id === id) ?? null

export const generateAdmissionId = () => {
    const records = loadAdmissions()
    const max = records.reduce((acc, item) => {
        const numeric = Number(String(item.id).replace(/\D/g, ''))
        return Number.isNaN(numeric) ? acc : Math.max(acc, numeric)
    }, 0)
    const next = max + 1
    return {
        id: `ADM-${String(next).padStart(4, '0')}`,
        admissionNumber: `ADM-${String(next).padStart(4, '0')}`,
        rollNumber: `R-${String(next).padStart(4, '0')}`,
    }
}

export const getStudentDisplayName = (record) =>
    [record?.firstName, record?.middleName, record?.lastName]
        .map((part) => String(part || '').trim())
        .filter(Boolean)
        .join(' ') || '—'

export const getAdmissionProfileImage = (record) => record?.profileImage || noProfile

export const getAdmissionListBase = (pathname = '') =>
    pathname.startsWith('/front-office')
        ? '/front-office/admission-list'
        : '/admin/front-office/admission-list'

export const getAdmissionViewPath = (pathname, id) =>
    `${getAdmissionListBase(pathname)}/view/${id}`

export const getAdmissionEditPath = (pathname, id) =>
    `${getAdmissionListBase(pathname)}/edit/${id}`

const buildAdmissionRecord = (payload, existing = null) => {
    const firstName = String(payload.firstName || '').trim()
    const mobileNumber = String(payload.mobileNumber || '').trim()

    if (!firstName) return { success: false, message: 'First name is required.' }
    if (!mobileNumber) return { success: false, message: 'Mobile number is required.' }
    if (!payload.className) return { success: false, message: 'Class is required.' }

    const accountValidation = validateAdmissionAccountFields(payload, existing)
    if (!accountValidation.success) return accountValidation

    const ids = existing
        ? {
            id: existing.id,
            admissionNumber: existing.admissionNumber,
            rollNumber: existing.rollNumber,
        }
        : generateAdmissionId()

    return {
        success: true,
        record: {
            ...ids,
            fromEnquiryId: String(payload.fromEnquiryId || existing?.fromEnquiryId || '').trim(),
            admissionDate: formatDate(payload.admissionDate || existing?.admissionDate || new Date()),
            className: payload.className || '',
            registrationFees: String(payload.registrationFees || '').trim(),
            batchStartYear: payload.batchStartYear
                ? String(payload.batchStartYear instanceof Date ? payload.batchStartYear.getFullYear() : payload.batchStartYear)
                : '',
            batchEndYear: payload.batchEndYear
                ? String(payload.batchEndYear instanceof Date ? payload.batchEndYear.getFullYear() : payload.batchEndYear)
                : '',
            firstName,
            middleName: String(payload.middleName || '').trim(),
            lastName: String(payload.lastName || '').trim(),
            gender: payload.gender || '',
            religion: String(payload.religion || '').trim(),
            caste: String(payload.caste || '').trim(),
            address: String(payload.address || '').trim(),
            dateOfBirth: formatDate(payload.dateOfBirth),
            country: payload.country || '',
            state: payload.state || '',
            city: payload.city || '',
            zipCode: String(payload.zipCode || '').trim(),
            mobileNumber,
            altMobileNumber: String(payload.altMobileNumber || '').trim(),
            email: String(payload.email || '').trim(),
            previousSchool: String(payload.previousSchool || '').trim(),
            bloodGroup: payload.bloodGroup || '',
            height: String(payload.height || '').trim(),
            weight: String(payload.weight || '').trim(),
            medicalHistory: String(payload.medicalHistory || '').trim(),
            profileImage: payload.profileImage || '',
            modeOfTransport: payload.modeOfTransport || '',
            route: payload.route || '',
            busStop: payload.busStop || '',
            fatherName: String(payload.fatherName || '').trim(),
            motherName: String(payload.motherName || '').trim(),
            fatherOccupation: String(payload.fatherOccupation || '').trim(),
            motherOccupation: String(payload.motherOccupation || '').trim(),
            fatherIncome: String(payload.fatherIncome || '').trim(),
            motherIncome: String(payload.motherIncome || '').trim(),
            siblings: String(payload.siblings || '').trim(),
            parentAddress: String(payload.parentAddress || '').trim(),
            parentCountry: payload.parentCountry || '',
            parentState: payload.parentState || '',
            parentCity: payload.parentCity || '',
            parentZipCode: String(payload.parentZipCode || '').trim(),
            parentMobileNumber: String(payload.parentMobileNumber || '').trim(),
            parentAltMobileNumber: String(payload.parentAltMobileNumber || '').trim(),
            parentEmail: String(payload.parentEmail || '').trim(),
            parentAccountEmail: String(payload.parentAccountEmail || '').trim().toLowerCase(),
            parentAccountPassword: String(payload.parentAccountPassword || '').trim()
                || existing?.parentAccountPassword
                || '',
            feesGroup: payload.feesGroup || '',
            status: existing?.status || 'Active',
            enrolledStudentId: existing?.enrolledStudentId || '',
            createdDate: existing?.createdDate || formatDate(new Date()),
            createdAt: existing?.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        },
    }
}

export const createAdmission = (payload) => {
    const built = buildAdmissionRecord(payload)
    if (!built.success) return built

    const records = loadAdmissions()
    saveAdmissions([built.record, ...records])
    return { success: true, record: built.record }
}

export const updateAdmission = (id, payload) => {
    const records = loadAdmissions()
    const existing = records.find((item) => item.id === id)
    if (!existing) return { success: false, message: 'Admission not found.' }

    const built = buildAdmissionRecord(payload, existing)
    if (!built.success) return built

    const nextRecords = records.map((item) => (item.id === id ? built.record : item))
    saveAdmissions(nextRecords)
    return { success: true, record: built.record }
}

export const deleteAdmission = (id) => {
    saveAdmissions(loadAdmissions().filter((item) => item.id !== id))
    return { success: true }
}
export const enrollAdmissionAsStudent = (id) => {
    const records = loadAdmissions()
    const index = records.findIndex((item) => item.id === id)
    if (index < 0) return { success: false, message: 'Admission not found.' }
    if (records[index].status === 'Enrolled') {
        return { success: false, message: 'Student is already enrolled.' }
    }

    const enrollResult = createEnrolledStudentFromAdmission(records[index])
    if (!enrollResult.success) return enrollResult

    const parentResult = ensureParentForEnrolledStudent(records[index], enrollResult.record.id)
    if (!parentResult.success) return parentResult

    if (parentResult.parent?.id) {
        updateEnrolledStudentRecord(enrollResult.record.id, { parentId: parentResult.parent.id })
    }

    records[index] = {
        ...records[index],
        status: 'Enrolled',
        enrolledStudentId: enrollResult.record.id,
        enrolledAt: new Date().toISOString(),
    }
    saveAdmissions(records)
    ensureStudentAllocationRecord(enrollResult.record)
    return {
        success: true,
        record: records[index],
        student: enrollResult.record,
        parent: parentResult.parent ?? null,
        parentCreated: Boolean(parentResult.created),
        parentMapped: Boolean(parentResult.parentMapped),
        parentSkipped: Boolean(parentResult.skipped),
    }
}

export const toAdmissionFormState = (record) => ({
    ...DEFAULT_ADMISSION_FORM,
    ...record,
    admissionDate: parseStoredDate(record?.admissionDate) || new Date(),
    dateOfBirth: parseStoredDate(record?.dateOfBirth),
    batchStartYear: parseStoredYear(record?.batchStartYear) || new Date(),
    batchEndYear: parseStoredYear(record?.batchEndYear) || new Date(),
})

export const filterAdmissions = (records, { search = '' } = {}) => {
    const query = search.trim().toLowerCase()
    if (!query) return records

    return records.filter((item) =>
        [
            getStudentDisplayName(item),
            item.rollNumber,
            item.admissionNumber,
            item.className,
            item.gender,
            item.mobileNumber,
            item.country,
            item.city,
            item.id,
        ].some((value) => String(value || '').toLowerCase().includes(query)),
    )
}

export const buildInitialAdmissionForm = (enquiryPrefill = null, fromEnquiryId = '') => {
    const base = {
        ...DEFAULT_ADMISSION_FORM,
        admissionDate: new Date(),
        batchStartYear: new Date(),
        batchEndYear: new Date(),
        fromEnquiryId,
    }

    if (!enquiryPrefill) return base

    return {
        ...base,
        firstName: enquiryPrefill.firstName || '',
        mobileNumber: enquiryPrefill.mobileNumber || '',
        email: enquiryPrefill.email || '',
        address: enquiryPrefill.address || '',
        className: enquiryPrefill.className || '',
        gender: enquiryPrefill.gender || '',
        city: enquiryPrefill.city || '',
        state: enquiryPrefill.state || '',
    }
}
