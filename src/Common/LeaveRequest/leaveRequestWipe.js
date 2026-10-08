import { STORAGE_KEY } from './leaveRequestData'

const WIPE_FLAG = 'schoolerp-leave-requests-wipe-v1'
const MIGRATION_FLAG = 'schoolerp-leave-requests-migrated-v2'
const SESSION_MIGRATION_FLAG = 'schoolerp-leave-requests-session-migrated-v1'

const LEGACY_STORAGE_KEYS = [
    'schoolerp-admin-leave-requests',
    'schoolerp-gatekeeper-leave-requests',
    'schoolerp-gatekeeper-manager-leave-requests',
]

const clearKey = (storage, key) => {
    try {
        storage?.removeItem(key)
    } catch {
        /* ignore */
    }
}

/** One-time clear of all legacy leave request seed/dummy data. */
export const runLeaveRequestWipeIfNeeded = () => {
    try {
        const storages = [typeof localStorage !== 'undefined' ? localStorage : null, typeof sessionStorage !== 'undefined' ? sessionStorage : null].filter(Boolean)
        if (storages.length === 0) return
        if (localStorage?.getItem(WIPE_FLAG) === '1') return

        storages.forEach((storage) => {
            clearKey(storage, STORAGE_KEY)
            LEGACY_STORAGE_KEYS.forEach((key) => clearKey(storage, key))
            clearKey(storage, MIGRATION_FLAG)
            clearKey(storage, SESSION_MIGRATION_FLAG)
        })

        localStorage?.setItem(WIPE_FLAG, '1')
    } catch {
        /* ignore */
    }
}
