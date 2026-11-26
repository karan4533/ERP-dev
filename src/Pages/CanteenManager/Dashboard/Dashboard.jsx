import { NavLink } from 'react-router-dom'
import { AlertTriangle, ClipboardCheck, IndianRupee, Package, Plus, Rss, ShoppingCart } from 'lucide-react'
import { DataTable, IntegrationNotice, StatusBadge } from '../../../Common/ui'
import {
    SUMMARY_CARDS,
    RECENT_ORDERS,
    LOW_STOCK_ALERTS,
    PENDING_REQUESTS,
    INVENTORY_SUMMARY,
    TOP_SELLING_ITEMS,
    RECENT_ANNOUNCEMENTS,
    QUICK_ACTIONS,
} from './dashboardData'

const CARD_ICONS = {
    'Orders Today': ShoppingCart,
    "Today's Sales": IndianRupee,
    'Inventory Items': Package,
    'Low Stock Alerts': AlertTriangle,
    'Pending Approvals': ClipboardCheck,
    'Active Announcements': Rss,
}

const orderColumns = [
    { key: 'orderId', label: 'Order', required: true },
    { key: 'customer', label: 'Customer', required: true },
    { key: 'type', label: 'Type' },
    { key: 'amount', label: 'Amount', required: true },
    { key: 'status', label: 'Fulfilment', required: true, render: (row) => <StatusBadge status={row.status} /> },
]
const stockColumns = [
    { key: 'item', label: 'Item', required: true },
    { key: 'currentStock', label: 'Current', required: true },
    { key: 'reorderLevel', label: 'Reorder at', required: true },
]
const requestColumns = [
    { key: 'requestId', label: 'Request', required: true },
    { key: 'type', label: 'Type', required: true },
    { key: 'amount', label: 'Amount', required: true },
    { key: 'status', label: 'Decision', required: true, render: (row) => <StatusBadge status={row.status} /> },
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
                <div><h2 className='text-xl font-semibold text-[var(--erp-ink)]'>Canteen operations</h2><p className='mt-1 max-w-3xl text-sm text-[var(--erp-slate)]'>Review fulfilment, stock risk and approval work before opening the corresponding operational register.</p></div>
                <StatusBadge status='Reference dashboard' />
            </div>
            <IntegrationNotice
                state='demo'
                className='mt-4'
                title='Reference dashboard'
                description='KPIs and queues are static frontend samples. Production totals must be calculated from reconciled orders, payments, inventory movements, approvals and publication events with a declared reporting cutoff.'
            />
        </div>

        <div className='grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6'>
            {SUMMARY_CARDS.map((card) => {
                const Icon = CARD_ICONS[card.label] ?? Package
                return (
                    <article key={card.label} className='rounded-2xl bg-white p-4 shadow-md'>
                        <div className='flex items-start justify-between gap-3'>
                            <div className='min-w-0'><p className='text-xs text-[var(--erp-muted)]'>{card.label}</p><p className='mt-1 text-xl font-semibold text-[var(--erp-ink)]'>{card.value}</p><p className='mt-1 text-xs text-[var(--erp-slate)]'>{card.sub} · sample</p></div>
                            <span className='rounded-xl bg-[var(--erp-indigo-soft)] p-2 text-[var(--erp-indigo)]'><Icon aria-hidden='true' size={18} /></span>
                        </div>
                    </article>
                )
            })}
        </div>

        <div className='grid grid-cols-1 gap-5 xl:grid-cols-2'>
            <QueuePanel title='Recent order queue' description='Payment and fulfilment states remain separate.' action={<NavLink to='/canteen-manager/orders' className='text-sm font-semibold text-[var(--erp-indigo)]'>Open orders</NavLink>}>
                <DataTable caption='Recent order queue' rows={RECENT_ORDERS} columns={orderColumns} rowKey='orderId' />
            </QueuePanel>
            <QueuePanel title='Low-stock watchlist' description='Create a governed request before stock reaches the reorder threshold.' action={<NavLink to='/canteen-manager/requests-approvals/add-request' className='text-sm font-semibold text-[var(--erp-indigo)]'>Create request</NavLink>}>
                <DataTable caption='Low-stock watchlist' rows={LOW_STOCK_ALERTS} columns={stockColumns} rowKey='item' />
            </QueuePanel>
            <QueuePanel title='Pending request queue' description='Awaiting an accountable approval decision.' action={<NavLink to='/canteen-manager/requests-approvals' className='text-sm font-semibold text-[var(--erp-indigo)]'>Open requests</NavLink>}>
                <DataTable caption='Pending request queue' rows={PENDING_REQUESTS} columns={requestColumns} rowKey='requestId' />
            </QueuePanel>
            <QueuePanel title='Reference operating context' description='Sample inventory, demand and communications context.'>
                <div className='grid gap-4 p-4 sm:grid-cols-3'>
                    {INVENTORY_SUMMARY.map((item) => <div key={item.label} className='rounded-xl border border-[var(--erp-line)] p-3'><p className='text-xs text-[var(--erp-muted)]'>{item.label}</p><p className='mt-1 font-semibold text-[var(--erp-ink)]'>{item.value}</p></div>)}
                </div>
                <div className='grid gap-4 border-t border-[var(--erp-line)] p-4 sm:grid-cols-2'>
                    <div><h4 className='text-sm font-semibold text-[var(--erp-ink)]'>Top-selling samples</h4><ol className='mt-2 space-y-2'>{TOP_SELLING_ITEMS.slice(0, 3).map((item) => <li key={item.item} className='flex justify-between gap-3 text-sm text-[var(--erp-slate)]'><span>{item.item}</span><span>{item.quantity}</span></li>)}</ol></div>
                    <div><h4 className='text-sm font-semibold text-[var(--erp-ink)]'>Recent announcements</h4><ul className='mt-2 space-y-2'>{RECENT_ANNOUNCEMENTS.map((item) => <li key={item.title} className='text-sm text-[var(--erp-slate)]'><span className='font-medium text-[var(--erp-ink)]'>{item.title}</span><br /><span className='text-xs'>{item.audience} · {item.date}</span></li>)}</ul></div>
                </div>
            </QueuePanel>
        </div>

        <div className='rounded-2xl bg-white p-4 shadow-md'>
            <h3 className='font-semibold text-[var(--erp-ink)]'>Quick actions</h3>
            <div className='mt-3 flex flex-wrap gap-2'>
                {QUICK_ACTIONS.map((action) => (
                    <NavLink key={action.label} to={action.to} className='inline-flex min-h-10 items-center gap-2 rounded-lg border border-[var(--erp-line-strong)] px-4 text-sm font-semibold text-[var(--erp-indigo)] hover:bg-[var(--erp-indigo-soft)]'>
                        <Plus aria-hidden='true' size={16} /> {action.label}
                    </NavLink>
                ))}
            </div>
        </div>
    </section>
)

export default Dashboard
