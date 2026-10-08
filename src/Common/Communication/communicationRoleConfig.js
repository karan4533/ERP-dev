export const COMMUNICATION_ROLE_CONFIG = {
    superAdmin: {
        roleLabel: 'Super Admin',
        routeBase: '/super-admin/communication',
        currentUser: {
            id: 'EMP-SA-001',
            name: 'Super Admin',
            role: 'Super Admin',
            department: 'Governance',
            avatarColor: '#9333EA',
        },
    },
    admin: {
        roleLabel: 'Admin',
        routeBase: '/admin/communication',
        currentUser: {
            id: 'EMP-ADM-001',
            name: 'System Admin',
            role: 'Administrator',
            department: 'Administration',
            avatarColor: '#515DEF',
        },
    },
    director: {
        roleLabel: 'Director',
        routeBase: '/director/communication',
        currentUser: {
            id: 'EMP-DIR-001',
            name: 'Director Academics',
            role: 'Director',
            department: 'Academics',
            avatarColor: '#0C1E5B',
        },
    },
    prm: {
        roleLabel: 'Front Office',
        routeBase: '/front-office/communication',
        currentUser: {
            id: 'EMP-PRM-001',
            name: 'Front Office Officer',
            role: 'PRM',
            department: 'Front Office',
            avatarColor: '#0891B2',
        },
    },
    gateKeeper: {
        roleLabel: 'Gate Keeper',
        routeBase: '/gate-keeper/communication',
        currentUser: {
            id: 'EMP-GK-001',
            name: 'Gate Keeper',
            role: 'Gate Keeper',
            department: 'Security',
            avatarColor: '#059669',
        },
    },
    gateKeeperManager: {
        roleLabel: 'Gate Keeper Manager',
        routeBase: '/gatekeeper-manager/communication',
        currentUser: {
            id: 'EMP-GKM-001',
            name: 'Gate Keeper Manager',
            role: 'Gate Keeper Manager',
            department: 'Security',
            avatarColor: '#047857',
        },
    },
    librarian: {
        roleLabel: 'Librarian',
        routeBase: '/librarian/communication',
        currentUser: {
            id: 'EMP-LIB-001',
            name: 'School Librarian',
            role: 'Librarian',
            department: 'Library',
            avatarColor: '#7C3AED',
        },
    },
    principal: {
        roleLabel: 'Principal',
        routeBase: '/principal/communication',
        currentUser: {
            id: 'EMP-PRI-001',
            name: 'School Principal',
            role: 'Principal',
            department: 'Administration',
            avatarColor: '#B45309',
        },
    },
    student: {
        roleLabel: 'Student',
        routeBase: '/student/communication',
        currentUser: {
            id: 'STU-2024-0142',
            name: 'Aarav Sharma',
            role: 'Student',
            department: 'Class 10-A',
            avatarColor: '#2563EB',
        },
    },
    teacher: {
        roleLabel: 'Teacher',
        routeBase: '/teacher/communication',
        currentUser: {
            id: 'EMP-TCH-014',
            name: 'Priya Menon',
            role: 'Teacher',
            department: 'Mathematics',
            avatarColor: '#DB2777',
        },
    },
}

export const getCommunicationRoleConfig = (roleKey) => COMMUNICATION_ROLE_CONFIG[roleKey]
