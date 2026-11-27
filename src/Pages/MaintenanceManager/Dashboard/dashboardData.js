import { getAnnouncementsForRole } from '../../../Common/Announcement/announcementData'
import { ensureSeed } from '../../../Common/demoDomain/storage'
import { hydrateCampusKey, usesCampusApiForKey } from '../../../services/campusJsonStore'
import {
    getSupportTickets,
    hydrateSupportTicketsFromApi,
    isTicketOpenStatus,
} from '../../ITSupportManager/SupportTickets/supportTicketsData'
import {
    MAINT_CHECKLIST_KEY,
    MAINT_CHECKLIST_SEED,
    MAINT_DUTY_KEY,
    MAINT_DUTY_SEED,
    MAINT_INVENTORY_KEY,
    MAINT_INVENTORY_SEED,
    MAINT_PROCUREMENT_KEY,
    MAINT_PROCUREMENT_SEED,
    MAINT_REQUEST_KEY,
    MAINT_REQUEST_SEED,
    MAINT_REQUIREMENT_KEY,
    MAINT_REQUIREMENT_SEED,
    MAINT_SCHEDULE_KEY,
    MAINT_SCHEDULE_SEED,
} from '../maintenanceOpsData'
import { STORE_PRODUCT_REQUESTS_KEY } from '../../../Common/Store/RequestProductFromStore'

const FACILITIES_DEPARTMENT = 'Facilities'

const isOpenOpsStatus = (status) => {
    const value = String(status || '').toLowerCase()
    return value !== 'closed' && value !== 'resolved' && value !== 'completed' && value !== 'verified' && value !== 'issued' && value !== 'returned' && value !== 'fulfilled' && value !== 'rejected'
}

const getMaintRows = (key, seed) => ensureSeed(key, seed)

export function buildMaintenanceDashboard() {
    const tickets = getSupportTickets().filter(
        (row) => String(row.department || '') === FACILITIES_DEPARTMENT,
    )
    const duties = getMaintRows(MAINT_DUTY_KEY, MAINT_DUTY_SEED)
    const schedules = getMaintRows(MAINT_SCHEDULE_KEY, MAINT_SCHEDULE_SEED)
    const checklists = getMaintRows(MAINT_CHECKLIST_KEY, MAINT_CHECKLIST_SEED)
    const materials = getMaintRows(MAINT_INVENTORY_KEY, MAINT_INVENTORY_SEED)
    // Legacy maint-requests plus Maintenance rows in the shared Store workflow.
    const storeRequests = [
        ...getMaintRows(MAINT_REQUEST_KEY, MAINT_REQUEST_SEED),
        ...ensureSeed(STORE_PRODUCT_REQUESTS_KEY, []).filter((row) => row.department === 'Maintenance'),
    ]
    const requirements = getMaintRows(MAINT_REQUIREMENT_KEY, MAINT_REQUIREMENT_SEED)
    const procurement = getMaintRows(MAINT_PROCUREMENT_KEY, MAINT_PROCUREMENT_SEED)
    const notices = getAnnouncementsForRole('maintenancemanager')

    const openTickets = tickets.filter((row) => isTicketOpenStatus(row.status))
    const openDuties = duties.filter((row) => isOpenOpsStatus(row.status))
    const activeSchedules = schedules.filter((row) => String(row.status || '') === 'Active')
    const pendingChecklists = checklists.filter((row) => isOpenOpsStatus(row.status))
    const lowMaterials = materials.filter((row) => {
        const status = String(row.status || '')
        if (status === 'Low Stock' || status === 'Out of Stock') return true
        const qty = Number(row.quantity)
        const min = Number(row.minStock)
        return Number.isFinite(qty) && Number.isFinite(min) && qty <= min
    })
    const pendingStore = storeRequests.filter((row) => String(row.status || '').toLowerCase() === 'pending')
    const pendingReq = requirements.filter((row) => isOpenOpsStatus(row.status))
    const openPurchase = procurement.filter((row) => !['COMPLETED', 'REJECTED'].includes(String(row.status || '')))

    const recentDuties = [...duties]
        .sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')))
        .slice(0, 6)
    const recentChecklists = [...checklists]
        .sort((a, b) => String(b.dueDate || b.completedDate || '').localeCompare(String(a.dueDate || a.completedDate || '')))
        .slice(0, 6)
    const recentTickets = [...tickets]
        .sort((a, b) => String(b.createdAt || b.date || '').localeCompare(String(a.createdAt || a.date || '')))
        .slice(0, 6)

    return {
        summaryCards: [
            { label: 'Facilities Tickets', value: String(tickets.length), sub: 'Department inbox', to: '/maintenance-manager/tickets' },
            { label: 'Open Tickets', value: String(openTickets.length), sub: 'Awaiting action', to: '/maintenance-manager/tickets' },
            { label: 'Open Duties', value: String(openDuties.length), sub: 'Duty allotment', to: '/maintenance-manager/duty-allotment' },
            { label: 'Active Schedules', value: String(activeSchedules.length), sub: 'Preventive cadence', to: '/maintenance-manager/schedules' },
            { label: 'Pending Checklists', value: String(pendingChecklists.length), sub: 'Not yet verified', to: '/maintenance-manager/checklists' },
            { label: 'Low Materials', value: String(lowMaterials.length), sub: 'Dept-held spares', to: '/maintenance-manager/materials' },
            { label: 'Store Requests', value: String(pendingStore.length), sub: 'Pending Store', to: '/maintenance-manager/store-requests' },
            { label: 'Purchase Open', value: String(openPurchase.length + pendingReq.length), sub: 'Requirement / PO path', to: '/maintenance-manager/purchase-workflow' },
            { label: 'Announcements', value: String(notices.length), sub: 'Dept broadcasts', to: '/maintenance-manager/broadcast' },
        ],
        recentTickets: recentTickets.map((row) => ({
            ticketId: row.ticketId || row.id,
            subject: row.subject || row.title || 'Ticket',
            priority: row.priority || '—',
            status: row.status || '—',
        })),
        recentDuties: recentDuties.map((row) => ({
            id: row.id,
            staff: row.staff || '—',
            dutyType: row.dutyType || '—',
            status: row.status || '—',
        })),
        recentChecklists: recentChecklists.map((row) => ({
            id: row.id,
            title: row.title || 'Checklist',
            staff: row.staff || '—',
            status: row.status || '—',
        })),
    }
}

export async function hydrateMaintenanceDashboardFromApi() {
    const tasks = [hydrateSupportTicketsFromApi()]
    const keyed = [
        [MAINT_DUTY_KEY, MAINT_DUTY_SEED],
        [MAINT_SCHEDULE_KEY, MAINT_SCHEDULE_SEED],
        [MAINT_CHECKLIST_KEY, MAINT_CHECKLIST_SEED],
        [MAINT_INVENTORY_KEY, MAINT_INVENTORY_SEED],
        [MAINT_REQUEST_KEY, MAINT_REQUEST_SEED],
        [MAINT_REQUIREMENT_KEY, MAINT_REQUIREMENT_SEED],
        [MAINT_PROCUREMENT_KEY, MAINT_PROCUREMENT_SEED],
        [STORE_PRODUCT_REQUESTS_KEY, []],
    ]
    keyed.forEach(([key, seed]) => {
        if (usesCampusApiForKey(key)) tasks.push(hydrateCampusKey(key, seed))
    })
    await Promise.all(tasks)
    return buildMaintenanceDashboard()
}
