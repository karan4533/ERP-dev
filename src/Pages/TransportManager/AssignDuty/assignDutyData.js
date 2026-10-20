import { getTransportRows, hydrateTransportRows, saveTransportRows, nextPrefixedId } from '../transportCampus'
import { getDriverOptions } from '../DriverManagement/driverManagementData'
import { getRoutes } from '../RouteManagement/routeManagementData'

export const SHIFTS = ['Morning', 'Afternoon', 'Evening']

/** @deprecated Use getAssignDutyDriverOptions / getAssignDutyRouteOptions */
export const DRIVER_OPTIONS = []
export const ROUTE_OPTIONS = []

export function getAssignDutyDriverOptions() {
    return getDriverOptions().map((driver) => {
        const route = getRoutes().find((item) => item.vehicleNumber === driver.vehicleNumber)
        return {
            id: driver.id,
            label: driver.label,
            vehicleNumber: driver.vehicleNumber,
            routeName: route?.routeName ?? driver.routeName,
        }
    })
}

export function getAssignDutyRouteOptions() {
    return getRoutes().map((route) => ({
        id: route.id,
        label: route.routeName,
        vehicleNumber: route.vehicleNumber,
    }))
}

const DEFAULT_DUTIES = [
    {
        id: 'DUTY-1001',
        dutyId: 'DUTY-1001',
        driverName: 'Sandy Selva',
        driverId: 'VAN-1001',
        vehicleNumber: 'TN-09-AB-4521',
        routeName: 'Route 5 — North Campus',
        dutyDate: '10-06-2026',
        shift: 'Morning',
        startTime: '06:30 AM',
        endTime: '02:00 PM',
    },
    {
        id: 'DUTY-1002',
        dutyId: 'DUTY-1002',
        driverName: 'Rajesh K. Kumar',
        driverId: 'VAN-1002',
        vehicleNumber: 'TN-09-CD-8834',
        routeName: 'Route 2 — East Campus',
        dutyDate: '10-06-2026',
        shift: 'Morning',
        startTime: '06:00 AM',
        endTime: '01:30 PM',
    },
    {
        id: 'DUTY-1003',
        dutyId: 'DUTY-1003',
        driverName: 'Priya M. Venkatesh',
        driverId: 'VAN-1003',
        vehicleNumber: 'TN-09-EF-2210',
        routeName: 'Route 8 — West Campus',
        dutyDate: '11-06-2026',
        shift: 'Morning',
        startTime: '06:45 AM',
        endTime: '02:30 PM',
    },
    {
        id: 'DUTY-1004',
        dutyId: 'DUTY-1004',
        driverName: 'Mohan R. Das',
        driverId: 'VAN-1004',
        vehicleNumber: 'TN-09-GH-5567',
        routeName: 'Route 3 — South Campus',
        dutyDate: '11-06-2026',
        shift: 'Morning',
        startTime: '05:45 AM',
        endTime: '01:00 PM',
    },
    {
        id: 'DUTY-1005',
        dutyId: 'DUTY-1005',
        driverName: 'Sandy Selva',
        driverId: 'VAN-1001',
        vehicleNumber: 'TN-09-AB-4521',
        routeName: 'Route 5 — North Campus',
        dutyDate: '12-06-2026',
        shift: 'Afternoon',
        startTime: '02:30 PM',
        endTime: '06:00 PM',
    },
]

export const getDutyById = (id) => getDuties().find((duty) => duty.id === id) ?? null
export const DUTIES_STORAGE_KEY = 'schoolerp-transport-duties-v1'

export function getDuties() {
    return getTransportRows(DUTIES_STORAGE_KEY, DEFAULT_DUTIES)
}

export function saveDuties(rows) {
    return saveTransportRows(DUTIES_STORAGE_KEY, rows)
}

export function hydrateDutiesFromApi() {
    return hydrateTransportRows(DUTIES_STORAGE_KEY)
}

export async function upsertDuty(duty) {
    const rows = getDuties()
    const nextId = duty.id || nextPrefixedId(rows, 'DUTY-')
    const record = { ...duty, id: nextId, dutyId: duty.dutyId || nextId }
    const idx = rows.findIndex((row) => row.id === nextId)
    const next = idx >= 0 ? rows.map((row, i) => (i === idx ? record : row)) : [...rows, record]
    const result = await saveDuties(next)
    return { ...result, record }
}

export async function deleteDuty(id) {
    const rows = getDuties()
    const next = rows.filter((row) => row.id !== id)
    if (next.length === rows.length) {
        return { success: false, message: 'Duty not found.' }
    }
    return saveDuties(next)
}

export const DUTIES = DEFAULT_DUTIES
