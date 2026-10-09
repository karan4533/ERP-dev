import React, { useMemo } from 'react'
import {
    BALANCE_BY_ROLE,
    OVERVIEW_SUMMARY,
    SPEND_CATEGORIES,
} from '../walletManagementData'
import { Panel, SummaryCards } from './WalletShared'
import { useFinance } from '../../financeDomain/FinanceContext'

const parseAmt = (value) => Number(String(value || '').replace(/[₹,\s]/g, '')) || 0

const WalletOverviewTab = () => {
    const { wallets, walletRecharges } = useFinance()
    const summary = useMemo(() => {
        const total = (wallets || []).reduce((sum, row) => sum + parseAmt(row.balance), 0)
        const active = (wallets || []).filter((row) => (row.status || 'Active') === 'Active').length
        return OVERVIEW_SUMMARY.map((card) => {
            if (/held|total/i.test(card.label)) {
                return { ...card, value: `₹${total.toLocaleString('en-IN')}`, sub: `across ${wallets?.length || 0} wallets` }
            }
            if (/active/i.test(card.label)) {
                return { ...card, value: String(active), sub: 'Active wallets' }
            }
            if (/recharge/i.test(card.label)) {
                return { ...card, value: String(walletRecharges?.length || 0), sub: 'Recharge records' }
            }
            return card
        })
    }, [wallets, walletRecharges])

    const byRole = useMemo(() => {
        const map = {}
        for (const row of wallets || []) {
            const role = row.role || 'Other'
            map[role] = (map[role] || 0) + parseAmt(row.balance)
        }
        const entries = Object.entries(map)
        if (!entries.length) return BALANCE_BY_ROLE
        const max = Math.max(...entries.map(([, amount]) => amount), 1)
        return entries.map(([label, amount]) => ({
            label,
            amount: `₹${amount.toLocaleString('en-IN')}`,
            value: Math.round((amount / max) * 100),
        }))
    }, [wallets])

    return (
    <div className='space-y-6'>
        <SummaryCards cards={summary} />

        <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
            <Panel title='Wallet balance by role'>
                <div className='space-y-4'>
                    {byRole.map((item) => (
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
}

export default WalletOverviewTab
