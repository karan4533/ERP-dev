import React, { useState } from 'react'
import {
    EnterpriseKpiCard,
    EnterpriseTrendChart,
    EnterpriseBreakdownCard,
    EnterpriseBarChart,
    EnterpriseDonutChart,
    HierarchyFilterBar
} from '../../../Common/ui'
import {
    LayoutDashboard,
    ClipboardCheck,
    AlertTriangle,
    ShieldAlert,
    Bus,
    Ticket,
    Package,
    ArrowRight
} from 'lucide-react'
import { NavLink } from 'react-router-dom'
import {
    PENDING_APPROVALS,
    CRITICAL_ALERTS,
    priorityBadgeColor
} from './dashboardData'

const Dashboard = () => {
    const [filterState, setFilterState] = useState({
        campus: 'All Campuses',
        department: 'Operations & Logistics',
        team: 'All Teams / Wings',
        period: 'Today',
    })

    return (
        <div className='space-y-6 pb-6 font-inter'>
            {/* Header: Title + Context */}
            <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
                <div>
                    <div className='flex items-center gap-2'>
                        <h1 className='text-2xl font-bold tracking-tight text-slate-900'>
                            Operations Command Center
                        </h1>
                        <span className='rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700 border border-blue-100'>
                            Joint Director Workspace
                        </span>
                    </div>
                    <p className='mt-1 text-xs text-slate-500'>
                        Live operational intelligence across Transport, Stationery Stores, IT Helpdesk, Campus Maintenance, CCTV, and Physical File Room.
                    </p>
                </div>
            </div>

            {/* Hierarchy Drilldown Filter Bar */}
            <HierarchyFilterBar
                onFilterChange={setFilterState}
                showCampus={true}
                showDepartment={true}
                showTeam={false}
            />

            {/* 4 Soft Pastel Blue KPI Cards in Grid (Reference Design Layout) */}
            <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4'>
                <EnterpriseKpiCard
                    title='Total Operations Staff'
                    value='248'
                    change='+3.4%'
                    isPositive={true}
                    context='Across 12 non-academic operational units'
                />
                <EnterpriseKpiCard
                    title='Vehicle Fleet Readiness'
                    value='22 / 22'
                    change='100%'
                    isPositive={true}
                    context='All 18 student routes active & on-time'
                />
                <EnterpriseKpiCard
                    title='Pending Approvals'
                    value='14'
                    change='₹2.4L'
                    isPositive={false}
                    context='5 purchase requisitions awaiting sign-off'
                />
                <EnterpriseKpiCard
                    title='Active Escalations & Tickets'
                    value='23'
                    change='-6'
                    isPositive={true}
                    context='3 critical IT tickets in SLA queue'
                />
            </div>

            {/* Second Row: 2/3 Dual-Spline Trend Chart + 1/3 Workload Breakdown Card */}
            <div className='grid grid-cols-1 gap-6 lg:grid-cols-3'>
                <div className='lg:col-span-2'>
                    <EnterpriseTrendChart
                        tabs={['Operations Workload', 'Ticket Resolution Rate', 'Fleet Fuel Trends']}
                        categories={['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']}
                        dataByTab={{
                            'Operations Workload': {
                                current: [24, 38, 42, 35, 48, 28, 14],
                                previous: [20, 30, 36, 32, 40, 24, 10],
                            },
                            'Ticket Resolution Rate': {
                                current: [88, 92, 94, 91, 95, 96, 98],
                                previous: [82, 85, 86, 88, 89, 90, 92],
                            },
                            'Fleet Fuel Trends': {
                                current: [140, 160, 155, 170, 165, 120, 40],
                                previous: [135, 150, 148, 162, 158, 110, 35],
                            },
                        }}
                        height={280}
                    />
                </div>

                <div className='lg:col-span-1'>
                    <EnterpriseBreakdownCard
                        title='Department Workload Level'
                        items={[
                            { label: 'Transport & Fleet', level: 3, value: '94%' },
                            { label: 'Campus Maintenance', level: 3, value: '88%' },
                            { label: 'Stationery Store', level: 2, value: '76%' },
                            { label: 'IT Support & Systems', level: 2, value: '68%' },
                            { label: 'Security & Gate Pass', level: 2, value: '62%' },
                            { label: 'Housekeeping Services', level: 1, value: '54%' },
                        ]}
                    />
                </div>
            </div>

            {/* Third Row: 1/2 Rounded Vertical Bar Chart + 1/2 Donut Distribution */}
            <div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
                <EnterpriseBarChart
                    title='Open Work Orders by Sub-Department'
                    categories={['Transport', 'Maintenance', 'Store', 'IT Support', 'CCTV/Sec', 'Housekeeping']}
                    data={[12, 18, 9, 7, 5, 14]}
                    barColor='#BAE6FD'
                    height={230}
                    unit=''
                />

                <EnterpriseDonutChart
                    title='Operations Expenditure Distribution'
                    data={[
                        { name: 'Transport Fleet & Fuel', value: 38.5, color: '#1E40AF' },
                        { name: 'Campus Maintenance (EB/DG)', value: 27.2, color: '#3B82F6' },
                        { name: 'Stationery & Stores', value: 18.1, color: '#93C5FD' },
                        { name: 'IT Infrastructure', value: 16.2, color: '#64748B' },
                    ]}
                    height={230}
                />
            </div>

            {/* Priority Queues: Approvals & Critical Alerts */}
            <div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
                <div className='rounded-[1.25rem] border border-slate-200/80 bg-white p-5 shadow-xs'>
                    <div className='flex items-center justify-between border-b border-slate-100 pb-3 mb-3'>
                        <div className='flex items-center gap-2'>
                            <ClipboardCheck size={16} className='text-blue-600' />
                            <h3 className='text-sm font-semibold text-slate-900'>Pending Purchase & Replenishment Requisitions</h3>
                        </div>
                        <NavLink to='/joint-director/approvals' className='text-xs font-semibold text-blue-600 hover:underline'>
                            View All
                        </NavLink>
                    </div>

                    <div className='space-y-3'>
                        {PENDING_APPROVALS.map((item) => (
                            <div key={item.requestId} className='flex items-center justify-between rounded-xl bg-slate-50 p-3 text-xs'>
                                <div>
                                    <p className='font-semibold text-slate-800'>{item.department} · {item.type}</p>
                                    <p className='text-slate-400 mt-0.5'>{item.requestId}</p>
                                </div>
                                <div className='text-right'>
                                    <p className='font-bold text-slate-900'>{item.amount}</p>
                                    <span className='text-[10px] text-amber-600 font-semibold'>Awaiting Sign-off</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className='rounded-[1.25rem] border border-slate-200/80 bg-white p-5 shadow-xs'>
                    <div className='flex items-center justify-between border-b border-slate-100 pb-3 mb-3'>
                        <div className='flex items-center gap-2'>
                            <ShieldAlert size={16} className='text-red-500' />
                            <h3 className='text-sm font-semibold text-slate-900'>Critical Operational Alerts</h3>
                        </div>
                        <span className='rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-semibold text-red-600'>
                            Immediate Action
                        </span>
                    </div>

                    <div className='space-y-3'>
                        {CRITICAL_ALERTS.map((alert) => (
                            <div key={alert.department} className='rounded-xl border border-red-100 bg-red-50/30 p-3 text-xs'>
                                <div className='flex items-center justify-between'>
                                    <span className='font-semibold text-slate-800'>{alert.department}</span>
                                    <span className='rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-bold text-red-700'>
                                        {alert.priority}
                                    </span>
                                </div>
                                <p className='mt-1 text-slate-600'>{alert.issue}</p>
                                <p className='mt-1 text-[10px] text-slate-400'>{alert.action}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Dashboard
