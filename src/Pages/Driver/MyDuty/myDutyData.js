export const SHIFTS = ['Morning', 'Afternoon', 'Evening']

export const DUTY_STATUSES = ['Assigned', 'In Progress', 'Completed', 'Cancelled']

export const MY_DUTIES = [
    {
        id: 'DUTY-2001',
        dutyId: 'DUTY-2001',
        dutyDate: '08-07-2026',
        shift: 'Morning',
        reportingTime: '05:45 AM',
        departureTime: '06:15 AM',
        vehicleNumber: 'TN 33 AB 1234',
        routeName: 'Erode Central Route',
        pickupTime: '06:30 AM',
        dropTime: '08:45 AM',
        assignedBy: 'Transport Manager',
        dutyStatus: 'Assigned',
    },
    {
        id: 'DUTY-2002',
        dutyId: 'DUTY-2002',
        dutyDate: '08-07-2026',
        shift: 'Afternoon',
        reportingTime: '01:30 PM',
        departureTime: '02:00 PM',
        vehicleNumber: 'TN 33 AB 1234',
        routeName: 'Erode Central Route',
        pickupTime: '02:15 PM',
        dropTime: '04:30 PM',
        assignedBy: 'Transport Manager',
        dutyStatus: 'Assigned',
    },
    {
        id: 'DUTY-2003',
        dutyId: 'DUTY-2003',
        dutyDate: '07-07-2026',
        shift: 'Morning',
        reportingTime: '05:45 AM',
        departureTime: '06:10 AM',
        vehicleNumber: 'TN 33 AB 1234',
        routeName: 'Erode Central Route',
        pickupTime: '06:25 AM',
        dropTime: '08:40 AM',
        assignedBy: 'Transport Manager',
        dutyStatus: 'Completed',
    },
    {
        id: 'DUTY-2004',
        dutyId: 'DUTY-2004',
        dutyDate: '07-07-2026',
        shift: 'Afternoon',
        reportingTime: '01:30 PM',
        departureTime: '02:05 PM',
        vehicleNumber: 'TN 33 AB 1234',
        routeName: 'Erode Central Route',
        pickupTime: '02:20 PM',
        dropTime: '04:35 PM',
        assignedBy: 'Transport Manager',
        dutyStatus: 'Completed',
    },
    {
        id: 'DUTY-2005',
        dutyId: 'DUTY-2005',
        dutyDate: '06-07-2026',
        shift: 'Morning',
        reportingTime: '05:50 AM',
        departureTime: '06:20 AM',
        vehicleNumber: 'TN 33 AB 1234',
        routeName: 'Erode Central Route',
        pickupTime: '06:35 AM',
        dropTime: '08:50 AM',
        assignedBy: 'Transport Manager',
        dutyStatus: 'Completed',
    },
    {
        id: 'DUTY-2006',
        dutyId: 'DUTY-2006',
        dutyDate: '09-07-2026',
        shift: 'Morning',
        reportingTime: '05:45 AM',
        departureTime: '06:15 AM',
        vehicleNumber: 'TN 33 AB 1234',
        routeName: 'Erode Central Route',
        pickupTime: '06:30 AM',
        dropTime: '08:45 AM',
        assignedBy: 'Transport Manager',
        dutyStatus: 'In Progress',
    },
]

export const dutyStatusBadgeColor = {
    Assigned: 'bg-[#515DEF1A] text-[#515DEF]',
    'In Progress': 'bg-[#FF98001A] text-[#FF9800]',
    Completed: 'bg-[#4CAF501A] text-[#4CAF50]',
    Cancelled: 'bg-[#FF57221A] text-[#FF5722]',
}

const parseDutyDate = (value) => {
    const [day, month, year] = value.split('-').map(Number)
    if (!day || !month || !year) return null
    return new Date(year, month - 1, day)
}

export const filterMyDuties = ({
    duties,
    search = '',
    shift = '',
    status = '',
    fromDate = null,
    toDate = null,
}) => duties.filter((duty) => {
    const query = search.trim().toLowerCase()
    const matchesSearch = !query || [
        duty.dutyId,
        duty.routeName,
        duty.vehicleNumber,
        duty.assignedBy,
    ].some((field) => field.toLowerCase().includes(query))

    const matchesShift = !shift || duty.shift === shift
    const matchesStatus = !status || duty.dutyStatus === status

    const dutyDate = parseDutyDate(duty.dutyDate)
    const matchesFrom = !fromDate || (dutyDate && dutyDate >= fromDate)
    const matchesTo = !toDate || (dutyDate && dutyDate <= toDate)

    return matchesSearch && matchesShift && matchesStatus && matchesFrom && matchesTo
})
