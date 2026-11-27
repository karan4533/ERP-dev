import { CLASSES, SECTIONS, SUBJECTS } from '../../AssignedClass/assignedClassData'
import {
    createAcademicsCollectionStore,
    nextPrefixedId,
} from '../../../../services/academicsCollectionStore'
import {
    canUseAcademicFileUploads,
    primaryAttachmentMeta,
    uploadAcademicAttachments,
} from '../../../../services/academicAttachments'
import { getStudentsList } from '../../../../Common/StudentDatabase/studentDatabaseData'
import {
    classKeysMatch,
    normalizeSectionKey,
} from '../../../../Common/Teacher/teacherAssignedClasses'
import { getStoredSubmissions } from '../../../Student/StudentDeliverables/studentHomeFunSubmissions'
import noProfile from '../../../../assets/images/no-profile.png'

export { CLASSES, SECTIONS, SUBJECTS }

export const DEFAULT_ROUTE_BASE = '/teacher/student-deliverables/home-fun'
export const HOME_FUN_UPDATED_EVENT = 'schoolerp-home-fun-updated'

export const ASSESSMENT_TYPES = ['Assignment', 'Homework']
export const DELIVERABLE_TYPES = ASSESSMENT_TYPES
export const ASSIGNMENT_STATUSES = ['Active', 'In-Process', 'Completed']

export const statusBadgeColor = {
    Active: 'bg-[#4CAF5033] text-[#4CAF50]',
    'In-Process': 'bg-[#2196F333] text-[#2196F3]',
    Completed: 'bg-[#515DEF33] text-[#515DEF]',
}

export const typeBadgeColor = {
    Assignment: 'bg-[#515DEF33] text-[#515DEF]',
    Homework: 'bg-[#FF980033] text-[#FF9800]',
}

const parseListDate = (value) => {
    if (!value) return null
    const [day, month, year] = String(value).split('-').map(Number)
    if (!day || !month || !year) return null
    return new Date(year, month - 1, day)
}

const normalizeRecord = (raw) => {
    const id = String(raw?.id || raw?.assignmentId || '').trim()
    return {
        id,
        assignmentId: String(raw?.assignmentId || id).trim() || id,
        assignmentTitle: String(raw?.assignmentTitle || raw?.title || '').trim(),
        assignmentDescription: String(raw?.assignmentDescription || raw?.description || '').trim(),
        assessmentType: String(raw?.assessmentType || raw?.deliverableType || 'Assignment').trim() || 'Assignment',
        deliverableType: String(raw?.deliverableType || raw?.assessmentType || 'Assignment').trim() || 'Assignment',
        subject: String(raw?.subject || '').trim(),
        className: String(raw?.className || '').trim(),
        section: String(raw?.section || '').trim(),
        status: String(raw?.status || 'Active').trim() || 'Active',
        assignedDate: String(raw?.assignedDate || '').trim(),
        dueDate: String(raw?.dueDate || '').trim(),
        totalMarks: raw?.totalMarks != null && raw?.totalMarks !== '' ? String(raw.totalMarks) : '',
        attachment: String(raw?.attachment || raw?.fileName || '').trim() || '—',
        fileId: raw?.fileId || null,
        totalStudents: Number(raw?.totalStudents) || 0,
        submittedStudents: Number(raw?.submittedStudents) || 0,
        pendingStudents: Number(raw?.pendingStudents) || 0,
        lateSubmissions: Number(raw?.lateSubmissions) || 0,
        studentDetails: raw?.studentDetails || { submitted: [], pending: [], late: [] },
        createdBy: String(raw?.createdBy || '').trim(),
        createdAt: String(raw?.createdAt || '').trim(),
    }
}

const store = createAcademicsCollectionStore({
    collection: 'home-fun',
    storageKey: 'teacher-home-fun-deliverables',
    eventName: HOME_FUN_UPDATED_EVENT,
    normalize: normalizeRecord,
    offlineFallback: () => [],
})

export const hydrateHomeFunFromApi = store.hydrate
export const clearHomeFunMemory = store.clearMemory

export const getHomeFunItems = () => store.getAll()

export const saveHomeFunItems = (items) => store.saveAll(items)

export const getRecordAssessmentType = (record) =>
    record.assessmentType ?? record.deliverableType ?? 'Assignment'

export const getHomeFunItemById = (id) => {
    const key = decodeURIComponent(String(id || '').trim())
    if (!key) return null
    const keyLower = key.toLowerCase()
    return (
        getHomeFunItems().find((item) => {
            const itemId = String(item.id || '').trim()
            const assignmentId = String(item.assignmentId || '').trim()
            return (
                itemId === key
                || assignmentId === key
                || itemId.toLowerCase() === keyLower
                || assignmentId.toLowerCase() === keyLower
            )
        }) ?? null
    )
}

const toSubmissionStudent = (student, extra = {}) => ({
    id: String(student.id),
    name: student.name || 'Student',
    rollNumber: student.rollNumber || '—',
    admissionNumber: student.admissionNumber || '—',
    profile: student.profile || student.profileImage || noProfile,
    email: student.email && student.email !== '—' ? student.email : '',
    ...extra,
})

/** Students placed in the assignment's class + section. */
export const getHomeFunClassRoster = (record, students = null) => {
    if (!record) return []
    const roster = Array.isArray(students) ? students : getStudentsList()
    const targetClass = record.className
    const targetSection = normalizeSectionKey(record.section)
    return roster.filter((student) => {
        const className = student.className || student.class || ''
        if (!classKeysMatch(className, targetClass)) return false
        if (!targetSection) return true
        const section = normalizeSectionKey(
            student.section && student.section !== '—' ? student.section : '',
        )
        return section === targetSection
    })
}

/**
 * Live submission stats from class roster + student portal uploads (localStorage).
 * Stored totalStudents/submittedStudents on the assignment row are ignored when a roster exists.
 */
export const getHomeFunSubmissionRecord = (record, students = null) => {
    if (!record) return null
    const classSection = `${record.className || ''}-${record.section || ''}`
    try {
        const roster = getHomeFunClassRoster(record, students)
        const submissions = getStoredSubmissions().filter(
            (entry) => String(entry.assignmentId) === String(record.assignmentId || record.id),
        )
        const byStudentId = new Map(
            submissions.map((entry) => [String(entry.studentId), entry]),
        )

        const submitted = []
        const late = []
        const pending = []

        roster.forEach((student) => {
            const submission = byStudentId.get(String(student.id))
            if (!submission) {
                pending.push(toSubmissionStudent(student))
                return
            }
            const detail = toSubmissionStudent(student, {
                submittedAt: submission.submittedAt,
                isLate: Boolean(submission.isLate),
                submission: {
                    fileName: submission.fileName || '—',
                    fileSize: submission.fileSize || '',
                    additionalNote: submission.additionalNote || '',
                },
            })
            if (submission.isLate) late.push(detail)
            else submitted.push(detail)
        })

        // Include uploads whose studentId is not on the current roster (still visible to staff).
        const rosterIds = new Set(roster.map((row) => String(row.id)))
        submissions.forEach((submission) => {
            if (rosterIds.has(String(submission.studentId))) return
            const orphan = toSubmissionStudent(
                {
                    id: submission.studentId,
                    name: submission.studentName || `Student ${submission.studentId}`,
                    rollNumber: '—',
                    admissionNumber: '—',
                    email: '',
                },
                {
                    submittedAt: submission.submittedAt,
                    isLate: Boolean(submission.isLate),
                    submission: {
                        fileName: submission.fileName || '—',
                        fileSize: submission.fileSize || '',
                        additionalNote: submission.additionalNote || '',
                    },
                },
            )
            if (submission.isLate) late.push(orphan)
            else submitted.push(orphan)
        })

        return {
            ...record,
            classSection,
            totalStudents: roster.length,
            submittedStudents: submitted.length,
            pendingStudents: pending.length,
            lateSubmissions: late.length,
            studentDetails: { submitted, pending, late },
        }
    } catch {
        return {
            ...record,
            classSection,
            totalStudents: 0,
            submittedStudents: 0,
            pendingStudents: 0,
            lateSubmissions: 0,
            studentDetails: { submitted: [], pending: [], late: [] },
        }
    }
}

export const formatTotalSubmissions = (record) => {
    const submission = getHomeFunSubmissionRecord(record)
    if (!submission) return '—'
    return `${submission.submittedStudents}/${submission.totalStudents}`
}

export const addHomeFunItem = async (item, meta = {}) => {
    await store.ensureHydrated()
    const list = getHomeFunItems()
    const id = nextPrefixedId(list, 'HF', 1001)
    const pendingFiles = Array.isArray(item?.pendingFiles) ? item.pendingFiles : []
    const { pendingFiles: _ignored, ...values } = item || {}
    const record = normalizeRecord({
        status: 'Active',
        ...values,
        id,
        assignmentId: id,
        createdBy: meta.createdBy || '',
        createdAt: new Date().toISOString(),
    })
    await saveHomeFunItems([record, ...list])
    if (canUseAcademicFileUploads() && pendingFiles.length) {
        const { assets, failures } = await uploadAcademicAttachments('home-fun', record.id, pendingFiles)
        if (failures.length) {
            const detail = failures.map((row) => `${row.fileName}: ${row.message}`).join('; ')
            throw new Error(`Home Fun was saved, but the attachment did not upload. ${detail}`)
        }
        const metaFields = primaryAttachmentMeta(assets)
        if (metaFields.fileId) {
            const updated = normalizeRecord({
                ...record,
                attachment: metaFields.fileName,
                fileId: metaFields.fileId,
            })
            const current = getHomeFunItems().filter((row) => row.id !== record.id)
            await saveHomeFunItems([updated, ...current])
            return updated
        }
    }
    return record
}

export const filterHomeFunItems = (items, filters) => {
    const search = filters.search.trim().toLowerCase()
    const fromDate = filters.fromDate
    const toDate = filters.toDate

    return items.filter((record) => {
        if (filters.type) {
            if (getRecordAssessmentType(record) !== filters.type) return false
        }
        if (filters.subject && record.subject !== filters.subject) return false
        if (filters.className && record.className !== filters.className) return false
        if (filters.section && record.section !== filters.section) return false
        if (filters.status && record.status !== filters.status) return false

        if (search) {
            const haystack = `${record.assignmentId} ${record.assignmentTitle} ${record.assignmentDescription}`.toLowerCase()
            if (!haystack.includes(search)) return false
        }

        const assigned = parseListDate(record.assignedDate)
        if (fromDate && assigned) {
            const start = new Date(fromDate)
            start.setHours(0, 0, 0, 0)
            if (assigned < start) return false
        }
        if (toDate && assigned) {
            const end = new Date(toDate)
            end.setHours(23, 59, 59, 999)
            if (assigned > end) return false
        }

        return true
    })
}
