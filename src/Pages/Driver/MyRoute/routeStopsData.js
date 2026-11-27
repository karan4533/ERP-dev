import { resolveDriverProfile } from '../driverProfileData'

export const CLASS_OPTIONS = []
export const SECTION_OPTIONS = []
export const DAY_OPTIONS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

/**
 * Build stop rows from the driver's assigned route + boarding counts from student enrollments.
 */
export function getRouteStops(userEmail = '') {
    const ctx = resolveDriverProfile(userEmail)
    const stops = Array.isArray(ctx.route?.stops) ? ctx.route.stops : []
    if (stops.length === 0) return []

    return stops.map((stop, index) => {
        const pickupPoint = stop.startLocation || stop.label || `Stop ${index + 1}`
        const boarding = ctx.students.filter((row) => {
            const want = String(row.startLocation || row.pickupPoint || row.stopName || '').trim().toLowerCase()
            const have = String(pickupPoint).trim().toLowerCase()
            return want && have && (want === have || want.includes(have) || have.includes(want))
        }).length
        return {
            id: `${ctx.routeId || 'RT'}-stop-${index + 1}`,
            stopNo: index + 1,
            pickupPoint,
            arrivalTime: stop.pickUpTime || '—',
            departureTime: stop.dropTime || stop.pickUpTime || '—',
            studentsBoarding: boarding,
            landmark: stop.landmark || stop.endLocation || '—',
            mapsUrl: stop.pickupMapsUrl || '',
            className: '',
            section: '',
            day: '',
        }
    })
}

export const filterRouteStops = ({
    stops,
    search = '',
}) => (Array.isArray(stops) ? stops : []).filter((stop) => {
    const query = search.trim().toLowerCase()
    if (!query) return true
    return [
        stop.pickupPoint,
        stop.landmark,
        String(stop.stopNo),
    ].some((field) => String(field || '').toLowerCase().includes(query))
})

export function hydrateRouteStopsFromApi() {
    return Promise.resolve(true)
}

/** @deprecated */
export const ROUTE_STOPS = []
