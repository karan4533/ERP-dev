import { CLASSES, SECTIONS, SUBJECTS } from '../AssignedClass/assignedClassData'
import {
    createAcademicsCollectionStore,
    nextPrefixedId,
} from '../../../services/academicsCollectionStore'

export { CLASSES, SECTIONS, SUBJECTS }

export const ROUTE_BASE = '/teacher/unit-tests'
export const UNIT_TESTS_UPDATED_EVENT = 'schoolerp-unit-tests-updated'

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
        testDate: String(raw?.testDate || '').trim(),
        totalMarks: String(raw?.totalMarks ?? '').trim(),
        duration: String(raw?.duration ?? '').trim(),
        fileName: String(raw?.fileName || '—').trim() || '—',
        fileType: String(raw?.fileType || 'pdf').trim() || 'pdf',
        createdBy: String(raw?.createdBy || '').trim(),
        createdAt: String(raw?.createdAt || '').trim(),
    }
}

const store = createAcademicsCollectionStore({
    collection: 'unit-tests',
    storageKey: 'teacher-unit-tests',
    eventName: UNIT_TESTS_UPDATED_EVENT,
    normalize: normalizeRecord,
    offlineFallback: () => [],
})

export const hydrateUnitTestsFromApi = store.hydrate
export const clearUnitTestsMemory = store.clearMemory

export const getUnitTests = () => store.getAll()

export const saveUnitTests = (records) => store.saveAll(records)

export const getUnitTestById = (id) => {
    const key = String(id || '')
    return getUnitTests().find((item) => item.id === key || item.entryId === key) ?? null
}

export const generateEntryId = () => nextPrefixedId(getUnitTests(), 'UT', 1001)

export const addUnitTest = async (values, meta = {}) => {
    await store.ensureHydrated()
    const existing = getUnitTests()
    const entryId = nextPrefixedId(existing, 'UT', 1001)
    const record = normalizeRecord({
        ...values,
        id: entryId,
        entryId,
        createdBy: meta.createdBy || '',
        createdAt: new Date().toISOString(),
    })
    await saveUnitTests([record, ...existing])
    return record
}

export const updateUnitTest = async (id, values) => {
    await store.ensureHydrated()
    const key = String(id || '')
    const list = getUnitTests()
    const index = list.findIndex((item) => item.id === key || item.entryId === key)
    if (index < 0) return null
    const existing = list[index]
    const record = normalizeRecord({
        ...existing,
        ...values,
        id: existing.id,
        entryId: existing.entryId,
        fileName: values.fileName || existing.fileName || '—',
        fileType: values.fileType || existing.fileType || 'pdf',
    })
    const next = [...list]
    next[index] = record
    await saveUnitTests(next)
    return record
}

export const deleteUnitTest = async (id) => {
    await store.ensureHydrated()
    const key = String(id || '')
    await saveUnitTests(getUnitTests().filter((item) => item.id !== key && item.entryId !== key))
}

export const filterUnitTests = (items, filters) =>
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

export const formatTestDate = (value) => {
    if (!value) return '—'
    const date = new Date(`${value}T00:00:00`)
    if (Number.isNaN(date.getTime())) return value
    return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    })
}
