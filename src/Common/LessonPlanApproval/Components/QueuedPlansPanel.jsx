import React from 'react'
import { Pencil, Trash2 } from 'lucide-react'

const QueuedPlansPanel = ({ queuedPlans, onEdit, onRemove }) => {
    if (!queuedPlans.length) return null

    return (
        <div className='mt-8 border border-[#E8ECFF] rounded-xl p-4 bg-[#515DEF05]'>
            <div className='flex justify-between items-center mb-4'>
                <h3 className='text-base font-semibold text-[#1E1E1E]'>
                    Queued plans ({queuedPlans.length})
                </h3>
            </div>
            <div className='space-y-3'>
                {queuedPlans.map((plan, index) => (
                    <div
                        key={`${plan.title}-${plan.fromDate}-${index}`}
                        className='flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-[#E4E7EC] rounded-lg px-4 py-3 bg-white'
                    >
                        <div className='min-w-0'>
                            <p className='text-sm font-medium text-[#1E1E1E]'>{plan.title}</p>
                            <p className='text-xs text-[#667085] mt-1'>
                                {plan.fromDate} → {plan.toDate}
                            </p>
                        </div>
                        <div className='flex items-center gap-3 shrink-0'>
                            <button
                                type='button'
                                onClick={() => onEdit(index)}
                                className='inline-flex items-center gap-1 text-sm text-[#515DEF] hover:underline cursor-pointer'
                            >
                                <Pencil size={14} />
                                Edit
                            </button>
                            <button
                                type='button'
                                onClick={() => onRemove(index)}
                                className='inline-flex items-center gap-1 text-sm text-red-500 hover:text-red-600 cursor-pointer'
                            >
                                <Trash2 size={14} />
                                Remove
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

export default QueuedPlansPanel
