/** Exam schedule rows for the student / parent portal (no React, so it can be tested in Node). */

/** "Grade 7", "7", "Class 7-A" and "VII" style labels compare by their grade. */
const ROMAN = { i: 1, ii: 2, iii: 3, iv: 4, v: 5, vi: 6, vii: 7, viii: 8, ix: 9, x: 10, xi: 11, xii: 12 }

export const classKeyOf = (value) => {
    const text = String(value || '').trim().toLowerCase().replace(/^(grade|class)\s+/, '')
    const head = text.split(/[\s-]/)[0]
    if (/^\d{1,2}$/.test(head)) return String(Number(head))
    if (ROMAN[head]) return String(ROMAN[head])
    return head
}

const parseDate = (value) => {
    const text = String(value || '')
    let match = text.match(/^(\d{4})-(\d{2})-(\d{2})/)
    if (match) return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
    match = text.match(/^(\d{2})[-/](\d{2})[-/](\d{4})$/)
    if (match) return new Date(Number(match[3]), Number(match[2]) - 1, Number(match[1]))
    return null
}

export const inDateRange = (value, from, to) => {
    if (!from && !to) return true
    const date = parseDate(value)
    if (!date) return false
    const start = from ? new Date(from.getFullYear(), from.getMonth(), from.getDate()) : null
    const end = to ? new Date(to.getFullYear(), to.getMonth(), to.getDate()) : null
    return (!start || date >= start) && (!end || date <= end)
}

/** Approved server exams for the active child's class, earliest first. */
export const examRowsForStudent = (exams, studentClass) => {
    const key = classKeyOf(studentClass)
    return (Array.isArray(exams) ? exams : [])
        .filter((exam) => String(exam.status || '').toLowerCase() === 'approved')
        .filter((exam) => !key || classKeyOf(exam.className) === key)
        .map((exam) => ({
            id: exam.id,
            examId: exam.id,
            examName: exam.name,
            examType: exam.examType,
            examTypeName: exam.examTypeName || '',
            className: exam.className,
            academicYear: exam.academicYear || '',
            startDate: exam.startDate,
            endDate: exam.endDate,
            timetable: [],
        }))
        .sort((a, b) => String(a.startDate).localeCompare(String(b.startDate)))
}
