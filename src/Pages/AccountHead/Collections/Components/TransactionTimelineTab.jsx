import React from 'react'
import { TRANSACTION_TIMELINE } from '../collectionsData'

const TIMELINE_DOT = {
    in: 'bg-[#4CAF50]',
    out: 'bg-[#FF5722]',
}

const TransactionTimelineTab = () => (
    <div className='space-y-6'>
        <div className='flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4'>
            <div>
                <h3 className='text-base font-semibold text-[#1E1E1E]'>Combined transaction timeline</h3>
                <p className='text-sm text-[#667085] mt-1'>
                    All incoming & outgoing money, in chronological order
                </p>
            </div>
            <div className='flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3'>
                <select className='text-sm border border-[#D9D9D9] rounded-md px-3 py-2 min-w-[150px]'>
                    <option>All Transactions</option>
                    <option>Money In</option>
                    <option>Money Out</option>
                </select>
                <input type='date' className='text-sm border border-[#D9D9D9] rounded-md px-3 py-2 min-w-[140px]' />
            </div>
        </div>

        <div className='bg-white rounded-2xl shadow-md p-4'>
            <div className='space-y-0'>
                {TRANSACTION_TIMELINE.map((item, index) => (
                    <div
                        key={item.id}
                        className={`flex gap-3 py-4 ${index < TRANSACTION_TIMELINE.length - 1 ? 'border-b border-[#F2F4F7]' : ''}`}
                    >
                        <span className={`size-2 rounded-full mt-2 shrink-0 ${TIMELINE_DOT[item.type]}`} />
                        <div className='flex flex-1 items-start justify-between gap-4 min-w-0'>
                            <div>
                                <p className='text-sm font-medium text-[#1E1E1E]'>{item.title}</p>
                                <p className='text-xs text-[#667085] mt-1'>{item.meta}</p>
                            </div>
                            <p className={`text-sm font-semibold shrink-0 ${
                                item.type === 'in' ? 'text-[#4CAF50]' : 'text-[#FF5722]'
                            }`}>
                                {item.amount}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    </div>
)

export default TransactionTimelineTab
