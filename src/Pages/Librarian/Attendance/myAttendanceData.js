export const ATTENDANCE_STATUSES = ['Present', 'Absent', 'Half Day', 'Late', 'On Duty']

export const statusBadgeColor = {
    Present: 'bg-[#4CAF5033] text-[#4CAF50]',
    Absent: 'bg-[#FF000033] text-[#FF0000]',
    'Half Day': 'bg-[#FF980033] text-[#FF9800]',
    Late: 'bg-[#FF980033] text-[#FF9800]',
    'On Duty': 'bg-[#2196F333] text-[#2196F3]',
}

export const MY_ATTENDANCE_LIST = [
    {
        id: 'LIB-ATT-001',
        employeeId: 'LIB-1001',
        name: 'Meera Iyer',
        inTime: '08:20 AM',
        outTime: '04:30 PM',
        attendanceStatus: 'Present',
        date: '24-07-2026',
    },
    {
        id: 'LIB-ATT-002',
        employeeId: 'LIB-1001',
        name: 'Meera Iyer',
        inTime: '08:35 AM',
        outTime: '04:15 PM',
        attendanceStatus: 'Late',
        date: '23-07-2026',
    },
    {
        id: 'LIB-ATT-003',
        employeeId: 'LIB-1001',
        name: 'Meera Iyer',
        inTime: '—',
        outTime: '—',
        attendanceStatus: 'Absent',
        date: '22-07-2026',
    },
    {
        id: 'LIB-ATT-004',
        employeeId: 'LIB-1001',
        name: 'Meera Iyer',
        inTime: '08:25 AM',
        outTime: '12:45 PM',
        attendanceStatus: 'Half Day',
        date: '21-07-2026',
    },
    {
        id: 'LIB-ATT-005',
        employeeId: 'LIB-1001',
        name: 'Meera Iyer',
        inTime: '—',
        outTime: '—',
        attendanceStatus: 'On Duty',
        date: '20-07-2026',
    },
    {
        id: 'LIB-ATT-006',
        employeeId: 'LIB-1001',
        name: 'Meera Iyer',
        inTime: '08:15 AM',
        outTime: '04:35 PM',
        attendanceStatus: 'Present',
        date: '19-07-2026',
    },
]
