export const APPROVAL_STATUSES = ['Pending', 'Approved', 'Rejected']

export const FUEL_LEVEL_OPTIONS = ['100%', '90%', '80%', '70%', '60%', '50%', '40%', '30%', '20%', '10%']

export const DEFAULT_DRIVER = {
    vehicleNumber: 'TN 33 AB 1234',
    driverName: 'Suresh Kumar',
    driverId: 'DRV001',
    assignedRoute: 'Erode Central Route',
}

export const FUEL_REQUESTS = [
    {
        id: 'FR-001',
        fuelRequestId: 'FR001',
        vehicleNumber: 'TN 55 AB 1909',
        driverName: 'Suresh Kumar',
        driverId: 'DRV001',
        assignedRoute: 'Erode Central Route',
        currentOdometerReading: '45,250 KM',
        currentFuelLevel: '70%',
        requestedQuantity: '60 Liters',
        requestDate: '05-08-2025',
        approvalStatus: 'Pending',
    },
    {
        id: 'FR-002',
        fuelRequestId: 'FR002',
        vehicleNumber: 'TN 33 AB 1234',
        driverName: 'Suresh Kumar',
        driverId: 'DRV001',
        assignedRoute: 'Erode Central Route',
        currentOdometerReading: '38,120 KM',
        currentFuelLevel: '55%',
        requestedQuantity: '45 Liters',
        requestDate: '28-07-2025',
        approvalStatus: 'Approved',
    },
    {
        id: 'FR-003',
        fuelRequestId: 'FR003',
        vehicleNumber: 'TN 33 AB 1234',
        driverName: 'Suresh Kumar',
        driverId: 'DRV001',
        assignedRoute: 'Erode Central Route',
        currentOdometerReading: '37,800 KM',
        currentFuelLevel: '25%',
        requestedQuantity: '50 Liters',
        requestDate: '15-07-2025',
        approvalStatus: 'Rejected',
    },
]

export const getFuelRequestById = (id) =>
    FUEL_REQUESTS.find((record) => record.id === id)

export const approvalStatusBadgeColor = {
    Pending: 'bg-[#FF98001A] text-[#FF9800]',
    Approved: 'bg-[#4CAF501A] text-[#4CAF50]',
    Rejected: 'bg-[#FF57221A] text-[#FF5722]',
}

const parseRequestDate = (value) => {
    const [day, month, year] = value.split('-').map(Number)
    if (!day || !month || !year) return null
    return new Date(year, month - 1, day)
}

export const filterFuelRequests = ({
    records,
    search = '',
    approvalStatus = '',
    fromDate = null,
    toDate = null,
}) => records.filter((record) => {
    const query = search.trim().toLowerCase()
    const matchesSearch = !query || [
        record.fuelRequestId,
        record.vehicleNumber,
        record.driverName,
        record.driverId,
        record.assignedRoute,
    ].some((field) => field.toLowerCase().includes(query))

    const matchesStatus = !approvalStatus || record.approvalStatus === approvalStatus

    const requestDate = parseRequestDate(record.requestDate)
    const matchesFrom = !fromDate || (requestDate && requestDate >= fromDate)
    const matchesTo = !toDate || (requestDate && requestDate <= toDate)

    return matchesSearch && matchesStatus && matchesFrom && matchesTo
})
