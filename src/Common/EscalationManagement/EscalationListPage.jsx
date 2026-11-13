import { useEffect, useMemo, useState } from 'react'
import { ArrowUpRight, Download, Plus } from 'lucide-react'
import { NavLink, useLocation, useSearchParams } from 'react-router-dom'
import DataTable from '../ui/DataTable'
import DataToolbar from '../ui/DataToolbar'
import FeedbackState from '../ui/FeedbackState'
import IntegrationNotice from '../ui/IntegrationNotice'
import PageHeader from '../ui/PageHeader'
import Pagination from '../ui/Pagination'
import StatusBadge from '../ui/StatusBadge'
import { paginateRows, parseTableState, serializeTableState } from '../ui/dataTableState'
import { getWorkflowState } from '../ui/workflow'
import { getRoleConfig } from './escalationRoleConfig'
import {
    ESCALATION_STATUSES,
    getReceivedEscalations,
    getResolveByDate,
    getSentEscalations,
    parseEscalationDate,
} from './escalationData'
import { formatEscalatedToDisplay } from './escalationUsersData'
import { useEscalationContext } from './useEscalationContext'

const EscalationListPage = ({ roleKey }) => {
    const { pathname } = useLocation()
    const effectiveRoleKey = roleKey || (pathname.startsWith('/parent') ? 'parent' : (pathname.startsWith('/student') ? 'student' : null))
    const roleConfig = getRoleConfig(effectiveRoleKey || roleKey)
    const { currentUser } = useEscalationContext(effectiveRoleKey || roleKey)
    const canAdd = Boolean(roleConfig?.escalatesToRoleKey)
    const [urlParams, setUrlParams] = useSearchParams()
    const initialTableState = parseTableState(urlParams)
    const [listView, setListView] = useState(initialTableState.filters.view || (canAdd ? 'sent' : 'received'))
    const [fromDate, setFromDate] = useState(initialTableState.filters.fromDate || '')
    const [toDate, setToDate] = useState(initialTableState.filters.toDate || '')
    const [statusFilter, setStatusFilter] = useState(initialTableState.filters.status || '')
    const [search, setSearch] = useState(initialTableState.query)
    const [page, setPage] = useState(initialTableState.page)
    const [pageSize, setPageSize] = useState(initialTableState.pageSize)

    const sentEscalations = useMemo(
        () => getSentEscalations(effectiveRoleKey || roleKey, currentUser),
        [effectiveRoleKey, roleKey, currentUser],
    )
    const receivedEscalations = useMemo(
        () => getReceivedEscalations(effectiveRoleKey || roleKey, currentUser),
        [effectiveRoleKey, roleKey, currentUser],
    )
    const activeList = listView === 'received' ? receivedEscalations : sentEscalations

    const filtered = useMemo(() => {
        const query = search.trim().toLowerCase()
        const from = fromDate ? new Date(`${fromDate}T00:00:00`) : null
        const to = toDate ? new Date(`${toDate}T23:59:59.999`) : null
        return activeList.filter((item) => {
            if (statusFilter && item.status !== statusFilter) return false
            const itemDate = parseEscalationDate(item.escalationDate)
            if (from && itemDate < from) return false
            if (to && itemDate > to) return false
            if (!query) return true
            return [item.id, item.escalatedBy, item.description, item.escalatedTo, item.escalatedToUserName]
                .some((value) => String(value || '').toLowerCase().includes(query))
        })
    }, [activeList, fromDate, search, statusFilter, toDate])
    const pagination = paginateRows(filtered, { page, pageSize })

    useEffect(() => {
        setUrlParams(serializeTableState({
            query: search,
            page: pagination.page,
            pageSize,
            filters: { view: listView, status: statusFilter, fromDate, toDate },
        }), { replace: true })
    }, [fromDate, listView, pageSize, pagination.page, search, setUrlParams, statusFilter, toDate])

    if (!roleConfig) {
        return <FeedbackState kind='permission' title='Escalations unavailable' description='Escalation routing is not configured for this role.' />
    }

    const switchView = (value) => {
        setListView(value)
        setPage(1)
    }
    const resetFilters = () => {
        setSearch('')
        setStatusFilter('')
        setFromDate('')
        setToDate('')
        setPage(1)
    }

    const columns = [
        { key: 'id', label: 'Escalation ID', required: true, render: (item) => <span className='font-semibold text-[var(--erp-ink)]'>{item.id}</span> },
        { key: 'escalatedBy', label: 'Raised by', render: (item) => <span><span className='block font-medium text-[var(--erp-ink)]'>{item.escalatedBy}</span><span className='text-xs text-[var(--erp-muted)]'>{item.escalatedByRole}</span></span> },
        { key: 'escalatedTo', label: 'Owner', render: formatEscalatedToDisplay },
        { key: 'description', label: 'Issue', render: (item) => <span className='line-clamp-2 max-w-sm'>{item.description}</span> },
        { key: 'escalationDate', label: 'Raised' },
        { key: 'resolveBy', label: 'SLA due', render: (item) => getResolveByDate(item).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) },
        {
            key: 'status',
            label: 'Workflow state',
            render: (item) => {
                const workflow = getWorkflowState(item.status, { dueAt: getResolveByDate(item) })
                return <StatusBadge status={workflow.key} label={workflow.overdue ? `${item.status} · overdue` : item.status} />
            },
        },
    ]

    return (
        <section className='space-y-5'>
            <PageHeader
                title={listView === 'received' ? 'Received Issues & Escalations' : 'Report Issue / Escalation'}
                description={`Routing: ${roleConfig.hierarchyLabel || 'Not configured'}`}
                context={`${activeList.length} total · ${filtered.length} matching`}
                actions={canAdd && listView === 'sent' ? (
                    <NavLink to={`${roleConfig.routeBase}/add-escalation`} className='inline-flex min-h-10 items-center gap-2 rounded-lg bg-[var(--erp-indigo)] px-4 text-sm font-semibold text-white'>
                        <Plus aria-hidden='true' size={16} /> Report Issue / Escalate
                    </NavLink>
                ) : null}
            />

            <IntegrationNotice
                state='demo'
                title='Browser-stored escalation queue'
                description='Ownership and SLA are calculated in the UI. Notification delivery, evidence storage, audit retention and reopen routing require the backend service.'
            />

            <div className='inline-flex rounded-lg border border-[var(--erp-line-strong)] bg-white p-1' role='tablist' aria-label='Escalation queue'>
                {canAdd && <button type='button' role='tab' aria-selected={listView === 'sent'} onClick={() => switchView('sent')} className={`min-h-9 rounded-md px-3 text-sm font-semibold ${listView === 'sent' ? 'bg-[var(--erp-ink)] text-white' : 'text-[var(--erp-slate)]'}`}>Sent ({sentEscalations.length})</button>}
                <button type='button' role='tab' aria-selected={listView === 'received'} onClick={() => switchView('received')} className={`min-h-9 rounded-md px-3 text-sm font-semibold ${listView === 'received' ? 'bg-[var(--erp-ink)] text-white' : 'text-[var(--erp-slate)]'}`}>Received ({receivedEscalations.length})</button>
            </div>

            <div className='overflow-hidden rounded-[var(--erp-radius-surface)] border border-[var(--erp-line)] bg-white'>
                <DataToolbar
                    query={search}
                    onQueryChange={(value) => { setSearch(value); setPage(1) }}
                    searchPlaceholder='Search ID, owner or issue'
                    resultCount={filtered.length}
                    onReset={resetFilters}
                    filters={(
                        <>
                            <label className='grid gap-1 text-xs font-medium text-[var(--erp-slate)]'>Status
                                <select value={statusFilter} onChange={(event) => { setStatusFilter(event.target.value); setPage(1) }} className='min-h-10 rounded-lg border border-[var(--erp-line-strong)] bg-white px-3 text-sm'>
                                    <option value=''>All statuses</option>
                                    {ESCALATION_STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
                                </select>
                            </label>
                            <label className='grid gap-1 text-xs font-medium text-[var(--erp-slate)]'>From date
                                <input type='date' value={fromDate} onChange={(event) => { setFromDate(event.target.value); setPage(1) }} className='min-h-10 rounded-lg border border-[var(--erp-line-strong)] px-3 text-sm' />
                            </label>
                            <label className='grid gap-1 text-xs font-medium text-[var(--erp-slate)]'>To date
                                <input type='date' value={toDate} onChange={(event) => { setToDate(event.target.value); setPage(1) }} className='min-h-10 rounded-lg border border-[var(--erp-line-strong)] px-3 text-sm' />
                            </label>
                        </>
                    )}
                    actions={(
                        <button type='button' disabled title='Export service is not connected' className='inline-flex min-h-10 items-center gap-2 rounded-lg border border-[var(--erp-line-strong)] px-4 text-sm font-semibold text-[var(--erp-muted)] opacity-65'>
                            <Download aria-hidden='true' size={16} /> Export unavailable
                        </button>
                    )}
                />
                <DataTable
                    caption={listView === 'received' ? 'Received escalations' : 'Sent escalations'}
                    rows={pagination.rows}
                    columns={columns}
                    rowKey='id'
                    emptyTitle='No escalations found'
                    emptyDescription='No escalations match this queue and filter combination.'
                    renderActions={(item) => (
                        <NavLink to={`${roleConfig.routeBase}/view/${item.id}`} className='inline-flex min-h-9 items-center gap-1 rounded-lg border border-[var(--erp-line-strong)] px-3 text-xs font-semibold text-[var(--erp-ink)]'>
                            Review <ArrowUpRight aria-hidden='true' size={14} />
                        </NavLink>
                    )}
                />
                <Pagination {...pagination} onPageChange={setPage} onPageSizeChange={(value) => { setPageSize(value); setPage(1) }} />
            </div>
        </section>
    )
}

export default EscalationListPage

