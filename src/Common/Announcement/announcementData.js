import { ROLES } from '../../constants/roles.js'

export const STORAGE_KEY = 'school-erp-announcements'

export const CATEGORY_OPTIONS = [
    'Administrative Notice',
    'Staff Notice',
    'Stores & Material Collection',
    'Academic / Student Notice',
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
    ROLES.SUPER_ADMIN,
    ROLES.ADMIN,
    ROLES.DIRECTOR,
    ROLES.PRINCIPAL,
    ROLES.JOINT_DIRECTOR,
    ROLES.JOINT_DIRECTOR_ASSISTANT,
    ROLES.JOINT_DIRECTOR_AUDIT,
    ROLES.COORDINATOR,
    ROLES.TEACHER,
    ROLES.HR,
    ROLES.ACCOUNT_HEAD,
    ROLES.LIBRARIAN,
    ROLES.STATIONERY_STORE_MANAGER,
    ROLES.CANTEEN_MANAGER,
    ROLES.TRANSPORT_MANAGER,
    ROLES.IT_SUPPORT_MANAGER,
    ROLES.HOUSEKEEPING_MANAGER,
    ROLES.GATEKEEPER_MANAGER,
    ROLES.GATEKEEPER,
    ROLES.PRM,
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

const normalizeRole = (r) => String(r || '').toLowerCase().replace(/[-_\s]/g, '')

export const canCreateAnnouncements = (roleKey) => {
    const norm = normalizeRole(roleKey)
    for (const key of CREATOR_ROLE_KEYS) {
        if (normalizeRole(key) === norm) return true
    }
    return false
}

let _memoryAnnouncements = null

const loadFromStorage = () => {
    try {
        if (typeof localStorage !== 'undefined') {
            const raw = localStorage.getItem(STORAGE_KEY)
            if (raw) {
                const parsed = JSON.parse(raw)
                if (Array.isArray(parsed)) return parsed
            }
        }
    } catch {
        // ignore
    }
    if (_memoryAnnouncements && Array.isArray(_memoryAnnouncements)) {
        return _memoryAnnouncements
    }
    _memoryAnnouncements = []
    return _memoryAnnouncements
}

const saveToStorage = (items) => {
    _memoryAnnouncements = items
    try {
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
        }
    } catch {
        /* ignore */
    }
}

export const formatAnnouncementDate = (date) => {
    if (/^\d{4}-\d{2}-\d{2}$/.test(String(date))) {
        const [year, month, day] = String(date).split('-')
        return `${day}-${month}-${year}`
    }
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
    const norm = normalizeRole(roleKey);
    const audience = (announcement.audience || []).map(normalizeRole);
    if (audience.includes('all') || audience.includes('allschool') || audience.includes('allroles')) return true;
    const senderNorm = normalizeRole(announcement.senderRole);
    return audience.includes(norm) || senderNorm === norm;
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
        audience: payload.audience?.length ? [...new Set(payload.audience)] : [...DEFAULT_BROADCAST_AUDIENCE],
        audienceLabel: payload.audienceLabel || 'Default school audience',
        priority: payload.priority || 'Normal',
        requireAcknowledgement: payload.requireAcknowledgement !== false,
        createdAt: new Date().toISOString(),
    }
    items.unshift(announcement)
    saveToStorage(items)
    return announcement
}
