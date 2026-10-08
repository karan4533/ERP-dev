import { STORAGE_KEY } from './taskManagementData'

const WIPE_FLAG = 'schoolerp-task-management-wipe-v1'

/** One-time clear of legacy task management dummy/seed data. */
export const runTaskManagementWipeIfNeeded = () => {
    try {
        if (typeof localStorage === 'undefined') return
        if (localStorage.getItem(WIPE_FLAG) === '1') return

        localStorage.removeItem(STORAGE_KEY)
        localStorage.setItem(WIPE_FLAG, '1')
    } catch {
        /* ignore */
    }
}
