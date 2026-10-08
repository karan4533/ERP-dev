import React, { useMemo, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import {
    decodeContextKey,
    formatClassLabel,
    getEntryWithComputed,
    getMarkEntryStats,
    getMarkSessionByKey,
    getSessionDisplayLabel,
    resultBadgeColor,
    updateMarkSessionApproval,
} from '../../../Common/MarkEntryApproval/markEntryApprovalData'

const MarkEntryReview = () => {
    const { contextKey: encodedKey } = useParams()
    const navigate = useNavigate()
    const contextKey = decodeContextKey(encodedKey)
    const session = getMarkSessionByKey(contextKey)
    const [rejectionReason, setRejectionReason] = useState('')
    const [showRejectForm, setShowRejectForm] = useState(false)

    const stats = useMemo(() => {
        if (!session) return null
        return getMarkEntryStats(session.students, session.entries, session.maxMarks)
    }, [session])

    if (!session || session.status !== 'submitted') {
        return <Navigate to='/director/mark-entry-approval' replace />
    }

    const canApproveReject = session.approvalStatus === 'Pending'

    const handleApprove = () => {
        updateMarkSessionApproval(contextKey, 'Approved')
        navigate('/director/mark-entry-approval')
    }

    const handleReject = () => {
        if (!rejectionReason.trim()) return
        updateMarkSessionApproval(contextKey, 'Rejected', rejectionReason.trim())
        navigate('/director/mark-entry-approval')
    }

    return (
        <section className='space-y-6'>
            <div>
                <h1 className='text-2xl font-semibold text-black'>Review Mark Entry</h1>
                <p className='text-sm text-[#667085] mt-1'>
                    {getSessionDisplayLabel(session)} — submitted by {session.submittedByRole ?? 'Staff'}
                </p>
            </div>

            <div className='bg-white rounded-2xl shadow-md p-4'>
                <div className='rounded-xl border border-[#EEF0F6] bg-[#FAFBFD] p-4'>
                    <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-3 text-sm'>
                        <p><span className='text-[#808080]'>Academic Year :</span> <span className='text-[#1E1E1E]'>{session.academicYear}</span></p>
                        <p><span className='text-[#808080]'>Term :</span> <span className='text-[#1E1E1E]'>{session.term}</span></p>
                        <p><span className='text-[#808080]'>Exam Date :</span> <span className='text-[#1E1E1E]'>{session.examDate}</span></p>
                        <p><span className='text-[#808080]'>Class :</span> <span className='text-[#1E1E1E]'>{formatClassLabel(session.className)} Section {session.section}</span></p>
                        <p><span className='text-[#808080]'>Maximum Marks :</span> <span className='text-[#1E1E1E]'>{session.maxMarks}</span></p>
                        <p><span className='text-[#808080]'>Approval Status :</span> <span className='text-[#1E1E1E]'>{session.approvalStatus}</span></p>
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

            {canApproveReject ? (
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
                                placeholder='Explain why these marks are being rejected...'
                                className='w-full text-sm border border-[#D9D9D9] rounded-md px-3 py-2'
                            />
                            <div className='flex flex-wrap gap-3 justify-end'>
                                <button
                                    type='button'
                                    onClick={() => setShowRejectForm(false)}
                                    className='bg-white text-[#515DEF] text-sm px-6 py-2.5 rounded-md border border-[#515DEF] hover:bg-[#515DEF0D] cursor-pointer'
                                >
                                    Cancel
                                </button>
                                <button
                                    type='button'
                                    onClick={handleReject}
                                    disabled={!rejectionReason.trim()}
                                    className='bg-[#FF0000] text-white text-sm px-6 py-2.5 rounded-md border border-[#FF0000] hover:opacity-90 cursor-pointer disabled:opacity-50'
                                >
                                    Confirm Reject
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className='flex flex-wrap gap-3 justify-end'>
                            <button
                                type='button'
                                onClick={() => navigate('/director/mark-entry-approval')}
                                className='bg-white text-[#515DEF] text-sm px-6 py-2.5 rounded-md border border-[#515DEF] hover:bg-[#515DEF0D] cursor-pointer'
                            >
                                Back to List
                            </button>
                            <button
                                type='button'
                                onClick={() => setShowRejectForm(true)}
                                className='bg-white text-[#FF0000] text-sm px-6 py-2.5 rounded-md border border-[#FF0000] hover:bg-[#FF00000D] cursor-pointer'
                            >
                                Reject
                            </button>
                            <button
                                type='button'
                                onClick={handleApprove}
                                className='bg-[#4CAF50] text-white text-sm px-6 py-2.5 rounded-md border border-[#4CAF50] hover:opacity-90 cursor-pointer'
                            >
                                Approve & Publish
                            </button>
                        </div>
                    )}
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
        </section>
    )
}

export default MarkEntryReview
