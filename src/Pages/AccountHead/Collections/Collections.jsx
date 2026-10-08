import React, { useState } from 'react'
import { Download } from 'lucide-react'
import ExportModal from '../../../Common/CommonComponents/ExportModal'
import OverviewTab from './Components/OverviewTab'
import MoneyInTab from './Components/MoneyInTab'
import MoneyOutTab from './Components/MoneyOutTab'
import TransactionTimelineTab from './Components/TransactionTimelineTab'
import CashFlowTrendsTab from './Components/CashFlowTrendsTab'
import { COLLECTIONS_PERIODS, COLLECTIONS_TABS } from './collectionsData'

const Collections = () => {
    const [activeTab, setActiveTab] = useState('overview')
    const [period, setPeriod] = useState(COLLECTIONS_PERIODS[0])
    const [exportModal, setExportModal] = useState(false)

    return (
        <section className='space-y-6'>
            <div className='bg-white rounded-2xl shadow-md p-4'>
                <div className='flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4'>
                    <div>
                        <h2 className='text-xl font-semibold text-black'>Amount Collections</h2>
                        <p className='text-sm text-[#667085] mt-1'>
                            Academic Year 2025–26
                            {' · '}
                            All Sources
                        </p>
                    </div>
                    <div className='flex flex-wrap items-center gap-3'>
                        <select
                            value={period}
                            onChange={(event) => setPeriod(event.target.value)}
                            className='text-sm border border-[#D9D9D9] rounded-md px-3 py-2 min-w-[120px]'
                        >
                            {COLLECTIONS_PERIODS.map((item) => (
                                <option key={item} value={item}>{item}</option>
                            ))}
                        </select>
                        <button
                            type='button'
                            onClick={() => setExportModal(true)}
                            className='inline-flex items-center gap-2 text-sm font-medium text-[#515DEF] border border-[#515DEF] px-4 py-2 rounded-md hover:bg-[#515DEF] hover:text-white transition-colors cursor-pointer'
                        >
                            <Download size={16} />
                            Export
                        </button>
                    </div>
                </div>

                <div className='flex gap-6 overflow-x-auto no-scrollbar mt-6 border-b border-[#F2F4F7]'>
                    {COLLECTIONS_TABS.map((tab) => (
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

            {activeTab === 'overview' && <OverviewTab />}
            {activeTab === 'money-in' && <MoneyInTab />}
            {activeTab === 'money-out' && <MoneyOutTab />}
            {activeTab === 'transaction-timeline' && <TransactionTimelineTab />}
            {activeTab === 'cash-flow-trends' && <CashFlowTrendsTab />}

            <ExportModal exportModal={exportModal} setExportModal={setExportModal} />
        </section>
    )
}

export default Collections
