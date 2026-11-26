export const AUDIT_TYPES = [
    'Process Audit',
    'Quality Audit',
    'HR Audit',
    'Special Audit',
]

export const DEPARTMENTS = [
    'Operations',
    'HR',
    'Academic',
    'Finance',
    'Transport',
    'IT Support',
    'Canteen',
    'Housekeeping',
    'Stationery Store',
]

export const AUDITORS = [
    'R. Mehta',
    'S. Priya',
    'A. Khan',
    'V. Lakshmi',
    'D. Joseph',
]

export const PRIORITY_OPTIONS = ['Low', 'Medium', 'High', 'Critical']

export const STATUS_OPTIONS = ['Planned', 'In Progress', 'Completed']

export const AUDIT_PLANS = [
    {
        id: 'AUD-2026-014',
        title: 'Q2 Financial Process Review',
        auditType: 'Process Audit',
        department: 'Finance',
        assignedAuditor: 'R. Mehta',
        auditTeam: 'R. Mehta, S. Priya',
        priority: 'High',
        plannedDate: '14-06-2026',
        expectedCompletionDate: '18-06-2026',
        scheduledDate: '14-06-2026',
        status: 'Planned',
        auditScope: 'Review purchase order workflow, vendor payment approvals, and petty cash reconciliation for Q2.',
        objectives: 'Verify compliance with school finance policy and identify control gaps before year-end closing.',
        checklistReference: 'FIN-CHK-2026-Q2',
    },
    {
        id: 'AUD-2026-015',
        title: 'Stationery Inventory Quality Check',
        auditType: 'Quality Audit',
        department: 'Stationery Store',
        assignedAuditor: 'S. Priya',
        auditTeam: 'S. Priya, V. Lakshmi',
        priority: 'Medium',
        plannedDate: '16-06-2026',
        expectedCompletionDate: '19-06-2026',
        scheduledDate: '16-06-2026',
        status: 'Planned',
        auditScope: 'Exam-week stock quality, storage conditions, and issue/return documentation.',
        objectives: 'Ensure exam materials meet quality standards and stock records match physical counts.',
        checklistReference: 'INV-QUAL-2026-06',
    },
    {
        id: 'AUD-2026-016',
        title: 'Staff Attendance & HR Compliance',
        auditType: 'HR Audit',
        department: 'HR',
        assignedAuditor: 'A. Khan',
        auditTeam: 'A. Khan',
        priority: 'High',
        plannedDate: '18-06-2026',
        expectedCompletionDate: '22-06-2026',
        scheduledDate: '18-06-2026',
        status: 'In Progress',
        auditScope: 'Non-teaching staff attendance records, leave policy adherence, and onboarding documentation.',
        objectives: 'Validate HR compliance with labour regulations and internal HR policy for support staff.',
        checklistReference: 'HR-COMP-2026-H1',
    },
    {
        id: 'AUD-2026-017',
        title: 'IT Security Special Review',
        auditType: 'Special Audit',
        department: 'IT Support',
        assignedAuditor: 'V. Lakshmi',
        auditTeam: 'V. Lakshmi, D. Joseph',
        priority: 'Critical',
        plannedDate: '20-06-2026',
        expectedCompletionDate: '24-06-2026',
        scheduledDate: '20-06-2026',
        status: 'Planned',
        auditScope: 'Network access controls, ERP backup schedule, and lab device security post-incident.',
        objectives: 'Assess IT security posture after Block C network failure and recommend remediation.',
        checklistReference: 'IT-SEC-SPL-2026',
    },
    {
        id: 'AUD-2026-018',
        title: 'Transport Route Safety Process Audit',
        auditType: 'Process Audit',
        department: 'Transport',
        assignedAuditor: 'D. Joseph',
        auditTeam: 'D. Joseph, R. Mehta',
        priority: 'Critical',
        plannedDate: '22-06-2026',
        expectedCompletionDate: '26-06-2026',
        scheduledDate: '22-06-2026',
        status: 'Planned',
        auditScope: 'Driver compliance checks, vehicle maintenance logs, and route safety documentation.',
        objectives: 'Confirm transport operations meet safety standards before monsoon season.',
        checklistReference: 'TRN-PROC-2026-06',
    },
    {
        id: 'AUD-2026-011',
        title: 'Academic Assessment Quality Review',
        auditType: 'Quality Audit',
        department: 'Academic',
        assignedAuditor: 'S. Priya',
        auditTeam: 'S. Priya, A. Khan',
        priority: 'Medium',
        plannedDate: '02-06-2026',
        expectedCompletionDate: '06-06-2026',
        scheduledDate: '02-06-2026',
        status: 'Completed',
        auditScope: 'Internal assessment paper setting, moderation records, and grade entry accuracy.',
        objectives: 'Ensure academic assessment processes meet board examination standards.',
        checklistReference: 'ACD-QUAL-2026-05',
    },
]

export const getAuditPlanById = (id) => AUDIT_PLANS.find((plan) => plan.id === id) ?? null

export const priorityBadgeColor = {
    Low: 'bg-[#66708533] text-[#667085]',
    Medium: 'bg-[#2196F333] text-[#2196F3]',
    High: 'bg-[#FF980033] text-[#FF9800]',
    Critical: 'bg-[#FF000033] text-[#FF0000]',
}

export const statusBadgeColor = {
    Planned: 'bg-[#515DEF33] text-[#515DEF]',
    'In Progress': 'bg-[#FF980033] text-[#FF9800]',
    Completed: 'bg-[#4CAF5033] text-[#4CAF50]',
}

export const auditTypeBadgeColor = {
    'Process Audit': 'bg-[#515DEF33] text-[#515DEF]',
    'Quality Audit': 'bg-[#4CAF5033] text-[#4CAF50]',
    'HR Audit': 'bg-[#FF980033] text-[#FF9800]',
    'Special Audit': 'bg-[#9C27B033] text-[#9C27B0]',
}
