import React from 'react'
import { X } from 'lucide-react'

const SubmitMarksConfirmModal = ({ open, onClose, onConfirm, stats, examLabel }) => {
    if (!open) return null

    return (
        <div className='fixed inset-0 z-500 flex items-center justify-center p-4'>
            <div className='absolute inset-0 bg-black/40' onClick={onClose} />
            <div className='relative z-10 w-full max-w-lg rounded-2xl bg-white shadow-lg overflow-hidden'>
                <div className='flex justify-between items-center px-5 py-4 border-b border-[#EEF0F6]'>
                    <h3 className='text-lg font-semibold text-[#0C1E5B]'>Submit Marks</h3>
                    <button
                        type='button'
                        onClick={onClose}
                        className='p-1 rounded-lg hover:bg-[#EDEEF5] text-[#667085] cursor-pointer'
                    >
                        <X size={18} />
                    </button>
                </div>

                <div className='px-5 py-5 space-y-4'>
                    <p className='text-sm text-[#667085] leading-relaxed'>
                        You have entered marks for <strong className='text-[#1E1E1E]'>{stats.marksEntered}</strong> out of{' '}
                        <strong className='text-[#1E1E1E]'>{stats.totalStudents}</strong> students for{' '}
                        <strong className='text-[#1E1E1E]'>{examLabel}</strong>.
                        Once submitted, the marks will be sent for validation.
                    </p>

                    <div className='grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm'>
                        <div className='rounded-lg bg-[#FAFBFD] border border-[#EEF0F6] p-3 text-center'>
                            <span className='text-[#808080] block'>Total</span>
                            <span className='text-lg font-semibold text-[#1E1E1E]'>{stats.totalStudents}</span>
                        </div>
                        <div className='rounded-lg bg-[#FAFBFD] border border-[#EEF0F6] p-3 text-center'>
                            <span className='text-[#808080] block'>Entered</span>
                            <span className='text-lg font-semibold text-[#4CAF50]'>{stats.marksEntered}</span>
                        </div>
                        <div className='rounded-lg bg-[#FAFBFD] border border-[#EEF0F6] p-3 text-center'>
                            <span className='text-[#808080] block'>Absent</span>
                            <span className='text-lg font-semibold text-[#FF9800]'>{stats.absent}</span>
                        </div>
                        <div className='rounded-lg bg-[#FAFBFD] border border-[#EEF0F6] p-3 text-center'>
                            <span className='text-[#808080] block'>Pending</span>
                            <span className='text-lg font-semibold text-[#1E1E1E]'>{stats.pending}</span>
                        </div>
                    </div>
                </div>

                <div className='px-5 py-4 border-t border-[#EEF0F6] bg-[#FAFBFD] flex flex-col sm:flex-row gap-3'>
                    <button
                        type='button'
                        onClick={onClose}
                        className='flex-1 bg-white text-[#515DEF] text-sm py-2.5 rounded-lg border border-[#515DEF] hover:bg-[#515DEF0D] transition-colors cursor-pointer'
                    >
                        Cancel
                    </button>
                    <button
                        type='button'
                        onClick={onConfirm}
                        className='flex-1 bg-[#515DEF] text-white text-sm py-2.5 rounded-lg hover:opacity-90 transition-opacity cursor-pointer'
                    >
                        Submit Marks
                    </button>
                </div>
            </div>
        </div>
    )
}

export default SubmitMarksConfirmModal
