import React, { useMemo, useState } from 'react'
import { FileText, Trophy, Users } from 'lucide-react'
import { Navigate, useNavigate, useParams, NavLink } from 'react-router-dom'
import ApprovalHistoryTimeline from '../../../Common/approvals/ApprovalHistoryTimeline'
import { ConfirmAction, IntegrationNotice, PageHeader, StatusBadge } from '../../../Common/ui'
import { useAuth } from '../../../context/AuthContext'
import {
    computeClassRankList,
    decodeContextKey,
    formatClassLabel,
    getEntryWithComputed,
    getMarkApprovalHistory,
    getMarkEntryStats,
    getMarkSessionByKey,
    getSessionDisplayLabel,
    resultBadgeColor,
    updateMarkSessionApproval,
} from '../../../Common/MarkEntryApproval/markEntryApprovalData'

const MarkEntryReview = () => {
    const { contextKey: encodedKey } = useParams()
    const navigate = useNavigate()
    const { name, email } = useAuth()
    const contextKey = decodeContextKey(encodedKey)
    const session = getMarkSessionByKey(contextKey)
    const [viewTab, setViewTab] = useState('marks')
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
        return <Navigate to='/director/mark-entry-approval' replace />
    }

    const canApproveReject = session.approvalStatus !== 'Approved' && session.approvalStatus !== 'Rejected'

    const closeDecision = () => {
        setDecisionType('')
        setDecisionRemarks('')
    }

    const confirmDecision = () => {
        if (decisionType === 'reject' && !decisionRemarks.trim()) return
        const status = decisionType === 'approve' ? 'Approved' : 'Rejected'
        updateMarkSessionApproval(contextKey, status, {
            actor: name || email || 'Director',
            actorRole: 'Director',
            remarks: decisionRemarks.trim(),
        })
        navigate('/director/mark-entry-approval', {
            state: { feedback: `${getSessionDisplayLabel(session)} ${status === 'Approved' ? 'approved and published' : 'returned for correction'}.` },
        })
    }

    return (
        <section className='space-y-6'>
            <PageHeader
                title='Review mark entry'
                description='Validate the submitted student results before they become visible in student and guardian portals.'
                context={`${getSessionDisplayLabel(session)} · submitted by ${session.submittedByRole ?? 'Staff'}`}
                status={session.approvalStatus}
                actions={(
                    <NavLink
                        to='/director/student-evaluation/report-cards'
                        className='inline-flex min-h-10 items-center gap-2 rounded-lg border border-blue-600 bg-blue-50 px-4 text-sm font-semibold text-blue-700 hover:bg-blue-100 transition-colors'
                    >
                        <FileText size={16} /> Progress Report Cards
                    </NavLink>
                )}
            />

            <IntegrationNotice
                state='demo'
                title='Browser-stored approval workflow'
                description='This demonstration records reviewer identity, decision time and remarks locally. The assessment API must enforce immutable server-side history and atomic publication.'
            />

            <div className='bg-white rounded-2xl shadow-md p-4'>
                <div className='rounded-xl border border-[#EEF0F6] bg-[#FAFBFD] p-4'>
                    <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-3 text-sm'>
                        <p><span className='text-[#808080]'>Academic Year :</span> <span className='text-[#1E1E1E]'>{session.academicYear}</span></p>
                        <p><span className='text-[#808080]'>Term :</span> <span className='text-[#1E1E1E]'>{session.term}</span></p>
                        <p><span className='text-[#808080]'>Exam Date :</span> <span className='text-[#1E1E1E]'>{session.examDate}</span></p>
                        <p><span className='text-[#808080]'>Class :</span> <span className='text-[#1E1E1E]'>{formatClassLabel(session.className)} Section {session.section}</span></p>
                        <p><span className='text-[#808080]'>Maximum Marks :</span> <span className='text-[#1E1E1E]'>{session.maxMarks}</span></p>
                        <p className='flex items-center gap-2'><span className='text-[#808080]'>Approval Status :</span> <StatusBadge status={session.approvalStatus} /></p>
                    </div>
                </div>

                {stats ? (
                    <div className='grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mt-6'>
                        {[
                            { label: 'Total Students', value: stats.totalStudents },
                            { label: 'Marks Entered', value: stats.marksEntered },
                            { label: 'Pending', value: stats.pending },
                            { label: 'Absent', value: stats.absent },
                            { label: 'Average Mark', value: stats.averageMark },
                            { label: 'Highest Mark', value: stats.highestMark },
                        ].map((item) => (
                            <div key={item.label} className='rounded-xl border border-[#EEF0F6] bg-[#FAFBFD] p-4 text-center'>
                                <span className='text-sm text-[#808080]'>{item.label}</span>
                                <p className='text-2xl font-semibold text-[#0C1E5B] mt-2'>{item.value}</p>
                            </div>
                        ))}
                    </div>
                ) : null}

                {session.rejectionReason ? (
                    <div className='mt-4 rounded-xl border border-[#F5D7DA] bg-[#FDF3F4] p-4 text-sm text-[#980E0F]'>
                        <strong>Rejection reason:</strong> {session.rejectionReason}
                    </div>
                ) : null}
            </div>

            <ApprovalHistoryTimeline history={getMarkApprovalHistory(session)} />

            <div className='bg-white rounded-2xl shadow-md p-4'>
                <div className='flex items-center justify-between border-b border-slate-100 pb-3 mb-4'>
                    <div className='flex items-center gap-2'>
                        <button
                            type='button'
                            onClick={() => setViewTab('marks')}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                                viewTab === 'marks' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                        >
                            <Users size={14} /> Student Marks Table ({session.students.length})
                        </button>
                        <button
                            type='button'
                            onClick={() => setViewTab('ranks')}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                                viewTab === 'ranks' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                        >
                            <Trophy size={14} /> Class Rank List
                        </button>
                    </div>
                    <span className='text-xs text-slate-400'>
                        Subject: <strong>{session.subject}</strong> · Maximum Marks: {session.maxMarks}
                    </span>
                </div>

                {viewTab === 'marks' ? (
                    <div className='relative overflow-x-auto'>
                        <table className='w-full text-sm text-left'>
                            <thead className='text-xs bg-[#EDEEF5] whitespace-nowrap rounded-lg'>
                                <tr>
                                    <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase rounded-s-lg'>Roll No.</th>
                                    <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Student Name</th>
                                    <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Obtained</th>
                                    <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Grade</th>
                                    <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Percentage</th>
                                    <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Result</th>
                                    <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase rounded-e-lg'>Remarks</th>
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
                                        <tr key={student.id} className='border-b text-[#667085] border-[#f2f4f7]'>
                                            <td className='px-2 py-3 rounded-s-lg'>{rollDisplay}</td>
                                            <td className='px-2 py-3 font-medium text-[#1E1E1E]'>{student.name}</td>
                                            <td className='px-2 py-3 font-bold text-blue-700'>{entry.absent ? 'Absent' : (entry.obtainedMarks ?? '—')}</td>
                                            <td className='px-2 py-3'>{entry.grade}</td>
                                            <td className='px-2 py-3'>{entry.displayPercent}</td>
                                            <td className='px-2 py-3'>
                                                <span className={`px-2 py-1 rounded-lg text-xs font-semibold whitespace-nowrap ${resultBadgeColor[entry.result] ?? resultBadgeColor['—']}`}>
                                                    {entry.result}
                                                </span>
                                            </td>
                                            <td className='px-2 py-3 rounded-e-lg'>{entry.remarks || '—'}</td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className='relative overflow-x-auto'>
                        <table className='w-full text-sm text-left'>
                            <thead className='text-xs bg-[#EDEEF5] whitespace-nowrap rounded-lg'>
                                <tr>
                                    <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase rounded-s-lg'>Class Rank</th>
                                    <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Roll No.</th>
                                    <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Student Name</th>
                                    <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Score Obtained</th>
                                    <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Percentage</th>
                                    <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Grade</th>
                                    <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase rounded-e-lg'>Result</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rankList.map((item) => (
                                    <tr key={item.studentId} className='border-b text-[#667085] border-[#f2f4f7]'>
                                        <td className='px-2 py-3 rounded-s-lg font-bold text-indigo-700 flex items-center gap-1.5'>
                                            {item.classRank.includes('Rank 1') && <Trophy size={14} className='text-amber-500' />}
                                            {item.classRank}
                                        </td>
                                        <td className='px-2 py-3 font-semibold text-slate-800'>{item.rollNumber}</td>
                                        <td className='px-2 py-3 font-medium text-[#1E1E1E]'>{item.name}</td>
                                        <td className='px-2 py-3 font-bold text-slate-800'>{item.obtainedMarks} / {item.maxMarks}</td>
                                        <td className='px-2 py-3 font-semibold text-slate-700'>{item.displayPercent}</td>
                                        <td className='px-2 py-3 font-bold text-blue-600'>{item.grade}</td>
                                        <td className='px-2 py-3 rounded-e-lg'>
                                            <span className={`px-2 py-1 rounded-lg text-xs font-semibold whitespace-nowrap ${resultBadgeColor[item.result] ?? resultBadgeColor['—']}`}>
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

            {canApproveReject ? (
                <div className='sticky bottom-3 z-10 flex flex-wrap justify-end gap-3 rounded-[var(--erp-radius-surface)] border border-[var(--erp-line)] bg-white/95 p-4 shadow-lg backdrop-blur'>
                    <button type='button' onClick={() => navigate('/director/mark-entry-approval')} className='min-h-10 rounded-lg border border-[var(--erp-line-strong)] bg-white px-4 text-sm font-semibold text-[var(--erp-ink)]'>Back to list</button>
                    <button type='button' onClick={() => setDecisionType('reject')} className='min-h-10 rounded-lg border border-[var(--erp-red)] bg-white px-4 text-sm font-semibold text-[var(--erp-red)]'>Reject</button>
                    <button type='button' onClick={() => setDecisionType('approve')} className='min-h-10 rounded-lg bg-[var(--erp-green)] px-4 text-sm font-semibold text-white'>Approve & publish</button>
                </div>
            ) : (
                <div className='flex justify-end'>
                    <button
                        type='button'
                        onClick={() => navigate('/director/mark-entry-approval')}
                        className='bg-[#515DEF] text-white text-sm px-6 py-2.5 rounded-md border border-[#515DEF] hover:opacity-90 cursor-pointer'
                    >
                        Back to List
                    </button>
                </div>
            )}

            <ConfirmAction
                open={Boolean(decisionType)}
                onClose={closeDecision}
                onConfirm={confirmDecision}
                title={decisionType === 'approve' ? 'Approve and publish results?' : 'Reject this mark entry?'}
                description={decisionType === 'approve' ? 'Approved marks become visible to students and guardians.' : 'The submission returns to its author for correction.'}
                confirmLabel={decisionType === 'approve' ? 'Approve & publish' : 'Confirm rejection'}
                tone={decisionType === 'reject' ? 'danger' : 'primary'}
                confirmDisabled={decisionType === 'reject' && !decisionRemarks.trim()}
            >
                <label htmlFor='decision-remarks' className='block font-semibold text-[var(--erp-ink)]'>
                    {decisionType === 'reject' ? 'Rejection rationale (required)' : 'Decision remarks (optional)'}
                </label>
                <textarea
                    id='decision-remarks'
                    value={decisionRemarks}
                    onChange={(event) => setDecisionRemarks(event.target.value)}
                    rows={3}
                    required={decisionType === 'reject'}
                    placeholder={decisionType === 'reject' ? 'Explain what must be corrected…' : 'Add a concise publication note…'}
                    className='mt-2 w-full rounded-lg border border-[var(--erp-line-strong)] px-3 py-2 text-sm text-[var(--erp-ink)]'
                />
                {decisionType === 'reject' && !decisionRemarks.trim() ? <p className='mt-1 text-xs text-[var(--erp-red)]'>A rationale is required before rejection.</p> : null}
            </ConfirmAction>
        </section>
    )
}

export default MarkEntryReview
