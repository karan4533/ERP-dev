import React, { useMemo } from 'react'
import { Search } from 'lucide-react'
import {
    SummaryCards,
    TableCard,
    TablePagination,
    tdClass,
    thClass,
} from './ApprovalsShared'
import { useFinance } from '../../financeDomain/FinanceContext'
import { formatDisplayDate } from '../../financeDomain/financeHelpers'

const parseAmount = (value) => {
    const digits = String(value ?? '').replace(/[^\d.]/g, '')
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

const RejectedTab = () => {
    const { approvals } = useFinance()
    const rejected = useMemo(
        () => (approvals || []).filter((row) => String(row.status || '').toLowerCase() === 'rejected'),
        [approvals],
    )
    const summaryCards = useMemo(() => {
        const value = rejected.reduce((sum, row) => sum + parseAmount(row.amount), 0)
        return [
            {
                label: 'Rejected (campus snapshot)',
                value: String(rejected.length),
                sub: `${formatInr(value)} value`,
                iconTone: 'danger',
            },
            {
                label: 'With remarks',
                value: String(rejected.filter((row) => String(row.remarks || row.reason || '').trim()).length),
                sub: 'Reason recorded',
                iconTone: 'warning',
            },
            {
                label: 'Transport',
                value: String(rejected.filter((row) => String(row.department || '').toLowerCase() === 'transport').length),
                sub: 'Department = Transport',
                iconTone: 'info',
            },
            {
                label: 'Live finance SoT',
                value: 'API',
                sub: 'Rejected list uses finance snapshot — not demo constants',
                iconTone: 'success',
            },
        ]
    }, [rejected])

    return (
        <div className='space-y-6'>
            <SummaryCards cards={summaryCards} />

            <TableCard
                title='Rejected requests'
                filters={(
                    <div className='relative min-w-[160px]'>
                        <Search size={16} className='absolute left-3 top-1/2 -translate-y-1/2 text-[#808080]' />
                        <input type='text' placeholder='Search...' className='w-full text-sm border border-[#D9D9D9] rounded-md pl-9 pr-3 py-2' />
                    </div>
                )}
                footer={<TablePagination summary={`${rejected.length} rejected`} />}
            >
                <table className='w-full text-sm text-left mt-4'>
                    <thead className='text-xs bg-[#EDEEF5] whitespace-nowrap rounded-lg'>
                        <tr>
                            <th className={`${thClass} rounded-s-lg`}>Request ID</th>
                            <th className={thClass}>Raised By</th>
                            <th className={thClass}>Type</th>
                            <th className={thClass}>Amount</th>
                            <th className={thClass}>Rejected On</th>
                            <th className={`${thClass} rounded-e-lg`}>Reason</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rejected.length === 0 ? (
                            <tr>
                                <td colSpan={6} className={`${tdClass} text-center py-8 text-[#667085]`}>
                                    No rejected requests on the campus finance snapshot yet.
                                </td>
                            </tr>
                        ) : rejected.map((row) => (
                            <tr key={row.id} className='border-b border-[#f2f4f7] hover:bg-[#f2f4f7]'>
                                <td className={`${tdClass} rounded-s-lg font-mono text-xs text-[#1E1E1E]`}>{row.id}</td>
                                <td className={`${tdClass} text-[#1E1E1E]`}>{row.raisedBy}</td>
                                <td className={tdClass}>{row.type}</td>
                                <td className={`${tdClass} font-semibold text-[#1E1E1E]`}>{row.amount}</td>
                                <td className={tdClass}>
                                    {row.decidedAt ? formatDisplayDate(row.decidedAt) : (row.rejectedOn || '—')}
                                </td>
                                <td className={`${tdClass} rounded-e-lg`}>{row.remarks || row.reason || '—'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </TableCard>
        </div>
    )
}

export default RejectedTab
