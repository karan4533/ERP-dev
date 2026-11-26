/**
 * Front Office Student Gate Pass Data Layer
 * Fully synchronized with Enterprise Gate Pass & Security Engine
 */

import {
    getStudentGatePasses as getUnifiedStudentGatePasses,
    saveStudentGatePasses,
    getStudentGatePassById as getUnifiedStudentGatePassById,
    createStudentGatePassRequest,
    filterStudentGatePasses as filterUnifiedStudentGatePasses,
    cancelStudentGatePass,
    getAvailableStudents,
    STUDENT_GATE_PASS_STATUSES
} from '../../../Common/GatePassSecurity/gatePassSecurityData'

export const STATUS_OPTIONS = [
    'Pending Approval',
    'Approved',
    'Ready for Exit',
    'Exit Recorded',
    'Returned',
    'Rejected',
    'Cancelled'
]

export const statusBadgeColor = {
    'Pending': 'bg-amber-50 text-amber-700 border-amber-200',
    'Pending Approval': 'bg-amber-50 text-amber-700 border-amber-200',
    'Approved': 'bg-emerald-50 text-emerald-700 border-emerald-200',
    'Ready for Exit': 'bg-blue-50 text-blue-700 border-blue-200',
    'Exit Recorded': 'bg-indigo-50 text-indigo-700 border-indigo-200',
    'Returned': 'bg-slate-100 text-slate-700 border-slate-300',
    'Rejected': 'bg-rose-50 text-rose-700 border-rose-200',
    'Cancelled': 'bg-gray-100 text-gray-500 border-gray-200',
    'Overdue': 'bg-red-50 text-red-700 border-red-300',
    'Overdue Return': 'bg-red-50 text-red-700 border-red-300'
}

export const DEFAULT_GATE_PASS_FORM = {
    studentId: '',
    studentName: '',
    classSection: '',
    department: 'Academics - Secondary',
    gender: '',
    mobileNumber: '',
    city: '',
    reason: '',
    date: '',
    outTime: '11:00 AM',
    expectedDepartureTime: '11:00 AM',
    expectedReturnTime: '03:00 PM',
    accompanyingPerson: '',
    parentGuardianInfo: '',
    remarks: '',
    status: 'Pending Approval',
    profileImage: '',
}

export const formatGatePassDate = (date) => {
    if (!date) return ''
    const value = date instanceof Date ? date : new Date(date)
    if (Number.isNaN(value.getTime())) return ''
    const day = String(value.getDate()).padStart(2, '0')
    const month = String(value.getMonth() + 1).padStart(2, '0')
    const year = value.getFullYear()
    return `${day}-${month}-${year}`
}

export const parseGatePassDate = (value) => {
    if (!value) return new Date()
    if (value instanceof Date) return value
    const parts = String(value).split('-').map(Number)
    if (parts.length === 3 && parts[0] && parts[1] && parts[2]) {
        // DD-MM-YYYY
        return new Date(parts[2], parts[1] - 1, parts[0])
    }
    return new Date()
}

export const formatOutTimeForDisplay = (value) => {
    if (!value) return '—'
    if (/^\d{2}:\d{2}$/.test(value)) {
        const [hours, minutes] = value.split(':').map(Number)
        const period = hours >= 12 ? 'PM' : 'AM'
        const hour12 = hours % 12 || 12
        return `${hour12}:${String(minutes).padStart(2, '0')} ${period}`
    }
    return value
}

export const parseOutTimeForInput = (value) => {
    if (!value) return ''
    if (/^\d{2}:\d{2}$/.test(value)) return value

    const match = String(value).match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i)
    if (!match) return ''

    let hours = Number(match[1])
    const minutes = match[2]
    const period = (match[3] || 'AM').toUpperCase()
    if (period === 'PM' && hours !== 12) hours += 12
    if (period === 'AM' && hours === 12) hours = 0
    return `${String(hours).padStart(2, '0')}:${minutes}`
}

export const getEnrolledStudentSelectOptions = () => {
    const list = getAvailableStudents()
    return list.map((s) => ({
        value: s.studentId,
        label: `${s.studentId} — ${s.studentName} (${s.classSection})`
    }))
}

export const mapStudentForGatePass = (studentId) => {
    const list = getAvailableStudents()
    const student = list.find((s) => s.studentId === studentId)
    if (!student) return null

    return {
        studentId: student.studentId,
        studentName: student.studentName,
        classSection: student.classSection,
        department: student.department || 'Academics - Secondary',
        gender: student.gender,
        mobileNumber: student.mobileNumber,
        city: student.city,
        parentGuardianInfo: `${student.parentName || 'Parent'} (${student.parentPhone || student.mobileNumber})`,
        accompanyingPerson: student.parentName || 'Parent / Guardian',
        profileImage: ''
    }
}

export const getStudentGatePasses = () => getUnifiedStudentGatePasses()

export const getStudentGatePassById = (id) => getUnifiedStudentGatePassById(id)

export const addStudentGatePass = (payload) => {
    try {
        const result = createStudentGatePassRequest({
            studentId: payload.studentId,
            studentName: payload.studentName,
            classSection: payload.classSection,
            department: payload.department,
            reason: payload.reason,
            date: payload.date,
            expectedDepartureTime: payload.expectedDepartureTime || payload.outTime,
            expectedReturnTime: payload.expectedReturnTime || '04:00 PM',
            accompanyingPerson: payload.accompanyingPerson,
            parentGuardianInfo: payload.parentGuardianInfo,
            remarks: payload.remarks,
            requesterName: 'Kavita Reddy (PRM / Front Office)',
            requesterRole: 'prm'
        })
        return { success: true, record: result }
    } catch (err) {
        return { success: false, message: err.message }
    }
}

export const updateStudentGatePass = (id, payload) => {
    const passes = getUnifiedStudentGatePasses()
    const idx = passes.findIndex((p) => p.id === id || p.gatePassId === id)
    if (idx < 0) return { success: false, message: 'Gate pass not found.' }

    passes[idx] = {
        ...passes[idx],
        ...payload,
        updatedAt: new Date().toISOString()
    }
    saveStudentGatePasses(passes)
    return { success: true, record: passes[idx] }
}

export const deleteStudentGatePass = (id) => {
    try {
        cancelStudentGatePass(id, 'Kavita Reddy (PRM)')
        return { success: true }
    } catch (err) {
        return { success: false, message: err.message }
    }
}

export const filterStudentGatePasses = (records, filters) =>
    filterUnifiedStudentGatePasses(records, filters)

export const toGatePassFormState = (record) => ({
    ...DEFAULT_GATE_PASS_FORM,
    studentId: record?.studentId || '',
    studentName: record?.studentName || '',
    classSection: record?.classSection || '',
    department: record?.department || 'Academics - Secondary',
    gender: record?.gender || '',
    mobileNumber: record?.mobileNumber || '',
    city: record?.city || '',
    reason: record?.reason || '',
    date: record?.date || '',
    outTime: record?.expectedDepartureTime || record?.outTime || '11:00 AM',
    expectedDepartureTime: record?.expectedDepartureTime || record?.outTime || '11:00 AM',
    expectedReturnTime: record?.expectedReturnTime || '03:00 PM',
    accompanyingPerson: record?.accompanyingPerson || '',
    parentGuardianInfo: record?.parentGuardianInfo || '',
    remarks: record?.remarks || '',
    status: record?.status || 'Pending Approval',
    profileImage: record?.profileImage || '',
})

export const validateStudentGatePassForm = (formData) => {
    const errors = {}
    if (!formData.studentId) errors.studentId = 'Select a student.'
    if (!String(formData.reason || '').trim()) errors.reason = 'Reason is required.'
    if (!formData.date) errors.date = 'Date is required.'
    if (!String(formData.expectedDepartureTime || formData.outTime || '').trim()) {
        errors.expectedDepartureTime = 'Departure time is required.'
    }
    if (!String(formData.expectedReturnTime || '').trim()) {
        errors.expectedReturnTime = 'Expected return time is required.'
    }
    return errors
}
