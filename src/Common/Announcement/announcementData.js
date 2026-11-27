import { ROLES } from '../../constants/roles'
import { getAnnouncements as getHrAnnouncements, saveAnnouncements as saveHrAnnouncements } from '../../Pages/HR/domain/hrStore'
import {
    acknowledgeAnnouncementApi,
    canUseAnnouncementsApi,
    createAnnouncementApi,
    getAnnouncementApi,
    listAnnouncementsApi,
    replyToAnnouncementApi,
} from '../../services/announcementsApi'
import { isoToDmy } from '../../services/documentsApi'

export const STORAGE_KEY = 'school-erp-announcements'
const RESPONSES_STORAGE_KEY = 'schoolerp-announcement-responses-v1'
const HR_ROLE = ROLES.HR

export const CATEGORY_OPTIONS = [
    'Administrative Notice',
    'Staff Notice',
    'Examination',
    'General Announcement',
    'Emergency',
    'Policy Update',
    'Holiday Announcement',
    'Training Announcement',
    'Internal Job Opening',
    'HR Circular',
]

export const CREATOR_ROLE_KEYS = new Set([
    ROLES.ADMIN,
    ROLES.PRINCIPAL,
    ROLES.DIRECTOR,
    ROLES.GATEKEEPER_MANAGER,
    ROLES.IT_SUPPORT_MANAGER,
    ROLES.HOUSEKEEPING_MANAGER,
    ROLES.HR,
])

export const DEFAULT_BROADCAST_AUDIENCE = [
    ROLES.DIRECTOR,
    ROLES.PRINCIPAL,
    ROLES.PRM,
    ROLES.PRO,
    ROLES.TEACHER,
    ROLES.COORDINATOR,
    ROLES.LIBRARIAN,
    ROLES.STUDENT,
    ROLES.PARENT,
    ROLES.GATEKEEPER_MANAGER,
    ROLES.GATEKEEPER,
    ROLES.ADMIN,
    ROLES.HOUSEKEEPING_MANAGER,
    ROLES.STATIONERY_STORE_MANAGER,
    ROLES.CANTEEN_MANAGER,
    ROLES.IT_SUPPORT_MANAGER,
    ROLES.TRANSPORT_MANAGER,
]

export const canCreateAnnouncements = (roleKey) => CREATOR_ROLE_KEYS.has(roleKey)

const loadFromStorage = () => {
    try {
        if (typeof localStorage === 'undefined') return []
        const raw = localStorage.getItem(STORAGE_KEY)
        if (!raw) return []
        const parsed = JSON.parse(raw)
        return Array.isArray(parsed) ? parsed : []
    } catch {
        return []
    }
}

const saveToStorage = (items) => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
    } catch {
        /* ignore */
    }
}

const loadAnnouncements = (roleKey) => {
    if (roleKey === HR_ROLE) return getHrAnnouncements()
    return loadFromStorage()
}

const saveAnnouncementsForRole = (roleKey, items) => {
    if (roleKey === HR_ROLE) {
        saveHrAnnouncements(items)
        return
    }
    saveToStorage(items)
}

export const formatAnnouncementDate = (date) => {
    const value = date instanceof Date ? date : new Date(date)
    if (Number.isNaN(value.getTime())) return ''
    const day = String(value.getDate()).padStart(2, '0')
    const month = String(value.getMonth() + 1).padStart(2, '0')
    const year = value.getFullYear()
    return `${day}-${month}-${year}`
}

export const parseAnnouncementDate = (dateStr) => {
    if (!dateStr) return null
    const parts = String(dateStr).split('-')
    if (parts.length === 3 && parts.every((part) => /^\d+$/.test(part))) {
        const [day, month, year] = parts
        return new Date(Number(year), Number(month) - 1, Number(day))
    }
    const parsed = new Date(dateStr)
    return Number.isNaN(parsed.getTime()) ? null : parsed
}

const generateId = (roleKey) => {
    const items = loadAnnouncements(roleKey)
    const next = items.length + 1
    return `AN-${String(next).padStart(4, '0')}`
}

const isVisibleToRole = (announcement, roleKey) => {
    const audience = announcement.audience || []
    return audience.includes(roleKey) || announcement.senderRole === roleKey
}

// With a backend session announcements (and replies/acknowledgements) live on the server. What it returned is
// held in memory only, never written to the browser's storage. The HR portal keeps its own store.
let apiAnnouncements = []

/** True when this role's announcements come from the server. */
export const usesAnnouncementsApi = (roleKey) => roleKey !== HR_ROLE && canUseAnnouncementsApi()

const mapApiAnnouncement = (row) => ({
    id: row.id,
    uuid: row.uuid,
    title: row.title,
    category: row.category,
    message: row.message,
    sentBy: row.sentBy,
    senderRole: row.senderRole,
    announcementDate: isoToDmy(row.announcementDate),
    attachmentName: row.attachmentName,
    attachmentUrl: row.attachmentUrl,
    acknowledged: row.acknowledged,
    acknowledgedAt: row.acknowledgedAt,
    replies: row.replies ?? [],
    createdAt: row.createdAt,
    fromApi: true,
})

const remember = (row) => {
    const mapped = mapApiAnnouncement(row)
    apiAnnouncements = apiAnnouncements.some((item) => item.id === mapped.id)
        ? apiAnnouncements.map((item) => (item.id === mapped.id ? mapped : item))
        : [mapped, ...apiAnnouncements]
    return mapped
}

const purgeBrowserAnnouncementCopies = () => {
    try {
        localStorage.removeItem(STORAGE_KEY)
        localStorage.removeItem(RESPONSES_STORAGE_KEY)
    } catch {
        /* ignore */
    }
}

/** Load what the signed-in user may see from the server. */
export const hydrateAnnouncementsFromApi = async () => {
    const rows = await listAnnouncementsApi()
    apiAnnouncements = rows.map(mapApiAnnouncement)
    purgeBrowserAnnouncementCopies()
    return apiAnnouncements
}

/** Load one announcement with the signed-in user's acknowledgement and replies. */
export const hydrateAnnouncementFromApi = async (ref) => remember(await getAnnouncementApi(ref))

/** Drop the in-memory copy (call on sign-out). */
export const clearAnnouncementsMemory = () => {
    apiAnnouncements = []
}

const toIsoDate = (value) => {
    const date = value instanceof Date ? value : new Date(value)
    if (Number.isNaN(date.getTime())) return ''
    const pad = (part) => String(part).padStart(2, '0')
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

/** Send an announcement through the API; the server sets the sender and the audience. */
export const addAnnouncementViaApi = async ({ title, category, message, announcementDate, file }) =>
    remember(
        await createAnnouncementApi({
            title: title?.trim() || '',
            category,
            message: message?.trim() || '',
            announcementDate: announcementDate ? toIsoDate(announcementDate) : '',
            file,
        }),
    )

export const acknowledgeAnnouncementViaApi = async (ref) => remember(await acknowledgeAnnouncementApi(ref))

export const replyToAnnouncementViaApi = async (ref, text) => {
    await replyToAnnouncementApi(ref, text)
    return hydrateAnnouncementFromApi(ref)
}

export const getAnnouncementsForRole = (roleKey) => {
    if (usesAnnouncementsApi(roleKey)) return [...apiAnnouncements]
    return loadAnnouncements(roleKey)
        .filter((item) => isVisibleToRole(item, roleKey))
        .sort((a, b) => {
            const dateA = parseAnnouncementDate(a.announcementDate)?.getTime() || 0
            const dateB = parseAnnouncementDate(b.announcementDate)?.getTime() || 0
            return dateB - dateA
        })
}

export const getAnnouncementById = (id, roleKey) => {
    if (usesAnnouncementsApi(roleKey)) return apiAnnouncements.find((item) => item.id === id) ?? null
    const announcement = loadAnnouncements(roleKey).find((item) => item.id === id) ?? null
    if (!announcement) return null
    if (roleKey && !isVisibleToRole(announcement, roleKey)) return null
    return announcement
}

export const addAnnouncement = (payload, senderRole) => {
    const items = loadAnnouncements(senderRole)
    const announcement = {
        id: generateId(senderRole),
        title: payload.title?.trim() || '',
        category: payload.category || '',
        message: payload.message?.trim() || '',
        sentBy: payload.sentBy?.trim() || '',
        announcementDate: formatAnnouncementDate(payload.announcementDate || new Date()),
        attachmentName: payload.attachmentName || '',
        senderRole,
        audience: [...DEFAULT_BROADCAST_AUDIENCE],
        createdAt: new Date().toISOString(),
    }
    items.unshift(announcement)
    saveAnnouncementsForRole(senderRole, items)
    return announcement
}
