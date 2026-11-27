import React, { useMemo } from 'react'
import { Panel, SummaryCards } from './WalletShared'
import { useFinance } from '../../financeDomain/FinanceContext'
import { formatCurrency } from '../../financeDomain/financeHelpers'
import { SOURCE_MODULES } from '../../financeDomain/financeConstants'
import { buildMoneyFlowSources } from '../../financeDomain/financeLiveViews'

const parseAmt = (value) => Number(String(value || '').replace(/[₹,\s]/g, '')) || 0

const WalletOverviewTab = () => {
    const { wallets, walletRecharges, transactions } = useFinance()

    const summary = useMemo(() => {
        const total = (wallets || []).reduce((sum, row) => sum + parseAmt(row.balance), 0)
        const active = (wallets || []).filter((row) => (row.status || 'Active') === 'Active').length
        const rechargeTotal = (walletRecharges || []).reduce((sum, row) => sum + parseAmt(row.amount), 0)
        const spent = (transactions || [])
            .filter((row) => row.direction === 'OUT' && (
                row.sourceModule === SOURCE_MODULES.WALLET
                || String(row.category || '').toLowerCase().includes('wallet')
            ))
            .reduce((sum, row) => sum + (Number(row.amount) || 0), 0)
        return [
            {
                label: 'Total Held in Wallets',
                value: formatCurrency(total),
                sub: `across ${wallets?.length || 0} wallets`,
                iconTone: 'info',
            },
            {
                label: 'Active Wallets',
                value: String(active),
                sub: 'Active status',
                subTone: 'success',
                iconTone: 'success',
            },
            {
                label: 'Recharges (snapshot)',
                value: formatCurrency(rechargeTotal),
                sub: `${walletRecharges?.length || 0} records`,
                iconTone: 'success',
            },
            {
                label: 'Wallet spend (snapshot)',
                value: formatCurrency(spent),
                sub: 'OUT · wallet source',
                iconTone: 'warning',
            },
        ]
    }, [transactions, wallets, walletRecharges])

    const byRole = useMemo(() => {
        const map = {}
        for (const row of wallets || []) {
            const role = row.role || 'Other'
            map[role] = (map[role] || 0) + parseAmt(row.balance)
        }
        const entries = Object.entries(map)
        if (!entries.length) return []
        const max = Math.max(...entries.map(([, amount]) => amount), 1)
        return entries.map(([label, amount]) => ({
            label,
            amount: formatCurrency(amount),
            value: Math.round((amount / max) * 100),
        }))
    }, [wallets])

    const spendCategories = useMemo(() => {
        const walletTxns = (transactions || []).filter((row) => (
            row.direction === 'OUT'
            && (
                row.sourceModule === SOURCE_MODULES.WALLET
                || String(row.category || '').toLowerCase().includes('wallet')
            )
        ))
        const bars = buildMoneyFlowSources(walletTxns).moneyOut
        return bars.map((item) => ({
            label: item.label,
            amount: item.amount,
            percent: `${item.value}%`,
        }))
    }, [transactions])

    return (
        <div className='space-y-6'>
            <SummaryCards cards={summary} />

            <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
                <Panel title='Wallet balance by role'>
                    {byRole.length ? (
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
                    ) : (
                        <p className='text-sm text-[#667085] py-6 text-center'>
                            No wallets on the finance snapshot yet. Use Recharge Wallet or sync student wallets.
                        </p>
                    )}
                </Panel>

                <Panel title='Spend categories (snapshot)'>
                    {spendCategories.length ? (
                        <div className='space-y-3'>
                            {spendCategories.map((item) => (
                                <div key={item.label} className='flex items-center justify-between text-sm'>
                                    <span className='text-[#667085]'>{item.label}</span>
                                    <span className='font-semibold text-[#1E1E1E]'>
                                        {item.amount}
                                        <span className='text-xs font-normal text-[#667085] ml-1'>({item.percent})</span>
                                    </span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className='text-sm text-[#667085] py-6 text-center'>
                            No wallet OUT transactions on the snapshot yet.
                        </p>
                    )}
                </Panel>
            </div>
        </div>
    )
}

export default WalletOverviewTab
