export const MONITORING_STATUSES = ['In Progress', 'Completed']

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

export const AUDIT_MONITORING = [
    {
        id: 'AUD-2026-016',
        title: 'Staff Attendance & HR Compliance',
        department: 'HR',
        auditor: 'A. Khan',
        progress: 65,
        findingsRaised: 4,
        pendingActions: 2,
        status: 'In Progress',
        startedDate: '18-06-2026',
        dueDate: '22-06-2026',
        completionPercent: 65,
        findingsCount: 4,
        complianceScore: 84,
        auditorComments:
            'Leave policy documentation reviewed for 12 staff files. Two departments missing signed acknowledgment forms. Follow-up scheduled with HR coordinator on 20-06-2026.',
        escalations:
            'Escalation raised on 19-06-2026: Missing onboarding files for 3 contract staff — forwarded to Joint Director office for document recovery.',
    },
    {
        id: 'AUD-2026-011',
        title: 'Academic Assessment Quality Review',
        department: 'Academic',
        auditor: 'S. Priya',
        progress: 100,
        findingsRaised: 3,
        pendingActions: 0,
        status: 'Completed',
        startedDate: '02-06-2026',
        dueDate: '06-06-2026',
        completionPercent: 100,
        findingsCount: 3,
        complianceScore: 95,
        auditorComments:
            'All assessment moderation records verified. Minor grading entry discrepancies in Class 10 Maths resolved during audit. Final report submitted to Academic Head.',
        escalations: 'No escalations during this audit cycle.',
    },
    {
        id: 'AUD-2026-019',
        title: 'Canteen Food Safety Process Audit',
        department: 'Canteen',
        auditor: 'R. Mehta',
        progress: 42,
        findingsRaised: 6,
        pendingActions: 4,
        status: 'In Progress',
        startedDate: '12-06-2026',
        dueDate: '17-06-2026',
        completionPercent: 42,
        findingsCount: 6,
        complianceScore: 78,
        auditorComments:
            'Kitchen hygiene checklist partially completed. Cold storage temperature logs missing for 3 days last week. Vendor invoice cross-check in progress.',
        escalations:
            'Critical finding ESC-AUD-2026-003: Refrigeration unit in secondary kitchen below safe temperature — escalated to Canteen Manager and Housekeeping for immediate action.',
    },
    {
        id: 'AUD-2026-020',
        title: 'Transport Fleet Maintenance Review',
        department: 'Transport',
        auditor: 'D. Joseph',
        progress: 88,
        findingsRaised: 5,
        pendingActions: 1,
        status: 'In Progress',
        startedDate: '08-06-2026',
        dueDate: '15-06-2026',
        completionPercent: 88,
        findingsCount: 5,
        complianceScore: 86,
        auditorComments:
            'Vehicle maintenance logs reviewed for 22 active buses. Route 5 brake inspection documentation pending. Driver compliance training records verified.',
        escalations:
            'Route 5 bus (TN-09-AB-4521) brake failure finding linked to transport escalation ESC-2026-016 — monitoring closure with Transport Manager.',
    },
    {
        id: 'AUD-2026-021',
        title: 'IT Access Control & Backup Audit',
        department: 'IT Support',
        auditor: 'V. Lakshmi',
        progress: 100,
        findingsRaised: 7,
        pendingActions: 0,
        status: 'Completed',
        startedDate: '01-06-2026',
        dueDate: '05-06-2026',
        completionPercent: 100,
        findingsCount: 7,
        complianceScore: 91,
        auditorComments:
            'ERP backup schedule restored after 3-day failure window. Network switch access logs reviewed. Lab admin accounts audited — 2 dormant accounts deactivated.',
        escalations: 'Network switch failure in Block C referenced in IT escalation ESC-2026-018 — remediation verified and closed.',
    },
    {
        id: 'AUD-2026-022',
        title: 'Finance Petty Cash Reconciliation',
        department: 'Finance',
        auditor: 'R. Mehta',
        progress: 55,
        findingsRaised: 2,
        pendingActions: 2,
        status: 'In Progress',
        startedDate: '14-06-2026',
        dueDate: '18-06-2026',
        completionPercent: 55,
        findingsCount: 2,
        complianceScore: 89,
        auditorComments:
            'Q2 petty cash vouchers sampled (45 of 120). Two unsupported reimbursements identified. Purchase order matching for vendor payments ongoing.',
        escalations: 'None at this stage — pending finance controller response on unsupported vouchers.',
    },
]

export const getAuditMonitoringById = (id) =>
    AUDIT_MONITORING.find((item) => item.id === id) ?? null

export const statusBadgeColor = {
    'In Progress': 'bg-[#FF980033] text-[#FF9800]',
    Completed: 'bg-[#4CAF5033] text-[#4CAF50]',
}

export const progressBarColor = (progress) => {
    if (progress >= 100) return 'bg-[#4CAF50]'
    if (progress >= 70) return 'bg-[#515DEF]'
    if (progress >= 40) return 'bg-[#FF9800]'
    return 'bg-[#FF5722]'
}
