import { ensureCampusSeed, hydrateCampusKey, usesCampusApiForKey, persistCampusJson } from '../../../services/campusJsonStore'
import { nextPrefixedId, formatTransportDate, hydrateTransportRows } from '../../TransportManager/transportCampus'
import {
    TRANSPORT_APPROVAL_REQUESTS_STORAGE_KEY,
    upsertApprovalRequest,
} from '../../TransportManager/RequestApprovals/requestApprovalsData'
import { getDriverDefaultFormValues } from '../driverProfileData'

export const APPROVAL_STATUSES = ['Pending', 'Approved', 'Rejected']
export const FUEL_LEVEL_OPTIONS = ['100%', '90%', '80%', '70%', '60%', '50%', '40%', '30%', '20%', '10%']

export const FUEL_REQUESTS_STORAGE_KEY = 'schoolerp-transport-driver-fuel-v1'

const DEMO_FUEL_REQUESTS = [
    {
        id: 'FR-001',
        fuelRequestId: 'FR-001',
        vehicleNumber: 'TN 33 AB 1234',
        driverName: 'Suresh Kumar',
        driverId: 'DRV001',
        assignedRoute: 'Erode Central Route',
        currentOdometerReading: '45,250 KM',
        currentFuelLevel: '70%',
        requestedQuantity: '60 Liters',
        requestDate: '05-08-2025',
        approvalStatus: 'Pending',
    },
]

export function getDefaultDriver(userEmail = '') {
    return getDriverDefaultFormValues(userEmail)
}

/** @deprecated use getDefaultDriver(email) */
export const DEFAULT_DRIVER = {
    vehicleNumber: '',
    driverName: '',
    driverId: '',
    assignedRoute: '',
}

export const getFuelRequestById = (id) =>
    getDriverFuelRequests().find((record) => record.id === id || record.fuelRequestId === id)

export const approvalStatusBadgeColor = {
    Pending: 'bg-[#FF98001A] text-[#FF9800]',
    Approved: 'bg-[#4CAF501A] text-[#4CAF50]',
    Rejected: 'bg-[#FF57221A] text-[#FF5722]',
}

const parseRequestDate = (value) => {
    const [day, month, year] = String(value || '').split('-').map(Number)
    if (!day || !month || !year) return null
    return new Date(year, month - 1, day)
}

export const filterFuelRequests = ({
    records,
    search = '',
    approvalStatus = '',
    fromDate = null,
    toDate = null,
}) => (Array.isArray(records) ? records : []).filter((record) => {
    const query = search.trim().toLowerCase()
    const matchesSearch = !query || [
        record.fuelRequestId,
        record.vehicleNumber,
        record.driverName,
        record.driverId,
        record.assignedRoute,
    ].some((field) => String(field || '').toLowerCase().includes(query))

    const matchesStatus = !approvalStatus || record.approvalStatus === approvalStatus
    const requestDate = parseRequestDate(record.requestDate)
    const matchesFrom = !fromDate || (requestDate && requestDate >= fromDate)
    const matchesTo = !toDate || (requestDate && requestDate <= toDate)
    return matchesSearch && matchesStatus && matchesFrom && matchesTo
})

export function getDriverFuelRequests() {
    // API mode: never surface DEMO_FUEL_REQUESTS as table rows.
    const seed = usesCampusApiForKey(FUEL_REQUESTS_STORAGE_KEY) ? [] : DEMO_FUEL_REQUESTS
    return ensureCampusSeed(FUEL_REQUESTS_STORAGE_KEY, seed)
}

export function saveDriverFuelRequests(rows) {
    return persistCampusJson(FUEL_REQUESTS_STORAGE_KEY, rows)
}

export function hydrateDriverFuelRequestsFromApi() {
    if (!usesCampusApiForKey(FUEL_REQUESTS_STORAGE_KEY)) return Promise.resolve(false)
    return hydrateCampusKey(FUEL_REQUESTS_STORAGE_KEY, [])
}

export async function upsertDriverFuelRequest(payload) {
    const rows = getDriverFuelRequests()
    const id = payload.id || nextPrefixedId(rows, 'FR-')
    const record = {
        ...payload,
        id,
        fuelRequestId: payload.fuelRequestId || id,
        approvalStatus: payload.approvalStatus || 'Pending',
        requestDate: payload.requestDate || formatTransportDate(new Date()),
    }
    const idx = rows.findIndex((row) => row.id === id || row.fuelRequestId === id)
    const next = idx >= 0
        ? rows.map((row, i) => (i === idx ? { ...row, ...record } : row))
        : [record, ...rows]
    const result = await saveDriverFuelRequests(next)
    if (result?.success === false) return { success: false, message: result.message, record }

    try {
        await hydrateTransportRows(TRANSPORT_APPROVAL_REQUESTS_STORAGE_KEY)
        await upsertApprovalRequest({
            id,
            requestId: id,
            vehicleNumber: record.vehicleNumber,
            reportedBy: record.driverName,
            driverName: record.driverName,
            driverId: record.driverId,
            routeName: record.assignedRoute,
            assignedRoute: record.assignedRoute,
            currentOdometerReading: record.currentOdometerReading,
            currentFuelLevel: record.currentFuelLevel,
            requestedQuantity: record.requestedQuantity,
            requestDate: record.requestDate,
            requestedDate: record.requestDate,
            issueType: 'Fuel Request',
            description: `Qty ${record.requestedQuantity || '—'} · Level ${record.currentFuelLevel || '—'} · Odo ${record.currentOdometerReading || '—'} · Route ${record.assignedRoute || '—'}`,
            priority: 'Medium',
            status: record.approvalStatus === 'Approved' ? 'Approved' : record.approvalStatus === 'Rejected' ? 'Rejected' : 'Pending',
            source: 'driver-panel',
        })
    } catch {
        /* driver list still saved */
    }
    return { success: true, record, api: result?.api }
}

export const FUEL_REQUESTS = []
