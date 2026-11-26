import { VEHICLES, VEHICLE_TYPES } from '../VehicleManagement/vehicleManagementData'

export const MAINTENANCE_STATUSES = ['Scheduled', 'Pending']

export const SERVICE_TYPES = [
    'Periodic Maintenance',
    'Oil Change',
    'Tyre Replacement',
    'Brake Inspection',
    'Engine Overhaul',
    'AC Service',
    'Battery Replacement',
]

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
}

export const VEHICLE_OPTIONS = VEHICLES.map((vehicle) => ({
    id: vehicle.id,
    label: vehicle.vehicleNumber,
    vehicleType: vehicle.vehicleType,
}))

export const MAINTENANCE_RECORDS = [
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
    MAINTENANCE_RECORDS.find((record) => record.id === id) ?? null

export { VEHICLE_TYPES }
