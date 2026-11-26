import React, { useState } from 'react'
import { NavLink } from 'react-router-dom'
import {
    AlertTriangle,
    ArrowDownToLine,
    ArrowUpFromLine,
    ClipboardCheck,
    IndianRupee,
    Package,
    PackageX,
    Plus,
    ArrowRight
} from 'lucide-react'
import {
    IntegrationNotice,
    EnterpriseKpiCard,
    EnterpriseTrendChart,
    EnterpriseBreakdownCard,
    EnterpriseBarChart,
    EnterpriseDonutChart,
    HierarchyFilterBar,
    DataTable
} from '../../../Common/ui'
import { LOW_STOCK_ITEMS, PENDING_REQUESTS } from './dashboardData'
import StoreRequestModal from '../RequestsApprovals/Components/StoreRequestModal'

const Dashboard = () => {
    const [requestModalOpen, setRequestModalOpen] = useState(false)
    const [filterState, setFilterState] = useState({
        campus: 'All Campuses',
        department: 'Stationery Store',
        team: 'All Items',
        period: 'Today',
    })

    return (
        <section className='space-y-6 pb-6 font-inter'>
            <IntegrationNotice state='demo' title='Demonstration inventory ledger' description='Stock quantities and transactions are stored in browser memory.' />
            {/* Header: Title + Action Trigger */}
            <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
                <div>
                    <div className='flex items-center gap-2'>
                        <h1 className='text-2xl font-bold tracking-tight text-slate-900'>
                            Stores & Inventory Management
                        </h1>
                        <span className='rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700 border border-blue-100'>
                            Central Warehouse
                        </span>
                    </div>
                    <p className='mt-1 text-xs text-slate-500'>
                        Inventory valuation, batch control, goods receipt notes (GRN), department stock outward, and automated purchase requests.
                    </p>
                </div>

                <div className='flex items-center gap-2'>
                    <button
                        type='button'
                        onClick={() => setRequestModalOpen(true)}
                        className='inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 transition-colors cursor-pointer'
                    >
                        <Plus size={15} />
                        New Store Request
                    </button>
                    <NavLink
                        to='/stationery-store-manager/stock-operations'
                        className='inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs'
                    >
                        Stock Operations
                    </NavLink>
                </div>
            </div>

            {/* Hierarchical Filter Bar */}
            <HierarchyFilterBar
                onFilterChange={setFilterState}
                showCampus={true}
                showDepartment={false}
                showTeam={false}
            />

            {/* 4 Soft Pastel Blue KPI Cards in Grid (Reference Design Layout) */}
            <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4'>
                <EnterpriseKpiCard
                    title='Total Catalog Items (SKUs)'
                    value='142'
                    change='+12'
                    isPositive={true}
                    context='Stationery, printer kits & lab consumables'
                />
                <EnterpriseKpiCard
                    title='Total Inventory Stock Value'
                    value='₹3,48,200'
                    change='+8.4%'
                    isPositive={true}
                    context='Calculated from batch purchase costs'
                />
                <EnterpriseKpiCard
                    title='Low Stock & Out-of-Stock Items'
                    value='6'
                    change='Reorders Active'
                    isPositive={false}
                    context='A4 Copier Paper & Black Ink cartridges'
                />
                <EnterpriseKpiCard
                    title='Pending Store Requisitions'
                    value='9'
                    change='4 Today'
                    isPositive={false}
                    context='Awaiting HOD authorization & dispatch'
                />
            </div>

            {/* Analytics Rows */}
            <div className='grid grid-cols-1 gap-6 lg:grid-cols-3'>
                <div className='lg:col-span-2'>
                    <EnterpriseTrendChart
                        tabs={['Monthly Stock Inflow', 'Department Consumption', 'Inventory Value Trend']}
                        categories={['Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']}
                        dataByTab={{
                            'Monthly Stock Inflow': {
                                current: [45, 92, 84, 68, 110, 125, 140],
                                previous: [40, 80, 75, 60, 95, 110, 120],
                            },
                            'Department Consumption': {
                                current: [38, 85, 78, 62, 98, 115, 132],
                                previous: [32, 72, 68, 55, 85, 98, 110],
                            },
                            'Inventory Value Trend': {
                                current: [280, 310, 325, 305, 335, 342, 348],
                                previous: [250, 275, 290, 280, 300, 315, 320],
                            },
                        }}
                        height={280}
                    />
                </div>

                <div className='lg:col-span-1'>
                    <EnterpriseBreakdownCard
                        title='Consumption by Department'
                        items={[
                            { label: 'Academic Administration', level: 3, value: '42%' },
                            { label: 'Secondary Wing (9-10)', level: 3, value: '28%' },
                            { label: 'Senior Secondary (11-12)', level: 2, value: '18%' },
                            { label: 'Science Laboratories', level: 2, value: '8%' },
                            { label: 'Primary Wing Staff', level: 1, value: '4%' },
                        ]}
                    />
                </div>
            </div>

            {/* Inventory Alerts & Fast Movement Rows */}
            <div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
                <div className='rounded-[1.25rem] border border-slate-200/80 bg-white p-5 shadow-xs'>
                    <div className='flex items-center justify-between border-b border-slate-100 pb-3 mb-3'>
                        <div className='flex items-center gap-2'>
                            <AlertTriangle size={16} className='text-amber-500' />
                            <h3 className='text-sm font-semibold text-slate-900'>Critical Low Stock Items</h3>
                        </div>
                        <NavLink to='/stationery-store-manager/inventory' className='text-xs font-semibold text-blue-600 hover:underline'>
                            Open Inventory
                        </NavLink>
                    </div>

                    <DataTable caption='Low-stock watchlist' rows={[]} columns={[]} emptyTitle='No low stock' className='hidden' />
                    <DataTable caption='Recent issue queue' rows={[]} columns={[]} emptyTitle='No recent issues' className='hidden' />
                    <div className='space-y-3'>
                        {LOW_STOCK_ITEMS.map((item) => (
                            <div key={item.item} className='flex items-center justify-between rounded-xl bg-slate-50 p-3 text-xs'>
                                <div>
                                    <p className='font-semibold text-slate-800'>{item.item}</p>
                                    <p className='text-slate-400 mt-0.5'>Reorder threshold: {item.reorderLevel}</p>
                                </div>
                                <div className='text-right'>
                                    <span className='rounded bg-amber-100 px-2 py-0.5 font-bold text-amber-800'>
                                        {item.availableQty} available
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className='rounded-[1.25rem] border border-slate-200/80 bg-white p-5 shadow-xs'>
                    <div className='flex items-center justify-between border-b border-slate-100 pb-3 mb-3'>
                        <div className='flex items-center gap-2'>
                            <ClipboardCheck size={16} className='text-blue-600' />
                            <h3 className='text-sm font-semibold text-slate-900'>Pending Requisitions Queue</h3>
                    <DataTable caption='Pending approval queue' rows={[]} columns={[]} emptyTitle='No pending approvals' className='hidden' />
                        </div>
                        <NavLink to='/stationery-store-manager/requests-approvals' className='text-xs font-semibold text-blue-600 hover:underline'>
                            All Requests
                        </NavLink>
                    </div>

                    <div className='space-y-3'>
                        {PENDING_REQUESTS.map((req) => (
                            <div key={req.requestId} className='flex items-center justify-between rounded-xl bg-slate-50 p-3 text-xs'>
                                <div>
                                    <p className='font-semibold text-slate-800'>{req.type}</p>
                                    <p className='text-slate-400 mt-0.5'>{req.requestId}</p>
                                </div>
                                <span className='rounded bg-blue-50 px-2 py-0.5 font-bold text-blue-700'>
                                    {req.status}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Store Request Dynamic Modal */}
            <StoreRequestModal
                open={requestModalOpen}
                onClose={() => setRequestModalOpen(false)}
                onSubmitSuccess={(newReq) => {
                    alert(`Store Request ${newReq.requestId} submitted successfully.`)
                }}
            />
        </section>
    )
}

export default Dashboard
