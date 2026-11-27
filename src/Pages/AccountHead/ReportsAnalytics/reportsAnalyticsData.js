export const REPORTS_TABS = [
    { id: 'financial-overview', label: 'Financial Overview' },
    { id: 'income-reports', label: 'Income Reports' },
    { id: 'expenditure-reports', label: 'Expenditure Reports' },
    { id: 'fee-comparison', label: 'Fee Collection Comparison' },
    { id: 'trends-patterns', label: 'Trends & Patterns' },
]

export const REPORTS_PERIODS = ['This Term', 'This Year', 'Custom Range']

export const OVERVIEW_SUMMARY = [
    { label: 'Total Income (YTD)', value: '₹2.50 Cr', sub: '↑ 6.2% vs last year', subTone: 'success', iconTone: 'success' },
    { label: 'Total Expenditure (YTD)', value: '₹2.30 Cr', sub: '↑ 4.8% vs last year', subTone: 'danger', iconTone: 'danger' },
    { label: 'Net Surplus', value: '₹19.6L', sub: '7.8% margin', subTone: 'success', iconTone: 'success' },
    { label: 'Fee Collection Efficiency', value: '77.7%', sub: 'of total billed', iconTone: 'info' },
]

export const INCOME_EXPENDITURE_TREND = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    income: [22, 18, 26, 20, 28, 38],
    expenditure: [14, 12, 16, 13, 17, 25],
}

export const INCOME_MIX = [
    { name: 'Tuition Fee', percent: 74.4, color: '#515DEF' },
    { name: 'Transport Fee', percent: 11.4, color: '#2196F3' },
    { name: 'Canteen / Other', percent: 10.6, color: '#B4C4FF' },
    { name: 'Donations', percent: 3.6, color: '#D9D5C8' },
]

export const INCOME_REPORT_TILES = [
    { title: 'Fee Collection Summary', sub: 'By grade, term & status', icon: 'cash' },
    { title: 'Defaulter-wise Income Gap', sub: 'Outstanding by student', icon: 'users' },
    { title: 'Transport Income Report', sub: 'Route-wise collections', icon: 'bus' },
    { title: 'Donations & Grants Log', sub: 'Donor-wise breakdown', icon: 'heart' },
]

export const INCOME_BREAKDOWN = [
    { category: 'Tuition Fee', amount: '₹1,86,00,000', percent: '74.4%', vsLastTerm: '↑ 5.1%', trend: 'up' },
    { category: 'Transport Fee', amount: '₹28,40,000', percent: '11.4%', vsLastTerm: '↑ 2.8%', trend: 'up' },
    { category: 'Canteen / Other Income', amount: '₹26,60,000', percent: '10.6%', vsLastTerm: '↓ 1.2%', trend: 'down' },
    { category: 'Donations & Grants', amount: '₹9,00,000', percent: '3.6%', vsLastTerm: '↑ 14.0%', trend: 'up' },
]

export const EXPENDITURE_REPORT_TILES = [
    { title: 'Payroll Summary', sub: 'Department-wise salary spend', icon: 'users' },
    { title: 'Transport Expense Report', sub: 'Fuel, service & claims', icon: 'bus' },
    { title: 'Maintenance & Repairs', sub: 'Facility-wise spend', icon: 'tools' },
    { title: 'Vendor Payment Ledger', sub: 'By vendor, with TDS detail', icon: 'receipt' },
]

export const EXPENDITURE_BREAKDOWN = [
    { category: 'Salaries — Teaching', amount: '₹1,68,00,000', percent: '72.9%', vsLastTerm: '↑ 3.4%', trend: 'up' },
    { category: 'Salaries — Non-Teaching/Transport', amount: '₹24,00,000', percent: '10.4%', vsLastTerm: '↑ 2.1%', trend: 'up' },
    { category: 'Transport Operations', amount: '₹18,60,000', percent: '8.1%', vsLastTerm: '↓ 0.8%', trend: 'down' },
    { category: 'Utilities & Maintenance', amount: '₹19,80,000', percent: '8.6%', vsLastTerm: '↑ 6.0%', trend: 'up' },
]

export const TRENDS_SUMMARY = [
    { label: '3-Month Avg. Surplus', value: '₹11.6L', sub: 'per month', iconTone: 'success' },
    { label: 'Highest Spend Month', value: 'June', sub: '₹38.7L outflow', subTone: 'danger', iconTone: 'danger' },
    { label: 'Collection Peak', value: 'April', sub: '₹48.2L inflow', subTone: 'success', iconTone: 'success' },
    { label: 'Expense Volatility', value: 'Low', sub: 'consistent month-to-month', iconTone: 'info' },
]

export const YEAR_ON_YEAR = [
    { label: 'Income — 2024–25', amount: '₹2.35 Cr', value: 94, tone: 'in' },
    { label: 'Income — 2025–26', amount: '₹2.50 Cr', value: 100, tone: 'in' },
    { label: 'Expenditure — 2024–25', amount: '₹2.19 Cr', value: 88, tone: 'out' },
    { label: 'Expenditure — 2025–26', amount: '₹2.30 Cr', value: 92, tone: 'out' },
]
