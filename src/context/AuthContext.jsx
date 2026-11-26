import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import {
    clearActiveAdminSession,
    getAdminUserByEmail,
    setActiveAdminSession,
} from '../Pages/SuperAdmin/UserCreation/adminUsersData'
import {
    clearActiveCreatedUserSession,
    getCreatedUserByEmail,
    setActiveCreatedUserSession,
    CREATABLE_ROLES,
} from '../Common/RBAC/createdUsersData'
import { ROLES } from '../constants/roles'
import { deviceLabel, logActivity } from '../Common/demoDomain/activityLog'
import { findUserByIdentifier, ENTERPRISE_USER_DIRECTORY } from '../Pages/Authentication/enterpriseUserDirectory'

export const ROLE_HOME_PATHS = Object.freeze({
    [ROLES.SUPER_ADMIN]: '/super-admin/dashboard',
    [ROLES.ADMIN]: '/admin/dashboard',
    [ROLES.STUDENT]: '/student/dashboard',
    [ROLES.PARENT]: '/parent/select-child',
    [ROLES.LIBRARIAN]: '/librarian/dashboard',
    [ROLES.PRM]: '/front-office/dashboard',
    [ROLES.GATEKEEPER]: '/gate-keeper/dashboard',
    [ROLES.GATEKEEPER_MANAGER]: '/gatekeeper-manager/assign-duty-list',
    [ROLES.DIRECTOR]: '/director/dashboard',
    [ROLES.PRINCIPAL]: '/principal/dashboard',
    [ROLES.CANTEEN_MANAGER]: '/canteen-manager/dashboard',
    [ROLES.IT_SUPPORT_MANAGER]: '/it-support-manager/dashboard',
    [ROLES.STATIONERY_STORE_MANAGER]: '/stationery-store-manager/dashboard',
    [ROLES.HOUSEKEEPING_MANAGER]: '/housekeeping-manager/dashboard',
    [ROLES.MAINTENANCE_MANAGER]: '/maintenance-manager/dashboard',
    [ROLES.TRANSPORT_MANAGER]: '/transport-manager/dashboard',
    [ROLES.TEACHER]: '/teacher/dashboard',
    [ROLES.COORDINATOR]: '/coordinator/dashboard',
    [ROLES.JOINT_DIRECTOR]: '/joint-director/dashboard',
    [ROLES.JOINT_DIRECTOR_ASSISTANT]: '/joint-director-assistant/dashboard',
    [ROLES.JOINT_DIRECTOR_AUDIT]: '/joint-director-audit/dashboard',
    [ROLES.PROCESS_AUDITOR]: '/process-auditor/dashboard',
    [ROLES.QUALITY_AUDITOR]: '/quality-auditor/dashboard',
    [ROLES.HR]: '/hr/dashboard',
    [ROLES.ACCOUNT_HEAD]: '/account-head/dashboard',
    [ROLES.DRIVER]: '/driver/dashboard',
    [ROLES.PRO]: '/pro/dashboard',
    [ROLES.FILE_ROOM]: '/file-room/dashboard',
    [ROLES.CCTV]: '/cctv/dashboard',
})

export const ROLE_PREFIX = Object.freeze({
    [ROLES.SUPER_ADMIN]: '/super-admin',
    [ROLES.ADMIN]: '/admin',
    [ROLES.STUDENT]: '/student',
    [ROLES.PARENT]: '/parent',
    [ROLES.LIBRARIAN]: '/librarian',
    [ROLES.PRM]: '/front-office',
    [ROLES.GATEKEEPER]: '/gate-keeper',
    [ROLES.GATEKEEPER_MANAGER]: '/gatekeeper-manager',
    [ROLES.DIRECTOR]: '/director',
    [ROLES.PRINCIPAL]: '/principal',
    [ROLES.CANTEEN_MANAGER]: '/canteen-manager',
    [ROLES.IT_SUPPORT_MANAGER]: '/it-support-manager',
    [ROLES.STATIONERY_STORE_MANAGER]: '/stationery-store-manager',
    [ROLES.HOUSEKEEPING_MANAGER]: '/housekeeping-manager',
    [ROLES.MAINTENANCE_MANAGER]: '/maintenance-manager',
    [ROLES.TRANSPORT_MANAGER]: '/transport-manager',
    [ROLES.TEACHER]: '/teacher',
    [ROLES.COORDINATOR]: '/coordinator',
    [ROLES.JOINT_DIRECTOR]: '/joint-director',
    [ROLES.JOINT_DIRECTOR_ASSISTANT]: '/joint-director-assistant',
    [ROLES.JOINT_DIRECTOR_AUDIT]: '/joint-director-audit',
    [ROLES.PROCESS_AUDITOR]: '/process-auditor',
    [ROLES.QUALITY_AUDITOR]: '/quality-auditor',
    [ROLES.HR]: '/hr',
    [ROLES.ACCOUNT_HEAD]: '/account-head',
    [ROLES.DRIVER]: '/driver',
    [ROLES.PRO]: '/pro',
    [ROLES.FILE_ROOM]: '/file-room',
    [ROLES.CCTV]: '/cctv',
})

export { ROLES }

export const FAKE_CREDENTIALS = Object.fromEntries(
    ENTERPRISE_USER_DIRECTORY.map((user) => [user.role, { email: user.email, id: user.id }])
)

const STORAGE_KEY = 'schoolerp_auth'
const PERSISTENT_STORAGE_KEY = 'schoolerp_auth_persistent'

const CREATABLE_LOGIN_ROLES = new Set(CREATABLE_ROLES)

const readStoredAuth = () => {
    try {
        // Check session storage first; fallback to persistent local storage if "Remember Me" was enabled
        const raw = sessionStorage.getItem(STORAGE_KEY) || localStorage.getItem(PERSISTENT_STORAGE_KEY)
        if (!raw) {
            return {
                isAuthenticated: false,
                role: null,
                email: null,
                name: null,
                employeeId: null,
                department: null,
                designation: null,
                user: null,
            }
        }
        const parsed = JSON.parse(raw)
        if (parsed?.isAuthenticated && parsed?.role) {
            const role = parsed.role === 'vandriver' ? ROLES.DRIVER : parsed.role
            return {
                isAuthenticated: true,
                role,
                email: parsed.email || null,
                name: parsed.name || null,
                employeeId: parsed.employeeId || null,
                department: parsed.department || null,
                designation: parsed.designation || null,
                user: parsed.user || null,
            }
        }
    } catch {
        // ignore invalid storage
    }
    return {
        isAuthenticated: false,
        role: null,
        email: null,
        name: null,
        employeeId: null,
        department: null,
        designation: null,
        user: null,
    }
}

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
    const [stored] = useState(readStoredAuth)
    const [isAuthenticated, setIsAuthenticated] = useState(stored.isAuthenticated)
    const [role, setRole] = useState(stored.role)
    const [email, setEmail] = useState(stored.email)
    const [name, setName] = useState(stored.name)
    const [employeeId, setEmployeeId] = useState(stored.employeeId)
    const [department, setDepartment] = useState(stored.department)
    const [designation, setDesignation] = useState(stored.designation)
    const [user, setUser] = useState(stored.user)
    const [pendingRole, setPendingRole] = useState(null)
    const [isSessionReady, setIsSessionReady] = useState(false)

    useEffect(() => {
        if (stored.isAuthenticated && stored.email && CREATABLE_LOGIN_ROLES.has(stored.role)) {
            const existing = getCreatedUserByEmail(stored.email)
            if (existing && existing.status === 'Active') {
                setActiveCreatedUserSession(existing)
            }
        }
        setIsSessionReady(true)
    }, [stored])

    const persistAuth = useCallback((sessionPayload, rememberMe = false) => {
        const serialized = JSON.stringify(sessionPayload)
        sessionStorage.setItem(STORAGE_KEY, serialized)
        if (rememberMe) {
            localStorage.setItem(PERSISTENT_STORAGE_KEY, serialized)
        } else {
            localStorage.removeItem(PERSISTENT_STORAGE_KEY)
        }
    }, [])

    /**
     * Enterprise Centralized Authentication
     * Automatically identifies user identity, assigned role, permissions, department, and hierarchy.
     */
    const login = useCallback((identifier, password, rememberMe = false) => {
        if (!identifier || !String(identifier).trim()) {
            return {
                success: false,
                message: 'Please enter your Email Address or Employee ID.',
            }
        }

        if (!password || !String(password).trim()) {
            return {
                success: false,
                message: 'Please enter your password.',
            }
        }

        if (String(password).trim().length < 4) {
            return {
                success: false,
                message: 'Password must be at least 4 characters long.',
            }
        }

        // Automatic Identity & Role Resolution
        const resolvedUser = findUserByIdentifier(identifier)
        if (!resolvedUser) {
            return {
                success: false,
                message: 'Authentication failed. No active account matches this Email or Employee ID.',
            }
        }

        if (resolvedUser.status && resolvedUser.status !== 'Active') {
            return {
                success: false,
                message: 'This account is currently suspended or inactive. Please contact the IT Helpdesk.',
            }
        }

        const authenticatedRole = resolvedUser.role
        const normalizedEmail = resolvedUser.email.toLowerCase()
        const resolvedName = resolvedUser.name
        const resolvedEmpId = resolvedUser.employeeId || resolvedUser.id
        const resolvedDept = resolvedUser.department
        const resolvedDesig = resolvedUser.designation

        const sessionPayload = {
            isAuthenticated: true,
            role: authenticatedRole,
            email: normalizedEmail,
            name: resolvedName,
            employeeId: resolvedEmpId,
            department: resolvedDept,
            designation: resolvedDesig,
            user: resolvedUser,
        }

        setIsAuthenticated(true)
        setRole(authenticatedRole)
        setEmail(normalizedEmail)
        setName(resolvedName)
        setEmployeeId(resolvedEmpId)
        setDepartment(resolvedDept)
        setDesignation(resolvedDesig)
        setUser(resolvedUser)
        setPendingRole(null)

        persistAuth(sessionPayload, rememberMe)

        logActivity({
            actor: resolvedName || normalizedEmail,
            role: authenticatedRole,
            action: 'LOGIN',
            module: 'Authentication',
            details: `${deviceLabel()} · Central Enterprise Authentication`,
            recordId: crypto.randomUUID?.() || `SES-${Date.now()}`,
        })

        clearActiveCreatedUserSession()

        if (authenticatedRole === ROLES.ADMIN) {
            const createdAdminUser = getAdminUserByEmail(normalizedEmail)
            if (createdAdminUser && !createdAdminUser.isSystem) {
                setActiveAdminSession(createdAdminUser)
            } else {
                clearActiveAdminSession()
            }
        } else {
            clearActiveAdminSession()
            const createdUser = getCreatedUserByEmail(normalizedEmail)
            if (createdUser) {
                setActiveCreatedUserSession(createdUser)
            }
        }

        return {
            success: true,
            user: resolvedUser,
            role: authenticatedRole,
            homePath: ROLE_HOME_PATHS[authenticatedRole] ?? '/dashboard',
        }
    }, [persistAuth])

    const logout = useCallback(() => {
        logActivity({
            actor: email || name || 'Enterprise User',
            role,
            action: 'LOGOUT',
            module: 'Authentication',
        })
        sessionStorage.removeItem(STORAGE_KEY)
        localStorage.removeItem(PERSISTENT_STORAGE_KEY)
        clearActiveAdminSession()
        clearActiveCreatedUserSession()
        setIsAuthenticated(false)
        setRole(null)
        setEmail(null)
        setName(null)
        setEmployeeId(null)
        setDepartment(null)
        setDesignation(null)
        setUser(null)
        setPendingRole(null)
    }, [email, name, role])

    const value = useMemo(
        () => ({
            isAuthenticated,
            isSessionReady,
            role,
            email,
            name,
            employeeId,
            department,
            designation,
            user,
            pendingRole,
            setPendingRole,
            login,
            logout,
        }),
        [
            isAuthenticated,
            isSessionReady,
            role,
            email,
            name,
            employeeId,
            department,
            designation,
            user,
            pendingRole,
            login,
            logout,
        ]
    )

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
    const context = useContext(AuthContext)
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider')
    }
    return context
}
