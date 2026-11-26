import React from 'react'
import {
    ArrowRight,
    Award,
    Calendar,
    CalendarDays,
    CheckCircle,
    ClipboardCheck,
    CreditCard,
    FileText,
    GraduationCap,
    Shield,
    UsersRound,
} from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { useActiveStudent } from '../../context/ActiveStudentContext'
import { formatGradeSection } from '../../Pages/Student/studentPortalConfig'
import { getStudentResultSummary } from '../MarkEntryApproval/markEntryApprovalData'
import { EnterpriseKpiCard, StatusBadge } from '../ui'
import { getStudentGuardianDashboardData } from './studentGuardianDashboardData'

const StudentGuardianDashboard = () => {
    const { activeStudent, isParentPortal, routePrefix } = useActiveStudent()
    const dashboard = getStudentGuardianDashboardData(routePrefix)
    const resultSummary = getStudentResultSummary(activeStudent.id)

    if (!dashboard) return null

    return (
        <section className='space-y-6 pb-6 font-inter'>
            {/* Header: Personalized Student / Parent Overview */}
            <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
                <div>
                    <div className='flex items-center gap-2'>
                        <h1 className='text-2xl font-bold tracking-tight text-slate-900'>
                            {isParentPortal ? `${activeStudent.name} · Family Portal` : `Welcome, ${activeStudent.name}`}
                        </h1>
                        <span className='rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700 border border-blue-100'>
                            {isParentPortal ? 'Guardian Overview' : 'Student Workspace'}
                        </span>
                    </div>
                    <p className='mt-1 text-xs text-slate-500'>
                        {formatGradeSection(activeStudent)} · Roll #{activeStudent.rollNumber} · Student ID: {activeStudent.id}
                    </p>
                </div>

                <div className='flex items-center gap-2'>
                    <NavLink
                        to={`${routePrefix}/profile`}
                        className='inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs'
                    >
                        <UsersRound size={14} className='text-blue-600' /> Student Profile
                    </NavLink>
                    {isParentPortal && (
                        <NavLink
                            to='/parent/select-child'
                            className='inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs'
                        >
                            Switch Child
                        </NavLink>
                    )}
                </div>
            </div>

            {/* 4 Soft Pastel Blue KPI Cards in Grid (Reference Design Layout) */}
            <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4'>
                <EnterpriseKpiCard
                    title='Attendance Percentage'
                    value='97.8%'
                    change='+0.6%'
                    isPositive={true}
                    context='Biometric ESSL Gate sync verified'
                />
                <EnterpriseKpiCard
                    title='Overall Academic Grade'
                    value={resultSummary.overallGrade || 'A1 (94%)'}
                    change='Top 5%'
                    isPositive={true}
                    context={`Average: ${resultSummary.averagePercent}% across all subjects`}
                />
                <EnterpriseKpiCard
                    title='Due Assignments & Tasks'
                    value='2'
                    change='Due Tomorrow'
                    isPositive={false}
                    context='Mathematics Worksheet & Science Lab Report'
                />
                <EnterpriseKpiCard
                    title='Tuition & Transport Fee'
                    value='₹0'
                    change='All Cleared'
                    isPositive={true}
                    context='Term 1 & Term 2 paid up to date'
                />
            </div>

            {/* Guardian & Parent Access Bridge (Confirmed Decision 8.5) */}
            <div className='rounded-[1.25rem] border border-blue-200/80 bg-gradient-to-r from-blue-50/70 via-indigo-50/50 to-white p-5 shadow-xs'>
                <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-blue-100 pb-3 mb-4'>
                    <div className='flex items-center gap-2.5'>
                        <div className='p-2 rounded-xl bg-blue-600 text-white'>
                            <Shield size={18} />
                        </div>
                        <div>
                            <h3 className='text-sm font-bold text-slate-900'>
                                Guardian & Parent Portal Bridge
                            </h3>
                            <p className='text-xs text-slate-500'>
                                Confirmed Decision 8.5: Direct parent access via student profile without separate fragmented logins.
                            </p>
                        </div>
                    </div>
                    <NavLink
                        to={`${routePrefix}/profile`}
                        className='inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 hover:text-blue-800'
                    >
                        View Full Student Profile <ArrowRight size={13} />
                    </NavLink>
                </div>

                <div className='grid grid-cols-2 sm:grid-cols-4 gap-3'>
                    <NavLink
                        to={`${routePrefix}/student-evaluation/exam-result`}
                        className='flex flex-col rounded-xl border border-slate-200/80 bg-white p-3 hover:border-blue-400 hover:shadow-xs transition-all'
                    >
                        <span className='text-[10px] font-bold uppercase text-slate-400'>Academic Progress</span>
                        <span className='mt-1 text-sm font-bold text-slate-900 flex items-center justify-between'>
                            <span>Term Results</span>
                            <Award size={15} className='text-amber-500' />
                        </span>
                        <span className='mt-1 text-[11px] text-blue-600 font-semibold'>View Exam Marks →</span>
                    </NavLink>

                    <NavLink
                        to={`${routePrefix}/student-evaluation/report-cards`}
                        className='flex flex-col rounded-xl border border-slate-200/80 bg-white p-3 hover:border-blue-400 hover:shadow-xs transition-all'
                    >
                        <span className='text-[10px] font-bold uppercase text-slate-400'>Progress Report</span>
                        <span className='mt-1 text-sm font-bold text-slate-900 flex items-center justify-between'>
                            <span>CBSE Card</span>
                            <FileText size={15} className='text-blue-500' />
                        </span>
                        <span className='mt-1 text-[11px] text-blue-600 font-semibold'>Download PDF →</span>
                    </NavLink>

                    <NavLink
                        to={`${routePrefix}/payment/fees-payment`}
                        className='flex flex-col rounded-xl border border-slate-200/80 bg-white p-3 hover:border-blue-400 hover:shadow-xs transition-all'
                    >
                        <span className='text-[10px] font-bold uppercase text-slate-400'>Tuition & Transport</span>
                        <span className='mt-1 text-sm font-bold text-slate-900 flex items-center justify-between'>
                            <span>Fee Receipts</span>
                            <CreditCard size={15} className='text-emerald-500' />
                        </span>
                        <span className='mt-1 text-[11px] text-emerald-600 font-semibold'>₹0 Balance (Cleared) →</span>
                    </NavLink>

                    <NavLink
                        to={`${routePrefix}/class/attendance-report`}
                        className='flex flex-col rounded-xl border border-slate-200/80 bg-white p-3 hover:border-blue-400 hover:shadow-xs transition-all'
                    >
                        <span className='text-[10px] font-bold uppercase text-slate-400'>Punch Logs</span>
                        <span className='mt-1 text-sm font-bold text-slate-900 flex items-center justify-between'>
                            <span>Attendance</span>
                            <Calendar size={15} className='text-purple-500' />
                        </span>
                        <span className='mt-1 text-[11px] text-purple-600 font-semibold'>97.8% Biometric →</span>
                    </NavLink>
                </div>
            </div>
            <div className='grid gap-6 lg:grid-cols-3'>
                <div className='lg:col-span-2 rounded-[1.25rem] border border-slate-200/80 bg-white p-5 shadow-xs'>
                    <div className='flex items-center justify-between border-b border-slate-100 pb-3 mb-3'>
                        <div className='flex items-center gap-2'>
                            <CalendarDays size={16} className='text-blue-600' />
                            <h3 className='text-sm font-semibold text-slate-900'>Today's Class Schedule</h3>
                        </div>
                        <NavLink to={`${routePrefix}/class/timetable-list`} className='text-xs font-semibold text-blue-600 hover:underline'>
                            Full Timetable
                        </NavLink>
                    </div>

                    <div className='space-y-2'>
                        {dashboard.today.map((item) => (
                            <NavLink
                                key={`${item.time}-${item.title}`}
                                to={item.to}
                                className='flex items-center justify-between rounded-xl p-3 hover:bg-slate-50 transition-colors text-xs border border-slate-100'
                            >
                                <div className='flex items-center gap-3 min-w-0'>
                                    <span className='font-bold text-blue-600 w-16 shrink-0'>{item.time}</span>
                                    <div className='min-w-0'>
                                        <p className='font-semibold text-slate-800 truncate'>{item.title}</p>
                                        <p className='text-slate-400 mt-0.5 truncate'>{item.description}</p>
                                    </div>
                                </div>
                                <div className='flex items-center gap-2 shrink-0'>
                                    <StatusBadge status={item.status} />
                                    <ArrowRight size={14} className='text-slate-400' />
                                </div>
                            </NavLink>
                        ))}
                    </div>
                </div>

                <div className='lg:col-span-1 rounded-[1.25rem] border border-slate-200/80 bg-white p-5 shadow-xs flex flex-col justify-between'>
                    <div>
                        <div className='flex items-center justify-between border-b border-slate-100 pb-3 mb-4'>
                            <div className='flex items-center gap-2'>
                                <GraduationCap size={16} className='text-blue-600' />
                                <h3 className='text-sm font-semibold text-slate-900'>Published Results</h3>
                            </div>
                        </div>

                        <div className='grid grid-cols-2 gap-3 mb-4'>
                            {[
                                ['Exams Appeared', resultSummary.examAppeared || '6'],
                                ['Average Score', `${resultSummary.averagePercent || 94.2}%`],
                                ['Highest Subject', resultSummary.highestSubject || 'Mathematics'],
                                ['Overall Standing', resultSummary.overallGrade || 'A1 Distinction'],
                            ].map(([label, value]) => (
                                <div key={label} className='rounded-xl bg-slate-50 p-3'>
                                    <p className='text-[10px] font-semibold text-slate-400 uppercase tracking-wider'>{label}</p>
                                    <p className='mt-1 text-base font-bold text-slate-800'>{value}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    <NavLink
                        to={`${routePrefix}/student-evaluation/exam-result`}
                        className='inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl bg-blue-50 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition-colors'
                    >
                        View Comprehensive Report Card <ArrowRight size={14} />
                    </NavLink>
                </div>
            </div>

            {/* Quick Shortcuts */}
            <nav aria-label='Student portal shortcuts' className='grid gap-4 sm:grid-cols-3'>
                {[
                    { label: 'School Announcements', to: `${routePrefix}/announcement`, desc: 'Circulars & official notices' },
                    { label: 'Academic Calendar', to: `${routePrefix}/academic-calendar`, desc: 'Term dates, exams & holidays' },
                    { label: 'Teacher Communication', to: `${routePrefix}/communication/inbox`, desc: 'Direct messages & circulars' },
                ].map((item) => (
                    <NavLink
                        key={item.label}
                        to={item.to}
                        className='flex items-center justify-between rounded-[1.25rem] border border-slate-200/80 bg-white p-4 text-xs font-semibold text-slate-800 hover:border-blue-400 hover:shadow-xs transition-all'
                    >
                        <div>
                            <p className='text-slate-900 font-bold'>{item.label}</p>
                            <p className='text-slate-400 font-normal mt-0.5'>{item.desc}</p>
                        </div>
                        <ArrowRight size={16} className='text-blue-600 shrink-0 ml-3' />
                    </NavLink>
                ))}
            </nav>
        </section>
    )
}

export default StudentGuardianDashboard
