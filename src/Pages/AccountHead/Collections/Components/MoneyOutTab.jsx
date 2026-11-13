import { useMemo, useState } from 'react'
import { DataTable, DataToolbar, IntegrationNotice, StatusBadge } from '../../../../Common/ui'
import { EXPENSE_REGISTER, MONEY_OUT_SUMMARY } from '../collectionsData'
import { SummaryCards } from './CollectionsShared'

const CATEGORY_FILTERS = ['All Categories', 'Salaries', 'Transport', 'Maintenance', 'Utilities', 'Procurement']

const MoneyOutTab = () => {
    const [query, setQuery] = useState('')
    const [category, setCategory] = useState(CATEGORY_FILTERS[0])
    const rows = useMemo(() => EXPENSE_REGISTER.filter((row) => {
        if (category !== CATEGORY_FILTERS[0] && row.category !== category) return false
        const normalizedQuery = query.trim().toLowerCase()
        if (!normalizedQuery) return true
        return [row.date, row.category, row.paidTo, row.mode, row.amount, row.status].join(' ').toLowerCase().includes(normalizedQuery)
    }), [category, query])
    const columns = [
        { key: 'date', label: 'Date' },
        { key: 'category', label: 'Category', required: true, render: (row) => <span className='font-semibold text-[var(--erp-ink)]'>{row.category}</span> },
        { key: 'paidTo', label: 'Paid to' },
        { key: 'mode', label: 'Mode' },
        { key: 'amount', label: 'Amount', render: (row) => <span className='font-semibold text-[var(--erp-red)]'>{row.amount}</span> },
        { key: 'status', label: 'Status', render: (row) => <StatusBadge status={row.status} /> },
    ]

    return (
        <div className='space-y-5'>
            <IntegrationNotice state='demo' title='Sample expense reference' description='Expense cards and rows are static reporting fixtures. They are not authoritative payouts and are not mixed with browser-stored transactions.' />
            <SummaryCards cards={MONEY_OUT_SUMMARY} />
            <section className='overflow-hidden rounded-[var(--erp-radius-surface)] border border-[var(--erp-line)] bg-white' aria-labelledby='sample-expense-title'>
                <div className='px-4 pt-4 sm:px-5'><h3 id='sample-expense-title' className='text-base font-semibold text-[var(--erp-ink)]'>Sample expense reference</h3></div>
                <DataToolbar query={query} onQueryChange={setQuery} searchLabel='Search sample expenses' searchPlaceholder='Category, payee, mode or status…' resultCount={rows.length} onReset={() => { setQuery(''); setCategory(CATEGORY_FILTERS[0]) }} filters={(
                    <label className='grid gap-1 text-xs font-semibold text-[var(--erp-slate)]'>Category
                        <select value={category} onChange={(event) => setCategory(event.target.value)} className='min-h-10 rounded-lg border border-[var(--erp-line-strong)] bg-white px-3 text-sm'>{CATEGORY_FILTERS.map((item) => <option key={item}>{item}</option>)}</select>
                    </label>
                )} />
                <DataTable caption='Sample expense reference' rows={rows} columns={columns} rowKey='id' emptyTitle='No sample expenses found' emptyDescription='Reset the filters to see the full reference dataset.' />
            </section>
        </div>
    )
}

export default MoneyOutTab
