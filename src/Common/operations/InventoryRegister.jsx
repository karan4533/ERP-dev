import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Download, Plus } from 'lucide-react'
import { DataTable, DataToolbar, IntegrationNotice, StatusBadge } from '../ui'

const filterClass = 'min-h-10 rounded-lg border border-[var(--erp-line-strong)] bg-white px-3 text-sm text-[var(--erp-ink)]'

const InventoryRegister = ({
    records = [],
    columns = [],
    caption = 'Inventory register',
    title = 'Inventory',
    description,
    rowKey = 'id',
    categoryKey = 'category',
    statusKey = 'status',
    categories = [],
    createPath = '',
    createPending = false,
    viewPath,
}) => {
    const [query, setQuery] = useState('')
    const [categoryFilter, setCategoryFilter] = useState('All')
    const [statusFilter, setStatusFilter] = useState('All')

    const statuses = useMemo(
        () => [...new Set(records.map((record) => record[statusKey]).filter(Boolean))],
        [records, statusKey],
    )
    const visibleRecords = useMemo(() => {
        const normalizedQuery = query.trim().toLowerCase()
        return records.filter((record) => {
            const searchable = Object.values(record).filter((value) => typeof value !== 'object').join(' ').toLowerCase()
            return (!normalizedQuery || searchable.includes(normalizedQuery))
                && (categoryFilter === 'All' || record[categoryKey] === categoryFilter)
                && (statusFilter === 'All' || record[statusKey] === statusFilter)
        })
    }, [categoryFilter, categoryKey, query, records, statusFilter, statusKey])

    const tableColumns = columns.map((column) => column.key === statusKey && !column.render
        ? { ...column, render: (record) => <StatusBadge status={record[statusKey]} /> }
        : column)
    const resetFilters = () => {
        setQuery('')
        setCategoryFilter('All')
        setStatusFilter('All')
    }
    const hasActiveFilters = Boolean(query) || categoryFilter !== 'All' || statusFilter !== 'All'

    return (
        <section className='space-y-5'>
            <div className='rounded-2xl bg-white p-4 shadow-md sm:p-5'>
                <h2 className='text-xl font-semibold text-[var(--erp-ink)]'>{title}</h2>
                <p className='mt-1 text-sm text-[var(--erp-slate)]'>{description || 'Review quantity, reorder thresholds, ownership and stock state before requesting a movement.'}</p>
                <IntegrationNotice
                    state='demo'
                    className='mt-4'
                    title='Inventory service not connected'
                    description='These records are frontend reference data. Production quantities, valuation, reservations, batches and adjustments must come from the inventory API with an immutable movement ledger.'
                />
            </div>

            <div className='overflow-hidden rounded-2xl bg-white shadow-md'>
                <DataToolbar
                    query={query}
                    onQueryChange={setQuery}
                    searchLabel='Search inventory'
                    searchPlaceholder='Search ID, item, supplier or unit…'
                    resultCount={visibleRecords.length}
                    onReset={hasActiveFilters ? resetFilters : undefined}
                    filters={(
                        <>
                            <label className='grid gap-1 text-sm font-medium text-[var(--erp-ink)]'>Category
                                <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)} className={filterClass}>
                                    <option>All</option>
                                    {categories.map((category) => <option key={category}>{category}</option>)}
                                </select>
                            </label>
                            <label className='grid gap-1 text-sm font-medium text-[var(--erp-ink)]'>Status
                                <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className={filterClass}>
                                    <option>All</option>
                                    {statuses.map((status) => <option key={status}>{status}</option>)}
                                </select>
                            </label>
                        </>
                    )}
                    actions={(
                        <>
                            {createPath && (
                                <Link to={createPath} className='inline-flex min-h-10 items-center gap-2 rounded-lg bg-[var(--erp-indigo)] px-4 text-sm font-semibold text-white'>
                                    <Plus aria-hidden='true' size={16} /> Add inventory
                                </Link>
                            )}
                            {createPending && (
                                <button type='button' disabled title='Inventory creation requires the inventory API.' className='inline-flex min-h-10 cursor-not-allowed items-center gap-2 rounded-lg border border-[var(--erp-line-strong)] px-4 text-sm font-semibold text-[var(--erp-muted)] opacity-70'>
                                    <Plus aria-hidden='true' size={16} /> Add inventory
                                </button>
                            )}
                            <button type='button' disabled title='Export requires the reporting service.' className='inline-flex min-h-10 cursor-not-allowed items-center gap-2 rounded-lg border border-[var(--erp-line-strong)] px-4 text-sm font-semibold text-[var(--erp-muted)] opacity-70'>
                                <Download aria-hidden='true' size={16} /> Export
                            </button>
                        </>
                    )}
                />
                <DataTable
                    caption={caption}
                    rows={visibleRecords}
                    columns={tableColumns}
                    rowKey={rowKey}
                    emptyTitle='No inventory items match'
                    emptyDescription='Reset the filters or wait for the inventory service to publish the required record.'
                    renderActions={viewPath ? (record) => (
                        <Link to={viewPath(record)} className='inline-flex min-h-9 items-center rounded-lg border border-[var(--erp-line-strong)] px-3 text-xs font-semibold text-[var(--erp-indigo)]'>View details</Link>
                    ) : undefined}
                />
            </div>
            <p className='px-1 text-xs text-[var(--erp-muted)]'>Showing {visibleRecords.length} of {records.length} items. Authoritative stock changes are intentionally unavailable until the backend service is connected.</p>
        </section>
    )
}

export default InventoryRegister
