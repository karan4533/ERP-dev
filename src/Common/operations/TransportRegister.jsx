import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Download, Plus } from 'lucide-react'
import { DataTable, DataToolbar, IntegrationNotice } from '../ui'

const filterClass = 'min-h-10 rounded-lg border border-[var(--erp-line-strong)] bg-white px-3 text-sm text-[var(--erp-ink)]'

const TransportRegister = ({
    records = [],
    columns = [],
    caption,
    title,
    description,
    rowKey = 'id',
    secondaryFilterKey,
    secondaryFilterLabel,
    createPath,
    createLabel,
    getRowActions,
}) => {
    const [query, setQuery] = useState('')
    const [stateFilter, setStateFilter] = useState('All')
    const [secondaryFilter, setSecondaryFilter] = useState('All')
    const states = useMemo(() => [...new Set(records.map((record) => record.operationalState).filter(Boolean))], [records])
    const secondaryOptions = useMemo(
        () => secondaryFilterKey ? [...new Set(records.map((record) => record[secondaryFilterKey]).filter(Boolean))] : [],
        [records, secondaryFilterKey],
    )
    const visibleRecords = useMemo(() => {
        const normalizedQuery = query.trim().toLowerCase()
        return records.filter((record) => {
            const searchable = Object.values(record).filter((value) => typeof value !== 'object').join(' ').toLowerCase()
            return (!normalizedQuery || searchable.includes(normalizedQuery))
                && (stateFilter === 'All' || record.operationalState === stateFilter)
                && (secondaryFilter === 'All' || record[secondaryFilterKey] === secondaryFilter)
        })
    }, [query, records, secondaryFilter, secondaryFilterKey, stateFilter])
    const hasFilters = Boolean(query) || stateFilter !== 'All' || secondaryFilter !== 'All'
    const resetFilters = () => {
        setQuery('')
        setStateFilter('All')
        setSecondaryFilter('All')
    }

    return (
        <section className='space-y-5'>
            <div className='rounded-2xl bg-white p-4 shadow-md sm:p-5'>
                <h2 className='text-xl font-semibold text-[var(--erp-ink)]'>{title}</h2>
                <p className='mt-1 text-sm text-[var(--erp-slate)]'>{description}</p>
                <ol className='mt-4 grid grid-cols-2 gap-2 text-xs font-semibold text-[var(--erp-slate)] sm:grid-cols-4' aria-label='Transport operational hierarchy'>
                    {['Vehicle readiness', 'Route readiness', 'Duty schedule', 'Live trip'].map((step, index) => (
                        <li key={step} className='rounded-lg border border-[var(--erp-line)] bg-[var(--erp-canvas)] px-3 py-2'>{index + 1}. {step}</li>
                    ))}
                </ol>
                <IntegrationNotice
                    state='disconnected'
                    className='mt-4'
                    title='Live trip and GPS service not connected'
                    description='Readiness here is derived from frontend reference records. The production API must publish real dispatch, departure, delay, passenger, location, incident and arrival events.'
                />
            </div>

            <div className='overflow-hidden rounded-2xl bg-white shadow-md'>
                <DataToolbar
                    query={query}
                    onQueryChange={setQuery}
                    searchLabel={`Search ${title}`}
                    searchPlaceholder='Search IDs, people, vehicle or route…'
                    resultCount={visibleRecords.length}
                    onReset={hasFilters ? resetFilters : undefined}
                    filters={(
                        <>
                            <label className='grid gap-1 text-sm font-medium text-[var(--erp-ink)]'>Operational state
                                <select value={stateFilter} onChange={(event) => setStateFilter(event.target.value)} className={filterClass}>
                                    <option>All</option>
                                    {states.map((state) => <option key={state}>{state}</option>)}
                                </select>
                            </label>
                            {secondaryFilterKey && (
                                <label className='grid gap-1 text-sm font-medium text-[var(--erp-ink)]'>{secondaryFilterLabel}
                                    <select value={secondaryFilter} onChange={(event) => setSecondaryFilter(event.target.value)} className={filterClass}>
                                        <option>All</option>
                                        {secondaryOptions.map((option) => <option key={option}>{option}</option>)}
                                    </select>
                                </label>
                            )}
                        </>
                    )}
                    actions={(
                        <>
                            <Link to={createPath} className='inline-flex min-h-10 items-center gap-2 rounded-lg bg-[var(--erp-indigo)] px-4 text-sm font-semibold text-white'><Plus aria-hidden='true' size={16} /> {createLabel}</Link>
                            <button type='button' disabled title='Export requires the transport reporting API.' className='inline-flex min-h-10 cursor-not-allowed items-center gap-2 rounded-lg border border-[var(--erp-line-strong)] px-4 text-sm font-semibold text-[var(--erp-muted)] opacity-70'><Download aria-hidden='true' size={16} /> Export</button>
                        </>
                    )}
                />
                <DataTable
                    caption={caption}
                    rows={visibleRecords}
                    columns={columns}
                    rowKey={rowKey}
                    emptyTitle='No transport records match'
                    emptyDescription='Reset the filters or wait for the transport service to publish new operational records.'
                    renderActions={getRowActions ? (record) => getRowActions(record).map((action) => (
                        <Link key={action.label} to={action.to} className='inline-flex min-h-9 items-center rounded-lg border border-[var(--erp-line-strong)] px-3 text-xs font-semibold text-[var(--erp-indigo)]'>{action.label}</Link>
                    )) : undefined}
                />
            </div>
        </section>
    )
}

export default TransportRegister
