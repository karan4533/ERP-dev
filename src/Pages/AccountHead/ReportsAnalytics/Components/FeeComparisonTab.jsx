import React, { useMemo, useState } from 'react'
import { CURRENT_YEAR_FEE_STATS, PREVIOUS_YEAR_FEE_STATS } from '../../financeDomain/financeMasters'
import { compareAcademicYears, formatCurrency } from '../../financeDomain/financeHelpers'
import { TableCard, tdClass, thClass } from './ReportsShared'
import { FeeProjectionPanel } from '../../../../Common/demoDomain/DemoScreens'

const FeeComparisonTab = () => {
    const [klass, setKlass] = useState('All Classes')
    const comparison = useMemo(
        () => compareAcademicYears(CURRENT_YEAR_FEE_STATS, PREVIOUS_YEAR_FEE_STATS),
        [],
    )

    const rows = [
        ['Total Demand', PREVIOUS_YEAR_FEE_STATS.totalDemand, CURRENT_YEAR_FEE_STATS.totalDemand],
        ['Total Concession', PREVIOUS_YEAR_FEE_STATS.totalConcession, CURRENT_YEAR_FEE_STATS.totalConcession],
        ['Net Demand', PREVIOUS_YEAR_FEE_STATS.netDemand, CURRENT_YEAR_FEE_STATS.netDemand],
        ['Total Collected', PREVIOUS_YEAR_FEE_STATS.collected, CURRENT_YEAR_FEE_STATS.collected],
        ['Outstanding', PREVIOUS_YEAR_FEE_STATS.outstanding, CURRENT_YEAR_FEE_STATS.outstanding],
        ['Fine Collected', PREVIOUS_YEAR_FEE_STATS.fineCollected, CURRENT_YEAR_FEE_STATS.fineCollected],
    ]

    const pctChange = (current, previous) => {
        if (!previous) return '—'
        const delta = ((current - previous) / previous) * 100
        return `${delta >= 0 ? '↑' : '↓'} ${Math.abs(delta).toFixed(1)}%`
    }

    return (
        <div className='space-y-6'>
            <div className='flex flex-wrap gap-3'>
                <select value={klass} onChange={(event) => setKlass(event.target.value)} className='text-sm border border-[#D9D9D9] rounded-md px-3 py-2'>
                    <option>All Classes</option>
                    <option>Grade 2</option>
                    <option>Grade 10</option>
                </select>
                <select className='text-sm border border-[#D9D9D9] rounded-md px-3 py-2'>
                    <option>All Fee Categories</option>
                    <option>Tuition Fee</option>
                    <option>Transport Fee</option>
                </select>
            </div>

            <div className='grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4'>
                <div className='bg-white rounded-2xl shadow-md p-4'>
                    <p className='text-xs text-[#808080]'>Collection % (current)</p>
                    <p className='text-xl font-semibold text-[#4CAF50]'>{comparison.currentCollectionPct.toFixed(1)}%</p>
                    <p className='text-xs text-[#667085] mt-1'>Collected / Net Demand × 100</p>
                </div>
                <div className='bg-white rounded-2xl shadow-md p-4'>
                    <p className='text-xs text-[#808080]'>Collection % (previous)</p>
                    <p className='text-xl font-semibold'>{comparison.previousCollectionPct.toFixed(1)}%</p>
                </div>
                <div className='bg-white rounded-2xl shadow-md p-4'>
                    <p className='text-xs text-[#808080]'>YoY collection change</p>
                    <p className={`text-xl font-semibold ${comparison.collectionDeltaPct >= 0 ? 'text-[#4CAF50]' : 'text-[#FF5722]'}`}>
                        {comparison.collectionDeltaPct >= 0 ? '+' : ''}{comparison.collectionDeltaPct.toFixed(1)} pts
                    </p>
                </div>
                <div className='bg-white rounded-2xl shadow-md p-4'>
                    <p className='text-xs text-[#808080]'>Defaulter % (current)</p>
                    <p className='text-xl font-semibold text-[#FF5722]'>{comparison.currentDefaulterPct.toFixed(1)}%</p>
                </div>
            </div>

            <TableCard title={`Fee collection comparison · ${klass}`}>
                <table className='w-full text-sm mt-4'>
                    <thead className='text-xs bg-[#EDEEF5]'>
                        <tr>
                            <th className={`${thClass} rounded-s-lg`}>Metric</th>
                            <th className={thClass}>2025-2026</th>
                            <th className={thClass}>2026-2027</th>
                            <th className={`${thClass} rounded-e-lg`}>Change</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map(([label, previous, current]) => (
                            <tr key={label} className='border-b border-[#F2F4F7]'>
                                <td className={`${tdClass} rounded-s-lg font-medium text-[#1E1E1E]`}>{label}</td>
                                <td className={tdClass}>{formatCurrency(previous)}</td>
                                <td className={tdClass}>{formatCurrency(current)}</td>
                                <td className={`${tdClass} rounded-e-lg ${current >= previous ? 'text-[#4CAF50]' : 'text-[#FF5722]'}`}>
                                    {pctChange(current, previous)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </TableCard>
            <FeeProjectionPanel />
            <p className='text-xs text-[#808080]'>TODO: MFP Report Solution / customized template — waiting on stakeholder specification. Do not invent this workflow.</p>
        </div>
    )
}

export default FeeComparisonTab
