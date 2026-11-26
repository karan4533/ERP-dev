export const REQUEST_TYPE_OPTIONS = [
    'Equipment Purchase',
    'AMC Renewal / Servicing',
    'Stock Replenishment',
    'Emergency Repair',
]

export const PRIORITY_OPTIONS = ['Low', 'Medium', 'High', 'Urgent']

export const BUDGET_CATEGORIES = [
    'Electrical Maintenance',
    'Plumbing & Drainage',
    'Campus Equipment AMC',
    'HVAC & Air Conditioning',
    'Civil Repairs & Carpentry',
    'Power Backup & Generator',
    'Safety Tools & Gear',
    'Other',
]

export const AUTO_FILLED = {
    requestedBy: 'Gopalakrishnan R',
    department: 'Maintenance',
    sentTo: 'JD Operations',
    status: 'Pending',
}

export const REQUESTS = [
    {
        requestId: 'REQ-MNT-2026-003',
        requestType: 'AMC Renewal / Servicing',
        title: 'Cummins 250kVA DG Annual Maintenance Contract Renewal',
        amount: '₹48,000',
        vendor: 'Cummins India Service Partner',
        vendorContact: '+91 94450 11223',
        submittedDate: '18-10-2026',
        currentStage: 'JD Operations',
        status: 'Pending',
        priority: 'High',
        description: 'Comprehensive annual maintenance contract covering quarterly visits, 24/7 breakdown support, and oil/coolant analysis for main campus generator.',
        budgetCategory: 'Campus Equipment AMC',
        estimatedAmount: '₹48,000',
        requestedBy: 'Gopalakrishnan R',
        department: 'Maintenance',
        sentTo: 'JD Operations',
        lineItems: [
            { item: 'Cummins 250kVA Annual Comprehensive AMC', quantity: 1, estimatedCost: '₹38,000' },
            { item: 'Pre-service Major Consumables Kit (Air/Fuel Filters)', quantity: 1, estimatedCost: '₹10,000' },
        ],
        attachments: ['cummins-amc-quotation-2026-27.pdf'],
    },
    {
        requestId: 'REQ-MNT-2026-002',
        requestType: 'Stock Replenishment',
        title: 'Replenishment of MCBs, LED Panels, and Distribution Spares',
        amount: '₹24,500',
        vendor: 'Larsen & Toubro / Schneider Authorized Distributor',
        vendorContact: '+91 94441 22334',
        submittedDate: '15-10-2026',
        currentStage: 'Finance Team',
        status: 'Pending',
        priority: 'Medium',
        description: 'Emergency stock replenishment for floor distribution boards and replacement LED panels for Block A & B classrooms.',
        budgetCategory: 'Electrical Maintenance',
        estimatedAmount: '₹24,500',
        requestedBy: 'Gopalakrishnan R',
        department: 'Maintenance',
        sentTo: 'Finance Team',
        lineItems: [
            { item: 'MCB 32A Triple Pole (Schneider)', quantity: 10, estimatedCost: '₹9,500' },
            { item: '40W LED Panel Light 2x2 Recessed (Philips)', quantity: 15, estimatedCost: '₹15,000' },
        ],
        attachments: ['electrical-spares-indent-oct2026.pdf'],
    },
    {
        requestId: 'REQ-MNT-2026-001',
        requestType: 'Equipment Purchase',
        title: 'Submersible Sump Dewatering Pump 3HP (Kirloskar)',
        amount: '₹28,200',
        vendor: 'Southern Pipe & Fittings Agency',
        vendorContact: '+91 97909 33441',
        submittedDate: '05-10-2026',
        currentStage: 'Approved',
        status: 'Approved',
        priority: 'High',
        description: 'Replacement heavy-duty dewatering pump for basement stormwater sump before monsoon.',
        budgetCategory: 'Plumbing & Drainage',
        estimatedAmount: '₹28,200',
        requestedBy: 'Gopalakrishnan R',
        department: 'Maintenance',
        sentTo: 'Finance Team',
        lineItems: [
            { item: 'Kirloskar 3HP Submersible Dewatering Pump', quantity: 1, estimatedCost: '₹26,000' },
            { item: 'Heavy Duty 2" Flexible Discharge Hose (30m)', quantity: 1, estimatedCost: '₹2,200' },
        ],
        attachments: ['kirloskar-pump-invoice-po.pdf'],
    },
]

export const WORKFLOW_STAGES = [
    'Maintenance Manager',
    'JD Operations',
    'Finance Team',
    'Approved / Rejected',
]

export const getRequestById = (id) =>
    REQUESTS.find((entry) => entry.requestId === id) || null
