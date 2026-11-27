import React, { useMemo } from 'react'
import { FlowBars, Panel, SummaryCards } from './CollectionsShared'
import { useFinance } from '../../financeDomain/FinanceContext'
import { buildCashFlowSummary } from '../../financeDomain/financeLiveViews'

const CashFlowTrendsTab = () => {
    const { transactions } = useFinance()
    const summary = useMemo(() => buildCashFlowSummary(transactions || []), [transactions])

    return (
        <div className='space-y-6'>
            <SummaryCards cards={summary.cards} />

            <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
                <Panel title='Spending pattern by category (snapshot)'>
                    {summary.spending.length ? (
                        <FlowBars items={summary.spending} />
                    ) : (
                        <p className='text-sm text-[#667085] py-6 text-center'>No posted outflow yet.</p>
                    )}
                </Panel>

                <Panel title='Collection highs & lows (last 6 months)'>
                    <p className='text-sm text-[#667085] leading-relaxed'>
                        Derived from posted finance transactions on the campus snapshot — not a fixed April/July demo story.
                    </p>
                    <div className='mt-6 pt-4 border-t border-[#F2F4F7] space-y-3'>
                        <div className='flex items-center justify-between text-sm'>
                            <span className='text-[#667085]'>Peak month (collections)</span>
                            <span className='font-semibold text-[#1E1E1E]'>{summary.peakLabel} · {summary.peakAmount}</span>
                        </div>
                        <div className='flex items-center justify-between text-sm'>
                            <span className='text-[#667085]'>Lowest month (collections)</span>
                            <span className='font-semibold text-[#1E1E1E]'>{summary.lowLabel} · {summary.lowAmount}</span>
                        </div>
                    </div>
                </Panel>
            </div>
        </div>
    )
}

export default CashFlowTrendsTab
