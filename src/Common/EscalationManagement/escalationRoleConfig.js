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
    parent: {
        roleLabel: 'Parent',
        routeBase: '/parent/escalation-management',
        escalatesTo: 'Teacher',
        escalatesToRoleKey: 'teacher',
        hierarchyLabel: 'Parent → Teacher',
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
    driver: {
        roleLabel: 'Driver',
        routeBase: '/driver/escalation-management',
        escalatesTo: 'Transport Manager',
        escalatesToRoleKey: 'transportManager',
        hierarchyLabel: 'Driver → Transport Manager',
    },
    transportManager: {
        roleLabel: 'Transport Manager',
        routeBase: '/transport-manager/escalation-management',
        escalatesTo: 'Joint Director',
        escalatesToRoleKey: 'jointDirector',
        hierarchyLabel: 'Transport Manager → Joint Director',
    },
    canteenManager: {
        roleLabel: 'Café / Canteen Manager',
        routeBase: '/canteen-manager/escalation-management',
        escalatesTo: 'Joint Director',
        escalatesToRoleKey: 'jointDirector',
        hierarchyLabel: 'Canteen Manager → Joint Director',
    },
    itSupportManager: {
        roleLabel: 'IT Support Manager',
        routeBase: '/it-support-manager/escalation-management',
        escalatesTo: 'Joint Director',
        escalatesToRoleKey: 'jointDirector',
        hierarchyLabel: 'IT Support Manager → Joint Director',
    },
    stationeryStoreManager: {
        roleLabel: 'Stationery Store Manager',
        routeBase: '/stationery-store-manager/escalation-management',
        escalatesTo: 'Joint Director',
        escalatesToRoleKey: 'jointDirector',
        hierarchyLabel: 'Stationery Store Manager → Joint Director',
    },
    housekeepingManager: {
        roleLabel: 'Housekeeping Manager',
        routeBase: '/housekeeping-manager/escalation-management',
        escalatesTo: 'Joint Director',
        escalatesToRoleKey: 'jointDirector',
        hierarchyLabel: 'Housekeeping Manager → Joint Director',
    },
    maintenanceManager: {
        roleLabel: 'Maintenance Manager',
        routeBase: '/maintenance-manager/escalation-management',
        escalatesTo: 'Joint Director',
        escalatesToRoleKey: 'jointDirector',
        hierarchyLabel: 'Maintenance Manager → Joint Director',
    },
    jointDirectorAssistant: {
        roleLabel: 'Joint Director Assistant',
        routeBase: '/joint-director-assistant/escalation-management',
        escalatesTo: 'Joint Director',
        escalatesToRoleKey: 'jointDirector',
        hierarchyLabel: 'Joint Director Assistant → Joint Director',
    },
    jointDirector: {
        roleLabel: 'Joint Director',
        routeBase: '/joint-director/escalation-management',
        escalatesTo: 'Super Admin',
        escalatesToRoleKey: 'superAdmin',
        hierarchyLabel: 'Joint Director → Super Admin',
    },
    processAuditor: {
        roleLabel: 'Process Auditor',
        routeBase: '/process-auditor/escalation-management',
        escalatesTo: 'Joint Director - Audit',
        escalatesToRoleKey: 'jointDirectorAudit',
        hierarchyLabel: 'Process Auditor → Joint Director - Audit',
    },
    qualityAuditor: {
        roleLabel: 'Quality Auditor',
        routeBase: '/quality-auditor/escalation-management',
        escalatesTo: 'Joint Director - Audit',
        escalatesToRoleKey: 'jointDirectorAudit',
        hierarchyLabel: 'Quality Auditor → Joint Director - Audit',
    },
    jointDirectorAudit: {
        roleLabel: 'Joint Director - Audit',
        routeBase: '/joint-director-audit/escalation-management',
        escalatesTo: 'Super Admin',
        escalatesToRoleKey: 'superAdmin',
        hierarchyLabel: 'Joint Director - Audit → Super Admin',
    },
    hr: {
        roleLabel: 'HR Manager',
        routeBase: '/hr/escalation-management',
        escalatesTo: 'Super Admin',
        escalatesToRoleKey: 'superAdmin',
        hierarchyLabel: 'HR Manager → Super Admin',
    },
    accountHead: {
        roleLabel: 'Account Head',
        routeBase: '/account-head/escalation-management',
        escalatesTo: 'Super Admin',
        escalatesToRoleKey: 'superAdmin',
        hierarchyLabel: 'Account Head → Super Admin',
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
        hierarchyLabel: 'Final escalation level — receives from Admin & Department Heads',
    },
    pro: {
        roleLabel: 'Public Relations Officer',
        routeBase: '/pro/escalation-management',
        escalatesTo: 'Managing Director',
        escalatesToRoleKey: 'director',
        hierarchyLabel: 'PRO → Managing Director',
    },
    fileroom: {
        roleLabel: 'File Room Custodian',
        routeBase: '/file-room/escalation-management',
        escalatesTo: 'Joint Director',
        escalatesToRoleKey: 'jointDirector',
        hierarchyLabel: 'File Room Custodian → Joint Director',
    },
    fileRoom: {
        roleLabel: 'File Room Custodian',
        routeBase: '/file-room/escalation-management',
        escalatesTo: 'Joint Director',
        escalatesToRoleKey: 'jointDirector',
        hierarchyLabel: 'File Room Custodian → Joint Director',
    },
    cctv: {
        roleLabel: 'CCTV In-charge',
        routeBase: '/cctv/escalation-management',
        escalatesTo: 'Joint Director',
        escalatesToRoleKey: 'jointDirector',
        hierarchyLabel: 'CCTV In-charge → Joint Director',
    },
}

const normalizeKey = (key) => {
    if (!key) return null
    const clean = String(key).toLowerCase().replace(/[-_\s]/g, '')
    if (clean === 'prm' || clean === 'frontoffice') return 'prm'
    if (clean === 'admin' || clean === 'administrator') return 'admin'
    if (clean === 'superadmin') return 'superAdmin'
    if (clean === 'teacher') return 'teacher'
    if (clean === 'student') return 'student'
    if (clean === 'parent') return 'parent'
    if (clean === 'coordinator') return 'coordinator'
    if (clean === 'principal') return 'principal'
    if (clean === 'director') return 'director'
    if (clean === 'librarian') return 'librarian'
    if (clean === 'driver' || clean === 'vandriver') return 'driver'
    if (clean === 'gatekeeper') return 'gateKeeper'
    if (clean === 'gatekeepermanager') return 'gateKeeperManager'
    if (clean === 'transportmanager') return 'transportManager'
    if (clean === 'canteenmanager') return 'canteenManager'
    if (clean === 'itsupportmanager' || clean === 'itsupport') return 'itSupportManager'
    if (clean === 'stationerystoremanager' || clean === 'stores') return 'stationeryStoreManager'
    if (clean === 'housekeepingmanager' || clean === 'housekeeping') return 'housekeepingManager'
    if (clean === 'maintenancemanager' || clean === 'maintenance') return 'maintenanceManager'
    if (clean === 'jointdirector') return 'jointDirector'
    if (clean === 'jointdirectorassistant') return 'jointDirectorAssistant'
    if (clean === 'jointdirectoraudit') return 'jointDirectorAudit'
    if (clean === 'processauditor') return 'processAuditor'
    if (clean === 'qualityauditor') return 'qualityAuditor'
    if (clean === 'hr') return 'hr'
    if (clean === 'accounthead' || clean === 'accounts') return 'accountHead'
    if (clean === 'pro') return 'pro'
    if (clean === 'fileroom') return 'fileroom'
    if (clean === 'cctv') return 'cctv'
    return key
}

export const getRoleConfig = (roleKey) => {
    if (!roleKey) return null
    if (Object.prototype.hasOwnProperty.call(ESCALATION_ROLE_CONFIG, roleKey)) return ESCALATION_ROLE_CONFIG[roleKey]
    const norm = normalizeKey(roleKey)
    if (norm && Object.prototype.hasOwnProperty.call(ESCALATION_ROLE_CONFIG, norm)) return ESCALATION_ROLE_CONFIG[norm]
    return null
}

export const getEscalationTargetForRole = (roleKey) => {
    const config = getRoleConfig(roleKey)
    if (!config?.escalatesToRoleKey) return null
    return {
        roleKey: config.escalatesToRoleKey,
        roleLabel: config.escalatesTo,
    }
}
