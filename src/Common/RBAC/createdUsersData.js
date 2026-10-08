import noProfile from '../../assets/images/no-profile.png'
import { ROLES } from '../../constants/roles'
import { updateAssignmentStudentCounts } from './academicsCatalogData'

const STORAGE_KEY = 'schoolerp-created-users'
const ACTIVE_USER_KEY = 'schoolerp_active_created_user'

/** Extend this list to expose more roles in Admin → User Creation. */
export const CREATABLE_ROLE_OPTIONS = [
    { role: ROLES.PRINCIPAL, label: 'Principal', idPrefix: 'PRC' },
    { role: ROLES.PRM, label: 'PRM', idPrefix: 'PRM' },
    { role: ROLES.TEACHER, label: 'Teacher', idPrefix: 'TEA' },
    { role: ROLES.COORDINATOR, label: 'Coordinator', idPrefix: 'CRD' },
    { role: ROLES.LIBRARIAN, label: 'Librarian', idPrefix: 'LIB' },
    { role: ROLES.GATEKEEPER_MANAGER, label: 'Gate Keeper Manager', idPrefix: 'GKM' },
    { role: ROLES.GATEKEEPER, label: 'Gate Keeper', idPrefix: 'GKP' },
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
