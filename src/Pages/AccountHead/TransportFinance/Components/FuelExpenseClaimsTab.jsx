import React, { useMemo } from 'react'
import { Download, Search } from 'lucide-react'
import {
    EXPENSE_CLAIMS,
    FUEL_SUMMARY,
    claimStatusBadgeColor,
    claimTypeBadgeColor,
} from '../transportFinanceData'
import {
    StaffAvatar,
    SummaryCards,
    TableCard,
    TablePagination,
    tdClass,
    thClass,
} from './TransportShared'
import { useFinance } from '../../financeDomain/FinanceContext'

const FuelExpenseClaimsTab = () => {
    const { approvals } = useFinance()
    const rows = useMemo(() => {
        const fromApprovals = (approvals || [])
            .filter((row) => String(row.department || '').toLowerCase() === 'transport')
            .map((row) => ({
                id: row.id,
                claimant: row.raisedBy || 'Staff',
                initials: row.initials || 'TR',
                vehicle: row.vehicle || '—',
                type: row.type || 'Expense',
                date: row.raisedOn || (row.decidedAt || '').slice(0, 10) || '—',
                amount: row.amount,
                status: row.status || 'Pending',
            }))
        return fromApprovals.length ? fromApprovals : EXPENSE_CLAIMS
    }, [approvals])

    return (
    <div className='space-y-6'>
        <SummaryCards cards={FUEL_SUMMARY} />

        <TableCard
            title='Expense claims by transport manager / drivers'
            filters={(
                <div className='flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3'>
                    <div className='relative min-w-[160px]'>
                        <Search size={16} className='absolute left-3 top-1/2 -translate-y-1/2 text-[#808080]' />
                        <input
                            type='text'
                            placeholder='Search claimant...'
                            className='w-full text-sm border border-[#D9D9D9] rounded-md pl-9 pr-3 py-2'
                        />
                    </div>
                    <select className='text-sm border border-[#D9D9D9] rounded-md px-3 py-2 min-w-[120px]'>
                        <option>All Types</option>
                        <option>Fuel</option>
                        <option>Service</option>
                        <option>Toll / Parking</option>
                        <option>Misc.</option>
                    </select>
                    <select className='text-sm border border-[#D9D9D9] rounded-md px-3 py-2 min-w-[120px]'>
                        <option>All Status</option>
                        <option>Pending</option>
                        <option>Approved</option>
                        <option>Rejected</option>
                    </select>
                    <button
                        type='button'
                        className='inline-flex items-center gap-2 text-sm font-medium text-[#515DEF] border border-[#515DEF] px-4 py-2 rounded-md hover:bg-[#515DEF] hover:text-white transition-colors cursor-pointer'
                    >
                        <Download size={16} />
                        Export
                    </button>
                </div>
            )}
            footer={<TablePagination summary={`${rows.length} claims`} />}
        >
            <table className='w-full text-sm text-left mt-4'>
                <thead className='text-xs bg-[#EDEEF5] whitespace-nowrap rounded-lg'>
                    <tr>
                        <th className={`${thClass} rounded-s-lg`}>Claimant</th>
                        <th className={thClass}>Vehicle</th>
                        <th className={thClass}>Type</th>
                        <th className={thClass}>Date</th>
                        <th className={thClass}>Amount</th>
                        <th className={thClass}>Status</th>
                        <th className={`${thClass} rounded-e-lg`}>Action</th>
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row) => (
                        <tr key={row.id} className='border-b border-[#f2f4f7] hover:bg-[#f2f4f7]'>
                            <td className={`${tdClass} rounded-s-lg`}>
                                <StaffAvatar initials={row.initials} name={row.claimant} />
                            </td>
                            <td className={`${tdClass} font-mono text-xs`}>{row.vehicle}</td>
                            <td className={tdClass}>
                                <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${claimTypeBadgeColor[row.type] || 'bg-[#EDEEF5] text-[#667085]'}`}>
                                    {row.type}
                                </span>
                            </td>
                            <td className={tdClass}>{row.date}</td>
                            <td className={`${tdClass} font-semibold text-[#1E1E1E]`}>{row.amount}</td>
                            <td className={tdClass}>
                                <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${claimStatusBadgeColor[row.status] || 'bg-[#EDEEF5] text-[#667085]'}`}>
                                    {row.status}
                                </span>
                            </td>
                            <td className={`${tdClass} rounded-e-lg`}>
                                <button type='button' className='text-sm font-medium text-[#515DEF] hover:underline cursor-pointer'>
                                    View
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

export default FuelExpenseClaimsTab
