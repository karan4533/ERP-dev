import { ensureSeed, nextSerial, saveJson } from './storage'
import { logActivity } from './activityLog'

export const INVENTORY_KEY = 'schoolerp-inventory-v1'
export const MOVEMENTS_KEY = 'schoolerp-inventory-movements-v1'
export const REQUIREMENTS_KEY = 'schoolerp-inventory-requirements-v1'

const seedItems = [
    { id: 'INV-2026-0001', name: 'Floor cleaner', category: 'Housekeeping', department: 'Stores', expiryDate: '2027-03-01', available: 40, received: 50, consumed: 10, reorderLevel: 15 },
    { id: 'INV-2026-0002', name: 'A4 paper ream', category: 'Stationery', department: 'Stores', expiryDate: '', available: 12, received: 80, consumed: 68, reorderLevel: 20 },
    { id: 'INV-2026-0003', name: 'Lab gloves', category: 'Laboratory', department: 'Stores', expiryDate: '2026-12-15', available: 120, received: 200, consumed: 80, reorderLevel: 40 },
    { id: 'INV-2026-0004', name: 'Café cups', category: 'Café', department: 'Stores', expiryDate: '', available: 300, received: 400, consumed: 100, reorderLevel: 80 },
]

const seedMovements = [
    { id: 'MOV-2026-0001', item: 'Floor cleaner', quantity: 10, from: 'Stores', to: 'Housekeeping', issuedBy: 'Stores Manager', receivedBy: 'Housekeeping Supervisor', date: '2026-09-12', reference: 'ISS-104', status: 'Received' },
]

const seedRequirements = [
    { id: 'REQ-ST-2026-0001', item: 'Floor cleaner', quantity: 20, requestedBy: 'Housekeeping Manager', department: 'Housekeeping', requiredDate: '2026-09-30', remarks: 'Monthly deep clean', status: 'Pending', vendor: '' },
]

export function getInventory() {
    return ensureSeed(INVENTORY_KEY, seedItems)
}

export function getMovements() {
    return ensureSeed(MOVEMENTS_KEY, seedMovements)
}

export function getRequirements() {
    return ensureSeed(REQUIREMENTS_KEY, seedRequirements)
}

export function stockStatus(item) {
    const difference = item.available - (item.reorderLevel || 0)
    if (item.available < item.reorderLevel) return { difference, status: 'LOW' }
    if (item.available > item.reorderLevel * 3) return { difference, status: 'EXCESS' }
    return { difference, status: 'NORMAL' }
}

export function issueStock({ itemName, quantity, to, issuedBy, receivedBy, reference }) {
    const qty = Number(quantity)
    const items = getInventory()
    const item = items.find((row) => row.name === itemName)
    if (!item) return { ok: false, message: 'Item not found in Stores.' }
    if (qty <= 0 || qty > item.available) return { ok: false, message: 'Quantity exceeds available stock.' }
    const nextItems = items.map((row) => (
        row.name === itemName
            ? { ...row, available: row.available - qty, consumed: row.consumed + qty }
            : row
    ))
    const movements = getMovements()
    const movement = {
        id: nextSerial('MOV-2026-', movements, 'id'),
        item: itemName,
        quantity: qty,
        from: 'Stores',
        to,
        issuedBy,
        receivedBy: receivedBy || to,
        date: new Date().toISOString().slice(0, 10),
        reference: reference || 'ISSUE',
        status: 'Issued',
    }
    saveJson(INVENTORY_KEY, nextItems)
    saveJson(MOVEMENTS_KEY, [movement, ...movements])
    logActivity({ actor: issuedBy, action: 'UPDATE', module: 'Inventory', recordId: movement.id, details: `Issued ${qty} ${itemName} to ${to}` })
    return { ok: true, movement }
}

export function addRequirement(input) {
    const requirements = getRequirements()
    const record = {
        id: nextSerial('REQ-ST-2026-', requirements, 'id'),
        item: input.item,
        quantity: Number(input.quantity),
        requestedBy: input.requestedBy,
        department: input.department,
        requiredDate: input.requiredDate,
        remarks: input.remarks || '',
        status: 'Pending',
        vendor: '',
    }
    saveJson(REQUIREMENTS_KEY, [record, ...requirements])
    logActivity({ actor: input.requestedBy, action: 'CREATE', module: 'Inventory Requirement', recordId: record.id, details: record.item })
    return record
}

export function criticalAlerts() {
    return getInventory().map((item) => {
        const derived = stockStatus(item)
        return {
            module: item.category,
            item: item.name,
            required: item.reorderLevel,
            actual: item.available,
            difference: derived.difference,
            status: derived.status,
        }
    })
}
