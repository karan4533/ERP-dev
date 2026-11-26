import React from 'react'
import { Bus, HeartHandshake, Users, Wallet } from 'lucide-react'
import { INCOME_BREAKDOWN, INCOME_REPORT_TILES } from '../reportsAnalyticsData'
import { ReportTile, TableCard } from './ReportsShared'
import { tdClass, thClass } from './reportStyles'

const TILE_ICONS = {
    cash: Wallet,
    users: Users,
    bus: Bus,
    heart: HeartHandshake,
}

const IncomeReportsTab = () => (
    <div className='space-y-6'>
        <div>
            <h3 className='text-base font-semibold text-[#1E1E1E]'>Income reports</h3>
            <p className='text-sm text-[#667085] mt-1'>Reference report designs for incoming money. Export remains unavailable until the reporting API is connected.</p>
        </div>

        <div className='grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4'>
            {INCOME_REPORT_TILES.map((tile) => (
                <ReportTile
                    key={tile.title}
                    title={tile.title}
                    sub={tile.sub}
                    icon={TILE_ICONS[tile.icon]}
                />
            ))}
        </div>

        <TableCard
            title='Income breakdown — by category'
            filters={(
                <span className='text-xs font-medium text-[var(--erp-muted)]'>Reference period · This term</span>
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
                    {INCOME_BREAKDOWN.map((row) => (
                        <tr key={row.category} className='border-b border-[#f2f4f7] hover:bg-[#f2f4f7]'>
                            <td className={`${tdClass} rounded-s-lg font-medium text-[#1E1E1E]`}>{row.category}</td>
                            <td className={tdClass}>{row.amount}</td>
                            <td className={tdClass}>{row.percent}</td>
                            <td className={`${tdClass} rounded-e-lg font-medium ${row.trend === 'up' ? 'text-[#4CAF50]' : 'text-[#FF5722]'}`}>
                                {row.vsLastTerm}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </TableCard>
    </div>
)

export default IncomeReportsTab
