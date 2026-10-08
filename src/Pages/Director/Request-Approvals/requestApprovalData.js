export const BUDGET_THRESHOLD = 100000
export const MD_APPROVAL_THRESHOLD = 20000

export const PURCHASE_REQUESTS = [
    {
        requestId: 'REQ-2026-001',
        requestDate: '05-03-2026',
        purpose: 'Science lab equipment – microscopes',
        requestedAmount: 45000,
        requestedBy: 'John Milton',
        status: 'Pending',
        description: 'Replacement of 5 classroom microscopes for Class 9 & 10 lab sessions.',
        exceedsBudget: false,
        items: '5 × Laboratory Microscopes, 2 × Slide storage boxes',
        remarks: 'Urgent requirement before practical exams in April.',
    },
    {
        requestId: 'REQ-2026-002',
        requestDate: '06-03-2026',
        purpose: 'Stationery and printing supplies',
        requestedAmount: 28000,
        requestedBy: 'Anita Verma',
        status: 'Pending',
        description: 'Quarterly stationery, printer cartridges, and exam paper printing.',
        exceedsBudget: false,
        items: 'A4 paper (50 reams), ink cartridges, file folders',
        remarks: 'Standard quarterly procurement cycle.',
    },
    {
        requestId: 'REQ-2026-003',
        requestDate: '08-03-2026',
        purpose: 'Smart classroom AV setup – Block B',
        requestedAmount: 250000,
        requestedBy: 'Rajesh Kumar',
        status: 'Pending',
        description: 'Interactive panels and audio systems for 4 classrooms in Block B.',
        exceedsBudget: true,
        items: '4 × Interactive panels, 4 × Speaker systems, installation kit',
        remarks: 'Amount exceeds budget threshold. Awaiting Director decision.',
    },
    {
        requestId: 'REQ-2026-004',
        requestDate: '01-03-2026',
        purpose: 'Sports day event materials',
        requestedAmount: 35000,
        requestedBy: 'Sandy Selva',
        status: 'Approved',
        description: 'Medals, banners, and equipment rental for annual sports day.',
        exceedsBudget: false,
        items: 'Medals (Gold/Silver/Bronze), event banners, sound system rental',
        remarks: 'Approved for annual sports day on 15-03-2026.',
    },
    {
        requestId: 'REQ-2026-005',
        requestDate: '02-03-2026',
        purpose: 'Additional transport vehicle maintenance',
        requestedAmount: 180000,
        requestedBy: 'David Wilson',
        status: 'Rejected',
        description: 'Major bus engine overhaul for Route 7 vehicle.',
        exceedsBudget: true,
        items: 'Engine overhaul parts, labour charges',
        remarks: 'Rejected — deferred to next quarter maintenance budget.',
    },
    {
        requestId: 'REQ-2026-006',
        requestDate: '10-03-2026',
        purpose: 'Library book procurement',
        requestedAmount: 62000,
        requestedBy: 'Sarah Thomas',
        status: 'Pending',
        description: 'New reference books and competitive exam guides for senior classes.',
        exceedsBudget: false,
        items: 'Reference books (120 titles), NEET/JEE guide sets',
        remarks: 'Requested for Class 11 & 12 students.',
    },
    {
        requestId: 'REQ-2026-007',
        requestDate: '11-03-2026',
        purpose: 'Classroom whiteboard markers',
        requestedAmount: 8500,
        requestedBy: 'Meera Iyer',
        status: 'Approved',
        description: 'Restock whiteboard markers for junior classrooms.',
        exceedsBudget: false,
        items: 'Whiteboard markers (assorted colours)',
        remarks: 'Routine classroom supply request.',
    },
]

export const statusBadgeColor = {
    Pending: 'bg-[#FF980033] text-[#FF9800]',
    Approved: 'bg-[#4CAF5033] text-[#4CAF50]',
    Rejected: 'bg-[#FF000033] text-[#FF0000]',
}

export const formatAmount = (amount) => `₹${amount.toLocaleString('en-IN')}`

export const requiresMdApproval = (requestedAmount) => requestedAmount > MD_APPROVAL_THRESHOLD

export const getApprovalStatusLabel = (requestedAmount) =>
    requiresMdApproval(requestedAmount) ? 'MD Approval Status' : 'Status'
