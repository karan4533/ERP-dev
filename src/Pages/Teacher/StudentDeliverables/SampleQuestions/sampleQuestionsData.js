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

export { CLASSES, SECTIONS, SUBJECTS }

export const ROUTE_BASE = '/teacher/student-deliverables/sample-questions'
export const DEFAULT_ROUTE_BASE = ROUTE_BASE
export const SAMPLE_QUESTIONS_UPDATED_EVENT = 'schoolerp-sample-questions-updated'

const normalizeRecord = (raw) => {
    const id = String(raw?.id || raw?.entryId || '').trim()
    return {
        id,
        entryId: String(raw?.entryId || id).trim() || id,
        subject: String(raw?.subject || '').trim(),
        className: String(raw?.className || '').trim(),
        section: String(raw?.section || '').trim(),
        title: String(raw?.title || '').trim(),
        description: String(raw?.description || '').trim(),
        fileName: String(raw?.fileName || '—').trim() || '—',
        fileType: String(raw?.fileType || 'pdf').trim() || 'pdf',
        fileId: raw?.fileId || null,
        createdBy: String(raw?.createdBy || '').trim(),
        createdAt: String(raw?.createdAt || '').trim(),
    }
}

const store = createAcademicsCollectionStore({
    collection: 'sample-questions',
    storageKey: 'teacher-student-deliverables-sample-questions',
    eventName: SAMPLE_QUESTIONS_UPDATED_EVENT,
    normalize: normalizeRecord,
    offlineFallback: () => [],
})

export const hydrateSampleQuestionsFromApi = store.hydrate
export const clearSampleQuestionsMemory = store.clearMemory

export const getSampleQuestions = () => store.getAll()

export const saveSampleQuestions = (records) => store.saveAll(records)

export const getSampleQuestionById = (id) => {
    const key = String(id || '')
    return getSampleQuestions().find((item) => item.id === key || item.entryId === key) ?? null
}

export const generateEntryId = () => nextPrefixedId(getSampleQuestions(), 'SQ', 1001)

export const addSampleQuestion = async (values, meta = {}) => {
    await store.ensureHydrated()
    const existing = getSampleQuestions()
    const entryId = nextPrefixedId(existing, 'SQ', 1001)
    const pendingFiles = Array.isArray(values?.pendingFiles) ? values.pendingFiles : []
    const { pendingFiles: _ignored, ...rest } = values || {}
    const record = normalizeRecord({
        ...rest,
        id: entryId,
        entryId,
        createdBy: meta.createdBy || '',
        createdAt: new Date().toISOString(),
    })
    await saveSampleQuestions([record, ...existing])
    if (canUseAcademicFileUploads() && pendingFiles.length) {
        const { assets, failures } = await uploadAcademicAttachments('sample-questions', record.id, pendingFiles)
        if (failures.length) {
            const detail = failures.map((row) => `${row.fileName}: ${row.message}`).join('; ')
            throw new Error(`Sample question was saved, but the attachment did not upload. ${detail}`)
        }
        const metaFields = primaryAttachmentMeta(assets)
        if (metaFields.fileId) {
            const updated = normalizeRecord({ ...record, ...metaFields })
            const current = getSampleQuestions().filter((row) => row.id !== record.id)
            await saveSampleQuestions([updated, ...current])
            return updated
        }
    }
    return record
}

export const filterSampleQuestions = (items, filters) =>
    items.filter((item) => {
        const search = filters.search.trim().toLowerCase()
        const matchesSearch =
            !search ||
            item.entryId.toLowerCase().includes(search) ||
            item.title.toLowerCase().includes(search) ||
            item.description.toLowerCase().includes(search) ||
            item.fileName.toLowerCase().includes(search)

        const matchesSubject = !filters.subject || item.subject === filters.subject
        const matchesClass = !filters.className || item.className === filters.className
        const matchesSection = !filters.section || item.section === filters.section

        return matchesSearch && matchesSubject && matchesClass && matchesSection
    })
