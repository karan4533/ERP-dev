import { SEED } from '../domain/hrSeed'

export const ATTENDANCE_STATUSES = ['Present', 'Absent', 'Late', 'Half Day', 'On Duty']

export const attendanceStatusBadgeColor = {
    Present: 'bg-[#4CAF5033] text-[#4CAF50]',
    Absent: 'bg-[#FF572233] text-[#FF5722]',
    Late: 'bg-[#FF980033] text-[#FF9800]',
    'Half Day': 'bg-[#2196F333] text-[#2196F3]',
    'On Duty': 'bg-[#66708533] text-[#667085]',
}

const sample = SEED.employees.slice(0, 6)
const statuses = ['Present', 'Late', 'On Duty', 'Present', 'Half Day', 'Absent']

/** Sample rows keyed to Queen Mira EMP-QMIS-* staff (cleared Delhi demo IDs). */
export const ATTENDANCE_RECORDS = sample.map((row, index) => ({
    id: `ATT-QMIS-${String(index + 1).padStart(4, '0')}`,
    employee: row.name,
    employeeId: row.id,
    date: '28-10-2026',
    checkIn: statuses[index] === 'Absent' || statuses[index] === 'On Duty' ? '—' : '08:05 AM',
    checkOut: statuses[index] === 'Absent' || statuses[index] === 'On Duty' ? '—' : statuses[index] === 'Half Day' ? '12:30 PM' : '04:15 PM',
    workingHours: statuses[index] === 'Absent' || statuses[index] === 'On Duty' ? '—' : statuses[index] === 'Half Day' ? '4h 25m' : '8h 10m',
    status: statuses[index],
}))
