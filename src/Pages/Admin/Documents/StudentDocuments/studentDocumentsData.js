import { getAllEnrolledStudents } from '../../../../Common/StudentDatabase/enrolledStudentsData'
import { getAdmissionById } from '../../FrontOffice/AdminssionList/admissionListData'
import { getAllCreatedUsers } from '../../../../Common/RBAC/createdUsersData'
import {
    canUseDocumentsApi,
    deleteDocumentItemApi,
    dmyToIso,
    isoToDmy,
    listDocumentRecordsApi,
    patchDocumentRecordApi,
    putDocumentItemApi,
} from '../../../../services/documentsApi'

const STORAGE_KEY = 'schoolErpAdminStudentDocuments'

export const STUDENT_DOCUMENTS_STORAGE_KEY = STORAGE_KEY

export const STUDENT_DOCUMENT_TYPES = [
    { id: 'doc-aadhaar', label: 'Aadhaar/ID Proof' },
    { id: 'doc-birth', label: 'Birth Certificate' },
    { id: 'doc-tc', label: 'TC' },
    { id: 'doc-marksheet', label: 'Mark Sheet' },
]

export const DOCUMENT_STATUS_OPTIONS = ['Pending', 'Submitted']
export const RECORD_STATUS_OPTIONS = ['In Progress', 'Completed']

export const documentStatusColor = {
    Pending: 'text-[#FF9800]',
    Submitted: 'text-[#008000]',
    Approved: 'text-[#008000]',
}

export const recordStatusBadgeColor = {
    'In Progress': 'bg-[#FF000033] text-[#FF0000]',
    Completed: 'bg-[#4CAF5033] text-[#4CAF50]',
}

const readJson = (key, fallback) => {
    try {
        const raw = localStorage.getItem(key)
        if (!raw) return fallback
        return JSON.parse(raw)
    } catch {
        return fallback
    }
}

const writeJson = (key, value) => {
    localStorage.setItem(key, JSON.stringify(value))
}

// With a real backend session the documents (and their files) live on the server. What it returned is
// held in memory only, never written to the browser's storage.
let apiRecords = []

const typeIdForKey = (key) => `doc-${key}`
const keyForTypeId = (typeId) => String(typeId).replace(/^doc-/, '')

const mapApiRecord = (row) => ({
    id: row.subject_id,
    studentId: row.subject_id,
    admissionNumber: row.subject_ref,
    studentName: row.name,
    className: row.class_name || '',
    section: '',
    submittedDate: isoToDmy(row.submitted_date),
    status: row.status,
    documents: Object.fromEntries(
        row.items.map((item) => [
            typeIdForKey(item.key),
            { fileName: item.file_name, status: item.status, itemId: item.id, fileId: item.file_id, downloadUrl: item.download_url },
        ]),
    ),
    fromApi: true,
})

/** Load the signed-in user's view of student documents from the server. */
export const hydrateStudentDocumentsFromApi = async () => {
    const rows = await listDocumentRecordsApi('students')
    apiRecords = rows.map(mapApiRecord)
    return apiRecords
}

/** Drop the in-memory copy (call on sign-out). */
export const clearStudentDocumentsMemory = () => {
    apiRecords = []
}

export const getStudentDocumentRecords = () => (canUseDocumentsApi() ? apiRecords : readJson(STORAGE_KEY, []))

export const saveStudentDocumentRecords = (records) => {
    writeJson(STORAGE_KEY, records)
}

/**
 * Save through the API: upload each newly chosen file, remove a document whose file was taken off, then
 * set the submitted date. Safe to retry; an upload for a type replaces the earlier file. The status is
 * decided by the server (Completed once all four are in).
 */
export const saveStudentDocumentsViaApi = async ({ studentId, submittedDate, documentSlots }) => {
    const existing = apiRecords.find((record) => record.id === studentId)
    const iso = dmyToIso(submittedDate)
    for (const slot of documentSlots) {
        const had = existing?.documents?.[slot.typeId]
        if (slot.file) {
            await putDocumentItemApi('students', studentId, {
                label: keyForTypeId(slot.typeId),
                file: slot.file,
                submittedDate: iso,
            })
        } else if (had && !slot.fileName?.trim()) {
            await deleteDocumentItemApi('students', studentId, had.itemId)
        }
    }
    let records = await hydrateStudentDocumentsFromApi()
    const saved = records.find((record) => record.id === studentId)
    if (saved && iso && saved.submittedDate !== submittedDate) {
        await patchDocumentRecordApi('students', studentId, { submittedDate: iso })
        records = await hydrateStudentDocumentsFromApi()
    }
    return records.find((record) => record.id === studentId) ?? null
}

export const getStudentDocumentRecordById = (id) =>
    getStudentDocumentRecords().find((record) => record.id === id)

const buildStudentName = (record, admission) => {
    if (record.name?.trim()) return record.name.trim()
    return [admission?.firstName, admission?.middleName, admission?.lastName]
        .map((part) => String(part || '').trim())
        .filter(Boolean)
        .join(' ')
}

export const resolveStudentDocumentProfile = (record) => {
    const admission = record.admissionId
        ? getAdmissionById(record.admissionId)
        : record.admissionSnapshot
    const source = admission || record
    const admissionNumber = source.admissionNumber || record.admissionNumber || ''

    let section =
        record.section ||
        source.section ||
        record.admissionSnapshot?.section ||
        ''

    if (!section && admissionNumber) {
        const createdStudent = getAllCreatedUsers().find(
            (user) =>
                user.role === 'student'
                && user.admissionNumber?.toLowerCase() === admissionNumber.toLowerCase(),
        )
        section = createdStudent?.section || ''
    }

    return {
        studentId: record.id,
        studentName: buildStudentName(record, source),
        admissionNumber,
        className: source.className || record.className || '',
        section,
    }
}

export const getStudentDocumentStudentProfiles = () =>
    getAllEnrolledStudents().map(resolveStudentDocumentProfile)

export const getStudentDocumentProfileById = (studentId) => {
    const record = getAllEnrolledStudents().find((item) => item.id === studentId)
    return record ? resolveStudentDocumentProfile(record) : null
}

export const getAdmissionNumberSelectOptions = () =>
    getStudentDocumentStudentProfiles()
        .filter((student) => student.admissionNumber)
        .map((student) => ({
            value: student.studentId,
            label: student.admissionNumber,
            student,
        }))

export const getStudentNameSelectOptions = () =>
    getStudentDocumentStudentProfiles()
        .filter((student) => student.studentName)
        .map((student) => ({
            value: student.studentId,
            label: student.studentName,
            student,
        }))

export const formatPlanDate = (date) => {
    if (!date) return ''
    const d = date instanceof Date ? date : new Date(date)
    if (Number.isNaN(d.getTime())) return ''
    const day = String(d.getDate()).padStart(2, '0')
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const year = d.getFullYear()
    return `${day}-${month}-${year}`
}

export const parsePlanDateString = (value) => {
    if (!value) return null
    const parts = value.split('-').map(Number)
    if (parts.length !== 3) return null
    const [day, month, year] = parts
    if (!day || !month || !year) return null
    return new Date(year, month - 1, day)
}

const buildDocumentsFromSlots = (documentSlots) => {
    const documents = {}
    documentSlots.forEach((slot) => {
        documents[slot.typeId] = {
            fileName: slot.fileName || '',
            status: slot.fileName?.trim() ? (slot.status || 'Submitted') : 'Pending',
        }
    })
    return documents
}

export const finalizeDocumentSlotsForSubmit = (documentSlots) =>
    documentSlots.map((slot) => ({
        ...slot,
        status: slot.fileName?.trim() ? 'Submitted' : 'Pending',
    }))

export const addStudentDocumentRecord = (payload) => {
    const records = getStudentDocumentRecords()
    const finalizedSlots = finalizeDocumentSlotsForSubmit(payload.documentSlots)
    const record = {
        id: `SDOC-${String(records.length + 1).padStart(3, '0')}`,
        studentId: payload.studentId || '',
        admissionNumber: payload.admissionNumber.trim(),
        studentName: payload.studentName.trim(),
        className: payload.className,
        section: payload.section || '',
        submittedDate: payload.submittedDate,
        status: payload.status,
        documents: buildDocumentsFromSlots(finalizedSlots),
    }
    records.unshift(record)
    saveStudentDocumentRecords(records)
    return record
}

export const updateStudentDocumentRecord = (id, payload) => {
    const records = getStudentDocumentRecords()
    const index = records.findIndex((record) => record.id === id)
    if (index === -1) return null

    records[index] = {
        ...records[index],
        studentId: payload.studentId ?? records[index].studentId,
        admissionNumber: payload.admissionNumber.trim(),
        studentName: payload.studentName.trim(),
        className: payload.className,
        section: payload.section ?? records[index].section ?? '',
        submittedDate: payload.submittedDate,
        status: payload.status,
        documents: buildDocumentsFromSlots(payload.documentSlots),
    }

    saveStudentDocumentRecords(records)
    return records[index]
}

export const getDocumentCellValue = (record, typeId) => {
    const doc = record.documents?.[typeId]
    if (!doc?.fileName) {
        return { display: '—', status: doc?.status || 'Pending', hasFile: false }
    }
    return { display: doc.status, status: doc.status, hasFile: true, fileName: doc.fileName }
}

export const recordToDocumentSlots = (record) =>
    STUDENT_DOCUMENT_TYPES.map((type) => ({
        typeId: type.id,
        label: type.label,
        fileName: record.documents?.[type.id]?.fileName || '',
        status: record.documents?.[type.id]?.status || 'Pending',
        downloadUrl: record.documents?.[type.id]?.downloadUrl || '',
    }))
