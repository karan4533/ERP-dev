import React, { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { voucherStatusBadgeColor, parseRupeeAmount, formatRupeeAmount } from '../accountingData'
import { SummaryCards, TableCard, TablePagination, tdClass, thClass } from './AccountingShared'

const JV_STATUS_FILTERS = ['All Status', 'Draft', 'Pending Approval', 'Posted']

const JournalVouchersTab = ({ vouchers, summary, selectedId, onSelect }) => {
    const [voucherSearch, setVoucherSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState(JV_STATUS_FILTERS[0])

    const filteredVouchers = useMemo(() => {
        return vouchers.filter((row) => {
            if (statusFilter !== 'All Status' && row.status !== statusFilter) return false
            if (voucherSearch && !row.voucherNo.toLowerCase().includes(voucherSearch.toLowerCase())) {
                return false
            }
            return true
        })
    }, [vouchers, statusFilter, voucherSearch])

    return (
        <div className='space-y-6' id='journal-vouchers-print-area'>
            <SummaryCards cards={summary} />

            <TableCard
                title='Voucher register'
                filters={(
                    <div className='flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3'>
                        <div className='relative min-w-[160px]'>
                            <Search size={16} className='absolute left-3 top-1/2 -translate-y-1/2 text-[#808080]' />
                            <input
                                type='text'
                                value={voucherSearch}
                                onChange={(event) => setVoucherSearch(event.target.value)}
                                placeholder='Search voucher no...'
                                className='w-full text-sm border border-[#D9D9D9] rounded-md pl-9 pr-3 py-2'
                            />
                        </div>
                        <select
                            value={statusFilter}
                            onChange={(event) => setStatusFilter(event.target.value)}
                            className='text-sm border border-[#D9D9D9] rounded-md px-3 py-2 min-w-[150px]'
                        >
                            {JV_STATUS_FILTERS.map((status) => (
                                <option key={status} value={status}>{status}</option>
                            ))}
                        </select>
                    </div>
                )}
                footer={(
                    <TablePagination
                        summary={`${filteredVouchers.length} journal vouchers${
                            filteredVouchers.length !== vouchers.length ? ` (of ${vouchers.length} total)` : ''
                        }`}
                    />
                )}
            >
                <table className='w-full text-sm text-left mt-4 min-w-[1000px]'>
                    <thead className='text-xs bg-[#EDEEF5] whitespace-nowrap rounded-lg'>
                        <tr>
                            <th className={`${thClass} rounded-s-lg w-10`} />
                            <th className={thClass}>Voucher No.</th>
                            <th className={thClass}>Date</th>
                            <th className={thClass}>Description</th>
                            <th className={thClass}>Debit</th>
                            <th className={thClass}>Credit</th>
                            <th className={thClass}>Status</th>
                            <th className={`${thClass} rounded-e-lg`}>Created By</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredVouchers.length === 0 ? (
                            <tr>
                                <td colSpan={8} className='px-2 py-8 text-center text-[#667085]'>
                                    No journal vouchers match the selected filters.
                                </td>
                            </tr>
                        ) : (
                            filteredVouchers.map((row) => (
                                <tr
                                    key={row.id}
                                    onClick={() => onSelect(row.id)}
                                    className={`border-b border-[#f2f4f7] hover:bg-[#f2f4f7] cursor-pointer ${
                                        selectedId === row.id ? 'bg-[#515DEF0D]' : ''
                                    }`}
                                >
                                    <td className={`${tdClass} rounded-s-lg`}>
                                        <input
                                            type='radio'
                                            name='selected-voucher'
                                            checked={selectedId === row.id}
                                            onChange={() => onSelect(row.id)}
                                            className='accent-[#515DEF] cursor-pointer'
                                        />
                                    </td>
                                    <td className={`${tdClass} font-mono text-xs text-[#515DEF]`}>{row.voucherNo}</td>
                                    <td className={`${tdClass} whitespace-nowrap`}>{row.date}</td>
                                    <td className={`${tdClass} font-medium text-[#1E1E1E]`}>{row.description}</td>
                                    <td className={tdClass}>{row.debit}</td>
                                    <td className={tdClass}>{row.credit}</td>
                                    <td className={tdClass}>
                                        <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${voucherStatusBadgeColor[row.status]}`}>
                                            {row.status}
                                        </span>
                                    </td>
                                    <td className={`${tdClass} rounded-e-lg`}>{row.createdBy}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </TableCard>
        </div>
    )
}

const formatCompactRupee = (amount) => {
    if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)} Cr`
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)} L`
    return formatRupeeAmount(amount)
}

export const buildJournalVoucherSummary = (vouchers) => {
    const draftCount = vouchers.filter((row) => row.status === 'Draft').length
    const postedCount = vouchers.filter((row) => row.status === 'Posted').length
    const pendingCount = vouchers.filter((row) => row.status === 'Pending Approval').length
    const totalAdjustments = vouchers.reduce(
        (total, row) => total + parseRupeeAmount(row.amount),
        0,
    )

    return [
        {
            label: 'Draft Vouchers',
            value: String(draftCount),
            sub: draftCount > 0 ? 'awaiting posting' : 'none pending',
            subTone: draftCount > 0 ? 'warning' : undefined,
            iconTone: draftCount > 0 ? 'warning' : 'info',
        },
        {
            label: 'Posted Vouchers',
            value: String(postedCount),
            sub: 'posted to ledger',
            subTone: 'success',
            iconTone: 'success',
        },
        {
            label: 'Pending Approval',
            value: String(pendingCount),
            sub: pendingCount > 0 ? 'needs sign-off' : 'all clear',
            subTone: pendingCount > 0 ? 'danger' : undefined,
            iconTone: pendingCount > 0 ? 'danger' : 'info',
        },
        {
            label: 'Total Adjustments',
            value: formatCompactRupee(totalAdjustments),
            sub: `${vouchers.length} vouchers total`,
            iconTone: 'info',
        },
    ]
}

export const appendJournalVoucher = (vouchers, voucher) => [
    { ...voucher, id: `JV-${Date.now()}` },
    ...vouchers,
]

export const postJournalVouchers = (vouchers, selectedId) => {
    const postable = selectedId
        ? vouchers.filter((row) => row.id === selectedId && row.status !== 'Posted')
        : vouchers.filter((row) => row.status === 'Draft' || row.status === 'Pending Approval')

    if (postable.length === 0) return vouchers

    const postableIds = new Set(postable.map((row) => row.id))
    return vouchers.map((row) => (
        postableIds.has(row.id) ? { ...row, status: 'Posted' } : row
    ))
}

export default JournalVouchersTab
