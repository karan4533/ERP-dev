import { getAccessToken, isApiAuthEnabled } from '../../../services/apiClient'
import { liveArray } from '../../../Common/RBAC/liveArray'

export const ATTENDANCE_STATUSES = ['Present', 'Absent', 'Half Day', 'Late', 'On Duty']

export const statusBadgeColor = {
    Present: 'bg-[#4CAF5033] text-[#4CAF50]',
    Absent: 'bg-[#FF000033] text-[#FF0000]',
    'Half Day': 'bg-[#FF980033] text-[#FF9800]',
    Late: 'bg-[#FF980033] text-[#FF9800]',
    'On Duty': 'bg-[#2196F333] text-[#2196F3]',
}

const DEMO_MY_ATTENDANCE_LIST = [
    {
        id: 'MY-ATT-001',
        employeeId: 'TEA-1001',
        name: 'Anita Verma',
        inTime: '08:02 AM',
        outTime: '03:15 PM',
        attendanceStatus: 'Present',
        date: '24-07-2026',
    },
    {
        id: 'MY-ATT-002',
        employeeId: 'TEA-1001',
        name: 'Anita Verma',
        inTime: '08:18 AM',
        outTime: '03:10 PM',
        attendanceStatus: 'Late',
        date: '23-07-2026',
    },
    {
        id: 'MY-ATT-003',
        employeeId: 'TEA-1001',
        name: 'Anita Verma',
        inTime: '—',
        outTime: '—',
        attendanceStatus: 'Absent',
        date: '22-07-2026',
    },
    {
        id: 'MY-ATT-004',
        employeeId: 'TEA-1001',
        name: 'Anita Verma',
        inTime: '08:05 AM',
        outTime: '12:30 PM',
        attendanceStatus: 'Half Day',
        date: '21-07-2026',
    },
    {
        id: 'MY-ATT-005',
        employeeId: 'TEA-1001',
        name: 'Anita Verma',
        inTime: '—',
        outTime: '—',
        attendanceStatus: 'On Duty',
        date: '20-07-2026',
    },
    {
        id: 'MY-ATT-006',
        employeeId: 'TEA-1001',
        name: 'Anita Verma',
        inTime: '08:00 AM',
        outTime: '03:20 PM',
        attendanceStatus: 'Present',
        date: '19-07-2026',
    },
]

const apiCatalogMode = () => isApiAuthEnabled() && Boolean(getAccessToken())

export const getMyAttendanceList = () => (apiCatalogMode() ? [] : DEMO_MY_ATTENDANCE_LIST.map((row) => ({ ...row })))

/** Offline demo only — empty when campus API auth is enabled. */
export const MY_ATTENDANCE_LIST = liveArray(getMyAttendanceList)
