import { ROLES } from '../../constants/roles.js'

/**
 * Institutional Delete Permission Matrix
 * Restricts destructive deletion of records strictly to Super Admin and Admin.
 * Unauthorized roles (Teacher, Coordinator, Driver, Student, Parent, Librarian, etc.)
 * must never see Delete actions or modals.
 */
export const ROLES_CAN_DELETE = new Set([
    ROLES.SUPER_ADMIN,
    'superadmin',
    'super-admin',
    ROLES.ADMIN,
    'admin',
])

export const canRoleDelete = (role) => {
    if (!role) return false
    const clean = String(role).trim().toLowerCase().replace(/-/g, '')
    return clean === 'superadmin' || clean === 'admin'
}

export const canRoleEdit = (role, resourceOwner = null) => {
    if (!role) return false
    const clean = String(role).trim().toLowerCase().replace(/-/g, '')
    if (clean === 'superadmin' || clean === 'admin') return true
    if (resourceOwner && String(resourceOwner).toLowerCase() === clean) return true
    return true
}

export default {
    canRoleDelete,
    canRoleEdit,
    ROLES_CAN_DELETE,
}

