export const APPROVALS_TABS = [
    { id: 'pending', label: 'Pending' },
    { id: 'approved', label: 'Approved' },
    { id: 'rejected', label: 'Rejected' },
    { id: 'approval-rules', label: 'Approval Rules' },
]

export const APPROVAL_DEPARTMENTS = ['All Departments', 'Transport', 'Academics', 'Admin', 'Facilities']

export const PENDING_SUMMARY = [
    { label: 'Pending Approvals', value: '16', sub: '₹1.42L total value', subTone: 'danger', iconTone: 'danger' },
    { label: 'Awaiting >48 hrs', value: '5', sub: 'needs attention', subTone: 'danger', iconTone: 'danger' },
    { label: 'Approved This Month', value: '62', sub: '₹4.8L disbursed', subTone: 'success', iconTone: 'success' },
    { label: 'Rejected This Month', value: '4', sub: '₹9,200 value', iconTone: 'warning' },
]

export const PENDING_REQUESTS = [
    {
        id: 'APR-1142',
        raisedBy: 'Transport Mgr.',
        initials: 'TM',
        department: 'Transport',
        type: 'Fuel Claim',
        amount: '₹4,200',
        raisedOn: '26 Jun',
        detail: {
            raisedByFull: 'Transport Manager — R. Balakrishnan',
            department: 'Transport',
            claimType: 'Fuel reimbursement',
            vehicle: 'TN58-AB-1023',
            amount: '₹4,200',
            submittedOn: '26 Jun 2026, 9:10am',
            document: 'fuel_receipt_0626.pdf',
        },
    },
    {
        id: 'APR-1139',
        raisedBy: 'Sowmiya M. (8-A)',
        initials: 'SM',
        department: 'Academics',
        type: 'Special Waiver',
        amount: '₹2,550',
        raisedOn: '24 Jun',
    },
    {
        id: 'APR-1135',
        raisedBy: 'Anand Auto Works',
        initials: 'AA',
        department: 'Transport',
        type: 'Damage Repair',
        amount: '₹22,000',
        raisedOn: '22 Jun',
    },
    {
        id: 'APR-1128',
        raisedBy: 'Procurement Desk',
        initials: 'PR',
        department: 'Admin',
        type: 'Lab Supplies',
        amount: '₹22,400',
        raisedOn: '20 Jun',
    },
    {
        id: 'APR-1121',
        raisedBy: 'Facilities Mgr.',
        initials: 'FM',
        department: 'Facilities',
        type: 'AC Repair',
        amount: '₹8,600',
        raisedOn: '17 Jun',
    },
]

export const APPROVED_SUMMARY = [
    { label: 'Approved This Month', value: '62', sub: '₹4.8L total value', subTone: 'success', iconTone: 'success' },
    { label: 'Avg. Approval Time', value: '6.4 hrs', sub: 'from raise to decision', iconTone: 'info' },
    { label: 'Disbursed', value: '58', sub: 'of 62 approved', iconTone: 'success' },
    { label: 'Awaiting Payout', value: '4', sub: '₹38,200', subTone: 'danger', iconTone: 'danger' },
]

export const APPROVED_REQUESTS = [
    { id: 'APR-1119', raisedBy: 'Selvam R.', type: 'Fuel Claim', amount: '₹3,900', approvedBy: 'Finance Manager', approvedOn: '22 Jun' },
    { id: 'APR-1112', raisedBy: 'Sri Balaji Motors', type: 'Service Bill', amount: '₹6,200', approvedBy: 'Finance Manager', approvedOn: '20 Jun' },
    { id: 'APR-1103', raisedBy: 'Preethi V. (7-C)', type: 'RTE Waiver', amount: '₹4,600', approvedBy: 'Principal', approvedOn: '15 Jun' },
]

export const REJECTED_SUMMARY = [
    { label: 'Rejected This Month', value: '4', sub: '₹9,200 value', iconTone: 'danger' },
    { label: 'Top Reason', value: 'Missing docs', sub: '2 of 4 cases', iconTone: 'warning' },
    { label: 'Resubmitted', value: '1', sub: 'awaiting re-review', iconTone: 'info' },
    { label: 'Rejection Rate', value: '6.1%', sub: 'of total requests', iconTone: 'info' },
]

export const REJECTED_REQUESTS = [
    { id: 'APR-1108', raisedBy: 'Vasanth P.', type: 'Toll Claim', amount: '₹650', rejectedOn: '20 Jun', reason: 'Receipt illegible' },
    { id: 'APR-1095', raisedBy: 'Canteen Vendor', type: 'Supply Bill', amount: '₹3,200', rejectedOn: '14 Jun', reason: 'Duplicate claim' },
    { id: 'APR-1088', raisedBy: 'Facilities Mgr.', type: 'Repair Quote', amount: '₹5,350', rejectedOn: '10 Jun', reason: 'Exceeds budget cap' },
]

export const APPROVAL_RULES = [
    { id: 'AR-001', requestType: 'Expense Claim', threshold: 'Up to ₹10,000', primaryApprover: 'Finance Manager', escalatesTo: '—', status: 'Active' },
    { id: 'AR-002', requestType: 'Expense Claim', threshold: '₹10,000 – ₹50,000', primaryApprover: 'Finance Manager', escalatesTo: 'Principal', status: 'Active' },
    { id: 'AR-003', requestType: 'Expense Claim', threshold: 'Above ₹50,000', primaryApprover: 'Principal', escalatesTo: 'Trust Board', status: 'Active' },
    { id: 'AR-004', requestType: 'Concession / Waiver', threshold: 'Any amount', primaryApprover: 'Principal', escalatesTo: '—', status: 'Active' },
    { id: 'AR-005', requestType: 'Procurement', threshold: 'Above ₹25,000', primaryApprover: 'Finance Manager', escalatesTo: 'Principal', status: 'Draft' },
]

export const departmentBadgeColor = {
    Transport: 'bg-[#515DEF33] text-[#515DEF]',
    Academics: 'bg-[#66708533] text-[#667085]',
    Admin: 'bg-[#66708533] text-[#667085]',
    Facilities: 'bg-[#FF980033] text-[#FF9800]',
}

export const ruleStatusBadgeColor = {
    Active: 'bg-[#4CAF5033] text-[#4CAF50]',
    Draft: 'bg-[#66708533] text-[#667085]',
}
