import { CircleAlert, FileQuestion, LoaderCircle, ShieldAlert } from 'lucide-react'
import { getFeedbackState } from './feedback'
import { getStatusTone } from './tokens'

const ICONS = {
    loading: LoaderCircle,
    empty: FileQuestion,
    error: CircleAlert,
    permission: ShieldAlert,
}

const FeedbackState = ({ kind = 'empty', title, description, action, compact = false, className = '' }) => {
    const feedback = getFeedbackState(kind, { ...(title && { title }), ...(description && { description }) })
    const tone = getStatusTone(feedback.tone)
    const Icon = ICONS[feedback.kind] || FileQuestion

    return (
        <section
            className={`flex flex-col items-center justify-center rounded-[var(--erp-radius-surface)] border border-dashed border-[var(--erp-line-strong)] bg-white px-5 text-center ${compact ? 'min-h-40 py-7' : 'min-h-64 py-10'} ${className}`}
            role={feedback.role}
            aria-live={feedback.kind === 'loading' ? 'polite' : undefined}
        >
            <span
                className='mb-3 inline-flex size-10 items-center justify-center rounded-full'
                style={{ color: tone.foreground, backgroundColor: tone.background }}
            >
                <Icon
                    aria-hidden='true'
                    size={20}
                    className={feedback.kind === 'loading' ? 'animate-spin motion-reduce:animate-none' : ''}
                />
            </span>
            <h2 className='text-base font-semibold text-[var(--erp-ink)]'>{feedback.title}</h2>
            <p className='mt-1 max-w-xl text-sm text-[var(--erp-slate)]'>{feedback.description}</p>
            {action && <div className='mt-4'>{action}</div>}
        </section>
    )
}

export default FeedbackState
