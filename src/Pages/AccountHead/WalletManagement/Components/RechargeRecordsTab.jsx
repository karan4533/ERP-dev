import React, { useMemo } from 'react'
import { Search } from 'lucide-react'
import { rechargeStatusBadgeColor } from '../walletManagementData'
import {
    RoleChip,
    SummaryCards,
    TableCard,
    TablePagination,
    UserAvatar,
    tdClass,
    thClass,
} from './WalletShared'

const parseAmount = (value) => {
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

const RechargeRecordsTab = ({ rechargeRecords }) => {
    const rows = Array.isArray(rechargeRecords) ? rechargeRecords : []
    const summaryCards = useMemo(() => {
        const total = rows.reduce((sum, row) => sum + parseAmount(row.amount), 0)
        const success = rows.filter((row) => String(row.status || '').toLowerCase() === 'success').length
        return [
            { label: 'Recharges on snapshot', value: String(rows.length), sub: 'Finance state', iconTone: 'success' },
            { label: 'Success', value: String(success), sub: 'Status Success', iconTone: 'success' },
            { label: 'Total amount', value: formatInr(total), sub: 'Sum of listed rows', iconTone: 'success' },
            { label: 'Other status', value: String(Math.max(0, rows.length - success)), sub: 'Failed / refunded / other', iconTone: 'warning' },
        ]
    }, [rows])

    return (
    <div className='space-y-6'>
        <SummaryCards cards={summaryCards} />

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
            footer={<TablePagination summary={`${rows.length} recharge${rows.length === 1 ? '' : 's'}`} />}
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
                    {rows.length === 0 ? (
                        <tr>
                            <td colSpan={7} className={`${tdClass} text-[#667085]`}>
                                No wallet recharges on the campus finance snapshot yet.
                            </td>
                        </tr>
                    ) : rows.map((row) => (
                        <tr key={row.id} className='border-b border-[#f2f4f7] hover:bg-[#f2f4f7]'>
                            <td className={`${tdClass} rounded-s-lg font-mono text-xs text-[#1E1E1E]`}>{row.id}</td>
                            <td className={tdClass}>
                                <UserAvatar initials={row.initials || String(row.user || '?').slice(0, 2).toUpperCase()} name={row.user || '—'} />
                            </td>
                            <td className={tdClass}><RoleChip role={row.role || '—'} /></td>
                            <td className={tdClass}>{row.mode || '—'}</td>
                            <td className={`${tdClass} font-semibold text-[#1E1E1E]`}>{row.amount ?? '—'}</td>
                            <td className={tdClass}>{row.dateTime || '—'}</td>
                            <td className={`${tdClass} rounded-e-lg`}>
                                <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${rechargeStatusBadgeColor[row.status] || 'bg-[#EDEEF5] text-[#667085]'}`}>
                                    {row.status || '—'}
                                </span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </TableCard>
    </div>
    )
}

export default RechargeRecordsTab
