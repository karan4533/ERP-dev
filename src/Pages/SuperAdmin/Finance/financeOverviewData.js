import { KPI_CARDS, RECENT_COLLECTIONS, RECENT_EXPENSES, COLLECTION_SPLIT } from '../../AccountHead/Dashboard/dashboardData'
import {
    FEE_COLLECTION_SUMMARY,
    FEE_STRUCTURES,
    FEE_TRANSACTIONS,
    feeStructureStatusBadgeColor,
} from '../../AccountHead/FeesManagement/feesManagementData'
import {
    OVERVIEW_SUMMARY as COLLECTIONS_OVERVIEW,
    INCOME_REGISTER,
    EXPENSE_REGISTER,
} from '../../AccountHead/Collections/collectionsData'
import { OVERVIEW_SUMMARY as WALLET_OVERVIEW, USER_WALLETS } from '../../AccountHead/WalletManagement/walletManagementData'
import {
    FLEET_SUMMARY,
    FLEET_VEHICLES,
    EXPENSE_CLAIMS,
    FUEL_SUMMARY,
    fleetStatusBadgeColor,
    claimStatusBadgeColor,
} from '../../AccountHead/TransportFinance/transportFinanceData'
import { TRIAL_BALANCE_REGISTER } from '../../AccountHead/Accounting/accountingData'
import {
    OVERVIEW_SUMMARY as REPORTS_OVERVIEW,
    INCOME_BREAKDOWN,
    EXPENDITURE_BREAKDOWN,
    INCOME_EXPENDITURE_TREND,
} from '../../AccountHead/ReportsAnalytics/reportsAnalyticsData'
import { getPendingApprovalCount } from '../Approvals/approvalsData'

export const ROUTE_BASE = '/super-admin/finance'

export const FINANCE_SECTIONS = [
    { key: 'overview', label: 'Finance Overview', route: `${ROUTE_BASE}/overview` },
    { key: 'fees', label: 'Fees Management', route: `${ROUTE_BASE}/fees` },
    { key: 'collections', label: 'Collections', route: `${ROUTE_BASE}/collections` },
    { key: 'wallets', label: 'Wallet Management', route: `${ROUTE_BASE}/wallets` },
    { key: 'transport', label: 'Transport Finance', route: `${ROUTE_BASE}/transport` },
    { key: 'accounting', label: 'Accounting', route: `${ROUTE_BASE}/accounting` },
    { key: 'reports', label: 'Reports & Analytics', route: `${ROUTE_BASE}/reports` },
]

export {
    COLLECTION_SPLIT,
    INCOME_EXPENDITURE_TREND,
    RECENT_COLLECTIONS,
    RECENT_EXPENSES,
    feeStructureStatusBadgeColor,
    fleetStatusBadgeColor,
    claimStatusBadgeColor,
}

export const transactionStatusBadgeColor = {
    SUCCESS: 'bg-[#4CAF5033] text-[#4CAF50]',
    PAID: 'bg-[#4CAF5033] text-[#4CAF50]',
    APPROVED: 'bg-[#4CAF5033] text-[#4CAF50]',
    PENDING: 'bg-[#FF980033] text-[#FF9800]',
    PARTIAL: 'bg-[#2196F333] text-[#2196F3]',
    REVIEW: 'bg-[#2196F333] text-[#2196F3]',
    Cleared: 'bg-[#4CAF5033] text-[#4CAF50]',
    Paid: 'bg-[#4CAF5033] text-[#4CAF50]',
    Processing: 'bg-[#FF980033] text-[#FF9800]',
    Active: 'bg-[#4CAF5033] text-[#4CAF50]',
    'Zero Balance': 'bg-[#FF980033] text-[#FF9800]',
}

export const getOverviewSummary = () => [
    { label: "Today's Collection", value: KPI_CARDS[0].value, sub: KPI_CARDS[0].trend },
    { label: 'Pending Fees', value: KPI_CARDS[4].value, sub: 'Outstanding dues' },
    { label: 'Net Surplus (YTD)', value: REPORTS_OVERVIEW[2].value, sub: REPORTS_OVERVIEW[2].sub },
    { label: 'Closing Balance', value: COLLECTIONS_OVERVIEW[3].value, sub: COLLECTIONS_OVERVIEW[3].sub },
    { label: 'Pending Finance Approvals', value: String(getPendingApprovalCount()), sub: 'Super Admin queue' },
]

export const getSectionSummary = (sectionKey) => {
    switch (sectionKey) {
        case 'fees':
            return FEE_COLLECTION_SUMMARY.slice(0, 4).map((item) => ({
                label: item.label,
                value: item.value,
            }))
        case 'collections':
            return COLLECTIONS_OVERVIEW.map((item) => ({ label: item.label, value: item.value }))
        case 'wallets':
            return WALLET_OVERVIEW.map((item) => ({ label: item.label, value: item.value }))
        case 'transport':
            return [
                ...FLEET_SUMMARY.slice(0, 2).map((item) => ({ label: item.label, value: item.value })),
                ...FUEL_SUMMARY.slice(0, 2).map((item) => ({ label: item.label, value: item.value })),
            ]
        case 'accounting':
            return [
                { label: 'Trial Balance Accounts', value: String(TRIAL_BALANCE_REGISTER.length) },
                { label: 'Financial Statements', value: '4' },
                { label: 'Journal Vouchers', value: '12' },
                { label: 'Bank Reconciliation', value: '2 pending' },
            ]
        case 'reports':
            return REPORTS_OVERVIEW.map((item) => ({ label: item.label, value: item.value }))
        default:
            return []
    }
}

export const getSectionTable = (sectionKey) => {
    switch (sectionKey) {
        case 'fees':
            return {
                title: 'Fee Structures',
                columns: [
                    { key: 'id', label: 'Structure ID' },
                    { key: 'grade', label: 'Grade' },
                    { key: 'term', label: 'Term' },
                    { key: 'total', label: 'Total Fee' },
                    { key: 'status', label: 'Status', badge: true, badgeMap: feeStructureStatusBadgeColor },
                ],
                rows: FEE_STRUCTURES,
            }
        case 'fees-transactions':
            return {
                title: 'Recent Fee Collections',
                columns: [
                    { key: 'id', label: 'Txn ID' },
                    { key: 'student', label: 'Student' },
                    { key: 'className', label: 'Class' },
                    { key: 'paid', label: 'Paid' },
                    { key: 'balance', label: 'Balance' },
                    { key: 'status', label: 'Status', badge: true, badgeMap: transactionStatusBadgeColor },
                ],
                rows: FEE_TRANSACTIONS.slice(0, 8),
            }
        case 'collections':
            return {
                title: 'Income Register',
                columns: [
                    { key: 'id', label: 'Entry ID' },
                    { key: 'date', label: 'Date' },
                    { key: 'source', label: 'Source' },
                    { key: 'reference', label: 'Reference' },
                    { key: 'mode', label: 'Mode' },
                    { key: 'amount', label: 'Amount' },
                    { key: 'status', label: 'Status', badge: true, badgeMap: transactionStatusBadgeColor },
                ],
                rows: INCOME_REGISTER,
            }
        case 'collections-expenses':
            return {
                title: 'Expense Register',
                columns: [
                    { key: 'id', label: 'Entry ID' },
                    { key: 'date', label: 'Date' },
                    { key: 'category', label: 'Category' },
                    { key: 'paidTo', label: 'Paid To' },
                    { key: 'amount', label: 'Amount' },
                    { key: 'status', label: 'Status', badge: true, badgeMap: transactionStatusBadgeColor },
                ],
                rows: EXPENSE_REGISTER,
            }
        case 'wallets':
            return {
                title: 'User Wallets',
                columns: [
                    { key: 'walletId', label: 'Wallet ID' },
                    { key: 'name', label: 'Name' },
                    { key: 'role', label: 'Role' },
                    { key: 'balance', label: 'Balance' },
                    { key: 'lastRecharge', label: 'Last Recharge' },
                    { key: 'status', label: 'Status', badge: true, badgeMap: transactionStatusBadgeColor },
                ],
                rows: USER_WALLETS,
            }
        case 'transport-fleet':
            return {
                title: 'Fleet Vehicles',
                columns: [
                    { key: 'regNo', label: 'Reg. No.' },
                    { key: 'type', label: 'Type' },
                    { key: 'route', label: 'Route' },
                    { key: 'driver', label: 'Driver' },
                    { key: 'nextServiceDue', label: 'Next Service' },
                    { key: 'status', label: 'Status', badge: true, badgeMap: fleetStatusBadgeColor },
                ],
                rows: FLEET_VEHICLES,
            }
        case 'transport-claims':
            return {
                title: 'Fuel & Expense Claims',
                columns: [
                    { key: 'id', label: 'Claim ID' },
                    { key: 'claimant', label: 'Claimant' },
                    { key: 'vehicle', label: 'Vehicle' },
                    { key: 'type', label: 'Type' },
                    { key: 'amount', label: 'Amount' },
                    { key: 'status', label: 'Status', badge: true, badgeMap: claimStatusBadgeColor },
                ],
                rows: EXPENSE_CLAIMS,
            }
        case 'accounting':
            return {
                title: 'Trial Balance Snapshot',
                columns: [
                    { key: 'id', label: 'Entry ID' },
                    { key: 'account', label: 'Account' },
                    { key: 'debit', label: 'Debit' },
                    { key: 'credit', label: 'Credit' },
                    { key: 'department', label: 'Department' },
                    { key: 'campus', label: 'Campus' },
                ],
                rows: TRIAL_BALANCE_REGISTER,
            }
        case 'reports-income':
            return {
                title: 'Income Breakdown (YTD)',
                columns: [
                    { key: 'category', label: 'Category' },
                    { key: 'amount', label: 'Amount' },
                    { key: 'percent', label: 'Share' },
                    { key: 'vsLastTerm', label: 'vs Last Term' },
                ],
                rows: INCOME_BREAKDOWN,
            }
        case 'reports-expenditure':
            return {
                title: 'Expenditure Breakdown (YTD)',
                columns: [
                    { key: 'category', label: 'Category' },
                    { key: 'amount', label: 'Amount' },
                    { key: 'percent', label: 'Share' },
                    { key: 'vsLastTerm', label: 'vs Last Term' },
                ],
                rows: EXPENDITURE_BREAKDOWN,
            }
        default:
            return { title: '', columns: [], rows: [] }
    }
}

export const getSectionTables = (sectionKey) => {
    switch (sectionKey) {
        case 'fees':
            return [getSectionTable('fees'), getSectionTable('fees-transactions')]
        case 'collections':
            return [getSectionTable('collections'), getSectionTable('collections-expenses')]
        case 'transport':
            return [getSectionTable('transport-fleet'), getSectionTable('transport-claims')]
        case 'reports':
            return [getSectionTable('reports-income'), getSectionTable('reports-expenditure')]
        default:
            return [getSectionTable(sectionKey)]
    }
}

export const getSectionMeta = (sectionKey) =>
    FINANCE_SECTIONS.find((section) => section.key === sectionKey) ?? FINANCE_SECTIONS[0]
