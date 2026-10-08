import React from 'react'
import { AlertTriangle, X } from 'lucide-react'

const IncompleteMarksModal = ({ open, onClose, stats }) => {
    if (!open) return null

    return (
        <div className='fixed inset-0 z-500 flex items-center justify-center p-4'>
            <div className='absolute inset-0 bg-black/40' onClick={onClose} />
            <div className='relative z-10 w-full max-w-md rounded-2xl bg-white shadow-lg overflow-hidden'>
                <div className='flex justify-between items-start px-5 py-4 border-b border-[#EEF0F6]'>
                    <div className='flex items-start gap-3'>
                        <div className='w-10 h-10 rounded-full bg-[#FF980033] flex items-center justify-center shrink-0'>
                            <AlertTriangle size={20} className='text-[#FF9800]' />
                        </div>
                        <div>
                            <h3 className='text-lg font-semibold text-[#0C1E5B]'>Incomplete Mark Entry</h3>
                            <p className='text-sm text-[#667085] mt-1'>
                                Please enter marks or mark students as absent before submitting.
                            </p>
                        </div>
                    </div>
                    <button
                        type='button'
                        onClick={onClose}
                        className='p-1 rounded-lg hover:bg-[#EDEEF5] text-[#667085] cursor-pointer'
                    >
                        <X size={18} />
                    </button>
                </div>

                <div className='px-5 py-4 space-y-3'>
                    <div className='rounded-xl border border-[#FF980033] bg-[#FF98000D] p-4 text-sm text-[#667085]'>
                        <strong className='text-[#FF9800]'>{stats.pending} student{stats.pending !== 1 ? 's' : ''}</strong>
                        {' '}have no marks entered.
                    </div>
                    <div className='grid grid-cols-2 gap-3 text-sm'>
                        <div className='rounded-lg bg-[#FAFBFD] border border-[#EEF0F6] p-3'>
                            <span className='text-[#808080]'>Total Students</span>
                            <p className='text-lg font-semibold text-[#1E1E1E] mt-1'>{stats.totalStudents}</p>
                        </div>
                        <div className='rounded-lg bg-[#FAFBFD] border border-[#EEF0F6] p-3'>
                            <span className='text-[#808080]'>Marks Entered</span>
                            <p className='text-lg font-semibold text-[#1E1E1E] mt-1'>{stats.marksEntered}</p>
                        </div>
                        <div className='rounded-lg bg-[#FAFBFD] border border-[#EEF0F6] p-3'>
                            <span className='text-[#808080]'>Absent</span>
                            <p className='text-lg font-semibold text-[#1E1E1E] mt-1'>{stats.absent}</p>
                        </div>
                        <div className='rounded-lg bg-[#FAFBFD] border border-[#EEF0F6] p-3'>
                            <span className='text-[#808080]'>Pending</span>
                            <p className='text-lg font-semibold text-[#FF9800] mt-1'>{stats.pending}</p>
                        </div>
                    </div>
                </div>

                <div className='px-5 py-4 border-t border-[#EEF0F6] bg-[#FAFBFD]'>
                    <button
                        type='button'
                        onClick={onClose}
                        className='w-full bg-[#515DEF] text-white text-sm py-2.5 rounded-lg hover:opacity-90 transition-opacity cursor-pointer'
                    >
                        Continue Entering Marks
                    </button>
                </div>
            </div>
        </div>
    )
}

export default IncompleteMarksModal
