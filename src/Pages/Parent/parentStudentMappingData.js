import { getEnrolledStudentById } from '../../Common/StudentDatabase/enrolledStudentsData'
import { getMappedStudentIds as getParentMappedStudentIds } from '../../Common/ParentAccounts/parentAccountsData'
import { STUDENTS_LIST } from '../Teacher/StudentsList/studentsListData'
import { PARENT_CHILD_PROFILES } from './parentStudentProfiles'

export const toParentPortalStudentProfile = (enrolledRecord) => {
    if (!enrolledRecord) return null

    const rollNumber = enrolledRecord.rollNumber || ''
    const sectionMatch = rollNumber.match(/-([A-Za-z]+)-/)
    const section = sectionMatch?.[1] || '—'
    const className = enrolledRecord.className || '—'

    return {
        id: enrolledRecord.id,
        name: enrolledRecord.name,
        className,
        section,
        classSection: `${className}-${section}`,
        rollNumber,
        admissionNumber: enrolledRecord.admissionNumber || enrolledRecord.id,
    }
}

export const getMappedStudentIds = (parentId) => getParentMappedStudentIds(parentId)

export const isStudentMappedToParent = (parentId, studentId) =>
    getMappedStudentIds(parentId).includes(studentId)

export const getStudentProfileById = (studentId) => {
    if (PARENT_CHILD_PROFILES[studentId]) {
        return PARENT_CHILD_PROFILES[studentId]
    }

    const enrolled = getEnrolledStudentById(studentId)
    if (enrolled) {
        return toParentPortalStudentProfile(enrolled)
    }

    const fromTeacherList = STUDENTS_LIST.find((student) => student.id === studentId)
    if (!fromTeacherList) return null

    return {
        id: fromTeacherList.id,
        name: fromTeacherList.name,
        className: fromTeacherList.className,
        section: fromTeacherList.section,
        classSection: fromTeacherList.classSection,
        rollNumber: fromTeacherList.rollNumber,
        admissionNumber: fromTeacherList.admissionNumber,
    }
}

export const getMappedStudentsForParent = (parentId) =>
    getMappedStudentIds(parentId)
        .map((studentId) => getStudentProfileById(studentId))
        .filter(Boolean)
