import { Check, Clock3 } from 'lucide-react'
import { useId } from 'react'
import { getStatusTone } from './tokens'

const formatTimelineDate = (value) => {
    if (!value) return 'Time not recorded'
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return 'Time not recorded'
    return new Intl.DateTimeFormat('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(date)
}

const WorkflowTimeline = ({
    events = [],
    title = 'Workflow activity',
    description = 'Recorded steps for this request.',
    className = '',
}) => {
    const titleId = `workflow-timeline-${useId().replace(/:/g, '')}`

    return (
    <section className={`rounded-[var(--erp-radius-surface)] border border-[var(--erp-line)] bg-white ${className}`} aria-labelledby={titleId}>
        <div className='border-b border-[var(--erp-line)] px-4 py-3.5 sm:px-5'>
            <h2 id={titleId} className='text-base font-semibold text-[var(--erp-ink)]'>{title}</h2>
            <p className='mt-0.5 text-sm text-[var(--erp-slate)]'>{description}</p>
        </div>
        <ol className='px-4 py-2 sm:px-5'>
            {events.map((event, index) => {
                const tone = getStatusTone(event.tone)
                const isLast = index === events.length - 1
                return (
                    <li key={event.id || `${event.label}-${index}`} className='relative grid grid-cols-[2rem_minmax(0,1fr)] gap-3 py-3' aria-current={event.current ? 'step' : undefined}>
                        {!isLast && <span className='absolute bottom-[-0.75rem] left-[0.9375rem] top-[2.5rem] w-px bg-[var(--erp-line-strong)]' aria-hidden='true' />}
                        <span
                            className='relative z-10 inline-flex size-8 items-center justify-center rounded-full border bg-white'
                            style={{ color: tone.foreground, borderColor: tone.border }}
                            aria-hidden='true'
                        >
                            {event.current ? <Clock3 size={15} /> : <Check size={15} />}
                        </span>
                        <div className='min-w-0 pt-0.5'>
                            <div className='flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1'>
                                <p className='font-semibold text-[var(--erp-ink)]'>{event.label}</p>
                                <time className='text-xs text-[var(--erp-muted)]' dateTime={event.timestamp || undefined}>{formatTimelineDate(event.timestamp)}</time>
                            </div>
                            {event.actor && <p className='mt-0.5 text-sm text-[var(--erp-slate)]'>Owner: {event.actor}</p>}
                            {event.description && <p className='mt-2 rounded-md border-l-2 border-[var(--erp-line-strong)] bg-[var(--erp-canvas)] px-3 py-2 text-sm text-[var(--erp-slate)]'>{event.description}</p>}
                        </div>
                    </li>
                )
            })}
        </ol>
    </section>
    )
}

export default WorkflowTimeline

