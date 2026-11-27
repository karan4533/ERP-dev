import noProfile from '../../../assets/images/no-profile.png'
import {
    getAllParentAccounts,
    getParentById as getParentAccountById,
} from '../../../Common/ParentAccounts/parentAccountsData'
import { getEnrolledStudentById } from '../../../Common/StudentDatabase/enrolledStudentsData'

const displayValue = (value, fallback = '—') => {
    const text = String(value ?? '').trim()
    return text || fallback
}

const resolveLinkedStudents = (studentIds = []) =>
    (Array.isArray(studentIds) ? studentIds : [])
        .map((studentId) => getEnrolledStudentById(studentId))
        .filter(Boolean)

export const mapParentAccountToListRow = (account) => {
    const linkedStudents = resolveLinkedStudents(account?.studentIds)
    const firstStudent = linkedStudents[0]
    const studentCount = Array.isArray(account?.studentIds) ? account.studentIds.length : 0

    return {
        id: account.id,
        parentId: account.id,
        parentProfile: account.profileImage || noProfile,
        parentName: displayValue(account.name, 'Parent'),
        parentEmail: displayValue(account.email),
        email: displayValue(account.email),
        mobileNumber: displayValue(account.phone),
        phone: displayValue(account.phone),
        studentName: firstStudent
            ? displayValue(firstStudent.name)
            : (studentCount > 0 ? `${studentCount} linked student${studentCount === 1 ? '' : 's'}` : '—'),
        admissionNumber: displayValue(firstStudent?.admissionNumber),
        className: displayValue(firstStudent?.className, ''),
        section: displayValue(firstStudent?.section || firstStudent?.admissionSnapshot?.section, ''),
        studentIds: Array.isArray(account.studentIds) ? [...account.studentIds] : [],
        studentCount,
        studentId: firstStudent?.id || '',
    }
}

export const getParentsList = () => getAllParentAccounts().map(mapParentAccountToListRow)

/** @deprecated Prefer getParentsList() — demo list removed. */
export const PARENTS_LIST = []

export const getParentById = (id) => {
    const account = getParentAccountById(id)
    if (!account) return null
    return mapParentAccountToListRow(account)
}
