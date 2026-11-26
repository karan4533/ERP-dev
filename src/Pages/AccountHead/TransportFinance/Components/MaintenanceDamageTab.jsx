import { useMemo, useState } from 'react'
import { Plus } from 'lucide-react'
import { DataTable, DataToolbar, IntegrationNotice, StatusBadge } from '../../../../Common/ui'
import {
    DAMAGE_BREAKDOWN,
    MAINTENANCE_RECORDS,
    MAINTENANCE_SPEND,
    MAINTENANCE_SUMMARY,
} from '../transportFinanceData'
import { Panel, SummaryCards } from './TransportShared'

const TYPE_FILTERS = ['All types', 'Routine', 'Repair', 'Damage', 'Interior']
const STATUS_FILTERS = ['All statuses', 'Completed', 'In Progress', 'Pending Approval']

const MaintenanceDamageTab = ({ maintenanceRecords = MAINTENANCE_RECORDS, onLogDamage }) => {
    const [query, setQuery] = useState('')
    const [type, setType] = useState(TYPE_FILTERS[0])
    const [status, setStatus] = useState(STATUS_FILTERS[0])
    const rows = useMemo(() => maintenanceRecords.filter((row) => {
        if (type !== TYPE_FILTERS[0] && row.type !== type) return false
        if (status !== STATUS_FILTERS[0] && row.status !== status) return false
        const normalizedQuery = query.trim().toLowerCase()
        if (!normalizedQuery) return true
        return [row.vehicle, row.description, row.vendor, row.cost, row.status].join(' ').toLowerCase().includes(normalizedQuery)
    }), [maintenanceRecords, query, status, type])
    const columns = [
        { key: 'vehicle', label: 'Vehicle', required: true, render: (row) => <span className='font-mono text-xs font-semibold'>{row.vehicle}</span> },
        { key: 'date', label: 'Date' },
        { key: 'description', label: 'Description', required: true },
        { key: 'type', label: 'Type' },
        { key: 'vendor', label: 'Vendor / garage' },
        { key: 'cost', label: 'Cost', render: (row) => <span className='font-semibold text-[var(--erp-ink)]'>{row.cost}</span> },
        { key: 'status', label: 'Status', render: (row) => <StatusBadge status={row.status} /> },
    ]

    return (
        <div className='space-y-5'>
            <IntegrationNotice state='demo' title='Sample maintenance evidence' description='Charts and seed records are reference data. New records are session-only drafts and do not post expenses, upload evidence or enter an approval queue.' />
            <SummaryCards cards={MAINTENANCE_SUMMARY} />
            <div className='grid grid-cols-1 gap-5 lg:grid-cols-2'>
                <Panel title='Maintenance spend by vehicle' action={<button type='button' disabled title='Full reporting requires the transport reporting API.' className='text-sm font-semibold text-[var(--erp-muted)] opacity-60'>Report unavailable</button>}>
                    <div className='space-y-4'>{MAINTENANCE_SPEND.map((item) => <div key={item.vehicle}><div className='mb-1.5 flex items-center justify-between text-sm'><span className='text-[var(--erp-slate)]'>{item.vehicle}</span><span className='font-semibold text-[var(--erp-ink)]'>{item.amount}</span></div><div className='h-2 overflow-hidden rounded-full bg-[var(--erp-line)]'><div className={`h-full rounded-full ${item.warn ? 'bg-[var(--erp-red)]' : 'bg-[var(--erp-indigo)]'}`} style={{ width: `${item.value}%` }} /></div></div>)}</div>
                </Panel>
                <Panel title='Damage report breakdown'>
                    <div className='space-y-3'>{DAMAGE_BREAKDOWN.map((item) => <div key={item.label} className='flex items-center justify-between gap-3 text-sm'><span className='text-[var(--erp-slate)]'>{item.label}</span><span className='font-semibold text-[var(--erp-ink)]'>{item.amount} <span className='font-normal text-[var(--erp-muted)]'>({item.cases} cases)</span></span></div>)}</div>
                </Panel>
            </div>
            <section className='overflow-hidden rounded-[var(--erp-radius-surface)] border border-[var(--erp-line)] bg-white' aria-labelledby='maintenance-register-title'>
                <div className='flex flex-wrap items-start justify-between gap-3 px-4 pt-4 sm:px-5'><div><h3 id='maintenance-register-title' className='text-base font-semibold text-[var(--erp-ink)]'>Maintenance & damage register</h3><p className='mt-1 text-sm text-[var(--erp-slate)]'>Review service evidence and approval state.</p></div><button type='button' onClick={onLogDamage} className='inline-flex min-h-10 items-center gap-2 rounded-lg bg-[var(--erp-indigo)] px-4 text-sm font-semibold text-white'><Plus aria-hidden='true' size={16} /> Add local record</button></div>
                <DataToolbar query={query} onQueryChange={setQuery} searchLabel='Search maintenance records' searchPlaceholder='Vehicle, vendor or description…' resultCount={rows.length} onReset={() => { setQuery(''); setType(TYPE_FILTERS[0]); setStatus(STATUS_FILTERS[0]) }} filters={<><label className='grid gap-1 text-xs font-semibold text-[var(--erp-slate)]'>Type<select value={type} onChange={(event) => setType(event.target.value)} className='min-h-10 rounded-lg border border-[var(--erp-line-strong)] bg-white px-3 text-sm'>{TYPE_FILTERS.map((item) => <option key={item}>{item}</option>)}</select></label><label className='grid gap-1 text-xs font-semibold text-[var(--erp-slate)]'>Status<select value={status} onChange={(event) => setStatus(event.target.value)} className='min-h-10 rounded-lg border border-[var(--erp-line-strong)] bg-white px-3 text-sm'>{STATUS_FILTERS.map((item) => <option key={item}>{item}</option>)}</select></label></>} />
                <DataTable caption='Maintenance and damage register' rows={rows} columns={columns} rowKey='id' emptyTitle='No maintenance records found' emptyDescription='Reset the filters to review available records.' renderActions={() => <button type='button' disabled title='Record detail and approval require the connected transport API.' className='min-h-9 rounded-md border border-[var(--erp-line-strong)] px-3 text-sm font-semibold text-[var(--erp-muted)] opacity-60'>Review unavailable</button>} />
            </section>
        </div>
    )
}

export default MaintenanceDamageTab
