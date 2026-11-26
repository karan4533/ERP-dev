import { createElement } from 'react'
import { CalendarRange, Database, LockKeyhole, PlugZap } from 'lucide-react'
import StatusBadge from '../ui/StatusBadge'
import { createFinancialContext } from './financialContext'

const FinancialContextBar = ({ period, lockState, source, integration, label = 'Financial processing context' }) => {
    const context = createFinancialContext({ period, lockState, source, integration })
    const items = [
        { label: 'Working period', value: context.period, icon: CalendarRange },
        { label: 'Period state', value: context.lockState, icon: LockKeyhole, status: true },
        { label: 'Data source', value: context.source, icon: Database },
        { label: 'Integration', value: context.integration, icon: PlugZap, status: true },
    ]

    return (
        <aside className='mb-5 overflow-hidden rounded-[var(--erp-radius-surface)] border border-[var(--erp-line)] bg-white' aria-label={label}>
            <div className='border-b border-[var(--erp-line)] bg-[var(--erp-canvas)] px-4 py-2'>
                <p className='text-xs font-semibold uppercase tracking-[0.08em] text-[var(--erp-muted)]'>{label}</p>
            </div>
            <dl className='grid grid-cols-1 divide-y divide-[var(--erp-line)] sm:grid-cols-2 sm:divide-x sm:divide-y-0 xl:grid-cols-4'>
                {items.map(({ label: itemLabel, value, icon, status }) => (
                    <div key={itemLabel} className='flex min-w-0 items-center gap-3 px-4 py-3'>
                        <span className='inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-[var(--erp-indigo-soft)] text-[var(--erp-indigo)]'>
                            {createElement(icon, { 'aria-hidden': true, size: 16 })}
                        </span>
                        <div className='min-w-0'>
                            <dt className='text-xs text-[var(--erp-muted)]'>{itemLabel}</dt>
                            <dd className='mt-0.5 truncate text-sm font-semibold text-[var(--erp-ink)]'>
                                {status ? <StatusBadge status={value} /> : value}
                            </dd>
                        </div>
                    </div>
                ))}
            </dl>
        </aside>
    )
}

export default FinancialContextBar
