const listeners = new Set()
let version = 0

export const HR_KEYS = {
    employees: 'school-erp-hr-employees-v1',
    documents: 'school-erp-hr-documents-v1',
    jobs: 'school-erp-hr-job-openings-v1',
    candidates: 'school-erp-hr-candidates-v1',
    interviews: 'school-erp-hr-interviews-v1',
    offers: 'school-erp-hr-offers-v1',
    onboarding: 'school-erp-hr-onboarding-v1',
    observations: 'school-erp-hr-observations-v1',
    shadow: 'school-erp-hr-shadow-mentor-v1',
    training: 'school-erp-hr-training-v1',
    leave: 'school-erp-hr-leave-policies-v1',
    attendance: 'school-erp-hr-attendance-v1',
    payroll: 'school-erp-hr-payroll-v1',
    payslips: 'school-erp-hr-payslips-v1',
    advances: 'school-erp-hr-salary-advance-v1',
    referrals: 'school-erp-hr-referrals-v1',
    concessions: 'school-erp-hr-child-concessions-v1',
    disciplinary: 'school-erp-hr-disciplinary-v1',
    exit: 'school-erp-hr-exit-v1',
    performance: 'school-erp-hr-performance-v1',
    notifications: 'school-erp-hr-notifications-v1',
    comms: 'school-erp-hr-comms-v1',
}

const canUseStorage = () => typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'

export const subscribeHrStore = (listener) => {
    listeners.add(listener)
    return () => listeners.delete(listener)
}

export const getHrStoreVersion = () => version

const emit = () => {
    version += 1
    listeners.forEach((listener) => listener())
}

export function loadHrCollection(key, fallback) {
    if (!canUseStorage()) return structuredClone(fallback)
    try {
        const raw = window.localStorage.getItem(key)
        if (!raw) return structuredClone(fallback)
        const parsed = JSON.parse(raw)
        if (parsed == null || typeof parsed !== 'object') return structuredClone(fallback)
        return parsed
    } catch {
        return structuredClone(fallback)
    }
}

export function saveHrCollection(key, value) {
    if (!canUseStorage()) return
    try {
        window.localStorage.setItem(key, JSON.stringify(value))
        emit()
    } catch (error) {
        console.error(`Unable to persist ${key}`, error)
    }
}
