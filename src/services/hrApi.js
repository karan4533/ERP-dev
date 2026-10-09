import { HR_KEYS } from '../Pages/HR/domain/hrStorage'
import { apiRequest, getAccessToken, getApiBaseUrl } from './apiClient'
import { apiLogin } from './authApi'

const LIST_BY_KEY = {
    [HR_KEYS.documents]: 'documents',
    [HR_KEYS.jobs]: 'jobs',
    [HR_KEYS.candidates]: 'candidates',
    [HR_KEYS.interviews]: 'interviews',
    [HR_KEYS.offers]: 'offers',
    [HR_KEYS.onboarding]: 'onboarding',
    [HR_KEYS.observations]: 'observations',
    [HR_KEYS.shadow]: 'shadow',
    [HR_KEYS.training]: 'training',
    [HR_KEYS.attendance]: 'attendance',
    [HR_KEYS.payslips]: 'payslips',
    [HR_KEYS.advances]: 'advances',
    [HR_KEYS.referrals]: 'referrals',
    [HR_KEYS.concessions]: 'concessions',
    [HR_KEYS.disciplinary]: 'disciplinary',
    [HR_KEYS.exit]: 'exits',
    [HR_KEYS.performance]: 'performance',
    [HR_KEYS.notifications]: 'notifications',
    [HR_KEYS.comms]: 'comms',
    [HR_KEYS.claims]: 'claims',
    [HR_KEYS.announcements]: 'announcements',
}

export async function connectHrApi() {
    if (getAccessToken()) return true
    try {
        await apiLogin('hr@qmis.edu', 'hr12345')
        return true
    } catch {
        return false
    }
}

export async function createStaff(employee) {
    const connected = await connectHrApi()
    if (!connected) throw new Error('HR API is not available')
    return apiRequest('/hr/staff', { method: 'POST', body: employee })
}

export const getJson = (path) => apiRequest(path)

export const putJson = (path, value) => apiRequest(path, { method: 'PUT', body: value })

export function pushHrKey(key, value) {
    if (key === HR_KEYS.employees) return putJson('/hr/portal/employees', value)
    if (key === HR_KEYS.leave) return putJson('/hr/leave', value)
    if (key === HR_KEYS.payroll) return putJson('/hr/payroll', value)
    const collection = LIST_BY_KEY[key]
    if (!collection) return Promise.resolve(null)
    return putJson(`/hr/${collection}`, value)
}

export async function pullHrSnapshot() {
    const [employees, leave, payroll, meta, ...lists] = await Promise.all([
        getJson('/hr/portal/employees'),
        getJson('/hr/leave'),
        getJson('/hr/payroll'),
        getJson('/hr/meta'),
        ...Object.values(LIST_BY_KEY).map((collection) => getJson(`/hr/${collection}`)),
    ])
    const collections = {
        [HR_KEYS.employees]: employees,
        [HR_KEYS.leave]: leave,
        [HR_KEYS.payroll]: payroll,
    }
    Object.keys(LIST_BY_KEY).forEach((key, index) => {
        collections[key] = lists[index]
    })
    return {
        seeded: meta.some((item) => item?.id === 'seed'),
        collections,
    }
}

export function markHrSeeded() {
    return putJson('/hr/meta', [{ id: 'seed', seeded: true }])
}

/** Upload a browser File; returns { id, download_url, original_name, size_bytes }. */
export async function uploadHrFile(file, resourceType = 'hr_document', resourceId = null) {
    const connected = await connectHrApi()
    if (!connected) throw new Error('HR API is not available')
    const body = new FormData()
    body.append('file', file)
    body.append('resource_type', resourceType)
    if (resourceId != null) body.append('resource_id', String(resourceId))
    return apiRequest('/files', { method: 'POST', body, formData: true })
}

export function hrFileDownloadUrl(downloadPath) {
    if (!downloadPath) return ''
    if (String(downloadPath).startsWith('http') || String(downloadPath).startsWith('data:')) return downloadPath
    const origin = getApiBaseUrl().replace(/\/api\/v1\/?$/, '')
    const absolute = `${origin}${downloadPath.startsWith('/') ? '' : '/'}${downloadPath}`
    const token = getAccessToken()
    if (!token) return absolute
    return `${absolute}${absolute.includes('?') ? '&' : '?'}token=${encodeURIComponent(token)}`
}
