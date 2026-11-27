import React, { useMemo } from 'react'
import { Bus, Download, Receipt, Users, Wrench } from 'lucide-react'
import { EXPENDITURE_REPORT_TILES } from '../reportsAnalyticsData'
import { ReportTile, TableCard, tdClass, thClass } from './ReportsShared'
import { useFinance } from '../../financeDomain/FinanceContext'
import { buildExpenditureBreakdownFromTransactions } from '../../financeDomain/financeLiveViews'

const TILE_ICONS = {
    users: Users,
    bus: Bus,
    tools: Wrench,
    receipt: Receipt,
}

const ExpenditureReportsTab = () => {
    const { transactions, financePersistence } = useFinance()
    const apiLive = Boolean(financePersistence?.apiEnabled)
    const breakdown = useMemo(
        () => buildExpenditureBreakdownFromTransactions(transactions || []),
        [transactions],
    )

    return (
        <div className='space-y-6'>
            <div>
                <h3 className='text-base font-semibold text-[#1E1E1E]'>Expenditure reports</h3>
                <p className='text-sm text-[#667085] mt-1'>
                    {apiLive
                        ? 'Outgoing money from posted OUT transactions on the finance snapshot. vs Last Term is the last 90 days versus the prior 90 days.'
                        : 'Outgoing money from posted local OUT transactions when present.'}
                </p>
            </div>

            <div className='grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4'>
                {EXPENDITURE_REPORT_TILES.map((tile) => (
                    <ReportTile
                        key={tile.title}
                        title={tile.title}
                        sub={tile.sub}
                        icon={TILE_ICONS[tile.icon]}
                    />
                ))}
            </div>

            <TableCard
                title='Expenditure breakdown — by category'
                filters={(
                    <div className='flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3'>
                        <select className='text-sm border border-[#D9D9D9] rounded-md px-3 py-2 min-w-[120px]'>
                            <option>This Term</option>
                            <option>This Year</option>
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
            >
                <table className='w-full text-sm text-left mt-4'>
                    <thead className='text-xs bg-[#EDEEF5] whitespace-nowrap rounded-lg'>
                        <tr>
                            <th className={`${thClass} rounded-s-lg`}>Category</th>
                            <th className={thClass}>Amount</th>
                            <th className={thClass}>% of Total</th>
                            <th className={`${thClass} rounded-e-lg`}>vs Last Term</th>
                        </tr>
                    </thead>
                    <tbody>
                        {breakdown.length === 0 ? (
                            <tr>
                                <td colSpan={4} className='px-2 py-8 text-center text-[#667085]'>
                                    No posted OUT transactions on the campus finance snapshot yet.
                                </td>
                            </tr>
                        ) : breakdown.map((row) => (
                            <tr key={row.category} className='border-b border-[#f2f4f7] hover:bg-[#f2f4f7]'>
                                <td className={`${tdClass} rounded-s-lg font-medium text-[#1E1E1E]`}>{row.category}</td>
                                <td className={tdClass}>{row.amount}</td>
                                <td className={tdClass}>{row.percent}</td>
                                <td className={`${tdClass} rounded-e-lg font-medium ${
                                    row.trend === 'down'
                                        ? 'text-[#4CAF50]'
                                        : row.trend === 'up'
                                            ? 'text-[#FF5722]'
                                            : 'text-[#667085]'
                                }`}>
                                    {row.vsLastTerm}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </TableCard>
        </div>
    )
}

export default ExpenditureReportsTab
