import {
    ensureCampusSeed,
    hydrateCampusKey,
    persistCampusJson,
    usesCampusApiForKey,
} from '../../../services/campusJsonStore'

export const ATTENDANCE_STORAGE_KEY = 'schoolerp-security-team-attendance-v1'

export const ATTENDANCE_STATUSES = ['Present', 'Absent', 'Half Day', 'Late', 'On Duty']

export const statusBadgeColor = {
    Present: 'bg-[#4CAF5033] text-[#4CAF50]',
    Absent: 'bg-[#FF000033] text-[#FF0000]',
    'Half Day': 'bg-[#FF980033] text-[#FF9800]',
    Late: 'bg-[#FF980033] text-[#FF9800]',
    'On Duty': 'bg-[#2196F333] text-[#2196F3]',
}

const DEMO_GATEKEEPERS_ATTENDANCE = [
    {
        id: 'GK-ATT-001',
        employeeId: 'GK-1001',
        name: 'Suresh Menon',
        gate: 'Main Gate',
        inTime: '06:00 AM',
        outTime: '02:00 PM',
        attendanceStatus: 'Present',
        date: '24-07-2026',
    },
    {
        id: 'GK-ATT-002',
        employeeId: 'GK-1002',
        name: 'Vijay Nair',
        gate: 'Hostel Gate',
        inTime: '06:15 AM',
        outTime: '02:10 PM',
        attendanceStatus: 'Late',
        date: '24-07-2026',
    },
    {
        id: 'GK-ATT-003',
        employeeId: 'GK-1003',
        name: 'Anil Thomas',
        gate: 'Back Gate',
        inTime: '—',
        outTime: '—',
        attendanceStatus: 'Absent',
        date: '24-07-2026',
    },
    {
        id: 'GK-ATT-004',
        employeeId: 'GK-1004',
        name: 'Ramesh Pillai',
        gate: 'Main Gate',
        inTime: '02:00 PM',
        outTime: '10:00 PM',
        attendanceStatus: 'Present',
        date: '24-07-2026',
    },
    {
        id: 'GK-ATT-005',
        employeeId: 'GK-1005',
        name: 'Joseph Mathew',
        gate: 'Hostel Gate',
        inTime: '—',
        outTime: '—',
        attendanceStatus: 'On Duty',
        date: '24-07-2026',
    },
    {
        id: 'GK-ATT-006',
        employeeId: 'GK-1001',
        name: 'Suresh Menon',
        gate: 'Main Gate',
        inTime: '06:05 AM',
        outTime: '02:00 PM',
        attendanceStatus: 'Present',
        date: '23-07-2026',
    },
]

const seedFor = () => (usesCampusApiForKey(ATTENDANCE_STORAGE_KEY) ? [] : DEMO_GATEKEEPERS_ATTENDANCE)

export function getGatekeepersAttendance() {
    return ensureCampusSeed(ATTENDANCE_STORAGE_KEY, seedFor())
}

export function saveGatekeepersAttendance(rows) {
    return persistCampusJson(ATTENDANCE_STORAGE_KEY, rows)
}

export function hydrateGatekeepersAttendanceFromApi() {
    if (!usesCampusApiForKey(ATTENDANCE_STORAGE_KEY)) return Promise.resolve(false)
    return hydrateCampusKey(ATTENDANCE_STORAGE_KEY, [])
}

export async function updateGatekeeperAttendanceStatus(id, attendanceStatus) {
    const rows = getGatekeepersAttendance()
    const next = rows.map((row) => (String(row.id) === String(id) ? { ...row, attendanceStatus } : row))
    const result = await saveGatekeepersAttendance(next)
    return { ...result, record: next.find((row) => String(row.id) === String(id)) }
}
