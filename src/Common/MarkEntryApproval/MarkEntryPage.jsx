import React, { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import {
    Calendar,
    Download,
    Upload,
    ClipboardPen,
    Award,
    FileText,
    CheckCircle2,
    Clock,
    XCircle,
    Search,
    Filter,
    Eye,
    ChevronRight,
    GraduationCap,
    Trophy,
    CalendarCheck,
    Check,
    X
} from 'lucide-react'
import { toast } from 'react-toastify'
import { academicService } from '../../services/modules/academicService'
import { useAuth } from '../../context/AuthContext'
import EntryClosureGate from '../demoDomain/EntryClosureGate'
import { IntegrationNotice, PageHeader } from '../ui'
import { entryBlocked } from '../demoDomain/governance'
import IncompleteMarksModal from '../../Pages/Teacher/StudentEvaluation/MarkEntry/Components/IncompleteMarksModal'
import SubmitMarksConfirmModal from '../../Pages/Teacher/StudentEvaluation/MarkEntry/Components/SubmitMarksConfirmModal'
import {
    ACADEMIC_YEARS,
    CLASSES,
    EXAM_OPTIONS,
    SECTIONS,
    STATUS_FILTERS,
    SUBJECTS,
    TERMS,
    filterStudentsForTable,
    formatClassLabel,
    getEntryWithComputed,
    getExamMaxMarks,
    getMarkEntryStats,
    getSessionStatusColor,
    getSessionStatusLabel,
    isSessionLocked,
    loadMarkEntrySession,
    resultBadgeColor,
    saveMarkEntrySession,
    submitMarkEntrySession,
    getAllMarkSessions,
    updateMarkSessionApproval,
    computeClassRankList
} from './markEntryApprovalData'

const inputClass =
    'text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-2 py-2.5 w-full bg-white'

const formatDate = (date) => {
    if (!date) return ''
    const day = String(date.getDate()).padStart(2, '0')
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const year = date.getFullYear()
    return `${day}/${month}/${year}`
}

const parseDisplayDate = (value) => {
    if (!value) return new Date()
    const [day, month, year] = value.split('/').map(Number)
    if (!day || !month || !year) return new Date()
    return new Date(year, month - 1, day)
}

const getSubmitMessage = (session) => {
    if (!session || session.status !== 'submitted') return ''
    if (session.approvalStatus === 'Pending') {
        return 'Marks submitted to the Principal / Director for review. They will be published to the student portal once approved.'
    }
    if (session.approvalStatus === 'Approved') {
        return 'Marks approved and officially published! Class rank list and report cards have been generated.'
    }
    if (session.approvalStatus === 'Rejected') {
        return session.rejectionReason
            ? `Marks returned by Approver: ${session.rejectionReason}. Please revise and resubmit.`
            : 'Marks returned by Approver. Please revise and resubmit.'
    }
    return 'Marks have already been submitted for this examination.'
}

const MarkEntryPage = ({ submittedByRole = 'Teacher' }) => {
    const navigate = useNavigate()
    const { role: authRole, name: authName } = useAuth()
    const effectiveRole = authRole || submittedByRole.toLowerCase()

    // Top view tab: Mark Entry vs Marks Approval & Rank Lists
    const [activeTab, setActiveTab] = useState('entry')

    // Mark Entry Form States
    const [academicYear, setAcademicYear] = useState(ACADEMIC_YEARS[0])
    const [term, setTerm] = useState(TERMS[0])
    const [exam, setExam] = useState(EXAM_OPTIONS[0].name)
    const [className, setClassName] = useState(() => CLASSES[0] || '')
    const [section, setSection] = useState(() => SECTIONS[0] || '')
    const [subject, setSubject] = useState(() => SUBJECTS[0] || '')
    const [examDate, setExamDate] = useState(parseDisplayDate('15/07/2026'))

    const catalogEmpty = CLASSES.length === 0 || SECTIONS.length === 0 || SUBJECTS.length === 0

    const [session, setSession] = useState(null)
    const [loaded, setLoaded] = useState(false)
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState('All')
    const [incompleteModal, setIncompleteModal] = useState(false)
    const [submitModal, setSubmitModal] = useState(false)
    const [saveMessage, setSaveMessage] = useState('')
    const [submitMessage, setSubmitMessage] = useState('')

    // Approval & Rank List State
    const [refreshKey, setRefreshKey] = useState(0)
    const allSessions = useMemo(() => {
        void refreshKey
        return getAllMarkSessions()
    }, [refreshKey])

    const [approvalSearch, setApprovalSearch] = useState('')
    const [approvalStatusFilter, setApprovalStatusFilter] = useState('All')
    const [selectedSessionForRankList, setSelectedSessionForRankList] = useState(null)

    // Filtered approval sessions
    const filteredApprovalSessions = useMemo(() => {
        return allSessions.filter((s) => {
            const matchesSearch =
                !approvalSearch ||
                s.exam?.toLowerCase().includes(approvalSearch.toLowerCase()) ||
                s.subject?.toLowerCase().includes(approvalSearch.toLowerCase()) ||
                s.className?.toLowerCase().includes(approvalSearch.toLowerCase()) ||
                s.section?.toLowerCase().includes(approvalSearch.toLowerCase())
            const matchesStatus =
                approvalStatusFilter === 'All' ||
                (approvalStatusFilter === 'Pending' && s.approvalStatus === 'Pending') ||
                (approvalStatusFilter === 'Approved' && s.approvalStatus === 'Approved') ||
                (approvalStatusFilter === 'Rejected' && s.approvalStatus === 'Rejected')
            return matchesSearch && matchesStatus
        })
    }, [allSessions, approvalSearch, approvalStatusFilter])

    const stats = useMemo(() => {
        if (!session) return null
        return getMarkEntryStats(session.students, session.entries, session.maxMarks)
    }, [session])

    const filteredStudents = useMemo(() => {
        if (!session) return []
        return filterStudentsForTable(session.students, session.entries, { search, statusFilter })
    }, [session, search, statusFilter])

    const isLocked = isSessionLocked(session)

    const handleLoadStudents = () => {
        if (!className || !section || !subject) {
            setSaveMessage('Create classes and sections under Class Details, and subjects under RBAC, before entering marks.')
            setLoaded(false)
            setSession(null)
            return
        }

        const nextSession = loadMarkEntrySession({
            academicYear,
            term,
            exam,
            className,
            section,
            subject,
            examDate: formatDate(examDate),
            maxMarks: getExamMaxMarks(exam),
        })
        setSession(nextSession)
        setLoaded(true)
        setSearch('')
        setStatusFilter('All')
        setSaveMessage(
            nextSession.students.length === 0
                ? 'No students are assigned to this class and section yet.'
                : '',
        )
        setSubmitMessage(getSubmitMessage(nextSession))
    }

    const updateEntry = (studentId, patch) => {
        setSession((current) => {
            if (!current) return current
            const existing = current.entries[studentId] ?? { obtainedMarks: null, absent: false, remarks: '' }
            let nextEntry = { ...existing, ...patch }

            if (patch.absent) {
                nextEntry = { ...nextEntry, obtainedMarks: null }
            }

            if (patch.obtainedMarks !== undefined && patch.obtainedMarks !== null && patch.obtainedMarks !== '') {
                nextEntry = { ...nextEntry, absent: false }
            }

            return {
                ...current,
                entries: {
                    ...current.entries,
                    [studentId]: nextEntry,
                },
            }
        })
        setSaveMessage('')
        setSubmitMessage('')
    }

    const handleSaveDraft = () => {
        if (entryBlocked('Mark Entry', submittedByRole)) return
        if (!session || isLocked) return
        const saved = saveMarkEntrySession({ ...session, status: 'draft', approvalStatus: null })
        setSession(saved)
        setSaveMessage('Draft saved successfully. You can continue entering marks later.')
        toast.success('Mark entry draft saved!')
    }

    const handleSubmitClick = () => {
        if (!session || !stats || isLocked) return
        if (stats.pending > 0) {
            setIncompleteModal(true)
            return
        }
        setSubmitModal(true)
    }

    const syncMarksToService = (targetSession) => {
        if (!targetSession || !targetSession.entries) return
        Object.entries(targetSession.entries).forEach(([studentId, entry]) => {
            if (!entry || entry.absent) return
            academicService.enterMarks({
                examId: targetSession.examType || 'EXAM-2025-T2',
                studentId,
                subjectId: targetSession.subject || 'SUBJ-GENERAL',
                subjectName: targetSession.subject || 'Subject',
                maxMarks: targetSession.maxMarks || 100,
                theoryMarks: Number(entry.obtainedMarks) || 0,
                practicalMarks: 0,
                grade: targetSession.className || 'Grade 10',
                section: targetSession.section || 'A',
            }).catch(() => {})
        })
    }

    const handleConfirmSubmit = () => {
        if (entryBlocked('Mark Entry', submittedByRole)) return
        if (!session) return
        const submitted = submitMarkEntrySession(session, { submittedByRole })
        setSession(submitted)
        syncMarksToService(submitted)
        setSubmitModal(false)
        setSubmitMessage(getSubmitMessage(submitted))
        setSaveMessage('')
        setRefreshKey((k) => k + 1)
        toast.success('Marks submitted successfully for Principal review!')
    }

    // Direct Principal / Reviewer Approval & Auto-Publishing Action
    const handleApproveSession = (sessionToApprove) => {
        const updated = updateMarkSessionApproval(sessionToApprove.contextKey, 'Approved', {
            actor: authName || 'Principal Dr. Anita Rajesh',
            actorRole: 'Principal',
            remarks: 'Marks verified and approved. Results officially published to portal.',
        })
        if (updated) {
            syncMarksToService(updated)
            setRefreshKey((k) => k + 1)
            setSelectedSessionForRankList(updated)
            toast.success(
                `✓ Marks Approved & Results Published for ${formatClassLabel(updated.className)} Section ${updated.section} (${updated.subject})! Class Rank List & Progress Cards Generated.`,
                { autoClose: 4000 }
            )
        }
    }

    const handleRejectSession = (sessionToReject) => {
        const reason = 'Returned for re-verification.'
        if (reason === null) return
        const updated = updateMarkSessionApproval(sessionToReject.contextKey, 'Rejected', {
            actor: authName || 'Principal Dr. Anita Rajesh',
            actorRole: 'Principal',
            remarks: reason.trim() || 'Returned for re-verification.',
        })
        if (updated) {
            setRefreshKey((k) => k + 1)
            toast.info('Mark session returned to teacher for correction.')
        }
    }

    // Dynamic basePath
    const basePath = effectiveRole === 'principal' ? '/principal' : effectiveRole === 'coordinator' ? '/coordinator' : '/teacher'

    return (
        <section className='space-y-6 font-inter'>
            <EntryClosureGate moduleName='Mark Entry' actor={submittedByRole} />
            <IntegrationNotice
                state='demo'
                title='Browser-stored assessment session'
                description='Marks and workflow states are demonstration data stored in this browser. Production import, export, server validation, immutable approval history and student publication require the assessment API.'
            />
            <IntegrationNotice
                state='demo'
                title='Browser-stored assessment session'
                description='Marks and workflow states are demonstration data stored in this browser. Production import, export, server validation, immutable approval history and student publication require the assessment API.'
            />

            {/* Integrated Navigation Header */}
            <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs'>
                <div className='flex items-center gap-3'>
                    <div className='p-2.5 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100 shadow-2xs'>
                        {activeTab === 'entry' ? <ClipboardPen size={24} /> : <Trophy size={24} />}
                    </div>
                    <div>
                        <div className='flex items-center gap-2'>
                            <h1 className='text-xl md:text-2xl font-bold tracking-tight text-slate-900'>
                                {activeTab === 'entry'
                                    ? 'Examination Mark Entry & Evaluation'
                                    : 'Marks Approval, Class Rank Lists & Report Cards'}
                            </h1>
                            <span className='rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700 border border-indigo-100'>
                                CBES Grade Matrix
                            </span>
                        </div>
                        <p className='text-xs text-slate-500 mt-0.5'>
                            {activeTab === 'entry'
                                ? 'Enter, calculate, and validate examination and continuous assessment (CA/PCA) student scores.'
                                : 'Principal review and approval workflow: publish results, generate merit rank lists, and export progress cards.'}
                        </p>
                    </div>
                </div>

                {/* Tab Switcher & Quick Navigation */}
                <div className='flex flex-wrap items-center gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200/80'>
                    <button
                        type='button'
                        onClick={() => setActiveTab('entry')}
                        className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            activeTab === 'entry'
                                ? 'bg-white text-indigo-700 shadow-xs'
                                : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                        <ClipboardPen size={14} />
                        <span>Mark Entry</span>
                    </button>
                    <button
                        type='button'
                        onClick={() => setActiveTab('approvals')}
                        className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            activeTab === 'approvals'
                                ? 'bg-white text-indigo-700 shadow-xs'
                                : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                        <Trophy size={14} />
                        <span>Approval & Rank Lists</span>
                        <span className='ml-1 px-1.5 py-0.2 rounded-md bg-indigo-50 text-[10px] text-indigo-700 font-bold'>
                            {allSessions.length}
                        </span>
                    </button>
                    <button
                        type='button'
                        onClick={() => navigate(`${basePath}/unit-tests`)}
                        className='flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-white/60 transition cursor-pointer'
                        title='Go to Continuous Assessment (CA/PCA)'
                    >
                        <Award size={13} />
                        <span>CA / PCA</span>
                    </button>
                    <button
                        type='button'
                        onClick={() => navigate(`${basePath}/student-evaluation/report-cards`)}
                        className='flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-white/60 transition cursor-pointer'
                        title='Go to Progress Report Cards'
                    >
                        <FileText size={13} />
                        <span>Report Cards</span>
                    </button>
                </div>
            </div>

            {/* TAB 1: MARK ENTRY & SUBMISSION */}
            {activeTab === 'entry' && (
                <>
                    {catalogEmpty && (
                        <div className='bg-white rounded-2xl shadow-xs p-6 border border-slate-200'>
                            <h2 className='text-base font-bold text-slate-900'>No classes or subjects configured</h2>
                            <p className='text-xs text-slate-500 mt-1'>
                                Ensure classes and subjects are set up before entering examination marks.
                            </p>
                        </div>
                    )}

                    {saveMessage && !loaded && (
                        <div className='rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800 font-medium'>
                            {saveMessage}
                        </div>
                    )}

                    {/* Filter & Selector Box */}
                    <div className='bg-white rounded-2xl border border-slate-200 shadow-xs p-5'>
                        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
                            <div className='flex flex-col gap-y-1.5'>
                                <label htmlFor='academic-year' className='text-xs font-semibold text-slate-600'>Academic Year</label>
                                <select id='academic-year' value={academicYear} onChange={(e) => setAcademicYear(e.target.value)} className='rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-indigo-500'>
                                    {ACADEMIC_YEARS.map((item) => (
                                        <option key={item} value={item}>{item}</option>
                                    ))}
                                </select>
                            </div>
                            <div className='flex flex-col gap-y-1.5'>
                                <label htmlFor='term' className='text-xs font-semibold text-slate-600'>Term</label>
                                <select id='term' value={term} onChange={(e) => setTerm(e.target.value)} className='rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-indigo-500'>
                                    {TERMS.map((item) => (
                                        <option key={item} value={item}>{item}</option>
                                    ))}
                                </select>
                            </div>
                            <div className='flex flex-col gap-y-1.5'>
                                <label htmlFor='exam' className='text-xs font-semibold text-slate-600'>Assessment / Exam Type</label>
                                <select id='exam' value={exam} onChange={(e) => setExam(e.target.value)} className='rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-indigo-500'>
                                    {EXAM_OPTIONS.map((item) => (
                                        <option key={item.name} value={item.name}>{item.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className='flex flex-col gap-y-1.5'>
                                <label htmlFor='class' className='text-xs font-semibold text-slate-600'>Class</label>
                                <select id='class' value={className} onChange={(e) => setClassName(e.target.value)} className='rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-indigo-500'>
                                    <option value=''>Select class</option>
                                    {CLASSES.map((item) => (
                                        <option key={item} value={item}>{formatClassLabel(item)}</option>
                                    ))}
                                </select>
                            </div>
                            <div className='flex flex-col gap-y-1.5'>
                                <label htmlFor='section' className='text-xs font-semibold text-slate-600'>Section</label>
                                <select id='section' value={section} onChange={(e) => setSection(e.target.value)} className='rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-indigo-500'>
                                    <option value=''>Select section</option>
                                    {SECTIONS.map((item) => (
                                        <option key={item} value={item}>{item}</option>
                                    ))}
                                </select>
                            </div>
                            <div className='flex flex-col gap-y-1.5'>
                                <label htmlFor='subject' className='text-xs font-semibold text-slate-600'>Subject</label>
                                <select id='subject' value={subject} onChange={(e) => setSubject(e.target.value)} className='rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-indigo-500'>
                                    <option value=''>Select subject</option>
                                    {SUBJECTS.map((item) => (
                                        <option key={item} value={item}>{item}</option>
                                    ))}
                                </select>
                            </div>
                            <div className='flex flex-col gap-y-1.5'>
                                <label htmlFor='exam-date' className='text-xs font-semibold text-slate-600'>Examination Date</label>
                                <div className='relative'>
                                    <DatePicker
                                        id='exam-date'
                                        selected={examDate}
                                        onChange={(date) => setExamDate(date)}
                                        dateFormat='dd/MM/yyyy'
                                        className='rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 w-full focus:outline-none focus:border-indigo-500'
                                    />
                                    <Calendar size={14} className='absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none' />
                                </div>
                            </div>
                            <div className='flex items-end'>
                                <button
                                    type='button'
                                    onClick={handleLoadStudents}
                                    className='w-full rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 transition cursor-pointer'
                                >
                                    Load Student Register
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Loaded Mark Entry Grid */}
                    {loaded && session && (
                        <>
                            {/* Summary Banner */}
                            <div className='bg-white rounded-2xl border border-slate-200 shadow-xs p-5'>
                                <div className='flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3'>
                                    <div>
                                        <h2 className='text-base font-bold text-slate-900'>
                                            {exam} · {formatClassLabel(className)} Section {section} · {subject}
                                        </h2>
                                        <p className='text-xs text-slate-500 mt-0.5'>
                                            Term: {term} · Maximum Marks: <strong className='text-indigo-600'>{session.maxMarks}</strong>
                                        </p>
                                    </div>
                                    <div className='flex items-center gap-2'>
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${getSessionStatusColor(session)}`}>
                                            {getSessionStatusLabel(session)}
                                        </span>
                                    </div>
                                </div>

                                {stats && (
                                    <div className='grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-4'>
                                        {[
                                            { label: 'Total Students', value: stats.totalStudents },
                                            { label: 'Marks Entered', value: stats.marksEntered },
                                            { label: 'Pending', value: stats.pending },
                                            { label: 'Absent', value: stats.absent },
                                            { label: 'Class Average', value: stats.averageMark },
                                            { label: 'Highest Score', value: stats.highestMark },
                                        ].map((item) => (
                                            <div key={item.label} className='p-3 rounded-xl bg-slate-50 border border-slate-100 text-center'>
                                                <span className='text-[10px] font-semibold text-slate-400 uppercase tracking-wider'>{item.label}</span>
                                                <p className='text-lg font-bold text-slate-900 mt-0.5'>{item.value}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Students Mark Entry Table */}
                            <div className='bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden'>
                                <div className='p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3'>
                                    <div className='flex items-center gap-2 flex-1 max-w-sm'>
                                        <Search size={14} className='text-slate-400' />
                                        <input
                                            type='text'
                                            placeholder='Filter by name or roll number...'
                                            value={search}
                                            onChange={(e) => setSearch(e.target.value)}
                                            className='w-full text-xs text-slate-800 placeholder-slate-400 focus:outline-none'
                                        />
                                    </div>
                                    <div className='flex items-center gap-2'>
                                        <span className='text-xs text-slate-500 font-semibold'>Filter:</span>
                                        <select
                                            value={statusFilter}
                                            onChange={(e) => setStatusFilter(e.target.value)}
                                            className='rounded-xl border border-slate-200 px-2.5 py-1 text-xs text-slate-700 focus:outline-none'
                                        >
                                            {STATUS_FILTERS.map((f) => (
                                                <option key={f} value={f}>{f}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className='overflow-x-auto'>
                                    <table className='w-full text-left text-xs'>
                                        <thead>
                                            <tr className='border-b border-slate-200/80 bg-slate-50 text-slate-700 font-semibold uppercase tracking-wider text-[11px]'>
                                                <th className='py-3.5 px-4'>Roll #</th>
                                                <th className='py-3.5 px-4'>Student Name</th>
                                                <th className='py-3.5 px-4'>Marks ({session.maxMarks})</th>
                                                <th className='py-3.5 px-4 text-center'>Absent</th>
                                                <th className='py-3.5 px-4'>Percentage</th>
                                                <th className='py-3.5 px-4'>Grade</th>
                                                <th className='py-3.5 px-4'>Result</th>
                                                <th className='py-3.5 px-4'>Remarks</th>
                                            </tr>
                                        </thead>
                                        <tbody className='divide-y divide-slate-100'>
                                            {filteredStudents.length === 0 ? (
                                                <tr>
                                                    <td colSpan={8} className='py-8 text-center text-slate-400'>
                                                        No students found matching current filters.
                                                    </td>
                                                </tr>
                                            ) : (
                                                filteredStudents.map((student) => {
                                                    const entry = session.entries[student.id] ?? { obtainedMarks: null, absent: false, remarks: '' }
                                                    const computed = getEntryWithComputed(entry, session.maxMarks)
                                                    return (
                                                        <tr key={student.id} className='hover:bg-slate-50/70 transition-colors'>
                                                            <td className='py-3.5 px-4 font-mono font-bold text-slate-700'>{student.rollNumber}</td>
                                                            <td className='py-3.5 px-4 font-bold text-slate-900'>{student.name}</td>
                                                            <td className='py-3.5 px-4'>
                                                                <input
                                                                    type='number'
                                                                    min='0'
                                                                    max={session.maxMarks}
                                                                    disabled={isLocked || entry.absent}
                                                                    value={entry.obtainedMarks ?? ''}
                                                                    onChange={(e) => updateEntry(student.id, { obtainedMarks: e.target.value })}
                                                                    placeholder='Marks'
                                                                    aria-label={`Marks for ${student.name}`}
                                                                    className='w-20 rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-900 focus:outline-none focus:border-indigo-500 disabled:bg-slate-100'
                                                                />
                                                            </td>
                                                            <td className='py-3.5 px-4 text-center'>
                                                                <input
                                                                    type='checkbox'
                                                                    disabled={isLocked}
                                                                    checked={entry.absent}
                                                                    onChange={(e) => updateEntry(student.id, { absent: e.target.checked })}
                                                                    aria-label={`Mark ${student.name} absent`}
                                                                    className='size-4 rounded text-indigo-600 focus:ring-0 cursor-pointer'
                                                                />
                                                            </td>
                                                            <td className='py-3.5 px-4 font-semibold text-slate-700'>{computed.displayPercent}</td>
                                                            <td className='py-3.5 px-4 font-bold text-indigo-600'>{computed.grade}</td>
                                                            <td className='py-3.5 px-4'>
                                                                <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                                                    resultBadgeColor[computed.result] || 'bg-slate-100 text-slate-700'
                                                                }`}>
                                                                    {computed.result}
                                                                </span>
                                                            </td>
                                                            <td className='py-3.5 px-4'>
                                                                <input
                                                                    type='text'
                                                                    disabled={isLocked}
                                                                    value={entry.remarks || ''}
                                                                    onChange={(e) => updateEntry(student.id, { remarks: e.target.value })}
                                                                    placeholder='Teacher remark...'
                                                                    aria-label={`Remarks for ${student.name}`}
                                                                    className='w-full rounded-lg border border-slate-200 px-2 py-1 text-xs text-slate-700 focus:outline-none focus:border-indigo-500 disabled:bg-slate-100'
                                                                />
                                                            </td>
                                                        </tr>
                                                    )
                                                })
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Action Bar */}
                            <div className='bg-white rounded-2xl border border-slate-200 shadow-xs p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
                                <div className='flex items-center gap-2'>
                                    <button
                                        type='button'
                                        disabled
                                        title='Secure spreadsheet import is not connected'
                                        className='flex items-center gap-x-2 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-400 opacity-65 cursor-not-allowed'
                                    >
                                        <Upload size={14} />
                                        Import unavailable
                                    </button>
                                    <button
                                        type='button'
                                        disabled
                                        title='Assessment export service is not connected'
                                        className='flex items-center gap-x-2 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-400 opacity-65 cursor-not-allowed'
                                    >
                                        <Download size={14} />
                                        Export unavailable
                                    </button>
                                </div>
                                <div className='text-xs text-slate-500'>
                                    {submitMessage || saveMessage || 'Ensure all absent and entered marks are checked before submission.'}
                                </div>
                                <div className='flex items-center gap-3'>
                                    <button
                                        type='button'
                                        onClick={handleSaveDraft}
                                        disabled={isLocked}
                                        className='rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer disabled:opacity-50'
                                    >
                                        Save Draft
                                    </button>
                                    <button
                                        type='button'
                                        onClick={handleSubmitClick}
                                        disabled={isLocked}
                                        className='rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 transition cursor-pointer disabled:opacity-50'
                                    >
                                        Submit for Approval
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </>
            )}

            {/* TAB 2: MARKS APPROVAL, CLASS RANK LISTS & REPORT CARDS */}
            {activeTab === 'approvals' && (
                <div className='space-y-6'>
                    {/* Stats Overview */}
                    <div className='grid grid-cols-1 sm:grid-cols-3 gap-4'>
                        <div className='bg-white p-4 rounded-2xl border border-slate-200 shadow-xs'>
                            <span className='text-[11px] font-semibold text-slate-400 uppercase tracking-wider'>Total Evaluation Sessions</span>
                            <p className='text-2xl font-bold text-slate-900 mt-1'>{allSessions.length}</p>
                            <p className='text-xs text-slate-500'>Class examinations & CA assessments</p>
                        </div>
                        <div className='bg-white p-4 rounded-2xl border border-slate-200 shadow-xs'>
                            <span className='text-[11px] font-semibold text-slate-400 uppercase tracking-wider'>Pending Approval</span>
                            <p className='text-2xl font-bold text-amber-600 mt-1'>
                                {allSessions.filter((s) => s.approvalStatus === 'Pending').length}
                            </p>
                            <p className='text-xs text-slate-500'>Awaiting Principal / Director sign-off</p>
                        </div>
                        <div className='bg-white p-4 rounded-2xl border border-slate-200 shadow-xs'>
                            <span className='text-[11px] font-semibold text-slate-400 uppercase tracking-wider'>Approved & Published</span>
                            <p className='text-2xl font-bold text-emerald-600 mt-1'>
                                {allSessions.filter((s) => s.approvalStatus === 'Approved').length}
                            </p>
                            <p className='text-xs text-slate-500'>Results live in portal with Rank Lists</p>
                        </div>
                    </div>

                    {/* Filter Bar */}
                    <div className='bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4'>
                        <div className='flex flex-wrap items-center gap-3 flex-1'>
                            <div className='relative flex-1 min-w-[200px] max-w-sm'>
                                <Search size={14} className='absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400' />
                                <input
                                    type='text'
                                    placeholder='Search by class, subject, or exam...'
                                    value={approvalSearch}
                                    onChange={(e) => setApprovalSearch(e.target.value)}
                                    className='w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500'
                                />
                            </div>

                            <select
                                value={approvalStatusFilter}
                                onChange={(e) => setApprovalStatusFilter(e.target.value)}
                                className='rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-indigo-500'
                            >
                                <option value='All'>All Statuses</option>
                                <option value='Pending'>Pending Approval</option>
                                <option value='Approved'>Approved & Published</option>
                                <option value='Rejected'>Rejected</option>
                            </select>
                        </div>

                        <div className='text-xs text-slate-500'>
                            Showing <strong>{filteredApprovalSessions.length}</strong> evaluation sessions
                        </div>
                    </div>

                    {/* Sessions Table */}
                    <div className='bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden'>
                        <div className='overflow-x-auto'>
                            <table className='w-full text-left text-xs'>
                                <thead>
                                    <tr className='border-b border-slate-200/80 bg-slate-50 text-slate-700 font-semibold uppercase tracking-wider text-[11px]'>
                                        <th className='py-3.5 px-4'>Assessment / Exam</th>
                                        <th className='py-3.5 px-4'>Class & Section</th>
                                        <th className='py-3.5 px-4'>Subject</th>
                                        <th className='py-3.5 px-4'>Term & Year</th>
                                        <th className='py-3.5 px-4'>Status</th>
                                        <th className='py-3.5 px-4 text-right'>Workflow Actions</th>
                                    </tr>
                                </thead>
                                <tbody className='divide-y divide-slate-100'>
                                    {filteredApprovalSessions.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className='py-8 text-center text-slate-400'>
                                                No evaluation sessions found. Enter and submit marks from the Mark Entry tab.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredApprovalSessions.map((s) => {
                                            const isApproved = s.approvalStatus === 'Approved'
                                            const isPending = s.approvalStatus === 'Pending'
                                            return (
                                                <tr key={s.contextKey} className='hover:bg-slate-50/70 transition-colors'>
                                                    <td className='py-3.5 px-4 font-bold text-slate-900'>{s.exam}</td>
                                                    <td className='py-3.5 px-4 font-semibold text-slate-700'>
                                                        {formatClassLabel(s.className)} - Sec {s.section}
                                                    </td>
                                                    <td className='py-3.5 px-4 font-bold text-indigo-700'>{s.subject}</td>
                                                    <td className='py-3.5 px-4 text-slate-500'>{s.term} ({s.academicYear})</td>
                                                    <td className='py-3.5 px-4'>
                                                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                                                            isApproved
                                                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                                : isPending
                                                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                                                : 'bg-red-50 text-red-700 border border-red-200'
                                                        }`}>
                                                            {isApproved ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                                                            {isApproved ? 'Approved & Published' : isPending ? 'Pending Approval' : 'Rejected'}
                                                        </span>
                                                    </td>
                                                    <td className='py-3.5 px-4 text-right'>
                                                        <div className='inline-flex items-center gap-2 justify-end'>
                                                            {isPending && (
                                                                <>
                                                                    <button
                                                                        type='button'
                                                                        onClick={() => handleApproveSession(s)}
                                                                        className='rounded-lg bg-emerald-600 px-3 py-1 text-[11px] font-bold text-white hover:bg-emerald-700 transition cursor-pointer shadow-2xs'
                                                                    >
                                                                        Approve & Publish
                                                                    </button>
                                                                    <button
                                                                        type='button'
                                                                        onClick={() => handleRejectSession(s)}
                                                                        className='rounded-lg border border-red-200 bg-red-50 px-2.5 py-1 text-[11px] font-semibold text-red-700 hover:bg-red-100 transition cursor-pointer'
                                                                    >
                                                                        Reject
                                                                    </button>
                                                                </>
                                                            )}

                                                            <button
                                                                type='button'
                                                                onClick={() => setSelectedSessionForRankList(s)}
                                                                className='rounded-lg border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-bold text-slate-700 hover:bg-slate-100 transition cursor-pointer'
                                                            >
                                                                <Trophy size={12} className='inline mr-1 text-amber-500' />
                                                                Rank List & Cards
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* CLASS RANK LIST & REPORT CARDS DRAWER / VIEW */}
                    {selectedSessionForRankList && (
                        <div className='bg-white rounded-2xl border-2 border-indigo-200 shadow-md p-6 space-y-4'>
                            <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3'>
                                <div>
                                    <div className='flex items-center gap-2'>
                                        <Trophy size={20} className='text-amber-500' />
                                        <h3 className='text-base font-bold text-slate-900'>
                                            Class Rank List & Merit Roster: {selectedSessionForRankList.exam}
                                        </h3>
                                        <span className='rounded-full bg-emerald-50 text-emerald-700 px-2.5 py-0.5 text-xs font-bold border border-emerald-200'>
                                            {selectedSessionForRankList.approvalStatus === 'Approved' ? '✓ Officially Published' : 'Preliminary Roster'}
                                        </span>
                                    </div>
                                    <p className='text-xs text-slate-500 mt-0.5'>
                                        Class: <strong>{formatClassLabel(selectedSessionForRankList.className)} - Section {selectedSessionForRankList.section}</strong> · Subject: <strong>{selectedSessionForRankList.subject}</strong> · Max Marks: <strong>{selectedSessionForRankList.maxMarks}</strong>
                                    </p>
                                </div>

                                <div className='flex items-center gap-2'>
                                    <button
                                        type='button'
                                        onClick={() => toast.success('Downloaded Class Merit Rank List (PDF)')}
                                        className='inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer'
                                    >
                                        <Download size={13} />
                                        <span>Export PDF</span>
                                    </button>
                                    <button
                                        type='button'
                                        onClick={() => toast.success('Exported Class Merit Rank List (Excel)')}
                                        className='inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer'
                                    >
                                        <Download size={13} />
                                        <span>Export Excel</span>
                                    </button>
                                    <button
                                        type='button'
                                        onClick={() => setSelectedSessionForRankList(null)}
                                        className='p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 cursor-pointer'
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                            </div>

                            {/* Rank List Table */}
                            <div className='overflow-x-auto'>
                                <table className='w-full text-left text-xs'>
                                    <thead>
                                        <tr className='border-b border-slate-200/80 bg-indigo-50/50 text-indigo-900 font-semibold uppercase tracking-wider text-[11px]'>
                                            <th className='py-3 px-4'>Class Rank</th>
                                            <th className='py-3 px-4'>Roll #</th>
                                            <th className='py-3 px-4'>Student Name</th>
                                            <th className='py-3 px-4'>Score ({selectedSessionForRankList.maxMarks})</th>
                                            <th className='py-3 px-4'>Percentage</th>
                                            <th className='py-3 px-4'>Grade</th>
                                            <th className='py-3 px-4'>Result</th>
                                            <th className='py-3 px-4 text-right'>Progress Report Card</th>
                                        </tr>
                                    </thead>
                                    <tbody className='divide-y divide-slate-100'>
                                        {computeClassRankList(selectedSessionForRankList).map((studentRank) => {
                                            const isRank1 = studentRank.classRank === 'Rank 1'
                                            const isRank2 = studentRank.classRank === 'Rank 2'
                                            const isRank3 = studentRank.classRank === 'Rank 3'
                                            return (
                                                <tr
                                                    key={studentRank.studentId}
                                                    className={`hover:bg-slate-50/70 transition-colors ${
                                                        isRank1 ? 'bg-amber-50/30' : ''
                                                    }`}
                                                >
                                                    <td className='py-3 px-4'>
                                                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                                            isRank1
                                                                ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                                                : isRank2
                                                                ? 'bg-slate-200 text-slate-800'
                                                                : isRank3
                                                                ? 'bg-orange-100 text-orange-800'
                                                                : 'bg-slate-50 text-slate-600'
                                                        }`}>
                                                            {(isRank1 || isRank2 || isRank3) && <Trophy size={11} />}
                                                            {studentRank.classRank}
                                                        </span>
                                                    </td>
                                                    <td className='py-3 px-4 font-mono font-bold text-slate-600'>{studentRank.rollNumber}</td>
                                                    <td className='py-3 px-4 font-bold text-slate-900'>{studentRank.name}</td>
                                                    <td className='py-3 px-4 font-bold text-indigo-700'>
                                                        {studentRank.obtainedMarks} <span className='text-[10px] text-slate-400 font-normal'>/ {studentRank.maxMarks}</span>
                                                    </td>
                                                    <td className='py-3 px-4 font-semibold text-slate-800'>{studentRank.displayPercent}</td>
                                                    <td className='py-3 px-4 font-bold text-indigo-600'>{studentRank.grade}</td>
                                                    <td className='py-3 px-4'>
                                                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                                            resultBadgeColor[studentRank.result] || 'bg-slate-100 text-slate-700'
                                                        }`}>
                                                            {studentRank.result}
                                                        </span>
                                                    </td>
                                                    <td className='py-3 px-4 text-right'>
                                                        <button
                                                            type='button'
                                                            onClick={() => navigate(`${basePath}/student-evaluation/report-cards`)}
                                                            className='inline-flex items-center gap-1 rounded-lg bg-indigo-50 px-2.5 py-1 text-[11px] font-semibold text-indigo-700 hover:bg-indigo-100 transition cursor-pointer'
                                                        >
                                                            <FileText size={12} />
                                                            <span>View Report Card</span>
                                                        </button>
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            )}

            <IncompleteMarksModal open={incompleteModal} onClose={() => setIncompleteModal(false)} stats={stats} />
            <SubmitMarksConfirmModal
                open={submitModal}
                onClose={() => setSubmitModal(false)}
                onConfirm={handleConfirmSubmit}
                stats={stats}
                examLabel={`${exam} — ${formatClassLabel(className)} Section ${section} — ${subject}`}
            />
        </section>
    )
}

export default MarkEntryPage
