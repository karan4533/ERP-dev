import { CheckCircle2, Clock3 } from 'lucide-react'
import StatusBadge from '../ui/StatusBadge'
import { formatApprovalDecisionTime } from './approvalHistory'

const ApprovalHistoryTimeline = ({ history = [], title = 'Approval history' }) => (
    <section className='rounded-[var(--erp-radius-surface)] border border-[var(--erp-line)] bg-white p-4' aria-labelledby='approval-history-title'>
        <div className='flex items-center justify-between gap-3'>
            <div>
                <h2 id='approval-history-title' className='text-base font-semibold text-[var(--erp-ink)]'>{title}</h2>
                <p className='mt-0.5 text-sm text-[var(--erp-slate)]'>A chronological record of submission and review decisions.</p>
            </div>
            <span className='text-xs font-medium text-[var(--erp-muted)]'>{history.length} event{history.length === 1 ? '' : 's'}</span>
        </div>

        {history.length ? (
            <ol className='mt-4 space-y-0'>
                {[...history].reverse().map((event, index) => (
                    <li key={event.id || `${event.status}-${event.decidedAt}-${index}`} className='relative flex gap-3 pb-5 last:pb-0'>
                        {index < history.length - 1 ? <span aria-hidden='true' className='absolute left-[0.6875rem] top-6 h-[calc(100%-1rem)] w-px bg-[var(--erp-line-strong)]' /> : null}
                        <span className='relative z-10 mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-[var(--erp-indigo-soft)] text-[var(--erp-indigo)]'>
                            {event.status === 'Approved' ? <CheckCircle2 aria-hidden='true' size={14} /> : <Clock3 aria-hidden='true' size={14} />}
                        </span>
                        <div className='min-w-0 flex-1'>
                            <div className='flex flex-wrap items-center gap-2'>
                                <StatusBadge status={event.status} />
                                <span className='text-sm font-semibold text-[var(--erp-ink)]'>{event.actor || 'System'}</span>
                                {event.actorRole ? <span className='text-xs text-[var(--erp-muted)]'>· {event.actorRole}</span> : null}
                            </div>
                            <time dateTime={event.decidedAt} className='mt-1 block text-xs text-[var(--erp-muted)]'>
                                {formatApprovalDecisionTime(event.decidedAt)}
                            </time>
                            {event.remarks ? <p className='mt-1.5 text-sm text-[var(--erp-slate)]'>{event.remarks}</p> : null}
                        </div>
                    </li>
                ))}
            </ol>
        ) : (
            <p className='mt-4 rounded-lg bg-[var(--erp-canvas)] p-3 text-sm text-[var(--erp-slate)]'>No decision history has been recorded for this submission.</p>
        )}
    </section>
)

export default ApprovalHistoryTimeline
