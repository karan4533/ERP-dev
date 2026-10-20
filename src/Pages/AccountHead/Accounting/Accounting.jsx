import React, { useEffect, useMemo, useRef, useState } from 'react'
import { BookOpen, Check, Download, FileSpreadsheet, Plus, Printer, RefreshCw, ArrowRightLeft, Upload, FileText } from 'lucide-react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import ExportModal from '../../../Common/CommonComponents/ExportModal'
import { useFinance } from '../financeDomain/FinanceContext'
import FinanceSnapshotBanner from '../financeDomain/FinanceSnapshotBanner'
import {
    SNAPSHOT_COA_SEED,
    buildBalanceSheetFromGl,
    buildCashFlowFromBooks,
    buildProfitLossFromGl,
    buildReconFromBankBook,
    buildTrialBalanceFromGl,
    withLiveCoaBalances,
} from '../financeDomain/financeSnapshotAccounting'
import DayBookTab, { appendDayBookEntry, buildDayBookSummary } from './Components/DayBookTab'
import AddOfflineEntryModal from './Components/AddOfflineEntryModal'
import OnlineBookTab, { buildOnlineBookSummary, syncOnlineTransaction } from './Components/OnlineBookTab'
import GeneralLedgerTab, { buildGeneralLedgerSummary } from './Components/GeneralLedgerTab'
import CashBookTab, { buildCashBookSummary } from './Components/CashBookTab'
import BankBookTab, { buildBankBookSummary } from './Components/BankBookTab'
import ChartOfAccountsTab, { appendCoaAccount, buildCoaSummary } from './Components/ChartOfAccountsTab'
import AddAccountModal from './Components/AddAccountModal'
import JournalVouchersTab, {
    appendJournalVoucher,
    buildJournalVoucherSummary,
    postJournalVouchers,
} from './Components/JournalVouchersTab'
import NewJournalVoucherModal from './Components/NewJournalVoucherModal'
import BankReconciliationTab, {
    autoMatchReconciliation,
    buildBankReconciliationSummary,
    importBankStatementEntry,
    reconcileReconciliationEntry,
} from './Components/BankReconciliationTab'
import FinancialStatementsTab from './Components/FinancialStatementsTab'
import {
    ACCOUNTING_SECTIONS,
    ACCOUNTING_YEARS,
    DAY_BOOK_OPENING_BALANCE,
    DAY_BOOK_REGISTER,
    DEFAULT_ACCOUNTING_SECTION,
    ONLINE_BOOK_REGISTER,
    GENERAL_LEDGER_REGISTER,
    CASH_BOOK_OPENING_BALANCE,
    CASH_BOOK_REGISTER,
    BANK_BOOK_OPENING_BALANCE,
    BANK_BOOK_REGISTER,
    JOURNAL_VOUCHERS_REGISTER,
    BANK_RECONCILIATION_REGISTER,
    TRIAL_BALANCE_REGISTER,
    PROFIT_LOSS_STATEMENT,
    BALANCE_SHEET_STATEMENT,
    CASH_FLOW_STATEMENT,
} from './accountingData'
import { PAYMENT_MODES, TRANSACTION_DIRECTIONS, TRANSACTION_STATUSES } from '../financeDomain/financeConstants'
import { parseRupeeAmount } from '../financeDomain/financeHelpers'

const SECTION_SUBTITLES = {
    'day-book': 'Maintains the chronological record of all offline/manual transactions entered during the day.',
    'online-book': 'Displays every digital transaction received through payment gateways or online banking.',
    'general-ledger': 'Master accounting ledger where every posted accounting entry is stored.',
    'cash-book': 'Records every transaction involving Cash in Hand.',
    'bank-book': 'Records all bank account transactions.',
    'chart-of-accounts': 'Master list of all accounting heads used throughout the ERP.',
    'journal-vouchers': 'Manual debit and credit entries used for accounting adjustments.',
    'bank-reconciliation': 'Matches bank statement transactions with ERP records.',
    'financial-statements': 'Generates standard accounting reports for management and auditing.',
}

const Accounting = () => {
    const { section } = useParams()
    const navigate = useNavigate()
    const [academicYear, setAcademicYear] = useState(ACCOUNTING_YEARS[0])
    const [exportModal, setExportModal] = useState(false)
    const [addAccountModal, setAddAccountModal] = useState(false)
    const [newVoucherModal, setNewVoucherModal] = useState(false)
    const [addOfflineModal, setAddOfflineModal] = useState(false)
    const finance = useFinance()
    const apiLive = Boolean(finance.financePersistence?.apiEnabled)
    const [dayBookEntries, setDayBookEntries] = useState(() => (apiLive ? [] : DAY_BOOK_REGISTER))
    const [onlineBookEntries, setOnlineBookEntries] = useState(() => (apiLive ? [] : ONLINE_BOOK_REGISTER))
    const [selectedOnlineTransaction, setSelectedOnlineTransaction] = useState(null)
    const [isSyncing, setIsSyncing] = useState(false)
    const [generalLedgerEntries] = useState(() => (apiLive ? [] : GENERAL_LEDGER_REGISTER))
    const [cashBookEntries] = useState(() => (apiLive ? [] : CASH_BOOK_REGISTER))
    const [bankBookEntries] = useState(() => (apiLive ? [] : BANK_BOOK_REGISTER))
    const [offlineCoaAccounts, setOfflineCoaAccounts] = useState(SNAPSHOT_COA_SEED)
    const [offlineJournalVouchers, setOfflineJournalVouchers] = useState(JOURNAL_VOUCHERS_REGISTER)
    const [selectedVoucherId, setSelectedVoucherId] = useState(null)
    const [offlineReconciliationEntries, setOfflineReconciliationEntries] = useState(BANK_RECONCILIATION_REGISTER)
    const [selectedReconciliationId, setSelectedReconciliationId] = useState(null)
    const [reconciliationDrawerOpen, setReconciliationDrawerOpen] = useState(false)
    const [selectedSuggestionId, setSelectedSuggestionId] = useState(null)
    const [isImportingStatement, setIsImportingStatement] = useState(false)
    const [isAutoMatching, setIsAutoMatching] = useState(false)
    const [financialStatementType, setFinancialStatementType] = useState('trial-balance')
    const [fsFilters, setFsFilters] = useState({
        financialYear: ACCOUNTING_YEARS[0],
        dateFrom: '2026-04-01',
        dateTo: '2026-06-26',
        department: 'All Departments',
        campus: 'All Campuses',
    })
    const [appliedFsFilters, setAppliedFsFilters] = useState({
        financialYear: ACCOUNTING_YEARS[0],
        dateFrom: '2026-04-01',
        dateTo: '2026-06-26',
        department: 'All Departments',
        campus: 'All Campuses',
    })
    const [fsLastGeneratedAt, setFsLastGeneratedAt] = useState('26 Jun 2026, 4:30 PM')
    const [isGeneratingReport, setIsGeneratingReport] = useState(false)
    const ledgerRegisterRef = useRef(null)

    // Persist COA master once when snapshot has none (zero balances; live nets come from GL).
    useEffect(() => {
        if (!apiLive || finance.financeStatus !== 'ready') return
        if (finance.chartOfAccounts?.length) return
        finance.setChartOfAccounts(SNAPSHOT_COA_SEED.map((row) => ({ ...row })))
    }, [apiLive, finance.financeStatus, finance.chartOfAccounts, finance.setChartOfAccounts])

    const activeSection = useMemo(() => {
        const match = ACCOUNTING_SECTIONS.find((item) => item.id === section)
        return match?.id ?? null
    }, [section])

    const activeLabel = ACCOUNTING_SECTIONS.find((item) => item.id === activeSection)?.label ?? 'Accounting'
    const sectionSubtitle = SECTION_SUBTITLES[activeSection] ?? `Academic Year ${academicYear} · Books as of 26 Jun 2026`

    // API mode: campus snapshot books only (no static register merge). Offline: keep demo registers.
    const mergedDayBook = useMemo(
        () => (apiLive ? [...finance.dayBookEntries] : [...finance.dayBookEntries, ...dayBookEntries]),
        [apiLive, finance.dayBookEntries, dayBookEntries],
    )
    const mergedOnlineBook = useMemo(
        () => (apiLive ? [...finance.onlineBookEntries] : [...finance.onlineBookEntries, ...onlineBookEntries]),
        [apiLive, finance.onlineBookEntries, onlineBookEntries],
    )
    const mergedGeneralLedger = useMemo(
        () => (apiLive ? [...finance.glEntries] : [...finance.glEntries, ...generalLedgerEntries]),
        [apiLive, finance.glEntries, generalLedgerEntries],
    )
    const mergedCashBook = useMemo(
        () => (apiLive ? [...finance.cashBookEntries] : [...finance.cashBookEntries, ...cashBookEntries]),
        [apiLive, finance.cashBookEntries, cashBookEntries],
    )
    const mergedBankBook = useMemo(
        () => (apiLive ? [...finance.bankBookEntries] : [...finance.bankBookEntries, ...bankBookEntries]),
        [apiLive, finance.bankBookEntries, bankBookEntries],
    )

    const coaAccounts = useMemo(() => {
        const base = apiLive
            ? (finance.chartOfAccounts?.length ? finance.chartOfAccounts : SNAPSHOT_COA_SEED)
            : (finance.chartOfAccounts?.length ? finance.chartOfAccounts : offlineCoaAccounts)
        return withLiveCoaBalances(base, mergedGeneralLedger)
    }, [apiLive, finance.chartOfAccounts, offlineCoaAccounts, mergedGeneralLedger])

    const journalVouchers = useMemo(
        () => (apiLive
            ? [...(finance.journalVouchers || [])]
            : (finance.journalVouchers?.length ? finance.journalVouchers : offlineJournalVouchers)),
        [apiLive, finance.journalVouchers, offlineJournalVouchers],
    )

    const reconciliationEntries = useMemo(() => {
        if (apiLive) {
            if (finance.reconciliationItems?.length) return finance.reconciliationItems
            return buildReconFromBankBook(finance.bankBookEntries || [])
        }
        return finance.reconciliationItems?.length
            ? finance.reconciliationItems
            : offlineReconciliationEntries
    }, [apiLive, finance.reconciliationItems, finance.bankBookEntries, offlineReconciliationEntries])

    const openingBalance = apiLive ? 0 : DAY_BOOK_OPENING_BALANCE
    const cashOpening = apiLive ? 0 : CASH_BOOK_OPENING_BALANCE
    const bankOpening = apiLive ? 0 : BANK_BOOK_OPENING_BALANCE

    const dayBookSummary = useMemo(
        () => buildDayBookSummary(mergedDayBook, openingBalance),
        [mergedDayBook, openingBalance],
    )

    const onlineBookSummary = useMemo(
        () => buildOnlineBookSummary(mergedOnlineBook),
        [mergedOnlineBook],
    )

    const generalLedgerSummary = useMemo(
        () => buildGeneralLedgerSummary(mergedGeneralLedger),
        [mergedGeneralLedger],
    )

    const cashBookSummary = useMemo(
        () => buildCashBookSummary(mergedCashBook, cashOpening),
        [mergedCashBook, cashOpening],
    )

    const bankBookSummary = useMemo(
        () => buildBankBookSummary(mergedBankBook, bankOpening),
        [mergedBankBook, bankOpening],
    )

    const coaSummary = useMemo(
        () => buildCoaSummary(coaAccounts),
        [coaAccounts],
    )

    const journalVoucherSummary = useMemo(
        () => buildJournalVoucherSummary(journalVouchers),
        [journalVouchers],
    )

    const bankReconciliationSummary = useMemo(
        () => buildBankReconciliationSummary(reconciliationEntries),
        [reconciliationEntries],
    )

    const derivedTrialBalance = useMemo(
        () => (apiLive ? buildTrialBalanceFromGl(mergedGeneralLedger) : TRIAL_BALANCE_REGISTER),
        [apiLive, mergedGeneralLedger],
    )
    const derivedProfitLoss = useMemo(
        () => (apiLive
            ? buildProfitLossFromGl(mergedGeneralLedger, coaAccounts)
            : PROFIT_LOSS_STATEMENT),
        [apiLive, mergedGeneralLedger, coaAccounts],
    )
    const derivedBalanceSheet = useMemo(
        () => (apiLive
            ? buildBalanceSheetFromGl(mergedGeneralLedger, coaAccounts)
            : BALANCE_SHEET_STATEMENT),
        [apiLive, mergedGeneralLedger, coaAccounts],
    )
    const derivedCashFlow = useMemo(
        () => (apiLive
            ? buildCashFlowFromBooks({
                cashBookEntries: mergedCashBook,
                bankBookEntries: mergedBankBook,
                transactions: finance.transactions || [],
            })
            : CASH_FLOW_STATEMENT),
        [apiLive, mergedCashBook, mergedBankBook, finance.transactions],
    )

    const handleAddOfflineEntry = (entry) => {
        const amount = parseRupeeAmount(entry.debit !== '—' ? entry.debit : entry.credit)
        const paymentMode = entry.paymentMethod === 'Cash'
            ? PAYMENT_MODES.CASH
            : entry.paymentMethod === 'Cheque'
                ? PAYMENT_MODES.CHEQUE
                : PAYMENT_MODES.BANK_TRANSFER
        if (!apiLive) {
            setDayBookEntries((prev) => appendDayBookEntry(prev, DAY_BOOK_OPENING_BALANCE, entry))
        }
        finance.addManualEntry({
            date: entry.date,
            amount,
            paymentMode,
            narration: entry.description,
            category: entry.ledgerHead,
            entryType: entry.transactionType,
            direction: entry.transactionType === 'Expense'
                ? TRANSACTION_DIRECTIONS.OUT
                : TRANSACTION_DIRECTIONS.IN,
            status: TRANSACTION_STATUSES.POSTED,
            reference: entry.voucherNo,
            createdBy: entry.enteredBy,
        })
    }

    const handlePrintDayBook = () => {
        window.print()
    }

    const handlePrintOnlineBook = () => {
        window.print()
    }

    const handlePrintGeneralLedger = () => {
        window.print()
    }

    const handleViewLedger = () => {
        ledgerRegisterRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }

    const handlePrintCashBook = () => {
        window.print()
    }

    const handlePrintBankBook = () => {
        window.print()
    }

    const handleReconcile = () => {
        navigate('/account-head/accounting/bank-reconciliation')
    }

    const handleAddCoaAccount = (account) => {
        const next = appendCoaAccount(
            finance.chartOfAccounts?.length ? finance.chartOfAccounts : (apiLive ? SNAPSHOT_COA_SEED : offlineCoaAccounts),
            account,
        )
        finance.setChartOfAccounts(next)
        if (!apiLive) setOfflineCoaAccounts(next)
    }

    const handleAddJournalVoucher = (voucher) => {
        const next = appendJournalVoucher(journalVouchers, voucher)
        finance.setJournalVouchers(next)
        if (!apiLive) setOfflineJournalVouchers(next)
        setSelectedVoucherId(null)
    }

    const handlePostVoucher = () => {
        const next = postJournalVouchers(journalVouchers, selectedVoucherId)
        finance.setJournalVouchers(next)
        if (!apiLive) setOfflineJournalVouchers(next)
        setSelectedVoucherId(null)
    }

    const persistReconciliation = (next) => {
        finance.setReconciliationItems(next)
        if (!apiLive) setOfflineReconciliationEntries(next)
    }

    const handleSyncTransactions = () => {
        setIsSyncing(true)
        window.setTimeout(() => {
            setOnlineBookEntries((prev) => syncOnlineTransaction(prev))
            setIsSyncing(false)
        }, 1200)
    }

    const handleImportBankStatement = () => {
        setIsImportingStatement(true)
        window.setTimeout(() => {
            persistReconciliation(importBankStatementEntry(reconciliationEntries))
            setIsImportingStatement(false)
        }, 1200)
    }

    const handleAutoMatch = () => {
        setIsAutoMatching(true)
        window.setTimeout(() => {
            persistReconciliation(autoMatchReconciliation(reconciliationEntries))
            setIsAutoMatching(false)
        }, 900)
    }

    const handleManualMatch = () => {
        if (!selectedReconciliationId) return
        const entry = reconciliationEntries.find((row) => row.id === selectedReconciliationId)
        const firstSuggestion = entry?.detail?.suggestions?.[0]
        setSelectedSuggestionId(firstSuggestion?.id ?? null)
        setReconciliationDrawerOpen(true)
    }

    const handleSelectReconciliation = (id) => {
        setSelectedReconciliationId(id)
        const entry = reconciliationEntries.find((row) => row.id === id)
        const firstSuggestion = entry?.detail?.suggestions?.[0]
        setSelectedSuggestionId(firstSuggestion?.id ?? null)
    }

    const handleCloseReconciliationDrawer = () => {
        setReconciliationDrawerOpen(false)
    }

    const handleReconcileEntry = (entryId, suggestionId) => {
        persistReconciliation(reconcileReconciliationEntry(reconciliationEntries, entryId, suggestionId))
        setReconciliationDrawerOpen(false)
        setSelectedReconciliationId(null)
        setSelectedSuggestionId(null)
    }

    const handleFsFilterChange = (key, value) => {
        setFsFilters((prev) => ({ ...prev, [key]: value }))
    }

    const handleGenerateReport = () => {
        setIsGeneratingReport(true)
        window.setTimeout(() => {
            setAppliedFsFilters({ ...fsFilters })
            setFsLastGeneratedAt(new Date().toLocaleString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
                hour12: true,
            }))
            setIsGeneratingReport(false)
        }, 1000)
    }

    const handlePrintFinancialStatements = () => {
        window.print()
    }

    if (!activeSection) {
        return <Navigate to={`/account-head/accounting/${DEFAULT_ACCOUNTING_SECTION}`} replace />
    }

    return (
        <section className='space-y-6'>
            <div className='bg-white rounded-2xl shadow-md p-4'>
                <div className='flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4'>
                    <div>
                        <h2 className='text-xl font-semibold text-black'>{activeLabel}</h2>
                        <p className='text-sm text-[#667085] mt-1'>{sectionSubtitle}</p>
                        <FinanceSnapshotBanner mockNote='Books, COA (balances from GL), journal vouchers, reconciliation, and financial statements use the campus finance snapshot when Finance API is on.' />
                    </div>
                    <div className='flex flex-wrap items-center gap-3'>
                        <select
                            value={academicYear}
                            onChange={(event) => setAcademicYear(event.target.value)}
                            className='text-sm border border-[#D9D9D9] rounded-md px-3 py-2 min-w-[110px]'
                        >
                            {ACCOUNTING_YEARS.map((year) => (
                                <option key={year} value={year}>{year}</option>
                            ))}
                        </select>

                        {activeSection === 'day-book' ? (
                            <>
                                <button
                                    type='button'
                                    onClick={() => setAddOfflineModal(true)}
                                    className='inline-flex items-center gap-2 bg-[#515DEF] text-white text-sm px-4 py-2 rounded-md hover:opacity-90 transition-all cursor-pointer'
                                >
                                    <Plus size={16} />
                                    Add Offline Entry
                                </button>
                                <button
                                    type='button'
                                    onClick={() => setExportModal(true)}
                                    className='inline-flex items-center gap-2 text-sm font-medium text-[#515DEF] border border-[#515DEF] px-4 py-2 rounded-md hover:bg-[#515DEF] hover:text-white transition-colors cursor-pointer'
                                >
                                    <Download size={16} />
                                    Export PDF
                                </button>
                                <button
                                    type='button'
                                    onClick={() => setExportModal(true)}
                                    className='inline-flex items-center gap-2 text-sm font-medium text-[#515DEF] border border-[#515DEF] px-4 py-2 rounded-md hover:bg-[#515DEF] hover:text-white transition-colors cursor-pointer'
                                >
                                    <FileSpreadsheet size={16} />
                                    Export Excel
                                </button>
                                <button
                                    type='button'
                                    onClick={handlePrintDayBook}
                                    className='inline-flex items-center gap-2 text-sm font-medium text-[#515DEF] border border-[#515DEF] px-4 py-2 rounded-md hover:bg-[#515DEF] hover:text-white transition-colors cursor-pointer'
                                >
                                    <Printer size={16} />
                                    Print Day Book
                                </button>
                            </>
                        ) : activeSection === 'online-book' ? (
                            <>
                                <button
                                    type='button'
                                    onClick={handleSyncTransactions}
                                    disabled={isSyncing}
                                    className='inline-flex items-center gap-2 bg-[#515DEF] text-white text-sm px-4 py-2 rounded-md hover:opacity-90 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed'
                                >
                                    <RefreshCw size={16} className={isSyncing ? 'animate-spin' : ''} />
                                    {isSyncing ? 'Syncing...' : 'Sync Transactions'}
                                </button>
                                <button
                                    type='button'
                                    onClick={() => setExportModal(true)}
                                    className='inline-flex items-center gap-2 text-sm font-medium text-[#515DEF] border border-[#515DEF] px-4 py-2 rounded-md hover:bg-[#515DEF] hover:text-white transition-colors cursor-pointer'
                                >
                                    <Download size={16} />
                                    Export PDF
                                </button>
                                <button
                                    type='button'
                                    onClick={() => setExportModal(true)}
                                    className='inline-flex items-center gap-2 text-sm font-medium text-[#515DEF] border border-[#515DEF] px-4 py-2 rounded-md hover:bg-[#515DEF] hover:text-white transition-colors cursor-pointer'
                                >
                                    <FileSpreadsheet size={16} />
                                    Export Excel
                                </button>
                                <button
                                    type='button'
                                    onClick={handlePrintOnlineBook}
                                    className='inline-flex items-center gap-2 text-sm font-medium text-[#515DEF] border border-[#515DEF] px-4 py-2 rounded-md hover:bg-[#515DEF] hover:text-white transition-colors cursor-pointer'
                                >
                                    <Printer size={16} />
                                    Print
                                </button>
                            </>
                        ) : activeSection === 'general-ledger' ? (
                            <>
                                <button
                                    type='button'
                                    onClick={handleViewLedger}
                                    className='inline-flex items-center gap-2 bg-[#515DEF] text-white text-sm px-4 py-2 rounded-md hover:opacity-90 transition-all cursor-pointer'
                                >
                                    <BookOpen size={16} />
                                    View Ledger
                                </button>
                                <button
                                    type='button'
                                    onClick={() => setExportModal(true)}
                                    className='inline-flex items-center gap-2 text-sm font-medium text-[#515DEF] border border-[#515DEF] px-4 py-2 rounded-md hover:bg-[#515DEF] hover:text-white transition-colors cursor-pointer'
                                >
                                    <Download size={16} />
                                    Export
                                </button>
                                <button
                                    type='button'
                                    onClick={handlePrintGeneralLedger}
                                    className='inline-flex items-center gap-2 text-sm font-medium text-[#515DEF] border border-[#515DEF] px-4 py-2 rounded-md hover:bg-[#515DEF] hover:text-white transition-colors cursor-pointer'
                                >
                                    <Printer size={16} />
                                    Print
                                </button>
                            </>
                        ) : activeSection === 'cash-book' ? (
                            <>
                                <button
                                    type='button'
                                    onClick={() => setExportModal(true)}
                                    className='inline-flex items-center gap-2 text-sm font-medium text-[#515DEF] border border-[#515DEF] px-4 py-2 rounded-md hover:bg-[#515DEF] hover:text-white transition-colors cursor-pointer'
                                >
                                    <Download size={16} />
                                    Export
                                </button>
                                <button
                                    type='button'
                                    onClick={handlePrintCashBook}
                                    className='inline-flex items-center gap-2 text-sm font-medium text-[#515DEF] border border-[#515DEF] px-4 py-2 rounded-md hover:bg-[#515DEF] hover:text-white transition-colors cursor-pointer'
                                >
                                    <Printer size={16} />
                                    Print
                                </button>
                            </>
                        ) : activeSection === 'bank-book' ? (
                            <>
                                <button
                                    type='button'
                                    onClick={() => setExportModal(true)}
                                    className='inline-flex items-center gap-2 text-sm font-medium text-[#515DEF] border border-[#515DEF] px-4 py-2 rounded-md hover:bg-[#515DEF] hover:text-white transition-colors cursor-pointer'
                                >
                                    <Download size={16} />
                                    Export
                                </button>
                                <button
                                    type='button'
                                    onClick={handlePrintBankBook}
                                    className='inline-flex items-center gap-2 text-sm font-medium text-[#515DEF] border border-[#515DEF] px-4 py-2 rounded-md hover:bg-[#515DEF] hover:text-white transition-colors cursor-pointer'
                                >
                                    <Printer size={16} />
                                    Print
                                </button>
                                <button
                                    type='button'
                                    onClick={handleReconcile}
                                    className='inline-flex items-center gap-2 bg-[#515DEF] text-white text-sm px-4 py-2 rounded-md hover:opacity-90 transition-all cursor-pointer'
                                >
                                    <ArrowRightLeft size={16} />
                                    Reconcile
                                </button>
                            </>
                        ) : activeSection === 'chart-of-accounts' ? (
                            <>
                                <button
                                    type='button'
                                    onClick={() => setAddAccountModal(true)}
                                    className='inline-flex items-center gap-2 bg-[#515DEF] text-white text-sm px-4 py-2 rounded-md hover:opacity-90 transition-all cursor-pointer'
                                >
                                    <Plus size={16} />
                                    Add Account
                                </button>
                                <button
                                    type='button'
                                    onClick={() => setExportModal(true)}
                                    className='inline-flex items-center gap-2 text-sm font-medium text-[#515DEF] border border-[#515DEF] px-4 py-2 rounded-md hover:bg-[#515DEF] hover:text-white transition-colors cursor-pointer'
                                >
                                    <Upload size={16} />
                                    Import COA
                                </button>
                                <button
                                    type='button'
                                    onClick={() => setExportModal(true)}
                                    className='inline-flex items-center gap-2 text-sm font-medium text-[#515DEF] border border-[#515DEF] px-4 py-2 rounded-md hover:bg-[#515DEF] hover:text-white transition-colors cursor-pointer'
                                >
                                    <Download size={16} />
                                    Export
                                </button>
                            </>
                        ) : activeSection === 'journal-vouchers' ? (
                            <>
                                <button
                                    type='button'
                                    onClick={() => setNewVoucherModal(true)}
                                    className='inline-flex items-center gap-2 bg-[#515DEF] text-white text-sm px-4 py-2 rounded-md hover:opacity-90 transition-all cursor-pointer'
                                >
                                    <Plus size={16} />
                                    New Journal Voucher
                                </button>
                                <button
                                    type='button'
                                    onClick={handlePostVoucher}
                                    className='inline-flex items-center gap-2 text-sm font-medium text-[#515DEF] border border-[#515DEF] px-4 py-2 rounded-md hover:bg-[#515DEF] hover:text-white transition-colors cursor-pointer'
                                >
                                    <Check size={16} />
                                    Post Voucher
                                </button>
                                <button
                                    type='button'
                                    onClick={() => setExportModal(true)}
                                    className='inline-flex items-center gap-2 text-sm font-medium text-[#515DEF] border border-[#515DEF] px-4 py-2 rounded-md hover:bg-[#515DEF] hover:text-white transition-colors cursor-pointer'
                                >
                                    <Download size={16} />
                                    Export
                                </button>
                            </>
                        ) : activeSection === 'bank-reconciliation' ? (
                            <>
                                <button
                                    type='button'
                                    onClick={handleImportBankStatement}
                                    disabled={isImportingStatement}
                                    className='inline-flex items-center gap-2 bg-[#515DEF] text-white text-sm px-4 py-2 rounded-md hover:opacity-90 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed'
                                >
                                    <Upload size={16} className={isImportingStatement ? 'animate-pulse' : ''} />
                                    {isImportingStatement ? 'Importing...' : 'Import Bank Statement'}
                                </button>
                                <button
                                    type='button'
                                    onClick={handleAutoMatch}
                                    disabled={isAutoMatching}
                                    className='inline-flex items-center gap-2 text-sm font-medium text-[#515DEF] border border-[#515DEF] px-4 py-2 rounded-md hover:bg-[#515DEF] hover:text-white transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed'
                                >
                                    <RefreshCw size={16} className={isAutoMatching ? 'animate-spin' : ''} />
                                    {isAutoMatching ? 'Matching...' : 'Auto Match'}
                                </button>
                                <button
                                    type='button'
                                    onClick={handleManualMatch}
                                    disabled={!selectedReconciliationId}
                                    className='inline-flex items-center gap-2 text-sm font-medium text-[#515DEF] border border-[#515DEF] px-4 py-2 rounded-md hover:bg-[#515DEF] hover:text-white transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed'
                                >
                                    <ArrowRightLeft size={16} />
                                    Manual Match
                                </button>
                                <button
                                    type='button'
                                    onClick={() => setExportModal(true)}
                                    className='inline-flex items-center gap-2 text-sm font-medium text-[#515DEF] border border-[#515DEF] px-4 py-2 rounded-md hover:bg-[#515DEF] hover:text-white transition-colors cursor-pointer'
                                >
                                    <Download size={16} />
                                    Export
                                </button>
                            </>
                        ) : activeSection === 'financial-statements' ? (
                            <>
                                <button
                                    type='button'
                                    onClick={handleGenerateReport}
                                    disabled={isGeneratingReport}
                                    className='inline-flex items-center gap-2 bg-[#515DEF] text-white text-sm px-4 py-2 rounded-md hover:opacity-90 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed'
                                >
                                    <FileText size={16} className={isGeneratingReport ? 'animate-pulse' : ''} />
                                    {isGeneratingReport ? 'Generating...' : 'Generate Report'}
                                </button>
                                <button
                                    type='button'
                                    onClick={() => setExportModal(true)}
                                    className='inline-flex items-center gap-2 text-sm font-medium text-[#515DEF] border border-[#515DEF] px-4 py-2 rounded-md hover:bg-[#515DEF] hover:text-white transition-colors cursor-pointer'
                                >
                                    <Download size={16} />
                                    Export PDF
                                </button>
                                <button
                                    type='button'
                                    onClick={() => setExportModal(true)}
                                    className='inline-flex items-center gap-2 text-sm font-medium text-[#515DEF] border border-[#515DEF] px-4 py-2 rounded-md hover:bg-[#515DEF] hover:text-white transition-colors cursor-pointer'
                                >
                                    <FileSpreadsheet size={16} />
                                    Export Excel
                                </button>
                                <button
                                    type='button'
                                    onClick={handlePrintFinancialStatements}
                                    className='inline-flex items-center gap-2 text-sm font-medium text-[#515DEF] border border-[#515DEF] px-4 py-2 rounded-md hover:bg-[#515DEF] hover:text-white transition-colors cursor-pointer'
                                >
                                    <Printer size={16} />
                                    Print Report
                                </button>
                            </>
                        ) : (
                            <button
                                type='button'
                                onClick={() => setExportModal(true)}
                                className='inline-flex items-center gap-2 text-sm font-medium text-[#515DEF] border border-[#515DEF] px-4 py-2 rounded-md hover:bg-[#515DEF] hover:text-white transition-colors cursor-pointer'
                            >
                                <Download size={16} />
                                Export
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {activeSection === 'day-book' && (
                <DayBookTab
                    entries={mergedDayBook}
                    summary={dayBookSummary}
                    onEditNarration={finance.editNarration}
                />
            )}
            {activeSection === 'online-book' && (
                <OnlineBookTab
                    entries={mergedOnlineBook}
                    summary={onlineBookSummary}
                    selectedTransaction={selectedOnlineTransaction}
                    onSelectTransaction={setSelectedOnlineTransaction}
                    onCloseDetails={() => setSelectedOnlineTransaction(null)}
                />
            )}
            {activeSection === 'general-ledger' && (
                <GeneralLedgerTab
                    entries={mergedGeneralLedger}
                    summary={generalLedgerSummary}
                    registerRef={ledgerRegisterRef}
                />
            )}
            {activeSection === 'cash-book' && (
                <CashBookTab entries={mergedCashBook} summary={cashBookSummary} />
            )}
            {activeSection === 'bank-book' && (
                <BankBookTab entries={mergedBankBook} summary={bankBookSummary} />
            )}
            {activeSection === 'chart-of-accounts' && (
                <ChartOfAccountsTab accounts={coaAccounts} summary={coaSummary} />
            )}
            {activeSection === 'journal-vouchers' && (
                <JournalVouchersTab
                    vouchers={journalVouchers}
                    summary={journalVoucherSummary}
                    selectedId={selectedVoucherId}
                    onSelect={setSelectedVoucherId}
                />
            )}
            {activeSection === 'bank-reconciliation' && (
                <BankReconciliationTab
                    entries={reconciliationEntries}
                    summary={bankReconciliationSummary}
                    selectedId={selectedReconciliationId}
                    onSelect={handleSelectReconciliation}
                    drawerOpen={reconciliationDrawerOpen}
                    onCloseDrawer={handleCloseReconciliationDrawer}
                    onReconcile={handleReconcileEntry}
                    selectedSuggestionId={selectedSuggestionId}
                    onSelectSuggestion={setSelectedSuggestionId}
                />
            )}
            {activeSection === 'financial-statements' && (
                <FinancialStatementsTab
                    statementType={financialStatementType}
                    onStatementTypeChange={setFinancialStatementType}
                    filters={fsFilters}
                    onFilterChange={handleFsFilterChange}
                    appliedFilters={appliedFsFilters}
                    lastGeneratedAt={fsLastGeneratedAt}
                    isGenerating={isGeneratingReport}
                    trialBalanceRows={derivedTrialBalance}
                    profitLossRows={derivedProfitLoss}
                    balanceSheetRows={derivedBalanceSheet}
                    cashFlowRows={derivedCashFlow}
                    snapshotMode={apiLive}
                />
            )}

            <ExportModal exportModal={exportModal} setExportModal={setExportModal} />
            <AddAccountModal
                isOpen={addAccountModal}
                onClose={() => setAddAccountModal(false)}
                onSubmit={handleAddCoaAccount}
            />
            <NewJournalVoucherModal
                isOpen={newVoucherModal}
                onClose={() => setNewVoucherModal(false)}
                onSubmit={handleAddJournalVoucher}
            />
            <AddOfflineEntryModal
                isOpen={addOfflineModal}
                onClose={() => setAddOfflineModal(false)}
                onSubmit={handleAddOfflineEntry}
            />
        </section>
    )
}

export default Accounting
