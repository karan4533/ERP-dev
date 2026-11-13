import { getStatusTone } from './tokens'

const StatusBadge = ({ status, label, className = '' }) => {
    const tone = getStatusTone(status)
    const visibleLabel = label ?? status ?? 'Not set'

    return (
        <span
            className={`inline-flex min-h-6 items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-semibold leading-5 ${className}`}
            style={{
                color: tone.foreground,
                backgroundColor: tone.background,
                borderColor: tone.border,
            }}
        >
            <span className='size-1.5 rounded-full bg-current' aria-hidden='true' />
            {visibleLabel}
        </span>
    )
}

export default StatusBadge
