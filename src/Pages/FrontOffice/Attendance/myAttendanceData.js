import { getAccessToken, isApiAuthEnabled } from '../../../services/apiClient'
import { liveArray } from '../../../Common/RBAC/liveArray'

import { SEED } from '../../HR/domain/hrSeed'

export const ATTENDANCE_STATUSES = ['Present', 'Absent', 'Half Day', 'Late', 'On Duty']

export const statusBadgeColor = {
    Present: 'bg-[#4CAF5033] text-[#4CAF50]',
    Absent: 'bg-[#FF000033] text-[#FF0000]',
    'Half Day': 'bg-[#FF980033] text-[#FF9800]',
    Late: 'bg-[#FF980033] text-[#FF9800]',
    'On Duty': 'bg-[#2196F333] text-[#2196F3]',
}

const prm = SEED.employees.find((row) => row.role === 'prm') || SEED.employees[0]
const sampleStatuses = ['Present', 'Late', 'Absent', 'Half Day', 'On Duty', 'Present']
const sampleDates = ['28-10-2026', '27-10-2026', '26-10-2026', '25-10-2026', '24-10-2026', '23-10-2026']

const DEMO_MY_ATTENDANCE_LIST = sampleStatuses.map((status, index) => ({
    id: `FO-ATT-${String(index + 1).padStart(3, '0')}`,
    employeeId: prm?.id || 'EMP-QMIS-082',
    name: prm?.name || 'Front Office',
    inTime: status === 'Absent' || status === 'On Duty' ? '—' : status === 'Late' ? '08:28 AM' : '08:15 AM',
    outTime: status === 'Absent' || status === 'On Duty' ? '—' : status === 'Half Day' ? '01:30 PM' : '05:00 PM',
    attendanceStatus: status,
    date: sampleDates[index],
}))

const apiCatalogMode = () => isApiAuthEnabled() && Boolean(getAccessToken())

export const getMyAttendanceList = () => (apiCatalogMode() ? [] : DEMO_MY_ATTENDANCE_LIST.map((row) => ({ ...row })))

/** Offline demo only — empty when campus API auth is enabled. */
export const MY_ATTENDANCE_LIST = liveArray(getMyAttendanceList)
