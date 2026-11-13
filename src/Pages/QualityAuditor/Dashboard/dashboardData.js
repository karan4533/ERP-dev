export const KPI_CARDS = [
    { label: "Today's Audits", value: '3', sub: 'Scheduled for today' },
    { label: 'Pending Audits', value: '9', sub: 'Assigned, not yet started' },
    { label: 'Completed Audits', value: '28', sub: 'Closed this quarter' },
    { label: 'Overdue Audits', value: '2', sub: 'Past scheduled date' },
    { label: 'Open Observations', value: '7', sub: 'Awaiting corrective action' },
    { label: 'Escalated Issues', value: '4', sub: 'Non-compliance escalated' },
    { label: 'Average Compliance %', value: '89%', sub: 'Across audited departments' },
    { label: 'Departments Audited', value: '12', sub: 'Unique departments covered' },
]

export const MONTHLY_COMPLIANCE_TREND = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    values: [84, 86, 87, 88, 89, 89],
}

export const DEPARTMENT_COMPLIANCE = [
    { department: 'Finance', compliance: 92 },
    { department: 'HR', compliance: 86 },
    { department: 'Academic', compliance: 94 },
    { department: 'Transport', compliance: 88 },
    { department: 'IT Support', compliance: 85 },
    { department: 'Canteen', compliance: 90 },
    { department: 'Housekeeping', compliance: 87 },
    { department: 'Store', compliance: 91 },
]

export const OBSERVATION_STATUS = [
    { name: 'Open', value: 7 },
    { name: 'Under Review', value: 4 },
    { name: 'RCA Pending', value: 3 },
    { name: 'ATR Pending', value: 2 },
    { name: 'Closed', value: 18 },
]

export const AUDIT_COMPLETION = {
    completed: 28,
    total: 42,
    percentage: 67,
}

export const UPCOMING_AUDITS_CALENDAR = [
    { date: '10-06-2026', day: 'Tue', auditId: 'AUD-PA-2026-044', department: 'Store', auditType: 'Inventory Control' },
    { date: '12-06-2026', day: 'Thu', auditId: 'AUD-PA-2026-045', department: 'Housekeeping', auditType: 'Safety & Hygiene' },
    { date: '14-06-2026', day: 'Sat', auditId: 'AUD-PA-2026-046', department: 'Transport', auditType: 'Fleet Compliance' },
    { date: '16-06-2026', day: 'Mon', auditId: 'AUD-PA-2026-047', department: 'Finance', auditType: 'Fee Collection Process' },
    { date: '18-06-2026', day: 'Wed', auditId: 'AUD-PA-2026-048', department: 'Academic', auditType: 'Examination Workflow' },
    { date: '20-06-2026', day: 'Fri', auditId: 'AUD-PA-2026-049', department: 'IT Support', auditType: 'Data Backup Policy' },
]

export const RECENT_ACTIVITY = [
    {
        id: 'ACT-001',
        type: 'Audit Submitted',
        reference: 'AUD-PA-2026-040',
        department: 'Finance',
        description: 'Petty cash audit report submitted for review.',
        date: '09-06-2026',
        time: '04:30 PM',
    },
    {
        id: 'ACT-002',
        type: 'Observation Raised',
        reference: 'OBS-2026-1042',
        department: 'Transport',
        description: 'Trip log entries missing for 3 routes.',
        date: '08-06-2026',
        time: '02:15 PM',
    },
    {
        id: 'ACT-003',
        type: 'RCA Received',
        reference: 'RCA-2026-0088',
        department: 'IT Support',
        description: 'Root cause analysis received for access control gap.',
        date: '07-06-2026',
        time: '11:00 AM',
    },
    {
        id: 'ACT-004',
        type: 'ATR Approved',
        reference: 'ATR-2026-0056',
        department: 'Canteen',
        description: 'Action taken report approved after kitchen hygiene fix.',
        date: '06-06-2026',
        time: '03:45 PM',
    },
    {
        id: 'ACT-005',
        type: 'Escalation Closed',
        reference: 'ESC-2026-012',
        department: 'HR',
        description: 'Onboarding checklist non-compliance escalation closed.',
        date: '05-06-2026',
        time: '10:20 AM',
    },
]

export const activityTypeBadgeColor = {
    'Audit Submitted': 'bg-[#515DEF33] text-[#515DEF]',
    'Observation Raised': 'bg-[#FF980033] text-[#FF9800]',
    'RCA Received': 'bg-[#2196F333] text-[#2196F3]',
    'ATR Approved': 'bg-[#4CAF5033] text-[#4CAF50]',
    'Escalation Closed': 'bg-[#9C27B033] text-[#9C27B0]',
}

export const CHART_COLORS = {
    primary: '#515DEF',
    success: '#4CAF50',
    warning: '#FF9800',
    danger: '#FF5722',
    info: '#2196F3',
    purple: '#9C27B0',
    pie: ['#515DEF', '#FF9800', '#2196F3', '#9C27B0', '#4CAF50'],
}
