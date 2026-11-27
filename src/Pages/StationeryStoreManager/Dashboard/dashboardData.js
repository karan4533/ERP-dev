import { getAnnouncementsForRole } from '../../../Common/Announcement/announcementData'
import { getInventoryItems, hydrateInventoryItemsFromApi } from '../Inventory/inventoryData'
import { getIssueReturns, hydrateIssueReturnsFromApi } from '../IssueReturns/issueReturnsData'
import { getRequests, hydrateRequestsFromApi } from '../RequestsApprovals/requestsData'

export const requestStatusBadgeColor = {
    Pending: 'bg-[#FF980033] text-[#FF9800]',
    Approved: 'bg-[#4CAF5033] text-[#4CAF50]',
    Rejected: 'bg-[#FF000033] text-[#FF0000]',
}

const parseLooseDate = (value) => {
    const raw = String(value || '').trim()
    if (!raw || raw === '—') return null
    const parts = raw.split(/[-/]/)
    if (parts.length === 3) {
        const [a, b, c] = parts.map(Number)
        if (String(parts[0]).length === 4) return new Date(a, b - 1, c)
        if (String(parts[2]).length === 4) return new Date(c, b - 1, a)
    }
    const dt = new Date(raw)
    return Number.isNaN(dt.getTime()) ? null : dt
}

const isSameMonth = (value, ref = new Date()) => {
    const dt = parseLooseDate(value)
    return Boolean(dt && dt.getMonth() === ref.getMonth() && dt.getFullYear() === ref.getFullYear())
}

const parseMoney = (value) => Number(String(value ?? '').replace(/[^\d.]/g, '')) || 0

const formatInr = (value) => `₹${Number(value || 0).toLocaleString('en-IN')}`

const isLowStock = (item) => {
    if (item.status === 'Low Stock' || item.status === 'Out of Stock') return item.status === 'Low Stock'
    const qty = Number(item.availableQuantity)
    const reorder = Number(item.reorderLevel)
    return Number.isFinite(qty) && Number.isFinite(reorder) && qty > 0 && qty <= reorder
}

const isOutOfStock = (item) => {
    if (item.status === 'Out of Stock') return true
    return Number(item.availableQuantity) <= 0
}

const periodLabel = () => new Date().toLocaleString('en-IN', { month: 'long', year: 'numeric' })

export function buildStationeryDashboard() {
    const items = getInventoryItems()
    const movements = getIssueReturns()
    const requests = getRequests()
    const notices = getAnnouncementsForRole('stationerystoremanager')
    const lowStock = items.filter(isLowStock)
    const outOfStock = items.filter(isOutOfStock)
    const pending = requests.filter((row) => String(row.status || '').toLowerCase() === 'pending')
    const issuedThisMonth = movements.filter((row) => row.activityType === 'Issue' && isSameMonth(row.issueDate))
    const returnedThisMonth = movements.filter((row) => row.activityType === 'Return' && isSameMonth(row.returnDate || row.issueDate))
    const inventoryValue = items.reduce((sum, item) => {
        if (item.stockValue) return sum + parseMoney(item.stockValue)
        return sum + parseMoney(item.unitCost) * (Number(item.availableQuantity) || 0)
    }, 0)
    const categories = new Set(items.map((item) => item.category).filter(Boolean))

    return {
        summaryCards: [
            { label: 'Total Inventory Items', value: String(items.length), sub: `Across ${categories.size} categories` },
            { label: 'Low Stock Items', value: String(lowStock.length), sub: 'Below reorder level' },
            { label: 'Out of Stock Items', value: String(outOfStock.length), sub: 'Needs immediate restock' },
            { label: 'Pending Requests', value: String(pending.length), sub: 'Awaiting approval' },
            { label: 'Items Issued This Month', value: String(issuedThisMonth.reduce((sum, row) => sum + (Number(row.quantity) || 0), 0)), sub: periodLabel() },
            { label: 'Items Returned This Month', value: String(returnedThisMonth.reduce((sum, row) => sum + (Number(row.quantity) || 0), 0)), sub: periodLabel() },
            { label: 'Total Inventory Value', value: formatInr(inventoryValue), sub: 'Current stock value' },
        ],
        recentIssues: movements
            .filter((row) => row.activityType === 'Issue')
            .slice(0, 4)
            .map((row) => ({
                issueId: row.id,
                requestedBy: row.requestedBy,
                department: row.department,
                date: row.issueDate,
            })),
        lowStockItems: [...lowStock, ...outOfStock].slice(0, 6).map((item) => ({
            item: item.itemName,
            availableQty: String(item.availableQuantity ?? 0),
            reorderLevel: String(item.reorderLevel ?? 0),
        })),
        pendingRequests: pending.slice(0, 6).map((row) => ({
            requestId: row.requestId,
            type: row.requestType || row.title || 'Request',
            status: row.status,
        })),
        recentNotices: notices.slice(0, 4).map((row) => ({
            title: row.title,
            date: row.announcementDate || row.date || '',
        })),
    }
}

export async function hydrateStationeryDashboardFromApi() {
    await Promise.all([
        hydrateInventoryItemsFromApi(),
        hydrateIssueReturnsFromApi(),
        hydrateRequestsFromApi(),
    ])
    return buildStationeryDashboard()
}

const FALLBACK = buildStationeryDashboard()

export const SUMMARY_CARDS = FALLBACK.summaryCards
export const RECENT_ISSUES = FALLBACK.recentIssues
export const LOW_STOCK_ITEMS = FALLBACK.lowStockItems
export const PENDING_REQUESTS = FALLBACK.pendingRequests
export const RECENT_NOTICES = FALLBACK.recentNotices
