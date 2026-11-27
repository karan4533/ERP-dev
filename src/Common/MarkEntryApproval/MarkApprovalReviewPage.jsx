import React, { useEffect, useMemo, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import { useAuth } from '../../context/AuthContext'
import ApprovalHistory from '../Approvals/ApprovalHistory.jsx'
import { approverLabel, stepAction } from '../Approvals/approvalStep'
import {
    canUseExamsApi,
    decodeContextKey,
    formatClassLabel,
    getEntryWithComputed,
    getMarkApprovalSessionFromApi,
    getMarkEntryStats,
    getMarkSessionByKey,
    getSessionDisplayLabel,
    resolveMarkSessionApproval,
    resultBadgeColor,
} from './markEntryApprovalData'

const decisionMessage = (approval, decided) => {
    if (decided === 'Rejected') return 'Marks rejected and returned to the teacher.'
    if (approval?.status === 'approved') return 'Marks approved and published to students and parents.'
    if (approval?.awaitingRole) return `Approved. Sent to the ${approverLabel(approval.awaitingRole)} for the next step.`
    return 'Decision saved.'
}

/** Review one submitted marks batch as Coordinator, Principal or Director. */
const MarkApprovalReviewPage = ({ basePath, role }) => {
    const { contextKey: encodedKey } = useParams()
    const navigate = useNavigate()
    const { email } = useAuth()
    const contextKey = decodeContextKey(encodedKey)
    const api = canUseExamsApi()
    const [loaded, setLoaded] = useState({ key: null, session: null })
    const [busy, setBusy] = useState(false)
    const [rejectionReason, setRejectionReason] = useState('')
    const [showRejectForm, setShowRejectForm] = useState(false)
    const [error, setError] = useState('')

    useEffect(() => {
        if (!api) return undefined
        let cancelled = false
        getMarkApprovalSessionFromApi(contextKey)
            .then((row) => {
                if (!cancelled) setLoaded({ key: contextKey, session: row || null })
            })
            .catch(() => {
                if (!cancelled) setLoaded({ key: contextKey, session: null })
            })
        return () => {
            cancelled = true
        }
    }, [api, contextKey])

    const loading = api && loaded.key !== contextKey
    const session = api ? loaded.session : getMarkSessionByKey(contextKey)
    const missing = !loading && (!session || session.status !== 'submitted')

    const stats = useMemo(() => {
        if (!session) return null
        return getMarkEntryStats(session.students, session.entries, session.maxMarks)
    }, [session])

    if (loading) return <p className='text-[#667085]'>Loading mark entry…</p>
    if (missing || !session) {
        return <Navigate to={basePath} replace />
    }

    const action = api ? stepAction(session, role, email) : { canAct: session.approvalStatus === 'Pending', note: '' }
    const isFinalStep = role === 'director'

    const handleDecide = async (approvalStatus) => {
        if (approvalStatus === 'Rejected' && !rejectionReason.trim()) {
            setError('A rejection reason is required.')
            return
        }
        setBusy(true)
        setError('')
        try {
            const result = await resolveMarkSessionApproval(session, approvalStatus, rejectionReason.trim())
            if (!result.success) {
                setError(result.message || 'Decision failed.')
                toast.error(result.message || 'Decision failed.')
                return
            }
            toast.success(decisionMessage(result.approval, approvalStatus))
            navigate(basePath)
        } catch (err) {
            const message = err?.message || 'Decision failed.'
            setError(message)
            toast.error(message)
        } finally {
            setBusy(false)
        }
    }

    return (
        <section className='space-y-6'>
            <div>
                <h1 className='text-2xl font-semibold text-black'>Review Mark Entry</h1>
                <p className='text-sm text-[#667085] mt-1'>
                    {getSessionDisplayLabel(session)} — submitted by {session.submittedByRole ?? 'Staff'}
                    {session.version > 1 ? ` (version ${session.version})` : ''}
                </p>
            </div>

            <div className='bg-white rounded-2xl shadow-md p-4'>
                <div className='rounded-xl border border-[#EEF0F6] bg-[#FAFBFD] p-4'>
                    <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-3 text-sm'>
                        <p><span className='text-[#808080]'>Academic Year :</span> <span className='text-[#1E1E1E]'>{session.academicYear}</span></p>
                        <p><span className='text-[#808080]'>Class :</span> <span className='text-[#1E1E1E]'>{formatClassLabel(session.className)} Section {session.section || '—'}</span></p>
                        <p><span className='text-[#808080]'>Subject :</span> <span className='text-[#1E1E1E]'>{session.subject}</span></p>
                        <p><span className='text-[#808080]'>Maximum Marks :</span> <span className='text-[#1E1E1E]'>{session.maxMarks}</span></p>
                        <p><span className='text-[#808080]'>Approval Status :</span> <span className='text-[#1E1E1E]'>{session.approvalStatus}</span></p>
                        <p>
                            <span className='text-[#808080]'>Current Step :</span>{' '}
                            <span className='text-[#1E1E1E]'>{session.approvalStatus === 'Pending' ? approverLabel(session.awaitingRole) || '—' : '—'}</span>
                        </p>
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

            <div className='bg-white rounded-2xl shadow-md p-4'>
                <h2 className='text-xl font-semibold text-black mb-4'>Student Marks</h2>
                <div className='relative overflow-x-auto'>
                    <table className='w-full text-sm text-left'>
                        <thead className='text-xs bg-[#EDEEF5] whitespace-nowrap rounded-lg'>
                            <tr>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase rounded-s-lg'>S.No</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Student Name</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Admission No.</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Obtained</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Grade</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Percentage</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Result</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase rounded-e-lg'>Remarks</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(session.students || []).map((student, index) => {
                                const entry = getEntryWithComputed(
                                    session.entries[student.id] ?? { obtainedMarks: null, absent: false, remarks: '' },
                                    session.maxMarks,
                                )
                                return (
                                    <tr key={student.id} className='border-b text-[#667085] border-[#f2f4f7]'>
                                        <td className='px-2 py-3 rounded-s-lg'>{index + 1}</td>
                                        <td className='px-2 py-3 font-medium text-[#1E1E1E]'>{student.name}</td>
                                        <td className='px-2 py-3'>{student.admissionNumber || '—'}</td>
                                        <td className='px-2 py-3'>{entry.absent ? 'Absent' : (entry.obtainedMarks ?? '—')}</td>
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
            </div>

            {api ? (
                <div className='bg-white rounded-2xl shadow-md p-4'>
                    <h2 className='text-xl font-semibold text-black mb-4'>Approval History</h2>
                    <ApprovalHistory approvalId={session.approvalId} />
                </div>
            ) : null}

            {error ? (
                <div className='rounded-xl border border-[#F5D7DA] bg-[#FDF3F4] px-4 py-3 text-sm text-[#980E0F]' role='alert'>{error}</div>
            ) : null}

            {action.canAct ? (
                <div className='bg-white rounded-2xl shadow-md p-4'>
                    {showRejectForm ? (
                        <div className='space-y-4'>
                            <label htmlFor='rejection-reason' className='text-base font-medium text-[#1E1E1E]'>
                                Rejection Reason
                            </label>
                            <textarea
                                id='rejection-reason'
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                                rows={3}
                                placeholder='Explain what the teacher must correct...'
                                className='w-full text-sm border border-[#D9D9D9] rounded-md px-3 py-2'
                            />
                            <div className='flex flex-wrap gap-3 justify-end'>
                                <button type='button' onClick={() => setShowRejectForm(false)} disabled={busy} className='bg-white text-[#515DEF] text-sm px-6 py-2.5 rounded-md border border-[#515DEF] hover:bg-[#515DEF0D] cursor-pointer'>
                                    Cancel
                                </button>
                                <button type='button' onClick={() => handleDecide('Rejected')} disabled={busy || !rejectionReason.trim()} className='bg-[#FF0000] text-white text-sm px-6 py-2.5 rounded-md border border-[#FF0000] hover:opacity-90 cursor-pointer disabled:opacity-50'>
                                    Confirm Reject
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className='flex flex-wrap gap-3 justify-end'>
                            <button type='button' onClick={() => navigate(basePath)} className='bg-white text-[#515DEF] text-sm px-6 py-2.5 rounded-md border border-[#515DEF] hover:bg-[#515DEF0D] cursor-pointer'>
                                Back to List
                            </button>
                            <button type='button' onClick={() => setShowRejectForm(true)} disabled={busy} className='bg-white text-[#FF0000] text-sm px-6 py-2.5 rounded-md border border-[#FF0000] hover:bg-[#FF00000D] cursor-pointer'>
                                Reject
                            </button>
                            <button type='button' onClick={() => handleDecide('Approved')} disabled={busy} className='bg-[#4CAF50] text-white text-sm px-6 py-2.5 rounded-md border border-[#4CAF50] hover:opacity-90 cursor-pointer disabled:opacity-50'>
                                {busy ? 'Saving…' : isFinalStep ? 'Approve & Publish' : 'Approve'}
                            </button>
                        </div>
                    )}
                </div>
            ) : (
                <div className='flex flex-wrap items-center justify-end gap-4'>
                    {action.note ? <p className='text-sm text-[#667085]'>{action.note}</p> : null}
                    <button type='button' onClick={() => navigate(basePath)} className='bg-[#515DEF] text-white text-sm px-6 py-2.5 rounded-md border border-[#515DEF] hover:opacity-90 cursor-pointer'>
                        Back to List
                    </button>
                </div>
            )}
        </section>
    )
}

export default MarkApprovalReviewPage
