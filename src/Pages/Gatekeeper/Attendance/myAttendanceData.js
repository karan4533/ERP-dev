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
        id: 'GK-ATT-M-001',
        employeeId: 'GK-1001',
        name: 'Suresh Menon',
        gate: 'Main Gate',
        inTime: '06:00 AM',
        outTime: '02:00 PM',
        attendanceStatus: 'Present',
        date: '24-07-2026',
    },
    {
        id: 'GK-ATT-M-002',
        employeeId: 'GK-1001',
        name: 'Suresh Menon',
        gate: 'Main Gate',
        inTime: '06:20 AM',
        outTime: '02:05 PM',
        attendanceStatus: 'Late',
        date: '23-07-2026',
    },
    {
        id: 'GK-ATT-M-003',
        employeeId: 'GK-1001',
        name: 'Suresh Menon',
        gate: 'Main Gate',
        inTime: '—',
        outTime: '—',
        attendanceStatus: 'On Duty',
        date: '22-07-2026',
    },
    {
        id: 'GK-ATT-M-004',
        employeeId: 'GK-1001',
        name: 'Suresh Menon',
        gate: 'Main Gate',
        inTime: '06:05 AM',
        outTime: '02:00 PM',
        attendanceStatus: 'Present',
        date: '21-07-2026',
    },
]
