import React from 'react'
import { X } from 'lucide-react'
import { clearFilterChip, getFilterChipItems } from '../lessonPlanApprovalData'

const FilterChips = ({ filters, onFiltersChange }) => {
    const chips = getFilterChipItems(filters)
    if (!chips.length) return null

    return (
        <div className='flex flex-wrap items-center gap-2 mb-4'>
            <span className='text-xs font-medium text-[#808080] uppercase tracking-wide'>Active filters</span>
            {chips.map((chip) => (
                <button
                    key={chip.key}
                    type='button'
                    onClick={() => onFiltersChange(clearFilterChip(filters, chip.key))}
                    className='inline-flex items-center gap-1.5 rounded-full border border-[#515DEF33] bg-[#515DEF08] px-3 py-1 text-xs font-medium text-[#515DEF] hover:bg-[#515DEF15] transition-colors cursor-pointer'
                >
                    {chip.label}
                    <X size={12} />
                </button>
            ))}
        </div>
    )
}

export default FilterChips
