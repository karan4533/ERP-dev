export const REQUEST_STATUSES = ['Pending', 'In Progress', 'Completed', 'Rejected']

export const PRIORITIES = ['High', 'Medium', 'Low']

export const ISSUE_CATEGORIES = [
    'Brake System',
    'Engine',
    'Electrical',
    'Tyres & Wheels',
    'Suspension',
    'Air Conditioning',
    'Body & Exterior',
    'Other',
]

export const DEFAULT_DRIVER = {
    vehicleNumber: 'TN 33 AB 1234',
    driverName: 'Suresh Kumar',
}

export const MAINTENANCE_REQUESTS = [
    {
        id: 'MR-001',
        requestId: 'MR001',
        vehicleNumber: 'TN 33 AB 1234',
        driverName: 'Suresh Kumar',
        issueCategory: 'Brake System',
        issueDescription: 'Brake pedal feels soft while driving.',
        priority: 'High',
        odometerReading: '45,250 KM',
        reportedDate: '05-08-2025',
        requestStatus: 'Pending',
    },
    {
        id: 'MR-002',
        requestId: 'MR002',
        vehicleNumber: 'TN 33 AB 1234',
        driverName: 'Suresh Kumar',
        issueCategory: 'Engine',
        issueDescription: 'Unusual knocking sound from engine during acceleration.',
        priority: 'Medium',
        odometerReading: '44,980 KM',
        reportedDate: '28-07-2025',
        requestStatus: 'In Progress',
    },
    {
        id: 'MR-003',
        requestId: 'MR003',
        vehicleNumber: 'TN 55 AB 1909',
        driverName: 'Suresh Kumar',
        issueCategory: 'Electrical',
        issueDescription: 'Headlight flickers intermittently at night.',
        priority: 'Low',
        odometerReading: '38,120 KM',
        reportedDate: '15-07-2025',
        requestStatus: 'Completed',
    },
]

export const getMaintenanceRequestById = (id) =>
    MAINTENANCE_REQUESTS.find((record) => record.id === id)

export const requestStatusBadgeColor = {
    Pending: 'bg-[#FF57221A] text-[#FF5722]',
    'In Progress': 'bg-[#FF98001A] text-[#FF9800]',
    Completed: 'bg-[#4CAF501A] text-[#4CAF50]',
    Rejected: 'bg-[#6670851A] text-[#667085]',
}

export const priorityBadgeColor = {
    High: 'bg-[#FF00001A] text-[#FF0000]',
    Medium: 'bg-[#FF98001A] text-[#FF9800]',
    Low: 'bg-[#2196F31A] text-[#2196F3]',
}

const parseReportedDate = (value) => {
    const [day, month, year] = value.split('-').map(Number)
    if (!day || !month || !year) return null
    return new Date(year, month - 1, day)
}

export const filterMaintenanceRequests = ({
    records,
    search = '',
    requestStatus = '',
    fromDate = null,
    toDate = null,
}) => records.filter((record) => {
    const query = search.trim().toLowerCase()
    const matchesSearch = !query || [
        record.requestId,
        record.vehicleNumber,
        record.driverName,
        record.issueCategory,
        record.issueDescription,
    ].some((field) => field.toLowerCase().includes(query))

    const matchesStatus = !requestStatus || record.requestStatus === requestStatus

    const reportedDate = parseReportedDate(record.reportedDate)
    const matchesFrom = !fromDate || (reportedDate && reportedDate >= fromDate)
    const matchesTo = !toDate || (reportedDate && reportedDate <= toDate)

    return matchesSearch && matchesStatus && matchesFrom && matchesTo
})
