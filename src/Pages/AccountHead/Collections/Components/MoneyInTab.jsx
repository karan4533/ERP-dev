import { useMemo, useState } from 'react'
import { DataTable, DataToolbar, IntegrationNotice, StatusBadge } from '../../../../Common/ui'
import { paymentModeLabel, TRANSACTION_STATUSES } from '../../financeDomain/financeConstants'
import { useFinance } from '../../financeDomain/FinanceContext'
import { formatCurrency, formatDisplayDate } from '../../financeDomain/financeHelpers'
import { INCOME_REGISTER, MONEY_IN_SUMMARY } from '../collectionsData'
import { SummaryCards } from './CollectionsShared'

const SOURCE_FILTERS = ['All Sources', 'Student Fees', 'Transport Fees', 'Canteen', 'Donations', 'Other']

const columns = [
    { key: 'date', label: 'Date' },
    { key: 'source', label: 'Source', required: true, render: (row) => <span className='font-semibold text-[var(--erp-ink)]'>{row.source}</span> },
    { key: 'reference', label: 'Reference', render: (row) => <span className='font-mono text-xs'>{row.reference}</span> },
    { key: 'mode', label: 'Mode' },
    { key: 'amount', label: 'Amount', render: (row) => <span className='font-semibold text-[var(--erp-green)]'>{row.amount}</span> },
    { key: 'status', label: 'Status', render: (row) => <StatusBadge status={row.status} /> },
]

const MoneyInTab = () => {
    const { postedInflow, students } = useFinance()
    const [query, setQuery] = useState('')
    const [source, setSource] = useState(SOURCE_FILTERS[0])
    const liveRows = useMemo(() => postedInflow.map((item) => ({
        id: item.id,
        date: formatDisplayDate(item.transactionDate),
        source: item.category || 'Student Fees',
        reference: item.receiptNo || item.transactionNo,
        mode: paymentModeLabel(item.paymentMode),
        amount: `+${formatCurrency(item.amount)}`,
        status: item.status === TRANSACTION_STATUSES.POSTED ? 'Cleared' : item.status,
        student: students.find((row) => row.id === item.studentId)?.name,
    })), [postedInflow, students])
    const filteredRows = useMemo(() => liveRows.filter((row) => {
        if (source !== SOURCE_FILTERS[0] && row.source !== source) return false
        const normalizedQuery = query.trim().toLowerCase()
        if (!normalizedQuery) return true
        return [row.date, row.source, row.reference, row.mode, row.amount, row.status, row.student].join(' ').toLowerCase().includes(normalizedQuery)
    }), [liveRows, query, source])

    return (
        <div className='space-y-5'>
            <IntegrationNotice state='demo' title='Sample income summary' description='The summary cards are reference analytics, not totals calculated from the browser-stored register below.' />
            <SummaryCards cards={MONEY_IN_SUMMARY} />

            <section className='overflow-hidden rounded-[var(--erp-radius-surface)] border border-[var(--erp-line)] bg-white' aria-labelledby='live-inflow-title'>
                <div className='px-4 pt-4 sm:px-5'><h3 id='live-inflow-title' className='text-base font-semibold text-[var(--erp-ink)]'>Browser-stored inflows</h3><p className='mt-1 text-xs text-[var(--erp-muted)]'>Created from fee and other local finance workflows in this browser.</p></div>
                <DataToolbar query={query} onQueryChange={setQuery} searchLabel='Search browser-stored inflows' searchPlaceholder='Reference, source, student or amount…' resultCount={filteredRows.length} onReset={() => { setQuery(''); setSource(SOURCE_FILTERS[0]) }} filters={(
                    <label className='grid gap-1 text-xs font-semibold text-[var(--erp-slate)]'>Source
                        <select value={source} onChange={(event) => setSource(event.target.value)} className='min-h-10 rounded-lg border border-[var(--erp-line-strong)] bg-white px-3 text-sm'>{SOURCE_FILTERS.map((item) => <option key={item}>{item}</option>)}</select>
                    </label>
                )} />
                <DataTable caption='Browser-stored inflows' rows={filteredRows} columns={columns} rowKey='id' emptyTitle='No browser-stored inflows' emptyDescription='Record a confirmed local collection to populate this register.' />
            </section>

            <section className='overflow-hidden rounded-[var(--erp-radius-surface)] border border-[var(--erp-line)] bg-white' aria-labelledby='sample-income-title'>
                <div className='px-4 py-4 sm:px-5'><h3 id='sample-income-title' className='text-base font-semibold text-[var(--erp-ink)]'>Sample income reference</h3><p className='mt-1 text-xs text-[var(--erp-muted)]'>Static design fixture · never included in browser-stored totals.</p></div>
                <DataTable caption='Sample income reference' rows={INCOME_REGISTER} columns={columns} rowKey='id' />
            </section>
        </div>
    )
}

export default MoneyInTab
