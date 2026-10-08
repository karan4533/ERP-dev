export const ONBOARDING_CHECKLIST_ITEMS = [
    'Offer Letter',
    'Documents Submitted',
    'ID Card Issued',
    'System Access Created',
    'Orientation Completed',
    'Reporting Manager Assigned',
    'Probation Started',
]

export const ONBOARDING_STATUSES = ['Pending', 'In Progress', 'Completed']

export const onboardingStatusBadgeColor = {
    Pending: 'bg-[#66708533] text-[#667085]',
    'In Progress': 'bg-[#FF980033] text-[#FF9800]',
    Completed: 'bg-[#4CAF5033] text-[#4CAF50]',
}

export const ONBOARDING_RECORDS = [
    {
        id: 'ONB-2026-005',
        employeeName: 'Neha Gupta',
        department: 'IT Support',
        joiningDate: '02-06-2026',
        overallStatus: 'In Progress',
        checklist: [
            { item: 'Offer Letter', status: 'Completed' },
            { item: 'Documents Submitted', status: 'Completed' },
            { item: 'ID Card Issued', status: 'Completed' },
            { item: 'System Access Created', status: 'In Progress' },
            { item: 'Orientation Completed', status: 'Pending' },
            { item: 'Reporting Manager Assigned', status: 'Completed' },
            { item: 'Probation Started', status: 'In Progress' },
        ],
    },
    {
        id: 'ONB-2026-004',
        employeeName: 'Kavita Nair',
        department: 'Finance',
        joiningDate: '15-06-2026',
        overallStatus: 'Pending',
        checklist: [
            { item: 'Offer Letter', status: 'Completed' },
            { item: 'Documents Submitted', status: 'In Progress' },
            { item: 'ID Card Issued', status: 'Pending' },
            { item: 'System Access Created', status: 'Pending' },
            { item: 'Orientation Completed', status: 'Pending' },
            { item: 'Reporting Manager Assigned', status: 'Pending' },
            { item: 'Probation Started', status: 'Pending' },
        ],
    },
    {
        id: 'ONB-2026-003',
        employeeName: 'Arjun Verma',
        department: 'Academic',
        joiningDate: '01-07-2026',
        overallStatus: 'Pending',
        checklist: ONBOARDING_CHECKLIST_ITEMS.map((item) => ({
            item,
            status: item === 'Offer Letter' ? 'In Progress' : 'Pending',
        })),
    },
]

export const getOnboardingById = (id) => ONBOARDING_RECORDS.find((record) => record.id === id) ?? null
