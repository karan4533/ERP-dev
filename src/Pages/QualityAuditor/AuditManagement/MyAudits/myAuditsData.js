export const DEPARTMENTS = [
    'Finance',
    'HR',
    'Academic',
    'Transport',
    'IT Support',
    'Canteen',
    'Housekeeping',
    'Store',
]

export const AUDIT_TYPES = [
    'Process Compliance',
    'Financial Compliance',
    'Safety & Hygiene',
    'Inventory Verification',
    'IT Security Review',
    'Operational Audit',
]

export const PRIORITIES = ['High', 'Medium', 'Low']

export const STATUSES = ['Pending', 'In Progress', 'Completed', 'Overdue']

export const FREQUENCIES = ['ONE_TIME', 'DAILY', 'WEEKLY', 'FORTNIGHTLY', 'MONTHLY', 'TERMLY', 'YEARLY', 'Quarterly', 'Ad-hoc']

export const priorityBadgeColor = {
    High: 'bg-[#FF000033] text-[#FF0000]',
    Medium: 'bg-[#FF980033] text-[#FF9800]',
    Low: 'bg-[#2196F333] text-[#2196F3]',
}

export const statusBadgeColor = {
    Pending: 'bg-[#2196F333] text-[#2196F3]',
    'In Progress': 'bg-[#FF980033] text-[#FF9800]',
    Completed: 'bg-[#4CAF5033] text-[#4CAF50]',
    Overdue: 'bg-[#FF000033] text-[#FF0000]',
}

const STORAGE_KEY = 'quality-auditor-my-audits'

const buildAudit = ({
    auditId,
    auditName,
    auditType,
    department,
    location,
    scheduledDate,
    dueDate,
    priority,
    status,
    assignedBy,
    frequency,
}) => ({
    id: auditId,
    auditId,
    auditName,
    auditType,
    department,
    location,
    scheduledDate,
    dueDate,
    priority,
    status,
    assignedBy,
    frequency,
})

const DEFAULT_MY_AUDITS = [
    buildAudit({
        auditId: 'AUD-PA-2026-041',
        auditName: 'Petty Cash & Voucher Compliance',
        auditType: 'Financial Compliance',
        department: 'Finance',
        location: 'Admin Block — Room 102',
        scheduledDate: '10-06-2026',
        dueDate: '12-06-2026',
        priority: 'High',
        status: 'In Progress',
        assignedBy: 'Process Audit Manager',
        frequency: 'Monthly',
    }),
    buildAudit({
        auditId: 'AUD-PA-2026-042',
        auditName: 'Employee Onboarding Process',
        auditType: 'Process Compliance',
        department: 'HR',
        location: 'Admin Block — HR Office',
        scheduledDate: '12-06-2026',
        dueDate: '14-06-2026',
        priority: 'Medium',
        status: 'Pending',
        assignedBy: 'Joint Director — Audit',
        frequency: 'Quarterly',
    }),
    buildAudit({
        auditId: 'AUD-PA-2026-043',
        auditName: 'Food Safety & Kitchen Hygiene',
        auditType: 'Safety & Hygiene',
        department: 'Canteen',
        location: 'Canteen Building',
        scheduledDate: '08-06-2026',
        dueDate: '10-06-2026',
        priority: 'High',
        status: 'Overdue',
        assignedBy: 'Process Audit Manager',
        frequency: 'Monthly',
    }),
    buildAudit({
        auditId: 'AUD-PA-2026-044',
        auditName: 'Inventory Control & Stock Reconciliation',
        auditType: 'Inventory Verification',
        department: 'Store',
        location: 'Store Room — Ground Floor',
        scheduledDate: '14-06-2026',
        dueDate: '16-06-2026',
        priority: 'Medium',
        status: 'Pending',
        assignedBy: 'Process Audit Manager',
        frequency: 'Quarterly',
    }),
    buildAudit({
        auditId: 'AUD-PA-2026-038',
        auditName: 'Fleet Maintenance & Trip Logs',
        auditType: 'Operational Audit',
        department: 'Transport',
        location: 'Transport Office',
        scheduledDate: '01-06-2026',
        dueDate: '05-06-2026',
        priority: 'High',
        status: 'Completed',
        assignedBy: 'Joint Director — Audit',
        frequency: 'Monthly',
    }),
    buildAudit({
        auditId: 'AUD-PA-2026-039',
        auditName: 'Data Backup & Access Control Policy',
        auditType: 'IT Security Review',
        department: 'IT Support',
        location: 'IT Server Room',
        scheduledDate: '05-06-2026',
        dueDate: '08-06-2026',
        priority: 'High',
        status: 'Completed',
        assignedBy: 'Process Audit Manager',
        frequency: 'Quarterly',
    }),
    buildAudit({
        auditId: 'AUD-PA-2026-045',
        auditName: 'Classroom Safety & Housekeeping Standards',
        auditType: 'Safety & Hygiene',
        department: 'Housekeeping',
        location: 'Main Academic Block',
        scheduledDate: '16-06-2026',
        dueDate: '18-06-2026',
        priority: 'Low',
        status: 'Pending',
        assignedBy: 'Process Audit Manager',
        frequency: 'Monthly',
    }),
    buildAudit({
        auditId: 'AUD-PA-2026-046',
        auditName: 'Examination Workflow Compliance',
        auditType: 'Process Compliance',
        department: 'Academic',
        location: 'Examination Cell',
        scheduledDate: '18-06-2026',
        dueDate: '20-06-2026',
        priority: 'Medium',
        status: 'In Progress',
        assignedBy: 'Joint Director — Audit',
        frequency: 'Ad-hoc',
    }),
]

export const saveMyAudits = (records) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records))
}

export const getMyAudits = () => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY)
        if (stored) return JSON.parse(stored)
    } catch {
        /* ignore */
    }
    saveMyAudits(DEFAULT_MY_AUDITS)
    return DEFAULT_MY_AUDITS
}

export const updateAuditStatus = (id, status) => {
    const list = getMyAudits()
    const next = list.map((item) =>
        item.id === id || item.auditId === id ? { ...item, status } : item,
    )
    saveMyAudits(next)
    return next
}

export const getAuditById = (id) =>
    getMyAudits().find((item) => item.id === id || item.auditId === id) ?? null
