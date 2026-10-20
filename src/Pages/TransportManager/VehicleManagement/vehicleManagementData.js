import { getTransportRows, hydrateTransportRows, saveTransportRows, nextPrefixedId } from '../transportCampus'

export const VEHICLE_CATEGORIES = ['Bus', 'Car']

export const BUS_TYPES = [
    'School Van (24 Seater)',
    'School Van (32 Seater)',
    'School Bus (45 Seater)',
    'Mini Bus (18 Seater)',
]

export const CAR_TYPES = ['Crysta', 'Innova', 'Scorpio', 'Honda City', 'Kia']

export const VEHICLE_TYPES = [...BUS_TYPES, ...CAR_TYPES]

const DEFAULT_VEHICLES = [
    {
        id: 'VEH-1001',
        vehicleNumber: 'TN-09-AB-4521',
        vehicleType: 'School Van (32 Seater)',
        capacity: 32,
        driverName: 'Sandy Selva',
        driverContact: '9944076993',
        conductorName: 'Murugan R.',
        studentStrength: 28,
        staffStrength: 2,
        currentOdometer: 45210,
        category: 'Bus',
        insuranceExpiryDate: '15-03-2027',
        lastServiceDate: '02-05-2026',
        nextServiceDate: '02-08-2026',
    },
    {
        id: 'VEH-1002',
        vehicleNumber: 'TN-09-CD-8834',
        vehicleType: 'School Bus (45 Seater)',
        capacity: 45,
        driverName: 'Rajesh K. Kumar',
        driverContact: '9845012345',
        insuranceExpiryDate: '22-11-2027',
        lastServiceDate: '18-04-2026',
        nextServiceDate: '18-07-2026',
    },
    {
        id: 'VEH-1003',
        vehicleNumber: 'TN-09-EF-2210',
        vehicleType: 'School Van (24 Seater)',
        capacity: 24,
        driverName: 'Priya M. Venkatesh',
        driverContact: '9789012345',
        insuranceExpiryDate: '30-01-2029',
        lastServiceDate: '25-05-2026',
        nextServiceDate: '25-08-2026',
    },
    {
        id: 'VEH-1004',
        vehicleNumber: 'TN-09-GH-5567',
        vehicleType: 'School Bus (45 Seater)',
        capacity: 45,
        driverName: 'Mohan R. Das',
        driverContact: '9654321098',
        insuranceExpiryDate: '10-05-2027',
        lastServiceDate: '10-06-2026',
        nextServiceDate: '10-09-2026',
    },
    {
        id: 'VEH-1005',
        vehicleNumber: 'TN-09-IJ-3344',
        vehicleType: 'Mini Bus (18 Seater)',
        capacity: 18,
        driverName: 'Kumaravel S.',
        driverContact: '9123456780',
        insuranceExpiryDate: '08-12-2026',
        lastServiceDate: '28-03-2026',
        nextServiceDate: '28-06-2026',
    },
    {
        id: 'VEH-1006',
        vehicleNumber: 'TN-09-CR-1101',
        vehicleType: 'Crysta',
        category: 'Car',
        capacity: 7,
        driverName: 'Arun Prakash',
        driverContact: '9000011101',
        conductorName: '—',
        studentStrength: 3,
        staffStrength: 1,
        currentOdometer: 22140,
        insuranceExpiryDate: '12-08-2027',
        lastServiceDate: '01-06-2026',
        nextServiceDate: '01-09-2026',
    },
    {
        id: 'VEH-1007',
        vehicleNumber: 'TN-09-IN-2202',
        vehicleType: 'Innova',
        category: 'Car',
        capacity: 7,
        driverName: 'Selvam T.',
        driverContact: '9000012202',
        conductorName: '—',
        studentStrength: 4,
        staffStrength: 1,
        currentOdometer: 31002,
        insuranceExpiryDate: '19-01-2027',
        lastServiceDate: '11-05-2026',
        nextServiceDate: '11-08-2026',
    },
]

export const getVehicleById = (id) => getVehicles().find((vehicle) => vehicle.id === id) ?? null

export const VEHICLES_STORAGE_KEY = 'schoolerp-transport-vehicles-v1'

export function getVehicles() {
    return getTransportRows(VEHICLES_STORAGE_KEY, DEFAULT_VEHICLES)
}

export function saveVehicles(rows) {
    return saveTransportRows(VEHICLES_STORAGE_KEY, rows)
}

export function hydrateVehiclesFromApi() {
    return hydrateTransportRows(VEHICLES_STORAGE_KEY)
}

export function getVehicleOptions() {
    return getVehicles().map((vehicle) => ({
        id: vehicle.id,
        vehicleNumber: vehicle.vehicleNumber,
        label: vehicle.vehicleNumber,
        vehicleType: vehicle.vehicleType,
        driverName: vehicle.driverName,
        driverContact: vehicle.driverContact,
        category: vehicle.category,
    }))
}

export async function upsertVehicle(vehicle) {
    const rows = getVehicles()
    const nextId = vehicle.id || nextPrefixedId(rows, 'VEH-')
    const record = { ...vehicle, id: nextId }
    const idx = rows.findIndex((row) => row.id === nextId)
    const next = idx >= 0 ? rows.map((row, i) => (i === idx ? record : row)) : [...rows, record]
    const result = await saveVehicles(next)
    return { ...result, record }
}

export async function deleteVehicle(id) {
    const rows = getVehicles()
    const next = rows.filter((row) => row.id !== id)
    if (next.length === rows.length) {
        return { success: false, message: 'Vehicle not found.' }
    }
    return saveVehicles(next)
}

/** Static seed / fallback — list pages should call getVehicles() after hydrate */
export const VEHICLES = DEFAULT_VEHICLES

