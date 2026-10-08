import { loadJson, saveJson } from './storage'

export const ACTIVITY_LOG_KEY = 'schoolerp-system-activity-log-v1'

const seed = [
    {
        id: 'LOG-2026-0001',
        actor: 'System',
        role: 'Demo',
        action: 'SEED',
        module: 'Activity Log',
        recordId: '',
        timestamp: '2026-09-01T09:00:00.000Z',
        details: 'Demo activity log initialised.',
    },
]

export function getActivityLogs() {
    const stored = loadJson(ACTIVITY_LOG_KEY, null)
    if (!Array.isArray(stored)) {
        saveJson(ACTIVITY_LOG_KEY, seed)
        return [...seed]
    }
    return stored
}

export function logActivity({ actor = 'Demo User', role = '', action, module, recordId = '', details = '', before, after, reason }) {
    try {
        const logs = getActivityLogs()
        const entry = {
            id: `LOG-${Date.now()}`,
            actor,
            role,
            action,
            module,
            recordId,
            timestamp: new Date().toISOString(),
            details,
            ...(before !== undefined ? { before } : {}),
            ...(after !== undefined ? { after } : {}),
            ...(reason ? { reason } : {}),
        }
        const next = [entry, ...logs].slice(0, 400)
        saveJson(ACTIVITY_LOG_KEY, next)
        return entry
    } catch (error) {
        console.error('Failed to write activity log', error)
        return null
    }
}

export function deviceLabel() {
    const width = typeof window !== 'undefined' ? window.innerWidth : 1200
    if (width < 768) return 'Mobile Browser'
    if (width < 1024) return 'Tablet Browser'
    return 'Desktop Browser'
}
