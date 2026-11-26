import { CLASSES, SECTIONS, SUBJECTS } from '../../AssignedClass/assignedClassData'
import { STUDENTS_LIST } from '../../StudentsList/studentsListData'

export const EXAM_NAMES = [
    'Continuous Assessment 1 (CA 1 / RCT 1)',
    'Continuous Assessment 2 (CA 2 / RCT 2)',
    'Monthly Periodic Test 1 (MPT 1)',
    'Monthly Periodic Test 2 (MPT 2)',
    'Monthly Periodic Test 3 (MPT 3)',
    'Monthly Periodic Test 4 (MPT 4)',
    'Monthly Periodic Test 5 (MPT 5)',
    'Monthly Periodic Test 6 (MPT 6)',
    'Split Test 1 (ST 1)',
    'Split Test 2 (ST 2)',
    'Split Test 3 (ST 3)',
    'Split Test 4 (ST 4)',
    'Mid Term Examination',
    'Revision Exam 1',
    'Revision Exam 2',
    'Pre-Board Examination 1',
    'Pre-Board Examination 2',
    'Annual / Final Board Examination',
]

export const GRADES = ['A+', 'A', 'B+', 'B', 'C', 'D', 'F', 'AB', 'ML']

export const computeGrade = (obtained, total) => {
    if (obtained === 'AB') return 'AB'
    if (obtained === 'ML') return 'ML'
    const obtainedNum = Number(obtained)
    const totalNum = Number(total)
    if (!totalNum || totalNum <= 0 || Number.isNaN(obtainedNum)) return ''
    const pct = (obtainedNum / totalNum) * 100
    if (pct >= 90) return 'A+'
    if (pct >= 80) return 'A'
    if (pct >= 70) return 'B+'
    if (pct >= 60) return 'B'
    if (pct >= 50) return 'C'
    if (pct >= 40) return 'D'
    return 'F'
}

const buildEntry = ({
    entryId,
    student,
    subject,
    examName,
    totalMarks,
    obtainedMarks,
    grade,
    remarks,
}) => ({
    id: entryId,
    entryId,
    rollNumber: student.rollNumber,
    subject,
    className: student.className,
    section: student.section,
    classSection: `${student.className} - ${student.section}`,
    examName,
    studentName: student.name,
    studentId: student.id,
    admissionNumber: student.admissionNumber,
    totalMarks,
    obtainedMarks,
    grade,
    remarks,
})

const STORAGE_KEY = 'coordinator_marks_entries'
const DEFAULT_MARKS_ENTRIES = []

export const saveMarksEntries = (records) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records))
}

export const getMarksEntries = () => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY)
        if (stored) return JSON.parse(stored)
    } catch {
        /* ignore */
    }
    saveMarksEntries(DEFAULT_MARKS_ENTRIES)
    return DEFAULT_MARKS_ENTRIES
}

export const getMarksEntryById = (id) =>
    getMarksEntries().find((item) => item.id === id || item.entryId === id) ?? null

export const addMarksEntry = (payload) => {
    const list = getMarksEntries()
    const nextId = `ME-${1000 + list.length + 1}`
    const student = STUDENTS_LIST.find((item) => item.rollNumber === payload.rollNumber)
    const entry = {
        id: nextId,
        entryId: nextId,
        rollNumber: payload.rollNumber,
        subject: payload.subject,
        className: payload.className,
        section: payload.section,
        classSection: `${payload.className} - ${payload.section}`,
        examName: payload.examName,
        studentName: payload.studentName,
        studentId: student?.id ?? '',
        admissionNumber: student?.admissionNumber ?? '',
        totalMarks: Number(payload.totalMarks),
        obtainedMarks: payload.obtainedMarks === 'AB' || payload.obtainedMarks === 'ML' ? payload.obtainedMarks : Number(payload.obtainedMarks),
        grade: payload.grade,
        remarks: payload.remarks,
    }
    const next = [entry, ...list]
    saveMarksEntries(next)
    return next
}

export { CLASSES, SECTIONS, SUBJECTS, STUDENTS_LIST }
