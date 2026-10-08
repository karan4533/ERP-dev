import React from 'react'
import { Search } from 'lucide-react'
import {
    RECHARGE_RECORDS,
    RECHARGE_SUMMARY,
    rechargeStatusBadgeColor,
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

const RechargeRecordsTab = ({ rechargeRecords = RECHARGE_RECORDS }) => (
    <div className='space-y-6'>
        <SummaryCards cards={RECHARGE_SUMMARY} />

        <TableCard
            title='Recharge transaction log'
            filters={(
                <div className='flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3'>
                    <div className='relative min-w-[180px]'>
                        <Search size={16} className='absolute left-3 top-1/2 -translate-y-1/2 text-[#808080]' />
                        <input
                            type='text'
                            placeholder='Search user / txn ID...'
                            className='w-full text-sm border border-[#D9D9D9] rounded-md pl-9 pr-3 py-2'
                        />
                    </div>
                    <select className='text-sm border border-[#D9D9D9] rounded-md px-3 py-2 min-w-[130px]'>
                        <option>All Modes</option>
                        <option>UPI</option>
                        <option>Card</option>
                        <option>Net Banking</option>
                        <option>Cash (front desk)</option>
                    </select>
                    <select className='text-sm border border-[#D9D9D9] rounded-md px-3 py-2 min-w-[120px]'>
                        <option>All Status</option>
                        <option>Success</option>
                        <option>Failed</option>
                        <option>Refunded</option>
                    </select>
                </div>
            )}
            footer={<TablePagination summary='2,640 recharges this month' />}
        >
            <table className='w-full text-sm text-left mt-4'>
                <thead className='text-xs bg-[#EDEEF5] whitespace-nowrap rounded-lg'>
                    <tr>
                        <th className={`${thClass} rounded-s-lg`}>Txn ID</th>
                        <th className={thClass}>User</th>
                        <th className={thClass}>Role</th>
                        <th className={thClass}>Mode</th>
                        <th className={thClass}>Amount</th>
                        <th className={thClass}>Date & time</th>
                        <th className={`${thClass} rounded-e-lg`}>Status</th>
                    </tr>
                </thead>
                <tbody>
                    {rechargeRecords.map((row) => (
                        <tr key={row.id} className='border-b border-[#f2f4f7] hover:bg-[#f2f4f7]'>
                            <td className={`${tdClass} rounded-s-lg font-mono text-xs text-[#1E1E1E]`}>{row.id}</td>
                            <td className={tdClass}>
                                <UserAvatar initials={row.initials} name={row.user} />
                            </td>
                            <td className={tdClass}><RoleChip role={row.role} /></td>
                            <td className={tdClass}>{row.mode}</td>
                            <td className={`${tdClass} font-semibold text-[#1E1E1E]`}>{row.amount}</td>
                            <td className={tdClass}>{row.dateTime}</td>
                            <td className={`${tdClass} rounded-e-lg`}>
                                <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${rechargeStatusBadgeColor[row.status]}`}>
                                    {row.status}
                                </span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </TableCard>
    </div>
)

export default RechargeRecordsTab
