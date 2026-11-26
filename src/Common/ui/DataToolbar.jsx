import { RotateCcw, Search } from 'lucide-react'

const DataToolbar = ({
    query = '',
    onQueryChange,
    searchLabel = 'Search records',
    searchPlaceholder = 'Search…',
    filters,
    actions,
    onReset,
    resultCount,
    className = '',
}) => (
    <div className={`border-b border-[var(--erp-line)] bg-white px-4 py-4 sm:px-5 ${className}`}>
        <div className='flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between'>
            <div className='flex min-w-0 flex-1 flex-col gap-3 md:flex-row md:flex-wrap md:items-end'>
                <label className='min-w-0 flex-1 md:max-w-sm'>
                    <span className='sr-only'>{searchLabel}</span>
                    <span className='relative block'>
                        <Search aria-hidden='true' className='absolute left-3 top-1/2 -translate-y-1/2 text-[var(--erp-muted)]' size={16} />
                        <input
                            type='search'
                            value={query}
                            onChange={(event) => onQueryChange?.(event.target.value)}
                            placeholder={searchPlaceholder}
                            className='min-h-10 w-full rounded-lg border border-[var(--erp-line-strong)] bg-white py-2 pl-9 pr-3 text-sm text-[var(--erp-ink)]'
                        />
                    </span>
                </label>
                {filters}
                {onReset && (
                    <button type='button' onClick={onReset} className='inline-flex min-h-10 items-center justify-center gap-2 rounded-lg px-3 text-sm font-semibold text-[var(--erp-indigo)] hover:bg-[#F1F2FF]'>
                        <RotateCcw aria-hidden='true' size={15} /> Reset
                    </button>
                )}
            </div>
            {actions && <div className='flex flex-wrap items-center gap-2'>{actions}</div>}
        </div>
        {Number.isFinite(resultCount) && <p className='mt-3 text-xs text-[var(--erp-muted)]' aria-live='polite'>{resultCount} matching record{resultCount === 1 ? '' : 's'}</p>}
    </div>
)

export default DataToolbar
