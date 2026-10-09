import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react'
import {
    ACTOR_FINANCE_HEAD,
    CHEQUE_STATUSES,
    DEFAULT_BANK_ACCOUNT_ID,
    PAYMENT_MODES,
    SOURCE_MODULES,
    TRANSACTION_DIRECTIONS,
    TRANSACTION_STATUSES,
} from './financeConstants'
import {
    applyPaymentToInstallments,
    calculateStudentOutstanding,
    createAccountingPosting,
    createFinanceTransaction,
    formatCurrency,
    generatePaymentReference,
    generateReceiptNo,
    generateTransactionNo,
    generateVoucherNo,
    hydrateInstallment,
    isChequePostDated,
    resolveConcessionAmount,
    summarizeStudentFees,
    toIsoDate,
    validatePaymentInput,
} from './financeHelpers'
import { BUDGET_SEED } from '../../../Common/demoDomain/financeExtras'
import {
    BANK_ACCOUNTS,
    FEE_CATEGORIES,
    FEE_CONCESSIONS,
    FEE_INSTALLMENTS,
    FEE_STRUCTURES,
    FINANCE_STUDENTS,
    FINE_RULES,
    POS_TERMINALS,
    SEED_CHEQUES,
    SEED_RECEIPTS,
    getFineRuleForCategory,
} from './financeMasters'
import {
    DEFAULT_FINANCE_SEQUENCE,
    FINANCE_STORAGE_KEY,
    clearFinanceState,
    cloneJson,
    initialPersistedList,
    loadFinanceState,
    pickPersistedSequence,
    saveFinanceState,
} from './financeStorage'
import { isApiFinanceEnabled } from '../../../services/apiClient'
import {
    applyHrConcessionsApi,
    collectPaymentApi,
    decideApprovalApi,
    gatewayIntentApi,
    pullFinanceState,
    pushFinanceState,
    sendReceiptApi,
    settleChequeApi,
} from '../../../services/financeApi'
import { FLEET_VEHICLES } from '../TransportFinance/transportFinanceData'
import { RECHARGE_RECORDS, USER_WALLETS } from '../WalletManagement/walletManagementData'
import { PENDING_REQUESTS } from '../Approvals/approvalsData'

const FinanceContext = createContext(null)

const clone = (value) => cloneJson(value)

/** Empty campus snapshot — never inject demo receipts/fees as production SoT. */
const createEmptyFinanceState = () => ({
    students: [],
    feeCategories: [],
    feeStructures: [],
    fineRules: [],
    bankAccounts: [],
    posTerminals: [],
    concessions: [],
    installments: [],
    annualBudget: [],
    transactions: [],
    receipts: [],
    cheques: [],
    paymentLinks: [],
    auditLog: [],
    glEntries: [],
    dayBookEntries: [],
    cashBookEntries: [],
    bankBookEntries: [],
    onlineBookEntries: [],
    reconciliationItems: [],
    activityFees: [],
    wallets: [],
    walletRecharges: [],
    transportFleet: [],
    approvals: [],
    sequence: { pay: 1, rec: 1, txn: 1, voucher: 1, link: 1 },
    meta: { seeded: true },
})

const apiMode = () => isApiFinanceEnabled()

export const FinanceProvider = ({ children }) => {
    const offlineAllowed = !apiMode()
    const savedEnvelopeRef = useRef(undefined)
    if (savedEnvelopeRef.current === undefined) {
        // API mode: ignore localStorage as SoT. Offline flag-off only may use cache.
        savedEnvelopeRef.current = offlineAllowed ? loadFinanceState() : null
    }
    const saved = savedEnvelopeRef.current?.data ?? null
    const boot = offlineAllowed ? saved : null

    const seq = useRef(pickPersistedSequence(boot))
    const submittingRef = useRef(false)
    const skipPersistRef = useRef(false)
    const apiHydratedRef = useRef(false)
    const pushTimerRef = useRef(null)

    const [financeStatus, setFinanceStatus] = useState(() => (apiMode() ? 'loading' : 'ready'))
    const [financeError, setFinanceError] = useState(null)

    const emptyBoot = []
    const [students, setStudents] = useState(() => initialPersistedList(boot, 'students', offlineAllowed ? FINANCE_STUDENTS : emptyBoot))
    const [feeCategories, setFeeCategories] = useState(() => initialPersistedList(boot, 'feeCategories', offlineAllowed ? FEE_CATEGORIES : emptyBoot))
    const [feeStructures, setFeeStructures] = useState(() => initialPersistedList(boot, 'feeStructures', offlineAllowed ? FEE_STRUCTURES : emptyBoot))
    const [fineRules, setFineRules] = useState(() => initialPersistedList(boot, 'fineRules', offlineAllowed ? FINE_RULES : emptyBoot))
    const [bankAccounts, setBankAccounts] = useState(() => initialPersistedList(boot, 'bankAccounts', offlineAllowed ? BANK_ACCOUNTS : emptyBoot))
    const [posTerminals, setPosTerminals] = useState(() => initialPersistedList(boot, 'posTerminals', offlineAllowed ? POS_TERMINALS : emptyBoot))
    const [concessions, setConcessions] = useState(() => initialPersistedList(boot, 'concessions', offlineAllowed ? FEE_CONCESSIONS : emptyBoot))
    const [installments, setInstallments] = useState(() => initialPersistedList(boot, 'installments', offlineAllowed ? FEE_INSTALLMENTS : emptyBoot))
    const [annualBudget, setAnnualBudget] = useState(() => initialPersistedList(boot, 'annualBudget', offlineAllowed ? BUDGET_SEED : emptyBoot))
    const [transactions, setTransactions] = useState(() => initialPersistedList(boot, 'transactions', emptyBoot))
    const [receipts, setReceipts] = useState(() => initialPersistedList(boot, 'receipts', offlineAllowed ? SEED_RECEIPTS : emptyBoot))
    const [cheques, setCheques] = useState(() => initialPersistedList(boot, 'cheques', offlineAllowed ? SEED_CHEQUES : emptyBoot))
    const [paymentLinks, setPaymentLinks] = useState(() => initialPersistedList(boot, 'paymentLinks', emptyBoot))
    const [auditLog, setAuditLog] = useState(() => initialPersistedList(boot, 'auditLog', emptyBoot))
    const [glEntries, setGlEntries] = useState(() => initialPersistedList(boot, 'glEntries', emptyBoot))
    const [dayBookEntries, setDayBookEntries] = useState(() => initialPersistedList(boot, 'dayBookEntries', emptyBoot))
    const [cashBookEntries, setCashBookEntries] = useState(() => initialPersistedList(boot, 'cashBookEntries', emptyBoot))
    const [bankBookEntries, setBankBookEntries] = useState(() => initialPersistedList(boot, 'bankBookEntries', emptyBoot))
    const [onlineBookEntries, setOnlineBookEntries] = useState(() => initialPersistedList(boot, 'onlineBookEntries', emptyBoot))
    const [reconciliationItems, setReconciliationItems] = useState(() => initialPersistedList(boot, 'reconciliationItems', emptyBoot))
    const [wallets, setWallets] = useState(() => initialPersistedList(boot, 'wallets', offlineAllowed ? USER_WALLETS : emptyBoot))
    const [walletRecharges, setWalletRecharges] = useState(() => initialPersistedList(boot, 'walletRecharges', offlineAllowed ? RECHARGE_RECORDS : emptyBoot))
    const [transportFleet, setTransportFleet] = useState(() => initialPersistedList(boot, 'transportFleet', offlineAllowed ? FLEET_VEHICLES : emptyBoot))
    const [approvals, setApprovals] = useState(() => initialPersistedList(
        boot,
        'approvals',
        offlineAllowed ? PENDING_REQUESTS.map((row) => ({ ...row, status: 'Pending' })) : emptyBoot,
    ))
    const [lastSavedAt, setLastSavedAt] = useState(() => savedEnvelopeRef.current?.savedAt ?? null)

    const appendAudit = useCallback((entry) => {
        setAuditLog((prev) => [{
            id: `AUD-${Date.now()}-${prev.length}`,
            performedAt: new Date().toISOString(),
            performedBy: entry.performedBy || ACTOR_FINANCE_HEAD,
            ...entry,
        }, ...prev])
    }, [])

    const applyFinanceData = useCallback((data) => {
        if (!data || typeof data !== 'object') return
        skipPersistRef.current = true
        seq.current = pickPersistedSequence(data)
        const fb = []
        setStudents(initialPersistedList(data, 'students', fb))
        setFeeCategories(initialPersistedList(data, 'feeCategories', fb))
        setFeeStructures(initialPersistedList(data, 'feeStructures', fb))
        setFineRules(initialPersistedList(data, 'fineRules', fb))
        setBankAccounts(initialPersistedList(data, 'bankAccounts', fb))
        setPosTerminals(initialPersistedList(data, 'posTerminals', fb))
        setConcessions(initialPersistedList(data, 'concessions', fb))
        setInstallments(initialPersistedList(data, 'installments', fb))
        setAnnualBudget(initialPersistedList(data, 'annualBudget', fb))
        setTransactions(initialPersistedList(data, 'transactions', fb))
        setReceipts(initialPersistedList(data, 'receipts', fb))
        setCheques(initialPersistedList(data, 'cheques', fb))
        setPaymentLinks(initialPersistedList(data, 'paymentLinks', fb))
        setAuditLog(initialPersistedList(data, 'auditLog', fb))
        setGlEntries(initialPersistedList(data, 'glEntries', fb))
        setDayBookEntries(initialPersistedList(data, 'dayBookEntries', fb))
        setCashBookEntries(initialPersistedList(data, 'cashBookEntries', fb))
        setBankBookEntries(initialPersistedList(data, 'bankBookEntries', fb))
        setOnlineBookEntries(initialPersistedList(data, 'onlineBookEntries', fb))
        setReconciliationItems(initialPersistedList(data, 'reconciliationItems', fb))
        setWallets(initialPersistedList(data, 'wallets', fb))
        setWalletRecharges(initialPersistedList(data, 'walletRecharges', fb))
        setTransportFleet(initialPersistedList(data, 'transportFleet', fb))
        setApprovals(initialPersistedList(data, 'approvals', fb))
    }, [])

    const hydratedInstallments = useMemo(() => (
        installments.map((row) => hydrateInstallment({
            ...row,
            concessionAmount: resolveConcessionAmount(row, concessions),
        }, {
            fineRule: getFineRuleForCategory(fineRules, row.feeCategoryId),
            asOfDate: new Date(),
        }))
    ), [concessions, fineRules, installments])

    const getStudentById = useCallback(
        (id) => students.find((student) => student.id === id) ?? null,
        [students],
    )

    const getInstallmentsForStudent = useCallback(
        (studentId, academicYear) => hydratedInstallments.filter((row) => (
            row.studentId === studentId
            && (!academicYear || row.academicYear === academicYear)
        )),
        [hydratedInstallments],
    )

    const getSiblings = useCallback((studentId) => {
        const student = getStudentById(studentId)
        if (!student?.familyId) return []
        return students.filter((item) => item.familyId === student.familyId && item.id !== studentId)
    }, [getStudentById, students])

    const getStudentSummary = useCallback((studentId, academicYear) => {
        const rows = getInstallmentsForStudent(studentId, academicYear)
        return summarizeStudentFees(rows)
    }, [getInstallmentsForStudent])

    const postAccounting = useCallback((posting) => {
        if (posting.glLines?.length) {
            setGlEntries((prev) => [...posting.glLines, ...prev])
        }
        if (posting.dayBookEntry) {
            setDayBookEntries((prev) => [posting.dayBookEntry, ...prev])
        }
        if (posting.cashBookEntry) {
            setCashBookEntries((prev) => [posting.cashBookEntry, ...prev])
        }
        if (posting.bankBookEntry) {
            setBankBookEntries((prev) => [posting.bankBookEntry, ...prev])
        }
        if (posting.onlineBookEntry) {
            setOnlineBookEntries((prev) => [posting.onlineBookEntry, ...prev])
        }
    }, [])

    const collectFeePayment = useCallback(async (payload) => {
        if (submittingRef.current) {
            return { success: false, errors: ['A payment is already being processed.'] }
        }

        if (isApiFinanceEnabled() && apiHydratedRef.current) {
            try {
                submittingRef.current = true
                const result = await collectPaymentApi(payload)
                if (result?.state?.data) applyFinanceData(result.state.data)
                return {
                    success: true,
                    receipt: result.receipt,
                    transaction: result.transaction,
                }
            } catch (error) {
                return { success: false, errors: [error.message || 'Payment failed on server.'] }
            } finally {
                submittingRef.current = false
            }
        }

        const {
            studentId,
            allocations,
            paymentMode,
            details = {},
            collectedBy = ACTOR_FINANCE_HEAD,
            paymentDate,
            narration,
        } = payload

        const student = getStudentById(studentId)
        if (!student) return { success: false, errors: ['Student not found.'] }

        const selected = (allocations || []).filter((item) => Number(item.amount) > 0)
        if (!selected.length) return { success: false, errors: ['Select at least one payable instalment.'] }

        const totalAmount = selected.reduce((sum, item) => sum + Number(item.amount), 0)
        const liveRows = getInstallmentsForStudent(studentId, student.academicYear)
        const selectedBalance = selected.reduce((sum, item) => {
            const row = liveRows.find((entry) => entry.id === item.installmentId)
            return sum + (row?.balanceAmount || 0)
        }, 0)

        const errors = validatePaymentInput({
            amount: totalAmount,
            balanceAmount: selectedBalance,
            mode: paymentMode,
            details,
        })
        if (errors.length) return { success: false, errors }

        submittingRef.current = true

        try {
            seq.current.pay += 1
            seq.current.txn += 1
            seq.current.voucher += 1
            seq.current.rec += 1

            const payRef = details.paymentReference || generatePaymentReference(seq.current.pay)
            const txnNo = generateTransactionNo(seq.current.txn)
            const voucherNo = generateVoucherNo(seq.current.voucher)
            const receiptNo = generateReceiptNo(seq.current.rec)
            const txnId = `FT-${Date.now()}`
            const isoDate = toIsoDate(paymentDate || details.transactionDate || new Date())
            const bankAccount = bankAccounts.find((item) => item.id === (details.bankAccountId || DEFAULT_BANK_ACCOUNT_ID))
            const chequePostDated = paymentMode === PAYMENT_MODES.CHEQUE && isChequePostDated(details.chequeDate, isoDate)
            const holdsFunds = paymentMode === PAYMENT_MODES.CHEQUE
            const status = holdsFunds
                ? TRANSACTION_STATUSES.PENDING_CLEARANCE
                : TRANSACTION_STATUSES.POSTED

            const feeHeads = selected.map((item) => {
                const row = liveRows.find((entry) => entry.id === item.installmentId)
                return row?.feeHead
            }).filter(Boolean)

            const chequeDetails = paymentMode === PAYMENT_MODES.CHEQUE ? {
                chequeNo: details.chequeNo,
                chequeDate: details.chequeDate,
                bank: details.bank,
                branch: details.branch || '',
                receivedDate: details.receivedDate || isoDate,
                status: chequePostDated ? CHEQUE_STATUSES.PDC : CHEQUE_STATUSES.RECEIVED,
            } : undefined

            const transaction = {
                ...createFinanceTransaction({
                    id: txnId,
                    transactionNo: txnNo,
                    transactionDate: isoDate,
                    paymentMode,
                    amount: totalAmount,
                    student,
                    category: feeHeads[0] || 'Student Fees',
                    reference: details.transactionReference || payRef,
                    narration: narration || details.narration || `Fee collection — ${student.name}`,
                    status,
                    createdBy: collectedBy,
                    voucherNo,
                    chequeDetails,
                    bankAccount,
                }),
                receiptNo,
                installmentIds: selected.map((item) => item.installmentId),
                allocations: selected,
                paymentReference: payRef,
            }

            const receipt = {
                id: `RCP-${txnId}`,
                receiptNo,
                studentId,
                academicYear: student.academicYear,
                className: `${student.className}-${student.section}`,
                admissionNo: student.admissionNo,
                paymentDate: isoDate,
                feeHeads,
                grossFee: selected.reduce((sum, item) => {
                    const row = liveRows.find((entry) => entry.id === item.installmentId)
                    return sum + (row?.feeAmount || 0)
                }, 0),
                concession: selected.reduce((sum, item) => {
                    const row = liveRows.find((entry) => entry.id === item.installmentId)
                    return sum + (row?.concessionAmount || 0)
                }, 0),
                fine: selected.reduce((sum, item) => {
                    const row = liveRows.find((entry) => entry.id === item.installmentId)
                    return sum + (row?.fineAmount || 0)
                }, 0),
                amountPaid: totalAmount,
                paymentMode,
                transactionReference: transaction.reference,
                balance: selectedBalance - totalAmount,
                collectedBy,
                installmentIds: selected.map((item) => item.installmentId),
                reprintCount: 0,
                lastReprintedAt: null,
                lastReprintedBy: null,
                reprintReason: null,
                status: holdsFunds ? 'Pending clearance' : 'Issued',
                communication: { email: false, whatsapp: false },
                transactionId: txnId,
            }

            if (!holdsFunds) {
                setInstallments((prev) => {
                    const stamped = prev.map((row) => {
                        const live = liveRows.find((item) => item.id === row.id)
                        if (!live || !selected.some((item) => item.installmentId === row.id)) return row
                        return { ...row, fineAmount: live.fineAmount, netAmount: live.netAmount }
                    })
                    return applyPaymentToInstallments(stamped, selected)
                })
                const posting = createAccountingPosting({
                    transaction,
                    student,
                    amount: totalAmount,
                    narration: transaction.narration,
                })
                postAccounting(posting)
            } else {
                setCheques((prev) => [{
                    id: `CHQ-${txnId}`,
                    transactionId: txnId,
                    studentId,
                    chequeNo: chequeDetails.chequeNo,
                    bank: chequeDetails.bank,
                    branch: chequeDetails.branch,
                    chequeDate: chequeDetails.chequeDate,
                    receivedDate: chequeDetails.receivedDate,
                    amount: totalAmount,
                    status: chequeDetails.status,
                    narration: transaction.narration,
                    installmentAllocations: selected,
                }, ...prev])
            }

            setTransactions((prev) => [transaction, ...prev])
            setReceipts((prev) => [receipt, ...prev])
            appendAudit({
                action: holdsFunds ? 'CHEQUE_RECEIVED' : 'FEE_PAYMENT_COLLECTED',
                entity: 'FinanceTransaction',
                entityId: txnId,
                newValue: `${formatCurrency(totalAmount)} via ${paymentMode}`,
                reason: transaction.narration,
            })

            return { success: true, transaction, receipt, paymentReference: payRef, held: holdsFunds }
        } finally {
            submittingRef.current = false
        }
    }, [appendAudit, bankAccounts, getInstallmentsForStudent, getStudentById, postAccounting])

    const settleCheque = useCallback(async (chequeId, nextStatus, reason = '') => {
        if (isApiFinanceEnabled() && apiHydratedRef.current) {
            try {
                const result = await settleChequeApi({ chequeId, status: nextStatus, reason })
                if (result?.state?.data) applyFinanceData(result.state.data)
                return { success: true }
            } catch (error) {
                return { success: false, message: error.message || 'Cheque update failed.' }
            }
        }
        const cheque = cheques.find((item) => item.id === chequeId)
        if (!cheque) return { success: false, message: 'Cheque not found.' }

        setCheques((prev) => prev.map((item) => (
            item.id === chequeId ? { ...item, status: nextStatus } : item
        )))

        setTransactions((prev) => prev.map((txn) => {
            if (txn.id !== cheque.transactionId) return txn
            return {
                ...txn,
                status: nextStatus === CHEQUE_STATUSES.CLEARED
                    ? TRANSACTION_STATUSES.POSTED
                    : nextStatus === CHEQUE_STATUSES.BOUNCED
                        ? TRANSACTION_STATUSES.REVERSED
                        : TRANSACTION_STATUSES.PENDING_CLEARANCE,
                chequeDetails: { ...txn.chequeDetails, status: nextStatus },
            }
        }))

        if (nextStatus === CHEQUE_STATUSES.CLEARED && cheque.installmentAllocations) {
            const student = getStudentById(cheque.studentId)
            const txn = transactions.find((item) => item.id === cheque.transactionId)
            setInstallments((prev) => applyPaymentToInstallments(prev, cheque.installmentAllocations))
            if (txn) {
                const posted = { ...txn, status: TRANSACTION_STATUSES.POSTED }
                postAccounting(createAccountingPosting({
                    transaction: posted,
                    student,
                    amount: cheque.amount,
                    narration: cheque.narration,
                }))
                setReceipts((prev) => prev.map((receipt) => (
                    receipt.transactionId === txn.id ? { ...receipt, status: 'Issued' } : receipt
                )))
            }
        }

        appendAudit({
            action: nextStatus === CHEQUE_STATUSES.BOUNCED ? 'CHEQUE_BOUNCED' : 'CHEQUE_STATUS_CHANGED',
            entity: 'Cheque',
            entityId: chequeId,
            oldValue: cheque.status,
            newValue: nextStatus,
            reason,
        })

        return { success: true }
    }, [appendAudit, applyFinanceData, cheques, getStudentById, postAccounting, transactions])

    const decideApproval = useCallback(async ({ approvalId, decision, remarks }) => {
        if (isApiFinanceEnabled() && apiHydratedRef.current) {
            try {
                const result = await decideApprovalApi({ approvalId, decision, remarks })
                if (result?.state?.data) applyFinanceData(result.state.data)
                return { success: true, approval: result.approval }
            } catch (error) {
                return { success: false, message: error.message }
            }
        }
        setApprovals((prev) => prev.map((row) => (
            row.id === approvalId
                ? {
                    ...row,
                    status: decision === 'approved' ? 'Approved' : 'Rejected',
                    decidedAt: new Date().toISOString(),
                    remarks: remarks || '',
                }
                : row
        )))
        return { success: true }
    }, [applyFinanceData])

    const applyHrConcessions = useCallback(async () => {
        if (!isApiFinanceEnabled()) {
            return { success: false, message: 'Finance API is off.' }
        }
        try {
            const result = await applyHrConcessionsApi()
            if (result?.state?.data) applyFinanceData(result.state.data)
            return { success: true, applied: result.applied }
        } catch (error) {
            return { success: false, message: error.message }
        }
    }, [applyFinanceData])

    const waiveFine = useCallback(({ installmentId, reason, changedBy = ACTOR_FINANCE_HEAD }) => {
        if (!reason?.trim()) return { success: false, message: 'Reason is required to waive a fine.' }
        const current = installments.find((row) => row.id === installmentId)
        if (!current) return { success: false, message: 'Instalment not found.' }

        setInstallments((prev) => prev.map((row) => (
            row.id === installmentId
                ? {
                    ...row,
                    fineWaived: true,
                    fineAmount: 0,
                    fineWaiver: {
                        reason: reason.trim(),
                        changedBy,
                        changedAt: new Date().toISOString(),
                    },
                }
                : row
        )))
        appendAudit({
            action: 'FINE_WAIVED',
            entity: 'FeeInstallment',
            entityId: installmentId,
            oldValue: String(current.fineAmount ?? 0),
            newValue: '0',
            reason,
            performedBy: changedBy,
        })
        return { success: true }
    }, [appendAudit, installments])

    const generatePaymentLink = useCallback(async ({ studentId, amount, installmentIds }) => {
        if (isApiFinanceEnabled() && apiHydratedRef.current) {
            try {
                const result = await gatewayIntentApi({ studentId, amount, installmentIds })
                if (result?.state?.data) applyFinanceData(result.state.data)
                const intent = result.intent || {}
                return {
                    ...intent,
                    url: intent.url?.startsWith('http')
                        ? intent.url
                        : `${window.location.origin}${intent.url || ''}`,
                }
            } catch (error) {
                console.error(error)
            }
        }
        seq.current.link += 1
        const reference = generatePaymentReference(seq.current.link)
        const student = getStudentById(studentId)
        const link = {
            id: `LNK-${reference}`,
            reference,
            studentId,
            amount,
            installmentIds,
            url: `${window.location.origin}/student/payment/fees-payment?ref=${reference}`,
            status: 'OPEN',
            gateway: 'stub',
            createdAt: new Date().toISOString(),
        }
        setPaymentLinks((prev) => [link, ...prev])
        appendAudit({
            action: 'PAYMENT_LINK_GENERATED',
            entity: 'PaymentLink',
            entityId: link.id,
            newValue: reference,
            reason: `Payment link for ${student?.name ?? studentId}`,
        })
        return link
    }, [appendAudit, applyFinanceData, getStudentById])

    const reprintReceipt = useCallback(({ receiptId, reason, reprintedBy = ACTOR_FINANCE_HEAD }) => {
        const receipt = receipts.find((item) => item.id === receiptId)
        if (!receipt) return { success: false, message: 'Receipt not found.' }
        setReceipts((prev) => prev.map((item) => (
            item.id === receiptId
                ? {
                    ...item,
                    reprintCount: (item.reprintCount || 0) + 1,
                    lastReprintedAt: new Date().toISOString(),
                    lastReprintedBy: reprintedBy,
                    reprintReason: reason || item.reprintReason,
                }
                : item
        )))
        appendAudit({
            action: 'RECEIPT_REPRINTED',
            entity: 'Receipt',
            entityId: receiptId,
            oldValue: String(receipt.reprintCount || 0),
            newValue: String((receipt.reprintCount || 0) + 1),
            reason,
            performedBy: reprintedBy,
        })
        return { success: true, receiptNo: receipt.receiptNo }
    }, [appendAudit, receipts])

    const sendReceipt = useCallback(async ({ receiptId, channel }) => {
        if (isApiFinanceEnabled() && apiHydratedRef.current) {
            try {
                const result = await sendReceiptApi({ receiptId, channel })
                if (result?.state?.data) applyFinanceData(result.state.data)
                return {
                    success: true,
                    receiptNo: result.receipt?.receiptNo,
                    delivery: result.delivery,
                    queuedStub: result.delivery?.status === 'queued_stub',
                }
            } catch (error) {
                return { success: false, message: error.message || 'Send failed.' }
            }
        }
        return { success: false, message: 'Finance API is required to queue receipt delivery.' }
    }, [applyFinanceData])

    const addFeeStructure = useCallback((structure) => {
        const id = structure.id || `FS-${Date.now()}`
        setFeeStructures((prev) => [{ ...structure, id, status: structure.status || 'ACTIVE' }, ...prev])
        appendAudit({
            action: 'FEE_STRUCTURE_CHANGED',
            entity: 'FeeStructure',
            entityId: id,
            newValue: `${structure.feeHead} ${formatCurrency(structure.amount)}`,
            reason: 'Structure defined',
        })
        return id
    }, [appendAudit])

    const addFeeCategory = useCallback((name) => {
        const id = `CAT-${name.toUpperCase().replace(/\s+/g, '-')}`
        setFeeCategories((prev) => {
            if (prev.some((item) => item.id === id)) return prev
            return [...prev, { id, name, code: id.replace('CAT-', ''), active: true }]
        })
        return id
    }, [])

    const addManualEntry = useCallback((entry) => {
        seq.current.txn += 1
        seq.current.voucher += 1
        const transaction = createFinanceTransaction({
            id: `MAN-${Date.now()}`,
            transactionNo: generateTransactionNo(seq.current.txn),
            transactionDate: entry.date,
            paymentMode: entry.paymentMode || PAYMENT_MODES.CASH,
            amount: Number(entry.amount),
            student: null,
            category: entry.category || 'Manual',
            reference: entry.reference || generateVoucherNo(seq.current.voucher),
            narration: entry.narration,
            status: entry.status || TRANSACTION_STATUSES.DRAFT,
            createdBy: entry.createdBy || ACTOR_FINANCE_HEAD,
            voucherNo: generateVoucherNo(seq.current.voucher),
            bankAccount: bankAccounts.find((item) => item.id === entry.bankAccountId),
            sourceModule: SOURCE_MODULES.MANUAL,
        })
        transaction.direction = entry.direction || TRANSACTION_DIRECTIONS.IN
        transaction.entryType = entry.entryType
        setTransactions((prev) => [transaction, ...prev])
        appendAudit({
            action: 'MANUAL_ENTRY_CREATED',
            entity: 'FinanceTransaction',
            entityId: transaction.id,
            newValue: transaction.status,
            reason: entry.narration,
        })
        return transaction
    }, [appendAudit, bankAccounts])

    const postManualEntry = useCallback((transactionId) => {
        const transaction = transactions.find((item) => item.id === transactionId)
        if (!transaction) return { success: false, message: 'Entry not found.' }
        if (transaction.status === TRANSACTION_STATUSES.POSTED) {
            return { success: false, message: 'Posted entries cannot be silently edited. Use reversal.' }
        }
        const posted = { ...transaction, status: TRANSACTION_STATUSES.POSTED }
        setTransactions((prev) => prev.map((item) => (item.id === transactionId ? posted : item)))
        postAccounting(createAccountingPosting({
            transaction: posted,
            student: getStudentById(transaction.studentId),
            amount: transaction.amount,
            narration: transaction.narration,
        }))
        appendAudit({
            action: 'MANUAL_ENTRY_POSTED',
            entity: 'FinanceTransaction',
            entityId: transactionId,
            oldValue: transaction.status,
            newValue: TRANSACTION_STATUSES.POSTED,
            reason: transaction.narration,
        })
        return { success: true }
    }, [appendAudit, getStudentById, postAccounting, transactions])

    const editNarration = useCallback(({ transactionId, narration, reason, changedBy = ACTOR_FINANCE_HEAD }) => {
        const transaction = transactions.find((item) => item.id === transactionId)
        if (!transaction) return { success: false, message: 'Transaction not found.' }
        if (transaction.status === TRANSACTION_STATUSES.POSTED && !reason?.trim()) {
            return { success: false, message: 'Reason is required to edit narration after posting.' }
        }

        setTransactions((prev) => prev.map((item) => (
            item.id === transactionId ? { ...item, narration } : item
        )))
        const applyNarration = (item) => (
            item.sourceTransactionId === transactionId
                ? { ...item, description: narration, narration }
                : item
        )
        setDayBookEntries((prev) => prev.map(applyNarration))
        setCashBookEntries((prev) => prev.map(applyNarration))
        setBankBookEntries((prev) => prev.map(applyNarration))
        setOnlineBookEntries((prev) => prev.map((item) => (
            item.sourceTransactionId === transactionId
                ? { ...item, detail: { ...item.detail, remarks: narration } }
                : item
        )))
        setGlEntries((prev) => prev.map((item) => (
            item.sourceTransactionId === transactionId
                ? { ...item, description: narration }
                : item
        )))
        appendAudit({
            action: 'NARRATION_EDITED',
            entity: 'FinanceTransaction',
            entityId: transactionId,
            oldValue: transaction.narration,
            newValue: narration,
            reason,
            performedBy: changedBy,
            field: 'narration',
        })
        return { success: true }
    }, [appendAudit, transactions])

    const reverseTransaction = useCallback(({ transactionId, reason }) => {
        if (!reason?.trim()) return { success: false, message: 'Reason is required for reversals.' }
        const transaction = transactions.find((item) => item.id === transactionId)
        if (!transaction) return { success: false, message: 'Transaction not found.' }

        setTransactions((prev) => prev.map((item) => (
            item.id === transactionId ? { ...item, status: TRANSACTION_STATUSES.REVERSED } : item
        )))
        appendAudit({
            action: 'PAYMENT_REVERSED',
            entity: 'FinanceTransaction',
            entityId: transactionId,
            oldValue: transaction.status,
            newValue: TRANSACTION_STATUSES.REVERSED,
            reason,
        })
        return { success: true }
    }, [appendAudit, transactions])

    const postExternalInflow = useCallback(({ amount, category, paymentMode, reference, narration, sourceModule }) => {
        seq.current.txn += 1
        seq.current.voucher += 1
        const transaction = createFinanceTransaction({
            id: `EXT-${Date.now()}`,
            transactionNo: generateTransactionNo(seq.current.txn),
            transactionDate: new Date(),
            paymentMode: paymentMode || PAYMENT_MODES.CASH,
            amount,
            student: null,
            category,
            reference,
            narration,
            status: TRANSACTION_STATUSES.POSTED,
            createdBy: ACTOR_FINANCE_HEAD,
            voucherNo: generateVoucherNo(seq.current.voucher),
            bankAccount: bankAccounts[0],
            sourceModule: sourceModule || SOURCE_MODULES.OTHER,
        })
        setTransactions((prev) => [transaction, ...prev])
        postAccounting(createAccountingPosting({
            transaction,
            student: null,
            amount,
            narration,
        }))
        return transaction
    }, [bankAccounts, postAccounting])

    const rechargeWallet = useCallback(({ email, amount }) => {
        const walletIndex = wallets.findIndex(
            (wallet) => String(wallet.email || '').toLowerCase() === String(email || '').toLowerCase(),
        )
        if (walletIndex === -1) {
            return { success: false, message: 'No wallet found for this email ID.' }
        }
        const wallet = wallets[walletIndex]
        const parseAmt = (value) => Number(String(value).replace(/[₹,\s]/g, '')) || 0
        const formatAmt = (value) => `₹${Number(value).toLocaleString('en-IN')}`
        const updatedBalance = parseAmt(wallet.balance) + Number(amount)
        const updatedWallet = {
            ...wallet,
            balance: formatAmt(updatedBalance),
            lastRecharge: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
            status: updatedBalance > 0 && wallet.status === 'Zero Balance' ? 'Active' : wallet.status,
        }
        const newRecord = {
            id: `RCG-${Date.now().toString().slice(-5)}`,
            user: wallet.name,
            initials: wallet.initials,
            role: wallet.role,
            mode: 'Offline',
            amount: formatAmt(amount),
            dateTime: new Date().toLocaleString('en-IN'),
            status: 'Success',
        }
        setWallets((prev) => prev.map((item, index) => (index === walletIndex ? updatedWallet : item)))
        setWalletRecharges((prev) => [newRecord, ...prev])
        postExternalInflow({
            amount: Number(amount),
            category: 'Wallet Recharge',
            paymentMode: PAYMENT_MODES.CASH,
            reference: newRecord.id,
            narration: `Wallet recharge — ${wallet.name}`,
            sourceModule: SOURCE_MODULES.WALLET,
        })
        return { success: true, wallet: updatedWallet, record: newRecord }
    }, [postExternalInflow, wallets])

    const reloadFinanceFromApi = useCallback(async () => {
        if (!isApiFinanceEnabled()) {
            throw new Error('Finance API flag is off.')
        }
        setFinanceStatus('loading')
        setFinanceError(null)
        const remote = await pullFinanceState()
        apiHydratedRef.current = true
        if (remote?.seeded && remote?.data) {
            applyFinanceData(remote.data)
            if (remote.savedAt) setLastSavedAt(remote.savedAt)
        } else {
            const empty = createEmptyFinanceState()
            applyFinanceData(empty)
            const savedRemote = await pushFinanceState(empty)
            if (savedRemote?.savedAt) setLastSavedAt(savedRemote.savedAt)
        }
        setFinanceStatus('ready')
        return true
    }, [applyFinanceData])

    useEffect(() => {
        if (!isApiFinanceEnabled() || apiHydratedRef.current) return undefined
        let cancelled = false
        setFinanceStatus('loading')
        pullFinanceState()
            .then(async (remote) => {
                if (cancelled) return
                apiHydratedRef.current = true
                if (remote?.seeded && remote?.data) {
                    applyFinanceData(remote.data)
                    if (remote.savedAt) setLastSavedAt(remote.savedAt)
                } else {
                    const empty = createEmptyFinanceState()
                    applyFinanceData(empty)
                    const savedRemote = await pushFinanceState(empty)
                    if (!cancelled && savedRemote?.savedAt) setLastSavedAt(savedRemote.savedAt)
                }
                if (!cancelled) {
                    setFinanceStatus('ready')
                    setFinanceError(null)
                }
            })
            .catch((error) => {
                console.error(error)
                apiHydratedRef.current = false
                clearFinanceState()
                if (!cancelled) {
                    setFinanceStatus('error')
                    setFinanceError(error?.message || 'Finance API failed to load')
                }
            })
        return () => { cancelled = true }
    }, [applyFinanceData])

    const moneyInTransactions = useMemo(
        () => transactions.filter((item) => item.direction === TRANSACTION_DIRECTIONS.IN),
        [transactions],
    )

    const postedInflow = useMemo(
        () => transactions.filter((item) => (
            item.direction === TRANSACTION_DIRECTIONS.IN
            && item.status === TRANSACTION_STATUSES.POSTED
        )),
        [transactions],
    )

    const dashboardMetrics = useMemo(() => {
        const today = toIsoDate(new Date())
        const todaysCollection = postedInflow
            .filter((item) => item.transactionDate === today && item.sourceModule === SOURCE_MODULES.FEES)
            .reduce((sum, item) => sum + item.amount, 0)
        const currentDue = hydratedInstallments
            .filter((row) => row.status === 'UNPAID' || row.status === 'PARTIALLY_PAID')
            .reduce((sum, row) => sum + row.balanceAmount, 0)
        const overdue = hydratedInstallments
            .filter((row) => row.status === 'OVERDUE')
            .reduce((sum, row) => sum + row.balanceAmount, 0)
        const chequePending = cheques
            .filter((item) => item.status !== CHEQUE_STATUSES.CLEARED && item.status !== CHEQUE_STATUSES.BOUNCED && item.status !== CHEQUE_STATUSES.CANCELLED)
            .reduce((sum, item) => sum + item.amount, 0)
        const netDemand = hydratedInstallments.reduce((sum, row) => sum + row.netAmount, 0)
        const collected = hydratedInstallments.reduce((sum, row) => sum + row.paidAmount, 0)
        const efficiency = netDemand > 0 ? (collected / netDemand) * 100 : 0

        return {
            todaysCollection,
            currentDue,
            overdue,
            chequePending,
            collectionEfficiency: efficiency,
            collected,
            netDemand,
        }
    }, [cheques, hydratedInstallments, postedInflow])

    useEffect(() => {
        if (skipPersistRef.current) {
            skipPersistRef.current = false
            return
        }

        const data = {
            students,
            feeCategories,
            feeStructures,
            fineRules,
            bankAccounts,
            posTerminals,
            concessions,
            installments,
            annualBudget,
            transactions,
            receipts,
            cheques,
            paymentLinks,
            auditLog,
            glEntries,
            dayBookEntries,
            cashBookEntries,
            bankBookEntries,
            onlineBookEntries,
            reconciliationItems,
            wallets,
            walletRecharges,
            transportFleet,
            approvals,
            sequence: { ...seq.current },
            meta: { seeded: true },
        }
        // Optional cache only — never the business source of truth when API is on.
        if (isApiFinanceEnabled()) {
            saveFinanceState(data)
        } else {
            const payload = saveFinanceState(data)
            if (payload?.savedAt) setLastSavedAt(payload.savedAt)
        }

        if (isApiFinanceEnabled() && apiHydratedRef.current && financeStatus === 'ready') {
            if (pushTimerRef.current) window.clearTimeout(pushTimerRef.current)
            pushTimerRef.current = window.setTimeout(() => {
                pushFinanceState(data)
                    .then((result) => {
                        if (result?.savedAt) setLastSavedAt(result.savedAt)
                    })
                    .catch((error) => {
                        console.error(error)
                        setFinanceError(error?.message || 'Finance API push failed')
                    })
            }, 600)
        }
    }, [
        financeStatus,
        students,
        wallets,
        walletRecharges,
        transportFleet,
        approvals,
        annualBudget,
        auditLog,
        bankAccounts,
        bankBookEntries,
        cashBookEntries,
        cheques,
        concessions,
        dayBookEntries,
        feeCategories,
        feeStructures,
        fineRules,
        glEntries,
        installments,
        onlineBookEntries,
        paymentLinks,
        posTerminals,
        receipts,
        reconciliationItems,
        transactions,
    ])

    const issueActivityFeeReceipt = useCallback((payload) => {
        const student = payload.studentId ? getStudentById(payload.studentId) : null
        const txnId = `ACT-${Date.now()}`
        const receiptNo = generateReceiptNo(seq.current.rec)
        seq.current.rec += 1
        const receipt = {
            id: `RCP-${txnId}`,
            receiptNo,
            studentId: student?.id || payload.participantName || 'Outsider',
            academicYear: payload.academicYear || student?.academicYear || '',
            className: student ? `${student.className}-${student.section}` : 'Activity',
            admissionNo: student?.admissionNo || payload.participantName || '',
            paymentDate: toIsoDate(new Date()),
            feeHeads: [payload.activityName],
            grossFee: Number(payload.gross) || 0,
            concession: Number(payload.concession) || 0,
            fine: 0,
            amountPaid: Number(payload.payable) || 0,
            paymentMode: 'Cash',
            transactionReference: txnId,
            balance: 0,
            collectedBy: ACTOR_FINANCE_HEAD,
            installmentIds: [],
            reprintCount: 0,
            lastReprintedAt: null,
            lastReprintedBy: null,
            reprintReason: null,
            status: 'Issued',
            communication: { email: false, whatsapp: false },
            transactionId: txnId,
            source: 'Activity Fee',
        }
        setReceipts((prev) => [receipt, ...prev])
        appendAudit({
            action: 'ACTIVITY_FEE_COLLECTED',
            entity: 'Receipt',
            entityId: receipt.id,
            newValue: receiptNo,
            reason: payload.activityName,
        })
        return { success: true, receipt }
    }, [appendAudit, getStudentById])

    const value = useMemo(() => ({
        students,
        feeCategories,
        feeStructures,
        fineRules,
        bankAccounts,
        posTerminals,
        concessions,
        installments: hydratedInstallments,
        rawInstallments: installments,
        annualBudget,
        updateAnnualBudget: (id, field, value) => {
            setAnnualBudget((prev) => prev.map((row) => (
                row.id === id ? { ...row, [field]: Number(value) || 0 } : row
            )))
        },
        recordVoucherAction: (transactionId, action) => {
            setTransactions((prev) => prev.map((item) => (
                item.id === transactionId
                    ? {
                        ...item,
                        voucherStatus: 'Issued',
                        preparedBy: item.preparedBy || item.createdBy || 'Finance Head',
                        voucherAction: action,
                        voucherActionAt: new Date().toISOString(),
                    }
                    : item
            )))
        },
        transactions,
        receipts,
        cheques,
        paymentLinks,
        auditLog,
        glEntries,
        dayBookEntries,
        cashBookEntries,
        bankBookEntries,
        onlineBookEntries,
        reconciliationItems,
        moneyInTransactions,
        postedInflow,
        dashboardMetrics,
        getStudentById,
        getInstallmentsForStudent,
        getSiblings,
        getStudentSummary,
        calculateStudentOutstanding: (studentId, academicYear) => (
            calculateStudentOutstanding(getInstallmentsForStudent(studentId, academicYear))
        ),
        collectFeePayment,
        issueActivityFeeReceipt,
        settleCheque,
        waiveFine,
        generatePaymentLink,
        reprintReceipt,
        sendReceipt,
        decideApproval,
        applyHrConcessions,
        rechargeWallet,
        wallets,
        setWallets,
        walletRecharges,
        transportFleet,
        setTransportFleet,
        approvals,
        setApprovals,
        addFeeStructure,
        addFeeCategory,
        setFeeStructures,
        setFineRules,
        setBankAccounts,
        setPosTerminals,
        setConcessions,
        addManualEntry,
        postManualEntry,
        editNarration,
        reverseTransaction,
        postExternalInflow,
        setReconciliationItems,
        reloadFinanceFromApi,
        financeStatus,
        financeError,
        lastSavedAt,
        financePersistence: {
            enabled: isApiFinanceEnabled(),
            mode: isApiFinanceEnabled() ? 'api' : 'offline-cache',
            storageKey: FINANCE_STORAGE_KEY,
            lastSavedAt,
            apiEnabled: isApiFinanceEnabled(),
            cacheOnly: isApiFinanceEnabled(),
        },
        cloneSeed: () => clone([]),
    }), [
        annualBudget,
        addFeeCategory,
        addFeeStructure,
        addManualEntry,
        auditLog,
        bankAccounts,
        bankBookEntries,
        cashBookEntries,
        cheques,
        collectFeePayment,
        issueActivityFeeReceipt,
        concessions,
        dashboardMetrics,
        dayBookEntries,
        editNarration,
        feeCategories,
        feeStructures,
        fineRules,
        generatePaymentLink,
        getInstallmentsForStudent,
        getSiblings,
        getStudentById,
        getStudentSummary,
        glEntries,
        hydratedInstallments,
        installments,
        moneyInTransactions,
        onlineBookEntries,
        paymentLinks,
        posTerminals,
        postExternalInflow,
        postManualEntry,
        postedInflow,
        receipts,
        reconciliationItems,
        reprintReceipt,
        reverseTransaction,
        sendReceipt,
        settleCheque,
        students,
        setStudents,
        transactions,
        waiveFine,
        reloadFinanceFromApi,
        financeStatus,
        financeError,
        lastSavedAt,
    ])

    return (
        <FinanceContext.Provider value={value}>
            {children}
        </FinanceContext.Provider>
    )
}

// Hook lives with the provider so consumers share one context instance.
// eslint-disable-next-line react-refresh/only-export-components -- domain hook is the public API
export const useFinance = () => {
    const context = useContext(FinanceContext)
    if (!context) {
        throw new Error('useFinance must be used within FinanceProvider')
    }
    return context
}
