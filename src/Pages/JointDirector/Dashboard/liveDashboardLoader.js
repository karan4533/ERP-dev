import { ROLES } from '../../../constants/roles'
import {
    getAnnouncementsForRole,
    hydrateAnnouncementsFromApi,
} from '../../../Common/Announcement/announcementData'
import { IT_TICKETS_KEY, hydrateTicketsFromApi } from '../../../Common/demoDomain/itTickets'
import { loadJson } from '../../../Common/demoDomain/storage'
import { canUseEmployeeDirectoryApi, loadEmployeeDirectory } from '../../../services/employeeDirectoryApi'
import { getCampusMemory, loadCampusJson, usesCampusApiForKey } from '../../../services/campusJsonStore'
import { ORDERS_STORAGE_KEY, hydrateOrdersFromApi } from '../../CanteenManager/Orders/ordersData'
import {
    INVENTORY_ITEMS_STORAGE_KEY,
    hydrateInventoryItemsFromApi as hydrateStationeryInventoryFromApi,
} from '../../StationeryStoreManager/Inventory/inventoryData'
import {
    VEHICLES_STORAGE_KEY,
    hydrateVehiclesFromApi,
} from '../../TransportManager/VehicleManagement/vehicleManagementData'
import {
    ASSETS_STORAGE_KEY,
    DEPARTMENTS as OPS_DEPARTMENTS,
    hydrateJdAssetsFromApi,
} from '../AssetsInventory/assetsInventoryData'
import { ESCALATIONS_STORAGE_KEY, hydrateJdEscalationsFromApi } from '../Escalations/escalationData'
import {
    REQUESTS_STORAGE_KEY,
    formatAmount,
    hydrateRequestsFromApi,
} from '../RequestApprovals/requestApprovalData'
import { TASKS_STORAGE_KEY, hydrateJdTasksFromApi } from '../TaskManagement/taskData'

/** Read live rows without seeding offline DEFAULT_* arrays into localStorage. */
const readCampusRows = (storageKey) => {
    if (usesCampusApiForKey(storageKey)) {
        const mem = getCampusMemory(storageKey)
        return Array.isArray(mem) ? mem : []
    }
    const rows = loadCampusJson(storageKey, [])
    return Array.isArray(rows) ? rows : []
}

const readTickets = () => {
    if (usesCampusApiForKey(IT_TICKETS_KEY)) {
        const mem = getCampusMemory(IT_TICKETS_KEY)
        return Array.isArray(mem) ? mem : []
    }
    return loadJson(IT_TICKETS_KEY, [])
}

const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const ASSIGNEE_TO_DEPT = {
    'Canteen Manager': 'Canteen',
    'Store Manager': 'Stationery Store',
    'Tech Team Manager': 'IT Support',
    'Transport Manager': 'Transport',
    'House Keeping Manager': 'Housekeeping',
    'Joint Director Assistant': 'Joint Director Office',
}

const OPEN_ESCALATION = new Set(['Open', 'In Review', 'Escalated to Admin'])
const PENDING_TASK = new Set(['Pending', 'In Progress', 'In Complete'])
const OPEN_TICKET = new Set(['Open', 'In Progress', 'Assigned', 'Pending'])
const CRITICAL_PRIORITY = new Set(['Critical', 'High', 'Urgent'])

const parseDmy = (value) => {
    const match = String(value || '').match(/(\d{1,2})-(\d{1,2})-(\d{4})/)
    if (match) return new Date(Number(match[3]), Number(match[2]) - 1, Number(match[1]))
    const iso = Date.parse(value)
    return Number.isFinite(iso) ? new Date(iso) : null
}

const startOfDay = (date) => {
    const next = new Date(date)
    next.setHours(0, 0, 0, 0)
    return next
}

const isSameDay = (left, right) => startOfDay(left).getTime() === startOfDay(right).getTime()

const weekdayIndex = (date) => {
    const day = date.getDay()
    return day === 0 ? 6 : day - 1
}

const emptyWeekSeries = () => Array(7).fill(0)

const countByWeekday = (rows, getDate) => {
    const series = emptyWeekSeries()
    const today = startOfDay(new Date())
    const weekStart = new Date(today)
    weekStart.setDate(today.getDate() - weekdayIndex(today))
    rows.forEach((row) => {
        const date = parseDmy(getDate(row))
        if (!date) return
        const day = startOfDay(date)
        const diff = Math.round((day.getTime() - weekStart.getTime()) / 86400000)
        if (diff < 0 || diff > 6) return
        series[diff] += 1
    })
    return series
}

const isCriticalAsset = (item) => String(item?.status || '').toLowerCase() === 'critical'
const isLowStockAsset = (item) => {
    if (!isCriticalAsset(item)) return false
    const alert = String(item?.alertType || '').toLowerCase()
    return alert.includes('low') || alert.includes('out') || Number(item?.currentQuantity) <= Number(item?.reorderLevel || 0)
}

const maintenanceWithinDays = (item, days = 7) => {
    const due = parseDmy(item?.maintenanceDue || item?.nextServiceDate)
    if (!due) return false
    const today = startOfDay(new Date())
    const limit = new Date(today)
    limit.setDate(today.getDate() + days)
    const dueDay = startOfDay(due)
    return dueDay.getTime() >= today.getTime() && dueDay.getTime() <= limit.getTime()
}

const deptOfTask = (task) => ASSIGNEE_TO_DEPT[task?.assignedTo] || 'Other'

const inventoryValue = (items) =>
    items.reduce((sum, item) => {
        const qty = Number(item.quantity ?? item.currentStock ?? item.currentQuantity ?? 0) || 0
        const price = Number(item.unitPrice ?? item.price ?? item.rate ?? 0) || 0
        return sum + qty * price
    }, 0)

export const emptyJdDashboardView = () => ({
    kpiCards: [
        { label: 'Total Employees', value: '0', sub: 'Across all departments' },
        { label: 'Active Departments', value: String(OPS_DEPARTMENTS.length), sub: 'Operational units' },
        { label: 'Pending Approvals', value: '0', sub: 'Awaiting review' },
        { label: 'Open Escalations', value: '0', sub: 'Requires attention' },
        { label: 'Pending Tasks', value: '0', sub: 'Assigned & in progress' },
        { label: 'Active Announcements', value: '0', sub: 'Live announcements' },
        { label: 'Critical Inventory Alerts', value: '0', sub: 'Low or out of stock' },
        { label: 'Critical IT Issues', value: '0', sub: 'High priority tickets' },
        { label: 'Vehicle Maintenance Due', value: '0', sub: 'Within 7 days' },
    ],
    departmentSummaries: OPS_DEPARTMENTS.map((department) => ({
        department,
        metrics: department === 'Housekeeping'
            ? [
                { label: 'Pending Tasks', value: '0' },
                { label: 'Completed Tasks', value: '0' },
            ]
            : department === 'IT Support'
                ? [
                    { label: 'Open Tickets', value: '0' },
                    { label: 'Critical Tickets', value: '0' },
                ]
                : department === 'Transport'
                    ? [
                        { label: 'Active Vehicles', value: '0' },
                        { label: 'Maintenance Due', value: '0' },
                    ]
                    : department === 'Stationery Store'
                        ? [
                            { label: 'Inventory Value', value: '₹0' },
                            { label: 'Low Stock Items', value: '0' },
                            { label: 'Pending Requests', value: '0' },
                        ]
                        : [
                            { label: 'Orders Today', value: '0' },
                            { label: 'Low Stock Items', value: '0' },
                            { label: 'Pending Requests', value: '0' },
                        ],
    })),
    pendingApprovals: [],
    criticalAlerts: [],
    recentEscalations: [],
    operationsTrend: {
        labels: WEEKDAY_LABELS,
        approvals: emptyWeekSeries(),
        escalations: emptyWeekSeries(),
        tasks: emptyWeekSeries(),
    },
    approvalsByDepartment: OPS_DEPARTMENTS.map((department) => ({ department, amount: 0 })),
    escalationsByPriority: [
        { name: 'Critical', value: 0 },
        { name: 'High', value: 0 },
        { name: 'Medium', value: 0 },
        { name: 'Low', value: 0 },
    ],
    alertsByDepartment: OPS_DEPARTMENTS.map((department) => ({ department, count: 0 })),
    departmentWorkload: OPS_DEPARTMENTS.map((department) => ({
        department,
        pendingTasks: 0,
        openTickets: 0,
        lowStock: 0,
    })),
})

/**
 * Hydrate JD campus collections (+ related ops stores) and build a live dashboard snapshot.
 * Empty collections yield zeros / empty tables — never synthetic REQ-* rows.
 */
export async function loadLiveJdDashboard(roleKey = ROLES.JOINT_DIRECTOR) {
    const settled = await Promise.allSettled([
        hydrateJdTasksFromApi(),
        hydrateRequestsFromApi(),
        hydrateJdEscalationsFromApi(),
        hydrateJdAssetsFromApi(),
        hydrateTicketsFromApi(),
        hydrateOrdersFromApi(),
        hydrateStationeryInventoryFromApi(),
        hydrateVehiclesFromApi(),
        hydrateAnnouncementsFromApi().catch(() => []),
        canUseEmployeeDirectoryApi()
            ? loadEmployeeDirectory().then((d) => d.records?.length ?? 0).catch(() => 0)
            : Promise.resolve(0),
    ])

    const employeeCount = settled[9].status === 'fulfilled' ? Number(settled[9].value) || 0 : 0

    const tasks = readCampusRows(TASKS_STORAGE_KEY)
    const requests = readCampusRows(REQUESTS_STORAGE_KEY)
    const escalations = readCampusRows(ESCALATIONS_STORAGE_KEY)
    const assets = readCampusRows(ASSETS_STORAGE_KEY)
    const tickets = readTickets()
    const orders = readCampusRows(ORDERS_STORAGE_KEY)
    const stationery = readCampusRows(INVENTORY_ITEMS_STORAGE_KEY)
    const vehicles = readCampusRows(VEHICLES_STORAGE_KEY)
    const announcements = getAnnouncementsForRole(roleKey)

    const pendingRequests = requests.filter((row) => String(row.status || '') === 'Pending')
    const openEscalations = escalations.filter((row) => OPEN_ESCALATION.has(String(row.status || '')))
    const pendingTasks = tasks.filter((row) => PENDING_TASK.has(String(row.status || '')))
    const criticalInventory = assets.filter(isLowStockAsset)
    const openTickets = tickets.filter((row) => OPEN_TICKET.has(String(row.status || 'Open')))
    const criticalIt = openTickets.filter((row) => CRITICAL_PRIORITY.has(String(row.priority || '')))
    const transportAssets = assets.filter((row) => String(row.department || '') === 'Transport' || row.viewType === 'transport')
    const vehicleMaintenanceDue = [
        ...transportAssets.filter((row) => maintenanceWithinDays(row, 7)),
        ...vehicles.filter((row) => maintenanceWithinDays(row, 7)),
    ]
    const maintenanceKeys = new Set()
    vehicleMaintenanceDue.forEach((row, index) => {
        maintenanceKeys.add(String(row.id || row.vehicleNumber || row.assetProduct || `row-${index}`))
    })
    const maintenanceDueCount = maintenanceKeys.size

    const today = startOfDay(new Date())
    const ordersToday = orders.filter((order) => {
        if (String(order.orderStatus || order.status || '') === 'Cancelled') return false
        const date = parseDmy(order.orderDateTime || order.orderDate)
        return date && isSameDay(date, today)
    })

    const pendingByDept = (department) =>
        pendingRequests.filter((row) => String(row.department || '') === department).length

    const lowStockByDept = (department) =>
        criticalInventory.filter((row) => String(row.department || '') === department).length

    const tasksForDept = (department) => tasks.filter((row) => deptOfTask(row) === department)
    const stationeryValue = inventoryValue(stationery)

    const departmentSummaries = [
        {
            department: 'Canteen',
            metrics: [
                { label: 'Orders Today', value: String(ordersToday.length) },
                { label: 'Low Stock Items', value: String(lowStockByDept('Canteen')) },
                { label: 'Pending Requests', value: String(pendingByDept('Canteen')) },
            ],
        },
        {
            department: 'Stationery Store',
            metrics: [
                { label: 'Inventory Value', value: formatAmount(stationeryValue) === '—' ? '₹0' : formatAmount(stationeryValue) },
                { label: 'Low Stock Items', value: String(lowStockByDept('Stationery Store') || stationery.filter((item) => {
                    const status = String(item.status || '').toLowerCase()
                    return status.includes('low') || status.includes('out') || status.includes('critical')
                }).length) },
                { label: 'Pending Requests', value: String(pendingByDept('Stationery Store')) },
            ],
        },
        {
            department: 'Housekeeping',
            metrics: [
                { label: 'Pending Tasks', value: String(tasksForDept('Housekeeping').filter((t) => PENDING_TASK.has(String(t.status || ''))).length) },
                { label: 'Completed Tasks', value: String(tasksForDept('Housekeeping').filter((t) => String(t.status || '') === 'Completed').length) },
            ],
        },
        {
            department: 'IT Support',
            metrics: [
                { label: 'Open Tickets', value: String(openTickets.length) },
                { label: 'Critical Tickets', value: String(criticalIt.length) },
            ],
        },
        {
            department: 'Transport',
            metrics: [
                { label: 'Active Vehicles', value: String(vehicles.length || transportAssets.filter((a) => a.assetCategory === 'Vehicle').length) },
                { label: 'Maintenance Due', value: String(maintenanceDueCount) },
            ],
        },
    ]

    const pendingApprovals = pendingRequests.slice(0, 8).map((row) => ({
        requestId: row.requestId || row.id || '—',
        department: row.department || '—',
        type: row.requestType || row.type || row.purpose || 'Request',
        amount: formatAmount(row.requestedAmount),
    }))

    const criticalAlerts = [
        ...criticalInventory.slice(0, 8).map((row) => ({
            department: row.department || '—',
            alert: `${row.assetProduct || row.itemName || row.name || 'Item'}${
                Number(row.currentQuantity) === 0
                    ? ' — out of stock'
                    : ` — below reorder level (${row.currentQuantity ?? 0} left)`
            }`,
        })),
        ...criticalIt.slice(0, 3).map((row) => ({
            department: 'IT Support',
            alert: `${row.subject || row.issueType || 'IT issue'} — ${row.priority || 'Critical'}`,
        })),
        ...transportAssets.filter((row) => maintenanceWithinDays(row, 7)).slice(0, 3).map((row) => ({
            department: 'Transport',
            alert: `${row.assetProduct || 'Vehicle'} — maintenance due ${row.maintenanceDue || ''}`.trim(),
        })),
    ].slice(0, 10)

    const recentEscalations = [...openEscalations]
        .sort((a, b) => {
            const da = parseDmy(a.escalationDate)?.getTime() || 0
            const db = parseDmy(b.escalationDate)?.getTime() || 0
            return db - da
        })
        .slice(0, 8)
        .map((row) => ({
            escalationId: row.id || row.escalationId || '—',
            department: row.escalatedDepartment || row.department || '—',
            priority: row.priority || 'Medium',
        }))

    const approvalsByDepartment = OPS_DEPARTMENTS.map((department) => ({
        department,
        amount: pendingRequests
            .filter((row) => String(row.department || '') === department)
            .reduce((sum, row) => sum + (Number(row.requestedAmount) || 0), 0),
    }))

    const escalationsByPriority = ['Critical', 'High', 'Medium', 'Low'].map((name) => ({
        name,
        value: openEscalations.filter((row) => String(row.priority || '') === name).length,
    }))

    const alertsByDepartment = OPS_DEPARTMENTS.map((department) => ({
        department,
        count: criticalAlerts.filter((row) => row.department === department).length
            || criticalInventory.filter((row) => String(row.department || '') === department).length,
    }))

    const departmentWorkload = OPS_DEPARTMENTS.map((department) => ({
        department,
        pendingTasks: tasksForDept(department).filter((t) => PENDING_TASK.has(String(t.status || ''))).length,
        openTickets: department === 'IT Support' ? openTickets.length : 0,
        lowStock: lowStockByDept(department) || (department === 'Stationery Store'
            ? stationery.filter((item) => {
                const status = String(item.status || '').toLowerCase()
                return status.includes('low') || status.includes('out') || status.includes('critical')
            }).length
            : 0),
    }))

    return {
        kpiCards: [
            { label: 'Total Employees', value: String(employeeCount), sub: 'Across all departments' },
            { label: 'Active Departments', value: String(OPS_DEPARTMENTS.length), sub: 'Operational units' },
            { label: 'Pending Approvals', value: String(pendingRequests.length), sub: 'Awaiting review' },
            { label: 'Open Escalations', value: String(openEscalations.length), sub: 'Requires attention' },
            { label: 'Pending Tasks', value: String(pendingTasks.length), sub: 'Assigned & in progress' },
            { label: 'Active Announcements', value: String(announcements.length), sub: 'Live announcements' },
            { label: 'Critical Inventory Alerts', value: String(criticalInventory.length), sub: 'Low or out of stock' },
            { label: 'Critical IT Issues', value: String(criticalIt.length), sub: 'High priority tickets' },
            { label: 'Vehicle Maintenance Due', value: String(maintenanceDueCount), sub: 'Within 7 days' },
        ],
        departmentSummaries,
        pendingApprovals,
        criticalAlerts,
        recentEscalations,
        operationsTrend: {
            labels: WEEKDAY_LABELS,
            approvals: countByWeekday(pendingRequests, (row) => row.requestDate),
            escalations: countByWeekday(openEscalations, (row) => row.escalationDate),
            tasks: countByWeekday(pendingTasks, (row) => row.assignedDate || row.dueDate),
        },
        approvalsByDepartment,
        escalationsByPriority,
        alertsByDepartment,
        departmentWorkload,
    }
}
