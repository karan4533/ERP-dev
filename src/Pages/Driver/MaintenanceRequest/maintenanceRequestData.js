import { ensureCampusSeed, hydrateCampusKey, usesCampusApiForKey, persistCampusJson } from '../../../services/campusJsonStore'
import { nextPrefixedId, formatTransportDate, hydrateTransportRows } from '../../TransportManager/transportCampus'
import {
    TRANSPORT_APPROVAL_REQUESTS_STORAGE_KEY,
    upsertApprovalRequest,
} from '../../TransportManager/RequestApprovals/requestApprovalsData'
import { getDriverDefaultFormValues } from '../driverProfileData'

export const REQUEST_STATUSES = ['Pending', 'In Progress', 'Completed', 'Rejected']
export const PRIORITIES = ['High', 'Medium', 'Low']
export const ISSUE_CATEGORIES = [
    'Brake System',
    'Engine',
    'Electrical',
    'Tyres & Wheels',
    'Suspension',
    'Air Conditioning',
    'Body & Exterior',
    'Other',
]

export const MAINTENANCE_REQUESTS_STORAGE_KEY = 'schoolerp-transport-driver-maintenance-v1'

const DEMO_MAINTENANCE_REQUESTS = [
    {
        id: 'MR-001',
        requestId: 'MR-001',
        vehicleNumber: 'TN 33 AB 1234',
        driverName: 'Suresh Kumar',
        issueCategory: 'Brake System',
        issueDescription: 'Brake pedal feels soft while driving.',
        priority: 'High',
        odometerReading: '45,250 KM',
        reportedDate: '05-08-2025',
        requestStatus: 'Pending',
    },
]

export function getDefaultDriver(userEmail = '') {
    return getDriverDefaultFormValues(userEmail)
}

/** @deprecated */
export const DEFAULT_DRIVER = {
    vehicleNumber: '',
    driverName: '',
}

export const getMaintenanceRequestById = (id) =>
    getDriverMaintenanceRequests().find((record) => record.id === id || record.requestId === id)

export const requestStatusBadgeColor = {
    Pending: 'bg-[#FF57221A] text-[#FF5722]',
    'In Progress': 'bg-[#FF98001A] text-[#FF9800]',
    Completed: 'bg-[#4CAF501A] text-[#4CAF50]',
    Rejected: 'bg-[#6670851A] text-[#667085]',
}

export const priorityBadgeColor = {
    High: 'bg-[#FF00001A] text-[#FF0000]',
    Medium: 'bg-[#FF98001A] text-[#FF9800]',
    Low: 'bg-[#2196F31A] text-[#2196F3]',
}

const parseReportedDate = (value) => {
    const [day, month, year] = String(value || '').split('-').map(Number)
    if (!day || !month || !year) return null
    return new Date(year, month - 1, day)
}

export const filterMaintenanceRequests = ({
    records,
    search = '',
    requestStatus = '',
    fromDate = null,
    toDate = null,
}) => (Array.isArray(records) ? records : []).filter((record) => {
    const query = search.trim().toLowerCase()
    const matchesSearch = !query || [
        record.requestId,
        record.vehicleNumber,
        record.driverName,
        record.issueCategory,
        record.issueDescription,
    ].some((field) => String(field || '').toLowerCase().includes(query))

    const matchesStatus = !requestStatus || record.requestStatus === requestStatus
    const reportedDate = parseReportedDate(record.reportedDate)
    const matchesFrom = !fromDate || (reportedDate && reportedDate >= fromDate)
    const matchesTo = !toDate || (reportedDate && reportedDate <= toDate)
    return matchesSearch && matchesStatus && matchesFrom && matchesTo
})

export function getDriverMaintenanceRequests() {
    // API mode: never surface DEMO_MAINTENANCE_REQUESTS as table rows.
    const seed = usesCampusApiForKey(MAINTENANCE_REQUESTS_STORAGE_KEY) ? [] : DEMO_MAINTENANCE_REQUESTS
    return ensureCampusSeed(MAINTENANCE_REQUESTS_STORAGE_KEY, seed)
}

export function saveDriverMaintenanceRequests(rows) {
    return persistCampusJson(MAINTENANCE_REQUESTS_STORAGE_KEY, rows)
}

export function hydrateDriverMaintenanceRequestsFromApi() {
    if (!usesCampusApiForKey(MAINTENANCE_REQUESTS_STORAGE_KEY)) return Promise.resolve(false)
    return hydrateCampusKey(MAINTENANCE_REQUESTS_STORAGE_KEY, [])
}

export async function upsertDriverMaintenanceRequest(payload) {
    const rows = getDriverMaintenanceRequests()
    const id = payload.id || nextPrefixedId(rows, 'MR-')
    const record = {
        ...payload,
        id,
        requestId: payload.requestId || id,
        requestStatus: payload.requestStatus || 'Pending',
        reportedDate: payload.reportedDate || formatTransportDate(new Date()),
    }
    const idx = rows.findIndex((row) => row.id === id || row.requestId === id)
    const next = idx >= 0
        ? rows.map((row, i) => (i === idx ? { ...row, ...record } : row))
        : [record, ...rows]
    const result = await saveDriverMaintenanceRequests(next)
    if (result?.success === false) return { success: false, message: result.message, record }

    try {
        await hydrateTransportRows(TRANSPORT_APPROVAL_REQUESTS_STORAGE_KEY)
        await upsertApprovalRequest({
            id,
            requestId: id,
            vehicleNumber: record.vehicleNumber,
            reportedBy: record.driverName,
            driverName: record.driverName,
            requestDate: record.reportedDate,
            issueType: record.issueCategory || 'General Maintenance',
            description: record.issueDescription || '',
            issueDescription: record.issueDescription || '',
            issueCategory: record.issueCategory || '',
            odometerReading: record.odometerReading || '',
            priority: record.priority || 'Medium',
            status: record.requestStatus === 'Completed'
                ? 'Completed'
                : record.requestStatus === 'Rejected'
                    ? 'Rejected'
                    : 'Pending',
            source: 'driver-panel',
        })
    } catch {
        /* list still saved */
    }
    return { success: true, record, api: result?.api }
}

export const MAINTENANCE_REQUESTS = []
