import React, { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ReactECharts from 'echarts-for-react'
import { Briefcase, CalendarOff, ClipboardList, GraduationCap, RefreshCw, UserPlus, Users, Wallet } from 'lucide-react'
import { Badge, useHrTick } from '../components/HrUi'
import { ACADEMIC_YEARS, DASHBOARD_DEPARTMENTS, DASHBOARD_MONTHS, buildHrDashboard } from './dashboardData'

const MUTED = ['#515DEF', '#8B93E8', '#B7BDEF', '#98A2B3', '#D0D5DD', '#667085']

const Card = ({ title, action, children }) => (
    <section className='bg-white rounded-2xl border border-[#EAECF0] shadow-sm p-4 h-full min-w-0'>
        <div className='flex items-start justify-between gap-3 mb-4'>
            <h3 className='text-base font-semibold text-[#101828]'>{title}</h3>
            {action}
        </div>
        {children}
    </section>
)

const Empty = ({ text }) => <p className='text-sm text-[#667085] py-8 text-center'>{text}</p>

const KPI_ICONS = [Users, Users, CalendarOff, Briefcase, ClipboardList, ClipboardList, UserPlus, Wallet]

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
    const ratingMax = Math.max(...data.performance.ratings.map((item) => item.count), 1)
    const departmentRows = showDepartments ? data.departmentRows : data.departmentRows.slice(0, 6)

    const workforceOption = {
        tooltip: { trigger: 'axis' },
        grid: { left: 110, right: 24, top: 8, bottom: 8 },
        xAxis: { type: 'value', axisLabel: { color: '#667085' }, splitLine: { lineStyle: { color: '#F2F4F7' } } },
        yAxis: { type: 'category', data: workforce.map((item) => item.name), axisLabel: { color: '#344054' } },
        series: [{ type: 'bar', data: workforce.map((item) => item.count), itemStyle: { color: '#515DEF', borderRadius: [0, 4, 4, 0] }, barWidth: 14 }],
    }
    const attendanceOption = {
        tooltip: { trigger: 'item' },
        series: [{
            type: 'pie', radius: ['58%', '78%'], center: ['50%', '50%'],
            label: { show: false },
            data: attendanceRows.filter((item) => item.count > 0).map((item, index) => ({ name: item.label, value: item.count, itemStyle: { color: MUTED[index % MUTED.length] } })),
        }],
    }
    const payrollOption = {
        tooltip: { trigger: 'axis' },
        legend: { bottom: 0, textStyle: { color: '#667085' } },
        grid: { left: 48, right: 12, top: 16, bottom: 48 },
        xAxis: { type: 'category', data: data.payroll.trend.map((item) => item.month), axisLabel: { color: '#667085' } },
        yAxis: { type: 'value', axisLabel: { color: '#667085' }, splitLine: { lineStyle: { color: '#F2F4F7' } } },
        series: [
            { name: 'Gross', type: 'line', smooth: true, data: data.payroll.trend.map((item) => item.gross), itemStyle: { color: '#515DEF' } },
            { name: 'Net', type: 'line', smooth: true, data: data.payroll.trend.map((item) => item.net), itemStyle: { color: '#98A2B3' } },
        ],
    }

    return (
        <section className='space-y-5'>
            <div className='bg-white rounded-2xl border border-[#EAECF0] shadow-sm p-4 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between'>
                <div>
                    <h2 className='text-xl font-semibold text-[#101828]'>HR Dashboard</h2>
                    <p className='text-sm text-[#667085]'>Workforce Overview & People Operations</p>
                    <p className='text-xs text-[#98A2B3] mt-1'>Academic Year: {academicYear} · {month} 2026</p>
                </div>
                <div className='flex flex-wrap gap-2'>
                    <select className='border border-[#EAECF0] rounded-md px-2 py-2 text-sm' value={academicYear} onChange={(event) => setAcademicYear(event.target.value)}>{ACADEMIC_YEARS.map((item) => <option key={item}>{item}</option>)}</select>
                    <select className='border border-[#EAECF0] rounded-md px-2 py-2 text-sm' value={department} onChange={(event) => setDepartment(event.target.value)}>{DASHBOARD_DEPARTMENTS.map((item) => <option key={item}>{item}</option>)}</select>
                    <select className='border border-[#EAECF0] rounded-md px-2 py-2 text-sm' value={month} onChange={(event) => setMonth(event.target.value)}>{DASHBOARD_MONTHS.map((item) => <option key={item}>{item}</option>)}</select>
                    <button type='button' className='border border-[#EAECF0] rounded-md px-3 py-2 text-sm inline-flex items-center gap-2' onClick={() => setRefresh((value) => value + 1)}><RefreshCw size={14} /> Refresh</button>
                </div>
            </div>

            <div className='grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4'>
                {data.kpis.map((card, index) => {
                    const Icon = KPI_ICONS[index] || Users
                    return (
                        <button key={card.label} type='button' onClick={() => navigate(card.to)} className='bg-white rounded-2xl border border-[#EAECF0] shadow-sm p-4 text-left hover:border-[#515DEF]'>
                            <div className='flex justify-between gap-3'>
                                <p className='text-xs text-[#667085]'>{card.label}</p>
                                <Icon size={16} className='text-[#515DEF] shrink-0' />
                            </div>
                            <p className='text-2xl font-semibold text-[#101828] mt-2'>{card.value}</p>
                            <p className='text-xs text-[#515DEF] mt-1'>{card.hint}</p>
                            <div className='mt-3 space-y-1'>{card.lines.filter(Boolean).map((line) => <p key={line} className='text-xs text-[#667085]'>{line}</p>)}</div>
                        </button>
                    )
                })}
            </div>

            <div className='grid grid-cols-1 lg:grid-cols-5 gap-4'>
                <div className='lg:col-span-3'>
                    <Card title='Workforce Overview'>
                        {workforce.length ? <ReactECharts option={workforceOption} style={{ height: 280 }} opts={{ renderer: 'svg' }} /> : <Empty text='No employees found for the selected filters.' />}
                        <div className='grid grid-cols-2 gap-2 mt-2'>{workforce.map((item) => <p key={item.name} className='text-xs text-[#667085]'>{item.name} · {item.count} · {item.percent}%</p>)}</div>
                    </Card>
                </div>
                <div className='lg:col-span-2'>
                    <Card title='Attendance Snapshot'>
                        {data.attendance.total ? (
                            <>
                                <div className='relative'>
                                    <ReactECharts option={attendanceOption} style={{ height: 180 }} opts={{ renderer: 'svg' }} />
                                    <p className='absolute inset-0 flex items-center justify-center text-lg font-semibold pointer-events-none'>{data.attendance.rate}%</p>
                                </div>
                                {attendanceRows.map((item) => <div key={item.label} className='flex justify-between text-sm py-1 border-b border-[#F2F4F7] last:border-0'><span className='text-[#667085]'>{item.label}</span><span>{item.count}</span></div>)}
                            </>
                        ) : <Empty text='No attendance punches found for the selected filters.' />}
                    </Card>
                </div>
            </div>

            <div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
                <Card title='Recruitment Pipeline'>
                    {data.funnel.some((item) => item.count) ? data.funnel.map((item) => (
                        <button key={item.stage} type='button' onClick={() => navigate(item.to)} className='w-full text-left mb-2'>
                            <div className='flex justify-between text-sm mb-1'><span>{item.stage}</span><span className='font-medium'>{item.count}</span></div>
                            <div className='h-2 rounded-full bg-[#F2F4F7]'><div className='h-2 rounded-full bg-[#515DEF]' style={{ width: `${Math.max(8, (item.count / funnelMax) * 100)}%` }} /></div>
                        </button>
                    )) : <Empty text='No candidates found for the selected filters.' />}
                </Card>
                <Card title='HR Action Center'>
                    {data.actions.some((item) => item.count) ? data.actions.filter((item) => item.count).map((item) => (
                        <div key={item.label} className='flex items-center gap-3 py-2 border-b border-[#F2F4F7] last:border-0'>
                            <ClipboardList size={16} className='text-[#515DEF] shrink-0' />
                            <p className='text-sm flex-1'>{item.count} {item.label}</p>
                            <Badge value={item.priority} />
                            <button type='button' className='text-sm text-[#515DEF]' onClick={() => navigate(item.to)}>View</button>
                        </div>
                    )) : <Empty text='No pending HR actions for the selected filters.' />}
                </Card>
            </div>

            <div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
                <Card title='Department Workforce' action={data.departmentRows.length > 6 ? <button type='button' className='text-sm text-[#515DEF]' onClick={() => setShowDepartments((value) => !value)}>{showDepartments ? 'Show less' : 'View all departments'}</button> : null}>
                    {departmentRows.length ? (
                        <div className='overflow-x-auto'>
                            <table className='w-full text-left text-sm'>
                                <thead><tr className='text-xs text-[#667085]'>{['Department', 'Employees', 'Present', 'Leave', 'Open Positions', 'Status'].map((heading) => <th key={heading} className='py-2 pr-3 font-medium'>{heading}</th>)}</tr></thead>
                                <tbody>{departmentRows.map((row) => (
                                    <tr key={row.department} className='border-t border-[#F2F4F7] cursor-pointer' onClick={() => navigate(row.to)}>
                                        <td className='py-2 pr-3'>{row.department}</td><td className='py-2 pr-3'>{row.employees}</td><td className='py-2 pr-3'>{row.present}</td><td className='py-2 pr-3'>{row.leave}</td><td className='py-2 pr-3'>{row.openings}</td><td className='py-2'><Badge value={row.status} /></td>
                                    </tr>
                                ))}</tbody>
                            </table>
                        </div>
                    ) : <Empty text='No department workforce found for the selected filters.' />}
                </Card>
                <Card title='Upcoming HR Events'>
                    {data.events.length ? data.events.map((item) => (
                        <button key={`${item.date}-${item.title}-${item.detail}`} type='button' onClick={() => navigate(item.to)} className='w-full text-left flex gap-3 py-2 border-b border-[#F2F4F7] last:border-0'>
                            <span className='text-xs text-[#515DEF] w-20 shrink-0'>{item.date}</span>
                            <span><span className='block text-sm font-medium'>{item.title}</span><span className='block text-xs text-[#667085]'>{item.detail}{item.time ? ` · ${item.time}` : ''}</span></span>
                        </button>
                    )) : <Empty text='No HR events found for the selected filters.' />}
                </Card>
            </div>

            <div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
                <Card title='Payroll Overview'>
                    <div className='grid grid-cols-2 gap-3 mb-4'>
                        {[['Gross Payroll', data.payroll.gross], ['Net Payable', data.payroll.net], ['Employer Contribution', data.payroll.employer], ['Total Deductions', data.payroll.deductions]].map(([label, value]) => (
                            <div key={label}><p className='text-xs text-[#667085]'>{label}</p><p className='font-semibold'>{value}</p></div>
                        ))}
                    </div>
                    <p className='text-xs text-[#667085] mb-2'>{data.payroll.status}</p>
                    {data.payroll.trend.length ? <ReactECharts option={payrollOption} style={{ height: 220 }} opts={{ renderer: 'svg' }} /> : <Empty text='No payroll trend for the selected filters.' />}
                </Card>
                <Card title='Performance Overview'>
                    {data.performance.ratings.some((item) => item.count) ? data.performance.ratings.map((item) => (
                        <div key={item.rating} className='mb-3'>
                            <div className='flex justify-between text-sm mb-1'><span>{item.rating}</span><span>{item.count}</span></div>
                            <div className='h-2 rounded-full bg-[#F2F4F7]'><div className='h-2 rounded-full bg-[#515DEF]' style={{ width: `${(item.count / ratingMax) * 100}%` }} /></div>
                        </div>
                    )) : <Empty text='No performance reviews found for the selected filters.' />}
                    <div className='grid grid-cols-2 gap-2 text-sm mt-4'>
                        <p>Reviews completed · {data.performance.completed}</p>
                        <p>Reviews pending · {data.performance.pending}</p>
                        <p>Average BSC · {data.performance.bsc}</p>
                        <p>Average audit · {data.performance.audit}</p>
                    </div>
                </Card>
            </div>

            <div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
                <Card title='People Movement'>
                    <div className='grid grid-cols-3 gap-3 mb-4 text-sm'>
                        <p>New joiners<br /><span className='text-lg font-semibold'>{data.movement.joiners}</span></p>
                        <p>Relieved / exiting<br /><span className='text-lg font-semibold'>{data.movement.exiting}</span></p>
                        <p>Net change<br /><span className='text-lg font-semibold'>{data.movement.net >= 0 ? `+${data.movement.net}` : data.movement.net}</span></p>
                    </div>
                    {data.movement.people.length ? data.movement.people.map((item) => (
                        <button key={`${item.name}-${item.detail}`} type='button' onClick={() => navigate(item.to)} className='w-full text-left py-2 border-t border-[#F2F4F7]'>
                            <span className='block text-sm font-medium'>{item.name}</span>
                            <span className='block text-xs text-[#667085]'>{item.detail}</span>
                        </button>
                    )) : <Empty text='No joiners or exits for the selected filters.' />}
                </Card>
                <Card title='Training Snapshot'>
                    <p className='text-sm text-[#667085]'>Training completion</p>
                    <p className='text-2xl font-semibold text-[#515DEF]'>{data.training.completion}%</p>
                    <div className='h-2 rounded-full bg-[#F2F4F7] my-3'><div className='h-2 rounded-full bg-[#515DEF]' style={{ width: `${data.training.completion}%` }} /></div>
                    <div className='grid grid-cols-2 gap-2 text-sm'>
                        <p>Scheduled this month · {data.training.scheduled}</p>
                        <p>Completed · {data.training.completed}</p>
                        <p>Employees trained · {data.training.trained}</p>
                        <p>Average feedback · {data.training.feedback || '—'}</p>
                    </div>
                </Card>
            </div>

            <Card title='Recent HR Activity'>
                {data.activity.length ? data.activity.map((item) => (
                    <button key={`${item.title}-${item.detail}-${item.when}`} type='button' onClick={() => navigate(item.to)} className='w-full text-left grid grid-cols-1 sm:grid-cols-[1fr_auto_auto] gap-2 py-2 border-b border-[#F2F4F7] last:border-0'>
                        <span><span className='block text-sm font-medium'>{item.title}</span><span className='block text-xs text-[#667085]'>{item.detail}</span></span>
                        <span className='text-xs text-[#98A2B3]'>{item.when}</span>
                        <span className='text-xs text-[#515DEF]'>{item.module}</span>
                    </button>
                )) : <Empty text='No HR activity found for the selected filters.' />}
            </Card>
        </section>
    )
}

export default Dashboard
