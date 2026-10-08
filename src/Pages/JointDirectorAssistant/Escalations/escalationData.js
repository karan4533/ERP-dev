export const DEPARTMENTS = [
    'Canteen',
    'Stationery Store',
    'IT Support',
    'Transport',
    'Housekeeping',
]

export const ESCALATION_STATUSES = ['Open', 'In Review', 'Escalated to Admin', 'Resolved', 'Closed']

export const ESCALATIONS = [
    {
        id: 'ESC-2026-018',
        escalatedBy: 'Karthik Rajan',
        escalatedByRole: 'IT Support Team Manager',
        escalatedById: 'ITM-1001',
        description: 'Network switch failure in Block C — all lab sessions disrupted.',
        escalationDate: '10-06-2026',
        escalatedDepartment: 'IT Support',
        sourceType: 'department-manager',
        status: 'Open',
        priority: 'Critical',
        fullDescription:
            'Core network switch in Block C computer labs failed on 09-06-2026. All 4 labs offline affecting 480 students. Replacement parts quoted at ₹95,000 with 3-day lead time. IT team cannot resolve without emergency procurement approval beyond departmental limit.',
        remarks: 'Critical — internal assessments scheduled from 12-06-2026.',
        escalatedToAdmin: false,
        adminEscalationDate: null,
        adminEscalationNote: null,
    },
    {
        id: 'ESC-2026-017',
        escalatedBy: 'Anitha Nair',
        escalatedByRole: 'Housekeeping Manager',
        escalatedById: 'HKM-1001',
        description: 'Sanitation supply shortage — exam week deep cleaning at risk.',
        escalationDate: '09-06-2026',
        escalatedDepartment: 'Housekeeping',
        sourceType: 'department-manager',
        status: 'In Review',
        priority: 'High',
        fullDescription:
            'Industrial disinfectant and floor cleaner stock depleted across all zones. Vendor delivery delayed by 5 days. Exam-week deep cleaning schedule for 18 classrooms cannot proceed without emergency supply authorization.',
        remarks: 'Reorder request JD-REQ-2026-008 approved but delivery pending.',
        escalatedToAdmin: false,
        adminEscalationDate: null,
        adminEscalationNote: null,
    },
    {
        id: 'ESC-2026-016',
        escalatedBy: 'Suresh Iyer',
        escalatedByRole: 'Transport Manager',
        escalatedById: 'TM-1001',
        description: 'Route 5 bus brake failure — vehicle grounded, 42 students affected.',
        escalationDate: '08-06-2026',
        escalatedDepartment: 'Transport',
        sourceType: 'department-manager',
        status: 'Escalated to Admin',
        priority: 'High',
        fullDescription:
            'Safety inspection flagged critical brake wear on Route 5 bus (TN-09-AB-4521). Vehicle grounded immediately. Replacement cost ₹68,000 exceeds transport quarterly maintenance budget. Temporary alternate vehicle rental adds ₹12,000/day.',
        remarks: 'Joint Director escalated to Admin on 09-06-2026 for emergency fleet budget approval.',
        escalatedToAdmin: true,
        adminEscalationDate: '09-06-2026',
        adminEscalationNote: 'Forwarded to Admin for emergency transport maintenance budget and rental vehicle authorization.',
    },
    {
        id: 'ESC-2026-015',
        escalatedBy: 'Ravi Menon',
        escalatedByRole: 'Canteen Manager',
        escalatedById: 'CM-1001',
        description: 'Food warmer breakdown during peak lunch service — service disruption.',
        escalationDate: '07-06-2026',
        escalatedDepartment: 'Canteen',
        sourceType: 'department-manager',
        status: 'Open',
        priority: 'Medium',
        fullDescription:
            'Two commercial food warmers failed simultaneously during lunch service affecting 180+ students. Repair estimate ₹18,000; replacement quote ₹52,000. Canteen operating with reduced capacity until resolved.',
        remarks: 'Financial request JD-REQ-2026-001 submitted separately for equipment upgrade.',
        escalatedToAdmin: false,
        adminEscalationDate: null,
        adminEscalationNote: null,
    },
    {
        id: 'ESC-2026-014',
        escalatedBy: 'Lakshmi Devi',
        escalatedByRole: 'Store Manager',
        escalatedById: 'SM-1001',
        description: 'A4 paper stock out — exam answer sheet printing halted.',
        escalationDate: '06-06-2026',
        escalatedDepartment: 'Stationery Store',
        sourceType: 'department-manager',
        status: 'In Review',
        priority: 'Medium',
        fullDescription:
            'A4 paper inventory at zero units. Exam answer sheet printing for 2,400 students halted. Primary vendor on credit hold; alternate vendor requires advance payment of ₹38,000 not covered under current store operating budget.',
        remarks: 'Urgent procurement needed before 11-06-2026 printing deadline.',
        escalatedToAdmin: false,
        adminEscalationDate: null,
        adminEscalationNote: null,
    },
    {
        id: 'ESC-2026-012',
        escalatedBy: 'Karthik Rajan',
        escalatedByRole: 'IT Support Team Manager',
        escalatedById: 'ITM-1001',
        description: 'ERP server backup failure — data recovery risk identified.',
        escalationDate: '03-06-2026',
        escalatedDepartment: 'IT Support',
        sourceType: 'department-manager',
        status: 'Resolved',
        priority: 'Critical',
        fullDescription:
            'Automated ERP backup job failed for 3 consecutive nights. Root cause: storage array reaching capacity. IT team cleared legacy backups and restored automated schedule. No data loss confirmed.',
        remarks: 'Resolved by IT team on 04-06-2026. Storage expansion planned for Q3.',
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
    'department-manager': 'From Department Manager',
}
