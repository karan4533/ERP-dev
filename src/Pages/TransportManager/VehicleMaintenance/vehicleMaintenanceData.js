import { getVehicleOptions, VEHICLE_TYPES } from '../VehicleManagement/vehicleManagementData'
import { getTransportRows, hydrateTransportRows, saveTransportRows, nextPrefixedId } from '../transportCampus'

export const MAINTENANCE_STATUSES = ['Scheduled', 'Pending', 'Completed', 'Cancelled']

export const SERVICE_TYPES = [
    'Periodic Maintenance',
    'Oil Change',
    'Tyre Replacement',
    'Brake Inspection',
    'Engine Overhaul',
    'AC Service',
    'Battery Replacement',
]

export {
    DEFAULT_SERVICE_CENTERS,
    SERVICE_CENTER_STATUSES,
    getServiceCenters,
    getServiceCenterRows,
    getServiceCenterById,
    addServiceCenter,
    upsertServiceCenter,
    deleteServiceCenter,
    hydrateServiceCentersFromApi,
    SERVICE_CENTERS_STORAGE_KEY,
} from './serviceCentersData'

/** @deprecated Use getServiceCenters() — kept for static imports */
export const SERVICE_CENTERS = [
    'Chennai Automotive Service — Velachery',
    'TN Transport Works — Guindy',
    'Royal Motors Service — Adyar',
    'City Fleet Care — Tambaram',
    'Metro Vehicle Solutions — Porur',
]

export const statusBadgeColor = {
    Scheduled: 'bg-[#2196F333] text-[#2196F3]',
    Pending: 'bg-[#FF980033] text-[#FF9800]',
    Completed: 'bg-[#4CAF5033] text-[#4CAF50]',
    Cancelled: 'bg-[#F4433633] text-[#F44336]',
}

/** @deprecated Use getMaintenanceVehicleOptions() */
export const VEHICLE_OPTIONS = []

export function getMaintenanceVehicleOptions() {
    return getVehicleOptions().map((vehicle) => ({
        id: vehicle.id,
        label: vehicle.vehicleNumber,
        vehicleType: vehicle.vehicleType,
    }))
}

const DEFAULT_MAINTENANCE_RECORDS = [
    {
        id: 'SRV-1001',
        serviceId: 'SRV-1001',
        vehicleNumber: 'TN-09-AB-4521',
        vehicleType: 'School Van (32 Seater)',
        lastServiceDate: '02-05-2026',
        nextServiceDate: '02-08-2026',
        serviceType: 'Periodic Maintenance',
        serviceCenter: 'Chennai Automotive Service — Velachery',
        estimatedCost: '₹12,500',
        status: 'Scheduled',
    },
    {
        id: 'SRV-1002',
        serviceId: 'SRV-1002',
        vehicleNumber: 'TN-09-CD-8834',
        vehicleType: 'School Bus (45 Seater)',
        lastServiceDate: '18-04-2026',
        nextServiceDate: '18-07-2026',
        serviceType: 'Brake Inspection',
        serviceCenter: 'TN Transport Works — Guindy',
        estimatedCost: '₹8,200',
        status: 'Pending',
    },
    {
        id: 'SRV-1003',
        serviceId: 'SRV-1003',
        vehicleNumber: 'TN-09-EF-2210',
        vehicleType: 'School Van (24 Seater)',
        lastServiceDate: '25-05-2026',
        nextServiceDate: '25-08-2026',
        serviceType: 'Oil Change',
        serviceCenter: 'Royal Motors Service — Adyar',
        estimatedCost: '₹4,800',
        status: 'Scheduled',
    },
    {
        id: 'SRV-1004',
        serviceId: 'SRV-1004',
        vehicleNumber: 'TN-09-GH-5567',
        vehicleType: 'School Bus (45 Seater)',
        lastServiceDate: '10-06-2026',
        nextServiceDate: '10-09-2026',
        serviceType: 'AC Service',
        serviceCenter: 'City Fleet Care — Tambaram',
        estimatedCost: '₹6,750',
        status: 'Scheduled',
    },
    {
        id: 'SRV-1005',
        serviceId: 'SRV-1005',
        vehicleNumber: 'TN-09-IJ-3344',
        vehicleType: 'Mini Bus (18 Seater)',
        lastServiceDate: '28-03-2026',
        nextServiceDate: '28-06-2026',
        serviceType: 'Tyre Replacement',
        serviceCenter: 'Metro Vehicle Solutions — Porur',
        estimatedCost: '₹18,400',
        status: 'Pending',
    },
]

export const getMaintenanceById = (id) =>
    getMaintenanceRecords().find((record) => record.id === id) ?? null

export { VEHICLE_TYPES }

export const MAINTENANCE_RECORDS_STORAGE_KEY = 'schoolerp-transport-maintenance-v1'

export function getMaintenanceRecords() {
    return getTransportRows(MAINTENANCE_RECORDS_STORAGE_KEY, DEFAULT_MAINTENANCE_RECORDS)
}

export function saveMaintenanceRecords(rows) {
    return saveTransportRows(MAINTENANCE_RECORDS_STORAGE_KEY, rows)
}

export function hydrateMaintenanceRecordsFromApi() {
    return hydrateTransportRows(MAINTENANCE_RECORDS_STORAGE_KEY)
}

export async function upsertMaintenanceRecord(record, options = {}) {
    const { syncApproval = true } = options
    const rows = getMaintenanceRecords()
    const nextId = record.id || nextPrefixedId(rows, 'SRV-')
    const nextRecord = {
        ...record,
        id: nextId,
        serviceId: record.serviceId || nextId,
        createdBy: record.createdBy || 'Transport Manager',
    }
    const idx = rows.findIndex((row) => row.id === nextId)
    const next = idx >= 0 ? rows.map((row, i) => (i === idx ? nextRecord : row)) : [...rows, nextRecord]
    const result = await saveMaintenanceRecords(next)

    if (syncApproval) {
        const { syncApprovalFromVehicleMaintenance } = await import('../RequestApprovals/requestApprovalsData')
        await syncApprovalFromVehicleMaintenance(nextRecord)
    }

    return { ...result, record: nextRecord }
}

export async function deleteMaintenanceRecord(id) {
    const rows = getMaintenanceRecords()
    const next = rows.filter((row) => row.id !== id)
    if (next.length === rows.length) {
        return { success: false, message: 'Record not found.' }
    }
    return saveMaintenanceRecords(next)
}

export const MAINTENANCE_RECORDS = DEFAULT_MAINTENANCE_RECORDS

