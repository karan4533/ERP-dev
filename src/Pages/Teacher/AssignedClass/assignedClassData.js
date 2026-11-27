import {
    getAssignments,
    getAssignmentsForTeacher,
    getClasses as getCatalogClasses,
    getSections as getCatalogSections,
    getSubjects as getCatalogSubjects,
} from '../../../Common/RBAC/academicsCatalogData'
import { getStudentCountForClassSection } from '../../../Common/RBAC/createdUsersData'
import { liveArray } from '../../../Common/RBAC/liveArray'
import { getTeacherAssignmentRows } from '../../../Common/Teacher/teacherAssignedClasses'

export { liveArray }

export const getClasses = () => getCatalogClasses()
export const getSections = () => getCatalogSections()
export const getSubjects = () => getCatalogSubjects()

export const CLASSES = liveArray(getCatalogClasses)
export const SECTIONS = liveArray(getCatalogSections)
export const SUBJECTS = liveArray(getCatalogSubjects)

export const getAssignedClasses = (teacherEmail) => {
    const fromPortal = getTeacherAssignmentRows(teacherEmail)
    if (fromPortal.length) {
        return fromPortal.map((item) => ({
            id: `${item.className}-${item.section}-${item.subject}`,
            className: item.className,
            section: item.section || '—',
            subject: item.subject || '—',
            classTeacher: item.isClassTeacher ? 'Yes' : 'No',
            totalStudents: getStudentCountForClassSection(item.className, item.section),
        }))
    }

    const assignments = teacherEmail
        ? getAssignmentsForTeacher(teacherEmail)
        : getAssignments()

    return assignments.map((item) => ({
        ...item,
        totalStudents: getStudentCountForClassSection(item.className, item.section),
    }))
}

export const ASSIGNED_CLASSES = liveArray(() => getAssignedClasses())

export const classTeacherBadgeColor = {
    Yes: 'bg-[#4CAF5033] text-[#4CAF50]',
    No: 'bg-[#66708533] text-[#667085]',
}
