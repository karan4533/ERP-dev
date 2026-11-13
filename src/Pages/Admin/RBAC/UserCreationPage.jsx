import { useEffect, useMemo, useState } from 'react'
import { Plus, ShieldCheck, Trash2, UserRoundCheck, UserRoundX } from 'lucide-react'
import { NavLink, useSearchParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import {
    ConfirmAction,
    DataTable,
    DataToolbar,
    IntegrationNotice,
    PageHeader,
    Pagination,
    StatusBadge,
} from '../../../Common/ui'
import { paginateRows, parseTableState, serializeTableState } from '../../../Common/ui/dataTableState'
import {
    CREATABLE_ROLE_LABELS,
    CREATABLE_ROLE_OPTIONS,
    deleteCreatedUser,
    getAllCreatedUsers,
    updateUserStatus,
} from '../../../Common/RBAC/createdUsersData'

const ROUTE_BASE = '/admin/rbac/user-creation'

const UserCreationPage = () => {
    const [urlParams, setUrlParams] = useSearchParams()
    const initialTableState = parseTableState(urlParams)
    const [users, setUsers] = useState(() => getAllCreatedUsers())
    const [search, setSearch] = useState(initialTableState.query)
    const [role, setRole] = useState(initialTableState.filters.role || '')
    const [status, setStatus] = useState(initialTableState.filters.status || '')
    const [page, setPage] = useState(initialTableState.page)
    const [pageSize, setPageSize] = useState(initialTableState.pageSize)
    const [pendingAction, setPendingAction] = useState(null)

    const filteredUsers = useMemo(() => {
        const query = search.trim().toLowerCase()
        return users.filter((user) => {
            if (role && user.role !== role) return false
            if (status && user.status !== status) return false
            if (!query) return true
            return [user.id, user.name, user.email, user.role, user.className, user.section]
                .some((value) => String(value || '').toLowerCase().includes(query))
        })
    }, [role, search, status, users])
    const pagination = paginateRows(filteredUsers, { page, pageSize })

    useEffect(() => {
        setUrlParams(serializeTableState({
            query: search,
            page: pagination.page,
            pageSize,
            filters: { role, status },
        }), { replace: true })
    }, [pageSize, pagination.page, role, search, setUrlParams, status])

    const refreshUsers = () => setUsers(getAllCreatedUsers())

    const confirmPendingAction = () => {
        if (!pendingAction) return
        const { type, user } = pendingAction
        if (type === 'delete') {
            deleteCreatedUser(user.id)
            toast.success('User removed from this browser dataset.')
        } else {
            const nextStatus = user.status === 'Active' ? 'Inactive' : 'Active'
            updateUserStatus(user.id, nextStatus)
            toast.success(`User marked as ${nextStatus}.`)
        }
        refreshUsers()
        setPendingAction(null)
    }

    const resetFilters = () => {
        setSearch('')
        setRole('')
        setStatus('')
        setPage(1)
    }

    const columns = [
        { key: 'name', label: 'User', required: true, render: (user) => <span><span className='block font-semibold text-[var(--erp-ink)]'>{user.name}</span><span className='block text-xs text-[var(--erp-muted)]'>{user.id}</span></span> },
        { key: 'email', label: 'Email' },
        { key: 'role', label: 'Role', render: (user) => CREATABLE_ROLE_LABELS[user.role] || user.role },
        { key: 'class', label: 'Class scope', render: (user) => user.className && user.section ? `${user.className}-${user.section}` : 'Not class-scoped' },
        { key: 'status', label: 'Status', render: (user) => <StatusBadge status={user.status} /> },
    ]

    return (
        <section className='space-y-5'>
            <PageHeader
                title='User provisioning'
                description='Create staff identities, review account state and manage access lifecycle.'
                context={`${users.length} created · ${users.filter((user) => user.status === 'Active').length} active`}
                actions={(
                    <NavLink to={`${ROUTE_BASE}/add`} className='inline-flex min-h-10 items-center gap-2 rounded-lg bg-[var(--erp-indigo)] px-4 text-sm font-semibold text-white'>
                        <Plus aria-hidden='true' size={16} /> Create user
                    </NavLink>
                )}
            />

            <IntegrationNotice
                state='demo'
                title='Local account directory'
                description='Accounts and status changes are stored in this browser. Production identity provisioning, invitations, password setup and session revocation require the authentication backend.'
            />

            <div className='overflow-hidden rounded-[var(--erp-radius-surface)] border border-[var(--erp-line)] bg-white'>
                <DataToolbar
                    query={search}
                    onQueryChange={(value) => { setSearch(value); setPage(1) }}
                    searchPlaceholder='Search name, email or user ID'
                    resultCount={filteredUsers.length}
                    onReset={resetFilters}
                    filters={(
                        <>
                            <label className='grid gap-1 text-xs font-medium text-[var(--erp-slate)]'>Role
                                <select value={role} onChange={(event) => { setRole(event.target.value); setPage(1) }} className='min-h-10 rounded-lg border border-[var(--erp-line-strong)] bg-white px-3 text-sm'>
                                    <option value=''>All roles</option>
                                    {CREATABLE_ROLE_OPTIONS.map((option) => <option key={option.role} value={option.role}>{option.label}</option>)}
                                </select>
                            </label>
                            <label className='grid gap-1 text-xs font-medium text-[var(--erp-slate)]'>Status
                                <select value={status} onChange={(event) => { setStatus(event.target.value); setPage(1) }} className='min-h-10 rounded-lg border border-[var(--erp-line-strong)] bg-white px-3 text-sm'>
                                    <option value=''>All statuses</option>
                                    <option value='Active'>Active</option>
                                    <option value='Inactive'>Inactive</option>
                                </select>
                            </label>
                        </>
                    )}
                />
                <DataTable
                    caption='Provisioned users'
                    rows={pagination.rows}
                    columns={columns}
                    rowKey='id'
                    emptyTitle='No users found'
                    emptyDescription='No created users match the current filters.'
                    renderActions={(user) => (
                        <>
                            <button type='button' onClick={() => setPendingAction({ type: 'status', user })} className='inline-flex min-h-9 items-center gap-1 rounded-lg border border-[var(--erp-line-strong)] px-3 text-xs font-semibold text-[var(--erp-indigo)]'>
                                {user.status === 'Active' ? <UserRoundX aria-hidden='true' size={14} /> : <UserRoundCheck aria-hidden='true' size={14} />}
                                {user.status === 'Active' ? 'Deactivate' : 'Activate'}
                            </button>
                            <button type='button' onClick={() => setPendingAction({ type: 'delete', user })} className='inline-flex min-h-9 items-center gap-1 rounded-lg border border-[#F4433655] px-3 text-xs font-semibold text-[#B42318]'>
                                <Trash2 aria-hidden='true' size={14} /> Delete
                            </button>
                        </>
                    )}
                />
                <Pagination {...pagination} onPageChange={setPage} onPageSizeChange={(value) => { setPageSize(value); setPage(1) }} />
            </div>

            <ConfirmAction
                open={Boolean(pendingAction)}
                onClose={() => setPendingAction(null)}
                onConfirm={confirmPendingAction}
                title={pendingAction?.type === 'delete' ? 'Delete this user?' : `${pendingAction?.user?.status === 'Active' ? 'Deactivate' : 'Activate'} this user?`}
                description={pendingAction?.type === 'delete' ? 'The local account record will be removed.' : 'The user’s sign-in eligibility will change.'}
                confirmLabel={pendingAction?.type === 'delete' ? 'Delete user' : 'Confirm status change'}
                tone={pendingAction?.type === 'delete' || pendingAction?.user?.status === 'Active' ? 'danger' : 'primary'}
            >
                <div className='flex items-start gap-2'>
                    <ShieldCheck aria-hidden='true' size={18} className='mt-0.5 shrink-0 text-[var(--erp-indigo)]' />
                    <p>{pendingAction?.type === 'delete' ? 'Any future backend implementation should archive the identity and retain audit history instead of hard-deleting it.' : 'Production deactivation should revoke active sessions as well as block new sign-ins.'}</p>
                </div>
            </ConfirmAction>
        </section>
    )
}

export default UserCreationPage
