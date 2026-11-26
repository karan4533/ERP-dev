import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Download, Plus } from 'lucide-react'
import { ConfirmAction, DataTable, DataToolbar, Dialog, IntegrationNotice, StatusBadge } from '../ui'
import { getIncidents, updateIncident } from '../demoDomain/securityIncidents'
import { deriveIncidentSla, getNextIncidentStatus } from './incidentState'

const priorityRank = { Critical: 0, High: 1, Medium: 2, Low: 3 }
const filterClass = 'min-h-10 rounded-lg border border-[var(--erp-line-strong)] bg-white px-3 text-sm text-[var(--erp-ink)]'

const formatTimestamp = (value) => {
    const date = new Date(value)
    return Number.isNaN(date.getTime()) ? 'Timestamp unavailable' : date.toLocaleString('en-IN')
}

const SecurityIncidentRegister = ({ managerMode = false, actor, createPath = '', viewPath }) => {
    const [rows, setRows] = useState(() => getIncidents())
    const [query, setQuery] = useState('')
    const [priorityFilter, setPriorityFilter] = useState('All')
    const [statusFilter, setStatusFilter] = useState('All')
    const [timeline, setTimeline] = useState(null)
    const [pendingAdvance, setPendingAdvance] = useState(null)

    const visibleRows = useMemo(() => {
        const normalizedQuery = query.trim().toLowerCase()
        return rows
            .map((incident) => ({ ...incident, slaState: deriveIncidentSla(incident) }))
            .filter((incident) => {
                const searchable = Object.values(incident).filter((value) => typeof value !== 'object').join(' ').toLowerCase()
                return (!normalizedQuery || searchable.includes(normalizedQuery))
                    && (priorityFilter === 'All' || incident.priority === priorityFilter)
                    && (statusFilter === 'All' || incident.status === statusFilter)
            })
            .sort((left, right) => {
                const leftBreach = left.slaState === 'Breached' ? 0 : 1
                const rightBreach = right.slaState === 'Breached' ? 0 : 1
                return leftBreach - rightBreach || (priorityRank[left.priority] ?? 9) - (priorityRank[right.priority] ?? 9)
            })
    }, [priorityFilter, query, rows, statusFilter])
    const priorities = [...new Set(rows.map((incident) => incident.priority).filter(Boolean))]
    const statuses = [...new Set(rows.map((incident) => incident.status).filter(Boolean))]
    const resetFilters = () => {
        setQuery('')
        setPriorityFilter('All')
        setStatusFilter('All')
    }
    const refresh = () => setRows(getIncidents())
    const commitAdvance = () => {
        if (!pendingAdvance) return
        const nextStatus = getNextIncidentStatus(pendingAdvance.status)
        updateIncident(
            pendingAdvance.id,
            { status: nextStatus, assignedTo: pendingAdvance.assignedTo || actor },
            actor,
            `${pendingAdvance.status} → ${nextStatus}`,
        )
        refresh()
        setPendingAdvance(null)
    }
    const columns = [
        { key: 'id', label: 'Incident', required: true },
        {
            key: 'incidentType',
            label: 'Incident',
            required: true,
            render: (incident) => (
                <div>
                    <p className='font-semibold text-[var(--erp-ink)]'>{incident.incidentType}</p>
                    <p className='mt-0.5 max-w-sm text-xs text-[var(--erp-muted)]'>{incident.description}</p>
                </div>
            ),
        },
        { key: 'occurred', label: 'Occurred', render: (incident) => `${incident.date} · ${incident.time}` },
        { key: 'location', label: 'Location' },
        { key: 'reportedBy', label: 'Reported by' },
        { key: 'assignedTo', label: 'Assigned to', required: true },
        { key: 'priority', label: 'Priority', required: true, render: (incident) => <StatusBadge status={incident.priority} /> },
        { key: 'slaState', label: 'SLA', required: true, render: (incident) => <StatusBadge status={incident.slaState} /> },
        { key: 'dueAt', label: 'SLA target', render: (incident) => formatTimestamp(incident.dueAt) },
        { key: 'status', label: 'Status', required: true, render: (incident) => <StatusBadge status={incident.status} /> },
    ]

    return (
        <section className='space-y-5'>
            <div className='rounded-2xl bg-white p-4 shadow-md sm:p-5'>
                <h2 className='text-xl font-semibold text-[var(--erp-ink)]'>{managerMode ? 'Incident command queue' : 'Security incident register'}</h2>
                <p className='mt-1 text-sm text-[var(--erp-slate)]'>{managerMode ? 'Review breached and high-priority incidents first, confirm ownership, and record each response stage.' : 'Report and track gate, visitor, material and campus-security incidents through the shared manager queue.'}</p>
                <IntegrationNotice
                    state='demo'
                    className='mt-4'
                    title='Incident workflow is browser-stored'
                    description='Production must enforce role-based assignment, server timestamps, notification delivery, escalation policy, evidence retention and an append-only safety audit log.'
                />
            </div>
            <div className='overflow-hidden rounded-2xl bg-white shadow-md'>
                <DataToolbar
                    query={query}
                    onQueryChange={setQuery}
                    searchLabel='Search security incidents'
                    searchPlaceholder='Search incident, place, reporter or assignee…'
                    resultCount={visibleRows.length}
                    onReset={query || priorityFilter !== 'All' || statusFilter !== 'All' ? resetFilters : undefined}
                    filters={(
                        <>
                            <label className='grid gap-1 text-sm font-medium text-[var(--erp-ink)]'>Priority
                                <select value={priorityFilter} onChange={(event) => setPriorityFilter(event.target.value)} className={filterClass}><option>All</option>{priorities.map((priority) => <option key={priority}>{priority}</option>)}</select>
                            </label>
                            <label className='grid gap-1 text-sm font-medium text-[var(--erp-ink)]'>Status
                                <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className={filterClass}><option>All</option>{statuses.map((status) => <option key={status}>{status}</option>)}</select>
                            </label>
                        </>
                    )}
                    actions={(
                        <>
                            {createPath && <Link to={createPath} className='inline-flex min-h-10 items-center gap-2 rounded-lg bg-[var(--erp-indigo)] px-4 text-sm font-semibold text-white'><Plus aria-hidden='true' size={16} /> Report incident</Link>}
                            <button type='button' disabled title='Export requires the incident reporting API.' className='inline-flex min-h-10 cursor-not-allowed items-center gap-2 rounded-lg border border-[var(--erp-line-strong)] px-4 text-sm font-semibold text-[var(--erp-muted)] opacity-70'><Download aria-hidden='true' size={16} /> Export</button>
                        </>
                    )}
                />
                <DataTable
                    caption='Security incident response register'
                    rows={visibleRows}
                    columns={columns}
                    rowKey='id'
                    emptyTitle='No incidents match'
                    emptyDescription='Reset the filters or report a new incident if you have permission.'
                    renderActions={(incident) => (
                        <>
                            {viewPath && <Link to={viewPath(incident)} className='inline-flex min-h-9 items-center rounded-lg border border-[var(--erp-line-strong)] px-3 text-xs font-semibold text-[var(--erp-indigo)]'>View</Link>}
                            <button type='button' onClick={() => setTimeline(incident)} className='min-h-9 rounded-lg border border-[var(--erp-line-strong)] px-3 text-xs font-semibold text-[var(--erp-ink)]'>Timeline</button>
                            {managerMode && incident.status !== 'Resolved' && <button type='button' onClick={() => setPendingAdvance(incident)} className='min-h-9 rounded-lg bg-[var(--erp-indigo)] px-3 text-xs font-semibold text-white'>Advance</button>}
                        </>
                    )}
                />
            </div>
            <Dialog open={Boolean(timeline)} onClose={() => setTimeline(null)} title='Incident timeline' description={timeline ? `${timeline.id} · ${timeline.incidentType}` : undefined} size='md'>
                <ol className='space-y-4'>
                    {(timeline?.history || []).map((entry, index) => (
                        <li key={`${entry.at}-${index}`} className='border-l-2 border-[var(--erp-line-strong)] pl-4'>
                            <div className='flex flex-wrap items-center gap-2'><StatusBadge status={entry.status} /><span className='text-xs text-[var(--erp-muted)]'>{formatTimestamp(entry.at)}</span></div>
                            <p className='mt-2 text-sm font-medium text-[var(--erp-ink)]'>{entry.note}</p>
                            <p className='mt-0.5 text-xs text-[var(--erp-slate)]'>Actor: {entry.actor}</p>
                        </li>
                    ))}
                </ol>
            </Dialog>
            <ConfirmAction open={Boolean(pendingAdvance)} onClose={() => setPendingAdvance(null)} onConfirm={commitAdvance} title='Advance incident response?' description='Confirm the next governed response stage.' confirmLabel='Confirm advancement'>
                {pendingAdvance && <div className='space-y-2'><p><strong>{pendingAdvance.id}</strong> · {pendingAdvance.incidentType}</p><p>{pendingAdvance.status} → <strong>{getNextIncidentStatus(pendingAdvance.status)}</strong></p><p>Assigned to {pendingAdvance.assignedTo || actor}. The production API must re-check incident state and manager authority before accepting this decision.</p></div>}
            </ConfirmAction>
        </section>
    )
}

export default SecurityIncidentRegister
