export const CLASS_OPTIONS = ['12th', '11th', '10th', '9th']
export const SECTION_OPTIONS = ['A', 'B', 'C', 'D']
export const DAY_OPTIONS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export const ROUTE_STOPS = [
    {
        id: 'RS-001',
        stopNo: 1,
        pickupPoint: 'Surampatti Bus Stop',
        arrivalTime: '06:40 AM',
        departureTime: '06:43 AM',
        studentsBoarding: 8,
        landmark: 'Surampatti Signal',
        className: '12th',
        section: 'A',
        day: 'Monday',
    },
    {
        id: 'RS-002',
        stopNo: 2,
        pickupPoint: 'Teachers Colony',
        arrivalTime: '06:50 AM',
        departureTime: '06:53 AM',
        studentsBoarding: 6,
        landmark: 'Water Tank',
        className: '12th',
        section: 'A',
        day: 'Monday',
    },
    {
        id: 'RS-003',
        stopNo: 3,
        pickupPoint: 'Collector Office',
        arrivalTime: '06:55 AM',
        departureTime: '06:58 AM',
        studentsBoarding: 8,
        landmark: 'Collector Gate',
        className: '12th',
        section: 'A',
        day: 'Monday',
    },
    {
        id: 'RS-004',
        stopNo: 4,
        pickupPoint: 'Perundurai Road',
        arrivalTime: '07:05 AM',
        departureTime: '07:08 AM',
        studentsBoarding: 5,
        landmark: 'Petrol Bunk',
        className: '12th',
        section: 'A',
        day: 'Monday',
    },
    {
        id: 'RS-005',
        stopNo: 5,
        pickupPoint: 'VOC Park',
        arrivalTime: '07:15 AM',
        departureTime: '07:18 AM',
        studentsBoarding: 7,
        landmark: 'Park Entrance',
        className: '12th',
        section: 'A',
        day: 'Monday',
    },
    {
        id: 'RS-006',
        stopNo: 6,
        pickupPoint: 'Brough Road',
        arrivalTime: '07:25 AM',
        departureTime: '07:28 AM',
        studentsBoarding: 4,
        landmark: 'Main Junction',
        className: '11th',
        section: 'B',
        day: 'Tuesday',
    },
]

export const filterRouteStops = ({
    stops,
    search = '',
    className = '',
    section = '',
    day = '',
}) => stops.filter((stop) => {
    const query = search.trim().toLowerCase()
    const matchesSearch = !query || [
        stop.pickupPoint,
        stop.landmark,
        String(stop.stopNo),
    ].some((field) => field.toLowerCase().includes(query))

    const matchesClass = !className || stop.className === className
    const matchesSection = !section || stop.section === section
    const matchesDay = !day || stop.day === day

    return matchesSearch && matchesClass && matchesSection && matchesDay
})
