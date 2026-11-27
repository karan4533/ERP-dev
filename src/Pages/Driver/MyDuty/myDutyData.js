import { getAccessToken, isApiAuthEnabled } from '../../../services/apiClient'
import { hydrateCampusKey, loadCampusJson, saveCampusJson, usesCampusApiForKey } from '../../../services/campusJsonStore'
import { liveArray } from '../../../Common/RBAC/liveArray'

export const SHIFTS = ['Morning', 'Afternoon', 'Evening']

export const DUTY_STATUSES = ['Assigned', 'In Progress', 'Completed', 'Cancelled']

const DEFAULT_MY_DUTIES = [
    {
        id: 'DUTY-2001',
        dutyId: 'DUTY-2001',
        dutyDate: '08-07-2026',
        shift: 'Morning',
        reportingTime: '05:45 AM',
        departureTime: '06:15 AM',
        vehicleNumber: 'TN 33 AB 1234',
        routeName: 'Erode Central Route',
        pickupTime: '06:30 AM',
        dropTime: '08:45 AM',
        assignedBy: 'Transport Manager',
        dutyStatus: 'Assigned',
    },
    {
        id: 'DUTY-2002',
        dutyId: 'DUTY-2002',
        dutyDate: '08-07-2026',
        shift: 'Afternoon',
        reportingTime: '01:30 PM',
        departureTime: '02:00 PM',
        vehicleNumber: 'TN 33 AB 1234',
        routeName: 'Erode Central Route',
        pickupTime: '02:15 PM',
        dropTime: '04:30 PM',
        assignedBy: 'Transport Manager',
        dutyStatus: 'Assigned',
    },
    {
        id: 'DUTY-2003',
        dutyId: 'DUTY-2003',
        dutyDate: '07-07-2026',
        shift: 'Morning',
        reportingTime: '05:45 AM',
        departureTime: '06:10 AM',
        vehicleNumber: 'TN 33 AB 1234',
        routeName: 'Erode Central Route',
        pickupTime: '06:25 AM',
        dropTime: '08:40 AM',
        assignedBy: 'Transport Manager',
        dutyStatus: 'Completed',
    },
    {
        id: 'DUTY-2004',
        dutyId: 'DUTY-2004',
        dutyDate: '07-07-2026',
        shift: 'Afternoon',
        reportingTime: '01:30 PM',
        departureTime: '02:05 PM',
        vehicleNumber: 'TN 33 AB 1234',
        routeName: 'Erode Central Route',
        pickupTime: '02:20 PM',
        dropTime: '04:35 PM',
        assignedBy: 'Transport Manager',
        dutyStatus: 'Completed',
    },
    {
        id: 'DUTY-2005',
        dutyId: 'DUTY-2005',
        dutyDate: '06-07-2026',
        shift: 'Morning',
        reportingTime: '05:50 AM',
        departureTime: '06:20 AM',
        vehicleNumber: 'TN 33 AB 1234',
        routeName: 'Erode Central Route',
        pickupTime: '06:35 AM',
        dropTime: '08:50 AM',
        assignedBy: 'Transport Manager',
        dutyStatus: 'Completed',
    },
    {
        id: 'DUTY-2006',
        dutyId: 'DUTY-2006',
        dutyDate: '09-07-2026',
        shift: 'Morning',
        reportingTime: '05:45 AM',
        departureTime: '06:15 AM',
        vehicleNumber: 'TN 33 AB 1234',
        routeName: 'Erode Central Route',
        pickupTime: '06:30 AM',
        dropTime: '08:45 AM',
        assignedBy: 'Transport Manager',
        dutyStatus: 'In Progress',
    },
]

export const MY_DUTIES_STORAGE_KEY = 'schoolerp-transport-driver-my-duties-v1'
const ASSIGNED_DUTIES_KEY = 'schoolerp-transport-duties-v1'

const asDuty = (row) => ({
    ...row,
    dutyId: row.dutyId || row.id,
    dutyStatus: row.dutyStatus || row.status || 'Assigned',
    routeName: row.routeName || '',
    vehicleNumber: row.vehicleNumber || '',
    assignedBy: row.assignedBy || 'Transport Manager',
})

const apiCatalogMode = () => isApiAuthEnabled() && Boolean(getAccessToken())

export function getMyDuties() {
    const ownFallback = (usesCampusApiForKey(MY_DUTIES_STORAGE_KEY) || apiCatalogMode()) ? [] : DEFAULT_MY_DUTIES
    const own = loadCampusJson(MY_DUTIES_STORAGE_KEY, ownFallback).map(asDuty)
    const assigned = loadCampusJson(ASSIGNED_DUTIES_KEY, []).map(asDuty)
    const seen = new Set()
    return [...assigned, ...own].filter((row) => {
        const key = String(row.dutyId || row.id || '')
        if (!key || seen.has(key)) return false
        seen.add(key)
        return true
    })
}
export function saveMyDuties(rows) {
    return saveCampusJson('schoolerp-transport-driver-my-duties-v1', rows)
}

/** Persist status onto TM Assign Duty collection so Parent/Student Track Bus can hide completed trips. */
export async function setMyDutyStatus(dutyId, dutyStatus) {
    const status = String(dutyStatus || '').trim() || 'Assigned'
    const assigned = loadCampusJson(ASSIGNED_DUTIES_KEY, []).map(asDuty)
    const idx = assigned.findIndex((row) => (
        String(row.id) === String(dutyId) || String(row.dutyId) === String(dutyId)
    ))
    const patchDuty = (row) => ({
        ...row,
        dutyStatus: status,
        status,
        trackingActive: !['Completed', 'Cancelled', 'Done'].includes(status),
        startedAt: ['In Progress', 'Started'].includes(status)
            ? (row.startedAt || new Date().toISOString())
            : row.startedAt,
        completedAt: ['Completed', 'Done'].includes(status)
            ? new Date().toISOString()
            : row.completedAt,
    })
    if (idx >= 0) {
        const next = assigned.map((row, i) => (i === idx ? patchDuty(row) : row))
        await saveCampusJson(ASSIGNED_DUTIES_KEY, next)
        return { success: true, record: next[idx] }
    }
    const own = loadCampusJson(MY_DUTIES_STORAGE_KEY, []).map(asDuty)
    const ownIdx = own.findIndex((row) => (
        String(row.id) === String(dutyId) || String(row.dutyId) === String(dutyId)
    ))
    if (ownIdx < 0) return { success: false, message: 'Duty not found.' }
    const nextOwn = own.map((row, i) => (i === ownIdx ? patchDuty(row) : row))
    await saveMyDuties(nextOwn)
    return { success: true, record: nextOwn[ownIdx] }
}
export function hydrateMyDutiesFromApi() {
    if (!usesCampusApiForKey(MY_DUTIES_STORAGE_KEY)) return Promise.resolve(false)
    return Promise.all([
        hydrateCampusKey(MY_DUTIES_STORAGE_KEY, []),
        hydrateCampusKey(ASSIGNED_DUTIES_KEY, []),
    ]).then(() => true)
}
/** Prefer getMyDuties() — empty when API mode is on (never DEFAULT_MY_DUTIES). */
export const MY_DUTIES = liveArray(getMyDuties)

export const dutyStatusBadgeColor = {
    Assigned: 'bg-[#515DEF1A] text-[#515DEF]',
    'In Progress': 'bg-[#FF98001A] text-[#FF9800]',
    Completed: 'bg-[#4CAF501A] text-[#4CAF50]',
    Cancelled: 'bg-[#FF57221A] text-[#FF5722]',
}

const parseDutyDate = (value) => {
    const [day, month, year] = value.split('-').map(Number)
    if (!day || !month || !year) return null
    return new Date(year, month - 1, day)
}

export const filterMyDuties = ({
    duties,
    search = '',
    shift = '',
    status = '',
    fromDate = null,
    toDate = null,
}) => duties.filter((duty) => {
    const query = search.trim().toLowerCase()
    const matchesSearch = !query || [
        duty.dutyId,
        duty.routeName,
        duty.vehicleNumber,
        duty.assignedBy,
    ].some((field) => String(field || '').toLowerCase().includes(query))

    const matchesShift = !shift || duty.shift === shift
    const matchesStatus = !status || duty.dutyStatus === status

    const dutyDate = parseDutyDate(duty.dutyDate)
    const matchesFrom = !fromDate || (dutyDate && dutyDate >= fromDate)
    const matchesTo = !toDate || (dutyDate && dutyDate <= toDate)

    return matchesSearch && matchesShift && matchesStatus && matchesFrom && matchesTo
})
