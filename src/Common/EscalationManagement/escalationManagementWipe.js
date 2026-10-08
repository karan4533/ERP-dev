import {
    ESCALATION_LEGACY_STORAGE_PREFIX,
    ESCALATION_STORAGE_KEY,
} from './escalationData'
import { ESCALATION_ROLE_CONFIG } from './escalationRoleConfig'

const WIPE_FLAG = 'schoolerp-escalation-management-wipe-v2'

/** One-time clear of legacy escalation management dummy/seed data. */
export const runEscalationManagementWipeIfNeeded = () => {
    try {
        if (typeof localStorage === 'undefined') return
        if (localStorage.getItem(WIPE_FLAG) === '1') return

        localStorage.removeItem(ESCALATION_STORAGE_KEY)
        Object.keys(ESCALATION_ROLE_CONFIG).forEach((roleKey) => {
            localStorage.removeItem(`${ESCALATION_LEGACY_STORAGE_PREFIX}${roleKey}`)
        })
        localStorage.setItem(ESCALATION_STORAGE_KEY, '[]')
        localStorage.setItem(WIPE_FLAG, '1')
    } catch {
        /* ignore */
    }
}
