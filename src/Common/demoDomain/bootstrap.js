import { ensureTodayOccurrences } from './housekeeping'
import { scanDueNotifications } from './financeExtras'
import { getInventory } from './inventory'
import { getTickets } from './itTickets'
import { getApprovers, getClosureRules } from './governance'

export function bootstrapDemoStores() {
    try {
        ensureTodayOccurrences(new Date())
        scanDueNotifications()
        getInventory()
        getTickets()
        getApprovers()
        getClosureRules()
    } catch (error) {
        console.error('Demo store bootstrap failed', error)
    }
}
