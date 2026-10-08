export const CLASS_OPTIONS = ['6th', '7th', '8th', '9th', '10th', '11th', '12th']

export const SECTION_OPTIONS = ['A', 'B', 'C', 'D']

export const statusBadgeColor = {
    Present: 'bg-[#4CAF5033] text-[#4CAF50]',
    Absent: 'bg-[#FF000033] text-[#FF0000]',
}

export const STUDENT_ATTENDANCE = [
    {
        id: '1',
        admissionNo: 'ADM-NO1845',
        studentName: 'Sandy Selva',
        className: '10th',
        section: 'A',
        onTime: '08:12 AM',
        outTime: '03:28 PM',
        status: 'Present',
    },
    {
        id: '2',
        admissionNo: 'ADM-NO1846',
        studentName: 'Priya Sharma',
        className: '10th',
        section: 'A',
        onTime: '08:05 AM',
        outTime: '03:35 PM',
        status: 'Present',
    },
    {
        id: '3',
        admissionNo: 'ADM-NO1847',
        studentName: 'Arjun Menon',
        className: '10th',
        section: 'B',
        onTime: '—',
        outTime: '—',
        status: 'Absent',
    },
    {
        id: '4',
        admissionNo: 'ADM-NO1848',
        studentName: 'Meera Iyer',
        className: '9th',
        section: 'A',
        onTime: '08:20 AM',
        outTime: '03:25 PM',
        status: 'Present',
    },
    {
        id: '5',
        admissionNo: 'ADM-NO1849',
        studentName: 'Ravi Kumar',
        className: '9th',
        section: 'B',
        onTime: '—',
        outTime: '—',
        status: 'Absent',
    },
    {
        id: '6',
        admissionNo: 'ADM-NO1850',
        studentName: 'Divya Venkat',
        className: '8th',
        section: 'A',
        onTime: '08:10 AM',
        outTime: '03:30 PM',
        status: 'Present',
    },
    {
        id: '7',
        admissionNo: 'ADM-NO1851',
        studentName: 'Kavin Mohan',
        className: '8th',
        section: 'C',
        onTime: '08:18 AM',
        outTime: '03:22 PM',
        status: 'Present',
    },
    {
        id: '8',
        admissionNo: 'ADM-NO1852',
        studentName: 'Anita Desai',
        className: '7th',
        section: 'A',
        onTime: '08:25 AM',
        outTime: '03:40 PM',
        status: 'Present',
    },
    {
        id: '9',
        admissionNo: 'ADM-NO1853',
        studentName: 'Vignesh S.',
        className: '7th',
        section: 'B',
        onTime: '—',
        outTime: '—',
        status: 'Absent',
    },
    {
        id: '10',
        admissionNo: 'ADM-NO1854',
        studentName: 'Lakshmi R.',
        className: '6th',
        section: 'A',
        onTime: '08:08 AM',
        outTime: '03:32 PM',
        status: 'Present',
    },
]

export const filterStudentAttendance = (records, { search = '', className = '', section = '' } = {}) => {
    const query = search.trim().toLowerCase()

    return records.filter((record) => {
        const matchesSearch =
            !query ||
            [record.admissionNo, record.studentName, record.className, record.section].some((field) =>
                field.toLowerCase().includes(query),
            )
        const matchesClass = !className || record.className === className
        const matchesSection = !section || record.section === section

        return matchesSearch && matchesClass && matchesSection
    })
}
