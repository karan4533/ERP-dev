import { NavLink } from 'react-router-dom'
import { AlertTriangle, ArrowRight, Bus, ClipboardCheck, MapPinned, Wrench } from 'lucide-react'
import { IntegrationNotice, PageHeader, StatusBadge } from '../../../Common/ui'

const METRICS = [
    { label: 'Fleet records', value: 12, detail: 'Reference vehicles', icon: Bus },
    { label: 'Active routes', value: 8, detail: 'Reference route plans', icon: MapPinned },
    { label: 'Maintenance due', value: 3, detail: 'Needs scheduling review', icon: Wrench },
    { label: 'Approval queue', value: 4, detail: 'Requests awaiting decision', icon: ClipboardCheck },
]

const ATTENTION = [
    { id: 'VH-004', title: 'Insurance renewal evidence due', context: 'Vehicle TN-09-AB-4521 · due 04-11-2026', status: 'High', to: '/transport-manager/vehicle-management' },
    { id: 'MT-018', title: 'Preventive service schedule review', context: 'School bus 07 · odometer threshold reached', status: 'Pending', to: '/transport-manager/vehicle-maintenance' },
    { id: 'REQ-026', title: 'Route 5 repair request', context: 'Workshop quotation awaiting approval', status: 'In Review', to: '/transport-manager/request-approvals' },
]

const QUICK_LINKS = [
    { label: 'Review fleet', to: '/transport-manager/vehicle-management' },
    { label: 'Manage routes', to: '/transport-manager/route-management' },
    { label: 'Assign duties', to: '/transport-manager/assign-duty' },
    { label: 'Review maintenance', to: '/transport-manager/vehicle-maintenance' },
]

const Dashboard = () => (
    <section>
        <PageHeader
            title='Transport operations briefing'
            description='Fleet readiness, route coverage, maintenance risk and approval work requiring transport management attention.'
            context='Reference operational data · live telematics and transport services not connected'
        />

        <IntegrationNotice
            state='demo'
            title='Transport reference workspace'
            description='Counts and attention items are frontend reference data. Live GPS, vehicle telemetry, duty acknowledgement, maintenance work orders, documents and approval notifications require backend integrations.'
            className='mb-5'
        />

        <dl className='grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4'>
            {METRICS.map(({ label, value, detail, icon: Icon }) => (
                <div key={label} className='rounded-2xl border border-[var(--erp-line)] bg-white p-4 shadow-[var(--erp-shadow-subtle)]'>
                    <div className='flex items-start justify-between gap-3'>
                        <div><dt className='text-sm font-medium text-[var(--erp-muted)]'>{label}</dt><dd className='mt-1 text-2xl font-semibold text-[var(--erp-ink)]'>{value}</dd></div>
                        <span className='grid size-10 place-items-center rounded-xl bg-[var(--erp-primary-soft)] text-[var(--erp-primary)]'>{Icon && <Icon size={19} aria-hidden='true' />}</span>
                    </div>
                    <p className='mt-2 text-xs text-[var(--erp-slate)]'>{detail}</p>
                </div>
            ))}
        </dl>

        <div className='mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(18rem,0.6fr)]'>
            <section className='rounded-2xl border border-[var(--erp-line)] bg-white p-4 shadow-[var(--erp-shadow-subtle)]' aria-labelledby='transport-attention-heading'>
                <div className='flex items-center gap-2'><AlertTriangle className='text-amber-600' size={19} aria-hidden='true' /><h3 id='transport-attention-heading' className='text-lg font-semibold text-[var(--erp-ink)]'>Attention queue</h3></div>
                <div className='mt-4 divide-y divide-[var(--erp-line)]'>
                    {ATTENTION.map((item) => (
                        <article key={item.id} className='flex flex-col gap-3 py-4 first:pt-0 sm:flex-row sm:items-center sm:justify-between'>
                            <div className='min-w-0'><p className='font-semibold text-[var(--erp-ink)]'>{item.title}</p><p className='mt-1 text-sm text-[var(--erp-slate)]'>{item.id} · {item.context}</p></div>
                            <div className='flex items-center gap-2'><StatusBadge status={item.status} /><NavLink to={item.to} className='inline-flex min-h-9 items-center gap-1 rounded-lg border border-[var(--erp-primary)] px-3 py-1.5 text-sm font-semibold text-[var(--erp-primary)]'>Review <ArrowRight size={14} aria-hidden='true' /></NavLink></div>
                        </article>
                    ))}
                </div>
            </section>

            <section className='rounded-2xl border border-[var(--erp-line)] bg-white p-4 shadow-[var(--erp-shadow-subtle)]' aria-labelledby='transport-quick-links-heading'>
                <h3 id='transport-quick-links-heading' className='text-lg font-semibold text-[var(--erp-ink)]'>Common actions</h3>
                <div className='mt-4 grid gap-2'>
                    {QUICK_LINKS.map((item) => <NavLink key={item.to} to={item.to} className='flex min-h-11 items-center justify-between rounded-xl border border-[var(--erp-line)] px-3 py-2 text-sm font-semibold text-[var(--erp-slate)] hover:border-[var(--erp-primary)] hover:text-[var(--erp-primary)]'>{item.label}<ArrowRight size={15} aria-hidden='true' /></NavLink>)}
                </div>
            </section>
        </div>
    </section>
)

export default Dashboard
