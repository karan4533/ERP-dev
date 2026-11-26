import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Download, Plus } from 'lucide-react'
import { DataTable, DataToolbar, IntegrationNotice } from '../ui'

const filterClass = 'min-h-10 rounded-lg border border-[var(--erp-line-strong)] bg-white px-3 text-sm text-[var(--erp-ink)]'
const getFilterOptions = (rows, filter) => filter?.options || [...new Set(rows.map((row) => row[filter?.key]).filter(Boolean))]

const OperationsRecordRegister = ({
    rows = [],
    columns = [],
    rowKey,
    title,
    description,
    caption,
    searchPlaceholder,
    integrationState = 'demo',
    integrationTitle = 'Operational service not connected',
    integrationDescription,
    primaryFilter,
    secondaryFilter,
    createPath,
    createLabel = 'Create record',
    viewPath,
    footerDescription = 'Production mutations require API authorization, version checks and audit metadata.',
}) => {
    const [query, setQuery] = useState('')
    const [primaryValue, setPrimaryValue] = useState('All')
    const [secondaryValue, setSecondaryValue] = useState('All')
    const primaryOptions = useMemo(() => getFilterOptions(rows, primaryFilter), [primaryFilter, rows])
    const secondaryOptions = useMemo(() => getFilterOptions(rows, secondaryFilter), [rows, secondaryFilter])
    const visibleRows = useMemo(() => {
        const normalizedQuery = query.trim().toLowerCase()
        return rows.filter((row) => {
            const searchable = Object.values(row)
                .flatMap((value) => Array.isArray(value) ? value : [value])
                .filter((value) => typeof value !== 'object' && value != null)
                .join(' ')
                .toLowerCase()
            return (!normalizedQuery || searchable.includes(normalizedQuery))
                && (!primaryFilter || primaryValue === 'All' || row[primaryFilter.key] === primaryValue)
                && (!secondaryFilter || secondaryValue === 'All' || row[secondaryFilter.key] === secondaryValue)
        })
    }, [primaryFilter, primaryValue, query, rows, secondaryFilter, secondaryValue])
    const hasActiveFilters = Boolean(query) || primaryValue !== 'All' || secondaryValue !== 'All'
    const resetFilters = () => {
        setQuery('')
        setPrimaryValue('All')
        setSecondaryValue('All')
    }
    const renderFilter = (filter, value, onChange, options) => filter ? (
        <label className='grid gap-1 text-sm font-medium text-[var(--erp-ink)]'>
            {filter.label}
            <select value={value} onChange={(event) => onChange(event.target.value)} className={filterClass}>
                <option>All</option>
                {options.map((option) => <option key={option}>{option}</option>)}
            </select>
        </label>
    ) : null

    return (
        <section className='space-y-5'>
            <div className='rounded-2xl bg-white p-4 shadow-md sm:p-5'>
                <h2 className='text-xl font-semibold text-[var(--erp-ink)]'>{title}</h2>
                <p className='mt-1 max-w-3xl text-sm text-[var(--erp-slate)]'>{description}</p>
                <IntegrationNotice state={integrationState} className='mt-4' title={integrationTitle} description={integrationDescription} />
            </div>
            <div className='overflow-hidden rounded-2xl bg-white shadow-md'>
                <DataToolbar
                    query={query}
                    onQueryChange={setQuery}
                    searchLabel={`Search ${title.toLowerCase()}`}
                    searchPlaceholder={searchPlaceholder}
                    resultCount={visibleRows.length}
                    onReset={hasActiveFilters ? resetFilters : undefined}
                    filters={(
                        <>
                            {renderFilter(primaryFilter, primaryValue, setPrimaryValue, primaryOptions)}
                            {renderFilter(secondaryFilter, secondaryValue, setSecondaryValue, secondaryOptions)}
                        </>
                    )}
                    actions={(
                        <>
                            {createPath && <Link to={createPath} className='inline-flex min-h-10 items-center gap-2 rounded-lg bg-[var(--erp-indigo)] px-4 text-sm font-semibold text-white'><Plus aria-hidden='true' size={16} /> {createLabel}</Link>}
                            <button type='button' disabled title='Export unavailable — reporting service is not connected.' className='inline-flex min-h-10 cursor-not-allowed items-center gap-2 rounded-lg border border-[var(--erp-line-strong)] px-4 text-sm font-semibold text-[var(--erp-muted)] opacity-70'><Download aria-hidden='true' size={16} /> Export unavailable</button>
                        </>
                    )}
                />
                <DataTable
                    caption={caption}
                    rows={visibleRows}
                    columns={columns}
                    rowKey={rowKey}
                    emptyTitle={`No ${title.toLowerCase()} match`}
                    emptyDescription='Reset the filters or wait for the connected service to publish a matching record.'
                    renderActions={viewPath ? (row) => <Link to={viewPath(row)} className='inline-flex min-h-9 items-center rounded-lg border border-[var(--erp-line-strong)] px-3 text-xs font-semibold text-[var(--erp-indigo)]'>View details</Link> : undefined}
                />
            </div>
            <p className='px-1 text-xs text-[var(--erp-muted)]'>Showing {visibleRows.length} of {rows.length} frontend reference records. {footerDescription}</p>
        </section>
    )
}

export default OperationsRecordRegister
