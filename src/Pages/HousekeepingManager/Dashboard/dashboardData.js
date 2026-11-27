import { getAnnouncementsForRole } from '../../../Common/Announcement/announcementData'
import { getDuties } from '../../../Common/demoDomain/housekeeping'
import { ensureSeed } from '../../../Common/demoDomain/storage'
import { hydrateCampusKey, usesCampusApiForKey } from '../../../services/campusJsonStore'
import {
    getSupportTickets,
    hydrateSupportTicketsFromApi,
    isTicketOpenStatus,
} from '../../ITSupportManager/SupportTickets/supportTicketsData'
import { getInventoryItems, hydrateInventoryItemsFromApi } from '../Inventory/inventoryData'
import { getRequests, hydrateRequestsFromApi } from '../RequestsApprovals/requestsData'
import { getHousekeepingTasks, hydrateHousekeepingTasksFromApi } from '../TaskManagement/taskData'

export const taskStatusBadgeColor = {
    Pending: 'bg-[#FF980033] text-[#FF9800]',
    'In Progress': 'bg-[#2196F333] text-[#2196F3]',
    Completed: 'bg-[#4CAF5033] text-[#4CAF50]',
    'In Complete': 'bg-[#FF000033] text-[#FF0000]',
}

export const requestStatusBadgeColor = {
    Pending: 'bg-[#FF980033] text-[#FF9800]',
    Approved: 'bg-[#4CAF5033] text-[#4CAF50]',
    Rejected: 'bg-[#FF000033] text-[#FF0000]',
}

const DUTY_KEY = 'schoolerp-housekeeping-duty-v1'
const CHECKLIST_KEY = 'schoolerp-housekeeping-checklists-v1'
const SCHEDULE_KEY = 'schoolerp-housekeeping-schedules-v1'
const HK_DEPARTMENT = 'Housekeeping'

const isLowStock = (item) => {
    if (item.status === 'Low Stock' || item.status === 'Out of Stock') return true
    const qty = Number(item.availableQuantity)
    const reorder = Number(item.reorderLevel)
    return Number.isFinite(qty) && Number.isFinite(reorder) && qty <= reorder
}

const taskZone = (task) => {
    const title = String(task.title || '')
    const parts = title.split('—')
    return (parts[1] || parts[0] || 'Campus').trim()
}

const isOpenTask = (task) => String(task.status || '') !== 'Completed'
const isOpenChecklist = (row) => {
    const value = String(row.status || '').toLowerCase()
    return !['completed', 'verified'].includes(value)
}

export function buildHousekeepingDashboard() {
    const items = getInventoryItems()
    const tasks = getHousekeepingTasks()
    const requests = getRequests()
    const duties = getDuties()
    const checklists = ensureSeed(CHECKLIST_KEY, [])
    const schedules = ensureSeed(SCHEDULE_KEY, [])
    const tickets = getSupportTickets().filter((row) => String(row.department || '') === HK_DEPARTMENT)
    const notices = getAnnouncementsForRole('housekeepingmanager')
    const lowStock = items.filter(isLowStock)
    const pending = requests.filter((row) => String(row.status || '').toLowerCase() === 'pending')
    const completed = tasks.filter((task) => task.status === 'Completed')
    const pendingTasks = tasks.filter((task) => task.status === 'Pending' || task.status === 'In Complete')
    const active = tasks.filter(isOpenTask)
    const openTickets = tickets.filter((row) => isTicketOpenStatus(row.status))
    const pendingChecklists = checklists.filter(isOpenChecklist)
    const completedChecklists = checklists.filter((row) => !isOpenChecklist(row))
    const openDuties = duties.filter((row) => String(row.status || '') !== 'Completed')
    const activeSchedules = schedules.filter((row) => String(row.status || '') === 'Active')
    const onDuty = new Set(
        (duties.length ? duties : tasks.filter(isOpenTask))
            .map((row) => row.staff || row.assignedTo)
            .filter(Boolean),
    )
    const zones = new Set(completed.map(taskZone))

    return {
        summaryCards: [
            { label: 'Open Tickets', value: String(openTickets.length), sub: 'Housekeeping inbox' },
            { label: 'Checklist Pending', value: String(pendingChecklists.length), sub: `${completedChecklists.length} verified/complete` },
            { label: 'Open Duties', value: String(openDuties.length), sub: 'Duty allotment' },
            { label: 'Active Schedules', value: String(activeSchedules.length), sub: 'Cleaning cadence' },
            { label: 'Active Tasks Today', value: String(active.length), sub: 'Across all zones' },
            { label: 'Tasks Completed', value: String(completed.length), sub: 'In current store' },
            { label: 'Pending Tasks', value: String(pendingTasks.length), sub: 'Still open' },
            { label: 'Low Stock Items', value: String(lowStock.length), sub: 'Cleaning supplies' },
            { label: 'Staff On Duty', value: String(onDuty.size), sub: duties.length ? 'Duty allotment' : 'From open tasks' },
            { label: 'Pending Requests', value: String(pending.length), sub: 'Awaiting approval' },
            { label: 'Zones Inspected', value: String(zones.size), sub: 'Completed task zones' },
        ],
        recentTasks: tasks.slice(0, 4).map((task) => ({
            taskId: task.taskId,
            title: task.title,
            assignedTo: task.assignedTo,
            status: task.status === 'In Complete' ? 'Pending' : task.status,
        })),
        lowStockItems: lowStock.slice(0, 6).map((item) => ({
            item: item.productName,
            availableQty: String(item.availableQuantity ?? 0),
            reorderLevel: String(item.reorderLevel ?? 0),
        })),
        pendingRequests: pending.slice(0, 6).map((row) => ({
            requestId: row.requestId,
            type: row.requestType || row.title || 'Request',
            status: row.status,
        })),
        recentAnnouncements: notices.slice(0, 4).map((row) => ({
            title: row.title,
            date: row.announcementDate || row.date || '',
        })),
        recentTickets: tickets.slice(0, 4).map((row) => ({
            ticketId: row.ticketId || row.id,
            subject: row.subject || row.title || 'Ticket',
            status: row.status || '—',
        })),
        recentChecklists: checklists.slice(0, 4).map((row) => ({
            id: row.id,
            title: row.title || 'Checklist',
            status: row.status || '—',
        })),
    }
}

export async function hydrateHousekeepingDashboardFromApi() {
    const tasks = [
        hydrateInventoryItemsFromApi(),
        hydrateHousekeepingTasksFromApi(),
        hydrateRequestsFromApi(),
        hydrateSupportTicketsFromApi(),
    ]
    if (usesCampusApiForKey(DUTY_KEY)) tasks.push(hydrateCampusKey(DUTY_KEY, []))
    if (usesCampusApiForKey(CHECKLIST_KEY)) tasks.push(hydrateCampusKey(CHECKLIST_KEY, []))
    if (usesCampusApiForKey(SCHEDULE_KEY)) tasks.push(hydrateCampusKey(SCHEDULE_KEY, []))
    await Promise.all(tasks)
    return buildHousekeepingDashboard()
}

const FALLBACK = buildHousekeepingDashboard()

export const SUMMARY_CARDS = FALLBACK.summaryCards
export const RECENT_TASKS = FALLBACK.recentTasks
export const LOW_STOCK_ITEMS = FALLBACK.lowStockItems
export const PENDING_REQUESTS = FALLBACK.pendingRequests
export const RECENT_ANNOUNCEMENTS = FALLBACK.recentAnnouncements
