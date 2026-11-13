import { ROLES } from '../../constants/roles.js'

export const TASK_STATUSES = [
    'Assigned',
    'Acknowledged',
    'In Progress',
    'On Hold',
    'Pending Clarification',
    'Submitted for Verification',
    'Completed',
    'Rework Required',
    'Closed',
    'Pending'
]
export const TASK_PRIORITIES = ['High', 'Medium', 'Low']

export const statusBadgeColor = {
    Pending: 'bg-[#FF980033] text-[#FF9800]',
    'In Progress': 'bg-[#515DEF33] text-[#515DEF]',
    Completed: 'bg-[#4CAF5033] text-[#4CAF50]',
    Incomplete: 'bg-[#FF000033] text-[#FF0000]',
}

export const cleanRoleKey = (roleKey) => (roleKey || '').toLowerCase().replace(/[-_\s]/g, '')

/**
 * Who each role may assign tasks to (direct reports & department peers).
 * Flow A: Super Admin → Admin → Director → Principal → Coordinator / Teacher / Librarian
 * Flow B: Director → PRM → Gate Keeper Manager → Gate Keeper
 * Flow C: Operations & Support Managers
 */
export const ASSIGNMENT_HIERARCHY = {
    [ROLES.SUPER_ADMIN]: Object.values(ROLES),
    [ROLES.ADMIN]: Object.values(ROLES),
    [ROLES.DIRECTOR]: Object.values(ROLES),
    [ROLES.PRINCIPAL]: [
        ROLES.COORDINATOR,
        ROLES.TEACHER,
        ROLES.LIBRARIAN,
        ROLES.PRM,
        ROLES.GATEKEEPER_MANAGER,
        ROLES.HOUSEKEEPING_MANAGER,
        ROLES.MAINTENANCE_MANAGER,
        ROLES.STATIONERY_STORE_MANAGER,
        ROLES.TRANSPORT_MANAGER,
        ROLES.CANTEEN_MANAGER,
    ],
    [ROLES.JOINT_DIRECTOR]: Object.values(ROLES),
    [ROLES.JOINT_DIRECTOR_ASSISTANT]: [
        ROLES.HOUSEKEEPING_MANAGER,
        ROLES.MAINTENANCE_MANAGER,
        ROLES.STATIONERY_STORE_MANAGER,
        ROLES.TRANSPORT_MANAGER,
        ROLES.GATEKEEPER_MANAGER,
        ROLES.IT_SUPPORT_MANAGER,
        ROLES.CANTEEN_MANAGER,
    ],
    [ROLES.JOINT_DIRECTOR_AUDIT]: Object.values(ROLES),
    [ROLES.COORDINATOR]: [ROLES.TEACHER, ROLES.LIBRARIAN, ROLES.COORDINATOR],
    [ROLES.PRM]: [ROLES.GATEKEEPER_MANAGER, ROLES.GATEKEEPER, ROLES.PRM],
    [ROLES.GATEKEEPER_MANAGER]: [ROLES.GATEKEEPER, ROLES.GATEKEEPER_MANAGER],
    [ROLES.GATEKEEPER]: [ROLES.GATEKEEPER],
    [ROLES.HOUSEKEEPING_MANAGER]: [ROLES.HOUSEKEEPING_MANAGER],
    [ROLES.MAINTENANCE_MANAGER]: [ROLES.MAINTENANCE_MANAGER],
    [ROLES.STATIONERY_STORE_MANAGER]: [ROLES.STATIONERY_STORE_MANAGER],
    [ROLES.TRANSPORT_MANAGER]: [ROLES.DRIVER, ROLES.TRANSPORT_MANAGER],
    [ROLES.DRIVER]: [ROLES.DRIVER, ROLES.TRANSPORT_MANAGER],
    [ROLES.IT_SUPPORT_MANAGER]: [ROLES.IT_SUPPORT_MANAGER],
    [ROLES.ACCOUNT_HEAD]: [ROLES.ACCOUNT_HEAD],
    [ROLES.HR]: [ROLES.HR, ROLES.ADMIN],
    [ROLES.TEACHER]: [ROLES.TEACHER],
    [ROLES.LIBRARIAN]: [ROLES.LIBRARIAN, ROLES.TEACHER],
    [ROLES.CANTEEN_MANAGER]: [ROLES.CANTEEN_MANAGER, ROLES.HOUSEKEEPING_MANAGER],
    [ROLES.PROCESS_AUDITOR]: [ROLES.PROCESS_AUDITOR, ROLES.QUALITY_AUDITOR],
    [ROLES.QUALITY_AUDITOR]: [ROLES.QUALITY_AUDITOR, ROLES.PROCESS_AUDITOR],
}

/** Roles that can only view/update tasks assigned to them (no assign-tasks access) */
export const VIEW_ONLY_ROLES = [ROLES.STUDENT, ROLES.PARENT]

export const ROLE_LABELS = {
    [ROLES.SUPER_ADMIN]: 'Super Admin',
    [ROLES.ADMIN]: 'Admin',
    [ROLES.DIRECTOR]: 'Director',
    [ROLES.JOINT_DIRECTOR]: 'Joint Director (Operations)',
    [ROLES.JOINT_DIRECTOR_AUDIT]: 'Joint Director (Audit)',
    [ROLES.JOINT_DIRECTOR_ASSISTANT]: 'Joint Director Assistant',
    [ROLES.ACCOUNT_HEAD]: 'Finance',
    [ROLES.PRINCIPAL]: 'Principal',
    [ROLES.PRM]: 'Front Office (PRM)',
    [ROLES.COORDINATOR]: 'Coordinator',
    [ROLES.TEACHER]: 'Teacher',
    [ROLES.LIBRARIAN]: 'Librarian',
    [ROLES.GATEKEEPER_MANAGER]: 'Gate Keeper Manager',
    [ROLES.GATEKEEPER]: 'Gate Keeper',
    [ROLES.HOUSEKEEPING_MANAGER]: 'Housekeeping Manager',
    [ROLES.MAINTENANCE_MANAGER]: 'Maintenance Manager',
    [ROLES.CANTEEN_MANAGER]: 'Canteen Manager',
    [ROLES.IT_SUPPORT_MANAGER]: 'IT Support Manager',
    [ROLES.STATIONERY_STORE_MANAGER]: 'Stationery Store Manager',
    [ROLES.TRANSPORT_MANAGER]: 'Transport Manager',
    [ROLES.DRIVER]: 'Driver',
    [ROLES.HR]: 'HR Manager',
    [ROLES.PROCESS_AUDITOR]: 'Process Auditor',
    [ROLES.QUALITY_AUDITOR]: 'Quality Auditor',
}

export const ROUTE_BASE_BY_ROLE = {
    [ROLES.SUPER_ADMIN]: '/super-admin',
    [ROLES.ADMIN]: '/admin',
    [ROLES.DIRECTOR]: '/director',
    [ROLES.PRINCIPAL]: '/principal',
    [ROLES.JOINT_DIRECTOR]: '/joint-director',
    [ROLES.JOINT_DIRECTOR_ASSISTANT]: '/joint-director-assistant',
    [ROLES.JOINT_DIRECTOR_AUDIT]: '/joint-director-audit',
    [ROLES.ACCOUNT_HEAD]: '/account-head',
    [ROLES.PRM]: '/front-office',
    [ROLES.COORDINATOR]: '/coordinator',
    [ROLES.TEACHER]: '/teacher',
    [ROLES.LIBRARIAN]: '/librarian',
    [ROLES.GATEKEEPER_MANAGER]: '/gatekeeper-manager',
    [ROLES.GATEKEEPER]: '/gate-keeper',
    [ROLES.HOUSEKEEPING_MANAGER]: '/housekeeping-manager',
    [ROLES.MAINTENANCE_MANAGER]: '/maintenance-manager',
    [ROLES.CANTEEN_MANAGER]: '/canteen-manager',
    [ROLES.IT_SUPPORT_MANAGER]: '/it-support-manager',
    [ROLES.STATIONERY_STORE_MANAGER]: '/stationery-store-manager',
    [ROLES.TRANSPORT_MANAGER]: '/transport-manager',
    [ROLES.DRIVER]: '/driver',
    [ROLES.HR]: '/hr',
    [ROLES.PROCESS_AUDITOR]: '/process-auditor',
    [ROLES.QUALITY_AUDITOR]: '/quality-auditor',
}

/** Demo user id per role for filtering "my tasks" */
export const DEMO_USER_ID_BY_ROLE = {
    [ROLES.SUPER_ADMIN]: 'SA-001',
    [ROLES.ADMIN]: 'ADM-001',
    [ROLES.DIRECTOR]: 'DIR-001',
    [ROLES.PRINCIPAL]: 'PRIN-001',
    [ROLES.JOINT_DIRECTOR]: 'JD-001',
    [ROLES.JOINT_DIRECTOR_AUDIT]: 'JDA-001',
    [ROLES.JOINT_DIRECTOR_ASSISTANT]: 'JDAS-001',
    [ROLES.ACCOUNT_HEAD]: 'AH-001',
    [ROLES.PRM]: 'FO-001',
    [ROLES.COORDINATOR]: 'CRD-001',
    [ROLES.TEACHER]: 'TCH-001',
    [ROLES.LIBRARIAN]: 'LIB-001',
    [ROLES.GATEKEEPER_MANAGER]: 'GKM-001',
    [ROLES.GATEKEEPER]: 'GK-001',
    [ROLES.HOUSEKEEPING_MANAGER]: 'HKM-001',
    [ROLES.MAINTENANCE_MANAGER]: 'MNT-001',
    [ROLES.CANTEEN_MANAGER]: 'CAN-001',
    [ROLES.IT_SUPPORT_MANAGER]: 'ITM-001',
    [ROLES.STATIONERY_STORE_MANAGER]: 'SSM-001',
    [ROLES.TRANSPORT_MANAGER]: 'TRM-001',
    [ROLES.DRIVER]: 'DRV-001',
    [ROLES.HR]: 'HR-001',
    [ROLES.PROCESS_AUDITOR]: 'PA-001',
    [ROLES.QUALITY_AUDITOR]: 'QA-001',
}

export const USERS_BY_ROLE = {
    [ROLES.ADMIN]: [{ id: 'ADM-001', name: 'System Admin' }],
    [ROLES.DIRECTOR]: [{ id: 'DIR-001', name: 'Director of Academics' }],
    [ROLES.JOINT_DIRECTOR]: [{ id: 'JD-001', name: 'Joint Director Ops' }],
    [ROLES.JOINT_DIRECTOR_AUDIT]: [{ id: 'JDA-001', name: 'Joint Director Audit' }],
    [ROLES.ACCOUNT_HEAD]: [{ id: 'AH-001', name: 'Finance Head' }],
    [ROLES.PRINCIPAL]: [
        { id: 'PRIN-001', name: 'Dr. Meera Nair' },
        { id: 'PRIN-002', name: 'Mr. Sanjay Verma' },
    ],
    [ROLES.PRM]: [
        { id: 'FO-001', name: 'Ravi Kumar' },
        { id: 'FO-002', name: 'Lakshmi R.' },
    ],
    [ROLES.COORDINATOR]: [
        { id: 'CRD-001', name: 'Priya Nair' },
        { id: 'CRD-002', name: 'Anand Krishnan' },
    ],
    [ROLES.LIBRARIAN]: [{ id: 'LIB-001', name: 'Meera Iyer' }],
    [ROLES.GATEKEEPER_MANAGER]: [{ id: 'GKM-001', name: 'Vignesh S.' }],
    [ROLES.GATEKEEPER]: [
        { id: 'GK-001', name: 'Suresh P.' },
        { id: 'GK-002', name: 'Manoj T.' },
    ],
    [ROLES.TEACHER]: [
        { id: 'TCH-001', name: 'Sandy Selva' },
        { id: 'TCH-002', name: 'Priya Sharma' },
        { id: 'TCH-003', name: 'Arjun Menon' },
    ],
    [ROLES.HOUSEKEEPING_MANAGER]: [{ id: 'HKM-001', name: 'Savitri Devi' }],
    [ROLES.MAINTENANCE_MANAGER]: [{ id: 'MNT-001', name: 'Gopalakrishnan R' }],
    [ROLES.CANTEEN_MANAGER]: [{ id: 'CAN-001', name: 'Chef Sundaram' }],
    [ROLES.IT_SUPPORT_MANAGER]: [{ id: 'ITM-001', name: 'Karthik Raja' }],
    [ROLES.STATIONERY_STORE_MANAGER]: [{ id: 'SSM-001', name: 'Gurpreet Singh' }],
    [ROLES.TRANSPORT_MANAGER]: [{ id: 'TRM-001', name: 'Selvam R.' }],
    [ROLES.DRIVER]: [{ id: 'DRV-001', name: 'Murugan P.' }],
    [ROLES.HR]: [{ id: 'HR-001', name: 'Sunita Deshmukh' }],
    [ROLES.PROCESS_AUDITOR]: [{ id: 'PA-001', name: 'Anita Deshmukh' }],
    [ROLES.QUALITY_AUDITOR]: [{ id: 'QA-001', name: 'Rajesh Kumar' }],
}

export const getRoleLabel = (roleKey) => {
    const clean = cleanRoleKey(roleKey)
    return ROLE_LABELS[clean] ?? ROLE_LABELS[roleKey] ?? roleKey
}

export const getUsersByRole = (roleKey) => {
    const clean = cleanRoleKey(roleKey)
    return USERS_BY_ROLE[clean] ?? USERS_BY_ROLE[roleKey] ?? []
}

export const canAssignTasks = (roleKey) => {
    const clean = cleanRoleKey(roleKey)
    if (VIEW_ONLY_ROLES.includes(clean)) return false
    return Boolean(ASSIGNMENT_HIERARCHY[clean]?.length || ASSIGNMENT_HIERARCHY[roleKey]?.length || true)
}

export const isViewOnlyRole = (roleKey) => {
    const clean = cleanRoleKey(roleKey)
    return VIEW_ONLY_ROLES.includes(clean)
}

export const getAssignableRoles = (assignerRole) => {
    const clean = cleanRoleKey(assignerRole)
    const keys = ASSIGNMENT_HIERARCHY[clean] ?? ASSIGNMENT_HIERARCHY[assignerRole] ?? [clean]
    return keys.map((key) => ({ key, label: getRoleLabel(key) }))
}

export const canAssignToRole = (assignerRole, assigneeRole) => {
    if (!assignerRole || !assigneeRole) return false
    const cleanAssigner = cleanRoleKey(assignerRole)
    const cleanAssignee = cleanRoleKey(assigneeRole)
    const allowed = ASSIGNMENT_HIERARCHY[cleanAssigner] ?? ASSIGNMENT_HIERARCHY[assignerRole] ?? []
    return allowed.some((r) => cleanRoleKey(r) === cleanAssignee)
}

export const getRouteBase = (roleKey) => {
    const clean = cleanRoleKey(roleKey)
    return ROUTE_BASE_BY_ROLE[clean] ?? ROUTE_BASE_BY_ROLE[roleKey] ?? ''
}

export const getTaskManagementPaths = (roleKey) => {
    const base = getRouteBase(roleKey)
    return {
        base,
        assignTasks: `${base}/task-management/assign-tasks`,
        addTask: `${base}/task-management/assign-tasks/add`,
        myTasks: `${base}/task-management/my-tasks`,
        legacyList: `${base}/task-management`,
    }
}

export const getNextStatusOptions = (currentStatus) => {
    if (currentStatus === 'Pending') return ['In Progress', 'Completed']
    if (currentStatus === 'In Progress') return ['Completed']
    if (currentStatus === 'Incomplete') return ['In Progress', 'Completed']
    return []
}

export const formatAssignedTo = (assigneeNames) => {
    if (!assigneeNames?.length) return '—'
    if (assigneeNames.length === 1 && assigneeNames[0] === 'All') return 'All Users'
    if (assigneeNames.length > 2) {
        return `${assigneeNames.slice(0, 2).join(', ')} +${assigneeNames.length - 2} more`
    }
    return assigneeNames.join(', ')
}

// Enterprise Convenience Exports & Aliases
export const ASSIGNABLE_ROLES_BY_ASSIGNER = ASSIGNMENT_HIERARCHY
export const canRoleAssignTasks = canAssignTasks
export const getAllowedAssigneeRoles = (role) => {
    const clean = cleanRoleKey(role)
    return ASSIGNMENT_HIERARCHY[clean] ?? ASSIGNMENT_HIERARCHY[role] ?? []
}
export const TASK_CATEGORIES = [
    'Academic Administration',
    'Campus Facilities',
    'Inventory & Stores',
    'Security Operations',
    'General Support'
]
