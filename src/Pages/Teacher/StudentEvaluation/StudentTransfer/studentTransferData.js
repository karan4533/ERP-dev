import { CLASSES, SECTIONS } from '../../AssignedClass/assignedClassData'
import { STUDENTS_LIST } from '../../StudentsList/studentsListData'

export const TRANSFER_STATUSES = ['Pending', 'Approved', 'Rejected']
export const TRANSFER_TYPES = ['Internal', 'External']

export const statusBadgeColor = {
    Pending: 'bg-[#FF980033] text-[#FF9800]',
    Approved: 'bg-[#4CAF5033] text-[#4CAF50]',
    Rejected: 'bg-[#FF000033] text-[#FF0000]',
}

const STORAGE_KEY = 'teacher-student-transfers'

const buildTransfer = ({
    transferRequestId,
    student,
    transferType,
    transferTo,
    requestDate,
    reason,
    status,
}) => ({
    id: transferRequestId,
    transferRequestId,
    admissionNumber: student.admissionNumber,
    studentName: student.name,
    studentId: student.id,
    className: student.className,
    section: student.section,
    classSection: student.classSection,
    transferType,
    transferTo,
    requestDate,
    reason,
    status,
})

const DEFAULT_STUDENT_TRANSFERS = []

export const saveStudentTransfers = (records) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records))
}

export const getStudentTransfers = () => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY)
        if (stored) return JSON.parse(stored)
    } catch {
        /* ignore */
    }
    saveStudentTransfers(DEFAULT_STUDENT_TRANSFERS)
    return DEFAULT_STUDENT_TRANSFERS
}

export const getStudentTransferById = (id) =>
    getStudentTransfers().find((item) => item.id === id || item.transferRequestId === id) ?? null

export const updateTransferStatus = (id, status) => {
    const list = getStudentTransfers()
    const next = list.map((item) =>
        item.id === id || item.transferRequestId === id ? { ...item, status } : item,
    )
    saveStudentTransfers(next)
    return next
}

export { CLASSES, SECTIONS }
