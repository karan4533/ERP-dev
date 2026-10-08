import { ensureSeed, loadJson, nextSerial, saveJson } from './storage'
import { logActivity } from './activityLog'

export const PROCUREMENT_KEY = 'schoolerp-procurement-requests-v1'
export const PO_KEY = 'schoolerp-purchase-orders-v1'

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

const seedRequests = [
    {
        id: 'REQ-2026-0001',
        title: 'Lab printer toner',
        department: 'IT Support',
        requestedBy: 'IT Support Manager',
        minorPurchase: true,
        amount: 8500,
        status: 'MINOR_APPROVED',
        quotationFile: 'comparative-quotation-toner.csv',
        vendorRequired: false,
        poNumber: '',
        primaryApprover: 'Joint Director Operations',
    },
    {
        id: 'REQ-2026-0002',
        title: 'Housekeeping chemical restock',
        department: 'Housekeeping',
        requestedBy: 'Housekeeping Manager',
        minorPurchase: false,
        amount: 64000,
        status: 'ESCALATED',
        quotationFile: '',
        vendorRequired: false,
        poNumber: '',
        primaryApprover: 'Joint Director Operations',
    },
]

const seedOrders = [
    {
        id: 'PO-2026-0001',
        requestId: 'REQ-2026-0001',
        vendor: 'Campus Supplies',
        amount: 8500,
        status: 'PO_APPROVED',
        date: '2026-09-10',
    },
]

export function getProcurementRequests() {
    return ensureSeed(PROCUREMENT_KEY, seedRequests)
}

export function getPurchaseOrders() {
    return ensureSeed(PO_KEY, seedOrders)
}

export function saveProcurement(requests) {
    saveJson(PROCUREMENT_KEY, requests)
}

export function createProcurementRequest(input) {
    const requests = getProcurementRequests()
    const record = {
        id: nextSerial('REQ-2026-', requests, 'id'),
        title: input.title,
        department: input.department,
        requestedBy: input.requestedBy,
        minorPurchase: Boolean(input.minorPurchase),
        amount: Number(input.amount) || 0,
        status: 'QUOTATION_PENDING',
        quotationFile: input.quotationFile || '',
        vendorRequired: false,
        poNumber: '',
        primaryApprover: input.primaryApprover || 'Department Head',
        createdAt: new Date().toISOString(),
    }
    saveProcurement([record, ...requests])
    logActivity({ actor: input.requestedBy, action: 'CREATE', module: 'Procurement', recordId: record.id, details: record.title })
    return record
}

export function advanceProcurement(id, actor = 'Approver') {
    const requests = getProcurementRequests()
    const current = requests.find((item) => item.id === id)
    if (!current) return null
    const order = current.minorPurchase
        ? ['QUOTATION_PENDING', 'DEPARTMENT_REVIEW', 'MINOR_APPROVED', 'PO_REQUIRED', 'PO_RAISED', 'PO_APPROVED', 'COMPLETED']
        : ['QUOTATION_PENDING', 'DEPARTMENT_REVIEW', 'ESCALATED', 'QUOTATION_APPROVED', 'PO_REQUIRED', 'PO_RAISED', 'PO_APPROVED', 'COMPLETED']
    const index = order.indexOf(current.status)
    const status = order[Math.min(index + 1, order.length - 1)] || current.status
    let poNumber = current.poNumber
    if (status === 'PO_RAISED' && !poNumber) {
        const orders = getPurchaseOrders()
        poNumber = nextSerial('PO-2026-', orders, 'id')
        saveJson(PO_KEY, [{ id: poNumber, requestId: id, vendor: 'Selected vendor', amount: current.amount, status: 'PO_RAISED', date: new Date().toISOString().slice(0, 10) }, ...orders])
    }
    const next = requests.map((item) => (item.id === id ? { ...item, status, poNumber } : item))
    saveProcurement(next)
    logActivity({ actor, action: 'STATUS_CHANGE', module: 'Procurement', recordId: id, before: current.status, after: status })
    return next.find((item) => item.id === id)
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
    logActivity({ action: 'DOWNLOAD_CLICK', module: 'Procurement', details: 'Comparative quotation template' })
}

export function loadProcurementSafe() {
    const stored = loadJson(PROCUREMENT_KEY, null)
    return Array.isArray(stored) ? stored : getProcurementRequests()
}
