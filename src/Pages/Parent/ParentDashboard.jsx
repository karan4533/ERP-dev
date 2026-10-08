import React from 'react'
import { NavLink } from 'react-router-dom'
import { CalendarDays, ClipboardCheck, UsersRound } from 'lucide-react'
import { useActiveStudent } from '../../context/ActiveStudentContext'
import { formatGradeSection } from '../Student/studentPortalConfig'
import { getStudentResultSummary } from './parentStudentViewData'
import { PARENT_ROUTE_PREFIX } from './parentPortalConfig'

const ParentDashboard = () => {
    const { activeStudent, isParentPortal } = useActiveStudent()
    const summary = getStudentResultSummary(activeStudent.id)

    const quickLinks = [
        {
            title: 'Attendance',
            to: `${PARENT_ROUTE_PREFIX}/class/attendance-list`,
            icon: UsersRound,
            description: 'View attendance records',
        },
        {
            title: 'Exam Result',
            to: `${PARENT_ROUTE_PREFIX}/student-evaluation/exam-result`,
            icon: ClipboardCheck,
            description: 'Check examination results',
        },
        {
            title: 'Exam Schedule',
            to: `${PARENT_ROUTE_PREFIX}/student-evaluation/exam-schedule`,
            icon: CalendarDays,
            description: 'Upcoming exam timetable',
        },
    ]

    return (
        <section className='space-y-6'>
            <div className='bg-white rounded-2xl shadow-md p-6'>
                <p className='text-sm font-medium text-[#515DEF] uppercase tracking-wide'>
                    {isParentPortal ? 'Parent Portal' : 'Student Portal'}
                </p>
                <h1 className='text-2xl font-semibold text-[#0C1E5B] mt-2'>
                    {activeStudent.name}
                </h1>
                <p className='text-sm text-[#667085] mt-1'>
                    {formatGradeSection(activeStudent)} · Roll No. {activeStudent.rollNumber}
                </p>
                <p className='text-xs text-[#808080] mt-1'>Student ID: {activeStudent.id}</p>
            </div>

            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
                <div className='bg-[#F0F8FE] border border-[#D2E2F0] rounded-xl p-4'>
                    <span className='text-sm text-[#808080]'>Exams Appeared</span>
                    <p className='text-3xl font-bold text-[#0C1E5B] mt-2'>{summary.examAppeared}</p>
                </div>
                <div className='bg-[#F1FCF2] border border-[#D1E7CC] rounded-xl p-4'>
                    <span className='text-sm text-[#808080]'>Average Percent</span>
                    <p className='text-3xl font-bold text-[#0B6D2C] mt-2'>{summary.averagePercent}%</p>
                </div>
                <div className='bg-[#FDF3F4] border border-[#F5D7DA] rounded-xl p-4'>
                    <span className='text-sm text-[#808080]'>Highest Mark</span>
                    <p className='text-2xl font-bold text-[#980E0F] mt-2'>{summary.highestMark}</p>
                    <p className='text-xs text-[#980E0F] mt-1'>{summary.highestSubject}</p>
                </div>
                <div className='bg-[#F9F7FE] border border-[#DFDDEF] rounded-xl p-4'>
                    <span className='text-sm text-[#808080]'>Overall Grade</span>
                    <p className='text-3xl font-bold text-[#2515B4] mt-2'>{summary.overallGrade}</p>
                </div>
            </div>

            <div className='bg-white rounded-2xl shadow-md p-6'>
                <h2 className='text-xl font-semibold text-black mb-4'>Quick Access</h2>
                <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                    {quickLinks.map((link) => (
                        <NavLink
                            key={link.title}
                            to={link.to}
                            className='rounded-xl border border-[#EEF0F6] bg-[#FAFBFD] p-4 hover:border-[#515DEF] hover:bg-[#515DEF0D] transition-colors'
                        >
                            <link.icon className='text-[#515DEF] mb-3' size={22} />
                            <h3 className='text-base font-semibold text-[#0C1E5B]'>{link.title}</h3>
                            <p className='text-sm text-[#667085] mt-1'>{link.description}</p>
                        </NavLink>
                    ))}
                </div>
            </div>
        </section>
    )
}

export default ParentDashboard
