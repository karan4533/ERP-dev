const TOKEN_KEY = 'schoolerp_api_token'

export const getApiBaseUrl = () =>
    (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api/v1').replace(/\/$/, '')

export const isApiAuthEnabled = () => String(import.meta.env.VITE_USE_API_AUTH || 'true') === 'true'
// Partner Phase-0 rewrite ships a stub admissions API; rich FE flow stays local until ported.
export const isApiAdmissionsEnabled = () =>
    String(import.meta.env.VITE_USE_API_ADMISSIONS || 'false') === 'true'

export const getAccessToken = () => sessionStorage.getItem(TOKEN_KEY)
export const setAccessToken = (token) => {
    if (token) sessionStorage.setItem(TOKEN_KEY, token)
    else sessionStorage.removeItem(TOKEN_KEY)
}
export const clearAccessToken = () => sessionStorage.removeItem(TOKEN_KEY)

export class ApiError extends Error {
    constructor(message, status, details = null) {
        super(message)
        this.name = 'ApiError'
        this.status = status
        this.details = details
    }
}

const parseError = async (response) => {
    try {
        const data = await response.json()
        if (typeof data?.detail === 'string') return data.detail
        if (data?.detail && typeof data.detail === 'object' && data.detail.message) {
            return data.detail.message
        }
        if (Array.isArray(data?.detail)) {
            return data.detail.map((item) => item.msg || JSON.stringify(item)).join(', ')
        }
        return data?.message || `Request failed (${response.status})`
    } catch {
        return `Request failed (${response.status})`
    }
}

export async function apiRequest(path, options = {}) {
    const {
        method = 'GET',
        body,
        token = getAccessToken(),
        headers = {},
        formData = false,
    } = options

    const finalHeaders = { ...headers }
    if (token) finalHeaders.Authorization = `Bearer ${token}`
    if (body != null && !formData) {
        finalHeaders['Content-Type'] = 'application/json'
    }

    const response = await fetch(`${getApiBaseUrl()}${path}`, {
        method,
        headers: finalHeaders,
        body: body == null ? undefined : formData ? body : JSON.stringify(body),
    })

    if (!response.ok) {
        throw new ApiError(await parseError(response), response.status)
    }

    if (response.status === 204) return null
    const contentType = response.headers.get('content-type') || ''
    if (contentType.includes('application/json')) return response.json()
    return response
}
