const Surface = ({
    as: Component = 'section',
    title,
    description,
    actions,
    children,
    className = '',
    contentClassName = '',
}) => (
    <Component className={`overflow-hidden rounded-[var(--erp-radius-surface)] border border-[var(--erp-line)] bg-white ${className}`}>
        {(title || description || actions) && (
            <div className='flex flex-col gap-3 border-b border-[var(--erp-line)] px-4 py-3.5 sm:flex-row sm:items-start sm:justify-between sm:px-5'>
                <div className='min-w-0'>
                    {title && <h2 className='text-base font-semibold text-[var(--erp-ink)]'>{title}</h2>}
                    {description && <p className='mt-0.5 max-w-3xl text-sm text-[var(--erp-slate)]'>{description}</p>}
                </div>
                {actions && <div className='flex shrink-0 flex-wrap items-center gap-2'>{actions}</div>}
            </div>
        )}
        <div className={contentClassName}>{children}</div>
    </Component>
)

export default Surface
