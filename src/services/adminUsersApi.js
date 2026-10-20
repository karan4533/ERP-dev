import { apiRequest, getAccessToken, isApiAdminUsersEnabled } from './apiClient'

/** True when admin user management should use the API (flag on and a real backend session). */
export const canUseAdminUsersApi = () => isApiAdminUsersEnabled() && Boolean(getAccessToken())

export const listAdminUsersApi = ({ role, status, q } = {}) => {
    const params = new URLSearchParams()
    if (role) params.set('role', role)
    if (status) params.set('status', status)
    if (q) params.set('q', q)
    const query = params.toString()
    return apiRequest(`/admin/users${query ? `?${query}` : ''}`)
}

/** Roles the signed-in administrator may create: [{ role, label }]. */
export const listCreatableRolesApi = () => apiRequest('/admin/users/creatable-roles')

/**
 * The response carries `temporaryPassword` exactly once when the server generated it.
 * Never persist it; show it to the administrator and drop it.
 */
export const createAdminUserApi = (body) => apiRequest('/admin/users', { method: 'POST', body })

export const getAdminUserApi = (id) =>
    apiRequest(`/admin/users/${encodeURIComponent(id)}`)

export const updateAdminUserApi = (id, changes) =>
    apiRequest(`/admin/users/${encodeURIComponent(id)}`, { method: 'PATCH', body: changes })

export const resetAdminUserPasswordApi = (id) =>
    apiRequest(`/admin/users/${encodeURIComponent(id)}/reset-password`, { method: 'POST' })

/** Read-only: [{ id, label, userCount, permissionCount, creatable }]. */
export const listAdminRolesApi = () => apiRequest('/admin/roles')

export const getAdminRolePermissionsApi = (roleCode) =>
    apiRequest(`/admin/roles/${encodeURIComponent(roleCode)}/permissions`)
