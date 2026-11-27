import {
    hydrateCampusKey,
    persistCampusJson,
    usesCampusApiForKey,
} from '../../../services/campusJsonStore'
import { getOrders, hydrateOrdersFromApi } from '../Orders/ordersData'
import { getRequests, hydrateRequestsFromApi } from '../RequestsApprovals/requestsData'
import { formatAmount, parseAmount, parseCanteenDate } from '../Dashboard/dashboardData'

export const REPORTS_STORAGE_KEY = 'schoolerp-canteen-reports-v1'

export const REPORT_CATEGORIES = [
    'Order Summary Report',
    'Sales Report',
    'Request Summary',
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

const ORDER_STATUSES = ['Preparing', 'Ready', 'Completed', 'Cancelled']
const REQUEST_STATUSES = ['Pending', 'Approved', 'Rejected']

const orderStatusOf = (order) => String(order?.orderStatus || order?.status || '').trim()
const requestStatusOf = (request) => String(request?.status || '').trim()

const totalsByStatus = (rows, statuses, statusOf, amountOf) =>
    statuses.map((status) => {
        const matched = rows.filter((row) => statusOf(row) === status)
        const amount = matched.reduce((sum, row) => sum + amountOf(row), 0)
        return { status, count: matched.length, amount: formatAmount(amount) }
    })

const mapSalesRow = (order) => ({
    orderId: order.orderId,
    customerName: order.customerName || order.customer || '—',
    customerType: order.customerType || order.type || '—',
    orderDate: String(order.orderDateTime || order.orderDate || '—').split('·')[0].trim() || '—',
    amount: order.totalAmount || formatAmount(order.amount),
    paymentMethod: order.paymentMethod || '—',
    status: orderStatusOf(order) || '—',
    sortTime: parseCanteenDate(order.orderDateTime || order.orderDate)?.getTime() || 0,
})

export function getReportsView() {
    const orders = getOrders()
    const requests = getRequests()
    const salesRows = [...orders]
        .map(mapSalesRow)
        .sort((a, b) => b.sortTime - a.sortTime)
    const completed = orders.filter((order) => orderStatusOf(order) === 'Completed')
    const open = orders.filter((order) => orderStatusOf(order) === 'Preparing' || orderStatusOf(order) === 'Ready')
    const pending = requests.filter((row) => requestStatusOf(row) === 'Pending')
    const salesTotal = orders
        .filter((order) => orderStatusOf(order) !== 'Cancelled')
        .reduce((sum, order) => sum + parseAmount(order.totalAmount || order.amount), 0)
    const pendingAmount = pending.reduce((sum, row) => sum + parseAmount(row.requestedAmount || row.amount), 0)
    const topItem = (() => {
        const qty = new Map()
        orders.forEach((order) => {
            if (orderStatusOf(order) === 'Cancelled') return
            const items = Array.isArray(order.items) ? order.items : []
            items.forEach((item) => {
                const name = typeof item === 'string' ? item : String(item?.itemName || item?.name || '').trim()
                if (!name) return
                const n = typeof item === 'string' ? 1 : Number(item?.quantity) || 1
                qty.set(name, (qty.get(name) || 0) + n)
            })
        })
        return [...qty.entries()].sort((a, b) => b[1] - a[1])[0] || null
    })()

    return {
        summaryCards: [
            {
                label: 'Total Orders',
                value: String(orders.length),
                sub: open.length ? `${open.length} open` : 'No open orders',
            },
            {
                label: 'Order Sales',
                value: formatAmount(salesTotal),
                sub: completed.length ? `${completed.length} completed` : 'No completed orders',
            },
            {
                label: 'Pending Requests',
                value: String(pending.length),
                sub: pending.length ? formatAmount(pendingAmount) : 'No pending requests',
            },
            {
                label: 'Top Selling Menu Item',
                value: topItem ? topItem[0] : '—',
                sub: topItem ? `${topItem[1]} sold` : 'No order items yet',
            },
        ],
        orderStatusRows: totalsByStatus(
            orders,
            ORDER_STATUSES,
            orderStatusOf,
            (order) => parseAmount(order.totalAmount || order.amount),
        ),
        requestStatusRows: totalsByStatus(
            requests,
            REQUEST_STATUSES,
            requestStatusOf,
            (row) => parseAmount(row.requestedAmount || row.amount),
        ),
        recentOrders: salesRows.slice(0, 12),
        salesReport: salesRows,
    }
}

export function hydrateReportsFromApi() {
    const jobs = [hydrateOrdersFromApi(), hydrateRequestsFromApi()]
    if (usesCampusApiForKey(REPORTS_STORAGE_KEY)) {
        jobs.push(hydrateCampusKey(REPORTS_STORAGE_KEY, []))
    }
    return Promise.all(jobs)
}

export function persistReportSnapshot(view = getReportsView()) {
    if (!usesCampusApiForKey(REPORTS_STORAGE_KEY)) return Promise.resolve(false)
    return persistCampusJson(REPORTS_STORAGE_KEY, [{
        id: 'canteen-live-snapshot',
        generatedAt: new Date().toISOString(),
        orderTotalsByStatus: view.orderStatusRows,
        requestTotalsByStatus: view.requestStatusRows,
        recentOrders: view.recentOrders,
        summary: view.summaryCards.map((card) => ({ label: card.label, value: card.value })),
    }])
}
