export const VEHICLE_DETAILS = {
    vehicleId: 'VH001',
    vehicleNumber: 'TN 33 AB 1234',
    vehicleType: 'School Bus',
    vehicleModel: 'Ashok Leyland',
    seatingCapacity: '50',
    assignedDriver: 'Suresh Kumar',
    driverContact: '+91 9944076993',
    assignedRoute: 'Erode Central Route',
    status: 'Active',
}

export const vehicleStatusBadgeColor = {
    Active: 'bg-[#4CAF501A] text-[#4CAF50]',
    Inactive: 'bg-[#6670851A] text-[#667085]',
    Maintenance: 'bg-[#FF98001A] text-[#FF9800]',
}

export const VEHICLE_INFO_TILES = [
    { key: 'vehicleId', label: 'Vehicle ID', icon: 'id', iconTone: 'info' },
    { key: 'vehicleNumber', label: 'Vehicle Number', icon: 'number', iconTone: 'info' },
    { key: 'vehicleType', label: 'Vehicle Type', icon: 'type', iconTone: 'warning' },
    { key: 'vehicleModel', label: 'Vehicle Model', icon: 'model', iconTone: 'success' },
    { key: 'seatingCapacity', label: 'Seating Capacity', icon: 'capacity', iconTone: 'warning' },
    { key: 'assignedDriver', label: 'Assigned Driver', icon: 'driver', iconTone: 'info' },
    { key: 'driverContact', label: 'Driver Contact', icon: 'contact', iconTone: 'danger' },
    { key: 'assignedRoute', label: 'Assigned Route', icon: 'route', iconTone: 'success' },
    { key: 'status', label: 'Vehicle Status', icon: 'status', iconTone: 'success', isStatus: true },
]
