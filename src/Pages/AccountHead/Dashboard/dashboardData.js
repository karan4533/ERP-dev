export const TIME_FILTERS = ['Today', 'Week', 'Month', 'Year']

export const CHART_PERIODS = ['Daily', 'Weekly', 'Monthly']

export const KPI_CARDS = [
    {
        label: "Today's Collection",
        value: '₹2,45,000',
        trend: '+12%',
        trendType: 'up',
        iconTone: 'success',
        sparkline: [40, 52, 48, 61, 55, 72, 68],
    },
    {
        label: "Today's Expenses",
        value: '₹48,500',
        trend: '-8%',
        trendType: 'down',
        iconTone: 'danger',
        sparkline: [58, 52, 49, 44, 46, 42, 38],
    },
    {
        label: 'Pending Requests',
        value: '124',
        badge: '124 REQS',
        badgeTone: 'info',
        iconTone: 'info',
    },
    {
        label: 'Refund Requests',
        value: '18',
        badge: 'URGENT',
        badgeTone: 'success',
        iconTone: 'success',
    },
    {
        label: 'Pending Fees',
        value: '₹8,75,000',
        badge: 'DUE',
        badgeTone: 'info',
        iconTone: 'info',
    },
]

export const COLLECTION_SPLIT = {
    onlinePercent: 72,
    onlineAmount: '₹1,76,400',
    offlineAmount: '₹68,600',
    onlineValue: 176400,
    offlineValue: 68600,
}

export const INCOME_EXPENSE_DAILY = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    income: [42000, 38000, 51000, 46000, 55000, 48000],
    expense: [12000, 15000, 11000, 18000, 14000, 16000],
}

export const INCOME_EXPENSE_WEEKLY = {
    labels: ['W1', 'W2', 'W3', 'W4'],
    income: [210000, 245000, 228000, 262000],
    expense: [68000, 72000, 65000, 78000],
}

export const INCOME_EXPENSE_MONTHLY = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    income: [820000, 910000, 880000, 950000, 1020000, 980000],
    expense: [280000, 310000, 295000, 320000, 340000, 315000],
}

export const APPROVAL_STATUS = {
    successRate: 85,
    approved: 92,
    pending: 24,
    rejected: 8,
}

export const RECENT_COLLECTIONS = [
    {
        id: 'RCT-8842',
        student: 'Rahul Sharma',
        studentId: '2023-901',
        category: 'Tuition Fee',
        amount: '₹45,000',
        status: 'SUCCESS',
        paymentMode: 'UPI',
        collectedBy: 'Admin',
        collectionDate: '10/06/26',
    },
    {
        id: 'RCT-8841',
        student: 'Aarav Shah',
        studentId: '2023-045',
        category: 'Transport Fee',
        amount: '₹12,500',
        status: 'SUCCESS',
        paymentMode: 'Cash',
        collectedBy: 'Admin',
        collectionDate: '10/06/26',
    },
    {
        id: 'RCT-8840',
        student: 'Priya Mehta',
        studentId: '2023-112',
        category: 'Exam Fee',
        amount: '₹3,500',
        status: 'PENDING',
        paymentMode: 'UPI',
        collectedBy: 'Admin',
        collectionDate: '10/06/26',
    },
]

export const RECENT_EXPENSES = [
    {
        id: 'EXP-4029',
        vendor: 'Metro Supplies',
        department: 'Stationery Dept',
        category: 'Operational',
        amount: '₹18,200',
        status: 'APPROVED',
        paymentMode: 'UPI',
        approvedBy: 'Admin',
        expenseDate: '10/06/26',
    },
    {
        id: 'EXP-4028',
        vendor: 'Swift Logistics',
        department: 'Logistics Dept',
        category: 'Transport',
        amount: '₹45,000',
        status: 'APPROVED',
        paymentMode: 'Bank',
        approvedBy: 'Admin',
        expenseDate: '10/06/26',
    },
    {
        id: 'EXP-4027',
        vendor: 'Fresh Farm Co.',
        department: 'Canteen Dept',
        category: 'Procurement',
        amount: '₹8,400',
        status: 'REVIEW',
        paymentMode: 'Cash',
        approvedBy: 'Admin',
        expenseDate: '09/06/26',
    },
]

export const collectionStatusBadgeColor = {
    SUCCESS: 'bg-[#4CAF5033] text-[#4CAF50]',
    PENDING: 'bg-[#FF980033] text-[#FF9800]',
}

export const expenseStatusBadgeColor = {
    APPROVED: 'bg-[#4CAF5033] text-[#4CAF50]',
    REVIEW: 'bg-[#2196F333] text-[#2196F3]',
}

export const CHART_COLORS = {
    primary: '#515DEF',
    income: '#515DEF',
    expense: '#B4C4FF',
    success: '#4CAF50',
    warning: '#FF9800',
    danger: '#FF5722',
    muted: '#D9D9D9',
}
