import noProfile from '../../assets/images/no-profile.png'
import { ROLES } from '../../constants/roles'
import { updateAssignmentStudentCounts } from './academicsCatalogData'
import {
    canUseAdminUsersApi,
    createAdminUserApi,
    getAdminUserApi,
    listAdminUsersApi,
    resetAdminUserPasswordApi,
    updateAdminUserApi,
} from '../../services/adminUsersApi'

const STORAGE_KEY = 'schoolerp-created-users'
const ACTIVE_USER_KEY = 'schoolerp_active_created_user'

/**
 * Roles Campus Admin may create / edit under RBAC → User Creation.
 * Keep in sync with backend ``admin_users.STAFF_ROLES``.
 * Privileged roles (Admin, Super Admin, HR, Account Head, Student, Parent, auditors, JD) are excluded.
 */
export const CREATABLE_ROLE_OPTIONS = [
    { role: ROLES.PRINCIPAL, label: 'Principal', idPrefix: 'PRC' },
    { role: ROLES.PRM, label: 'PRM', idPrefix: 'PRM' },
    { role: ROLES.TEACHER, label: 'Teacher', idPrefix: 'TEA' },
    { role: ROLES.COORDINATOR, label: 'Coordinator', idPrefix: 'CRD' },
    { role: ROLES.LIBRARIAN, label: 'Librarian', idPrefix: 'LIB' },
    { role: ROLES.GATEKEEPER_MANAGER, label: 'Gate Keeper Manager', idPrefix: 'GKM' },
    { role: ROLES.GATEKEEPER, label: 'Gate Keeper', idPrefix: 'GKP' },
    { role: ROLES.TRANSPORT_MANAGER, label: 'Transport Manager', idPrefix: 'TRM' },
    { role: ROLES.DRIVER, label: 'Driver', idPrefix: 'DRV' },
    { role: ROLES.CANTEEN_MANAGER, label: 'Canteen Manager', idPrefix: 'CTN' },
    { role: ROLES.IT_SUPPORT_MANAGER, label: 'IT Support Manager', idPrefix: 'ITM' },
    { role: ROLES.STATIONERY_STORE_MANAGER, label: 'Stationery Store Manager', idPrefix: 'SSM' },
    { role: ROLES.HOUSEKEEPING_MANAGER, label: 'Housekeeping Manager', idPrefix: 'HKM' },
]

export const CREATABLE_ROLES = CREATABLE_ROLE_OPTIONS.map((option) => option.role)

export const CREATABLE_ROLE_LABELS = Object.fromEntries(
    CREATABLE_ROLE_OPTIONS.map(({ role, label }) => [role, label]),
)

const ROLE_ID_PREFIX = Object.fromEntries(
    CREATABLE_ROLE_OPTIONS.map(({ role, idPrefix }) => [role, idPrefix]),
)

export const USER_STATUSES = ['Active', 'Inactive']

export const DEFAULT_USER_FORM = {
    role: ROLES.TEACHER,
    status: 'Active',
    firstName: '',
    middleName: '',
    lastName: '',
    email: '',
    gender: '',
    profileImage: '',
    street: '',
    city: '',
    state: '',
    country: '',
    pincode: '',
    mobileNumber: '',
    alternativeMobileNumber: '',
    religion: '',
    caste: '',
    dateOfBirth: null,
    bloodGroup: '',
    height: '',
    weight: '',
    medicalHistory: '',
    fatherName: '',
    motherName: '',
    familyContactNumber: '',
    qualification: '',
    yearsOfExperience: '',
    previousSchool: '',
    joiningDate: null,
    username: '',
    password: '',
    idProofFile: '',
    qualificationCertificateFile: '',
    experienceCertificateFile: '',
    className: '',
    section: '',
    rollNumber: '',
    admissionNumber: '',
}

export const buildUserDisplayName = ({ firstName, middleName, lastName, name }) => {
    if (name?.trim()) return name.trim()
    return [firstName, middleName, lastName]
        .map((part) => String(part || '').trim())
        .filter(Boolean)
        .join(' ')
}

export const formatUserDateOfBirth = (date) => {
    if (!date) return ''
    const value = date instanceof Date ? date : new Date(date)
    if (Number.isNaN(value.getTime())) return ''
    const day = String(value.getDate()).padStart(2, '0')
    const month = String(value.getMonth() + 1).padStart(2, '0')
    const year = value.getFullYear()
    return `${day}-${month}-${year}`
}

/** Parse DD-MM-YYYY / ISO / Date into a Date for form date pickers. */
export const parseUserFormDate = (value) => {
    if (!value) return null
    if (value instanceof Date && !Number.isNaN(value.getTime())) return value
    const text = String(value).trim()
    const dmy = text.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/)
    if (dmy) {
        const parsed = new Date(Number(dmy[3]), Number(dmy[2]) - 1, Number(dmy[1]))
        return Number.isNaN(parsed.getTime()) ? null : parsed
    }
    const parsed = new Date(text)
    return Number.isNaN(parsed.getTime()) ? null : parsed
}

export const getCreatedUserByStaffCode = (staffCode) =>
    getAllCreatedUsers().find((user) => user.id === staffCode || user.userId === staffCode) || null

/** Map a stored / API user into the create/edit form shape. */
export const userToForm = (user) => ({
    ...DEFAULT_USER_FORM,
    ...user,
    role: user.role || DEFAULT_USER_FORM.role,
    status: user.status === 'Inactive' ? 'Inactive' : 'Active',
    firstName: user.firstName || '',
    middleName: user.middleName || '',
    lastName: user.lastName || '',
    email: user.email || '',
    gender: user.gender || '',
    mobileNumber: user.mobileNumber || '',
    password: '',
    dateOfBirth: parseUserFormDate(user.dateOfBirth),
    joiningDate: parseUserFormDate(user.joiningDate),
})

export const validateUserCreationForm = (payload) => {
    const firstName = payload.firstName?.trim()
    const lastName = payload.lastName?.trim()
    const email = payload.email?.trim()

    if (!firstName) {
        return { success: false, message: 'First name is required.' }
    }
    if (!lastName) {
        return { success: false, message: 'Last name is required.' }
    }
    if (!email) {
        return { success: false, message: 'Email is required.' }
    }
    if (!payload.gender) {
        return { success: false, message: 'Gender is required.' }
    }

    return { success: true }
}

const loadUsers = () => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY)
        if (stored) {
            const parsed = JSON.parse(stored)
            return Array.isArray(parsed) ? parsed : []
        }
    } catch {
        /* ignore */
    }
    return []
}

const saveUsers = (records) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records))
}

const rolePrefix = (role) => ROLE_ID_PREFIX[role] || 'USR'

export const generateUserId = (role) => {
    const prefix = rolePrefix(role)
    const records = loadUsers().filter((user) => user.role === role)
    const max = records.reduce((acc, user) => {
        const numeric = Number(String(user.id).replace(/\D/g, ''))
        return Number.isNaN(numeric) ? acc : Math.max(acc, numeric)
    }, 0)
    return `${prefix}-${String(max + 1).padStart(4, '0')}`
}

export const getAllCreatedUsers = () => loadUsers()

export const getCreatedUsersByRole = (role) =>
    loadUsers().filter((user) => user.role === role)

export const getCreatedUserById = (id) =>
    loadUsers().find((user) => user.id === id) ?? null

export const getCreatedUserByEmail = (email) => {
    const normalized = email.trim().toLowerCase()
    return loadUsers().find((user) => user.email.toLowerCase() === normalized) ?? null
}

export const findActiveCreatedUserByEmail = (email, role) => {
    const user = getCreatedUserByEmail(email)
    if (!user || user.status !== 'Active') return null
    if (role && user.role !== role) return null
    return user
}

export const getStudentsList = () =>
    loadUsers()
        .filter((user) => user.role === ROLES.STUDENT && user.status === 'Active')
        .map((user) => ({
            id: user.id,
            profile: user.profileImage || noProfile,
            admissionNumber: user.admissionNumber || user.id,
            rollNumber: user.rollNumber || '',
            name: buildUserDisplayName(user),
            gender: user.gender || '',
            email: user.email,
            mobileNumber: user.mobileNumber || '',
            dateOfBirth: user.dateOfBirth || '',
            country: user.country || 'India',
            state: user.state || '',
            city: user.city || '',
            className: user.className || '',
            section: user.section || '',
            classSection: user.className && user.section
                ? `${user.className}-${user.section}`
                : '',
        }))

export const getStudentCountForClassSection = (className, section) =>
    getStudentsList().filter(
        (student) => student.className === className && student.section === section,
    ).length

export const createUser = (payload) => {
    const records = loadUsers()
    const email = payload.email.trim().toLowerCase()
    const role = payload.role
    const validation = validateUserCreationForm(payload)

    if (!validation.success) {
        return validation
    }

    const name = buildUserDisplayName(payload)

    if (!CREATABLE_ROLES.includes(role)) {
        return { success: false, message: 'Selected role cannot be created here.' }
    }

    if (records.some((user) => user.email.toLowerCase() === email)) {
        return { success: false, message: 'A user with this email already exists.' }
    }

    const id = generateUserId(role)
    const user = {
        id,
        name,
        firstName: payload.firstName.trim(),
        middleName: payload.middleName?.trim() || '',
        lastName: payload.lastName.trim(),
        email,
        role,
        roleLabel: CREATABLE_ROLE_LABELS[role],
        status: payload.status === 'Inactive' ? 'Inactive' : 'Active',
        profileImage: payload.profileImage || '',
        street: payload.street?.trim() || '',
        city: payload.city?.trim() || '',
        state: payload.state?.trim() || '',
        country: payload.country?.trim() || '',
        pincode: payload.pincode?.trim() || '',
        mobileNumber: payload.mobileNumber?.trim() || '',
        alternativeMobileNumber: payload.alternativeMobileNumber?.trim() || '',
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
        username: payload.username?.trim() || email.split('@')[0],
        password: payload.password?.trim() || '',
        idProofFile: payload.idProofFile?.trim() || '',
        qualificationCertificateFile: payload.qualificationCertificateFile?.trim() || '',
        experienceCertificateFile: payload.experienceCertificateFile?.trim() || '',
        className: payload.className || '',
        section: payload.section || '',
        rollNumber: payload.rollNumber?.trim() || (role === ROLES.STUDENT
            ? `${payload.className}-${payload.section}-${String(getStudentCountForClassSection(payload.className, payload.section) + 1).padStart(2, '0')}`
            : ''),
        admissionNumber: payload.admissionNumber?.trim() || id,
        gender: payload.gender || '',
        createdAt: new Date().toISOString(),
    }

    saveUsers([...records, user])
    updateAssignmentStudentCounts(getStudentCountForClassSection)

    return { success: true, user }
}

export const updateUserStatus = (id, status) => {
    const records = loadUsers()
    const index = records.findIndex((user) => user.id === id)
    if (index < 0) return { success: false, message: 'User not found.' }

    records[index] = { ...records[index], status }
    saveUsers(records)
    updateAssignmentStudentCounts(getStudentCountForClassSection)
    return { success: true, user: records[index] }
}

/** Offline / local-store edit of a created staff user (full profile). */
export const updateCreatedUser = (staffCode, payload) => {
    const validation = validateUserCreationForm(payload)
    if (!validation.success) return validation
    if (!CREATABLE_ROLES.includes(payload.role)) {
        return { success: false, message: 'Selected role cannot be assigned here.' }
    }

    const records = loadUsers()
    const index = records.findIndex((user) => user.id === staffCode)
    if (index < 0) return { success: false, message: 'User not found.' }

    const email = payload.email.trim().toLowerCase()
    if (records.some((user, idx) => idx !== index && user.email.toLowerCase() === email)) {
        return { success: false, message: 'A user with this email already exists.' }
    }

    const previous = records[index]
    const next = {
        ...previous,
        ...payload,
        id: previous.id,
        userId: previous.userId,
        email,
        role: payload.role,
        roleLabel: CREATABLE_ROLE_LABELS[payload.role],
        name: buildUserDisplayName(payload),
        firstName: payload.firstName.trim(),
        middleName: payload.middleName?.trim() || '',
        lastName: payload.lastName.trim(),
        status: payload.status === 'Inactive' ? 'Inactive' : 'Active',
        dateOfBirth: formatUserDateOfBirth(payload.dateOfBirth),
        joiningDate: formatUserDateOfBirth(payload.joiningDate),
        password: previous.password || '',
        source: previous.source || 'local',
    }
    records[index] = next
    saveUsers(records)
    updateAssignmentStudentCounts(getStudentCountForClassSection)
    return { success: true, user: next }
}

export const deleteCreatedUser = (id) => {
    const records = loadUsers().filter((user) => user.id !== id)
    saveUsers(records)
    updateAssignmentStudentCounts(getStudentCountForClassSection)
    return { success: true }
}

export const setActiveCreatedUserSession = (user) => {
    sessionStorage.setItem(
        ACTIVE_USER_KEY,
        JSON.stringify({
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
        }),
    )
}

export const clearActiveCreatedUserSession = () => {
    sessionStorage.removeItem(ACTIVE_USER_KEY)
}

export const getActiveCreatedUserSession = () => {
    try {
        const raw = sessionStorage.getItem(ACTIVE_USER_KEY)
        if (!raw) return null
        return JSON.parse(raw)
    } catch {
        return null
    }
}

/* ------------------------------------------------------------------------------------------
 * API mode (Admin > RBAC > User Creation backed by /api/v1/admin/users).
 *
 * The server owns logins, roles, status and passwords. The local store is only a read-through
 * mirror of the non-sensitive profile fields, kept so the screens that still read created users
 * synchronously (class teacher picker, PRM assignee picker, Employee Database) keep working.
 * A password is never written to it.
 * ---------------------------------------------------------------------------------------- */

const API_DETAIL_FIELDS = [
    'alternativeMobileNumber', 'street', 'city', 'state', 'country', 'pincode', 'religion', 'caste',
    'dateOfBirth', 'bloodGroup', 'height', 'weight', 'medicalHistory', 'fatherName', 'motherName',
    'familyContactNumber', 'qualification', 'yearsOfExperience', 'previousSchool', 'joiningDate',
    'username', 'className', 'section',
]

/** True when user creation should go through the server. */
export const isAdminUsersApiActive = () => canUseAdminUsersApi()

/** Map one /admin/users record to the local created-user shape. Never carries a password. */
export const fromApiUser = (apiUser) => ({
    ...Object.fromEntries(API_DETAIL_FIELDS.map((key) => [key, apiUser.details?.[key] || ''])),
    id: apiUser.staffCode,
    userId: apiUser.id,
    name: apiUser.name,
    firstName: apiUser.firstName,
    middleName: apiUser.middleName || '',
    lastName: apiUser.lastName,
    email: apiUser.email,
    role: apiUser.role,
    roleLabel: apiUser.roleLabel,
    status: apiUser.status,
    gender: apiUser.gender || '',
    mobileNumber: apiUser.mobileNumber || '',
    username: apiUser.details?.username || apiUser.email.split('@')[0],
    password: '',
    mustChangePassword: Boolean(apiUser.mustChangePassword),
    profileImage: '',
    admissionNumber: apiUser.staffCode,
    createdAt: apiUser.createdAt || '',
    source: 'api',
})

/**
 * Replace the mirrored staff records with the server's list. Student records (created through
 * Admission enrollment) are left alone. Returns the mapped users.
 */
export const syncCreatedUsersFromApi = async () => {
    if (!canUseAdminUsersApi()) return null
    const apiUsers = await listAdminUsersApi()
    const mapped = apiUsers.map(fromApiUser)
    const keep = loadUsers().filter((user) => user.role === ROLES.STUDENT)
    saveUsers([...keep, ...mapped])
    return mapped
}

const apiErrorResult = (error) => ({
    success: false,
    message: error?.message || 'The request could not be completed.',
    status: error?.status,
})

export const createUserViaApi = async (payload) => {
    const validation = validateUserCreationForm(payload)
    if (!validation.success) return validation
    if (!CREATABLE_ROLES.includes(payload.role)) {
        return { success: false, message: 'Selected role cannot be created here.' }
    }

    const details = Object.fromEntries(
        API_DETAIL_FIELDS.map((key) => {
            const raw = payload[key]
            const value = key === 'dateOfBirth' || key === 'joiningDate'
                ? formatUserDateOfBirth(raw)
                : String(raw ?? '').trim()
            return [key, value]
        }),
    )
    const password = payload.password?.trim()
    try {
        const created = await createAdminUserApi({
            role: payload.role,
            firstName: payload.firstName.trim(),
            middleName: payload.middleName?.trim() || '',
            lastName: payload.lastName.trim(),
            email: payload.email.trim(),
            gender: payload.gender,
            mobileNumber: payload.mobileNumber?.trim() || '',
            status: payload.status === 'Inactive' ? 'Inactive' : 'Active',
            ...(password ? { password } : {}),
            ...details,
        })
        // Best-effort refresh of the mirror; the create itself already succeeded.
        await syncCreatedUsersFromApi().catch(() => null)
        return {
            success: true,
            user: fromApiUser(created),
            temporaryPassword: created.temporaryPassword || null,
        }
    } catch (error) {
        return apiErrorResult(error)
    }
}

export const updateUserStatusViaApi = async (user, status) => {
    try {
        await updateAdminUserApi(user.userId, { status })
        await syncCreatedUsersFromApi().catch(() => null)
        return { success: true }
    } catch (error) {
        return apiErrorResult(error)
    }
}

export const fetchCreatedUserViaApi = async (userIdOrStaffCode) => {
    if (!canUseAdminUsersApi()) {
        return getCreatedUserByStaffCode(userIdOrStaffCode)
    }
    // Prefer UUID when we already have the mirror row; otherwise list-sync then match staff code.
    const mirrored = getCreatedUserByStaffCode(userIdOrStaffCode)
    if (mirrored?.userId) {
        const apiUser = await getAdminUserApi(mirrored.userId)
        const mapped = fromApiUser(apiUser)
        const keep = loadUsers().filter((user) => user.id !== mapped.id && user.role === ROLES.STUDENT)
        const others = loadUsers().filter((user) => user.id !== mapped.id && user.role !== ROLES.STUDENT)
        saveUsers([...keep, ...others, mapped])
        return mapped
    }
    await syncCreatedUsersFromApi()
    return getCreatedUserByStaffCode(userIdOrStaffCode)
}

export const updateUserViaApi = async (user, payload) => {
    const validation = validateUserCreationForm(payload)
    if (!validation.success) return validation
    if (!CREATABLE_ROLES.includes(payload.role)) {
        return { success: false, message: 'Selected role cannot be assigned here.' }
    }
    if (!user?.userId) {
        return { success: false, message: 'User is missing a server id. Refresh the list and try again.' }
    }

    const details = Object.fromEntries(
        API_DETAIL_FIELDS.map((key) => {
            const raw = payload[key]
            const value = key === 'dateOfBirth' || key === 'joiningDate'
                ? formatUserDateOfBirth(raw)
                : String(raw ?? '').trim()
            return [key, value]
        }),
    )
    try {
        const updated = await updateAdminUserApi(user.userId, {
            role: payload.role,
            firstName: payload.firstName.trim(),
            middleName: payload.middleName?.trim() || '',
            lastName: payload.lastName.trim(),
            email: payload.email.trim(),
            gender: payload.gender,
            mobileNumber: payload.mobileNumber?.trim() || '',
            status: payload.status === 'Inactive' ? 'Inactive' : 'Active',
            ...details,
        })
        await syncCreatedUsersFromApi().catch(() => null)
        return { success: true, user: fromApiUser(updated) }
    } catch (error) {
        return apiErrorResult(error)
    }
}

export const resetUserPasswordViaApi = async (user) => {
    try {
        const result = await resetAdminUserPasswordApi(user.userId)
        return { success: true, temporaryPassword: result.temporaryPassword }
    } catch (error) {
        return apiErrorResult(error)
    }
}

