export const ASSIGNEE_OPTIONS = [
    'HR Manager',
    'HR Executive',
    'Process Audit Manager',
    'Process Audit Executive',
    'Quality Audit Principal',
    'Quality Audit Executive',
]

export const PRIORITY_OPTIONS = ['Low', 'Medium', 'High', 'Urgent']

export const STATUS_OPTIONS = ['Pending', 'In Progress', 'Completed', 'In Complete']

export const TASKS = [
    {
        taskId: 'AUD-T-001',
        title: 'HR policy compliance review — Q2',
        description: 'Review employee onboarding files, leave records, and policy acknowledgment forms for HR department audit scope.',
        assignedTo: 'HR Manager',
        priority: 'High',
        assignedDate: '10-06-2026',
        dueDate: '18-06-2026',
        status: 'In Progress',
    },
    {
        taskId: 'AUD-T-002',
        title: 'Process audit checklist — Finance operations',
        description: 'Complete process audit checklist for petty cash, voucher approvals, and reconciliation workflows in Finance.',
        assignedTo: 'Process Audit Manager',
        priority: 'High',
        assignedDate: '09-06-2026',
        dueDate: '16-06-2026',
        status: 'Pending',
    },
    {
        taskId: 'AUD-T-003',
        title: 'Quality audit — Academic assessment records',
        description: 'Verify grade entry integrity, moderation logs, and assessment rubric compliance across Grade 9–12.',
        assignedTo: 'Quality Audit Principal',
        priority: 'Urgent',
        assignedDate: '10-06-2026',
        dueDate: '14-06-2026',
        status: 'In Progress',
    },
    {
        taskId: 'AUD-T-004',
        title: 'HR documentation sampling — new hires',
        description: 'Sample 25 recent hire files for complete documentation, background verification, and contract compliance.',
        assignedTo: 'HR Executive',
        priority: 'Medium',
        assignedDate: '08-06-2026',
        dueDate: '12-06-2026',
        status: 'Completed',
    },
    {
        taskId: 'AUD-T-005',
        title: 'Process walkthrough — Transport maintenance logs',
        description: 'Conduct process walkthrough of vehicle maintenance scheduling, inspection records, and vendor payment trails.',
        assignedTo: 'Process Audit Executive',
        priority: 'Medium',
        assignedDate: '07-06-2026',
        dueDate: '15-06-2026',
        status: 'In Complete',
    },
    {
        taskId: 'AUD-T-006',
        title: 'Cross-audit findings consolidation',
        description: 'Compile open findings from HR, Process, and Quality audit streams for Joint Director Audit weekly review.',
        assignedTo: 'Process Audit Manager',
        priority: 'Medium',
        assignedDate: '10-06-2026',
        dueDate: '12-06-2026',
        status: 'In Progress',
    },
]

export const statusBadgeColor = {
    Pending: 'bg-[#66708533] text-[#667085]',
    Completed: 'bg-[#4CAF5033] text-[#4CAF50]',
    'In Progress': 'bg-[#FF980033] text-[#FF9800]',
    'In Complete': 'bg-[#FF000033] text-[#FF0000]',
}
