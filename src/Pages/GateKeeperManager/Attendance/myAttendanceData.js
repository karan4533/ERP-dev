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
        id: 'GKM-ATT-001',
        employeeId: 'GKM-1001',
        name: 'Rajesh Kumar',
        inTime: '07:45 AM',
        outTime: '04:30 PM',
        attendanceStatus: 'Present',
        date: '24-07-2026',
    },
    {
        id: 'GKM-ATT-002',
        employeeId: 'GKM-1001',
        name: 'Rajesh Kumar',
        inTime: '08:05 AM',
        outTime: '04:15 PM',
        attendanceStatus: 'Late',
        date: '23-07-2026',
    },
    {
        id: 'GKM-ATT-003',
        employeeId: 'GKM-1001',
        name: 'Rajesh Kumar',
        inTime: '—',
        outTime: '—',
        attendanceStatus: 'On Duty',
        date: '22-07-2026',
    },
    {
        id: 'GKM-ATT-004',
        employeeId: 'GKM-1001',
        name: 'Rajesh Kumar',
        inTime: '07:50 AM',
        outTime: '04:35 PM',
        attendanceStatus: 'Present',
        date: '21-07-2026',
    },
]
