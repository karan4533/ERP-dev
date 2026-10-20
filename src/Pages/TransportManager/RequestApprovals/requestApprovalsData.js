import { getTransportRows, hydrateTransportRows, nextPrefixedId, saveTransportRows } from '../transportCampus'
import {
    getMaintenanceRecords,
    hydrateMaintenanceRecordsFromApi,
} from '../VehicleMaintenance/vehicleMaintenanceData'

export const REQUEST_STATUSES = [
    'Pending',
    'In-Process',
    'Awaiting Principal',
    'Approved',
    'Rejected',
    'Completed',
]

export const ISSUE_TYPES = [
    'Engine Issue',
    'Brake Failure',
    'AC Not Working',
    'Tyre Puncture',
    'Electrical Fault',
    'Oil Leak',
    'Battery Issue',
    'Periodic Maintenance',
    'Oil Change',
    'Tyre Replacement',
    'Brake Inspection',
    'Engine Overhaul',
    'AC Service',
    'Battery Replacement',
    'General Maintenance',
]

export const PRIORITIES = ['High', 'Medium', 'Low']

export const statusBadgeColor = {
    'In-Process': 'bg-[#2196F333] text-[#2196F3]',
    Pending: 'bg-[#FF980033] text-[#FF9800]',
    'Awaiting Principal': 'bg-[#7C3AED33] text-[#7C3AED]',
    Approved: 'bg-[#4CAF5033] text-[#4CAF50]',
    Rejected: 'bg-[#F4433633] text-[#F44336]',
    Completed: 'bg-[#4CAF5033] text-[#4CAF50]',
}

const DEFAULT_MAINTENANCE_REQUESTS = [
    {
        id: 'MR-1001',
        requestId: 'MR-1001',
        vehicleNumber: 'TN-09-AB-4521',
        reportedBy: 'Sandy Selva',
        requestDate: '08-06-2026',
        issueType: 'AC Not Working',
        description: 'AC cooling weak during morning route; needs inspection before summer peak.',
        priority: 'High',
        status: 'In-Process',
    },
    {
        id: 'MR-1002',
        requestId: 'MR-1002',
        vehicleNumber: 'TN-09-CD-8834',
        reportedBy: 'Rajesh K. Kumar',
        requestDate: '07-06-2026',
        issueType: 'Brake Failure',
        description: 'Rear brake pads worn out; squeaking noise reported on downhill stops.',
        priority: 'High',
        status: 'Pending',
    },
    {
        id: 'MR-1003',
        requestId: 'MR-1003',
        vehicleNumber: 'TN-09-EF-2210',
        reportedBy: 'Priya M. Venkatesh',
        requestDate: '05-06-2026',
        issueType: 'Tyre Puncture',
        description: 'Front-left tyre puncture near school gate; temporary fix applied.',
        priority: 'Medium',
        status: 'Completed',
    },
    {
        id: 'MR-1004',
        requestId: 'MR-1004',
        vehicleNumber: 'TN-09-GH-5567',
        reportedBy: 'Mohan R. Das',
        requestDate: '09-06-2026',
        issueType: 'Engine Issue',
        description: 'Engine overheating warning light during afternoon return trip.',
        priority: 'High',
        status: 'Pending',
    },
    {
        id: 'MR-1005',
        requestId: 'MR-1005',
        vehicleNumber: 'TN-09-IJ-3344',
        reportedBy: 'Transport Supervisor',
        requestDate: '06-06-2026',
        issueType: 'Oil Leak',
        description: 'Minor oil leak detected during weekly inspection at depot.',
        priority: 'Low',
        status: 'Completed',
    },
]

const DEFAULT_FUEL_REQUESTS = [
    {
        id: 'FR-1001',
        requestId: 'FR-1001',
        driverName: 'Sandy Selva',
        driverId: 'VAN-1001',
        vehicleNumber: 'TN-09-AB-4521',
        routeName: 'Route 5 — North Campus',
        currentOdometerReading: '48,320 km',
        requestedQuantity: '120 L',
        requestedDate: '09-06-2026',
        status: 'In-Process',
    },
    {
        id: 'FR-1002',
        requestId: 'FR-1002',
        driverName: 'Rajesh K. Kumar',
        driverId: 'VAN-1002',
        vehicleNumber: 'TN-09-CD-8834',
        routeName: 'Route 2 — East Campus',
        currentOdometerReading: '62,150 km',
        requestedQuantity: '150 L',
        requestedDate: '08-06-2026',
        status: 'Pending',
    },
    {
        id: 'FR-1003',
        requestId: 'FR-1003',
        driverName: 'Priya M. Venkatesh',
        driverId: 'VAN-1003',
        vehicleNumber: 'TN-09-EF-2210',
        routeName: 'Route 8 — West Campus',
        currentOdometerReading: '35,780 km',
        requestedQuantity: '100 L',
        requestedDate: '07-06-2026',
        status: 'Completed',
    },
    {
        id: 'FR-1004',
        requestId: 'FR-1004',
        driverName: 'Mohan R. Das',
        driverId: 'VAN-1004',
        vehicleNumber: 'TN-09-GH-5567',
        routeName: 'Route 3 — South Campus',
        currentOdometerReading: '71,420 km',
        requestedQuantity: '140 L',
        requestedDate: '10-06-2026',
        status: 'Pending',
    },
    {
        id: 'FR-1005',
        requestId: 'FR-1005',
        driverName: 'Sandy Selva',
        driverId: 'VAN-1001',
        vehicleNumber: 'TN-09-AB-4521',
        routeName: 'Route 5 — North Campus',
        currentOdometerReading: '48,650 km',
        requestedQuantity: '110 L',
        requestedDate: '04-06-2026',
        status: 'Completed',
    },
]

const DEFAULT_TRANSPORT_APPROVAL_REQUESTS = [
    ...DEFAULT_MAINTENANCE_REQUESTS,
    ...DEFAULT_FUEL_REQUESTS,
]

const maintenanceRows = (rows) => rows.filter((item) => String(item.id ?? item.requestId ?? '').startsWith('MR-'))
const fuelRows = (rows) => rows.filter((item) => String(item.id ?? item.requestId ?? '').startsWith('FR-'))

export const TRANSPORT_APPROVAL_REQUESTS_STORAGE_KEY = 'schoolerp-transport-approvals-v1'

const mapMaintenanceStatusToApproval = (status) => {
    const value = String(status || '').trim().toLowerCase()
    if (value === 'completed' || value === 'approved') return 'Approved'
    if (value === 'awaiting principal' || value === 'awaiting_principal') return 'Awaiting Principal'
    if (value === 'cancelled' || value === 'canceled' || value === 'rejected') return 'Rejected'
    if (value === 'scheduled' || value === 'in-process' || value === 'in process' || value === 'in progress') {
        return 'In-Process'
    }
    return 'Pending'
}

const mapApprovalStatusToMaintenance = (status) => {
    const value = String(status || '').trim().toLowerCase()
    if (value === 'approved' || value === 'completed') return 'Completed'
    if (value === 'rejected') return 'Cancelled'
    if (value === 'awaiting principal' || value === 'in-process' || value === 'in process') return 'Scheduled'
    return 'Pending'
}

export function buildApprovalFromVehicleMaintenance(record) {
    if (!record) return null
    const serviceId = String(record.id || record.serviceId || '').trim()
    if (!serviceId) return null
    const numeric = serviceId.replace(/\D/g, '') || String(Date.now()).slice(-4)
    const requestId = `MR-${numeric}`
    const mappedStatus = mapMaintenanceStatusToApproval(record.status)
    return {
        id: requestId,
        requestId,
        vehicleNumber: record.vehicleNumber || '',
        reportedBy: record.createdBy || 'Transport Manager',
        requestDate: record.lastServiceDate || record.nextServiceDate || record.nextServiceDue || '',
        issueType: record.serviceType || 'General Maintenance',
        serviceType: record.serviceType || 'General Maintenance',
        serviceCenter: record.serviceCenter || '',
        estimatedCost: record.estimatedCost || '',
        description: [
            record.serviceType || 'Maintenance',
            record.serviceCenter ? `at ${record.serviceCenter}` : '',
            record.estimatedCost ? `(Est. ${record.estimatedCost})` : '',
        ]
            .filter(Boolean)
            .join(' ')
            .trim(),
        priority: mappedStatus === 'Pending' ? 'High' : 'Medium',
        status: mappedStatus,
        source: 'vehicle-maintenance',
        linkedServiceId: serviceId,
    }
}

export function getTransportApprovalRequests() {
    return getTransportRows(TRANSPORT_APPROVAL_REQUESTS_STORAGE_KEY, DEFAULT_TRANSPORT_APPROVAL_REQUESTS)
}

function mergeVehicleMaintenanceIntoApprovals(approvals) {
    const base = Array.isArray(approvals) ? [...approvals] : []
    const linked = new Set(
        base
            .map((row) => String(row.linkedServiceId || '').trim())
            .filter(Boolean)
    )
    const byRequestId = new Set(base.map((row) => String(row.id || row.requestId || '').trim()))

    getMaintenanceRecords().forEach((record) => {
        const serviceId = String(record.id || record.serviceId || '').trim()
        if (!serviceId || linked.has(serviceId)) return
        const mapped = buildApprovalFromVehicleMaintenance(record)
        if (!mapped) return
        if (byRequestId.has(mapped.requestId)) {
            const idx = base.findIndex((row) => String(row.id || row.requestId) === mapped.requestId)
            if (idx >= 0) {
                base[idx] = { ...base[idx], ...mapped, linkedServiceId: serviceId }
            }
            return
        }
        base.push(mapped)
        linked.add(serviceId)
        byRequestId.add(mapped.requestId)
    })

    return base
}

export function getMaintenanceRequests() {
    return maintenanceRows(mergeVehicleMaintenanceIntoApprovals(getTransportApprovalRequests()))
}

export function getFuelRequests() {
    return fuelRows(getTransportApprovalRequests())
}

export function saveTransportApprovalRequests(rows) {
    return saveTransportRows(TRANSPORT_APPROVAL_REQUESTS_STORAGE_KEY, rows)
}

export async function upsertApprovalRequest(payload) {
    const rows = getTransportApprovalRequests()
    const linkedServiceId = String(payload?.linkedServiceId || '').trim()
    const requestId = String(payload?.id || payload?.requestId || '').trim()
    let idx = -1
    if (linkedServiceId) {
        idx = rows.findIndex((row) => String(row.linkedServiceId || '').trim() === linkedServiceId)
    }
    if (idx < 0 && requestId) {
        idx = rows.findIndex((row) => String(row.id || row.requestId || '').trim() === requestId)
    }

    const nextId = requestId || nextPrefixedId(rows, 'MR-', 1001)
    const next = {
        ...(idx >= 0 ? rows[idx] : {}),
        ...payload,
        id: nextId,
        requestId: nextId,
    }

    if (idx >= 0) rows[idx] = next
    else rows.unshift(next)

    await saveTransportApprovalRequests(rows)
    return next
}

export async function syncApprovalFromVehicleMaintenance(record) {
    const mapped = buildApprovalFromVehicleMaintenance(record)
    if (!mapped) return null
    const existing = getTransportApprovalRequests().find(
        (row) => String(row.linkedServiceId || '').trim() === String(mapped.linkedServiceId || '').trim()
            || String(row.id || row.requestId || '').trim() === mapped.requestId
    )
    // Do not overwrite Principal / TM workflow status when syncing schedule edits.
    if (existing?.status && ['Awaiting Principal', 'Approved', 'Rejected', 'Completed'].includes(existing.status)) {
        return upsertApprovalRequest({
            ...mapped,
            status: existing.status,
            tmApprovedAt: existing.tmApprovedAt,
            principalApprovedAt: existing.principalApprovedAt,
            linkedExpenseId: existing.linkedExpenseId,
        })
    }
    return upsertApprovalRequest(mapped)
}

async function persistApprovalRow(row) {
    const rows = getTransportApprovalRequests()
    const id = String(row.id || row.requestId || '').trim()
    const idx = rows.findIndex((item) => String(item.id || item.requestId || '').trim() === id)
    if (idx >= 0) rows[idx] = row
    else rows.unshift(row)
    const result = await saveTransportApprovalRequests(rows)
    return { row, result }
}

async function syncLinkedMaintenanceStatus(row, status) {
    const linkedServiceId = String(row.linkedServiceId || '').trim()
    if (!linkedServiceId || row.source !== 'vehicle-maintenance') return { success: true }
    const { upsertMaintenanceRecord, getMaintenanceRecords: getRecords } = await import(
        '../VehicleMaintenance/vehicleMaintenanceData'
    )
    const service = getRecords().find((item) => String(item.id || item.serviceId) === linkedServiceId)
    if (!service) return { success: true }
    return upsertMaintenanceRecord(
        {
            ...service,
            status: mapApprovalStatusToMaintenance(status),
        },
        { syncApproval: false }
    )
}

function resolveApprovalRow(requestId) {
    const id = String(requestId || '').trim()
    if (!id) return null
    const stored = getTransportApprovalRequests().find(
        (row) => String(row.id || row.requestId || '').trim() === id
    )
    if (stored) return { ...stored }
    const merged = [...getMaintenanceRequests(), ...getFuelRequests()].find(
        (item) => String(item.id || item.requestId) === id
    )
    return merged ? { ...merged } : null
}

/**
 * Transport Manager decision:
 * - Approve → Awaiting Principal (not final)
 * - Reject → Rejected
 */
export async function updateApprovalRequestStatus(requestId, status) {
    const normalized = String(status || '').trim()
    const lower = normalized.toLowerCase()
    if (lower === 'approved') {
        return decideTransportApproval(requestId, { decision: 'approve', actor: 'transport-manager' })
    }
    if (lower === 'rejected') {
        return decideTransportApproval(requestId, { decision: 'reject', actor: 'transport-manager' })
    }
    const row = resolveApprovalRow(requestId)
    if (!row) return null
    row.status = normalized
    await persistApprovalRow(row)
    await syncLinkedMaintenanceStatus(row, normalized)
    return row
}

/**
 * @param {'approve'|'reject'} decision
 * @param {'transport-manager'|'principal'} actor
 */
export async function decideTransportApproval(requestId, { decision, actor } = {}) {
    const row = resolveApprovalRow(requestId)
    if (!row) return { success: false, message: 'Request not found.' }

    const who = String(actor || 'transport-manager')
    const action = String(decision || '').toLowerCase()
    const current = String(row.status || '').toLowerCase()

    const commitDecision = async (nextStatus, extras = {}) => {
        Object.assign(row, extras, { status: nextStatus })
        const { result } = await persistApprovalRow(row)
        if (result?.success === false) {
            return {
                success: false,
                message: result.message || 'Could not save approval to the campus API (permission denied).',
                row,
            }
        }
        const maintenanceResult = await syncLinkedMaintenanceStatus(row, nextStatus)
        if (maintenanceResult?.success === false) {
            return {
                success: false,
                message: maintenanceResult.message || 'Approval saved, but vehicle maintenance status failed to update.',
                row,
                warning: true,
            }
        }
        return { success: true, row, api: Boolean(result?.api) }
    }

    if (who === 'transport-manager') {
        if (!['pending', 'in-process', 'in process', ''].includes(current)) {
            return { success: false, message: `Cannot decide a request in status "${row.status}".` }
        }
        if (action === 'reject') {
            return commitDecision('Rejected', { tmRejectedAt: new Date().toISOString() })
        }
        if (action !== 'approve') {
            return { success: false, message: 'Unknown decision.' }
        }
        return commitDecision('Awaiting Principal', { tmApprovedAt: new Date().toISOString() })
    }

    if (who === 'principal') {
        if (current !== 'awaiting principal') {
            return { success: false, message: 'Only Transport Manager–approved requests await Principal decision.' }
        }
        if (action === 'reject') {
            return commitDecision('Rejected', { principalRejectedAt: new Date().toISOString() })
        }
        if (action !== 'approve') {
            return { success: false, message: 'Unknown decision.' }
        }

        const committed = await commitDecision('Approved', {
            principalApprovedAt: new Date().toISOString(),
        })
        if (!committed.success && !committed.warning) return committed

        const { postApprovedMaintenanceToFinance } = await import('./transportApprovalFinanceBridge')
        const finance = await postApprovedMaintenanceToFinance(committed.row)
        if (!finance?.success) {
            return {
                success: false,
                message: finance?.message || 'Approved locally but expense could not be posted to the API.',
                row: committed.row,
                finance,
            }
        }
        if (finance?.linkedExpenseId) {
            committed.row.linkedExpenseId = finance.linkedExpenseId
            committed.row.financePosted = true
            await persistApprovalRow(committed.row)
        }
        return { success: true, row: committed.row, finance }
    }

    return { success: false, message: 'Unknown actor.' }
}

export function getPrincipalPendingApprovals() {
    return mergeVehicleMaintenanceIntoApprovals(getTransportApprovalRequests()).filter(
        (row) => String(row.status || '') === 'Awaiting Principal'
    )
}

export function getPrincipalTransportApprovals() {
    return mergeVehicleMaintenanceIntoApprovals(getTransportApprovalRequests()).filter((row) =>
        ['Awaiting Principal', 'Approved', 'Rejected', 'Completed'].includes(String(row.status || ''))
    )
}

export async function hydrateTransportApprovalRequestsFromApi() {
    await Promise.all([
        hydrateTransportRows(TRANSPORT_APPROVAL_REQUESTS_STORAGE_KEY),
        hydrateMaintenanceRecordsFromApi(),
    ])
}
export const MAINTENANCE_REQUESTS = DEFAULT_MAINTENANCE_REQUESTS
export const FUEL_REQUESTS = DEFAULT_FUEL_REQUESTS
