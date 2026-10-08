export const USER_DATABASE_ROUTE_CONFIG = {
    admin: {
        studentDatabase: '/admin/user-management/student-database',
        employeeDatabase: '/admin/user-management/employee-database',
    },
    director: {
        studentDatabase: '/director/user-management/student-database',
        employeeDatabase: '/director/user-management/employee-database',
    },
    principal: {
        studentDatabase: '/principal/user-management/student-database',
        employeeDatabase: '/principal/user-management/employee-database',
    },
    prm: {
        studentDatabase: '/front-office/student-management',
        teacherDatabase: '/front-office/teacher-management',
    },
}

export const hasFullUserDatabaseModules = (roleKey) => {
    const config = USER_DATABASE_ROUTE_CONFIG[roleKey]
    return Boolean(config?.studentDatabase && config?.employeeDatabase)
}
