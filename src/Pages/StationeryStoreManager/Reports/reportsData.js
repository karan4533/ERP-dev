import { getInventoryItems, hydrateInventoryItemsFromApi } from '../Inventory/inventoryData'
import { getIssueReturns, hydrateIssueReturnsFromApi } from '../IssueReturns/issueReturnsData'

export const REPORT_TYPES = [
    'Stock Movement Report',
    'Consumption Report',
    'Expense Report',
    'Low Stock Report',
]

const periodLabel = () => new Date().toLocaleString('en-IN', { month: 'long', year: 'numeric' })

const parseMoney = (value) => Number(String(value ?? '').replace(/[^\d.]/g, '')) || 0

const formatInr = (value) => `₹${Number(value || 0).toLocaleString('en-IN')}`

const isLowOrOut = (item) => {
    if (item.status === 'Low Stock' || item.status === 'Out of Stock') return true
    const qty = Number(item.availableQuantity)
    const reorder = Number(item.reorderLevel)
    return Number.isFinite(qty) && Number.isFinite(reorder) && qty <= reorder
}

export function buildStationeryReports() {
    const items = getInventoryItems()
    const movements = getIssueReturns()
    const period = periodLabel()

    const stockMovement = items.map((item) => {
        const issued = movements
            .filter((row) => row.activityType === 'Issue' && row.itemName === item.itemName)
            .reduce((sum, row) => sum + (Number(row.quantity) || 0), 0)
        const returned = movements
            .filter((row) => row.activityType === 'Return' && row.itemName === item.itemName)
            .reduce((sum, row) => sum + (Number(row.quantity) || 0), 0)
        const closingStock = Number(item.availableQuantity) || 0
        return {
            item: item.itemName,
            openingStock: closingStock - returned + issued,
            issued,
            returned,
            closingStock,
        }
    })

    const consumption = movements
        .filter((row) => row.activityType === 'Issue')
        .map((row) => ({
            item: row.itemName,
            quantityUsed: Number(row.quantity) || 0,
            department: row.department || '—',
            period: row.issueDate || period,
        }))

    const expense = items
        .filter((item) => item.invoiceNumber)
        .map((item) => ({
            invoiceNo: item.invoiceNumber,
            productName: item.itemName,
            vendor: item.supplier || '—',
            amount: item.stockValue || formatInr(parseMoney(item.unitCost) * (Number(item.availableQuantity) || 0)),
            date: item.purchaseDate || '',
        }))

    const lowStock = items.filter(isLowOrOut).map((item) => ({
        item: item.itemName,
        currentQty: Number(item.availableQuantity) || 0,
        reorderLevel: Number(item.reorderLevel) || 0,
    }))

    return {
        stockMovement,
        consumption,
        expense,
        lowStock,
    }
}

export async function hydrateStationeryReportsFromApi() {
    await Promise.all([
        hydrateInventoryItemsFromApi(),
        hydrateIssueReturnsFromApi(),
    ])
    return buildStationeryReports()
}

const FALLBACK = buildStationeryReports()

export const STOCK_MOVEMENT_REPORT = FALLBACK.stockMovement
export const CONSUMPTION_REPORT = FALLBACK.consumption
export const EXPENSE_REPORT = FALLBACK.expense
export const LOW_STOCK_REPORT = FALLBACK.lowStock
