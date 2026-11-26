import {
    AlertTriangle,
    ArrowRight,
    CheckCircle2,
    ClipboardCheck,
    Clock3,
    FileText,
    ShieldCheck,
    Users,
} from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { IntegrationNotice, PageHeader, StatusBadge, Surface } from '../ui'

const ICONS = {
    people: Users,
    documents: FileText,
    approvals: ClipboardCheck,
    waiting: Clock3,
    risk: AlertTriangle,
    complete: CheckCircle2,
    governance: ShieldCheck,
}

const MetricCard = ({ metric }) => {
    const Icon = ICONS[metric.icon] || FileText
    return (
        <article className='rounded-[var(--erp-radius-surface)] border border-[var(--erp-line)] bg-white p-4'>
            <div className='flex items-start justify-between gap-3'>
                <div>
                    <p className='text-sm font-medium text-[var(--erp-slate)]'>{metric.label}</p>
                    <p className='mt-2 text-3xl font-semibold tracking-tight text-[var(--erp-ink)]'>{metric.value}</p>
                </div>
                <span className='inline-flex size-10 items-center justify-center rounded-xl bg-[var(--erp-indigo-soft)] text-[var(--erp-indigo)]'>
                    <Icon aria-hidden='true' size={20} />
                </span>
            </div>
            <p className='mt-3 text-xs text-[var(--erp-muted)]'>{metric.context}</p>
        </article>
    )
}

const OperationalBriefing = ({
    title,
    description,
    roleContext,
    metrics,
    queues,
    quickActions,
    lastUpdated = 'Demo snapshot · 27 Oct 2026, 09:00 IST',
}) => (
    <section className='space-y-5'>
        <PageHeader
            title={title}
            description={description}
            context={roleContext}
            meta={<span>Reporting period: Current academic year</span>}
        />

        <IntegrationNotice
            state='demo'
            title='Sample operational data'
            description={`These figures are a labelled UI dataset, not live backend totals. Provenance: ${lastUpdated}.`}
        />

        <div className='grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4'>
            {metrics.map((metric) => <MetricCard key={metric.label} metric={metric} />)}
        </div>

        <div className='grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(18rem,0.8fr)]'>
            <Surface
                title='Priority work queues'
                description='Items are ordered by urgency and show the accountable destination.'
                contentClassName='divide-y divide-[var(--erp-line)]'
            >
                {queues.map((queue) => (
                    <article key={queue.title} className='flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5'>
                        <div className='min-w-0'>
                            <div className='flex flex-wrap items-center gap-2'>
                                <h3 className='text-sm font-semibold text-[var(--erp-ink)]'>{queue.title}</h3>
                                <StatusBadge status={queue.status} />
                            </div>
                            <p className='mt-1 text-sm text-[var(--erp-slate)]'>{queue.description}</p>
                            <p className='mt-1 text-xs text-[var(--erp-muted)]'>Owner: {queue.owner} · SLA: {queue.sla}</p>
                        </div>
                        <NavLink
                            to={queue.to}
                            className='inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-lg border border-[var(--erp-line-strong)] px-3 text-sm font-semibold text-[var(--erp-indigo)] hover:bg-[var(--erp-indigo-soft)]'
                        >
                            Open queue <ArrowRight aria-hidden='true' size={15} />
                        </NavLink>
                    </article>
                ))}
            </Surface>

            <Surface title='Common actions' description='Start the workflows most often used in this role.' contentClassName='p-3'>
                <nav aria-label={`${title} quick actions`} className='grid gap-2'>
                    {quickActions.map((action) => (
                        <NavLink
                            key={action.label}
                            to={action.to}
                            className='flex min-h-12 items-center justify-between gap-3 rounded-lg border border-[var(--erp-line)] px-3 text-sm font-semibold text-[var(--erp-ink)] hover:border-[var(--erp-indigo)] hover:bg-[var(--erp-indigo-soft)]'
                        >
                            {action.label}
                            <ArrowRight aria-hidden='true' size={16} className='text-[var(--erp-indigo)]' />
                        </NavLink>
                    ))}
                </nav>
            </Surface>
        </div>
    </section>
)

export default OperationalBriefing
