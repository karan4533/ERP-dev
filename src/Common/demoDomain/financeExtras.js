import { ensureSeed, saveJson } from './storage'
import { logActivity } from './activityLog'

export const BOOK_FEE_KEY = 'schoolerp-book-fee-breakup-v1'
export const BUDGET_KEY = 'schoolerp-finance-budget-v1'
export const WHATSAPP_KEY = 'schoolerp-finance-whatsapp-log-v1'
export const FEE_PROJECTION_KEY = 'schoolerp-fee-projection-v1'
export const FUEL_KEY = 'schoolerp-transport-fuel-v1'
export const NOTIFY_KEY = 'schoolerp-due-notifications-v1'

export const BOOK_FEE_SEED = [
    { id: 'BF-0001', student: 'Aarav Sharma', academicYear: '2026-27', vendor: 'Scholastic Books', book: 'Grade 10 package', quantity: 1, unitCost: 4200, assignedFee: 4800 },
    { id: 'BF-0002', student: 'Aarav Sharma', academicYear: '2026-27', vendor: 'Campus Notebooks', book: 'Notebook set', quantity: 8, unitCost: 60, assignedFee: 4800 },
]

export const BUDGET_SEED = [
    { id: 'BDG-0001', department: 'Transport', category: 'Fuel', budget: 480000, actual: 312000 },
    { id: 'BDG-0002', department: 'Housekeeping', category: 'Consumables', budget: 180000, actual: 96000 },
    { id: 'BDG-0003', department: 'Academics', category: 'Activities', budget: 250000, actual: 274000 },
    { id: 'BDG-0004', department: 'Café', category: 'Supplies', budget: 320000, actual: 210000 },
]

export function bookFeeRows() {
    return ensureSeed(BOOK_FEE_KEY, BOOK_FEE_SEED).map((row) => ({
        ...row,
        total: Number(row.quantity) * Number(row.unitCost),
    }))
}

export function budgetRows() {
    return ensureSeed(BUDGET_KEY, BUDGET_SEED).map((row) => {
        const variance = row.budget - row.actual
        const variancePct = row.budget ? (variance / row.budget) * 100 : 0
        const utilization = row.budget ? (row.actual / row.budget) * 100 : 0
        return { ...row, variance, variancePct, utilization, balance: variance }
    })
}

export function projectFee(currentFee, increasePct) {
    const current = Number(currentFee) || 0
    const increase = Number(increasePct) || 0
    return current + current * (increase / 100)
}

export function saveFeeProjection(payload) {
    saveJson(FEE_PROJECTION_KEY, payload)
    logActivity({ action: 'UPDATE', module: 'Fee Projection', details: `Increase ${payload.increasePct}%` })
}

export function getFeeProjection() {
    return ensureSeed(FEE_PROJECTION_KEY, { academicYear: '2027-28', increasePct: 5, applied: false, currentFee: 85000 })
}

export function logWhatsAppDelivery(receiptId) {
    const logs = ensureSeed(WHATSAPP_KEY, [])
    const entry = {
        id: `WA-${Date.now()}`,
        receiptId,
        status: 'DEMO_SENT',
        channel: 'WhatsApp',
        at: new Date().toISOString(),
        note: 'Demo delivery. No WhatsApp API was called.',
    }
    saveJson(WHATSAPP_KEY, [entry, ...logs])
    logActivity({ action: 'UPDATE', module: 'WhatsApp Receipt', recordId: receiptId, details: 'DEMO_SENT' })
    return entry
}

export function getFuelEntries() {
    return ensureSeed(FUEL_KEY, [
        { id: 'FUEL-2026-0001', vehicle: 'TN-09-AB-4521', date: '2026-09-15', quantity: 80, rate: 102, amount: 8160, odometer: 45210, station: 'School pump', type: 'Inside', remarks: '' },
    ])
}

export function addFuelEntry(entry) {
    const items = getFuelEntries()
    const amount = Number(entry.quantity) * Number(entry.rate)
    const record = { ...entry, id: `FUEL-${Date.now()}`, amount, date: entry.date || new Date().toISOString().slice(0, 10) }
    saveJson(FUEL_KEY, [record, ...items])
    logActivity({ action: 'CREATE', module: 'Fuel Management', recordId: record.id, details: record.type })
    return record
}

export function scanDueNotifications() {
    const existing = ensureSeed(NOTIFY_KEY, [])
    const ids = new Set(existing.map((item) => item.id))
    const additions = []
    const candidates = [
        { id: 'DUE-MAINT-001', module: 'Transport', title: 'Vehicle service due', due: '2026-09-28', status: 'Approaching' },
        { id: 'DUE-FEE-001', module: 'Fees', title: 'Term fee instalment', due: '2026-09-25', status: 'Approaching' },
        { id: 'DUE-AUDIT-001', module: 'Audit', title: 'Open critical finding follow-up', due: '2026-09-20', status: 'Overdue' },
    ]
    candidates.forEach((item) => {
        if (!ids.has(item.id)) additions.push(item)
    })
    if (additions.length) saveJson(NOTIFY_KEY, [...additions, ...existing])
    return ensureSeed(NOTIFY_KEY, [])
}
