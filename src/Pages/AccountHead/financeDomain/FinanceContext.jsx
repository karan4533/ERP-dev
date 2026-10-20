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
    DEFAULT_ACADEMIC_YEAR,
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
    normalizeAcademicYear,
    sameAcademicYear,
    summarizeStudentFees,
    toIsoDate,
    validatePaymentInput,
} from './financeHelpers'
import { BUDGET_SEED } from '../../../Common/demoDomain/financeExtras'
import {
    SNAPSHOT_COA_SEED,
    buildBookFeeFromStudents,
} from './financeSnapshotAccounting'
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
import { getAccessToken, isApiFinanceEnabled } from '../../../services/apiClient'
import {
    applyHrConcessionsApi,
    collectPaymentApi,
    decideApprovalApi,
    gatewayIntentApi,
    payMyFeesApi,
    pullFinanceState,
    pullMyFeesState,
    pushFinanceState,
    sendReceiptApi,
    settleChequeApi,
} from '../../../services/financeApi'
import { useAuth } from '../../../context/AuthContext'
import { ROLES } from '../../../constants/roles'
import { FLEET_VEHICLES } from '../TransportFinance/transportFinanceData'
import { RECHARGE_RECORDS, USER_WALLETS } from '../WalletManagement/walletManagementData'
import { PENDING_REQUESTS } from '../Approvals/approvalsData'
import { applyFeeStructuresToStudents } from './financeBootstrap'
import { mapEnrolledToFinanceStudent } from './financeLiveViews'
import { hydrateEnrolledStudentsFromApi, getAllEnrolledStudents } from '../../../Common/StudentDatabase/enrolledStudentsData'
import {
    buildPaymentSchedule,
    scheduleToInstallments,
} from '../FeesManagement/feePaymentSchedule'

const classKey = (value) => String(value || '').trim().toLowerCase()

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
    chartOfAccounts: [],
    journalVouchers: [],
    bookFeeBreakup: [],
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
    transportMaintenance: [],
    transportCompliance: [],
    transportSalaries: [],
    approvals: [],
    sequence: { pay: 1, rec: 1, txn: 1, voucher: 1, link: 1 },
    meta: { seeded: true },
})

const apiMode = () => isApiFinanceEnabled()

/** Roles that may call GET /finance/state (full campus ledger). */
const FINANCE_API_ROLES = new Set([
    ROLES.ACCOUNT_HEAD,
    ROLES.ADMIN,
    ROLES.SUPER_ADMIN,
])

/** Roles that load scoped fees via GET /finance/my-fees. */
const FINANCE_PORTAL_ROLES = new Set([
    ROLES.PARENT,
    ROLES.STUDENT,
])

/** Roles allowed to PUT finance state (parents/students must never push the campus ledger). */
const FINANCE_WRITE_ROLES = new Set([
    ROLES.ACCOUNT_HEAD,
    ROLES.ADMIN,
    ROLES.SUPER_ADMIN,
])

export const FinanceProvider = ({ children }) => {
    const { isAuthenticated, role } = useAuth()
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
    const hydratedRoleRef = useRef(null)
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
    const [chartOfAccounts, setChartOfAccounts] = useState(() => initialPersistedList(boot, 'chartOfAccounts', offlineAllowed ? SNAPSHOT_COA_SEED : emptyBoot))
    const [journalVouchers, setJournalVouchers] = useState(() => initialPersistedList(boot, 'journalVouchers', emptyBoot))
    const [bookFeeBreakup, setBookFeeBreakup] = useState(() => initialPersistedList(boot, 'bookFeeBreakup', emptyBoot))
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
    const [transportMaintenance, setTransportMaintenance] = useState(() => initialPersistedList(boot, 'transportMaintenance', emptyBoot))
    const [transportCompliance, setTransportCompliance] = useState(() => initialPersistedList(boot, 'transportCompliance', emptyBoot))
    const [transportSalaries, setTransportSalaries] = useState(() => initialPersistedList(boot, 'transportSalaries', emptyBoot))
    const [approvals, setApprovals] = useState(() => initialPersistedList(
        boot,
        'approvals',
        offlineAllowed ? PENDING_REQUESTS.map((row) => ({ ...row, status: 'Pending' })) : emptyBoot,
    ))
    const [lastSavedAt, setLastSavedAt] = useState(() => savedEnvelopeRef.current?.savedAt ?? null)
    const booksBackfilledRef = useRef(false)

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
        setChartOfAccounts(initialPersistedList(data, 'chartOfAccounts', fb))
        setJournalVouchers(initialPersistedList(data, 'journalVouchers', fb))
        setBookFeeBreakup(initialPersistedList(data, 'bookFeeBreakup', fb))
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
        setTransportMaintenance(initialPersistedList(data, 'transportMaintenance', fb))
        setTransportCompliance(initialPersistedList(data, 'transportCompliance', fb))
        setTransportSalaries(initialPersistedList(data, 'transportSalaries', fb))
        setApprovals(initialPersistedList(data, 'approvals', fb))
        booksBackfilledRef.current = false
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
            && (!academicYear || sameAcademicYear(row.academicYear, academicYear))
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
                const portalPay = FINANCE_PORTAL_ROLES.has(role)
                const result = portalPay
                    ? await payMyFeesApi(payload)
                    : await collectPaymentApi(payload)
                if (result?.state?.data) applyFinanceData(result.state.data)
                else if (portalPay) {
                    const scoped = await pullMyFeesState()
                    if (scoped?.data) applyFinanceData(scoped.data)
                }
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
    }, [appendAudit, applyFinanceData, bankAccounts, getInstallmentsForStudent, getStudentById, postAccounting, role])

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

    const buildSnapshotPayload = useCallback((overrides = {}) => ({
        students,
        feeCategories,
        feeStructures,
        fineRules,
        bankAccounts,
        posTerminals,
        concessions,
        installments,
        annualBudget,
        chartOfAccounts,
        journalVouchers,
        bookFeeBreakup,
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
        transportMaintenance,
        transportCompliance,
        transportSalaries,
        approvals,
        sequence: { ...seq.current },
        meta: { seeded: true },
        ...overrides,
    }), [
        annualBudget,
        approvals,
        auditLog,
        bankAccounts,
        bankBookEntries,
        bookFeeBreakup,
        cashBookEntries,
        chartOfAccounts,
        cheques,
        concessions,
        dayBookEntries,
        feeCategories,
        feeStructures,
        fineRules,
        glEntries,
        installments,
        journalVouchers,
        onlineBookEntries,
        paymentLinks,
        posTerminals,
        receipts,
        reconciliationItems,
        students,
        transactions,
        transportCompliance,
        transportFleet,
        transportMaintenance,
        transportSalaries,
        walletRecharges,
        wallets,
    ])

    /** Immediately persist snapshot (awaits PUT /finance/state when API mode is ready). */
    const flushFinanceToApi = useCallback(async (overrides = {}) => {
        const data = buildSnapshotPayload(overrides)
        if (isApiFinanceEnabled()) {
            saveFinanceState(data)
        } else {
            const payload = saveFinanceState(data)
            if (payload?.savedAt) setLastSavedAt(payload.savedAt)
            return { success: true, api: false, savedAt: payload?.savedAt || null }
        }
        if (!apiHydratedRef.current) {
            return {
                success: true,
                api: false,
                pending: true,
                message: 'Saved locally — finance API not hydrated yet; will sync when ready.',
            }
        }
        if (pushTimerRef.current) {
            window.clearTimeout(pushTimerRef.current)
            pushTimerRef.current = null
        }
        try {
            const result = await pushFinanceState(data)
            if (result?.savedAt) setLastSavedAt(result.savedAt)
            setFinanceError(null)
            return { success: true, api: true, savedAt: result?.savedAt || null }
        } catch (error) {
            const message = error?.message || 'Finance API push failed'
            setFinanceError(message)
            return { success: false, api: true, message }
        }
    }, [buildSnapshotPayload])

    const addFeeCategory = useCallback((name) => {
        const label = String(name || '').trim()
        if (!label) return ''
        const id = `CAT-${label.toUpperCase().replace(/\s+/g, '-')}`
        setFeeCategories((prev) => {
            if (prev.some((item) => item.id === id)) return prev
            return [...prev, { id, name: label, code: id.replace('CAT-', ''), active: true }]
        })
        return id
    }, [])

    /**
     * Ensure selected category names exist on the snapshot and flush to API.
     * @returns {{ categoryIds: string[], persist: object }}
     */
    const saveFeeCategories = useCallback(async (names = []) => {
        const labels = [...new Set((names || []).map((name) => String(name || '').trim()).filter(Boolean))]
        if (!labels.length) {
            return { categoryIds: [], persist: { success: false, message: 'No categories selected.' } }
        }
        const nextCategories = [...feeCategories]
        const categoryIds = labels.map((label) => {
            const id = `CAT-${label.toUpperCase().replace(/\s+/g, '-')}`
            if (!nextCategories.some((item) => item.id === id)) {
                nextCategories.push({ id, name: label, code: id.replace('CAT-', ''), active: true })
            }
            return id
        })
        setFeeCategories(nextCategories)
        const persist = await flushFinanceToApi({ feeCategories: nextCategories })
        appendAudit({
            action: 'FEE_CATEGORIES_SAVED',
            entity: 'FeeCategory',
            entityId: 'batch',
            newValue: labels.join(', '),
            reason: 'Configure / Define fee categories',
        })
        return { categoryIds, persist, feeCategories: nextCategories }
    }, [appendAudit, feeCategories, flushFinanceToApi])

    /**
     * Define a fee structure with frequency split, generate parent/student installments, persist to API.
     */
    const defineFeeStructure = useCallback(async (structure = {}, options = {}) => {
        const id = structure.id || `FS-${Date.now()}`
        const schedule = buildPaymentSchedule({
            amount: structure.amount,
            frequency: structure.frequency || 'ONE_TIME',
            academicYear: structure.academicYear || DEFAULT_ACADEMIC_YEAR,
            startDate: options.startDate || structure.startDate || '',
            dueDayOfMonth: structure.dueDayOfMonth || 10,
        })
        const nextStructure = {
            ...structure,
            id,
            status: structure.status || 'ACTIVE',
            paymentSchedule: schedule,
        }
        const baseStructures = options.feeStructures || feeStructures
        const baseInstallments = options.installments || installments
        const baseCategories = options.feeCategories || feeCategories
        const nextStructures = [nextStructure, ...baseStructures.filter((row) => row.id !== id)]

        const targetYear = String(structure.academicYear || '').trim()
        const structureClass = String(structure.className || '').trim()
        const allClasses = /^(all classes|all|\*)$/i.test(structureClass)
        const matchingStudents = students.filter((student) => {
            if (!allClasses && classKey(student.className) !== classKey(structureClass)) return false
            if (!targetYear) return true
            const studentYear = String(student.academicYear || '').trim()
            return !studentYear || sameAcademicYear(studentYear, targetYear)
        })

        const generated = matchingStudents.flatMap((student) => scheduleToInstallments({
            schedule,
            studentId: student.id,
            academicYear: normalizeAcademicYear(
                student.academicYear || structure.academicYear || DEFAULT_ACADEMIC_YEAR,
            ) || DEFAULT_ACADEMIC_YEAR,
            structureId: id,
            feeCategoryId: structure.feeCategoryId,
            feeHead: structure.feeHead,
        }))

        const nextInstallments = (() => {
            const keep = baseInstallments.filter((row) => {
                if (row.feeStructureId !== id) return true
                const paid = Number(row.paidAmount) || 0
                return paid > 0 || ['PAID', 'PARTIALLY_PAID', 'WAIVED'].includes(row.status)
            })
            const protectedKeys = new Set(
                keep
                    .filter((row) => row.feeStructureId === id)
                    .map((row) => `${row.studentId}:${row.scheduleIndex ?? row.dueDate}`),
            )
            const fresh = generated.filter(
                (row) => !protectedKeys.has(`${row.studentId}:${row.scheduleIndex ?? row.dueDate}`),
            )
            return [...fresh, ...keep]
        })()

        setFeeStructures(nextStructures)
        setInstallments(nextInstallments)
        appendAudit({
            action: 'FEE_STRUCTURE_CHANGED',
            entity: 'FeeStructure',
            entityId: id,
            newValue: `${structure.feeHead} ${formatCurrency(structure.amount)} · ${schedule.planLabel} · ${generated.length} installment(s)`,
            reason: 'Structure defined with payment schedule',
        })

        const persist = await flushFinanceToApi({
            feeCategories: baseCategories,
            feeStructures: nextStructures,
            installments: nextInstallments,
        })

        return {
            id,
            schedule,
            studentsMatched: matchingStudents.length,
            installmentsCreated: generated.length,
            persist,
            feeStructures: nextStructures,
            installments: nextInstallments,
        }
    }, [appendAudit, feeCategories, feeStructures, flushFinanceToApi, installments, students])

    /** Legacy sync helper — prefer defineFeeStructure for schedule + API flush. */
    const addFeeStructure = useCallback((structure) => {
        const id = structure.id || `FS-${Date.now()}`
        const schedule = structure.paymentSchedule || buildPaymentSchedule({
            amount: structure.amount,
            frequency: structure.frequency || 'ONE_TIME',
            academicYear: structure.academicYear || DEFAULT_ACADEMIC_YEAR,
            dueDayOfMonth: structure.dueDayOfMonth || 10,
        })
        setFeeStructures((prev) => [{ ...structure, id, status: structure.status || 'ACTIVE', paymentSchedule: schedule }, ...prev])
        appendAudit({
            action: 'FEE_STRUCTURE_CHANGED',
            entity: 'FeeStructure',
            entityId: id,
            newValue: `${structure.feeHead} ${formatCurrency(structure.amount)}`,
            reason: 'Structure defined',
        })
        return id
    }, [appendAudit])

    /**
     * Remove a fee structure and its unpaid installments; keep paid/partial rows for audit.
     */
    const deleteFeeStructure = useCallback(async (structureId) => {
        const id = String(structureId || '')
        if (!id) return { success: false, message: 'Missing fee structure id.' }
        const existing = feeStructures.find((row) => row.id === id)
        if (!existing) return { success: false, message: 'Fee structure not found.' }

        const nextStructures = feeStructures.filter((row) => row.id !== id)
        let removedInstallments = 0
        let keptPaid = 0
        const nextInstallments = installments.filter((row) => {
            if (row.feeStructureId !== id) return true
            const paid = Number(row.paidAmount) || 0
            if (paid > 0 || ['PAID', 'PARTIALLY_PAID', 'WAIVED'].includes(row.status)) {
                keptPaid += 1
                return true
            }
            removedInstallments += 1
            return false
        })

        setFeeStructures(nextStructures)
        setInstallments(nextInstallments)
        appendAudit({
            action: 'FEE_STRUCTURE_DELETED',
            entity: 'FeeStructure',
            entityId: id,
            oldValue: `${existing.feeHead} ${formatCurrency(existing.amount)} · ${existing.className}`,
            reason: 'Structure deleted from Configured Fee Structures',
        })

        const persist = await flushFinanceToApi({
            feeStructures: nextStructures,
            installments: nextInstallments,
        })

        return {
            success: Boolean(persist?.success),
            persist,
            removedInstallments,
            keptPaidInstallments: keptPaid,
            structure: existing,
        }
    }, [appendAudit, feeStructures, flushFinanceToApi, installments])

    /**
     * Apply existing fee structures onto finance students as unpaid installments.
     * Never replaces Account Head–defined categories or structures with sample data.
     */
    const bootstrapDemoFeeLedger = useCallback(({ force = false } = {}) => {
        if (!students.length) {
            return { success: false, message: 'No enrolled finance students to assign fees to. Import students first.' }
        }
        if (!feeStructures.length) {
            return {
                success: false,
                message: 'No fee structures defined. Use Define Fee Structure first — bootstrap will not invent sample fees.',
            }
        }
        if (!force && installments.length > 0) {
            // Still allow apply: regenerate unpaid demand from structures without wiping paid rows.
        }
        const applied = applyFeeStructuresToStudents({
            students,
            feeStructures,
            existingInstallments: installments,
        })
        if (!applied.generatedCount && !force) {
            const studentClasses = [...new Set(students.map((s) => s.className).filter(Boolean))].join(', ')
            const structureClasses = [...new Set(feeStructures.map((s) => s.className).filter(Boolean))].join(', ')
            return {
                success: false,
                message: `No new installments created. Student classes (${studentClasses || 'none'}) do not match your fee structures (${structureClasses || 'none'}). Edit structures or student class names so they match.`,
                installments: installments.length,
                structures: feeStructures.length,
                studentsMatched: 0,
            }
        }
        setInstallments(applied.installments)
        appendAudit({
            action: 'FEE_STRUCTURES_APPLIED',
            entity: 'FeeLedger',
            entityId: 'campus',
            newValue: `${applied.generatedCount} installment(s) · ${applied.structuresApplied} structure(s) · ${applied.studentsMatched} student(s)`,
            reason: 'Apply defined fee structures to finance students',
        })
        return {
            success: true,
            installments: applied.installments.length,
            generated: applied.generatedCount,
            structures: applied.structuresApplied,
            studentsMatched: applied.studentsMatched,
            approvals: approvals.length,
        }
    }, [appendAudit, approvals.length, feeStructures, installments, students])

    /**
     * Pull campus enrolled students into the finance snapshot so Bootstrap / Fee Collection have people to bill.
     * Merges by id; does not invent fee rows.
     */
    /** Refresh class/section/roll on existing finance students from campus /students (no fee invent). */
    const refreshFinanceStudentRoster = useCallback(async () => {
        await hydrateEnrolledStudentsFromApi().catch(() => [])
        const enrolled = getAllEnrolledStudents()
        if (!enrolled.length) return { updated: 0 }
        const mapped = enrolled.map((row) => mapEnrolledToFinanceStudent(row, DEFAULT_ACADEMIC_YEAR))
        let updated = 0
        setStudents((prev) => {
            const byId = new Map(prev.map((row) => [String(row.id), row]))
            mapped.forEach((row) => {
                const existing = byId.get(String(row.id))
                if (!existing) {
                    byId.set(String(row.id), row)
                    updated += 1
                    return
                }
                const next = {
                    ...existing,
                    className: row.className || existing.className,
                    section: row.section ?? existing.section,
                    rollNo: row.rollNo || existing.rollNo,
                    admissionNo: row.admissionNo || existing.admissionNo,
                    name: row.name || existing.name,
                    phone: row.phone || existing.phone,
                    status: row.status || existing.status,
                }
                if (
                    next.className !== existing.className
                    || next.section !== existing.section
                    || next.rollNo !== existing.rollNo
                ) {
                    updated += 1
                }
                byId.set(String(row.id), next)
            })
            return [...byId.values()]
        })
        return { updated }
    }, [])

    const importEnrolledStudentsToFinance = useCallback(async () => {
        let syncResult = null
        try {
            const { syncStudentsFromAdmissionsApi } = await import('../../../services/studentsApi')
            syncResult = await syncStudentsFromAdmissionsApi()
        } catch (error) {
            // Non-fatal when already enrolled or offline; hydrate may still succeed.
            syncResult = { error: error?.message || 'Sync from admissions failed' }
        }

        await hydrateEnrolledStudentsFromApi().catch(() => [])
        const enrolled = getAllEnrolledStudents()
        if (!enrolled.length) {
            const pending = Number(syncResult?.pendingAdmissions) || 0
            const syncErrors = Array.isArray(syncResult?.errors) ? syncResult.errors.length : 0
            return {
                success: false,
                imported: 0,
                syncResult,
                message: pending || syncErrors
                    ? `No students in the campus students table yet. ${pending} admission(s) were found but ${syncErrors || 'enrol'} failed — check Admin admissions (status Active → Enrol), then try again.`
                    : 'No enrolled students found. Create admissions under Admin / PRM and Enrol them (or use Import again to auto-enrol Active admissions into students).',
            }
        }
        const mapped = enrolled.map((row) => mapEnrolledToFinanceStudent(row, DEFAULT_ACADEMIC_YEAR))
        const existingIds = new Set(students.map((row) => String(row.id)))
        const added = mapped.filter((row) => !existingIds.has(String(row.id))).length
        const nextStudents = (() => {
            const byId = new Map(students.map((row) => [String(row.id), row]))
            mapped.forEach((row) => {
                byId.set(String(row.id), { ...(byId.get(String(row.id)) || {}), ...row })
            })
            return [...byId.values()]
        })()
        setStudents(nextStudents)

        // Apply existing (user-defined) fee structures only — never invent sample masters.
        const applied = feeStructures.length
            ? applyFeeStructuresToStudents({
                students: nextStudents,
                feeStructures,
                existingInstallments: installments,
            })
            : null
        if (applied) setInstallments(applied.installments)

        appendAudit({
            action: 'FINANCE_STUDENTS_IMPORTED',
            entity: 'FinanceStudent',
            entityId: 'campus',
            newValue: `${mapped.length} enrolled → finance`
                + (syncResult?.created ? ` · synced ${syncResult.created} from admissions` : '')
                + (applied?.generatedCount ? ` · ${applied.generatedCount} installment(s) from your structures` : ''),
            reason: 'Import enrolled students into fee ledger',
        })
        return {
            success: true,
            imported: mapped.length,
            added,
            syncedFromAdmissions: Number(syncResult?.created) || 0,
            installmentsGenerated: applied?.generatedCount || 0,
            syncResult,
        }
    }, [appendAudit, feeStructures, installments, students])

    const addManualEntry = useCallback((entry) => {
        seq.current.txn += 1
        seq.current.voucher += 1
        const amount = Number(String(entry.amount ?? '').replace(/[₹,\s]/g, '')) || Number(entry.amount) || 0
        const voucherNo = entry.reference || generateVoucherNo(seq.current.voucher)
        const transaction = createFinanceTransaction({
            id: `MAN-${Date.now()}`,
            transactionNo: generateTransactionNo(seq.current.txn),
            transactionDate: entry.date,
            paymentMode: entry.paymentMode || PAYMENT_MODES.CASH,
            amount,
            student: null,
            category: entry.category || 'Manual',
            reference: voucherNo,
            narration: entry.narration,
            status: entry.status || TRANSACTION_STATUSES.DRAFT,
            createdBy: entry.createdBy || ACTOR_FINANCE_HEAD,
            voucherNo,
            bankAccount: bankAccounts.find((item) => item.id === entry.bankAccountId),
            sourceModule: entry.sourceModule || SOURCE_MODULES.MANUAL,
        })
        transaction.direction = entry.direction || TRANSACTION_DIRECTIONS.IN
        transaction.entryType = entry.entryType
        setTransactions((prev) => [transaction, ...prev])
        if (transaction.status === TRANSACTION_STATUSES.POSTED && amount > 0) {
            postAccounting(createAccountingPosting({
                transaction,
                student: null,
                amount,
                narration: transaction.narration,
            }))
        }
        appendAudit({
            action: 'MANUAL_ENTRY_CREATED',
            entity: 'FinanceTransaction',
            entityId: transaction.id,
            newValue: transaction.status,
            reason: entry.narration,
        })
        return transaction
    }, [appendAudit, bankAccounts, postAccounting])

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
        if (!isApiFinanceEnabled()) return undefined

        // Signed out (or token cleared): reset so the next login hydrates cleanly.
        if (!isAuthenticated || !getAccessToken()) {
            apiHydratedRef.current = false
            setFinanceError(null)
            setFinanceStatus('loading')
            return undefined
        }

        const isStaffFinance = FINANCE_API_ROLES.has(role)
        const isPortalFinance = FINANCE_PORTAL_ROLES.has(role)
        // Non-finance roles must not pull — FinanceProvider is app-wide and would 403 otherwise.
        if (!isStaffFinance && !isPortalFinance) {
            apiHydratedRef.current = false
            setFinanceError(null)
            setFinanceStatus('ready')
            return undefined
        }

        // Re-hydrate when role changes (parent vs Account Head use different endpoints).
        if (apiHydratedRef.current && hydratedRoleRef.current === role) return undefined
        apiHydratedRef.current = false

        let cancelled = false
        setFinanceStatus('loading')
        const pull = isPortalFinance ? pullMyFeesState() : pullFinanceState()
        pull
            .then(async (remote) => {
                if (cancelled) return
                apiHydratedRef.current = true
                hydratedRoleRef.current = role
                if (remote?.seeded && remote?.data) {
                    applyFinanceData(remote.data)
                    if (remote.savedAt) setLastSavedAt(remote.savedAt)
                } else if (isStaffFinance) {
                    const empty = createEmptyFinanceState()
                    applyFinanceData(empty)
                    const savedRemote = await pushFinanceState(empty)
                    if (!cancelled && savedRemote?.savedAt) setLastSavedAt(savedRemote.savedAt)
                } else {
                    applyFinanceData(createEmptyFinanceState())
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
    }, [applyFinanceData, isAuthenticated, role])

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
            .reduce((sum, item) => sum + Number(item.amount || 0), 0)
        const todaysExpenses = transactions
            .filter((item) => (
                item.direction === TRANSACTION_DIRECTIONS.OUT
                && item.status === TRANSACTION_STATUSES.POSTED
                && item.transactionDate === today
            ))
            .reduce((sum, item) => sum + Number(item.amount || 0), 0)
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
        const pendingApprovals = approvals.filter((row) => {
            const status = String(row.status || '').toLowerCase()
            return status === 'pending' || status === ''
        }).length
        const refundRequests = approvals.filter((row) => {
            const type = String(row.type || row.requestType || row.category || '').toLowerCase()
            const status = String(row.status || '').toLowerCase()
            return type.includes('refund') && (status === 'pending' || status === '')
        }).length

        return {
            todaysCollection,
            todaysExpenses,
            currentDue,
            overdue,
            chequePending,
            collectionEfficiency: efficiency,
            collected,
            netDemand,
            pendingApprovals,
            refundRequests,
        }
    }, [approvals, cheques, hydratedInstallments, postedInflow, transactions])

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
            chartOfAccounts,
            journalVouchers,
            bookFeeBreakup,
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
            transportMaintenance,
            transportCompliance,
            transportSalaries,
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

        if (
            isApiFinanceEnabled()
            && apiHydratedRef.current
            && financeStatus === 'ready'
            && FINANCE_WRITE_ROLES.has(role)
        ) {
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
        role,
        students,
        wallets,
        walletRecharges,
        transportFleet,
        transportMaintenance,
        transportCompliance,
        transportSalaries,
        approvals,
        annualBudget,
        chartOfAccounts,
        journalVouchers,
        bookFeeBreakup,
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

    // One-shot: fill empty books from already-POSTED transactions (pre-wiring campus data).
    useEffect(() => {
        if (financeStatus !== 'ready' || !apiHydratedRef.current || booksBackfilledRef.current) return
        if (!isApiFinanceEnabled()) {
            booksBackfilledRef.current = true
            return
        }
        const posted = (transactions || []).filter((row) => {
            const status = String(row.status || TRANSACTION_STATUSES.POSTED).toUpperCase()
            return status === TRANSACTION_STATUSES.POSTED && Number(row.amount) > 0
        })
        if (!posted.length) {
            booksBackfilledRef.current = true
            return
        }
        const known = new Set([
            ...(dayBookEntries || []).map((row) => row.sourceTransactionId),
            ...(glEntries || []).map((row) => row.sourceTransactionId),
            ...(cashBookEntries || []).map((row) => row.sourceTransactionId),
            ...(bankBookEntries || []).map((row) => row.sourceTransactionId),
            ...(onlineBookEntries || []).map((row) => row.sourceTransactionId),
        ].filter(Boolean))
        const missing = posted.filter((row) => !known.has(row.id))
        booksBackfilledRef.current = true
        if (!missing.length) return
        missing.forEach((txn) => {
            postAccounting(createAccountingPosting({
                transaction: txn,
                student: getStudentById(txn.studentId),
                amount: txn.amount,
                narration: txn.narration,
            }))
        })
    }, [
        bankBookEntries,
        cashBookEntries,
        dayBookEntries,
        financeStatus,
        getStudentById,
        glEntries,
        onlineBookEntries,
        postAccounting,
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
        chartOfAccounts,
        setChartOfAccounts,
        journalVouchers,
        setJournalVouchers,
        bookFeeBreakup,
        setBookFeeBreakup,
        updateBookFeeBreakup: (id, field, value) => {
            setBookFeeBreakup((prev) => prev.map((row) => (
                row.id === id
                    ? {
                        ...row,
                        [field]: ['quantity', 'unitCost', 'assignedFee'].includes(field)
                            ? Number(value) || 0
                            : value,
                    }
                    : row
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
        transportMaintenance,
        setTransportMaintenance,
        transportCompliance,
        setTransportCompliance,
        transportSalaries,
        setTransportSalaries,
        approvals,
        setApprovals,
        addFeeStructure,
        defineFeeStructure,
        deleteFeeStructure,
        addFeeCategory,
        saveFeeCategories,
        flushFinanceToApi,
        bootstrapDemoFeeLedger,
        importEnrolledStudentsToFinance,
        refreshFinanceStudentRoster,
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
        saveFeeCategories,
        addFeeStructure,
        defineFeeStructure,
        deleteFeeStructure,
        flushFinanceToApi,
        bootstrapDemoFeeLedger,
        importEnrolledStudentsToFinance,
        refreshFinanceStudentRoster,
        addManualEntry,
        auditLog,
        bankAccounts,
        bankBookEntries,
        bookFeeBreakup,
        cashBookEntries,
        chartOfAccounts,
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
        journalVouchers,
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
        transportCompliance,
        transportFleet,
        transportMaintenance,
        transportSalaries,
        wallets,
        walletRecharges,
        approvals,
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
