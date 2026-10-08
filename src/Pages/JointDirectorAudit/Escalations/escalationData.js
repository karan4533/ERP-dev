export const DEPARTMENTS = [
    'HR Audit',
    'Process Audit',
    'Quality Audit',
]

export const ESCALATION_STATUSES = ['Open', 'In Review', 'Escalated to Admin', 'Resolved', 'Closed']

export const ESCALATIONS = [
    {
        id: 'ESC-AUD-2026-008',
        escalatedBy: 'R. Mehta',
        escalatedByRole: 'Process Audit Manager',
        escalatedById: 'PAM-1001',
        description: 'Critical finding — unsupported petty cash vouchers in Finance audit.',
        escalationDate: '10-06-2026',
        escalatedDepartment: 'Process Audit',
        sourceType: 'audit-manager',
        status: 'Open',
        priority: 'Critical',
        fullDescription:
            'Process audit of Finance department identified ₹1.2L in petty cash transactions without supporting vouchers. Department head disputes classification. Requires Joint Director Audit intervention before closure of AUD-2026-022.',
        remarks: 'Linked to finding FND-2026-035 — due for compliance review 14-06-2026.',
        escalatedToAdmin: false,
        adminEscalationDate: null,
        adminEscalationNote: null,
    },
    {
        id: 'ESC-AUD-2026-007',
        escalatedBy: 'S. Priya',
        escalatedByRole: 'HR Executive',
        escalatedById: 'HRE-1001',
        description: 'HR audit — missing policy acknowledgment forms for 18 staff members.',
        escalationDate: '09-06-2026',
        escalatedDepartment: 'HR Audit',
        sourceType: 'audit-executive',
        status: 'In Review',
        priority: 'High',
        fullDescription:
            'HR documentation sampling revealed 18 employees without signed anti-harassment and data privacy policy forms. HR department claims forms were collected offline but records not digitized.',
        remarks: 'HR Manager notified — awaiting corrected file submission.',
        escalatedToAdmin: false,
        adminEscalationDate: null,
        adminEscalationNote: null,
    },
    {
        id: 'ESC-AUD-2026-006',
        escalatedBy: 'V. Lakshmi',
        escalatedByRole: 'Quality Audit Principal',
        escalatedById: 'QAP-1001',
        description: 'Grade entry discrepancies — Academic quality audit blocked by department.',
        escalationDate: '08-06-2026',
        escalatedDepartment: 'Quality Audit',
        sourceType: 'audit-principal',
        status: 'Escalated to Admin',
        priority: 'High',
        fullDescription:
            'Quality audit identified mismatched grade entries across 3 subjects for 42 students. Academic coordinator restricted auditor access to source mark sheets citing exam confidentiality policy conflict.',
        remarks: 'Joint Director Audit escalated to Admin on 09-06-2026 for access authorization.',
        escalatedToAdmin: true,
        adminEscalationDate: '09-06-2026',
        adminEscalationNote: 'Forwarded to Admin for academic records access and audit scope clarification.',
    },
    {
        id: 'ESC-AUD-2026-005',
        escalatedBy: 'A. Khan',
        escalatedByRole: 'Process Audit Executive',
        escalatedById: 'PAE-1001',
        description: 'Transport maintenance logs incomplete — audit evidence gap.',
        escalationDate: '07-06-2026',
        escalatedDepartment: 'Process Audit',
        sourceType: 'audit-executive',
        status: 'Open',
        priority: 'Medium',
        fullDescription:
            'Process audit of Transport department found 6 months of missing brake inspection logs for Route 5 fleet. Transport manager cites vendor delay in digitizing paper records.',
        remarks: 'Part of recurring issue — vehicle maintenance overdue (3 prior occurrences).',
        escalatedToAdmin: false,
        adminEscalationDate: null,
        adminEscalationNote: null,
    },
    {
        id: 'ESC-AUD-2026-004',
        escalatedBy: 'D. Joseph',
        escalatedByRole: 'HR Manager',
        escalatedById: 'HRM-1001',
        description: 'Cross-audit resource conflict — HR and Process teams scheduled same site visit.',
        escalationDate: '06-06-2026',
        escalatedDepartment: 'HR Audit',
        sourceType: 'audit-manager',
        status: 'In Review',
        priority: 'Medium',
        fullDescription:
            'HR Audit and Process Audit teams both scheduled Canteen department site visits on 15-06-2026, causing operational disruption. Requires coordinated single-window audit plan.',
        remarks: 'Proposed combined visit 16-06-2026 — pending Process Audit Manager confirmation.',
        escalatedToAdmin: false,
        adminEscalationDate: null,
        adminEscalationNote: null,
    },
    {
        id: 'ESC-AUD-2026-003',
        escalatedBy: 'R. Mehta',
        escalatedByRole: 'Process Audit Manager',
        escalatedById: 'PAM-1001',
        description: 'IT infrastructure audit — backup failure evidence from prior finding.',
        escalationDate: '05-06-2026',
        escalatedDepartment: 'Process Audit',
        sourceType: 'audit-manager',
        status: 'Resolved',
        priority: 'Critical',
        fullDescription:
            'Follow-up on FND-2026-041 confirmed ERP backup restored and automated schedule verified. Process audit closure documentation submitted.',
        remarks: 'Resolved 06-06-2026 — finding marked for compliance verification.',
        escalatedToAdmin: false,
        adminEscalationDate: null,
        adminEscalationNote: null,
    },
]

export const statusBadgeColor = {
    Open: 'bg-[#FF980033] text-[#FF9800]',
    'In Review': 'bg-[#2196F333] text-[#2196F3]',
    'Escalated to Admin': 'bg-[#515DEF33] text-[#515DEF]',
    Resolved: 'bg-[#4CAF5033] text-[#4CAF50]',
    Closed: 'bg-[#66708533] text-[#667085]',
}

export const priorityBadgeColor = {
    Critical: 'bg-[#FF000033] text-[#FF0000]',
    High: 'bg-[#FF980033] text-[#FF9800]',
    Medium: 'bg-[#2196F333] text-[#2196F3]',
    Low: 'bg-[#66708533] text-[#667085]',
}

export const sourceTypeLabel = {
    'audit-manager': 'From Audit Manager',
    'audit-executive': 'From Audit Executive',
    'audit-principal': 'From Quality Audit Principal',
}
