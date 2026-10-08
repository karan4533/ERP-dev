import { ROLES } from '../../constants/roles'

export const STORAGE_KEY = 'school-erp-announcements'

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
    ROLES.GATEKEEPER_MANAGER,
    ROLES.IT_SUPPORT_MANAGER,
    ROLES.HOUSEKEEPING_MANAGER,
    ROLES.HR,
])

export const DEFAULT_BROADCAST_AUDIENCE = [
    ROLES.DIRECTOR,
    ROLES.PRINCIPAL,
    ROLES.PRM,
    ROLES.TEACHER,
    ROLES.COORDINATOR,
    ROLES.LIBRARIAN,
    ROLES.STUDENT,
    ROLES.GATEKEEPER_MANAGER,
    ROLES.GATEKEEPER,
    ROLES.ADMIN,
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

const generateId = () => {
    const items = loadFromStorage()
    const next = items.length + 1
    return `AN-${String(next).padStart(4, '0')}`
}

const isVisibleToRole = (announcement, roleKey) => {
    const audience = announcement.audience || []
    return audience.includes(roleKey) || announcement.senderRole === roleKey
}

export const getAnnouncementsForRole = (roleKey) => {
    return loadFromStorage()
        .filter((item) => isVisibleToRole(item, roleKey))
        .sort((a, b) => {
            const dateA = parseAnnouncementDate(a.announcementDate)?.getTime() || 0
            const dateB = parseAnnouncementDate(b.announcementDate)?.getTime() || 0
            return dateB - dateA
        })
}

export const getAnnouncementById = (id, roleKey) => {
    const announcement = loadFromStorage().find((item) => item.id === id) ?? null
    if (!announcement) return null
    if (roleKey && !isVisibleToRole(announcement, roleKey)) return null
    return announcement
}

export const addAnnouncement = (payload, senderRole) => {
    const items = loadFromStorage()
    const announcement = {
        id: generateId(),
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
    saveToStorage(items)
    return announcement
}
