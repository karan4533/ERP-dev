export const ROUTE_DETAILS = {
    routeId: 'RT001',
    routeName: 'Erode Central Route',
    vehicleNumber: 'TN 33 AB 1234',
    routeType: 'Morning & Evening',
    totalDistance: '28 KM',
    estimatedTravelTime: '1 Hour 20 Minutes',
    totalStops: '8',
    totalStudents: '46',
    status: 'Active',
}

export const routeStatusBadgeColor = {
    Active: 'bg-[#4CAF501A] text-[#4CAF50]',
    Inactive: 'bg-[#6670851A] text-[#667085]',
    Suspended: 'bg-[#FF98001A] text-[#FF9800]',
}

export const ROUTE_INFO_TILES = [
    { key: 'routeId', label: 'Route ID', icon: 'routeId', iconTone: 'info' },
    { key: 'routeName', label: 'Route Name', icon: 'routeName', iconTone: 'info' },
    { key: 'vehicleNumber', label: 'Vehicle Number', icon: 'routeVehicle', iconTone: 'warning' },
    { key: 'routeType', label: 'Route Type', icon: 'routeType', iconTone: 'success' },
    { key: 'totalDistance', label: 'Total Distance', icon: 'distance', iconTone: 'warning' },
    { key: 'estimatedTravelTime', label: 'Estimated Travel Time', icon: 'travelTime', iconTone: 'info' },
    { key: 'totalStops', label: 'Total Stops', icon: 'stops', iconTone: 'danger' },
    { key: 'totalStudents', label: 'Total Students', icon: 'students', iconTone: 'success' },
    { key: 'status', label: 'Route Status', icon: 'routeStatus', iconTone: 'success', isStatus: true },
]
