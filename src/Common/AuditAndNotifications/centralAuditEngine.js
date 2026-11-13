/**
 * Central Enterprise Audit Trail & Notification Dispatch Engine
 * Provides immutable audit logging and real-time cross-department notifications.
 */

const AUDIT_STORAGE_KEY = 'schoolerp-central-audit-log-v1'
const NOTIFICATION_STORAGE_KEY = 'schoolerp-central-notifications-v1'

let _memoryAuditLogs = null
let _memoryNotifications = null

const INITIAL_AUDIT_LOGS = [
    {
        id: 'AUD-2026-0001',
        timestamp: '31-10-2026 09:15 AM',
        actorId: 'EMP-DIR-001',
        actorName: 'Dr. Kavita Sharma',
        actorRole: 'director',
        module: 'Stores & Procurement',
        action: 'APPROVED_PO',
        entityId: 'PO-2026-001',
        previousState: 'Pending Approval',
        newState: 'Approved',
        remarks: 'Approved within Q3 capital equipment budget.'
    },
    {
        id: 'AUD-2026-0002',
        timestamp: '31-10-2026 09:30 AM',
        actorId: 'EMP-STR-001',
        actorName: 'Gurpreet Singh',
        actorRole: 'stationery-store-manager',
        module: 'Stores & Procurement',
        action: 'POSTED_GRN',
        entityId: 'GRN-2026-001',
        previousState: 'Shipped',
        newState: 'Stock Updated',
        remarks: 'Received 50 reams A4 Paper. Quality inspection passed.'
    },
    {
        id: 'AUD-2026-0003',
        timestamp: '31-10-2026 10:05 AM',
        actorId: 'EMP-GKM-001',
        actorName: 'Bhawani Singh',
        actorRole: 'gatekeeper-manager',
        module: 'Gate Pass & Security',
        action: 'RECORDED_EXIT',
        entityId: 'GP-2026-001',
        previousState: 'Stores Verified',
        newState: 'Security Cleared Out',
        remarks: 'Verified 2 Dell Projectors on Returnable pass with driver Jaswant Singh.'
    },
    {
        id: 'AUD-2026-0004',
        timestamp: '31-10-2026 10:45 AM',
        actorId: 'EMP-PRN-001',
        actorName: 'Dr. Ramanathan K',
        actorRole: 'principal',
        module: 'File Room',
        action: 'APPROVED_FILE_ISSUE',
        entityId: 'FILE-2026-001',
        previousState: 'In File Room',
        newState: 'Checked Out / Issued',
        remarks: 'Authorized 3-day release of Grade 10 CBSE tabulation records for inspection.'
    }
]

const INITIAL_NOTIFICATIONS = [
    {
        id: 'NOTIF-2026-0001',
        timestamp: '31-10-2026 09:15 AM',
        recipientId: 'EMP-STR-001',
        recipientRole: 'stationery-store-manager',
        title: 'Purchase Order Approved',
        message: 'PO-2026-001 for Science Lab Consumables has been approved by Managing Director.',
        link: '/stores-procurement?tab=po',
        priority: 'High',
        type: 'PROCUREMENT',
        isRead: false
    },
    {
        id: 'NOTIF-2026-0002',
        timestamp: '31-10-2026 09:35 AM',
        recipientId: 'EMP-GKM-001',
        recipientRole: 'gatekeeper-manager',
        title: 'Gate Pass Cleared for Dispatch',
        message: 'Returnable Gate Pass GP-2026-001 has been approved and ready for exit verification.',
        link: '/gate-pass?tab=verification',
        priority: 'Normal',
        type: 'GATE_PASS',
        isRead: false
    },
    {
        id: 'NOTIF-2026-0003',
        timestamp: '31-10-2026 10:10 AM',
        recipientId: 'EMP-IT-001',
        recipientRole: 'it-support-manager',
        title: 'New High Priority Ticket Raised',
        message: 'Ticket TICK-2026-001 (Server Room UPS Alarm) assigned to IT Support.',
        link: '/department-tickets?tab=queue',
        priority: 'Critical',
        type: 'TICKET',
        isRead: false
    }
]

// Storage Accessors
export const getAuditLogs = (moduleFilter = null, entityIdFilter = null) => {
    try {
        if (typeof localStorage !== 'undefined') {
            const raw = localStorage.getItem(AUDIT_STORAGE_KEY)
            if (raw) {
                const parsed = JSON.parse(raw)
                if (Array.isArray(parsed) && parsed.length > 0) {
                    return filterLogs(parsed, moduleFilter, entityIdFilter)
                }
            }
        }
    } catch {
        /* ignore */
    }
    if (_memoryAuditLogs && Array.isArray(_memoryAuditLogs)) {
        return filterLogs(_memoryAuditLogs, moduleFilter, entityIdFilter)
    }
    _memoryAuditLogs = [...INITIAL_AUDIT_LOGS]
    saveAuditLogs(_memoryAuditLogs)
    return filterLogs(_memoryAuditLogs, moduleFilter, entityIdFilter)
}

const filterLogs = (logs, moduleFilter, entityIdFilter) => {
    return logs.filter((log) => {
        if (moduleFilter && log.module !== moduleFilter) return false
        if (entityIdFilter && log.entityId !== entityIdFilter) return false
        return true
    })
}

export const saveAuditLogs = (logs) => {
    _memoryAuditLogs = logs
    try {
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(logs))
        }
    } catch {
        /* ignore */
    }
}

export const recordAuditLog = ({
    actorId = 'SYS-001',
    actorName = 'System Engine',
    actorRole = 'system',
    module,
    action,
    entityId,
    previousState = '-',
    newState = '-',
    remarks = ''
}) => {
    const logs = getAuditLogs()
    const nextSeq = logs.length + 1
    const newLog = {
        id: `AUD-2026-${String(nextSeq).padStart(4, '0')}`,
        timestamp: new Date().toLocaleDateString('en-GB') + ' ' + new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        actorId,
        actorName,
        actorRole,
        module,
        action,
        entityId,
        previousState,
        newState,
        remarks
    }
    const updated = [newLog, ...logs]
    saveAuditLogs(updated)
    return newLog
}

// Notifications
export const getNotifications = (userId = null, userRole = null) => {
    let list = []
    try {
        if (typeof localStorage !== 'undefined') {
            const raw = localStorage.getItem(NOTIFICATION_STORAGE_KEY)
            if (raw) {
                const parsed = JSON.parse(raw)
                if (Array.isArray(parsed) && parsed.length > 0) list = parsed
            }
        }
    } catch {
        /* ignore */
    }
    if (!list.length) {
        if (_memoryNotifications && Array.isArray(_memoryNotifications)) {
            list = _memoryNotifications
        } else {
            list = [...INITIAL_NOTIFICATIONS]
            saveNotifications(list)
        }
    }

    if (!userId && !userRole) return list

    return list.filter((n) => {
        if (n.recipientId && userId && n.recipientId === userId) return true
        if (n.recipientRole && userRole && n.recipientRole === userRole) return true
        if (userRole === 'director' || userRole === 'super-admin') return true
        return false
    })
}

export const saveNotifications = (notifications) => {
    _memoryNotifications = notifications
    try {
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem(NOTIFICATION_STORAGE_KEY, JSON.stringify(notifications))
        }
    } catch {
        /* ignore */
    }
}

export const dispatchNotification = ({
    recipientId = null,
    recipientRole = null,
    title,
    message,
    link = '#',
    priority = 'Normal',
    type = 'SYSTEM'
}) => {
    const list = getNotifications()
    const nextSeq = list.length + 1
    const newNotif = {
        id: `NOTIF-2026-${String(nextSeq).padStart(4, '0')}`,
        timestamp: new Date().toLocaleDateString('en-GB') + ' ' + new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        recipientId,
        recipientRole,
        title,
        message,
        link,
        priority,
        type,
        isRead: false
    }
    const updated = [newNotif, ...list]
    saveNotifications(updated)
    return newNotif
}

export const markNotificationRead = (notificationId) => {
    const list = getNotifications()
    const updated = list.map((n) => n.id === notificationId ? { ...n, isRead: true } : n)
    saveNotifications(updated)
    return updated
}

