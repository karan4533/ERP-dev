import React, { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
    ArrowLeft,
    Calendar,
    Award,
    Clock,
    FileText,
    History,
    BookOpen,
    Users,
    Shield,
    CheckCircle2,
    AlertCircle,
    Download,
    TrendingUp,
    Briefcase,
    CalendarDays,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import {
    getIntegratedTeacherProfile,
    getUserDatabasePermissions,
    CURRENT_ACADEMIC_YEAR,
} from './userDatabaseIntegrator'
import mo_user from '../../assets/images/no-profile.png'

const TEACHER_PROFILE_TABS = [
    { id: 'overview', label: '1. Overview', icon: TrendingUp },
    { id: 'personal', label: '2. Personal Info', icon: Users },
    { id: 'employment', label: '3. Employment History', icon: Briefcase },
    { id: 'attendance', label: '4. Attendance', icon: Calendar },
    { id: 'workload', label: '5. Timetable & Workload', icon: Clock },
    { id: 'classes', label: '6. Classes & Subjects', icon: BookOpen },
    { id: 'leave', label: '7. Leave History', icon: CalendarDays },
    { id: 'activities', label: '8. Activities & Awards', icon: Award },
    { id: 'documents', label: '9. Documents', icon: FileText },
    { id: 'history', label: '10. Complete History', icon: History },
]

const statusColorMap = {
    Active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    Resigned: 'bg-amber-50 text-amber-700 border-amber-200',
    Inactive: 'bg-slate-100 text-slate-700 border-slate-300',
    Probation: 'bg-blue-50 text-blue-700 border-blue-200',
    Approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    Completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
}

const ViewEmployeePage = ({ routeBase = '/front-office/teacher-management' }) => {
    const { id } = useParams()
    const navigate = useNavigate()
    const { role } = useAuth()
    const permissions = useMemo(() => getUserDatabasePermissions(role), [role])

    const [activeTab, setActiveTab] = useState('overview')
    const [selectedYear, setSelectedYear] = useState(CURRENT_ACADEMIC_YEAR)
    const [historyFilterType, setHistoryFilterType] = useState('All')

    const teacher = useMemo(() => {
        return getIntegratedTeacherProfile(id, selectedYear)
    }, [id, selectedYear])

    if (!teacher) {
        return (
            <section className='space-y-6'>
                <button
                    type='button'
                    onClick={() => navigate(routeBase)}
                    className='inline-flex items-center gap-2 text-sm text-indigo-600 border border-indigo-200 bg-white rounded-lg px-4 py-2 hover:bg-indigo-50 transition-colors cursor-pointer shadow-xs font-medium'
                >
                    <ArrowLeft size={16} />
                    Back to Teacher Directory
                </button>
                <div className='bg-white rounded-2xl shadow-xs border border-slate-200 p-12 text-center text-slate-500'>
                    <AlertCircle size={36} className='mx-auto text-slate-300 mb-2' />
                    Faculty member record not found or inaccessible.
                </div>
            </section>
        )
    }

    return (
        <section className='space-y-6'>
            {/* Top Navigation Row */}
            <div className='flex items-center justify-between'>
                <button
                    type='button'
                    onClick={() => navigate(routeBase)}
                    className='inline-flex items-center gap-2 text-sm text-slate-700 border border-slate-300 bg-white rounded-lg px-4 py-2 hover:bg-slate-50 transition-colors cursor-pointer shadow-xs font-medium'
                >
                    <ArrowLeft size={16} />
                    Back to Teacher Directory
                </button>
                <div className='flex items-center gap-2'>
                    <span className='text-xs font-semibold uppercase text-slate-500'>Academic Session:</span>
                    <select
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(e.target.value)}
                        className='text-xs font-semibold text-slate-800 bg-white border border-slate-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none cursor-pointer'
                    >
                        {teacher.availableAcademicYears.map((yr) => (
                            <option key={yr} value={yr}>
                                {yr} {yr === CURRENT_ACADEMIC_YEAR ? '(Current)' : ''}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Teacher Profile Header Card */}
            <div className='bg-white rounded-2xl shadow-xs border border-slate-200 p-6'>
                <div className='flex flex-col md:flex-row md:items-center justify-between gap-6'>
                    <div className='flex flex-col sm:flex-row items-start sm:items-center gap-5'>
                        <img
                            src={teacher.photo || mo_user}
                            alt={teacher.name}
                            className='w-24 h-24 rounded-full object-cover ring-4 ring-indigo-50 border border-slate-200 shadow-xs shrink-0'
                        />
                        <div>
                            <div className='flex flex-wrap items-center gap-3'>
                                <h1 className='text-2xl font-bold text-slate-900'>{teacher.name}</h1>
                                <span
                                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                                        statusColorMap[teacher.employmentStatus] || statusColorMap.Active
                                    }`}
                                >
                                    {teacher.employmentStatus}
                                </span>
                            </div>

                            <div className='grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-1.5 mt-3 text-xs'>
                                <div>
                                    <span className='text-slate-500'>Employee ID:</span>{' '}
                                    <span className='font-mono font-semibold text-slate-800'>{teacher.employeeId}</span>
                                </div>
                                <div>
                                    <span className='text-slate-500'>Department:</span>{' '}
                                    <span className='font-semibold text-slate-800'>{teacher.department}</span>
                                </div>
                                <div>
                                    <span className='text-slate-500'>Designation:</span>{' '}
                                    <span className='font-medium text-indigo-700'>{teacher.designation}</span>
                                </div>
                                <div>
                                    <span className='text-slate-500'>Employment Type:</span>{' '}
                                    <span className='font-medium text-slate-800'>{teacher.employmentType}</span>
                                </div>
                                <div>
                                    <span className='text-slate-500'>Joining Date:</span>{' '}
                                    <span className='font-medium text-slate-800'>{teacher.joiningDate}</span>
                                </div>
                                <div>
                                    <span className='text-slate-500'>Reporting Manager:</span>{' '}
                                    <span className='font-medium text-slate-800'>{teacher.reportingManager}</span>
                                </div>
                                <div>
                                    <span className='text-slate-500'>Session:</span>{' '}
                                    <span className='font-medium text-slate-800'>{teacher.academicYear}</span>
                                </div>
                                <div>
                                    <span className='text-slate-500'>Status:</span>{' '}
                                    <span className='font-medium text-emerald-700'>{teacher.employmentStatus}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 10 Navigation Profile Tabs */}
                <div className='mt-6 pt-4 border-t border-slate-200 overflow-x-auto'>
                    <nav className='flex space-x-2' aria-label='Tabs'>
                        {TEACHER_PROFILE_TABS.map((tab) => {
                            const Icon = tab.icon
                            const isActive = activeTab === tab.id
                            return (
                                <button
                                    key={tab.id}
                                    type='button'
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                                        isActive
                                            ? 'bg-indigo-600 text-white shadow-xs'
                                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                                    }`}
                                >
                                    <Icon size={15} />
                                    {tab.label}
                                </button>
                            )
                        })}
                    </nav>
                </div>
            </div>

            {/* TAB CONTENT SECTIONS */}

            {/* 1. OVERVIEW */}
            {activeTab === 'overview' && (
                <div className='space-y-6'>
                    {/* 4 KPI Cards */}
                    <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
                        <div className='bg-white p-5 rounded-2xl border border-slate-200 shadow-xs'>
                            <div className='flex items-center justify-between'>
                                <span className='text-xs font-semibold text-slate-500 uppercase'>Faculty Attendance</span>
                                <span className='p-2 bg-emerald-50 text-emerald-600 rounded-lg'>
                                    <Calendar size={18} />
                                </span>
                            </div>
                            <div className='text-2xl font-bold text-slate-900 mt-2'>
                                {teacher.overviewKPIs.attendancePercentage}
                            </div>
                            <div className='flex items-center gap-1.5 text-xs text-emerald-700 font-medium mt-1'>
                                <CheckCircle2 size={13} />
                                {teacher.overviewKPIs.attendanceStatus} (Above 95% Benchmark)
                            </div>
                        </div>

                        <div className='bg-white p-5 rounded-2xl border border-slate-200 shadow-xs'>
                            <div className='flex items-center justify-between'>
                                <span className='text-xs font-semibold text-slate-500 uppercase'>Weekly Teaching Periods</span>
                                <span className='p-2 bg-indigo-50 text-indigo-600 rounded-lg'>
                                    <Clock size={18} />
                                </span>
                            </div>
                            <div className='text-2xl font-bold text-slate-900 mt-2'>
                                {teacher.overviewKPIs.weeklyTeachingPeriods}
                            </div>
                            <div className='text-xs text-indigo-700 font-medium mt-1'>
                                Across 3 Assigned Grades
                            </div>
                        </div>

                        <div className='bg-white p-5 rounded-2xl border border-slate-200 shadow-xs'>
                            <div className='flex items-center justify-between'>
                                <span className='text-xs font-semibold text-slate-500 uppercase'>Total Teaching Hours</span>
                                <span className='p-2 bg-blue-50 text-blue-600 rounded-lg'>
                                    <TrendingUp size={18} />
                                </span>
                            </div>
                            <div className='text-2xl font-bold text-slate-900 mt-2'>
                                {teacher.overviewKPIs.totalTeachingHours}
                            </div>
                            <div className='text-xs text-blue-700 font-medium mt-1'>
                                Workload: {teacher.overviewKPIs.workloadLevel}
                            </div>
                        </div>

                        <div className='bg-white p-5 rounded-2xl border border-slate-200 shadow-xs'>
                            <div className='flex items-center justify-between'>
                                <span className='text-xs font-semibold text-slate-500 uppercase'>Remaining Leaves</span>
                                <span className='p-2 bg-purple-50 text-purple-600 rounded-lg'>
                                    <CalendarDays size={18} />
                                </span>
                            </div>
                            <div className='text-2xl font-bold text-slate-900 mt-2'>
                                {teacher.overviewKPIs.remainingLeaveBalance}
                            </div>
                            <div className='text-xs text-purple-700 font-medium mt-1'>
                                Sourced from Central HR Ledger
                            </div>
                        </div>
                    </div>

                    {/* Teacher Summary Details */}
                    <div className='bg-white rounded-2xl border border-slate-200 shadow-xs p-6'>
                        <h2 className='text-base font-bold text-slate-900 mb-4'>Academic Faculty Summary</h2>
                        <div className='grid grid-cols-1 sm:grid-cols-3 gap-6'>
                            <div className='p-4 rounded-xl bg-slate-50 border border-slate-200'>
                                <div className='text-xs font-semibold text-slate-500 uppercase'>Department & Core Role</div>
                                <div className='text-base font-bold text-slate-900 mt-1'>{teacher.department}</div>
                                <div className='text-xs text-slate-600 mt-0.5'>{teacher.designation}</div>
                            </div>
                            <div className='p-4 rounded-xl bg-slate-50 border border-slate-200'>
                                <div className='text-xs font-semibold text-slate-500 uppercase'>Assigned Grade Rosters</div>
                                <div className='text-base font-bold text-indigo-700 mt-1'>{teacher.overviewKPIs.assignedClassesSummary}</div>
                                <div className='text-xs text-slate-600 mt-0.5'>Subject: {teacher.classesAndSubjects.subjectSpecialization}</div>
                            </div>
                            <div className='p-4 rounded-xl bg-slate-50 border border-slate-200'>
                                <div className='text-xs font-semibold text-slate-500 uppercase'>Reporting Line</div>
                                <div className='text-base font-bold text-slate-900 mt-1'>{teacher.reportingManager}</div>
                                <div className='text-xs text-slate-600 mt-0.5'>Supervisory Academic Governance</div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* 2. PERSONAL INFORMATION */}
            {activeTab === 'personal' && (
                <div className='space-y-6'>
                    {/* Basic & Qualifications */}
                    <div className='bg-white rounded-2xl border border-slate-200 shadow-xs p-6'>
                        <h2 className='text-base font-bold text-slate-900 mb-4'>Faculty Credentials & Personal Profile</h2>
                        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 text-sm'>
                            <div>
                                <span className='text-xs text-slate-500 block'>Full Name</span>
                                <span className='font-semibold text-slate-800'>{teacher.personalInfo.fullName}</span>
                            </div>
                            <div>
                                <span className='text-xs text-slate-500 block'>Gender</span>
                                <span className='font-medium text-slate-800'>{teacher.personalInfo.gender}</span>
                            </div>
                            <div>
                                <span className='text-xs text-slate-500 block'>Date of Birth</span>
                                <span className='font-medium text-slate-800'>{teacher.personalInfo.dateOfBirth}</span>
                            </div>
                            <div>
                                <span className='text-xs text-slate-500 block'>Blood Group</span>
                                <span className='font-semibold text-rose-700'>{teacher.personalInfo.bloodGroup}</span>
                            </div>
                            <div className='lg:col-span-2'>
                                <span className='text-xs text-slate-500 block'>Highest Qualification</span>
                                <span className='font-semibold text-indigo-700'>{teacher.personalInfo.highestQualification}</span>
                            </div>
                            <div className='lg:col-span-2'>
                                <span className='text-xs text-slate-500 block'>Teaching Experience</span>
                                <span className='font-medium text-slate-800'>{teacher.personalInfo.totalExperience}</span>
                            </div>
                        </div>
                    </div>

                    {/* Contact & Address */}
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                        <div className='bg-white rounded-2xl border border-slate-200 shadow-xs p-6'>
                            <h2 className='text-base font-bold text-slate-900 mb-4'>Residential Address</h2>
                            <div className='space-y-3 text-sm'>
                                <div>
                                    <span className='text-xs text-slate-500 block'>Street Address</span>
                                    <span className='font-medium text-slate-800'>{teacher.personalInfo.address.street}</span>
                                </div>
                                <div className='grid grid-cols-2 gap-3'>
                                    <div>
                                        <span className='text-xs text-slate-500 block'>City / State</span>
                                        <span className='font-medium text-slate-800'>{teacher.personalInfo.address.city}, {teacher.personalInfo.address.state}</span>
                                    </div>
                                    <div>
                                        <span className='text-xs text-slate-500 block'>Country / Zip</span>
                                        <span className='font-medium text-slate-800'>{teacher.personalInfo.address.country} - {teacher.personalInfo.address.zipCode}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className='bg-white rounded-2xl border border-slate-200 shadow-xs p-6'>
                            <h2 className='text-base font-bold text-slate-900 mb-4'>Contact & Emergency Details</h2>
                            <div className='space-y-3 text-sm'>
                                <div className='grid grid-cols-2 gap-3'>
                                    <div>
                                        <span className='text-xs text-slate-500 block'>Primary Mobile</span>
                                        <span className='font-semibold text-slate-800'>{teacher.personalInfo.mobileNumber}</span>
                                    </div>
                                    <div>
                                        <span className='text-xs text-slate-500 block'>Alternative Phone</span>
                                        <span className='font-medium text-slate-800'>{teacher.personalInfo.altMobileNumber}</span>
                                    </div>
                                </div>
                                <div>
                                    <span className='text-xs text-slate-500 block'>Official Email</span>
                                    <span className='font-medium text-slate-800'>{teacher.personalInfo.email}</span>
                                </div>
                                <div className='pt-2 border-t border-slate-100'>
                                    <span className='text-xs text-slate-500 block'>Emergency Contact</span>
                                    <span className='font-medium text-slate-800'>
                                        {teacher.personalInfo.emergencyContact.name} ({teacher.personalInfo.emergencyContact.relationship}) - {teacher.personalInfo.emergencyContact.contact}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* 3. EMPLOYMENT HISTORY */}
            {activeTab === 'employment' && (
                <div className='bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4'>
                    <div>
                        <h2 className='text-base font-bold text-slate-900'>Institutional Career Progression</h2>
                        <p className='text-xs text-slate-500 mt-0.5'>
                            Complete employment audit trail from appointment through promotions and confirmations.
                        </p>
                    </div>

                    <div className='overflow-x-auto'>
                        <table className='w-full text-sm text-left'>
                            <thead className='text-xs uppercase bg-slate-100 text-slate-700 font-semibold'>
                                <tr>
                                    <th className='px-4 py-3'>Effective Date</th>
                                    <th className='px-4 py-3'>Milestone / Event</th>
                                    <th className='px-4 py-3'>Department</th>
                                    <th className='px-4 py-3'>Designation</th>
                                    <th className='px-4 py-3'>Reporting Manager</th>
                                    <th className='px-4 py-3 text-center'>Status</th>
                                    <th className='px-4 py-3'>Remarks</th>
                                </tr>
                            </thead>
                            <tbody className='divide-y divide-slate-100'>
                                {teacher.employmentHistory.map((hist, idx) => (
                                    <tr key={idx} className='hover:bg-slate-50'>
                                        <td className='px-4 py-3 font-mono text-xs text-slate-800'>{hist.date}</td>
                                        <td className='px-4 py-3 font-semibold text-slate-900'>{hist.event}</td>
                                        <td className='px-4 py-3 text-slate-600'>{hist.department}</td>
                                        <td className='px-4 py-3 font-medium text-indigo-700'>{hist.designation}</td>
                                        <td className='px-4 py-3 text-slate-600'>{hist.reportingManager}</td>
                                        <td className='px-4 py-3 text-center'>
                                            <span className='px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700'>
                                                {hist.status}
                                            </span>
                                        </td>
                                        <td className='px-4 py-3 text-xs text-slate-500'>{hist.remarks}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* 4. ATTENDANCE */}
            {activeTab === 'attendance' && (
                <div className='space-y-6'>
                    {/* Attendance KPI Strip */}
                    <div className='grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3'>
                        <div className='bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs'>
                            <div className='text-xs text-slate-500 font-medium'>Working Days</div>
                            <div className='text-xl font-bold text-slate-900'>{teacher.attendance.totalWorkingDays}</div>
                        </div>
                        <div className='bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs'>
                            <div className='text-xs text-emerald-600 font-medium'>Present Days</div>
                            <div className='text-xl font-bold text-emerald-700'>{teacher.attendance.presentDays}</div>
                        </div>
                        <div className='bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs'>
                            <div className='text-xs text-rose-600 font-medium'>Absent Days</div>
                            <div className='text-xl font-bold text-rose-700'>{teacher.attendance.absentDays}</div>
                        </div>
                        <div className='bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs'>
                            <div className='text-xs text-blue-600 font-medium'>Approved Leaves</div>
                            <div className='text-xl font-bold text-blue-700'>{teacher.attendance.approvedLeaveDays}</div>
                        </div>
                        <div className='bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs'>
                            <div className='text-xs text-amber-600 font-medium'>Late Arrivals</div>
                            <div className='text-xl font-bold text-amber-700'>{teacher.attendance.lateArrivals}</div>
                        </div>
                        <div className='bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs'>
                            <div className='text-xs text-indigo-600 font-medium'>Attendance %</div>
                            <div className='text-xl font-bold text-indigo-700'>{teacher.attendance.attendancePercentage}</div>
                        </div>
                    </div>

                    {/* Monthly Attendance Calendar */}
                    <div className='bg-white rounded-2xl border border-slate-200 shadow-xs p-6'>
                        <div className='flex items-center justify-between mb-4'>
                            <div>
                                <h2 className='text-base font-bold text-slate-900'>Faculty Monthly Attendance Calendar (October 2026)</h2>
                                <p className='text-xs text-slate-500 mt-0.5'>Biometric synchronization with eSSL Attendance Machine.</p>
                            </div>
                            <div className='flex items-center gap-3 text-xs'>
                                <span className='inline-flex items-center gap-1.5'>
                                    <span className='w-2.5 h-2.5 rounded-full bg-emerald-500'></span> Present
                                </span>
                                <span className='inline-flex items-center gap-1.5'>
                                    <span className='w-2.5 h-2.5 rounded-full bg-blue-500'></span> Leave
                                </span>
                                <span className='inline-flex items-center gap-1.5'>
                                    <span className='w-2.5 h-2.5 rounded-full bg-amber-500'></span> Late
                                </span>
                            </div>
                        </div>

                        <div className='grid grid-cols-7 gap-2 text-center text-xs'>
                            {['Thu', 'Fri', 'Sat', 'Sun', 'Mon', 'Tue', 'Wed'].map((d) => (
                                <div key={d} className='font-bold text-slate-400 py-1 uppercase tracking-wider text-[11px]'>
                                    {d}
                                </div>
                            ))}
                            {teacher.attendance.monthlyCalendarDays.map((c) => {
                                const bg =
                                    c.status === 'Present'
                                        ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                                        : c.status === 'Absent'
                                        ? 'bg-rose-50 border-rose-200 text-rose-800'
                                        : c.status === 'Leave'
                                        ? 'bg-blue-50 border-blue-200 text-blue-800'
                                        : c.status === 'Late'
                                        ? 'bg-amber-50 border-amber-200 text-amber-800'
                                        : 'bg-slate-50 border-slate-200 text-slate-400'

                                return (
                                    <div
                                        key={c.day}
                                        title={`${c.date}: ${c.label}`}
                                        className={`p-2 rounded-xl border flex flex-col justify-between h-14 ${bg}`}
                                    >
                                        <span className='font-bold text-sm'>{c.day}</span>
                                        <span className='text-[10px] truncate font-medium'>{c.label}</span>
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    {/* Daily Attendance Shift Log Table */}
                    <div className='bg-white rounded-2xl border border-slate-200 shadow-xs p-6'>
                        <h2 className='text-base font-bold text-slate-900 mb-3'>Recent Shift & Punch Log</h2>
                        <div className='overflow-x-auto'>
                            <table className='w-full text-sm text-left'>
                                <thead className='text-xs uppercase bg-slate-100 text-slate-700 font-semibold'>
                                    <tr>
                                        <th className='px-4 py-3'>Date</th>
                                        <th className='px-4 py-3'>Shift</th>
                                        <th className='px-4 py-3'>In Time</th>
                                        <th className='px-4 py-3'>Out Time</th>
                                        <th className='px-4 py-3'>Attendance Status</th>
                                        <th className='px-4 py-3'>Remarks / Verification</th>
                                    </tr>
                                </thead>
                                <tbody className='divide-y divide-slate-100'>
                                    {teacher.attendance.attendanceHistoryTable.map((att, idx) => (
                                        <tr key={idx} className='hover:bg-slate-50'>
                                            <td className='px-4 py-3 font-mono text-xs text-slate-800'>{att.date}</td>
                                            <td className='px-4 py-3 text-slate-700'>{att.shift}</td>
                                            <td className='px-4 py-3 font-mono text-xs text-slate-900 font-bold'>{att.inTime}</td>
                                            <td className='px-4 py-3 font-mono text-xs text-slate-900 font-bold'>{att.outTime}</td>
                                            <td className='px-4 py-3'>
                                                <span
                                                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                                        att.status === 'Present'
                                                            ? 'bg-emerald-50 text-emerald-700'
                                                            : att.status === 'Late'
                                                            ? 'bg-amber-50 text-amber-700'
                                                            : 'bg-blue-50 text-blue-700'
                                                    }`}
                                                >
                                                    {att.status}
                                                </span>
                                            </td>
                                            <td className='px-4 py-3 text-xs text-slate-500'>{att.remarks}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* 5. TIMETABLE & WORKLOAD (MANDATORY) */}
            {activeTab === 'workload' && (
                <div className='space-y-6'>
                    {/* Calculated Workload Summary Strip */}
                    <div className='grid grid-cols-2 sm:grid-cols-5 gap-3'>
                        <div className='bg-white p-4 rounded-xl border border-slate-200 shadow-xs'>
                            <div className='text-xs text-slate-500 font-semibold uppercase'>Total Weekly Periods</div>
                            <div className='text-2xl font-bold text-indigo-700 mt-1'>
                                {teacher.timetableAndWorkload.totalWeeklyPeriods}
                            </div>
                            <div className='text-xs text-slate-500 mt-0.5'>6 Teaching Days</div>
                        </div>
                        <div className='bg-white p-4 rounded-xl border border-slate-200 shadow-xs'>
                            <div className='text-xs text-slate-500 font-semibold uppercase'>Teaching Hours</div>
                            <div className='text-2xl font-bold text-slate-900 mt-1'>
                                {teacher.timetableAndWorkload.totalTeachingHours} Hrs
                            </div>
                            <div className='text-xs text-slate-500 mt-0.5'>45 Min Periods</div>
                        </div>
                        <div className='bg-white p-4 rounded-xl border border-slate-200 shadow-xs'>
                            <div className='text-xs text-slate-500 font-semibold uppercase'>Free Periods</div>
                            <div className='text-2xl font-bold text-emerald-700 mt-1'>
                                {teacher.timetableAndWorkload.freePeriods}
                            </div>
                            <div className='text-xs text-slate-500 mt-0.5'>Planning & Mentoring</div>
                        </div>
                        <div className='bg-white p-4 rounded-xl border border-slate-200 shadow-xs'>
                            <div className='text-xs text-slate-500 font-semibold uppercase'>Class Count</div>
                            <div className='text-2xl font-bold text-slate-900 mt-1'>
                                {teacher.timetableAndWorkload.classCount} Classes
                            </div>
                            <div className='text-xs text-slate-500 mt-0.5'>Grades 10-A, 10-B, 9-A</div>
                        </div>
                        <div className='bg-white p-4 rounded-xl border border-slate-200 shadow-xs'>
                            <div className='text-xs text-slate-500 font-semibold uppercase'>Daily Workload</div>
                            <div className='text-2xl font-bold text-purple-700 mt-1'>
                                4 Periods / Day
                            </div>
                            <div className='text-xs text-slate-500 mt-0.5'>Balanced Distribution</div>
                        </div>
                    </div>

                    {/* Weekly Timetable Grid */}
                    <div className='bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4'>
                        <div className='flex items-center justify-between'>
                            <div>
                                <h2 className='text-base font-bold text-slate-900'>Weekly Teaching Schedule</h2>
                                <p className='text-xs text-slate-500 mt-0.5'>
                                    Calculated from live academic timetable assignments for {teacher.academicYear}.
                                </p>
                            </div>
                        </div>

                        <div className='overflow-x-auto'>
                            <table className='w-full text-sm text-left border border-slate-200 rounded-xl overflow-hidden'>
                                <thead className='text-xs uppercase bg-slate-100 text-slate-700 font-semibold border-b border-slate-200'>
                                    <tr>
                                        <th className='px-3 py-3 w-16 text-center'>Period</th>
                                        <th className='px-3 py-3 w-32'>Time Slot</th>
                                        <th className='px-3 py-3'>Monday</th>
                                        <th className='px-3 py-3'>Tuesday</th>
                                        <th className='px-3 py-3'>Wednesday</th>
                                        <th className='px-3 py-3'>Thursday</th>
                                        <th className='px-3 py-3'>Friday</th>
                                        <th className='px-3 py-3'>Saturday</th>
                                    </tr>
                                </thead>
                                <tbody className='divide-y divide-slate-100'>
                                    {teacher.timetableAndWorkload.weeklySchedule.map((slot, idx) => (
                                        <tr
                                            key={idx}
                                            className={
                                                slot.period === 'Break' || slot.period === 'Lunch'
                                                    ? 'bg-amber-50/60 font-medium text-amber-900'
                                                    : 'hover:bg-slate-50'
                                            }
                                        >
                                            <td className='px-3 py-3 font-bold text-center text-slate-800'>{slot.period}</td>
                                            <td className='px-3 py-3 font-mono text-xs text-slate-500'>{slot.time}</td>
                                            <td className='px-3 py-3 text-xs'>{slot.mon}</td>
                                            <td className='px-3 py-3 text-xs'>{slot.tue}</td>
                                            <td className='px-3 py-3 text-xs'>{slot.wed}</td>
                                            <td className='px-3 py-3 text-xs'>{slot.thu}</td>
                                            <td className='px-3 py-3 text-xs'>{slot.fri}</td>
                                            <td className='px-3 py-3 text-xs'>{slot.sat}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Assigned Classes & Subjects Table */}
                    <div className='bg-white rounded-2xl border border-slate-200 shadow-xs p-6'>
                        <h2 className='text-base font-bold text-slate-900 mb-3'>Assigned Classes & Academic Scope</h2>
                        <div className='overflow-x-auto'>
                            <table className='w-full text-sm text-left'>
                                <thead className='text-xs uppercase bg-slate-100 text-slate-700 font-semibold'>
                                    <tr>
                                        <th className='px-4 py-3'>Class</th>
                                        <th className='px-4 py-3'>Section</th>
                                        <th className='px-4 py-3'>Subject</th>
                                        <th className='px-4 py-3'>Assigned Faculty Role</th>
                                        <th className='px-4 py-3 text-center'>Periods / Week</th>
                                        <th className='px-4 py-3'>Classroom</th>
                                        <th className='px-4 py-3'>Effective Date</th>
                                    </tr>
                                </thead>
                                <tbody className='divide-y divide-slate-100'>
                                    {teacher.timetableAndWorkload.assignedClasses.map((cls, idx) => (
                                        <tr key={idx} className='hover:bg-slate-50'>
                                            <td className='px-4 py-3 font-bold text-slate-900'>{cls.className}</td>
                                            <td className='px-4 py-3 font-semibold text-indigo-700'>{cls.section}</td>
                                            <td className='px-4 py-3 text-slate-800'>{cls.subject}</td>
                                            <td className='px-4 py-3 font-medium text-slate-700'>{cls.role}</td>
                                            <td className='px-4 py-3 text-center font-bold text-slate-900'>{cls.periodsPerWeek}</td>
                                            <td className='px-4 py-3 text-slate-600'>{cls.room}</td>
                                            <td className='px-4 py-3 text-xs text-slate-500'>{cls.effectiveDate}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* 6. CLASSES & SUBJECTS */}
            {activeTab === 'classes' && (
                <div className='bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4'>
                    <div>
                        <h2 className='text-base font-bold text-slate-900'>Curriculum & Subject Specialization</h2>
                        <p className='text-xs text-slate-500 mt-0.5'>
                            Academic allocations under {teacher.classesAndSubjects.curriculum}.
                        </p>
                    </div>

                    <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                        {teacher.classesAndSubjects.assignedClasses.map((c, idx) => (
                            <div key={idx} className='p-5 rounded-xl border border-slate-200 bg-slate-50 space-y-2'>
                                <div className='flex items-center justify-between'>
                                    <div className='text-lg font-bold text-slate-900'>{c.className} - {c.section}</div>
                                    <span className='px-2.5 py-0.5 bg-indigo-100 text-indigo-800 rounded-full text-xs font-semibold'>
                                        {c.room}
                                    </span>
                                </div>
                                <div className='text-sm font-semibold text-indigo-700'>{c.subject}</div>
                                <div className='text-xs text-slate-600'>{c.role}</div>
                                <div className='pt-2 border-t border-slate-200 text-xs font-medium text-slate-700 flex justify-between'>
                                    <span>Weekly Load:</span>
                                    <span className='font-bold text-slate-900'>{c.periodsPerWeek} Periods / Wk</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* 7. LEAVE HISTORY */}
            {activeTab === 'leave' && (
                <div className='space-y-6'>
                    {/* Leave Balances Cards */}
                    <div className='grid grid-cols-2 sm:grid-cols-4 gap-4'>
                        <div className='bg-white p-5 rounded-2xl border border-slate-200 shadow-xs'>
                            <div className='text-xs text-slate-500 font-semibold uppercase'>Casual Leave (CL)</div>
                            <div className='text-2xl font-bold text-emerald-700 mt-2'>
                                {teacher.leaveHistory.balances.casual.remaining} / {teacher.leaveHistory.balances.casual.total}
                            </div>
                            <div className='text-xs text-slate-500 mt-1'>
                                Used: {teacher.leaveHistory.balances.casual.used} Days
                            </div>
                        </div>

                        <div className='bg-white p-5 rounded-2xl border border-slate-200 shadow-xs'>
                            <div className='text-xs text-slate-500 font-semibold uppercase'>Sick Leave (SL)</div>
                            <div className='text-2xl font-bold text-blue-700 mt-2'>
                                {teacher.leaveHistory.balances.sick.remaining} / {teacher.leaveHistory.balances.sick.total}
                            </div>
                            <div className='text-xs text-slate-500 mt-1'>
                                Used: {teacher.leaveHistory.balances.sick.used} Days
                            </div>
                        </div>

                        <div className='bg-white p-5 rounded-2xl border border-slate-200 shadow-xs'>
                            <div className='text-xs text-slate-500 font-semibold uppercase'>Earned Leave (EL)</div>
                            <div className='text-2xl font-bold text-indigo-700 mt-2'>
                                {teacher.leaveHistory.balances.earned.remaining} / {teacher.leaveHistory.balances.earned.total}
                            </div>
                            <div className='text-xs text-indigo-600 font-medium mt-1'>
                                Carried Forward: +{teacher.leaveHistory.balances.earned.carriedOver} Days
                            </div>
                        </div>

                        <div className='bg-white p-5 rounded-2xl border border-slate-200 shadow-xs'>
                            <div className='text-xs text-slate-500 font-semibold uppercase'>Maternity / Paternity</div>
                            <div className='text-2xl font-bold text-purple-700 mt-2'>
                                {teacher.leaveHistory.balances.maternityPaternity.remaining} Days
                            </div>
                            <div className='text-xs text-slate-500 mt-1'>Statutory Policy Sourced</div>
                        </div>
                    </div>

                    {/* Carry-Forward Transactions Table */}
                    <div className='bg-white rounded-2xl border border-slate-200 shadow-xs p-6'>
                        <h2 className='text-base font-bold text-slate-900 mb-3'>Leave Carry-Forward History</h2>
                        <div className='overflow-x-auto'>
                            <table className='w-full text-sm text-left'>
                                <thead className='text-xs uppercase bg-slate-100 text-slate-700 font-semibold'>
                                    <tr>
                                        <th className='px-4 py-3'>Academic Year</th>
                                        <th className='px-4 py-3'>Leave Type</th>
                                        <th className='px-4 py-3 text-center'>Carried Over</th>
                                        <th className='px-4 py-3 text-center'>Lapsed</th>
                                        <th className='px-4 py-3'>Approved By</th>
                                        <th className='px-4 py-3'>Effective Date</th>
                                        <th className='px-4 py-3'>Remarks</th>
                                    </tr>
                                </thead>
                                <tbody className='divide-y divide-slate-100'>
                                    {teacher.leaveHistory.carryForwardTransactions.map((c, idx) => (
                                        <tr key={idx} className='hover:bg-slate-50'>
                                            <td className='px-4 py-3 font-semibold text-slate-900'>{c.academicYear}</td>
                                            <td className='px-4 py-3 text-slate-800'>{c.leaveType}</td>
                                            <td className='px-4 py-3 text-center font-bold text-emerald-700'>+{c.carriedOver} Days</td>
                                            <td className='px-4 py-3 text-center text-slate-500'>{c.lapsedDays} Days</td>
                                            <td className='px-4 py-3 text-slate-600'>{c.approvedBy}</td>
                                            <td className='px-4 py-3 text-xs text-slate-500'>{c.effectiveDate}</td>
                                            <td className='px-4 py-3 text-xs text-slate-500'>{c.remarks}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Leave Applications Table */}
                    <div className='bg-white rounded-2xl border border-slate-200 shadow-xs p-6'>
                        <h2 className='text-base font-bold text-slate-900 mb-3'>Leave Applications & Approvals</h2>
                        <div className='overflow-x-auto'>
                            <table className='w-full text-sm text-left'>
                                <thead className='text-xs uppercase bg-slate-100 text-slate-700 font-semibold'>
                                    <tr>
                                        <th className='px-4 py-3'>Leave Type</th>
                                        <th className='px-4 py-3'>Dates</th>
                                        <th className='px-4 py-3 text-center'>Total Days</th>
                                        <th className='px-4 py-3'>Reason</th>
                                        <th className='px-4 py-3'>Approved By</th>
                                        <th className='px-4 py-3 text-center'>Status</th>
                                    </tr>
                                </thead>
                                <tbody className='divide-y divide-slate-100'>
                                    {teacher.leaveHistory.leaveApplications.map((app, idx) => (
                                        <tr key={idx} className='hover:bg-slate-50'>
                                            <td className='px-4 py-3 font-semibold text-slate-900'>{app.leaveType}</td>
                                            <td className='px-4 py-3 text-slate-800'>{app.dates}</td>
                                            <td className='px-4 py-3 text-center font-bold text-slate-900'>{app.totalDays}</td>
                                            <td className='px-4 py-3 text-xs text-slate-600'>{app.reason}</td>
                                            <td className='px-4 py-3 text-xs text-slate-600'>{app.approvedBy}</td>
                                            <td className='px-4 py-3 text-center'>
                                                <span className='px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700'>
                                                    {app.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* 8. ACTIVITIES & ACHIEVEMENTS */}
            {activeTab === 'activities' && (
                <div className='bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4'>
                    <div>
                        <h2 className='text-base font-bold text-slate-900'>Faculty Professional Contributions</h2>
                        <p className='text-xs text-slate-500 mt-0.5'>Certifications, awards, and pedagogical publications.</p>
                    </div>

                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                        {teacher.activitiesAndAchievements.map((act, idx) => (
                            <div key={idx} className='p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2'>
                                <div className='flex items-start justify-between gap-2'>
                                    <div className='font-bold text-slate-900 text-sm'>{act.title}</div>
                                    <span className='px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded-md text-[11px] font-semibold shrink-0'>
                                        {act.category}
                                    </span>
                                </div>
                                <div className='text-xs text-slate-500'>
                                    {act.date} · Issued by {act.issuedBy}
                                </div>
                                <div className='text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200 inline-block'>
                                    {act.award}
                                </div>
                                <p className='text-xs text-slate-700 pt-1'>{act.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* 9. DOCUMENTS */}
            {activeTab === 'documents' && (
                <div className='bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4'>
                    <div>
                        <h2 className='text-base font-bold text-slate-900'>Faculty Verification Documents</h2>
                        <p className='text-xs text-slate-500 mt-0.5'>Educational degrees, service contracts, and statutory clearances.</p>
                    </div>

                    <div className='divide-y divide-slate-200'>
                        {teacher.documents.map((doc, idx) => (
                            <div key={idx} className='py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3'>
                                <div className='flex items-center gap-3'>
                                    <div className='p-2 bg-indigo-50 text-indigo-600 rounded-lg'>
                                        <FileText size={18} />
                                    </div>
                                    <div>
                                        <div className='font-semibold text-slate-900 text-sm'>{doc.name}</div>
                                        <div className='text-xs text-slate-500 mt-0.5'>
                                            {doc.category} · Uploaded: {doc.uploadDate} · Format: {doc.fileType}
                                        </div>
                                    </div>
                                </div>
                                <div className='flex items-center gap-2'>
                                    <span className='inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700'>
                                        <CheckCircle2 size={13} />
                                        {doc.status} by {doc.verifiedBy}
                                    </span>
                                    <button
                                        type='button'
                                        onClick={() => alert(`Downloading credential: ${doc.name}`)}
                                        className='p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer'
                                        title='Download Document'
                                    >
                                        <Download size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* 10. COMPLETE HISTORY TIMELINE */}
            {activeTab === 'history' && (
                <div className='bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6'>
                    <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
                        <div>
                            <h2 className='text-base font-bold text-slate-900'>Complete Faculty Lifecycle Timeline</h2>
                            <p className='text-xs text-slate-500 mt-0.5'>
                                Chronological audit trail across employment, promotions, timetable assignments, leave approvals, and awards.
                            </p>
                        </div>
                        <div className='flex items-center gap-2'>
                            <span className='text-xs font-semibold text-slate-500 uppercase'>Filter:</span>
                            <select
                                value={historyFilterType}
                                onChange={(e) => setHistoryFilterType(e.target.value)}
                                className='text-xs font-semibold text-slate-800 bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none'
                            >
                                <option value='All'>All Event Types</option>
                                <option value='Attendance Milestone'>Attendance</option>
                                <option value='Leave Approval'>Leaves</option>
                                <option value='Academic Operations'>Timetable & Workload</option>
                                <option value='Career Advancement'>Promotions</option>
                                <option value='Professional Recognition'>Awards</option>
                                <option value='Employment Onboarding'>Onboarding</option>
                            </select>
                        </div>
                    </div>

                    <div className='relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200'>
                        {teacher.completeHistory
                            .filter((item) => (historyFilterType === 'All' ? true : item.category === historyFilterType))
                            .map((ev) => (
                                <div key={ev.id} className='relative pl-4'>
                                    <span className='absolute -left-[1.625rem] top-1.5 w-3 h-3 rounded-full bg-indigo-600 ring-4 ring-indigo-50'></span>
                                    <div className='p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-1.5'>
                                        <div className='flex flex-wrap items-center justify-between gap-2'>
                                            <div className='font-bold text-slate-900 text-sm'>{ev.title}</div>
                                            <span className='font-mono text-xs text-slate-500'>
                                                {ev.date} · {ev.time}
                                            </span>
                                        </div>
                                        <p className='text-xs text-slate-700'>{ev.description}</p>
                                        <div className='flex flex-wrap items-center gap-3 text-[11px] text-slate-500 pt-1'>
                                            <span>
                                                Category: <strong className='text-slate-700'>{ev.category}</strong>
                                            </span>
                                            <span>·</span>
                                            <span>
                                                Module: <strong className='text-slate-700'>{ev.sourceModule}</strong>
                                            </span>
                                            <span>·</span>
                                            <span>
                                                Performed By: <strong className='text-slate-700'>{ev.performedBy}</strong>
                                            </span>
                                            <span className='ml-auto'>
                                                <span className='px-2 py-0.5 rounded-full font-semibold bg-emerald-50 text-emerald-700'>
                                                    {ev.status}
                                                </span>
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                    </div>
                </div>
            )}
        </section>
    )
}

export default ViewEmployeePage
