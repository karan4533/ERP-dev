import React, { useState } from 'react'
import {
    ArrowRight,
    Award,
    BookOpen,
    Bus,
    Calendar,
    CheckCircle2,
    Clock,
    CreditCard,
    FileText,
    GraduationCap,
    HeartPulse,
    Mail,
    MapPin,
    Phone,
    Shield,
    Sparkles,
    User,
    UserCheck,
    Users,
} from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { useActiveStudent } from '../../../context/ActiveStudentContext'
import { formatGradeSection } from '../studentPortalConfig'
import { PARENT_CHILD_PROFILES } from '../../Parent/parentStudentProfiles'
import { getStudentResultSummary } from '../../../Common/MarkEntryApproval/markEntryApprovalData'

const StudentProfileView = () => {
    const { activeStudent, isParentPortal, routePrefix } = useActiveStudent()
    const [activeTab, setActiveTab] = useState('overview')
    const resultSummary = getStudentResultSummary(activeStudent.id)

    // Siblings enrolled in the same school (per ERP Doc Section 4.2 & Decision 8.5)
    const siblings = Object.values(PARENT_CHILD_PROFILES).filter(
        (child) => child.id !== activeStudent.id,
    )

    const tabs = [
        { id: 'overview', label: 'Overview', icon: GraduationCap },
        { id: 'personal', label: 'Personal & Family', icon: Users },
        { id: 'guardian', label: 'Guardian Access (Decision 8.5)', icon: Shield },
        { id: 'siblings', label: 'Siblings Enrolled', icon: HeartPulse },
        { id: 'academics', label: 'Academics & Marks', icon: BookOpen },
        { id: 'fees', label: 'Fees & Concessions', icon: CreditCard },
        { id: 'transport', label: 'Transportation', icon: Bus },
    ]

    return (
        <section className='space-y-6 pb-8 font-inter'>
            {/* Header: Student Profile Banner */}
            <div className='relative overflow-hidden rounded-2xl border border-slate-200/80 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 p-6 text-white shadow-sm'>
                <div className='relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6'>
                    <div className='flex items-center gap-5'>
                        <div className='relative size-20 shrink-0 overflow-hidden rounded-2xl border-2 border-white/20 bg-blue-600/40 shadow-inner flex items-center justify-center text-3xl font-bold text-white'>
                            {activeStudent.name ? activeStudent.name.charAt(0) : 'S'}
                        </div>
                        <div>
                            <div className='flex flex-wrap items-center gap-2.5'>
                                <h1 className='text-2xl font-bold tracking-tight text-white'>
                                    {activeStudent.name}
                                </h1>
                                <span className='inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-xs font-semibold text-emerald-300 border border-emerald-500/30'>
                                    <CheckCircle2 size={12} /> Active Student
                                </span>
                                {isParentPortal && (
                                    <span className='inline-flex items-center gap-1 rounded-full bg-blue-500/20 px-2.5 py-0.5 text-xs font-semibold text-blue-200 border border-blue-500/30'>
                                        <UserCheck size={12} /> Guardian Session
                                    </span>
                                )}
                            </div>
                            <p className='mt-1 text-sm text-slate-300'>
                                {formatGradeSection(activeStudent)} · Roll No: <strong>{activeStudent.rollNumber}</strong> · Admission No: <strong>{activeStudent.admissionNumber || activeStudent.id}</strong>
                            </p>
                            <p className='mt-0.5 text-xs text-slate-400'>
                                Academic Session: 2026 - 2027 · Affiliated to Central Board of Secondary Education (CBSE)
                            </p>
                        </div>
                    </div>

                    <div className='flex flex-wrap items-center gap-2'>
                        {isParentPortal && (
                            <NavLink
                                to='/parent/select-child'
                                className='inline-flex items-center gap-1.5 rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold text-white backdrop-blur hover:bg-white/20 transition-colors'
                            >
                                <Users size={14} /> Switch Child
                            </NavLink>
                        )}
                        <NavLink
                            to={`${routePrefix}/student-evaluation/report-cards`}
                            className='inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-500 transition-colors shadow-sm'
                        >
                            <FileText size={14} /> View Report Card
                        </NavLink>
                    </div>
                </div>

                {/* Confirmed Decision 8.5 Information Strip */}
                <div className='mt-5 rounded-xl border border-white/10 bg-white/5 p-3 text-xs text-slate-200 backdrop-blur flex items-center gap-2.5'>
                    <Shield size={16} className='text-blue-300 shrink-0' />
                    <span>
                        <strong>Confirmed Decision 8.5:</strong> Parent and guardian portal access is unified directly via the student profile. Guardians have verified direct transparency into academic progress, attendance punch records, and tuition receipts without requiring separate credentials.
                    </span>
                </div>
            </div>

            {/* Quick Actions Bar */}
            <div className='grid grid-cols-2 gap-3 sm:grid-cols-5'>
                {[
                    { label: 'Exam Results', to: `${routePrefix}/student-evaluation/exam-result`, icon: Award, color: 'text-amber-600 bg-amber-50' },
                    { label: 'CBSE Report Cards', to: `${routePrefix}/student-evaluation/report-cards`, icon: FileText, color: 'text-blue-600 bg-blue-50' },
                    { label: 'Fees & Receipts', to: `${routePrefix}/payment/fees-payment`, icon: CreditCard, color: 'text-emerald-600 bg-emerald-50' },
                    { label: 'Attendance Report', to: `${routePrefix}/class/attendance-report`, icon: Calendar, color: 'text-purple-600 bg-purple-50' },
                    { label: 'Live Bus Tracking', to: `${routePrefix}/transport/track-bus`, icon: Bus, color: 'text-sky-600 bg-sky-50' },
                ].map((action) => (
                    <NavLink
                        key={action.label}
                        to={action.to}
                        className='flex items-center gap-2.5 rounded-xl border border-slate-200/80 bg-white p-3 hover:border-blue-400 hover:shadow-xs transition-all'
                    >
                        <div className={`p-2 rounded-lg ${action.color}`}>
                            <action.icon size={16} />
                        </div>
                        <span className='text-xs font-semibold text-slate-800'>{action.label}</span>
                    </NavLink>
                ))}
            </div>

            {/* Tab Navigation */}
            <div className='flex overflow-x-auto border-b border-slate-200 scrollbar-none'>
                {tabs.map((tab) => {
                    const Icon = tab.icon
                    const isActive = activeTab === tab.id
                    return (
                        <button
                            key={tab.id}
                            type='button'
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-3 text-xs font-semibold transition-colors ${
                                isActive
                                    ? 'border-blue-600 text-blue-600'
                                    : 'border-transparent text-slate-500 hover:text-slate-800'
                            }`}
                        >
                            <Icon size={15} />
                            {tab.label}
                        </button>
                    )
                })}
            </div>

            {/* Tab Content Panels */}
            {activeTab === 'overview' && (
                <div className='grid gap-6 md:grid-cols-3'>
                    <div className='md:col-span-2 space-y-6'>
                        {/* Summary Metrics */}
                        <div className='grid grid-cols-2 sm:grid-cols-4 gap-4'>
                            <div className='rounded-2xl border border-slate-200 bg-white p-4'>
                                <span className='text-[11px] font-semibold uppercase text-slate-400 tracking-wider'>Attendance Rate</span>
                                <p className='mt-1 text-2xl font-bold text-slate-900'>97.8%</p>
                                <span className='mt-1 text-xs text-emerald-600 font-medium'>ESSL Gate Punch Sync</span>
                            </div>
                            <div className='rounded-2xl border border-slate-200 bg-white p-4'>
                                <span className='text-[11px] font-semibold uppercase text-slate-400 tracking-wider'>Overall Grade</span>
                                <p className='mt-1 text-2xl font-bold text-blue-600'>{resultSummary.overallGrade || 'A1'}</p>
                                <span className='mt-1 text-xs text-slate-500 font-medium'>{resultSummary.averagePercent || 94.2}% Average</span>
                            </div>
                            <div className='rounded-2xl border border-slate-200 bg-white p-4'>
                                <span className='text-[11px] font-semibold uppercase text-slate-400 tracking-wider'>Tuition Fee</span>
                                <p className='mt-1 text-2xl font-bold text-emerald-600'>₹0 Due</p>
                                <span className='mt-1 text-xs text-emerald-600 font-medium'>Terms 1 & 2 Cleared</span>
                            </div>
                            <div className='rounded-2xl border border-slate-200 bg-white p-4'>
                                <span className='text-[11px] font-semibold uppercase text-slate-400 tracking-wider'>Enrolled Siblings</span>
                                <p className='mt-1 text-2xl font-bold text-indigo-600'>{siblings.length || 2}</p>
                                <span className='mt-1 text-xs text-indigo-600 font-medium'>25% Sibling Discount</span>
                            </div>
                        </div>

                        {/* Student Details Card */}
                        <div className='rounded-2xl border border-slate-200 bg-white p-5'>
                            <h3 className='text-sm font-bold text-slate-900 border-b border-slate-100 pb-3 mb-4 flex items-center gap-2'>
                                <User size={16} className='text-blue-600' /> Official Student Enrollment Information
                            </h3>
                            <div className='grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-6 text-xs'>
                                <div>
                                    <span className='text-slate-400'>Full Name:</span>
                                    <p className='font-semibold text-slate-800 mt-0.5'>{activeStudent.name}</p>
                                </div>
                                <div>
                                    <span className='text-slate-400'>Admission Number:</span>
                                    <p className='font-semibold text-slate-800 mt-0.5'>{activeStudent.admissionNumber || activeStudent.id}</p>
                                </div>
                                <div>
                                    <span className='text-slate-400'>Class & Section:</span>
                                    <p className='font-semibold text-slate-800 mt-0.5'>{formatGradeSection(activeStudent)}</p>
                                </div>
                                <div>
                                    <span className='text-slate-400'>Roll Number:</span>
                                    <p className='font-semibold text-slate-800 mt-0.5'>{activeStudent.rollNumber}</p>
                                </div>
                                <div>
                                    <span className='text-slate-400'>Academic Session:</span>
                                    <p className='font-semibold text-slate-800 mt-0.5'>2026 - 2027</p>
                                </div>
                                <div>
                                    <span className='text-slate-400'>Date of Birth:</span>
                                    <p className='font-semibold text-slate-800 mt-0.5'>14 August 2010</p>
                                </div>
                                <div>
                                    <span className='text-slate-400'>Gender & Blood Group:</span>
                                    <p className='font-semibold text-slate-800 mt-0.5'>Male · B Positive (B+)</p>
                                </div>
                                <div>
                                    <span className='text-slate-400'>Affiliated Curriculum:</span>
                                    <p className='font-semibold text-slate-800 mt-0.5'>CBSE Secondary Education</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Guardian Overview & Contacts */}
                    <div className='space-y-6'>
                        <div className='rounded-2xl border border-slate-200 bg-white p-5'>
                            <h3 className='text-sm font-bold text-slate-900 border-b border-slate-100 pb-3 mb-3 flex items-center gap-2'>
                                <Shield size={16} className='text-blue-600' /> Primary Guardian Contacts
                            </h3>
                            <div className='space-y-3 text-xs'>
                                <div>
                                    <span className='text-slate-400'>Father / Primary Guardian:</span>
                                    <p className='font-bold text-slate-900 mt-0.5'>Rajesh Sharma</p>
                                    <p className='text-slate-500'>Lead Software Architect</p>
                                </div>
                                <div className='flex items-center gap-2 text-slate-700'>
                                    <Phone size={14} className='text-blue-600' />
                                    <span>+91 98765 43210</span>
                                </div>
                                <div className='flex items-center gap-2 text-slate-700'>
                                    <Mail size={14} className='text-blue-600' />
                                    <span>rajesh.sharma@email.com</span>
                                </div>
                                <div className='pt-2 border-t border-slate-100'>
                                    <span className='text-slate-400'>Mother:</span>
                                    <p className='font-bold text-slate-900 mt-0.5'>Meera Sharma</p>
                                    <p className='text-slate-500'>Chartered Architect</p>
                                </div>
                                <div className='flex items-center gap-2 text-slate-700'>
                                    <MapPin size={14} className='text-blue-600' />
                                    <span>Plot 42, Green Valley Enclave, Kochi, Kerala</span>
                                </div>
                            </div>
                        </div>

                        {/* Sibling Card Preview */}
                        <div className='rounded-2xl border border-slate-200 bg-white p-5'>
                            <div className='flex items-center justify-between border-b border-slate-100 pb-3 mb-3'>
                                <h3 className='text-sm font-bold text-slate-900 flex items-center gap-2'>
                                    <Users size={16} className='text-blue-600' /> Sibling Enrolled
                                </h3>
                                <button
                                    type='button'
                                    onClick={() => setActiveTab('siblings')}
                                    className='text-xs font-semibold text-blue-600 hover:underline'
                                >
                                    View All
                                </button>
                            </div>
                            <div className='space-y-2'>
                                {siblings.slice(0, 2).map((sib) => (
                                    <div key={sib.id} className='rounded-xl bg-slate-50 p-2.5 text-xs flex items-center justify-between'>
                                        <div>
                                            <p className='font-semibold text-slate-900'>{sib.name}</p>
                                            <p className='text-slate-500'>Grade {sib.className} - {sib.section} · Roll #{sib.rollNumber}</p>
                                        </div>
                                        <span className='rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-800'>
                                            Enrolled
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Tab: Personal & Family */}
            {activeTab === 'personal' && (
                <div className='rounded-2xl border border-slate-200 bg-white p-6 space-y-6'>
                    <h2 className='text-base font-bold text-slate-900 border-b border-slate-100 pb-3'>
                        Detailed Personal & Residential Profile
                    </h2>
                    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-xs'>
                        <div>
                            <span className='text-slate-400 font-medium'>Student Legal Name</span>
                            <p className='mt-1 text-sm font-semibold text-slate-800'>{activeStudent.name}</p>
                        </div>
                        <div>
                            <span className='text-slate-400 font-medium'>Gender</span>
                            <p className='mt-1 text-sm font-semibold text-slate-800'>Male</p>
                        </div>
                        <div>
                            <span className='text-slate-400 font-medium'>Date of Birth</span>
                            <p className='mt-1 text-sm font-semibold text-slate-800'>14-08-2010 (Age: 16)</p>
                        </div>
                        <div>
                            <span className='text-slate-400 font-medium'>Blood Group</span>
                            <p className='mt-1 text-sm font-semibold text-slate-800'>B Positive (B+)</p>
                        </div>
                        <div>
                            <span className='text-slate-400 font-medium'>Nationality & Religion</span>
                            <p className='mt-1 text-sm font-semibold text-slate-800'>Indian · Hindu</p>
                        </div>
                        <div>
                            <span className='text-slate-400 font-medium'>Category</span>
                            <p className='mt-1 text-sm font-semibold text-slate-800'>General</p>
                        </div>
                        <div>
                            <span className='text-slate-400 font-medium'>Mother Tongue</span>
                            <p className='mt-1 text-sm font-semibold text-slate-800'>Malayalam / English</p>
                        </div>
                        <div>
                            <span className='text-slate-400 font-medium'>Aadhar / Identity Reference</span>
                            <p className='mt-1 text-sm font-semibold text-slate-800'>XXXX-XXXX-9021</p>
                        </div>
                        <div>
                            <span className='text-slate-400 font-medium'>Emergency Contact</span>
                            <p className='mt-1 text-sm font-semibold text-slate-800'>+91 98765 43210 (Dr. Rajesh Sharma)</p>
                        </div>
                    </div>

                    <div className='pt-4 border-t border-slate-100'>
                        <h3 className='text-sm font-bold text-slate-900 mb-3'>Residential & Permanent Address</h3>
                        <p className='text-xs text-slate-700 leading-relaxed'>
                            Plot No. 42, Green Valley Enclave, Near Infopark Expressway, Kakkanad, Kochi, Kerala – 682030, India.
                        </p>
                    </div>
                </div>
            )}

            {/* Tab: Guardian Access (Decision 8.5) */}
            {activeTab === 'guardian' && (
                <div className='rounded-2xl border border-slate-200 bg-white p-6 space-y-6'>
                    <div className='flex items-center gap-3 border-b border-slate-100 pb-4'>
                        <div className='p-2.5 rounded-xl bg-blue-50 text-blue-600'>
                            <Shield size={24} />
                        </div>
                        <div>
                            <h2 className='text-base font-bold text-slate-900'>
                                Guardian Portal Access Architecture (Decision 8.5)
                            </h2>
                            <p className='text-xs text-slate-500'>
                                Standardized single-login parent engagement directly tethered to the authenticated student profile.
                            </p>
                        </div>
                    </div>

                    <div className='rounded-xl border border-blue-100 bg-blue-50/50 p-4 text-xs text-blue-900 space-y-2'>
                        <p className='font-bold'>Core System Governance Principle:</p>
                        <p className='leading-relaxed'>
                            In strict compliance with Confirmed Decision 8.5 ("Parent access: Via the student profile only"), parents and guardians do not require or use separated login workflows. Instead, guardians navigate transparently through the student identity, receiving real-time access to progress report cards, term exam results, ESSL biometric gate attendance, fee receipts, and school notifications.
                        </p>
                    </div>

                    <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                        <div className='rounded-xl border border-slate-200 p-4 space-y-3 text-xs'>
                            <h3 className='font-bold text-slate-900 flex items-center gap-2'>
                                <UserCheck size={16} className='text-emerald-600' /> Father / Primary Guardian
                            </h3>
                            <div>
                                <span className='text-slate-400'>Full Name:</span>
                                <p className='font-semibold text-slate-800'>Dr. Rajesh Sharma</p>
                            </div>
                            <div>
                                <span className='text-slate-400'>Occupation & Organization:</span>
                                <p className='font-semibold text-slate-800'>Principal Architect, Tech Solutions Ltd.</p>
                            </div>
                            <div>
                                <span className='text-slate-400'>Verified Mobile:</span>
                                <p className='font-semibold text-slate-800'>+91 98765 43210</p>
                            </div>
                            <div>
                                <span className='text-slate-400'>Verified Email:</span>
                                <p className='font-semibold text-slate-800'>rajesh.sharma@email.com</p>
                            </div>
                        </div>

                        <div className='rounded-xl border border-slate-200 p-4 space-y-3 text-xs'>
                            <h3 className='font-bold text-slate-900 flex items-center gap-2'>
                                <UserCheck size={16} className='text-purple-600' /> Mother / Secondary Guardian
                            </h3>
                            <div>
                                <span className='text-slate-400'>Full Name:</span>
                                <p className='font-semibold text-slate-800'>Mrs. Meera Sharma</p>
                            </div>
                            <div>
                                <span className='text-slate-400'>Occupation & Organization:</span>
                                <p className='font-semibold text-slate-800'>Chartered Architect, Studio Design</p>
                            </div>
                            <div>
                                <span className='text-slate-400'>Verified Mobile:</span>
                                <p className='font-semibold text-slate-800'>+91 98765 43211</p>
                            </div>
                            <div>
                                <span className='text-slate-400'>Verified Email:</span>
                                <p className='font-semibold text-slate-800'>meera.sharma@email.com</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Tab: Siblings Enrolled */}
            {activeTab === 'siblings' && (
                <div className='rounded-2xl border border-slate-200 bg-white p-6 space-y-6'>
                    <div className='flex items-center justify-between border-b border-slate-100 pb-4'>
                        <div>
                            <h2 className='text-base font-bold text-slate-900'>Enrolled Siblings Information</h2>
                            <p className='text-xs text-slate-500'>
                                Family records linked in accordance with ERP Section 4.2 and Sibling Concession Policy.
                            </p>
                        </div>
                        {isParentPortal && (
                            <NavLink
                                to='/parent/select-child'
                                className='inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-500'
                            >
                                <Users size={14} /> Switch Child Portal
                            </NavLink>
                        )}
                    </div>

                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                        {siblings.map((child) => (
                            <div key={child.id} className='rounded-xl border border-slate-200 p-4 space-y-3 text-xs bg-slate-50/50'>
                                <div className='flex items-center justify-between'>
                                    <div className='flex items-center gap-3'>
                                        <div className='size-10 rounded-xl bg-blue-600 text-white font-bold flex items-center justify-center text-sm'>
                                            {child.name.charAt(0)}
                                        </div>
                                        <div>
                                            <p className='text-sm font-bold text-slate-900'>{child.name}</p>
                                            <p className='text-slate-500'>Grade {child.className} - Section {child.section}</p>
                                        </div>
                                    </div>
                                    <span className='rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-800'>
                                        Enrolled
                                    </span>
                                </div>
                                <div className='grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/60'>
                                    <div>
                                        <span className='text-slate-400'>Roll Number:</span>
                                        <p className='font-semibold text-slate-800'>{child.rollNumber}</p>
                                    </div>
                                    <div>
                                        <span className='text-slate-400'>Admission No:</span>
                                        <p className='font-semibold text-slate-800'>{child.admissionNumber || child.id}</p>
                                    </div>
                                </div>
                                <div className='rounded-lg bg-emerald-50 border border-emerald-200 p-2 text-emerald-800 text-[11px] font-medium'>
                                    ✓ Sibling Fee Concession Applied (25% reduction on tuition fee)
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Tab: Academics & Marks */}
            {activeTab === 'academics' && (
                <div className='rounded-2xl border border-slate-200 bg-white p-6 space-y-6'>
                    <div className='flex items-center justify-between border-b border-slate-100 pb-4'>
                        <div>
                            <h2 className='text-base font-bold text-slate-900'>Academic Evaluation & Examination Standing</h2>
                            <p className='text-xs text-slate-500'>
                                Approved marks from the 3-Tier Academic Review Workflow.
                            </p>
                        </div>
                        <NavLink
                            to={`${routePrefix}/student-evaluation/report-cards`}
                            className='inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-500'
                        >
                            <FileText size={14} /> Full CBSE Report Card
                        </NavLink>
                    </div>

                    <div className='grid grid-cols-2 sm:grid-cols-4 gap-4'>
                        <div className='rounded-xl bg-slate-50 p-3.5 text-center'>
                            <span className='text-[10px] font-bold text-slate-400 uppercase'>Exams Appeared</span>
                            <p className='text-xl font-bold text-slate-900 mt-1'>{resultSummary.examAppeared || 6}</p>
                        </div>
                        <div className='rounded-xl bg-slate-50 p-3.5 text-center'>
                            <span className='text-[10px] font-bold text-slate-400 uppercase'>Overall Grade</span>
                            <p className='text-xl font-bold text-blue-600 mt-1'>{resultSummary.overallGrade || 'A1'}</p>
                        </div>
                        <div className='rounded-xl bg-slate-50 p-3.5 text-center'>
                            <span className='text-[10px] font-bold text-slate-400 uppercase'>Average Score</span>
                            <p className='text-xl font-bold text-emerald-600 mt-1'>{resultSummary.averagePercent || 94.2}%</p>
                        </div>
                        <div className='rounded-xl bg-slate-50 p-3.5 text-center'>
                            <span className='text-[10px] font-bold text-slate-400 uppercase'>Class Rank</span>
                            <p className='text-xl font-bold text-indigo-600 mt-1'>Rank 1 (Top 5%)</p>
                        </div>
                    </div>

                    <div className='pt-2'>
                        <NavLink
                            to={`${routePrefix}/student-evaluation/exam-result`}
                            className='inline-flex items-center gap-2 text-xs font-semibold text-blue-600 hover:underline'
                        >
                            Open Detailed Subject Marks Breakdown <ArrowRight size={14} />
                        </NavLink>
                    </div>
                </div>
            )}

            {/* Tab: Fees & Concessions */}
            {activeTab === 'fees' && (
                <div className='rounded-2xl border border-slate-200 bg-white p-6 space-y-6'>
                    <div className='flex items-center justify-between border-b border-slate-100 pb-4'>
                        <div>
                            <h2 className='text-base font-bold text-slate-900'>Tuition, Transport & Concession Ledger</h2>
                            <p className='text-xs text-slate-500'>
                                Real-time accounts integration with official fee receipts.
                            </p>
                        </div>
                        <NavLink
                            to={`${routePrefix}/payment/fees-payment`}
                            className='inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-500'
                        >
                            <CreditCard size={14} /> View Fee Receipts
                        </NavLink>
                    </div>

                    <div className='grid grid-cols-1 md:grid-cols-3 gap-4 text-xs'>
                        <div className='rounded-xl border border-slate-200 p-4'>
                            <span className='text-slate-400'>Annual Tuition Fee:</span>
                            <p className='text-lg font-bold text-slate-900 mt-1'>₹50,000</p>
                            <span className='text-[11px] text-emerald-600 font-semibold'>Paid in Full</span>
                        </div>
                        <div className='rounded-xl border border-slate-200 p-4'>
                            <span className='text-slate-400'>Transport Obligation:</span>
                            <p className='text-lg font-bold text-slate-900 mt-1'>₹15,000</p>
                            <span className='text-[11px] text-emerald-600 font-semibold'>Route R-04 Paid</span>
                        </div>
                        <div className='rounded-xl border border-slate-200 p-4'>
                            <span className='text-slate-400'>Total Pending Due:</span>
                            <p className='text-lg font-bold text-emerald-600 mt-1'>₹0</p>
                            <span className='text-[11px] text-slate-500'>All obligations cleared</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Tab: Transportation */}
            {activeTab === 'transport' && (
                <div className='rounded-2xl border border-slate-200 bg-white p-6 space-y-6'>
                    <div className='flex items-center justify-between border-b border-slate-100 pb-4'>
                        <div>
                            <h2 className='text-base font-bold text-slate-900'>Transportation & Route Information</h2>
                            <p className='text-xs text-slate-500'>
                                School bus allocation and real-time transit status.
                            </p>
                        </div>
                        <NavLink
                            to={`${routePrefix}/transport/track-bus`}
                            className='inline-flex items-center gap-1.5 rounded-xl bg-sky-600 px-4 py-2 text-xs font-semibold text-white hover:bg-sky-500'
                        >
                            <Bus size={14} /> Track School Bus Live
                        </NavLink>
                    </div>

                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4 text-xs'>
                        <div className='rounded-xl border border-slate-200 p-4 space-y-2'>
                            <span className='text-slate-400'>Allocated Route:</span>
                            <p className='text-sm font-bold text-slate-900'>Route 04 — Kakkanad to School Campus</p>
                            <span className='text-slate-400 block pt-1'>Designated Bus Number:</span>
                            <p className='text-sm font-semibold text-slate-800'>KL-07-CD-1402 (Bus #14)</p>
                            <span className='text-slate-400 block pt-1'>Pickup / Drop-off Stop:</span>
                            <p className='text-sm font-semibold text-slate-800'>MG Road Junction, Kakkanad</p>
                        </div>
                        <div className='rounded-xl border border-slate-200 p-4 space-y-2'>
                            <span className='text-slate-400'>Designated Driver:</span>
                            <p className='text-sm font-bold text-slate-900'>Mr. Ramesh Kumar</p>
                            <span className='text-slate-400 block pt-1'>Driver Contact:</span>
                            <p className='text-sm font-semibold text-slate-800'>+91 98950 12345</p>
                            <span className='text-slate-400 block pt-1'>Bus Attendant / Monitor:</span>
                            <p className='text-sm font-semibold text-slate-800'>Mrs. Sarala Devi (+91 98950 54321)</p>
                        </div>
                    </div>
                </div>
            )}
        </section>
    )
}

export default StudentProfileView
