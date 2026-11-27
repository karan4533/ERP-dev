import React, { useMemo, useState } from 'react'
import { compareAcademicYears, formatCurrency } from '../../financeDomain/financeHelpers'
import { buildFeeComparisonFromSnapshot } from '../../financeDomain/financeLiveViews'
import { useFinance } from '../../financeDomain/FinanceContext'
import { TableCard, tdClass, thClass } from './ReportsShared'
import { FeeProjectionPanel } from '../../../../Common/demoDomain/DemoScreens'

const FeeComparisonTab = () => {
    const { installments, students, feeCategories, financePersistence } = useFinance()
    const [klass, setKlass] = useState('All Classes')
    const [category, setCategory] = useState('All Fee Categories')
    const apiLive = Boolean(financePersistence?.apiEnabled)

    const derived = useMemo(
        () => buildFeeComparisonFromSnapshot({
            installments: installments || [],
            students: students || [],
            feeCategories: feeCategories || [],
            className: klass,
            categoryName: category,
        }),
        [category, feeCategories, installments, klass, students],
    )

    const comparison = derived.comparison || compareAcademicYears(derived.currentStats, derived.previousStats)
    const current = derived.currentStats
    const previous = derived.previousStats

    const rows = [
        ['Total Demand', previous.totalDemand, current.totalDemand],
        ['Total Concession', previous.totalConcession, current.totalConcession],
        ['Net Demand', previous.netDemand, current.netDemand],
        ['Total Collected', previous.collected, current.collected],
        ['Outstanding', previous.outstanding, current.outstanding],
        ['Fine Collected', previous.fineCollected, current.fineCollected],
    ]

    const pctChange = (thisYear, lastYear) => {
        if (!lastYear) return '—'
        const delta = ((thisYear - lastYear) / lastYear) * 100
        return `${delta >= 0 ? '↑' : '↓'} ${Math.abs(delta).toFixed(1)}%`
    }

    return (
        <div className='space-y-6'>
            <p className='text-sm text-[#667085]'>
                {apiLive
                    ? `Derived from campus fee installments (${derived.installmentCount} row${derived.installmentCount === 1 ? '' : 's'}). Prior-year cells are zero when that year has no snapshot installments.`
                    : 'Offline: derived from local installment rows when present.'}
            </p>
            <div className='flex flex-wrap gap-3'>
                <select value={klass} onChange={(event) => setKlass(event.target.value)} className='text-sm border border-[#D9D9D9] rounded-md px-3 py-2'>
                    {derived.classOptions.map((option) => (
                        <option key={option}>{option}</option>
                    ))}
                </select>
                <select value={category} onChange={(event) => setCategory(event.target.value)} className='text-sm border border-[#D9D9D9] rounded-md px-3 py-2'>
                    {derived.categoryOptions.map((option) => (
                        <option key={option}>{option}</option>
                    ))}
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
                            <th className={thClass}>{derived.previousYear}</th>
                            <th className={thClass}>{derived.currentYear}</th>
                            <th className={`${thClass} rounded-e-lg`}>Change</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map(([label, lastYear, thisYear]) => (
                            <tr key={label} className='border-b border-[#F2F4F7]'>
                                <td className={`${tdClass} rounded-s-lg font-medium text-[#1E1E1E]`}>{label}</td>
                                <td className={tdClass}>{formatCurrency(lastYear)}</td>
                                <td className={tdClass}>{formatCurrency(thisYear)}</td>
                                <td className={`${tdClass} rounded-e-lg ${thisYear >= lastYear ? 'text-[#4CAF50]' : 'text-[#FF5722]'}`}>
                                    {pctChange(thisYear, lastYear)}
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
