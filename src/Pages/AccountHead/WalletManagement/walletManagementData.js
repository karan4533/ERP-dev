export const PAYMENT_GATEWAY_URL = 'https://razorpay.com/payment-gateway/'

export const parseRupeeAmount = (value) => Number(String(value).replace(/[₹,\s]/g, '')) || 0

export const formatRupeeAmount = (amount) => `₹${amount.toLocaleString('en-IN')}`

export const getInitials = (name) => name
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

export const WALLET_TABS = [
    { id: 'wallet-overview', label: 'Wallet Overview' },
    { id: 'user-wallets', label: 'User Wallets' },
    { id: 'recharge-records', label: 'Recharge Records' },
    { id: 'spending-history', label: 'Spending History' },
    { id: 'recharge-options', label: 'Recharge Options' },
]

export const WALLET_ROLE_FILTERS = ['All Roles', 'Students', 'Staff', 'Parents']

export const OVERVIEW_SUMMARY = [
    { label: 'Total Held in Wallets', value: '₹18.6L', sub: 'across 2,140 wallets', iconTone: 'info' },
    { label: 'Active Wallets', value: '2,140', sub: '1,890 students · 250 staff', subTone: 'success', iconTone: 'success' },
    { label: 'Recharges Today', value: '₹62,400', sub: '84 transactions', iconTone: 'success' },
    { label: 'Spent Today', value: '₹38,900', sub: 'canteen, stationery, events', iconTone: 'warning' },
]

export const BALANCE_BY_ROLE = [
    { label: 'Students', amount: '₹14.2L', value: 100 },
    { label: 'Staff', amount: '₹3.4L', value: 24 },
    { label: 'Parents', amount: '₹1.0L', value: 7 },
]

export const SPEND_CATEGORIES = [
    { label: 'Canteen / cafeteria', amount: '₹6.8L', percent: '58%' },
    { label: 'Stationery / book store', amount: '₹2.9L', percent: '25%' },
    { label: 'Events / activities', amount: '₹1.4L', percent: '12%' },
    { label: 'Other', amount: '₹0.6L', percent: '5%' },
]

export const USER_WALLETS_SUMMARY = [
    { label: 'Total Wallets', value: '2,140', sub: 'platform-wide', iconTone: 'info' },
    { label: 'Zero Balance', value: '94', sub: 'needs recharge nudge', subTone: 'danger', iconTone: 'danger' },
    { label: 'Frozen / Flagged', value: '3', sub: 'under review', subTone: 'danger', iconTone: 'danger' },
    { label: 'Avg. Wallet Balance', value: '₹869', sub: 'per user', iconTone: 'info' },
]

export const USER_WALLETS = [
    {
        id: 'UW-001',
        name: 'Arun Raj',
        email: 'arun.raj@student.school.com',
        initials: 'AR',
        role: 'Student',
        walletId: 'WLT-10482',
        balance: '₹420',
        lastRecharge: '24 Jun',
        status: 'Active',
    },
    {
        id: 'UW-002',
        name: 'Priya M.',
        email: 'priya.m@student.school.com',
        initials: 'PM',
        role: 'Student',
        walletId: 'WLT-10391',
        balance: '₹0',
        lastRecharge: '02 May',
        status: 'Zero Balance',
    },
    {
        id: 'UW-003',
        name: 'R. Balakrishnan',
        email: 'balakrishnan.r@staff.school.com',
        initials: 'RB',
        role: 'Staff',
        walletId: 'WLT-00112',
        balance: '₹1,850',
        lastRecharge: '20 Jun',
        status: 'Active',
    },
    {
        id: 'UW-004',
        name: 'Vignesh S.',
        email: 'vignesh.s@student.school.com',
        initials: 'VS',
        role: 'Student',
        walletId: 'WLT-10477',
        balance: '₹60',
        lastRecharge: '18 Jun',
        status: 'Flagged',
    },
]

export const RECHARGE_SUMMARY = [
    { label: 'Total Recharged (This Month)', value: '₹9.8L', sub: '2,640 transactions', subTone: 'success', iconTone: 'success' },
    { label: 'Avg. Recharge Amount', value: '₹371', sub: 'per transaction', iconTone: 'info' },
    { label: 'Failed Recharges', value: '12', sub: 'needs retry / refund', subTone: 'danger', iconTone: 'danger' },
    { label: 'Auto-recharges Active', value: '340', sub: 'recurring setup', iconTone: 'info' },
]

export const RECHARGE_RECORDS = [
    {
        id: 'RCG-88421',
        user: 'Arun Raj',
        initials: 'AR',
        role: 'Student',
        mode: 'UPI',
        amount: '₹500',
        dateTime: '26 Jun, 9:10am',
        status: 'Success',
    },
    {
        id: 'RCG-88419',
        user: 'Divya V.',
        initials: 'DV',
        role: 'Student',
        mode: 'Card',
        amount: '₹300',
        dateTime: '26 Jun, 8:52am',
        status: 'Success',
    },
    {
        id: 'RCG-88401',
        user: 'Vignesh S.',
        initials: 'VS',
        role: 'Student',
        mode: 'UPI',
        amount: '₹200',
        dateTime: '25 Jun, 4:18pm',
        status: 'Failed',
    },
    {
        id: 'RCG-88390',
        user: 'R. Balakrishnan',
        initials: 'RB',
        role: 'Staff',
        mode: 'Net Banking',
        amount: '₹1,000',
        dateTime: '25 Jun, 1:05pm',
        status: 'Success',
    },
]

export const SPENDING_SUMMARY = [
    { label: 'Total Spent (This Month)', value: '₹11.7L', sub: '4,920 transactions', iconTone: 'danger' },
    { label: 'Top Spend Category', value: 'Canteen', sub: '58% of total spend', iconTone: 'info' },
    { label: 'Avg. Spend / User', value: '₹547', sub: 'per month', iconTone: 'info' },
    { label: 'Disputed Transactions', value: '2', sub: 'under review', subTone: 'danger', iconTone: 'danger' },
]

export const SPENDING_HISTORY = [
    {
        id: 'SP-001',
        user: 'Arun Raj',
        initials: 'AR',
        role: 'Student',
        vendor: 'Canteen — Lunch',
        category: 'Canteen',
        dateTime: '26 Jun, 12:32pm',
        amount: '−₹85',
    },
    {
        id: 'SP-002',
        user: 'Priya M.',
        initials: 'PM',
        role: 'Student',
        vendor: 'Book store — Notebooks',
        category: 'Stationery',
        dateTime: '25 Jun, 11:10am',
        amount: '−₹240',
    },
    {
        id: 'SP-003',
        user: 'Vignesh S.',
        initials: 'VS',
        role: 'Student',
        vendor: 'Annual Day — entry pass',
        category: 'Events',
        dateTime: '24 Jun, 3:00pm',
        amount: '−₹150',
    },
    {
        id: 'SP-004',
        user: 'R. Balakrishnan',
        initials: 'RB',
        role: 'Staff',
        vendor: 'Canteen — Beverages',
        category: 'Canteen',
        dateTime: '24 Jun, 4:40pm',
        amount: '−₹60',
    },
]

export const RECHARGE_METHODS = [
    {
        id: 'RM-001',
        method: 'UPI',
        icon: 'qr',
        minAmount: '₹50',
        maxAmount: '₹10,000',
        processingFee: 'Nil',
        status: 'Enabled',
    },
    {
        id: 'RM-002',
        method: 'Debit / Credit Card',
        icon: 'card',
        minAmount: '₹100',
        maxAmount: '₹15,000',
        processingFee: '1.2%',
        status: 'Enabled',
    },
    {
        id: 'RM-003',
        method: 'Net Banking',
        icon: 'bank',
        minAmount: '₹100',
        maxAmount: '₹25,000',
        processingFee: 'Nil',
        status: 'Enabled',
    },
    {
        id: 'RM-004',
        method: 'Cash (front desk)',
        icon: 'cash',
        minAmount: '₹20',
        maxAmount: '₹5,000',
        processingFee: 'Nil',
        status: 'Enabled',
    },
]

export const walletStatusBadgeColor = {
    Active: 'bg-[#4CAF5033] text-[#4CAF50]',
    'Zero Balance': 'bg-[#66708533] text-[#667085]',
    Flagged: 'bg-[#FF572233] text-[#FF5722]',
    Frozen: 'bg-[#FF572233] text-[#FF5722]',
}

export const rechargeStatusBadgeColor = {
    Success: 'bg-[#4CAF5033] text-[#4CAF50]',
    Failed: 'bg-[#FF572233] text-[#FF5722]',
    Refunded: 'bg-[#FF980033] text-[#FF9800]',
}

export const spendCategoryBadgeColor = {
    Canteen: 'bg-[#515DEF33] text-[#515DEF]',
    Stationery: 'bg-[#66708533] text-[#667085]',
    Events: 'bg-[#FF980033] text-[#FF9800]',
    Other: 'bg-[#2196F333] text-[#2196F3]',
}

export const methodStatusBadgeColor = {
    Enabled: 'bg-[#4CAF5033] text-[#4CAF50]',
    Disabled: 'bg-[#66708533] text-[#667085]',
}
