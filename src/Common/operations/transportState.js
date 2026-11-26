const parseDayMonthYear = (value) => {
    const match = /^(\d{2})-(\d{2})-(\d{4})$/.exec(value || '')
    if (!match) return null
    const [, day, month, year] = match
    return new Date(Number(year), Number(month) - 1, Number(day), 23, 59, 59, 999)
}

const startOfDay = (value) => new Date(value.getFullYear(), value.getMonth(), value.getDate())

export const deriveVehicleState = (vehicle, now = new Date()) => {
    const insuranceExpiry = parseDayMonthYear(vehicle.insuranceExpiryDate)
    const nextService = parseDayMonthYear(vehicle.nextServiceDate)
    if (!vehicle.driverName) return 'Driver unassigned'
    if (insuranceExpiry && insuranceExpiry < now) return 'Compliance expired'
    if (nextService && nextService < now) return 'Service overdue'
    if (Number(vehicle.capacity) > 0 && Number(vehicle.studentStrength || 0) + Number(vehicle.staffStrength || 0) >= Number(vehicle.capacity)) return 'At capacity'
    return 'Operational'
}

export const deriveRouteState = (route, vehicle, now = new Date()) => {
    if (!route.vehicleId || !vehicle) return 'Vehicle unassigned'
    if (!route.driverName) return 'Driver unassigned'
    const vehicleState = deriveVehicleState(vehicle, now)
    if (vehicleState !== 'Operational' && vehicleState !== 'At capacity') return 'Vehicle attention'
    if (!route.stops?.length) return 'Stops incomplete'
    return 'Route ready'
}

export const deriveDutyState = (duty, now = new Date()) => {
    if (!duty.driverId || !duty.vehicleNumber || !duty.routeName) return 'Assignment incomplete'
    const dutyDate = parseDayMonthYear(duty.dutyDate)
    if (!dutyDate) return 'Date unknown'
    const today = startOfDay(now)
    const scheduledDay = startOfDay(dutyDate)
    if (scheduledDay < today) return 'Schedule elapsed'
    if (scheduledDay.getTime() === today.getTime()) return 'Due today'
    return 'Scheduled'
}
