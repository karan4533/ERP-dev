export const ROLE_OPTIONS = ['Teacher', 'Librarian', 'Accountant', 'Front Office', 'Driver', 'Admin Staff', 'Security']

export const STATUS_OPTIONS = ['Present', 'Absent']

export const statusBadgeColor = {
    Present: 'bg-[#4CAF5033] text-[#4CAF50]',
    Absent: 'bg-[#FF000033] text-[#FF0000]',
}

export const EMPLOYEE_ATTENDANCE = [
    {
        id: '1',
        employeeId: 'EMP-1001',
        employeeName: 'Sandy Selva',
        role: 'Teacher',
        punchInTime: '08:05 AM',
        punchOutTime: '04:10 PM',
        status: 'Present',
    },
    {
        id: '2',
        employeeId: 'EMP-1002',
        employeeName: 'Priya Sharma',
        role: 'Teacher',
        punchInTime: '08:12 AM',
        punchOutTime: '04:05 PM',
        status: 'Present',
    },
    {
        id: '3',
        employeeId: 'EMP-1003',
        employeeName: 'Meera Iyer',
        role: 'Librarian',
        punchInTime: '—',
        punchOutTime: '—',
        status: 'Absent',
    },
    {
        id: '4',
        employeeId: 'EMP-1004',
        employeeName: 'Anita Desai',
        role: 'Front Office',
        punchInTime: '08:00 AM',
        punchOutTime: '04:00 PM',
        status: 'Present',
    },
    {
        id: '5',
        employeeId: 'EMP-1005',
        employeeName: 'Ravi Kumar',
        role: 'Security',
        punchInTime: '07:55 AM',
        punchOutTime: '03:55 PM',
        status: 'Present',
    },
    {
        id: '6',
        employeeId: 'EMP-1006',
        employeeName: 'Arjun Menon',
        role: 'Driver',
        punchInTime: '—',
        punchOutTime: '—',
        status: 'Absent',
    },
    {
        id: '7',
        employeeId: 'EMP-1007',
        employeeName: 'Divya Venkat',
        role: 'Accountant',
        punchInTime: '08:18 AM',
        punchOutTime: '04:22 PM',
        status: 'Present',
    },
    {
        id: '8',
        employeeId: 'EMP-1008',
        employeeName: 'Kavin Mohan',
        role: 'Admin Staff',
        punchInTime: '08:30 AM',
        punchOutTime: '04:15 PM',
        status: 'Present',
    },
    {
        id: '9',
        employeeId: 'EMP-1009',
        employeeName: 'Vignesh S.',
        role: 'Teacher',
        punchInTime: '—',
        punchOutTime: '—',
        status: 'Absent',
    },
    {
        id: '10',
        employeeId: 'EMP-1010',
        employeeName: 'Lakshmi R.',
        role: 'Front Office',
        punchInTime: '08:08 AM',
        punchOutTime: '04:02 PM',
        status: 'Present',
    },
]

export const filterEmployeeAttendance = (records, { search = '', role = '', status = '' } = {}) => {
    const query = search.trim().toLowerCase()

    return records.filter((record) => {
        const matchesSearch =
            !query ||
            [record.employeeId, record.employeeName, record.role].some((field) =>
                field.toLowerCase().includes(query),
            )
        const matchesRole = !role || record.role === role
        const matchesStatus = !status || record.status === status

        return matchesSearch && matchesRole && matchesStatus
    })
}
