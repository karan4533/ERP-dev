import React, { useMemo } from 'react'
import { Search } from 'lucide-react'
import {
    SPENDING_HISTORY,
    spendCategoryBadgeColor,
} from '../walletManagementData'
import {
    RoleChip,
    SummaryCards,
    TableCard,
    TablePagination,
    UserAvatar,
    tdClass,
    thClass,
} from './WalletShared'
import { useFinance } from '../../financeDomain/FinanceContext'
import { formatCurrency, formatDisplayDate } from '../../financeDomain/financeHelpers'
import { SOURCE_MODULES } from '../../financeDomain/financeConstants'

const SpendingHistoryTab = () => {
    const { transactions, financePersistence } = useFinance()
    const apiLive = Boolean(financePersistence?.apiEnabled)

    const liveRows = useMemo(() => (transactions || [])
        .filter((row) => row.direction === 'OUT' && (
            row.sourceModule === SOURCE_MODULES.WALLET
            || String(row.category || '').toLowerCase().includes('wallet')
        ))
        .map((row) => ({
            id: row.id,
            initials: String(row.narration || 'W').slice(0, 2).toUpperCase(),
            user: row.narration || row.vendorId || 'Wallet spend',
            role: row.role || '—',
            vendor: row.category || row.sourceModule || 'Wallet',
            category: row.category || 'Other',
            dateTime: formatDisplayDate(row.transactionDate) || '—',
            amount: formatCurrency(row.amount || 0),
            amountNum: Number(row.amount) || 0,
        })), [transactions])

    const rows = apiLive ? liveRows : (liveRows.length ? liveRows : SPENDING_HISTORY)
    const total = rows.reduce((sum, row) => sum + (row.amountNum || 0), 0)
    const summaryCards = [
        { label: 'Spend rows', value: String(rows.length), sub: apiLive ? 'Wallet OUT from snapshot' : 'Demo or snapshot', iconTone: 'warning' },
        { label: 'Total listed', value: formatCurrency(total), sub: 'Sum of table', iconTone: 'danger' },
        { label: 'Source', value: apiLive ? 'API' : 'Demo', sub: apiLive ? 'No seed spend register' : 'May include offline seed', iconTone: 'success' },
        { label: 'Note', value: '—', sub: 'Gateway/vendor catalog still illustrative', iconTone: 'warning' },
    ]

    return (
    <div className='space-y-6'>
        <SummaryCards cards={summaryCards} />

        <TableCard
            title='Spending history — user wise'
            filters={(
                <div className='flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3'>
                    <div className='relative min-w-[160px]'>
                        <Search size={16} className='absolute left-3 top-1/2 -translate-y-1/2 text-[#808080]' />
                        <input
                            type='text'
                            placeholder='Search user...'
                            className='w-full text-sm border border-[#D9D9D9] rounded-md pl-9 pr-3 py-2'
                        />
                    </div>
                    <select className='text-sm border border-[#D9D9D9] rounded-md px-3 py-2 min-w-[130px]'>
                        <option>All Categories</option>
                        <option>Canteen</option>
                        <option>Stationery</option>
                        <option>Events</option>
                        <option>Other</option>
                    </select>
                    <input type='date' className='text-sm border border-[#D9D9D9] rounded-md px-3 py-2 min-w-[140px]' />
                </div>
            )}
            footer={<TablePagination summary={`${rows.length} spend entr${rows.length === 1 ? 'y' : 'ies'}`} />}
        >
            <table className='w-full text-sm text-left mt-4'>
                <thead className='text-xs bg-[#EDEEF5] whitespace-nowrap rounded-lg'>
                    <tr>
                        <th className={`${thClass} rounded-s-lg`}>User</th>
                        <th className={thClass}>Role</th>
                        <th className={thClass}>Vendor / Item</th>
                        <th className={thClass}>Category</th>
                        <th className={thClass}>Date & time</th>
                        <th className={`${thClass} rounded-e-lg`}>Amount</th>
                    </tr>
                </thead>
                <tbody>
                    {rows.length === 0 ? (
                        <tr>
                            <td colSpan={6} className={`${tdClass} text-[#667085]`}>
                                No wallet OUT transactions on the campus finance snapshot yet.
                            </td>
                        </tr>
                    ) : rows.map((row) => (
                        <tr key={row.id} className='border-b border-[#f2f4f7] hover:bg-[#f2f4f7]'>
                            <td className={`${tdClass} rounded-s-lg`}>
                                <UserAvatar initials={row.initials} name={row.user} />
                            </td>
                            <td className={tdClass}><RoleChip role={row.role} /></td>
                            <td className={tdClass}>{row.vendor}</td>
                            <td className={tdClass}>
                                <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${spendCategoryBadgeColor[row.category] || 'bg-[#EDEEF5] text-[#667085]'}`}>
                                    {row.category}
                                </span>
                            </td>
                            <td className={tdClass}>{row.dateTime}</td>
                            <td className={`${tdClass} rounded-e-lg font-semibold text-[#FF5722]`}>{row.amount}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </TableCard>
    </div>
    )
}

export default SpendingHistoryTab
