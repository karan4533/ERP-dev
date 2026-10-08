import React, { useMemo } from 'react'
import FinanceDataTable from './Components/FinanceDataTable'
import { getSectionMeta, getSectionSummary, getSectionTables } from './financeOverviewData'

const FinanceSectionList = ({ sectionKey }) => {
    const meta = useMemo(() => getSectionMeta(sectionKey), [sectionKey])
    const summary = useMemo(() => getSectionSummary(sectionKey), [sectionKey])
    const tables = useMemo(() => getSectionTables(sectionKey), [sectionKey])

    if (!meta || sectionKey === 'overview') {
        return null
    }

    return (
        <section className='space-y-6'>
            <div className='bg-white rounded-2xl shadow-md p-4'>
                <h1 className='text-2xl font-semibold text-black'>{meta.label}</h1>
                <p className='text-sm text-[#667085] mt-2'>
                    Read-only financial oversight aggregated from Account Head finance modules.
                </p>
            </div>

            {summary.length > 0 && (
                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
                    {summary.map((item) => (
                        <div key={item.label} className='bg-white rounded-2xl shadow-md p-4'>
                            <p className='text-sm font-medium text-[#808080]'>{item.label}</p>
                            <p className='text-2xl font-semibold text-[#515DEF] mt-2'>{item.value}</p>
                        </div>
                    ))}
                </div>
            )}

            {tables.map((table) => (
                <FinanceDataTable
                    key={table.title}
                    title={table.title}
                    columns={table.columns}
                    rows={table.rows}
                />
            ))}
        </section>
    )
}

export default FinanceSectionList
