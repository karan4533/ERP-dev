import React, { useMemo, useState } from 'react'
import { useFinance } from '../../financeDomain/FinanceContext'
import { buildTransactionTimeline } from '../../financeDomain/financeLiveViews'

const TIMELINE_DOT = {
    in: 'bg-[#4CAF50]',
    out: 'bg-[#FF5722]',
}

const TransactionTimelineTab = () => {
    const { transactions } = useFinance()
    const [filter, setFilter] = useState('all')
    const rows = useMemo(() => {
        const all = buildTransactionTimeline(transactions || [], 60)
        if (filter === 'in') return all.filter((row) => row.type === 'in')
        if (filter === 'out') return all.filter((row) => row.type === 'out')
        return all
    }, [transactions, filter])

    return (
        <div className='space-y-6'>
            <div className='flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4'>
                <div>
                    <h3 className='text-base font-semibold text-[#1E1E1E]'>Combined transaction timeline</h3>
                    <p className='text-sm text-[#667085] mt-1'>
                        Campus finance snapshot — posted and recorded money in/out
                    </p>
                </div>
                <div className='flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3'>
                    <select
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        className='text-sm border border-[#D9D9D9] rounded-md px-3 py-2 min-w-[150px]'
                    >
                        <option value='all'>All Transactions</option>
                        <option value='in'>Money In</option>
                        <option value='out'>Money Out</option>
                    </select>
                </div>
            </div>

            <div className='bg-white rounded-2xl shadow-md p-4'>
                {rows.length === 0 ? (
                    <p className='py-10 text-center text-sm text-[#667085]'>
                        No transactions in the finance snapshot yet. Collect fees or post vouchers to populate this timeline.
                    </p>
                ) : (
                    <div className='space-y-0'>
                        {rows.map((item, index) => (
                            <div
                                key={item.id}
                                className={`flex gap-3 py-4 ${index < rows.length - 1 ? 'border-b border-[#F2F4F7]' : ''}`}
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
                )}
            </div>
        </div>
    )
}

export default TransactionTimelineTab
