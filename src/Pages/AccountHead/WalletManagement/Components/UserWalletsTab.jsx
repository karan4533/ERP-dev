import React from 'react'
import { Search } from 'lucide-react'
import {
    USER_WALLETS,
    USER_WALLETS_SUMMARY,
    walletStatusBadgeColor,
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

const UserWalletsTab = ({ userWallets = USER_WALLETS }) => (
    <div className='space-y-6'>
        <SummaryCards cards={USER_WALLETS_SUMMARY} />

        <TableCard
            title='User wallet register'
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
                    <select className='text-sm border border-[#D9D9D9] rounded-md px-3 py-2 min-w-[110px]'>
                        <option>All Roles</option>
                        <option>Student</option>
                        <option>Staff</option>
                        <option>Parent</option>
                    </select>
                    <select className='text-sm border border-[#D9D9D9] rounded-md px-3 py-2 min-w-[120px]'>
                        <option>All Status</option>
                        <option>Active</option>
                        <option>Zero Balance</option>
                        <option>Frozen</option>
                    </select>
                </div>
            )}
            footer={<TablePagination summary='2,140 wallets total' />}
        >
            <table className='w-full text-sm text-left mt-4'>
                <thead className='text-xs bg-[#EDEEF5] whitespace-nowrap rounded-lg'>
                    <tr>
                        <th className={`${thClass} rounded-s-lg`}>User</th>
                        <th className={thClass}>Role</th>
                        <th className={thClass}>Wallet ID</th>
                        <th className={thClass}>Balance</th>
                        <th className={thClass}>Last Recharge</th>
                        <th className={thClass}>Status</th>
                        <th className={`${thClass} rounded-e-lg`}>Action</th>
                    </tr>
                </thead>
                <tbody>
                    {userWallets.map((row) => (
                        <tr key={row.id} className='border-b border-[#f2f4f7] hover:bg-[#f2f4f7]'>
                            <td className={`${tdClass} rounded-s-lg`}>
                                <UserAvatar initials={row.initials} name={row.name} />
                            </td>
                            <td className={tdClass}><RoleChip role={row.role} /></td>
                            <td className={`${tdClass} font-mono text-xs`}>{row.walletId}</td>
                            <td className={`${tdClass} font-semibold text-[#1E1E1E]`}>{row.balance}</td>
                            <td className={tdClass}>{row.lastRecharge}</td>
                            <td className={tdClass}>
                                <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${walletStatusBadgeColor[row.status]}`}>
                                    {row.status}
                                </span>
                            </td>
                            <td className={`${tdClass} rounded-e-lg`}>
                                <button type='button' className='text-sm font-medium text-[#515DEF] hover:underline cursor-pointer'>
                                    {row.status === 'Flagged' ? 'Review' : 'View ledger'}
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </TableCard>
    </div>
)

export default UserWalletsTab
