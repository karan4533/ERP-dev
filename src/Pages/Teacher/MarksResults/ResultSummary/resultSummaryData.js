import { CLASSES, SECTIONS, SUBJECTS } from '../../AssignedClass/assignedClassData'
import { EXAM_NAMES } from '../EnterMarks/enterMarksData'
import { canUseExamsApi, listMarksBatchesApi, mapMarksBatchFromApi } from '../../../../services/examsApi'

const STORAGE_KEY = 'teacher-result-summary'

const formatPassPercentage = (passed, appeared) => {
    if (!appeared) return '0%'
    return `${((passed / appeared) * 100).toFixed(1)}%`
}

const buildSummary = ({
    id,
    examName,
    subject,
    className,
    section,
    totalStudents,
    appearedStudents,
    passedStudents,
    failedStudents,
    highestMark,
    lowestMark,
    averageMark,
}) => ({
    id,
    examName,
    subject,
    className,
    section,
    classSection: `${className}${section ? ` - ${section}` : ''}`,
    totalStudents,
    appearedStudents,
    passedStudents,
    failedStudents,
    highestMark,
    lowestMark,
    averageMark,
    passPercentage: formatPassPercentage(passedStudents, appearedStudents),
})

const summariseBatch = (batch) => {
    const entries = Array.isArray(batch.entries) ? batch.entries : []
    const scored = entries.filter((entry) => !entry.absent && entry.marks != null)
    const absent = entries.filter((entry) => entry.absent).length
    const maxMarks = Number(batch.maxMarks) || 100
    const passCut = maxMarks * 0.33
    const passed = scored.filter((entry) => Number(entry.marks) >= passCut).length
    const failed = scored.length - passed
    const marks = scored.map((entry) => Number(entry.marks))
    const averageMark = marks.length
        ? Number((marks.reduce((sum, value) => sum + value, 0) / marks.length).toFixed(1))
        : 0
    return buildSummary({
        id: String(batch.id),
        examName: batch.examName || 'Exam',
        subject: batch.subject || '—',
        className: batch.className || '—',
        section: batch.section || '',
        totalStudents: entries.length,
        appearedStudents: scored.length,
        passedStudents: passed,
        failedStudents: failed + absent,
        highestMark: marks.length ? Math.max(...marks) : 0,
        lowestMark: marks.length ? Math.min(...marks) : 0,
        averageMark,
    })
}

export const saveResultSummaries = (records) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records))
}

export const getResultSummaries = () => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY)
        if (stored) return JSON.parse(stored)
    } catch {
        /* ignore */
    }
    return []
}

/** Prefer campus marks batches (submitted/published); fall back to local cache. */
export async function hydrateResultSummariesFromApi() {
    if (!canUseExamsApi()) return getResultSummaries()
    const rows = await listMarksBatchesApi({})
    const batches = (Array.isArray(rows) ? rows : [])
        .map(mapMarksBatchFromApi)
        .filter((batch) => {
            const status = String(batch.status || '').toLowerCase()
            return status === 'submitted' || status === 'published' || status === 'approved'
        })
    const summaries = batches.map(summariseBatch)
    saveResultSummaries(summaries)
    return summaries
}

export { CLASSES, SECTIONS, SUBJECTS, EXAM_NAMES }
