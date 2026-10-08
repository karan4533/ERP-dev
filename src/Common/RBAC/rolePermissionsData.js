import { ROLES } from '../../context/AuthContext'

const STORAGE_KEY = 'schoolerp-role-permissions'

export const ROLE_PERMISSION_MODULES = [
    { key: 'dashboard', label: 'Dashboard', alwaysOn: true },
    { key: 'assignedClass', label: 'Assigned Class' },
    { key: 'lessonPlans', label: 'Lesson Plans' },
    { key: 'markEntry', label: 'Mark Entry' },
    { key: 'unitTests', label: 'Unit Tests' },
    { key: 'deliverables', label: 'Deliverables' },
    { key: 'taskManagement', label: 'Task Management' },
    { key: 'admissions', label: 'Admissions / Front Office' },
    { key: 'userDatabase', label: 'User Database' },
    { key: 'attendance', label: 'Attendance' },
    { key: 'communication', label: 'Communication' },
    { key: 'announcement', label: 'Announcement' },
    { key: 'calendar', label: 'Calendar' },
    { key: 'leaveRequest', label: 'Leave Request' },
    { key: 'rbac', label: 'RBAC' },
]

export const ROLE_LABELS = {
    [ROLES.SUPER_ADMIN]: 'Super Admin',
    [ROLES.ADMIN]: 'Administrator',
    [ROLES.STUDENT]: 'Student',
    [ROLES.PARENT]: 'Parent',
    [ROLES.LIBRARIAN]: 'Librarian',
    [ROLES.PRM]: 'PRM',
    [ROLES.GATEKEEPER]: 'Gate Keeper',
    [ROLES.GATEKEEPER_MANAGER]: 'Gate Keeper Manager',
    [ROLES.DIRECTOR]: 'Director',
    [ROLES.PRINCIPAL]: 'Principal',
    [ROLES.CANTEEN_MANAGER]: 'Canteen Manager',
    [ROLES.IT_SUPPORT_MANAGER]: 'IT Support Manager',
    [ROLES.STATIONERY_STORE_MANAGER]: 'Stationery Store Manager',
    [ROLES.HOUSEKEEPING_MANAGER]: 'Housekeeping Manager',
    [ROLES.TRANSPORT_MANAGER]: 'Transport Manager',
    [ROLES.TEACHER]: 'Teacher',
    [ROLES.COORDINATOR]: 'Coordinator',
    [ROLES.JOINT_DIRECTOR]: 'Joint Director',
    [ROLES.JOINT_DIRECTOR_ASSISTANT]: 'Joint Director Assistant',
    [ROLES.JOINT_DIRECTOR_AUDIT]: 'Joint Director Audit',
    [ROLES.PROCESS_AUDITOR]: 'Process Auditor',
    [ROLES.QUALITY_AUDITOR]: 'Quality Auditor',
    [ROLES.HR]: 'HR',
    [ROLES.ACCOUNT_HEAD]: 'Account Head',
    [ROLES.DRIVER]: 'Driver',
}

export const buildDefaultRolePermissions = (enabled = false) =>
    Object.fromEntries(
        ROLE_PERMISSION_MODULES
            .filter((module) => !module.alwaysOn)
            .map((module) => [module.key, enabled]),
    )

const loadAll = () => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY)
        if (stored) {
            const parsed = JSON.parse(stored)
            return parsed && typeof parsed === 'object' ? parsed : {}
        }
    } catch {
        /* ignore */
    }
    return {}
}

const saveAll = (map) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map))
}

export const getPermissionsForRole = (role) => {
    const all = loadAll()
    return {
        ...buildDefaultRolePermissions(false),
        ...(all[role] || {}),
    }
}

export const setPermissionsForRole = (role, permissions) => {
    const all = loadAll()
    all[role] = {
        ...buildDefaultRolePermissions(false),
        ...permissions,
    }
    saveAll(all)
    return { success: true }
}

export const getPermissionCount = (role) => {
    const permissions = getPermissionsForRole(role)
    return ROLE_PERMISSION_MODULES.filter(
        (module) => !module.alwaysOn && permissions[module.key],
    ).length
}

export const getSelectableModuleCount = () =>
    ROLE_PERMISSION_MODULES.filter((module) => !module.alwaysOn).length

export const getAllRolesForManagement = () =>
    Object.values(ROLES).map((role) => ({
        id: role,
        label: ROLE_LABELS[role] || role,
    }))

/** Teacher sidebar id → permission module key. Unmapped ids stay visible when filtering. */
export const TEACHER_SIDEBAR_PERMISSION_MAP = {
    4: 'lessonPlans',
    5: 'taskManagement',
    6: 'unitTests',
    7: 'markEntry',
    8: 'deliverables',
}

export const getFilteredTeacherSidebarLinks = (teacherSidebarLinks) => {
    const permissions = getPermissionsForRole(ROLES.TEACHER)
    const anyEnabled = ROLE_PERMISSION_MODULES
        .filter((module) => !module.alwaysOn)
        .some((module) => permissions[module.key])

    if (!anyEnabled) return teacherSidebarLinks

    return teacherSidebarLinks.filter((link) => {
        if (link.id === 1) return true
        const key = TEACHER_SIDEBAR_PERMISSION_MAP[link.id]
        if (!key) return true
        return Boolean(permissions[key])
    })
}

export const getFilteredCoordinatorSidebarLinks = (coordinatorSidebarLinks) => {
    const permissions = getPermissionsForRole(ROLES.COORDINATOR)
    const anyEnabled = ROLE_PERMISSION_MODULES
        .filter((module) => !module.alwaysOn)
        .some((module) => permissions[module.key])

    if (!anyEnabled) return coordinatorSidebarLinks

    return coordinatorSidebarLinks.filter((link) => {
        if (link.id === 1) return true
        const key = TEACHER_SIDEBAR_PERMISSION_MAP[link.id]
        if (!key) return true
        return Boolean(permissions[key])
    })
}
