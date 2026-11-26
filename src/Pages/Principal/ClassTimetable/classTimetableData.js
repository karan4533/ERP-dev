const STORAGE_KEY = 'principal-class-timetables'
const CHANGE_KEY = 'principal-class-timetable-change-requests'

export const ROUTE_BASE = '/principal/class-timetable'
export const CREATE_ROUTE = '/principal/create-class-timetable'

export const APPROVAL_STATUSES = ['Pending', 'Approved', 'Denied']

export const GRADES = ['Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12']
export const SECTIONS = ['A', 'B', 'C']
export const TERMS = ['Term 1', 'Term 2']
export const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
export const SUBJECTS = ['English', 'Mathematics', 'Science', 'Social Science', 'Hindi', 'Computer Science', 'Physical Education']
export const TEACHERS = ['Mr. Ravi Kumar', 'Ms. Anitha Verma', 'Dr. Suresh Menon', 'Mr. Karthik Selvan', 'Mrs. Priya Nair']

export const approvalStatusColor = {
    Approved: 'text-[#4CAF50] border-[#4CAF5033] bg-[#4CAF5014]',
    Pending: 'text-[#FF9800] border-[#FF980033] bg-[#FF980014]',
    Denied: 'text-[#980E0F] border-[#980E0F33] bg-[#980E0F14]',
}

export const createTimelineRow = () => ({
    id: `TL-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    periodNumber: '',
    day: '',
    subject: '',
    teacher: '',
    startTime: '',
    endTime: '',
})

export const defaultClassTimetableForm = () => ({
    timetableId: '',
    className: '',
    section: '',
    academicYear: '2025-2026',
    term: '',
    timelines: [createTimelineRow()],
})

const DEFAULT_CLASS_TIMETABLES = [
    {
        id: 'CTT001',
        className: 'Grade 9',
        section: 'A',
        academicYear: '2025-2026',
        term: 'Term 1',
        submittedDate: '15-05-2025',
        approvalStatus: 'Pending',
        timelines: [
            { id: 'TL-1', periodNumber: '1', day: 'Monday', subject: 'English', teacher: 'Ms. Anitha Verma', startTime: '09:00', endTime: '09:45' },
            { id: 'TL-2', periodNumber: '2', day: 'Monday', subject: 'Mathematics', teacher: 'Mr. Ravi Kumar', startTime: '09:45', endTime: '10:30' },
            { id: 'TL-3', periodNumber: '1', day: 'Tuesday', subject: 'Science', teacher: 'Dr. Suresh Menon', startTime: '09:00', endTime: '09:45' },
            { id: 'TL-4', periodNumber: '2', day: 'Wednesday', subject: 'Social Science', teacher: 'Mr. Karthik Selvan', startTime: '09:45', endTime: '10:30' },
        ],
    },
    {
        id: 'CTT002',
        className: 'Grade 10',
        section: 'B',
        academicYear: '2025-2026',
        term: 'Term 1',
        submittedDate: '20-05-2025',
        approvalStatus: 'Approved',
        timelines: [
            { id: 'TL-5', periodNumber: '1', day: 'Monday', subject: 'Mathematics', teacher: 'Mr. Ravi Kumar', startTime: '09:00', endTime: '09:45' },
            { id: 'TL-6', periodNumber: '2', day: 'Tuesday', subject: 'English', teacher: 'Ms. Anitha Verma', startTime: '09:45', endTime: '10:30' },
        ],
    },
]

export const getClassTimetables = () => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY)
        if (stored) return JSON.parse(stored)
    } catch {
        /* ignore */
    }
    return [...DEFAULT_CLASS_TIMETABLES]
}

export const saveClassTimetables = (records) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records))
}

export const getClassTimetableById = (id) =>
    getClassTimetables().find((item) => item.id === id) ?? null

export const generateTimetableId = () => {
    const list = getClassTimetables()
    const max = list.reduce((acc, item) => {
        const num = Number(item.id.replace('CTT', ''))
        return Number.isFinite(num) ? Math.max(acc, num) : acc
    }, 0)
    return `CTT${String(max + 1).padStart(3, '0')}`
}

export const formatSubmittedDate = () =>
    new Date().toLocaleDateString('en-GB').replace(/\//g, '-')

export const addClassTimetable = (payload) => {
    const record = {
        id: payload.timetableId || generateTimetableId(),
        className: payload.className,
        section: payload.section,
        academicYear: payload.academicYear,
        term: payload.term,
        submittedDate: formatSubmittedDate(),
        approvalStatus: 'Pending',
        timelines: payload.timelines.filter((row) => row.day && row.subject),
    }
    saveClassTimetables([record, ...getClassTimetables()])
    return record
}

export const buildClassGridFromTimelines = (timelines = []) => {
    const days = [...new Set(timelines.map((row) => row.day).filter(Boolean))]
    const slotMap = new Map()

    timelines.forEach((row) => {
        if (!row.day || !row.startTime || !row.endTime) return
        const label = `${row.startTime} - ${row.endTime}`
        if (!slotMap.has(label)) {
            slotMap.set(label, {
                label,
                time: `${row.startTime} -\n${row.endTime}`,
            })
        }
    })

    const timeSlots = [...slotMap.values()]
    const schedule = {}

    timelines.forEach((row) => {
        if (!row.day || !row.startTime || !row.endTime || !row.subject) return
        const label = `${row.startTime} - ${row.endTime}`
        if (!schedule[label]) schedule[label] = {}
        schedule[label][row.day] = {
            subject: row.subject,
            teacher: row.teacher || '—',
        }
    })

    return {
        days: days.length ? days : DAYS.slice(0, 5),
        timeSlots: timeSlots.length ? timeSlots : [{ time: '—', label: '—' }],
        schedule,
    }
}

export const getClassSectionLabel = (record) =>
    `${record.className} - ${record.section}`

const readChanges = () => {
    try {
        const stored = localStorage.getItem(CHANGE_KEY)
        if (stored) return JSON.parse(stored)
    } catch {
        /* ignore */
    }
    return []
}

export const getTimetableChangeRequests = () => readChanges()

export const addTimetableChangeRequest = (payload) => {
    const items = readChanges()
    const record = {
        id: `TCR-${Date.now()}`,
        timetableId: payload.timetableId || '',
        className: payload.className,
        section: payload.section,
        day: payload.day,
        periodNumber: payload.periodNumber || '',
        currentSubject: payload.currentSubject || '',
        requestedSubject: payload.requestedSubject,
        requestedTeacher: payload.requestedTeacher || '',
        reason: payload.reason,
        requestedBy: payload.requestedBy,
        requestedByRole: payload.requestedByRole,
        status: 'Pending',
        reviewedBy: '',
        reviewedAt: '',
        rejectionReason: '',
    }
    localStorage.setItem(CHANGE_KEY, JSON.stringify([record, ...items]))
    return record
}

const applyChangeToTimetable = (request) => {
    const timetables = getClassTimetables()
    const match = timetables.find((item) => (
        item.id === request.timetableId
        || (item.className === request.className && item.section === request.section)
    ))
    const row = {
        id: `TL-${Date.now()}`,
        periodNumber: request.periodNumber || '1',
        day: request.day,
        subject: request.requestedSubject,
        teacher: request.requestedTeacher || '—',
        startTime: '09:00',
        endTime: '09:45',
    }
    if (!match) {
        addClassTimetable({
            className: request.className,
            section: request.section,
            academicYear: '2025-2026',
            term: 'Term 1',
            timelines: [row],
        })
        const created = getClassTimetables()[0]
        if (created) {
            saveClassTimetables(getClassTimetables().map((item) => (
                item.id === created.id ? { ...item, approvalStatus: 'Approved' } : item
            )))
        }
        return
    }
    const timelines = match.timelines.map((item) => (
        item.day === request.day && (!request.periodNumber || item.periodNumber === request.periodNumber)
            ? { ...item, subject: request.requestedSubject, teacher: request.requestedTeacher || item.teacher }
            : item
    ))
    const changed = timelines.some((item, index) => item !== match.timelines[index])
    saveClassTimetables(timetables.map((item) => (
        item.id === match.id
            ? { ...item, timelines: changed ? timelines : [...timelines, row], approvalStatus: 'Approved' }
            : item
    )))
}

export const decideTimetableChangeRequest = (id, approved, reviewer, rejectionReason = '') => {
    const items = readChanges()
    const target = items.find((item) => item.id === id)
    if (!target || target.status !== 'Pending') return items
    if (approved) applyChangeToTimetable(target)
    const next = items.map((item) => (
        item.id === id
            ? {
                ...item,
                status: approved ? 'Approved' : 'Rejected',
                reviewedBy: reviewer,
                reviewedAt: new Date().toISOString(),
                rejectionReason: approved ? '' : rejectionReason,
            }
            : item
    ))
    localStorage.setItem(CHANGE_KEY, JSON.stringify(next))
    return next
}
