import {
    canUseDocumentsApi,
    deleteDocumentItemApi,
    dmyToIso,
    isoToDmy,
    listDocumentRecordsApi,
    patchDocumentRecordApi,
    putDocumentItemApi,
} from '../../../../services/documentsApi'

const STORAGE_KEY = 'schoolErpAdminEmployeeDocuments'
const TYPES_STORAGE_KEY = 'schoolErpAdminEmployeeDocumentTypes'

export const EMPLOYEE_DOCUMENTS_STORAGE_KEY = STORAGE_KEY
export const EMPLOYEE_DOCUMENT_TYPES_STORAGE_KEY = TYPES_STORAGE_KEY

const defaultDocumentTypes = [
    { id: 'doc-aadhaar', label: 'Aadhaar Card' },
    { id: 'doc-exp', label: 'Experience Letter' },
    { id: 'doc-pan', label: 'PAN Card' },
]

export const DOCUMENT_STATUS_OPTIONS = ['Approved', 'Pending']
export const RECORD_STATUS_OPTIONS = ['In Progress', 'Completed']

export const documentStatusColor = {
    Approved: 'text-[#008000]',
    Pending: 'text-[#FF9800]',
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

const mapApiRecord = (row) => ({
    id: row.subject_ref,
    employeeId: row.subject_ref,
    employeeName: row.name,
    submittedDate: isoToDmy(row.submitted_date),
    status: row.status,
    documents: Object.fromEntries(
        row.items.map((item) => [
            item.key,
            {
                label: item.label,
                fileName: item.file_name,
                status: item.status,
                itemId: item.id,
                fileId: item.file_id,
                downloadUrl: item.download_url,
            },
        ]),
    ),
    fromApi: true,
})

/** Load the signed-in user's view of employee documents from the server. */
export const hydrateEmployeeDocumentsFromApi = async () => {
    const rows = await listDocumentRecordsApi('employees')
    apiRecords = rows.map(mapApiRecord)
    return apiRecords
}

/** Drop the in-memory copy (call on sign-out). */
export const clearEmployeeDocumentsMemory = () => {
    apiRecords = []
}

/** Columns for the list: the labels that exist on the server, in the order they first appeared. */
const apiDocumentTypes = () => {
    const types = []
    const seen = new Set()
    ;[...apiRecords].reverse().forEach((record) => {
        Object.entries(record.documents).forEach(([key, doc]) => {
            if (seen.has(key)) return
            seen.add(key)
            types.push({ id: key, label: doc.label })
        })
    })
    return types
}

export const getDocumentTypes = () =>
    canUseDocumentsApi() ? apiDocumentTypes() : readJson(TYPES_STORAGE_KEY, defaultDocumentTypes)

export const saveDocumentTypes = (types) => {
    writeJson(TYPES_STORAGE_KEY, types)
}

export const getEmployeeDocumentRecords = () => (canUseDocumentsApi() ? apiRecords : readJson(STORAGE_KEY, []))

const normalizeLabel = (label) => String(label || '').replace(/\s+/g, ' ').trim().toLowerCase()

/**
 * Save through the API: upload each newly chosen file, change the status of a document that kept its
 * file, remove a document whose file was taken off, then set the record's date and status. Safe to retry.
 * The employee is found by the employee ID; an unknown ID is refused by the server.
 */
export const saveEmployeeDocumentsViaApi = async ({ employeeId, submittedDate, status, documentSlots }) => {
    const code = employeeId.trim()
    const existing = apiRecords.find((record) => record.id === code)
    const iso = dmyToIso(submittedDate)
    const labelsKept = new Set(
        documentSlots.filter((slot) => slot.fileName?.trim()).map((slot) => normalizeLabel(slot.label)),
    )
    for (const slot of documentSlots) {
        const label = slot.label.trim()
        if (!label) continue
        const had = existing?.documents?.[normalizeLabel(label)]
        if (slot.file) {
            await putDocumentItemApi('employees', code, { label, file: slot.file, status: slot.status, submittedDate: iso })
        } else if (had && slot.fileName?.trim() && had.status !== slot.status) {
            await putDocumentItemApi('employees', code, { label, status: slot.status, submittedDate: iso })
        }
    }
    for (const [key, doc] of Object.entries(existing?.documents ?? {})) {
        if (!labelsKept.has(key)) await deleteDocumentItemApi('employees', code, doc.itemId)
    }
    let records = await hydrateEmployeeDocumentsFromApi()
    const saved = records.find((record) => record.id === code)
    if (saved && (status !== saved.status || (iso && submittedDate !== saved.submittedDate))) {
        await patchDocumentRecordApi('employees', code, { submittedDate: iso, status })
        records = await hydrateEmployeeDocumentsFromApi()
    }
    return records.find((record) => record.id === code) ?? null
}

export const saveEmployeeDocumentRecords = (records) => {
    writeJson(STORAGE_KEY, records)
}

export const formatPlanDate = (date) => {
    if (!date) return ''
    const d = date instanceof Date ? date : new Date(date)
    if (Number.isNaN(d.getTime())) return ''
    const day = String(d.getDate()).padStart(2, '0')
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const year = d.getFullYear()
    return `${day}-${month}-${year}`
}

const slugifyLabel = (label) =>
    label
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')

export const resolveOrCreateDocumentType = (label, existingTypes) => {
    const trimmed = label.trim()
    if (!trimmed) return null

    const match = existingTypes.find(
        (type) => type.label.toLowerCase() === trimmed.toLowerCase()
    )
    if (match) return match

    const baseId = `doc-${slugifyLabel(trimmed) || 'custom'}`
    let id = baseId
    let counter = 1
    while (existingTypes.some((type) => type.id === id)) {
        id = `${baseId}-${counter}`
        counter += 1
    }

    const created = { id, label: trimmed }
    existingTypes.push(created)
    return created
}

export const addEmployeeDocumentRecord = (payload) => {
    const types = getDocumentTypes()
    const records = getEmployeeDocumentRecords()
    const documents = {}

    payload.documentSlots.forEach((slot) => {
        const type = resolveOrCreateDocumentType(slot.label, types)
        if (!type) return
        documents[type.id] = {
            fileName: slot.fileName || '',
            status: slot.status || 'Pending',
        }
    })

    saveDocumentTypes(types)

    const record = {
        id: `EDOC-${String(records.length + 1).padStart(3, '0')}`,
        employeeId: payload.employeeId.trim(),
        employeeName: payload.employeeName.trim(),
        submittedDate: payload.submittedDate,
        status: payload.status,
        documents,
    }

    records.unshift(record)
    saveEmployeeDocumentRecords(records)
    return record
}

export const parsePlanDateString = (value) => {
    if (!value) return null
    const parts = value.split('-').map(Number)
    if (parts.length !== 3) return null
    const [day, month, year] = parts
    if (!day || !month || !year) return null
    return new Date(year, month - 1, day)
}

export const getEmployeeDocumentRecordById = (id) =>
    getEmployeeDocumentRecords().find((record) => record.id === id)

export const updateEmployeeDocumentRecord = (id, payload) => {
    const types = getDocumentTypes()
    const records = getEmployeeDocumentRecords()
    const index = records.findIndex((record) => record.id === id)
    if (index === -1) return null

    const documents = {}
    payload.documentSlots.forEach((slot) => {
        const type = resolveOrCreateDocumentType(slot.label, types)
        if (!type) return
        documents[type.id] = {
            fileName: slot.fileName || '',
            status: slot.status || 'Pending',
        }
    })

    saveDocumentTypes(types)

    records[index] = {
        ...records[index],
        employeeId: payload.employeeId.trim(),
        employeeName: payload.employeeName.trim(),
        submittedDate: payload.submittedDate,
        status: payload.status,
        documents,
    }

    saveEmployeeDocumentRecords(records)
    return records[index]
}

export const deleteEmployeeDocumentRecord = (id) => {
    const records = getEmployeeDocumentRecords().filter((record) => record.id !== id)
    saveEmployeeDocumentRecords(records)
}

export const recordToDocumentSlots = (record) => {
    const types = getDocumentTypes()
    const slots = types
        .filter((type) => record.documents?.[type.id])
        .map((type) => ({
            key: type.id,
            label: type.label,
            fileName: record.documents[type.id]?.fileName || '',
            status: record.documents[type.id]?.status || 'Pending',
            fileId: record.documents[type.id]?.fileId || '',
            downloadUrl: record.documents[type.id]?.downloadUrl || '',
        }))

    const extraSlots = Object.entries(record.documents || {})
        .filter(([typeId]) => !types.some((type) => type.id === typeId))
        .map(([typeId, doc]) => ({
            key: typeId,
            label: typeId,
            fileName: doc.fileName || '',
            status: doc.status || 'Pending',
        }))

    const combined = [...slots, ...extraSlots]
    return combined.length
        ? combined
        : [{ key: 'slot-initial', label: '', fileName: '', status: 'Pending' }]
}

export const getDocumentCellValue = (record, typeId) => {
    const doc = record.documents?.[typeId]
    if (!doc?.fileName) {
        return { display: '—', status: doc?.status || 'Pending', hasFile: false }
    }
    return { display: doc.status, status: doc.status, hasFile: true, fileName: doc.fileName }
}
