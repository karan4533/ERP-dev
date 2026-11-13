import React, { useState, useMemo } from 'react'
import {
    Calendar,
    CalendarDays,
    Clock,
    FileText,
    CheckCircle2,
    AlertCircle,
    Download,
    Plus,
    Search,
    Filter,
    Award,
    BookOpen,
    Users,
    GraduationCap,
    Layers,
    ChevronRight,
    Printer,
    Sliders,
    Building2,
    ShieldAlert
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

// Master Examination Terms & Schedules
export const EXAMINATION_TERMS = [
    {
        id: 'EXAM-2026-T1-MID',
        code: 'T1-MID',
        title: 'Term 1 Mid-Term Examination',
        term: 'Term 1',
        academicYear: '2025-2026',
        applicableClasses: 'Grade 6 to 12',
        startDate: '12-09-2025',
        endDate: '24-09-2025',
        marksEntryDeadline: '05-10-2025',
        resultDate: '10-10-2025',
        status: 'Results Published',
        totalPapers: 36,
        marksEnteredPapers: 36,
    },
    {
        id: 'EXAM-2026-T1-FINAL',
        code: 'T1-HY',
        title: 'Half-Yearly Examination (Term 1 Summative)',
        term: 'Term 1',
        academicYear: '2025-2026',
        applicableClasses: 'Grade 1 to 12',
        startDate: '15-11-2025',
        endDate: '30-11-2025',
        marksEntryDeadline: '10-12-2025',
        resultDate: '18-12-2025',
        status: 'Results Published',
        totalPapers: 48,
        marksEnteredPapers: 48,
    },
    {
        id: 'EXAM-2026-PA2',
        code: 'PA-02',
        title: 'Periodic Assessment 2 (Unit Test)',
        term: 'Term 2',
        academicYear: '2025-2026',
        applicableClasses: 'Grade 6 to 11',
        startDate: '18-01-2026',
        endDate: '25-01-2026',
        marksEntryDeadline: '02-02-2026',
        resultDate: '08-02-2026',
        status: 'Completed',
        totalPapers: 30,
        marksEnteredPapers: 30,
    },
    {
        id: 'EXAM-2026-PREBOARD',
        code: 'PRE-BD',
        title: 'Pre-Board Mock Examination (Class 10 & 12)',
        term: 'Term 2',
        academicYear: '2025-2026',
        applicableClasses: 'Grade 10 & 12',
        startDate: '05-02-2026',
        endDate: '20-02-2026',
        marksEntryDeadline: '28-02-2026',
        resultDate: '05-03-2026',
        status: 'Evaluation Ongoing',
        totalPapers: 14,
        marksEnteredPapers: 11,
    },
    {
        id: 'EXAM-2026-ANNUAL',
        code: 'ANN-2026',
        title: 'Annual Final Examination 2026',
        term: 'Term 2',
        academicYear: '2025-2026',
        applicableClasses: 'Grade 1 to 9 & 11',
        startDate: '10-03-2026',
        endDate: '28-03-2026',
        marksEntryDeadline: '05-04-2026',
        resultDate: '15-04-2026',
        status: 'Scheduled',
        totalPapers: 52,
        marksEnteredPapers: 0,
    },
    {
        id: 'EXAM-2026-BOARD',
        code: 'CBSE-BD',
        title: 'All India Secondary School Examination (AISSE)',
        term: 'National Board',
        academicYear: '2025-2026',
        applicableClasses: 'Grade 10 & 12',
        startDate: '15-02-2026',
        endDate: '02-04-2026',
        marksEntryDeadline: 'N/A (External)',
        resultDate: '15-05-2026',
        status: 'In Progress',
        totalPapers: 12,
        marksEnteredPapers: 0,
    },
]

// Subject Weightage & Blueprint Scheme
export const SUBJECT_BLUEPRINTS = [
    { subject: 'Mathematics', theory: 80, internal: 20, practical: 0, total: 100, passMarks: 33, duration: '3 Hours', format: 'Subjective + Objective MCQ' },
    { subject: 'Science & Technology', theory: 70, internal: 10, practical: 20, total: 100, passMarks: 33, duration: '3 Hours', format: 'Theory (70) + Practical Lab (20) + Portfolio (10)' },
    { subject: 'English Language & Literature', theory: 80, internal: 20, practical: 0, total: 100, passMarks: 33, duration: '3 Hours', format: 'Reading (20) + Writing/Grammar (20) + Literature (40)' },
    { subject: 'Social Science', theory: 80, internal: 20, practical: 0, total: 100, passMarks: 33, duration: '3 Hours', format: 'History (20) + Geography (20) + Civics (20) + Economics (20)' },
    { subject: 'Computer Applications & AI', theory: 50, internal: 0, practical: 50, total: 100, passMarks: 33, duration: '2 Hours', format: 'Theory Exam (50) + Hands-on Lab Project (50)' },
    { subject: 'Regional Language (Tamil/Hindi)', theory: 80, internal: 20, practical: 0, total: 100, passMarks: 33, duration: '3 Hours', format: 'Prose, Poetry & Grammar' },
]

// Official Grading Scale
export const GRADING_SCALE = [
    { grade: 'A1', range: '91% – 100%', gradePoint: '10.0', remark: 'Outstanding Academic Performance', badge: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
    { grade: 'A2', range: '81% – 90%', gradePoint: '9.0', remark: 'Excellent Mastery of Competencies', badge: 'bg-blue-100 text-blue-800 border-blue-200' },
    { grade: 'B1', range: '71% – 80%', gradePoint: '8.0', remark: 'Very Good Conceptual Understanding', badge: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
    { grade: 'B2', range: '61% – 70%', gradePoint: '7.0', remark: 'Good Academic Progress', badge: 'bg-cyan-100 text-cyan-800 border-cyan-200' },
    { grade: 'C1', range: '51% – 60%', gradePoint: '6.0', remark: 'Fair & Satisfactory Achievement', badge: 'bg-amber-100 text-amber-800 border-amber-200' },
    { grade: 'C2', range: '41% – 50%', gradePoint: '5.0', remark: 'Average Attainment Standard', badge: 'bg-orange-100 text-orange-800 border-orange-200' },
    { grade: 'D', range: '33% – 40%', gradePoint: '4.0', remark: 'Marginal Pass Threshold', badge: 'bg-purple-100 text-purple-800 border-purple-200' },
    { grade: 'E', range: 'Below 33%', gradePoint: '0.0', remark: 'Remedial / Essential Repeat Required', badge: 'bg-red-100 text-red-800 border-red-200' },
]

// Invigilation & Seating Allocations
export const INVIGILATION_DUTIES = [
    { room: 'Examination Hall 1 (East Wing)', capacity: 60, invigilator: 'Dr. Subramanian (Physics Lead)', backup: 'Priya Menon', classes: 'Grade 10-A, 10-B' },
    { room: 'Examination Hall 2 (West Wing)', capacity: 60, invigilator: 'S. Ramanathan (Math Dept)', backup: 'K. Meenakshi', classes: 'Grade 12-A, 12-B' },
    { room: 'Hall 301 (Senior Block)', capacity: 40, invigilator: 'Ananya Sharma (Chemistry)', backup: 'R. Venkatesh', classes: 'Grade 9-A' },
    { room: 'Hall 302 (Senior Block)', capacity: 40, invigilator: 'M. Harikrishnan (English)', backup: 'S. Divya', classes: 'Grade 9-B' },
]

const EnterpriseExamManagementPage = ({ roleOverride }) => {
    const { role: authRole } = useAuth() || {}
    const activeRole = roleOverride || authRole || 'teacher'
    const isTeacher = activeRole === 'teacher'
    const canCreateExam = ['coordinator', 'principal', 'director', 'admin', 'superadmin'].includes(activeRole)

    const [activeTab, setActiveTab] = useState('schedules') // 'schedules' | 'blueprints' | 'grading' | 'duties'
    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState('ALL')
    const [classFilter, setClassFilter] = useState('ALL')
    const [actionNotice, setActionNotice] = useState('')

    const filteredExams = useMemo(() => {
        return EXAMINATION_TERMS.filter((e) => {
            if (statusFilter !== 'ALL' && e.status !== statusFilter) return false
            if (classFilter !== 'ALL' && !e.applicableClasses.includes(classFilter)) return false
            if (searchTerm.trim()) {
                const q = searchTerm.toLowerCase()
                return (
                    e.title.toLowerCase().includes(q) ||
                    e.code.toLowerCase().includes(q) ||
                    e.term.toLowerCase().includes(q)
                )
            }
            return true
        })
    }, [statusFilter, classFilter, searchTerm])

    const handleDownloadSchedule = () => {
        setActionNotice('Official examination schedule and student hall ticket roster exported successfully.')
        setTimeout(() => setActionNotice(''), 4000)
    }

    return (
        <section className='space-y-6 pb-10 font-sans'>
            {/* Top Workspace Header */}
            <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
                <div>
                    <div className='flex items-center gap-2.5'>
                        <h1 className='text-2xl font-bold tracking-tight text-slate-900'>
                            Examinations & Academic Assessment
                        </h1>
                        <span className='px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold'>
                            Academic Year 2025–2026
                        </span>
                        {isTeacher && (
                            <span className='px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-600 text-xs font-semibold'>
                                Teacher View
                            </span>
                        )}
                    </div>
                    <p className='mt-1 text-xs text-slate-500'>
                        {isTeacher
                            ? 'Official institutional examination schedules, subject blueprints, grading standards, and duty rosters (Scheduled by Examination Cell).'
                            : 'Centralized institutional examination scheduling, subject blueprints, grading standards, and hall duty invigilation.'}
                    </p>
                </div>

                <div className='flex items-center gap-2.5 flex-wrap'>
                    <button
                        type='button'
                        onClick={handleDownloadSchedule}
                        className='inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer'
                    >
                        <Download size={14} /> Download Schedule (PDF)
                    </button>
                    {canCreateExam ? (
                        <button
                            type='button'
                            onClick={() => {
                                setActionNotice('New examination term creator opened. Institutional parameters applied.')
                                setTimeout(() => setActionNotice(''), 4000)
                            }}
                            className='inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer'
                        >
                            <Plus size={14} /> Schedule Examination
                        </button>
                    ) : (
                        <span className='inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-600 text-xs font-semibold'>
                            <ShieldAlert size={13} className='text-slate-400' />
                            View Only
                        </span>
                    )}
                </div>
            </div>

            {/* Action Notice */}
            {actionNotice && (
                <div className='p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2 animate-in fade-in'>
                    <CheckCircle2 size={16} className='text-emerald-600 shrink-0' />
                    <span>{actionNotice}</span>
                </div>
            )}

            {/* KPI Summary Cards */}
            <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4'>
                <div className='rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs space-y-1.5'>
                    <div className='flex items-center justify-between text-slate-500'>
                        <span className='text-xs font-semibold'>Scheduled Terms</span>
                        <CalendarDays size={18} className='text-blue-600' />
                    </div>
                    <p className='text-2xl font-bold tracking-tight text-slate-900'>6 Active Cycles</p>
                    <p className='text-[11px] text-slate-500'>Pre-Board & Annual active</p>
                </div>

                <div className='rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs space-y-1.5'>
                    <div className='flex items-center justify-between text-slate-500'>
                        <span className='text-xs font-semibold'>Total Assessment Papers</span>
                        <BookOpen size={18} className='text-indigo-600' />
                    </div>
                    <p className='text-2xl font-bold tracking-tight text-slate-900'>192 Subject Papers</p>
                    <p className='text-[11px] text-emerald-600 font-semibold'>82% evaluations finalized</p>
                </div>

                <div className='rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs space-y-1.5'>
                    <div className='flex items-center justify-between text-slate-500'>
                        <span className='text-xs font-semibold'>Enrolled Candidates</span>
                        <Users size={18} className='text-purple-600' />
                    </div>
                    <p className='text-2xl font-bold tracking-tight text-slate-900'>1,240 Students</p>
                    <p className='text-[11px] text-slate-500'>Classes 1 through 12</p>
                </div>

                <div className='rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs space-y-1.5'>
                    <div className='flex items-center justify-between text-slate-500'>
                        <span className='text-xs font-semibold'>Passing Threshold</span>
                        <Award size={18} className='text-amber-600' />
                    </div>
                    <p className='text-2xl font-bold tracking-tight text-slate-900'>33.0% Minimum</p>
                    <p className='text-[11px] text-slate-500'>Theory + Internal composite</p>
                </div>
            </div>

            {/* Navigation Tabs Bar */}
            <div className='border-b border-slate-200 flex items-center space-x-2 sm:space-x-4 overflow-x-auto text-xs font-semibold'>
                <button
                    type='button'
                    onClick={() => setActiveTab('schedules')}
                    className={`py-3 px-3.5 border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
                        activeTab === 'schedules'
                            ? 'border-blue-600 text-blue-700 font-bold bg-blue-50/30'
                            : 'border-transparent text-slate-600 hover:text-slate-900'
                    }`}
                >
                    <Calendar size={15} /> Examination Schedules & Terms
                </button>
                <button
                    type='button'
                    onClick={() => setActiveTab('blueprints')}
                    className={`py-3 px-3.5 border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
                        activeTab === 'blueprints'
                            ? 'border-blue-600 text-blue-700 font-bold bg-blue-50/30'
                            : 'border-transparent text-slate-600 hover:text-slate-900'
                    }`}
                >
                    <FileText size={15} /> Subject Blueprints & Weightage
                </button>
                <button
                    type='button'
                    onClick={() => setActiveTab('grading')}
                    className={`py-3 px-3.5 border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
                        activeTab === 'grading'
                            ? 'border-blue-600 text-blue-700 font-bold bg-blue-50/30'
                            : 'border-transparent text-slate-600 hover:text-slate-900'
                    }`}
                >
                    <Award size={15} /> Grading Scale & Performance Bands
                </button>
                <button
                    type='button'
                    onClick={() => setActiveTab('duties')}
                    className={`py-3 px-3.5 border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
                        activeTab === 'duties'
                            ? 'border-blue-600 text-blue-700 font-bold bg-blue-50/30'
                            : 'border-transparent text-slate-600 hover:text-slate-900'
                    }`}
                >
                    <Building2 size={15} /> Invigilation Duties & Halls
                </button>
            </div>

            {/* TAB 1: Examination Schedules */}
            {activeTab === 'schedules' && (
                <div className='space-y-4'>
                    {/* Filters Bar */}
                    <div className='rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3'>
                        <div className='relative flex-1 max-w-sm'>
                            <Search size={14} className='absolute left-3 top-1/2 -translate-y-1/2 text-slate-400' />
                            <input
                                type='text'
                                placeholder='Search examination term, code...'
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className='w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500'
                            />
                        </div>

                        <div className='flex items-center gap-2.5 flex-wrap'>
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className='px-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white font-medium text-slate-700 focus:outline-none'
                            >
                                <option value='ALL'>All Statuses</option>
                                <option value='Scheduled'>Scheduled</option>
                                <option value='In Progress'>In Progress</option>
                                <option value='Evaluation Ongoing'>Evaluation Ongoing</option>
                                <option value='Completed'>Completed</option>
                                <option value='Results Published'>Results Published</option>
                            </select>

                            <select
                                value={classFilter}
                                onChange={(e) => setClassFilter(e.target.value)}
                                className='px-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white font-medium text-slate-700 focus:outline-none'
                            >
                                <option value='ALL'>All Classes</option>
                                <option value='10'>Class 10</option>
                                <option value='12'>Class 12</option>
                                <option value='6 to 12'>Secondary (6-12)</option>
                                <option value='1 to 12'>Whole School (1-12)</option>
                            </select>
                        </div>
                    </div>

                    {/* Examination Cards Grid */}
                    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
                        {filteredExams.map((exam) => {
                            const isPublished = exam.status === 'Results Published'
                            const isInProgress = exam.status === 'In Progress'
                            const isScheduled = exam.status === 'Scheduled'
                            const isEvaluating = exam.status === 'Evaluation Ongoing'

                            const badgeStyle = isPublished
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : isInProgress
                                ? 'bg-blue-50 text-blue-700 border-blue-200'
                                : isEvaluating
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : 'bg-slate-100 text-slate-700 border-slate-200'

                            return (
                                <div
                                    key={exam.id}
                                    className='rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs flex flex-col justify-between hover:border-blue-300 transition-all space-y-4'
                                >
                                    <div className='space-y-2.5'>
                                        <div className='flex items-center justify-between gap-2'>
                                            <span className='font-mono text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md'>
                                                {exam.code}
                                            </span>
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${badgeStyle}`}>
                                                {exam.status}
                                            </span>
                                        </div>

                                        <h3 className='font-bold text-slate-900 text-sm leading-snug'>
                                            {exam.title}
                                        </h3>
                                        <p className='text-xs text-slate-500'>
                                            Scope: <span className='font-semibold text-slate-700'>{exam.applicableClasses}</span>
                                        </p>

                                        <div className='space-y-1.5 pt-2 text-xs border-t border-slate-100'>
                                            <div className='flex items-center justify-between text-slate-600'>
                                                <span>Exam Window:</span>
                                                <span className='font-semibold text-slate-800'>{exam.startDate} to {exam.endDate}</span>
                                            </div>
                                            <div className='flex items-center justify-between text-slate-600'>
                                                <span>Marks Deadline:</span>
                                                <span className='font-semibold text-slate-800'>{exam.marksEntryDeadline}</span>
                                            </div>
                                            <div className='flex items-center justify-between text-slate-600'>
                                                <span>Result Date:</span>
                                                <span className='font-semibold text-slate-800'>{exam.resultDate}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className='pt-3 border-t border-slate-100 flex items-center justify-between'>
                                        <div className='text-[11px] text-slate-500'>
                                            Evaluated: <span className='font-bold text-slate-800'>{exam.marksEnteredPapers}/{exam.totalPapers}</span> papers
                                        </div>
                                        <button
                                            type='button'
                                            onClick={() => {
                                                setActionNotice(`Navigated to marks entry & assessment roster for ${exam.title}.`)
                                                setTimeout(() => setActionNotice(''), 4000)
                                            }}
                                            className='text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer'
                                        >
                                            View Schedule <ChevronRight size={14} />
                                        </button>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}

            {/* TAB 2: Subject Blueprints & Weightage */}
            {activeTab === 'blueprints' && (
                <div className='rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs space-y-4'>
                    <div>
                        <h3 className='text-sm font-bold text-slate-900'>Subject Assessment Blueprints & Weightage Matrix</h3>
                        <p className='text-xs text-slate-500 mt-0.5'>
                            Governed allocation between theory examinations, practical laboratories, and internal continuous assessments.
                        </p>
                    </div>

                    <div className='overflow-x-auto'>
                        <table className='w-full text-left text-xs'>
                            <thead>
                                <tr className='border-b border-slate-100 bg-slate-50/70 text-[11px] font-semibold text-slate-500 uppercase'>
                                    <th className='py-3 px-4'>Subject</th>
                                    <th className='py-3 px-4 text-center'>Theory Marks</th>
                                    <th className='py-3 px-4 text-center'>Internal Assessment</th>
                                    <th className='py-3 px-4 text-center'>Practical Lab</th>
                                    <th className='py-3 px-4 text-center'>Maximum Total</th>
                                    <th className='py-3 px-4 text-center'>Passing Benchmark</th>
                                    <th className='py-3 px-4'>Duration & Format</th>
                                </tr>
                            </thead>
                            <tbody className='divide-y divide-slate-100 text-slate-700'>
                                {SUBJECT_BLUEPRINTS.map((bp) => (
                                    <tr key={bp.subject} className='hover:bg-slate-50/60 transition-colors'>
                                        <td className='py-3 px-4 font-bold text-slate-900'>{bp.subject}</td>
                                        <td className='py-3 px-4 text-center font-semibold text-slate-800'>{bp.theory}</td>
                                        <td className='py-3 px-4 text-center font-semibold text-slate-800'>{bp.internal}</td>
                                        <td className='py-3 px-4 text-center font-semibold text-slate-800'>{bp.practical || '—'}</td>
                                        <td className='py-3 px-4 text-center font-bold text-blue-700'>{bp.total}</td>
                                        <td className='py-3 px-4 text-center'>
                                            <span className='px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-100'>
                                                {bp.passMarks}% ({Math.ceil(bp.total * (bp.passMarks / 100))})
                                            </span>
                                        </td>
                                        <td className='py-3 px-4'>
                                            <span className='font-semibold text-slate-800'>{bp.duration}</span>
                                            <p className='text-[11px] text-slate-500'>{bp.format}</p>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* TAB 3: Grading Scale & Performance Bands */}
            {activeTab === 'grading' && (
                <div className='rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs space-y-4'>
                    <div>
                        <h3 className='text-sm font-bold text-slate-900'>Institutional Grading Standards & Performance Descriptors</h3>
                        <p className='text-xs text-slate-500 mt-0.5'>
                            Standardized academic classification benchmarks mapped directly to grade points and transcript notations.
                        </p>
                    </div>

                    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-2'>
                        {GRADING_SCALE.map((item) => (
                            <div
                                key={item.grade}
                                className='rounded-xl border border-slate-200/80 bg-white p-4 space-y-2 shadow-2xs hover:shadow-xs transition-shadow'
                            >
                                <div className='flex items-center justify-between'>
                                    <span className={`px-2.5 py-1 rounded-lg text-sm font-black border ${item.badge}`}>
                                        Grade {item.grade}
                                    </span>
                                    <span className='font-mono text-xs font-bold text-slate-700'>
                                        GP: {item.gradePoint}
                                    </span>
                                </div>
                                <div className='text-xs font-bold text-slate-900'>{item.range}</div>
                                <p className='text-[11px] text-slate-500 leading-snug'>{item.remark}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* TAB 4: Invigilation Duties & Halls */}
            {activeTab === 'duties' && (
                <div className='rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs space-y-4'>
                    <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-3'>
                        <div>
                            <h3 className='text-sm font-bold text-slate-900'>Invigilation Duty Roster & Examination Hall Seating</h3>
                            <p className='text-xs text-slate-500 mt-0.5'>
                                Assigned faculty supervision, hall capacities, and backup emergency contacts.
                            </p>
                        </div>
                        <button
                            type='button'
                            onClick={() => {
                                setActionNotice('Invigilation duty roster PDF generated with room floor plans.')
                                setTimeout(() => setActionNotice(''), 4000)
                            }}
                            className='inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer'
                        >
                            <Printer size={14} /> Print Duty Roster
                        </button>
                    </div>

                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                        {INVIGILATION_DUTIES.map((duty) => (
                            <div key={duty.room} className='p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 space-y-2'>
                                <div className='flex items-center justify-between'>
                                    <h4 className='font-bold text-slate-900 text-xs'>{duty.room}</h4>
                                    <span className='text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md'>
                                        Capacity: {duty.capacity} Desk Units
                                    </span>
                                </div>
                                <div className='text-xs space-y-1 text-slate-600'>
                                    <p>Primary Invigilator: <span className='font-bold text-slate-800'>{duty.invigilator}</span></p>
                                    <p>Reserve Invigilator: <span className='font-semibold text-slate-700'>{duty.backup}</span></p>
                                    <p>Candidate Cohort: <span className='font-semibold text-slate-700'>{duty.classes}</span></p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </section>
    )
}

export default EnterpriseExamManagementPage

