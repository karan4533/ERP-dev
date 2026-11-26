import React, { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ReactECharts from 'echarts-for-react'
import { Briefcase, CalendarOff, ClipboardList, GraduationCap, RefreshCw, UserPlus, Users, Wallet } from 'lucide-react'
import { Badge } from '../components/HrUi'
import { useHrTick } from '../components/hrUiState'
import { ACADEMIC_YEARS, DASHBOARD_DEPARTMENTS, DASHBOARD_MONTHS, buildHrDashboard } from './dashboardData'
import { DataTable, EnterpriseKpiCard, HierarchyFilterBar } from '../../../Common/ui'

const Card = ({ title, action, children }) => (
    <section className='bg-white rounded-[1.25rem] border border-slate-200/80 shadow-xs p-5 h-full min-w-0'>
        <div className='flex items-start justify-between gap-3 mb-4 border-b border-slate-100 pb-2.5'>
            <h3 className='text-sm font-semibold tracking-tight text-slate-900'>{title}</h3>
            {action}
        </div>
        {children}
    </section>
)

const Empty = ({ text }) => <p className='text-xs text-slate-400 py-8 text-center'>{text}</p>

const Dashboard = () => {
    const tick = useHrTick()
    const navigate = useNavigate()
    const [academicYear, setAcademicYear] = useState('2026–2027')
    const [department, setDepartment] = useState('All Departments')
    const [month, setMonth] = useState('September')
    const [refresh, setRefresh] = useState(0)
    const [showDepartments, setShowDepartments] = useState(false)
    const data = useMemo(() => buildHrDashboard({ academicYear, department, month, revision: `${tick}-${refresh}` }), [tick, refresh, academicYear, department, month])
    const workforce = data.workforce.filter((item) => item.count > 0)
    const attendanceRows = ['Present', 'Leave', 'Absent', 'On Duty', 'Late'].map((label) => ({ label, count: data.attendance[label] }))
    const funnelMax = Math.max(...data.funnel.map((item) => item.count), 1)
    const departmentRows = showDepartments ? data.departmentRows : data.departmentRows.slice(0, 6)
    const departmentColumns = [
        { key: 'department', label: 'Department', required: true },
        { key: 'employees', label: 'Employees' },
        { key: 'present', label: 'Present' },
        { key: 'leave', label: 'Leave' },
        { key: 'openings', label: 'Open positions' },
        { key: 'status', label: 'Status', render: (row) => <Badge value={row.status} /> },
    ]

    const workforceOption = {
        tooltip: { trigger: 'axis' },
        grid: { left: 110, right: 24, top: 8, bottom: 8 },
        xAxis: { type: 'value', axisLabel: { color: '#64748B', fontSize: 11 }, splitLine: { lineStyle: { color: '#F1F5F9' } } },
        yAxis: { type: 'category', data: workforce.map((item) => item.name), axisLabel: { color: '#1E293B', fontSize: 11 } },
        series: [{ type: 'bar', data: workforce.map((item) => item.count), itemStyle: { color: '#3B82F6', borderRadius: [0, 6, 6, 0] }, barWidth: 16 }],
    }
    const attendanceOption = {
        tooltip: { trigger: 'item' },
        series: [{
            type: 'pie', radius: ['58%', '78%'], center: ['50%', '50%'],
            label: { show: false },
            data: attendanceRows.map((item, index) => ({
                name: item.label,
                value: item.count,
                itemStyle: { color: ['#10B981', '#F59E0B', '#EF4444', '#3B82F6', '#8B5CF6'][index % 5] },
            })),
        }],
    }

    return (
        <div className='space-y-6 pb-6 font-inter'>
            {/* Header: Title + Context */}
            <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
                <div>
                    <div className='flex items-center gap-2'>
                        <h1 className='text-2xl font-bold tracking-tight text-slate-900'>HR & People Operations</h1>
                        <span className='rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700 border border-blue-100'>
                            Human Resources
                        </span>
                    </div>
                    <p className='mt-1 text-xs text-slate-500'>
                        Workforce lifecycle, staff biometric sync, leave balances, compensation claims, and recruitment funnel.
                    </p>
                </div>
            </div>

            {/* Hierarchical Filter Bar */}
            <HierarchyFilterBar
                onFilterChange={(f) => {
                    if (f.department) setDepartment(f.department)
                }}
                showCampus={true}
                showDepartment={true}
                showTeam={false}
            />

            {/* 4 Soft Pastel Blue KPI Cards in Grid (Reference Design Layout) */}
            <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4'>
                <EnterpriseKpiCard
                    title='Total Workforce'
                    value={data.kpis[0]?.value || '312'}
                    change='+3.1%'
                    isPositive={true}
                    context='Faculty, administrative & support staff'
                />
                <EnterpriseKpiCard
                    title='Biometric Attendance Rate'
                    value={`${data.attendance?.rate || 95.5}%`}
                    change='+1.4%'
                    isPositive={true}
                    context='SilkBio-101TC automated punch ingestion'
                />
                <EnterpriseKpiCard
                    title='Pending Leave Decisions'
                    value={data.kpis[2]?.value || '9'}
                    change='-2'
                    isPositive={true}
                    context='4 urgent approvals required today'
                />
                <EnterpriseKpiCard
                    title='Compensation Claims'
                    value='6'
                    change='₹24.8k'
                    isPositive={false}
                    context='Submitted & awaiting HR endorsement'
                />
            </div>

            {/* Analytics Rows */}
            <div className='grid grid-cols-1 lg:grid-cols-5 gap-6'>
                <div className='lg:col-span-3'>
                    <Card title='Workforce Distribution by Category'>
                        {workforce.length ? <ReactECharts option={workforceOption} style={{ height: 260 }} opts={{ renderer: 'svg' }} /> : <Empty text='No employees found for the selected filters.' />}
                        <div className='grid grid-cols-2 gap-2 mt-3 text-xs text-slate-500'>{workforce.map((item) => <p key={item.name} className='truncate'><span className='font-semibold text-slate-700'>{item.name}</span>: {item.count} ({item.percent}%)</p>)}</div>
                    </Card>
                </div>
                <div className='lg:col-span-2'>
                    <Card title='Staff Attendance Snapshot'>
                        {data.attendance.total ? (
                            <>
                                <div className='relative'>
                                    <ReactECharts option={attendanceOption} style={{ height: 180 }} opts={{ renderer: 'svg' }} />
                                    <p className='absolute inset-0 flex items-center justify-center text-lg font-bold text-slate-900 pointer-events-none'>{data.attendance.rate}%</p>
                                </div>
                                <div className='space-y-1 mt-2 text-xs'>
                                    {attendanceRows.map((item) => <div key={item.label} className='flex justify-between py-1 border-b border-slate-100 last:border-0'><span className='text-slate-500 font-medium'>{item.label}</span><span className='font-semibold text-slate-800'>{item.count}</span></div>)}
                                </div>
                            </>
                        ) : <Empty text='No attendance punches found for the selected filters.' />}
                    </Card>
                </div>
            </div>

            <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
                <Card title='Recruitment Pipeline Funnel'>
                    {data.funnel.some((item) => item.count) ? data.funnel.map((item) => (
                        <button key={item.stage} type='button' onClick={() => navigate(item.to)} className='w-full text-left mb-3 cursor-pointer group'>
                            <div className='flex justify-between text-xs mb-1'><span className='font-medium text-slate-700 group-hover:text-blue-600'>{item.stage}</span><span className='font-bold text-slate-900'>{item.count}</span></div>
                            <div className='h-2 rounded-full bg-slate-100 overflow-hidden'><div className='h-2 rounded-full bg-blue-600 transition-all' style={{ width: `${Math.max(8, (item.count / funnelMax) * 100)}%` }} /></div>
                        </button>
                    )) : <Empty text='No candidates found for the selected filters.' />}
                </Card>
                <Card title='HR Action Center'>
                    {data.actions.some((item) => item.count) ? data.actions.filter((item) => item.count).map((item) => (
                        <div key={item.label} className='flex items-center gap-3 py-2.5 border-b border-slate-100 last:border-0 text-xs'>
                            <ClipboardList size={16} className='text-blue-600 shrink-0' />
                            <p className='flex-1 font-medium text-slate-800'>{item.count} {item.label}</p>
                            <Badge value={item.priority} />
                            <button type='button' className='text-xs font-semibold text-blue-600 hover:underline cursor-pointer' onClick={() => navigate(item.to)}>Action</button>
                        </div>
                    )) : <Empty text='No pending HR actions for the selected filters.' />}
                </Card>
            </div>

            <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
                <Card title='Department Workforce Breakdown' action={data.departmentRows.length > 6 ? <button type='button' className='text-xs font-semibold text-blue-600 hover:underline' onClick={() => setShowDepartments((value) => !value)}>{showDepartments ? 'Show less' : 'View all'}</button> : null}>
                    {departmentRows.length ? (
                        <DataTable caption='Department workforce' rows={departmentRows} columns={departmentColumns} rowKey='department' renderActions={(row) => <button type='button' className='rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50' onClick={() => navigate(row.to)}>View</button>} />
                    ) : <Empty text='No department workforce found for the selected filters.' />}
                </Card>
                <Card title='Upcoming HR & Institutional Events'>
                    {data.events.length ? data.events.map((item) => (
                        <button key={`${item.date}-${item.title}-${item.detail}`} type='button' onClick={() => navigate(item.to)} className='w-full text-left flex items-start gap-3 py-2.5 border-b border-slate-100 last:border-0 text-xs hover:bg-slate-50 rounded-lg px-2 transition-colors'>
                            <span className='rounded bg-blue-50 px-2 py-1 font-bold text-blue-700 shrink-0'>{item.date}</span>
                            <div className='min-w-0 flex-1'>
                                <p className='font-semibold text-slate-800'>{item.title}</p>
                                <p className='text-slate-400 mt-0.5 truncate'>{item.detail}</p>
                            </div>
                        </button>
                    )) : <Empty text='No upcoming events recorded.' />}
                </Card>
            </div>
        </div>
    )
}

export default Dashboard
