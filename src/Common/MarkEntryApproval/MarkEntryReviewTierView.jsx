import React, { useMemo, useState } from 'react'
import {
    ArrowLeft,
    Award,
    CheckCircle2,
    FileText,
    Trophy,
    Users,
    XCircle,
} from 'lucide-react'
import { Navigate, useNavigate, useParams, NavLink } from 'react-router-dom'
import ApprovalHistoryTimeline from '../approvals/ApprovalHistoryTimeline'
import { ConfirmAction, IntegrationNotice, PageHeader, StatusBadge } from '../ui'
import { useAuth } from '../../context/AuthContext'
import {
    advanceMarkEntryTier,
    computeClassRankList,
    decodeContextKey,
    formatClassLabel,
    getEntryWithComputed,
    getMarkApprovalHistory,
    getMarkEntryStats,
    getMarkSessionByKey,
    getSessionDisplayLabel,
    resultBadgeColor,
} from './markEntryApprovalData'

const MarkEntryReviewTierView = ({
    role = 'Coordinator',
    listBasePath = '/coordinator/student-evaluation/mark-entry-approval',
    reportCardPath = '/coordinator/student-evaluation/report-cards',
}) => {
    const { contextKey: encodedKey } = useParams()
    const navigate = useNavigate()
    const { name, email } = useAuth()
    const contextKey = decodeContextKey(encodedKey)
    const session = getMarkSessionByKey(contextKey)
    const [viewTab, setViewTab] = useState('marks') // 'marks' | 'ranks'
    const [decisionType, setDecisionType] = useState('')
    const [decisionRemarks, setDecisionRemarks] = useState('')

    const stats = useMemo(() => {
        if (!session) return null
        return getMarkEntryStats(session.students, session.entries, session.maxMarks)
    }, [session])

    const rankList = useMemo(() => {
        if (!session) return []
        return computeClassRankList(session)
    }, [session])

    if (!session || session.status !== 'submitted') {
        return <Navigate to={listBasePath} replace />
    }

    const isCoordinator = role === 'Coordinator'
    const isPrincipal = role === 'Principal'

    // Determine if this role can act on the current submission
    const canAct = isCoordinator
        ? session.approvalStatus === 'Pending'
        : session.approvalStatus === 'Coordinator Reviewed' || session.approvalStatus === 'Pending'

    const forwardActionLabel = isCoordinator
        ? 'Verify & Forward to Principal'
        : 'Approve & Transmit to Director / DA'

    const closeDecision = () => {
        setDecisionType('')
        setDecisionRemarks('')
    }

    const confirmDecision = () => {
        if (decisionType === 'reject' && !decisionRemarks.trim()) return

        const decision = decisionType === 'approve' ? 'Approved' : 'Rejected'
        advanceMarkEntryTier({
            contextKey,
            decision,
            actor: name || email || role,
            actorRole: role,
            remarks: decisionRemarks.trim(),
        })

        const feedbackMsg = decision === 'Approved'
            ? `${getSessionDisplayLabel(session)} successfully ${isCoordinator ? 'verified and forwarded to Principal' : 'approved and transmitted to Director'}.`
            : `${getSessionDisplayLabel(session)} returned to teacher with revision rationale.`

        navigate(listBasePath, {
            state: { feedback: feedbackMsg },
        })
    }

    return (
        <section className='space-y-6 pb-12 font-inter'>
            <PageHeader
                title={isCoordinator ? 'Verify Mark Entry (Tier 2)' : 'Approve Mark Entry (Tier 3)'}
                description={
                    isCoordinator
                        ? 'Validate teacher submissions and check calculations before transmitting to the Principal.'
                        : 'Review verified submissions and authorize transmission to the Director for official publication.'
                }
                context={`${getSessionDisplayLabel(session)} · Submitted by ${session.submittedByRole ?? 'Teacher'}`}
                status={session.approvalStatus}
                actions={(
                    <NavLink
                        to={reportCardPath}
                        className='inline-flex min-h-10 items-center gap-2 rounded-lg border border-blue-600 bg-blue-50 px-4 text-sm font-semibold text-blue-700 hover:bg-blue-100 transition-colors'
                    >
                        <FileText size={16} /> Progress Report Cards
                    </NavLink>
                )}
            />

            <IntegrationNotice
                state='demo'
                title='3-Tier Academic Assessment Governance'
                description='Teacher (Enter) → Coordinator (Verify) → Principal (Approve) → Director/DA (Publish). Student progress report cards and class rank lists synchronize upon final approval.'
            />

            {/* Assessment Session Metadata */}
            <div className='bg-white rounded-2xl shadow-sm border border-slate-200 p-5'>
                <div className='rounded-xl border border-[#EEF0F6] bg-[#FAFBFD] p-4'>
                    <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-3 text-sm'>
                        <p><span className='text-slate-400'>Academic Year:</span> <strong className='text-slate-800 ml-1'>{session.academicYear}</strong></p>
                        <p><span className='text-slate-400'>Term:</span> <strong className='text-slate-800 ml-1'>{session.term}</strong></p>
                        <p><span className='text-slate-400'>Exam Date:</span> <strong className='text-slate-800 ml-1'>{session.examDate || '2026-10-15'}</strong></p>
                        <p><span className='text-slate-400'>Class & Section:</span> <strong className='text-slate-800 ml-1'>{formatClassLabel(session.className)} Section {session.section}</strong></p>
                        <p><span className='text-slate-400'>Maximum Marks:</span> <strong className='text-slate-800 ml-1'>{session.maxMarks}</strong></p>
                        <p className='flex items-center gap-2'><span className='text-slate-400'>Approval Stage:</span> <StatusBadge status={session.approvalStatus} /></p>
                    </div>
                </div>

                {stats ? (
                    <div className='grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-5'>
                        {[
                            { label: 'Total Students', value: stats.totalStudents },
                            { label: 'Marks Entered', value: stats.marksEntered },
                            { label: 'Pending', value: stats.pending },
                            { label: 'Absent', value: stats.absent },
                            { label: 'Average Score', value: stats.averageMark },
                            { label: 'Highest Mark', value: stats.highestMark },
                        ].map((item) => (
                            <div key={item.label} className='rounded-xl border border-slate-100 bg-slate-50/60 p-3 text-center'>
                                <span className='text-[11px] font-semibold uppercase text-slate-400'>{item.label}</span>
                                <p className='text-xl font-bold text-slate-900 mt-1'>{item.value}</p>
                            </div>
                        ))}
                    </div>
                ) : null}

                {session.rejectionReason ? (
                    <div className='mt-4 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800'>
                        <strong className='font-bold'>Prior Revision Rationale:</strong> {session.rejectionReason}
                    </div>
                ) : null}
            </div>

            {/* Audit Trail Timeline */}
            <ApprovalHistoryTimeline history={getMarkApprovalHistory(session)} />

            {/* Student Marks & Class Rank View Tabs */}
            <div className='bg-white rounded-2xl shadow-sm border border-slate-200 p-5 space-y-4'>
                <div className='flex items-center justify-between border-b border-slate-100 pb-3'>
                    <div className='flex items-center gap-3'>
                        <button
                            type='button'
                            onClick={() => setViewTab('marks')}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                                viewTab === 'marks'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                        >
                            <Users size={14} /> Student Marks Breakdown ({session.students.length})
                        </button>
                        <button
                            type='button'
                            onClick={() => setViewTab('ranks')}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                                viewTab === 'ranks'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                        >
                            <Trophy size={14} /> Class Rank List
                        </button>
                    </div>

                    <span className='text-xs text-slate-400'>
                        Subject: <strong>{session.subject}</strong> · Pass Marks: 33%
                    </span>
                </div>

                {viewTab === 'marks' ? (
                    <div className='relative overflow-x-auto'>
                        <table className='w-full text-sm text-left'>
                            <thead className='text-xs bg-slate-100 uppercase text-slate-700 whitespace-nowrap'>
                                <tr>
                                    <th className='px-3 py-3 rounded-s-lg'>Roll No.</th>
                                    <th className='px-3 py-3'>Student Name</th>
                                    <th className='px-3 py-3'>Obtained Marks</th>
                                    <th className='px-3 py-3'>Max Marks</th>
                                    <th className='px-3 py-3'>Grade</th>
                                    <th className='px-3 py-3'>Percentage</th>
                                    <th className='px-3 py-3'>Result</th>
                                    <th className='px-3 py-3 rounded-e-lg'>Teacher Remarks</th>
                                </tr>
                            </thead>
                            <tbody>
                                {session.students.map((student, index) => {
                                    const entry = getEntryWithComputed(
                                        session.entries[student.id] ?? { obtainedMarks: null, absent: false, remarks: '' },
                                        session.maxMarks,
                                    )
                                    const rollDisplay = String(student.rollNumber).replace(/^.*-(\d+)$/, '$1').slice(-2)
                                        || String(index + 1).padStart(2, '0')

                                    return (
                                        <tr key={student.id} className='border-b border-slate-100 text-slate-700 hover:bg-slate-50/50'>
                                            <td className='px-3 py-3 font-semibold text-slate-900'>{rollDisplay}</td>
                                            <td className='px-3 py-3 font-medium text-slate-900'>{student.name}</td>
                                            <td className='px-3 py-3 font-bold text-blue-700'>
                                                {entry.absent ? <span className='text-amber-600'>Absent</span> : (entry.obtainedMarks ?? '—')}
                                            </td>
                                            <td className='px-3 py-3 text-slate-500'>{session.maxMarks}</td>
                                            <td className='px-3 py-3 font-semibold'>{entry.grade}</td>
                                            <td className='px-3 py-3'>{entry.displayPercent}</td>
                                            <td className='px-3 py-3'>
                                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${resultBadgeColor[entry.result] ?? resultBadgeColor['—']}`}>
                                                    {entry.result}
                                                </span>
                                            </td>
                                            <td className='px-3 py-3 text-slate-500 text-xs'>{entry.remarks || '—'}</td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className='relative overflow-x-auto'>
                        <table className='w-full text-sm text-left'>
                            <thead className='text-xs bg-slate-100 uppercase text-slate-700 whitespace-nowrap'>
                                <tr>
                                    <th className='px-3 py-3 rounded-s-lg'>Class Standing</th>
                                    <th className='px-3 py-3'>Roll No.</th>
                                    <th className='px-3 py-3'>Student Name</th>
                                    <th className='px-3 py-3'>Score Obtained</th>
                                    <th className='px-3 py-3'>Percentage</th>
                                    <th className='px-3 py-3'>Grade</th>
                                    <th className='px-3 py-3 rounded-e-lg'>Result</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rankList.map((item) => (
                                    <tr key={item.studentId} className='border-b border-slate-100 text-slate-700 hover:bg-slate-50/50'>
                                        <td className='px-3 py-3 font-bold text-indigo-700 flex items-center gap-1.5'>
                                            {item.classRank.includes('Rank 1') && <Trophy size={14} className='text-amber-500' />}
                                            {item.classRank}
                                        </td>
                                        <td className='px-3 py-3 font-semibold text-slate-800'>{item.rollNumber}</td>
                                        <td className='px-3 py-3 font-medium text-slate-900'>{item.name}</td>
                                        <td className='px-3 py-3 font-bold text-slate-800'>
                                            {item.obtainedMarks} / {item.maxMarks}
                                        </td>
                                        <td className='px-3 py-3 font-semibold text-slate-700'>{item.displayPercent}</td>
                                        <td className='px-3 py-3 font-bold text-blue-600'>{item.grade}</td>
                                        <td className='px-3 py-3'>
                                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${resultBadgeColor[item.result] ?? resultBadgeColor['—']}`}>
                                                {item.result}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Action Bar */}
            {canAct ? (
                <div className='sticky bottom-3 z-10 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-lg backdrop-blur'>
                    <NavLink
                        to={listBasePath}
                        className='inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50'
                    >
                        <ArrowLeft size={16} /> Back to Queue
                    </NavLink>

                    <div className='flex items-center gap-3'>
                        <button
                            type='button'
                            onClick={() => setDecisionType('reject')}
                            className='min-h-10 rounded-lg border border-rose-300 bg-rose-50 px-4 text-sm font-semibold text-rose-700 hover:bg-rose-100 transition-colors'
                        >
                            Return for Revision
                        </button>
                        <button
                            type='button'
                            onClick={() => setDecisionType('approve')}
                            className='inline-flex items-center gap-1.5 min-h-10 rounded-lg bg-blue-600 px-5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors shadow-sm'
                        >
                            <CheckCircle2 size={16} /> {forwardActionLabel}
                        </button>
                    </div>
                </div>
            ) : (
                <div className='flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200'>
                    <div className='flex items-center gap-2'>
                        <span className='text-xs text-slate-500'>Current Status:</span>
                        <StatusBadge status={session.approvalStatus} />
                    </div>
                    <NavLink
                        to={listBasePath}
                        className='inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-700 hover:bg-slate-50'
                    >
                        <ArrowLeft size={16} /> Back to Queue
                    </NavLink>
                </div>
            )}

            {/* Confirm Decision Modal */}
            <ConfirmAction
                open={Boolean(decisionType)}
                onClose={closeDecision}
                onConfirm={confirmDecision}
                title={
                    decisionType === 'approve'
                        ? `${forwardActionLabel}?`
                        : 'Return mark entry for revision?'
                }
                description={
                    decisionType === 'approve'
                        ? `The marks will advance to ${isCoordinator ? 'Principal Review (Tier 3)' : 'Director Approval (Final Publish)'}.`
                        : 'The submission returns to the teacher with your required revision rationale.'
                }
                confirmLabel={decisionType === 'approve' ? 'Confirm & Advance' : 'Confirm Return'}
                tone={decisionType === 'reject' ? 'danger' : 'primary'}
                confirmDisabled={decisionType === 'reject' && !decisionRemarks.trim()}
            >
                <label htmlFor='decision-remarks' className='block font-semibold text-slate-900 text-sm'>
                    {decisionType === 'reject' ? 'Revision Rationale (Required)' : 'Verification / Approval Remarks (Optional)'}
                </label>
                <textarea
                    id='decision-remarks'
                    value={decisionRemarks}
                    onChange={(event) => setDecisionRemarks(event.target.value)}
                    rows={3}
                    required={decisionType === 'reject'}
                    placeholder={decisionType === 'reject' ? 'Explain what needs correction before resubmission…' : 'Add approval remarks…'}
                    className='mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none'
                />
                {decisionType === 'reject' && !decisionRemarks.trim() && (
                    <p className='mt-1 text-xs text-rose-600'>A rationale is required before returning submissions.</p>
                )}
            </ConfirmAction>
        </section>
    )
}

export default MarkEntryReviewTierView
