const STORAGE_KEY = 'schoolerp-super-admin-approvals'

export const ROUTE_BASE = '/super-admin/approvals'

export const REQUESTED_TO = 'Super Admin'

export const APPROVAL_STATUSES = ['Pending', 'Approved', 'Rejected']

export const REQUEST_CATEGORIES = [
    'Finance Request',
    'Data Change Request',
    'HR Request',
    'Procurement Request',
    'Budget Request',
    'Policy Change Request',
]

export const PRIORITY_LEVELS = ['High', 'Normal', 'Low']

export const statusBadgeColor = {
    Pending: 'bg-[#FF980033] text-[#FF9800]',
    Approved: 'bg-[#4CAF5033] text-[#4CAF50]',
    Rejected: 'bg-[#FF000033] text-[#FF0000]',
}

export const categoryBadgeColor = {
    'Finance Request': 'bg-[#515DEF33] text-[#515DEF]',
    'Data Change Request': 'bg-[#2196F333] text-[#2196F3]',
    'HR Request': 'bg-[#9C27B033] text-[#9C27B0]',
    'Procurement Request': 'bg-[#FF980033] text-[#FF9800]',
    'Budget Request': 'bg-[#4CAF5033] text-[#4CAF50]',
    'Policy Change Request': 'bg-[#607D8B33] text-[#607D8B]',
}

export const priorityBadgeColor = {
    High: 'bg-[#FF000033] text-[#FF0000]',
    Normal: 'bg-[#2196F333] text-[#2196F3]',
    Low: 'bg-[#66708533] text-[#667085]',
}

const SEED_REQUESTS = [
    {
        id: 'SA-APR-001',
        requestId: 'SA-APR-001',
        category: 'Finance Request',
        requestDate: '08-08-2026',
        requestedBy: 'Account Head',
        role: 'Account Head',
        department: 'Finance',
        title: 'Q3 Transport fuel budget top-up',
        amount: '₹3,50,000',
        priority: 'High',
        status: 'Pending',
        requestedTo: REQUESTED_TO,
        description: 'Additional fuel budget required for exam-week extended route operations and contingency fleet coverage.',
        financeDetails: {
            expenseType: 'Operational Budget',
            fiscalPeriod: 'Q3 2026',
            paymentMode: 'Bank Transfer',
            supportingDoc: 'fuel_forecast_q3.xlsx',
        },
        superAdminRemarks: '',
    },
    {
        id: 'SA-APR-002',
        requestId: 'SA-APR-002',
        category: 'Data Change Request',
        requestDate: '08-08-2026',
        requestedBy: 'School Admin',
        role: 'Administrator',
        department: 'Administration',
        title: 'Bulk update — Class 10 A fee structure',
        amount: null,
        priority: 'High',
        status: 'Pending',
        requestedTo: REQUESTED_TO,
        description: 'Request to revise tuition and transport fee components for Class 10 A effective from August 2026.',
        dataChangeDetails: {
            module: 'Fees Management',
            recordId: 'FEE-CL-10A',
            recordName: 'Class 10 A Fee Structure',
            fieldChanged: 'Tuition Fee + Transport Fee',
            oldValue: '₹47,500 + ₹4,200',
            newValue: '₹49,000 + ₹4,500',
            changeReason: 'Board-mandated fee revision and route cost adjustment.',
        },
        superAdminRemarks: '',
    },
    {
        id: 'SA-APR-003',
        requestId: 'SA-APR-003',
        category: 'Finance Request',
        requestDate: '07-08-2026',
        requestedBy: 'HR Manager',
        role: 'HR',
        department: 'Human Resources',
        title: 'Staff bonus disbursement — Mid-year',
        amount: '₹8,75,000',
        priority: 'Normal',
        status: 'Pending',
        requestedTo: REQUESTED_TO,
        description: 'Mid-year performance bonus pool for non-teaching staff as approved in HR committee meeting.',
        financeDetails: {
            expenseType: 'Payroll Disbursement',
            fiscalPeriod: 'H1 2026',
            paymentMode: 'Payroll',
            supportingDoc: 'hr_bonus_schedule.pdf',
        },
        superAdminRemarks: '',
    },
    {
        id: 'SA-APR-004',
        requestId: 'SA-APR-004',
        category: 'Data Change Request',
        requestDate: '07-08-2026',
        requestedBy: 'Principal',
        role: 'Principal',
        department: 'Academics',
        title: 'Student record correction — admission number merge',
        amount: null,
        priority: 'Normal',
        status: 'Pending',
        requestedTo: REQUESTED_TO,
        description: 'Correct duplicate admission entries for student transferred from sister branch.',
        dataChangeDetails: {
            module: 'Student Database',
            recordId: 'STD-NO1902',
            recordName: 'Meera Lakshmi',
            fieldChanged: 'Admission Number',
            oldValue: 'STD-NO1902 / STD-NO1902B',
            newValue: 'STD-NO1902 (merged)',
            changeReason: 'Duplicate record created during branch transfer import.',
        },
        superAdminRemarks: '',
    },
    {
        id: 'SA-APR-005',
        requestId: 'SA-APR-005',
        category: 'Procurement Request',
        requestDate: '06-08-2026',
        requestedBy: 'IT Support Manager',
        role: 'IT Support Manager',
        department: 'IT Support',
        title: 'Block C lab network switch replacement',
        amount: '₹95,000',
        priority: 'High',
        status: 'Pending',
        requestedTo: REQUESTED_TO,
        description: 'Emergency procurement for managed switches after repeated lab connectivity failures during assessments.',
        procurementDetails: {
            vendor: 'Chennai Network Solutions',
            items: '4 × Managed network switches, cabling kit',
            deliveryDate: '15-08-2026',
            quoteRef: 'QT-IT-2026-044',
        },
        superAdminRemarks: '',
    },
    {
        id: 'SA-APR-006',
        requestId: 'SA-APR-006',
        category: 'Budget Request',
        requestDate: '06-08-2026',
        requestedBy: 'Director',
        role: 'Director',
        department: 'Director Office',
        title: 'Science lab equipment budget — Q3',
        amount: '₹4,20,000',
        priority: 'Normal',
        status: 'Pending',
        requestedTo: REQUESTED_TO,
        description: 'Capital budget for microscopes, lab glassware, and safety equipment across Block A and Block B labs.',
        budgetDetails: {
            budgetHead: 'Capital Expenditure — Labs',
            fiscalYear: '2026–27',
            previousAllocation: '₹3,50,000',
            requestedIncrease: '₹70,000',
        },
        superAdminRemarks: '',
    },
    {
        id: 'SA-APR-007',
        requestId: 'SA-APR-007',
        category: 'Policy Change Request',
        requestDate: '05-08-2026',
        requestedBy: 'School Admin',
        role: 'Administrator',
        department: 'Administration',
        title: 'Revised leave approval hierarchy',
        amount: null,
        priority: 'Normal',
        status: 'Pending',
        requestedTo: REQUESTED_TO,
        description: 'Update system policy so department heads route leave above 5 days to Super Admin instead of Principal.',
        policyDetails: {
            policyArea: 'Leave Management',
            currentRule: 'Leave > 5 days → Principal approval',
            proposedRule: 'Leave > 5 days → Super Admin approval',
            effectiveFrom: '01-09-2026',
        },
        superAdminRemarks: '',
    },
    {
        id: 'SA-APR-008',
        requestId: 'SA-APR-008',
        category: 'HR Request',
        requestDate: '05-08-2026',
        requestedBy: 'HR Manager',
        role: 'HR',
        department: 'Human Resources',
        title: 'New designation — Deputy Transport Manager',
        amount: null,
        priority: 'Low',
        status: 'Pending',
        requestedTo: REQUESTED_TO,
        description: 'Create new employee designation and approval workflow for Deputy Transport Manager role.',
        hrDetails: {
            requestType: 'Designation Creation',
            affectedDepartment: 'Transport',
            headcount: '1',
            justification: 'Fleet expansion requires secondary approver for route and maintenance requests.',
        },
        superAdminRemarks: '',
    },
    {
        id: 'SA-APR-009',
        requestId: 'SA-APR-009',
        category: 'Finance Request',
        requestDate: '04-08-2026',
        requestedBy: 'Account Head',
        role: 'Account Head',
        department: 'Finance',
        title: 'Fee waiver batch — scholarship students',
        amount: '₹1,25,000',
        priority: 'Normal',
        status: 'Approved',
        requestedTo: REQUESTED_TO,
        description: 'Partial fee waiver for 8 scholarship students as per committee recommendation.',
        financeDetails: {
            expenseType: 'Fee Concession',
            fiscalPeriod: 'Term 2 2026',
            paymentMode: 'Fee Adjustment',
            supportingDoc: 'scholarship_waiver_list.pdf',
        },
        superAdminRemarks: 'Approved per scholarship committee minutes dated 02-08-2026.',
    },
    {
        id: 'SA-APR-010',
        requestId: 'SA-APR-010',
        category: 'Data Change Request',
        requestDate: '03-08-2026',
        requestedBy: 'Transport Manager',
        role: 'Transport Manager',
        department: 'Transport',
        title: 'Route 5 pickup time revision',
        amount: null,
        priority: 'Normal',
        status: 'Approved',
        requestedTo: REQUESTED_TO,
        description: 'Permanent schedule change for Route 5 after municipal road work completion.',
        dataChangeDetails: {
            module: 'Route Management',
            recordId: 'RT-1001',
            recordName: 'Route 5 — North Campus',
            fieldChanged: 'Pickup Time',
            oldValue: '06:45 AM',
            newValue: '06:40 AM',
            changeReason: 'Road work completed; earlier pickup improves on-time arrival.',
        },
        superAdminRemarks: 'Approved. Notify parents via communication module.',
    },
    {
        id: 'SA-APR-011',
        requestId: 'SA-APR-011',
        category: 'Procurement Request',
        requestDate: '02-08-2026',
        requestedBy: 'Canteen Manager',
        role: 'Canteen Manager',
        department: 'Canteen',
        title: 'Commercial kitchen equipment upgrade',
        amount: '₹52,000',
        priority: 'Normal',
        status: 'Rejected',
        requestedTo: REQUESTED_TO,
        description: 'Replacement of food warmers and prep counter for exam-week service expansion.',
        procurementDetails: {
            vendor: 'Kitchen Pro Supplies',
            items: '2 × Food warmers, 1 × Prep counter',
            deliveryDate: '20-08-2026',
            quoteRef: 'QT-CAN-2026-018',
        },
        superAdminRemarks: 'Deferred to next quarter capital plan — resubmit with revised quote.',
    },
    {
        id: 'SA-APR-012',
        requestId: 'SA-APR-012',
        category: 'Budget Request',
        requestDate: '01-08-2026',
        requestedBy: 'Joint Director',
        role: 'Joint Director',
        department: 'Operations',
        title: 'Auditorium renovation phase 2',
        amount: '₹18,50,000',
        priority: 'High',
        status: 'Rejected',
        requestedTo: REQUESTED_TO,
        description: 'Phase 2 renovation including seating, acoustic panels, and AV upgrade.',
        budgetDetails: {
            budgetHead: 'Infrastructure — Auditorium',
            fiscalYear: '2026–27',
            previousAllocation: '₹12,00,000',
            requestedIncrease: '₹6,50,000',
        },
        superAdminRemarks: 'Rejected — submit phased plan with vendor comparison and trust board note.',
    },
]

const loadRequests = () => {
    try {
        const stored = sessionStorage.getItem(STORAGE_KEY)
        if (stored) return JSON.parse(stored)
    } catch {
        /* ignore */
    }
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_REQUESTS))
    return [...SEED_REQUESTS]
}

const saveRequests = (requests) => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(requests))
}

export const getAllApprovalRequests = () => loadRequests()

export const getApprovalRequestById = (id) =>
    loadRequests().find((request) => request.id === id) ?? null

export const getPendingApprovalCount = () =>
    loadRequests().filter((request) => request.status === 'Pending').length

export const updateApprovalRequestStatus = (id, status, superAdminRemarks = '') => {
    const requests = loadRequests()
    const index = requests.findIndex((request) => request.id === id)
    if (index === -1) return null

    requests[index] = {
        ...requests[index],
        status,
        superAdminRemarks: superAdminRemarks || requests[index].superAdminRemarks,
    }
    saveRequests(requests)
    return requests[index]
}

export const filterApprovalRequests = (
    records,
    { search = '', category = '', status = '' } = {},
) => {
    const query = search.trim().toLowerCase()

    return records.filter((record) => {
        if (category && record.category !== category) return false
        if (status && record.status !== status) return false
        if (!query) return true

        return [
            record.requestId,
            record.category,
            record.title,
            record.requestedBy,
            record.department,
            record.status,
        ]
            .join(' ')
            .toLowerCase()
            .includes(query)
    })
}

export const getApprovalSummary = (records = getAllApprovalRequests()) => ({
    total: records.length,
    pending: records.filter((r) => r.status === 'Pending').length,
    approved: records.filter((r) => r.status === 'Approved').length,
    rejected: records.filter((r) => r.status === 'Rejected').length,
    highPriority: records.filter((r) => r.priority === 'High' && r.status === 'Pending').length,
})

export const formatAmount = (amount) => amount ?? '—'
