export const FEE_TABS = [
    { id: 'fee-structure', label: 'Fee Structure' },
    { id: 'fee-collection', label: 'Fee Collection' },
    { id: 'concessions-waivers', label: 'Concessions & Waivers' },
    { id: 'defaulters', label: 'Defaulters' },
    { id: 'receipt-management', label: 'Receipt Management' },
    { id: 'activity-fees', label: 'Activity Fees' },
]

export const ACADEMIC_YEARS = ['2023-24', '2022-23', '2021-22']

export const TERMS = ['All Terms', 'T1 (Summer)', 'T2 (Winter)', 'T3 (Annual)']

export const GRADES = ['All Grades', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12']

export const MODAL_GRADES = ['Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12']

export const MODAL_TERMS = ['T1 (Summer)', 'T2 (Winter)', 'T3 (Annual)']

export const DEFAULT_FEE_FORM = {
    grade: '',
    academicYear: '2023-24',
    term: '',
    tuitionFee: '3500',
    examFee: '500',
    labFee: '400',
    activityFee: '300',
    miscellaneousFee: '300',
}

export const FEE_CATEGORY_OPTIONS = [
    { id: 'tuition', label: 'Tuition', selected: true },
    { id: 'exam', label: 'Exam', selected: true },
    { id: 'lab', label: 'Lab', selected: true },
    { id: 'development', label: 'Development', selected: true },
    { id: 'miscellaneous', label: 'Miscellaneous', selected: true },
    { id: 'transport', label: 'Transport', selected: false },
    { id: 'library', label: 'Library', selected: false },
]

export const DEFAULT_CONFIGURE_FORM = {
    numberOfGrades: '12',
    numberOfTerms: '3',
    categories: FEE_CATEGORY_OPTIONS,
    newCategory: '',
}

export const QUICK_STATS = {
    academicYear: '2023-24 ACADEMIC YEAR',
    gradesConfigured: '10 / 12',
    feeCategories: '6',
    termsSplit: '3 Terms',
    annualBilling: '₹1.28 Cr',
    setupProgress: 83,
    alertMessage: 'Grades 11-12 are not yet configured for the upcoming term.',
}

export const FEE_STRUCTURES = [
    {
        id: 'FS-001',
        grade: 'Grade 10',
        term: 'T1 (Summer)',
        tuitionFee: '₹4,200',
        examFee: '₹800',
        labFee: '₹600',
        activityFee: '₹400',
        total: '₹6,000',
        status: 'ACTIVE',
    },
    {
        id: 'FS-002',
        grade: 'Grade 9',
        term: 'T1 (Summer)',
        tuitionFee: '₹3,800',
        examFee: '₹700',
        labFee: '₹500',
        activityFee: '₹400',
        total: '₹5,400',
        status: 'DRAFT',
    },
    {
        id: 'FS-003',
        grade: 'Grade 8',
        term: 'T2 (Winter)',
        tuitionFee: '₹3,500',
        examFee: '₹650',
        labFee: '₹450',
        activityFee: '₹350',
        total: '₹4,950',
        status: 'ACTIVE',
    },
]

export const feeStructureStatusBadgeColor = {
    ACTIVE: 'bg-[#4CAF5033] text-[#4CAF50]',
    DRAFT: 'bg-[#66708533] text-[#667085]',
    INACTIVE: 'bg-[#66708533] text-[#667085]',
}

export const FEE_COLLECTION_SUMMARY = [
    {
        label: 'Total Billed (Current Term)',
        value: '₹42.6 Lakhs',
        sub: '1240 Students',
        trend: '+8.4%',
        iconTone: 'info',
    },
    {
        label: 'Amount Collected',
        value: '₹33.1 Lakhs',
        badge: '77.7% Collected',
        progress: 77.7,
        iconTone: 'success',
    },
    {
        label: 'Outstanding Dues',
        value: '₹9.5 Lakhs',
        badge: '218 Pending',
        badgeTone: 'danger',
        sub: 'Urgent Action Required',
        subTone: 'danger',
        iconTone: 'danger',
    },
    {
        label: 'Collected Today',
        value: '₹48,200',
        badge: '12 Trans',
        sub: 'Last trans. 2 mins ago',
        subTone: 'info',
        iconTone: 'info',
    },
]

export const COLLECTION_BY_CLASS = [
    { grade: 'Grade 10', percent: 93 },
    { grade: 'Grade 9', percent: 82 },
    { grade: 'Grade 7', percent: 79 },
    { grade: 'Grade 8', percent: 74 },
    { grade: 'Grade 6', percent: 63 },
]

export const PAYMENT_METHODS = [
    { name: 'UPI/Online', percent: 56, color: '#515DEF' },
    { name: 'Cash', percent: 27, color: '#7B83EB' },
    { name: 'Cheque/DD', percent: 11, color: '#B4C4FF' },
    { name: 'Bank Transfer', percent: 6, color: '#D9D9D9' },
]

export const FEE_TRANSACTIONS = [
    {
        id: 'FT-001',
        student: 'Arjun Sharma',
        initials: 'AS',
        avatarColor: 'bg-[#515DEF]',
        className: 'Grade 10-A',
        feeHeads: ['Tuition', 'Lab'],
        paid: '₹12,500',
        balance: '₹0',
        balanceHighlight: false,
        mode: 'UPI',
        status: 'PAID',
    },
    {
        id: 'FT-002',
        student: 'Riya Kapoor',
        initials: 'RK',
        avatarColor: 'bg-[#2196F3]',
        className: 'Grade 6-C',
        feeHeads: ['Tuition', 'Transport'],
        paid: '₹4,200',
        balance: '₹8,000',
        balanceHighlight: true,
        mode: 'Cash',
        status: 'PARTIAL',
    },
    {
        id: 'FT-003',
        student: 'Vikram Mehta',
        initials: 'VM',
        avatarColor: 'bg-[#FF5722]',
        className: 'Grade 8-B',
        feeHeads: ['Hostel Fee'],
        paid: '₹0',
        balance: '₹15,000',
        balanceHighlight: true,
        mode: '—',
        status: 'OVERDUE',
    },
]

export const FEE_COLLECTION_STATUSES = ['All Statuses', 'PAID', 'PARTIAL', 'OVERDUE', 'PENDING']

export const COLLECT_FEE_HEADS = ['Academics', 'Hostel', 'Transport']

export const COLLECT_FEE_MODES = ['UPI', 'Cash', 'Cheque/DD', 'Bank Transfer', 'Card']

export const COLLECT_FEE_PAID_STATUSES = ['PAID', 'PARTIAL', 'PENDING', 'OVERDUE']

export const DEFAULT_COLLECT_FEE_FORM = {
    name: '',
    email: '',
    rollNumber: '',
    class: '',
    term: '',
    fees: '',
    amount: '',
    modeOfPayment: '',
    paidStatus: 'PAID',
}

export const feeCollectionStatusBadgeColor = {
    PAID: 'bg-[#4CAF5033] text-[#4CAF50]',
    PARTIAL: 'bg-[#2196F333] text-[#2196F3]',
    OVERDUE: 'bg-[#FF572233] text-[#FF5722]',
    PENDING: 'bg-[#FF980033] text-[#FF9800]',
}

export const CONCESSIONS_SUMMARY = [
    {
        label: 'Total Concessions',
        value: '₹2.1 Lakhs',
        sub: '87 Beneficiaries',
        trend: '12%',
        iconTone: 'info',
    },
    {
        label: 'Scholarships',
        value: '₹96,000',
        sub: '38 Active Students',
        iconTone: 'success',
    },
    {
        label: 'Sibling Discounts',
        value: '₹64,000',
        sub: '29 Families Enrolled',
        iconTone: 'info',
    },
    {
        label: 'Special Waivers',
        value: '₹50,000',
        badge: '4 PENDING',
        badgeTone: 'danger',
        sub: 'Action Required',
        subTone: 'danger',
        iconTone: 'danger',
    },
]

export const MONTHLY_CONCESSION_TREND = {
    labels: ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL'],
    currentYear: [12, 15, 14, 18, 20, 22, 24],
    previousYear: [10, 11, 13, 14, 15, 16, 17],
}

export const CONCESSION_DISTRIBUTION = [
    { name: 'Scholarship', amount: '₹96k', value: 96, color: '#515DEF' },
    { name: 'Sibling Discount', amount: '₹64k', value: 64, color: '#4CAF50' },
    { name: 'Special Waiver', amount: '₹50k', value: 50, color: '#B4C4FF' },
]

export const CONCESSION_TYPES = ['All Types', 'Merit Scholarship', 'Sibling Discount', 'Special Waiver']

export const CONCESSIONS_REGISTER = [
    {
        id: 'CN-001',
        student: 'Rohan Joshi',
        studentId: 'ADM-2023-084',
        className: 'Class 10-A',
        avatarColor: 'bg-[#515DEF]',
        concessionType: 'Merit Scholarship',
        feeHead: 'Tuition Fee',
        originalAmount: '₹45,000',
        deduction: '₹22,500',
        dedPercent: '50%',
        dedTone: 'success',
        netFee: '₹22,500',
        status: 'Approved',
        rollNumber: '104',
        gradeSection: 'Grade 10 - Section A',
        policyId: 'MS-2023-A01',
        approvalDate: '12 Aug, 2023',
        totalSavings: '-₹22,500',
        documents: [
            { name: 'Grade_9_Marksheet.pdf', icon: 'file' },
            { name: 'Family_Income_Cert.pdf', icon: 'shield' },
        ],
    },
    {
        id: 'CN-002',
        student: 'Sanya Kapoor',
        studentId: 'ADM-2023-112',
        className: 'Class 8-C',
        avatarColor: 'bg-[#2196F3]',
        concessionType: 'Sibling Discount',
        feeHead: 'Composite Fee',
        originalAmount: '₹32,000',
        deduction: '₹3,200',
        dedPercent: '10%',
        dedTone: 'info',
        netFee: '₹28,800',
        status: 'Pending',
        rollNumber: '218',
        gradeSection: 'Grade 8 - Section C',
        policyId: 'SD-2023-B04',
        approvalDate: 'Pending Review',
        totalSavings: '-₹3,200',
        documents: [
            { name: 'Sibling_Enrollment_Proof.pdf', icon: 'file' },
        ],
    },
    {
        id: 'CN-003',
        student: 'Arjun Mehta',
        studentId: 'ADM-2022-450',
        className: 'Class 5-B',
        avatarColor: 'bg-[#FF9800]',
        concessionType: 'Special Waiver',
        feeHead: 'Sports Fee',
        originalAmount: '₹12,000',
        deduction: '₹12,000',
        dedPercent: '100%',
        dedTone: 'muted',
        netFee: '₹0',
        status: 'Expired',
        rollNumber: '045',
        gradeSection: 'Grade 5 - Section B',
        policyId: 'SW-2022-C11',
        approvalDate: '05 Jan, 2024',
        totalSavings: '-₹12,000',
        documents: [
            { name: 'Medical_Waiver_Letter.pdf', icon: 'shield' },
        ],
    },
]

export const concessionStatusBadgeColor = {
    Approved: 'bg-[#4CAF5033] text-[#4CAF50]',
    Pending: 'bg-[#FF572233] text-[#FF5722]',
    Expired: 'bg-[#66708533] text-[#667085]',
}

export const concessionDedBadgeColor = {
    success: 'bg-[#4CAF5033] text-[#4CAF50]',
    info: 'bg-[#515DEF33] text-[#515DEF]',
    muted: 'bg-[#B4C4FF33] text-[#515DEF]',
}

export const DEFAULTERS_SUMMARY = [
    {
        label: 'Total Defaulters',
        value: '218 Students',
        trend: '+14',
        trendTone: 'danger',
        iconTone: 'danger',
    },
    {
        label: 'Total Outstanding',
        value: '₹9.5 Lakhs',
        sub: 'Across all grades and terms',
        iconTone: 'info',
    },
    {
        label: 'Critical Cases',
        value: '47 Students',
        badge: 'ACTION REQ.',
        badgeTone: 'danger',
        sub: '30+ Days Overdue threshold',
        iconTone: 'danger',
    },
    {
        label: 'Reminders Sent',
        value: '163',
        sub: 'Current Academic Term',
        iconTone: 'success',
    },
]

export const OUTSTANDING_BY_GRADE = [
    { grade: 'Grade 12', amount: '₹2.4L', value: 2.4 },
    { grade: 'Grade 11', amount: '₹1.8L', value: 1.8 },
    { grade: 'Grade 10', amount: '₹1.5L', value: 1.5 },
    { grade: 'Grade 9', amount: '₹1.2L', value: 1.2 },
    { grade: 'Grade 8', amount: '₹0.9L', value: 0.9 },
]

export const OVERDUE_AGING = [
    { label: '0-7 Days', value: 62, color: '#B4C4FF' },
    { label: '8-15 Days', value: 48, color: '#7B83EB' },
    { label: '16-30 Days', value: 61, color: '#515DEF' },
    { label: '30+ Days', value: 47, color: '#FF5722' },
]

export const RECOVERY_TREND = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    recovered: [1.2, 1.4, 1.1, 1.6, 1.8, 2.0],
    outstanding: [2.8, 2.6, 2.9, 2.5, 2.3, 2.1],
}

export const DEFAULTER_CLASSES = ['Class: All', 'Grade 12', 'Grade 11', 'Grade 10', 'Grade 9', 'Grade 8']
export const OVERDUE_RANGES = ['Overdue Range', '0-7 Days', '8-15 Days', '16-30 Days', '30+ Days']
export const SEVERITY_FILTERS = ['Severity', 'Critical', 'High', 'Moderate']

export const DEFAULTERS_REGISTER = [
    {
        id: 'DF-001',
        student: 'Arjun Sharma',
        studentId: 'ADM-2024-089',
        initials: 'AS',
        avatarColor: 'bg-[#515DEF]',
        className: 'Grade 12-B',
        dueSince: '15 Jan, 2026',
        daysOverdue: '45 DAYS OVERDUE',
        amount: '₹42,500',
        feeType: 'Tuition + Lab',
        severity: 'CRITICAL',
        status: 'REMINDER SENT',
    },
    {
        id: 'DF-002',
        student: 'Riya Kapoor',
        studentId: 'ADM-2024-112',
        initials: 'RK',
        avatarColor: 'bg-[#2196F3]',
        className: 'Grade 10-A',
        dueSince: '28 Jan, 2026',
        daysOverdue: '32 DAYS OVERDUE',
        amount: '₹28,400',
        feeType: 'Composite Fee',
        severity: 'HIGH',
        status: 'FOLLOW-UP PENDING',
    },
    {
        id: 'DF-003',
        student: 'Vikram Mehta',
        studentId: 'ADM-2023-450',
        initials: 'VM',
        avatarColor: 'bg-[#FF5722]',
        className: 'Grade 8-C',
        dueSince: '10 Feb, 2026',
        daysOverdue: '19 DAYS OVERDUE',
        amount: '₹15,200',
        feeType: 'Transport Fee',
        severity: 'MODERATE',
        status: 'PARTIAL PAYMENT',
    },
]

export const defaulterSeverityBadgeColor = {
    CRITICAL: 'bg-[#FF572233] text-[#FF5722]',
    HIGH: 'bg-[#FF980033] text-[#FF9800]',
    MODERATE: 'bg-[#2196F333] text-[#2196F3]',
}

export const defaulterStatusBadgeColor = {
    'REMINDER SENT': 'bg-[#515DEF33] text-[#515DEF]',
    'FOLLOW-UP PENDING': 'bg-[#66708533] text-[#667085]',
    'PARTIAL PAYMENT': 'bg-[#4CAF5033] text-[#4CAF50]',
}

export const RECEIPT_SUMMARY = [
    {
        label: 'Total Receipts',
        value: '1,022',
        trend: '+8.4%',
        sub: 'This Academic Term',
        iconTone: 'info',
    },
    {
        label: 'Generated Today',
        value: '12 / ₹48,200',
        badge: 'Success',
        badgeTone: 'success',
        sub: 'Last collection: 2 mins ago',
        iconTone: 'success',
    },
    {
        label: 'Cancelled Receipts',
        value: '7',
        badge: 'Warning',
        badgeTone: 'warning',
        sub: 'This Term Total',
        iconTone: 'warning',
    },
    {
        label: 'Reprint Requests',
        value: '14',
        badge: 'Action Needed',
        badgeTone: 'danger',
        sub: 'Awaiting Review',
        iconTone: 'danger',
    },
]

export const RECEIPT_GENERATION_TREND = {
    labels: ['01', '05', '10', '15', '20', '25', '30'],
    values: [18, 24, 22, 28, 26, 32, 38],
}

export const RECEIPT_PAYMENT_MODES = [
    { name: 'UPI', percent: 55, color: '#515DEF' },
    { name: 'Bank', percent: 30, color: '#4CAF50' },
    { name: 'Cash', percent: 15, color: '#FF9800' },
]

export const RECEIPT_CLASSES = ['All Classes', 'Grade 12', 'Grade 11', 'Grade 10', 'Grade 9', 'Grade 8']
export const RECEIPT_DATE_RANGES = ['Date Range', 'Today', 'This Week', 'This Month', 'This Term']
export const RECEIPT_PAYMENT_FILTERS = ['Payment Mode', 'UPI', 'Bank', 'Cash', 'Card']

export const RECEIPTS_REGISTER = [
    {
        id: 'RCP-001',
        receiptNo: 'RCP-2324-001202',
        student: 'Arjun Sharma',
        studentId: 'ADM-2024-089',
        initials: 'AS',
        avatarColor: 'bg-[#515DEF]',
        className: 'Grade 10-A',
        feeHeads: 'Tuition, Transport',
        amount: '₹ 12,450.00',
        status: 'ACTIVE',
    },
    {
        id: 'RCP-002',
        receiptNo: 'RCP-2324-001198',
        student: 'Riya Kapoor',
        studentId: 'ADM-2024-112',
        initials: 'RK',
        avatarColor: 'bg-[#2196F3]',
        className: 'Grade 8-B',
        feeHeads: 'Composite Fee',
        amount: '₹ 8,200.00',
        status: 'REPRINTED',
    },
    {
        id: 'RCP-003',
        receiptNo: 'RCP-2324-001185',
        student: 'Vikram Mehta',
        studentId: 'ADM-2023-450',
        initials: 'VM',
        avatarColor: 'bg-[#FF5722]',
        className: 'Grade 12-C',
        feeHeads: 'Lab, Sports',
        amount: '₹ 5,600.00',
        status: 'CANCELLED',
    },
    {
        id: 'RCP-004',
        receiptNo: 'RCP-2324-001176',
        student: 'Priya Nair',
        studentId: 'ADM-2024-034',
        initials: 'PN',
        avatarColor: 'bg-[#4CAF50]',
        className: 'Grade 9-A',
        feeHeads: 'Tuition',
        amount: '₹ 15,800.00',
        status: 'ACTIVE',
    },
]

export const REPRINT_REQUESTS = [
    {
        id: 'RR-014',
        receiptNo: 'RCP-2324-001198',
        reason: 'Printer Paper Jam',
        status: 'PENDING',
    },
    {
        id: 'RR-013',
        receiptNo: 'RCP-2324-001142',
        reason: 'Faded Print Copy',
        status: 'PENDING',
    },
    {
        id: 'RR-012',
        receiptNo: 'RCP-2324-001089',
        reason: 'Parent Request',
        status: 'APPROVED',
    },
]

export const RECEIPT_ACTIVITY_LOG = [
    {
        id: 'AL-001',
        tone: 'success',
        message: 'Receipt RCP-2324-001202 generated for Arjun Sharma',
        time: '2 mins ago',
        actor: 'Admin',
    },
    {
        id: 'AL-002',
        tone: 'info',
        message: 'Reprint request RR-014 submitted for RCP-2324-001198',
        time: '18 mins ago',
        actor: 'Cashier Desk',
    },
    {
        id: 'AL-003',
        tone: 'danger',
        message: 'Receipt RCP-2324-001185 cancelled — duplicate entry',
        time: '1 hr ago',
        actor: 'Admin',
    },
    {
        id: 'AL-004',
        tone: 'success',
        message: 'Bulk print completed for 24 receipts',
        time: '3 hrs ago',
        actor: 'System',
    },
]

export const receiptStatusBadgeColor = {
    ACTIVE: 'bg-[#4CAF5033] text-[#4CAF50]',
    REPRINTED: 'bg-[#515DEF33] text-[#515DEF]',
    CANCELLED: 'bg-[#FF572233] text-[#FF5722]',
    Generated: 'bg-[#4CAF5033] text-[#4CAF50]',
    Issued: 'bg-[#4CAF5033] text-[#4CAF50]',
    'Pending clearance': 'bg-[#FF980033] text-[#FF9800]',
}

export const reprintStatusBadgeColor = {
    PENDING: 'bg-[#FF980033] text-[#FF9800]',
    APPROVED: 'bg-[#4CAF5033] text-[#4CAF50]',
}
