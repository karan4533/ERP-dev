import { matchesEscalationUser } from './escalationUsersData'

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

export const getResolveByDate = (escalation) =>
    new Date(getEscalationStartTime(escalation).getTime() + RESOLUTION_SLA_HOURS * 60 * 60 * 1000)

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

const saveAllEscalations = (records) => {
    localStorage.setItem(UNIFIED_STORAGE_KEY, JSON.stringify(records))
}

export const getAllEscalations = () => {
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
