import { ROUTES } from './routeManagementData'
import { STUDENT_TRANSPORTS } from '../StudentTransport/studentTransportData'

const STAFF_KEY = 'school-erp-route-stop-staff-v1'

const readStaff = () => {
    try {
        const raw = localStorage.getItem(STAFF_KEY)
        return raw ? JSON.parse(raw) : null
    } catch {
        return null
    }
}

const seedStaff = () => {
    const rows = ROUTES.flatMap((route) => route.stops.map((stop, index) => ({
        id: `${route.id}-${index}`,
        routeId: route.id,
        stopIndex: index,
        stopName: stop.startLocation,
        staffName: route.supportStaff || '',
        staffNumber: route.supportStaff ? `STF-${route.id.replace(/\D/g, '')}` : '',
    }))).filter((row) => row.staffName)
    localStorage.setItem(STAFF_KEY, JSON.stringify(rows))
    return rows
}

export const getStopStaff = () => readStaff() || seedStaff()

export const staffForStop = (routeId, stopIndex) => (
    getStopStaff().filter((row) => row.routeId === routeId && Number(row.stopIndex) === Number(stopIndex))
)

export const studentsForStop = (route, stop, index) => STUDENT_TRANSPORTS.filter((student) => {
    if (student.routeId !== route.id) return false
    if (student.startLocation === stop.startLocation) return true
    const matchedNamedStop = route.stops.some((item) => item.startLocation === student.startLocation)
    return !matchedNamedStop && index === 0
})
