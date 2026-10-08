import { ROLES } from '../../context/AuthContext'

export const TASK_STATUSES = ['Pending', 'In Progress', 'Completed']
export const TASK_PRIORITIES = ['High', 'Medium', 'Low']

export const statusBadgeColor = {
    Pending: 'bg-[#FF980033] text-[#FF9800]',
    'In Progress': 'bg-[#515DEF33] text-[#515DEF]',
    Completed: 'bg-[#4CAF5033] text-[#4CAF50]',
    Incomplete: 'bg-[#FF000033] text-[#FF0000]',
}

/**
 * Who each role may assign tasks to (direct reports only).
 * Flow A: Super Admin → Admin → Director → Principal → Coordinator / Teacher / Librarian
 * Flow B: Director → PRM → Gate Keeper Manager → Gate Keeper
 */
export const ASSIGNMENT_HIERARCHY = {
    [ROLES.SUPER_ADMIN]: [ROLES.ADMIN],
    [ROLES.ADMIN]: [ROLES.DIRECTOR],
    [ROLES.DIRECTOR]: [ROLES.PRINCIPAL, ROLES.PRM],
    [ROLES.PRINCIPAL]: [ROLES.COORDINATOR, ROLES.TEACHER, ROLES.LIBRARIAN],
    [ROLES.PRM]: [ROLES.GATEKEEPER_MANAGER],
    [ROLES.GATEKEEPER_MANAGER]: [ROLES.GATEKEEPER],
}

/** Roles that can only view/update tasks assigned to them (no assign-tasks access) */
export const VIEW_ONLY_ROLES = [
    ROLES.COORDINATOR,
    ROLES.TEACHER,
    ROLES.LIBRARIAN,
    ROLES.GATEKEEPER,
    ROLES.ACCOUNT_HEAD,
    ROLES.JOINT_DIRECTOR,
    ROLES.JOINT_DIRECTOR_ASSISTANT,
    ROLES.JOINT_DIRECTOR_AUDIT,
    ROLES.HOUSEKEEPING_MANAGER,
]

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
}

export const getRoleLabel = (roleKey) => ROLE_LABELS[roleKey] ?? roleKey

export const getUsersByRole = (roleKey) => USERS_BY_ROLE[roleKey] ?? []

export const canAssignTasks = (roleKey) =>
    Boolean(ASSIGNMENT_HIERARCHY[roleKey]?.length)

export const isViewOnlyRole = (roleKey) => VIEW_ONLY_ROLES.includes(roleKey)

export const getAssignableRoles = (assignerRole) => {
    const keys = ASSIGNMENT_HIERARCHY[assignerRole] ?? []
    return keys.map((key) => ({ key, label: getRoleLabel(key) }))
}

export const canAssignToRole = (assignerRole, assigneeRole) => {
    if (!assignerRole || !assigneeRole) return false
    const allowed = ASSIGNMENT_HIERARCHY[assignerRole] ?? []
    return allowed.includes(assigneeRole)
}

export const getRouteBase = (roleKey) => ROUTE_BASE_BY_ROLE[roleKey] ?? ''

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
