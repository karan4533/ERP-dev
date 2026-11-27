import React, { useMemo } from 'react'
import { FlowBars, Panel, SummaryCards } from './ReportsShared'
import { useFinance } from '../../financeDomain/FinanceContext'
import { buildTrendsFromTransactions } from '../../financeDomain/financeLiveViews'

const TrendsPatternsTab = () => {
    const { transactions, financePersistence } = useFinance()
    const apiLive = Boolean(financePersistence?.apiEnabled)
    const trends = useMemo(
        () => buildTrendsFromTransactions(transactions || []),
        [transactions],
    )

    return (
        <div className='space-y-6'>
            <p className='text-sm text-[#667085]'>
                {apiLive
                    ? 'Cards, year-on-year bars, and observations are derived from posted snapshot transactions.'
                    : 'Derived from posted local transactions when present.'}
            </p>
            <SummaryCards cards={trends.cards} />

            <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
                <Panel title='Year-on-year comparison'>
                    {trends.yearOnYear.length === 0 ? (
                        <p className='text-sm text-[#667085]'>No posted years on the finance snapshot yet.</p>
                    ) : (
                        <FlowBars items={trends.yearOnYear} />
                    )}
                </Panel>

                <Panel title='Pattern observations'>
                    {trends.observations.map((text) => (
                        <p key={text} className='text-sm text-[#667085] leading-relaxed mb-3 last:mb-0'>
                            {text}
                        </p>
                    ))}
                </Panel>
            </div>
        </div>
    )
}

export default TrendsPatternsTab
