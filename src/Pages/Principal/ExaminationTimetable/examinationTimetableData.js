const STORAGE_KEY = 'principal-examination-timetables'

export const ROUTE_BASE = '/principal/examination-timetable'
export const CREATE_ROUTE = '/principal/create-examination-timetable'

export const EXAM_STATUSES = ['Draft', 'Published']
export const APPROVAL_STATUSES = ['Pending', 'Approved', 'Denied']

export const GRADES = ['Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12']
export const SECTIONS = ['A', 'B', 'C']
export const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
export const SUBJECTS = ['Tamil', 'English', 'Science', 'Social', 'EVS', 'Hindi', 'French', 'Maths', 'GK']
export const TEACHERS = ['Mr. Ravi Kumar', 'Ms. Anitha Verma', 'Dr. Suresh Menon', 'Mr. Karthik Selvan', 'Mrs. Priya Nair']

export const approvalStatusColor = {
    Approved: 'text-[#4CAF50] border-[#4CAF5033] bg-[#4CAF5014]',
    Pending: 'text-[#FF9800] border-[#FF980033] bg-[#FF980014]',
    Denied: 'text-[#980E0F] border-[#980E0F33] bg-[#980E0F14]',
}

export const examStatusColor = {
    Published: 'text-[#4CAF50] border-[#4CAF5033] bg-[#4CAF5014]',
    Draft: 'text-[#667085] border-[#66708533] bg-[#66708514]',
}

export const createTimelineRow = () => ({
    id: `TL-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    day: '',
    subject: '',
    examDate: '',
    startTime: '',
    endTime: '',
})

export const defaultExamTimetableForm = () => ({
    examId: '',
    examName: '',
    className: '',
    section: '',
    teacherName: '',
    status: 'Draft',
    startDate: null,
    endDate: null,
    timelines: [createTimelineRow()],
})

const DEFAULT_EXAM_TIMETABLES = [
    {
        id: 'EXM001',
        examName: 'Mid Term Examination',
        className: 'Grade 9',
        section: 'A',
        teacherName: 'Mr. Ravi Kumar',
        status: 'Published',
        startDate: '15-09-2025',
        endDate: '20-09-2025',
        createdDate: '01-09-2025',
        approvalStatus: 'Pending',
        timelines: [
            { id: 'TL-1', day: 'Monday', subject: 'Tamil', examDate: '02/05/2026', startTime: '10:30', endTime: '12:30' },
            { id: 'TL-2', day: 'Monday', subject: 'English', examDate: '02/05/2026', startTime: '14:30', endTime: '16:30' },
            { id: 'TL-3', day: 'Tuesday', subject: 'Science', examDate: '03/05/2026', startTime: '10:30', endTime: '12:30' },
            { id: 'TL-4', day: 'Wednesday', subject: 'Maths', examDate: '04/05/2026', startTime: '14:30', endTime: '16:30' },
        ],
    },
]

export const getExamTimetables = () => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY)
        if (stored) return JSON.parse(stored)
    } catch {
        /* ignore */
    }
    return [...DEFAULT_EXAM_TIMETABLES]
}

export const saveExamTimetables = (records) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records))
}

export const getExamTimetableById = (id) =>
    getExamTimetables().find((item) => item.id === id) ?? null

export const generateExamId = () => {
    const list = getExamTimetables()
    const max = list.reduce((acc, item) => {
        const num = Number(item.id.replace('EXM', ''))
        return Number.isFinite(num) ? Math.max(acc, num) : acc
    }, 0)
    return `EXM${String(max + 1).padStart(3, '0')}`
}

export const formatDisplayDate = (value) => {
    if (!value) return ''
    if (typeof value === 'string') return value
    return value.toLocaleDateString('en-GB').replace(/\//g, '-')
}

export const addExamTimetable = (payload) => {
    const record = {
        id: payload.examId || generateExamId(),
        examName: payload.examName,
        className: payload.className,
        section: payload.section,
        teacherName: payload.teacherName,
        status: payload.status || 'Draft',
        startDate: formatDisplayDate(payload.startDate),
        endDate: formatDisplayDate(payload.endDate),
        createdDate: formatDisplayDate(new Date()),
        approvalStatus: 'Pending',
        timelines: payload.timelines.filter((row) => row.day && row.subject),
    }
    saveExamTimetables([record, ...getExamTimetables()])
    return record
}

export const buildExamGridFromTimelines = (timelines = []) => {
    const days = [...new Set(timelines.map((row) => row.day).filter(Boolean))]
    const slotMap = new Map()

    timelines.forEach((row) => {
        if (!row.startTime || !row.endTime) return
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
            date: row.examDate || '—',
        }
    })

    return {
        days: days.length ? days : DAYS.slice(0, 6),
        timeSlots: timeSlots.length ? timeSlots : [{ time: '—', label: '—' }],
        schedule,
    }
}

export const getClassSectionLabel = (record) =>
    `${record.className} - ${record.section}`
