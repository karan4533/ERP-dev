import { liveArray } from '../../../Common/RBAC/liveArray'
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
        gpsImei: route.gpsImei || route.imei || '',
        endLat: route.endLat,
        endLng: route.endLng,
        endMapsUrl: route.endMapsUrl || '',
        stops: Array.isArray(route.stops) ? route.stops : [],
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
    const route = getRoutes().find((item) => (
        item.id === duty.routeId
        || String(item.routeName || '').trim() === String(duty.routeName || '').trim()
    )) || null
    const dutyType = String(duty.dutyType || 'Pickup').trim() === 'Drop' ? 'Drop' : 'Pickup'
    const record = {
        ...duty,
        id: nextId,
        dutyId: duty.dutyId || nextId,
        routeId: duty.routeId || route?.id || '',
        routeName: duty.routeName || route?.routeName || '',
        vehicleNumber: duty.vehicleNumber || route?.vehicleNumber || '',
        gpsImei: duty.gpsImei || route?.gpsImei || route?.imei || '',
        imei: duty.imei || duty.gpsImei || route?.gpsImei || route?.imei || '',
        dutyType,
        shift: duty.shift || (dutyType === 'Drop' ? 'Afternoon' : 'Morning'),
        status: duty.status || duty.dutyStatus || 'Assigned',
        dutyStatus: duty.dutyStatus || duty.status || 'Assigned',
        trackingActive: duty.trackingActive !== false
            && !['Completed', 'Cancelled'].includes(String(duty.dutyStatus || duty.status || '')),
        endLat: duty.endLat ?? route?.endLat ?? '',
        endLng: duty.endLng ?? route?.endLng ?? '',
        endMapsUrl: duty.endMapsUrl || route?.endMapsUrl || '',
        endLocation: duty.endLocation || route?.endLocation || '',
        stops: Array.isArray(duty.stops) ? duty.stops : (route?.stops || []),
        assignedBy: duty.assignedBy || 'Transport Manager',
    }
    const idx = rows.findIndex((row) => row.id === nextId)
    const next = idx >= 0 ? rows.map((row, i) => (i === idx ? record : row)) : [...rows, record]
    const result = await saveDuties(next)
    return { ...result, record }
}

export async function updateDutyStatus(id, dutyStatus) {
    const rows = getDuties()
    const idx = rows.findIndex((row) => row.id === id || row.dutyId === id)
    if (idx < 0) return { success: false, message: 'Duty not found.' }
    const status = String(dutyStatus || '').trim() || 'Assigned'
    const record = {
        ...rows[idx],
        dutyStatus: status,
        status,
        trackingActive: !['Completed', 'Cancelled'].includes(status),
    }
    const next = rows.map((row, i) => (i === idx ? record : row))
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

/** Prefer getDuties() after hydrate — empty in API mode via getTransportRows. */
export const DUTIES = liveArray(getDuties)
