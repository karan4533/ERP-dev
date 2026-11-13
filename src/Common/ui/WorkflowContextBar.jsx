const WorkflowContextBar = ({ owner, due, nextAction, priority, className = '' }) => {
    const items = [
        ['Owner', owner],
        ['Due', due],
        ['Priority', priority],
        ['Next action', nextAction],
    ].filter(([, value]) => value)

    return (
        <dl className={`grid overflow-hidden rounded-[var(--erp-radius-surface)] border border-[var(--erp-line)] bg-white sm:grid-cols-2 xl:grid-cols-4 ${className}`}>
            {items.map(([label, value]) => (
                <div key={label} className='border-b border-[var(--erp-line)] px-4 py-3 last:border-b-0 sm:[&:nth-last-child(-n+2)]:border-b-0 xl:border-b-0 xl:border-r xl:last:border-r-0'>
                    <dt className='text-xs font-medium text-[var(--erp-muted)]'>{label}</dt>
                    <dd className='mt-1 text-sm font-semibold text-[var(--erp-ink)]'>{value}</dd>
                </div>
            ))}
        </dl>
    )
}

export default WorkflowContextBar

