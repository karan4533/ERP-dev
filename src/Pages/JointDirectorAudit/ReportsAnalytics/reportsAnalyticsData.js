export const AUDIT_SUMMARY_REPORT = [
    { auditId: 'AUD-2026-014', department: 'Finance', type: 'Process', findings: 2, status: 'Planned' },
    { auditId: 'AUD-2026-015', department: 'Stationery Store', type: 'Quality', findings: 0, status: 'Planned' },
    { auditId: 'AUD-2026-016', department: 'HR', type: 'HR', findings: 4, status: 'In Progress' },
    { auditId: 'AUD-2026-017', department: 'IT Support', type: 'Special', findings: 0, status: 'Planned' },
    { auditId: 'AUD-2026-018', department: 'Transport', type: 'Process', findings: 0, status: 'Planned' },
    { auditId: 'AUD-2026-011', department: 'Academic', type: 'Quality', findings: 3, status: 'Completed' },
    { auditId: 'AUD-2026-019', department: 'Canteen', type: 'Process', findings: 6, status: 'In Progress' },
    { auditId: 'AUD-2026-020', department: 'Transport', type: 'Process', findings: 5, status: 'In Progress' },
    { auditId: 'AUD-2026-021', department: 'IT Support', type: 'Special', findings: 7, status: 'Completed' },
    { auditId: 'AUD-2026-022', department: 'Finance', type: 'Process', findings: 2, status: 'In Progress' },
]

export const FINDINGS_ANALYSIS_REPORT = [
    { findingId: 'FND-2026-041', department: 'IT Support', severity: 'Critical', status: 'In Progress' },
    { findingId: 'FND-2026-038', department: 'Transport', severity: 'Critical', status: 'Open' },
    { findingId: 'FND-2026-035', department: 'Finance', severity: 'High', status: 'In Progress' },
    { findingId: 'FND-2026-032', department: 'Canteen', severity: 'High', status: 'In Progress' },
    { findingId: 'FND-2026-029', department: 'Housekeeping', severity: 'High', status: 'Open' },
    { findingId: 'FND-2026-024', department: 'Academic', severity: 'Medium', status: 'Closed' },
    { findingId: 'FND-2026-021', department: 'HR', severity: 'Medium', status: 'In Progress' },
    { findingId: 'FND-2026-018', department: 'Canteen', severity: 'Low', status: 'Open' },
]

export const COMPLIANCE_PERFORMANCE_REPORT = [
    { department: 'Operations', totalFindings: 12, closed: 9, pending: 3, compliance: 92 },
    { department: 'HR', totalFindings: 8, closed: 5, pending: 3, compliance: 88 },
    { department: 'Academic', totalFindings: 6, closed: 5, pending: 1, compliance: 95 },
    { department: 'Finance', totalFindings: 7, closed: 4, pending: 3, compliance: 90 },
    { department: 'Transport', totalFindings: 9, closed: 5, pending: 4, compliance: 86 },
    { department: 'IT Support', totalFindings: 11, closed: 6, pending: 5, compliance: 91 },
    { department: 'Canteen', totalFindings: 10, closed: 5, pending: 5, compliance: 78 },
    { department: 'Housekeeping', totalFindings: 7, closed: 4, pending: 3, compliance: 84 },
]

export const RECURRING_ISSUES_REPORT = [
    { department: 'Canteen', issueType: 'Food safety / temperature control', occurrences: 4 },
    { department: 'Transport', issueType: 'Vehicle maintenance overdue', occurrences: 3 },
    { department: 'IT Support', issueType: 'Backup & network infrastructure failure', occurrences: 3 },
    { department: 'HR', issueType: 'Missing policy acknowledgment forms', occurrences: 2 },
    { department: 'Finance', issueType: 'Unsupported petty cash vouchers', occurrences: 2 },
    { department: 'Housekeeping', issueType: 'Sanitation supply stock depletion', occurrences: 2 },
    { department: 'Academic', issueType: 'Grade entry discrepancies', occurrences: 1 },
]

export const RISK_ANALYSIS_REPORT = [
    { riskArea: 'Network Infrastructure Failure', department: 'IT Support', severity: 'Critical', status: 'Active' },
    { riskArea: 'Vehicle Safety Non-Compliance', department: 'Transport', severity: 'Critical', status: 'Active' },
    { riskArea: 'Food Storage Temperature Breach', department: 'Canteen', severity: 'High', status: 'Active' },
    { riskArea: 'Exam-Week Sanitation Shortage', department: 'Housekeeping', severity: 'High', status: 'Monitoring' },
    { riskArea: 'Financial Control Weakness', department: 'Finance', severity: 'High', status: 'Monitoring' },
    { riskArea: 'HR Documentation Gaps', department: 'HR', severity: 'Medium', status: 'Monitoring' },
    { riskArea: 'Assessment Data Integrity', department: 'Academic', severity: 'Medium', status: 'Mitigated' },
    { riskArea: 'Kitchen Hygiene Process Gap', department: 'Canteen', severity: 'Low', status: 'Monitoring' },
]

export const severityBadgeColor = {
    Low: 'bg-[#66708533] text-[#667085]',
    Medium: 'bg-[#2196F333] text-[#2196F3]',
    High: 'bg-[#FF980033] text-[#FF9800]',
    Critical: 'bg-[#FF000033] text-[#FF0000]',
}

export const statusBadgeColor = {
    Planned: 'bg-[#515DEF33] text-[#515DEF]',
    'In Progress': 'bg-[#FF980033] text-[#FF9800]',
    Completed: 'bg-[#4CAF5033] text-[#4CAF50]',
    Open: 'bg-[#FF980033] text-[#FF9800]',
    Closed: 'bg-[#4CAF5033] text-[#4CAF50]',
    Active: 'bg-[#FF000033] text-[#FF0000]',
    Monitoring: 'bg-[#FF980033] text-[#FF9800]',
    Mitigated: 'bg-[#4CAF5033] text-[#4CAF50]',
}

export const REPORT_PERIODS = ['Current Quarter', 'Last Quarter', 'Last 6 Months', 'Year to Date']
