import React from 'react'
import { X } from 'lucide-react'
import { formatCurrency } from '../../financeDomain/financeHelpers'

const SiblingFeesDrawer = ({
    isOpen,
    onClose,
    currentStudent,
    siblings,
    summaries,
    selectedIds,
    onToggle,
    onApply,
}) => {
    if (!isOpen) return null

    return (
        <div className='fixed inset-0 z-50 flex justify-end'>
            <div className='absolute inset-0 bg-black/40' onClick={onClose} aria-hidden='true' />
            <div className='relative z-10 w-full max-w-md h-full bg-white shadow-xl p-5 overflow-y-auto'>
                <div className='flex items-center justify-between mb-4'>
                    <h3 className='text-lg font-semibold text-[#1E1E1E]'>Sibling fees</h3>
                    <button type='button' onClick={onClose} className='text-[#667085] hover:text-[#FF5722] cursor-pointer' aria-label='Close'>
                        <X size={20} />
                    </button>
                </div>
                <p className='text-sm text-[#667085] mb-4'>
                    {currentStudent?.name} has {siblings.length} sibling{siblings.length === 1 ? '' : 's'}.
                    Select dues only if you intend to collect them now — nothing is auto-selected.
                </p>
                <div className='space-y-3'>
                    {siblings.map((sibling) => {
                        const summary = summaries[sibling.id] || { outstanding: 0 }
                        const checked = selectedIds.includes(sibling.id)
                        return (
                            <label key={sibling.id} className='flex items-start gap-3 rounded-xl border border-[#EDEEF5] p-3 cursor-pointer'>
                                <input
                                    type='checkbox'
                                    className='mt-1 accent-[#515DEF]'
                                    checked={checked}
                                    onChange={() => onToggle(sibling.id)}
                                />
                                <div className='flex-1'>
                                    <p className='font-medium text-[#1E1E1E]'>{sibling.name}</p>
                                    <p className='text-xs text-[#667085]'>{sibling.className}-{sibling.section} · {sibling.admissionNo}</p>
                                    <p className='text-sm mt-1'>Outstanding <span className='font-semibold text-[#FF5722]'>{formatCurrency(summary.outstanding)}</span></p>
                                </div>
                            </label>
                        )
                    })}
                </div>
                <button
                    type='button'
                    onClick={onApply}
                    className='mt-5 w-full bg-[#515DEF] text-white text-sm py-2.5 rounded-md cursor-pointer'
                >
                    Review selected siblings
                </button>
            </div>
        </div>
    )
}

export default SiblingFeesDrawer
