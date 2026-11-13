import { NavLink } from 'react-router-dom'
import { AlertTriangle, CheckCircle2, ClipboardCheck, ClipboardList, Clock, MapPin, Users } from 'lucide-react'
import { DataTable, IntegrationNotice, StatusBadge } from '../../../Common/ui'
import { SUMMARY_CARDS, RECENT_TASKS, LOW_STOCK_ITEMS, PENDING_REQUESTS, RECENT_ANNOUNCEMENTS } from './dashboardData'

const CARD_ICONS = {
    'Active Tasks Today': ClipboardList,
    'Tasks Completed': CheckCircle2,
    'Pending Tasks': Clock,
    'Low Stock Items': AlertTriangle,
    'Staff On Duty': Users,
    'Pending Requests': ClipboardCheck,
    'Zones Inspected': MapPin,
}
const taskColumns = [
    { key: 'taskId', label: 'Task', required: true },
    { key: 'title', label: 'Work item', required: true },
    { key: 'assignedTo', label: 'Assigned to', required: true },
    { key: 'status', label: 'Workflow state', required: true, render: (row) => <StatusBadge status={row.status} /> },
]
const stockColumns = [
    { key: 'item', label: 'Supply', required: true },
    { key: 'availableQty', label: 'Available', required: true },
    { key: 'reorderLevel', label: 'Reorder at', required: true },
]
const requestColumns = [
    { key: 'requestId', label: 'Request', required: true },
    { key: 'type', label: 'Requirement', required: true },
    { key: 'status', label: 'Decision', required: true, render: (row) => <StatusBadge status={row.status} /> },
]
const announcementColumns = [
    { key: 'title', label: 'Announcement', required: true },
    { key: 'date', label: 'Published', required: true },
]

const QueuePanel = ({ title, description, action, children }) => (
    <article className='overflow-hidden rounded-2xl bg-white shadow-md'>
        <div className='flex flex-col gap-3 border-b border-[var(--erp-line)] p-4 sm:flex-row sm:items-start sm:justify-between'>
            <div><h3 className='font-semibold text-[var(--erp-ink)]'>{title}</h3><p className='mt-0.5 text-xs text-[var(--erp-muted)]'>{description}</p></div>
            {action}
        </div>
        {children}
    </article>
)

const Dashboard = () => (
    <section className='space-y-5'>
        <div className='rounded-2xl bg-white p-4 shadow-md sm:p-5'>
            <div className='flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between'>
                <div><h2 className='text-xl font-semibold text-[var(--erp-ink)]'>Housekeeping operations</h2><p className='mt-1 max-w-3xl text-sm text-[var(--erp-slate)]'>Review delegated work, zone readiness, supply risk and approvals before opening the owning workflow.</p></div>
                <StatusBadge status='Reference dashboard' />
            </div>
            <IntegrationNotice state='demo' className='mt-4' title='Reference dashboard' description='KPIs and queues are frontend samples. Production totals must come from task evidence, duty rosters, inspected zones, immutable supply movements and approval events at a declared reporting cutoff.' />
        </div>

        <div className='grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4'>
            {SUMMARY_CARDS.map((card) => {
                const Icon = CARD_ICONS[card.label] ?? ClipboardList
                return <article key={card.label} className='rounded-2xl bg-white p-4 shadow-md'><div className='flex items-start justify-between gap-3'><div className='min-w-0'><p className='text-xs text-[var(--erp-muted)]'>{card.label}</p><p className='mt-1 text-xl font-semibold text-[var(--erp-ink)]'>{card.value}</p><p className='mt-1 text-xs text-[var(--erp-slate)]'>{card.sub} · sample</p></div><span className='rounded-xl bg-[var(--erp-indigo-soft)] p-2 text-[var(--erp-indigo)]'><Icon aria-hidden='true' size={18} /></span></div></article>
            })}
        </div>

        <div className='grid grid-cols-1 gap-5 xl:grid-cols-2'>
            <QueuePanel title='Recent task queue' description='Reference assignments; live status updates remain in My tasks.' action={<NavLink to='/housekeeping-manager/task-management/my-tasks' className='text-sm font-semibold text-[var(--erp-indigo)]'>Open my tasks</NavLink>}><DataTable caption='Recent task queue' rows={RECENT_TASKS} columns={taskColumns} rowKey='taskId' /></QueuePanel>
            <QueuePanel title='Low-stock supply watchlist' description='Supplies below their sample reorder threshold.' action={<NavLink to='/housekeeping-manager/requests-approvals/add-request' className='text-sm font-semibold text-[var(--erp-indigo)]'>Create request</NavLink>}><DataTable caption='Low-stock supply watchlist' rows={LOW_STOCK_ITEMS} columns={stockColumns} rowKey='item' /></QueuePanel>
            <QueuePanel title='Pending request queue' description='Requests awaiting a governed decision.' action={<NavLink to='/housekeeping-manager/requests-approvals' className='text-sm font-semibold text-[var(--erp-indigo)]'>Open requests</NavLink>}><DataTable caption='Pending request queue' rows={PENDING_REQUESTS} columns={requestColumns} rowKey='requestId' /></QueuePanel>
            <QueuePanel title='Recent housekeeping announcements' description='Reference communications for the operating team.' action={<NavLink to='/housekeeping-manager/broadcast' className='text-sm font-semibold text-[var(--erp-indigo)]'>Open announcements</NavLink>}><DataTable caption='Recent housekeeping announcements' rows={RECENT_ANNOUNCEMENTS} columns={announcementColumns} rowKey='title' /></QueuePanel>
        </div>

        <nav aria-label='Housekeeping quick actions' className='flex flex-wrap gap-2 rounded-2xl bg-white p-4 shadow-md'>
            <NavLink to='/housekeeping-manager/task-management/my-tasks' className='inline-flex min-h-10 items-center rounded-lg border border-[var(--erp-line-strong)] px-4 text-sm font-semibold text-[var(--erp-indigo)]'>Update my tasks</NavLink>
            <NavLink to='/housekeeping-manager/inventory' className='inline-flex min-h-10 items-center rounded-lg border border-[var(--erp-line-strong)] px-4 text-sm font-semibold text-[var(--erp-indigo)]'>Review supplies</NavLink>
            <NavLink to='/housekeeping-manager/duty-allotment' className='inline-flex min-h-10 items-center rounded-lg border border-[var(--erp-line-strong)] px-4 text-sm font-semibold text-[var(--erp-indigo)]'>Open duty allotment</NavLink>
            <NavLink to='/housekeeping-manager/reports' className='inline-flex min-h-10 items-center rounded-lg border border-[var(--erp-line-strong)] px-4 text-sm font-semibold text-[var(--erp-indigo)]'>Open reports</NavLink>
        </nav>
    </section>
)

export default Dashboard
