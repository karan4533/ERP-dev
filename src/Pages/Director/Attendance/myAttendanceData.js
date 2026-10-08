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
        id: 'DIR-ATT-001',
        employeeId: 'DIR-1001',
        name: 'Rajesh Menon',
        inTime: '08:55 AM',
        outTime: '05:30 PM',
        attendanceStatus: 'Present',
        date: '24-07-2026',
    },
    {
        id: 'DIR-ATT-002',
        employeeId: 'DIR-1001',
        name: 'Rajesh Menon',
        inTime: '09:12 AM',
        outTime: '05:15 PM',
        attendanceStatus: 'Late',
        date: '23-07-2026',
    },
    {
        id: 'DIR-ATT-003',
        employeeId: 'DIR-1001',
        name: 'Rajesh Menon',
        inTime: '—',
        outTime: '—',
        attendanceStatus: 'Absent',
        date: '22-07-2026',
    },
    {
        id: 'DIR-ATT-004',
        employeeId: 'DIR-1001',
        name: 'Rajesh Menon',
        inTime: '08:50 AM',
        outTime: '01:00 PM',
        attendanceStatus: 'Half Day',
        date: '21-07-2026',
    },
    {
        id: 'DIR-ATT-005',
        employeeId: 'DIR-1001',
        name: 'Rajesh Menon',
        inTime: '—',
        outTime: '—',
        attendanceStatus: 'On Duty',
        date: '20-07-2026',
    },
    {
        id: 'DIR-ATT-006',
        employeeId: 'DIR-1001',
        name: 'Rajesh Menon',
        inTime: '08:45 AM',
        outTime: '05:35 PM',
        attendanceStatus: 'Present',
        date: '19-07-2026',
    },
]
