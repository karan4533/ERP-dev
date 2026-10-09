import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import {
    clearActiveAdminSession,
    findActiveAdminByEmail,
    getAdminUserByEmail,
    setActiveAdminSession,
} from '../Pages/SuperAdmin/UserCreation/adminUsersData'
import {
    clearActiveCreatedUserSession,
    findActiveCreatedUserByEmail,
    getCreatedUserByEmail,
    setActiveCreatedUserSession,
    CREATABLE_ROLES,
} from '../Common/RBAC/createdUsersData'
import { findActiveParentByEmail } from '../Common/ParentAccounts/parentAccountsData'
import { ROLES } from '../constants/roles'
import { deviceLabel, logActivity } from '../Common/demoDomain/activityLog'
import { clearAccessToken, isApiAuthEnabled } from '../services/apiClient'
import { apiChangePassword, apiLogin, apiLogout } from '../services/authApi'

export { ROLES }

const SUPER_ADMIN_EMAILS = ['superadmin@school.com', 'superadmin2@school.com']

/** Shared password for seeded demo accounts until the API issues real credentials. */
export const DEMO_PASSWORD = 'Qmis@2026'

export const FAKE_CREDENTIALS = {
    [ROLES.SUPER_ADMIN]: { email: 'superadmin@school.com' },
    [ROLES.ADMIN]: { email: 'admin@school.com' },
    [ROLES.STUDENT]: { email: 'student@school.com' },
    [ROLES.PARENT]: { email: 'parent@school.com' },
    [ROLES.LIBRARIAN]: { email: 'librarian@school.com' },
    [ROLES.PRM]: { email: 'prm@school.com' },
    [ROLES.GATEKEEPER]: { email: 'gatekeeper@school.com' },
    [ROLES.GATEKEEPER_MANAGER]: { email: 'gatekeepermanager@school.com' },
    [ROLES.DIRECTOR]: { email: 'director@school.com' },
    [ROLES.PRINCIPAL]: { email: 'principal@school.com' },
    [ROLES.CANTEEN_MANAGER]: { email: 'canteenmanager@school.com' },
    [ROLES.IT_SUPPORT_MANAGER]: { email: 'itsupportmanager@school.com' },
    [ROLES.STATIONERY_STORE_MANAGER]: { email: 'stationerystoremanager@school.com' },
    [ROLES.HOUSEKEEPING_MANAGER]: { email: 'housekeepingmanager@school.com' },
    [ROLES.TRANSPORT_MANAGER]: { email: 'transportmanager@school.com' },
    [ROLES.TEACHER]: { email: 'teacher@school.com' },
    [ROLES.COORDINATOR]: { email: 'coordinator@school.com' },
    [ROLES.JOINT_DIRECTOR]: { email: 'jointdirector@school.com' },
    [ROLES.JOINT_DIRECTOR_ASSISTANT]: { email: 'jointdirectorassistant@school.com' },
    [ROLES.JOINT_DIRECTOR_AUDIT]: { email: 'jointdirectoraudit@school.com' },
    [ROLES.PROCESS_AUDITOR]: { email: 'processauditor@school.com' },
    [ROLES.QUALITY_AUDITOR]: { email: 'qualityauditor@school.com' },
    [ROLES.HR]: { email: 'hr@school.com' },
    [ROLES.ACCOUNT_HEAD]: { email: 'accounthead@school.com' },
    [ROLES.DRIVER]: { email: 'driver@school.com' },
}

export const ROLE_HOME_PATHS = {
    [ROLES.SUPER_ADMIN]: '/super-admin/dashboard',
    [ROLES.ADMIN]: '/admin/front-office/admission-list',
    [ROLES.STUDENT]: '/student/class/online-class',
    [ROLES.PARENT]: '/parent/select-child',
    [ROLES.LIBRARIAN]: '/librarian/book-management/book-list',
    [ROLES.PRM]: '/front-office/admission-enquiry',
    [ROLES.GATEKEEPER]: '/gate-keeper/dashboard',
    [ROLES.GATEKEEPER_MANAGER]: '/gatekeeper-manager/assign-duty-list',
    [ROLES.DIRECTOR]: '/director/broadcast',
    [ROLES.PRINCIPAL]: '/principal/task-management',
    [ROLES.CANTEEN_MANAGER]: '/canteen-manager/dashboard',
    [ROLES.IT_SUPPORT_MANAGER]: '/it-support-manager/dashboard',
    [ROLES.STATIONERY_STORE_MANAGER]: '/stationery-store-manager/dashboard',
    [ROLES.HOUSEKEEPING_MANAGER]: '/housekeeping-manager/dashboard',
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
    [ROLES.DRIVER]: '/driver/vehicle-management/vehicle-details',
}

const STORAGE_KEY = 'schoolerp_auth'

const CREATABLE_LOGIN_ROLES = new Set(CREATABLE_ROLES)

const readStoredAuth = () => {
    try {
        const raw = sessionStorage.getItem(STORAGE_KEY)
        if (!raw) return { isAuthenticated: false, role: null, email: null, name: null, mustChangePassword: false }
        const parsed = JSON.parse(raw)
        if (parsed?.isAuthenticated && parsed?.role) {
            const role = parsed.role === 'vandriver' ? ROLES.DRIVER : parsed.role
            return {
                isAuthenticated: true,
                role,
                email: parsed.email || null,
                name: parsed.name || null,
                mustChangePassword: Boolean(parsed.mustChangePassword),
            }
        }
    } catch {
        // ignore invalid storage
    }
    return { isAuthenticated: false, role: null, email: null, name: null, mustChangePassword: false }
}

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
    const stored = readStoredAuth()
    const [isAuthenticated, setIsAuthenticated] = useState(stored.isAuthenticated)
    const [role, setRole] = useState(stored.role)
    const [email, setEmail] = useState(stored.email)
    const [name, setName] = useState(stored.name)
    const [mustChangePassword, setMustChangePassword] = useState(Boolean(stored.mustChangePassword))
    const [pendingRole, setPendingRole] = useState(null)

    useEffect(() => {
        if (stored.isAuthenticated && stored.email && CREATABLE_LOGIN_ROLES.has(stored.role)) {
            const existing = getCreatedUserByEmail(stored.email)
            if (existing && existing.status === 'Active') {
                setActiveCreatedUserSession(existing)
            }
        }
    }, [])

    const persistAuth = useCallback((nextRole, nextEmail = null, nextName = null, nextMustChange = false) => {
        sessionStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({
                isAuthenticated: true,
                role: nextRole,
                email: nextEmail,
                name: nextName,
                mustChangePassword: Boolean(nextMustChange),
            })
        )
    }, [])

    const establishSession = useCallback((expectedRole, normalizedEmail, sessionName, createdUser, createdAdmin, nextMustChange = false) => {
        setIsAuthenticated(true)
        setRole(expectedRole)
        setEmail(normalizedEmail)
        setName(sessionName)
        setMustChangePassword(Boolean(nextMustChange))
        setPendingRole(null)
        persistAuth(expectedRole, normalizedEmail, sessionName, nextMustChange)
        logActivity({
            actor: sessionName || normalizedEmail,
            role: expectedRole,
            action: 'LOGIN',
            module: 'Authentication',
            details: `${deviceLabel()} · ${navigator.userAgent.split(' ').slice(-2).join(' ')}`,
            recordId: crypto.randomUUID?.() || `SES-${Date.now()}`,
        })

        clearActiveCreatedUserSession()

        if (expectedRole === ROLES.ADMIN) {
            const createdAdminUser = createdAdmin || getAdminUserByEmail(normalizedEmail)
            if (createdAdminUser && !createdAdminUser.isSystem) {
                setActiveAdminSession(createdAdminUser)
            } else {
                clearActiveAdminSession()
            }
        } else {
            clearActiveAdminSession()
            if (createdUser) {
                setActiveCreatedUserSession(createdUser)
            }
        }

        return { success: true, role: expectedRole, mustChangePassword: Boolean(nextMustChange) }
    }, [persistAuth])

    const passwordMatches = (storedPassword, enteredPassword) => {
        const stored = String(storedPassword || '').trim()
        if (stored) return stored === enteredPassword
        return enteredPassword === DEMO_PASSWORD
    }

    const resolveAccount = (normalizedEmail) => {
        if (SUPER_ADMIN_EMAILS.includes(normalizedEmail)) {
            return { role: ROLES.SUPER_ADMIN, sessionName: null }
        }

        const seededRole = Object.entries(FAKE_CREDENTIALS).find(
            ([, creds]) => creds.email.toLowerCase() === normalizedEmail
        )?.[0]
        if (seededRole) {
            return { role: seededRole, sessionName: null }
        }

        const createdAdmin = findActiveAdminByEmail(normalizedEmail)
        if (createdAdmin) {
            return {
                role: ROLES.ADMIN,
                sessionName: createdAdmin.name || null,
                createdAdmin,
                storedPassword: createdAdmin.password,
            }
        }

        const createdUser = findActiveCreatedUserByEmail(normalizedEmail)
        if (createdUser) {
            return {
                role: createdUser.role,
                sessionName: createdUser.name || null,
                createdUser,
                storedPassword: createdUser.password,
            }
        }

        const registeredParent = findActiveParentByEmail(normalizedEmail)
        if (registeredParent) {
            return {
                role: ROLES.PARENT,
                sessionName: registeredParent.name || null,
                storedPassword: registeredParent.password,
            }
        }

        return null
    }

    const loginWithCredentials = useCallback(async (emailInput, password) => {
        const normalizedEmail = String(emailInput || '').trim().toLowerCase()
        const enteredPassword = String(password || '')

        if (!normalizedEmail || !enteredPassword) {
            return { success: false, message: 'Enter your email and password.' }
        }

        if (isApiAuthEnabled()) {
            try {
                const data = await apiLogin(normalizedEmail, enteredPassword)
                const apiRole = data?.user?.role
                const apiName = data?.user?.full_name || null
                if (!apiRole) {
                    clearAccessToken()
                    return { success: false, message: 'Login succeeded but role was missing.' }
                }
                return establishSession(
                    apiRole,
                    normalizedEmail,
                    apiName,
                    null,
                    null,
                    Boolean(data?.must_change_password),
                )
            } catch (error) {
                // Fall through to local demo accounts if API is down / wrong password for API-only users
                const account = resolveAccount(normalizedEmail)
                if (!account || !passwordMatches(account.storedPassword, enteredPassword)) {
                    return {
                        success: false,
                        message: error?.message || 'Invalid email or password.',
                    }
                }
                clearAccessToken()
                return establishSession(
                    account.role,
                    normalizedEmail,
                    account.sessionName,
                    account.createdUser,
                    account.createdAdmin,
                )
            }
        }

        const account = resolveAccount(normalizedEmail)
        if (!account || !passwordMatches(account.storedPassword, enteredPassword)) {
            return { success: false, message: 'Invalid email or password.' }
        }

        return establishSession(
            account.role,
            normalizedEmail,
            account.sessionName,
            account.createdUser,
            account.createdAdmin
        )
    }, [establishSession])

    const login = useCallback((emailInput, otp, expectedRole) => {
        const creds = FAKE_CREDENTIALS[expectedRole]
        if (!creds) {
            return { success: false, message: 'Please select a profile first.' }
        }

        const normalizedEmail = emailInput.trim().toLowerCase()
        const createdAdmin = expectedRole === ROLES.ADMIN ? findActiveAdminByEmail(normalizedEmail) : null
        const createdUser = CREATABLE_LOGIN_ROLES.has(expectedRole)
            ? findActiveCreatedUserByEmail(normalizedEmail, expectedRole)
            : null
        const registeredParent = expectedRole === ROLES.PARENT
            ? findActiveParentByEmail(normalizedEmail)
            : null

        if (expectedRole === ROLES.ADMIN) {
            const defaultEmail = creds.email.toLowerCase()
            if (normalizedEmail !== defaultEmail && !createdAdmin) {
                return {
                    success: false,
                    message: 'Use a registered administrator email for this profile.',
                }
            }
        } else if (CREATABLE_LOGIN_ROLES.has(expectedRole)) {
            const defaultEmail = creds.email.toLowerCase()
            if (normalizedEmail !== defaultEmail && !createdUser) {
                return {
                    success: false,
                    message: `Use ${creds.email} or a user created by Admin for this profile.`,
                }
            }
        } else if (expectedRole === ROLES.PARENT) {
            const defaultEmail = creds.email.toLowerCase()
            if (normalizedEmail !== defaultEmail && !registeredParent) {
                return {
                    success: false,
                    message: `Use ${creds.email} or a parent account created during admission enrollment.`,
                }
            }
        } else if (expectedRole === ROLES.SUPER_ADMIN) {
            if (!SUPER_ADMIN_EMAILS.includes(normalizedEmail)) {
                return {
                    success: false,
                    message: `Use ${SUPER_ADMIN_EMAILS.join(' or ')} for this profile.`,
                }
            }
        } else if (normalizedEmail !== creds.email) {
            return {
                success: false,
                message: `Use ${creds.email} for this profile.`,
            }
        }

        const normalizedOtp = otp.trim()
        if (!normalizedOtp) {
            return { success: false, message: 'OTP is required.' }
        }

        if (normalizedOtp.length !== 6) {
            return { success: false, message: 'Enter a valid 6-digit OTP.' }
        }

        const sessionName = createdUser?.name
            || createdAdmin?.name
            || registeredParent?.name
            || null

        setIsAuthenticated(true)
        setRole(expectedRole)
        setEmail(normalizedEmail)
        setName(sessionName)
        setPendingRole(null)
        persistAuth(expectedRole, normalizedEmail, sessionName)
        logActivity({
            actor: sessionName || normalizedEmail,
            role: expectedRole,
            action: 'LOGIN',
            module: 'Authentication',
            details: `${deviceLabel()} · ${navigator.userAgent.split(' ').slice(-2).join(' ')}`,
            recordId: crypto.randomUUID?.() || `SES-${Date.now()}`,
        })

        clearActiveCreatedUserSession()

        if (expectedRole === ROLES.ADMIN) {
            const createdAdminUser = getAdminUserByEmail(normalizedEmail)
            if (createdAdminUser && !createdAdminUser.isSystem) {
                setActiveAdminSession(createdAdminUser)
            } else {
                clearActiveAdminSession()
            }
        } else {
            clearActiveAdminSession()
            if (createdUser) {
                setActiveCreatedUserSession(createdUser)
            }
        }

        return { success: true }
    }, [persistAuth])

    const logout = useCallback(async () => {
        logActivity({ actor: email || 'Demo User', role, action: 'LOGOUT', module: 'Authentication' })
        if (isApiAuthEnabled()) {
            await apiLogout()
        } else {
            clearAccessToken()
        }
        sessionStorage.removeItem(STORAGE_KEY)
        clearActiveAdminSession()
        clearActiveCreatedUserSession()
        setIsAuthenticated(false)
        setRole(null)
        setEmail(null)
        setName(null)
        setMustChangePassword(false)
        setPendingRole(null)
    }, [email, role])

    const completePasswordChange = useCallback(async (currentPassword, newPassword) => {
        await apiChangePassword(currentPassword, newPassword)
        setMustChangePassword(false)
        persistAuth(role, email, name, false)
        return { success: true }
    }, [email, name, persistAuth, role])

    const value = useMemo(
        () => ({
            isAuthenticated,
            role,
            email,
            name,
            mustChangePassword,
            pendingRole,
            setPendingRole,
            login,
            loginWithCredentials,
            completePasswordChange,
            logout,
        }),
        [isAuthenticated, role, email, name, mustChangePassword, pendingRole, login, loginWithCredentials, completePasswordChange, logout]
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
