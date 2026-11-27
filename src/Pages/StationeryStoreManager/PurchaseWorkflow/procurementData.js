import {
    ensureCampusSeed,
    hydrateCampusKey,
    persistCampusJson,
    usesCampusApiForKey,
} from '../../../services/campusJsonStore'
import { nextSerial } from '../../../Common/demoDomain/storage'
import {
    canUseOpsApi,
    stationeryDecideProcurementApi,
    stationeryReceiveGoodsApi,
} from '../../../services/opsApi'

export const PROCUREMENT_STORAGE_KEY = 'schoolerp-stationery-procurement-v1'

export const PROCUREMENT_STATUSES = [
    'DRAFT',
    'QUOTATION_PENDING',
    'DEPARTMENT_REVIEW',
    'MINOR_APPROVED',
    'ESCALATED',
    'QUOTATION_APPROVED',
    'PO_REQUIRED',
    'PO_RAISED',
    'PO_APPROVED',
    'REJECTED',
    'COMPLETED',
]

const DEMO_PROCUREMENT = [
    {
        id: 'REQ-ST-PO-0001',
        title: 'A4 paper and pen restock',
        department: 'Stores',
        requestedBy: 'Stores Manager',
        minorPurchase: true,
        amount: 15400,
        status: 'QUOTATION_PENDING',
        quotationFile: '',
        vendorRequired: false,
        poNumber: '',
        primaryApprover: 'Joint Director Operations',
    },
]

const seedFor = () => (usesCampusApiForKey(PROCUREMENT_STORAGE_KEY) ? [] : DEMO_PROCUREMENT)

const MINOR_FLOW = ['QUOTATION_PENDING', 'DEPARTMENT_REVIEW', 'MINOR_APPROVED', 'PO_REQUIRED', 'PO_RAISED', 'PO_APPROVED', 'COMPLETED']
const MAJOR_FLOW = ['QUOTATION_PENDING', 'DEPARTMENT_REVIEW', 'ESCALATED', 'QUOTATION_APPROVED', 'PO_REQUIRED', 'PO_RAISED', 'PO_APPROVED', 'COMPLETED']

export function getStationeryProcurement() {
    return ensureCampusSeed(PROCUREMENT_STORAGE_KEY, seedFor())
}

export function saveStationeryProcurement(rows) {
    return persistCampusJson(PROCUREMENT_STORAGE_KEY, rows)
}

export function hydrateStationeryProcurementFromApi() {
    if (!usesCampusApiForKey(PROCUREMENT_STORAGE_KEY)) return Promise.resolve(false)
    return hydrateCampusKey(PROCUREMENT_STORAGE_KEY, [])
}

export function getStationeryPurchaseOrders(rows = getStationeryProcurement()) {
    return rows
        .filter((row) => row.poNumber)
        .map((row) => ({
            id: row.poNumber,
            requestId: row.id,
            vendor: row.vendor || 'Selected vendor',
            amount: row.amount,
            status: ['PO_RAISED', 'PO_APPROVED', 'COMPLETED'].includes(row.status) ? row.status : 'PO_RAISED',
            date: row.poDate || row.createdAt || '',
        }))
}

export async function createStationeryProcurementRequest(input) {
    const rows = getStationeryProcurement()
    const record = {
        id: nextSerial('REQ-ST-PO-', rows),
        title: String(input.title || '').trim(),
        department: input.department || 'Stores',
        requestedBy: input.requestedBy || 'Stores Manager',
        minorPurchase: Boolean(input.minorPurchase),
        amount: Number(input.amount) || 0,
        status: 'QUOTATION_PENDING',
        quotationFile: input.quotationFile || '',
        vendorRequired: false,
        poNumber: '',
        primaryApprover: input.primaryApprover || 'Joint Director Operations',
        createdAt: new Date().toISOString(),
    }
    const result = await saveStationeryProcurement([record, ...rows])
    return { ...result, record }
}

/** Map UI "Advance" to the server action allowed for the current status (store role). */
const storeActionForStatus = (status) => {
    const value = String(status || '').toUpperCase()
    if (value === 'DRAFT' || value === 'QUOTATION_PENDING') return 'advance'
    if (value === 'PO_REQUIRED') return 'advance'
    return null
}

/** Why Store cannot advance from this status (JD / Finance decide, or goods receipt completes it). */
const storeWaitMessage = (status) => {
    const value = String(status || '').toUpperCase()
    if (value === 'PO_RAISED') return 'PO raised. Waiting for Joint Director / Finance to approve the purchase order.'
    if (value === 'PO_APPROVED') return 'PO approved. Record the goods receipt (GRN) to complete this purchase.'
    return `No store advance from ${status}. Waiting for JD / Finance decision or goods receipt.`
}

export async function advanceStationeryProcurement(id, { action, comment } = {}) {
    const rows = getStationeryProcurement()
    const current = rows.find((item) => item.id === id)
    if (!current) return { success: false, message: 'Request not found.' }

    if (canUseOpsApi()) {
        const resolved = action || storeActionForStatus(current.status)
        if (!resolved) {
            return { success: false, message: storeWaitMessage(current.status) }
        }
        try {
            const record = await stationeryDecideProcurementApi(id, { action: resolved, comment: comment || '' })
            await hydrateStationeryProcurementFromApi()
            return { success: true, api: true, record }
        } catch (err) {
            return { success: false, message: err?.message || 'Procurement decision failed.' }
        }
    }

    const order = current.minorPurchase ? MINOR_FLOW : MAJOR_FLOW
    const index = Math.max(order.indexOf(current.status), 0)
    const status = order[Math.min(index + 1, order.length - 1)] || current.status
    let poNumber = current.poNumber
    let poDate = current.poDate
    if (status === 'PO_RAISED' && !poNumber) {
        poNumber = nextSerial('PO-ST-2026-', rows, 'poNumber')
        poDate = new Date().toISOString().slice(0, 10)
    }
    const next = rows.map((item) => (item.id === id ? { ...item, status, poNumber, poDate } : item))
    const result = await saveStationeryProcurement(next)
    return { ...result, record: next.find((item) => item.id === id) }
}

export async function decideStationeryProcurement(id, action, comment = '') {
    if (!canUseOpsApi()) {
        return advanceStationeryProcurement(id, { action, comment })
    }
    try {
        const record = await stationeryDecideProcurementApi(id, { action, comment })
        await hydrateStationeryProcurementFromApi()
        return { success: true, api: true, record }
    } catch (err) {
        return { success: false, message: err?.message || 'Procurement decision failed.' }
    }
}

export async function receiveStationeryGoods(id, payload = {}) {
    const quantity = Math.max(1, Number(payload.quantity) || 1)
    if (canUseOpsApi()) {
        try {
            const result = await stationeryReceiveGoodsApi(id, { ...payload, quantity })
            await hydrateStationeryProcurementFromApi()
            return { success: true, api: true, ...result }
        } catch (err) {
            return { success: false, message: err?.message || 'Goods receipt failed.' }
        }
    }
    // Offline / local persist: mark GRN received with quantity for list visibility.
    const rows = getStationeryProcurement()
    const current = rows.find((item) => item.id === id)
    if (!current) return { success: false, message: 'Request not found.' }
    const next = rows.map((item) => (
        item.id === id
            ? {
                ...item,
                status: 'COMPLETED',
                grnId: payload.grnId || `GRN-${id}`,
                grnReceived: true,
                grnQuantity: quantity,
                grnReceivedAt: new Date().toISOString(),
                itemName: payload.itemName || item.title,
            }
            : item
    ))
    const result = await saveStationeryProcurement(next)
    return { ...result, record: next.find((item) => item.id === id) }
}

export function downloadQuotationTemplate() {
    const csv = 'Vendor,Item,Qty,Unit Rate,Amount,Lead Time,Remarks\nVendor A,Sample item,1,1000,1000,7 days,\n'
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'comparative-quotation-template.csv'
    link.click()
    URL.revokeObjectURL(url)
}
