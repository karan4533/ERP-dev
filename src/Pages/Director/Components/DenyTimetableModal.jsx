import React, { useEffect, useState } from 'react'
import { X } from 'lucide-react'

const DenyTimetableModal = ({
    open,
    onClose,
    onConfirm,
    title = 'Deny Timetable',
    itemLabel = '',
}) => {
    const [reason, setReason] = useState('')

    useEffect(() => {
        if (!open) {
            setReason('')
        }
    }, [open])

    if (!open) return null

    const handleConfirm = () => {
        const trimmed = reason.trim()
        if (!trimmed) return
        onConfirm(trimmed)
        setReason('')
    }

    return (
        <div className='fixed inset-0 z-50 flex items-center justify-center p-4'>
            <div className='absolute inset-0 bg-black/40' onClick={onClose} aria-hidden='true' />

            <div className='relative z-10 w-full max-w-lg rounded-xl bg-white shadow-lg p-5'>
                <div className='flex justify-between items-start mb-4'>
                    <div>
                        <h3 className='text-xl font-semibold text-[#1E1E1E]'>{title}</h3>
                        {itemLabel && (
                            <p className='text-sm text-[#667085] mt-1'>{itemLabel}</p>
                        )}
                    </div>
                    <button
                        type='button'
                        onClick={onClose}
                        className='hover:text-red-500 cursor-pointer'
                        aria-label='Close'
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className='flex flex-col gap-y-2'>
                    <label htmlFor='rejection-reason' className='text-base font-medium text-[#1E1E1E]'>
                        Rejection Reason <span className='text-[#980E0F]'>*</span>
                    </label>
                    <textarea
                        id='rejection-reason'
                        rows={4}
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder='Enter the reason for denying this timetable...'
                        className='text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-3 py-2 w-full resize-none focus:outline-none focus:border-[#515DEF]'
                    />
                </div>

                <div className='flex gap-x-4 mt-6'>
                    <button
                        type='button'
                        onClick={onClose}
                        className='bg-white text-[#77767A] text-sm text-center px-4 py-2.5 rounded-md border border-[#77767A] hover:bg-[#515DEF] hover:text-white hover:border-[#515DEF] transition-all duration-200 cursor-pointer w-full'
                    >
                        Cancel
                    </button>
                    <button
                        type='button'
                        onClick={handleConfirm}
                        disabled={!reason.trim()}
                        className='bg-[#980E0F] text-white text-sm text-center px-4 py-2.5 rounded-md border border-[#980E0F] hover:opacity-90 transition-all duration-200 cursor-pointer w-full disabled:opacity-50 disabled:cursor-not-allowed'
                    >
                        Confirm Deny
                    </button>
                </div>
            </div>
        </div>
    )
}

export default DenyTimetableModal
