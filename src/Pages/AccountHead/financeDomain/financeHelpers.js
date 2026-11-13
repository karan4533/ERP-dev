import { addDays, differenceInCalendarDays, format, isValid, parseISO } from 'date-fns'
import {
    CHEQUE_STATUSES,
    FEE_INSTALLMENT_STATUSES,
    FINE_TYPES,
    LEDGER_ACCOUNTS,
    PAYMENT_MODES,
    SOURCE_MODULES,
    TRANSACTION_DIRECTIONS,
    TRANSACTION_STATUSES,
} from './financeConstants'

export const parseRupeeAmount = (value) => {
    if (typeof value === 'number') return Number.isFinite(value) ? value : 0
    return Number(String(value ?? '').replace(/[₹,\s]/g, '')) || 0
}

export const formatCurrency = (amount) => `₹${Math.round(Number(amount) || 0).toLocaleString('en-IN')}`

export const toIsoDate = (value) => {
    if (!value) return ''
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) return value.slice(0, 10)
    const date = value instanceof Date ? value : new Date(value)
    return isValid(date) ? format(date, 'yyyy-MM-dd') : ''
}

export const formatDisplayDate = (value) => {
    const iso = toIsoDate(value)
    if (!iso) return '—'
    const date = parseISO(iso)
    return isValid(date) ? format(date, 'dd MMM yyyy') : '—'
}

export const formatDisplayDateTime = (value = new Date()) => {
    const date = value instanceof Date ? value : new Date(value)
    if (!isValid(date)) return '—'
    return format(date, 'dd MMM yyyy, h:mm a')
}

export const padSeq = (value, size = 6) => String(value).padStart(size, '0')

export const generatePaymentReference = (seq) => `PAY-2026-${padSeq(seq)}`
export const generateReceiptNo = (seq) => `REC-2026-${padSeq(seq)}`
export const generateTransactionNo = (seq) => `TXN-2026-${padSeq(seq)}`
export const generateVoucherNo = (seq) => `JV-2026-${padSeq(seq, 4)}`

export const calculateNetFee = ({ feeAmount = 0, concessionAmount = 0, fineAmount = 0 }) =>
    Math.max(0, Number(feeAmount) - Number(concessionAmount) + Number(fineAmount))

export const calculateFeeBalance = ({ netAmount = 0, paidAmount = 0 }) =>
    Math.max(0, Number(netAmount) - Number(paidAmount))

export const calculateLateFee = ({
    dueDate,
    paymentDate,
    fineRule,
    feeAmount = 0,
    waived = false,
}) => {
    if (waived || !fineRule || !fineRule.active || fineRule.fineType === FINE_TYPES.NONE) return 0
    if (!dueDate || !paymentDate) return 0

    const due = parseISO(toIsoDate(dueDate))
    const paidOn = parseISO(toIsoDate(paymentDate))
    if (!isValid(due) || !isValid(paidOn)) return 0

    const gracePeriod = Number(fineRule.gracePeriod) || 0
    const graceEnd = addDays(due, gracePeriod)
    if (differenceInCalendarDays(paidOn, graceEnd) <= 0) return 0

    const daysLate = differenceInCalendarDays(paidOn, graceEnd)
    const value = Number(fineRule.fineValue) || 0
    const maxFine = Number(fineRule.maximumFine)
    let fine = 0

    switch (fineRule.fineType) {
        case FINE_TYPES.FLAT:
            fine = value
            break
        case FINE_TYPES.DAILY:
            fine = daysLate * value
            break
        case FINE_TYPES.WEEKLY:
            fine = Math.ceil(daysLate / 7) * value
            break
        case FINE_TYPES.PERCENTAGE:
            fine = (Number(feeAmount) * value) / 100
            break
        default:
            fine = 0
    }

    if (Number.isFinite(maxFine) && maxFine > 0) {
        fine = Math.min(fine, maxFine)
    }

    return Math.max(0, Math.round(fine))
}

export const calculateFeeStatus = ({
    paidAmount = 0,
    netAmount = 0,
    dueDate,
    asOfDate,
    forcedStatus,
}) => {
    if (forcedStatus === FEE_INSTALLMENT_STATUSES.WAIVED || forcedStatus === FEE_INSTALLMENT_STATUSES.CANCELLED) {
        return forcedStatus
    }

    const paid = Number(paidAmount) || 0
    const net = Number(netAmount) || 0

    if (net <= 0 || paid >= net) return FEE_INSTALLMENT_STATUSES.PAID
    if (paid > 0) return FEE_INSTALLMENT_STATUSES.PARTIALLY_PAID

    const due = toIsoDate(dueDate)
    const asOf = toIsoDate(asOfDate) || toIsoDate(new Date())
    if (due && asOf && asOf > due) return FEE_INSTALLMENT_STATUSES.OVERDUE
    return FEE_INSTALLMENT_STATUSES.UNPAID
}

export const resolveConcessionAmount = (installment, concessions = []) => {
    const match = concessions.find((item) => (
        item.studentId === installment.studentId
        && item.feeCategoryId === installment.feeCategoryId
        && String(item.status || '').toLowerCase() === 'approved'
        && (!item.academicYear || item.academicYear === installment.academicYear)
    ))
    if (match) return Number(match.amount) || 0
    return Number(installment.concessionAmount) || 0
}

export const hydrateInstallment = (installment, { fineRule, asOfDate, paymentDate } = {}) => {
    const alreadySettled = installment.forcedStatus === FEE_INSTALLMENT_STATUSES.PAID
        || installment.forcedStatus === FEE_INSTALLMENT_STATUSES.WAIVED
        || installment.forcedStatus === FEE_INSTALLMENT_STATUSES.CANCELLED

    const fineAmount = alreadySettled || installment.fineWaived
        ? 0
        : calculateLateFee({
            dueDate: installment.dueDate,
            paymentDate: paymentDate || asOfDate || new Date(),
            fineRule,
            feeAmount: installment.feeAmount,
            waived: installment.fineWaived,
        })

    const netAmount = calculateNetFee({
        feeAmount: installment.feeAmount,
        concessionAmount: installment.concessionAmount,
        fineAmount,
    })
    const paidAmount = Number(installment.paidAmount) || 0
    const balanceAmount = calculateFeeBalance({ netAmount, paidAmount })
    const status = calculateFeeStatus({
        paidAmount,
        netAmount,
        dueDate: installment.dueDate,
        asOfDate,
        forcedStatus: installment.forcedStatus,
    })

    return {
        ...installment,
        fineAmount,
        netAmount,
        paidAmount,
        balanceAmount,
        status,
        payable: status !== FEE_INSTALLMENT_STATUSES.PAID
            && status !== FEE_INSTALLMENT_STATUSES.WAIVED
            && status !== FEE_INSTALLMENT_STATUSES.CANCELLED
            && balanceAmount > 0,
    }
}

export const calculateStudentOutstanding = (installments) =>
    installments.reduce((total, row) => total + (Number(row.balanceAmount) || 0), 0)

export const summarizeStudentFees = (installments) => {
    const totalFee = installments.reduce((sum, row) => sum + (Number(row.feeAmount) || 0), 0)
    const totalConcession = installments.reduce((sum, row) => sum + (Number(row.concessionAmount) || 0), 0)
    const totalFine = installments.reduce((sum, row) => sum + (Number(row.fineAmount) || 0), 0)
    const netPayable = installments.reduce((sum, row) => sum + (Number(row.netAmount) || 0), 0)
    const paid = installments.reduce((sum, row) => sum + (Number(row.paidAmount) || 0), 0)
    const outstanding = Math.max(0, netPayable - paid)

    return { totalFee, totalConcession, totalFine, netPayable, paid, outstanding }
}

export const groupInstallmentsByMonth = (installments) => {
    const groups = []
    const index = new Map()

    installments.forEach((item) => {
        const key = item.installmentLabel || item.month || 'Other'
        if (!index.has(key)) {
            index.set(key, groups.length)
            groups.push({ label: key, month: item.month, items: [] })
        }
        groups[index.get(key)].items.push(item)
    })

    return groups
}

export const isOnlinePaymentMode = (mode) => (
    mode === PAYMENT_MODES.UPI
    || mode === PAYMENT_MODES.CARD_ONLINE
    || mode === PAYMENT_MODES.PAYMENT_GATEWAY
)

export const isBankPaymentMode = (mode) => (
    mode === PAYMENT_MODES.BANK_TRANSFER
    || mode === PAYMENT_MODES.CARD_POS
    || isOnlinePaymentMode(mode)
)

export const isChequePostDated = (chequeDate, asOfDate = new Date()) => {
    const cheque = toIsoDate(chequeDate)
    const asOf = toIsoDate(asOfDate)
    return Boolean(cheque && asOf && cheque > asOf)
}

export const validatePaymentInput = ({ amount, balanceAmount, mode, details = {} }) => {
    const errors = []
    const value = Number(amount)

    if (!value || value <= 0) errors.push('Amount must be greater than 0.')
    if (value > Number(balanceAmount)) errors.push('Amount cannot exceed the outstanding balance.')

    if (mode === PAYMENT_MODES.CHEQUE) {
        if (!details.chequeNo) errors.push('Cheque number is required.')
        if (!details.chequeDate) errors.push('Cheque date is required.')
        if (!details.bank) errors.push('Bank is required for cheque payments.')
    }

    if (mode === PAYMENT_MODES.BANK_TRANSFER) {
        if (!details.bankAccountId) errors.push('Bank account is required.')
        if (!details.transactionReference) errors.push('Transaction reference is required.')
        if (!details.transactionDate) errors.push('Transaction date is required.')
    }

    if (mode === PAYMENT_MODES.CARD_POS) {
        if (!details.terminalId) errors.push('Terminal ID is required.')
        if (!details.transactionReference) errors.push('POS transaction / RRN reference is required.')
    }

    if (isOnlinePaymentMode(mode) && !details.transactionReference) {
        errors.push('Transaction reference is required.')
    }

    return errors
}

export const applyPaymentToInstallments = (installments, allocations) => {
    const allocationMap = new Map(allocations.map((item) => [item.installmentId, Number(item.amount) || 0]))

    return installments.map((row) => {
        const extra = allocationMap.get(row.id) || 0
        if (!extra) return row
        const paidAmount = Number(row.paidAmount) + extra
        const netAmount = Number(row.netAmount)
        const balanceAmount = calculateFeeBalance({ netAmount, paidAmount })
        return {
            ...row,
            paidAmount,
            balanceAmount,
            status: calculateFeeStatus({
                paidAmount,
                netAmount,
                dueDate: row.dueDate,
                asOfDate: new Date(),
                forcedStatus: paidAmount >= netAmount ? FEE_INSTALLMENT_STATUSES.PAID : row.forcedStatus,
            }),
            forcedStatus: paidAmount >= netAmount ? FEE_INSTALLMENT_STATUSES.PAID : row.forcedStatus,
        }
    })
}

const modeToPaymentMethodLabel = (mode) => {
    if (mode === PAYMENT_MODES.CASH) return 'Cash'
    if (mode === PAYMENT_MODES.CHEQUE) return 'Cheque'
    if (mode === PAYMENT_MODES.BANK_TRANSFER) return 'NEFT (Manual)'
    if (mode === PAYMENT_MODES.UPI) return 'UPI'
    if (mode === PAYMENT_MODES.CARD_ONLINE || mode === PAYMENT_MODES.CARD_POS) return 'Card'
    if (mode === PAYMENT_MODES.PAYMENT_GATEWAY) return 'UPI'
    return 'Cash'
}

export const createAccountingPosting = ({
    transaction,
    student,
    amount,
    narration,
}) => {
    const iso = toIsoDate(transaction.transactionDate)
    const displayDate = formatDisplayDate(iso)
    const isCash = transaction.paymentMode === PAYMENT_MODES.CASH
    const isCheque = transaction.paymentMode === PAYMENT_MODES.CHEQUE
    const debitAccount = isCash ? LEDGER_ACCOUNTS.CASH : LEDGER_ACCOUNTS.BANK
    const creditAccount = transaction.category?.toLowerCase().includes('transport')
        ? LEDGER_ACCOUNTS.TRANSPORT_INCOME
        : LEDGER_ACCOUNTS.FEE_INCOME
    const amountLabel = formatCurrency(amount)
    const party = student?.name ?? 'Student'
    const description = narration || `Fee receipt — ${party}`

    const glLines = [
        {
            id: `GL-${transaction.id}-DR`,
            date: displayDate,
            dateIso: iso,
            voucherNo: transaction.voucherNo,
            ledgerAccount: debitAccount,
            description,
            debit: amountLabel,
            credit: '—',
            balance: amountLabel,
            referenceModule: 'Fees Management',
            sourceModule: SOURCE_MODULES.FEES,
            sourceTransactionId: transaction.id,
            referenceNo: transaction.transactionNo,
            voucherType: 'Receipt',
            department: 'Fees',
            financialYear: '2026–27',
            status: 'Posted',
        },
        {
            id: `GL-${transaction.id}-CR`,
            date: displayDate,
            dateIso: iso,
            voucherNo: transaction.voucherNo,
            ledgerAccount: creditAccount,
            description,
            debit: '—',
            credit: amountLabel,
            balance: amountLabel,
            referenceModule: 'Fees Management',
            sourceModule: SOURCE_MODULES.FEES,
            sourceTransactionId: transaction.id,
            referenceNo: transaction.transactionNo,
            voucherType: 'Receipt',
            department: 'Fees',
            financialYear: '2026–27',
            status: 'Posted',
        },
    ]

    const dayBookEntry = (isCash || isCheque) ? {
        id: `DB-${transaction.id}`,
        date: displayDate,
        voucherNo: transaction.voucherNo,
        transactionType: 'Income',
        ledgerHead: creditAccount,
        description,
        paymentMethod: modeToPaymentMethodLabel(transaction.paymentMode),
        debit: amountLabel,
        credit: '—',
        balance: amountLabel,
        enteredBy: transaction.createdBy,
        status: isCheque ? 'Pending Clearance' : 'Posted',
        department: 'Fees',
        sourceTransactionId: transaction.id,
        referenceNo: transaction.transactionNo,
        category: transaction.category,
        cash: isCash ? amountLabel : '—',
        bank: isCheque ? amountLabel : '—',
        narration: description,
        voucherType: 'Receipt',
    } : null

    const cashBookEntry = isCash ? {
        id: `CB-${transaction.id}`,
        date: displayDate,
        dateIso: iso,
        voucher: transaction.voucherNo,
        description,
        receipt: amountLabel,
        payment: '—',
        balance: amountLabel,
        cashAccount: LEDGER_ACCOUNTS.CASH,
        transactionType: 'Receipt',
        sourceTransactionId: transaction.id,
        referenceNo: transaction.transactionNo,
    } : null

    const bankBookEntry = (!isCash && transaction.status === TRANSACTION_STATUSES.POSTED) ? {
        id: `BB-${transaction.id}`,
        date: displayDate,
        dateIso: iso,
        bank: transaction.bankName || 'State Bank of India',
        accountNumber: transaction.bankAccountNumber || '38472910482',
        account: transaction.bankAccountName || LEDGER_ACCOUNTS.BANK.replace('Bank — ', ''),
        voucher: transaction.voucherNo,
        deposit: amountLabel,
        withdrawal: '—',
        balance: amountLabel,
        referenceNumber: transaction.reference || transaction.transactionNo,
        voucherType: 'Receipt',
        chequeNo: transaction.chequeDetails?.chequeNo || '—',
        description,
        sourceTransactionId: transaction.id,
        slNo: 1,
    } : null

    const onlineBookEntry = isOnlinePaymentMode(transaction.paymentMode) ? {
        id: `OLT-${transaction.id}`,
        dateTime: formatDisplayDateTime(transaction.transactionDate),
        dateIso: iso,
        transactionId: transaction.transactionNo,
        party,
        transactionType: 'Income',
        paymentGateway: 'Razorpay',
        paymentMethod: modeToPaymentMethodLabel(transaction.paymentMode),
        amount: amountLabel,
        bankReference: transaction.reference || transaction.transactionNo,
        status: 'Successful',
        sourceTransactionId: transaction.id,
        detail: {
            gatewayResponse: 'mock.captured — demo settlement',
            referenceNumber: transaction.reference || transaction.transactionNo,
            paymentDetails: {
                orderId: transaction.transactionNo,
                feeHead: transaction.category,
                paidBy: party,
                settlementDate: displayDate,
            },
            refundHistory: [],
            remarks: description,
        },
    } : null

    return { glLines, dayBookEntry, cashBookEntry, bankBookEntry, onlineBookEntry }
}

export const createFinanceTransaction = ({
    id,
    transactionNo,
    transactionDate,
    paymentMode,
    amount,
    student,
    category,
    reference,
    narration,
    status,
    createdBy,
    voucherNo,
    chequeDetails,
    bankAccount,
    sourceModule = SOURCE_MODULES.FEES,
}) => ({
    id,
    transactionNo,
    transactionDate: toIsoDate(transactionDate),
    direction: TRANSACTION_DIRECTIONS.IN,
    sourceModule,
    category,
    paymentMode,
    amount: Number(amount),
    studentId: student?.id,
    employeeId: undefined,
    vendorId: undefined,
    bankAccountId: bankAccount?.id,
    bankName: bankAccount?.bankName,
    bankAccountName: bankAccount?.name,
    bankAccountNumber: bankAccount?.accountNumber,
    chequeDetails: chequeDetails || undefined,
    reference,
    narration,
    status,
    voucherNo,
    createdBy,
    createdAt: new Date().toISOString(),
    receiptNo: undefined,
    installmentIds: [],
})

export const searchStudents = (students, query) => {
    const term = String(query || '').trim().toLowerCase()
    if (!term) return students
    return students.filter((student) => [
        student.name,
        student.admissionNo,
        student.rollNo,
        student.applicationNo,
        student.registerNo,
        student.phone,
        student.fatherName,
        student.motherName,
        `${student.className} ${student.section}`,
    ].some((field) => String(field || '').toLowerCase().includes(term)))
}

export const compareAcademicYears = (current, previous) => {
    const collectionPct = (row) => (row.netDemand > 0 ? (row.collected / row.netDemand) * 100 : 0)
    const defaulterPct = (row) => (row.netDemand > 0 ? (row.outstanding / row.netDemand) * 100 : 0)

    const currentCollection = collectionPct(current)
    const previousCollection = collectionPct(previous)
    const delta = currentCollection - previousCollection

    return {
        currentCollectionPct: currentCollection,
        previousCollectionPct: previousCollection,
        collectionDeltaPct: delta,
        currentDefaulterPct: defaulterPct(current),
        previousDefaulterPct: defaulterPct(previous),
    }
}

export const nextChequeStatus = (status) => {
    switch (status) {
        case CHEQUE_STATUSES.PDC:
            return CHEQUE_STATUSES.RECEIVED
        case CHEQUE_STATUSES.RECEIVED:
            return CHEQUE_STATUSES.DEPOSITED
        case CHEQUE_STATUSES.DEPOSITED:
            return CHEQUE_STATUSES.PENDING_CLEARANCE
        case CHEQUE_STATUSES.PENDING_CLEARANCE:
            return CHEQUE_STATUSES.CLEARED
        default:
            return status
    }
}
