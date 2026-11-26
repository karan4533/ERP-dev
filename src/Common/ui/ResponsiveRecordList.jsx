const ResponsiveRecordList = ({ rows, columns, getRowKey, renderActions }) => (
    <div className='divide-y divide-[var(--erp-line)] md:hidden'>
        {rows.map((row, index) => (
            <article key={getRowKey(row, index)} className='px-4 py-4'>
                <dl className='grid grid-cols-[minmax(7rem,0.45fr)_minmax(0,1fr)] gap-x-3 gap-y-2 text-sm'>
                    {columns.map((column) => (
                        <div key={column.key} className='contents'>
                            <dt className='text-[var(--erp-muted)]'>{column.label}</dt>
                            <dd className='min-w-0 break-words font-medium text-[var(--erp-ink)]'>{column.render ? column.render(row, index) : (row[column.key] ?? '—')}</dd>
                        </div>
                    ))}
                </dl>
                {renderActions && <div className='mt-3 flex flex-wrap gap-2 border-t border-[var(--erp-line)] pt-3'>{renderActions(row, index)}</div>}
            </article>
        ))}
    </div>
)

export default ResponsiveRecordList
