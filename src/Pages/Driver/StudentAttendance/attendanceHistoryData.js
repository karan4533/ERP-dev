import { SCHOOL_NAME } from './studentAttendanceData'

export const HISTORY_PERIODS = ['Morning', 'Evening']
export const HISTORY_PHASES = ['Pickup', 'Drop']
export const MARKED_STATUSES = ['Present', 'Absent']

export const ATTENDANCE_HISTORY = [
    {
        id: 'AH-001',
        attendanceDate: '08-07-2025',
        studentId: 'STU001',
        studentName: 'Sandy Selva',
        classSection: 'Grade 9 - A',
        busStop: 'Central Bus Stand',
        period: 'Morning',
        phase: 'Pickup',
        location: 'Central Bus Stand',
        status: 'Present',
        markedAt: '07:12 AM',
    },
    {
        id: 'AH-002',
        attendanceDate: '08-07-2025',
        studentId: 'STU001',
        studentName: 'Sandy Selva',
        classSection: 'Grade 9 - A',
        busStop: 'Central Bus Stand',
        period: 'Morning',
        phase: 'Drop',
        location: SCHOOL_NAME,
        status: 'Present',
        markedAt: '08:05 AM',
    },
    {
        id: 'AH-003',
        attendanceDate: '08-07-2025',
        studentId: 'STU002',
        studentName: 'Priya M.',
        classSection: 'Grade 8 - B',
        busStop: 'Surampatti Bus Stop',
        period: 'Morning',
        phase: 'Pickup',
        location: 'Surampatti Bus Stop',
        status: 'Present',
        markedAt: '07:18 AM',
    },
    {
        id: 'AH-004',
        attendanceDate: '08-07-2025',
        studentId: 'STU003',
        studentName: 'Arun Raj',
        classSection: 'Grade 10 - A',
        busStop: 'Teachers Colony',
        period: 'Morning',
        phase: 'Pickup',
        location: 'Teachers Colony',
        status: 'Absent',
        markedAt: '07:22 AM',
    },
    {
        id: 'AH-005',
        attendanceDate: '08-07-2025',
        studentId: 'STU003',
        studentName: 'Arun Raj',
        classSection: 'Grade 10 - A',
        busStop: 'Teachers Colony',
        period: 'Morning',
        phase: 'Drop',
        location: SCHOOL_NAME,
        status: 'Absent',
        markedAt: '08:10 AM',
    },
    {
        id: 'AH-006',
        attendanceDate: '07-07-2025',
        studentId: 'STU004',
        studentName: 'Vignesh S.',
        classSection: 'Grade 7 - A',
        busStop: 'Collector Office',
        period: 'Evening',
        phase: 'Pickup',
        location: SCHOOL_NAME,
        status: 'Present',
        markedAt: '03:45 PM',
    },
    {
        id: 'AH-007',
        attendanceDate: '07-07-2025',
        studentId: 'STU004',
        studentName: 'Vignesh S.',
        classSection: 'Grade 7 - A',
        busStop: 'Collector Office',
        period: 'Evening',
        phase: 'Drop',
        location: 'Collector Office',
        status: 'Present',
        markedAt: '04:20 PM',
    },
    {
        id: 'AH-008',
        attendanceDate: '07-07-2025',
        studentId: 'STU005',
        studentName: 'Divya V.',
        classSection: 'Grade 9 - C',
        busStop: 'VOC Park',
        period: 'Morning',
        phase: 'Pickup',
        location: 'VOC Park',
        status: 'Present',
        markedAt: '07:08 AM',
    },
    {
        id: 'AH-009',
        attendanceDate: '07-07-2025',
        studentId: 'STU005',
        studentName: 'Divya V.',
        classSection: 'Grade 9 - C',
        busStop: 'VOC Park',
        period: 'Morning',
        phase: 'Drop',
        location: SCHOOL_NAME,
        status: 'Present',
        markedAt: '08:02 AM',
    },
    {
        id: 'AH-010',
        attendanceDate: '06-07-2025',
        studentId: 'STU006',
        studentName: 'Kavin M.',
        classSection: 'Grade 6 - A',
        busStop: 'Perundurai Road',
        period: 'Evening',
        phase: 'Pickup',
        location: SCHOOL_NAME,
        status: 'Absent',
        markedAt: '03:50 PM',
    },
    {
        id: 'AH-011',
        attendanceDate: '06-07-2025',
        studentId: 'STU002',
        studentName: 'Priya M.',
        classSection: 'Grade 8 - B',
        busStop: 'Surampatti Bus Stop',
        period: 'Evening',
        phase: 'Drop',
        location: 'Surampatti Bus Stop',
        status: 'Present',
        markedAt: '04:35 PM',
    },
    {
        id: 'AH-012',
        attendanceDate: '05-07-2025',
        studentId: 'STU001',
        studentName: 'Sandy Selva',
        classSection: 'Grade 9 - A',
        busStop: 'Central Bus Stand',
        period: 'Evening',
        phase: 'Pickup',
        location: SCHOOL_NAME,
        status: 'Present',
        markedAt: '03:40 PM',
    },
]

export const markedStatusBadgeColor = {
    Present: 'bg-[#4CAF501A] text-[#4CAF50]',
    Absent: 'bg-[#FF57221A] text-[#FF5722]',
}

const parseAttendanceDate = (value) => {
    const [day, month, year] = value.split('-').map(Number)
    if (!day || !month || !year) return null
    return new Date(year, month - 1, day)
}

export const filterAttendanceHistory = ({
    records,
    search = '',
    period = '',
    phase = '',
    status = '',
    fromDate = null,
    toDate = null,
}) => records.filter((record) => {
    const query = search.trim().toLowerCase()
    const matchesSearch = !query || [
        record.studentId,
        record.studentName,
        record.classSection,
        record.busStop,
        record.location,
    ].some((field) => field.toLowerCase().includes(query))

    const matchesPeriod = !period || record.period === period
    const matchesPhase = !phase || record.phase === phase
    const matchesStatus = !status || record.status === status

    const attendanceDate = parseAttendanceDate(record.attendanceDate)
    const matchesFrom = !fromDate || (attendanceDate && attendanceDate >= fromDate)
    const matchesTo = !toDate || (attendanceDate && attendanceDate <= toDate)

    return matchesSearch && matchesPeriod && matchesPhase && matchesStatus && matchesFrom && matchesTo
})
