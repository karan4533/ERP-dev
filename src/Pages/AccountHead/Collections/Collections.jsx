import { useState } from 'react'
import { Download } from 'lucide-react'
import { IntegrationNotice, PageHeader } from '../../../Common/ui'
import CashFlowTrendsTab from './Components/CashFlowTrendsTab'
import MoneyInTab from './Components/MoneyInTab'
import MoneyOutTab from './Components/MoneyOutTab'
import OverviewTab from './Components/OverviewTab'
import TransactionTimelineTab from './Components/TransactionTimelineTab'
import { COLLECTIONS_PERIODS, COLLECTIONS_TABS } from './collectionsData'

const Collections = () => {
    const [activeTab, setActiveTab] = useState('overview')
    const [period, setPeriod] = useState(COLLECTIONS_PERIODS[0])

    return (
        <section className='space-y-5'>
            <PageHeader
                title='Collections and cash flow'
                description='Review browser-stored finance transactions separately from sample management analytics.'
                context={`${period} · Academic year 2025–26`}
                actions={(
                    <>
                        <label className='grid gap-1 text-xs font-semibold text-[var(--erp-slate)]'>Reporting period
                            <select value={period} onChange={(event) => setPeriod(event.target.value)} className='min-h-10 rounded-lg border border-[var(--erp-line-strong)] bg-white px-3 text-sm'>{COLLECTIONS_PERIODS.map((item) => <option key={item}>{item}</option>)}</select>
                        </label>
                        <button type='button' disabled title='Export requires the connected finance reporting API.' className='inline-flex min-h-10 items-center gap-2 rounded-lg border border-[var(--erp-line-strong)] bg-white px-4 text-sm font-semibold text-[var(--erp-muted)] opacity-60'><Download aria-hidden='true' size={16} /> Export unavailable</button>
                    </>
                )}
            />
            <IntegrationNotice
                state='demo'
                title='Mixed provenance is separated'
                description='Browser-stored collections appear only in the live inflow register. Summary cards, trends, expense fixtures and historical reference rows are clearly labelled sample analytics until reporting and accounting APIs are connected.'
            />
            <div className='flex gap-2 overflow-x-auto border-b border-[var(--erp-line)]' role='tablist' aria-label='Collection views'>
                {COLLECTIONS_TABS.map((tab) => (
                    <button key={tab.id} type='button' role='tab' aria-selected={activeTab === tab.id} onClick={() => setActiveTab(tab.id)} className={`min-h-11 whitespace-nowrap border-b-2 px-3 text-sm font-semibold ${activeTab === tab.id ? 'border-[var(--erp-indigo)] text-[var(--erp-indigo)]' : 'border-transparent text-[var(--erp-slate)]'}`}>{tab.label}</button>
                ))}
            </div>

            {activeTab === 'overview' && <OverviewTab onNavigate={setActiveTab} />}
            {activeTab === 'money-in' && <MoneyInTab />}
            {activeTab === 'money-out' && <MoneyOutTab />}
            {activeTab === 'transaction-timeline' && <TransactionTimelineTab />}
            {activeTab === 'cash-flow-trends' && <CashFlowTrendsTab />}
        </section>
    )
}

export default Collections
