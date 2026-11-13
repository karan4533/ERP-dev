import { useMemo, useState } from 'react'
import { Plus } from 'lucide-react'
import { DataTable, DataToolbar, IntegrationNotice, StatusBadge } from '../../../../Common/ui'
import { FLEET_SUMMARY, FLEET_VEHICLES } from '../transportFinanceData'
import { StaffAvatar, SummaryCards } from './TransportShared'

const TYPE_FILTERS = ['All types', 'Bus', 'Van']
const STATUS_FILTERS = ['All statuses', 'Active', 'In Service', 'Idle']

const FleetServiceTab = ({ fleetVehicles = FLEET_VEHICLES, onAddVehicle }) => {
    const [query, setQuery] = useState('')
    const [type, setType] = useState(TYPE_FILTERS[0])
    const [status, setStatus] = useState(STATUS_FILTERS[0])
    const rows = useMemo(() => fleetVehicles.filter((row) => {
        if (type !== TYPE_FILTERS[0] && row.type !== type) return false
        if (status !== STATUS_FILTERS[0] && row.status !== status) return false
        const normalizedQuery = query.trim().toLowerCase()
        if (!normalizedQuery) return true
        return [row.regNo, row.type, row.route, row.driver, row.status].join(' ').toLowerCase().includes(normalizedQuery)
    }), [fleetVehicles, query, status, type])
    const columns = [
        { key: 'regNo', label: 'Registration', required: true, render: (row) => <span className='font-mono text-xs font-semibold'>{row.regNo}</span> },
        { key: 'type', label: 'Type' },
        { key: 'route', label: 'Route', required: true },
        { key: 'driver', label: 'Driver', render: (row) => <StaffAvatar initials={row.driverInitials} name={row.driver} /> },
        { key: 'lastService', label: 'Last service' },
        { key: 'nextServiceDue', label: 'Next service due' },
        { key: 'odometer', label: 'Odometer' },
        { key: 'status', label: 'Status', render: (row) => <StatusBadge status={row.status} /> },
    ]

    return (
        <div className='space-y-5'>
            <IntegrationNotice state='demo' title='Sample fleet with session-only additions' description='Seed vehicles are reference data. Vehicles added here remain only until this page reloads and do not update route allocation, compliance or asset accounting.' />
            <SummaryCards cards={FLEET_SUMMARY} />
            <section className='overflow-hidden rounded-[var(--erp-radius-surface)] border border-[var(--erp-line)] bg-white' aria-labelledby='fleet-register-title'>
                <div className='flex flex-wrap items-start justify-between gap-3 px-4 pt-4 sm:px-5'>
                    <div><h3 id='fleet-register-title' className='text-base font-semibold text-[var(--erp-ink)]'>Vehicle fleet register</h3><p className='mt-1 text-sm text-[var(--erp-slate)]'>Search route assignments, service dates and operational state.</p></div>
                    <button type='button' onClick={onAddVehicle} className='inline-flex min-h-10 items-center gap-2 rounded-lg bg-[var(--erp-indigo)] px-4 text-sm font-semibold text-white'><Plus aria-hidden='true' size={16} /> Add local vehicle</button>
                </div>
                <DataToolbar query={query} onQueryChange={setQuery} searchLabel='Search fleet' searchPlaceholder='Registration, route or driver…' resultCount={rows.length} onReset={() => { setQuery(''); setType(TYPE_FILTERS[0]); setStatus(STATUS_FILTERS[0]) }} filters={(
                    <>
                        <label className='grid gap-1 text-xs font-semibold text-[var(--erp-slate)]'>Type<select value={type} onChange={(event) => setType(event.target.value)} className='min-h-10 rounded-lg border border-[var(--erp-line-strong)] bg-white px-3 text-sm'>{TYPE_FILTERS.map((item) => <option key={item}>{item}</option>)}</select></label>
                        <label className='grid gap-1 text-xs font-semibold text-[var(--erp-slate)]'>Status<select value={status} onChange={(event) => setStatus(event.target.value)} className='min-h-10 rounded-lg border border-[var(--erp-line-strong)] bg-white px-3 text-sm'>{STATUS_FILTERS.map((item) => <option key={item}>{item}</option>)}</select></label>
                    </>
                )} />
                <DataTable caption='Vehicle fleet register' rows={rows} columns={columns} rowKey='id' emptyTitle='No vehicles found' emptyDescription='Reset the filters to review the available fleet records.' renderActions={() => <button type='button' disabled title='Vehicle detail requires the connected transport API.' className='min-h-9 rounded-md border border-[var(--erp-line-strong)] px-3 text-sm font-semibold text-[var(--erp-muted)] opacity-60'>Details unavailable</button>} />
            </section>
        </div>
    )
}

export default FleetServiceTab
