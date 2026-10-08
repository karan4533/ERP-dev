import React, { useState } from 'react'
import { Download } from 'lucide-react'
import ExportModal from '../../../Common/CommonComponents/ExportModal'
import FinancialOverviewTab from './Components/FinancialOverviewTab'
import IncomeReportsTab from './Components/IncomeReportsTab'
import ExpenditureReportsTab from './Components/ExpenditureReportsTab'
import FeeComparisonTab from './Components/FeeComparisonTab'
import TrendsPatternsTab from './Components/TrendsPatternsTab'
import { REPORTS_PERIODS, REPORTS_TABS } from './reportsAnalyticsData'

const ReportsAnalytics = () => {
    const [activeTab, setActiveTab] = useState('financial-overview')
    const [period, setPeriod] = useState(REPORTS_PERIODS[0])
    const [exportModal, setExportModal] = useState(false)

    return (
        <section className='space-y-6'>
            <div className='bg-white rounded-2xl shadow-md p-4'>
                <div className='flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4'>
                    <div>
                        <h2 className='text-xl font-semibold text-black'>Reports & Analytics</h2>
                        <p className='text-sm text-[#667085] mt-1'>
                            Academic Year 2025–26
                            {' · '}
                            All Modules
                        </p>
                    </div>
                    <div className='flex flex-wrap items-center gap-3'>
                        <select
                            value={period}
                            onChange={(event) => setPeriod(event.target.value)}
                            className='text-sm border border-[#D9D9D9] rounded-md px-3 py-2 min-w-[120px]'
                        >
                            {REPORTS_PERIODS.map((item) => (
                                <option key={item} value={item}>{item}</option>
                            ))}
                        </select>
                        <button
                            type='button'
                            onClick={() => setExportModal(true)}
                            className='inline-flex items-center gap-2 bg-[#515DEF] text-white text-sm px-4 py-2 rounded-md hover:opacity-90 transition-all cursor-pointer'
                        >
                            <Download size={16} />
                            Export
                        </button>
                    </div>
                </div>

                <div className='flex gap-6 overflow-x-auto no-scrollbar mt-6 border-b border-[#F2F4F7]'>
                    {REPORTS_TABS.map((tab) => (
                        <button
                            key={tab.id}
                            type='button'
                            onClick={() => setActiveTab(tab.id)}
                            className={`whitespace-nowrap px-1 pb-3 text-sm md:text-base font-medium cursor-pointer transition-all duration-200 ${
                                activeTab === tab.id
                                    ? 'text-[#515DEF] border-b-2 border-[#515DEF] font-semibold'
                                    : 'text-[#808080]'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {activeTab === 'financial-overview' && <FinancialOverviewTab />}
            {activeTab === 'income-reports' && <IncomeReportsTab />}
            {activeTab === 'expenditure-reports' && <ExpenditureReportsTab />}
            {activeTab === 'fee-comparison' && <FeeComparisonTab />}
            {activeTab === 'trends-patterns' && <TrendsPatternsTab />}

            <ExportModal exportModal={exportModal} setExportModal={setExportModal} />
        </section>
    )
}

export default ReportsAnalytics
