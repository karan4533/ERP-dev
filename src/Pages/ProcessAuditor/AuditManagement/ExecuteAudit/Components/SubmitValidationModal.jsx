import React from 'react'
import { AlertTriangle, X } from 'lucide-react'

const SubmitValidationModal = ({ open, unansweredCount, onContinue, onReview, onClose }) => {
    if (!open) return null

    return (
        <div className='fixed inset-0 z-[70] flex items-center justify-center p-4'>
            <div className='absolute inset-0 bg-black/50' onClick={onClose} aria-hidden='true' />
            <div className='relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6 z-10'>
                <button type='button' onClick={onClose} className='absolute top-4 right-4 text-[#808080] hover:text-[#FF0000] cursor-pointer'>
                    <X size={20} />
                </button>
                <div className='flex items-center gap-3 mb-4'>
                    <div className='size-12 rounded-full bg-[#FF980015] flex items-center justify-center'>
                        <AlertTriangle size={24} className='text-[#FF9800]' />
                    </div>
                    <div>
                        <h3 className='text-lg font-semibold text-black'>Incomplete Audit</h3>
                        <p className='text-sm text-[#667085]'>Some questions are still unanswered.</p>
                    </div>
                </div>
                <p className='text-base text-[#1E1E1E] mb-6'>
                    <span className='font-bold text-[#FF0000]'>{unansweredCount}</span>
                    {' '}question{unansweredCount !== 1 ? 's' : ''} unanswered. Continue submission anyway?
                </p>
                <div className='flex gap-3'>
                    <button
                        type='button'
                        onClick={onReview}
                        className='flex-1 bg-white text-[#515DEF] text-sm py-2.5 rounded-lg border border-[#515DEF] hover:bg-[#515DEF] hover:text-white cursor-pointer transition-colors'
                    >
                        Review
                    </button>
                    <button
                        type='button'
                        onClick={onContinue}
                        className='flex-1 bg-[#515DEF] text-white text-sm py-2.5 rounded-lg hover:opacity-90 cursor-pointer'
                    >
                        Yes, Continue
                    </button>
                </div>
            </div>
        </div>
    )
}

export default SubmitValidationModal
