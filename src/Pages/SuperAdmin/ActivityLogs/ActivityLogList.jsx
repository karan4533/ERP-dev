import { useEffect, useMemo, useState } from 'react'
import { ArrowUpRight, Download, RefreshCw } from 'lucide-react'
import { NavLink, useSearchParams } from 'react-router-dom'
import {
    DataTable,
    DataToolbar,
    FeedbackState,
    IntegrationNotice,
    PageHeader,
    Pagination,
    StatusBadge,
} from '../../../Common/ui'
import { paginateRows, parseTableState, serializeTableState } from '../../../Common/ui/dataTableState'
import {
    LOG_TYPES,
    ROUTE_BASE,
    filterActivityLogs,
    getCellValue,
    getListColumns,
    getLogStatusOptions,
    getLogSummary,
    getLogsByType,
} from './activityLogsData'

const ActivityLogList = ({ logType }) => {
    const config = LOG_TYPES[logType]
    const [urlParams, setUrlParams] = useSearchParams()
    const initialTableState = parseTableState(urlParams)
    const [records, setRecords] = useState(() => getLogsByType(logType))
    const [search, setSearch] = useState(initialTableState.query)
    const [status, setStatus] = useState(initialTableState.filters.status || '')
    const [fromDate, setFromDate] = useState(initialTableState.filters.fromDate || '')
    const [toDate, setToDate] = useState(initialTableState.filters.toDate || '')
    const [page, setPage] = useState(initialTableState.page)
    const [pageSize, setPageSize] = useState(urlParams.has('pageSize') ? initialTableState.pageSize : 5)

    const listColumns = useMemo(() => getListColumns(logType), [logType])
    const statusOptions = useMemo(() => getLogStatusOptions(records), [records])
    const filteredRecords = useMemo(
        () => filterActivityLogs(records, { search, status, fromDate, toDate }),
        [fromDate, records, search, status, toDate],
    )
    const summaryCards = useMemo(() => getLogSummary(logType, records), [logType, records])
    const pagination = paginateRows(filteredRecords, { page, pageSize })

    useEffect(() => {
        setUrlParams(serializeTableState({
            query: search,
            page: pagination.page,
            pageSize,
            filters: { status, fromDate, toDate },
        }), { replace: true })
    }, [fromDate, pageSize, pagination.page, search, setUrlParams, status, toDate])

    if (!config) {
        return <FeedbackState kind='error' title='Unknown activity log' description='The requested audit-log category is not configured.' />
    }

    const columns = listColumns.map((column) => ({
        ...column,
        required: column === listColumns[0],
        render: (record) => {
            const value = getCellValue(record, column)
            return column.badge ? <StatusBadge status={value} /> : value
        },
    }))

    const resetFilters = () => {
        setSearch('')
        setStatus('')
        setFromDate('')
        setToDate('')
        setPage(1)
    }

    return (
        <section className='space-y-5'>
            <PageHeader
                title={config.listTitle}
                description={`Review ${config.label.toLowerCase()} with actor, timestamp, device and record context for governance follow-up.`}
                context={`${records.length} browser-stored records · ${filteredRecords.length} matching`}
            />

            <IntegrationNotice
                state='demo'
                title='Demonstration audit evidence'
                description='These records are local sample data. Production logs must be generated server-side, append-only, access-controlled and retained according to policy; client-side data is not admissible audit evidence.'
            />

            <div className='grid grid-cols-2 gap-3 lg:grid-cols-4'>
                {summaryCards.map((card) => (
                    <article key={card.label} className='rounded-xl border border-[var(--erp-line)] bg-white p-4'>
                        <p className='text-xs font-medium uppercase tracking-wide text-[var(--erp-muted)]'>{card.label}</p>
                        <p className='mt-2 text-2xl font-semibold text-[var(--erp-ink)]'>{card.value}</p>
                    </article>
                ))}
            </div>

            <div className='overflow-hidden rounded-[var(--erp-radius-surface)] border border-[var(--erp-line)] bg-white'>
                <DataToolbar
                    query={search}
                    onQueryChange={(value) => { setSearch(value); setPage(1) }}
                    searchPlaceholder={config.searchPlaceholder}
                    resultCount={filteredRecords.length}
                    onReset={resetFilters}
                    filters={(
                        <>
                            {statusOptions.length > 0 && (
                                <label className='grid gap-1 text-xs font-medium text-[var(--erp-slate)]'>Status
                                    <select value={status} onChange={(event) => { setStatus(event.target.value); setPage(1) }} className='min-h-10 rounded-lg border border-[var(--erp-line-strong)] bg-white px-3 text-sm'>
                                        <option value=''>All statuses</option>
                                        {statusOptions.map((item) => <option key={item} value={item}>{item}</option>)}
                                    </select>
                                </label>
                            )}
                            <label className='grid gap-1 text-xs font-medium text-[var(--erp-slate)]'>From
                                <input type='date' value={fromDate} max={toDate || undefined} onChange={(event) => { setFromDate(event.target.value); setPage(1) }} className='min-h-10 rounded-lg border border-[var(--erp-line-strong)] bg-white px-3 text-sm' />
                            </label>
                            <label className='grid gap-1 text-xs font-medium text-[var(--erp-slate)]'>To
                                <input type='date' value={toDate} min={fromDate || undefined} onChange={(event) => { setToDate(event.target.value); setPage(1) }} className='min-h-10 rounded-lg border border-[var(--erp-line-strong)] bg-white px-3 text-sm' />
                            </label>
                        </>
                    )}
                    actions={(
                        <>
                            <button type='button' onClick={() => setRecords(getLogsByType(logType))} className='inline-flex min-h-10 items-center gap-2 rounded-lg border border-[var(--erp-line-strong)] px-4 text-sm font-semibold text-[var(--erp-ink)]'>
                                <RefreshCw aria-hidden='true' size={16} /> Refresh
                            </button>
                            <button type='button' disabled title='Secure export service is not connected' className='inline-flex min-h-10 items-center gap-2 rounded-lg border border-[var(--erp-line-strong)] px-4 text-sm font-semibold text-[var(--erp-muted)] opacity-65'>
                                <Download aria-hidden='true' size={16} /> Export unavailable
                            </button>
                        </>
                    )}
                />
                <DataTable
                    caption={config.listTitle}
                    rows={pagination.rows}
                    columns={columns}
                    rowKey='id'
                    emptyTitle='No audit records found'
                    emptyDescription='No records match the selected query, status and date range.'
                    renderActions={(record) => (
                        <NavLink to={`${ROUTE_BASE}/view/${record.id}`} className='inline-flex min-h-9 items-center gap-1 rounded-lg border border-[var(--erp-line-strong)] px-3 text-xs font-semibold text-[var(--erp-ink)]'>
                            Inspect <ArrowUpRight aria-hidden='true' size={14} />
                        </NavLink>
                    )}
                />
                <Pagination {...pagination} pageSizeOptions={[5, 10, 25]} onPageChange={setPage} onPageSizeChange={(value) => { setPageSize(value); setPage(1) }} />
            </div>
        </section>
    )
}

export default ActivityLogList
