export const KPI_CARDS = [
    { label: 'Total Audits Scheduled', value: '24', sub: 'Current quarter plan' },
    { label: 'Audits In Progress', value: '6', sub: 'Active field reviews' },
    { label: 'Completed Audits', value: '14', sub: 'Closed this quarter' },
    { label: 'Pending Findings', value: '18', sub: 'Awaiting remediation' },
    { label: 'Open Compliance Actions', value: '11', sub: 'Assigned owners pending' },
    { label: 'Critical Observations', value: '4', sub: 'Requires immediate attention' },
    { label: 'Compliance Score (%)', value: '91%', sub: 'School-wide average' },
    { label: 'Overdue Actions', value: '3', sub: 'Past due date' },
]

export const UPCOMING_AUDITS = [
    { auditId: 'AUD-2026-014', auditType: 'Financial Compliance', department: 'Finance', scheduledDate: '14-06-2026' },
    { auditId: 'AUD-2026-015', auditType: 'Inventory Verification', department: 'Stationery Store', scheduledDate: '16-06-2026' },
    { auditId: 'AUD-2026-016', auditType: 'Safety & Hygiene', department: 'Housekeeping', scheduledDate: '18-06-2026' },
    { auditId: 'AUD-2026-017', auditType: 'IT Security Review', department: 'IT Support', scheduledDate: '20-06-2026' },
    { auditId: 'AUD-2026-018', auditType: 'Transport Compliance', department: 'Transport', scheduledDate: '22-06-2026' },
]

export const CRITICAL_FINDINGS = [
    { findingId: 'FND-2026-041', department: 'IT Support', severity: 'Critical' },
    { findingId: 'FND-2026-038', department: 'Transport', severity: 'Critical' },
    { findingId: 'FND-2026-035', department: 'Finance', severity: 'High' },
    { findingId: 'FND-2026-032', department: 'Canteen', severity: 'High' },
    { findingId: 'FND-2026-029', department: 'Housekeeping', severity: 'High' },
]

export const COMPLIANCE_SUMMARY = [
    { department: 'Operations', compliance: 92 },
    { department: 'HR', compliance: 88 },
    { department: 'Academic', compliance: 95 },
    { department: 'Finance', compliance: 90 },
    { department: 'Transport', compliance: 86 },
]

export const severityBadgeColor = {
    Critical: 'bg-[#FF000033] text-[#FF0000]',
    High: 'bg-[#FF980033] text-[#FF9800]',
    Medium: 'bg-[#2196F333] text-[#2196F3]',
    Low: 'bg-[#66708533] text-[#667085]',
}

export const AUDIT_TRENDS = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    auditsConducted: [3, 4, 5, 4, 6, 5],
    findingsRaised: [8, 10, 12, 9, 14, 11],
    findingsClosed: [6, 8, 9, 11, 10, 9],
}

export const CHART_COLORS = {
    primary: '#515DEF',
    success: '#4CAF50',
    warning: '#FF9800',
    danger: '#FF5722',
    info: '#2196F3',
}
