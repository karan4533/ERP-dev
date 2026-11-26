export const REQUESTS = [
    {
        requestId: 'REQ-SS-2026-008',
        requestType: 'Stock Replenishment',
        title: 'Monthly A4 paper and pen restock',
        amount: '₹15,400',
        vendor: 'PaperPro Supplies',
        vendorContact: '+91 91234 56789',
        submittedDate: '10-06-2026',
        currentStage: 'JD Operations',
        status: 'Pending',
        priority: 'High',
        description: 'Restock low-inventory items — A4 paper reams and blue ballpoint pens before exam week.',
        budgetCategory: 'Consumables',
        estimatedAmount: '₹15,400',
        requestedBy: 'Meena Kapoor',
        department: 'Stationery Store',
        sentTo: 'JD Operations',
        lineItems: [
            { item: 'A4 Paper Ream (500 sheets)', quantity: 40, estimatedCost: '₹11,200' },
            { item: 'Blue Ballpoint Pen', quantity: 200, estimatedCost: '₹2,400' },
            { item: 'Stapler Pins (Box of 1000)', quantity: 10, estimatedCost: '₹450' },
        ],
        attachments: ['quotation-paperpro-june.pdf'],
    },
    {
        requestId: 'REQ-SS-2026-007',
        requestType: 'Purchase',
        title: 'Bulk notebook order for new academic year',
        amount: '₹48,750',
        vendor: 'Classmate Wholesale',
        vendorContact: '+91 99887 76655',
        submittedDate: '08-06-2026',
        currentStage: 'Finance Team',
        status: 'Pending',
        priority: 'Medium',
        description: 'Advance purchase of spiral notebooks for distribution to all classes at term start.',
        budgetCategory: 'Stationery Supplies',
        estimatedAmount: '₹48,750',
        requestedBy: 'Meena Kapoor',
        department: 'Stationery Store',
        sentTo: 'Finance Team',
        lineItems: [
            { item: 'Spiral Notebook — 200 pages', quantity: 750, estimatedCost: '₹48,750' },
        ],
        attachments: ['classmate-bulk-quote.pdf', 'requirement-sheet.xlsx'],
    },
    {
        requestId: 'REQ-SS-2026-006',
        requestType: 'Purchase',
        title: 'Printer cartridges — admin block',
        amount: '₹17,000',
        vendor: 'PrintTech Solutions',
        vendorContact: '+91 97654 32109',
        submittedDate: '05-06-2026',
        currentStage: 'Finance Team',
        status: 'Approved',
        priority: 'Medium',
        description: 'Replacement HP 803 cartridges for admin and front office printers.',
        budgetCategory: 'Printer Supplies',
        estimatedAmount: '₹17,000',
        requestedBy: 'Meena Kapoor',
        department: 'Stationery Store',
        sentTo: 'Finance Team',
        lineItems: [
            { item: 'HP 803 Black Ink Cartridge', quantity: 20, estimatedCost: '₹17,000' },
        ],
        attachments: ['printtech-invoice.pdf'],
    },
    {
        requestId: 'REQ-SS-2026-005',
        requestType: 'Stock Replenishment',
        title: 'Whiteboard markers and art supplies',
        amount: '₹6,200',
        vendor: 'Creative Stationers',
        vendorContact: '+91 90123 45678',
        submittedDate: '03-06-2026',
        currentStage: 'JD Operations',
        status: 'Rejected',
        priority: 'Low',
        description: 'Restock whiteboard markers for science and math departments.',
        budgetCategory: 'Art Supplies',
        estimatedAmount: '₹6,200',
        requestedBy: 'Meena Kapoor',
        department: 'Stationery Store',
        sentTo: 'JD Operations',
        lineItems: [
            { item: 'Whiteboard Marker — Black', quantity: 50, estimatedCost: '₹1,750' },
            { item: 'Whiteboard Marker — Blue', quantity: 50, estimatedCost: '₹1,750' },
            { item: 'Chart Paper (Pack)', quantity: 20, estimatedCost: '₹2,700' },
        ],
        attachments: ['creative-stationers-quote.pdf'],
    },
    {
        requestId: 'REQ-SS-2026-004',
        requestType: 'Purchase',
        title: 'Filing supplies for records office',
        amount: '₹9,800',
        vendor: 'Office Mart India',
        vendorContact: '+91 98765 43210',
        submittedDate: '01-06-2026',
        currentStage: 'Finance Team',
        status: 'Approved',
        priority: 'Low',
        description: 'Files, folders, and labels for records office annual filing.',
        budgetCategory: 'Office Supplies',
        estimatedAmount: '₹9,800',
        requestedBy: 'Meena Kapoor',
        department: 'Stationery Store',
        sentTo: 'Finance Team',
        lineItems: [
            { item: 'Lever Arch File', quantity: 100, estimatedCost: '₹5,000' },
            { item: 'Label Sheets (A4)', quantity: 20, estimatedCost: '₹4,800' },
        ],
        attachments: ['office-mart-proposal.pdf'],
    },
]

export const REQUEST_TYPE_OPTIONS = ['Purchase', 'Stock Replenishment']

export const PRIORITY_OPTIONS = ['Low', 'Medium', 'High', 'Urgent']

export const BUDGET_CATEGORIES = [
    'Consumables',
    'Stationery Supplies',
    'Printer Supplies',
    'Art Supplies',
    'Office Supplies',
    'Other',
]

export const AUTO_FILLED = {
    requestedBy: 'Meena Kapoor',
    department: 'Stationery Store',
    sentTo: 'JD Operations',
    status: 'Pending',
}

export const WORKFLOW_STAGES = [
    'Stationery Store Manager',
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
