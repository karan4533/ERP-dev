import {
    ensureCampusSeed,
    hydrateCampusKey,
    persistCampusJson,
    usesCampusApiForKey,
} from '../../../services/campusJsonStore'
import { nextSerial } from '../../../Common/demoDomain/storage'
import { canUseOpsApi, stationeryIssueReturnApi } from '../../../services/opsApi'
import { getInventoryItems, hydrateInventoryItemsFromApi, saveInventoryItems } from '../Inventory/inventoryData'

export const STOCK_ISSUES_STORAGE_KEY = 'schoolerp-stationery-stock-issues-v1'

export const ISSUE_DESTINATIONS = ['Housekeeping', 'Academics', 'Café', 'Laboratory', 'Administration', 'Mathematics', 'Science']

const DEMO_STOCK_ISSUES = [
    {
        id: 'ISS-2026-0001',
        item: 'Blue Ballpoint Pen',
        itemId: 'STN-2026-0142',
        quantity: 20,
        from: 'Stores',
        to: 'Mathematics',
        issuedBy: 'Stores Manager',
        receivedBy: 'Priya Nair',
        date: '2026-06-10',
        status: 'Issued',
    },
]

const seedFor = () => (usesCampusApiForKey(STOCK_ISSUES_STORAGE_KEY) ? [] : DEMO_STOCK_ISSUES)

export function getStationeryStockIssues() {
    return ensureCampusSeed(STOCK_ISSUES_STORAGE_KEY, seedFor())
}

export function saveStationeryStockIssues(rows) {
    return persistCampusJson(STOCK_ISSUES_STORAGE_KEY, rows)
}

export function hydrateStationeryStockIssuesFromApi() {
    if (!usesCampusApiForKey(STOCK_ISSUES_STORAGE_KEY)) return Promise.resolve(false)
    return hydrateCampusKey(STOCK_ISSUES_STORAGE_KEY, [])
}

const deriveStatus = (qty, reorder) => {
    if (qty <= 0) return 'Out of Stock'
    if (Number.isFinite(reorder) && qty <= reorder) return 'Low Stock'
    return 'Available'
}

export async function issueStationeryStock({ itemName, quantity, to, issuedBy, receivedBy }) {
    const qty = Number(quantity)
    if (!Number.isFinite(qty) || qty <= 0) {
        return { success: false, message: 'Quantity must be a positive number.' }
    }

    // Live API: reuse authoritative issue-return ledger (also mirrors into stock-issues).
    if (canUseOpsApi()) {
        try {
            const clientRequestId = `SSI-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
            const result = await stationeryIssueReturnApi({
                activityType: 'Issue',
                clientRequestId,
                requestedBy: receivedBy || to || 'Staff',
                department: to || 'Stores',
                purpose: 'Stock issue',
                lines: [{ itemName, quantity: qty }],
            })
            await Promise.all([hydrateStationeryStockIssuesFromApi(), hydrateInventoryItemsFromApi()])
            const movement = result?.movements?.[0]
            return {
                success: Boolean(result?.success),
                api: true,
                idempotent: Boolean(result?.idempotent),
                record: movement
                    ? {
                        id: movement.id,
                        item: movement.itemName,
                        itemId: movement.itemId,
                        quantity: movement.quantity,
                        from: 'Stores',
                        to: movement.department,
                        issuedBy: issuedBy || movement.recordedByEmail || 'Stores',
                        receivedBy: movement.requestedBy,
                        date: movement.issueDate,
                        status: movement.status,
                    }
                    : null,
            }
        } catch (err) {
            return { success: false, message: err?.message || 'Could not issue stock.' }
        }
    }

    const items = getInventoryItems()
    const item = items.find((row) => row.itemName === itemName)
    if (!item) return { success: false, message: 'Item not found in stationery inventory.' }
    const available = Number(item.availableQuantity) || 0
    if (qty > available) {
        return { success: false, message: 'Quantity exceeds available stock. Raise a purchase instead.' }
    }

    const nextQty = available - qty
    const nextItems = items.map((row) => (
        row.itemId === item.itemId
            ? { ...row, availableQuantity: nextQty, status: deriveStatus(nextQty, Number(row.reorderLevel)) }
            : row
    ))
    const inventoryResult = await saveInventoryItems(nextItems)
    if (inventoryResult === false || inventoryResult?.success === false) {
        return { success: false, message: inventoryResult?.message || 'Could not update inventory.' }
    }

    const issues = getStationeryStockIssues()
    const record = {
        id: nextSerial('ISS-2026-', issues),
        item: item.itemName,
        itemId: item.itemId,
        quantity: qty,
        from: 'Stores',
        to,
        issuedBy: issuedBy || 'Stores Manager',
        receivedBy: receivedBy || to,
        date: new Date().toISOString().slice(0, 10),
        status: 'Issued',
    }
    const result = await saveStationeryStockIssues([record, ...issues])
    if (result?.success === false) return { success: false, message: result.message, record }
    return { success: true, record, api: result?.api }
}
