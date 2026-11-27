import { getAnnouncementsForRole, hydrateAnnouncementsFromApi } from '../../../Common/Announcement/announcementData'
import {
    deriveInventoryStatus,
    getInventoryItems,
    hydrateInventoryItemsFromApi,
} from '../Inventory/inventoryData'
import { getMenuItems, hydrateMenuItemsFromApi } from '../MenuManagement/menuData'
import { getOrders, hydrateOrdersFromApi } from '../Orders/ordersData'
import { getRequests, hydrateRequestsFromApi } from '../RequestsApprovals/requestsData'

export const QUICK_ACTIONS = [
    { label: 'New Order', to: '/canteen-manager/orders/add-order' },
    { label: 'Add Inventory', to: '/canteen-manager/inventory' },
    { label: 'Create Request', to: '/canteen-manager/requests-approvals/add-request' },
    { label: 'Send Announcement', to: '/canteen-manager/broadcast/add-broadcast' },
    { label: 'View Reports', to: '/canteen-manager/reports' },
]

export const orderStatusBadgeColor = {
    Preparing: 'bg-[#2196F333] text-[#2196F3]',
    Ready: 'bg-[#FF980033] text-[#FF9800]',
    Completed: 'bg-[#4CAF5033] text-[#4CAF50]',
    Cancelled: 'bg-[#FF000033] text-[#FF0000]',
}

export const requestStatusBadgeColor = {
    Pending: 'bg-[#FF980033] text-[#FF9800]',
    Approved: 'bg-[#4CAF5033] text-[#4CAF50]',
    Rejected: 'bg-[#FF000033] text-[#FF0000]',
}

const OPEN_ORDER_STATUSES = new Set(['Preparing', 'Ready'])
const LOW_STOCK_STATUSES = new Set(['Low Stock', 'Critical'])
const TYPE_COLORS = { Student: '#515DEF', Staff: '#4CAF50', Event: '#FF9800' }

export const parseAmount = (value) => {
    if (typeof value === 'number' && Number.isFinite(value)) return value
    const n = Number(String(value ?? '').replace(/[₹,\s]/g, ''))
    return Number.isFinite(n) ? n : 0
}

export const formatAmount = (value) => `₹${Number(value || 0).toLocaleString('en-IN')}`

export const parseCanteenDate = (value) => {
    if (value instanceof Date && !Number.isNaN(value.getTime())) return value
    const match = String(value || '').match(/(\d{1,2})-(\d{1,2})-(\d{4})/)
    if (match) return new Date(Number(match[3]), Number(match[2]) - 1, Number(match[1]))
    const parsed = Date.parse(value)
    return Number.isFinite(parsed) ? new Date(parsed) : null
}

const startOfDay = (date) => {
    const next = new Date(date)
    next.setHours(0, 0, 0, 0)
    return next
}

const isSameDay = (left, right) => startOfDay(left).getTime() === startOfDay(right).getTime()

const orderStatus = (order) => String(order?.orderStatus || order?.status || '').trim()
const requestStatus = (request) => String(request?.status || '').trim()

export const isOpenOrder = (order) => OPEN_ORDER_STATUSES.has(orderStatus(order))

export const inventoryStatusOf = (item) => {
    const status = String(item?.status || '').trim()
    if (LOW_STOCK_STATUSES.has(status) || status === 'In Stock') return status
    return deriveInventoryStatus(item?.quantity, item?.reorderLevel)
}

export const isLowStockItem = (item) => LOW_STOCK_STATUSES.has(inventoryStatusOf(item))

const itemNameOf = (item) => {
    if (typeof item === 'string') return item
    return String(item?.itemName || item?.name || '').trim()
}

const itemQtyOf = (item) => {
    if (typeof item === 'string') return 1
    const qty = Number(item?.quantity)
    return Number.isFinite(qty) && qty > 0 ? qty : 1
}

const buildSalesChart = (orders, days) => {
    const today = startOfDay(new Date())
    const labels = []
    const revenue = []
    const counts = []
    for (let offset = days - 1; offset >= 0; offset -= 1) {
        const day = new Date(today)
        day.setDate(today.getDate() - offset)
        labels.push(
            days <= 7
                ? day.toLocaleDateString('en-IN', { weekday: 'short' })
                : day.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
        )
        const dayOrders = orders.filter((order) => {
            if (orderStatus(order) === 'Cancelled') return false
            const date = parseCanteenDate(order.orderDateTime || order.orderDate)
            return date && isSameDay(date, day)
        })
        revenue.push(dayOrders.reduce((sum, order) => sum + parseAmount(order.totalAmount || order.amount), 0))
        counts.push(dayOrders.length)
    }
    return { labels, revenue, orders: counts }
}

const buildTopSelling = (orders) => {
    const qtyByItem = new Map()
    orders.forEach((order) => {
        if (orderStatus(order) === 'Cancelled') return
        const items = Array.isArray(order.items) ? order.items : []
        items.forEach((item) => {
            const name = itemNameOf(item)
            if (!name) return
            qtyByItem.set(name, (qtyByItem.get(name) || 0) + itemQtyOf(item))
        })
    })
    return [...qtyByItem.entries()]
        .map(([item, quantity]) => ({ item, quantity }))
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 5)
}

const buildOrderDistribution = (orders) => {
    const counts = { Student: 0, Staff: 0, Event: 0 }
    orders.forEach((order) => {
        const type = String(order.customerType || order.type || '').trim()
        if (Object.prototype.hasOwnProperty.call(counts, type)) counts[type] += 1
        else if (type) counts.Event += 1
    })
    return Object.entries(counts).map(([name, value]) => ({
        name,
        value,
        color: TYPE_COLORS[name] || '#667085',
    }))
}

const stockLabel = (qty, unit) => {
    const amount = qty == null || qty === '' ? '—' : String(qty)
    const suffix = String(unit || '').trim()
    return suffix ? `${amount} ${suffix}` : amount
}

export function hydrateDashboardFromApi() {
    return Promise.all([
        hydrateMenuItemsFromApi(),
        hydrateOrdersFromApi(),
        hydrateRequestsFromApi(),
        hydrateInventoryItemsFromApi(),
        hydrateAnnouncementsFromApi().catch(() => false),
    ])
}

export function getDashboardView() {
    const menuItems = getMenuItems()
    const orders = getOrders()
    const requests = getRequests()
    const inventory = getInventoryItems()
    const announcements = getAnnouncementsForRole('canteenmanager')

    const availableMenu = menuItems.filter((item) => String(item.availability || '').toLowerCase() === 'available')
    const openOrders = orders.filter(isOpenOrder)
    const pendingRequests = requests.filter((row) => requestStatus(row) === 'Pending')
    const lowStock = inventory.filter(isLowStockItem)
    const outOfStock = inventory.filter((item) => {
        const qty = Number(item.quantity)
        return inventoryStatusOf(item) === 'Critical' || (Number.isFinite(qty) && qty <= 0)
    })
    const today = startOfDay(new Date())
    const todayOrders = orders.filter((order) => {
        if (orderStatus(order) === 'Cancelled') return false
        const date = parseCanteenDate(order.orderDateTime || order.orderDate)
        return date && isSameDay(date, today)
    })
    const todaySales = todayOrders.reduce((sum, order) => sum + parseAmount(order.totalAmount || order.amount), 0)

    return {
        summaryCards: [
            {
                label: 'Menu Items',
                value: String(menuItems.length),
                sub: menuItems.length ? `${availableMenu.length} available` : 'No menu items yet',
                trend: 'neutral',
            },
            {
                label: 'Open Orders',
                value: String(openOrders.length),
                sub: orders.length ? `${orders.length} total orders` : 'No orders yet',
                trend: openOrders.length ? 'up' : 'neutral',
            },
            {
                label: 'Pending Requests',
                value: String(pendingRequests.length),
                sub: requests.length ? `${requests.length} total requests` : 'No requests yet',
                trend: pendingRequests.length ? 'neutral' : 'neutral',
            },
            {
                label: 'Low Stock Inventory',
                value: String(lowStock.length),
                sub: inventory.length ? `${inventory.length} inventory items` : 'No inventory yet',
                trend: lowStock.length ? 'down' : 'neutral',
            },
            {
                label: 'Inventory Items',
                value: String(inventory.length),
                sub: inventory.length ? `${outOfStock.length} out of stock` : 'No inventory yet',
                trend: 'neutral',
            },
            {
                label: "Today's Sales",
                value: formatAmount(todaySales),
                sub: todayOrders.length ? `${todayOrders.length} orders today` : 'No orders today',
                trend: todaySales ? 'up' : 'neutral',
            },
        ],
        salesChart7: buildSalesChart(orders, 7),
        salesChart30: buildSalesChart(orders, 30),
        recentOrders: [...orders]
            .sort((a, b) => {
                const dateA = parseCanteenDate(a.orderDateTime || a.orderDate)?.getTime() || 0
                const dateB = parseCanteenDate(b.orderDateTime || b.orderDate)?.getTime() || 0
                return dateB - dateA
            })
            .slice(0, 8)
            .map((order) => ({
                orderId: order.orderId,
                customer: order.customerName || order.customer || '—',
                type: order.customerType || order.type || '—',
                amount: order.totalAmount || formatAmount(order.amount),
                status: orderStatus(order) || '—',
            })),
        topSellingItems: buildTopSelling(orders),
        lowStockAlerts: lowStock.map((item) => ({
            id: item.id,
            item: item.name || item.itemName || item.id,
            currentStock: stockLabel(item.quantity, item.unit),
            reorderLevel: stockLabel(item.reorderLevel, item.unit),
        })),
        pendingRequests: pendingRequests.map((row) => ({
            requestId: row.requestId,
            type: row.requestType || row.type || '—',
            amount: row.requestedAmount || row.amount || '—',
            status: requestStatus(row) || 'Pending',
        })),
        inventorySummary: [
            { label: 'Inventory Items', value: String(inventory.length), color: 'text-[#515DEF]' },
            { label: 'Low / Critical', value: String(lowStock.length), color: 'text-[#FF9800]' },
            { label: 'Out of Stock', value: String(outOfStock.length), color: 'text-[#FF0000]' },
        ],
        orderDistribution: buildOrderDistribution(orders),
        recentAnnouncements: announcements.slice(0, 5).map((row) => ({
            title: row.title || 'Untitled',
            audience: row.category || 'All',
            date: row.announcementDate || '—',
        })),
        quickActions: QUICK_ACTIONS,
    }
}
