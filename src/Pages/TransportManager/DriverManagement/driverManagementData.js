import { getTransportRows, hydrateTransportRows, saveTransportRows } from '../transportCampus'
import {
    DRIVERS as BASE_DRIVERS,
    getDriverDisplayName,
    statusBadgeColor,
    DRIVER_STATUSES,
} from '../../../Common/EmployeeManagement/driversData'

const DRIVER_EXTRAS = {
    'VAN-1001': {
        salary: '₹28,000 / month',
        workShift: 'Morning (6:00 AM – 2:00 PM)',
        username: 'sandy.selva',
        password: 'Driver@2025',
        role: 'Driver',
        addressProof: 'Ration Card — Trichy',
    },
    'VAN-1002': {
        salary: '₹32,000 / month',
        workShift: 'Morning (5:30 AM – 1:30 PM)',
        username: 'rajesh.kumar',
        password: 'Driver@2025',
        role: 'Driver',
        addressProof: 'Electricity Bill — Velachery',
    },
    'VAN-1003': {
        salary: '₹26,000 / month',
        workShift: 'Morning (6:30 AM – 2:30 PM)',
        username: 'priya.venkatesh',
        password: 'Driver@2025',
        role: 'Driver',
        addressProof: 'Aadhaar Address Proof — Adyar',
    },
    'VAN-1004': {
        salary: '₹35,000 / month',
        workShift: 'Morning (5:00 AM – 1:00 PM)',
        username: 'mohan.das',
        password: 'Driver@2025',
        role: 'Driver',
        addressProof: 'Gas Connection Bill — Pallavaram',
    },
}

const DEFAULT_DRIVERS = BASE_DRIVERS.map((driver) => ({
    ...driver,
    ...(DRIVER_EXTRAS[driver.id] ?? {}),
}))

export const getDriverById = (id) => getDrivers().find((driver) => driver.id === id) ?? null

export { getDriverDisplayName, statusBadgeColor, DRIVER_STATUSES }

export const DRIVERS_STORAGE_KEY = 'schoolerp-transport-drivers-v1'

export function getDrivers() {
    return getTransportRows(DRIVERS_STORAGE_KEY, DEFAULT_DRIVERS)
}

export function saveDrivers(rows) {
    return saveTransportRows(DRIVERS_STORAGE_KEY, rows)
}

export function hydrateDriversFromApi() {
    return hydrateTransportRows(DRIVERS_STORAGE_KEY)
}

export function getDriverOptions({ activeOnly = true } = {}) {
    return getDrivers()
        .filter((driver) => {
            if (!activeOnly) return true
            const status = String(driver.status || 'Active').toLowerCase()
            return status === 'active' || status === ''
        })
        .map((driver) => ({
            id: driver.id,
            label: getDriverDisplayName(driver) || driver.name || driver.driverName || driver.id,
            contact: driver.mobileNumber || driver.contact || '',
            vehicleNumber: driver.vehicleNumber || '',
            routeName: driver.routeAssigned || '',
            vehicleType: driver.vehicleType || '',
        }))
}

export const DRIVERS = DEFAULT_DRIVERS
