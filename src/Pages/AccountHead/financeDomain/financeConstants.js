export const FEE_FREQUENCIES = [
    { id: 'ONE_TIME', label: 'One Time' },
    { id: 'MONTHLY', label: 'Monthly' },
    { id: 'TERM_WISE', label: 'Term Wise' },
    { id: 'QUARTERLY', label: 'Quarterly' },
    { id: 'CUSTOM_INSTALLMENT', label: 'Custom Installment' },
]

export const FEE_INSTALLMENT_STATUSES = {
    UNPAID: 'UNPAID',
    PARTIALLY_PAID: 'PARTIALLY_PAID',
    PAID: 'PAID',
    OVERDUE: 'OVERDUE',
    WAIVED: 'WAIVED',
    CANCELLED: 'CANCELLED',
}

export const PAYMENT_MODES = {
    CASH: 'CASH',
    CHEQUE: 'CHEQUE',
    BANK_TRANSFER: 'BANK_TRANSFER',
    UPI: 'UPI',
    CARD_ONLINE: 'CARD_ONLINE',
    CARD_POS: 'CARD_POS',
    PAYMENT_GATEWAY: 'PAYMENT_GATEWAY',
}

export const PAYMENT_MODE_OPTIONS = [
    { id: PAYMENT_MODES.CASH, label: 'Cash' },
    { id: PAYMENT_MODES.CHEQUE, label: 'Cheque' },
    { id: PAYMENT_MODES.BANK_TRANSFER, label: 'Bank Transfer' },
    { id: PAYMENT_MODES.UPI, label: 'UPI' },
    { id: PAYMENT_MODES.CARD_ONLINE, label: 'Card — Online' },
    { id: PAYMENT_MODES.CARD_POS, label: 'Card — POS / Swipe' },
    { id: PAYMENT_MODES.PAYMENT_GATEWAY, label: 'Payment Gateway' },
]

export const TRANSACTION_DIRECTIONS = { IN: 'IN', OUT: 'OUT' }

export const SOURCE_MODULES = {
    FEES: 'FEES',
    TRANSPORT: 'TRANSPORT',
    PAYROLL: 'PAYROLL',
    WALLET: 'WALLET',
    PROCUREMENT: 'PROCUREMENT',
    MANUAL: 'MANUAL',
    OTHER: 'OTHER',
}

export const TRANSACTION_STATUSES = {
    DRAFT: 'DRAFT',
    PENDING_APPROVAL: 'PENDING_APPROVAL',
    APPROVED: 'APPROVED',
    POSTED: 'POSTED',
    REJECTED: 'REJECTED',
    REVERSED: 'REVERSED',
    PENDING_CLEARANCE: 'PENDING_CLEARANCE',
}

export const CHEQUE_STATUSES = {
    PDC: 'PDC',
    RECEIVED: 'RECEIVED',
    DEPOSITED: 'DEPOSITED',
    PENDING_CLEARANCE: 'PENDING_CLEARANCE',
    CLEARED: 'CLEARED',
    BOUNCED: 'BOUNCED',
    CANCELLED: 'CANCELLED',
}

export const FINE_TYPES = {
    NONE: 'NONE',
    FLAT: 'FLAT',
    DAILY: 'DAILY',
    WEEKLY: 'WEEKLY',
    PERCENTAGE: 'PERCENTAGE',
}

export const FINE_TYPE_OPTIONS = [
    { id: FINE_TYPES.NONE, label: 'None' },
    { id: FINE_TYPES.FLAT, label: 'Flat' },
    { id: FINE_TYPES.DAILY, label: 'Daily' },
    { id: FINE_TYPES.WEEKLY, label: 'Weekly' },
    { id: FINE_TYPES.PERCENTAGE, label: 'Percentage' },
]

export const MANUAL_ENTRY_TYPES = [
    { id: 'INCOME', label: 'Income' },
    { id: 'EXPENSE', label: 'Expense' },
    { id: 'CASH', label: 'Cash Entry' },
    { id: 'BANK', label: 'Bank Entry' },
    { id: 'CHEQUE', label: 'Cheque Entry' },
    { id: 'ADJUSTMENT', label: 'Adjustment' },
    { id: 'OPENING_BALANCE', label: 'Opening Balance' },
]

export const LEDGER_ACCOUNTS = {
    CASH: 'Cash in Hand',
    BANK: 'Bank — SBI Current A/c',
    FEE_INCOME: 'Fee Income — Tuition',
    TRANSPORT_INCOME: 'Fee Income — Transport',
    WALLET_FLOAT: 'Wallet Float (User Wallets)',
}

export const DEFAULT_BANK_ACCOUNT_ID = 'BANK-SBI-001'
export const DEFAULT_ACADEMIC_YEAR = '2026-2027'
export const ACTOR_FINANCE_HEAD = 'Finance Head'

export const installmentStatusBadgeColor = {
    PAID: 'bg-[#4CAF5033] text-[#4CAF50]',
    UNPAID: 'bg-[#FF980033] text-[#FF9800]',
    PARTIALLY_PAID: 'bg-[#2196F333] text-[#2196F3]',
    OVERDUE: 'bg-[#FF572233] text-[#FF5722]',
    WAIVED: 'bg-[#515DEF33] text-[#515DEF]',
    CANCELLED: 'bg-[#66708533] text-[#667085]',
}

export const chequeStatusBadgeColor = {
    PDC: 'bg-[#515DEF33] text-[#515DEF]',
    RECEIVED: 'bg-[#2196F333] text-[#2196F3]',
    DEPOSITED: 'bg-[#FF980033] text-[#FF9800]',
    PENDING_CLEARANCE: 'bg-[#FF980033] text-[#FF9800]',
    CLEARED: 'bg-[#4CAF5033] text-[#4CAF50]',
    BOUNCED: 'bg-[#FF572233] text-[#FF5722]',
    CANCELLED: 'bg-[#66708533] text-[#667085]',
}

export const transactionStatusBadgeColor = {
    DRAFT: 'bg-[#66708533] text-[#667085]',
    PENDING_APPROVAL: 'bg-[#FF980033] text-[#FF9800]',
    APPROVED: 'bg-[#2196F333] text-[#2196F3]',
    POSTED: 'bg-[#4CAF5033] text-[#4CAF50]',
    REJECTED: 'bg-[#FF572233] text-[#FF5722]',
    REVERSED: 'bg-[#FF572233] text-[#FF5722]',
    PENDING_CLEARANCE: 'bg-[#FF980033] text-[#FF9800]',
}

export const paymentModeLabel = (mode) =>
    PAYMENT_MODE_OPTIONS.find((item) => item.id === mode)?.label ?? mode
