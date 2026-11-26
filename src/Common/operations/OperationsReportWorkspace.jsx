import { useMemo, useState } from 'react'
import { Download } from 'lucide-react'
import { DataTable, DataToolbar, IntegrationNotice } from '../ui'
import { filterOperationsReportRows } from './operationsReportState'

const dateInputClass = 'min-h-10 rounded-lg border border-[var(--erp-line-strong)] bg-white px-3 text-sm text-[var(--erp-ink)]'

const OperationsReportWorkspace = ({
    title,
    description,
    integrationTitle = 'Reporting service not connected',
    integrationDescription,
    reportTypes = [],
    definitions = {},
}) => {
    const [activeReport, setActiveReport] = useState(reportTypes[0] || '')
    const [query, setQuery] = useState('')
    const [fromDate, setFromDate] = useState('')
    const [toDate, setToDate] = useState('')
    const report = definitions[activeReport]
    const visibleRows = useMemo(() => report ? filterOperationsReportRows(report.rows, {
        query,
        dateKey: report.dateKey,
        fromDate,
        toDate,
    }) : [], [fromDate, query, report, toDate])
    const resetFilters = () => {
        setQuery('')
        setFromDate('')
        setToDate('')
    }
    const selectReport = (reportType) => {
        setActiveReport(reportType)
        resetFilters()
    }

    return (
        <section className='space-y-5'>
            <div className='rounded-2xl bg-white p-4 shadow-md sm:p-5'>
                <h2 className='text-xl font-semibold text-[var(--erp-ink)]'>{title}</h2>
                <p className='mt-1 max-w-3xl text-sm text-[var(--erp-slate)]'>{description}</p>
                <IntegrationNotice state='demo' className='mt-4' title={integrationTitle} description={integrationDescription} />
            </div>
            <div className='rounded-2xl bg-white p-4 shadow-md'>
                <h3 className='text-sm font-semibold text-[var(--erp-ink)]'>Report dataset</h3>
                <div className='mt-3 flex flex-wrap gap-2' role='tablist' aria-label={`${title} datasets`}>
                    {reportTypes.map((reportType) => (
                        <button
                            key={reportType}
                            type='button'
                            role='tab'
                            aria-selected={activeReport === reportType}
                            onClick={() => selectReport(reportType)}
                            className={`min-h-10 rounded-lg border px-3 text-sm font-semibold ${activeReport === reportType ? 'border-[var(--erp-indigo)] bg-[var(--erp-indigo)] text-white' : 'border-[var(--erp-line-strong)] text-[var(--erp-slate)] hover:border-[var(--erp-indigo)] hover:text-[var(--erp-indigo)]'}`}
                        >
                            {reportType}
                        </button>
                    ))}
                </div>
            </div>
            {report ? (
                <div className='overflow-hidden rounded-2xl bg-white shadow-md'>
                    <DataToolbar
                        query={query}
                        onQueryChange={setQuery}
                        searchLabel={`Search ${activeReport.toLowerCase()}`}
                        searchPlaceholder={report.searchPlaceholder || 'Search report records…'}
                        resultCount={visibleRows.length}
                        onReset={query || fromDate || toDate ? resetFilters : undefined}
                        filters={report.dateKey ? (
                            <>
                                <label className='grid gap-1 text-sm font-medium text-[var(--erp-ink)]'>From date<input type='date' value={fromDate} onChange={(event) => setFromDate(event.target.value)} className={dateInputClass} /></label>
                                <label className='grid gap-1 text-sm font-medium text-[var(--erp-ink)]'>To date<input type='date' value={toDate} onChange={(event) => setToDate(event.target.value)} className={dateInputClass} /></label>
                            </>
                        ) : undefined}
                        actions={<button type='button' disabled title='Export requires the reporting service.' className='inline-flex min-h-10 cursor-not-allowed items-center gap-2 rounded-lg border border-[var(--erp-line-strong)] px-4 text-sm font-semibold text-[var(--erp-muted)] opacity-70'><Download aria-hidden='true' size={16} /> Export unavailable</button>}
                    />
                    <DataTable
                        caption={activeReport}
                        rows={visibleRows}
                        columns={report.columns}
                        rowKey={report.rowKey}
                        emptyTitle='No report rows match'
                        emptyDescription='Reset the available filters to review the complete reference dataset.'
                    />
                </div>
            ) : (
                <IntegrationNotice state='disconnected' title='Report dataset unavailable' description='Define the data contract, dimensions, measures and access policy before exposing this report.' />
            )}
        </section>
    )
}

export default OperationsReportWorkspace
