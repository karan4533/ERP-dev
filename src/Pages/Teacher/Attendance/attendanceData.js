export const ATTENDANCE_STATUSES = ['Present', 'Absent']

export const statusBadgeColor = {
    Present: 'bg-[#4CAF5033] text-[#4CAF50]',
    Absent: 'bg-[#FF000033] text-[#FF0000]',
}

export const inOutStatusBadgeColor = {
    'On Time': 'bg-[#4CAF5033] text-[#4CAF50]',
    Late: 'bg-[#FF980033] text-[#FF9800]',
}

export const CLASSES = ['9', '10']
export const SECTIONS = ['A', 'B']

export const ATTENDANCE_LIST = [
    {
        id: 'ATT-1001',
        studentId: 'STU-2024-1042',
        studentName: 'Arjun Sharma',
        className: '10',
        section: 'A',
        time: '08:00 AM',
        attendanceStatus: 'Present',
        inOutStatus: 'On Time',
    },
    {
        id: 'ATT-1002',
        studentId: 'STU-2024-1087',
        studentName: 'Priya Nair',
        className: '10',
        section: 'A',
        time: '08:00 AM',
        attendanceStatus: 'Present',
        inOutStatus: 'On Time',
    },
    {
        id: 'ATT-1003',
        studentId: 'STU-2024-1156',
        studentName: 'Rahul Verma',
        className: '10',
        section: 'A',
        time: '08:00 AM',
        attendanceStatus: 'Absent',
        inOutStatus: '—',
    },
    {
        id: 'ATT-1004',
        studentId: 'STU-2024-1203',
        studentName: 'Sneha Reddy',
        className: '10',
        section: 'A',
        time: '08:00 AM',
        attendanceStatus: 'Present',
        inOutStatus: 'Late',
    },
    {
        id: 'ATT-1005',
        studentId: 'STU-2024-1318',
        studentName: 'Karthik Menon',
        className: '10',
        section: 'A',
        time: '08:00 AM',
        attendanceStatus: 'Present',
        inOutStatus: 'On Time',
    },
    {
        id: 'ATT-1006',
        studentId: 'STU-2024-1425',
        studentName: 'Divya Krishnan',
        className: '10',
        section: 'A',
        time: '08:00 AM',
        attendanceStatus: 'Absent',
        inOutStatus: '—',
    },
]
