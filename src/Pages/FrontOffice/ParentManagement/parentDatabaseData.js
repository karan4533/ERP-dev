import mo_user from '../../../assets/images/no-profile.png'
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

/**
 * Map GET /api/v1/parents staff row → Front Office Parents List row.
 * Intended presentation: one row per enrolled student (guardian contact from that
 * student's admission). Sibling students with the same parent appear as separate rows.
 * Do not invent parent aggregation APIs.
 */
export const mapStaffParentApiRowToListRow = (row, profileFallback = mo_user) => {
    const studentId = String(row?.studentId || row?.id || '')
    const parentUserId = row?.parentUserId ? String(row.parentUserId) : ''
    return {
        id: studentId,
        parentId: parentUserId || displayValue(row?.parentEmail, '—'),
        profileImage: profileFallback,
        parentName: displayValue(row?.parentName, 'Parent'),
        gender: '—',
        email: displayValue(row?.parentEmail),
        mobileNumber: displayValue(row?.mobileNumber),
        studentName: displayValue(row?.studentName),
        admissionNumber: displayValue(row?.admissionNumber),
        relation: '—',
        className: displayValue(row?.className, ''),
        section: displayValue(row?.section, ''),
        studentIds: studentId ? [studentId] : [],
        studentCount: studentId ? 1 : 0,
        studentId,
        parentUserId: parentUserId || null,
        status: 'Active',
    }
}

/** Map GET /students/{id} detail → Front Office View Parent model. */
export const mapStudentDetailToParentDetail = (row, profileFallback = mo_user) => {
    if (!row) return null
    const snap = row.admissionSnapshot || {}
    const father = String(snap.fatherName || '').trim()
    const mother = String(snap.motherName || '').trim()
    const parentName = father || mother || 'Parent'
    const studentId = String(row.id || '')
    return {
        id: studentId,
        parentId: row.parentUserId ? String(row.parentUserId) : displayValue(snap.parentEmail),
        profileImage: profileFallback,
        parentName,
        gender: displayValue(snap.gender),
        relation: father ? 'Father' : mother ? 'Mother' : '—',
        occupation: displayValue(snap.fatherOccupation || snap.motherOccupation),
        yearlyIncome: displayValue(snap.fatherIncome || snap.motherIncome || snap.yearlyIncome),
        address: {
            address: displayValue(snap.parentAddress || snap.address),
            country: displayValue(snap.parentCountry || snap.country),
            state: displayValue(snap.parentState || snap.state),
            city: displayValue(snap.parentCity || snap.city),
            zipCode: displayValue(snap.parentZipCode || snap.zipCode),
        },
        contact: {
            mobileNumber: displayValue(snap.parentMobileNumber || row.mobileNumber),
            alternativeNumber: displayValue(snap.parentAltMobileNumber || snap.altMobileNumber),
            email: displayValue(snap.parentEmail || row.email),
        },
        student: {
            name: displayValue(row.name),
            admissionNumber: displayValue(row.admissionNumber),
            class: displayValue(row.className),
            section: displayValue(row.section),
        },
        studentIds: studentId ? [studentId] : [],
        linkedStudents: [],
        status: displayValue(row.status, 'Active'),
        email: displayValue(snap.parentEmail || row.email),
        phone: displayValue(snap.parentMobileNumber || row.mobileNumber),
        name: parentName,
    }
}

export const mapParentAccountToListRow = (account) => {
    const linkedStudents = resolveLinkedStudents(account?.studentIds)
    const firstStudent = linkedStudents[0]
    const studentCount = Array.isArray(account?.studentIds) ? account.studentIds.length : 0
    const admissionSnapshot = firstStudent?.admissionSnapshot || {}

    return {
        id: account.id,
        parentId: account.id,
        profileImage: account.profileImage || mo_user,
        parentName: displayValue(account.name, 'Parent'),
        gender: displayValue(admissionSnapshot.gender || account.gender),
        email: displayValue(account.email),
        mobileNumber: displayValue(account.phone),
        studentName: firstStudent
            ? displayValue(firstStudent.name)
            : (studentCount > 0 ? `${studentCount} linked student${studentCount === 1 ? '' : 's'}` : '—'),
        admissionNumber: displayValue(firstStudent?.admissionNumber),
        relation: displayValue(admissionSnapshot.parentRelation || account.relation),
        studentIds: Array.isArray(account.studentIds) ? [...account.studentIds] : [],
        studentCount,
        status: displayValue(account.status, 'Active'),
    }
}

/** Offline / API-off fallback only. */
export const getParentsList = () => getAllParentAccounts().map(mapParentAccountToListRow)

/** @deprecated Prefer getParentsList() — kept for callers expecting a static export shape. */
export const PARENTS_LIST = []

export const getParentById = (id) => {
    const account = getParentAccountById(id)
    if (!account) return null
    return mapParentAccountToListRow(account)
}

export const getParentDetailById = (id) => {
    const account = getParentAccountById(id)
    if (!account) return null

    const linkedStudents = resolveLinkedStudents(account.studentIds)
    const firstStudent = linkedStudents[0]
    const admissionSnapshot = firstStudent?.admissionSnapshot || {}

    return {
        id: account.id,
        parentId: account.id,
        profileImage: account.profileImage || null,
        parentName: displayValue(account.name, 'Parent'),
        gender: displayValue(admissionSnapshot.gender || account.gender),
        relation: displayValue(admissionSnapshot.parentRelation || account.relation),
        occupation: displayValue(admissionSnapshot.fatherOccupation || admissionSnapshot.motherOccupation || account.occupation),
        yearlyIncome: displayValue(admissionSnapshot.yearlyIncome || account.yearlyIncome),
        address: {
            address: displayValue(admissionSnapshot.address || account.address),
            country: displayValue(admissionSnapshot.country || account.country),
            state: displayValue(admissionSnapshot.state || account.state),
            city: displayValue(admissionSnapshot.city || account.city),
            zipCode: displayValue(admissionSnapshot.zipCode || account.zipCode),
        },
        contact: {
            mobileNumber: displayValue(account.phone),
            alternativeNumber: displayValue(admissionSnapshot.alternativeNumber || account.alternativeNumber),
            email: displayValue(account.email),
        },
        student: firstStudent
            ? {
                name: displayValue(firstStudent.name),
                admissionNumber: displayValue(firstStudent.admissionNumber),
                class: displayValue(firstStudent.className),
                section: displayValue(firstStudent.section || admissionSnapshot.section),
            }
            : {
                name: Array.isArray(account.studentIds) && account.studentIds.length > 0
                    ? `${account.studentIds.length} linked student${account.studentIds.length === 1 ? '' : 's'}`
                    : '—',
                admissionNumber: '—',
                class: '—',
                section: '—',
            },
        studentIds: Array.isArray(account.studentIds) ? [...account.studentIds] : [],
        linkedStudents,
        status: displayValue(account.status, 'Active'),
        email: displayValue(account.email),
        phone: displayValue(account.phone),
        name: displayValue(account.name, 'Parent'),
    }
}
