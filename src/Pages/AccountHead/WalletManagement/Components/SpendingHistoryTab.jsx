import React from 'react'
import { Search } from 'lucide-react'
import {
    SPENDING_HISTORY,
    SPENDING_SUMMARY,
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

const SpendingHistoryTab = () => (
    <div className='space-y-6'>
        <SummaryCards cards={SPENDING_SUMMARY} />

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
            footer={<TablePagination summary='4,920 spend entries this month' />}
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
                    {SPENDING_HISTORY.map((row) => (
                        <tr key={row.id} className='border-b border-[#f2f4f7] hover:bg-[#f2f4f7]'>
                            <td className={`${tdClass} rounded-s-lg`}>
                                <UserAvatar initials={row.initials} name={row.user} />
                            </td>
                            <td className={tdClass}><RoleChip role={row.role} /></td>
                            <td className={tdClass}>{row.vendor}</td>
                            <td className={tdClass}>
                                <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${spendCategoryBadgeColor[row.category]}`}>
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

export default SpendingHistoryTab
