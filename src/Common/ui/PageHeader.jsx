import StatusBadge from './StatusBadge'

const PageHeader = ({ title, description, context, status, actions, meta, className = '' }) => (
    <header className={`mb-5 border-b border-[var(--erp-line)] pb-4 ${className}`}>
        <div className='flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between'>
            <div className='min-w-0'>
                <div className='flex flex-wrap items-center gap-2.5'>
                    <h2 className='text-2xl font-semibold tracking-[-0.02em] text-[var(--erp-ink)] sm:text-[1.75rem]'>
                        {title}
                    </h2>
                    {status && <StatusBadge status={status} />}
                </div>
                {description && <p className='mt-1 max-w-3xl text-sm text-[var(--erp-slate)] sm:text-[0.9375rem]'>{description}</p>}
                {(context || meta) && (
                    <div className='mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[var(--erp-muted)]'>
                        {context && <span>{context}</span>}
                        {meta}
                    </div>
                )}
            </div>
            {actions && <div className='flex shrink-0 flex-wrap items-center gap-2'>{actions}</div>}
        </div>
    </header>
)

export default PageHeader
