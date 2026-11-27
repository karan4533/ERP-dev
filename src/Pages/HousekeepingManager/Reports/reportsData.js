import { getInventoryItems, hydrateInventoryItemsFromApi } from '../Inventory/inventoryData'
import { getHousekeepingTasks, hydrateHousekeepingTasksFromApi } from '../TaskManagement/taskData'

export const REPORT_TYPES = [
    'Task Completion Report',
    'Supply Usage Report',
    'Zone Cleaning Report',
    'Low Stock Report',
]

const periodLabel = () => new Date().toLocaleString('en-IN', { month: 'long', year: 'numeric' })

const taskZone = (task) => {
    const title = String(task.title || '')
    const parts = title.split('—')
    return (parts[1] || parts[0] || 'Campus').trim()
}

const isLowOrOut = (item) => {
    if (item.status === 'Low Stock' || item.status === 'Out of Stock') return true
    const qty = Number(item.availableQuantity)
    const reorder = Number(item.reorderLevel)
    return Number.isFinite(qty) && Number.isFinite(reorder) && qty <= reorder
}

export function buildHousekeepingReports() {
    const items = getInventoryItems()
    const tasks = getHousekeepingTasks()
    const period = periodLabel()

    const taskCompletion = tasks.map((task) => ({
        task: task.title,
        assignedTo: task.assignedTo || '—',
        zone: taskZone(task),
        completed: task.status === 'Completed' ? 'Yes' : 'No',
        date: task.dueDate || task.assignedDate || '',
    }))

    const supplyUsage = items.map((item) => ({
        item: item.productName,
        quantityUsed: Number(item.availableQuantity) || 0,
        zone: item.category || 'Housekeeping',
        period: item.lastPurchaseDate || item.purchaseDate || period,
    }))

    const zoneCleaning = tasks.map((task) => ({
        zone: taskZone(task),
        lastCleaned: task.dueDate || task.assignedDate || '',
        status: task.status === 'In Complete' ? 'Pending' : task.status,
        staff: task.assignedTo || '—',
    }))

    const lowStock = items.filter(isLowOrOut).map((item) => ({
        item: item.productName,
        currentQty: Number(item.availableQuantity) || 0,
        reorderLevel: Number(item.reorderLevel) || 0,
    }))

    return {
        taskCompletion,
        supplyUsage,
        zoneCleaning,
        lowStock,
    }
}

export async function hydrateHousekeepingReportsFromApi() {
    await Promise.all([
        hydrateInventoryItemsFromApi(),
        hydrateHousekeepingTasksFromApi(),
    ])
    return buildHousekeepingReports()
}

const FALLBACK = buildHousekeepingReports()

export const TASK_COMPLETION_REPORT = FALLBACK.taskCompletion
export const SUPPLY_USAGE_REPORT = FALLBACK.supplyUsage
export const ZONE_CLEANING_REPORT = FALLBACK.zoneCleaning
export const LOW_STOCK_REPORT = FALLBACK.lowStock
