export const TRANSPORT_STATUSES = ['Active', 'Inactive', 'Suspended']

export const STUDENT_TRANSPORTS = [
    {
        id: 'STU-001',
        studentId: 'STU001',
        studentName: 'Sandy Selva',
        classSection: 'Grade 9 - A',
        admissionNumber: 'ADM1001',
        routeName: 'Erode Central Route',
        startLocation: 'Central Bus Stand',
        endLocation: 'Central Bus Stand',
        parentContact: '+91 98765 43210',
        transportPass: 'Ramesh Kumar',
        status: 'Active',
        enrolledDate: '01-01-2024',
    },
    {
        id: 'STU-002',
        studentId: 'STU002',
        studentName: 'Priya M.',
        classSection: 'Grade 8 - B',
        admissionNumber: 'ADM1002',
        routeName: 'Erode Central Route',
        startLocation: 'Surampatti Bus Stop',
        endLocation: 'Sample Public School',
        parentContact: '+91 98430 11223',
        transportPass: 'Lakshmi Venkatesh',
        status: 'Active',
        enrolledDate: '15-03-2024',
    },
    {
        id: 'STU-003',
        studentId: 'STU003',
        studentName: 'Arun Raj',
        classSection: 'Grade 10 - A',
        admissionNumber: 'ADM1003',
        routeName: 'Erode Central Route',
        startLocation: 'Teachers Colony',
        endLocation: 'Sample Public School',
        parentContact: '+91 97890 55667',
        transportPass: 'Murugan Raj',
        status: 'Active',
        enrolledDate: '20-06-2024',
    },
    {
        id: 'STU-004',
        studentId: 'STU004',
        studentName: 'Vignesh S.',
        classSection: 'Grade 7 - A',
        admissionNumber: 'ADM1004',
        routeName: 'Erode Central Route',
        startLocation: 'Collector Office',
        endLocation: 'Sample Public School',
        parentContact: '+91 96543 88990',
        transportPass: 'Selvam K.',
        status: 'Active',
        enrolledDate: '10-08-2024',
    },
    {
        id: 'STU-005',
        studentId: 'STU005',
        studentName: 'Divya V.',
        classSection: 'Grade 9 - C',
        admissionNumber: 'ADM1005',
        routeName: 'Erode Central Route',
        startLocation: 'VOC Park',
        endLocation: 'Sample Public School',
        parentContact: '+91 91234 66778',
        transportPass: 'Vijayalakshmi R.',
        status: 'Inactive',
        enrolledDate: '05-01-2025',
    },
    {
        id: 'STU-006',
        studentId: 'STU006',
        studentName: 'Kavin M.',
        classSection: 'Grade 6 - A',
        admissionNumber: 'ADM1006',
        routeName: 'Erode Central Route',
        startLocation: 'Perundurai Road',
        endLocation: 'Sample Public School',
        parentContact: '+91 93600 44556',
        transportPass: 'Balakrishnan P.',
        status: 'Active',
        enrolledDate: '12-04-2025',
    },
]

const parseEnrolledDate = (value) => {
    const [day, month, year] = value.split('-').map(Number)
    if (!day || !month || !year) return null
    return new Date(year, month - 1, day)
}

export const filterStudentTransports = ({
    records,
    search = '',
    status = '',
    fromDate = null,
    toDate = null,
}) => records.filter((record) => {
    const query = search.trim().toLowerCase()
    const matchesSearch = !query || [
        record.studentId,
        record.studentName,
        record.admissionNumber,
        record.routeName,
        record.transportPass,
        record.parentContact,
    ].some((field) => field.toLowerCase().includes(query))

    const matchesStatus = !status || record.status === status

    const enrolledDate = parseEnrolledDate(record.enrolledDate)
    const matchesFrom = !fromDate || (enrolledDate && enrolledDate >= fromDate)
    const matchesTo = !toDate || (enrolledDate && enrolledDate <= toDate)

    return matchesSearch && matchesStatus && matchesFrom && matchesTo
})

export const transportStatusBadgeColor = {
    Active: 'bg-[#4CAF501A] text-[#4CAF50]',
    Inactive: 'bg-[#6670851A] text-[#667085]',
    Suspended: 'bg-[#FF57221A] text-[#FF5722]',
}
