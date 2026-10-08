import { adminSidebarLinks } from '../../../Common/CommonSidebar/Components/sidebarLinks'
import { ROLES } from '../../../constants/roles'
import {
    buildUserDisplayName,
    DEFAULT_USER_FORM,
    formatUserDateOfBirth,
    validateUserCreationForm,
} from '../../../Common/RBAC/createdUsersData'

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
    { key: 'escalationManagement', label: 'Escalation Management', sidebarId: 15 },
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

    return { success: true, user: records[index] }
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
    const session = getActiveAdminSession()
    if (!session?.permissions) return adminSidebarLinks

    return adminSidebarLinks.filter((link) => {
        const module = ADMIN_PERMISSION_MODULES.find((item) => item.sidebarId === link.id)
        if (!module || module.alwaysOn) return true
        return Boolean(session.permissions[module.key])
    })
}

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
