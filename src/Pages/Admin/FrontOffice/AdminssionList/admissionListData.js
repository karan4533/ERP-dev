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
import { isApiAdmissionsEnabled } from '../../../../services/apiClient'
import {
    createAdmissionApi,
    enrollAdmissionApi,
    getAdmissionApi,
    listAdmissionsApi,
    mapAdmissionFromApi,
    updateAdmissionApi,
} from '../../../../services/admissionsApi'
import { loadFinanceState } from '../../../AccountHead/financeDomain/financeStorage'

const STORAGE_KEY = 'schoolerp-admin-admissions'
const REG_FEE_STATUS_PREFIX = 'RegFeeStatus:'
const apiAdmissionsEnabled = () => isApiAdmissionsEnabled()

export const FEES_GROUP_OPTIONS = [
    'Annual Fees',
    'Tuition Fees',
    'Transport Fees',
    'Activity Fees',
    'Admission Fee',
]

export const REGISTRATION_FEE_STATUSES = ['Pending', 'Paid', 'Waived']

/** Parse stored fees_group (single value or comma-separated) into a list. */
export const parseFeesGroups = (value) => {
    if (Array.isArray(value)) {
        return value.map((item) => String(item || '').trim()).filter(Boolean)
    }
    return String(value || '')
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
}

/** Persist selected fee groups as a single string for the existing API/DB column. */
export const formatFeesGroups = (list) => {
    const unique = []
    for (const item of parseFeesGroups(list)) {
        if (!unique.includes(item)) unique.push(item)
    }
    return unique.join(', ')
}

/** Strip / attach RegFeeStatus:* tokens so fee status rides on existing fees_group without a schema change. */
export const stripRegFeeStatusToken = (feesGroup) => (
    formatFeesGroups(parseFeesGroups(feesGroup).filter((item) => !item.startsWith(REG_FEE_STATUS_PREFIX)))
)

export const encodeFeesGroupWithRegStatus = (feesGroup, status) => {
    const groups = parseFeesGroups(feesGroup).filter((item) => !item.startsWith(REG_FEE_STATUS_PREFIX))
    const normalized = String(status || 'Pending').trim() || 'Pending'
    if (normalized !== 'Pending') groups.push(`${REG_FEE_STATUS_PREFIX}${normalized}`)
    return formatFeesGroups(groups)
}

export const decodeRegFeeStatus = (feesGroup, explicit) => {
    if (explicit && REGISTRATION_FEE_STATUSES.includes(explicit)) return explicit
    const found = parseFeesGroups(feesGroup).find((item) => item.startsWith(REG_FEE_STATUS_PREFIX))
    if (!found) return 'Pending'
    const status = found.slice(REG_FEE_STATUS_PREFIX.length)
    return REGISTRATION_FEE_STATUSES.includes(status) ? status : 'Pending'
}

const registrationFeeAmountIsClear = (registrationFees) => {
    const raw = String(registrationFees || '').trim()
    if (!raw) return true
    const normalized = raw.replace(/[₹,\s]/g, '')
    // Only a numeric zero means "no fee"; words like "waived" are not a waiver.
    return /^0+(\.0+)?$/.test(normalized)
}

const hasAdmissionFeeReceipt = (admission) => {
    const saved = loadFinanceState()
    const receipts = Array.isArray(saved?.data?.receipts) ? saved.data.receipts : []
    if (!receipts.length) return false
    const admissionNo = String(admission?.admissionNumber || '').trim().toLowerCase()
    if (!admissionNo) return false
    return receipts.some((receipt) => {
        if (!receipt || Number(receipt.amountPaid) <= 0) return false
        const status = String(receipt.status || '').trim().toLowerCase()
        if (!['issued', 'paid', 'cleared', 'success', 'completed', 'generated', 'verified'].includes(status)) return false
        const heads = (receipt.feeHeads || []).join(' ').toLowerCase()
        if (!/admission|registration/.test(heads)) return false
        // Identifier only — a similar student name is never treated as the same student.
        const receiptAdmission = String(receipt.admissionNo || receipt.studentId || '').trim().toLowerCase()
        return receiptAdmission === admissionNo
    })
}

/** True when registration/admission fee is paid, waived, zero, or matched by a finance receipt. */
export const isAdmissionFinanceCleared = (admission) => {
    if (!admission || admission.status === 'Enrolled') return true
    const status = decodeRegFeeStatus(admission.feesGroup, admission.registrationFeeStatus)
    if (status === 'Paid' || status === 'Waived') return true
    if (registrationFeeAmountIsClear(admission.registrationFees)) return true
    if (hasAdmissionFeeReceipt(admission)) return true
    return false
}

export const admissionFinanceBlockReason = (admission) => {
    // Server mode: the API alone can see Finance waivers and settled receipts, so it decides (409 fee_pending).
    if (apiAdmissionsEnabled()) return ''
    if (isAdmissionFinanceCleared(admission)) return ''
    return 'Registration / admission fee is still pending. Enrolment requires a zero fee, a Finance-recorded waiver, or a settled Finance Admission/Registration receipt (a Paid or Waived selection on this form is not enough).'
}

export const ADMISSION_STATUS_OPTIONS = ['Active', 'Enrolled', 'In Active']

export const DEFAULT_ADMISSION_FORM = {
    fromEnquiryId: '',
    admissionDate: null,
    className: '',
    registrationFees: '',
    registrationFeeStatus: 'Pending',
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
    profileImageFileId: null,
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
    const raw = String(value)
    if (/^\d{4}-\d{2}-\d{2}/.test(raw)) {
        const date = new Date(raw)
        return Number.isNaN(date.getTime()) ? null : date
    }
    const [day, month, year] = raw.split('-').map(Number)
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

export const getAllAdmissions = async () => {
    if (apiAdmissionsEnabled()) {
        try {
            return await listAdmissionsApi()
        } catch (error) {
            console.error(error)
            return []
        }
    }
    return loadAdmissions()
}

export const getAdmissionById = (id) => {
    if (apiAdmissionsEnabled()) {
        return getAdmissionApi(id).catch(() => null)
    }
    return loadAdmissions().find((item) => String(item.id) === String(id)) ?? null
}

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

/** Required on every save (the backend enforces the same three). `id` is the form control to focus. */
export const ADMISSION_REQUIRED_FIELDS = [
    { field: 'firstName', id: 'firstName', label: 'First Name' },
    { field: 'mobileNumber', id: 'mobileNumber', label: 'Mobile Number' },
    { field: 'className', id: 'admissionClass', label: 'Class' },
]

export const getMissingAdmissionFields = (payload) =>
    ADMISSION_REQUIRED_FIELDS.filter(({ field }) => !String(payload?.[field] ?? '').trim())

const missingFieldsResult = (missing) => ({
    success: false,
    missing,
    message: `Please fill in the required field${missing.length > 1 ? 's' : ''}: ${missing.map((m) => m.label).join(', ')}.`,
})

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
            registrationFeeStatus: decodeRegFeeStatus(
                payload.feesGroup,
                payload.registrationFeeStatus || existing?.registrationFeeStatus || 'Pending',
            ),
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
            feesGroup: encodeFeesGroupWithRegStatus(
                payload.feesGroup,
                payload.registrationFeeStatus || existing?.registrationFeeStatus || 'Pending',
            ),
            status: existing?.status || 'Active',
            enrolledStudentId: existing?.enrolledStudentId || '',
            createdDate: existing?.createdDate || formatDate(new Date()),
            createdAt: existing?.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        },
    }
}

export const createAdmission = async (payload) => {
    const missing = getMissingAdmissionFields(payload)
    if (missing.length) return missingFieldsResult(missing)
    if (apiAdmissionsEnabled()) {
        try {
            const record = await createAdmissionApi(payload)
            return { success: true, record }
        } catch (error) {
            return { success: false, message: error.message || 'Failed to save admission.' }
        }
    }

    const built = buildAdmissionRecord(payload)
    if (!built.success) return built

    const records = loadAdmissions()
    saveAdmissions([built.record, ...records])
    return { success: true, record: built.record }
}

export const updateAdmission = async (id, payload) => {
    const missing = getMissingAdmissionFields(payload)
    if (missing.length) return missingFieldsResult(missing)
    if (apiAdmissionsEnabled()) {
        try {
            const record = await updateAdmissionApi(id, payload)
            return { success: true, record }
        } catch (error) {
            return { success: false, message: error.message || 'Failed to update admission.' }
        }
    }

    const records = loadAdmissions()
    const existing = records.find((item) => String(item.id) === String(id))
    if (!existing) return { success: false, message: 'Admission not found.' }

    const built = buildAdmissionRecord(payload, existing)
    if (!built.success) return built

    const nextRecords = records.map((item) => (String(item.id) === String(id) ? built.record : item))
    saveAdmissions(nextRecords)
    return { success: true, record: built.record }
}

export const deleteAdmission = async (id) => {
    if (apiAdmissionsEnabled()) {
        // Backend has no hard-delete — soft-close as In Active (same pattern as enquiries).
        try {
            const current = await getAdmissionApi(id)
            if (current?.status === 'Enrolled') {
                return { success: false, message: 'Enrolled admissions cannot be deleted. Unenroll is not supported here.' }
            }
            if (current?.status === 'In Active') {
                return { success: true }
            }
            await updateAdmissionApi(id, { ...current, status: 'In Active' })
            return { success: true }
        } catch (error) {
            return { success: false, message: error.message || 'Failed to delete admission.' }
        }
    }
    saveAdmissions(loadAdmissions().filter((item) => String(item.id) !== String(id)))
    return { success: true }
}

export const enrollAdmissionAsStudent = async (id, extra = {}) => {
    if (apiAdmissionsEnabled()) {
        try {
            const current = await getAdmissionApi(id)
            const blockReason = admissionFinanceBlockReason(current)
            if (blockReason) return { success: false, message: blockReason }
            const parentEmail = extra.parentAccountEmail || current.parentAccountEmail
            const parentPassword = extra.parentAccountPassword
            if (parentEmail && (!parentPassword || String(parentPassword).trim().length < 10)) {
                return {
                    success: false,
                    message: 'Parent password is required (min 10 characters, with a letter and a number) when creating the parent login.',
                }
            }
            const result = await enrollAdmissionApi(id, {
                parentAccountEmail: parentEmail,
                parentAccountPassword: parentPassword,
                skipParentAccount: !parentEmail,
            })
            return {
                success: true,
                record: result.admission ? mapAdmissionFromApi(result.admission) : current,
                student: { id: result.student_id, studentCode: result.student_code },
                parentCreated: Boolean(result.parent_created),
                parentMapped: Boolean(result.parent_user_id && !result.parent_created),
                parentSkipped: !result.parent_user_id,
            }
        } catch (error) {
            return { success: false, message: error.message || 'Enrollment failed.' }
        }
    }

    const records = loadAdmissions()
    const index = records.findIndex((item) => String(item.id) === String(id))
    if (index < 0) return { success: false, message: 'Admission not found.' }
    if (records[index].status === 'Enrolled') {
        return { success: false, message: 'Student is already enrolled.' }
    }
    const blockReason = admissionFinanceBlockReason(records[index])
    if (blockReason) return { success: false, message: blockReason }

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
    registrationFeeStatus: decodeRegFeeStatus(record?.feesGroup, record?.registrationFeeStatus),
    feesGroup: stripRegFeeStatusToken(record?.feesGroup),
    admissionDate: parseStoredDate(record?.admissionDate) || new Date(),
    dateOfBirth: parseStoredDate(record?.dateOfBirth),
    batchStartYear: parseStoredYear(record?.batchStartYear) || new Date(),
    batchEndYear: parseStoredYear(record?.batchEndYear) || new Date(),
})

export const filterAdmissions = (records, { search = '', includeInactive = false } = {}) => {
    const query = search.trim().toLowerCase()
    return records.filter((item) => {
        if (!includeInactive && item.status === 'In Active') return false
        if (!query) return true
        return [
            getStudentDisplayName(item),
            item.rollNumber,
            item.admissionNumber,
            item.className,
            item.gender,
            item.mobileNumber,
            item.country,
            item.city,
            item.id,
            item.status,
        ].some((value) => String(value || '').toLowerCase().includes(query))
    })
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
