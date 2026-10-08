import React from 'react'
import { Clock, Download, Eye, FileText, X } from 'lucide-react'
import pdf_icon from '../../../../../assets/images/pdf-icon.png'

const ViewSubmittedAssignmentModal = ({ assignmentView, onClose }) => {
    if (!assignmentView) return null

    const { record, student } = assignmentView
    const { submission } = student
    const isLate = statusTypeIsLate(student, assignmentView.statusType)

    return (
        <div className='fixed inset-0 z-600 flex items-center justify-center p-4'>
            <div className='absolute inset-0 bg-black/50' onClick={onClose} />

            <div className='relative z-10 w-full max-w-xl max-h-[90vh] flex flex-col rounded-2xl bg-white shadow-xl overflow-hidden'>
                <div className='flex justify-between items-start gap-4 px-5 py-4 border-b border-[#EEF0F6] bg-linear-to-r from-[#515DEF14] to-white'>
                    <div className='flex items-start gap-3 min-w-0'>
                        <div className='p-2.5 rounded-xl bg-[#515DEF]/10 shrink-0'>
                            <FileText className='w-5 h-5 text-[#515DEF]' />
                        </div>
                        <div className='min-w-0'>
                            <h2 className='text-lg font-semibold text-[#0C1E5B]'>Submitted Assignment</h2>
                            <p className='text-sm text-[#667085] mt-0.5 truncate'>{record.assignmentTitle}</p>
                        </div>
                    </div>
                    <button
                        type='button'
                        onClick={onClose}
                        className='p-1 rounded-lg hover:bg-[#EDEEF5] text-[#667085] hover:text-[#F44336] cursor-pointer shrink-0'
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className='overflow-y-auto flex-1 p-5 space-y-5'>
                    <div className='flex items-center gap-3 p-3 rounded-xl bg-[#FAFBFD] border border-[#EEF0F6]'>
                        <img
                            src={student.profile}
                            alt={student.name}
                            className='w-12 h-12 rounded-full object-cover ring-2 ring-white shrink-0'
                        />
                        <div className='min-w-0 flex-1'>
                            <p className='font-medium text-[#1E1E1E]'>{student.name}</p>
                            <p className='text-xs text-[#667085] mt-0.5'>
                                Roll: {student.rollNumber} · {student.admissionNumber}
                            </p>
                        </div>
                        <span
                            className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 ${
                                isLate ? 'bg-[#F4433633] text-[#F44336]' : 'bg-[#4CAF5033] text-[#4CAF50]'
                            }`}
                        >
                            {isLate ? 'Late Submission' : 'On Time'}
                        </span>
                    </div>

                    <div className='grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm'>
                        <div className='flex flex-col gap-y-1'>
                            <span className='text-[#808080]'>Assignment ID</span>
                            <span className='text-[#1E1E1E] font-medium'>{record.assignmentId}</span>
                        </div>
                        <div className='flex flex-col gap-y-1'>
                            <span className='text-[#808080]'>Class & Section</span>
                            <span className='text-[#1E1E1E] font-medium'>{record.classSection}</span>
                        </div>
                        <div className='flex flex-col gap-y-1 sm:col-span-2'>
                            <span className='text-[#808080]'>Submitted On</span>
                            <span className='text-[#1E1E1E] font-medium flex items-center gap-1.5'>
                                <Clock size={14} className='text-[#808080]' />
                                {student.submittedAt}
                            </span>
                        </div>
                    </div>

                    <div>
                        <p className='text-sm font-medium text-[#1E1E1E] mb-3'>Uploaded Answer</p>
                        <div className='flex flex-col sm:flex-row sm:items-center gap-4 p-4 border border-[#EEF0F6] rounded-xl bg-white'>
                            <div className='flex items-center gap-3 min-w-0 flex-1'>
                                <img src={pdf_icon} alt='PDF' className='w-10 h-10 shrink-0' />
                                <div className='min-w-0'>
                                    <p className='text-sm font-medium text-[#1E1E1E] truncate' title={submission.fileName}>
                                        {submission.fileName}
                                    </p>
                                    <p className='text-xs text-[#808080] mt-0.5'>{submission.fileSize}</p>
                                </div>
                            </div>
                            <div className='flex items-center gap-2 shrink-0'>
                                <button
                                    type='button'
                                    title='View file'
                                    className='inline-flex items-center justify-center size-9 rounded-lg border border-[#515DEF33] bg-[#515DEF0D] text-[#515DEF] hover:bg-[#515DEF] hover:text-white transition-colors cursor-pointer'
                                >
                                    <Eye size={16} />
                                </button>
                                <button
                                    type='button'
                                    title='Download file'
                                    className='inline-flex items-center justify-center size-9 rounded-lg border border-[#515DEF33] bg-[#515DEF0D] text-[#515DEF] hover:bg-[#515DEF] hover:text-white transition-colors cursor-pointer'
                                >
                                    <Download size={16} />
                                </button>
                            </div>
                        </div>
                    </div>

                    {submission.additionalNote && (
                        <div>
                            <p className='text-sm font-medium text-[#1E1E1E] mb-2'>Student Note</p>
                            <p className='text-sm text-[#667085] leading-relaxed p-3 rounded-xl bg-[#FAFBFD] border border-[#EEF0F6]'>
                                {submission.additionalNote}
                            </p>
                        </div>
                    )}
                </div>

                <div className='px-5 py-4 border-t border-[#EEF0F6] bg-[#FAFBFD]'>
                    <button
                        type='button'
                        onClick={onClose}
                        className='w-full bg-[#515DEF] text-white text-sm py-2.5 rounded-lg hover:opacity-90 transition-opacity cursor-pointer'
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    )
}

const statusTypeIsLate = (student, statusType) =>
    statusType === 'late' || Boolean(student.isLate)

export default ViewSubmittedAssignmentModal
