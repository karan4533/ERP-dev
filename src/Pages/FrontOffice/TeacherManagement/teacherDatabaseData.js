export const ROUTE_BASE = '/front-office/teacher-management'

/** Legacy label — HR often uses Academic/Academics as department; teachers are identified by role. */
export const TEACHER_DEPARTMENT_FILTER = 'Teacher'

/**
 * Match HR + User Creation rows that belong in Teacher Database.
 * HR seed/API uses department "Academic(s)" with role "Teacher"/"teacher";
 * User Creation maps teacher logins to department "Teacher".
 */
export const isTeacherDatabaseRecord = (employee) => {
    if (!employee) return false
    const role = String(employee.role || '').trim().toLowerCase()
    const department = String(employee.department || '').trim().toLowerCase()
    if (role === 'teacher') return true
    if (department === 'teacher') return true
    const designation = String(
        employee.designation
        || employee.employmentInfo?.designation
        || '',
    ).trim().toLowerCase()
    if (
        designation.includes('teacher')
        && !['coordinator', 'principal', 'director', 'joint director', 'jointdirector'].includes(role)
    ) {
        return true
    }
    return false
}

export {
    DEPARTMENTS,
    EMPLOYEES_LIST,
    getEmployeesList,
    getEmployeeById,
} from '../../../Common/EmployeeDatabase/employeeDatabaseData'
