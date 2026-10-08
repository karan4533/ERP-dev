import { CLASSES, SECTIONS, SUBJECTS } from '../../AssignedClass/assignedClassData'
import { EXAM_NAMES } from '../EnterMarks/enterMarksData'

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
    classSection: `${className} - ${section}`,
    totalStudents,
    appearedStudents,
    passedStudents,
    failedStudents,
    highestMark,
    lowestMark,
    averageMark,
    passPercentage: formatPassPercentage(passedStudents, appearedStudents),
})

const DEFAULT_RESULT_SUMMARIES = []

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
    saveResultSummaries(DEFAULT_RESULT_SUMMARIES)
    return DEFAULT_RESULT_SUMMARIES
}

export { CLASSES, SECTIONS, SUBJECTS, EXAM_NAMES }
