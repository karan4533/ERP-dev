import { createElement } from 'react'
import { AlertTriangle, CheckCircle2, Clock3, FileSearch, ShieldAlert, Target } from 'lucide-react'
import { getExecutiveFindingSummary } from './auditGovernanceState'

const cards = [
    { key: 'total', label: 'Total findings', icon: FileSearch },
    { key: 'criticalOpen', label: 'Critical open', icon: ShieldAlert },
    { key: 'overdue', label: 'Overdue', icon: Clock3 },
    { key: 'rcaPending', label: 'RCA pending', icon: AlertTriangle },
    { key: 'verificationPending', label: 'Awaiting verification', icon: Target },
    { key: 'closureRate', label: 'Closure rate', icon: CheckCircle2, suffix: '%' },
]

const ExecutiveFindingSummary = ({ findings = [] }) => {
    const summary = getExecutiveFindingSummary(findings)
    const criticalFindings = findings.filter((finding) => finding.severity === 'Critical' && finding.closureStatus !== 'Closed')

    return (
        <section className='rounded-[var(--erp-radius-surface)] border border-[var(--erp-line)] bg-white p-4 shadow-[var(--erp-shadow-subtle)]' aria-labelledby='executive-audit-summary-title'>
            <div className='flex flex-col gap-2 border-b border-[var(--erp-line)] pb-4 lg:flex-row lg:items-start lg:justify-between'>
                <div>
                    <p className='text-xs font-semibold uppercase tracking-[0.14em] text-[var(--erp-primary)]'>Executive brief</p>
                    <h3 id='executive-audit-summary-title' className='mt-1 text-xl font-semibold text-[var(--erp-ink)]'>Audit risk and closure summary</h3>
                    <p className='mt-1 max-w-3xl text-sm text-[var(--erp-slate)]'>Decision-ready summary designed for future permission assignment to the documented Managing Director role; it does not create a new authenticated role in this frontend.</p>
                </div>
                <span className='w-fit rounded-full border border-[var(--erp-line-strong)] bg-[var(--erp-canvas)] px-3 py-1 text-xs font-semibold text-[var(--erp-slate)]'>Current owner: Joint Director — Audit</span>
            </div>

            <dl className='mt-4 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6'>
                {cards.map(({ key, label, icon, suffix = '' }) => (
                    <div key={key} className='rounded-xl border border-[var(--erp-line)] bg-[var(--erp-canvas)] p-3'>
                        <div className='flex items-center justify-between gap-2 text-[var(--erp-muted)]'><dt className='text-xs font-semibold'>{label}</dt>{createElement(icon, { size: 16, 'aria-hidden': true })}</div>
                        <dd className='mt-2 text-2xl font-semibold text-[var(--erp-ink)]'>{summary[key]}{suffix}</dd>
                    </div>
                ))}
            </dl>

            <div className='mt-4 rounded-xl border border-red-200 bg-red-50 p-4'>
                <p className='text-sm font-semibold text-red-800'>Critical attention queue</p>
                {criticalFindings.length ? (
                    <ul className='mt-2 space-y-2'>
                        {criticalFindings.map((finding) => <li key={finding.id} className='text-sm text-red-900'><strong>{finding.id}</strong> · {finding.department} · {finding.title} · owner {finding.owner} · due {finding.dueDate}</li>)}
                    </ul>
                ) : <p className='mt-1 text-sm text-red-800'>No open critical findings in this dataset.</p>}
            </div>
        </section>
    )
}

export default ExecutiveFindingSummary
