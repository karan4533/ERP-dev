import React, { useState } from 'react'
import { Clock, FileText, Mail, UserRound, X } from 'lucide-react'
import { SUBMISSION_STATUS_CONFIG } from '../homeFunSubmissionsData'
import ViewSubmittedAssignmentModal from './ViewSubmittedAssignmentModal'

const SubmissionStudentsModal = ({ modalState, onClose }) => {
    const [assignmentView, setAssignmentView] = useState(null)

    if (!modalState) return null

    const { record, statusType } = modalState
    const config = SUBMISSION_STATUS_CONFIG[statusType]
    const students = record.studentDetails?.[statusType] ?? []
    const showAssignmentAction = statusType === 'submitted' || statusType === 'late'

    const handleClose = () => {
        setAssignmentView(null)
        onClose()
    }

    return (
        <>
            <div className='fixed inset-0 z-500 flex items-center justify-center p-4'>
                <div className='absolute inset-0 bg-black/40' onClick={handleClose} />

                <div className='relative z-10 w-full max-w-2xl max-h-[85vh] flex flex-col rounded-2xl bg-white shadow-lg overflow-hidden'>
                    <div
                        className='flex justify-between items-start gap-4 px-5 py-4 border-b border-[#EEF0F6]'
                        style={{ background: `linear-gradient(to right, ${config.accent}14, white)` }}
                    >
                        <div>
                            <div className='flex items-center gap-2 flex-wrap'>
                                <h2 className='text-xl font-semibold text-[#0C1E5B]'>{config.title}</h2>
                                <span className={`px-2.5 py-0.5 rounded-lg text-xs font-semibold ${config.badgeClass}`}>
                                    {students.length} student{students.length !== 1 ? 's' : ''}
                                </span>
                            </div>
                            <p className='text-sm text-[#667085] mt-1'>
                                <span className='font-medium text-[#1E1E1E]'>{record.assignmentTitle}</span>
                                {' · '}
                                {record.assignmentId} · Class {record.classSection}
                            </p>
                        </div>
                        <button
                            type='button'
                            onClick={handleClose}
                            className='p-1 rounded-lg hover:bg-[#EDEEF5] text-[#667085] hover:text-[#F44336] cursor-pointer shrink-0'
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <div className='overflow-y-auto flex-1 p-5'>
                        {students.length === 0 ? (
                            <div className='text-center py-12 text-[#667085]'>
                                <UserRound className='w-12 h-12 mx-auto mb-3 opacity-40' />
                                <p className='text-sm'>{config.emptyText}</p>
                            </div>
                        ) : (
                            <div className='space-y-3'>
                                {students.map((student) => (
                                    <div
                                        key={student.id}
                                        className='flex items-center gap-4 p-3 rounded-xl border border-[#EEF0F6] hover:border-[#515DEF33] hover:bg-[#FAFBFD] transition-colors'
                                    >
                                        <img
                                            src={student.profile}
                                            alt={student.name}
                                            className='w-11 h-11 rounded-full object-cover ring-2 ring-white shadow-sm shrink-0'
                                        />
                                        <div className='flex-1 min-w-0'>
                                            <p className='font-medium text-[#1E1E1E] truncate'>{student.name}</p>
                                            <div className='flex flex-wrap items-center gap-x-3 gap-y-1 mt-0.5 text-xs text-[#667085]'>
                                                <span>Roll: {student.rollNumber}</span>
                                                <span className='hidden sm:inline'>·</span>
                                                <span className='truncate'>{student.admissionNumber}</span>
                                            </div>
                                            {student.email && statusType === 'pending' && (
                                                <p className='flex items-center gap-1 text-xs text-[#808080] mt-1 truncate'>
                                                    <Mail size={12} className='shrink-0' />
                                                    {student.email}
                                                </p>
                                            )}
                                            {student.submittedAt && statusType !== 'pending' && (
                                                <p className='flex items-center gap-1 text-xs text-[#808080] mt-1 flex-wrap'>
                                                    <Clock size={12} className='shrink-0' />
                                                    Submitted: {student.submittedAt}
                                                    {statusType === 'submitted' && student.isLate && (
                                                        <span className='ml-1 px-1.5 py-0.5 rounded bg-[#F4433633] text-[#F44336] font-medium'>
                                                            Late
                                                        </span>
                                                    )}
                                                </p>
                                            )}
                                        </div>
                                        {showAssignmentAction && student.submission && (
                                            <button
                                                type='button'
                                                title='View assignment'
                                                onClick={() => setAssignmentView({ record, student, statusType })}
                                                className='inline-flex items-center justify-center size-10 rounded-xl border border-[#515DEF33] bg-[#515DEF0D] text-[#515DEF] hover:bg-[#515DEF] hover:text-white hover:border-[#515DEF] transition-all duration-200 cursor-pointer shrink-0'
                                            >
                                                <FileText size={18} />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className='px-5 py-4 border-t border-[#EEF0F6] bg-[#FAFBFD]'>
                        <button
                            type='button'
                            onClick={handleClose}
                            className='w-full bg-[#515DEF] text-white text-sm py-2.5 rounded-lg hover:opacity-90 transition-opacity cursor-pointer'
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>

            <ViewSubmittedAssignmentModal
                assignmentView={assignmentView}
                onClose={() => setAssignmentView(null)}
            />
        </>
    )
}

export default SubmissionStudentsModal
