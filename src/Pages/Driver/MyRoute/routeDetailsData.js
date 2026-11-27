import { resolveDriverProfile } from '../driverProfileData'

export const routeStatusBadgeColor = {
    Active: 'bg-[#4CAF501A] text-[#4CAF50]',
    Inactive: 'bg-[#6670851A] text-[#667085]',
    Suspended: 'bg-[#FF98001A] text-[#FF9800]',
}

export const ROUTE_INFO_TILES = [
    { key: 'routeId', label: 'Route ID', icon: 'routeId', iconTone: 'info' },
    { key: 'routeName', label: 'Route Name', icon: 'routeName', iconTone: 'info' },
    { key: 'vehicleNumber', label: 'Vehicle Number', icon: 'routeVehicle', iconTone: 'warning' },
    { key: 'routeType', label: 'Route Type', icon: 'routeType', iconTone: 'success' },
    { key: 'totalDistance', label: 'Total Distance', icon: 'distance', iconTone: 'warning' },
    { key: 'estimatedTravelTime', label: 'Estimated Travel Time', icon: 'travelTime', iconTone: 'info' },
    { key: 'totalStops', label: 'Total Stops', icon: 'stops', iconTone: 'danger' },
    { key: 'totalStudents', label: 'Total Students', icon: 'students', iconTone: 'success' },
    { key: 'status', label: 'Route Status', icon: 'routeStatus', iconTone: 'success', isStatus: true },
]

export function getMyRouteDetails(userEmail = '') {
    const ctx = resolveDriverProfile(userEmail)
    const route = ctx.route
    const stopCount = Array.isArray(route?.stops) ? route.stops.length : Number(route?.totalStops || 0)
    return {
        routeId: ctx.routeId,
        routeName: ctx.routeName,
        vehicleNumber: ctx.vehicleNumber,
        routeType: route?.routeType || 'Morning & Evening',
        totalDistance: route?.distance || route?.totalDistance || '—',
        estimatedTravelTime: route?.estimatedTime || route?.estimatedTravelTime || '—',
        totalStops: String(stopCount || '—'),
        totalStudents: String(ctx.students.length || 0),
        status: route?.status || ctx.vehicle?.status || (route ? 'Active' : '—'),
        startLocation: route?.startLocation || '—',
        endLocation: route?.endLocation || '—',
    }
}

/** @deprecated use getMyRouteDetails */
export const ROUTE_DETAILS = {
    routeId: '—',
    routeName: '—',
    vehicleNumber: '—',
    routeType: '—',
    totalDistance: '—',
    estimatedTravelTime: '—',
    totalStops: '—',
    totalStudents: '—',
    status: '—',
}
