import React, { useMemo } from 'react'
import { Download } from 'lucide-react'
import {
    EXPENSE_REGISTER,
    MONEY_OUT_SUMMARY,
    expenseStatusBadgeColor,
} from '../collectionsData'
import {
    SummaryCards,
    TableCard,
    TablePagination,
    tdClass,
    thClass,
} from './CollectionsShared'
import { useFinance } from '../../financeDomain/FinanceContext'
import { formatCurrency } from '../../financeDomain/financeHelpers'

const MoneyOutTab = () => {
    const { transactions } = useFinance()
    const rows = useMemo(() => {
        const live = (transactions || [])
            .filter((row) => row.direction === 'OUT')
            .map((row) => ({
                id: row.id,
                category: row.category || row.sourceModule || 'Expense',
                vendor: row.narration || row.employeeId || '—',
                amount: formatCurrency(row.amount || 0),
                date: row.transactionDate || '—',
                status: row.status === 'POSTED' ? 'Paid' : (row.status || 'Pending'),
                mode: row.paymentMode || '—',
            }))
        return live.length ? live : EXPENSE_REGISTER
    }, [transactions])

    return (
    <div className='space-y-6'>
        <SummaryCards cards={MONEY_OUT_SUMMARY} />

        <TableCard
            title='Expense register'
            filters={(
                <div className='flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3'>
                    <select className='text-sm border border-[#D9D9D9] rounded-md px-3 py-2 min-w-[140px]'>
                        <option>All Categories</option>
                        <option>Salaries</option>
                        <option>Transport</option>
                        <option>Maintenance</option>
                        <option>Utilities</option>
                        <option>Procurement</option>
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
            footer={<TablePagination summary={`${rows.length} expenses`} />}
        >
            <table className='w-full text-sm text-left mt-4'>
                <thead className='text-xs bg-[#EDEEF5] whitespace-nowrap rounded-lg'>
                    <tr>
                        <th className={`${thClass} rounded-s-lg`}>Category</th>
                        <th className={thClass}>Vendor / Narration</th>
                        <th className={thClass}>Amount</th>
                        <th className={thClass}>Date</th>
                        <th className={thClass}>Mode</th>
                        <th className={`${thClass} rounded-e-lg`}>Status</th>
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row) => (
                        <tr key={row.id} className='border-b border-[#f2f4f7] hover:bg-[#f2f4f7]'>
                            <td className={`${tdClass} rounded-s-lg`}>{row.category}</td>
                            <td className={tdClass}>{row.vendor}</td>
                            <td className={`${tdClass} font-semibold text-[#1E1E1E]`}>{row.amount}</td>
                            <td className={tdClass}>{row.date}</td>
                            <td className={tdClass}>{row.mode}</td>
                            <td className={`${tdClass} rounded-e-lg`}>
                                <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${expenseStatusBadgeColor[row.status] || 'bg-[#EDEEF5] text-[#667085]'}`}>
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
}

export default MoneyOutTab
