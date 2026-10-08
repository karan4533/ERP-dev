import noProfile from '../../../assets/images/no-profile.png'
import {
    formatGatePassDate,
    formatOutTimeForDisplay,
    getEnrolledStudentSelectOptions,
    mapStudentForGatePass,
    parseGatePassDate,
} from '../GatePass/gatePassData'

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

export const getHostelGatePasses = () => readRecords()

export const getHostelGatePassById = (id) =>
    readRecords().find((record) => record.id === id) ?? null

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
            profile: payload.profileImage || noProfile,
            hostel: payload.hostel,
            leaveType: payload.leaveType,
            reason,
            outDate,
            outTime,
            returnDate,
            returnTime,
            status: payload.status,
            parentApproval: existing?.parentApproval || 'Pending',
            wardenApproval: existing?.wardenApproval || 'Pending',
        },
    }
}

export const addHostelGatePass = (payload) => {
    const built = buildRecordPayload(payload)
    if (!built.success) return built

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

export const updateHostelGatePass = (id, payload) => {
    const records = readRecords()
    const index = records.findIndex((record) => record.id === id)
    if (index < 0) return { success: false, message: 'Gate pass not found.' }

    const built = buildRecordPayload(payload, records[index])
    if (!built.success) return built

    records[index] = {
        ...records[index],
        ...built.data,
        updatedAt: new Date().toISOString(),
    }
    writeRecords(records)
    return { success: true, record: records[index] }
}

export const deleteHostelGatePass = (id) => {
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
