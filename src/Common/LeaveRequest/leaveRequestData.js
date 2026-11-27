import { ROLES } from '../../constants/roles'
import { getLeaveApproverConfig, getSubmitterProfile, resolveRoleKey } from './leaveRequestConfigs'
import { canUseLeaveApi, createLeaveApi, decideLeaveApi, listLeaveApi } from '../../services/leaveApi'
import { syncAllStaffLeavesIntoHr, syncStaffLeaveIntoHr } from './leaveHrPayrollBridge'

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

// With a real backend session the server is the source of truth, so what it returned is held in
// memory only: nothing is written to localStorage or sessionStorage, and a reload or another
// person signing in on the same browser never sees the previous person's leave requests.
let apiMemoryRequests = []
const usesApiMemory = () => canUseLeaveApi()

/** Drop the in-memory copy (call on sign-out). */
export const clearLeaveRequestMemory = () => {
    apiMemoryRequests = []
    try {
        window.dispatchEvent(new CustomEvent(LEAVE_REQUESTS_UPDATED_EVENT))
    } catch {
        /* ignore */
    }
}

const loadRawFromStorage = () => {
    if (usesApiMemory()) return apiMemoryRequests
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
    if (usesApiMemory()) {
        apiMemoryRequests = Array.isArray(requests) ? requests : []
        try {
            window.dispatchEvent(new CustomEvent(LEAVE_REQUESTS_UPDATED_EVENT))
        } catch {
            /* ignore */
        }
        return
    }
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

// ---------------------------------------------------------------------------
// API source of truth (Y-4). When a real backend session exists the store below
// is only a cache of what the server returned; writes go to the API first.
// ---------------------------------------------------------------------------

const API_ROLE_LABELS = {
    superadmin: 'Super Admin',
    admin: 'Admin',
    director: 'Director',
    principal: 'Principal',
    hr: 'HR',
    gatekeepermanager: 'Gate Keeper Manager',
    transportmanager: 'Transport Manager',
}

const isoToDmy = (iso) => {
    if (!iso) return ''
    const [year, month, day] = String(iso).slice(0, 10).split('-')
    return `${day}-${month}-${year}`
}

const toIso = (value) => {
    const date = value instanceof Date ? value : new Date(value)
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${date.getFullYear()}-${month}-${day}`
}

const ROLE_LABELS = {
    superadmin: 'Super Admin',
    admin: 'Admin',
    director: 'Director',
    principal: 'Principal',
    teacher: 'Teacher',
    coordinator: 'Coordinator',
    hr: 'HR',
    prm: 'Front Office',
    pro: 'PRO',
    gatekeeper: 'Gate Keeper',
    gatekeepermanager: 'Gate Keeper Manager',
    transportmanager: 'Transport Manager',
    driver: 'Driver',
}

const mapApiLeave = (item) => {
    const submitterRole = resolveRoleKey(item.submitterRole)
    const chain = Array.isArray(item.chain) ? item.chain : []
    const email = String(item.requestedBy || '').trim()
    // Prefer the live requester identity from the API — never substitute DEFAULT_SUBMITTER_PROFILES
    // demo names ("Demo Teacher", etc.) which made the Super Admin inbox look unwired.
    const displayName = email.includes('@')
        ? (email.split('@')[0] || email)
        : (email || 'Staff')
    const roleLabel =
        ROLE_LABELS[submitterRole]
        || (submitterRole ? String(submitterRole).replace(/^\w/, (c) => c.toUpperCase()) : 'Staff')
    return {
        id: item.id,
        leaveRequestId: item.leaveRequestId,
        employeeId: item.employeeId || email,
        requestedBy: displayName,
        requestedByEmail: email.includes('@') ? email : '',
        submitterRole,
        role: roleLabel,
        department: roleLabel,
        leaveType: item.leaveType,
        fromDate: isoToDmy(item.fromDate),
        toDate: isoToDmy(item.toDate),
        totalDays: item.totalDays,
        hours: item.hours ?? null,
        appliedDate: isoToDmy(item.appliedDate),
        reason: item.reason,
        requestedTo: API_ROLE_LABELS[item.requestedTo] || item.requestedTo,
        approverRole: item.approverRole || chain[chain.length - 1] || null,
        reachedRoles: chain.slice(0, (item.currentLevel ?? 0) + 1),
        chain,
        status: item.status,
        approverRemarks: item.approverRemarks || '',
        fromApi: true,
    }
}

/** Earlier builds mirrored server data into the browser; remove those stale copies once the API has answered. */
const purgeBrowserLeaveCopies = () => {
    try {
        localStorage?.removeItem(STORAGE_KEY)
        sessionStorage?.removeItem(STORAGE_KEY)
    } catch {
        /* ignore */
    }
}

/** Replace the cache with the signed-in user's server data (kept in memory). Returns true when the API was used. */
export const hydrateLeaveRequestsFromApi = async () => {
    if (!canUseLeaveApi()) return false
    try {
        // Super Admin / Admin / HR can list campus-wide leave via box=all (403 for other roles).
        // Isolate each call so one failing box does not wipe the inbox.
        const settled = await Promise.allSettled([
            listLeaveApi('mine'),
            listLeaveApi('received'),
            listLeaveApi('all'),
        ])
        const merged = new Map()
        settled.forEach((result) => {
            if (result.status !== 'fulfilled' || !Array.isArray(result.value)) return
            result.value.forEach((item) => {
                if (item?.id) merged.set(item.id, mapApiLeave(item))
            })
        })
        const rows = [...merged.values()]
        saveRawToStorage(rows)
        purgeBrowserLeaveCopies()
        try {
            syncAllStaffLeavesIntoHr(rows)
        } catch {
            /* HR bridge is best-effort */
        }
        return true
    } catch {
        return false
    }
}

/** Create through the API. `payload.fromDate/toDate` are Date objects; `payload.hours` for Permission. */
export const createLeaveRequestViaApi = async ({ leaveType, fromDate, toDate, hours, reason }) => {
    await createLeaveApi({
        leaveType,
        fromDate: toIso(fromDate),
        toDate: toIso(toDate),
        hours,
        reason,
    })
    await hydrateLeaveRequestsFromApi()
}

export const decideLeaveRequestViaApi = async (id, status, remarks) => {
    const decided = await decideLeaveApi(id, status === 'Approved' ? 'approve' : 'deny', remarks)
    await hydrateLeaveRequestsFromApi()
    const fromCache = loadFromStorage().find(
        (request) =>
            request.id === id ||
            request.leaveRequestId === id ||
            (decided?.id && request.id === decided.id),
    )
    const resolved = fromCache ?? (decided ? mapApiLeave(decided) : null)
    if (resolved) {
        try {
            syncStaffLeaveIntoHr(resolved)
        } catch {
            /* ignore */
        }
    }
    return resolved
}

/** Approver can act now: pending and the request is waiting on this role. */
export const isAwaitingApprover = (request, approverRole) =>
    Boolean(request) &&
    request.status === 'Pending' &&
    resolveRoleKey(request.approverRole) === resolveRoleKey(approverRole)

const roleReachedRequest = (request, role) => {
    const want = resolveRoleKey(role)
    // HR / Admin can review any staff leave that has entered the shared leave store.
    if (want === ROLES.HR || want === ROLES.ADMIN || want === ROLES.SUPER_ADMIN) {
        return Boolean(request)
    }
    if (Array.isArray(request.reachedRoles)) {
        return request.reachedRoles.map(resolveRoleKey).includes(want)
    }
    return resolveRoleKey(request.approverRole) === want
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
        if (usesApiMemory()) return // the server owns leave requests; old browser copies are not imported
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
        if (usesApiMemory()) return
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
    loadFromStorage().find(
        (request) => request.id === id || request.leaveRequestId === id,
    ) ?? null

export const getMyLeaveRequestsForRole = (submitterRole) => {
    const resolvedRole = resolveRoleKey(submitterRole)
    return loadFromStorage().filter((request) => resolveRoleKey(request.submitterRole) === resolvedRole)
}

export const ensureTeacherStudentLeaveSeed = () => {
    const current = loadFromStorage()
    if (canUseLeaveApi()) return current // never inject demo rows over server data
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
    return loadFromStorage().filter((request) => roleReachedRequest(request, resolvedRole))
}

export const canApproverAccessRequest = (request, approverRole) => {
    if (!request) return false
    return roleReachedRequest(request, approverRole)
}

export const canSubmitterAccessRequest = (request, submitterRole) => {
    if (!request) return false
    return resolveRoleKey(request.submitterRole) === resolveRoleKey(submitterRole)
}

export const getPendingLeaveApprovalCount = (approverRole) =>
    getReceivedLeaveRequestsForRole(approverRole).filter((request) => isAwaitingApprover(request, approverRole)).length

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
        requestedByEmail: String(employeeId || '').includes('@') ? employeeId : '',
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
        reachedRoles: [approverConfig.approverRole].filter(Boolean),
        status: 'Pending',
        approverRemarks: '',
    })

    requests.unshift(newRequest)
    saveToStorage(requests)
    try {
        syncStaffLeaveIntoHr(newRequest)
    } catch {
        /* ignore */
    }
    return newRequest
}

export const updateLeaveRequestStatus = (id, status, approverRemarks = '', approverRole) => {
    const requests = loadFromStorage()
    const index = requests.findIndex((request) => request.id === id || request.leaveRequestId === id)
    if (index === -1) return null

    const current = requests[index]
    if (approverRole && !canApproverAccessRequest(current, approverRole)) return null

    const actor = resolveRoleKey(approverRole)
    const submitter = resolveRoleKey(current.submitterRole)
    const nextStatus = String(status || '').trim()
    const remarks = approverRemarks || current.approverRemarks

    // Offline chain: Driver → Transport Manager → HR (mirrors backend leave.chain_for).
    if (
        nextStatus === 'Approved'
        && actor === ROLES.TRANSPORT_MANAGER
        && submitter === ROLES.DRIVER
    ) {
        requests[index] = normalizeLeaveRequest({
            ...current,
            status: 'Pending',
            approverRole: ROLES.HR,
            requestedTo: 'HR',
            reachedRoles: [ROLES.TRANSPORT_MANAGER, ROLES.HR],
            deptHeadApprovedAt: new Date().toISOString(),
            approverRemarks: remarks,
        })
        saveToStorage(requests)
        try {
            syncStaffLeaveIntoHr(requests[index])
        } catch {
            /* ignore */
        }
        return requests[index]
    }

    requests[index] = normalizeLeaveRequest({
        ...current,
        status: nextStatus,
        approverRemarks: remarks,
        reachedRoles: Array.from(new Set([
            ...(Array.isArray(current.reachedRoles) ? current.reachedRoles : []),
            actor,
            ...(nextStatus === 'Approved' ? [ROLES.HR] : []),
        ].filter(Boolean))),
    })
    saveToStorage(requests)
    try {
        syncStaffLeaveIntoHr(requests[index])
    } catch {
        /* ignore */
    }
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
