import { DEPARTMENTS, EMPLOYEE_STATUSES, EMPLOYEE_CATEGORIES } from '../domain/hrStatus'
import { getEmployee, getEmployees } from '../domain/hrStore'

export { DEPARTMENTS, EMPLOYEE_STATUSES, EMPLOYEE_CATEGORIES }

export const employeeStatusBadgeColor = {
    Active: 'bg-[#4CAF5033] text-[#4CAF50]',
    'On Leave': 'bg-[#FF980033] text-[#FF9800]',
    Probation: 'bg-[#2196F333] text-[#2196F3]',
    Inactive: 'bg-[#66708533] text-[#667085]',
}

export const EMPLOYEES = new Proxy([], {
    get(_target, prop) {
        const rows = getEmployees()
        if (prop === 'length') return rows.length
        if (prop === Symbol.iterator) return rows[Symbol.iterator].bind(rows)
        if (typeof rows[prop] === 'function') return rows[prop].bind(rows)
        return rows[prop]
    },
})

export const getEmployeeById = (id) => {
    const employee = getEmployee(id)
    if (!employee) return null
    const [firstName, ...rest] = employee.name.split(' ')
    return {
        ...employee,
        personal: {
            firstName,
            lastName: rest.join(' '),
            gender: employee.gender,
            dateOfBirth: employee.dateOfBirth,
            bloodGroup: '—',
            email: employee.email,
            mobile: employee.contact,
            address: employee.address,
            emergencyContact: employee.emergencyContact,
        },
        employment: {
            employeeId: employee.id,
            department: employee.department,
            designation: employee.designation,
            employmentType: employee.employmentType,
            reportingManager: employee.reportingManager,
            joiningDate: employee.joiningDate,
            category: employee.category,
            status: employee.status,
        },
    }
}

export const PROFILE_TABS = [
    { id: 'overview', label: 'Overview' },
    { id: 'documents', label: 'Documents' },
    { id: 'attendance', label: 'Attendance' },
    { id: 'leave', label: 'Leave' },
    { id: 'training', label: 'Training' },
    { id: 'performance', label: 'Performance' },
    { id: 'recognition', label: 'Performance / Recognition' },
    { id: 'hr-actions', label: 'HR Actions' },
    { id: 'payroll', label: 'Payroll' },
    { id: 'advance', label: 'Salary Advance' },
    { id: 'referral', label: 'Referral' },
    { id: 'disciplinary', label: 'Disciplinary' },
    { id: 'onboarding', label: 'Onboarding' },
    { id: 'observation', label: 'Observation' },
    { id: 'shadow', label: 'Shadow Mentor' },
    { id: 'exit', label: 'Exit' },
    { id: 'activity', label: 'Activity' },
]
