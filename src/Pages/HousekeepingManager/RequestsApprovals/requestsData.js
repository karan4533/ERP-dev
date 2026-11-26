export const REQUESTS = [
    {
        requestId: 'REQ-HK-2026-005',
        requestType: 'Stock Replenishment',
        title: 'Monthly cleaning supplies restock',
        amount: '₹18,600',
        vendor: 'CleanPro India',
        vendorContact: '+91 98765 11223',
        submittedDate: '10-06-2026',
        currentStage: 'JD Operations',
        status: 'Pending',
        priority: 'High',
        description: 'Restock floor cleaner, disinfectant spray, and garbage bags before exam week deep cleaning.',
        budgetCategory: 'Cleaning Supplies',
        estimatedAmount: '₹18,600',
        requestedBy: 'Rajesh Nair',
        department: 'Housekeeping',
        sentTo: 'JD Operations',
        lineItems: [
            { item: 'Floor Cleaner — Lemon (5L)', quantity: 20, estimatedCost: '₹6,400' },
            { item: 'Disinfectant Spray (500ml)', quantity: 50, estimatedCost: '₹4,750' },
            { item: 'Garbage Bags — Large (Roll of 50)', quantity: 30, estimatedCost: '₹5,400' },
        ],
        attachments: ['cleanpro-quotation-june.pdf'],
    },
    {
        requestId: 'REQ-HK-2026-004',
        requestType: 'Purchase',
        title: 'Replacement mop heads and handles',
        amount: '₹12,400',
        vendor: 'CleanPro India',
        vendorContact: '+91 98765 11223',
        submittedDate: '08-06-2026',
        currentStage: 'Finance Team',
        status: 'Pending',
        priority: 'Medium',
        description: 'Replace worn mop heads and broken handles across all campus zones.',
        budgetCategory: 'Tools & Equipment',
        estimatedAmount: '₹12,400',
        requestedBy: 'Rajesh Nair',
        department: 'Housekeeping',
        sentTo: 'Finance Team',
        lineItems: [
            { item: 'Mop Head — Cotton (Standard)', quantity: 40, estimatedCost: '₹5,800' },
            { item: 'Mop Handle — Metal', quantity: 20, estimatedCost: '₹6,600' },
        ],
        attachments: ['mop-replacement-quote.pdf'],
    },
    {
        requestId: 'REQ-HK-2026-003',
        requestType: 'Purchase',
        title: 'Safety gear — rubber gloves bulk order',
        amount: '₹8,800',
        vendor: 'SafeHands Traders',
        vendorContact: '+91 97654 32109',
        submittedDate: '05-06-2026',
        currentStage: 'Finance Team',
        status: 'Approved',
        priority: 'Medium',
        description: 'Bulk purchase of rubber cleaning gloves for all housekeeping staff.',
        budgetCategory: 'Safety Gear',
        estimatedAmount: '₹8,800',
        requestedBy: 'Rajesh Nair',
        department: 'Housekeeping',
        sentTo: 'Finance Team',
        lineItems: [
            { item: 'Rubber Gloves — Pair (Large)', quantity: 40, estimatedCost: '₹8,800' },
        ],
        attachments: ['safehands-invoice.pdf'],
    },
    {
        requestId: 'REQ-HK-2026-002',
        requestType: 'Stock Replenishment',
        title: 'Toilet bowl cleaner — all blocks',
        amount: '₹4,400',
        vendor: 'HygieneFirst',
        vendorContact: '+91 99887 55443',
        submittedDate: '03-06-2026',
        currentStage: 'JD Operations',
        status: 'Rejected',
        priority: 'Low',
        description: 'Restock toilet bowl cleaner for all restroom blocks — deferred to next quarter.',
        budgetCategory: 'Cleaning Supplies',
        estimatedAmount: '₹4,400',
        requestedBy: 'Rajesh Nair',
        department: 'Housekeeping',
        sentTo: 'JD Operations',
        lineItems: [
            { item: 'Toilet Bowl Cleaner (1L)', quantity: 40, estimatedCost: '₹4,400' },
        ],
        attachments: ['hygienefirst-quote.pdf'],
    },
]

export const REQUEST_TYPE_OPTIONS = ['Purchase', 'Stock Replenishment']

export const PRIORITY_OPTIONS = ['Low', 'Medium', 'High', 'Urgent']

export const BUDGET_CATEGORIES = [
    'Cleaning Supplies',
    'Tools & Equipment',
    'Safety Gear',
    'Disposables',
    'Pest Control',
    'Other',
]

export const AUTO_FILLED = {
    requestedBy: 'Rajesh Nair',
    department: 'Housekeeping',
    sentTo: 'JD Operations',
    status: 'Pending',
}

export const WORKFLOW_STAGES = [
    'Housekeeping Manager',
    'JD Operations',
    'Finance Team',
    'Approved / Rejected',
]

export const statusBadgeColor = {
    Pending: 'bg-[#FF980033] text-[#FF9800]',
    Approved: 'bg-[#4CAF5033] text-[#4CAF50]',
    Rejected: 'bg-[#FF000033] text-[#FF0000]',
}

export const stageBadgeColor = {
    'JD Operations': 'bg-[#515DEF33] text-[#515DEF]',
    'Finance Team': 'bg-[#2196F333] text-[#2196F3]',
}

export const priorityBadgeColor = {
    Low: 'bg-[#66708533] text-[#667085]',
    Medium: 'bg-[#2196F333] text-[#2196F3]',
    High: 'bg-[#FF980033] text-[#FF9800]',
    Urgent: 'bg-[#FF000033] text-[#FF0000]',
}

export const getRequestById = (id) =>
    REQUESTS.find((entry) => entry.requestId === id)
