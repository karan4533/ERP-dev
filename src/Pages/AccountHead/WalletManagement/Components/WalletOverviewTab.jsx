import React from 'react'
import {
    BALANCE_BY_ROLE,
    OVERVIEW_SUMMARY,
    SPEND_CATEGORIES,
} from '../walletManagementData'
import { Panel, SummaryCards } from './WalletShared'

const WalletOverviewTab = () => (
    <div className='space-y-6'>
        <SummaryCards cards={OVERVIEW_SUMMARY} />

        <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
            <Panel title='Wallet balance by role'>
                <div className='space-y-4'>
                    {BALANCE_BY_ROLE.map((item) => (
                        <div key={item.label}>
                            <div className='flex items-center justify-between text-sm mb-1.5'>
                                <span className='text-[#667085]'>{item.label}</span>
                                <span className='font-semibold text-[#1E1E1E]'>{item.amount}</span>
                            </div>
                            <div className='h-2 rounded-full bg-[#EDEEF5] overflow-hidden'>
                                <div
                                    className='h-full rounded-full bg-[#515DEF]'
                                    style={{ width: `${item.value}%` }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </Panel>

            <Panel title='Spend categories (this month)'>
                <div className='space-y-3'>
                    {SPEND_CATEGORIES.map((item) => (
                        <div key={item.label} className='flex items-center justify-between text-sm'>
                            <span className='text-[#667085]'>{item.label}</span>
                            <span className='font-semibold text-[#1E1E1E]'>
                                {item.amount}
                                <span className='text-xs font-normal text-[#667085] ml-1'>({item.percent})</span>
                            </span>
                        </div>
                    ))}
                </div>
            </Panel>
        </div>
    </div>
)

export default WalletOverviewTab
