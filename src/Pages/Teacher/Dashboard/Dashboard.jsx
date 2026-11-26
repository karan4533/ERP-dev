import React, { useState, useMemo } from 'react'
import {
    Users,
    CheckCircle2,
    Clock,
    AlertCircle,
    ArrowRight,
    Star,
    Trophy,
    Award,
    Calendar,
    BookOpen,
    ClipboardCheck,
    Search,
    MessageSquare,
    ExternalLink,
    Sparkles,
    Check
} from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../../../context/AuthContext'
import {
    EnterpriseKpiCard,
    EnterpriseTrendChart
} from '../../../Common/ui'
import { CLASS_ASSIGNMENTS, getAcademicSomRecords } from '../../../Common/Recognition/recognitionData'

const TeacherDashboard = () => {
    const { name: authName, email: authEmail } = useAuth()
    const teacherName = authName || 'Priya Menon'

    // Class Teacher Assignment (Grade 10-A)
    const assignedClassKey = 'Grade 10-A'
    const classData = CLASS_ASSIGNMENTS[assignedClassKey] || {
        room: 'Room 304, Senior Block',
        wing: 'Secondary Wing',
        studentCount: 38,
        students: []
    }

    const [searchQuery, setSearchQuery] = useState('')
    const [selectedStudent, setSelectedStudent] = useState(null)

    // Current Class Star of the Month Winner
    const somRecords = useMemo(() => getAcademicSomRecords(), [])
    const classSomWinner = useMemo(() => {
        const record = somRecords.find(
            (r) => r.classKey === assignedClassKey && r.month === 'September 2025'
        )
        if (record) return record
        // Fallback to top student in roster
        return {
            studentName: 'Aarav Sharma',
            studentId: 'STU-2024-0142',
            classKey: 'Grade 10-A',
            month: 'September 2025',
            gpa: 3.96,
            attendance: 98.8,
            conductScore: 98,
            score: 98.6,
            citation: 'Exceptional academic rigor in Advanced Calculus and outstanding leadership as Student Council President.'
        }
    }, [somRecords])

    // Filter students
    const filteredStudents = useMemo(() => {
        const query = searchQuery.toLowerCase().trim()
        if (!query) return classData.students
        return classData.students.filter(
            (s) =>
                s.name.toLowerCase().includes(query) ||
                s.rollNumber.toLowerCase().includes(query) ||
                s.id.toLowerCase().includes(query)
        )
    }, [classData.students, searchQuery])

    return (
        <div className='space-y-6 pb-8 font-inter'>
            {/* Header: Class Teacher Welcome & Scope Notice */}
            <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
                <div>
                    <div className='flex items-center gap-2'>
                        <h1 className='text-2xl font-bold tracking-tight text-slate-900'>
                            Class Teacher Dashboard
                        </h1>
                        <span className='rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700 border border-blue-100'>
                            Grade 10-A
                        </span>
                        <span className='rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-100'>
                            Active Class Scoped
                        </span>
                    </div>
                    <p className='mt-1 text-xs text-slate-500'>
                        Welcome back, <span className='font-semibold text-slate-700'>{teacherName}</span>. Managing Class Teacher operations, student roster, daily attendance, and recognition for <span className='font-medium text-blue-700'>{classData.room}</span>.
                    </p>
                </div>

                <div className='flex items-center gap-2'>
                    <NavLink
                        to='/teacher/star-ratings/som-matrix'
                        className='inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 transition'
                    >
                        <Trophy size={14} /> Star of the Month Roster
                    </NavLink>
                </div>
            </div>

            {/* 4 Soft Pastel Blue KPI Cards (Reference Visual Standard) */}
            <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4'>
                <EnterpriseKpiCard
                    title='Class 10-A Enrolled Students'
                    value={`${classData.studentCount} Students`}
                    change='Roll 01-38'
                    isPositive={true}
                    context='100% allocated to Section A'
                />
                <EnterpriseKpiCard
                    title="Today's Class Attendance"
                    value='97.4%'
                    change='37 Present · 1 Absent'
                    isPositive={true}
                    context='1 Medical leave justified on file'
                />
                <EnterpriseKpiCard
                    title='Class Star of the Month'
                    value={classSomWinner.studentName}
                    change={`GPA ${classSomWinner.gpa}`}
                    isPositive={true}
                    context='September 2025 Class Winner'
                />
                <EnterpriseKpiCard
                    title='Evaluation & Homework Queue'
                    value='4 Active Tasks'
                    change='36/38 Evaluated'
                    isPositive={true}
                    context='Vectors & Physics Lab reports'
                />
            </div>

            {/* Main Operational Layout: 2/3 Class Roster & Schedules + 1/3 Recognition & Quick Actions */}
            <div className='grid grid-cols-1 gap-6 lg:grid-cols-3'>
                {/* Left 2 Columns */}
                <div className='lg:col-span-2 space-y-6'>
                    {/* Today's Teaching Schedule */}
                    <div className='rounded-[1.25rem] border border-slate-200/80 bg-white p-5 shadow-xs'>
                        <div className='flex items-center justify-between border-b border-slate-100 pb-3 mb-3'>
                            <div className='flex items-center gap-2'>
                                <Calendar size={16} className='text-blue-600' />
                                <h3 className='text-sm font-semibold text-slate-900'>Today's Teaching & Class Schedule</h3>
                            </div>
                            <span className='rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600'>
                                4 Periods Scheduled
                            </span>
                        </div>

                        <div className='grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs'>
                            <div className='rounded-xl border border-blue-100 bg-blue-50/40 p-3'>
                                <div className='flex items-center justify-between'>
                                    <span className='font-bold text-blue-900'>Period 1 · 08:45 - 09:30 AM</span>
                                    <span className='rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-bold text-blue-800'>In Progress</span>
                                </div>
                                <p className='font-semibold text-slate-800 mt-1'>Mathematics: Chapter 7 Vectors & Coordinate Geometry</p>
                                <p className='text-slate-500 text-[11px] mt-0.5'>Grade 10-A · Room 304</p>
                            </div>
                            <div className='rounded-xl border border-slate-100 bg-slate-50/70 p-3'>
                                <div className='flex items-center justify-between'>
                                    <span className='font-bold text-slate-800'>Period 3 · 10:30 - 11:15 AM</span>
                                    <span className='rounded bg-slate-200 px-1.5 py-0.5 text-[10px] font-semibold text-slate-700'>Upcoming</span>
                                </div>
                                <p className='font-semibold text-slate-800 mt-1'>Physics Practical: Concave Mirror Focal Verification</p>
                                <p className='text-slate-500 text-[11px] mt-0.5'>Senior Physics Lab 2</p>
                            </div>
                            <div className='rounded-xl border border-slate-100 bg-slate-50/70 p-3'>
                                <div className='flex items-center justify-between'>
                                    <span className='font-bold text-slate-800'>Period 5 · 01:15 - 02:00 PM</span>
                                    <span className='rounded bg-slate-200 px-1.5 py-0.5 text-[10px] font-semibold text-slate-700'>Upcoming</span>
                                </div>
                                <p className='font-semibold text-slate-800 mt-1'>Remedial Mathematics: Quadratic Formula Problem Solving</p>
                                <p className='text-slate-500 text-[11px] mt-0.5'>Target Group (6 Students)</p>
                            </div>
                            <div className='rounded-xl border border-slate-100 bg-slate-50/70 p-3'>
                                <div className='flex items-center justify-between'>
                                    <span className='font-bold text-slate-800'>Period 7 · 03:00 - 03:45 PM</span>
                                    <span className='rounded bg-slate-200 px-1.5 py-0.5 text-[10px] font-semibold text-slate-700'>Class Hour</span>
                                </div>
                                <p className='font-semibold text-slate-800 mt-1'>Grade 10-A Class Teacher Hour & Star Mentoring</p>
                                <p className='text-slate-500 text-[11px] mt-0.5'>Room 304 · Monthly Recognition Spotlight</p>
                            </div>
                        </div>
                    </div>

                    {/* Class 10-A Student Performance & Star Roster */}
                    <div className='rounded-[1.25rem] border border-slate-200/80 bg-white p-5 shadow-xs'>
                        <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-3 mb-3'>
                            <div>
                                <h3 className='text-sm font-semibold text-slate-900'>
                                    Class 10-A Student Roster & Performance Matrix
                                </h3>
                                <p className='text-xs text-slate-500 mt-0.5'>
                                    Showing all {filteredStudents.length} students enrolled in your assigned class.
                                </p>
                            </div>
                            <div className='relative w-full sm:w-64'>
                                <Search className='absolute left-3 top-2.5 text-slate-400' size={14} />
                                <input
                                    type='text'
                                    placeholder='Search by roll or name...'
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className='w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:border-blue-500 focus:outline-none'
                                />
                            </div>
                        </div>

                        <div className='overflow-x-auto'>
                            <table className='w-full text-left text-xs'>
                                <thead>
                                    <tr className='border-b border-slate-100 text-[11px] font-semibold uppercase tracking-wider text-slate-500'>
                                        <th className='py-2.5 px-3'>Roll No</th>
                                        <th className='py-2.5 px-3'>Student Name</th>
                                        <th className='py-2.5 px-3'>Attendance</th>
                                        <th className='py-2.5 px-3'>GPA</th>
                                        <th className='py-2.5 px-3'>Conduct</th>
                                        <th className='py-2.5 px-3'>SOM Status</th>
                                        <th className='py-2.5 px-3 text-right'>Action</th>
                                    </tr>
                                </thead>
                                <tbody className='divide-y divide-slate-100 text-slate-700'>
                                    {filteredStudents.slice(0, 10).map((stu) => {
                                        const isWinner = stu.name === classSomWinner.studentName
                                        return (
                                            <tr key={stu.id} className='hover:bg-slate-50/70 transition'>
                                                <td className='py-2.5 px-3 font-mono font-semibold text-slate-800'>
                                                    {stu.rollNumber}
                                                </td>
                                                <td className='py-2.5 px-3'>
                                                    <div className='flex items-center gap-2'>
                                                        <div
                                                            className='w-6 h-6 rounded-full text-white text-[10px] font-bold flex items-center justify-center shrink-0'
                                                            style={{ backgroundColor: stu.avatarColor || '#3B82F6' }}
                                                        >
                                                            {stu.name.split(' ').map((n) => n[0]).join('')}
                                                        </div>
                                                        <span className='font-medium text-slate-900'>{stu.name}</span>
                                                    </div>
                                                </td>
                                                <td className='py-2.5 px-3 font-semibold text-slate-800'>
                                                    {stu.attendance}%
                                                </td>
                                                <td className='py-2.5 px-3 font-semibold text-emerald-700'>
                                                    {stu.gpa}
                                                </td>
                                                <td className='py-2.5 px-3'>
                                                    <span className='rounded bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-100'>
                                                        {stu.conductScore}/100
                                                    </span>
                                                </td>
                                                <td className='py-2.5 px-3'>
                                                    {isWinner ? (
                                                        <span className='inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-[10px] font-bold text-amber-700 border border-amber-200'>
                                                            <Trophy size={10} className='text-amber-500' /> Star of Month
                                                        </span>
                                                    ) : stu.somWins > 0 ? (
                                                        <span className='inline-flex items-center gap-1 text-[11px] text-slate-600'>
                                                            <Star size={11} className='text-amber-400 fill-amber-400' /> {stu.somWins} Win{stu.somWins > 1 ? 's' : ''}
                                                        </span>
                                                    ) : (
                                                        <span className='text-[11px] text-slate-400'>Candidate</span>
                                                    )}
                                                </td>
                                                <td className='py-2.5 px-3 text-right'>
                                                    <NavLink
                                                        to='/teacher/star-ratings/som-matrix'
                                                        className='inline-flex items-center gap-1 rounded-lg bg-blue-50 px-2 py-1 text-[11px] font-semibold text-blue-700 hover:bg-blue-100'
                                                    >
                                                        Review <ArrowRight size={10} />
                                                    </NavLink>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>

                        <div className='flex items-center justify-between border-t border-slate-100 pt-3 mt-3 text-xs text-slate-500'>
                            <span>Showing top 10 of {classData.studentCount} students in Grade 10-A</span>
                            <NavLink
                                to='/teacher/star-ratings/som-matrix'
                                className='font-semibold text-blue-600 hover:underline'
                            >
                                View Complete 38-Student Matrix →
                            </NavLink>
                        </div>
                    </div>
                </div>

                {/* Right Column (1/3): Star Spotlight, Class Operations & Alerts */}
                <div className='space-y-6'>
                    {/* Star of the Month Spotlight */}
                    <div className='rounded-[1.25rem] border border-amber-200/80 bg-gradient-to-b from-amber-50/60 to-white p-5 shadow-xs'>
                        <div className='flex items-center justify-between border-b border-amber-100 pb-3 mb-3'>
                            <div className='flex items-center gap-2'>
                                <Trophy size={16} className='text-amber-600' />
                                <h3 className='text-sm font-bold text-slate-900'>Class 10-A Star of the Month</h3>
                            </div>
                            <span className='rounded-full bg-amber-100/80 px-2 py-0.5 text-[10px] font-bold text-amber-800'>
                                Sep 2025
                            </span>
                        </div>

                        <div className='flex flex-col items-center text-center p-3'>
                            <div className='w-16 h-16 rounded-full bg-blue-600 text-white font-bold text-xl flex items-center justify-center shadow-md border-2 border-white ring-2 ring-amber-300'>
                                AS
                            </div>
                            <h4 className='font-bold text-slate-900 text-sm mt-3'>{classSomWinner.studentName}</h4>
                            <p className='text-xs text-slate-500'>Roll No. 01 · Grade 10-A</p>

                            <div className='grid grid-cols-3 gap-2 w-full mt-4 text-center'>
                                <div className='rounded-xl bg-white p-2 border border-slate-100 shadow-2xs'>
                                    <p className='text-[10px] text-slate-400 font-medium'>GPA</p>
                                    <p className='text-xs font-bold text-emerald-700'>{classSomWinner.gpa}</p>
                                </div>
                                <div className='rounded-xl bg-white p-2 border border-slate-100 shadow-2xs'>
                                    <p className='text-[10px] text-slate-400 font-medium'>Attendance</p>
                                    <p className='text-xs font-bold text-blue-700'>{classSomWinner.attendance}%</p>
                                </div>
                                <div className='rounded-xl bg-white p-2 border border-slate-100 shadow-2xs'>
                                    <p className='text-[10px] text-slate-400 font-medium'>Conduct</p>
                                    <p className='text-xs font-bold text-purple-700'>{classSomWinner.conductScore || 98}</p>
                                </div>
                            </div>

                            <div className='mt-3 rounded-xl bg-amber-50/70 border border-amber-100 p-2.5 text-left text-[11px] text-slate-700 italic'>
                                "{classSomWinner.citation}"
                            </div>

                            <NavLink
                                to='/teacher/star-ratings/som-matrix'
                                className='mt-4 w-full rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs py-2 text-center transition shadow-2xs'
                            >
                                Nominate October Candidates
                            </NavLink>
                        </div>
                    </div>

                    {/* Class Quick Operations */}
                    <div className='rounded-[1.25rem] border border-slate-200/80 bg-white p-5 shadow-xs'>
                        <h3 className='text-sm font-semibold text-slate-900 border-b border-slate-100 pb-3 mb-3'>
                            Class 10-A Operations
                        </h3>
                        <div className='space-y-2.5 text-xs'>
                            <NavLink
                                to='/teacher/attendance'
                                className='flex items-center justify-between rounded-xl bg-slate-50 hover:bg-blue-50/60 p-3 transition border border-slate-100'
                            >
                                <div className='flex items-center gap-2.5'>
                                    <ClipboardCheck size={16} className='text-blue-600' />
                                    <div>
                                        <p className='font-semibold text-slate-800'>Class Daily Attendance</p>
                                        <p className='text-[11px] text-slate-400'>37 of 38 students marked present</p>
                                    </div>
                                </div>
                                <ArrowRight size={14} className='text-slate-400' />
                            </NavLink>

                            <NavLink
                                to='/teacher/homework'
                                className='flex items-center justify-between rounded-xl bg-slate-50 hover:bg-blue-50/60 p-3 transition border border-slate-100'
                            >
                                <div className='flex items-center gap-2.5'>
                                    <BookOpen size={16} className='text-emerald-600' />
                                    <div>
                                        <p className='font-semibold text-slate-800'>Homework & Assignments</p>
                                        <p className='text-[11px] text-slate-400'>4 batches active, 2 pending review</p>
                                    </div>
                                </div>
                                <ArrowRight size={14} className='text-slate-400' />
                            </NavLink>

                            <NavLink
                                to='/teacher/broadcast'
                                className='flex items-center justify-between rounded-xl bg-slate-50 hover:bg-blue-50/60 p-3 transition border border-slate-100'
                            >
                                <div className='flex items-center gap-2.5'>
                                    <MessageSquare size={16} className='text-purple-600' />
                                    <div>
                                        <p className='font-semibold text-slate-800'>Send Parent Announcement</p>
                                        <p className='text-[11px] text-slate-400'>Notify Grade 10-A parents</p>
                                    </div>
                                </div>
                                <ArrowRight size={14} className='text-slate-400' />
                            </NavLink>
                        </div>
                    </div>

                    {/* Class Alerts & Notices */}
                    <div className='rounded-[1.25rem] border border-slate-200/80 bg-white p-5 shadow-xs'>
                        <div className='flex items-center gap-2 border-b border-slate-100 pb-3 mb-3'>
                            <AlertCircle size={16} className='text-blue-600' />
                            <h3 className='text-sm font-semibold text-slate-900'>Class Notices & Deadlines</h3>
                        </div>
                        <div className='space-y-3 text-xs'>
                            <div className='rounded-xl border border-blue-100 bg-blue-50/40 p-3'>
                                <p className='font-semibold text-slate-800'>Science Olympiad Nominations</p>
                                <p className='text-slate-500 text-[11px] mt-0.5'>Submit 5 eligible candidates from Grade 10-A by Friday 4:00 PM.</p>
                            </div>
                            <div className='rounded-xl border border-slate-100 bg-slate-50/60 p-3'>
                                <p className='font-semibold text-slate-800'>Upcoming PTM Schedule</p>
                                <p className='text-slate-500 text-[11px] mt-0.5'>Term 1 Parent-Teacher Meeting on Saturday 10:00 AM.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default TeacherDashboard
