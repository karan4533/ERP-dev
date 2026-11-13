import React, { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
    ArrowLeft,
    Calendar,
    CreditCard,
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
    Eye,
    X,
    Printer,
    GraduationCap,
    TrendingUp,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import {
    getIntegratedStudentProfile,
    getUserDatabasePermissions,
    CURRENT_ACADEMIC_YEAR,
} from './userDatabaseIntegrator'
import mo_user from '../../assets/images/no-profile.png'

const STUDENT_PROFILE_TABS = [
    { id: 'overview', label: '1. Overview', icon: TrendingUp },
    { id: 'personal', label: '2. Personal Info', icon: Users },
    { id: 'academics', label: '3. Academic Records', icon: BookOpen },
    { id: 'attendance', label: '4. Attendance', icon: Calendar },
    { id: 'fees', label: '5. Fees & Payments', icon: CreditCard },
    { id: 'timetable', label: '6. Timetable', icon: Clock },
    { id: 'activities', label: '7. Activities & Awards', icon: Award },
    { id: 'gatepass', label: '8. Leave & Gate Pass', icon: Shield },
    { id: 'documents', label: '9. Documents', icon: FileText },
    { id: 'history', label: '10. Complete History', icon: History },
]

const statusColorMap = {
    Active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    Graduated: 'bg-blue-50 text-blue-700 border-blue-200',
    Withdrawn: 'bg-slate-100 text-slate-700 border-slate-300',
    Promoted: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    Paid: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    'Partially Paid': 'bg-blue-50 text-blue-700 border-blue-200',
    Pending: 'bg-amber-50 text-amber-700 border-amber-200',
    Overdue: 'bg-rose-50 text-rose-700 border-rose-200',
    Approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    Completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
}

const ViewStudentPage = ({ routeBase = '/front-office/student-management' }) => {
    const { id } = useParams()
    const navigate = useNavigate()
    const { role } = useAuth()
    const permissions = useMemo(() => getUserDatabasePermissions(role), [role])

    const [activeTab, setActiveTab] = useState('overview')
    const [selectedYear, setSelectedYear] = useState(CURRENT_ACADEMIC_YEAR)
    const [viewReceiptModal, setViewReceiptModal] = useState(null)
    const [historyFilterType, setHistoryFilterType] = useState('All')

    const student = useMemo(() => {
        return getIntegratedStudentProfile(id, selectedYear)
    }, [id, selectedYear])

    if (!student) {
        return (
            <section className='space-y-6'>
                <button
                    type='button'
                    onClick={() => navigate(routeBase)}
                    className='inline-flex items-center gap-2 text-sm text-indigo-600 border border-indigo-200 bg-white rounded-lg px-4 py-2 hover:bg-indigo-50 transition-colors cursor-pointer shadow-xs font-medium'
                >
                    <ArrowLeft size={16} />
                    Back to Student Directory
                </button>
                <div className='bg-white rounded-2xl shadow-xs border border-slate-200 p-12 text-center text-slate-500'>
                    <AlertCircle size={36} className='mx-auto text-slate-300 mb-2' />
                    Student record not found or inaccessible.
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
                    Back to Student Directory
                </button>
                <div className='flex items-center gap-2'>
                    <span className='text-xs font-semibold uppercase text-slate-500'>Academic Session:</span>
                    <select
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(e.target.value)}
                        className='text-xs font-semibold text-slate-800 bg-white border border-slate-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none cursor-pointer'
                    >
                        {student.availableAcademicYears.map((yr) => (
                            <option key={yr} value={yr}>
                                {yr} {yr === CURRENT_ACADEMIC_YEAR ? '(Current)' : ''}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Student Profile Header Card */}
            <div className='bg-white rounded-2xl shadow-xs border border-slate-200 p-6'>
                <div className='flex flex-col md:flex-row md:items-center justify-between gap-6'>
                    <div className='flex flex-col sm:flex-row items-start sm:items-center gap-5'>
                        <img
                            src={student.photo || mo_user}
                            alt={student.name}
                            className='w-24 h-24 rounded-full object-cover ring-4 ring-indigo-50 border border-slate-200 shadow-xs shrink-0'
                        />
                        <div>
                            <div className='flex flex-wrap items-center gap-3'>
                                <h1 className='text-2xl font-bold text-slate-900'>{student.name}</h1>
                                <span
                                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                                        statusColorMap[student.currentStatus] || statusColorMap.Active
                                    }`}
                                >
                                    {student.currentStatus}
                                </span>
                            </div>

                            <div className='grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-1.5 mt-3 text-xs'>
                                <div>
                                    <span className='text-slate-500'>Student ID:</span>{' '}
                                    <span className='font-mono font-semibold text-slate-800'>{student.studentId}</span>
                                </div>
                                <div>
                                    <span className='text-slate-500'>Admission No:</span>{' '}
                                    <span className='font-medium text-slate-800'>{student.admissionNumber}</span>
                                </div>
                                <div>
                                    <span className='text-slate-500'>Class & Sec:</span>{' '}
                                    <span className='font-semibold text-indigo-700'>{student.classSection}</span>
                                </div>
                                <div>
                                    <span className='text-slate-500'>Roll No:</span>{' '}
                                    <span className='font-medium text-slate-800'>{student.rollNumber}</span>
                                </div>
                                <div>
                                    <span className='text-slate-500'>Class Teacher:</span>{' '}
                                    <span className='font-medium text-slate-800'>{student.classTeacher}</span>
                                </div>
                                <div>
                                    <span className='text-slate-500'>Admission Date:</span>{' '}
                                    <span className='font-medium text-slate-800'>{student.admissionDate}</span>
                                </div>
                                <div>
                                    <span className='text-slate-500'>Academic Year:</span>{' '}
                                    <span className='font-medium text-slate-800'>{student.academicYear}</span>
                                </div>
                                <div>
                                    <span className='text-slate-500'>Department:</span>{' '}
                                    <span className='font-medium text-slate-800'>{student.department.split('(')[0].trim()}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 10 Navigation Profile Tabs */}
                <div className='mt-6 pt-4 border-t border-slate-200 overflow-x-auto'>
                    <nav className='flex space-x-2' aria-label='Tabs'>
                        {STUDENT_PROFILE_TABS.map((tab) => {
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
                                <span className='text-xs font-semibold text-slate-500 uppercase'>Attendance Rate</span>
                                <span className='p-2 bg-emerald-50 text-emerald-600 rounded-lg'>
                                    <Calendar size={18} />
                                </span>
                            </div>
                            <div className='text-2xl font-bold text-slate-900 mt-2'>
                                {student.overviewKPIs.attendancePercentage}
                            </div>
                            <div className='flex items-center gap-1.5 text-xs text-emerald-700 font-medium mt-1'>
                                <CheckCircle2 size={13} />
                                {student.overviewKPIs.attendanceStatus} (Above 85% Benchmark)
                            </div>
                        </div>

                        <div className='bg-white p-5 rounded-2xl border border-slate-200 shadow-xs'>
                            <div className='flex items-center justify-between'>
                                <span className='text-xs font-semibold text-slate-500 uppercase'>Fee Balance</span>
                                <span className='p-2 bg-indigo-50 text-indigo-600 rounded-lg'>
                                    <CreditCard size={18} />
                                </span>
                            </div>
                            <div className='text-2xl font-bold text-slate-900 mt-2'>
                                {permissions.canViewFeeInformation ? student.overviewKPIs.feeBalance : 'Confidential'}
                            </div>
                            <div className='text-xs text-slate-600 font-medium mt-1'>
                                Status:{' '}
                                <span
                                    className={`inline-block px-1.5 py-0.5 rounded text-[11px] font-semibold ${
                                        statusColorMap[student.overviewKPIs.feeStatus] || statusColorMap.Paid
                                    }`}
                                >
                                    {student.overviewKPIs.feeStatus}
                                </span>
                            </div>
                        </div>

                        <div className='bg-white p-5 rounded-2xl border border-slate-200 shadow-xs'>
                            <div className='flex items-center justify-between'>
                                <span className='text-xs font-semibold text-slate-500 uppercase'>Academic Performance</span>
                                <span className='p-2 bg-blue-50 text-blue-600 rounded-lg'>
                                    <GraduationCap size={18} />
                                </span>
                            </div>
                            <div className='text-2xl font-bold text-slate-900 mt-2'>
                                {student.overviewKPIs.academicPerformance}
                            </div>
                            <div className='text-xs text-blue-700 font-medium mt-1'>
                                {student.overviewKPIs.academicProgress}
                            </div>
                        </div>

                        <div className='bg-white p-5 rounded-2xl border border-slate-200 shadow-xs'>
                            <div className='flex items-center justify-between'>
                                <span className='text-xs font-semibold text-slate-500 uppercase'>Pending Activities</span>
                                <span className='p-2 bg-purple-50 text-purple-600 rounded-lg'>
                                    <Shield size={18} />
                                </span>
                            </div>
                            <div className='text-2xl font-bold text-slate-900 mt-2'>
                                {student.overviewKPIs.pendingActivities}
                            </div>
                            <div className='text-xs text-purple-700 font-medium mt-1'>
                                Security & Academic Clearance
                            </div>
                        </div>
                    </div>

                    {/* Student Current Status Card */}
                    <div className='bg-white rounded-2xl border border-slate-200 shadow-xs p-6'>
                        <h2 className='text-base font-bold text-slate-900 mb-4'>Current Status & Program Health</h2>
                        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
                            <div className='p-4 rounded-xl bg-slate-50 border border-slate-200'>
                                <div className='text-xs font-semibold text-slate-500 uppercase'>Current Academic Year</div>
                                <div className='text-base font-bold text-slate-900 mt-1'>{student.academicYear}</div>
                                <div className='text-xs text-slate-600 mt-0.5'>{student.classSection}</div>
                            </div>
                            <div className='p-4 rounded-xl bg-slate-50 border border-slate-200'>
                                <div className='text-xs font-semibold text-slate-500 uppercase'>Admission Status</div>
                                <div className='flex items-center gap-2 mt-1'>
                                    <span className='inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800'>
                                        {student.currentStatus}
                                    </span>
                                    <span className='text-xs text-slate-600'>Enrolled on {student.admissionDate}</span>
                                </div>
                            </div>
                            <div className='p-4 rounded-xl bg-slate-50 border border-slate-200'>
                                <div className='text-xs font-semibold text-slate-500 uppercase'>Outstanding Fee Balance</div>
                                <div className='text-base font-bold text-slate-900 mt-1'>
                                    {permissions.canViewFeeInformation ? student.overviewKPIs.outstandingFeeBalance : 'Restricted'}
                                </div>
                                <div className='text-xs text-slate-600 mt-0.5'>Applicable for {student.academicYear}</div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* 2. PERSONAL INFORMATION */}
            {activeTab === 'personal' && (
                <div className='space-y-6'>
                    {/* Basic & Health Information */}
                    <div className='bg-white rounded-2xl border border-slate-200 shadow-xs p-6'>
                        <h2 className='text-base font-bold text-slate-900 mb-4'>Personal & Medical Details</h2>
                        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 text-sm'>
                            <div>
                                <span className='text-xs text-slate-500 block'>First Name</span>
                                <span className='font-semibold text-slate-800'>{student.personalInfo.firstName}</span>
                            </div>
                            <div>
                                <span className='text-xs text-slate-500 block'>Last Name</span>
                                <span className='font-semibold text-slate-800'>{student.personalInfo.lastName}</span>
                            </div>
                            <div>
                                <span className='text-xs text-slate-500 block'>Gender</span>
                                <span className='font-medium text-slate-800'>{student.personalInfo.gender}</span>
                            </div>
                            <div>
                                <span className='text-xs text-slate-500 block'>Date of Birth</span>
                                <span className='font-medium text-slate-800'>{student.personalInfo.dateOfBirth}</span>
                            </div>
                            <div>
                                <span className='text-xs text-slate-500 block'>Blood Group</span>
                                <span className='font-semibold text-rose-700'>{student.personalInfo.bloodGroup}</span>
                            </div>
                            <div>
                                <span className='text-xs text-slate-500 block'>Height / Weight</span>
                                <span className='font-medium text-slate-800'>{student.personalInfo.height} / {student.personalInfo.weight}</span>
                            </div>
                            <div>
                                <span className='text-xs text-slate-500 block'>Religion & Caste</span>
                                <span className='font-medium text-slate-800'>{student.personalInfo.religion} ({student.personalInfo.caste})</span>
                            </div>
                            <div>
                                <span className='text-xs text-slate-500 block'>Previous School</span>
                                <span className='font-medium text-slate-800'>{student.personalInfo.previousSchool}</span>
                            </div>
                            <div className='lg:col-span-4 bg-slate-50 p-3.5 rounded-xl border border-slate-200'>
                                <span className='text-xs font-semibold text-slate-500 uppercase block mb-1'>Medical History & Alerts</span>
                                <span className='text-slate-800'>{student.personalInfo.medicalHistory}</span>
                            </div>
                        </div>
                    </div>

                    {/* Contact & Address Details */}
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                        <div className='bg-white rounded-2xl border border-slate-200 shadow-xs p-6'>
                            <h2 className='text-base font-bold text-slate-900 mb-4'>Residential Address</h2>
                            <div className='space-y-3 text-sm'>
                                <div>
                                    <span className='text-xs text-slate-500 block'>Street Address</span>
                                    <span className='font-medium text-slate-800'>{student.personalInfo.address.street}</span>
                                </div>
                                <div className='grid grid-cols-2 gap-3'>
                                    <div>
                                        <span className='text-xs text-slate-500 block'>City / State</span>
                                        <span className='font-medium text-slate-800'>{student.personalInfo.address.city}, {student.personalInfo.address.state}</span>
                                    </div>
                                    <div>
                                        <span className='text-xs text-slate-500 block'>Country / Zip</span>
                                        <span className='font-medium text-slate-800'>{student.personalInfo.address.country} - {student.personalInfo.address.zipCode}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className='bg-white rounded-2xl border border-slate-200 shadow-xs p-6'>
                            <h2 className='text-base font-bold text-slate-900 mb-4'>Student Contact & Transport</h2>
                            <div className='space-y-3 text-sm'>
                                <div className='grid grid-cols-2 gap-3'>
                                    <div>
                                        <span className='text-xs text-slate-500 block'>Primary Mobile</span>
                                        <span className='font-semibold text-slate-800'>{student.personalInfo.contact.mobileNumber}</span>
                                    </div>
                                    <div>
                                        <span className='text-xs text-slate-500 block'>Alternative Phone</span>
                                        <span className='font-medium text-slate-800'>{student.personalInfo.contact.altMobileNumber}</span>
                                    </div>
                                </div>
                                <div>
                                    <span className='text-xs text-slate-500 block'>Student Email</span>
                                    <span className='font-medium text-slate-800'>{student.personalInfo.contact.email}</span>
                                </div>
                                <div className='pt-2 border-t border-slate-100'>
                                    <span className='text-xs text-slate-500 block'>Transport Details</span>
                                    <span className='font-medium text-slate-800'>
                                        {student.personalInfo.transport.modeOfTransport} ({student.personalInfo.transport.route})
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Parent / Guardian Information */}
                    <div className='bg-white rounded-2xl border border-slate-200 shadow-xs p-6'>
                        <h2 className='text-base font-bold text-slate-900 mb-4'>Parent & Guardian Information</h2>
                        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 text-sm'>
                            <div>
                                <span className='text-xs text-slate-500 block'>Father Name & Occupation</span>
                                <span className='font-semibold text-slate-800'>{student.personalInfo.parent.fatherName}</span>
                                <div className='text-xs text-slate-600 mt-0.5'>{student.personalInfo.parent.fatherOccupation} ({student.personalInfo.parent.fatherIncome})</div>
                            </div>
                            <div>
                                <span className='text-xs text-slate-500 block'>Mother Name & Occupation</span>
                                <span className='font-semibold text-slate-800'>{student.personalInfo.parent.motherName}</span>
                                <div className='text-xs text-slate-600 mt-0.5'>{student.personalInfo.parent.motherOccupation} ({student.personalInfo.parent.motherIncome})</div>
                            </div>
                            <div>
                                <span className='text-xs text-slate-500 block'>Parent Contact & Email</span>
                                <span className='font-semibold text-slate-800'>{student.personalInfo.parent.parentMobile}</span>
                                <div className='text-xs text-slate-600 mt-0.5'>{student.personalInfo.parent.parentEmail}</div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* 3. ACADEMIC RECORDS */}
            {activeTab === 'academics' && (
                <div className='space-y-6'>
                    {/* Overall Summary */}
                    <div className='bg-white rounded-2xl border border-slate-200 shadow-xs p-6'>
                        <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
                            <div>
                                <h2 className='text-base font-bold text-slate-900'>Examination Results ({student.academicYear})</h2>
                                <p className='text-xs text-slate-500 mt-0.5'>Cumulative assessment across core subjects.</p>
                            </div>
                            <div className='flex items-center gap-3'>
                                <div className='px-3.5 py-1.5 bg-indigo-50 border border-indigo-200 rounded-xl text-center'>
                                    <div className='text-xs text-indigo-700 font-medium'>Overall Score</div>
                                    <div className='text-lg font-bold text-indigo-900'>{student.academicRecords.overallPercentage}</div>
                                </div>
                                <div className='px-3.5 py-1.5 bg-emerald-50 border border-emerald-200 rounded-xl text-center'>
                                    <div className='text-xs text-emerald-700 font-medium'>Overall Grade</div>
                                    <div className='text-lg font-bold text-emerald-900'>{student.academicRecords.overallGrade}</div>
                                </div>
                            </div>
                        </div>

                        {/* Subject Marks Table */}
                        <div className='mt-6 overflow-x-auto'>
                            <table className='w-full text-sm text-left'>
                                <thead className='text-xs uppercase bg-slate-100 text-slate-700 font-semibold'>
                                    <tr>
                                        <th className='px-4 py-3'>Subject</th>
                                        <th className='px-4 py-3'>Assigned Faculty</th>
                                        <th className='px-4 py-3 text-center'>Max Marks</th>
                                        <th className='px-4 py-3 text-center'>Obtained Marks</th>
                                        <th className='px-4 py-3 text-center'>Grade</th>
                                        <th className='px-4 py-3'>Teacher Remarks</th>
                                    </tr>
                                </thead>
                                <tbody className='divide-y divide-slate-100'>
                                    {student.academicRecords.subjects.map((sub, idx) => (
                                        <tr key={idx} className='hover:bg-slate-50'>
                                            <td className='px-4 py-3 font-semibold text-slate-900'>{sub.subject}</td>
                                            <td className='px-4 py-3 text-slate-600'>{sub.teacher}</td>
                                            <td className='px-4 py-3 text-center font-medium text-slate-500'>{sub.maxMarks}</td>
                                            <td className='px-4 py-3 text-center font-bold text-slate-900'>{sub.obtainedMarks}</td>
                                            <td className='px-4 py-3 text-center'>
                                                <span className='px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700'>
                                                    {sub.grade}
                                                </span>
                                            </td>
                                            <td className='px-4 py-3 text-xs text-slate-600'>{sub.remarks}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className='mt-4 p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs'>
                            <span className='font-bold text-slate-800'>Faculty General Remarks: </span>
                            <span className='text-slate-700'>{student.academicRecords.teacherRemarks}</span>
                        </div>
                    </div>

                    {/* Promotion History Table */}
                    <div className='bg-white rounded-2xl border border-slate-200 shadow-xs p-6'>
                        <h2 className='text-base font-bold text-slate-900 mb-3'>Academic Promotion History</h2>
                        <div className='overflow-x-auto'>
                            <table className='w-full text-sm text-left'>
                                <thead className='text-xs uppercase bg-slate-100 text-slate-700 font-semibold'>
                                    <tr>
                                        <th className='px-4 py-3'>Academic Year</th>
                                        <th className='px-4 py-3'>Class & Section</th>
                                        <th className='px-4 py-3'>Class Teacher</th>
                                        <th className='px-4 py-3'>GPA / Cumulative</th>
                                        <th className='px-4 py-3'>Result / Promotion Status</th>
                                        <th className='px-4 py-3'>Date</th>
                                    </tr>
                                </thead>
                                <tbody className='divide-y divide-slate-100'>
                                    {student.academicRecords.promotionHistory.map((hist, idx) => (
                                        <tr key={idx} className='hover:bg-slate-50'>
                                            <td className='px-4 py-3 font-medium text-slate-900'>{hist.academicYear}</td>
                                            <td className='px-4 py-3 font-semibold text-indigo-700'>{hist.class}</td>
                                            <td className='px-4 py-3 text-slate-600'>{hist.classTeacher}</td>
                                            <td className='px-4 py-3 font-mono text-slate-800'>{hist.gpa}</td>
                                            <td className='px-4 py-3'>
                                                <span className='inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700'>
                                                    {hist.result}
                                                </span>
                                            </td>
                                            <td className='px-4 py-3 text-xs text-slate-500'>{hist.promotionDate}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
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
                            <div className='text-xl font-bold text-slate-900'>{student.attendance.totalWorkingDays}</div>
                        </div>
                        <div className='bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs'>
                            <div className='text-xs text-emerald-600 font-medium'>Present Days</div>
                            <div className='text-xl font-bold text-emerald-700'>{student.attendance.presentDays}</div>
                        </div>
                        <div className='bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs'>
                            <div className='text-xs text-rose-600 font-medium'>Absent Days</div>
                            <div className='text-xl font-bold text-rose-700'>{student.attendance.absentDays}</div>
                        </div>
                        <div className='bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs'>
                            <div className='text-xs text-blue-600 font-medium'>Approved Leaves</div>
                            <div className='text-xl font-bold text-blue-700'>{student.attendance.leaveDays}</div>
                        </div>
                        <div className='bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs'>
                            <div className='text-xs text-amber-600 font-medium'>Late Arrivals</div>
                            <div className='text-xl font-bold text-amber-700'>{student.attendance.lateArrivals}</div>
                        </div>
                        <div className='bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs'>
                            <div className='text-xs text-indigo-600 font-medium'>Attendance %</div>
                            <div className='text-xl font-bold text-indigo-700'>{student.attendance.attendancePercentage}</div>
                        </div>
                    </div>

                    {/* Monthly Attendance Calendar */}
                    <div className='bg-white rounded-2xl border border-slate-200 shadow-xs p-6'>
                        <div className='flex items-center justify-between mb-4'>
                            <div>
                                <h2 className='text-base font-bold text-slate-900'>Monthly Attendance Calendar (October 2026)</h2>
                                <p className='text-xs text-slate-500 mt-0.5'>Daily automated synchronization with Student Attendance Ledger.</p>
                            </div>
                            <div className='flex items-center gap-3 text-xs'>
                                <span className='inline-flex items-center gap-1.5'>
                                    <span className='w-2.5 h-2.5 rounded-full bg-emerald-500'></span> Present
                                </span>
                                <span className='inline-flex items-center gap-1.5'>
                                    <span className='w-2.5 h-2.5 rounded-full bg-rose-500'></span> Absent
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
                            {student.attendance.monthlyCalendarDays.map((c) => {
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

                    {/* Attendance History Table */}
                    <div className='bg-white rounded-2xl border border-slate-200 shadow-xs p-6'>
                        <h2 className='text-base font-bold text-slate-900 mb-3'>Recent Attendance Log</h2>
                        <div className='overflow-x-auto'>
                            <table className='w-full text-sm text-left'>
                                <thead className='text-xs uppercase bg-slate-100 text-slate-700 font-semibold'>
                                    <tr>
                                        <th className='px-4 py-3'>Date</th>
                                        <th className='px-4 py-3'>Class</th>
                                        <th className='px-4 py-3'>Subject / Period</th>
                                        <th className='px-4 py-3'>Status</th>
                                        <th className='px-4 py-3'>Recorded By</th>
                                        <th className='px-4 py-3'>Remarks</th>
                                    </tr>
                                </thead>
                                <tbody className='divide-y divide-slate-100'>
                                    {student.attendance.attendanceHistoryTable.map((att, idx) => (
                                        <tr key={idx} className='hover:bg-slate-50'>
                                            <td className='px-4 py-3 font-mono text-xs text-slate-800'>{att.date}</td>
                                            <td className='px-4 py-3 font-medium text-slate-900'>{att.class}</td>
                                            <td className='px-4 py-3 text-slate-600'>{att.subject}</td>
                                            <td className='px-4 py-3'>
                                                <span
                                                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
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
                                            <td className='px-4 py-3 text-slate-600'>{att.recordedBy}</td>
                                            <td className='px-4 py-3 text-xs text-slate-500'>{att.remarks}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* 5. FEES & PAYMENTS */}
            {activeTab === 'fees' && (
                <div className='space-y-6'>
                    {!permissions.canViewFeeInformation ? (
                        <div className='bg-white rounded-2xl border border-slate-200 shadow-xs p-12 text-center text-slate-500'>
                            <Shield size={36} className='mx-auto text-slate-300 mb-2' />
                            Financial details are confidential. Contact Accounts or Front Office for fee clearance records.
                        </div>
                    ) : (
                        <>
                            {/* Fee Overview Cards */}
                            <div className='grid grid-cols-2 sm:grid-cols-4 gap-4'>
                                <div className='bg-white p-5 rounded-2xl border border-slate-200 shadow-xs'>
                                    <div className='text-xs text-slate-500 font-semibold uppercase'>Total Annual Fee</div>
                                    <div className='text-2xl font-bold text-slate-900 mt-2'>{student.feesAndPayments.totalFee}</div>
                                    <div className='text-xs text-slate-500 mt-1'>Session {student.academicYear}</div>
                                </div>
                                <div className='bg-white p-5 rounded-2xl border border-slate-200 shadow-xs'>
                                    <div className='text-xs text-emerald-600 font-semibold uppercase'>Total Paid</div>
                                    <div className='text-2xl font-bold text-emerald-700 mt-2'>{student.feesAndPayments.totalPaid}</div>
                                    <div className='text-xs text-emerald-700 font-medium mt-1'>Receipts verified</div>
                                </div>
                                <div className='bg-white p-5 rounded-2xl border border-slate-200 shadow-xs'>
                                    <div className='text-xs text-amber-600 font-semibold uppercase'>Total Pending</div>
                                    <div className='text-2xl font-bold text-amber-700 mt-2'>{student.feesAndPayments.totalPending}</div>
                                    <div className='text-xs text-amber-700 font-medium mt-1'>Due balance</div>
                                </div>
                                <div className='bg-white p-5 rounded-2xl border border-slate-200 shadow-xs'>
                                    <div className='text-xs text-rose-600 font-semibold uppercase'>Total Overdue</div>
                                    <div className='text-2xl font-bold text-rose-700 mt-2'>{student.feesAndPayments.totalOverdue}</div>
                                    <div className='text-xs text-slate-500 mt-1'>Status: {student.feesAndPayments.currentPaymentStatus}</div>
                                </div>
                            </div>

                            {/* Fee Breakdown by Term / Installment */}
                            <div className='bg-white rounded-2xl border border-slate-200 shadow-xs p-6'>
                                <h2 className='text-base font-bold text-slate-900 mb-3'>Fee Structure & Installment Breakdown</h2>
                                <div className='overflow-x-auto'>
                                    <table className='w-full text-sm text-left'>
                                        <thead className='text-xs uppercase bg-slate-100 text-slate-700 font-semibold'>
                                            <tr>
                                                <th className='px-4 py-3'>Term / Installment</th>
                                                <th className='px-4 py-3'>Fee Category</th>
                                                <th className='px-4 py-3'>Due Date</th>
                                                <th className='px-4 py-3 text-right'>Total Amount</th>
                                                <th className='px-4 py-3 text-right'>Paid Amount</th>
                                                <th className='px-4 py-3 text-right'>Pending Amount</th>
                                                <th className='px-4 py-3 text-center'>Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className='divide-y divide-slate-100'>
                                            {student.feesAndPayments.feeBreakdown.map((row, idx) => (
                                                <tr key={idx} className='hover:bg-slate-50'>
                                                    <td className='px-4 py-3 font-semibold text-slate-900'>{row.term}</td>
                                                    <td className='px-4 py-3 text-slate-600'>{row.category}</td>
                                                    <td className='px-4 py-3 text-xs text-slate-500'>{row.dueDate}</td>
                                                    <td className='px-4 py-3 text-right font-medium text-slate-800'>₹{row.amount.toLocaleString('en-IN')}</td>
                                                    <td className='px-4 py-3 text-right font-semibold text-emerald-700'>₹{row.paidAmount.toLocaleString('en-IN')}</td>
                                                    <td className='px-4 py-3 text-right font-semibold text-amber-700'>₹{row.pendingAmount.toLocaleString('en-IN')}</td>
                                                    <td className='px-4 py-3 text-center'>
                                                        <span
                                                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                                                statusColorMap[row.status] || statusColorMap.Paid
                                                            }`}
                                                        >
                                                            {row.status}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Payment History & Receipts */}
                            <div className='bg-white rounded-2xl border border-slate-200 shadow-xs p-6'>
                                <h2 className='text-base font-bold text-slate-900 mb-3'>Payment History & Receipts Register</h2>
                                <div className='overflow-x-auto'>
                                    <table className='w-full text-sm text-left'>
                                        <thead className='text-xs uppercase bg-slate-100 text-slate-700 font-semibold'>
                                            <tr>
                                                <th className='px-4 py-3'>Receipt No</th>
                                                <th className='px-4 py-3'>Payment Date</th>
                                                <th className='px-4 py-3'>Fee Category</th>
                                                <th className='px-4 py-3'>Amount Paid</th>
                                                <th className='px-4 py-3'>Payment Method</th>
                                                <th className='px-4 py-3'>Transaction Reference</th>
                                                <th className='px-4 py-3'>Recorded By</th>
                                                <th className='px-4 py-3 text-right'>Receipt</th>
                                            </tr>
                                        </thead>
                                        <tbody className='divide-y divide-slate-100'>
                                            {student.feesAndPayments.paymentHistory.map((rcp, idx) => (
                                                <tr key={idx} className='hover:bg-slate-50'>
                                                    <td className='px-4 py-3 font-mono font-semibold text-indigo-700'>{rcp.receiptNumber}</td>
                                                    <td className='px-4 py-3 text-xs text-slate-800'>{rcp.paymentDate}</td>
                                                    <td className='px-4 py-3 text-slate-600'>{rcp.category}</td>
                                                    <td className='px-4 py-3 font-bold text-emerald-700'>{rcp.amountPaid}</td>
                                                    <td className='px-4 py-3'>
                                                        <span className='px-2 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-800'>
                                                            {rcp.paymentMethod}
                                                        </span>
                                                    </td>
                                                    <td className='px-4 py-3 font-mono text-xs text-slate-500'>{rcp.transactionRef}</td>
                                                    <td className='px-4 py-3 text-xs text-slate-600'>{rcp.recordedBy}</td>
                                                    <td className='px-4 py-3 text-right'>
                                                        <button
                                                            type='button'
                                                            onClick={() => setViewReceiptModal(rcp)}
                                                            className='inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors cursor-pointer'
                                                        >
                                                            <Eye size={13} />
                                                            View
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* 6. TIMETABLE */}
            {activeTab === 'timetable' && (
                <div className='bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4'>
                    <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
                        <div>
                            <h2 className='text-base font-bold text-slate-900'>Weekly Class Timetable</h2>
                            <p className='text-xs text-slate-500 mt-0.5'>
                                Schedule for {student.classSection} · Academic Year {student.academicYear} · Effective {student.timetable.effectiveDate}
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
                                {student.timetable.weeklySchedule.map((slot, idx) => (
                                    <tr
                                        key={idx}
                                        className={slot.period === 'Break' || slot.period === 'Lunch' ? 'bg-amber-50/60 font-medium text-amber-900' : 'hover:bg-slate-50'}
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
            )}

            {/* 7. ACTIVITIES & ACHIEVEMENTS */}
            {activeTab === 'activities' && (
                <div className='bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4'>
                    <div>
                        <h2 className='text-base font-bold text-slate-900'>Co-Curricular Activities & Honors</h2>
                        <p className='text-xs text-slate-500 mt-0.5'>Competitions, awards, and club leadership record.</p>
                    </div>

                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                        {student.activitiesAndAchievements.map((act, idx) => (
                            <div key={idx} className='p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2'>
                                <div className='flex items-start justify-between gap-2'>
                                    <div className='font-bold text-slate-900 text-sm'>{act.title}</div>
                                    <span className='px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded-md text-[11px] font-semibold shrink-0'>
                                        {act.level}
                                    </span>
                                </div>
                                <div className='text-xs text-slate-500'>
                                    {act.category} · {act.date} · Issued by {act.issuedBy}
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

            {/* 8. LEAVE & GATE PASS */}
            {activeTab === 'gatepass' && (
                <div className='space-y-6'>
                    {/* Gate Pass Records */}
                    <div className='bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4'>
                        <div>
                            <h2 className='text-base font-bold text-slate-900'>Student Gate Pass Movement Records</h2>
                            <p className='text-xs text-slate-500 mt-0.5'>
                                Integrated live records from Gate Pass & Security Movement System.
                            </p>
                        </div>

                        <div className='overflow-x-auto'>
                            <table className='w-full text-sm text-left'>
                                <thead className='text-xs uppercase bg-slate-100 text-slate-700 font-semibold'>
                                    <tr>
                                        <th className='px-4 py-3'>Pass Number</th>
                                        <th className='px-4 py-3'>Reason / Category</th>
                                        <th className='px-4 py-3'>Authorized Escort</th>
                                        <th className='px-4 py-3'>Exit Time</th>
                                        <th className='px-4 py-3'>Return Time</th>
                                        <th className='px-4 py-3'>Approved By</th>
                                        <th className='px-4 py-3'>Gate Verification</th>
                                        <th className='px-4 py-3 text-center'>Status</th>
                                    </tr>
                                </thead>
                                <tbody className='divide-y divide-slate-100'>
                                    {student.leaveAndGatePass.gatePasses.map((gp, idx) => (
                                        <tr key={idx} className='hover:bg-slate-50'>
                                            <td className='px-4 py-3 font-mono font-semibold text-indigo-700'>
                                                {gp.gatePassNumber || gp.id}
                                            </td>
                                            <td className='px-4 py-3'>
                                                <div className='font-semibold text-slate-900'>{gp.reasonCategory}</div>
                                                <div className='text-xs text-slate-500'>{gp.reasonDetail}</div>
                                            </td>
                                            <td className='px-4 py-3 text-xs text-slate-700'>
                                                {gp.authorizedPersonName} ({gp.relationshipToStudent})
                                            </td>
                                            <td className='px-4 py-3 font-mono text-xs text-slate-800'>
                                                {gp.actualDepartureTime || gp.expectedDepartureTime}
                                            </td>
                                            <td className='px-4 py-3 font-mono text-xs text-slate-800'>
                                                {gp.actualReturnTime || gp.expectedReturnTime || '—'}
                                            </td>
                                            <td className='px-4 py-3 text-xs text-slate-600'>
                                                {gp.approvedByName} ({gp.approvedByRole})
                                            </td>
                                            <td className='px-4 py-3 text-xs text-slate-600'>
                                                {gp.verifiedByGatekeeper || 'Gatekeeper Verified'}
                                            </td>
                                            <td className='px-4 py-3 text-center'>
                                                <span
                                                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                                                        statusColorMap[gp.status] || statusColorMap.Approved
                                                    }`}
                                                >
                                                    {gp.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Leave Applications */}
                    <div className='bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4'>
                        <h2 className='text-base font-bold text-slate-900'>Approved Student Leaves</h2>
                        <div className='overflow-x-auto'>
                            <table className='w-full text-sm text-left'>
                                <thead className='text-xs uppercase bg-slate-100 text-slate-700 font-semibold'>
                                    <tr>
                                        <th className='px-4 py-3'>Leave Type</th>
                                        <th className='px-4 py-3'>Dates</th>
                                        <th className='px-4 py-3'>Reason</th>
                                        <th className='px-4 py-3'>Approved By</th>
                                        <th className='px-4 py-3 text-center'>Status</th>
                                    </tr>
                                </thead>
                                <tbody className='divide-y divide-slate-100'>
                                    {student.leaveAndGatePass.leaves.map((lv, idx) => (
                                        <tr key={idx} className='hover:bg-slate-50'>
                                            <td className='px-4 py-3 font-semibold text-slate-900'>{lv.leaveType}</td>
                                            <td className='px-4 py-3 text-xs text-slate-800'>{lv.leaveDates}</td>
                                            <td className='px-4 py-3 text-xs text-slate-600'>{lv.reason}</td>
                                            <td className='px-4 py-3 text-xs text-slate-600'>{lv.approvedBy}</td>
                                            <td className='px-4 py-3 text-center'>
                                                <span className='px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700'>
                                                    {lv.status}
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

            {/* 9. DOCUMENTS */}
            {activeTab === 'documents' && (
                <div className='bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4'>
                    <div>
                        <h2 className='text-base font-bold text-slate-900'>Official Student Credentials & Files</h2>
                        <p className='text-xs text-slate-500 mt-0.5'>Mandatory enrollment proofs and academic records.</p>
                    </div>

                    <div className='divide-y divide-slate-200'>
                        {student.documents.map((doc, idx) => (
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
                                        onClick={() => alert(`Viewing document: ${doc.name}`)}
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
                            <h2 className='text-base font-bold text-slate-900'>Complete Student Lifecycle Timeline</h2>
                            <p className='text-xs text-slate-500 mt-0.5'>
                                Chronological audit trail across admission, fees, examinations, gate pass, and attendance events.
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
                                <option value='Security Movement'>Gate Pass</option>
                                <option value='Financial Transaction'>Fees & Payments</option>
                                <option value='Academic Milestone'>Exams & Promotion</option>
                                <option value='Admission Lifecycle'>Admission</option>
                            </select>
                        </div>
                    </div>

                    <div className='relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200'>
                        {student.completeHistory
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

            {/* View Receipt Modal */}
            {viewReceiptModal && (
                <div className='fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4'>
                    <div className='bg-white rounded-2xl shadow-xl border border-slate-200 max-w-lg w-full p-6 space-y-5'>
                        <div className='flex items-center justify-between border-b border-slate-100 pb-3'>
                            <div>
                                <h3 className='text-lg font-bold text-slate-900'>Official Fee Receipt</h3>
                                <p className='text-xs text-slate-500'>Queen Mira International School</p>
                            </div>
                            <button
                                type='button'
                                onClick={() => setViewReceiptModal(null)}
                                className='p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer'
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className='space-y-3 text-sm'>
                            <div className='flex justify-between py-1 border-b border-slate-100'>
                                <span className='text-slate-500'>Receipt No:</span>
                                <span className='font-mono font-bold text-indigo-700'>{viewReceiptModal.receiptNumber}</span>
                            </div>
                            <div className='flex justify-between py-1 border-b border-slate-100'>
                                <span className='text-slate-500'>Student:</span>
                                <span className='font-semibold text-slate-800'>{student.name} ({student.studentId})</span>
                            </div>
                            <div className='flex justify-between py-1 border-b border-slate-100'>
                                <span className='text-slate-500'>Class / Section:</span>
                                <span className='font-medium text-slate-800'>{student.classSection}</span>
                            </div>
                            <div className='flex justify-between py-1 border-b border-slate-100'>
                                <span className='text-slate-500'>Payment Date:</span>
                                <span className='font-medium text-slate-800'>{viewReceiptModal.paymentDate}</span>
                            </div>
                            <div className='flex justify-between py-1 border-b border-slate-100'>
                                <span className='text-slate-500'>Category:</span>
                                <span className='font-medium text-slate-800'>{viewReceiptModal.category}</span>
                            </div>
                            <div className='flex justify-between py-1 border-b border-slate-100'>
                                <span className='text-slate-500'>Payment Method:</span>
                                <span className='font-medium text-slate-800'>{viewReceiptModal.paymentMethod}</span>
                            </div>
                            <div className='flex justify-between py-1 border-b border-slate-100'>
                                <span className='text-slate-500'>Transaction Ref:</span>
                                <span className='font-mono text-xs text-slate-600'>{viewReceiptModal.transactionRef}</span>
                            </div>
                            <div className='flex justify-between py-1 border-b border-slate-100'>
                                <span className='text-slate-500'>Cashier / Recorded By:</span>
                                <span className='font-medium text-slate-800'>{viewReceiptModal.recordedBy}</span>
                            </div>
                            <div className='flex justify-between py-2 bg-emerald-50 px-3 rounded-lg text-emerald-900 font-bold'>
                                <span>Amount Paid:</span>
                                <span>{viewReceiptModal.amountPaid}</span>
                            </div>
                        </div>

                        <div className='flex justify-end gap-2 pt-2'>
                            <button
                                type='button'
                                onClick={() => setViewReceiptModal(null)}
                                className='px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer'
                            >
                                Close
                            </button>
                            <button
                                type='button'
                                onClick={() => {
                                    window.print()
                                }}
                                className='inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors cursor-pointer shadow-xs'
                            >
                                <Printer size={14} />
                                Print Receipt
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </section>
    )
}

export default ViewStudentPage
