import { ChevronLeft, ChevronRight } from 'lucide-react'

const Pagination = ({ page, pageCount, pageSize, total, from, to, onPageChange, onPageSizeChange, pageSizeOptions = [10, 25, 50, 100] }) => (
    <nav className='flex flex-col gap-3 border-t border-[var(--erp-line)] px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5' aria-label='Table pagination'>
        <div className='flex items-center gap-2 text-sm text-[var(--erp-slate)]'>
            <span>{from}–{to} of {total}</span>
            <label className='inline-flex items-center gap-2'>
                <span className='sr-only'>Rows per page</span>
                <select value={pageSize} onChange={(event) => onPageSizeChange?.(Number(event.target.value))} className='min-h-9 rounded-md border border-[var(--erp-line-strong)] bg-white px-2 text-sm'>
                    {pageSizeOptions.map((size) => <option key={size} value={size}>{size} / page</option>)}
                </select>
            </label>
        </div>
        <div className='flex items-center gap-2'>
            <button type='button' onClick={() => onPageChange?.(page - 1)} disabled={page <= 1} className='inline-flex min-h-9 items-center gap-1 rounded-md border border-[var(--erp-line-strong)] px-2.5 text-sm font-semibold disabled:opacity-45'>
                <ChevronLeft aria-hidden='true' size={15} /> Previous
            </button>
            <span className='px-2 text-sm text-[var(--erp-slate)]'>Page {page} of {pageCount}</span>
            <button type='button' onClick={() => onPageChange?.(page + 1)} disabled={page >= pageCount} className='inline-flex min-h-9 items-center gap-1 rounded-md border border-[var(--erp-line-strong)] px-2.5 text-sm font-semibold disabled:opacity-45'>
                Next <ChevronRight aria-hidden='true' size={15} />
            </button>
        </div>
    </nav>
)

export default Pagination
