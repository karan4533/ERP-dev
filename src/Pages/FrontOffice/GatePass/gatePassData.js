import { getStudentById, getStudentsList } from '../../../Common/StudentDatabase/studentDatabaseData'
import { filterListRows } from '../../../Common/listFiltering'
import {
    createFrontOfficeItem,
    decideFrontOfficeItem,
    deleteFrontOfficeItem,
    frontOfficeApiOn,
    hydrateFrontOfficeCollection,
    peekFrontOfficeCollection,
    updateFrontOfficeItem,
} from '../frontOfficeStore'

const STORAGE_KEY = 'student-gate-pass-front-office'
const COUNTER_KEY = 'student-gate-pass-sgp-counter'
const COLLECTION = 'student-gate-passes'

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

export const hydrateStudentGatePassesFromApi = () => hydrateFrontOfficeCollection(COLLECTION)

export const getStudentGatePasses = () =>
    frontOfficeApiOn() ? peekFrontOfficeCollection(COLLECTION) : readRecords()

export const getStudentGatePassById = (id) =>
    getStudentGatePasses().find((record) => record.id === id) ?? null

const buildRecord = (payload, id) => {
    const base = {
        studentId: String(payload.studentId || '').trim(),
        studentName: payload.studentName || '',
        classSection: payload.classSection || '',
        gender: payload.gender || '',
        mobileNumber: payload.mobileNumber || '',
        city: payload.city || '',
        reason: String(payload.reason || '').trim(),
        date: String(payload.date || '').trim(),
        outTime: String(payload.outTime || '').trim(),
        status: payload.status,
        profileImage: payload.profileImage || '',
    }
    if (id) {
        base.id = id
        base.gatePassId = id
    }
    return base
}

const validatePayload = (payload) => {
    if (!String(payload.studentId || '').trim()) return 'Student ID is required.'
    if (!String(payload.reason || '').trim()) return 'Reason is required.'
    if (!String(payload.date || '').trim()) return 'Date is required.'
    if (!String(payload.outTime || '').trim()) return 'Out time is required.'
    if (!STATUS_OPTIONS.includes(payload.status)) return 'Invalid status.'
    return ''
}

export const addStudentGatePass = async (payload) => {
    const message = validatePayload(payload)
    if (message) return { success: false, message }

    if (frontOfficeApiOn()) {
        try {
            const record = await createFrontOfficeItem(COLLECTION, buildRecord(payload, undefined))
            return { success: true, record }
        } catch (error) {
            return { success: false, message: error?.message || 'Could not save gate pass.' }
        }
    }

    const id = nextGatePassId()
    const record = { ...buildRecord(payload, id), createdAt: new Date().toISOString() }
    writeRecords([record, ...readRecords()])
    return { success: true, record }
}

export const updateStudentGatePass = async (id, payload) => {
    const message = validatePayload(payload)
    if (message) return { success: false, message }

    if (frontOfficeApiOn()) {
        try {
            const record = await updateFrontOfficeItem(COLLECTION, id, buildRecord(payload, id))
            return { success: true, record }
        } catch (error) {
            return { success: false, message: error?.message || 'Could not update gate pass.' }
        }
    }

    const records = readRecords()
    const index = records.findIndex((record) => record.id === id)
    if (index < 0) return { success: false, message: 'Gate pass not found.' }
    records[index] = { ...records[index], ...buildRecord(payload, id), updatedAt: new Date().toISOString() }
    writeRecords(records)
    return { success: true, record: records[index] }
}

/** Principal / approver status decision without re-editing FO form fields. */
export const decideStudentGatePassStatus = async (id, status, { decidedBy = 'Principal', remark = '' } = {}) => {
    if (!STATUS_OPTIONS.includes(status) || status === 'Pending') {
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
    const existing = getStudentGatePassById(id)
    if (!existing) return { success: false, message: 'Gate pass not found.' }
    if (existing.status !== 'Pending') {
        return { success: false, message: `Gate pass is already ${existing.status}.` }
    }
    return updateStudentGatePass(id, {
        ...existing,
        status,
        decidedBy,
        decidedAt: new Date().toISOString(),
    })
}

export const deleteStudentGatePass = async (id) => {
    if (frontOfficeApiOn()) {
        try {
            await deleteFrontOfficeItem(COLLECTION, id)
            return { success: true }
        } catch (error) {
            return { success: false, message: error?.message || 'Could not delete gate pass.' }
        }
    }
    writeRecords(readRecords().filter((record) => record.id !== id))
    return { success: true }
}

export const filterStudentGatePasses = (records, { search = '', status = '', fromDate = null, toDate = null } = {}) =>
    filterListRows(records, {
        search,
        searchKeys: [
            'gatePassId',
            'id',
            'studentId',
            'studentName',
            'classSection',
            'className',
            'section',
            'mobileNumber',
            'city',
            'reason',
            'status',
        ],
        equals: { status: status || '' },
        fromDate,
        toDate,
        dateKeys: ['date', 'requestDate', 'fromDate', 'createdDate'],
    })

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
