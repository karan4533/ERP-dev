export const RESPONSE_TYPE_STATUS_OPTIONS = ['Active', 'Inactive']

export const responseTypeStatusBadgeColor = {
    Active: 'bg-[#4CAF501A] text-[#4CAF50]',
    Inactive: 'bg-[#6670851A] text-[#667085]',
}

export const DEFAULT_RESPONSE_TYPE_FORM = {
    type: '',
    description: '',
    active: true,
}

export const RESPONSE_TYPES_LIST = [
    {
        id: 'RT-001',
        type: 'Yes / No',
        description: 'Binary response for compliance checks with Yes or No options.',
        active: true,
    },
    {
        id: 'RT-002',
        type: 'Yes / No / NA',
        description: 'Three-option response including Not Applicable for optional criteria.',
        active: true,
    },
    {
        id: 'RT-003',
        type: 'Star Rating',
        description: 'Rated response using a star scale for qualitative assessments.',
        active: true,
    },
    {
        id: 'RT-004',
        type: 'Number',
        description: 'Numeric input for counts, quantities, or measurable values.',
        active: true,
    },
    {
        id: 'RT-005',
        type: 'Text',
        description: 'Short single-line text input for brief remarks or references.',
        active: true,
    },
    {
        id: 'RT-006',
        type: 'Textarea',
        description: 'Multi-line text input for detailed observations and notes.',
        active: true,
    },
    {
        id: 'RT-007',
        type: 'Dropdown',
        description: 'Single selection from a predefined list of options.',
        active: true,
    },
    {
        id: 'RT-008',
        type: 'Checkbox',
        description: 'Multiple selections from a predefined option set.',
        active: true,
    },
    {
        id: 'RT-009',
        type: 'Date',
        description: 'Calendar date picker for audit dates and review timestamps.',
        active: true,
    },
    {
        id: 'RT-010',
        type: 'Time',
        description: 'Time picker for recording specific audit event times.',
        active: true,
    },
    {
        id: 'RT-011',
        type: 'File Upload',
        description: 'Attach documents such as reports, registers, or policy files.',
        active: true,
    },
    {
        id: 'RT-012',
        type: 'Image Upload',
        description: 'Upload photo evidence for visual verification during audits.',
        active: true,
    },
    {
        id: 'RT-013',
        type: 'Video Upload',
        description: 'Upload walkthrough or process demonstration videos.',
        active: true,
    },
    {
        id: 'RT-014',
        type: 'Signature',
        description: 'Capture authorized digital signatures for approvals.',
        active: true,
    },
]

export const getResponseTypeStatus = (active) => (active ? 'Active' : 'Inactive')

export const getActiveResponseTypeLabels = (types = RESPONSE_TYPES_LIST) => (
    types.filter((item) => item.active).map((item) => item.type)
)

export const createResponseTypeId = (types) => {
    const max = types.reduce((current, item) => {
        const match = item.id.match(/RT-(\d+)/)
        return match ? Math.max(current, Number(match[1])) : current
    }, 0)
    return `RT-${String(max + 1).padStart(3, '0')}`
}
