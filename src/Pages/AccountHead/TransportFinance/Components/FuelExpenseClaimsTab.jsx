import { useMemo, useState } from 'react'
import { DataTable, DataToolbar, IntegrationNotice, StatusBadge } from '../../../../Common/ui'
import { EXPENSE_CLAIMS, FUEL_SUMMARY } from '../transportFinanceData'
import { StaffAvatar, SummaryCards } from './TransportShared'

const TYPE_FILTERS = ['All types', 'Fuel', 'Service', 'Toll', 'Misc']
const STATUS_FILTERS = ['All statuses', 'Pending', 'Approved', 'Rejected']

const FuelExpenseClaimsTab = ({ expenseClaims = EXPENSE_CLAIMS }) => {
    const [query, setQuery] = useState('')
    const [type, setType] = useState(TYPE_FILTERS[0])
    const [status, setStatus] = useState(STATUS_FILTERS[0])
    const rows = useMemo(() => expenseClaims.filter((row) => {
        if (type !== TYPE_FILTERS[0] && row.type !== type) return false
        if (status !== STATUS_FILTERS[0] && row.status !== status) return false
        const normalizedQuery = query.trim().toLowerCase()
        return !normalizedQuery || [row.id, row.claimant, row.vehicle, row.type, row.amount, row.status].join(' ').toLowerCase().includes(normalizedQuery)
    }), [expenseClaims, query, status, type])
    const columns = [
        { key: 'claimant', label: 'Claimant', required: true, render: (row) => <StaffAvatar initials={row.initials} name={row.claimant} /> },
        { key: 'vehicle', label: 'Vehicle', render: (row) => <span className='font-mono text-xs'>{row.vehicle}</span> },
        { key: 'type', label: 'Type' },
        { key: 'date', label: 'Date' },
        { key: 'amount', label: 'Amount', required: true, render: (row) => <span className='font-semibold text-[var(--erp-ink)]'>{row.amount}</span> },
        { key: 'status', label: 'Status', render: (row) => <StatusBadge status={row.status} /> },
    ]
    return (
        <div className='space-y-5'>
            <IntegrationNotice state='demo' title='Sample transport claims' description='Claims are reference data only. Review, rejection rationale, approval, disbursement and audit history require the connected expense workflow.' />
            <SummaryCards cards={FUEL_SUMMARY} />
            <section className='overflow-hidden rounded-[var(--erp-radius-surface)] border border-[var(--erp-line)] bg-white' aria-labelledby='transport-claims-title'>
                <div className='px-4 pt-4 sm:px-5'><h3 id='transport-claims-title' className='text-base font-semibold text-[var(--erp-ink)]'>Fuel & expense claims</h3></div>
                <DataToolbar query={query} onQueryChange={setQuery} searchLabel='Search transport claims' searchPlaceholder='Claimant, vehicle or amount…' resultCount={rows.length} onReset={() => { setQuery(''); setType(TYPE_FILTERS[0]); setStatus(STATUS_FILTERS[0]) }} filters={<><label className='grid gap-1 text-xs font-semibold text-[var(--erp-slate)]'>Type<select value={type} onChange={(event) => setType(event.target.value)} className='min-h-10 rounded-lg border border-[var(--erp-line-strong)] bg-white px-3 text-sm'>{TYPE_FILTERS.map((item) => <option key={item}>{item}</option>)}</select></label><label className='grid gap-1 text-xs font-semibold text-[var(--erp-slate)]'>Status<select value={status} onChange={(event) => setStatus(event.target.value)} className='min-h-10 rounded-lg border border-[var(--erp-line-strong)] bg-white px-3 text-sm'>{STATUS_FILTERS.map((item) => <option key={item}>{item}</option>)}</select></label></>} />
                <DataTable caption='Transport fuel and expense claims' rows={rows} columns={columns} rowKey='id' emptyTitle='No claims found' emptyDescription='Reset the filters to review available sample claims.' renderActions={(row) => <button type='button' disabled title='Claim review requires the connected approval API.' className='min-h-9 rounded-md border border-[var(--erp-line-strong)] px-3 text-sm font-semibold text-[var(--erp-muted)] opacity-60'>{row.status === 'Pending' ? 'Review unavailable' : 'Details unavailable'}</button>} />
            </section>
        </div>
    )
}

export default FuelExpenseClaimsTab
