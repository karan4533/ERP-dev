import { ROLES } from '../../constants/roles'

const STORAGE_KEY = 'schoolerp-parent-accounts'
const DEFAULT_SEED_PASSWORD = 'Parent@123'

const SEED_PARENT_ACCOUNTS = [
    {
        id: 'PAR-001',
        email: 'parent@school.com',
        name: 'Raj Kumar',
        phone: '+91 98765 11111',
        studentIds: ['STU-PAR-001', 'STU-PAR-002', 'STU-PAR-003'],
    },
    {
        id: 'PAR-002',
        email: 'parent-single@school.com',
        name: 'Meera Sharma',
        phone: '+91 98765 22222',
        studentIds: ['STU-2024-1042'],
    },
]

const normalizeEmail = (email) => String(email || '').trim().toLowerCase()

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

const loadParents = () => {
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

const saveParents = (records) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records))
}

const seedParentAccounts = () => {
    const now = new Date().toISOString()
    const records = SEED_PARENT_ACCOUNTS.map((parent) => ({
        id: parent.id,
        email: normalizeEmail(parent.email),
        password: DEFAULT_SEED_PASSWORD,
        name: parent.name,
        phone: parent.phone,
        studentIds: [...parent.studentIds],
        status: 'Active',
        role: ROLES.PARENT,
        source: 'seed',
        createdAt: now,
        updatedAt: now,
    }))
    saveParents(records)
    return records
}

const ensureParentStoreInitialized = () => {
    const records = loadParents()
    if (records.length > 0) return records
    return seedParentAccounts()
}

export const resolveParentAccountEmail = (admission) =>
    normalizeEmail(admission?.parentAccountEmail || admission?.parentEmail)

export const buildParentDisplayName = (admission) => {
    const fatherName = String(admission?.fatherName || '').trim()
    const motherName = String(admission?.motherName || '').trim()
    return fatherName || motherName || 'Parent'
}

export const getAllParentAccounts = () => ensureParentStoreInitialized()

export const getParentByEmail = (email) => {
    const normalized = normalizeEmail(email)
    if (!normalized) return null
    return ensureParentStoreInitialized().find((parent) => parent.email === normalized) ?? null
}

export const getParentById = (parentId) =>
    ensureParentStoreInitialized().find((parent) => parent.id === parentId) ?? null

export const findActiveParentByEmail = (email) => {
    const parent = getParentByEmail(email)
    if (!parent || parent.status !== 'Active') return null
    return parent
}

export const generateParentId = () => {
    const records = ensureParentStoreInitialized()
    const max = records.reduce((acc, parent) => {
        const numeric = Number(String(parent.id).replace(/\D/g, ''))
        return Number.isNaN(numeric) ? acc : Math.max(acc, numeric)
    }, 0)
    return `PAR-${String(max + 1).padStart(3, '0')}`
}

export const getMappedStudentIds = (parentId) => {
    const parent = getParentById(parentId)
    return parent?.studentIds ?? []
}

export const mapStudentToParent = (parentId, studentId) => {
    const records = ensureParentStoreInitialized()
    const index = records.findIndex((parent) => parent.id === parentId)
    if (index < 0) return { success: false, message: 'Parent account not found.' }

    const studentIds = records[index].studentIds ?? []
    if (studentIds.includes(studentId)) {
        return { success: true, parent: records[index], alreadyMapped: true }
    }

    records[index] = {
        ...records[index],
        studentIds: [...studentIds, studentId],
        updatedAt: new Date().toISOString(),
    }
    saveParents(records)
    return { success: true, parent: records[index], alreadyMapped: false }
}

export const createParentAccount = ({
    email,
    password,
    name,
    phone = '',
    studentId,
}) => {
    const normalizedEmail = normalizeEmail(email)
    if (!normalizedEmail) {
        return { success: false, message: 'Parent email is required.' }
    }
    if (!isValidEmail(normalizedEmail)) {
        return { success: false, message: 'Enter a valid parent email address.' }
    }
    if (getParentByEmail(normalizedEmail)) {
        return { success: false, message: 'A parent account with this email already exists.' }
    }
    if (!String(password || '').trim()) {
        return { success: false, message: 'Parent password is required for a new account.' }
    }

    const now = new Date().toISOString()
    const parent = {
        id: generateParentId(),
        email: normalizedEmail,
        password: String(password).trim(),
        name: String(name || 'Parent').trim(),
        phone: String(phone || '').trim(),
        studentIds: studentId ? [studentId] : [],
        status: 'Active',
        role: ROLES.PARENT,
        source: 'enrollment',
        createdAt: now,
        updatedAt: now,
    }

    saveParents([...ensureParentStoreInitialized(), parent])
    return { success: true, parent }
}

export const ensureParentForEnrolledStudent = (admission, studentId) => {
    const email = resolveParentAccountEmail(admission)
    if (!email) {
        return { success: true, skipped: true, message: 'No parent account email on admission.' }
    }

    const existing = getParentByEmail(email)
    if (existing) {
        const mapResult = mapStudentToParent(existing.id, studentId)
        if (!mapResult.success) return mapResult
        return {
            success: true,
            created: false,
            parent: mapResult.parent,
            parentMapped: !mapResult.alreadyMapped,
        }
    }

    const password = String(admission?.parentAccountPassword || '').trim()
    if (!password) {
        return {
            success: false,
            message: 'Parent password is required to create a new parent account.',
        }
    }

    const createResult = createParentAccount({
        email,
        password,
        name: buildParentDisplayName(admission),
        phone: admission?.parentMobileNumber,
        studentId,
    })

    if (!createResult.success) return createResult

    return {
        success: true,
        created: true,
        parent: createResult.parent,
        parentMapped: true,
    }
}

export const validateAdmissionAccountFields = (payload, existing = null) => {
    const email = normalizeEmail(payload.parentAccountEmail)
    if (!email) {
        return { success: false, message: 'Parent username/email is required in Account Information.' }
    }
    if (!isValidEmail(email)) {
        return { success: false, message: 'Enter a valid parent username/email in Account Information.' }
    }

    const existingParent = getParentByEmail(email)
    const password = String(payload.parentAccountPassword || '').trim()

    if (!existingParent && !password) {
        return {
            success: false,
            message: 'Parent password is required when creating a new parent account.',
        }
    }

    return { success: true }
}
