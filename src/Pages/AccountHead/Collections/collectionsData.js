export const COLLECTIONS_TABS = [
    { id: 'overview', label: 'Overview' },
    { id: 'money-in', label: 'Money In — Sources' },
    { id: 'money-out', label: 'Money Out — Expenses' },
    { id: 'transaction-timeline', label: 'Transaction Timeline' },
    { id: 'cash-flow-trends', label: 'Cash Flow Trends' },
]

export const COLLECTIONS_PERIODS = ['This Month', 'This Term', 'This Year']

export const OVERVIEW_SUMMARY = [
    { label: 'Total Inflow', value: '₹38.2L', sub: 'this month', subTone: 'success', iconTone: 'success' },
    { label: 'Total Outflow', value: '₹24.6L', sub: 'this month', subTone: 'danger', iconTone: 'danger' },
    { label: 'Net Position', value: '+₹13.6L', sub: 'surplus this month', subTone: 'success', iconTone: 'success' },
    { label: 'Closing Balance', value: '₹61.4L', sub: 'across all accounts', iconTone: 'info' },
]

export const MONEY_IN_SOURCES = [
    { label: 'Student fees', amount: '₹33.1L', value: 87, tone: 'in' },
    { label: 'Transport fees', amount: '₹2.8L', value: 34, tone: 'in' },
    { label: 'Canteen / cafeteria', amount: '₹1.1L', value: 14, tone: 'in' },
    { label: 'Donations & grants', amount: '₹0.9L', value: 11, tone: 'in' },
    { label: 'Other (events, sale of forms)', amount: '₹0.3L', value: 4, tone: 'in' },
]

export const MONEY_OUT_SOURCES = [
    { label: 'Staff salaries', amount: '₹16.2L', value: 100, tone: 'out' },
    { label: 'Transport (fuel, service, drivers)', amount: '₹4.2L', value: 26, tone: 'out' },
    { label: 'Facility maintenance', amount: '₹2.1L', value: 13, tone: 'out' },
    { label: 'Utilities', amount: '₹1.3L', value: 8, tone: 'out' },
    { label: 'Procurement & supplies', amount: '₹0.8L', value: 5, tone: 'out' },
]

export const INFLOW_OUTFLOW_TREND = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    inflow: [22, 18, 26, 20, 28, 38],
    outflow: [14, 12, 16, 13, 17, 25],
}

export const MONEY_IN_SUMMARY = [
    { label: 'Total Collections', value: '₹38.2L', sub: 'this month', iconTone: 'success' },
    { label: 'Fee Collections', value: '₹33.1L', sub: '86.6% of inflow', iconTone: 'info' },
    { label: 'Non-fee Income', value: '₹5.1L', sub: 'transport, canteen, other', iconTone: 'info' },
    { label: 'Pending Receivables', value: '₹9.5L', sub: 'outstanding dues', subTone: 'danger', iconTone: 'danger' },
]

export const INCOME_REGISTER = [
    { id: 'IN-001', date: '26 Jun', source: 'Student Fees', reference: 'RCP-2026-1022', mode: 'UPI', amount: '+₹12,400', status: 'Cleared' },
    { id: 'IN-002', date: '26 Jun', source: 'Transport Fees', reference: 'TRP-COLL-0312', mode: 'Cash', amount: '+₹1,800', status: 'Cleared' },
    { id: 'IN-003', date: '25 Jun', source: 'Canteen', reference: 'CNT-DLY-0625', mode: 'Wallet', amount: '+₹8,400', status: 'Cleared' },
    { id: 'IN-004', date: '25 Jun', source: 'Donation', reference: 'DON-0044', mode: 'Bank Transfer', amount: '+₹50,000', status: 'Processing' },
    { id: 'IN-005', date: '24 Jun', source: 'Student Fees', reference: 'RCP-2026-1021', mode: 'Cash', amount: '+₹11,600', status: 'Cleared' },
]

export const MONEY_OUT_SUMMARY = [
    { label: 'Total Expenses', value: '₹24.6L', sub: 'this month', iconTone: 'danger' },
    { label: 'Salaries Disbursed', value: '₹16.2L', sub: '65.8% of outflow', iconTone: 'info' },
    { label: 'Operational Spend', value: '₹8.4L', sub: 'transport, maintenance, utilities', iconTone: 'warning' },
    { label: 'Pending Payouts', value: '₹1.2L', sub: 'approved, not yet paid', subTone: 'danger', iconTone: 'danger' },
]

export const EXPENSE_REGISTER = [
    { id: 'EX-001', date: '25 Jun', category: 'Salaries', paidTo: 'Teaching staff (84)', mode: 'Bank Transfer', amount: '−₹14,80,000', status: 'Paid' },
    { id: 'EX-002', date: '24 Jun', category: 'Transport', paidTo: 'Sri Balaji Motors', mode: 'Bank Transfer', amount: '−₹6,200', status: 'Paid' },
    { id: 'EX-003', date: '23 Jun', category: 'Utilities', paidTo: 'TANGEDCO (Electricity)', mode: 'Online', amount: '−₹84,000', status: 'Paid' },
    { id: 'EX-004', date: '22 Jun', category: 'Procurement', paidTo: 'Sri Lab Supplies', mode: 'Cheque', amount: '−₹22,400', status: 'Processing' },
    { id: 'EX-005', date: '20 Jun', category: 'Maintenance', paidTo: 'Anand Auto Works', mode: 'Bank Transfer', amount: '−₹22,000', status: 'Approved · Pending payout' },
]

export const TRANSACTION_TIMELINE = [
    { id: 'TX-001', type: 'in', title: 'Student fee — Arun Raj (10-A)', meta: 'Today, 10:32am · UPI · RCP-2026-1022', amount: '+₹12,400' },
    { id: 'TX-002', type: 'out', title: 'Vehicle service payment — Sri Balaji Motors', meta: 'Today, 9:50am · Bank Transfer', amount: '−₹6,200' },
    { id: 'TX-003', type: 'in', title: 'Transport fee — Route 4 collection', meta: 'Today, 9:14am · Cash', amount: '+₹1,800' },
    { id: 'TX-004', type: 'out', title: 'Teaching staff salaries — June 2026', meta: 'Yesterday, 6:00pm · Bank Transfer · 84 staff', amount: '−₹14,80,000' },
    { id: 'TX-005', type: 'in', title: 'Canteen daily collection', meta: 'Yesterday, 4:30pm · Wallet', amount: '+₹8,400' },
    { id: 'TX-006', type: 'out', title: 'Electricity bill — TANGEDCO', meta: '2 days ago, 11:20am · Online', amount: '−₹84,000' },
    { id: 'TX-007', type: 'in', title: 'Donation received — Alumni Trust', meta: '2 days ago, 2:15pm · Bank Transfer', amount: '+₹50,000' },
]

export const CASH_FLOW_SUMMARY = [
    { label: '3-Month Avg. Inflow', value: '₹35.4L', sub: 'per month', iconTone: 'success' },
    { label: '3-Month Avg. Outflow', value: '₹23.8L', sub: 'per month', iconTone: 'danger' },
    { label: 'Avg. Monthly Surplus', value: '₹11.6L', sub: 'healthy trend', subTone: 'success', iconTone: 'success' },
    { label: 'Burn Pattern', value: 'Stable', sub: 'no major spikes', iconTone: 'info' },
]

export const SPENDING_PATTERN = [
    { label: 'Staff salaries', percent: '62%', value: 62 },
    { label: 'Transport', percent: '17%', value: 17 },
    { label: 'Maintenance', percent: '9%', value: 9 },
    { label: 'Utilities', percent: '6%', value: 6 },
    { label: 'Procurement & other', percent: '6%', value: 6 },
]

export const incomeStatusBadgeColor = {
    Cleared: 'bg-[#4CAF5033] text-[#4CAF50]',
    Processing: 'bg-[#FF980033] text-[#FF9800]',
}

export const expenseStatusBadgeColor = {
    Paid: 'bg-[#4CAF5033] text-[#4CAF50]',
    Processing: 'bg-[#FF980033] text-[#FF9800]',
    'Approved · Pending payout': 'bg-[#FF980033] text-[#FF9800]',
}
