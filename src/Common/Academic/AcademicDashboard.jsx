import React, { useState } from 'react'
import {
    EnterpriseKpiCard,
    EnterpriseTrendChart,
    EnterpriseBreakdownCard,
    EnterpriseBarChart,
    EnterpriseDonutChart,
    HierarchyFilterBar
} from '../ui'
import {
    Trophy,
    Star,
    Award,
    BookOpen,
    ClipboardCheck,
    CheckCircle2,
    Clock,
    AlertCircle,
    ArrowRight,
    Users,
    Sparkles,
    Calendar
} from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { getProfileLabel } from '../../Pages/Authentication/profileOptions'

const AcademicDashboard = ({ role = 'coordinator' }) => {
    const { name: authName } = useAuth()
    const roleLabel = getProfileLabel(role)
    const displayName = authName || (role === 'director' ? 'Dr. Kavita Sharma' : role === 'principal' ? 'Dr. Ramanathan K' : 'Academic Coordinator')

    const [filterState, setFilterState] = useState({
        campus: 'All Campuses',
        department: 'Academics & Pedagogy',
        team: 'Senior Secondary (Grades 9-12)',
        period: 'Today',
    })

    return (
        <div className='space-y-6 pb-6 font-inter'>
            {/* Header: Personalized Welcome + Hierarchy Drilldown Filter */}
            <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
                <div>
                    <div className='flex items-center gap-2'>
                        <h1 className='text-2xl font-bold tracking-tight text-slate-900'>
                            Academic Overview
                        </h1>
                        <span className='rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700 border border-blue-100'>
                            {roleLabel}
                        </span>
                    </div>
                    <p className='mt-1 text-xs text-slate-500'>
                        Welcome back, <span className='font-semibold text-slate-700'>{displayName}</span>. Here is the operational pulse across curriculum, attendance, and exam trackers.
                    </p>
                </div>
            </div>

            {/* Multi-tier Drilldown Hierarchy Filter Bar */}
            <HierarchyFilterBar
                onFilterChange={setFilterState}
                showCampus={true}
                showDepartment={false}
                showTeam={true}
            />

            {/* 4 Soft Pastel Blue KPI Cards in Grid (Reference Design Layout) */}
            <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4'>
                <EnterpriseKpiCard
                    title='Total Enrolled Students'
                    value='1,420'
                    change='+4.8%'
                    isPositive={true}
                    context='100% mapped to classes & sections'
                />
                <EnterpriseKpiCard
                    title='Student Attendance Today'
                    value='96.4%'
                    change='+1.2%'
                    isPositive={true}
                    context='1,368 Present · 52 Absent · 4 On Duty'
                />
                <EnterpriseKpiCard
                    title='Pending Lesson Plans'
                    value='14'
                    change='-3'
                    isPositive={true}
                    context='6 awaiting coordinator review'
                />
                <EnterpriseKpiCard
                    title='Exam Evaluation Index'
                    value='89.4%'
                    change='+5.1%'
                    isPositive={true}
                    context='All 18 exam trackers active'
                />
            </div>

            {/* Second Row: 2/3 Dual-Spline Trend Chart + 1/3 Workload Breakdown Card */}
            <div className='grid grid-cols-1 gap-6 lg:grid-cols-3'>
                <div className='lg:col-span-2'>
                    <EnterpriseTrendChart
                        tabs={['Attendance Trends', 'Assessment Performance', 'Syllabus Coverage']}
                        categories={['Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']}
                        dataByTab={{
                            'Attendance Trends': {
                                current: [92, 95, 96, 94, 97, 96, 96.4],
                                previous: [89, 91, 93, 92, 94, 93, 94.8],
                            },
                            'Assessment Performance': {
                                current: [78, 82, 85, 84, 88, 87, 89.4],
                                previous: [74, 76, 80, 81, 82, 84, 85.0],
                            },
                            'Syllabus Coverage': {
                                current: [15, 30, 48, 62, 78, 89, 94],
                                previous: [12, 26, 42, 58, 72, 84, 90],
                            },
                        }}
                        height={280}
                    />
                </div>

                <div className='lg:col-span-1'>
                    <EnterpriseBreakdownCard
                        title='Assessment Progress by Grade'
                        items={[
                            { label: 'Grade 10 (Secondary)', level: 3, value: '96%' },
                            { label: 'Grade 12 (Sr. Secondary)', level: 3, value: '92%' },
                            { label: 'Grade 9 (Secondary)', level: 2, value: '88%' },
                            { label: 'Grade 11 (Sr. Secondary)', level: 2, value: '82%' },
                            { label: 'Middle Wing (Grades 6-8)', level: 2, value: '78%' },
                            { label: 'Primary Wing (Grades 1-5)', level: 1, value: '71%' },
                        ]}
                    />
                </div>
            </div>

            {/* Third Row: 1/2 Rounded Vertical Bar Chart + 1/2 Donut Distribution */}
            <div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
                <EnterpriseBarChart
                    title='Subject Performance Average (%)'
                    categories={['Mathematics', 'Physics', 'Chemistry', 'Biology', 'English', 'Computer']}
                    data={[88, 82, 79, 86, 92, 95]}
                    barColor='#93C5FD'
                    height={230}
                    unit='%'
                />

                <EnterpriseDonutChart
                    title='Student Performance Rating Distribution'
                    data={[
                        { name: 'Above Average (≥ 90%)', value: 52.4, color: '#1E40AF' },
                        { name: 'Average (80% - 89%)', value: 34.2, color: '#60A5FA' },
                        { name: 'Below Average (< 80%)', value: 13.4, color: '#94A3B8' },
                    ]}
                    height={230}
                />
            </div>

            {/* Priority Queues & Approvals Section */}
            <div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
                <div className='rounded-[1.25rem] border border-slate-200/80 bg-white p-5 shadow-xs'>
                    <div className='flex items-center justify-between border-b border-slate-100 pb-3 mb-3'>
                        <div className='flex items-center gap-2'>
                            <ClipboardCheck size={16} className='text-blue-600' />
                            <h3 className='text-sm font-semibold text-slate-900'>Pending Mark Evaluations</h3>
                        </div>
                        <NavLink to='/teacher/examinations/enter-marks' className='text-xs font-semibold text-blue-600 hover:underline'>
                            Open Tracker
                        </NavLink>
                    </div>

                    <div className='space-y-3'>
                        {[
                            { title: 'Grade 10-A · Split Test 3 (Mathematics)', author: 'R. Srinivasan', deadline: 'Today, 4:00 PM', count: '38/40 evaluated' },
                            { title: 'Grade 12-B · Pre-Board 1 (Physics Theory)', author: 'Ananya Deshmukh', deadline: 'Tomorrow', count: '28/32 evaluated' },
                            { title: 'Grade 9-A · Monthly Practice Test 4 (English)', author: 'Sarah Thomas', deadline: '3 Nov 2026', count: '12/38 evaluated' },
                        ].map((q) => (
                            <div key={q.title} className='flex items-center justify-between rounded-xl bg-slate-50 p-3 text-xs'>
                                <div>
                                    <p className='font-semibold text-slate-800'>{q.title}</p>
                                    <p className='text-slate-400 mt-0.5'>{q.author} · {q.count}</p>
                                </div>
                                <span className='rounded bg-blue-50 px-2 py-0.5 font-semibold text-blue-700'>
                                    {q.deadline}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className='rounded-[1.25rem] border border-slate-200/80 bg-white p-5 shadow-xs'>
                    <div className='flex items-center justify-between border-b border-slate-100 pb-3 mb-3'>
                        <div className='flex items-center gap-2'>
                            <Trophy size={16} className='text-amber-500' />
                            <h3 className='text-sm font-semibold text-slate-900'>Academic Star Ratings & Recognition</h3>
                        </div>
                        <span className='rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700 border border-amber-200'>
                            September 2025
                        </span>
                    </div>

                    <div className='space-y-3 text-xs'>
                        {/* SOY Frontrunner Spotlight */}
                        <div className='rounded-xl border border-amber-100 bg-amber-50/50 p-3'>
                            <div className='flex items-center justify-between'>
                                <span className='text-[10px] font-bold uppercase tracking-wider text-amber-700 flex items-center gap-1'>
                                    <Sparkles size={11} /> Annual Frontrunner (SOY)
                                </span>
                                <span className='rounded bg-white/80 px-1.5 py-0.5 font-bold text-amber-800 text-[11px]'>
                                    Score: 98.6
                                </span>
                            </div>
                            <div className='mt-1.5 flex items-center gap-2'>
                                <div className='w-7 h-7 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0'>
                                    AS
                                </div>
                                <div className='min-w-0 flex-1'>
                                    <p className='font-bold text-slate-900 truncate'>Aarav Sharma · Grade 10-A</p>
                                    <p className='text-[11px] text-slate-500'>3 SOM Wins · 99.2% Attendance · GPA 3.96</p>
                                </div>
                            </div>
                        </div>

                        {/* Recent Class Winners List */}
                        <div className='rounded-xl border border-slate-100 bg-slate-50/60 p-3 space-y-2'>
                            <p className='font-semibold text-slate-800 text-[11px] uppercase tracking-wider text-slate-400'>
                                Class Star of the Month Winners
                            </p>
                            <div className='grid grid-cols-2 gap-2 text-xs'>
                                <div className='rounded-lg bg-white p-2 border border-slate-100 shadow-2xs'>
                                    <div className='flex items-center justify-between'>
                                        <span className='font-bold text-slate-800'>Gr 10-A</span>
                                        <span className='text-[10px] text-emerald-600 font-semibold'>GPA 3.96</span>
                                    </div>
                                    <p className='text-slate-600 font-medium truncate text-[11px] mt-0.5'>Aarav Sharma</p>
                                </div>
                                <div className='rounded-lg bg-white p-2 border border-slate-100 shadow-2xs'>
                                    <div className='flex items-center justify-between'>
                                        <span className='font-bold text-slate-800'>Gr 10-B</span>
                                        <span className='text-[10px] text-emerald-600 font-semibold'>GPA 3.91</span>
                                    </div>
                                    <p className='text-slate-600 font-medium truncate text-[11px] mt-0.5'>Meera Iyer</p>
                                </div>
                                <div className='rounded-lg bg-white p-2 border border-slate-100 shadow-2xs'>
                                    <div className='flex items-center justify-between'>
                                        <span className='font-bold text-slate-800'>Gr 9-A</span>
                                        <span className='text-[10px] text-emerald-600 font-semibold'>GPA 3.88</span>
                                    </div>
                                    <p className='text-slate-600 font-medium truncate text-[11px] mt-0.5'>Rohan Verma</p>
                                </div>
                                <div className='rounded-lg bg-white p-2 border border-slate-100 shadow-2xs'>
                                    <div className='flex items-center justify-between'>
                                        <span className='font-bold text-slate-800'>Gr 11-A</span>
                                        <span className='text-[10px] text-emerald-600 font-semibold'>GPA 3.94</span>
                                    </div>
                                    <p className='text-slate-600 font-medium truncate text-[11px] mt-0.5'>Ananya Sen</p>
                                </div>
                            </div>
                        </div>

                        <div className='pt-1 flex justify-end'>
                            <NavLink
                                to={role === 'teacher' ? '/teacher/star-ratings/som-matrix' : '/coordinator/star-ratings/star-of-month'}
                                className='inline-flex items-center gap-1 rounded-lg bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 hover:bg-amber-100'
                            >
                                Open Recognition Workspace <ArrowRight size={12} />
                            </NavLink>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default AcademicDashboard
