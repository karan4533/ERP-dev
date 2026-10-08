export const SETTINGS_TABS = [
    { id: 'general', label: 'General' },
    { id: 'payment-configuration', label: 'Payment Configuration' },
    { id: 'fine-rules', label: 'Fine Rules' },
    { id: 'bank-accounts', label: 'Bank Accounts' },
    { id: 'pos-terminals', label: 'POS Terminals' },
    { id: 'roles-permissions', label: 'Roles & Permissions' },
    { id: 'notifications', label: 'Communication' },
    { id: 'integrations', label: 'Integrations' },
]

export const GENERAL_SETTINGS = {
    institutionName: 'Sample Public School',
    gstin: '33ABCDE1234F1Z5',
    academicYear: '2025–26',
    financialYearStart: 'April',
    currency: '₹ Indian Rupee (INR)',
    numberFormat: 'Indian (₹1,00,000)',
    dateFormat: 'DD MMM YYYY',
    termStructure: '3 Terms',
}

export const ACADEMIC_YEARS = ['2025–26', '2026–27']
export const FINANCIAL_YEAR_STARTS = ['April', 'January']
export const CURRENCIES = ['₹ Indian Rupee (INR)']
export const NUMBER_FORMATS = ['Indian (₹1,00,000)', 'International (₹100,000)']
export const DATE_FORMATS = ['DD MMM YYYY', 'DD/MM/YYYY', 'MM/DD/YYYY']
export const TERM_STRUCTURES = ['3 Terms', '2 Semesters', 'Annual']

export const BOOKS_CLOSURE_TOGGLES = [
    {
        id: 'lock-posted',
        label: 'Lock posted entries after period close',
        sub: 'Prevents edits to ledger entries once a month is closed',
        enabled: true,
    },
    {
        id: 'require-reopen-approval',
        label: 'Require approval to reopen closed period',
        sub: 'Only Principal can authorize reopening',
        enabled: true,
    },
]

export const PAYMENT_MODES = [
    { id: 'upi', label: 'UPI / QR', sub: 'Instant settlement via UPI gateway', enabled: true },
    { id: 'card', label: 'Debit / Credit Card', sub: '1.2% gateway fee applies', enabled: true },
    { id: 'netbanking', label: 'Net Banking', sub: 'No additional fee', enabled: true },
    { id: 'cash', label: 'Cash (front desk)', sub: 'Requires manual receipt generation', enabled: true },
    { id: 'cheque', label: 'Cheque / DD', sub: 'Subject to clearance before marking paid', enabled: true },
]

export const LATE_FEE_SETTINGS = {
    lateFeeType: 'Flat amount',
    lateFeeValue: '₹50 / week',
    gracePeriod: '3 days',
    reminderFrequency: 'Weekly',
}

export const LATE_FEE_TYPES = ['Flat amount', '% of due amount']
export const REMINDER_FREQUENCIES = ['Weekly', 'Every 3 days', 'Daily after due date']

export const TAX_SETTINGS = {
    gstApplicability: 'Exempt (Educational Services)',
    tdsOnVendor: 'Section 194C (Contracts)',
}

export const GST_APPLICABILITY_OPTIONS = [
    'Exempt (Educational Services)',
    'Applicable on select items',
]
export const TDS_OPTIONS = [
    'Section 194C (Contracts)',
    'Section 194J (Professional)',
    'Not applicable',
]

export const ROLE_PERMISSIONS = [
    {
        id: 'finance-manager',
        role: 'Finance Manager (You)',
        fees: 'Full CRUD',
        transport: 'Full CRUD',
        accounting: 'Full CRUD',
        approvals: 'Full CRUD',
        reports: 'Full CRUD',
        highlight: true,
    },
    {
        id: 'principal',
        role: 'Principal',
        fees: 'View + Approve',
        transport: 'View + Approve',
        accounting: 'View only',
        approvals: 'Full CRUD',
        reports: 'View only',
    },
    {
        id: 'transport-manager',
        role: 'Transport Manager',
        fees: 'No access',
        transport: 'View + Raise claims',
        accounting: 'No access',
        approvals: 'Raise only',
        reports: 'No access',
    },
    {
        id: 'cashier',
        role: 'Front Desk / Cashier',
        fees: 'Collect + View',
        transport: 'No access',
        accounting: 'No access',
        approvals: 'No access',
        reports: 'No access',
    },
    {
        id: 'auditor',
        role: 'Auditor (External)',
        fees: 'View only',
        transport: 'View only',
        accounting: 'View only',
        approvals: 'View only',
        reports: 'View only',
    },
]

export const FINANCE_MANAGER_ALERTS = [
    { id: 'new-approval', label: 'New approval request raised', sub: 'Email + in-app notification', enabled: true },
    { id: 'defaulter-30', label: 'Defaulter crosses 30 days overdue', sub: 'Daily digest email', enabled: true },
    { id: 'bank-mismatch', label: 'Bank reconciliation mismatch detected', sub: 'Immediate alert', enabled: true },
    { id: 'vehicle-doc', label: 'Vehicle document expiring within 30 days', sub: 'Weekly digest', enabled: true },
    { id: 'wallet-flag', label: 'Wallet flagged for suspicious activity', sub: 'Immediate alert', enabled: true },
]

export const COMMUNICATION_ALERTS = [
    { id: 'fee-reminders', label: 'Fee due reminders', sub: 'Sent via SMS + WhatsApp + Email', enabled: true },
    { id: 'payment-receipts', label: 'Payment confirmation receipts', sub: 'Sent immediately after successful payment', enabled: true },
    { id: 'wallet-low', label: 'Wallet low-balance alerts', sub: 'Sent to parent when balance falls below ₹100', enabled: true },
]

export const INTEGRATIONS = [
    {
        id: 'sbi',
        service: 'SBI Current A/c',
        purpose: 'Bank statement sync',
        status: 'Connected',
        action: 'Manage',
        icon: 'bank',
    },
    {
        id: 'razorpay',
        service: 'Razorpay / Payment Gateway',
        purpose: 'Online fee & wallet payments',
        status: 'Connected',
        action: 'Manage',
        icon: 'qr',
    },
    {
        id: 'whatsapp',
        service: 'WhatsApp Business API',
        purpose: 'Fee reminders & receipts',
        status: 'Connected',
        action: 'Manage',
        icon: 'whatsapp',
    },
    {
        id: 'smtp',
        service: 'Transactional Email (SMTP)',
        purpose: 'Receipts & statements',
        status: 'Deliverability issue',
        action: 'Troubleshoot',
        icon: 'mail',
    },
    {
        id: 'biometric',
        service: 'eSSL Biometric (eTimeTrackLite)',
        purpose: 'Attendance → payroll sync',
        status: 'Connected',
        action: 'Manage',
        icon: 'fingerprint',
    },
    {
        id: 'tally-zoho',
        service: 'Tally / Zoho Books',
        purpose: 'External BRS review — integration-ready placeholder',
        status: 'Not configured',
        action: 'Set up',
        icon: 'spreadsheet',
    },
    {
        id: 'gst-api',
        service: 'GST/HSN Rate API',
        purpose: 'Tax rate lookups for Finance module',
        status: 'Not configured',
        action: 'Set up',
        icon: 'spreadsheet',
    },
]

export const permissionBadgeColor = {
    'Full CRUD': 'bg-[#4CAF501A] text-[#4CAF50]',
    'View + Approve': 'bg-[#FF98001A] text-[#FF9800]',
    'View only': 'bg-[#FF98001A] text-[#FF9800]',
    'View + Raise claims': 'bg-[#FF98001A] text-[#FF9800]',
    'Collect + View': 'bg-[#FF98001A] text-[#FF9800]',
    'Raise only': 'bg-[#FF98001A] text-[#FF9800]',
    'No access': 'bg-[#EDEEF5] text-[#667085]',
}

export const integrationStatusBadgeColor = {
    Connected: 'bg-[#4CAF501A] text-[#4CAF50]',
    'Deliverability issue': 'bg-[#FF98001A] text-[#FF9800]',
    'Not configured': 'bg-[#EDEEF5] text-[#667085]',
}
