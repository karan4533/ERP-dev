import { useEffect, useMemo, useState } from 'react'
import { ArrowUpRight, Download, Plus } from 'lucide-react'
import { NavLink, useSearchParams } from 'react-router-dom'
import {
    DataTable,
    DataToolbar,
    IntegrationNotice,
    PageHeader,
    Pagination,
    StatusBadge,
} from '../../../Common/ui'
import { paginateRows, parseTableState, serializeTableState } from '../../../Common/ui/dataTableState'
import {
    ADMIN_USER_STATUSES,
    filterAdminUsers,
    getAdminUserSummary,
    getAllAdminUsers,
    getPermissionCount,
    ROUTE_BASE,
} from './adminUsersData'

const AdminUsersList = () => {
    const [urlParams, setUrlParams] = useSearchParams()
    const initialTableState = parseTableState(urlParams)
    const [records] = useState(() => getAllAdminUsers())
    const [search, setSearch] = useState(initialTableState.query)
    const [status, setStatus] = useState(initialTableState.filters.status || '')
    const [page, setPage] = useState(initialTableState.page)
    const [pageSize, setPageSize] = useState(initialTableState.pageSize)

    const summary = useMemo(() => getAdminUserSummary(records), [records])
    const filteredRecords = useMemo(
        () => filterAdminUsers(records, { search, status }),
        [records, search, status],
    )
    const pagination = paginateRows(filteredRecords, { page, pageSize })

    useEffect(() => {
        setUrlParams(serializeTableState({
            query: search,
            page: pagination.page,
            pageSize,
            filters: { status },
        }), { replace: true })
    }, [pageSize, pagination.page, search, setUrlParams, status])

    const columns = [
        { key: 'name', label: 'Administrator', required: true, render: (user) => <span><span className='block font-semibold text-[var(--erp-ink)]'>{user.name}</span><span className='block text-xs text-[var(--erp-muted)]'>{user.id}</span></span> },
        { key: 'email', label: 'Email' },
        { key: 'department', label: 'Department' },
        { key: 'permissions', label: 'Module scope', render: (user) => `${getPermissionCount(user.permissions)} optional modules` },
        { key: 'status', label: 'Status', render: (user) => <StatusBadge status={user.status} /> },
        { key: 'createdAt', label: 'Created' },
    ]

    return (
        <section className='space-y-5'>
            <PageHeader
                title='Administrator accounts'
                description='Provision Administrator portal identities and review each account’s module scope.'
                context={`${summary.total} total · ${summary.active} active · ${summary.inactive} inactive`}
                actions={(
                    <NavLink to={`${ROUTE_BASE}/add`} className='inline-flex min-h-10 items-center gap-2 rounded-lg bg-[var(--erp-indigo)] px-4 text-sm font-semibold text-white'>
                        <Plus aria-hidden='true' size={16} /> Create administrator
                    </NavLink>
                )}
            />

            <IntegrationNotice
                state='demo'
                title='Browser-stored administrator directory'
                description='Profiles and module policies are local to this browser. Production provisioning, invitations, audit trails and API authorization are not connected.'
            />

            <div className='grid grid-cols-2 gap-3 lg:grid-cols-4'>
                {[
                    ['Total accounts', summary.total],
                    ['Active', summary.active],
                    ['Inactive', summary.inactive],
                    ['Custom created', summary.custom],
                ].map(([label, value]) => (
                    <article key={label} className='rounded-xl border border-[var(--erp-line)] bg-white p-4'>
                        <p className='text-xs font-medium uppercase tracking-wide text-[var(--erp-muted)]'>{label}</p>
                        <p className='mt-2 text-2xl font-semibold text-[var(--erp-ink)]'>{value}</p>
                    </article>
                ))}
            </div>

            <div className='overflow-hidden rounded-[var(--erp-radius-surface)] border border-[var(--erp-line)] bg-white'>
                <DataToolbar
                    query={search}
                    onQueryChange={(value) => { setSearch(value); setPage(1) }}
                    searchPlaceholder='Search name, email, ID or department'
                    resultCount={filteredRecords.length}
                    onReset={() => { setSearch(''); setStatus(''); setPage(1) }}
                    filters={(
                        <label className='grid gap-1 text-xs font-medium text-[var(--erp-slate)]'>Status
                            <select value={status} onChange={(event) => { setStatus(event.target.value); setPage(1) }} className='min-h-10 rounded-lg border border-[var(--erp-line-strong)] bg-white px-3 text-sm'>
                                <option value=''>All statuses</option>
                                {ADMIN_USER_STATUSES.map((item) => <option key={item} value={item}>{item}</option>)}
                            </select>
                        </label>
                    )}
                    actions={(
                        <button type='button' disabled title='Export service is not connected' className='inline-flex min-h-10 items-center gap-2 rounded-lg border border-[var(--erp-line-strong)] px-4 text-sm font-semibold text-[var(--erp-muted)] opacity-65'>
                            <Download aria-hidden='true' size={16} /> Export unavailable
                        </button>
                    )}
                />
                <DataTable
                    caption='Administrator accounts'
                    rows={pagination.rows}
                    columns={columns}
                    rowKey='id'
                    emptyTitle='No administrator accounts found'
                    emptyDescription='No accounts match the current search and status filter.'
                    renderActions={(user) => (
                        <NavLink to={`${ROUTE_BASE}/view/${user.id}`} className='inline-flex min-h-9 items-center gap-1 rounded-lg border border-[var(--erp-line-strong)] px-3 text-xs font-semibold text-[var(--erp-ink)]'>
                            Review access <ArrowUpRight aria-hidden='true' size={14} />
                        </NavLink>
                    )}
                />
                <Pagination {...pagination} onPageChange={setPage} onPageSizeChange={(value) => { setPageSize(value); setPage(1) }} />
            </div>
        </section>
    )
}

export default AdminUsersList
