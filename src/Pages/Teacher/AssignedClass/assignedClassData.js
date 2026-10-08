import {
    getAssignments,
    getAssignmentsForTeacher,
    getClasses as getCatalogClasses,
    getSections as getCatalogSections,
    getSubjects as getCatalogSubjects,
} from '../../../Common/RBAC/academicsCatalogData'
import { getStudentCountForClassSection } from '../../../Common/RBAC/createdUsersData'
import { liveArray } from '../../../Common/RBAC/liveArray'

export { liveArray }

export const getClasses = () => getCatalogClasses()
export const getSections = () => getCatalogSections()
export const getSubjects = () => getCatalogSubjects()

export const CLASSES = liveArray(getCatalogClasses)
export const SECTIONS = liveArray(getCatalogSections)
export const SUBJECTS = liveArray(getCatalogSubjects)

export const getAssignedClasses = (teacherEmail) => {
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
