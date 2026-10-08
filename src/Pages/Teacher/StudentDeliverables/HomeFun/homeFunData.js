import { CLASSES, SECTIONS, SUBJECTS } from '../../AssignedClass/assignedClassData'
import { SUBMISSIONS_LIST } from './homeFunSubmissionsData'

const STORAGE_KEY = 'teacher-home-fun-deliverables'

export const DEFAULT_ROUTE_BASE = '/teacher/student-deliverables/home-fun'

export const ASSESSMENT_TYPES = ['Assignment', 'Homework']

export const DELIVERABLE_TYPES = ASSESSMENT_TYPES

export const ASSIGNMENT_STATUSES = ['Active', 'In-Process', 'Completed']

export const statusBadgeColor = {
    Active: 'bg-[#4CAF5033] text-[#4CAF50]',
    'In-Process': 'bg-[#2196F333] text-[#2196F3]',
    Completed: 'bg-[#515DEF33] text-[#515DEF]',
}

export const typeBadgeColor = {
    Assignment: 'bg-[#515DEF33] text-[#515DEF]',
    Homework: 'bg-[#FF980033] text-[#FF9800]',
}

const parseListDate = (value) => {
    if (!value) return null
    const [day, month, year] = value.split('-').map(Number)
    if (!day || !month || !year) return null
    return new Date(year, month - 1, day)
}

export const getHomeFunItems = () => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY)
        if (stored) return JSON.parse(stored)
    } catch {
        /* ignore */
    }
    return []
}

export const saveHomeFunItems = (items) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
}

export const getRecordAssessmentType = (record) =>
    record.assessmentType ?? record.deliverableType ?? 'Assignment'

export const getHomeFunItemById = (id) =>
    getHomeFunItems().find((item) => item.id === id) ?? null

export const getHomeFunSubmissionRecord = (record) => {
    if (!record) return null

    const classSection = `${record.className}-${record.section}`
    const matched = SUBMISSIONS_LIST.find(
        (item) =>
            item.assignmentId === record.assignmentId
            || item.assignmentTitle === record.assignmentTitle,
    )

    const emptyDetails = { submitted: [], pending: [], late: [] }

    return {
        ...record,
        classSection,
        totalStudents: record.totalStudents ?? matched?.totalStudents ?? 0,
        submittedStudents: record.submittedStudents ?? matched?.submittedStudents ?? 0,
        pendingStudents: record.pendingStudents ?? matched?.pendingStudents ?? 0,
        lateSubmissions: record.lateSubmissions ?? matched?.lateSubmissions ?? 0,
        studentDetails: record.studentDetails ?? matched?.studentDetails ?? emptyDetails,
    }
}

export const formatTotalSubmissions = (record) => {
    const submission = getHomeFunSubmissionRecord(record)
    if (!submission) return '—'
    return `${submission.submittedStudents}/${submission.totalStudents}`
}

export const addHomeFunItem = (item) => {
    const list = getHomeFunItems()
    const nextId = list.length + 1
    const record = {
        id: `HF-${1000 + nextId}`,
        assignmentId: `HF-${1000 + nextId}`,
        status: 'Active',
        ...item,
    }
    const next = [...list, record]
    saveHomeFunItems(next)
    return record
}

export const filterHomeFunItems = (items, filters) => {
    const search = filters.search.trim().toLowerCase()
    const fromDate = filters.fromDate
    const toDate = filters.toDate

    return items.filter((record) => {
        if (filters.type) {
            if (getRecordAssessmentType(record) !== filters.type) return false
        }
        if (filters.subject && record.subject !== filters.subject) return false
        if (filters.className && record.className !== filters.className) return false
        if (filters.section && record.section !== filters.section) return false
        if (filters.status && record.status !== filters.status) return false

        if (search) {
            const haystack = `${record.assignmentId} ${record.assignmentTitle} ${record.assignmentDescription}`.toLowerCase()
            if (!haystack.includes(search)) return false
        }

        const assigned = parseListDate(record.assignedDate)
        if (fromDate && assigned) {
            const start = new Date(fromDate)
            start.setHours(0, 0, 0, 0)
            if (assigned < start) return false
        }
        if (toDate && assigned) {
            const end = new Date(toDate)
            end.setHours(23, 59, 59, 999)
            if (assigned > end) return false
        }

        return true
    })
}

export { CLASSES, SECTIONS, SUBJECTS }
