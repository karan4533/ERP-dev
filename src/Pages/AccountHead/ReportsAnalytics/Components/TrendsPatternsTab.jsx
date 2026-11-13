import React from 'react'
import { TRENDS_SUMMARY, YEAR_ON_YEAR } from '../reportsAnalyticsData'
import { FlowBars, Panel, SummaryCards } from './ReportsShared'

const TrendsPatternsTab = () => (
    <div className='space-y-6'>
        <SummaryCards cards={TRENDS_SUMMARY} />

        <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
            <Panel title='Year-on-year comparison'>
                <FlowBars items={YEAR_ON_YEAR} />
            </Panel>

            <Panel title='Pattern observations'>
                <p className='text-sm text-[#667085] leading-relaxed mb-3'>
                    Fee collection consistently peaks in
                    {' '}
                    <span className='font-semibold text-[#1E1E1E]'>April</span>
                    {' '}
                    and
                    {' '}
                    <span className='font-semibold text-[#1E1E1E]'>November</span>
                    , aligned with term due dates.
                </p>
                <p className='text-sm text-[#667085] leading-relaxed mb-3'>
                    Transport expenses rise
                    {' '}
                    <span className='font-semibold text-[#1E1E1E]'>~15%</span>
                    {' '}
                    during monsoon months (Jun–Aug) due to increased maintenance needs.
                </p>
                <p className='text-sm text-[#667085] leading-relaxed'>
                    Salary expense is the most stable line item, varying less than
                    {' '}
                    <span className='font-semibold text-[#1E1E1E]'>2%</span>
                    {' '}
                    month-to-month.
                </p>
            </Panel>
        </div>
    </div>
)

export default TrendsPatternsTab
