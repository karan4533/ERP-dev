import React, { useMemo, useRef, useState } from 'react'
import { BookOpen, Check, Download, FileSpreadsheet, Plus, Printer, RefreshCw, ArrowRightLeft, Upload, FileText } from 'lucide-react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import ExportModal from '../../../Common/CommonComponents/ExportModal'
import { useFinance } from '../financeDomain/FinanceContext'
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
    COA_ACCOUNTS,
    JOURNAL_VOUCHERS_REGISTER,
    BANK_RECONCILIATION_REGISTER,
} from './accountingData'

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
    const [dayBookEntries, setDayBookEntries] = useState(DAY_BOOK_REGISTER)
    const finance = useFinance()
    const [onlineBookEntries, setOnlineBookEntries] = useState(ONLINE_BOOK_REGISTER)
    const [selectedOnlineTransaction, setSelectedOnlineTransaction] = useState(null)
    const [isSyncing, setIsSyncing] = useState(false)
    const [generalLedgerEntries] = useState(GENERAL_LEDGER_REGISTER)
    const [cashBookEntries] = useState(CASH_BOOK_REGISTER)
    const [bankBookEntries] = useState(BANK_BOOK_REGISTER)
    const [coaAccounts, setCoaAccounts] = useState(COA_ACCOUNTS)
    const [journalVouchers, setJournalVouchers] = useState(JOURNAL_VOUCHERS_REGISTER)
    const [selectedVoucherId, setSelectedVoucherId] = useState(null)
    const [reconciliationEntries, setReconciliationEntries] = useState(BANK_RECONCILIATION_REGISTER)
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

    const activeSection = useMemo(() => {
        const match = ACCOUNTING_SECTIONS.find((item) => item.id === section)
        return match?.id ?? null
    }, [section])

    const activeLabel = ACCOUNTING_SECTIONS.find((item) => item.id === activeSection)?.label ?? 'Accounting'
    const sectionSubtitle = SECTION_SUBTITLES[activeSection] ?? `Academic Year ${academicYear} · Books as of 26 Jun 2026`

    const mergedDayBook = useMemo(
        () => [...finance.dayBookEntries, ...dayBookEntries],
        [finance.dayBookEntries, dayBookEntries],
    )
    const mergedOnlineBook = useMemo(
        () => [...finance.onlineBookEntries, ...onlineBookEntries],
        [finance.onlineBookEntries, onlineBookEntries],
    )
    const mergedGeneralLedger = useMemo(
        () => [...finance.glEntries, ...generalLedgerEntries],
        [finance.glEntries, generalLedgerEntries],
    )
    const mergedCashBook = useMemo(
        () => [...finance.cashBookEntries, ...cashBookEntries],
        [finance.cashBookEntries, cashBookEntries],
    )
    const mergedBankBook = useMemo(
        () => [...finance.bankBookEntries, ...bankBookEntries],
        [finance.bankBookEntries, bankBookEntries],
    )

    const dayBookSummary = useMemo(
        () => buildDayBookSummary(mergedDayBook, DAY_BOOK_OPENING_BALANCE),
        [mergedDayBook],
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
        () => buildCashBookSummary(mergedCashBook, CASH_BOOK_OPENING_BALANCE),
        [mergedCashBook],
    )

    const bankBookSummary = useMemo(
        () => buildBankBookSummary(mergedBankBook, BANK_BOOK_OPENING_BALANCE),
        [mergedBankBook],
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

    const handleAddOfflineEntry = (entry) => {
        setDayBookEntries((prev) => appendDayBookEntry(prev, DAY_BOOK_OPENING_BALANCE, entry))
        finance.addManualEntry({
            date: entry.date,
            amount: entry.debit !== '—' ? entry.debit : entry.credit,
            paymentMode: entry.paymentMethod === 'Cash' ? 'CASH' : 'BANK_TRANSFER',
            narration: entry.description,
            category: entry.ledgerHead,
            entryType: entry.transactionType,
            status: 'DRAFT',
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
        setCoaAccounts((prev) => appendCoaAccount(prev, account))
    }

    const handleAddJournalVoucher = (voucher) => {
        setJournalVouchers((prev) => appendJournalVoucher(prev, voucher))
        setSelectedVoucherId(null)
    }

    const handlePostVoucher = () => {
        setJournalVouchers((prev) => postJournalVouchers(prev, selectedVoucherId))
        setSelectedVoucherId(null)
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
            setReconciliationEntries((prev) => importBankStatementEntry(prev))
            setIsImportingStatement(false)
        }, 1200)
    }

    const handleAutoMatch = () => {
        setIsAutoMatching(true)
        window.setTimeout(() => {
            setReconciliationEntries((prev) => autoMatchReconciliation(prev))
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
        setReconciliationEntries((prev) => reconcileReconciliationEntry(prev, entryId, suggestionId))
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
