import { getClasses, getSections, getSectionsForClass } from '../../../Common/RBAC/academicsCatalogData'
import { getAccessToken, isApiAuthEnabled } from '../../../services/apiClient'
import { liveArray } from '../../../Common/RBAC/liveArray'

const STORAGE_KEY = 'principal-examination-timetables'

export const ROUTE_BASE = '/principal/examination-timetable'
export const CREATE_ROUTE = '/principal/create-examination-timetable'
export const EDIT_ROUTE = (id) => `/principal/edit-examination-timetable/${id}`

export const getExamTimetableRoutes = (pathname = '') => {
    if (String(pathname).startsWith('/director')) {
        return {
            listPath: '/director/examination-approvals',
            createPath: '/director/create-examination-timetable',
            editPath: (id) => `/director/edit-examination-timetable/${id}`,
            canEdit: true,
        }
    }
    return {
        listPath: ROUTE_BASE,
        createPath: CREATE_ROUTE,
        editPath: EDIT_ROUTE,
        canEdit: true,
    }
}

export const EXAM_STATUSES = ['Draft', 'Published']
export const APPROVAL_STATUSES = ['Pending', 'Approved', 'Denied']

const DEMO_GRADES = ['Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12']
const DEMO_SECTIONS = ['A', 'B', 'C']
const apiCatalogMode = () => isApiAuthEnabled() && Boolean(getAccessToken())

export const getGradeOptions = () => {
    const fromCatalog = getClasses()
    if (fromCatalog.length) return fromCatalog
    return apiCatalogMode() ? [] : DEMO_GRADES
}

export const getSectionOptions = (className = '') => {
    const fromCatalog = className ? getSectionsForClass(className) : getSections()
    if (fromCatalog.length) return fromCatalog
    return apiCatalogMode() ? [] : DEMO_SECTIONS
}

export const GRADES = liveArray(getGradeOptions)
export const SECTIONS = liveArray(() => getSectionOptions())
export const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
export const SUBJECTS = ['Tamil', 'English', 'Science', 'Social', 'EVS', 'Hindi', 'French', 'Maths', 'GK']
export const TEACHERS = ['Mr. Ravi Kumar', 'Ms. Anitha Verma', 'Dr. Suresh Menon', 'Mr. Karthik Selvan', 'Mrs. Priya Nair']

export const approvalStatusColor = {
    'Not submitted': 'text-[#667085] border-[#66708533] bg-[#66708514]',
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
    // Default Published so create submits to Director; use Draft only to keep unpublished.
    status: 'Published',
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

/** Map campus GET /exams row into the Principal timetable list shape. */
export const mapExamApiToTimetableRecord = (exam) => {
    // Backend: draft | submitted | approved | denied
    // UI Status: Draft = not published yet; Published = submitted or approved for use
    const statusRaw = String(exam.status || '').toLowerCase()
    const status = statusRaw === 'draft' || !statusRaw ? 'Draft' : 'Published'
    const approvalStatus =
        statusRaw === 'draft' || !statusRaw
            ? 'Not submitted'
            : statusRaw === 'submitted' || statusRaw.includes('pending') || statusRaw.includes('await')
              ? 'Pending'
              : statusRaw === 'approved' || statusRaw.includes('publish')
                ? 'Approved'
                : statusRaw.includes('reject') || statusRaw.includes('den')
                  ? 'Denied'
                  : 'Pending'
    return {
        id: String(exam.id),
        examName: exam.name || exam.examName || '',
        examType: exam.examType || exam.exam_type || '',
        academicYear: exam.academicYear || exam.academic_year || '',
        className: exam.className || exam.class_name || '',
        section: exam.section || '',
        teacherName: exam.teacherName || exam.teacher_name || '',
        status,
        startDate: exam.startDate || exam.start_date || '',
        endDate: exam.endDate || exam.end_date || '',
        createdDate: '',
        approvalStatus,
        timelines: Array.isArray(exam.timelines) ? exam.timelines : [],
        source: 'api',
    }
}

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

export const updateExamTimetable = (id, payload) => {
    const list = getExamTimetables()
    const index = list.findIndex((item) => item.id === id)
    if (index < 0) return null
    const updated = {
        ...list[index],
        examName: payload.examName,
        className: payload.className,
        section: payload.section,
        teacherName: payload.teacherName,
        status: payload.status || list[index].status,
        startDate: formatDisplayDate(payload.startDate),
        endDate: formatDisplayDate(payload.endDate),
        timelines: (payload.timelines || []).filter((row) => row.day && row.subject),
    }
    const next = [...list]
    next[index] = updated
    saveExamTimetables(next)
    return updated
}

/** Parse stored exam dates (ISO, dd-mm-yyyy, dd/mm/yyyy, or Date) for DatePicker. */
export const parseExamDate = (value) => {
    if (!value) return null
    if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value
    const text = String(value).trim()
    if (!text) return null
    const iso = text.match(/^(\d{4})-(\d{2})-(\d{2})/)
    if (iso) {
        const date = new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]))
        return Number.isNaN(date.getTime()) ? null : date
    }
    const dmy = text.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/)
    if (dmy) {
        const date = new Date(Number(dmy[3]), Number(dmy[2]) - 1, Number(dmy[1]))
        return Number.isNaN(date.getTime()) ? null : date
    }
    const fallback = new Date(text)
    return Number.isNaN(fallback.getTime()) ? null : fallback
}

export const examRecordToForm = (record) => {
    if (!record) return defaultExamTimetableForm()
    const timelines = Array.isArray(record.timelines) ? record.timelines : []
    return {
        examId: record.id || record.examId || '',
        examName: record.examName || record.name || '',
        className: record.className || '',
        section: record.section || '',
        teacherName: record.teacherName || '',
        examType: record.examType || 'MIDTERM',
        status: record.status || 'Draft',
        startDate: parseExamDate(record.startDate),
        endDate: parseExamDate(record.endDate),
        timelines: timelines.length
            ? timelines.map((row) => ({
                ...createTimelineRow(),
                ...row,
                id: row.id || createTimelineRow().id,
                examDate: row.examDate || row.date || '',
            }))
            : [createTimelineRow()],
    }
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
