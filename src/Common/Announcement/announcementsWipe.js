import { STORAGE_KEY } from './announcementData'

const WIPE_FLAG = 'schoolerp-announcements-wipe-v1'

/** One-time clear of legacy dummy announcement seed data. */
export const runAnnouncementsWipeIfNeeded = () => {
    try {
        if (typeof localStorage === 'undefined') return
        if (localStorage.getItem(WIPE_FLAG) === '1') return

        localStorage.removeItem(STORAGE_KEY)
        localStorage.setItem(WIPE_FLAG, '1')
    } catch {
        /* ignore */
    }
}
