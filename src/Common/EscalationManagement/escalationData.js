import { matchesEscalationUser } from './escalationUsersData'
import { getRoleConfig } from './escalationRoleConfig'
import {
    canUseEscalationsApi,
    getEscalationApi,
    listEscalationsApi,
    raiseEscalationApi,
    setEscalationStatusApi,
} from '../../services/escalationApi'

export const ESCALATIONS_UPDATED_EVENT = 'schoolerp-escalations-updated'

const UNIFIED_STORAGE_KEY = 'schoolerp-escalations'
const LEGACY_STORAGE_PREFIX = 'escalation-management-'

export { UNIFIED_STORAGE_KEY as ESCALATION_STORAGE_KEY, LEGACY_STORAGE_PREFIX as ESCALATION_LEGACY_STORAGE_PREFIX }

export const ESCALATION_STATUSES = ['Pending', 'In Review', 'Resolved', 'Rejected', 'Closed']

export const RECEIVED_RESOLUTION_STATUSES = ['Pending', 'In Review', 'Resolved', 'Rejected']

export const RESOLUTION_SLA_HOURS = 24

export const statusBadgeColor = {
    Pending: 'bg-[#FF980033] text-[#FF9800]',
    Open: 'bg-[#FF980033] text-[#FF9800]',
    'In Review': 'bg-[#2196F333] text-[#2196F3]',
    Resolved: 'bg-[#4CAF5033] text-[#4CAF50]',
    Rejected: 'bg-[#FF000033] text-[#FF0000]',
    Closed: 'bg-[#66708533] text-[#667085]',
}

export const priorityBadgeColor = {
    High: 'bg-[#FF000033] text-[#FF0000]',
    Medium: 'bg-[#FF980033] text-[#FF9800]',
    Low: 'bg-[#4CAF5033] text-[#4CAF50]',
}

const normalizeStatus = (status) => (status === 'Open' ? 'Pending' : status)

const normalizeEscalation = (record) => ({
    ...record,
    status: normalizeStatus(record.status),
})

export const isSentEscalation = (escalation, roleKey, currentUser = null) => {
    if (escalation?.escalatedByRoleKey !== roleKey) return false
    if (!currentUser) return true
    if (!escalation?.escalatedByUserId && !escalation?.escalatedByUserEmail) return true
    return matchesEscalationUser(
        escalation.escalatedByUserId,
        escalation.escalatedByUserEmail,
        currentUser,
    )
}

export const isReceivedEscalation = (escalation, roleKey, currentUser = null) => {
    if (escalation?.escalatedToRoleKey !== roleKey) return false
    if (!currentUser) return true
    if (!escalation?.escalatedToUserId && !escalation?.escalatedToUserEmail) return true
    return matchesEscalationUser(
        escalation.escalatedToUserId,
        escalation.escalatedToUserEmail,
        currentUser,
    )
}

export const parseEscalationDate = (dateStr) => {
    if (!dateStr) return new Date()
    const parts = dateStr.split('-').map(Number)
    if (parts.length === 3) {
        const [day, month, year] = parts
        return new Date(year, month - 1, day, 0, 0, 0, 0)
    }
    const parsed = new Date(dateStr)
    return Number.isNaN(parsed.getTime()) ? new Date() : parsed
}

export const getEscalationStartTime = (escalation) =>
    escalation.escalatedAt ? new Date(escalation.escalatedAt) : parseEscalationDate(escalation.escalationDate)

// The server moves `resolveBy` forward each time the 24h clock escalates an item, so prefer it when present.
export const getResolveByDate = (escalation) =>
    escalation.resolveBy
        ? new Date(escalation.resolveBy)
        : new Date(getEscalationStartTime(escalation).getTime() + RESOLUTION_SLA_HOURS * 60 * 60 * 1000)

export const formatDateTime = (date) => {
    const value = date instanceof Date ? date : new Date(date)
    return value
        .toLocaleString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
        })
        .replace(',', '')
}

export const isResolutionOverdue = (escalation) => {
    if (['Resolved', 'Rejected', 'Closed'].includes(escalation.status)) return false
    return getResolveByDate(escalation).getTime() < Date.now()
}

// With a real backend session the server is the source of truth, so what it returned is held in
// memory only: nothing is written to localStorage, and a reload or another person signing in on the
// same browser never sees the previous person's escalations.
let apiMemoryEscalations = []
const usesApiMemory = () => canUseEscalationsApi()

/** Drop the in-memory copy (call on sign-out). */
export const clearEscalationMemory = () => {
    apiMemoryEscalations = []
    try {
        window.dispatchEvent(new CustomEvent(ESCALATIONS_UPDATED_EVENT))
    } catch {
        /* ignore */
    }
}

const saveAllEscalations = (records) => {
    if (usesApiMemory()) {
        apiMemoryEscalations = Array.isArray(records) ? records : []
        return
    }
    localStorage.setItem(UNIFIED_STORAGE_KEY, JSON.stringify(records))
}

/** Earlier builds mirrored server data into the browser; remove that stale copy once the API has answered. */
const purgeBrowserEscalationCopy = () => {
    try {
        localStorage?.removeItem(UNIFIED_STORAGE_KEY)
    } catch {
        /* ignore */
    }
}

// ---------------------------------------------------------------------------
// API source of truth (Y-5). With a real backend session the local list is only a
// cache of what the server returned; writes go to the API first.
// ---------------------------------------------------------------------------

const BACKEND_TO_FE_ROLE = { gatekeeper: 'gateKeeper', gatekeepermanager: 'gateKeeperManager', superadmin: 'superAdmin' }
const toFeRole = (code) => BACKEND_TO_FE_ROLE[code] || code

const isoToDmy = (iso) => {
    const date = new Date(iso)
    if (Number.isNaN(date.getTime())) return ''
    return `${String(date.getDate()).padStart(2, '0')}-${String(date.getMonth() + 1).padStart(2, '0')}-${date.getFullYear()}`
}

const mapApiEscalation = (item) => {
    const byKey = toFeRole(item.escalatedByRoleKey)
    const toKey = toFeRole(item.escalatedToRoleKey)
    return {
        id: item.id,
        escalationId: item.escalationId,
        escalatedBy: item.escalatedBy,
        escalatedByRole: getRoleConfig(byKey)?.roleLabel || item.escalatedByRoleKey,
        escalatedByRoleKey: byKey,
        escalatedByUserEmail: item.escalatedBy,
        escalatedTo: getRoleConfig(toKey)?.roleLabel || item.escalatedToRoleKey,
        escalatedToRoleKey: toKey,
        escalatedToUserId: item.escalatedToUserId || '',
        escalatedToUserName: item.escalatedToUserEmail || '',
        escalatedToUserEmail: item.escalatedToUserEmail || '',
        description: item.description,
        fullDescription: item.fullDescription,
        remarks: item.remarks,
        escalationDate: isoToDmy(item.escalatedAt),
        escalatedAt: item.escalatedAt,
        status: item.status,
        resolutionNote: item.resolutionNote,
        resolveBy: item.resolveBy,
        resolvedAt: item.resolvedAt,
        overdue: Boolean(item.overdue),
        level: item.level ?? 0,
        trail: item.trail,
        fromApi: true,
    }
}

const emitEscalationsUpdated = () => {
    try {
        window.dispatchEvent(new CustomEvent(ESCALATIONS_UPDATED_EVENT))
    } catch {
        /* ignore */
    }
}

/** Replace the local cache with the signed-in user's server data. Returns true when the API was used. */
export const hydrateEscalationsFromApi = async () => {
    if (!canUseEscalationsApi()) return false
    try {
        const [mine, received] = await Promise.all([listEscalationsApi('mine'), listEscalationsApi('received')])
        const merged = new Map()
        ;[...mine, ...received].forEach((item) => merged.set(item.id, mapApiEscalation(item)))
        saveAllEscalations([...merged.values()])
        purgeBrowserEscalationCopy()
        emitEscalationsUpdated()
        return true
    } catch {
        return false
    }
}

/** Fetch one escalation with its trail and update the cache. Returns the mapped record or null. */
export const hydrateEscalationFromApi = async (id) => {
    if (!canUseEscalationsApi()) return null
    try {
        const record = mapApiEscalation(await getEscalationApi(id))
        const rest = getAllEscalations().filter((item) => item.id !== record.id)
        saveAllEscalations([record, ...rest])
        emitEscalationsUpdated()
        return record
    } catch {
        return null
    }
}

export const raiseEscalationViaApi = async (form) => {
    const created = await raiseEscalationApi({
        description: form.description.trim(),
        fullDescription: form.fullDescription?.trim(),
        remarks: form.remarks?.trim(),
        recipientUserId: form.recipientUserId,
    })
    await hydrateEscalationsFromApi()
    return mapApiEscalation(created)
}

export const setEscalationStatusViaApi = async (id, status, note) => {
    await setEscalationStatusApi(id, status, note)
    return hydrateEscalationFromApi(id)
}

export const getAllEscalations = () => {
    if (usesApiMemory()) return apiMemoryEscalations.map(normalizeEscalation)
    try {
        const stored = localStorage.getItem(UNIFIED_STORAGE_KEY)
        if (stored !== null) {
            const parsed = JSON.parse(stored)
            if (Array.isArray(parsed)) {
                return parsed.map(normalizeEscalation)
            }
        }
    } catch {
        /* ignore */
    }

    saveAllEscalations([])
    return []
}

/** @deprecated Use getSentEscalations / getReceivedEscalations — kept for compatibility */
export const getEscalations = (roleKey) => {
    const all = getAllEscalations()
    return all.filter(
        (item) => isSentEscalation(item, roleKey) || isReceivedEscalation(item, roleKey),
    )
}

export const getSentEscalations = (roleKey, currentUser = null) =>
    getAllEscalations().filter((item) => isSentEscalation(item, roleKey, currentUser))

export const getReceivedEscalations = (roleKey, currentUser = null) =>
    getAllEscalations().filter((item) => isReceivedEscalation(item, roleKey, currentUser))

export const getEscalationById = (_roleKey, id) =>
    getAllEscalations().find((item) => item.id === id) ?? null

export const updateEscalation = (_roleKey, id, updates) => {
    const list = getAllEscalations()
    let updatedRecord = null
    const nextList = list.map((item) => {
        if (item.id !== id) return item
        updatedRecord = normalizeEscalation({ ...item, ...updates })
        return updatedRecord
    })
    saveAllEscalations(nextList)
    return updatedRecord
}

export const generateEscalationId = () => {
    const list = getAllEscalations()
    const max = list.reduce((acc, item) => {
        const num = Number(item.id.split('-').pop())
        return Number.isFinite(num) ? Math.max(acc, num) : acc
    }, 0)
    return `ESC-2026-${String(max + 1).padStart(3, '0')}`
}

export const emptyEscalationForm = (defaultRecipientUserId = '') => ({
    escalationDate: '',
    description: '',
    fullDescription: '',
    remarks: '',
    recipientUserId: defaultRecipientUserId,
})

export const createEscalation = (roleKey, form, roleConfig, senderUser, recipientUser) => {
    if (!roleConfig?.escalatesToRoleKey) {
        return { success: false, message: 'This role cannot create escalations.' }
    }
    if (!recipientUser?.id) {
        return { success: false, message: 'Please select a recipient for this escalation.' }
    }

    const escalationDate = form.escalationDate
        || new Date().toLocaleDateString('en-GB').replace(/\//g, '-')
    const escalatedAt = new Date().toISOString()

    const record = normalizeEscalation({
        id: generateEscalationId(),
        escalatedBy: senderUser?.name || roleConfig.roleLabel,
        escalatedByRole: roleConfig.roleLabel,
        escalatedByRoleKey: roleKey,
        escalatedByUserId: senderUser?.id || '',
        escalatedByUserEmail: senderUser?.email || '',
        escalatedTo: roleConfig.escalatesTo,
        escalatedToRoleKey: roleConfig.escalatesToRoleKey,
        escalatedToUserId: recipientUser.id,
        escalatedToUserName: recipientUser.name,
        escalatedToUserEmail: recipientUser.email || '',
        description: form.description.trim(),
        escalationDate,
        escalatedAt,
        status: 'Pending',
        fullDescription: form.fullDescription?.trim() || form.description.trim(),
        remarks: form.remarks?.trim() || '',
    })

    saveAllEscalations([record, ...getAllEscalations()])
    return { success: true, record }
}
