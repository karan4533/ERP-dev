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
        id: 'FO-ATT-001',
        employeeId: 'FO-1001',
        name: 'Priya L. Sharma',
        inTime: '08:15 AM',
        outTime: '05:00 PM',
        attendanceStatus: 'Present',
        date: '24-07-2026',
    },
    {
        id: 'FO-ATT-002',
        employeeId: 'FO-1001',
        name: 'Priya L. Sharma',
        inTime: '08:28 AM',
        outTime: '04:55 PM',
        attendanceStatus: 'Late',
        date: '23-07-2026',
    },
    {
        id: 'FO-ATT-003',
        employeeId: 'FO-1001',
        name: 'Priya L. Sharma',
        inTime: '—',
        outTime: '—',
        attendanceStatus: 'Absent',
        date: '22-07-2026',
    },
    {
        id: 'FO-ATT-004',
        employeeId: 'FO-1001',
        name: 'Priya L. Sharma',
        inTime: '08:20 AM',
        outTime: '01:30 PM',
        attendanceStatus: 'Half Day',
        date: '21-07-2026',
    },
    {
        id: 'FO-ATT-005',
        employeeId: 'FO-1001',
        name: 'Priya L. Sharma',
        inTime: '—',
        outTime: '—',
        attendanceStatus: 'On Duty',
        date: '20-07-2026',
    },
    {
        id: 'FO-ATT-006',
        employeeId: 'FO-1001',
        name: 'Priya L. Sharma',
        inTime: '08:10 AM',
        outTime: '05:05 PM',
        attendanceStatus: 'Present',
        date: '19-07-2026',
    },
]
