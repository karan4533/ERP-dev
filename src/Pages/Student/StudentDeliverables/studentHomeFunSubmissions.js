import { SUBMISSIONS_LIST } from '../../Teacher/StudentDeliverables/HomeFun/homeFunSubmissionsData'
import { CURRENT_STUDENT_ID } from './studentDeliverablesConfig'

const STORAGE_KEY = 'student-home-fun-submissions'

const parseDueDate = (value) => {
    if (!value) return null
    const [day, month, year] = value.split('-').map(Number)
    if (!day || !month || !year) return null
    return new Date(year, month - 1, day, 23, 59, 59, 999)
}

const formatSubmittedAt = () => {
    const now = new Date()
    return now.toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
    })
}

export const getStoredSubmissions = () => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY)
        if (stored) return JSON.parse(stored)
    } catch {
        /* ignore */
    }
    return []
}

const saveStoredSubmissions = (items) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
}

const findInMockData = (assignmentId, assignmentTitle, studentId) => {
    const matched = SUBMISSIONS_LIST.find(
        (item) => item.assignmentId === assignmentId || item.assignmentTitle === assignmentTitle,
    )
    if (!matched) return null

    const submitted = matched.studentDetails.submitted.find((entry) => entry.id === studentId)
    if (!submitted) return null

    return {
        studentId,
        assignmentId: matched.assignmentId,
        assignmentTitle: matched.assignmentTitle,
        submittedAt: submitted.submittedAt,
        isLate: submitted.isLate ?? false,
        fileName: submitted.submission?.fileName ?? '',
        fileSize: submitted.submission?.fileSize ?? '',
        additionalNote: submitted.submission?.additionalNote ?? '',
    }
}

export const getStudentSubmission = (
    assignmentId,
    assignmentTitle,
    studentId = CURRENT_STUDENT_ID,
) => {
    const stored = getStoredSubmissions().find(
        (entry) => entry.assignmentId === assignmentId && entry.studentId === studentId,
    )
    if (stored) return stored
    return findInMockData(assignmentId, assignmentTitle, studentId)
}

export const getStudentSubmissionStatus = (record, studentId = CURRENT_STUDENT_ID) => {
    const submission = getStudentSubmission(record.assignmentId, record.assignmentTitle, studentId)
    if (submission) return submission.isLate ? 'Late' : 'Submitted'
    return 'Pending'
}

export const saveStudentSubmission = (
    { assignmentId, assignmentTitle, fileName, fileSize, additionalNote, dueDate },
    studentId = CURRENT_STUDENT_ID,
) => {
    const due = parseDueDate(dueDate)
    const isLate = due ? new Date() > due : false

    const submission = {
        studentId,
        assignmentId,
        assignmentTitle,
        submittedAt: formatSubmittedAt(),
        isLate,
        fileName,
        fileSize,
        additionalNote,
    }

    const list = getStoredSubmissions().filter(
        (entry) => !(entry.assignmentId === assignmentId && entry.studentId === studentId),
    )
    list.push(submission)
    saveStoredSubmissions(list)
    return submission
}
