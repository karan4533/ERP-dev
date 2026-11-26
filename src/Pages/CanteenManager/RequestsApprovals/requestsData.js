export const REQUESTS = [
    {
        requestId: 'REQ-2026-001',
        requestType: 'Stock',
        title: 'Monthly rice and dal procurement',
        requestedAmount: '₹45,000',
        priority: 'High',
        submittedDate: '08-06-2026',
        sentTo: 'Operations Head',
        status: 'Pending',
        approvalDate: '—',
        description: 'Restock basmati rice and toor dal for June lunch service. Current stock below reorder level.',
        requiredByDate: '15-06-2026',
        budgetCategory: 'Food Supplies',
        requestedBy: 'Rajesh Kumar',
        department: 'Canteen',
    },
    {
        requestId: 'REQ-2026-002',
        requestType: 'Equipment',
        title: 'Commercial mixer grinder replacement',
        requestedAmount: '₹28,500',
        priority: 'Urgent',
        submittedDate: '05-06-2026',
        sentTo: 'Operations Head',
        status: 'Approved',
        approvalDate: '07-06-2026',
        description: 'Existing mixer failed during morning prep. Need replacement for chapati and batter preparation.',
        requiredByDate: '10-06-2026',
        budgetCategory: 'Kitchen Equipment',
        requestedBy: 'Rajesh Kumar',
        department: 'Canteen',
    },
    {
        requestId: 'REQ-2026-003',
        requestType: 'Vendor Bill',
        title: 'Fresh vegetables vendor invoice — May 2026',
        requestedAmount: '₹62,000',
        priority: 'Medium',
        submittedDate: '02-06-2026',
        sentTo: 'Operations Head',
        status: 'Approved',
        approvalDate: '04-06-2026',
        description: 'Payment approval for Green Farm Supplies monthly vegetable delivery invoice.',
        requiredByDate: '08-06-2026',
        budgetCategory: 'Vendor Payments',
        requestedBy: 'Rajesh Kumar',
        department: 'Canteen',
    },
    {
        requestId: 'REQ-2026-004',
        requestType: 'Maintenance',
        title: 'Walk-in refrigerator gas refill',
        requestedAmount: '₹8,500',
        priority: 'High',
        submittedDate: '01-06-2026',
        sentTo: 'Operations Head',
        status: 'Rejected',
        approvalDate: '03-06-2026',
        description: 'Main storage refrigerator not cooling adequately. Technician quoted gas refill and seal check.',
        requiredByDate: '05-06-2026',
        budgetCategory: 'Maintenance',
        requestedBy: 'Rajesh Kumar',
        department: 'Canteen',
    },
    {
        requestId: 'REQ-2026-005',
        requestType: 'Stock',
        title: 'Disposable plates and cups restock',
        requestedAmount: '₹12,000',
        priority: 'Low',
        submittedDate: '10-06-2026',
        sentTo: 'Operations Head',
        status: 'Pending',
        approvalDate: '—',
        description: 'Eco-friendly disposable serveware for event day orders and overflow counter service.',
        requiredByDate: '18-06-2026',
        budgetCategory: 'Consumables',
        requestedBy: 'Rajesh Kumar',
        department: 'Canteen',
    },
]

export const REQUEST_TYPE_OPTIONS = [
    { value: 'Stock Purchase', label: 'Stock Purchase', listLabel: 'Stock' },
    { value: 'Kitchen Equipment', label: 'Kitchen Equipment', listLabel: 'Equipment' },
    { value: 'Vendor Bill', label: 'Vendor Bill', listLabel: 'Vendor Bill' },
    { value: 'Maintenance', label: 'Maintenance', listLabel: 'Maintenance' },
    { value: 'Other', label: 'Other', listLabel: 'Other' },
]

export const PRIORITY_OPTIONS = ['Low', 'Medium', 'High', 'Urgent']

export const BUDGET_CATEGORIES = [
    'Food Supplies',
    'Kitchen Equipment',
    'Vendor Payments',
    'Maintenance',
    'Consumables',
    'Other',
]

export const AUTO_FILLED = {
    requestedBy: 'Rajesh Kumar',
    department: 'Canteen',
    sentTo: 'Operations Head',
    status: 'Pending',
}

export const priorityBadgeColor = {
    Low: 'bg-[#66708533] text-[#667085]',
    Medium: 'bg-[#2196F333] text-[#2196F3]',
    High: 'bg-[#FF980033] text-[#FF9800]',
    Urgent: 'bg-[#FF000033] text-[#FF0000]',
}

export const statusBadgeColor = {
    Pending: 'bg-[#FF980033] text-[#FF9800]',
    Approved: 'bg-[#4CAF5033] text-[#4CAF50]',
    Rejected: 'bg-[#FF000033] text-[#FF0000]',
}
