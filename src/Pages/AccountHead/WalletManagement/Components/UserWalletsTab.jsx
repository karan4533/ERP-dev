import React, { useMemo } from 'react'
import { Search } from 'lucide-react'
import { walletStatusBadgeColor } from '../walletManagementData'
import {
    RoleChip,
    SummaryCards,
    TableCard,
    TablePagination,
    UserAvatar,
    tdClass,
    thClass,
} from './WalletShared'

const parseBalance = (value) => {
    if (typeof value === 'number') return value
    const digits = String(value ?? '').replace(/[^\d.-]/g, '')
    return Number(digits) || 0
}

const formatInr = (amount) => {
    try {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0,
        }).format(amount)
    } catch {
        return `₹${amount}`
    }
}

const UserWalletsTab = ({ userWallets }) => {
    const rows = Array.isArray(userWallets) ? userWallets : []
    const summaryCards = useMemo(() => {
        const totalBalance = rows.reduce((sum, row) => sum + parseBalance(row.balance), 0)
        const active = rows.filter((row) => String(row.status || 'Active').toLowerCase() === 'active').length
        return [
            { label: 'Wallets on snapshot', value: String(rows.length), sub: 'Finance state', iconTone: 'success' },
            { label: 'Active', value: String(active), sub: 'Status Active', iconTone: 'success' },
            { label: 'Total balance', value: formatInr(totalBalance), sub: 'Sum of listed wallets', iconTone: 'success' },
            { label: 'Zero / other', value: String(Math.max(0, rows.length - active)), sub: 'Not Active', iconTone: 'warning' },
        ]
    }, [rows])

    return (
    <div className='space-y-6'>
        <SummaryCards cards={summaryCards} />

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
            footer={<TablePagination summary={`${rows.length} wallet${rows.length === 1 ? '' : 's'} total`} />}
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
                    {rows.length === 0 ? (
                        <tr>
                            <td colSpan={7} className={`${tdClass} text-[#667085]`}>
                                No wallets on the campus finance snapshot yet.
                            </td>
                        </tr>
                    ) : rows.map((row) => (
                        <tr key={row.id || row.walletId || row.email} className='border-b border-[#f2f4f7] hover:bg-[#f2f4f7]'>
                            <td className={`${tdClass} rounded-s-lg`}>
                                <UserAvatar
                                    initials={row.initials || String(row.name || '?').slice(0, 2).toUpperCase()}
                                    name={row.name || '—'}
                                />
                            </td>
                            <td className={tdClass}><RoleChip role={row.role || '—'} /></td>
                            <td className={`${tdClass} font-mono text-xs`}>{row.walletId || row.id || '—'}</td>
                            <td className={`${tdClass} font-semibold text-[#1E1E1E]`}>{row.balance ?? '—'}</td>
                            <td className={tdClass}>{row.lastRecharge || '—'}</td>
                            <td className={tdClass}>
                                <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${walletStatusBadgeColor[row.status] || 'bg-[#EDEEF5] text-[#667085]'}`}>
                                    {row.status || 'Active'}
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
}

export default UserWalletsTab
