import {
    canUseAcademicsApi,
    listAcademicsCollectionApi,
    replaceAcademicsCollectionApi,
    stripAcademicsMeta,
} from '../../../services/academicsApi'
import {
    getClasses as getCatalogClasses,
    getSections as getCatalogSections,
    getSubjects as getCatalogSubjects,
} from '../../../Common/RBAC/academicsCatalogData'
import { liveArray } from '../../../Common/RBAC/liveArray'
import { CLASS_LEVEL_OPTIONS } from '../../Admin/Class/ClassDetails/classDetailsOptions'
import { getAccessToken, isApiAuthEnabled } from '../../../services/apiClient'

const FALLBACK_CLASSES = [...CLASS_LEVEL_OPTIONS]
const FALLBACK_SECTIONS = ['A', 'B', 'C']
const FALLBACK_SUBJECTS = ['Mathematics', 'English', 'Science', 'Social Science', 'Computer Science']
const apiCatalogMode = () => isApiAuthEnabled() && Boolean(getAccessToken())

export const STORAGE_KEY = 'campus-online-classes'
export const ONLINE_CLASSES_UPDATED_EVENT = 'schoolerp-online-classes-updated'

export const MEETING_PLATFORMS = [
    'Google Meet',
    'Zoom',
    'Microsoft Teams',
    'Cisco Webex',
]

export const ONLINE_CLASS_STATUSES = ['Scheduled', 'Completed']

export const statusBadgeColor = {
    Scheduled: 'bg-[#2196F333] text-[#2196F3]',
    Completed: 'bg-[#4CAF5033] text-[#4CAF50]',
}

let apiMemory = null

const usesApiMemory = () => canUseAcademicsApi()

const emitUpdated = () => {
    try {
        window.dispatchEvent(new CustomEvent(ONLINE_CLASSES_UPDATED_EVENT))
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
    const id = String(raw?.id || raw?.onlineClassId || '').trim()
    return {
        id,
        onlineClassId: String(raw?.onlineClassId || id).trim() || id,
        subject: String(raw?.subject || '').trim(),
        className: String(raw?.className || '').trim(),
        section: String(raw?.section || '').trim(),
        topic: String(raw?.topic || '').trim(),
        date: String(raw?.date || '').trim(),
        startTime: String(raw?.startTime || '').trim(),
        endTime: String(raw?.endTime || '').trim(),
        meetingPlatform: String(raw?.meetingPlatform || '').trim(),
        meetingLink: String(raw?.meetingLink || '').trim(),
        status: String(raw?.status || 'Scheduled').trim() || 'Scheduled',
        createdBy: String(raw?.createdBy || '').trim(),
        teacherEmail: String(raw?.teacherEmail || '').trim().toLowerCase(),
        teacherName: String(raw?.teacherName || '').trim(),
    }
}

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

export const CLASSES = liveArray(getClasses)
export const SECTIONS = liveArray(getSections)
export const SUBJECTS = liveArray(getSubjects)

export const hydrateOnlineClassesFromApi = async () => {
    if (!canUseAcademicsApi()) return false
    try {
        const rows = await listAcademicsCollectionApi('online-classes')
        apiMemory = cleanList(rows).map(normalizeRecord).filter((item) => item.id)
        purgeBrowserCopies()
        emitUpdated()
        return true
    } catch {
        apiMemory = []
        emitUpdated()
        return false
    }
}

export const getOnlineClasses = () => {
    if (usesApiMemory()) {
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

/** @deprecated Prefer getOnlineClasses() */
export const ONLINE_CLASSES = []

export const saveOnlineClasses = (records) => {
    const list = (Array.isArray(records) ? records : []).map(normalizeRecord).filter((item) => item.id)
    if (usesApiMemory()) {
        apiMemory = list
        replaceAcademicsCollectionApi('online-classes', cleanList(list)).catch(() => {})
        emitUpdated()
        return
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
    emitUpdated()
}

export const getOnlineClassById = (id) => {
    const key = String(id || '')
    return getOnlineClasses().find((item) => item.id === key || item.onlineClassId === key) ?? null
}

const nextId = (existing) => {
    const used = new Set(existing.map((item) => item.id))
    let index = existing.length + 1
    let candidate = `OC-${String(index).padStart(4, '0')}`
    while (used.has(candidate)) {
        index += 1
        candidate = `OC-${String(index).padStart(4, '0')}`
    }
    return candidate
}

export const formatOnlineClassDate = (date) => {
    if (!(date instanceof Date) || Number.isNaN(date.getTime())) return ''
    const day = String(date.getDate()).padStart(2, '0')
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const year = date.getFullYear()
    return `${day}-${month}-${year}`
}

export const addOnlineClass = (payload, meta = {}) => {
    const existing = getOnlineClasses()
    const id = nextId(existing)
    const record = normalizeRecord({
        ...payload,
        id,
        onlineClassId: id,
        createdBy: meta.createdBy || '',
        teacherEmail: meta.teacherEmail || '',
        teacherName: meta.teacherName || '',
    })
    saveOnlineClasses([record, ...existing])
    return record
}

export const deleteOnlineClass = (id) => {
    const key = String(id || '')
    saveOnlineClasses(getOnlineClasses().filter((item) => item.id !== key && item.onlineClassId !== key))
}
