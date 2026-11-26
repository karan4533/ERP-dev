export const SCHOOL_NAME = 'Queen Mira International School'

export const ATTENDANCE_PERIODS = ['Morning', 'Evening']

export const ATTENDANCE_PHASES = {
    Morning: [
        {
            key: 'pickup',
            label: 'Pickup',
            subtitle: "Mark pickup at student's bus stop",
            locationType: 'busStop',
        },
        {
            key: 'drop',
            label: 'Drop',
            subtitle: `Mark drop at ${SCHOOL_NAME}`,
            locationType: 'school',
        },
    ],
    Evening: [
        {
            key: 'pickup',
            label: 'Pickup',
            subtitle: `Mark pickup at ${SCHOOL_NAME}`,
            locationType: 'school',
        },
        {
            key: 'drop',
            label: 'Drop',
            subtitle: "Mark drop at student's bus stop",
            locationType: 'busStop',
        },
    ],
}

export const ATTENDANCE_STATUSES = ['Pending', 'Present', 'Absent']

export const STUDENT_ATTENDANCE = [
    {
        id: 'STU-001',
        studentId: 'STU001',
        studentName: 'Sandy Selva',
        classSection: 'Grade 9 - A',
        busStop: 'Central Bus Stand',
        profileImage: null,
        morning: { pickup: 'Present', drop: 'Present' },
        evening: { pickup: 'Pending', drop: 'Pending' },
    },
    {
        id: 'STU-002',
        studentId: 'STU002',
        studentName: 'Priya M.',
        classSection: 'Grade 8 - B',
        busStop: 'Surampatti Bus Stop',
        profileImage: null,
        morning: { pickup: 'Present', drop: 'Present' },
        evening: { pickup: 'Pending', drop: 'Pending' },
    },
    {
        id: 'STU-003',
        studentId: 'STU003',
        studentName: 'Arun Raj',
        classSection: 'Grade 10 - A',
        busStop: 'Teachers Colony',
        profileImage: null,
        morning: { pickup: 'Absent', drop: 'Absent' },
        evening: { pickup: 'Pending', drop: 'Pending' },
    },
    {
        id: 'STU-004',
        studentId: 'STU004',
        studentName: 'Vignesh S.',
        classSection: 'Grade 7 - A',
        busStop: 'Collector Office',
        profileImage: null,
        morning: { pickup: 'Present', drop: 'Pending' },
        evening: { pickup: 'Pending', drop: 'Pending' },
    },
    {
        id: 'STU-005',
        studentId: 'STU005',
        studentName: 'Divya V.',
        classSection: 'Grade 9 - C',
        busStop: 'VOC Park',
        profileImage: null,
        morning: { pickup: 'Present', drop: 'Present' },
        evening: { pickup: 'Pending', drop: 'Pending' },
    },
    {
        id: 'STU-006',
        studentId: 'STU006',
        studentName: 'Kavin M.',
        classSection: 'Grade 6 - A',
        busStop: 'Perundurai Road',
        profileImage: null,
        morning: { pickup: 'Pending', drop: 'Pending' },
        evening: { pickup: 'Pending', drop: 'Pending' },
    },
]

export const statusStyles = {
    Present: 'bg-[#E8F5E9] text-[#2E7D32] border-[#A5D6A7]',
    Absent: 'bg-[#FFEBEE] text-[#C62828] border-[#EF9A9A]',
    Pending: 'bg-[#FFF8E1] text-[#F57F17] border-[#FFE082]',
}

export const filterStudents = (records, search = '') => {
    const query = search.trim().toLowerCase()
    if (!query) return records
    return records.filter((record) => [
        record.studentId,
        record.studentName,
        record.classSection,
        record.busStop,
    ].some((field) => field.toLowerCase().includes(query)))
}

export const getPhaseStats = (records, period, phase) => {
    const values = records.map((record) => record[period.toLowerCase()]?.[phase] ?? 'Pending')
    return {
        total: records.length,
        present: values.filter((value) => value === 'Present').length,
        absent: values.filter((value) => value === 'Absent').length,
        pending: values.filter((value) => value === 'Pending').length,
    }
}

export const getAttendanceLocation = (record, period, phase) => {
    const phaseConfig = ATTENDANCE_PHASES[period]?.find((item) => item.key === phase)
    if (phaseConfig?.locationType === 'school') return SCHOOL_NAME
    return record.busStop
}

export const getLocationColumnLabel = (period, phase) => {
    const phaseConfig = ATTENDANCE_PHASES[period]?.find((item) => item.key === phase)
    return phaseConfig?.locationType === 'school' ? 'School' : 'Bus Stop'
}
