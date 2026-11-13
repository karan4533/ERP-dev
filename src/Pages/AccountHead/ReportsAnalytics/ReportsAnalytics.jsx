import React, { useState } from 'react'
import { Download } from 'lucide-react'
import { IntegrationNotice, PageHeader } from '../../../Common/ui'
import FinancialOverviewTab from './Components/FinancialOverviewTab'
import IncomeReportsTab from './Components/IncomeReportsTab'
import ExpenditureReportsTab from './Components/ExpenditureReportsTab'
import FeeComparisonTab from './Components/FeeComparisonTab'
import TrendsPatternsTab from './Components/TrendsPatternsTab'
import { REPORTS_TABS } from './reportsAnalyticsData'

const ReportsAnalytics = () => {
    const [activeTab, setActiveTab] = useState('financial-overview')

    return (
        <section className='space-y-5'>
            <PageHeader
                title='Reports & analytics'
                description='Review finance report designs while the reporting and export APIs are being implemented.'
                context='Academic year 2025–26 · reference dataset · all modules'
                actions={(
                    <button type='button' disabled title='Export requires the connected finance reporting API.' className='inline-flex min-h-10 items-center gap-2 rounded-lg border border-[var(--erp-line-strong)] bg-white px-4 text-sm font-semibold text-[var(--erp-muted)] opacity-60'>
                        <Download aria-hidden='true' size={16} /> Export unavailable
                    </button>
                )}
            />

            <IntegrationNotice
                state='demo'
                title='Sample analytics dataset'
                description='Charts and comparisons on this page are labelled design fixtures. They are not generated from posted ledger entries, reconciliation or a reporting warehouse.'
            />

            <div className='rounded-[var(--erp-radius-surface)] border border-[var(--erp-line)] bg-white px-4 pt-3 sm:px-5'>
                <div className='flex gap-3 overflow-x-auto border-b border-[var(--erp-line)]' role='tablist' aria-label='Finance analytics views'>
                    {REPORTS_TABS.map((tab) => (
                        <button
                            key={tab.id}
                            type='button'
                            role='tab'
                            aria-selected={activeTab === tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`min-h-11 whitespace-nowrap border-b-2 px-3 text-sm font-semibold ${
                                activeTab === tab.id
                                    ? 'border-[var(--erp-indigo)] text-[var(--erp-indigo)]'
                                    : 'border-transparent text-[var(--erp-slate)]'
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

        </section>
    )
}

export default ReportsAnalytics
