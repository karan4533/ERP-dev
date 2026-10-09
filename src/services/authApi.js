import { apiRequest, clearAccessToken, setAccessToken } from './apiClient'

/** Normalize partner TokenResponse and older { user } payloads into one shape. */
const normalizeLogin = (data) => {
    const role = data?.user?.role || data?.role || null
    const email = data?.user?.email || null
    const fullName = data?.user?.full_name || data?.user?.name || null
    return {
        ...data,
        access_token: data.access_token,
        must_change_password: Boolean(data?.must_change_password ?? data?.user?.must_change_password),
        user: {
            ...(data.user || {}),
            role,
            email,
            full_name: fullName,
            must_change_password: Boolean(data?.must_change_password ?? data?.user?.must_change_password),
        },
    }
}

export async function apiChangePassword(currentPassword, newPassword) {
    return apiRequest('/auth/change-password', {
        method: 'POST',
        body: { current_password: currentPassword, new_password: newPassword },
    })
}

export async function apiLogin(email, password) {
    const data = await apiRequest('/auth/login', {
        method: 'POST',
        body: { email, password },
        token: null,
    })
    setAccessToken(data.access_token)
    return normalizeLogin(data)
}

export async function apiLogout() {
    try {
        await apiRequest('/auth/logout', { method: 'POST' })
    } catch {
        // Partner stack may not expose logout yet — always clear local token
    } finally {
        clearAccessToken()
    }
}

export async function apiMe() {
    const data = await apiRequest('/auth/me')
    // Partner MeResponse has role at top level
    if (data && !data.user) {
        return {
            ...data,
            role: data.role,
            full_name: data.role_name || data.email,
            email: data.email,
        }
    }
    return data
}
