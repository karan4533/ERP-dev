import { getStudentById, getStudentsList } from '../../../Common/StudentDatabase/studentDatabaseData'

const STORAGE_KEY = 'student-gate-pass-front-office'
const COUNTER_KEY = 'student-gate-pass-sgp-counter'

export const STATUS_OPTIONS = ['Pending', 'Approved', 'Rejected']

export const statusBadgeColor = {
    Pending: 'bg-[#FF980033] text-[#FF9800]',
    Approved: 'bg-[#4CAF5033] text-[#4CAF50]',
    Rejected: 'bg-[#FF000033] text-[#FF0000]',
}

export const DEFAULT_GATE_PASS_FORM = {
    studentId: '',
    studentName: '',
    classSection: '',
    gender: '',
    mobileNumber: '',
    city: '',
    reason: '',
    date: '',
    outTime: '',
    status: 'Pending',
    profileImage: '',
}

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
    return `SGP-${String(current).padStart(4, '0')}`
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
    const [day, month, year] = String(value).split('-').map(Number)
    if (!day || !month || !year) return new Date()
    return new Date(year, month - 1, day)
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

    const match = String(value).match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i)
    if (!match) return ''

    let hours = Number(match[1])
    const minutes = match[2]
    const period = match[3].toUpperCase()
    if (period === 'PM' && hours !== 12) hours += 12
    if (period === 'AM' && hours === 12) hours = 0
    return `${String(hours).padStart(2, '0')}:${minutes}`
}

export const getEnrolledStudentSelectOptions = () =>
    getStudentsList().map((student) => ({
        value: student.id,
        label: `${student.id} — ${student.name}`,
    }))

export const mapStudentForGatePass = (studentId) => {
    const student = getStudentById(studentId)
    if (!student) return null

    const studentName = [student.firstName, student.middleName, student.lastName]
        .filter((part) => part && part !== '—')
        .join(' ')

    const className = student.class && student.class !== '—' ? student.class : ''
    const section = student.classSection && student.classSection !== '—' ? student.classSection : ''
    const classSection = [className, section].filter(Boolean).join(' ') || '—'

    return {
        studentId: student.studentId,
        studentName: studentName || '—',
        classSection,
        gender: student.gender !== '—' ? student.gender : '',
        mobileNumber: student.contact.mobileNumber !== '—' ? student.contact.mobileNumber : '',
        city: student.address.city !== '—' ? student.address.city : '',
        profileImage: student.profileImage || '',
    }
}

export const getStudentGatePasses = () => readRecords()

export const getStudentGatePassById = (id) =>
    readRecords().find((record) => record.id === id) ?? null

export const addStudentGatePass = (payload) => {
    const studentId = String(payload.studentId || '').trim()
    const reason = String(payload.reason || '').trim()
    const outTime = String(payload.outTime || '').trim()
    const date = String(payload.date || '').trim()

    if (!studentId) return { success: false, message: 'Student ID is required.' }
    if (!reason) return { success: false, message: 'Reason is required.' }
    if (!date) return { success: false, message: 'Date is required.' }
    if (!outTime) return { success: false, message: 'Out time is required.' }
    if (!STATUS_OPTIONS.includes(payload.status)) {
        return { success: false, message: 'Invalid status.' }
    }

    const id = nextGatePassId()
    const record = {
        id,
        gatePassId: id,
        studentId,
        studentName: payload.studentName || '',
        classSection: payload.classSection || '',
        gender: payload.gender || '',
        mobileNumber: payload.mobileNumber || '',
        city: payload.city || '',
        reason,
        date,
        outTime,
        status: payload.status,
        profileImage: payload.profileImage || '',
        createdAt: new Date().toISOString(),
    }

    writeRecords([record, ...readRecords()])
    return { success: true, record }
}

export const updateStudentGatePass = (id, payload) => {
    const records = readRecords()
    const index = records.findIndex((record) => record.id === id)
    if (index < 0) return { success: false, message: 'Gate pass not found.' }

    const studentId = String(payload.studentId || '').trim()
    const reason = String(payload.reason || '').trim()
    const outTime = String(payload.outTime || '').trim()
    const date = String(payload.date || '').trim()

    if (!studentId) return { success: false, message: 'Student ID is required.' }
    if (!reason) return { success: false, message: 'Reason is required.' }
    if (!date) return { success: false, message: 'Date is required.' }
    if (!outTime) return { success: false, message: 'Out time is required.' }
    if (!STATUS_OPTIONS.includes(payload.status)) {
        return { success: false, message: 'Invalid status.' }
    }

    records[index] = {
        ...records[index],
        studentId,
        studentName: payload.studentName || '',
        classSection: payload.classSection || '',
        gender: payload.gender || '',
        mobileNumber: payload.mobileNumber || '',
        city: payload.city || '',
        reason,
        date,
        outTime,
        status: payload.status,
        profileImage: payload.profileImage || '',
        updatedAt: new Date().toISOString(),
    }

    writeRecords(records)
    return { success: true, record: records[index] }
}

export const deleteStudentGatePass = (id) => {
    writeRecords(readRecords().filter((record) => record.id !== id))
    return { success: true }
}

export const filterStudentGatePasses = (records, { search = '', status = '' } = {}) => {
    const query = search.trim().toLowerCase()

    return records.filter((record) => {
        const matchesStatus = !status || record.status === status
        if (!matchesStatus) return false
        if (!query) return true

        return [
            record.gatePassId,
            record.studentId,
            record.studentName,
            record.classSection,
            record.mobileNumber,
            record.city,
            record.reason,
            record.status,
        ].some((value) => String(value || '').toLowerCase().includes(query))
    })
}

export const toGatePassFormState = (record) => ({
    ...DEFAULT_GATE_PASS_FORM,
    studentId: record?.studentId || '',
    studentName: record?.studentName || '',
    classSection: record?.classSection || '',
    gender: record?.gender || '',
    mobileNumber: record?.mobileNumber || '',
    city: record?.city || '',
    reason: record?.reason || '',
    date: record?.date || '',
    outTime: record?.outTime || '',
    status: record?.status || 'Pending',
    profileImage: record?.profileImage || '',
})

export const validateStudentGatePassForm = (formData) => {
    const errors = {}
    if (!formData.studentId) errors.studentId = 'Select a student.'
    if (!String(formData.reason || '').trim()) errors.reason = 'Reason is required.'
    if (!formData.date) errors.date = 'Date is required.'
    if (!String(formData.outTime || '').trim()) errors.outTime = 'Out time is required.'
    if (!STATUS_OPTIONS.includes(formData.status)) errors.status = 'Select a valid status.'
    return errors
}
