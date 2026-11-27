import {
    canUseAcademicsApi,
    deleteAcademicsRecordApi,
    listAcademicsCollectionApi,
    replaceAcademicsCollectionApi,
    stripAcademicsMeta,
    updateAcademicsRecordApi,
} from '../../../services/academicsApi'
import { REPLACE_BLOCKED_MESSAGE } from '../../../services/campusLoadGuard'
import {
    getClasses as getCatalogClasses,
    getSections as getCatalogSections,
    getSubjects as getCatalogSubjects,
} from '../../../Common/RBAC/academicsCatalogData'
import { getAccessToken, isApiAuthEnabled } from '../../../services/apiClient'
import { CLASSES as FALLBACK_CLASSES, SECTIONS as FALLBACK_SECTIONS, SUBJECTS as FALLBACK_SUBJECTS } from '../AssignedClass/assignedClassData'

export const STORAGE_KEY = 'campus-extra-classes'
export const EXTRA_CLASSES_UPDATED_EVENT = 'schoolerp-extra-classes-updated'

export const VENUES = [
    'Classroom',
    'Online Class',
]

let apiMemory = null
// True only after a successful server list; a failed load leaves [] which must never be PUT back.
let loaded = false
let hydratePromise = null
let persistPromise = null

const emitUpdated = () => {
    try {
        window.dispatchEvent(new CustomEvent(EXTRA_CLASSES_UPDATED_EVENT))
    } catch {
        /* ignore */
    }
}

const purgeBrowserCopies = () => {
    try {
        localStorage.removeItem(STORAGE_KEY)
        sessionStorage.removeItem(STORAGE_KEY)
    } catch {
        /* ignore */
    }
}

const cleanList = (rows) => (Array.isArray(rows) ? rows.map(stripAcademicsMeta) : [])

const normalizeRecord = (raw) => {
    const id = String(raw?.id || raw?.extraClassId || '').trim()
    const className = String(raw?.className || '').trim()
    const section = String(raw?.section || '').trim()
    const classSection =
        String(raw?.classSection || '').trim() ||
        (className && section ? `${className}-${section}` : className || section || '')
    return {
        id,
        extraClassId: String(raw?.extraClassId || id).trim() || id,
        subject: String(raw?.subject || '').trim(),
        className,
        section,
        classSection,
        topic: String(raw?.topic || '').trim(),
        date: String(raw?.date || '').trim(),
        startTime: String(raw?.startTime || '').trim(),
        endTime: String(raw?.endTime || '').trim(),
        venue: String(raw?.venue || '').trim(),
        reason: String(raw?.reason || '').trim(),
        createdBy: String(raw?.createdBy || '').trim(),
        createdAt: String(raw?.createdAt || '').trim(),
    }
}

const apiCatalogMode = () => isApiAuthEnabled() && Boolean(getAccessToken())

export const getClasses = () => {
    const fromCatalog = getCatalogClasses().map((item) => String(item || '').trim()).filter(Boolean)
    if (fromCatalog.length) return [...new Set(fromCatalog)]
    return apiCatalogMode() ? [] : [...FALLBACK_CLASSES]
}

export const getSections = () => {
    const fromCatalog = getCatalogSections().map((item) => String(item || '').trim().toUpperCase()).filter(Boolean)
    if (fromCatalog.length) return [...new Set(fromCatalog)]
    return apiCatalogMode() ? [] : [...FALLBACK_SECTIONS]
}

export const getSubjects = () => {
    const fromCatalog = getCatalogSubjects().map((item) => String(item || '').trim()).filter(Boolean)
    if (fromCatalog.length) return [...new Set(fromCatalog)]
    return apiCatalogMode() ? [] : [...FALLBACK_SUBJECTS]
}

/** @deprecated Prefer getClasses / getSections / getSubjects */
export const CLASSES = FALLBACK_CLASSES
export const SECTIONS = FALLBACK_SECTIONS
export const SUBJECTS = FALLBACK_SUBJECTS

export const clearExtraClassMemory = () => {
    apiMemory = null
    loaded = false
    emitUpdated()
}

export const isExtraClassStoreLoaded = () => !canUseAcademicsApi() || loaded

export const hydrateExtraClassesFromApi = async ({ force = false } = {}) => {
    if (!canUseAcademicsApi()) return false
    // Wait for any in-flight save so a list remount does not GET stale data over the new row.
    if (persistPromise) {
        try {
            await persistPromise
        } catch {
            /* continue to hydrate */
        }
    }
    if (hydratePromise && !force) return hydratePromise
    hydratePromise = listAcademicsCollectionApi('extra-classes')
        .then((rows) => {
            apiMemory = cleanList(rows).map(normalizeRecord).filter((item) => item.id)
            loaded = true
            purgeBrowserCopies()
            emitUpdated()
            return true
        })
        .catch(() => {
            if (apiMemory == null) apiMemory = []
            emitUpdated()
            return false
        })
        .finally(() => {
            hydratePromise = null
        })
    return hydratePromise
}

export const getExtraClasses = () => {
    if (canUseAcademicsApi()) {
        return Array.isArray(apiMemory) ? apiMemory.map((item) => ({ ...item })) : []
    }
    try {
        const stored = localStorage.getItem(STORAGE_KEY)
        if (stored) {
            const parsed = JSON.parse(stored)
            if (Array.isArray(parsed)) return parsed.map(normalizeRecord)
        }
    } catch {
        /* ignore */
    }
    return []
}

export const saveExtraClasses = async (records) => {
    const list = (Array.isArray(records) ? records : []).map(normalizeRecord).filter((item) => item.id)
    if (canUseAcademicsApi()) {
        if (!loaded) throw new Error(REPLACE_BLOCKED_MESSAGE)
        const previous = apiMemory
        apiMemory = list
        emitUpdated()
        persistPromise = replaceAcademicsCollectionApi('extra-classes', cleanList(list))
            .then((rows) => {
                if (Array.isArray(rows)) {
                    apiMemory = cleanList(rows).map(normalizeRecord).filter((item) => item.id)
                }
                emitUpdated()
                return apiMemory
            })
            .catch((error) => {
                apiMemory = previous
                emitUpdated()
                throw error
            })
            .finally(() => {
                persistPromise = null
            })
        await persistPromise
        return list
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
    emitUpdated()
    return list
}

export const getExtraClassById = (id) => {
    const key = String(id || '')
    return getExtraClasses().find((item) => item.id === key || item.extraClassId === key) ?? null
}

const nextExtraClassId = (existing) => {
    const used = new Set(existing.map((item) => item.id))
    let index = existing.length + 1
    let candidate = `EC-${String(index).padStart(4, '0')}`
    while (used.has(candidate)) {
        index += 1
        candidate = `EC-${String(index).padStart(4, '0')}`
    }
    return candidate
}

export const formatExtraClassDate = (date) => {
    if (!(date instanceof Date) || Number.isNaN(date.getTime())) return ''
    const day = String(date.getDate()).padStart(2, '0')
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const year = date.getFullYear()
    return `${day}-${month}-${year}`
}

export const addExtraClass = async (payload, meta = {}) => {
    if (canUseAcademicsApi()) {
        await hydrateExtraClassesFromApi()
    }
    const existing = getExtraClasses()
    const id = nextExtraClassId(existing)
    const className = String(payload.className || '').trim()
    const section = String(payload.section || '').trim()
    const record = normalizeRecord({
        ...payload,
        id,
        extraClassId: id,
        classSection: className && section ? `${className}-${section}` : className || section,
        createdBy: meta.createdBy || '',
        createdAt: new Date().toISOString(),
    })
    await saveExtraClasses([record, ...existing])
    return record
}

const EDITABLE_FIELDS = ['subject', 'className', 'section', 'topic', 'date', 'startTime', 'endTime', 'venue', 'reason']

export const updateExtraClass = async (id, payload) => {
    const key = String(id || '')
    if (canUseAcademicsApi()) {
        // Server validates, checks owner/scope (403) and audits; only its saved row is shown as success.
        const patch = Object.fromEntries(
            EDITABLE_FIELDS.filter((field) => payload?.[field] !== undefined).map((field) => [field, payload[field]]),
        )
        const current = getExtraClassById(key)
        const saved = await updateAcademicsRecordApi('extra-classes', current?.id || key, patch)
        const record = normalizeRecord(stripAcademicsMeta(saved))
        if (Array.isArray(apiMemory)) {
            const index = apiMemory.findIndex((item) => item.id === record.id)
            apiMemory = index < 0
                ? [record, ...apiMemory]
                : apiMemory.map((item, i) => (i === index ? record : item))
        }
        emitUpdated()
        return record
    }
    const existing = getExtraClasses()
    const index = existing.findIndex((item) => item.id === key || item.extraClassId === key)
    if (index < 0) return null
    const className = String(payload.className ?? existing[index].className).trim()
    const section = String(payload.section ?? existing[index].section).trim()
    const next = normalizeRecord({
        ...existing[index],
        ...payload,
        id: existing[index].id,
        extraClassId: existing[index].extraClassId || existing[index].id,
        className,
        section,
        classSection: className && section ? `${className}-${section}` : className || section,
    })
    const list = [...existing]
    list[index] = next
    await saveExtraClasses(list)
    return next
}

export const deleteExtraClass = async (id) => {
    const key = String(id || '')
    if (canUseAcademicsApi()) {
        const current = getExtraClassById(key)
        await deleteAcademicsRecordApi('extra-classes', current?.id || key)
        await hydrateExtraClassesFromApi({ force: true })
        return
    }
    const next = getExtraClasses().filter((item) => item.id !== key && item.extraClassId !== key)
    await saveExtraClasses(next)
}

export const isUsingDemoExtraClasses = () => false
