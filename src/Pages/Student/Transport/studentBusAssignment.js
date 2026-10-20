import {
    getStudentTransports,
    hydrateStudentTransportsFromApi,
} from '../../TransportManager/StudentTransport/studentTransportData'
import {
    getRouteById,
    getRoutes,
    hydrateRoutesFromApi,
} from '../../TransportManager/RouteManagement/routeManagementData'
import {
    getVehicles,
    hydrateVehiclesFromApi,
} from '../../TransportManager/VehicleManagement/vehicleManagementData'

const norm = (value) => String(value || '').trim().toLowerCase()
const plateNorm = (value) => String(value || '').replace(/[\s-]/g, '').toUpperCase()

const matchTransportRow = (row, student) => {
    if (!row || !student) return false
    const admission = student.admissionNumber || student.admissionNo || ''
    if (admission && norm(row.admissionNumber) === norm(admission)) return true
    if (student.id && (
        norm(row.studentId) === norm(student.id)
        || norm(row.id) === norm(student.id)
    )) return true
    const name = norm(student.name)
    if (name && norm(row.studentName) === name) {
        const klass = norm(student.classSection || `${student.className || ''}-${student.section || ''}`)
        if (!klass) return true
        return norm(row.classSection).includes(klass.replace(/\s+/g, ''))
            || norm(row.classSection) === klass
    }
    return false
}

/**
 * Resolve live bus assignment for the active student from Transport Manager enrollments.
 */
export function findStudentTransportAssignment(student) {
    if (!student) return null
    const rows = getStudentTransports()
    return rows.find((row) => matchTransportRow(row, student)) || null
}

export function buildBusRouteView(assignment) {
    if (!assignment) return null

    const route = (assignment.routeId && getRouteById(assignment.routeId))
        || getRoutes().find((row) => (
            norm(row.routeName) === norm(assignment.routeName)
            || plateNorm(row.vehicleNumber) === plateNorm(assignment.vehicleNumber)
        ))
        || null

    const vehicles = getVehicles()
    const vehicle = vehicles.find((row) => (
        (assignment.vehicleId && row.id === assignment.vehicleId)
        || (route?.vehicleId && row.id === route.vehicleId)
        || plateNorm(row.vehicleNumber) === plateNorm(assignment.vehicleNumber || route?.vehicleNumber)
    )) || null

    const pickupLocation = assignment.startLocation
        || assignment.pickupLocation
        || route?.startLocation
        || '—'
    const dropLocation = assignment.dropLocation
        || assignment.startLocation
        || route?.startLocation
        || '—'
    const pickUpTime = assignment.pickUpTime || route?.pickUpTime || '—'
    const dropTime = assignment.dropTime || route?.dropTime || '—'

    const stops = Array.isArray(route?.stops) && route.stops.length > 0
        ? route.stops.map((stop) => stop.startLocation || stop.label).filter(Boolean)
        : [pickupLocation, assignment.endLocation || route?.endLocation].filter(Boolean)

    return {
        id: assignment.id,
        routeId: assignment.routeId || route?.id || '',
        routeName: assignment.routeName || route?.routeName || 'Assigned route',
        vehicleNumber: assignment.vehicleNumber || route?.vehicleNumber || vehicle?.vehicleNumber || '—',
        vehicleId: vehicle?.id || route?.vehicleId || assignment.vehicleId || '—',
        driverName: assignment.driverName || route?.driverName || vehicle?.driverName || '—',
        driverContact: assignment.driverContact || route?.driverContact || vehicle?.driverContact || '',
        pickupLocation,
        pickupTime: pickUpTime,
        dropLocation,
        dropTime,
        endLocation: assignment.endLocation || route?.endLocation || 'School',
        routeStops: stops.join(', ') || '—',
        imei: route?.imei || route?.gpsImei || vehicle?.imei || vehicle?.gpsImei || '',
        supportStaff: assignment.supportStaff || route?.supportStaff || '',
    }
}

export async function hydrateStudentBusAssignment(student) {
    await Promise.all([
        hydrateStudentTransportsFromApi(),
        hydrateRoutesFromApi(),
        hydrateVehiclesFromApi(),
    ])
    const assignment = findStudentTransportAssignment(student)
    return buildBusRouteView(assignment)
}
