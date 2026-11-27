/**
 * Live campus audit trail helpers for Super Admin Activity Logs.
 * Source: GET /api/v1/audit-logs (append-only; never edited from this UI).
 */
import { apiRequest, getAccessToken, isApiAuthEnabled } from '../../../services/apiClient'

const CACHE_KEY = 'qmis-superadmin-audit-logs-v1'

export const canUseLiveAuditLogs = () => isApiAuthEnabled() && Boolean(getAccessToken())

const formatTimestamp = (iso) => {
    if (!iso) return '—'
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return String(iso)
    return d.toLocaleString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
    })
}

const parseDetails = (details) => {
    if (details == null || details === '') return { text: '—', oldValue: '—', newValue: '—', raw: null }
    if (typeof details === 'object') {
        return {
            text: JSON.stringify(details, null, 2),
            oldValue: details.before != null ? JSON.stringify(details.before) : (details.oldValue ?? '—'),
            newValue: details.after != null ? JSON.stringify(details.after) : (details.newValue ?? '—'),
            raw: details,
        }
    }
    const text = String(details)
    try {
        const parsed = JSON.parse(text)
        if (parsed && typeof parsed === 'object') {
            return {
                text: JSON.stringify(parsed, null, 2),
                oldValue: parsed.before != null ? JSON.stringify(parsed.before) : (parsed.oldValue ?? '—'),
                newValue: parsed.after != null ? JSON.stringify(parsed.after) : (parsed.newValue ?? '—'),
                raw: parsed,
            }
        }
    } catch {
        /* plain string details */
    }
    return { text, oldValue: '—', newValue: text, raw: null }
}

/** Map one API audit row into the Activity Logs UI shape. */
export const mapAuditApiRow = (row, logType = 'audit-logs') => {
    const detail = parseDetails(row.details)
    const isSystem = !row.actor_id
    const actorName = row.actor_name || (row.actor_id ? 'Unknown user' : 'System')
    const attemptedIdentity =
        isSystem && typeof row.details === 'string' && row.details.includes('@')
            ? row.details
            : null
    const loginStatus = /LOGIN_LOCK|OTP_|UNKNOWN|FAIL/i.test(row.action || '')
        ? (/LOCK|BLOCK/i.test(row.action || '') ? 'Blocked' : 'Failed')
        : (/LOGOUT/i.test(row.action || '') ? 'Logout' : 'Success')
    return {
        id: String(row.id),
        logType,
        source: 'api',
        timestamp: formatTimestamp(row.created_at),
        createdAtRaw: row.created_at || null,
        user: actorName,
        userId: row.actor_id || '—',
        userEmail: row.actor_email || attemptedIdentity || '—',
        role: row.actor_role_label || row.actor_role || (isSystem ? 'System' : '—'),
        action: row.action || '—',
        module: row.entity_type || '—',
        description: detail.text,
        details: detail.text,
        findings: detail.text,
        remarks: detail.text,
        recordId: row.entity_id || '—',
        recordName: row.entity_id || '—',
        referenceId: row.entity_id || '—',
        referenceTitle: row.entity_type || '—',
        auditId: String(row.id),
        auditType: row.action || row.entity_type || 'Audit',
        scope: row.entity_type || '—',
        result: row.action || 'Completed',
        changeType: row.action || 'Update',
        fieldChanged: detail.raw?.field || '—',
        oldValue: detail.oldValue,
        newValue: detail.newValue,
        deletedBy: actorName,
        reason: detail.text !== '—' ? detail.text : (row.action || '—'),
        canRestore: false,
        ipAddress: row.ip_address || '—',
        status: logType === 'login-history' || logType === 'failed-logins' ? loginStatus : (row.action || 'Completed'),
        username: row.actor_email || attemptedIdentity || actorName,
        device: '—',
        location: '—',
        attempts: '—',
        sessionId: '—',
    }
}

const ACTION_FILTERS = {
    'audit-logs': () => true,
    'data-changes': (action) => !/LOGIN|LOGOUT|OTP_/i.test(action || ''),
    'approval-actions': (action) => /APPROVAL/i.test(action || ''),
    'deleted-records': (action) => /DELETE|DEACTIVAT|REMOVED|ARCHIVED/i.test(action || ''),
    'login-history': (action) => /LOGIN|LOGOUT/i.test(action || '') && !/FAIL|LOCK|UNKNOWN|OTP_/i.test(action || ''),
    'failed-logins': (action) => /LOGIN_LOCK|OTP_|UNKNOWN|FAIL/i.test(action || ''),
}

export const filterRowsForLogType = (rows, logType) => {
    const pred = ACTION_FILTERS[logType] || ACTION_FILTERS['audit-logs']
    return rows.filter((row) => pred(row.action))
}

export const cacheLiveAuditRows = (rows) => {
    try {
        sessionStorage.setItem(CACHE_KEY, JSON.stringify(Array.isArray(rows) ? rows : []))
    } catch {
        /* ignore quota */
    }
}

export const readCachedLiveAuditRows = () => {
    try {
        const raw = sessionStorage.getItem(CACHE_KEY)
        if (!raw) return []
        const parsed = JSON.parse(raw)
        return Array.isArray(parsed) ? parsed : []
    } catch {
        return []
    }
}

export const getCachedLiveAuditById = (id) => {
    const want = String(id || '')
    return readCachedLiveAuditRows().find((row) => String(row.id) === want) || null
}

export const listLiveAuditLogsApi = async () => {
    const rows = await apiRequest('/audit-logs')
    return Array.isArray(rows) ? rows : []
}

export const getLiveAuditLogApi = async (id) => apiRequest(`/audit-logs/${encodeURIComponent(id)}`)
