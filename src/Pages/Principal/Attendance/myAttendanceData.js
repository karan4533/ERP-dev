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
        id: 'PRIN-ATT-001',
        employeeId: 'PRN-1001',
        name: 'Dr. Meena Krishnan',
        inTime: '08:30 AM',
        outTime: '04:45 PM',
        attendanceStatus: 'Present',
        date: '24-07-2026',
    },
    {
        id: 'PRIN-ATT-002',
        employeeId: 'PRN-1001',
        name: 'Dr. Meena Krishnan',
        inTime: '08:42 AM',
        outTime: '04:30 PM',
        attendanceStatus: 'Late',
        date: '23-07-2026',
    },
    {
        id: 'PRIN-ATT-003',
        employeeId: 'PRN-1001',
        name: 'Dr. Meena Krishnan',
        inTime: '—',
        outTime: '—',
        attendanceStatus: 'Absent',
        date: '22-07-2026',
    },
    {
        id: 'PRIN-ATT-004',
        employeeId: 'PRN-1001',
        name: 'Dr. Meena Krishnan',
        inTime: '08:35 AM',
        outTime: '12:15 PM',
        attendanceStatus: 'Half Day',
        date: '21-07-2026',
    },
    {
        id: 'PRIN-ATT-005',
        employeeId: 'PRN-1001',
        name: 'Dr. Meena Krishnan',
        inTime: '—',
        outTime: '—',
        attendanceStatus: 'On Duty',
        date: '20-07-2026',
    },
    {
        id: 'PRIN-ATT-006',
        employeeId: 'PRN-1001',
        name: 'Dr. Meena Krishnan',
        inTime: '08:28 AM',
        outTime: '04:50 PM',
        attendanceStatus: 'Present',
        date: '19-07-2026',
    },
]
