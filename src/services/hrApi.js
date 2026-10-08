import { HR_KEYS } from '../Pages/HR/domain/hrStorage'

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'
const TOKEN_KEY = 'qmis_hr_token'

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
}

let token = null

const authHeaders = () => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
})

export async function connectHrApi() {
    if (token) return true
    if (typeof sessionStorage !== 'undefined') {
        token = sessionStorage.getItem(TOKEN_KEY)
        if (token) return true
    }
    const response = await fetch(`${API_URL}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'hr@qmis.edu', password: 'hr12345' }),
    })
    if (!response.ok) return false
    token = (await response.json()).access_token
    if (typeof sessionStorage !== 'undefined') sessionStorage.setItem(TOKEN_KEY, token)
    return true
}

async function request(path, options = {}) {
    const response = await fetch(`${API_URL}${path}`, {
        ...options,
        headers: { ...authHeaders(), ...(options.headers || {}) },
    })
    if (response.status === 401) {
        token = null
        if (typeof sessionStorage !== 'undefined') sessionStorage.removeItem(TOKEN_KEY)
        throw new Error('HR API sign-in expired')
    }
    if (!response.ok) throw new Error(`HR API ${response.status}`)
    return response.json()
}

export const getJson = (path) => request(path)

export const putJson = (path, value) => request(path, { method: 'PUT', body: JSON.stringify(value) })

export function pushHrKey(key, value) {
    if (key === HR_KEYS.employees) return putJson('/api/v1/hr/portal/employees', value)
    if (key === HR_KEYS.leave) return putJson('/api/v1/hr/leave', value)
    if (key === HR_KEYS.payroll) return putJson('/api/v1/hr/payroll', value)
    const collection = LIST_BY_KEY[key]
    if (!collection) return Promise.resolve(null)
    return putJson(`/api/v1/hr/${collection}`, value)
}

export async function pullHrSnapshot() {
    const [employees, leave, payroll, meta, ...lists] = await Promise.all([
        getJson('/api/v1/hr/portal/employees'),
        getJson('/api/v1/hr/leave'),
        getJson('/api/v1/hr/payroll'),
        getJson('/api/v1/hr/meta'),
        ...Object.values(LIST_BY_KEY).map((collection) => getJson(`/api/v1/hr/${collection}`)),
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
    return putJson('/api/v1/hr/meta', [{ id: 'seed', seeded: true }])
}
