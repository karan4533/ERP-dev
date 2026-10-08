import { ROLES } from '../../constants/roles'
import { getLeaveApproverConfig, getSubmitterProfile, resolveRoleKey } from './leaveRequestConfigs'

export const STORAGE_KEY = 'schoolerp-leave-requests'
export const LEAVE_REQUESTS_UPDATED_EVENT = 'schoolerp-leave-requests-updated'
const MIGRATION_FLAG = 'schoolerp-leave-requests-migrated-v2'
const SESSION_MIGRATION_FLAG = 'schoolerp-leave-requests-session-migrated-v1'

const LEGACY_KEYS = {
    admin: 'schoolerp-admin-leave-requests',
    gatekeeper: 'schoolerp-gatekeeper-leave-requests',
    gatekeepermanager: 'schoolerp-gatekeeper-manager-leave-requests',
}

export const LEAVE_TYPES = [
    'Sick Leave',
    'Casual Leave',
    'Emergency Leave',
    'Personal Leave',
    'Medical Leave',
    'Week-Off',
    'Permission',
]

export const LEAVE_STATUSES = ['Pending', 'Approved', 'Rejected']

export const statusBadgeColor = {
    Pending: 'bg-[#FF980033] text-[#FF9800]',
    Approved: 'bg-[#4CAF5033] text-[#4CAF50]',
    Rejected: 'bg-[#FF000033] text-[#FF0000]',
}

const REQUESTED_TO_APPROVER = {
    'Super Admin': ROLES.SUPER_ADMIN,
    Admin: ROLES.ADMIN,
    'Gate Keeper Manager': ROLES.GATEKEEPER_MANAGER,
    Director: ROLES.DIRECTOR,
    'Director of Academics': ROLES.DIRECTOR,
    Principal: ROLES.PRINCIPAL,
    'Transport Manager': ROLES.TRANSPORT_MANAGER,
}

export const calculateTotalDays = (fromDate, toDate) => {
    if (!fromDate || !toDate) return 0
    const start = new Date(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate())
    const end = new Date(toDate.getFullYear(), toDate.getMonth(), toDate.getDate())
    const diff = end.getTime() - start.getTime()
    if (diff < 0) return 0
    return Math.floor(diff / (1000 * 60 * 60 * 24)) + 1
}

const formatDate = (value) => {
    const date = value instanceof Date ? value : new Date(value)
    if (Number.isNaN(date.getTime())) return ''
    const day = String(date.getDate()).padStart(2, '0')
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const year = date.getFullYear()
    return `${day}-${month}-${year}`
}

const parseStoredDate = (dateStr) => {
    if (!dateStr) return null
    const parts = String(dateStr).split('-')
    if (parts.length === 3) {
        const [day, month, year] = parts
        return new Date(Number(year), Number(month) - 1, Number(day))
    }
    const parsed = new Date(dateStr)
    return Number.isNaN(parsed.getTime()) ? null : parsed
}

const readStorage = (storage) => {
    try {
        const raw = storage.getItem(STORAGE_KEY)
        if (!raw) return []
        const parsed = JSON.parse(raw)
        return Array.isArray(parsed) ? parsed : []
    } catch {
        return []
    }
}

const loadRawFromStorage = () => {
    if (typeof localStorage !== 'undefined') {
        const localItems = readStorage(localStorage)
        if (localItems.length > 0) return localItems
    }
    if (typeof sessionStorage !== 'undefined') {
        return readStorage(sessionStorage)
    }
    return []
}

const saveRawToStorage = (requests) => {
    try {
        const payload = JSON.stringify(requests)
        localStorage.setItem(STORAGE_KEY, payload)
        sessionStorage.setItem(STORAGE_KEY, payload)
        window.dispatchEvent(new CustomEvent(LEAVE_REQUESTS_UPDATED_EVENT))
    } catch {
        /* ignore */
    }
}

const normalizeLeaveRequest = (request) => {
    if (!request) return request

    const submitterRole = resolveRoleKey(request.submitterRole)
    const approverConfig = submitterRole ? getLeaveApproverConfig(submitterRole) : null
    const approverRole = resolveRoleKey(
        request.approverRole
        || REQUESTED_TO_APPROVER[request.requestedTo]
        || approverConfig?.approverRole,
    )

    return {
        ...request,
        submitterRole: submitterRole || request.submitterRole,
        approverRole: approverRole || request.approverRole,
        requestedTo: request.requestedTo || approverConfig?.requestedToLabel || request.requestedTo,
    }
}

const loadFromStorage = () => loadRawFromStorage().map(normalizeLeaveRequest)

const saveToStorage = (requests) => {
    saveRawToStorage(requests.map(normalizeLeaveRequest))
}

const readLegacyArray = (key) => {
    try {
        if (typeof sessionStorage !== 'undefined') {
            const sessionRaw = sessionStorage.getItem(key)
            if (sessionRaw) {
                const parsed = JSON.parse(sessionRaw)
                if (Array.isArray(parsed) && parsed.length > 0) return parsed
            }
        }
        if (typeof localStorage !== 'undefined') {
            const localRaw = localStorage.getItem(key)
            if (localRaw) {
                const parsed = JSON.parse(localRaw)
                if (Array.isArray(parsed) && parsed.length > 0) return parsed
            }
        }
    } catch {
        /* ignore */
    }
    return []
}

const mapLegacyAdminRequest = (request) => ({
    id: request.id,
    leaveRequestId: request.leaveRequestId || request.id,
    employeeId: request.employeeId,
    requestedBy: request.requestedBy,
    submitterRole: ROLES.ADMIN,
    role: request.role || 'Admin',
    department: request.department || 'Administration',
    leaveType: request.leaveType,
    fromDate: request.fromDate,
    toDate: request.toDate,
    totalDays: request.totalDays,
    appliedDate: request.appliedDate,
    reason: request.reason,
    requestedTo: request.requestedTo || 'Super Admin',
    approverRole: ROLES.SUPER_ADMIN,
    status: request.status || 'Pending',
    approverRemarks: request.superAdminRemarks || request.approverRemarks || '',
})

const mapLegacyGatekeeperRequest = (request) => ({
    id: request.id,
    leaveRequestId: request.leaveRequestId || request.id,
    employeeId: request.employeeId,
    requestedBy: request.gateKeeperName || request.requestedBy,
    submitterRole: ROLES.GATEKEEPER,
    role: 'Gate Keeper',
    department: 'Security',
    leaveType: request.leaveType,
    fromDate: request.fromDate,
    toDate: request.toDate,
    totalDays: request.totalDays,
    appliedDate: request.appliedDate,
    reason: request.reason,
    requestedTo: request.requestedTo || 'Gate Keeper Manager',
    approverRole: ROLES.GATEKEEPER_MANAGER,
    status: request.status || 'Pending',
    approverRemarks: request.managerRemarks || request.approverRemarks || '',
})

const mapLegacyManagerRequest = (request) => ({
    id: request.id,
    leaveRequestId: request.leaveRequestId || request.id,
    employeeId: request.employeeId || 'GKM-1001',
    requestedBy: request.requestedBy || 'Rajesh Kumar',
    submitterRole: ROLES.GATEKEEPER_MANAGER,
    role: 'Gate Keeper Manager',
    department: 'Security',
    leaveType: request.leaveType,
    fromDate: request.fromDate,
    toDate: request.toDate,
    totalDays: request.totalDays,
    appliedDate: request.appliedDate,
    reason: request.reason,
    requestedTo: request.requestedTo || 'Director',
    approverRole: ROLES.DIRECTOR,
    status: request.status || 'Pending',
    approverRemarks: request.approverRemarks || '',
})

export const migrateLegacyLeaveRequestsIfNeeded = () => {
    try {
        if (typeof localStorage === 'undefined' && typeof sessionStorage === 'undefined') return
        if (localStorage?.getItem(MIGRATION_FLAG) === '1') return

        const existing = loadRawFromStorage()
        const existingIds = new Set(existing.map((item) => item.id))
        const merged = [...existing]

        readLegacyArray(LEGACY_KEYS.admin).forEach((request) => {
            if (existingIds.has(request.id)) return
            merged.push(mapLegacyAdminRequest(request))
            existingIds.add(request.id)
        })

        readLegacyArray(LEGACY_KEYS.gatekeeper).forEach((request) => {
            if (existingIds.has(request.id)) return
            merged.push(mapLegacyGatekeeperRequest(request))
            existingIds.add(request.id)
        })

        readLegacyArray(LEGACY_KEYS.gatekeepermanager).forEach((request) => {
            if (existingIds.has(request.id)) return
            merged.push(mapLegacyManagerRequest(request))
            existingIds.add(request.id)
        })

        saveToStorage(merged.map(normalizeLeaveRequest))
        localStorage?.setItem(MIGRATION_FLAG, '1')
    } catch {
        /* ignore */
    }
}

export const migrateSessionLeaveRequestsToLocalIfNeeded = () => {
    try {
        if (typeof localStorage === 'undefined' || typeof sessionStorage === 'undefined') return
        if (localStorage.getItem(SESSION_MIGRATION_FLAG) === '1') return

        const localItems = readStorage(localStorage)
        const sessionItems = readStorage(sessionStorage)
        if (localItems.length === 0 && sessionItems.length > 0) {
            saveRawToStorage(sessionItems.map(normalizeLeaveRequest))
        } else if (localItems.length > 0) {
            saveRawToStorage(localItems.map(normalizeLeaveRequest))
        }

        localStorage.setItem(SESSION_MIGRATION_FLAG, '1')
    } catch {
        /* ignore */
    }
}

const generateLeaveRequestId = (requests) => {
    const nextNumber = requests.length + 1
    return `LR-${String(nextNumber).padStart(4, '0')}`
}

export const getAllLeaveRequests = () => loadFromStorage()

export const getLeaveRequestById = (id) =>
    loadFromStorage().find((request) => request.id === id) ?? null

export const getMyLeaveRequestsForRole = (submitterRole) => {
    const resolvedRole = resolveRoleKey(submitterRole)
    return loadFromStorage().filter((request) => resolveRoleKey(request.submitterRole) === resolvedRole)
}

export const ensureTeacherStudentLeaveSeed = () => {
    const current = loadFromStorage()
    if (current.some((request) => resolveRoleKey(request.approverRole) === ROLES.TEACHER)) return current
    const seed = {
        id: 'LV-STU-001',
        employeeId: 'STU-2024-1042',
        requestedBy: 'Arjun Sharma',
        submitterRole: 'student',
        approverRole: ROLES.TEACHER,
        requestedTo: 'Teacher',
        role: 'Student',
        department: 'Grade 10-A',
        leaveType: 'Sick Leave',
        fromDate: '20-09-2026',
        toDate: '21-09-2026',
        totalDays: 2,
        reason: 'Fever',
        status: 'Pending',
        approverRemarks: '',
    }
    const next = [seed, ...current]
    saveToStorage(next)
    return next
}

export const getReceivedLeaveRequestsForRole = (approverRole) => {
    const resolvedRole = resolveRoleKey(approverRole)
    return loadFromStorage().filter((request) => resolveRoleKey(request.approverRole) === resolvedRole)
}

export const canApproverAccessRequest = (request, approverRole) => {
    if (!request) return false
    return resolveRoleKey(request.approverRole) === resolveRoleKey(approverRole)
}

export const canSubmitterAccessRequest = (request, submitterRole) => {
    if (!request) return false
    return resolveRoleKey(request.submitterRole) === resolveRoleKey(submitterRole)
}

export const getPendingLeaveApprovalCount = (approverRole) =>
    getReceivedLeaveRequestsForRole(approverRole).filter((request) => request.status === 'Pending').length

export const createLeaveRequest = (
    {
        employeeId,
        requestedBy,
        role,
        department,
        leaveType,
        fromDate,
        toDate,
        totalDays,
        reason,
    },
    submitterRole,
) => {
    const resolvedSubmitterRole = resolveRoleKey(submitterRole)
    const approverConfig = getLeaveApproverConfig(resolvedSubmitterRole)
    const requests = loadFromStorage()
    const leaveRequestId = generateLeaveRequestId(requests)
    const newRequest = normalizeLeaveRequest({
        id: leaveRequestId,
        leaveRequestId,
        employeeId,
        requestedBy,
        submitterRole: resolvedSubmitterRole,
        role,
        department,
        leaveType,
        fromDate: formatDate(fromDate),
        toDate: formatDate(toDate),
        totalDays,
        appliedDate: formatDate(new Date()),
        reason,
        requestedTo: approverConfig.requestedToLabel,
        approverRole: approverConfig.approverRole,
        status: 'Pending',
        approverRemarks: '',
    })

    requests.unshift(newRequest)
    saveToStorage(requests)
    return newRequest
}

export const updateLeaveRequestStatus = (id, status, approverRemarks = '', approverRole) => {
    const requests = loadFromStorage()
    const index = requests.findIndex((request) => request.id === id)
    if (index === -1) return null

    const current = requests[index]
    if (approverRole && !canApproverAccessRequest(current, approverRole)) return null

    requests[index] = normalizeLeaveRequest({
        ...current,
        status,
        approverRemarks: approverRemarks || current.approverRemarks,
    })
    saveToStorage(requests)
    return requests[index]
}

export const parseLeaveDate = parseStoredDate

export const getAllAdminLeaveRequests = () => getMyLeaveRequestsForRole(ROLES.ADMIN)
export const getAdminLeaveRequestById = getLeaveRequestById
export const getLeaveRequestsByEmployeeId = (employeeId) =>
    loadFromStorage().filter((request) => request.employeeId === employeeId)

export const createAdminLeaveRequest = (payload) => {
    const profile = getSubmitterProfile(ROLES.ADMIN, { name: payload.requestedBy })
    return createLeaveRequest(
        {
            employeeId: payload.employeeId || profile.employeeId,
            requestedBy: payload.requestedBy || profile.requestedBy,
            role: payload.role || profile.role,
            department: payload.department || profile.department,
            leaveType: payload.leaveType,
            fromDate: payload.fromDate,
            toDate: payload.toDate,
            totalDays: payload.totalDays,
            reason: payload.reason,
        },
        ROLES.ADMIN,
    )
}

export const updateAdminLeaveRequestStatus = (id, status, approverRemarks = '') =>
    updateLeaveRequestStatus(id, status, approverRemarks, ROLES.SUPER_ADMIN)

export const getPendingAdminLeaveApprovalCount = () =>
    getPendingLeaveApprovalCount(ROLES.SUPER_ADMIN)

export const createGatekeeperLeaveRequest = (payload) => {
    const profile = getSubmitterProfile(ROLES.GATEKEEPER, {
        name: payload.gateKeeperName || payload.requestedBy,
    })
    return createLeaveRequest(
        {
            employeeId: payload.employeeId || profile.employeeId,
            requestedBy: payload.gateKeeperName || payload.requestedBy || profile.requestedBy,
            role: profile.role,
            department: profile.department,
            leaveType: payload.leaveType,
            fromDate: payload.fromDate,
            toDate: payload.toDate,
            totalDays: payload.totalDays,
            reason: payload.reason,
        },
        ROLES.GATEKEEPER,
    )
}

export const updateGatekeeperLeaveRequestStatus = (id, status, approverRemarks = '') =>
    updateLeaveRequestStatus(id, status, approverRemarks, ROLES.GATEKEEPER_MANAGER)

export const getPendingGatekeeperLeaveApprovalCount = () =>
    getPendingLeaveApprovalCount(ROLES.GATEKEEPER_MANAGER)

export const createMyLeaveRequest = (payload, submitterRole = ROLES.GATEKEEPER_MANAGER) =>
    createLeaveRequest(payload, submitterRole)

export const getMyLeaveRequests = (submitterRole) => getMyLeaveRequestsForRole(submitterRole)
