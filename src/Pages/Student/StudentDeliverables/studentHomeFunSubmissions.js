import { CURRENT_STUDENT_ID } from './studentDeliverablesConfig'

const STORAGE_KEY = 'student-home-fun-submissions'
export const HOME_FUN_SUBMISSIONS_UPDATED_EVENT = 'schoolerp-home-fun-submissions-updated'

const emitSubmissionsUpdated = () => {
    try {
        window.dispatchEvent(new CustomEvent(HOME_FUN_SUBMISSIONS_UPDATED_EVENT))
    } catch {
        /* ignore */
    }
}

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
    emitSubmissionsUpdated()
}

export const getStudentSubmission = (
    assignmentId,
    assignmentTitle,
    studentId = CURRENT_STUDENT_ID,
) => {
    return getStoredSubmissions().find(
        (entry) => entry.assignmentId === assignmentId && entry.studentId === studentId,
    ) || null
}

export const getStudentSubmissionStatus = (record, studentId = CURRENT_STUDENT_ID) => {
    const submission = getStudentSubmission(record.assignmentId, record.assignmentTitle, studentId)
    if (submission) return submission.isLate ? 'Late' : 'Submitted'
    return 'Pending'
}

export const saveStudentSubmission = (
    {
        assignmentId,
        assignmentTitle,
        fileName,
        fileSize,
        additionalNote,
        dueDate,
        studentName = '',
    },
    studentId = CURRENT_STUDENT_ID,
) => {
    const due = parseDueDate(dueDate)
    const isLate = due ? new Date() > due : false

    const submission = {
        studentId: String(studentId || ''),
        studentName: String(studentName || '').trim(),
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
