import { DEPARTMENTS, PRIORITIES } from '../../Observations/observationsData'

export { DEPARTMENTS, PRIORITIES }

export const ESCALATION_STATUSES = ['Pending', 'Accepted', 'Rejected', 'Resolved', 'Closed']

export const ESCALATED_TO_OPTIONS = [
    'Joint Director Audit',
    'Department Head',
    'Principal',
    'Admin',
    'Process Auditor Lead',
]

export const statusBadgeColor = {
    Pending: 'bg-[#FF980033] text-[#FF9800]',
    Accepted: 'bg-[#2196F333] text-[#2196F3]',
    Rejected: 'bg-[#FF000033] text-[#FF0000]',
    Resolved: 'bg-[#4CAF5033] text-[#4CAF50]',
    Closed: 'bg-[#66708533] text-[#667085]',
}

export const priorityBadgeColor = {
    Low: 'bg-[#2196F333] text-[#2196F3]',
    Medium: 'bg-[#FF980033] text-[#FF9800]',
    High: 'bg-[#FF000033] text-[#FF0000]',
    Critical: 'bg-[#9C27B033] text-[#9C27B0]',
}

const STORAGE_KEY = 'process-auditor-escalations'

const buildEscalation = ({
    escalationId,
    observationId,
    observationTitle,
    department,
    escalatedTo,
    reason,
    priority,
    escalationDate,
    expectedResolution,
    status,
}) => ({
    id: escalationId,
    escalationId,
    observationId,
    observationTitle,
    department,
    escalatedTo,
    reason,
    priority,
    escalationDate,
    expectedResolution,
    status,
})

const DEFAULT_ESCALATIONS = [
    buildEscalation({
        escalationId: 'ESC-PA-2026-006',
        observationId: 'OBS-PA-2026-014',
        observationTitle: 'Food storage temperature log missing',
        department: 'Canteen',
        escalatedTo: 'Joint Director Audit',
        reason: 'Observation overdue by 5 days with no department response or corrective action submitted.',
        priority: 'Critical',
        escalationDate: '15-06-2026',
        expectedResolution: '20-06-2026',
        status: 'Pending',
    }),
    buildEscalation({
        escalationId: 'ESC-PA-2026-005',
        observationId: 'OBS-PA-2026-011',
        observationTitle: 'Fire extinguisher expired on Bus TN-12-AB-4521',
        department: 'Transport',
        escalatedTo: 'Principal',
        reason: 'Critical safety violation — bus still in service despite expired fire extinguisher. ATR not received.',
        priority: 'Critical',
        escalationDate: '12-06-2026',
        expectedResolution: '14-06-2026',
        status: 'Accepted',
    }),
    buildEscalation({
        escalationId: 'ESC-PA-2026-004',
        observationId: 'OBS-PA-2026-013',
        observationTitle: 'Petty cash voucher unsigned',
        department: 'Finance',
        escalatedTo: 'Department Head',
        reason: 'Repeated documentation non-compliance. Previous observation on same issue closed without verified fix.',
        priority: 'High',
        escalationDate: '11-06-2026',
        expectedResolution: '18-06-2026',
        status: 'Accepted',
    }),
    buildEscalation({
        escalationId: 'ESC-PA-2026-003',
        observationId: 'OBS-PA-2026-012',
        observationTitle: 'Corridor cleaning schedule not displayed',
        department: 'Housekeeping',
        escalatedTo: 'Department Head',
        reason: 'Housekeeping SOP HK-001 non-compliance persists beyond due date.',
        priority: 'Medium',
        escalationDate: '10-06-2026',
        expectedResolution: '17-06-2026',
        status: 'Pending',
    }),
    buildEscalation({
        escalationId: 'ESC-PA-2026-002',
        observationId: 'OBS-PA-2026-009',
        observationTitle: 'Backup verification log incomplete',
        department: 'IT Support',
        escalatedTo: 'Admin',
        reason: 'Escalation rejected initially — department provided partial RCA. Re-escalated after verification failed.',
        priority: 'High',
        escalationDate: '08-06-2026',
        expectedResolution: '12-06-2026',
        status: 'Rejected',
    }),
    buildEscalation({
        escalationId: 'ESC-PA-2026-001',
        observationId: 'OBS-PA-2026-007',
        observationTitle: 'Staff hygiene compliance below standard',
        department: 'Canteen',
        escalatedTo: 'Joint Director Audit',
        reason: 'Observation closed without verified corrective action. Reopened and escalated for review.',
        priority: 'Medium',
        escalationDate: '28-05-2026',
        expectedResolution: '05-06-2026',
        status: 'Resolved',
    }),
    buildEscalation({
        escalationId: 'ESC-PA-2025-012',
        observationId: 'OBS-PA-2026-003',
        observationTitle: 'Answer script register incomplete',
        department: 'Academic',
        escalatedTo: 'Principal',
        reason: 'Examination documentation gap identified during audit. Department response delayed.',
        priority: 'High',
        escalationDate: '22-04-2026',
        expectedResolution: '30-04-2026',
        status: 'Closed',
    }),
]

export const saveEscalations = (records) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records))
}

export const getEscalations = () => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY)
        if (stored) return JSON.parse(stored)
    } catch {
        /* ignore */
    }
    saveEscalations(DEFAULT_ESCALATIONS)
    return DEFAULT_ESCALATIONS
}

export const getEscalationById = (id) =>
    getEscalations().find((item) => item.id === id || item.escalationId === id) ?? null

export const generateEscalationId = () => {
    const list = getEscalations()
    const max = list.reduce((acc, item) => {
        const num = Number(item.escalationId.split('-').pop())
        return Number.isNaN(num) ? acc : Math.max(acc, num)
    }, 0)
    return `ESC-PA-2026-${String(max + 1).padStart(3, '0')}`
}

export const emptyEscalationForm = () => ({
    observationId: '',
    observationTitle: '',
    department: '',
    escalatedTo: '',
    reason: '',
    priority: 'Medium',
    escalationDate: '',
    expectedResolution: '',
    status: 'Pending',
})

export const createEscalation = (form) => {
    const escalationId = generateEscalationId()
    const now = new Date()
    const escalationDate = form.escalationDate || now.toLocaleDateString('en-GB').replace(/\//g, '-')

    const record = buildEscalation({
        escalationId,
        ...form,
        escalationDate,
        status: form.status || 'Pending',
    })

    const next = [record, ...getEscalations()]
    saveEscalations(next)
    return record
}
