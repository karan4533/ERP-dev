export const ESCALATION_ROLE_CONFIG = {
    gateKeeper: {
        roleLabel: 'Gate Keeper',
        routeBase: '/gate-keeper/escalation-management',
        escalatesTo: 'Gate Keeper Manager',
        escalatesToRoleKey: 'gateKeeperManager',
        hierarchyLabel: 'Gate Keeper → Gate Keeper Manager',
    },
    gateKeeperManager: {
        roleLabel: 'Gate Keeper Manager',
        routeBase: '/gatekeeper-manager/escalation-management',
        escalatesTo: 'PRM (Front Office)',
        escalatesToRoleKey: 'prm',
        hierarchyLabel: 'Gate Keeper Manager → PRM (Front Office)',
    },
    prm: {
        roleLabel: 'PRM (Front Office)',
        routeBase: '/front-office/escalation-management',
        escalatesTo: 'Director of Academics',
        escalatesToRoleKey: 'director',
        hierarchyLabel: 'PRM (Front Office) → Director of Academics',
    },
    student: {
        roleLabel: 'Student',
        routeBase: '/student/escalation-management',
        escalatesTo: 'Teacher',
        escalatesToRoleKey: 'teacher',
        hierarchyLabel: 'Student → Teacher',
    },
    teacher: {
        roleLabel: 'Teacher',
        routeBase: '/teacher/escalation-management',
        escalatesTo: 'Coordinator',
        escalatesToRoleKey: 'coordinator',
        hierarchyLabel: 'Teacher → Coordinator',
    },
    coordinator: {
        roleLabel: 'Coordinator',
        routeBase: '/coordinator/escalation-management',
        escalatesTo: 'Principal',
        escalatesToRoleKey: 'principal',
        hierarchyLabel: 'Coordinator → Principal',
    },
    librarian: {
        roleLabel: 'Librarian',
        routeBase: '/librarian/escalation-management',
        escalatesTo: 'Principal',
        escalatesToRoleKey: 'principal',
        hierarchyLabel: 'Librarian → Principal',
    },
    principal: {
        roleLabel: 'Principal',
        routeBase: '/principal/escalation-management',
        escalatesTo: 'Director of Academics',
        escalatesToRoleKey: 'director',
        hierarchyLabel: 'Principal → Director of Academics',
    },
    director: {
        roleLabel: 'Director of Academics',
        routeBase: '/director/escalation-management',
        escalatesTo: 'Admin',
        escalatesToRoleKey: 'admin',
        hierarchyLabel: 'Director of Academics → Admin',
    },
    admin: {
        roleLabel: 'Admin',
        routeBase: '/admin/escalation-management',
        escalatesTo: 'Super Admin',
        escalatesToRoleKey: 'superAdmin',
        hierarchyLabel: 'Admin → Super Admin',
    },
    superAdmin: {
        roleLabel: 'Super Admin',
        routeBase: '/super-admin/escalation-management',
        escalatesTo: '—',
        escalatesToRoleKey: null,
        hierarchyLabel: 'Final escalation level — receives from Admin',
    },
}

export const getRoleConfig = (roleKey) => ESCALATION_ROLE_CONFIG[roleKey]

export const getEscalationTargetForRole = (roleKey) => {
    const config = getRoleConfig(roleKey)
    if (!config?.escalatesToRoleKey) return null
    return {
        roleKey: config.escalatesToRoleKey,
        roleLabel: config.escalatesTo,
    }
}
