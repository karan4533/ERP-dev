import { useMemo, useState } from 'react'
import { DataTable, DataToolbar, StatusBadge } from '../../../../Common/ui'
import { SummaryCards } from './AccountingShared'

const JV_STATUS_FILTERS = ['All Status', 'Draft', 'Pending Approval', 'Posted']

const JournalVouchersTab = ({ vouchers, summary, selectedId, onSelect }) => {
    const [query, setQuery] = useState('')
    const [statusFilter, setStatusFilter] = useState(JV_STATUS_FILTERS[0])

    const filteredVouchers = useMemo(() => vouchers.filter((row) => {
        if (statusFilter !== 'All Status' && row.status !== statusFilter) return false
        const normalizedQuery = query.trim().toLowerCase()
        if (!normalizedQuery) return true
        return [row.voucherNo, row.date, row.description, row.debit, row.credit, row.status, row.createdBy]
            .join(' ')
            .toLowerCase()
            .includes(normalizedQuery)
    }), [query, statusFilter, vouchers])

    const columns = [
        { key: 'voucherNo', label: 'Voucher', required: true, render: (row) => <span className='font-mono text-xs font-semibold text-[var(--erp-indigo)]'>{row.voucherNo}</span> },
        { key: 'date', label: 'Date' },
        { key: 'description', label: 'Description', render: (row) => <span className='font-medium text-[var(--erp-ink)]'>{row.description}</span> },
        { key: 'debit', label: 'Debit' },
        { key: 'credit', label: 'Credit' },
        { key: 'status', label: 'Status', render: (row) => <StatusBadge status={row.status} /> },
        { key: 'createdBy', label: 'Created by' },
    ]

    return (
        <div className='space-y-5'>
            <SummaryCards cards={summary} />
            <section className='overflow-hidden rounded-[var(--erp-radius-surface)] border border-[var(--erp-line)] bg-white' aria-labelledby='journal-register-title'>
                <div className='px-4 pt-4 sm:px-5'><h3 id='journal-register-title' className='text-base font-semibold text-[var(--erp-ink)]'>Voucher register</h3></div>
                <DataToolbar
                    query={query}
                    onQueryChange={setQuery}
                    searchLabel='Search journal vouchers'
                    searchPlaceholder='Voucher, description, person or amount…'
                    resultCount={filteredVouchers.length}
                    onReset={() => { setQuery(''); setStatusFilter(JV_STATUS_FILTERS[0]) }}
                    filters={(
                        <label className='grid gap-1 text-xs font-semibold text-[var(--erp-slate)]'>Posting status
                            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className='min-h-10 rounded-lg border border-[var(--erp-line-strong)] bg-white px-3 text-sm'>
                                {JV_STATUS_FILTERS.map((status) => <option key={status} value={status}>{status}</option>)}
                            </select>
                        </label>
                    )}
                />
                <DataTable
                    caption='Journal voucher register'
                    rows={filteredVouchers}
                    columns={columns}
                    rowKey='id'
                    emptyTitle='No journal vouchers found'
                    emptyDescription='Reset the filters or create a new journal voucher.'
                    renderActions={(row) => (
                        <button
                            type='button'
                            onClick={() => onSelect(row.id)}
                            aria-pressed={selectedId === row.id}
                            className={`min-h-9 rounded-md border px-3 text-sm font-semibold ${selectedId === row.id ? 'border-[var(--erp-indigo)] bg-[#F4F4FF] text-[var(--erp-indigo)]' : 'border-[var(--erp-line-strong)] text-[var(--erp-slate)]'}`}
                        >
                            {selectedId === row.id ? 'Selected' : 'Select voucher'}
                        </button>
                    )}
                />
            </section>
        </div>
    )
}

export default JournalVouchersTab
