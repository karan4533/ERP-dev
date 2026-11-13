import React from 'react'
import {
    CASH_FLOW_SUMMARY,
    SPENDING_PATTERN,
} from '../collectionsData'
import { FlowBars, Panel, SummaryCards } from './CollectionsShared'

const CashFlowTrendsTab = () => (
    <div className='space-y-6'>
        <SummaryCards cards={CASH_FLOW_SUMMARY} />

        <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
            <Panel title='Spending pattern by category (6-month avg.)'>
                <FlowBars
                    items={SPENDING_PATTERN.map((item) => ({
                        label: item.label,
                        amount: item.percent,
                        value: item.value,
                        tone: 'out',
                    }))}
                />
            </Panel>

            <Panel title='Seasonal collection pattern'>
                <p className='text-sm text-[#667085] leading-relaxed'>
                    Collections peak in
                    {' '}
                    <span className='font-semibold text-[#1E1E1E]'>April–May</span>
                    {' '}
                    (Term 1 due dates) and
                    {' '}
                    <span className='font-semibold text-[#1E1E1E]'>November</span>
                    {' '}
                    (Term 2). Expect a dip in collection rate during
                    {' '}
                    <span className='font-semibold text-[#1E1E1E]'>June–July</span>
                    {' '}
                    as new-admission processing overlaps with due reminders.
                </p>
                <div className='mt-6 pt-4 border-t border-[#F2F4F7] space-y-3'>
                    <div className='flex items-center justify-between text-sm'>
                        <span className='text-[#667085]'>Peak month (collections)</span>
                        <span className='font-semibold text-[#1E1E1E]'>April · ₹48.2L</span>
                    </div>
                    <div className='flex items-center justify-between text-sm'>
                        <span className='text-[#667085]'>Lowest month (collections)</span>
                        <span className='font-semibold text-[#1E1E1E]'>July · ₹19.6L</span>
                    </div>
                </div>
            </Panel>
        </div>
    </div>
)

export default CashFlowTrendsTab
