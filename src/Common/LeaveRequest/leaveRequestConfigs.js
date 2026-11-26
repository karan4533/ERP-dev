import { ROLES } from '../../constants/roles.js'

export const LEAVE_ROUTE_CONFIG = {
    admin: {
        myList: '/admin/leave-request/my-requests',
        add: '/admin/leave-request/my-requests/add',
        myView: '/admin/leave-request/my-requests/view',
        receivedList: '/admin/leave-request/received',
        receivedView: '/admin/leave-request/received/view',
    },
    superadmin: {
        receivedList: '/super-admin/leave-request/received',
        receivedView: '/super-admin/leave-request/received/view',
    },
    teacher: {
        myList: '/teacher/leave-request/my-requests',
        add: '/teacher/leave-request/my-requests/add',
        myView: '/teacher/leave-request/my-requests/view',
        receivedList: '/teacher/leave-request/received',
        receivedView: '/teacher/leave-request/received/view',
    },
    coordinator: {
        myList: '/coordinator/leave-request/my-requests',
        add: '/coordinator/leave-request/my-requests/add',
        myView: '/coordinator/leave-request/my-requests/view',
        receivedList: '/coordinator/leave-request/received',
        receivedView: '/coordinator/leave-request/received/view',
    },
    principal: {
        myList: '/principal/leave-request/my-requests',
        add: '/principal/leave-request/my-requests/add',
        myView: '/principal/leave-request/my-requests/view',
        receivedList: '/principal/leave-request/received',
        receivedView: '/principal/leave-request/received/view',
    },
    director: {
        myList: '/director/leave-request/my-requests',
        add: '/director/leave-request/my-requests/add',
        myView: '/director/leave-request/my-requests/view',
        receivedList: '/director/leave-request/received',
        receivedView: '/director/leave-request/received/view',
    },
    prm: {
        myList: '/front-office/leave-request/my-requests',
        add: '/front-office/leave-request/my-requests/add',
        myView: '/front-office/leave-request/my-requests/view',
        receivedList: '/front-office/leave-request/received',
        receivedView: '/front-office/leave-request/received/view',
    },
    gatekeeper: {
        myList: '/gate-keeper/leave-request/my-requests',
        add: '/gate-keeper/leave-request/my-requests/add',
        myView: '/gate-keeper/leave-request/my-requests/view',
    },
    gatekeepermanager: {
        myList: '/gatekeeper-manager/leave-request/my-requests',
        add: '/gatekeeper-manager/leave-request/my-requests/add',
        myView: '/gatekeeper-manager/leave-request/my-requests/view',
        receivedList: '/gatekeeper-manager/leave-request/received',
        receivedView: '/gatekeeper-manager/leave-request/received/view',
    },
    driver: {
        myList: '/driver/leave-request',
        add: '/driver/leave-request/add',
        myView: '/driver/leave-request/view',
    },
    transportmanager: {
        myList: '/transport-manager/leave-request/my-requests',
        add: '/transport-manager/leave-request/my-requests/add',
        myView: '/transport-manager/leave-request/my-requests/view',
        receivedList: '/transport-manager/leave-request',
        receivedView: '/transport-manager/leave-request/view',
    },
    librarian: {
        myList: '/librarian/leave-request/my-requests',
        add: '/librarian/leave-request/my-requests/add',
        myView: '/librarian/leave-request/my-requests/view',
        receivedList: '/librarian/leave-request/received',
        receivedView: '/librarian/leave-request/received/view',
    },
    canteenmanager: {
        myList: '/canteen-manager/leave-request/my-requests',
        add: '/canteen-manager/leave-request/my-requests/add',
        myView: '/canteen-manager/leave-request/my-requests/view',
        receivedList: '/canteen-manager/leave-request/received',
        receivedView: '/canteen-manager/leave-request/received/view',
    },
    itsupportmanager: {
        myList: '/it-support-manager/leave-request/my-requests',
        add: '/it-support-manager/leave-request/my-requests/add',
        myView: '/it-support-manager/leave-request/my-requests/view',
        receivedList: '/it-support-manager/leave-request/received',
        receivedView: '/it-support-manager/leave-request/received/view',
    },
    stationerystoremanager: {
        myList: '/stationery-store-manager/leave-request/my-requests',
        add: '/stationery-store-manager/leave-request/my-requests/add',
        myView: '/stationery-store-manager/leave-request/my-requests/view',
        receivedList: '/stationery-store-manager/leave-request/received',
        receivedView: '/stationery-store-manager/leave-request/received/view',
    },
    housekeepingmanager: {
        myList: '/housekeeping-manager/leave-request/my-requests',
        add: '/housekeeping-manager/leave-request/my-requests/add',
        myView: '/housekeeping-manager/leave-request/my-requests/view',
        receivedList: '/housekeeping-manager/leave-request/received',
        receivedView: '/housekeeping-manager/leave-request/received/view',
    },
    maintenancemanager: {
        myList: '/maintenance-manager/leave-request/my-requests',
        add: '/maintenance-manager/leave-request/my-requests/add',
        myView: '/maintenance-manager/leave-request/my-requests/view',
        receivedList: '/maintenance-manager/leave-request/received',
        receivedView: '/maintenance-manager/leave-request/received/view',
    },
    jointdirector: {
        myList: '/joint-director/leave-request/my-requests',
        add: '/joint-director/leave-request/my-requests/add',
        myView: '/joint-director/leave-request/my-requests/view',
        receivedList: '/joint-director/leave-request/received',
        receivedView: '/joint-director/leave-request/received/view',
    },
    jointdirectorassistant: {
        myList: '/joint-director-assistant/leave-request/my-requests',
        add: '/joint-director-assistant/leave-request/my-requests/add',
        myView: '/joint-director-assistant/leave-request/my-requests/view',
        receivedList: '/joint-director-assistant/leave-request/received',
        receivedView: '/joint-director-assistant/leave-request/received/view',
    },
    jointdirectoraudit: {
        myList: '/joint-director-audit/leave-request/my-requests',
        add: '/joint-director-audit/leave-request/my-requests/add',
        myView: '/joint-director-audit/leave-request/my-requests/view',
        receivedList: '/joint-director-audit/leave-request/received',
        receivedView: '/joint-director-audit/leave-request/received/view',
    },
    hr: {
        myList: '/hr/leave-request/my-requests',
        add: '/hr/leave-request/my-requests/add',
        myView: '/hr/leave-request/my-requests/view',
        receivedList: '/hr/leave-request/received',
        receivedView: '/hr/leave-request/received/view',
    },
    accounthead: {
        myList: '/account-head/leave-request/my-requests',
        add: '/account-head/leave-request/my-requests/add',
        myView: '/account-head/leave-request/my-requests/view',
        receivedList: '/account-head/leave-request/received',
        receivedView: '/account-head/leave-request/received/view',
    },
    processauditor: {
        myList: '/process-auditor/leave-request/my-requests',
        add: '/process-auditor/leave-request/my-requests/add',
        myView: '/process-auditor/leave-request/my-requests/view',
        receivedList: '/process-auditor/leave-request/received',
        receivedView: '/process-auditor/leave-request/received/view',
    },
    qualityauditor: {
        myList: '/quality-auditor/leave-request/my-requests',
        add: '/quality-auditor/leave-request/my-requests/add',
        myView: '/quality-auditor/leave-request/my-requests/view',
        receivedList: '/quality-auditor/leave-request/received',
        receivedView: '/quality-auditor/leave-request/received/view',
    },
}

export const LEAVE_APPROVER_CONFIG = {
    [ROLES.ADMIN]: {
        approverRole: ROLES.SUPER_ADMIN,
        requestedToLabel: 'Super Admin',
        submitHint: 'This request will be sent to Super Admin for approval.',
    },
    [ROLES.GATEKEEPER]: {
        approverRole: ROLES.GATEKEEPER_MANAGER,
        requestedToLabel: 'Gate Keeper Manager',
        submitHint: 'This request will be sent to Gate Keeper Manager for approval.',
    },
    [ROLES.GATEKEEPER_MANAGER]: {
        approverRole: ROLES.DIRECTOR,
        requestedToLabel: 'Director',
        submitHint: 'This request will be sent to Director for approval.',
    },
    [ROLES.TEACHER]: {
        approverRole: ROLES.PRINCIPAL,
        requestedToLabel: 'Principal',
        submitHint: 'This request will be sent to Principal for approval.',
    },
    [ROLES.COORDINATOR]: {
        approverRole: ROLES.PRINCIPAL,
        requestedToLabel: 'Principal',
        submitHint: 'This request will be sent to Principal for approval.',
    },
    [ROLES.PRINCIPAL]: {
        approverRole: ROLES.DIRECTOR,
        requestedToLabel: 'Director of Academics',
        submitHint: 'This request will be sent to Director of Academics for approval.',
    },
    [ROLES.DIRECTOR]: {
        approverRole: ROLES.ADMIN,
        requestedToLabel: 'Admin',
        submitHint: 'This request will be sent to Admin for approval.',
    },
    [ROLES.PRM]: {
        approverRole: ROLES.DIRECTOR,
        requestedToLabel: 'Director',
        submitHint: 'This request will be sent to Director for approval.',
    },
    [ROLES.DRIVER]: {
        approverRole: ROLES.TRANSPORT_MANAGER,
        requestedToLabel: 'Transport Manager',
        submitHint: 'This request will be sent to Transport Manager for approval.',
    },
}

export const DEFAULT_SUBMITTER_PROFILES = {
    [ROLES.ADMIN]: {
        employeeId: 'ADM-001',
        requestedBy: 'System Admin',
        role: 'Admin',
        department: 'Administration',
    },
    [ROLES.GATEKEEPER]: {
        employeeId: 'GK-1001',
        requestedBy: 'Suresh Menon',
        role: 'Gate Keeper',
        department: 'Security',
    },
    [ROLES.GATEKEEPER_MANAGER]: {
        employeeId: 'GKM-1001',
        requestedBy: 'Rajesh Kumar',
        role: 'Gate Keeper Manager',
        department: 'Security',
    },
    [ROLES.TEACHER]: {
        employeeId: 'TCH-001',
        requestedBy: 'Demo Teacher',
        role: 'Teacher',
        department: 'Academics',
    },
    [ROLES.COORDINATOR]: {
        employeeId: 'CRD-001',
        requestedBy: 'Demo Coordinator',
        role: 'Coordinator',
        department: 'Academics',
    },
    [ROLES.PRINCIPAL]: {
        employeeId: 'PRN-001',
        requestedBy: 'Demo Principal',
        role: 'Principal',
        department: 'Administration',
    },
    [ROLES.DIRECTOR]: {
        employeeId: 'DIR-001',
        requestedBy: 'Demo Director',
        role: 'Director',
        department: 'Management',
    },
    [ROLES.PRM]: {
        employeeId: 'FO-001',
        requestedBy: 'Front Office Staff',
        role: 'Front Office',
        department: 'Administration',
    },
    [ROLES.DRIVER]: {
        employeeId: 'DRV-001',
        requestedBy: 'Demo Driver',
        role: 'Driver',
        department: 'Transport',
    },
}

export const APPROVER_DECISION_TITLES = {
    [ROLES.SUPER_ADMIN]: 'Super Admin Decision',
    [ROLES.ADMIN]: 'Admin Decision',
    [ROLES.GATEKEEPER_MANAGER]: 'Manager Decision',
    [ROLES.PRINCIPAL]: 'Principal Decision',
    [ROLES.TEACHER]: 'Teacher Decision',
    [ROLES.DIRECTOR]: 'Director Decision',
    [ROLES.TRANSPORT_MANAGER]: 'Transport Manager Decision',
    [ROLES.COORDINATOR]: 'Coordinator Decision',
    [ROLES.HR]: 'HR Decision',
    [ROLES.ACCOUNT_HEAD]: 'Account Head Decision',
    [ROLES.JOINT_DIRECTOR]: 'Joint Director Decision',
    [ROLES.JOINT_DIRECTOR_ASSISTANT]: 'Joint Director Assistant Decision',
    [ROLES.JOINT_DIRECTOR_AUDIT]: 'Joint Director Audit Decision',
    [ROLES.CANTEEN_MANAGER]: 'Canteen Manager Decision',
    [ROLES.IT_SUPPORT_MANAGER]: 'IT Support Manager Decision',
    [ROLES.STATIONERY_STORE_MANAGER]: 'Stationery Store Manager Decision',
    [ROLES.HOUSEKEEPING_MANAGER]: 'Housekeeping Manager Decision',
}

export const resolveRoleKey = (roleKey) => {
    if (!roleKey) return null
    if (roleKey === 'vandriver') return ROLES.DRIVER
    return roleKey
}

export const getLeaveRoutes = (roleKey) => {
    const resolvedRole = resolveRoleKey(roleKey)
    return LEAVE_ROUTE_CONFIG[resolvedRole] || LEAVE_ROUTE_CONFIG.admin
}

export const getLeaveMyViewPath = (roleKey, id) =>
    `${getLeaveRoutes(roleKey).myView}/${id}`

export const getLeaveReceivedViewPath = (roleKey, id) =>
    `${getLeaveRoutes(roleKey).receivedView}/${id}`

export const getLeaveApproverConfig = (submitterRole) => {
    const resolvedRole = resolveRoleKey(submitterRole)
    return LEAVE_APPROVER_CONFIG[resolvedRole] || LEAVE_APPROVER_CONFIG[ROLES.TEACHER]
}

export const getSubmitterProfile = (submitterRole, authUser = {}) => {
    const resolvedRole = resolveRoleKey(submitterRole)
    const defaults = DEFAULT_SUBMITTER_PROFILES[resolvedRole] || {
        employeeId: `${String(submitterRole).slice(0, 3).toUpperCase()}-001`,
        requestedBy: submitterRole,
        role: submitterRole,
        department: '',
    }

    return {
        employeeId: defaults.employeeId,
        requestedBy: authUser.name || defaults.requestedBy,
        role: defaults.role,
        department: defaults.department,
    }
}
