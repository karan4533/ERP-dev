import React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { PAGE_SIZE_OPTIONS, describePageRange, pageWindow } from '../listPagination'

/** Entries-per-page select bound to a `useListPagination` result. */
export const PageSizeSelect = ({ pagination, options = PAGE_SIZE_OPTIONS, className = '' }) => (
    <div className={`flex gap-x-2 items-center ${className}`}>
        <select
            value={pagination.pageSize}
            onChange={(e) => pagination.setPageSize(Number(e.target.value))}
            className='px-2 py-1.5 bg-white text-[#515DEF] border border-[#515DEF] rounded-md'
        >
            {options.map((n) => (
                <option key={n} value={n}>{n}</option>
            ))}
        </select>
        <span className='text-sm font-normal text-[#515DEF]'>Entries Per Page</span>
    </div>
)

const navButton =
    'size-8 flex justify-center items-center p-2 bg-white text-[#515DEF] border border-[#E2E8F0] hover:bg-[#515DEF] hover:text-white rounded-full cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-[#515DEF]'

/**
 * Footer for client-side paginated lists: "Showing a to b of n", prev / page numbers / next.
 * Set `showPageSize` when the page has no Entries Per Page select of its own.
 */
const ListPagination = ({ pagination, showPageSize = false, pageSizeOptions = PAGE_SIZE_OPTIONS, className = '' }) => {
    if (!pagination) return null
    const { page, totalPages, hasPrev, hasNext, setPage } = pagination
    return (
        <div className={`flex justify-between items-center gap-y-2 flex-wrap px-4 mt-4 ${className}`}>
            <div className='flex items-center gap-x-4 flex-wrap gap-y-2'>
                {showPageSize ? <PageSizeSelect pagination={pagination} options={pageSizeOptions} /> : null}
                <p className='text-sm font-medium text-[#515DEF]'>{describePageRange(pagination)}</p>
            </div>
            <div className='flex justify-center gap-x-2 flex-wrap'>
                <button type='button' aria-label='Previous page' disabled={!hasPrev} onClick={() => setPage(page - 1)} className={navButton}>
                    <ChevronLeft size={16} />
                </button>
                {pageWindow(page, totalPages).map((n) => (
                    <button
                        key={n}
                        type='button'
                        aria-current={n === page ? 'page' : undefined}
                        onClick={() => setPage(n)}
                        className={n === page
                            ? 'size-8 flex justify-center items-center p-2 bg-[#515DEF] text-white border border-[#515DEF] rounded-full cursor-pointer'
                            : navButton}
                    >
                        {n}
                    </button>
                ))}
                <button type='button' aria-label='Next page' disabled={!hasNext} onClick={() => setPage(page + 1)} className={navButton}>
                    <ChevronRight size={16} />
                </button>
            </div>
        </div>
    )
}

export default ListPagination
