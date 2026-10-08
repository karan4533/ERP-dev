import { DEPARTMENTS } from '../../AuditPlanning/auditPlanningData'

export const WORKFLOW_STEP_OPTIONS = [
    'Process Auditor',
    'Assigned Employee',
    'Department Head',
    'Super Admin',
    'Visible to JD Audit',
]

export const WORKFLOW_STATUS_OPTIONS = ['Active', 'Inactive']

export const workflowStatusBadgeColor = {
    Active: 'bg-[#4CAF501A] text-[#4CAF50]',
    Inactive: 'bg-[#6670851A] text-[#667085]',
}

export const DEFAULT_WORKFLOW_FORM = {
    workflowName: '',
    department: '',
    step1: 'Process Auditor',
    step2: 'Assigned Employee',
    step3: 'Department Head',
    step4: 'Super Admin',
    step5: 'Visible to JD Audit',
    active: true,
}

export const DEFAULT_WORKFLOW_STEPS = [
    'Process Auditor',
    'Assigned Employee',
    'Department Head',
    'Super Admin',
    'Visible to JD Audit',
]

export const WORKFLOW_RULES = [
    {
        id: 'WF-001',
        workflowName: 'Academic Audit Workflow',
        department: 'Academic',
        steps: [...DEFAULT_WORKFLOW_STEPS],
        active: true,
    },
    {
        id: 'WF-002',
        workflowName: 'Finance Compliance Workflow',
        department: 'Finance',
        steps: [
            'Process Auditor',
            'Assigned Employee',
            'Department Head',
            'Super Admin',
            'Visible to JD Audit',
        ],
        active: true,
    },
    {
        id: 'WF-003',
        workflowName: 'HR Process Workflow',
        department: 'HR',
        steps: [
            'Process Auditor',
            'Assigned Employee',
            'Department Head',
            'Visible to JD Audit',
            '',
        ],
        active: true,
    },
    {
        id: 'WF-004',
        workflowName: 'Transport Safety Workflow',
        department: 'Transport',
        steps: [
            'Process Auditor',
            'Department Head',
            'Super Admin',
            'Visible to JD Audit',
            '',
        ],
        active: false,
    },
]

export const WORKFLOW_DEPARTMENTS = DEPARTMENTS

export const getWorkflowStatus = (active) => (active ? 'Active' : 'Inactive')

export const getActiveSteps = (steps) => steps.filter((step) => step)

export const formatStepsSummary = (steps) => {
    const activeSteps = getActiveSteps(steps)
    return `${activeSteps.length} step${activeSteps.length === 1 ? '' : 's'}`
}

export const createWorkflowId = (workflows) => {
    const max = workflows.reduce((current, workflow) => {
        const match = workflow.id.match(/WF-(\d+)/)
        return match ? Math.max(current, Number(match[1])) : current
    }, 0)
    return `WF-${String(max + 1).padStart(3, '0')}`
}

export const buildWorkflowPayload = (formData) => ({
    workflowName: formData.workflowName,
    department: formData.department,
    steps: [
        formData.step1,
        formData.step2,
        formData.step3,
        formData.step4,
        formData.step5,
    ].filter(Boolean),
    active: formData.active,
})

export const toWorkflowForm = (workflow) => {
    const steps = [...workflow.steps]
    while (steps.length < 5) steps.push('')

    return {
        workflowName: workflow.workflowName,
        department: workflow.department,
        step1: steps[0] || '',
        step2: steps[1] || '',
        step3: steps[2] || '',
        step4: steps[3] || '',
        step5: steps[4] || '',
        active: workflow.active,
    }
}

export const getStoredSteps = (formData) => [
    formData.step1,
    formData.step2,
    formData.step3,
    formData.step4,
    formData.step5,
].filter(Boolean)
