import { useEffect, useMemo, useState } from 'react'
import { Download } from 'lucide-react'
import { useLocation, useSearchParams } from 'react-router-dom'
import DataTable from '../ui/DataTable'
import DataToolbar from '../ui/DataToolbar'
import IntegrationNotice from '../ui/IntegrationNotice'
import PageHeader from '../ui/PageHeader'
import Pagination from '../ui/Pagination'
import StatusBadge from '../ui/StatusBadge'
import { paginateRows, parseTableState, serializeTableState } from '../ui/dataTableState'
import { getWorkflowDueDate, getWorkflowState } from '../ui/workflow'
import UpdateTaskStatusModal from './Components/UpdateTaskStatusModal'
import { getDemoUserId, getMyTasks, updateTaskStatus } from './taskManagementData'
import { getNextStatusOptions, TASK_STATUSES } from './taskManagementConfig'
import { useTaskRole } from './useTaskRole'

const MyTasksPage = () => {
    const { pathname } = useLocation()
    const pageTitle = pathname.includes('/assigned-tasks') ? 'Assigned tasks' : 'My tasks'
    const roleKey = useTaskRole()
    const userId = getDemoUserId(roleKey)
    const [urlParams, setUrlParams] = useSearchParams()
    const initialTableState = parseTableState(urlParams)
    const [search, setSearch] = useState(initialTableState.query)
    const [statusFilter, setStatusFilter] = useState(initialTableState.filters.status || '')
    const [assignedByFilter, setAssignedByFilter] = useState(initialTableState.filters.assignedBy || '')
    const [page, setPage] = useState(initialTableState.page)
    const [pageSize, setPageSize] = useState(initialTableState.pageSize)
    const [refreshKey, setRefreshKey] = useState(0)
    const [statusModalTask, setStatusModalTask] = useState(null)

    const tasks = useMemo(() => {
        void refreshKey
        return getMyTasks(roleKey, userId)
    }, [roleKey, userId, refreshKey])

    const assignedByOptions = useMemo(
        () => [...new Set(tasks.map((task) => task.assignedBy).filter(Boolean))],
        [tasks],
    )

    const filteredTasks = useMemo(() => {
        const query = search.trim().toLowerCase()
        return tasks.filter((task) => {
            if (statusFilter && task.status !== statusFilter) return false
            if (assignedByFilter && task.assignedBy !== assignedByFilter) return false
            if (!query) return true
            return [task.taskId, task.title, task.description, task.assignedBy]
                .some((value) => String(value || '').toLowerCase().includes(query))
        })
    }, [tasks, search, statusFilter, assignedByFilter])

    const showRemarks = pathname.includes('/housekeeping-manager/')
    const pagination = paginateRows(filteredTasks, { page, pageSize })

    useEffect(() => {
        setUrlParams(serializeTableState({
            query: search,
            page: pagination.page,
            pageSize,
            filters: { status: statusFilter, assignedBy: assignedByFilter },
        }), { replace: true })
    }, [assignedByFilter, pageSize, pagination.page, search, setUrlParams, statusFilter])

    const handleStatusSave = (taskId, status, remark) => {
        updateTaskStatus(taskId, status, remark)
        setRefreshKey((key) => key + 1)
    }

    const resetFilters = () => {
        setSearch('')
        setStatusFilter('')
        setAssignedByFilter('')
        setPage(1)
    }

    const columns = useMemo(() => [
        { key: 'taskId', label: 'Task ID', required: true, render: (task) => <span className='font-semibold text-[var(--erp-ink)]'>{task.taskId}</span> },
        { key: 'title', label: 'Task' },
        { key: 'assignedBy', label: 'Assigned by' },
        { key: 'priority', label: 'Priority', render: (task) => <StatusBadge status={task.priority === 'High' ? 'danger' : task.priority === 'Medium' ? 'warning' : 'neutral'} label={task.priority} /> },
        { key: 'dueDate', label: 'Due date' },
        {
            key: 'status',
            label: 'Workflow state',
            render: (task) => {
                const dueAt = getWorkflowDueDate(task.dueDate)
                const workflow = getWorkflowState(task.status, { dueAt })
                return <StatusBadge status={workflow.key} label={workflow.overdue ? `${task.status} · overdue` : task.status} />
            },
        },
        ...(showRemarks ? [{ key: 'remark', label: 'Latest remark', render: (task) => task.remark || '—' }] : []),
    ], [showRemarks])

    return (
        <section className='space-y-5'>
            <PageHeader title={pageTitle} description='Work assigned to you, ordered for status and deadline follow-up.' context={`${tasks.length} total · ${filteredTasks.length} matching`} />

            <IntegrationNotice
                state='demo'
                title='Browser-stored task workflow'
                description='Task updates are stored locally. Assignee notifications, attachments and audit delivery require the backend task service.'
            />

            <div className='overflow-hidden rounded-[var(--erp-radius-surface)] border border-[var(--erp-line)] bg-white'>
                <DataToolbar
                    query={search}
                    onQueryChange={(value) => { setSearch(value); setPage(1) }}
                    searchPlaceholder='Search task ID, title or owner'
                    resultCount={filteredTasks.length}
                    onReset={resetFilters}
                    filters={(
                        <>
                            <label className='grid gap-1 text-xs font-medium text-[var(--erp-slate)]'>Assigned by
                                <select value={assignedByFilter} onChange={(event) => { setAssignedByFilter(event.target.value); setPage(1) }} className='min-h-10 rounded-lg border border-[var(--erp-line-strong)] bg-white px-3 text-sm'>
                                    <option value=''>All owners</option>
                                    {assignedByOptions.map((name) => <option key={name} value={name}>{name}</option>)}
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
                    caption={pageTitle}
                    rows={pagination.rows}
                    columns={columns}
                    rowKey='id'
                    emptyTitle='No assigned tasks'
                    emptyDescription='No tasks match the current filters. Reset filters to review the complete inbox.'
                    renderActions={(task) => getNextStatusOptions(task.status).length > 0 ? (
                        <button type='button' onClick={() => setStatusModalTask(task)} className='min-h-9 rounded-lg bg-[var(--erp-indigo)] px-3 text-xs font-semibold text-white'>Update status</button>
                    ) : <span className='text-xs text-[var(--erp-muted)]'>Complete</span>}
                />
                <Pagination {...pagination} onPageChange={setPage} onPageSizeChange={(value) => { setPageSize(value); setPage(1) }} />
            </div>

            <UpdateTaskStatusModal
                key={statusModalTask?.id || 'closed-task-status'}
                open={Boolean(statusModalTask)}
                task={statusModalTask}
                onClose={() => setStatusModalTask(null)}
                showRemark={showRemarks}
                onSave={handleStatusSave}
            />
        </section>
    )
}

export default MyTasksPage

