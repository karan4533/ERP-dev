import { useEffect, useMemo, useState } from 'react'
import { Download, Plus } from 'lucide-react'
import { NavLink, useSearchParams } from 'react-router-dom'
import DataTable from '../ui/DataTable'
import DataToolbar from '../ui/DataToolbar'
import IntegrationNotice from '../ui/IntegrationNotice'
import PageHeader from '../ui/PageHeader'
import Pagination from '../ui/Pagination'
import StatusBadge from '../ui/StatusBadge'
import UnavailableWorkflowPage from '../ui/UnavailableWorkflowPage'
import { paginateRows, parseTableState, serializeTableState } from '../ui/dataTableState'
import { getWorkflowDueDate, getWorkflowState } from '../ui/workflow'
import { getTasksAssignedByRole } from './taskManagementData'
import {
    canAssignTasks,
    formatAssignedTo,
    getAssignableRoles,
    getRoleLabel,
    getTaskManagementPaths,
    TASK_STATUSES,
} from './taskManagementConfig'
import { useTaskRole } from './useTaskRole'

const AssignTasksPage = () => {
    const roleKey = useTaskRole()
    const paths = getTaskManagementPaths(roleKey)
    const assignableRoles = getAssignableRoles(roleKey)
    const [urlParams, setUrlParams] = useSearchParams()
    const initialTableState = parseTableState(urlParams)
    const [search, setSearch] = useState(initialTableState.query)
    const [roleFilter, setRoleFilter] = useState(initialTableState.filters.role || '')
    const [statusFilter, setStatusFilter] = useState(initialTableState.filters.status || '')
    const [page, setPage] = useState(initialTableState.page)
    const [pageSize, setPageSize] = useState(initialTableState.pageSize)

    const tasks = useMemo(() => getTasksAssignedByRole(roleKey), [roleKey])
    const filteredTasks = useMemo(() => {
        const query = search.trim().toLowerCase()
        return tasks.filter((task) => {
            if (roleFilter && task.assigneeRole !== roleFilter) return false
            if (statusFilter && task.status !== statusFilter) return false
            if (!query) return true
            return [task.taskId, task.title, task.description, ...(task.assigneeNames || [])]
                .some((value) => String(value || '').toLowerCase().includes(query))
        })
    }, [tasks, search, roleFilter, statusFilter])
    const pagination = paginateRows(filteredTasks, { page, pageSize })

    useEffect(() => {
        setUrlParams(serializeTableState({
            query: search,
            page: pagination.page,
            pageSize,
            filters: { role: roleFilter, status: statusFilter },
        }), { replace: true })
    }, [pageSize, pagination.page, roleFilter, search, setUrlParams, statusFilter])

    if (!canAssignTasks(roleKey)) {
        return (
            <UnavailableWorkflowPage
                title='Task assignment is outside your role'
                description='You can review and update work assigned to you, but this role cannot assign tasks to other staff.'
                alternateHref={paths.myTasks}
                alternateLabel='Open my tasks'
            />
        )
    }

    const resetFilters = () => {
        setSearch('')
        setRoleFilter('')
        setStatusFilter('')
        setPage(1)
    }

    const columns = [
        { key: 'taskId', label: 'Task ID', required: true, render: (task) => <span className='font-semibold text-[var(--erp-ink)]'>{task.taskId}</span> },
        { key: 'title', label: 'Task' },
        { key: 'assigneeRole', label: 'Role', render: (task) => getRoleLabel(task.assigneeRole) },
        { key: 'assigneeNames', label: 'Assigned to', render: (task) => formatAssignedTo(task.assigneeNames) },
        { key: 'priority', label: 'Priority', render: (task) => <StatusBadge status={task.priority === 'High' ? 'danger' : task.priority === 'Medium' ? 'warning' : 'neutral'} label={task.priority} /> },
        { key: 'dueDate', label: 'Due date' },
        {
            key: 'status',
            label: 'Workflow state',
            render: (task) => {
                const workflow = getWorkflowState(task.status, { dueAt: getWorkflowDueDate(task.dueDate) })
                return <StatusBadge status={workflow.key} label={workflow.overdue ? `${task.status} · overdue` : task.status} />
            },
        },
    ]

    return (
        <section className='space-y-5'>
            <PageHeader
                title='Assigned work'
                description='Track ownership, deadline and completion state for work delegated by your role.'
                context={`${tasks.length} total · ${filteredTasks.length} matching`}
                actions={(
                    <NavLink to={paths.addTask} className='inline-flex min-h-10 items-center gap-2 rounded-lg bg-[var(--erp-indigo)] px-4 text-sm font-semibold text-white'>
                        <Plus aria-hidden='true' size={16} /> Assign task
                    </NavLink>
                )}
            />

            <IntegrationNotice
                state='demo'
                title='Browser-stored delegated work'
                description='New tasks are saved locally. Edit, delete-request, notification and evidence services are intentionally unavailable until their backend workflows are connected.'
            />

            <div className='overflow-hidden rounded-[var(--erp-radius-surface)] border border-[var(--erp-line)] bg-white'>
                <DataToolbar
                    query={search}
                    onQueryChange={(value) => { setSearch(value); setPage(1) }}
                    searchPlaceholder='Search task or assignee'
                    resultCount={filteredTasks.length}
                    onReset={resetFilters}
                    filters={(
                        <>
                            <label className='grid gap-1 text-xs font-medium text-[var(--erp-slate)]'>Assignee role
                                <select value={roleFilter} onChange={(event) => { setRoleFilter(event.target.value); setPage(1) }} className='min-h-10 rounded-lg border border-[var(--erp-line-strong)] bg-white px-3 text-sm'>
                                    <option value=''>All roles</option>
                                    {assignableRoles.map((role) => <option key={role.key} value={role.key}>{role.label}</option>)}
                                </select>
                            </label>
                            <label className='grid gap-1 text-xs font-medium text-[var(--erp-slate)]'>Status
                                <select value={statusFilter} onChange={(event) => { setStatusFilter(event.target.value); setPage(1) }} className='min-h-10 rounded-lg border border-[var(--erp-line-strong)] bg-white px-3 text-sm'>
                                    <option value=''>All statuses</option>
                                    {TASK_STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
                                </select>
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
                    caption='Assigned work'
                    rows={pagination.rows}
                    columns={columns}
                    rowKey='id'
                    emptyTitle='No delegated tasks'
                    emptyDescription='No tasks match the current filters. Assign a task or reset the filters.'
                />
                <Pagination {...pagination} onPageChange={setPage} onPageSizeChange={(value) => { setPageSize(value); setPage(1) }} />
            </div>
        </section>
    )
}

export default AssignTasksPage

