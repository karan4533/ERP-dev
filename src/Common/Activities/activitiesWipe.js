const WIPE_FLAG = 'schoolerp-activities-wipe-v1'

const ACTIVITIES_STORAGE_KEY = 'school-erp-activities'

/** One-time clear of Cultural, Sports & Competition activity seed data. */
export const runActivitiesWipeIfNeeded = () => {
    try {
        if (typeof localStorage === 'undefined') return
        if (localStorage.getItem(WIPE_FLAG) === '1') return

        localStorage.removeItem(ACTIVITIES_STORAGE_KEY)
        localStorage.setItem(WIPE_FLAG, '1')
    } catch {
        /* ignore */
    }
}
