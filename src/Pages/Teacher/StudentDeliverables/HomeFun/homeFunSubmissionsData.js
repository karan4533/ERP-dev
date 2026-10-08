import { CLASSES, SECTIONS } from '../../AssignedClass/assignedClassData'
import { STUDENTS_LIST } from '../../StudentsList/studentsListData'

const student = (id, extra = {}) => {
    const s = STUDENTS_LIST.find((item) => item.id === id)
    if (!s) return null
    return {
        id: s.id,
        name: s.name,
        rollNumber: s.rollNumber,
        admissionNumber: s.admissionNumber,
        profile: s.profile,
        email: s.email,
        ...extra,
    }
}

const buildSubmissionFile = (studentName, assignmentTitle) => {
    const firstName = studentName.split(' ')[0].toLowerCase()
    const slug = assignmentTitle
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 36)
    return `${firstName}-${slug}.pdf`
}

const submittedStudent = (assignmentTitle, id, { submittedAt, isLate = false, note } = {}) => {
    const entry = student(id, { submittedAt, isLate })
    if (!entry) return null
    return {
        ...entry,
        submission: {
            fileName: buildSubmissionFile(entry.name, assignmentTitle),
            fileSize: `${720 + (entry.rollNumber?.length ?? 0) * 48} KB`,
            additionalNote: note ?? 'Submitted as per the assignment guidelines.',
        },
    }
}

export const SUBMISSION_STATUS_CONFIG = {
    submitted: {
        title: 'Submitted Students',
        accent: '#4CAF50',
        badgeClass: 'bg-[#4CAF5033] text-[#4CAF50]',
        emptyText: 'No students have submitted this assignment yet.',
    },
    pending: {
        title: 'Pending Students',
        accent: '#FF9800',
        badgeClass: 'bg-[#FF980033] text-[#FF9800]',
        emptyText: 'All students have submitted this assignment.',
    },
    late: {
        title: 'Late Submissions',
        accent: '#F44336',
        badgeClass: 'bg-[#F4433633] text-[#F44336]',
        emptyText: 'No late submissions for this assignment.',
    },
}

export const SUBMISSIONS_LIST = []

export { CLASSES, SECTIONS }
