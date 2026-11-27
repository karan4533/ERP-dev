import { ROUTES } from '../../TransportManager/RouteManagement/routeManagementData'
import { VEHICLES } from '../../TransportManager/VehicleManagement/vehicleManagementData'
import {
    DRIVERS,
    getDriverDisplayName,
    statusBadgeColor as driverStatusBadgeColor,
} from '../../TransportManager/DriverManagement/driverManagementData'
import { FUEL_EXPENSES } from '../../TransportManager/TransportExpenses/transportExpensesData'
import {
    MAINTENANCE_RECORDS,
    statusBadgeColor as maintenanceStatusBadgeColor,
} from '../../TransportManager/VehicleMaintenance/vehicleMaintenanceData'

export const ROUTE_BASE = '/super-admin/transport-overview'

export const OVERVIEW_SECTIONS = [
    { key: 'routes', label: 'Routes' },
    { key: 'vehicles', label: 'Vehicles' },
    { key: 'drivers', label: 'Drivers' },
    { key: 'fuel-expenses', label: 'Fuel Expenses' },
    { key: 'vehicle-maintenance', label: 'Vehicle Maintenance' },
    { key: 'vehicle-documents', label: 'Vehicle Documents' },
]

export { ROUTES, VEHICLES, DRIVERS, FUEL_EXPENSES, MAINTENANCE_RECORDS }
export { getDriverDisplayName, driverStatusBadgeColor, maintenanceStatusBadgeColor }

export const docStatusBadgeColor = {
    Valid: 'bg-[#4CAF5033] text-[#4CAF50]',
    'Expiring Soon': 'bg-[#FF980033] text-[#FF9800]',
    Expired: 'bg-[#FF000033] text-[#FF0000]',
}

export const VEHICLE_DOCUMENTS = [
    { id: 'VD-1001-rc', vehicleNumber: 'TN-09-AB-4521', vehicleType: 'School Van (32 Seater)', docType: 'RC', issuedOn: '12-01-2020', validTill: '11-01-2030', status: 'Valid' },
    { id: 'VD-1001-ins', vehicleNumber: 'TN-09-AB-4521', vehicleType: 'School Van (32 Seater)', docType: 'Insurance Certificate', issuedOn: '16-03-2026', validTill: '15-03-2027', status: 'Valid' },
    { id: 'VD-1001-pol', vehicleNumber: 'TN-09-AB-4521', vehicleType: 'School Van (32 Seater)', docType: 'Pollution Certificate', issuedOn: '10-01-2026', validTill: '09-01-2027', status: 'Valid' },
    { id: 'VD-1001-fit', vehicleNumber: 'TN-09-AB-4521', vehicleType: 'School Van (32 Seater)', docType: 'Fitness Certificate', issuedOn: '14-06-2025', validTill: '13-06-2026', status: 'Expired' },

    { id: 'VD-1002-rc', vehicleNumber: 'TN-09-CD-8834', vehicleType: 'School Bus (45 Seater)', docType: 'RC', issuedOn: '05-08-2019', validTill: '04-08-2029', status: 'Valid' },
    { id: 'VD-1002-ins', vehicleNumber: 'TN-09-CD-8834', vehicleType: 'School Bus (45 Seater)', docType: 'Insurance Certificate', issuedOn: '23-11-2026', validTill: '22-11-2027', status: 'Valid' },
    { id: 'VD-1002-pol', vehicleNumber: 'TN-09-CD-8834', vehicleType: 'School Bus (45 Seater)', docType: 'Pollution Certificate', issuedOn: '20-02-2026', validTill: '19-02-2027', status: 'Valid' },
    { id: 'VD-1002-fit', vehicleNumber: 'TN-09-CD-8834', vehicleType: 'School Bus (45 Seater)', docType: 'Fitness Certificate', issuedOn: '01-07-2025', validTill: '30-06-2026', status: 'Expiring Soon' },

    { id: 'VD-1003-rc', vehicleNumber: 'TN-09-EF-2210', vehicleType: 'School Van (24 Seater)', docType: 'RC', issuedOn: '18-04-2021', validTill: '17-04-2031', status: 'Valid' },
    { id: 'VD-1003-ins', vehicleNumber: 'TN-09-EF-2210', vehicleType: 'School Van (24 Seater)', docType: 'Insurance Certificate', issuedOn: '31-01-2028', validTill: '30-01-2029', status: 'Valid' },
    { id: 'VD-1003-pol', vehicleNumber: 'TN-09-EF-2210', vehicleType: 'School Van (24 Seater)', docType: 'Pollution Certificate', issuedOn: '05-08-2025', validTill: '04-08-2026', status: 'Expiring Soon' },
    { id: 'VD-1003-fit', vehicleNumber: 'TN-09-EF-2210', vehicleType: 'School Van (24 Seater)', docType: 'Fitness Certificate', issuedOn: '12-03-2025', validTill: '11-03-2026', status: 'Valid' },

    { id: 'VD-1004-rc', vehicleNumber: 'TN-09-GH-5567', vehicleType: 'School Bus (45 Seater)', docType: 'RC', issuedOn: '22-06-2018', validTill: '21-06-2028', status: 'Valid' },
    { id: 'VD-1004-ins', vehicleNumber: 'TN-09-GH-5567', vehicleType: 'School Bus (45 Seater)', docType: 'Insurance Certificate', issuedOn: '11-05-2026', validTill: '10-05-2027', status: 'Valid' },
    { id: 'VD-1004-pol', vehicleNumber: 'TN-09-GH-5567', vehicleType: 'School Bus (45 Seater)', docType: 'Pollution Certificate', issuedOn: '15-09-2025', validTill: '14-09-2026', status: 'Valid' },
    { id: 'VD-1004-fit', vehicleNumber: 'TN-09-GH-5567', vehicleType: 'School Bus (45 Seater)', docType: 'Fitness Certificate', issuedOn: '20-01-2025', validTill: '19-01-2026', status: 'Valid' },

    { id: 'VD-1005-rc', vehicleNumber: 'TN-09-IJ-3344', vehicleType: 'Mini Bus (18 Seater)', docType: 'RC', issuedOn: '03-11-2022', validTill: '02-11-2032', status: 'Valid' },
    { id: 'VD-1005-ins', vehicleNumber: 'TN-09-IJ-3344', vehicleType: 'Mini Bus (18 Seater)', docType: 'Insurance Certificate', issuedOn: '09-12-2025', validTill: '08-12-2026', status: 'Expiring Soon' },
    { id: 'VD-1005-pol', vehicleNumber: 'TN-09-IJ-3344', vehicleType: 'Mini Bus (18 Seater)', docType: 'Pollution Certificate', issuedOn: '28-06-2025', validTill: '27-06-2026', status: 'Valid' },
    { id: 'VD-1005-fit', vehicleNumber: 'TN-09-IJ-3344', vehicleType: 'Mini Bus (18 Seater)', docType: 'Fitness Certificate', issuedOn: '10-10-2024', validTill: '09-10-2025', status: 'Expired' },
]

const parseAmount = (value = '') => Number(String(value).replace(/[^\d]/g, '')) || 0

const formatRupee = (amount) => `₹${amount.toLocaleString('en-IN')}`

export const getFleetSummary = () => {
    const totalStops = ROUTES.reduce((sum, route) => sum + (route.totalStops ?? 0), 0)
    const totalCapacity = VEHICLES.reduce((sum, vehicle) => sum + (vehicle.capacity ?? 0), 0)
    const activeDrivers = DRIVERS.filter((driver) => driver.status === 'Active').length
    const fuelSpend = FUEL_EXPENSES.reduce((sum, item) => sum + parseAmount(item.amount), 0)
    const scheduledMaintenance = MAINTENANCE_RECORDS.filter((item) => item.status === 'Scheduled').length
    const expiringDocs = VEHICLE_DOCUMENTS.filter((doc) => doc.status === 'Expiring Soon').length

    return {
        totalRoutes: ROUTES.length,
        totalVehicles: VEHICLES.length,
        activeDrivers,
        totalDrivers: DRIVERS.length,
        totalStops,
        totalCapacity,
        fuelSpend: formatRupee(fuelSpend),
        scheduledMaintenance,
        expiringDocs,
        totalDocuments: VEHICLE_DOCUMENTS.length,
    }
}

export const getSectionSummary = (sectionKey) => {
    switch (sectionKey) {
        case 'routes':
            return [
                { label: 'Active Routes', value: ROUTES.length },
                { label: 'Total Stops', value: ROUTES.reduce((s, r) => s + (r.totalStops ?? 0), 0) },
                { label: 'Avg Distance', value: `${(ROUTES.reduce((s, r) => s + parseFloat(r.distance), 0) / ROUTES.length).toFixed(1)} km` },
                { label: 'Assigned Vehicles', value: new Set(ROUTES.map((r) => r.vehicleNumber)).size },
            ]
        case 'vehicles':
            return [
                { label: 'Fleet Size', value: VEHICLES.length },
                { label: 'Total Capacity', value: VEHICLES.reduce((s, v) => s + v.capacity, 0) },
                { label: 'Van / Bus Types', value: new Set(VEHICLES.map((v) => v.vehicleType)).size },
                { label: 'Service Due (30d)', value: VEHICLES.filter((v) => v.nextServiceDate?.includes('06-2026') || v.nextServiceDate?.includes('07-2026')).length },
            ]
        case 'drivers':
            return [
                { label: 'Total Drivers', value: DRIVERS.length },
                { label: 'Active', value: DRIVERS.filter((d) => d.status === 'Active').length },
                { label: 'On Leave', value: DRIVERS.filter((d) => d.status === 'On Leave').length },
                { label: 'Avg Experience', value: '10 yrs' },
            ]
        case 'fuel-expenses': {
            const total = FUEL_EXPENSES.reduce((s, item) => s + parseAmount(item.amount), 0)
            const totalLitres = FUEL_EXPENSES.reduce((s, item) => s + parseFloat(item.fuelQuantity), 0)
            return [
                { label: 'Fuel Entries', value: FUEL_EXPENSES.length },
                { label: 'Total Spend', value: formatRupee(total) },
                { label: 'Total Quantity', value: `${totalLitres} L` },
                { label: 'Vehicles Fueled', value: new Set(FUEL_EXPENSES.map((f) => f.vehicleNumber)).size },
            ]
        }
        case 'vehicle-maintenance':
            return [
                { label: 'Records', value: MAINTENANCE_RECORDS.length },
                { label: 'Scheduled', value: MAINTENANCE_RECORDS.filter((m) => m.status === 'Scheduled').length },
                { label: 'Pending', value: MAINTENANCE_RECORDS.filter((m) => m.status === 'Pending').length },
                { label: 'Est. Cost', value: formatRupee(MAINTENANCE_RECORDS.reduce((s, m) => s + parseAmount(m.estimatedCost), 0)) },
            ]
        case 'vehicle-documents':
            return [
                { label: 'Documents Tracked', value: VEHICLE_DOCUMENTS.length },
                { label: 'Valid', value: VEHICLE_DOCUMENTS.filter((d) => d.status === 'Valid').length },
                { label: 'Expiring Soon', value: VEHICLE_DOCUMENTS.filter((d) => d.status === 'Expiring Soon').length },
                { label: 'Expired', value: VEHICLE_DOCUMENTS.filter((d) => d.status === 'Expired').length },
            ]
        default:
            return []
    }
}

export const getSectionTable = (sectionKey) => {
    switch (sectionKey) {
        case 'routes':
            return {
                columns: [
                    { key: 'id', label: 'Route ID' },
                    { key: 'routeName', label: 'Route Name' },
                    { key: 'vehicleNumber', label: 'Vehicle' },
                    { key: 'driverName', label: 'Driver' },
                    { key: 'totalStops', label: 'Stops' },
                    { key: 'distance', label: 'Distance' },
                    { key: 'pickUpTime', label: 'Pickup' },
                ],
                rows: ROUTES,
            }
        case 'vehicles':
            return {
                columns: [
                    { key: 'vehicleNumber', label: 'Vehicle No.' },
                    { key: 'vehicleType', label: 'Type' },
                    { key: 'capacity', label: 'Capacity' },
                    { key: 'driverName', label: 'Driver' },
                    { key: 'lastServiceDate', label: 'Last Service' },
                    { key: 'nextServiceDate', label: 'Next Service' },
                    { key: 'insuranceExpiryDate', label: 'Insurance Expiry' },
                ],
                rows: VEHICLES,
            }
        case 'drivers':
            return {
                columns: [
                    { key: 'id', label: 'Driver ID' },
                    { key: 'name', label: 'Name', computed: true },
                    { key: 'mobileNumber', label: 'Mobile' },
                    { key: 'licenseNumber', label: 'License No.' },
                    { key: 'licenseExpiry', label: 'License Expiry' },
                    { key: 'routeAssigned', label: 'Route' },
                    { key: 'status', label: 'Status', badge: true, badgeMap: driverStatusBadgeColor },
                ],
                rows: DRIVERS.map((driver) => ({ ...driver, name: getDriverDisplayName(driver) })),
            }
        case 'fuel-expenses':
            return {
                columns: [
                    { key: 'expenseId', label: 'Expense ID' },
                    { key: 'vehicleNumber', label: 'Vehicle' },
                    { key: 'driverName', label: 'Driver' },
                    { key: 'fuelDate', label: 'Date' },
                    { key: 'fuelStation', label: 'Station' },
                    { key: 'fuelQuantity', label: 'Quantity' },
                    { key: 'amount', label: 'Amount' },
                    { key: 'paymentMode', label: 'Payment' },
                ],
                rows: FUEL_EXPENSES,
            }
        case 'vehicle-maintenance':
            return {
                columns: [
                    { key: 'serviceId', label: 'Service ID' },
                    { key: 'vehicleNumber', label: 'Vehicle' },
                    { key: 'serviceType', label: 'Service Type' },
                    { key: 'lastServiceDate', label: 'Last Service' },
                    { key: 'nextServiceDate', label: 'Next Service' },
                    { key: 'estimatedCost', label: 'Est. Cost' },
                    { key: 'status', label: 'Status', badge: true, badgeMap: maintenanceStatusBadgeColor },
                ],
                rows: MAINTENANCE_RECORDS,
            }
        case 'vehicle-documents':
            return {
                columns: [
                    { key: 'vehicleNumber', label: 'Vehicle No.' },
                    { key: 'vehicleType', label: 'Type' },
                    { key: 'docType', label: 'Document' },
                    { key: 'issuedOn', label: 'Issued On' },
                    { key: 'validTill', label: 'Valid Till' },
                    { key: 'status', label: 'Status', badge: true, badgeMap: docStatusBadgeColor },
                ],
                rows: VEHICLE_DOCUMENTS,
            }
        default:
            return { columns: [], rows: [] }
    }
}

const docsFromVehicles = (vehicles = []) =>
    vehicles.flatMap((vehicle, index) => {
        const number = vehicle.vehicleNumber || vehicle.registrationNumber || `VEH-${index + 1}`
        const type = vehicle.vehicleType || vehicle.type || 'Vehicle'
        const docs = []
        if (vehicle.insuranceExpiryDate || vehicle.insuranceExpiry) {
            docs.push({
                id: `${number}-ins`,
                vehicleNumber: number,
                vehicleType: type,
                docType: 'Insurance Certificate',
                issuedOn: vehicle.insuranceIssuedOn || '—',
                validTill: vehicle.insuranceExpiryDate || vehicle.insuranceExpiry,
                status: vehicle.insuranceStatus || 'Valid',
            })
        }
        if (vehicle.fitnessExpiryDate || vehicle.fitnessExpiry) {
            docs.push({
                id: `${number}-fit`,
                vehicleNumber: number,
                vehicleType: type,
                docType: 'Fitness Certificate',
                issuedOn: vehicle.fitnessIssuedOn || '—',
                validTill: vehicle.fitnessExpiryDate || vehicle.fitnessExpiry,
                status: vehicle.fitnessStatus || 'Valid',
            })
        }
        if (vehicle.pollutionExpiryDate || vehicle.pollutionExpiry) {
            docs.push({
                id: `${number}-pol`,
                vehicleNumber: number,
                vehicleType: type,
                docType: 'Pollution Certificate',
                issuedOn: vehicle.pollutionIssuedOn || '—',
                validTill: vehicle.pollutionExpiryDate || vehicle.pollutionExpiry,
                status: vehicle.pollutionStatus || 'Valid',
            })
        }
        if (!docs.length) {
            docs.push({
                id: `${number}-rc`,
                vehicleNumber: number,
                vehicleType: type,
                docType: 'RC',
                issuedOn: vehicle.rcIssuedOn || '—',
                validTill: vehicle.rcValidTill || '—',
                status: vehicle.docStatus || vehicle.status || 'Valid',
            })
        }
        return docs
    })

/** Live-row helpers used by TransportOverview after hydrate. */
export const getFleetSummaryFromRows = ({ routes = [], vehicles = [], drivers = [], fuel = [], maintenance = [] }) => {
    const documents = docsFromVehicles(vehicles)
    const totalStops = routes.reduce((sum, route) => sum + Number(route.totalStops || route.stops?.length || 0), 0)
    const totalCapacity = vehicles.reduce((sum, vehicle) => sum + Number(vehicle.capacity || 0), 0)
    const activeDrivers = drivers.filter((driver) => String(driver.status || '').toLowerCase() === 'active').length
    const fuelSpend = fuel.reduce((sum, item) => sum + parseAmount(item.amount), 0)
    const scheduledMaintenance = maintenance.filter((item) => /schedul/i.test(String(item.status || ''))).length
    const expiringDocs = documents.filter((doc) => /expir/i.test(String(doc.status || ''))).length
    return {
        totalRoutes: routes.length,
        totalVehicles: vehicles.length,
        activeDrivers,
        totalDrivers: drivers.length,
        totalStops,
        totalCapacity,
        fuelSpend: formatRupee(fuelSpend),
        scheduledMaintenance,
        expiringDocs,
        totalDocuments: documents.length,
    }
}

export const getSectionSummaryFromRows = (sectionKey, data) => {
    const { routes = [], vehicles = [], drivers = [], fuel = [], maintenance = [] } = data || {}
    const documents = docsFromVehicles(vehicles)
    switch (sectionKey) {
        case 'routes':
            return [
                { label: 'Active Routes', value: routes.length },
                { label: 'Total Stops', value: routes.reduce((s, r) => s + Number(r.totalStops || r.stops?.length || 0), 0) },
                { label: 'Assigned Vehicles', value: new Set(routes.map((r) => r.vehicleNumber).filter(Boolean)).size },
                { label: 'Drivers Linked', value: new Set(routes.map((r) => r.driverName || r.driverId).filter(Boolean)).size },
            ]
        case 'vehicles':
            return [
                { label: 'Fleet Size', value: vehicles.length },
                { label: 'Total Capacity', value: vehicles.reduce((s, v) => s + Number(v.capacity || 0), 0) },
                { label: 'Types', value: new Set(vehicles.map((v) => v.vehicleType || v.type).filter(Boolean)).size },
                { label: 'With Driver', value: vehicles.filter((v) => v.driverName || v.driverId).length },
            ]
        case 'drivers':
            return [
                { label: 'Total Drivers', value: drivers.length },
                { label: 'Active', value: drivers.filter((d) => String(d.status || '').toLowerCase() === 'active').length },
                { label: 'On Leave', value: drivers.filter((d) => /leave/i.test(String(d.status || ''))).length },
                { label: 'With Route', value: drivers.filter((d) => d.routeAssigned || d.routeId).length },
            ]
        case 'fuel-expenses': {
            const total = fuel.reduce((s, item) => s + parseAmount(item.amount), 0)
            const totalLitres = fuel.reduce((s, item) => s + (parseFloat(item.fuelQuantity) || 0), 0)
            return [
                { label: 'Fuel Entries', value: fuel.length },
                { label: 'Total Spend', value: formatRupee(total) },
                { label: 'Total Quantity', value: `${totalLitres} L` },
                { label: 'Vehicles Fueled', value: new Set(fuel.map((f) => f.vehicleNumber).filter(Boolean)).size },
            ]
        }
        case 'vehicle-maintenance':
            return [
                { label: 'Records', value: maintenance.length },
                { label: 'Scheduled', value: maintenance.filter((m) => /schedul/i.test(String(m.status || ''))).length },
                { label: 'Pending', value: maintenance.filter((m) => /pend/i.test(String(m.status || ''))).length },
                { label: 'Est. Cost', value: formatRupee(maintenance.reduce((s, m) => s + parseAmount(m.estimatedCost || m.cost), 0)) },
            ]
        case 'vehicle-documents':
            return [
                { label: 'Documents Tracked', value: documents.length },
                { label: 'Valid', value: documents.filter((d) => /valid/i.test(String(d.status || ''))).length },
                { label: 'Expiring Soon', value: documents.filter((d) => /expir/i.test(String(d.status || ''))).length },
                { label: 'Expired', value: documents.filter((d) => String(d.status || '').toLowerCase() === 'expired').length },
            ]
        default:
            return []
    }
}

export const getSectionTableFromRows = (sectionKey, data) => {
    const { routes = [], vehicles = [], drivers = [], fuel = [], maintenance = [] } = data || {}
    const base = getSectionTable(sectionKey)
    switch (sectionKey) {
        case 'routes':
            return { ...base, rows: routes }
        case 'vehicles':
            return { ...base, rows: vehicles }
        case 'drivers':
            return {
                ...base,
                rows: drivers.map((driver) => ({ ...driver, name: getDriverDisplayName(driver) })),
            }
        case 'fuel-expenses':
            return { ...base, rows: fuel }
        case 'vehicle-maintenance':
            return { ...base, rows: maintenance }
        case 'vehicle-documents':
            return { ...base, rows: docsFromVehicles(vehicles) }
        default:
            return { columns: [], rows: [] }
    }
}
