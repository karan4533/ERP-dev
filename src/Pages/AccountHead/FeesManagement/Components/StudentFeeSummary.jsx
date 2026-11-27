import React from 'react'
import { formatCurrency } from '../../financeDomain/financeHelpers'

const StudentFeeSummary = ({ summary, nextDue }) => {
    if (!summary) return null

    const cards = [
        { label: 'Total Fee', value: summary.totalFee },
        { label: 'Concession', value: summary.totalConcession },
        { label: 'Fine', value: summary.totalFine },
        { label: 'Net Payable', value: summary.netPayable, emphasize: true },
        { label: 'Paid', value: summary.paid, tone: 'success' },
        { label: 'Outstanding', value: summary.outstanding, tone: 'danger' },
    ]

    return (
        <div className='space-y-3'>
            <div className='grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3'>
                {cards.map((card) => (
                    <div key={card.label} className='bg-white rounded-2xl shadow-md p-4'>
                        <p className='text-xs text-[#808080]'>{card.label}</p>
                        <p className={`text-lg font-semibold mt-1 ${
                            card.tone === 'success'
                                ? 'text-[#4CAF50]'
                                : card.tone === 'danger'
                                    ? 'text-[#FF5722]'
                                    : card.emphasize
                                        ? 'text-[#515DEF]'
                                        : 'text-[#1E1E1E]'
                        }`}>
                            {formatCurrency(card.value)}
                        </p>
                    </div>
                ))}
            </div>
            {nextDue?.dueDate && (
                <p className='text-sm text-[#667085] px-1'>
                    Next payment due{' '}
                    <span className='font-medium text-[#1E1E1E]'>{nextDue.dueDate}</span>
                    {nextDue.balanceAmount != null && (
                        <> · {formatCurrency(nextDue.balanceAmount)}</>
                    )}
                </p>
            )}
        </div>
    )
}

export default StudentFeeSummary
