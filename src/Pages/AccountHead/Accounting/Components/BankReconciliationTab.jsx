import { useMemo, useState } from 'react'
import { Check, Undo2 } from 'lucide-react'
import { ConfirmAction, DataTable, DataToolbar, StatusBadge } from '../../../../Common/ui'
import { useFinance } from '../../financeDomain/FinanceContext'
import { CHEQUE_STATUSES } from '../../financeDomain/financeConstants'
import { formatCurrency } from '../../financeDomain/financeHelpers'
import { BANK_RECONCILIATION_BANKS } from '../accountingData'
import { SummaryCards } from './AccountingShared'
import ReconciliationDrawer from './ReconciliationDrawer'

const STATUS_FILTERS = ['All Status', 'Matched', 'Unmatched', 'Pending Reconciliation']

const BankReconciliationTab = ({
    entries,
    summary,
    selectedId,
    onReview,
    drawerOpen,
    onCloseDrawer,
    onReconcile,
    selectedSuggestionId,
    onSelectSuggestion,
}) => {
    const [query, setQuery] = useState('')
    const [dateFilter, setDateFilter] = useState('')
    const [bankFilter, setBankFilter] = useState(BANK_RECONCILIATION_BANKS[0])
    const [statusFilter, setStatusFilter] = useState(STATUS_FILTERS[0])
    const [chequeDecision, setChequeDecision] = useState(null)
    const { cheques, settleCheque } = useFinance()

    const selectedEntry = useMemo(() => entries.find((row) => row.id === selectedId) ?? null, [entries, selectedId])
    const filteredEntries = useMemo(() => entries.filter((row) => {
        if (bankFilter !== 'All Banks' && row.bank !== bankFilter) return false
        if (statusFilter !== 'All Status' && row.status !== statusFilter) return false
        if (dateFilter && row.dateIso !== dateFilter) return false
        const normalizedQuery = query.trim().toLowerCase()
        if (!normalizedQuery) return true
        return [row.id, row.date, row.voucher, row.bank, row.erpAmount, row.bankAmount, row.status]
            .join(' ')
            .toLowerCase()
            .includes(normalizedQuery)
    }), [bankFilter, dateFilter, entries, query, statusFilter])

    const reconciliationColumns = [
        { key: 'date', label: 'Date', required: true },
        { key: 'voucher', label: 'Voucher', render: (row) => <span className='font-mono text-xs font-semibold text-[var(--erp-indigo)]'>{row.voucher}</span> },
        { key: 'erpAmount', label: 'ERP amount' },
        { key: 'bankAmount', label: 'Bank amount' },
        { key: 'difference', label: 'Difference', render: (row) => <span className={row.difference === '₹0' ? '' : 'font-semibold text-[var(--erp-red)]'}>{row.difference}</span> },
        { key: 'bank', label: 'Bank account' },
        { key: 'status', label: 'Status', render: (row) => <StatusBadge status={row.status} /> },
    ]

    const chequeColumns = [
        { key: 'chequeNo', label: 'Cheque', required: true, render: (row) => <span className='font-mono text-xs font-semibold text-[var(--erp-ink)]'>{row.chequeNo}</span> },
        { key: 'bank', label: 'Bank' },
        { key: 'chequeDate', label: 'Cheque date' },
        { key: 'amount', label: 'Amount', render: (row) => <span className='font-semibold text-[var(--erp-ink)]'>{formatCurrency(row.amount)}</span> },
        { key: 'status', label: 'Status', render: (row) => <StatusBadge status={row.status} /> },
    ]

    const confirmChequeDecision = () => {
        if (!chequeDecision) return
        settleCheque(
            chequeDecision.cheque.id,
            chequeDecision.status,
            chequeDecision.status === CHEQUE_STATUSES.CLEARED ? 'Marked cleared in reconciliation review' : 'Returned by bank',
        )
        setChequeDecision(null)
    }

    const resetFilters = () => {
        setQuery('')
        setDateFilter('')
        setBankFilter(BANK_RECONCILIATION_BANKS[0])
        setStatusFilter(STATUS_FILTERS[0])
    }

    return (
        <div className='space-y-5'>
            <SummaryCards cards={summary} />

            <section className='overflow-hidden rounded-[var(--erp-radius-surface)] border border-[var(--erp-line)] bg-white' aria-labelledby='reconciliation-register-title'>
                <div className='px-4 pt-4 sm:px-5'><h3 id='reconciliation-register-title' className='text-base font-semibold text-[var(--erp-ink)]'>Reconciliation register</h3></div>
                <DataToolbar
                    query={query}
                    onQueryChange={setQuery}
                    searchLabel='Search reconciliation entries'
                    searchPlaceholder='Voucher, bank, amount or status…'
                    resultCount={filteredEntries.length}
                    onReset={resetFilters}
                    filters={(
                        <>
                            <label className='grid gap-1 text-xs font-semibold text-[var(--erp-slate)]'>Statement date
                                <input type='date' value={dateFilter} onChange={(event) => setDateFilter(event.target.value)} className='min-h-10 rounded-lg border border-[var(--erp-line-strong)] bg-white px-3 text-sm' />
                            </label>
                            <label className='grid gap-1 text-xs font-semibold text-[var(--erp-slate)]'>Bank account
                                <select value={bankFilter} onChange={(event) => setBankFilter(event.target.value)} className='min-h-10 rounded-lg border border-[var(--erp-line-strong)] bg-white px-3 text-sm'>
                                    {BANK_RECONCILIATION_BANKS.map((bank) => <option key={bank} value={bank}>{bank}</option>)}
                                </select>
                            </label>
                            <label className='grid gap-1 text-xs font-semibold text-[var(--erp-slate)]'>Match status
                                <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className='min-h-10 rounded-lg border border-[var(--erp-line-strong)] bg-white px-3 text-sm'>
                                    {STATUS_FILTERS.map((status) => <option key={status} value={status}>{status}</option>)}
                                </select>
                            </label>
                        </>
                    )}
                />
                <DataTable
                    caption='Bank reconciliation entries'
                    rows={filteredEntries}
                    columns={reconciliationColumns}
                    rowKey='id'
                    emptyTitle='No reconciliation entries found'
                    emptyDescription='Reset the filters or wait for an authorised statement import.'
                    renderActions={(row) => (
                        <button type='button' onClick={() => onReview(row.id)} className='min-h-9 rounded-md border border-[var(--erp-indigo)] px-3 text-sm font-semibold text-[var(--erp-indigo)]'>
                            {row.status === 'Matched' ? 'View match' : 'Review match'}
                        </button>
                    )}
                />
            </section>

            <section className='overflow-hidden rounded-[var(--erp-radius-surface)] border border-[var(--erp-line)] bg-white' aria-labelledby='cheque-register-title'>
                <div className='px-4 py-4 sm:px-5'>
                    <h3 id='cheque-register-title' className='text-base font-semibold text-[var(--erp-ink)]'>Cheque and PDC lifecycle</h3>
                    <p className='mt-1 text-xs text-[var(--erp-muted)]'>Clearing and bounce decisions require explicit confirmation and remain browser-stored.</p>
                </div>
                <DataTable
                    caption='Cheque and post-dated cheque lifecycle'
                    rows={cheques}
                    columns={chequeColumns}
                    rowKey='id'
                    emptyTitle='No cheques in process'
                    emptyDescription='Cheque-backed receipts will appear here when they are recorded.'
                    renderActions={(cheque) => cheque.status !== CHEQUE_STATUSES.CLEARED && cheque.status !== CHEQUE_STATUSES.BOUNCED ? (
                        <>
                            <button type='button' onClick={() => setChequeDecision({ cheque, status: CHEQUE_STATUSES.CLEARED })} className='inline-flex min-h-9 items-center gap-1.5 rounded-md border border-[var(--erp-green)] px-3 text-sm font-semibold text-[var(--erp-green)]'><Check aria-hidden='true' size={15} /> Mark cleared</button>
                            <button type='button' onClick={() => setChequeDecision({ cheque, status: CHEQUE_STATUSES.BOUNCED })} className='inline-flex min-h-9 items-center gap-1.5 rounded-md border border-[var(--erp-red)] px-3 text-sm font-semibold text-[var(--erp-red)]'><Undo2 aria-hidden='true' size={15} /> Mark bounced</button>
                        </>
                    ) : undefined}
                />
            </section>

            <ReconciliationDrawer
                isOpen={drawerOpen}
                onClose={onCloseDrawer}
                entry={selectedEntry}
                onReconcile={onReconcile}
                selectedSuggestionId={selectedSuggestionId}
                onSelectSuggestion={onSelectSuggestion}
            />

            <ConfirmAction
                open={Boolean(chequeDecision)}
                onClose={() => setChequeDecision(null)}
                onConfirm={confirmChequeDecision}
                title={`${chequeDecision?.status === CHEQUE_STATUSES.CLEARED ? 'Mark cleared' : 'Mark bounced'}?`}
                description={`This records a local ${chequeDecision?.status?.toLowerCase() || 'status'} decision for cheque ${chequeDecision?.cheque?.chequeNo || ''}. Production must verify the bank event and write an immutable audit record.`}
                confirmLabel={chequeDecision?.status === CHEQUE_STATUSES.CLEARED ? 'Confirm clearance' : 'Confirm bounce'}
                tone={chequeDecision?.status === CHEQUE_STATUSES.BOUNCED ? 'danger' : 'primary'}
            />
        </div>
    )
}

export default BankReconciliationTab
