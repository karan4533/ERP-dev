import { NavLink } from 'react-router-dom'
import { AlertTriangle, CheckCircle2, ClipboardCheck, ClipboardList, Clock, Fuel, ShieldCheck, Users, Wrench, Zap } from 'lucide-react'
import { DataTable, IntegrationNotice, StatusBadge } from '../../../Common/ui'
import { SUMMARY_CARDS, RECENT_WORK_ORDERS, LOW_STOCK_SPARES, PENDING_REQUESTS, RECENT_ANNOUNCEMENTS } from './dashboardData'

const CARD_ICONS = {
    'Active Work Orders': Wrench,
    'Preventive Schedules Due': Clock,
    'DG GenSet Fuel Level': Fuel,
    'Open Helpdesk Tickets': AlertTriangle,
    'Technicians On Duty': Users,
    'Pending Approvals': ClipboardCheck,
    'Equipment Inspected': ShieldCheck,
}

const workOrderColumns = [
    { key: 'orderId', label: 'Work Order', required: true },
    { key: 'serviceType', label: 'Service Category', required: true },
    { key: 'block', label: 'Location / Block', required: true },
    { key: 'technician', label: 'Assigned Tech', required: true },
    { key: 'status', label: 'Status', required: true, render: (row) => <StatusBadge status={row.status} /> },
]

const spareColumns = [
    { key: 'item', label: 'Spare / Material', required: true },
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
            <div>
                <h3 className='font-semibold text-[var(--erp-ink)]'>{title}</h3>
                <p className='mt-0.5 text-xs text-[var(--erp-muted)]'>{description}</p>
            </div>
            {action}
        </div>
        {children}
    </article>
)

const Dashboard = () => (
    <section className='space-y-5'>
        <div className='rounded-2xl bg-white p-4 shadow-md sm:p-5'>
            <div className='flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between'>
                <div>
                    <h2 className='text-xl font-semibold text-[var(--erp-ink)]'>Campus Infrastructure & Maintenance Operations</h2>
                    <p className='mt-1 max-w-3xl text-sm text-[var(--erp-slate)]'>
                        Manage HT/LT electrical substations, diesel generators, plumbing & water networks, HVAC systems, civil work orders, and safety inspections.
                    </p>
                </div>
                <StatusBadge status='Department portal' />
            </div>
            <IntegrationNotice
                state='demo'
                className='mt-4'
                title='Maintenance operational telemetry'
                description='Real-time equipment logs, work orders, preventive checklists, spares movements and duty rosters are synchronized across Operations and Stores.'
            />
        </div>

        <div className='grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4'>
            {SUMMARY_CARDS.map((card) => {
                const Icon = CARD_ICONS[card.label] ?? Wrench
                return (
                    <article key={card.label} className='rounded-2xl bg-white p-4 shadow-md'>
                        <div className='flex items-start justify-between gap-3'>
                            <div className='min-w-0'>
                                <p className='text-xs text-[var(--erp-muted)]'>{card.label}</p>
                                <p className='mt-1 text-xl font-semibold text-[var(--erp-ink)]'>{card.value}</p>
                                <p className='mt-1 text-xs text-[var(--erp-slate)]'>{card.sub}</p>
                            </div>
                            <span className='rounded-xl bg-[var(--erp-indigo-soft)] p-2 text-[var(--erp-indigo)]'>
                                <Icon aria-hidden='true' size={18} />
                            </span>
                        </div>
                    </article>
                )
            })}
        </div>

        <div className='grid grid-cols-1 gap-5 lg:grid-cols-2'>
            <QueuePanel
                title='Recent Campus Work Orders'
                description='Live tracking of ongoing and resolved electrical, plumbing and civil repairs.'
                action={
                    <NavLink
                        to='/maintenance-manager/campus-maintenance'
                        className='text-xs font-semibold text-[var(--erp-indigo)] hover:underline'
                    >
                        View all orders →
                    </NavLink>
                }
            >
                <DataTable
                    columns={workOrderColumns}
                    data={RECENT_WORK_ORDERS}
                    caption='Recent work orders'
                />
            </QueuePanel>

            <QueuePanel
                title='Critical Spares Below Reorder Level'
                description='Spare parts and electrical consumables requiring store requisition or purchase order.'
                action={
                    <NavLink
                        to='/maintenance-manager/inventory'
                        className='text-xs font-semibold text-[var(--erp-indigo)] hover:underline'
                    >
                        Open spares inventory →
                    </NavLink>
                }
            >
                <DataTable
                    columns={spareColumns}
                    data={LOW_STOCK_SPARES}
                    caption='Low stock spares'
                />
            </QueuePanel>
        </div>

        <div className='grid grid-cols-1 gap-5 lg:grid-cols-2'>
            <QueuePanel
                title='Material & AMC Requests'
                description='Procurement requisitions and AMC renewals pending Joint Director Operations sign-off.'
                action={
                    <NavLink
                        to='/maintenance-manager/requests-approvals'
                        className='text-xs font-semibold text-[var(--erp-indigo)] hover:underline'
                    >
                        Manage requests →
                    </NavLink>
                }
            >
                <DataTable
                    columns={requestColumns}
                    data={PENDING_REQUESTS}
                    caption='Pending maintenance requests'
                />
            </QueuePanel>

            <QueuePanel
                title='Department Announcements & Service Bulletins'
                description='Power shutdowns, water tank cleaning advisories, and campus safety notices.'
                action={
                    <NavLink
                        to='/maintenance-manager/broadcast'
                        className='text-xs font-semibold text-[var(--erp-indigo)] hover:underline'
                    >
                        All announcements →
                    </NavLink>
                }
            >
                <DataTable
                    columns={announcementColumns}
                    data={RECENT_ANNOUNCEMENTS}
                    caption='Recent maintenance announcements'
                />
            </QueuePanel>
        </div>
    </section>
)

export default Dashboard

