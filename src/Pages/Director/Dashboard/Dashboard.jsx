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
    Trophy,
    Star,
    Sparkles,
    Landmark,
    ShieldCheck,
    TrendingUp,
    FileCheck,
    AlertCircle,
    ArrowRight
} from 'lucide-react'
import { NavLink } from 'react-router-dom'

const Dashboard = () => {
    const [filterState, setFilterState] = useState({
        campus: 'All Campuses',
        department: 'All Departments',
        team: 'All Teams / Wings',
        period: 'Academic Year 2026-27',
    })

    return (
        <div className='space-y-6 pb-6 font-inter'>
            {/* Header: Executive Command Center */}
            <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
                <div>
                    <div className='flex items-center gap-2'>
                        <h1 className='text-2xl font-bold tracking-tight text-slate-900'>
                            Managing Director Command Center
                        </h1>
                        <span className='rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700 border border-blue-100'>
                            Supreme Oversight
                        </span>
                    </div>
                    <p className='mt-1 text-xs text-slate-500'>
                        Holistic institutional pulse across the 5 Operational Pillars: Academics, Operations, Human Resources, Finance, and Quality Audit.
                    </p>
                </div>
            </div>

            {/* Hierarchical Multi-tier Drilldown Filter Bar */}
            <HierarchyFilterBar
                onFilterChange={setFilterState}
                showCampus={true}
                showDepartment={true}
                showTeam={true}
            />

            {/* 4 Soft Pastel Blue KPI Cards in Grid (Reference Design Layout) */}
            <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4'>
                <EnterpriseKpiCard
                    title='Total Enrolled Students'
                    value='2,840'
                    change='+4.2%'
                    isPositive={true}
                    context='Main Campus & City Wing combined'
                />
                <EnterpriseKpiCard
                    title='Faculty & Staff Strength'
                    value='312'
                    change='98.4%'
                    isPositive={true}
                    context='High institutional retention rate'
                />
                <EnterpriseKpiCard
                    title='Average Daily Attendance'
                    value='96.2%'
                    change='+1.1%'
                    isPositive={true}
                    context='Biometric ESSL SilkBio verified'
                />
                <EnterpriseKpiCard
                    title='Annual Fee Realization'
                    value='94.8%'
                    change='₹18.4 Cr'
                    isPositive={true}
                    context='Term 1 & Term 2 target achieved'
                />
            </div>

            {/* Second Row: 2/3 Dual-Spline Trend Chart + 1/3 Workload Breakdown Card */}
            <div className='grid grid-cols-1 gap-6 lg:grid-cols-3'>
                <div className='lg:col-span-2'>
                    <EnterpriseTrendChart
                        tabs={['Institutional Revenue', 'Operating Surplus', 'Capital Deployment']}
                        categories={['Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']}
                        dataByTab={{
                            'Institutional Revenue': {
                                current: [210, 340, 290, 310, 380, 410, 450],
                                previous: [180, 290, 260, 280, 330, 370, 400],
                            },
                            'Operating Surplus': {
                                current: [45, 82, 64, 78, 92, 104, 118],
                                previous: [38, 68, 52, 62, 75, 88, 96],
                            },
                            'Capital Deployment': {
                                current: [18, 42, 35, 28, 65, 48, 52],
                                previous: [14, 35, 29, 22, 50, 40, 44],
                            },
                        }}
                        height={280}
                    />
                </div>

                <div className='lg:col-span-1'>
                    <EnterpriseBreakdownCard
                        title='Pillar Compliance & SLA Scores'
                        items={[
                            { label: 'Quality & Process Audit', level: 3, value: '98%' },
                            { label: 'Academics & Pedagogy', level: 3, value: '96%' },
                            { label: 'Finance & Fee Realization', level: 3, value: '94%' },
                            { label: 'Human Resources (HR)', level: 2, value: '91%' },
                            { label: 'Operations & Facilities', level: 2, value: '88%' },
                            { label: 'Transport & Safety', level: 2, value: '86%' },
                        ]}
                    />
                </div>
            </div>

            {/* Third Row: 1/2 Rounded Vertical Bar Chart + 1/2 Donut Distribution */}
            <div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
                <EnterpriseBarChart
                    title='Campus Enrollment by Grade Wings'
                    categories={['Kindergarten', 'Primary (1-5)', 'Middle (6-8)', 'Secondary (9-10)', 'Sr. Sec (11-12)']}
                    data={[380, 840, 680, 520, 420]}
                    barColor='#93C5FD'
                    height={230}
                    unit=''
                />

                <EnterpriseDonutChart
                    title='Institutional Expenditure Allocation'
                    data={[
                        { name: 'Faculty & Staff Salaries', value: 54.0, color: '#1E40AF' },
                        { name: 'Campus Infrastructure & EB', value: 18.5, color: '#3B82F6' },
                        { name: 'Learning Resources & Kits', value: 14.2, color: '#93C5FD' },
                        { name: 'Transport Logistics', value: 8.8, color: '#10B981' },
                        { name: 'IT Infrastructure & Cloud', value: 4.5, color: '#64748B' },
                    ]}
                    height={230}
                />
            </div>

            {/* Bottom Row: MD High-Value Approvals (> ₹10k) & Audit Governance */}
            <div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
                <div className='rounded-[1.25rem] border border-slate-200/80 bg-white p-5 shadow-xs'>
                    <div className='flex items-center justify-between border-b border-slate-100 pb-3 mb-3'>
                        <div className='flex items-center gap-2'>
                            <FileCheck size={16} className='text-blue-600' />
                            <h3 className='text-sm font-semibold text-slate-900'>Executive Capex Approvals (&gt; ₹10,000)</h3>
                        </div>
                        <span className='rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700'>
                            MD Threshold
                        </span>
                    </div>

                    <div className='space-y-3'>
                        {[
                            { title: 'New Computer Lab High-End Workstations (20 Units)', dept: 'IT Infrastructure', amount: '₹14,50,000', status: 'Pending Review' },
                            { title: 'Solar Rooftop Inverter AMC Renewal', dept: 'Campus Maintenance', amount: '₹1,85,000', status: 'Pending Review' },
                            { title: 'Annual Robotics & STEM Kit Procurement', dept: 'Academics', amount: '₹4,20,000', status: 'Pending Review' },
                        ].map((req) => (
                            <div key={req.title} className='flex items-center justify-between rounded-xl bg-slate-50 p-3 text-xs'>
                                <div>
                                    <p className='font-semibold text-slate-800'>{req.title}</p>
                                    <p className='text-slate-400 mt-0.5'>{req.dept}</p>
                                </div>
                                <div className='text-right'>
                                    <p className='font-bold text-slate-900'>{req.amount}</p>
                                    <span className='text-[10px] text-blue-600 font-semibold cursor-pointer hover:underline'>Authorize</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className='rounded-[1.25rem] border border-slate-200/80 bg-white p-5 shadow-xs'>
                    <div className='flex items-center justify-between border-b border-slate-100 pb-3 mb-3'>
                        <div className='flex items-center gap-2'>
                            <ShieldCheck size={16} className='text-emerald-600' />
                            <h3 className='text-sm font-semibold text-slate-900'>Quality Audit ATR Clearance Health</h3>
                        </div>
                        <NavLink to='/joint-director-audit/dashboard' className='text-xs font-semibold text-blue-600 hover:underline'>
                            Audit Portal
                        </NavLink>
                    </div>

                    <div className='space-y-3 text-xs'>
                        <div className='rounded-xl border border-slate-100 bg-slate-50/60 p-3'>
                            <p className='font-semibold text-slate-800'>Root Cause Analysis (RCA) Compliance: 97.4%</p>
                            <p className='text-slate-500 mt-0.5'>All Critical and Major findings from the Term 1 Process Audit have verified Action Taken Reports (ATRs) on file with Zero overdue non-conformances.</p>
                        </div>
                        <div className='rounded-xl border border-slate-100 bg-slate-50/60 p-3 flex items-center justify-between'>
                            <div>
                                <p className='font-semibold text-slate-800'>Super Admin System Audit Trail</p>
                                <p className='text-slate-500 mt-0.5'>Immutable ledger of user login sessions, report exports, and DSR unlock events.</p>
                            </div>
                            <NavLink to='/super-admin/audit-logs' className='inline-flex items-center gap-1 rounded-lg bg-blue-50 px-2.5 py-1 font-semibold text-blue-700 hover:bg-blue-100'>
                                Inspect Logs <ArrowRight size={12} />
                            </NavLink>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Dashboard
