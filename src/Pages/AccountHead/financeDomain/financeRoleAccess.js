import { ROLES } from '../../../constants/roles'

/** Campus ledger GET /finance/state (requires finance.collect or finance.write). */
export const FINANCE_LEDGER_ROLES = new Set([
    ROLES.ACCOUNT_HEAD,
    ROLES.FINANCE_MANAGER,
    ROLES.ACCOUNT_ASSISTANT,
    ROLES.FINANCE_ASSISTANT,
    ROLES.ADMIN,
    ROLES.SUPER_ADMIN,
])

/** PUT /finance/state and other finance.write actions. */
export const FINANCE_WRITE_ROLES = new Set([
    ROLES.ACCOUNT_HEAD,
    ROLES.FINANCE_MANAGER,
    ROLES.ADMIN,
    ROLES.SUPER_ADMIN,
])

/** finance.approve — Finance Head roles (and campus admins) only. */
export const FINANCE_APPROVE_ROLES = new Set([
    ROLES.ACCOUNT_HEAD,
    ROLES.FINANCE_MANAGER,
    ROLES.ADMIN,
    ROLES.SUPER_ADMIN,
])

/** Account Head–only UI paths Finance Assistant must not open. */
export const FINANCE_HEAD_ONLY_PATH_PREFIXES = [
    '/account-head/approvals',
    '/account-head/settings',
    '/account-head/payment-vouchers',
    '/account-head/annual-budget',
    '/account-head/mfp',
    '/account-head/fee-projection',
    '/account-head/book-fee',
    '/account-head/admission-referrals',
    '/account-head/admission-fee-waivers',
]

export function canLoadFinanceLedger(role) {
    return FINANCE_LEDGER_ROLES.has(role)
}

export function canWriteFinance(role) {
    return FINANCE_WRITE_ROLES.has(role)
}

export function canApproveFinance(role) {
    return FINANCE_APPROVE_ROLES.has(role)
}

export function isFinanceHeadOnlyPath(pathname) {
    return FINANCE_HEAD_ONLY_PATH_PREFIXES.some(
        (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
    )
}

/** Fee Management tabs Finance Assistant may use (collect / view outstanding / receipts). */
export const FINANCE_ASSISTANT_FEE_TAB_IDS = new Set([
    'fee-structure', // read-only in UI
    'fee-collection',
    'defaulters',
    'receipt-management',
    'activity-fees',
])

/**
 * Sidebar items for Finance Assistant (operational collect).
 * Head-only: approvals, settings, vouchers, budget, MFP, admission referrals.
 */
export function filterAccountHeadSidebarForRole(links, role) {
    if (role !== ROLES.FINANCE_ASSISTANT && role !== ROLES.ACCOUNT_ASSISTANT) return links
    const allowedTitles = new Set([
        'Dashboard',
        'Fees Management',
        'Collections',
        'Wallet Management',
        'Transport Finance',
        'Accounting',
        'Reports & Analytics',
        'Task Management',
    ])
    return links.filter((link) => allowedTitles.has(link.title))
}
