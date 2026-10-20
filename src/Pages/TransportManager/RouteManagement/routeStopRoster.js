import { getRoutes } from './routeManagementData'
import { getStudentTransports } from '../StudentTransport/studentTransportData'

const STAFF_KEY = 'school-erp-route-stop-staff-v1'

const norm = (value) => String(value || '').trim().toLowerCase()

const readStaff = () => {
    try {
        const raw = localStorage.getItem(STAFF_KEY)
        return raw ? JSON.parse(raw) : null
    } catch {
        return null
    }
}

const seedStaffFromRoutes = () => {
    const rows = getRoutes().flatMap((route) => {
        const stops = Array.isArray(route.stops) ? route.stops : []
        return stops.map((stop, index) => ({
            id: `${route.id}-${index}`,
            routeId: route.id,
            stopIndex: index,
            stopName: stop.startLocation,
            staffName: route.supportStaff || '',
            staffNumber: route.supportStaff ? `STF-${String(route.id).replace(/\D/g, '')}` : '',
        }))
    }).filter((row) => row.staffName)

    try {
        localStorage.setItem(STAFF_KEY, JSON.stringify(rows))
    } catch {
        /* ignore */
    }
    return rows
}

export const getStopStaff = () => {
    const stored = readStaff()
    if (Array.isArray(stored) && stored.length > 0) return stored
    return seedStaffFromRoutes()
}

export const staffForStop = (routeId, stopIndex, route) => {
    const fromStore = getStopStaff().filter(
        (row) => row.routeId === routeId && Number(row.stopIndex) === Number(stopIndex),
    )
    if (fromStore.length > 0) return fromStore

    // Fallback: show route support staff on each stop when no dedicated staff rows exist.
    const supportStaff = route?.supportStaff
    if (!supportStaff) return []
    return [{
        id: `${routeId}-support-${stopIndex}`,
        routeId,
        stopIndex,
        stopName: route?.stops?.[stopIndex]?.startLocation || '',
        staffName: supportStaff,
        staffNumber: `STF-${String(routeId).replace(/\D/g, '')}`,
    }]
}

/**
 * Students enrolled via Student Transport for this route + pick-up stop.
 * Uses live campus transport-students collection (not static seed).
 */
export const studentsForStop = (route, stop, index) => {
    if (!route?.id) return []
    const enrollments = getStudentTransports()
    const stopName = norm(stop?.startLocation)
    const routeStops = Array.isArray(route.stops) ? route.stops : []

    return enrollments.filter((student) => {
        const sameRoute = (
            student.routeId === route.id
            || norm(student.routeName) === norm(route.routeName)
        )
        if (!sameRoute) return false

        const studentStop = norm(student.startLocation)
        if (!studentStop) {
            // No pick-up point saved — show on first stop only.
            return index === 0
        }
        if (studentStop === stopName) return true

        // If their stop name doesn't match any named stop, park them on stop 0.
        const matchesAnyStop = routeStops.some((item) => norm(item.startLocation) === studentStop)
        return !matchesAnyStop && index === 0
    }).map((student) => ({
        id: student.id || student.studentId,
        studentName: student.studentName || student.name || '—',
        classSection: student.classSection || '—',
        parentName: student.parentName || '—',
        parentContact: student.parentContact || '—',
        studentId: student.studentId,
        admissionNumber: student.admissionNumber,
        startLocation: student.startLocation,
    }))
}
