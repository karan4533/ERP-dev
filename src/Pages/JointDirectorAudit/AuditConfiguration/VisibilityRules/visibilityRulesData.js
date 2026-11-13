export const VISIBILITY_MODULES = [
    'Audit',
    'Observation',
    'RCA',
    'ATR',
    'Reports',
    'Findings',
    'Corrective Actions',
]

export const VISIBILITY_ROLES = [
    'Process Auditor',
    'Quality Auditor',
    'Employee',
    'Assigned Employee',
    'Department Head',
    'JD Audit',
    'Super Admin',
    'Joint Director Audit',
]

export const PERMISSION_FIELDS = [
    { key: 'read', label: 'Read' },
    { key: 'create', label: 'Create' },
    { key: 'edit', label: 'Edit' },
    { key: 'delete', label: 'Delete' },
    { key: 'approve', label: 'Approve' },
    { key: 'submit', label: 'Submit' },
]

export const DEFAULT_VISIBILITY_FORM = {
    module: '',
    roles: [],
    permissions: {
        read: false,
        create: false,
        edit: false,
        delete: false,
        approve: false,
        submit: false,
    },
    active: true,
}

export const permissionBadgeColor = {
    Read: 'bg-[#515DEF1A] text-[#515DEF]',
    View: 'bg-[#515DEF1A] text-[#515DEF]',
    Create: 'bg-[#4CAF501A] text-[#4CAF50]',
    Edit: 'bg-[#FF98001A] text-[#FF9800]',
    Delete: 'bg-[#FF57221A] text-[#FF5722]',
    Approve: 'bg-[#9C27B01A] text-[#9C27B0]',
    Submit: 'bg-[#00BCD41A] text-[#00BCD4]',
}

export const VISIBILITY_RULES = [
    {
        id: 'VR-001',
        module: 'Audit',
        roles: ['Process Auditor'],
        permissions: { read: true, create: true, edit: true, delete: false, approve: false, submit: false },
        active: true,
    },
    {
        id: 'VR-002',
        module: 'Observation',
        roles: ['Process Auditor'],
        permissions: { read: true, create: true, edit: true, delete: false, approve: false, submit: false },
        active: true,
    },
    {
        id: 'VR-003',
        module: 'RCA',
        roles: ['Employee'],
        permissions: { read: true, create: false, edit: false, delete: false, approve: false, submit: true },
        active: true,
    },
    {
        id: 'VR-004',
        module: 'ATR',
        roles: ['Employee'],
        permissions: { read: true, create: false, edit: false, delete: false, approve: false, submit: true },
        active: true,
    },
    {
        id: 'VR-005',
        module: 'Reports',
        roles: ['JD Audit', 'Super Admin'],
        permissions: { read: true, create: false, edit: false, delete: false, approve: false, submit: false },
        active: true,
    },
    {
        id: 'VR-006',
        module: 'Findings',
        roles: ['Department Head', 'JD Audit'],
        permissions: { read: true, create: false, edit: true, approve: true, delete: false, submit: false },
        active: true,
    },
]

export const getPermissionLabels = (permissions) => (
    PERMISSION_FIELDS
        .filter((field) => permissions[field.key])
        .map((field) => field.label)
)

export const formatPermissionSummary = (permissions) => {
    const labels = getPermissionLabels(permissions)
    return labels.length > 0 ? labels.join(', ') : '—'
}

export const formatRolesSummary = (roles) => (
    roles.length > 0 ? roles.join(', ') : '—'
)

export const createVisibilityRuleId = (rules) => {
    const max = rules.reduce((current, rule) => {
        const match = rule.id.match(/VR-(\d+)/)
        return match ? Math.max(current, Number(match[1])) : current
    }, 0)
    return `VR-${String(max + 1).padStart(3, '0')}`
}

export const toVisibilityForm = (rule) => ({
    module: rule.module,
    roles: [...rule.roles],
    permissions: { ...DEFAULT_VISIBILITY_FORM.permissions, ...rule.permissions },
    active: rule.active,
})

export const buildVisibilityPayload = (formData) => ({
    module: formData.module,
    roles: formData.roles,
    permissions: { ...formData.permissions },
    active: formData.active,
})
