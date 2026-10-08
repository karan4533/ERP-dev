const STORAGE_KEY = 'material-gate-pass-front-office'
const MGP_COUNTER_KEY = 'material-gate-pass-mgp-counter'

export const APPROVAL_ROLES = [
    { key: 'storeKeeper', label: 'Store Keeper', useRoleSelect: true },
    { key: 'security', label: 'Security', useRoleSelect: true },
    { key: 'takenBy', label: 'Taken By', useRoleSelect: false },
    { key: 'principal', label: 'Principal', useRoleSelect: true },
    { key: 'authorizedSignatory', label: 'Authorized Signatory', useRoleSelect: true },
]

export const APPROVAL_ROLE_PERSONS = [
    { role: 'Store Keeper', name: 'Selvam R.' },
    { role: 'Assistant Store Keeper', name: 'Kumar V.' },
    { role: 'Security', name: 'Murugan P.' },
    { role: 'Security Supervisor', name: 'Ravi S.' },
    { role: 'Principal', name: 'Dr. Priya Nair' },
    { role: 'Vice Principal', name: 'Mr. Rajesh Kumar' },
    { role: 'Authorized Signatory', name: 'Admin Office' },
    { role: 'Director', name: 'Dr. Meena Krishnan' },
]

export const getPersonNameByRole = (role) =>
    APPROVAL_ROLE_PERSONS.find((item) => item.role === role)?.name ?? ''

export const STATUS_OPTIONS = ['Pending', 'Approved', 'Partially Approved']

export const PASS_TYPE_OPTIONS = ['Returnable', 'Non-Returnable']

export const getPassTypeTitle = (passType = 'Non-Returnable') =>
    `Material Gate Pass (${passType})`

export const statusBadgeColor = {
    Pending: 'bg-[#FF980033] text-[#FF9800]',
    Approved: 'bg-[#4CAF5033] text-[#4CAF50]',
    Rejected: 'bg-[#FF000033] text-[#FF0000]',
    'Partially Approved': 'bg-[#2196F333] text-[#2196F3]',
}

export const createEmptyMaterialRow = () => ({
    id: `row-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    description: '',
    quantity: 1,
    destination: '',
    remarks: '',
})

export const createDefaultApprovals = () =>
    APPROVAL_ROLES.reduce((acc, role) => {
        acc[role.key] = role.useRoleSelect
            ? { role: '', name: '' }
            : { name: '' }
        return acc
    }, {})

const normalizeApprovalEntry = (key, approval = {}) => {
    const roleConfig = APPROVAL_ROLES.find((role) => role.key === key)
    if (!roleConfig) return approval

    if (roleConfig.useRoleSelect) {
        const role = approval.role ?? ''
        return {
            role,
            name: approval.name || getPersonNameByRole(role) || '',
        }
    }

    return { name: approval.name ?? '' }
}

export const normalizeApprovals = (approvals = {}) =>
    APPROVAL_ROLES.reduce((acc, { key }) => {
        acc[key] = normalizeApprovalEntry(key, approvals[key])
        return acc
    }, {})

const DEFAULT_MATERIAL_GATE_PASSES = []

export const calculateTotalItems = (materials = []) =>
    materials.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0)

export const deriveOverallStatus = (approvals = {}) => {
    const normalized = normalizeApprovals(approvals)
    const filledCount = APPROVAL_ROLES.filter(({ key }) => normalized[key]?.name?.trim()).length
    if (filledCount === APPROVAL_ROLES.length) return 'Approved'
    if (filledCount > 0) return 'Partially Approved'
    return 'Pending'
}

export const formatDisplayTime = (time, timePeriod) => {
    if (!time) return '—'
    return timePeriod ? `${time} ${timePeriod}` : time
}

const parsePassNumber = (value) => {
    const numeric = Number(String(value ?? '').replace(/\D/g, ''))
    return Number.isNaN(numeric) ? 0 : numeric
}

const formatPassNumber = (num) => String(num).padStart(4, '0')

const syncMgpCounter = (records = []) => {
    const maxInRecords = records.reduce(
        (max, record) => Math.max(max, parsePassNumber(record.mgpNo)),
        0,
    )
    const stored = localStorage.getItem(MGP_COUNTER_KEY)
    const counter = stored !== null ? Number(stored) || 0 : maxInRecords
    const nextCounter = Math.max(counter, maxInRecords)
    localStorage.setItem(MGP_COUNTER_KEY, String(nextCounter))
    return nextCounter
}

export const generateMgpNo = () => {
    const records = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
    syncMgpCounter(Array.isArray(records) ? records : [])
    const current = Number(localStorage.getItem(MGP_COUNTER_KEY) || 0)
    const next = current + 1
    localStorage.setItem(MGP_COUNTER_KEY, String(next))
    return formatPassNumber(next)
}

const hydrateRecord = (record) => ({
    ...record,
    passType: record.passType ?? 'Non-Returnable',
    approvals: normalizeApprovals(record.approvals),
    totalItems: calculateTotalItems(record.materials),
    status: record.status ?? deriveOverallStatus(record.approvals),
})

export const getMaterialGatePasses = () => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
        const records = JSON.parse(stored).map(hydrateRecord)
        syncMgpCounter(records)
        return records
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_MATERIAL_GATE_PASSES))
    localStorage.setItem(MGP_COUNTER_KEY, '0')
    return DEFAULT_MATERIAL_GATE_PASSES.map(hydrateRecord)
}

export const saveMaterialGatePasses = (records) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records))
}

export const getMaterialGatePassById = (id) =>
    getMaterialGatePasses().find((record) => record.id === id) ?? null

export const addMaterialGatePass = (payload) => {
    const records = getMaterialGatePasses()
    const mgpNo = generateMgpNo()
    const record = hydrateRecord({
        id: `mgp-${mgpNo}`,
        mgpNo,
        ...payload,
        status: deriveOverallStatus(payload.approvals),
        createdAt: new Date().toLocaleString('en-IN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
        }).replace(',', ''),
    })
    saveMaterialGatePasses([record, ...records])
    return record
}

export const updateMaterialGatePass = (id, payload) => {
    const records = getMaterialGatePasses()
    const index = records.findIndex((record) => record.id === id)
    if (index === -1) return null
    const updated = hydrateRecord({
        ...records[index],
        ...payload,
        status: deriveOverallStatus(payload.approvals ?? records[index].approvals),
    })
    records[index] = updated
    saveMaterialGatePasses(records)
    return updated
}

export const deleteMaterialGatePass = (id) => {
    const records = getMaterialGatePasses().filter((record) => record.id !== id)
    saveMaterialGatePasses(records)
}

export const getNextMgpPreview = () => {
    const records = getMaterialGatePasses()
    const current = syncMgpCounter(records)
    return formatPassNumber(current + 1)
}
