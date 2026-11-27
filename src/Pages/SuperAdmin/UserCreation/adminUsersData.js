import { adminSidebarLinks } from '../../../Common/CommonSidebar/Components/sidebarLinks'
import { ROLES } from '../../../constants/roles'
import {
    buildUserDisplayName,
    DEFAULT_USER_FORM,
    formatUserDateOfBirth,
    validateUserCreationForm,
} from '../../../Common/RBAC/createdUsersData'
import { isApiAuthEnabled } from '../../../services/apiClient'
import {
    canUseAdminUsersApi,
    createAdminUserApi,
    getAdminUserApi,
    listAdminUsersApi,
    resetAdminUserPasswordApi,
    updateAdminUserApi,
} from '../../../services/adminUsersApi'

/**
 * ASA-03: Super Admin module checkboxes are NOT server access control.
 * Live auth grants every `admin` the full matrix `_ADMIN` permission codes.
 * There is no per-user module-grant API or table. Do not invent semantics.
 */
export const MODULE_PERMISSIONS_PREVIEW_ONLY = true

export const MODULE_PERMISSIONS_NOTICE =
    'Preview only — not access control. Administrator logins receive the full Admin role on the server. Per-module grants need a product decision and schema before they can be enforced.'

const STORAGE_KEY = 'schoolerp-super-admin-admin-users'
const ACTIVE_ADMIN_KEY = 'schoolerp_active_admin_user'

export const ROUTE_BASE = '/super-admin/user-creation'

export const ADMIN_USER_STATUSES = ['Active', 'Inactive']

export const ADMIN_ROLE_LABEL = 'Administrator'

export const ADMIN_PERMISSION_MODULES = [
    { key: 'dashboard', label: 'Dashboard', sidebarId: 1, alwaysOn: true },
    { key: 'admissions', label: 'Admissions', sidebarId: 2 },
    { key: 'userDatabase', label: 'User Database', sidebarId: 3 },
    { key: 'classDetails', label: 'Class Details', sidebarId: 4 },
    { key: 'attendance', label: 'Attendance', sidebarId: 5 },
    { key: 'activities', label: 'Activities', sidebarId: 6 },
    { key: 'documents', label: 'Documents', sidebarId: 7 },
    { key: 'taskManagement', label: 'Task Management', sidebarId: 8 },
    { key: 'leaveRequest', label: 'Leave Request', sidebarId: 9 },
    { key: 'announcement', label: 'Announcement', sidebarId: 10 },
    { key: 'tcRequestApproval', label: 'TC Request Approval', sidebarId: 11 },
    { key: 'communication', label: 'Communication', sidebarId: 12 },
    { key: 'calendar', label: 'Calendar', sidebarId: 13 },
    { key: 'notifications', label: 'Notifications', sidebarId: 14 },
    { key: 'escalationManagement', label: 'Report Issue / Escalation', sidebarId: 15 },
    { key: 'rbac', label: 'RBAC', sidebarId: 16 },
]

export const statusBadgeColor = {
    Active: 'bg-[#4CAF5033] text-[#4CAF50]',
    Inactive: 'bg-[#66708533] text-[#667085]',
}

export const buildDefaultPermissions = (enabled = false) =>
    Object.fromEntries(
        ADMIN_PERMISSION_MODULES
            .filter((module) => !module.alwaysOn)
            .map((module) => [module.key, enabled]),
    )

export const buildFullPermissions = () =>
    Object.fromEntries(
        ADMIN_PERMISSION_MODULES
            .filter((module) => !module.alwaysOn)
            .map((module) => [module.key, true]),
    )

const buildSeedAdminUsers = () => [
    {
        id: 'ADM-001',
        employeeId: 'ADM-001',
        name: 'System Admin',
        email: 'admin@school.com',
        mobileNumber: '9876543210',
        department: 'Administration',
        role: ROLES.ADMIN,
        roleLabel: ADMIN_ROLE_LABEL,
        status: 'Active',
        username: 'admin@school.com',
        permissions: buildFullPermissions(),
        createdBy: 'Super Admin',
        createdAt: '01-01-2026',
        isSystem: true,
    },
]

const loadAdminUsers = () => {
    try {
        const stored = sessionStorage.getItem(STORAGE_KEY)
        if (stored) return JSON.parse(stored)
    } catch {
        /* ignore */
    }
    const seed = buildSeedAdminUsers()
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(seed))
    return seed
}

const saveAdminUsers = (records) => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(records))
}

export const getAllAdminUsers = () => loadAdminUsers()

/** Map `/admin/users` admin roles into the Super Admin User Creation list shape. */
const fromAdminUsersApi = (apiUser) => ({
    id: apiUser.staffCode || apiUser.id,
    employeeId: apiUser.staffCode || apiUser.id,
    name: apiUser.name,
    firstName: apiUser.firstName || '',
    middleName: apiUser.middleName || '',
    lastName: apiUser.lastName || '',
    email: apiUser.email,
    mobileNumber: apiUser.mobileNumber || '—',
    department: apiUser.details?.department || 'Administration',
    role: apiUser.role || ROLES.ADMIN,
    roleLabel: apiUser.roleLabel || ADMIN_ROLE_LABEL,
    status: apiUser.status === 'Inactive' ? 'Inactive' : 'Active',
    username: apiUser.details?.username || String(apiUser.email || '').split('@')[0],
    permissions: buildFullPermissions(),
    createdBy: 'System',
    createdAt: apiUser.createdAt || '',
    isSystem: false,
    source: 'api',
    userId: apiUser.id,
})

/** Refresh Administrator portal accounts from the shared admin-users API. */
export const hydrateAdminUsersFromApi = async () => {
    if (!canUseAdminUsersApi()) return getAllAdminUsers()
    // Include every campus login Super Admin may manage (not Administrators only).
    const rows = await listAdminUsersApi()
    const mapped = (Array.isArray(rows) ? rows : []).map(fromAdminUsersApi)
    if (mapped.length) saveAdminUsers(mapped)
    return getAllAdminUsers()
}

export const getAdminUserById = (id) =>
    loadAdminUsers().find((user) => user.id === id) ?? null

export const getAdminUserByEmail = (email) => {
    const normalized = email.trim().toLowerCase()
    return loadAdminUsers().find((user) => user.email.toLowerCase() === normalized) ?? null
}

export const findActiveAdminByEmail = (email) => {
    const user = getAdminUserByEmail(email)
    return user?.status === 'Active' ? user : null
}

export const generateAdminUserId = () => {
    const records = loadAdminUsers()
    const max = records.reduce((acc, user) => {
        const numeric = Number(String(user.id).replace(/\D/g, ''))
        return Number.isNaN(numeric) ? acc : Math.max(acc, numeric)
    }, 0)
    return `ADM-${String(max + 1).padStart(3, '0')}`
}

export const getPermissionLabels = (permissions = {}) =>
    ADMIN_PERMISSION_MODULES
        .filter((module) => !module.alwaysOn && permissions[module.key])
        .map((module) => module.label)

export const getPermissionCount = (permissions = {}) =>
    ADMIN_PERMISSION_MODULES.filter((module) => !module.alwaysOn && permissions[module.key]).length

export const createAdminUser = (payload) => {
    const records = loadAdminUsers()
    const email = payload.email?.trim().toLowerCase()
    const validation = validateUserCreationForm(payload)

    if (!validation.success) {
        return validation
    }

    if (!payload.password?.trim()) {
        return { success: false, message: 'Password is required.' }
    }

    if (records.some((user) => user.email.toLowerCase() === email)) {
        return { success: false, message: 'An admin user with this email already exists.' }
    }

    const id = generateAdminUserId()
    const name = buildUserDisplayName(payload)
    const username = payload.username?.trim() || email.split('@')[0]

    const nextUser = {
        id,
        employeeId: payload.employeeId?.trim() || id,
        name,
        firstName: payload.firstName?.trim() || '',
        middleName: payload.middleName?.trim() || '',
        lastName: payload.lastName?.trim() || '',
        email,
        mobileNumber: payload.mobileNumber?.trim() || '—',
        alternativeMobileNumber: payload.alternativeMobileNumber?.trim() || '',
        department: payload.department?.trim() || 'Administration',
        role: ROLES.ADMIN,
        roleLabel: ADMIN_ROLE_LABEL,
        status: payload.status === 'Inactive' ? 'Inactive' : 'Active',
        username,
        password: payload.password.trim(),
        profileImage: payload.profileImage || '',
        street: payload.street?.trim() || '',
        city: payload.city?.trim() || '',
        state: payload.state?.trim() || '',
        country: payload.country?.trim() || '',
        pincode: payload.pincode?.trim() || '',
        religion: payload.religion?.trim() || '',
        caste: payload.caste?.trim() || '',
        dateOfBirth: formatUserDateOfBirth(payload.dateOfBirth),
        bloodGroup: payload.bloodGroup || '',
        height: payload.height?.trim() || '',
        weight: payload.weight?.trim() || '',
        medicalHistory: payload.medicalHistory?.trim() || '',
        fatherName: payload.fatherName?.trim() || '',
        motherName: payload.motherName?.trim() || '',
        familyContactNumber: payload.familyContactNumber?.trim() || '',
        qualification: payload.qualification?.trim() || '',
        yearsOfExperience: payload.yearsOfExperience?.trim() || '',
        previousSchool: payload.previousSchool?.trim() || '',
        joiningDate: formatUserDateOfBirth(payload.joiningDate),
        gender: payload.gender || '',
        idProofFile: payload.idProofFile?.trim() || '',
        qualificationCertificateFile: payload.qualificationCertificateFile?.trim() || '',
        experienceCertificateFile: payload.experienceCertificateFile?.trim() || '',
        permissions: { ...buildDefaultPermissions(false), ...payload.permissions },
        createdBy: 'Super Admin',
        createdAt: new Date().toLocaleDateString('en-GB').replace(/\//g, '-'),
        isSystem: false,
    }

    records.unshift(nextUser)
    saveAdminUsers(records)
    return { success: true, user: nextUser }
}

const _mergeMappedIntoStore = (mapped) => {
    const records = loadAdminUsers().filter(
        (row) => row.userId !== mapped.userId && row.id !== mapped.id,
    )
    records.unshift(mapped)
    saveAdminUsers(records)
    return mapped
}

/** Prefer the shared admin-users API so Super Admin creates the same accounts Admin RBAC uses. */
export const createAdminUserViaApi = async (payload) => {
    if (!canUseAdminUsersApi()) return createAdminUser(payload)
    const validation = validateUserCreationForm(payload)
    if (!validation.success) return validation
    try {
        const created = await createAdminUserApi({
            role: payload.role || ROLES.ADMIN,
            firstName: payload.firstName?.trim() || '',
            middleName: payload.middleName?.trim() || '',
            lastName: payload.lastName?.trim() || '',
            email: payload.email?.trim(),
            gender: payload.gender || 'Male',
            mobileNumber: payload.mobileNumber?.trim() || '',
            status: payload.status === 'Inactive' ? 'Inactive' : 'Active',
            password: payload.password?.trim() || undefined,
            details: {
                username: payload.username?.trim() || '',
                department: payload.department?.trim() || 'Administration',
            },
        })
        await hydrateAdminUsersFromApi()
        return {
            success: true,
            user: fromAdminUsersApi(created),
            temporaryPassword: created.temporaryPassword,
            persistedOnServer: true,
        }
    } catch (error) {
        return { success: false, message: error?.message || 'Could not create admin user.' }
    }
}

/** Load one Administrator from the API (staff code or UUID). Authoritative for view/edit. */
export const fetchAdminUserViaApi = async (staffCodeOrId) => {
    if (!canUseAdminUsersApi()) return getAdminUserById(staffCodeOrId)

    await hydrateAdminUsersFromApi().catch(() => null)
    let mirrored = getAdminUserById(staffCodeOrId)
    const serverId = mirrored?.userId || staffCodeOrId
    try {
        const apiUser = await getAdminUserApi(serverId)
        // ASA-03: display full Admin role map; never rehydrate local checkbox state as grants.
        return _mergeMappedIntoStore(fromAdminUsersApi(apiUser))
    } catch {
        return mirrored || getAdminUserById(staffCodeOrId)
    }
}

/**
 * Persist status (activate / deactivate) via PATCH /admin/users/{id}.
 * Module-permission payloads are ignored (ASA-03 — no server grant model).
 * Success is returned only after the backend confirms the status write.
 */
export const updateAdminUserViaApi = async (user, payload) => {
    if (!canUseAdminUsersApi()) {
        return updateAdminUser(user?.id, payload)
    }
    if (!user?.userId) {
        return {
            success: false,
            message: 'User is missing a server id. Refresh the list and try again.',
        }
    }

    const nextStatus = payload.status === 'Inactive' ? 'Inactive' : 'Active'
    try {
        const updated = await updateAdminUserApi(user.userId, { status: nextStatus })
        await hydrateAdminUsersFromApi().catch(() => null)
        const mapped = fromAdminUsersApi(updated)
        // Do not write checkbox state as if it were authoritative access control.
        mapped.permissions = buildFullPermissions()
        _mergeMappedIntoStore(mapped)

        // API-mode Admin sessions must not use local module filters as an authz boundary.
        if (isApiAuthEnabled()) {
            clearActiveAdminSession()
        }

        return { success: true, user: mapped, persistedOnServer: true }
    } catch (error) {
        return { success: false, message: error?.message || 'Could not update administrator.' }
    }
}

export const resetAdminUserPasswordViaApi = async (user) => {
    if (!canUseAdminUsersApi()) {
        return { success: false, message: 'Admin user API is not available.' }
    }
    if (!user?.userId) {
        return { success: false, message: 'User is missing a server id. Refresh the list and try again.' }
    }
    try {
        const result = await resetAdminUserPasswordApi(user.userId)
        return { success: true, temporaryPassword: result.temporaryPassword, persistedOnServer: true }
    } catch (error) {
        return { success: false, message: error?.message || 'Could not reset password.' }
    }
}

/** Local-only fallback when the admin-users API flag/session is off. */
export const updateAdminUser = (id, payload) => {
    const records = loadAdminUsers()
    const index = records.findIndex((user) => user.id === id)
    if (index === -1) return { success: false, message: 'Admin user not found.' }

    const email = payload.email?.trim().toLowerCase()
    if (
        email
        && records.some((user, userIndex) => userIndex !== index && user.email.toLowerCase() === email)
    ) {
        return { success: false, message: 'An admin user with this email already exists.' }
    }

    records[index] = {
        ...records[index],
        ...payload,
        email: email || records[index].email,
        role: ROLES.ADMIN,
        roleLabel: ADMIN_ROLE_LABEL,
        permissions: {
            ...records[index].permissions,
            ...payload.permissions,
        },
    }

    saveAdminUsers(records)

    const activeSession = getActiveAdminSession()
    if (activeSession?.id === id) {
        setActiveAdminSession(records[index])
    }

    return { success: true, user: records[index], persistedOnServer: false }
}

export const getAdminUserSummary = (records) => ({
    total: records.length,
    active: records.filter((user) => user.status === 'Active').length,
    inactive: records.filter((user) => user.status === 'Inactive').length,
    custom: records.filter((user) => !user.isSystem).length,
})

export const filterAdminUsers = (records, { search = '', status = '' } = {}) => {
    const query = search.trim().toLowerCase()
    return records.filter((user) => {
        const matchesSearch = !query || [
            user.id,
            user.employeeId,
            user.name,
            user.email,
            user.department,
            user.username,
        ].some((value) => String(value).toLowerCase().includes(query))

        const matchesStatus = !status || user.status === status
        return matchesSearch && matchesStatus
    })
}

export const setActiveAdminSession = (user) => {
    sessionStorage.setItem(
        ACTIVE_ADMIN_KEY,
        JSON.stringify({
            id: user.id,
            email: user.email,
            name: user.name,
            permissions: user.permissions,
        }),
    )
}

export const clearActiveAdminSession = () => {
    sessionStorage.removeItem(ACTIVE_ADMIN_KEY)
}

export const getActiveAdminSession = () => {
    try {
        const stored = sessionStorage.getItem(ACTIVE_ADMIN_KEY)
        return stored ? JSON.parse(stored) : null
    } catch {
        return null
    }
}

export const getFilteredAdminSidebarLinks = () => {
    // ASA-03: never treat Super Admin module checkboxes as authorization when API auth is on.
    // Backend `admin` role already has the full permission matrix.
    if (isApiAuthEnabled() || MODULE_PERMISSIONS_PREVIEW_ONLY) {
        return adminSidebarLinks
    }

    const session = getActiveAdminSession()
    if (!session?.permissions) return adminSidebarLinks

    return adminSidebarLinks.filter((link) => {
        const module = ADMIN_PERMISSION_MODULES.find((item) => item.sidebarId === link.id)
        if (!module || module.alwaysOn) return true
        return Boolean(session.permissions[module.key])
    })
}

/** List/detail label for the Permissions column — must not imply per-module server grants. */
export const getAdminAccessLabel = () => 'Full Admin role (server)'

export const DEFAULT_ADMIN_FORM = {
    name: '',
    email: '',
    mobileNumber: '',
    employeeId: '',
    department: 'Administration',
    username: '',
    password: '',
    status: 'Active',
    permissions: buildDefaultPermissions(false),
}

export const DEFAULT_ADMIN_USER_FORM = {
    ...DEFAULT_USER_FORM,
    role: ROLES.ADMIN,
    department: 'Administration',
    employeeId: '',
    permissions: buildDefaultPermissions(false),
}
