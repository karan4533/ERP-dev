import { getDriverOptions } from '../DriverManagement/driverManagementData'
import { getVehicleOptions } from '../VehicleManagement/vehicleManagementData'
import { getTransportRows, hydrateTransportRows, saveTransportRows, nextPrefixedId } from '../transportCampus'

/** @deprecated Use getRouteDriverOptions() — kept for any static imports */
export const DRIVER_OPTIONS = []

/** @deprecated Use getRouteVehicleOptions() */
export const VEHICLE_OPTIONS = []

export function getRouteDriverOptions() {
    return getDriverOptions().map((driver) => ({
        id: driver.id,
        label: driver.label,
        contact: driver.contact,
    }))
}

export function getRouteVehicleOptions() {
    return getVehicleOptions().map((vehicle) => ({
        id: vehicle.id,
        vehicleNumber: vehicle.vehicleNumber,
        driverName: vehicle.driverName,
        driverContact: vehicle.driverContact,
    }))
}

const DEFAULT_ROUTES = [
    {
        id: 'RT-1001',
        routeName: 'Route 5 — North Campus',
        startLocation: 'Anna Nagar',
        endLocation: 'Queen Mira International School',
        vehicleId: 'VEH-1001',
        vehicleNumber: 'TN-09-AB-4521',
        driverName: 'Sandy Selva',
        driverContact: '9944076993',
        pickUpTime: '06:45 AM',
        dropTime: '07:30 AM',
        yearlyFees: '₹45,000',
        halfYearlyFees: '₹24,000',
        quarterlyFees: '₹12,500',
        monthlyFees: '₹4,200',
        supportStaff: 'Mrs. Lakshmi (Attendant)',
        totalStops: 8,
        distance: '18.5 km',
        estimatedTime: '45 mins',
        stops: [
            {
                startLocation: 'Anna Nagar West Extension',
                endLocation: 'Koyambedu Junction',
                pickUpTime: '06:45 AM',
                dropTime: '07:00 AM',
                yearlyFees: '₹45,000',
                halfYearlyFees: '₹24,000',
                quarterlyFees: '₹12,500',
                monthlyFees: '₹4,200',
            },
            {
                startLocation: 'Koyambedu Junction',
                endLocation: 'Vadapalani Signal',
                pickUpTime: '07:02 AM',
                dropTime: '07:12 AM',
                yearlyFees: '₹42,000',
                halfYearlyFees: '₹22,500',
                quarterlyFees: '₹11,800',
                monthlyFees: '₹4,000',
            },
        ],
    },
    {
        id: 'RT-1002',
        routeName: 'Route 2 — East Campus',
        startLocation: 'Velachery',
        endLocation: 'Queen Mira International School',
        vehicleId: 'VEH-1002',
        vehicleNumber: 'TN-09-CD-8834',
        driverName: 'Rajesh K. Kumar',
        driverContact: '9845012345',
        pickUpTime: '06:30 AM',
        dropTime: '07:25 AM',
        yearlyFees: '₹48,000',
        halfYearlyFees: '₹25,500',
        quarterlyFees: '₹13,200',
        monthlyFees: '₹4,500',
        supportStaff: 'Mr. Karthik (Attendant)',
        totalStops: 10,
        distance: '22.3 km',
        estimatedTime: '55 mins',
        stops: [
            {
                startLocation: 'Velachery Main Road',
                endLocation: 'Adyar Depot',
                pickUpTime: '06:30 AM',
                dropTime: '06:48 AM',
                yearlyFees: '₹48,000',
                halfYearlyFees: '₹25,500',
                quarterlyFees: '₹13,200',
                monthlyFees: '₹4,500',
            },
        ],
    },
    {
        id: 'RT-1003',
        routeName: 'Route 8 — West Campus',
        startLocation: 'Porur',
        endLocation: 'Queen Mira International School',
        vehicleId: 'VEH-1003',
        vehicleNumber: 'TN-09-EF-2210',
        driverName: 'Priya M. Venkatesh',
        driverContact: '9789012345',
        pickUpTime: '06:50 AM',
        dropTime: '07:35 AM',
        yearlyFees: '₹40,000',
        halfYearlyFees: '₹21,500',
        quarterlyFees: '₹11,000',
        monthlyFees: '₹3,800',
        supportStaff: 'Mrs. Anitha (Attendant)',
        totalStops: 6,
        distance: '15.2 km',
        estimatedTime: '40 mins',
        stops: [
            {
                startLocation: 'Porur Junction',
                endLocation: 'Ramapuram',
                pickUpTime: '06:50 AM',
                dropTime: '07:05 AM',
                yearlyFees: '₹40,000',
                halfYearlyFees: '₹21,500',
                quarterlyFees: '₹11,000',
                monthlyFees: '₹3,800',
            },
        ],
    },
    {
        id: 'RT-1004',
        routeName: 'Route 3 — South Campus',
        startLocation: 'Pallavaram',
        endLocation: 'Queen Mira International School',
        vehicleId: 'VEH-1004',
        vehicleNumber: 'TN-09-GH-5567',
        driverName: 'Mohan R. Das',
        driverContact: '9654321098',
        pickUpTime: '06:20 AM',
        dropTime: '07:20 AM',
        yearlyFees: '₹52,000',
        halfYearlyFees: '₹27,500',
        quarterlyFees: '₹14,000',
        monthlyFees: '₹4,800',
        supportStaff: 'Mr. Suresh (Attendant)',
        totalStops: 12,
        distance: '26.8 km',
        estimatedTime: '60 mins',
        stops: [
            {
                startLocation: 'Pallavaram Bus Stand',
                endLocation: 'Chrompet',
                pickUpTime: '06:20 AM',
                dropTime: '06:38 AM',
                yearlyFees: '₹52,000',
                halfYearlyFees: '₹27,500',
                quarterlyFees: '₹14,000',
                monthlyFees: '₹4,800',
            },
            {
                startLocation: 'Chrompet',
                endLocation: 'Tambaram Sanatorium',
                pickUpTime: '06:40 AM',
                dropTime: '06:55 AM',
                yearlyFees: '₹50,000',
                halfYearlyFees: '₹26,500',
                quarterlyFees: '₹13,500',
                monthlyFees: '₹4,600',
            },
        ],
    },
]

export const getRouteById = (id) => getRoutes().find((route) => route.id === id) ?? null

export const ROUTES_STORAGE_KEY = 'schoolerp-transport-routes-v1'

export function getRoutes() {
    return getTransportRows(ROUTES_STORAGE_KEY, DEFAULT_ROUTES)
}

export function saveRoutes(rows) {
    return saveTransportRows(ROUTES_STORAGE_KEY, rows)
}

export function hydrateRoutesFromApi() {
    return hydrateTransportRows(ROUTES_STORAGE_KEY)
}

export async function upsertRoute(route) {
    const rows = getRoutes()
    const nextId = route.id || nextPrefixedId(rows, 'RT-')
    const record = { stops: [], ...route, id: nextId }
    const idx = rows.findIndex((row) => row.id === nextId)
    const next = idx >= 0 ? rows.map((row, i) => (i === idx ? { ...row, ...record } : row)) : [...rows, record]
    const result = await saveRoutes(next)
    return { ...result, record }
}

export async function deleteRoute(id) {
    const rows = getRoutes()
    const next = rows.filter((row) => row.id !== id)
    if (next.length === rows.length) {
        return { success: false, message: 'Route not found.' }
    }
    return saveRoutes(next)
}

export const ROUTES = DEFAULT_ROUTES

