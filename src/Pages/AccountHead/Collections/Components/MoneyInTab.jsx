import React, { useMemo } from 'react'
import { Download } from 'lucide-react'
import { INCOME_REGISTER, incomeStatusBadgeColor } from '../collectionsData'
import { useFinance } from '../../financeDomain/FinanceContext'
import { formatCurrency, formatDisplayDate } from '../../financeDomain/financeHelpers'
import { paymentModeLabel, TRANSACTION_STATUSES } from '../../financeDomain/financeConstants'
import {
    SummaryCards,
    TableCard,
    TablePagination,
    tdClass,
    thClass,
} from './CollectionsShared'

const MoneyInTab = () => {
    const { postedInflow, students, financePersistence } = useFinance()
    const apiLive = Boolean(financePersistence?.apiEnabled)

    const liveRows = useMemo(() => postedInflow.map((item) => ({
        id: item.id,
        date: formatDisplayDate(item.transactionDate),
        source: item.category || 'Student Fees',
        reference: item.receiptNo || item.transactionNo,
        mode: paymentModeLabel(item.paymentMode),
        amount: `+${formatCurrency(item.amount)}`,
        amountNum: Number(item.amount) || 0,
        status: item.status === TRANSACTION_STATUSES.POSTED ? 'Cleared' : item.status,
        student: students.find((row) => row.id === item.studentId)?.name,
    })), [postedInflow, students])

    const rows = apiLive ? liveRows : [...liveRows, ...INCOME_REGISTER]
    const totalIn = liveRows.reduce((sum, row) => sum + row.amountNum, 0)
    const summaryCards = [
        {
            label: 'Posted inflows (snapshot)',
            value: formatCurrency(totalIn),
            sub: `${liveRows.length} transaction(s)`,
            iconTone: 'success',
        },
        {
            label: 'Cleared',
            value: String(liveRows.filter((row) => row.status === 'Cleared').length),
            sub: 'Posted status',
            iconTone: 'success',
        },
        {
            label: 'Pending clearance',
            value: String(liveRows.filter((row) => row.status !== 'Cleared').length),
            sub: 'Cheques / holds',
            iconTone: 'warning',
        },
        {
            label: 'Source',
            value: apiLive ? 'API' : 'Demo',
            sub: apiLive ? 'No seed income register merged' : 'Includes offline demo register',
            iconTone: 'success',
        },
    ]

    return (
    <div className='space-y-6'>
        <SummaryCards cards={summaryCards} />

        <TableCard
            title='Income source register'
            filters={(
                <div className='flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3'>
                    <select className='text-sm border border-[#D9D9D9] rounded-md px-3 py-2 min-w-[130px]'>
                        <option>All Sources</option>
                        <option>Student Fees</option>
                        <option>Transport Fees</option>
                        <option>Canteen</option>
                        <option>Donations</option>
                        <option>Other</option>
                    </select>
                    <input type='date' className='text-sm border border-[#D9D9D9] rounded-md px-3 py-2 min-w-[140px]' />
                    <button
                        type='button'
                        className='inline-flex items-center gap-2 text-sm font-medium text-[#515DEF] border border-[#515DEF] px-4 py-2 rounded-md hover:bg-[#515DEF] hover:text-white transition-colors cursor-pointer'
                    >
                        <Download size={16} />
                        Export
                    </button>
                </div>
            )}
            footer={<TablePagination summary={`${rows.length} income entr${rows.length === 1 ? 'y' : 'ies'}`} />}
        >
            <table className='w-full text-sm text-left mt-4'>
                <thead className='text-xs bg-[#EDEEF5] whitespace-nowrap rounded-lg'>
                    <tr>
                        <th className={`${thClass} rounded-s-lg`}>Date</th>
                        <th className={thClass}>Source</th>
                        <th className={thClass}>Reference</th>
                        <th className={thClass}>Mode</th>
                        <th className={thClass}>Amount</th>
                        <th className={`${thClass} rounded-e-lg`}>Status</th>
                    </tr>
                </thead>
                <tbody>
                    {rows.length === 0 ? (
                        <tr>
                            <td colSpan={6} className={`${tdClass} text-[#667085]`}>
                                No posted inflows on the campus finance snapshot yet.
                            </td>
                        </tr>
                    ) : rows.map((row) => (
                        <tr key={row.id} className='border-b border-[#f2f4f7] hover:bg-[#f2f4f7]'>
                            <td className={`${tdClass} rounded-s-lg`}>{row.date}</td>
                            <td className={`${tdClass} font-medium text-[#1E1E1E]`}>{row.source}</td>
                            <td className={`${tdClass} font-mono text-xs`}>{row.reference}</td>
                            <td className={tdClass}>{row.mode}</td>
                            <td className={`${tdClass} font-semibold text-[#4CAF50]`}>{row.amount}</td>
                            <td className={`${tdClass} rounded-e-lg`}>
                                <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${incomeStatusBadgeColor[row.status] || 'bg-[#EDEEF5] text-[#667085]'}`}>
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

export default MoneyInTab
