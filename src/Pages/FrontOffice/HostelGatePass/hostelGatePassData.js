import noProfile from '../../../assets/images/no-profile.png'
import {
    formatGatePassDate,
    formatOutTimeForDisplay,
    getEnrolledStudentSelectOptions,
    mapStudentForGatePass,
    parseGatePassDate,
} from '../GatePass/gatePassData'
import {
    createFrontOfficeItem,
    decideFrontOfficeItem,
    deleteFrontOfficeItem,
    frontOfficeApiOn,
    hydrateFrontOfficeCollection,
    peekFrontOfficeCollection,
    updateFrontOfficeItem,
} from '../frontOfficeStore'
import { listParentHostelGatePassesApi } from '../../../services/frontOfficeApi'

export {
    formatGatePassDate,
    formatOutTimeForDisplay,
    getEnrolledStudentSelectOptions,
    mapStudentForGatePass,
    parseGatePassDate,
}

export const HOSTEL_OPTIONS = ['QMIS Hostel', 'Boys Hostel Block A', 'Girls Hostel Block B']
export const LEAVE_TYPES = ['Home Visit', 'Medical Leave', 'Emergency Leave', 'Personal Leave']
export const APPROVAL_STATUSES = ['Pending', 'Approved', 'Rejected']
export const FINAL_STATUSES = ['Pending', 'Checked Out', 'Returned', 'Cancelled']

export const approvalStatusColor = {
    Approved: 'text-[#4CAF50]',
    Pending: 'text-[#FF9800]',
    Rejected: 'text-[#FF0000]',
}

export const finalStatusBadgeColor = {
    Pending: 'bg-[#FF980033] text-[#FF9800]',
    'Checked Out': 'bg-[#2196F333] text-[#2196F3]',
    Returned: 'bg-[#4CAF5033] text-[#4CAF50]',
    Cancelled: 'bg-[#FF000033] text-[#FF0000]',
}

export const DEFAULT_HOSTEL_GATE_PASS_FORM = {
    studentId: '',
    studentName: '',
    classSection: '',
    gender: '',
    mobileNumber: '',
    city: '',
    profileImage: '',
    hostel: '',
    leaveType: '',
    reason: '',
    outDate: '',
    outTime: '',
    returnDate: '',
    returnTime: '',
    status: 'Pending',
}

const STORAGE_KEY = 'hostel-gate-pass-front-office'
const COUNTER_KEY = 'hostel-gate-pass-hgp-counter'

const readRecords = () => {
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

const writeRecords = (records) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records))
}

const nextGatePassId = () => {
    const current = Number(localStorage.getItem(COUNTER_KEY) || 0) + 1
    localStorage.setItem(COUNTER_KEY, String(current))
    return `HGP-${String(current).padStart(3, '0')}`
}

const COLLECTION = 'hostel-gate-passes'

export const hydrateHostelGatePassesFromApi = () => hydrateFrontOfficeCollection(COLLECTION)

export const getHostelGatePasses = () =>
    frontOfficeApiOn() ? peekFrontOfficeCollection(COLLECTION) : readRecords()

export const getHostelGatePassById = (id) =>
    getHostelGatePasses().find((record) => record.id === id) ?? null

const buildRecordPayload = (payload, existing = null) => {
    const studentId = String(payload.studentId || '').trim()
    const reason = String(payload.reason || '').trim()
    const outTime = String(payload.outTime || '').trim()
    const returnTime = String(payload.returnTime || '').trim()
    const outDate = String(payload.outDate || '').trim()
    const returnDate = String(payload.returnDate || '').trim()

    if (!studentId) return { success: false, message: 'Student ID is required.' }
    if (!payload.hostel) return { success: false, message: 'Hostel is required.' }
    if (!payload.leaveType) return { success: false, message: 'Leave type is required.' }
    if (!reason) return { success: false, message: 'Reason is required.' }
    if (!outDate) return { success: false, message: 'Out date is required.' }
    if (!outTime) return { success: false, message: 'Out time is required.' }
    if (!returnDate) return { success: false, message: 'Return date is required.' }
    if (!returnTime) return { success: false, message: 'Return time is required.' }
    if (!FINAL_STATUSES.includes(payload.status)) {
        return { success: false, message: 'Invalid status.' }
    }

    return {
        success: true,
        data: {
            studentId,
            studentName: payload.studentName || '',
            classSection: payload.classSection || '',
            gender: payload.gender || '',
            mobileNumber: payload.mobileNumber || '',
            city: payload.city || '',
            profile: payload.profileImage || payload.profile || noProfile,
            hostel: payload.hostel,
            leaveType: payload.leaveType,
            reason,
            outDate,
            outTime,
            returnDate,
            returnTime,
            status: payload.status,
            parentApproval: payload.parentApproval || existing?.parentApproval || 'Pending',
            // Parent OR Principal only — warden is not part of the required chain (#45).
            principalApproval:
                payload.principalApproval
                || existing?.principalApproval
                || (existing?.wardenApproval && existing.wardenApproval !== 'Pending' ? existing.wardenApproval : null)
                || 'Pending',
        },
    }
}

/** Effective principal column (legacy rows may still carry wardenApproval only). */
export const getHostelPrincipalApproval = (record) =>
    record?.principalApproval
    || (record?.wardenApproval && record.wardenApproval !== 'Pending' ? record.wardenApproval : null)
    || 'Pending'

/**
 * Overall decision: the first Parent OR Principal decision is final (server field `approvalStatus`).
 * Legacy rows without it fall back to the individual approval columns.
 */
export const getHostelApprovalStatus = (record) => {
    if (APPROVAL_STATUSES.includes(record?.approvalStatus)) return record.approvalStatus
    if (record?.parentApproval === 'Approved' || record?.parentApproval === 'Rejected') return record.parentApproval
    return getHostelPrincipalApproval(record)
}

/** Outing is cleared for gate when Parent OR Principal has approved. */
export const isHostelOutingApproved = (record) => getHostelApprovalStatus(record) === 'Approved'

/** Hostel outing passes for the signed-in parent's own children (server-filtered). */
export const fetchParentHostelGatePasses = async () => {
    const rows = await listParentHostelGatePassesApi()
    return Array.isArray(rows) ? rows : []
}

/**
 * Parent or Principal decision on hostel leave/outing / gate pass.
 * Either approval alone is sufficient; the other field may stay Pending.
 */
export const decideHostelGatePassApproval = async (id, { actor = 'principal', status, remark = '' } = {}) => {
    if (!APPROVAL_STATUSES.includes(status) || status === 'Pending') {
        return { success: false, message: 'Choose Approved or Rejected.' }
    }
    if (frontOfficeApiOn()) {
        try {
            const record = await decideFrontOfficeItem(COLLECTION, id, { decision: status, remark })
            return { success: true, record }
        } catch (error) {
            return { success: false, message: error?.message || 'Could not record the decision.' }
        }
    }
    const existing = getHostelGatePassById(id)
    if (!existing) return { success: false, message: 'Hostel gate pass not found.' }

    const field = actor === 'parent' ? 'parentApproval' : 'principalApproval'
    const current = getHostelApprovalStatus(existing)
    if (current !== 'Pending') {
        return { success: false, message: `This outing already has a final decision (${current}).` }
    }

    const next = {
        ...existing,
        parentApproval: existing.parentApproval || 'Pending',
        principalApproval: getHostelPrincipalApproval(existing),
        [field]: status,
        [`${field}DecidedAt`]: new Date().toISOString(),
    }
    // Drop orphan warden field from the write payload so UI stops requiring it.
    delete next.wardenApproval

    return updateHostelGatePass(id, next)
}

export const addHostelGatePass = async (payload) => {
    const built = buildRecordPayload(payload)
    if (!built.success) return built

    if (frontOfficeApiOn()) {
        try {
            const record = await createFrontOfficeItem(COLLECTION, built.data)
            return { success: true, record }
        } catch (error) {
            return { success: false, message: error?.message || 'Could not save hostel gate pass.' }
        }
    }

    const id = nextGatePassId()
    const record = {
        id,
        gatePassId: id,
        ...built.data,
        createdAt: new Date().toISOString(),
    }

    writeRecords([record, ...readRecords()])
    return { success: true, record }
}

export const updateHostelGatePass = async (id, payload) => {
    const existing = getHostelGatePassById(id)
    if (!existing) return { success: false, message: 'Gate pass not found.' }

    const built = buildRecordPayload(payload, existing)
    if (!built.success) return built

    if (frontOfficeApiOn()) {
        try {
            const record = await updateFrontOfficeItem(COLLECTION, id, { ...built.data, id, gatePassId: id })
            return { success: true, record }
        } catch (error) {
            return { success: false, message: error?.message || 'Could not update hostel gate pass.' }
        }
    }

    const records = readRecords()
    const index = records.findIndex((record) => record.id === id)
    if (index < 0) return { success: false, message: 'Gate pass not found.' }

    records[index] = {
        ...records[index],
        ...built.data,
        updatedAt: new Date().toISOString(),
    }
    writeRecords(records)
    return { success: true, record: records[index] }
}

export const deleteHostelGatePass = async (id) => {
    if (frontOfficeApiOn()) {
        try {
            await deleteFrontOfficeItem(COLLECTION, id)
            return { success: true }
        } catch (error) {
            return { success: false, message: error?.message || 'Could not delete hostel gate pass.' }
        }
    }
    writeRecords(readRecords().filter((record) => record.id !== id))
    return { success: true }
}

export const filterHostelGatePasses = (records, { search = '', status = '' } = {}) => {
    const query = search.trim().toLowerCase()

    return records.filter((record) => {
        if (status && record.status !== status) return false
        if (!query) return true

        return [
            record.gatePassId,
            record.studentId,
            record.studentName,
            record.classSection,
            record.hostel,
            record.leaveType,
            record.reason,
            record.status,
        ].some((value) => String(value || '').toLowerCase().includes(query))
    })
}

export const toHostelGatePassFormState = (record) => ({
    ...DEFAULT_HOSTEL_GATE_PASS_FORM,
    studentId: record?.studentId || '',
    studentName: record?.studentName || '',
    classSection: record?.classSection || '',
    gender: record?.gender || '',
    mobileNumber: record?.mobileNumber || '',
    city: record?.city || '',
    profileImage: record?.profile && record.profile !== noProfile ? record.profile : '',
    hostel: record?.hostel || '',
    leaveType: record?.leaveType || '',
    reason: record?.reason || '',
    outDate: record?.outDate || '',
    outTime: record?.outTime || '',
    returnDate: record?.returnDate || '',
    returnTime: record?.returnTime || '',
    status: record?.status || 'Pending',
})

export const validateHostelGatePassForm = (formData) => {
    const errors = {}
    if (!formData.studentId) errors.studentId = 'Select a student.'
    if (!formData.hostel) errors.hostel = 'Hostel is required.'
    if (!formData.leaveType) errors.leaveType = 'Leave type is required.'
    if (!String(formData.reason || '').trim()) errors.reason = 'Reason is required.'
    if (!formData.outDate) errors.outDate = 'Out date is required.'
    if (!String(formData.outTime || '').trim()) errors.outTime = 'Out time is required.'
    if (!formData.returnDate) errors.returnDate = 'Return date is required.'
    if (!String(formData.returnTime || '').trim()) errors.returnTime = 'Return time is required.'
    if (!FINAL_STATUSES.includes(formData.status)) errors.status = 'Select a valid status.'
    return errors
}
