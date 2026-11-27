import { SEED } from '../domain/hrSeed'

export const REPORT_TYPES = [
    'Employee Report',
    'Recruitment Report',
    'Leave Report',
    'Attendance Report',
    'Training Report',
    'Performance Report',
]

/** Live roster snapshot for report previews (Queen Mira staff seed). */
export const EMPLOYEE_REPORT = SEED.employees.slice(0, 40).map((row) => ({
    employeeId: row.id,
    name: row.name,
    department: row.department,
    designation: row.designation,
    status: row.status,
    joiningDate: row.joiningDate || '—',
}))

export const RECRUITMENT_REPORT = []

export const LEAVE_REPORT = []

export const ATTENDANCE_REPORT = []

export const TRAINING_REPORT = []

export const PERFORMANCE_REPORT = []
