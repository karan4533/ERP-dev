import { ROLES } from '../../constants/roles'

const normalizeRole = (role) =>
    String(role || '')
        .trim()
        .toLowerCase()
        .replace(/[\s_-]+/g, '')

/**
 * Roles that edit/delete directly — never "Send Request to Super Admin".
 * Matches Academic Calendar / Class Timetable behaviour.
 */
const DIRECT_MUTATION_ROLES = new Set([
    normalizeRole(ROLES.SUPER_ADMIN),
    normalizeRole(ROLES.ADMIN),
    normalizeRole(ROLES.PRINCIPAL),
    normalizeRole(ROLES.DIRECTOR),
    normalizeRole(ROLES.COORDINATOR),
    normalizeRole(ROLES.JOINT_DIRECTOR),
    normalizeRole(ROLES.JOINT_DIRECTOR_ASSISTANT),
    normalizeRole(ROLES.JOINT_DIRECTOR_AUDIT),
    normalizeRole(ROLES.HR),
    normalizeRole(ROLES.ACCOUNT_HEAD),
    normalizeRole(ROLES.FINANCE_ASSISTANT),
    normalizeRole(ROLES.PRM),
    normalizeRole(ROLES.GATEKEEPER_MANAGER),
    normalizeRole(ROLES.CANTEEN_MANAGER),
    normalizeRole(ROLES.IT_SUPPORT_MANAGER),
    normalizeRole(ROLES.STATIONERY_STORE_MANAGER),
    normalizeRole(ROLES.HOUSEKEEPING_MANAGER),
    normalizeRole(ROLES.TRANSPORT_MANAGER),
    'superadmin',
])

/**
 * Roles that must never see Delete / "Send delete request" on campus records.
 * Teachers may still remove their own CA/RCT rows via ownership-scoped APIs.
 */
const DELETE_HIDDEN_ROLES = new Set([
    normalizeRole(ROLES.TEACHER),
    normalizeRole(ROLES.PARENT),
    normalizeRole(ROLES.STUDENT),
    normalizeRole(ROLES.DRIVER),
    normalizeRole(ROLES.PROCESS_AUDITOR),
    normalizeRole(ROLES.QUALITY_AUDITOR),
    'teacher',
    'parent',
    'student',
    'driver',
    'processauditor',
    'qualityauditor',
])

export const canEditWithoutApproval = (role) => DIRECT_MUTATION_ROLES.has(normalizeRole(role))

export const canDeleteWithoutApproval = (role) => canEditWithoutApproval(role)

export const requiresEditApproval = (role) => !canEditWithoutApproval(role)

/** Hide Delete entirely for roles that are not authorized to delete records. */
export const canShowDeleteOption = (role) => {
    const code = normalizeRole(role)
    if (!code || DELETE_HIDDEN_ROLES.has(code)) return false
    return DIRECT_MUTATION_ROLES.has(code)
}
